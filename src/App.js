import React, { Component } from 'react';
import Draggable from 'react-draggable';

// Spring formula
const stiffness = 2;
const damperFactor = 0.1;
const nodeMass = 10;
const velocityMax = 5;
const springFrictionFactor = 0.9;

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

    if( !length ) {
        return { x: 0, y: 0 };
    }

    return {
        x: vector.x / length,
        y: vector.y / length
    };

}

function toSpring( x1, y1 ) {

    return {
        velocity: { x: 0, y: 0 },
        acceleration: { x: 0, y: 0 },
        position: { x: x1, y: y1 },
        origin: { x: x1, y: y1 }
    };

}

export default class App extends Component {

    constructor( props ) {

        super( props );

        this.isPaused = true;
        const myCat = cats[ 0 ]();

        this.state = {
            cat: myCat,
            eye1Spring: toSpring( myCat.eye1.left, myCat.eye1.top ),
            eye2Spring: toSpring( myCat.eye2.left, myCat.eye2.top ),
            tongueSpring: toSpring( myCat.tongue.left, myCat.tongue.top )
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

        this.isPaused = true;
        this.dragging = true;


        this.state.eye1Spring.acceleration = { x: 0, y: 0 };
        this.state.eye1Spring.velocity = { x: 0, y: 0 };
        this.state.eye2Spring.acceleration = { x: 0, y: 0 };
        this.state.eye2Spring.velocity = { x: 0, y: 0 };
        this.state.tongueSpring.acceleration = { x: 0, y: 0 };
        this.state.tongueSpring.velocity = { x: 0, y: 0 };
        this.setState( this.state );

    }

    handleDrag( event, ui ) {

        const { eye1Spring, eye2Spring, tongueSpring, cat } = this.state;

        // How far has this tongue traveled, in + or - %, relative to origin?
        const tongueYTravelPercent = ( ui.position.top - cat.tongue.top ) / (
            cat.tongue.relativeMovementBounds.top +
            cat.tongue.relativeMovementBounds.bottom
        );

        eye1Spring.position.x = cat.eye1.left + (
            tongueYTravelPercent * cat.eye1.travelDistance
        );

        eye2Spring.position.x = cat.eye2.left - (
            tongueYTravelPercent * cat.eye2.travelDistance
        );

        tongueSpring.position.x = ui.position.left;
        tongueSpring.position.y = ui.position.top;

        this.setState({ cat });

    }

    handleDragEnd() {

        this.isPaused = false;

    }

    onAnimate() {

        this.animationId = window.requestAnimationFrame( this.onAnimate );

        if( this.isPaused ) {

            return;

        }

        const springs = {
            eye1Spring: this.state.eye1Spring,
            eye2Spring: this.state.eye2Spring,
            tongueSpring: this.state.tongueSpring
        };
 
        let totalEnergy = 0;
        let totalDistance = 0;

        Object.keys( springs ).forEach( ( key ) => {

            const spring = springs[ key ];

            // Length always returns a positive number
            const distanceFromRest = vectorLength2d({
                x: spring.position.x - spring.origin.x,
                y: spring.position.y - spring.origin.y
            }) || 0.0000001;

            const normalVector = normalizeVector2d({
                x: spring.position.x - spring.origin.x,
                y: spring.position.y - spring.origin.y
            });

            totalDistance += distanceFromRest;

            // F = -k(|x|-d)(x/|x|) - bv
            const force = {
                x: -stiffness * distanceFromRest * ( normalVector.x / distanceFromRest ) - damperFactor * spring.velocity.x,
                y: -stiffness * distanceFromRest * ( normalVector.y / distanceFromRest ) - damperFactor * spring.velocity.y
            };

            // force1X = stiffness * ( distance - spring.length ) * ( norm1.x / distance ) + fieldX - damperFactor * v1.x,

            // our node2 is spring. node1 is origin.
            // force to apply to node2:
            // Vector2 F2 = -k * (xAbs - d) * (Vector2.Normalize(node1.p - node2.p) / xAbs) - b * (node2.v - node1.v);
            
            // b = coefficient of dampening
            // d = desired distance of separation
            
            spring.acceleration = {
                x: spring.acceleration.x + force.x / nodeMass,
                y: spring.acceleration.y + force.y / nodeMass
            };

        });

        Object.keys( springs ).forEach( ( key ) => {

            const spring = springs[ key ];

            spring.velocity.x += spring.acceleration.x;
            spring.velocity.y += spring.acceleration.y;

            spring.velocity.x = Math.max( Math.min( spring.velocity.x, velocityMax ), -velocityMax ) * springFrictionFactor;
            spring.velocity.y = Math.max( Math.min( spring.velocity.y, velocityMax ), -velocityMax ) * springFrictionFactor;

            spring.acceleration.x *= 0.5 * springFrictionFactor;
            spring.acceleration.y *= 0.5 * springFrictionFactor;

            spring.position.x += spring.velocity.x;
            spring.position.y += spring.velocity.y;

            totalEnergy += Math.abs( spring.velocity.x ) + Math.abs( spring.velocity.y );

        });

        this.xx = this.xx || 1;
        this.xx++;
        if( !( this.xx % 13 )  ) {
            this.setState({ totalEnergy, totalDistance });
        }

        const isComplete = totalEnergy < 0.5 && totalDistance < 0.8;
        const state = { springs };

        if( isComplete ) {
            this.isPaused = true;
        }

        this.refs.draggable.state.clientX = springs.tongueSpring.position.x;
        this.refs.draggable.state.clientY = springs.tongueSpring.position.y;


        this.setState( state );

    }

    render() {

        const styles = require('./scss/style.scss');

        const { cat, eye1Spring, eye2Spring, tongueSpring } = this.state;
        const { background, tongue, eye1, eye2, snoot } = cat;

        return <div className={ styles.wrap }>
            { this.state.totalEnergy }...
            { this.state.totalDistance }
            <div className={ styles.container }>

                <img
                    draggable={ false }
                    className={ styles.image }
                    src={ background.img }
                />

                <Draggable
                    ref="draggable"
                    start={{
                        x: tongueSpring.position.x,
                        y: tongueSpring.position.y
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
                        top: `${ eye1Spring.position.y }px`,
                        left: `${ eye1Spring.position.x }px`,
                        boxShadow: `0 0 2px ${ eye1.color }`
                    }}
                />

                <div
                    className={ styles.eye }
                    style={{
                        top: `${ eye2Spring.position.y }px`,
                        left: `${ eye2Spring.position.x }px`,
                        boxShadow: `0 0 2px ${ eye2.color }`
                    }}
                />

            </div>
        </div>;

    }

}
