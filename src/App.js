import React, { Component } from 'react';
import Draggable, { DraggableCore } from 'react-draggable';

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
        travelDistance: 20,
        color: '#637790'
    },
    eye2: {
        top: 169,
        left: 327,
        travelDistance: 20,
        color: '#637790'
    }
}) ];

export default class App extends Component {

    constructor( props ) {

        super( props );
        this.state = {
            originalCoords: cats[ 0 ](),
            cat: cats[ 0 ]()
        };

        this.onAnimate = this.onAnimate.bind( this );
        this.handleStart = this.handleStart.bind( this );
        this.handleDrag = this.handleDrag.bind( this );

    }

    componentDidMount() {

        this.animationId = window.requestAnimationFrame( this.onAnimate );

    }

    componentWillUnmount() {

        window.cancelAnimationFrame( this.animationId );

    }

    handleDrag( event, ui ) {

        const { originalCoords, cat } = this.state;

        // How far has this tongue traveled, in + or - %, relative to origin?
        const tongueYTravelPercent = ( ui.position.top - originalCoords.tongue.top ) / (
            originalCoords.tongue.relativeMovementBounds.top +
            originalCoords.tongue.relativeMovementBounds.bottom
        );

        cat.eye1.left = originalCoords.eye1.left - (
            tongueYTravelPercent * originalCoords.eye1.travelDistance
        );

        cat.eye2.left = originalCoords.eye2.left + (
            tongueYTravelPercent * originalCoords.eye1.travelDistance
        );

        this.setState({ cat });

    }

    handleStart() {
    }

    onAnimate() {
    }

    render() {

        const styles = require('./scss/style.scss');

        const { background, tongue, snoot, eye1, eye2 } = this.state.cat;

        return <div className={ styles.wrap }>
            <div className={ styles.container }>

                <img
                    draggable={ false }
                    className={ styles.image }
                    src={ background.img }
                />

                <Draggable
                    start={{
                        x: tongue.left,
                        y: tongue.top
                    }}
                    bounds={{
                        left: tongue.left - tongue.relativeMovementBounds.left,
                        top: tongue.top - tongue.relativeMovementBounds.top,
                        right: tongue.left + tongue.relativeMovementBounds.right,
                        bottom: tongue.top + tongue.relativeMovementBounds.bottom
                    }}
                    onStart={ this.handleStart }
                    onDrag={ this.handleDrag }
                    onStop={ this.handleStop }
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
                        top: `${ eye1.top }px`,
                        left: `${ eye1.left }px`,
                        boxShadow: `0 0 2px ${ eye1.color }`
                    }}
                />

                <div
                    className={ styles.eye }
                    style={{
                        top: `${ eye2.top }px`,
                        left: `${ eye2.left }px`,
                        boxShadow: `0 0 2px ${ eye2.color }`
                    }}
                />

            </div>
        </div>;

    }

}
