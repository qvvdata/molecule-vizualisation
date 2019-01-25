import Helpers from './Helpers';
import * as PIXI from '../node_modules/pixi.js/dist/pixi';
import PixiEase from '../node_modules/pixi-ease/dist/index';

export default class Molecule {
    /**
     * @param {String}                id
     * @param {MoleculeVizualisation} mlcv
     * @param {Object}                customSettings
     */
    constructor(id, mlcv, customSettings) {
        /**
         * @type {String}
         */
        this.id = id;

        /**
         * Reference to parent so we can access it.
         *
         * @type {MoleculeVizualisation}
         */
        this.mlcv = mlcv;

        /**
         * Will be overwritten by custom settings.
         *
         * @type {Object}
         */
        this.defaultSettings = {
            /**
             * Currently static. Need to implement colour selection too.
             *  HEX Format.
             *
             * @type {Number}
             */
            color: 0x000000,

            // Scale of length of the connecting line
            // compared to the size.
            // Percentage.
            lineLengthScale: 100,

            /**
             * Thickness of connecting line.
             *
             * @type {Number}
             */
            lineThickness: 1,

            /**
             * @type {Number}
             */
            opacity: 1,

            /**
             * Radius of endpoints.
             *
             * @type {Number}
             */
            radius: 10,

            /**
             * @type {Number}
             */
            rotation: 0,

            /**
             * Scale of the entire object.
             *
             * @type {Number}
             */
            scale: 1,

            /**
             * Size (a.k.a length) of the molecule.
             *
             * @type {Number}
             */
            size: 100,

            /**
             * @type {Number}
             */
            x: 0,

            /**
             * @type {Number}
             */
            y: 0,
        };


        /**
         * Final settings object.
         *
         * @type {Object}
         */
        this.settings = Helpers.mergeDeep(this.defaultSettings, customSettings);

        /**
         * @type {PIXI.Container}
         */
        this.container = new PIXI.Container();

        /**
         * @type {?PIXI.Graphics}
         */
        this.endPointLeft = null;

        /**
         * @type {PIXI.Graphics}
         */
        this.endPointRight = null;

        /**
         * @type {PIXI.Graphics}
         */
        this.connectingLine = null;

        /**
         * @type {PIXI.Container}
         */
        this.boundsElement = null;

        /**
         * @type {PixiEase.list}
         */
        this.PixiEaseList = new PixiEase.list({
            pauseOnBlur: true
        });

        this.init();
    }

    init() {
        this.container.position.set(this.settings.x, this.settings.y);
        this.container.rotation = this.settings.rotation;

        // Take care of the left endpoint.
        if (this.endPointLeft !== null) { // if element exist first remove it from the renderer.
            this.container.removeChild(this.endPointLeft);
        }
        this.endPointLeft = this.createEndPointLeft();
        this.container.addChild(this.endPointLeft);


        // Take care of the right endpoint.
        if (this.endPointRight !== null) {
            this.container.removeChild(this.endPointRight);
        }
        this.endPointRight = this.createEndPointRight();
        this.container.addChild(this.endPointRight);

        // Take care of the connecting line.
        if (this.connectingLine !== null) {
            this.container.removeChild(this.connectingLine);
        }
        this.connectingLine = this.createConnectingLine();
        this.container.addChild(this.connectingLine);

        if (this.boundsElement !== null) {
            this.container.removeChild(this.boundsElement);
        }

        if (this.mlcv.settings.debug === true) {
            this.boundsElement = this.createBoundsElement();
            this.container.addChild(this.boundsElement);
        }

        this.container.alpha = this.settings.opacity;

        // Set the pivot of the container to the center.
        this.container.pivot.x = this.container.width / 2;
        this.container.pivot.y = this.container.height / 2;

        // Must go at the end after all children have been added or else
        // their scales will be incorrect
        this.container.scale.y = this.settings.scale;
        this.container.scale.x = this.settings.scale;


    }

    createEndPointLeft() {
        const point = this.createEndPoint(
            this.settings.radius,
            this.settings.radius,
            this.settings.radius,
            this.settings.color
        );

        point.tint = this.settings.color;
        return point;
    }

    createEndPointRight() {
        return this.createEndPoint(
            this.settings.size - this.settings.radius,
            this.settings.radius,
            this.settings.radius,
            this.settings.color
        );
    }

    createEndPoint(x, y, radius, color) {
        const circle = new PIXI.Graphics();

        // Use white color or tinting will not work.
        circle.beginFill(0xFFFFFF);
        circle.drawCircle(x, y, radius);
        circle.endFill();

        // We use a special property tint to set the color.
        // the pixi library can handle changing the tint
        // but not the actual color of the object drawn...
        circle.tint = color;

        return circle;
    }

    createConnectingLine() {
        const startX = this.settings.radius * 2;
        const lineSize = this.settings.size - (this.settings.radius * 4);

        // We basically calculate the length of the line with the scale.
        const scaledLineSize = lineSize * this.settings.lineLengthScale / 100;

        // We look at the difference between the original size and the scaled size.
        const lineLengthDiff = scaledLineSize - lineSize;

        // We cut the difference in half because we need it later on.
        const halfLineLenghtDiff = lineLengthDiff / 2;

        const line = new PIXI.Graphics();
        line.lineStyle(this.settings.lineThickness, 0xFFFFFF);

        // We move the line to the right by radius * 2 so it does not overlap the circle.
        // After that we nudge the line half the length diff so it stays centered between
        // the points.
        line.moveTo(startX - halfLineLenghtDiff, this.settings.radius);

        // Draw the line to the other side.
        // After that we nudge the line by half the linelenghtdiff so the line stays centered.
        line.lineTo(startX + lineSize + halfLineLenghtDiff, this.settings.radius);

        // We use a special property tint to set the color.
        // the pixi library can handle changing the tint
        // but not the actual color of the object drawn...
        line.tint = this.settings.color;

        return line;
    }

    createBoundsElement() {
        const bounds = new PIXI.Graphics();
        bounds.lineStyle(1, 0xFF00FF, 1);

        // I use this.settings.size here because using the container width
        // was giving me incorrect measurements when the molecules are
        // dynamically changed.
        bounds.drawRect(0, 0, this.settings.size, this.container.height);

        return bounds;
    }

    render(elapsed) {
        this.container.rotation -= (0.01 * this.container.scale.x);
        this.settings.rotation = this.container.rotation;
        // this.moveAnimation.update(elapsed);
    }

    toggleDebug(bool) {
        if (bool === true) {
            if (this.boundsElement !== null) {
                this.boundsElement.visible = true;
            } else {
                this.boundsElement = this.createBoundsElement();
                this.container.addChild(this.boundsElement);
            }
        } else if (this.boundsElement !== null) {
            this.boundsElement.visible = false;
        }
    }

    exportState() {
        return {
            id: this.id,
            settings: Helpers.mergeDeep({}, this.settings)
        };
    }

    /**
     * @param {Object} See exportState for object description.
     */
    setState(state) {
        // console.log('setting state', state);
        if (state.settings !== undefined) {
            const settings = state.settings;

            if (typeof settings['color'] === 'number') {
                this.setColor(settings['color']);
            }
        }
    }


    /**
     * Animations
     */

    shake(amountToShake = 1, duration = undefined) {
        if (typeof duration !== 'number') {
            this.PixiEaseList.shake(this.container, amountToShake, duration);
        } else {
            this.PixiEaseList.shake(this.container, amountToShake, duration);
        }
    }

    /**
     * Getters
     */

    getGlobalPosition() {
        return {
            x: this.container.worldTransform.x,
            y: this.container.worldTransform.y
        };
    }

    /**
     * Setters
     */

    /**
     * @param {Number} color In Hex.
     */
    setColor(color, duration = 1000) {
        if (this.settings.color !== color) {
            this.PixiEaseList.tint(
                this.endPointLeft,
                color,
                duration, {
                    ease: 'easeInOutSine'
                }
            );

            this.PixiEaseList.tint(
                this.endPointRight,
                color,
                duration, {
                    ease: 'easeInOutSine'
                }
            );

            this.PixiEaseList.tint(
                this.connectingLine,
                color,
                duration, {
                    ease: 'easeInOutSine'
                }
            );

            this.settings.color = color;
        }
    }

    setLineLengthScale(scale) {
        this.settings.lineLengthScale = scale;

        this.init();
    }

    setLineThickness(thickness) {
        this.settings.lineThickness = thickness;

        this.init();
    }

    /**
     * @param {{
     *        x: Number,
     *        y: Number
     * }} position
     */
    setPosition(position) {
        this.setX(position.x);
        this.setY(position.y);
    }

    setX(x) {
        this.settings.x = x;

        this.PixiEaseList.to(
            this.container,
            {
                x: x
            },
            1000,
            {
                ease: 'easeInOutSine'
            }
        );
    }

    setY(y) {
        this.settings.y = y;

        this.PixiEaseList.to(
            this.container,
            {
                y: y
            },
            1000,
            {
                ease: 'easeInOutSine'
            }
        );
    }

    setRadius(radius) {
        this.settings.radius = radius;

        this.init();
    }

    /**
     * @param {Number}
     */
    setScale(scale) {
        this.settings.scale = scale;

        this.PixiEaseList.to(
            this.container,
            {
                scale: scale
            },
            1000,
            {
                ease: 'easeInOutSine'
            }
        );
    }

    /**
     * @param {Number}
     */
    setSize(size) {
        this.settings.size = size;

        this.init();
    }

    /**
     * @param {Number} 0 - 1
     */
    setOpacity(opacity) {
        this.settings.opacity = opacity;

        this.PixiEaseList.to(
            this.container,
            {
                alpha: opacity
            },
            1000,
            {
                ease: 'easeInOutSine'
            }
        );
    }
}
