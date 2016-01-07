import React, { Component } from 'react';
import Draggable from 'react-draggable';

// Spring formula
const stiffness = 30;
const damperFactor = 0.85;
const nodeMass = 2;
const velocityMax = 10;
const springFrictionFactor = 0.97;

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
        travelDistance: 9,
        color: '#637790'
    },
    eye2: {
        top: 169,
        left: 327,
        travelDistance: 9,
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
            snootsBooped: localStorage.getItem('boopsSnooted') || 0,
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

        this.setState({
            snootsBooped: this.state.snootsBooped + 1
        });
 //localStorage.getItem('boopsSnooted') || 0,
        this.isPaused = false;

    }

    onAnimate() {

        this.animationId = window.requestAnimationFrame( this.onAnimate );
        this.elapsedTime = Date.now() - ( this.lastTimeStamp || 0 );
        this.lastTimestamp = Date.now();

        const animationScale = this.elapsedTime * 0.00000000000001;

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
            }) || 0.00000001;

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

            spring.acceleration.x += animationScale * ( force.x / nodeMass );
            spring.acceleration.y += animationScale * ( force.y / nodeMass );

        });

        Object.keys( springs ).forEach( ( key ) => {

            const spring = springs[ key ];

            spring.velocity.x += spring.acceleration.x;
            spring.velocity.y += spring.acceleration.y;

            spring.velocity.x = Math.max( Math.min( spring.velocity.x, velocityMax ), -velocityMax ) * springFrictionFactor;
            spring.velocity.y = Math.max( Math.min( spring.velocity.y, velocityMax ), -velocityMax ) * springFrictionFactor;

            spring.acceleration.x *= 0.5 * animationScale;
            spring.acceleration.y *= 0.5 * animationScale;

            spring.position.x += spring.velocity.x;
            spring.position.y += spring.velocity.y;

            totalEnergy += Math.abs( spring.velocity.x ) + Math.abs( spring.velocity.y );

        });

        const isComplete = totalEnergy < 0.5 && totalDistance < 0.8;
        const state = { springs };

        if( isComplete ) {
            this.isPaused = true;
        }

        this.refs.draggable.state.clientX = springs.tongueSpring.position.x;
        this.refs.draggable.state.clientY = springs.tongueSpring.position.y;

        this.setState( springs );

    }

    render() {

        const styles = require('./scss/style.scss');

        const { cat, eye1Spring, eye2Spring, tongueSpring } = this.state;
        const { background, tongue, eye1, eye2, snoot } = cat;

        return <div className={ styles.appWrap }>
            <div className={ styles.application }>

                <h1 className={ styles.title }>
                    Booper Snooter
                </h1>

                <div className={ styles.wrap }>

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

                </div>

                <div className={ styles.snootsBooped }>
                    <span className={ styles.snoots }>Snoots Booped:</span>
                    <span className={ styles.booped }> { this.state.snootsBooped }</span>
                </div>

            </div>

            <div className={ styles.footer }>
                <div className={ styles.footed }>
                    By Andrew Ray
                </div>
            </div>

        </div>;

    }

}
