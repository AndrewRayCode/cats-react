import React, { Component } from 'react';

const cats = [{
    background: {
        img: require( '../kitty-cat-1.jpg' )
    },
    tongue: {
        img: require( '../kitty-cat-1-tongue.png' ),
        top: 203,
        left: 282
    },
    snoot: {
        img: require('../kitty-cat-1-snoot.png'),
        top: 187,
        left: 273
    },
    eye1: {
        top: 169,
        left: 267,
        color: '#637790'
    },
    eye2: {
        top: 169,
        left: 327,
        color: '#637790'
    }
}];

export default class App extends Component {

    render() {

        const styles = require('./scss/style.scss');

        const { background, tongue, snoot, eye1, eye2 } = cats[ 0 ];

        return <div className={ styles.wrap }>
            <div className={ styles.container }>

                <img
                    className={ styles.image }
                    src={ background.img }
                />

                <img
                    className={ styles.image }
                    src={ tongue.img }
                    style={{
                        cursor: 'pointer',
                        top: `${ tongue.top }px`,
                        left: `${ tongue.left }px`
                    }}
                />

                <img
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
