/*
 * Author: Andrew Ray http://andrewray.me
 * License: https://opensource.org/licenses/MIT
 * Description: Grab a cat's tongue and drag it for mindless fun.
 *
 * Based on http://imgur.com/gallery/aHnOPFa
 */
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import Draggable from 'react-draggable';

// Spring formula
const stiffness = 40; // smaller values mean the spring is looser and will stretch further.
const damperFactor = 0.01; // Larger values increase the amount of damping so the object will come to rest more quickly.
const nodeMass = 0.1;
const velocityMax = 20;
const springFrictionFactor = 0.91;

// Multiplier for eyes to follow mouse
const eyeFollowFactor = 0.01;

// Potential cats
const cats = [() => ({
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
        width: 73,
        height: 147,
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
        growAmount: 15,
        travelDistance: 28,
        background: '#0b1413',
        borderColor: '#141f19'
    },
    eye2: {
        top: 229,
        left: 397,
        height: 31,
        width: 20,
        growAmount: 13,
        travelDistance: 22,
        background: '#0b1413',
        borderColor: '#141f19'
    }
} ), () => ({
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
        width: 28,
        height: 81,
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
        growAmount: 3,
        travelDistance: 9,
        background: '#111521',
        borderColor: '#637790'
    },
    eye2: {
        top: 169,
        left: 327,
        height: 10,
        width: 5,
        growAmount: 3,
        travelDistance: 9,
        background: '#111521',
        borderColor: '#637790'
    }
} ), () => ({
        height: 495,
        width: 660,
        name: 'Grumpy Cat',
        source: 'http://brooklynfarmgirl.com/2014/04/02/happy-birthday-grumpy-cat/',
        background: {
            img: require( '../grumpy-cat.jpg' )
        },
        tongue: {
            img: require( '../grumpy-cat-tongue.png' ),
            top: 235,
            left: 380,
            width: 48,
            height: 98,
            relativeMovementBounds: {
                left: 2,
                top: 10,
                right: 2,
                bottom: 65
            }
        },
        snoot: {
            img: require('../grumpy-cat-snoot.png'),
            top: 197,
            left: 363
        },
        eye1: {
            top: 245,
            left: 362,
            height: 16,
            width: 7,
            growAmount: 8,
            travelDistance: 18,
            background: '#231e1b',
            borderColor: '#47443f'
        },
        eye2: {
            top: 241,
            left: 483,
            height: 16,
            width: 7,
            growAmount: 5,
            travelDistance: 18,
            background: '#231e1b',
            borderColor: '#47443f'
        }
} ) ];

// Copy the cats into a static array of data
const staticCats = cats.map( ( cat ) => cat() );

// Given a current position (vector2d), and a center and a bounds limit,
// constrain the position to be within the center + bounds limit
function boundPositionTo( position, originalPosition, bounds ) {

    return {
        top: Math.min( Math.max( originalPosition.top - bounds.top, position.top ), originalPosition.top + bounds.bottom ),
        left: Math.min( Math.max( originalPosition.left - bounds.left, position.left ), originalPosition.left + bounds.right )
    };

}

// Return the length of a vector
function vectorLength2d( vector ) {

    return Math.sqrt( vector.x * vector.x + vector.y * vector.y );

}

// Return a normalized vector, or a 0 length vector
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

// Create runtime spring data from a cat section
function toSpring( x1, y1 ) {

    return {
        velocity: { x: 0, y: 0 },
        acceleration: { x: 0, y: 0 },
        position: { x: x1, y: y1 },
        origin: { x: x1, y: y1 }
    };

}

// Create the state object for a new cat
function getStateFromIndex( catIndex ) {

    const myCat = cats[ catIndex ]();

    return {
        isPaused: true,
        mouse: { x: 0, y: 0 },
        catIndex,
        cat: myCat,
        percentDistance: 0,
        eye1Offset: { x: 0, y: 0 },
        eye2Offset: { x: 0, y: 0 },
        eye1Spring: toSpring( myCat.eye1.left, myCat.eye1.top ),
        eye2Spring: toSpring( myCat.eye2.left, myCat.eye2.top ),
        tongueSpring: toSpring( myCat.tongue.left, myCat.tongue.top )
    };

}

export default class App extends Component {

    constructor( props ) {

        super( props );

        const state = getStateFromIndex( 2 );
        state.snootsBooped = parseFloat( localStorage.getItem( 'boopsSnooted' ) ) || 0;

        this.state = state;

        this.onAnimate = this.onAnimate.bind( this );
        this.handleDragEnd = this.handleDragEnd.bind( this );
        this.handleDrag = this.handleDrag.bind( this );
        this.handleDragStart = this.handleDragStart.bind( this );
        this.showBitcoinAddress = this.showBitcoinAddress.bind( this );
        this.selectCat = this.selectCat.bind( this );
        this.onMouseMove = this.onMouseMove.bind( this );

    }

    componentDidMount() {

        this.animationId = window.requestAnimationFrame( this.onAnimate );
        document.body.addEventListener( 'mousemove', this.onMouseMove );

    }

    componentWillUnmount() {

        window.cancelAnimationFrame( this.animationId );
        document.body.removeEventListener( 'mousemove', this.onMouseMove );

    }

    showBitcoinAddress() {

        this.setState({ showBitcoinAddress: !this.state.showBitcoinAddress });

    }

    onMouseMove( event ) {

        this.setState({
            mouse: {
                x: event.clientX,
                y: event.clientY
            }
        });

    }

    selectCat( catIndex ) {

        return ( event ) => {
            this.setState( getStateFromIndex( catIndex ) );
        };

    }

    handleDragStart() {

        // This is bad but quick. Mutate state object and re-set it
        this.state.isPaused = true;
        this.state.eye1Spring.acceleration = { x: 0, y: 0 };
        this.state.eye1Spring.velocity = { x: 0, y: 0 };
        this.state.eye2Spring.acceleration = { x: 0, y: 0 };
        this.state.eye2Spring.velocity = { x: 0, y: 0 };
        this.state.tongueSpring.acceleration = { x: 0, y: 0 };
        this.state.tongueSpring.velocity = { x: 0, y: 0 };
        this.setState( this.state );

    }

    // When dragging, calculate the position of the eyes and the tongue
    handleDrag( event, ui ) {

        const { eye1Spring, eye2Spring, tongueSpring, cat } = this.state;

        // react-draggable is terrible. Don't use it. We have to re-constrain
        // the ui position even though we've set a dragging bounds. Without
        // this, the ui position can be reported outside the bounds, meaning
        // the tongue can be dragged outside of the mouth
        const boundPosition = boundPositionTo(
            ui.position, cat.tongue, cat.tongue.relativeMovementBounds
        );

        // How far has this tongue traveled, in + or - %, relative to origin?
        const tongueYTravelPercent = ( boundPosition.top - cat.tongue.top ) / (
            cat.tongue.relativeMovementBounds.top +
            cat.tongue.relativeMovementBounds.bottom
        );

        // Calculate the position of the eyes relative to how far we've dragged
        // the tongue
        eye1Spring.position.x = cat.eye1.left - (
            tongueYTravelPercent * cat.eye1.travelDistance
        );
        eye2Spring.position.x = cat.eye2.left + (
            tongueYTravelPercent * cat.eye2.travelDistance
        );

        tongueSpring.position.x = boundPosition.left;
        tongueSpring.position.y = boundPosition.top;

        this.setState({
            cat,
            hasDragged: true,
            isDragging: true,
            percentDistance: tongueYTravelPercent
        });

    }

    // On drag release, update counter and unpause so spring simulation can
    // start
    handleDragEnd() {

        const snootsBooped = this.state.snootsBooped + 1;
        localStorage.setItem( 'boopsSnooted', snootsBooped );
        this.setState({
            snootsBooped,
            isPaused: false,
            isDragging: false
        });

    }

    onAnimate() {

        this.animationId = window.requestAnimationFrame( this.onAnimate );
        this.elapsedTime = Date.now() - ( this.lastTimeStamp || 0 );
        this.lastTimestamp = Date.now();

        // Scale our animations/forces by how much time has elapsed between
        // frames to account for any variance in framerates
        const timeScale = this.elapsedTime * 0.000000000000001;

        const { isPaused, eye1Spring, eye2Spring, tongueSpring, mouse, cat, isDragging } = this.state;
        const springs = { eye1Spring, eye2Spring, tongueSpring };
        const tongue = this.state.cat.tongue;

        // How far has the tongue travelled?
        const percentDistance = ( tongueSpring.position.y - tongue.top ) / (
            tongue.relativeMovementBounds.top + tongue.relativeMovementBounds.bottom
        );

        // Calculate the eye mouse follow. These are offsets that are added in
        // the render function. We divide / 20 as a dumb way to estimate pupils
        // staying inside the iris
        const bounds = ReactDOM.findDOMNode( this.refs.boundingBox ).getBoundingClientRect();
        const eye1Offset = {
            x: ( ( mouse.x - bounds.left ) - cat.eye1.left ) * eyeFollowFactor * ( cat.eye1.travelDistance / 20 ),
            y: ( ( mouse.y - bounds.top ) - cat.eye1.top ) * eyeFollowFactor * ( cat.eye2.travelDistance / 20 )
        };
        const eye2Offset = {
            x: ( ( mouse.x - bounds.left ) - cat.eye2.left ) * eyeFollowFactor,
            y: ( ( mouse.y - bounds.top ) - cat.eye2.top ) * eyeFollowFactor
        };

        if( isPaused ) {

            // if we're dragging the positions are updated by the drag function
            // otherwise update them here in each animation frame. this is not
            // ideal because responsibility for updating motion is in two
            // functions, but this is also a cat tongue simulator.
            if( !isDragging ) {

                this.setState({ percentDistance, eye1Offset, eye2Offset });

            }

            return;

        }
 
        let totalEnergy = 0;
        let totalDistance = 0;

        // Calculate all the forces for each spring...
        Object.keys( springs ).forEach( ( key ) => {

            const spring = springs[ key ];

            // Length always returns a positive number
            const distanceFromRest = vectorLength2d({
                x: spring.position.x - spring.origin.x,
                y: spring.position.y - spring.origin.y

            // If this spring is at rest, distance will be 0, and dividng by
            // 0 causes NaN which breaks everything, so default to some really
            // small value
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

        // Then update all the spring positions. Technically this could be done
        // in the above loop because each spring is attached to a fixed point.
        // HOWEVER if we ever attach springs to other springs, then this loop
        // would be neccessary, where you update all forces, then update all
        // positions
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
        state.percentDistance = percentDistance;
        state.eye1Offset = eye1Offset;
        state.eye2Offset = eye2Offset;

        if( isComplete ) {
            state.isPaused = true;
        }

        this.refs.draggable.state.clientX = springs.tongueSpring.position.x;
        this.refs.draggable.state.clientY = springs.tongueSpring.position.y;

        this.setState( state );

    }

    render() {

        const styles = require('./scss/style.scss');

        const {
            cat, eye1Spring, eye2Spring, tongueSpring, catIndex,
            percentDistance, eye1Offset, eye2Offset
        } = this.state;
        const { background, tongue, eye1, eye2, snoot } = cat;

        return <div className={ styles.appWrap }>
            <div className={ styles.application }>

                <div className={ styles.header }>

                    <h1 className={ styles.title }>
                        Booper Snooter v0.2
                    </h1>

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
                            ref="boundingBox"
                            className={ styles.relative }
                            style={{
                                height: `${ cat.height }px`,
                                width: `${ cat.width }px`
                            }}
                        >

                            <div
                                onTouchStart={ ( event ) => event.preventDefault() }
                                onTouchMove={ ( event ) => event.preventDefault() }
                                draggable={ false }
                                onDragStart={ ( event ) => false }
                                className={ styles.absolute }
                                style={{
                                    left: tongueSpring.position.x,
                                    top: tongueSpring.position.y,
                                    backgroundImage: `url( ${ tongue.img } )`,
                                    cursor: 'pointer',
                                    height: `${ tongue.height }px`,
                                    width: `${ tongue.width }px`
                                }}
                            />

                            { !this.state.hasDragged && <div
                                className={ styles.pullMe }
                                style={{
                                    top: `${ tongueSpring.position.y + tongue.height - 20 }px`,
                                    left: `${ tongueSpring.position.x + tongue.width + 20 }px`
                                }}
                            >
                                Pull down &amp; release!
                            </div> }

                            <img
                                draggable={ false }
                                onDragStart={ ( event ) => false }
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
                                    top: `${ eye1Spring.position.y - ( percentDistance * eye2.growAmount * 0.5 ) + eye1Offset.y }px`,
                                    left: `${ eye1Spring.position.x + ( percentDistance * eye2.growAmount * 0.5 ) + eye1Offset.x }px`,
                                    height: `${ eye1.height + ( percentDistance * eye1.growAmount ) }px`,
                                    width: `${ eye1.width + ( percentDistance * eye1.growAmount ) }px`,
                                    background: `${ eye2.background }`,
                                    boxShadow: `0 0 4px ${ eye1.borderColor }`
                                }}
                            />

                            <div
                                className={ styles.eye }
                                style={{
                                    top: `${ eye2Spring.position.y - ( percentDistance * eye2.growAmount * 0.5 ) + eye1Offset.y }px`,
                                    left: `${ eye2Spring.position.x - ( percentDistance * eye2.growAmount * 0.5 ) + eye1Offset.x }px`,
                                    height: `${ eye2.height + ( percentDistance * eye2.growAmount ) }px`,
                                    width: `${ eye2.width + ( percentDistance * eye2.growAmount ) }px`,
                                    background: `${ eye2.background }`,
                                    boxShadow: `0 0 4px ${ eye2.borderColor }`
                                }}
                            />

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
                                zIndex={ 200 }
                            >
                                <div style={{
                                    zIndex: 200,
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    height: `${ tongue.height }px`,
                                    width: `${ tongue.width }px`
                                }} />
                            </Draggable>

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
                    { this.state.showBitcoinAddress ? <div className={ styles.coinWrap }>
                        <img
                            className={ styles.qrCode }
                            src={ require('../my-qr-code.png') }
                        />
                        <pre className={ styles.pre }>
                            1FsEF4v5vGHiNAgwSBMzBFvbScP96fgohJ
                        </pre>
                        <a
                            className={ styles.footLink }
                            onClick={ this.showBitcoinAddress }
                        >
                            (Close)
                        </a>
                    </div> : <button
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
