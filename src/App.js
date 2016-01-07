import React, { Component } from 'react';
import Draggable from 'react-draggable';

// Spring formula
const stiffness = 10;
const damperFactor = 0.05;
const nodeMass = 1;
const velocityMax = 1;

// Potential cats
const cats = [() => ({
    background: {
        img: require( '../kitty-cat-1.jpg' )
    },
    tongue: {
        img: require( '../kitty-cat-1-tongue.png' ),
        top: 203,
        left: 282,
        relativeMovementBounds: {
            left: 2,
            top: 5,
            right: 2,
            bottom: 15
        }
    },
    snoot: {
        img: require('../kitty-cat-1-snoot.png'),
        top: 187,
        left: 273
    },
    eye1: {
        top: 169,
        left: 267,
        travelDistance: 5,
        color: '#637790'
    },
    eye2: {
        top: 169,
        left: 327,
        travelDistance: 5,
        color: '#637790'
    }
} ) ];

function vectorLength2d( vector ) {

    return Math.sqrt( vector.x * vector.x + vector.y * vector.y );

}

function normalizeVector2d( vector ) {

    const length = vectorLength2d( vector );

    return {
        x: vector.x / length,
        y: vector.y / length
    };

}

function toSpring( x1, y1, x2, y2 ) {

    return {
        velocity: { x: 0, y: 0 },
        acceleration: { x: 0, y: 0 },
        position: { x: x1, y: y1 },
        origin: { x: x2, y: y2 }
    };

}

export default class App extends Component {

    constructor( props ) {

        super( props );
        this.state = {
            originalCoords: cats[ 0 ](),
            cat: cats[ 0 ]()
        };

        this.onAnimate = this.onAnimate.bind( this );
        this.handleDragEnd = this.handleDragEnd.bind( this );
        this.handleDrag = this.handleDrag.bind( this );
        this.handleDragStart = this.handleDragStart.bind( this );

    }

    componentDidMount() {

        this.animationId = window.requestAnimationFrame( this.onAnimate );

    }

    componentWillUnmount() {

        window.cancelAnimationFrame( this.animationId );

    }

    handleDragStart() {

        this.setState({ springs: null });

    }

    handleDrag( event, ui ) {

        const { originalCoords, cat } = this.state;

        // How far has this tongue traveled, in + or - %, relative to origin?
        const tongueYTravelPercent = ( ui.position.top - originalCoords.tongue.top ) / (
            originalCoords.tongue.relativeMovementBounds.top +
            originalCoords.tongue.relativeMovementBounds.bottom
        );

        cat.eye1.left = originalCoords.eye1.left + (
            tongueYTravelPercent * originalCoords.eye1.travelDistance
        );

        cat.eye2.left = originalCoords.eye2.left - (
            tongueYTravelPercent * originalCoords.eye1.travelDistance
        );

        this.setState({ cat, tongueDragPosition: ui.position });

    }

    handleDragEnd() {

        const { originalCoords, cat, tongueDragPosition } = this.state;

        this.setState({
            dragging: false,
            springs: {
                eye1: toSpring(
                    cat.eye1.left, cat.eye1.top, originalCoords.eye1.left, originalCoords.eye1.top
                ),
                eye2: toSpring(
                    cat.eye2.left, cat.eye2.top, originalCoords.eye2.left, originalCoords.eye2.top
                ),
                tongue: toSpring(
                    tongueDragPosition.left, tongueDragPosition.top, originalCoords.tongue.left, originalCoords.tongue.top
                )
            }
        });

    }

    onAnimate() {

        this.animationId = window.requestAnimationFrame( this.onAnimate );

        if( this.state.dragging || !this.state.springs ) {

            return;

        }

        const { springs } = this.state;

        Object.keys( springs ).forEach( ( key ) => {

            const spring = springs[ key ];
            const vectorDiff = {
                x: spring.position.x - spring.origin.x,
                y: spring.position.y - spring.origin.y
            };

            const distanceFromRest = vectorLength2d( vectorDiff );
            const normalVector = normalizeVector2d( vectorDiff );

            //    F = -k(|x|-d)(x/|x|) - bv
            const force = {
                x: -stiffness * distanceFromRest * ( normalVector.x / distanceFromRest ) - damperFactor * spring.velocity.x,
                y: -stiffness * distanceFromRest * ( normalVector.y / distanceFromRest ) - damperFactor * spring.velocity.y
            };

            spring.acceleration = {
                x: spring.acceleration.x + force.x / nodeMass,
                y: spring.acceleration.y + force.y / nodeMass
            };

        });

        let totalEnergy = 0;

        Object.keys( springs ).forEach( ( key ) => {

            const spring = springs[ key ];

            spring.velocity.x += spring.acceleration.x;
            spring.velocity.y += spring.acceleration.y;

            spring.velocity.x = Math.max( Math.min( spring.velocity.x, velocityMax ), -velocityMax ) * 0.92;
            spring.velocity.y = Math.max( Math.min( spring.velocity.y, velocityMax ), -velocityMax ) * 0.92;

            spring.acceleration.x *= 0.5;
            spring.acceleration.y *= 0.5;

            spring.position.x += spring.velocity.x;
            spring.position.y += spring.velocity.y;

            totalEnergy += Math.abs( spring.velocity.x ) + Math.abs( spring.velocity.y );

        });

        this.refs.draggable.state.clientX = springs.tongue.position.x;
        this.refs.draggable.state.clientY = springs.tongue.position.y;

        this.setState({ springs: totalEnergy < 0.01 ? null : springs });

    }

    render() {

        const styles = require('./scss/style.scss');

        const { springs, cat } = this.state;
        const { background, tongue, snoot, eye1, eye2  } = cat;

        const eye1Pos = {
            x: springs ? springs.eye1.position.x : eye1.left,
            y: springs ? springs.eye1.position.y : eye1.top
        };
        const eye2Pos = {
            x: springs ? springs.eye2.position.x : eye2.left,
            y: springs ? springs.eye2.position.y : eye2.top
        };
        const tonguePos = {
            x: springs ? springs.tongue.position.x : tongue.left,
            y: springs ? springs.tongue.position.y : tongue.top
        };

        return <div className={ styles.wrap }>
            <div className={ styles.container }>

                <img
                    draggable={ false }
                    className={ styles.image }
                    src={ background.img }
                />

                <Draggable
                    ref="draggable"
                    start={{
                        x: tonguePos.x,
                        y: tonguePos.y
                    }}
                    bounds={{
                        left: tongue.left - tongue.relativeMovementBounds.left,
                        top: tongue.top - tongue.relativeMovementBounds.top,
                        right: tongue.left + tongue.relativeMovementBounds.right,
                        bottom: tongue.top + tongue.relativeMovementBounds.bottom
                    }}
                    onDrag={ this.handleDrag }
                    onStop={ this.handleDragEnd }
                    onStart={ this.handleDragStart }
                >
                    <img
                        draggable={ false }
                        src={ tongue.img }
                        style={{
                            position: 'absolute',
                            cursor: 'pointer'
                        }}
                    />
                </Draggable>

                <img
                    draggable={ false }
                    className={ styles.image }
                    src={ snoot.img }
                    style={{
                        top: `${ snoot.top }px`,
                        left: `${ snoot.left }px`
                    }}
                />

                <div
                    className={ styles.eye }
                    style={{
                        top: `${ eye1Pos.y }px`,
                        left: `${ eye1Pos.x }px`,
                        boxShadow: `0 0 2px ${ eye1.color }`
                    }}
                />

                <div
                    className={ styles.eye }
                    style={{
                        top: `${ eye2Pos.y }px`,
                        left: `${ eye2Pos.x }px`,
                        boxShadow: `0 0 2px ${ eye2.color }`
                    }}
                />

            </div>
        </div>;

    }

}
