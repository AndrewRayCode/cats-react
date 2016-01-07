/*
 * Based on http://imgur.com/gallery/aHnOPFa
 */
import React, { Component } from 'react';
import Draggable from 'react-draggable';

// Spring formula
const stiffness = 40; // smaller values mean the spring is looser and will stretch further.
const damperFactor = 0.04; // Larger values increase the amount of damping so the object will come to rest more quickly.
const nodeMass = 0.1;
const velocityMax = 20;
const springFrictionFactor = 0.91;

// Potential cats
const cats = [() => ({
    height: 375,
    width: 500,
    name: 'Captain Fluff\'n\'Stuff',
    source: 'http://lovemeow.com/2009/12/cute-cats-and-kittens-tongue-sticking-out-pictures/',
    background: {
        img: require( '../kitty-cat-1.jpg' )
    },
    tongue: {
        img: require( '../kitty-cat-1-tongue.png' ),
        top: 195,
        left: 282,
        relativeMovementBounds: {
            left: 5,
            top: 5,
            right: 2,
            bottom: 25
        }
    },
    snoot: {
        img: require('../kitty-cat-1-snoot.png'),
        top: 168,
        left: 256
    },
    eye1: {
        top: 169,
        left: 267,
        height: 10,
        width: 5,
        travelDistance: 9,
        background: '#111521',
        borderColor: '#637790'
    },
    eye2: {
        top: 169,
        left: 327,
        height: 10,
        width: 5,
        travelDistance: 9,
        background: '#111521',
        borderColor: '#637790'
    }
} ), () => ({
    height: 495,
    width: 660,
    name: 'Dorf',
    source: 'http://www.cutestpaw.com/images/derpy-cat-2/',
    background: {
        img: require( '../kitty-cat-2.jpg' )
    },
    tongue: {
        img: require( '../kitty-cat-2-tonue.png' ),
        top: 265,
        left: 267,
        relativeMovementBounds: {
            left: 2,
            top: 10,
            right: 2,
            bottom: 65
        }
    },
    snoot: {
        img: require('../kitty-cat-2-snoot.png'),
        top: 225,
        left: 114
    },
    eye1: {
        top: 220,
        left: 197,
        height: 31,
        width: 20,
        travelDistance: 25,
        background: '#0b1413',
        borderColor: '#141f19'
    },
    eye2: {
        top: 229,
        left: 397,
        height: 31,
        width: 20,
        travelDistance: 25,
        background: '#0b1413',
        borderColor: '#141f19'
    }
} ) ];

const staticCats = cats.map( ( cat ) => cat() );

function boundPositionTo( position, originalPosition, bounds ) {

    return {
        top: Math.min( Math.max( originalPosition.top - bounds.top, position.top ), originalPosition.top + bounds.bottom ),
        left: Math.min( Math.max( originalPosition.left - bounds.left, position.left ), originalPosition.left + bounds.right )
    };

}

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

function getStateFromIndex( catIndex ) {

    const myCat = cats[ catIndex ]();

    return {
        isPaused: true,
        catIndex,
        cat: myCat,
        eye1Spring: toSpring( myCat.eye1.left, myCat.eye1.top ),
        eye2Spring: toSpring( myCat.eye2.left, myCat.eye2.top ),
        tongueSpring: toSpring( myCat.tongue.left, myCat.tongue.top )
    };

}

export default class App extends Component {

    constructor( props ) {

        super( props );

        const state = getStateFromIndex( 1 );
        state.snootsBooped = parseFloat( localStorage.getItem('boopsSnooted') ) || 0;

        this.state = state;

        this.onAnimate = this.onAnimate.bind( this );
        this.handleDragEnd = this.handleDragEnd.bind( this );
        this.handleDrag = this.handleDrag.bind( this );
        this.handleDragStart = this.handleDragStart.bind( this );
        this.showBitcoinAddress = this.showBitcoinAddress.bind( this );
        this.selectCat = this.selectCat.bind( this );

    }

    componentDidMount() {

        this.animationId = window.requestAnimationFrame( this.onAnimate );

    }

    componentWillUnmount() {

        window.cancelAnimationFrame( this.animationId );

    }

    showBitcoinAddress() {

        this.setState({ showBitcoinAddress: !this.state.showBitcoinAddress });

    }

    selectCat( catIndex ) {

        return ( event ) => {
            this.setState( getStateFromIndex( catIndex ) );
        };

    }

    handleDragStart() {

        this.state.isPaused = true;
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

        const boundPosition = boundPositionTo(
            ui.position, cat.tongue, cat.tongue.relativeMovementBounds
        );

        // How far has this tongue traveled, in + or - %, relative to origin?
        const tongueYTravelPercent = ( boundPosition.top - cat.tongue.top ) / (
            cat.tongue.relativeMovementBounds.top +
            cat.tongue.relativeMovementBounds.bottom
        );

        eye1Spring.position.x = cat.eye1.left - (
            tongueYTravelPercent * cat.eye1.travelDistance
        );

        eye2Spring.position.x = cat.eye2.left + (
            tongueYTravelPercent * cat.eye2.travelDistance
        );

        tongueSpring.position.x = boundPosition.left;
        tongueSpring.position.y = boundPosition.top;

        this.setState({ cat });

    }

    handleDragEnd() {

        const snootsBooped = this.state.snootsBooped + 1;
        localStorage.setItem( 'boopsSnooted', snootsBooped );
        this.setState({ snootsBooped, isPaused: false });

    }

    onAnimate() {

        this.animationId = window.requestAnimationFrame( this.onAnimate );
        this.elapsedTime = Date.now() - ( this.lastTimeStamp || 0 );
        this.lastTimestamp = Date.now();

        const timeScale = this.elapsedTime * 0.000000000000001;

        if( this.state.isPaused ) {

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

            // F = - kx - bv
            const force = {
                x: -stiffness * distanceFromRest * normalVector.x - damperFactor * spring.velocity.x,
                y: -stiffness * distanceFromRest * normalVector.y - damperFactor * spring.velocity.y
            };

            spring.acceleration.x = timeScale * ( force.x / nodeMass );
            spring.acceleration.y = timeScale * ( force.y / nodeMass );

        });

        Object.keys( springs ).forEach( ( key ) => {

            const spring = springs[ key ];

            spring.velocity.x += spring.acceleration.x;
            spring.velocity.y += spring.acceleration.y;

            spring.velocity.x = Math.max( Math.min( spring.velocity.x, velocityMax ), -velocityMax ) * springFrictionFactor;
            spring.velocity.y = Math.max( Math.min( spring.velocity.y, velocityMax ), -velocityMax ) * springFrictionFactor;

            spring.position.x += spring.velocity.x;
            spring.position.y += spring.velocity.y;

            totalEnergy += Math.abs( spring.velocity.x ) + Math.abs( spring.velocity.y );

        });

        const isComplete = totalEnergy < 0.4 && totalDistance < 0.7;
        const state = springs;

        if( isComplete ) {
            state.isPaused = true;
        }

        this.refs.draggable.state.clientX = springs.tongueSpring.position.x;
        this.refs.draggable.state.clientY = springs.tongueSpring.position.y;

        this.setState( state );

    }

    render() {

        const styles = require('./scss/style.scss');

        const { cat, eye1Spring, eye2Spring, tongueSpring, catIndex } = this.state;
        const { background, tongue, eye1, eye2, snoot } = cat;

        return <div className={ styles.appWrap }>
            <div className={ styles.application }>

                <div className={ styles.header }>

                    <h1 className={ styles.title }>
                        Booper Snooter v0.1
                    </h1>

                    <div className={ styles.snoots }>
                        Pick a derp:
                    </div>
                    <ul className={ styles.catSelector }>
                        { staticCats.map( ( staticCat, index ) => {
                            return <li
                                className={ styles.catSelect + ' ' + ( index === catIndex ? styles.selected : '' ) }
                                onClick={ this.selectCat( index ) }
                                key={ index }
                            >
                                { staticCat.name }
                            </li>;
                        } ) }
                    </ul>
                </div>

                <div className={ styles.imageWrap }>

                    <div
                        className={ styles.container }
                        style={{
                            height: `${ cat.height }px`,
                            width: `${ cat.width }px`,
                            backgroundImage: `url( ${ background.img } )`
                        }}
                    >

                        <div
                            className={ styles.relative }
                            style={{
                                height: `${ cat.height }px`,
                                width: `${ cat.width }px`
                            }}
                        >

                            <Draggable
                                ref="draggable"
                                key={ cat.name }
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
                                    onTouchStart={ ( event ) => event.preventDefault() }
                                    onTouchMove={ ( event ) => event.preventDefault() }
                                    draggable={ false }
                                    src={ tongue.img }
                                    className={ styles.noSelect }
                                    style={{
                                        position: 'absolute',
                                        cursor: 'pointer'
                                    }}
                                />
                            </Draggable>

                            <img
                                draggable={ false }
                                className={ styles.absolute }
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
                                    height: `${ eye1.height }px`,
                                    width: `${ eye1.width }px`,
                                    background: `${ eye2.background }`,
                                    boxShadow: `0 0 2px ${ eye1.borderColor }`
                                }}
                            />

                            <div
                                className={ styles.eye }
                                style={{
                                    top: `${ eye2Spring.position.y }px`,
                                    left: `${ eye2Spring.position.x }px`,
                                    height: `${ eye1.height }px`,
                                    width: `${ eye1.width }px`,
                                    background: `${ eye2.background }`,
                                    boxShadow: `0 0 2px ${ eye2.borderColor }`
                                }}
                            />

                        </div>

                    </div>

                    <div className={ styles.imageCredit }>
                        Image credit <a className={ styles.imageLink } href={ cat.source } rel="nofollow" target="_blank">
                            { cat.source.substr( 0, 20 ) }&hellip;
                        </a>
                    </div>

                </div>

                <div className={ styles.snootsBooped }>
                    <span className={ styles.snoots }>Snoots Booped:</span>
                    <span className={ styles.booped }> { this.state.snootsBooped }</span>
                </div>

            </div>

            <div className={ styles.footer }>
                <div className={ styles.footed }>
                    <span className={ styles.footSnoot }>by</span>
                    <a
                        className={ styles.footLink }
                        href="http://blog.andrewray.me"
                        target="_blank"
                    >
                        Andrew Ray
                    </a>
                    { this.state.showBitcoinAddress ? <pre className={ styles.pre }>
                        1FsEF4v5vGHiNAgwSBMzBFvbScP96fgohJ
                    </pre> : <button
                        onClick={ this.showBitcoinAddress }
                        className={ styles.donateButton }
                    >
                    <img
                        className={ styles.btcIcon }
                        src={ require('../coinbase-icon.png') }
                    /> Donate Bitcoin
                    </button> }
                    <a
                        className={ styles.footLink }
                        href="https://twitter.com/andrewray"
                        target="_blank"
                    >
                        Twitter
                    </a>
                    <a
                        className={ styles.footLink }
                        href="https://github.com/DelvarWorld/cats-react"
                        target="_blank"
                    >
                        Github
                    </a>
                </div>
            </div>

        </div>;

    }

}
