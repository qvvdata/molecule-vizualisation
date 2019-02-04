import Helpers from './Helpers';
import MLCV_ENUMS from './enums';
import MlcvEditor from './MoleculeVizualisationEditor';
import Molecule from './Molecule';
import MoleculeEmitter from './MoleculeEmitter';
import * as PIXI from '../node_modules/pixi.js/dist/pixi';
import PixiCenter from '../node_modules/pixi-center/lib/pixi-center';
import PixiEase from '../node_modules/pixi-ease/dist/index';
import RStats from '../node_modules/rstatsjs/src/rStats';

/**
 * Molecule Vizualisation.
 *
 * Currently only resolution set to 1 are supported.
 */
export default class MoleculeVizualisation {
    constructor(document, holderSelector, customSettings) {
        /**
         * @type {Object}
         */
        this.document = document;

        /**
         * The general holder for the entire visualisation.
         *
         * @type {Object}
         */
        this.holder = document.querySelector(holderSelector);

        /**
         * @type {Boolean}
         */
        this.initialized = false;

        /**
         * @type {Object}
         */
        this.layers = {
            svg: null,
            targets: null,
            pointNodes: []
        };

        /**
         * Current active scale.
         *
         * @type {Number}
         */
        this.currentScale = 1;

        /**
         * This is the fallback default scale of the viz.
         * This can change when importing presets that were created
         * on a different size canvas.
         *
         * @type {Number}
         */
        this.defaultScale = 1;

        /**
         * We save the width of the stage when the 
         * default state is imported. We need it
         * for later calculations.
         * 
         * @type {Number}
         */
        this.defaultStageWidth = 0;

        /**
         * We save the height of the stage when the 
         * default state is imported. We need it
         * for later calculations.
         * 
         * @type {Number}
         */
        this.defaultStageHeight = 0;

        /**
         * Will be overwritten by custom settings.
         *
         * @type {Object}
         */
        this.defaultSettings = {
            // This will turn on some visuals and statistics for the chart so
            // you have a better view on what is going on.
            debug: false,

            performanceMonitoring: false,

            showGizmos: false,

            // Percentage.
            // Use this to scale down the amount of molecules based on the original
            // amount to improve performance.
            // Off course when you scale down the amount of molecules the viz might not
            // look as perfect anymore.
            qualityLevel: 100
        };

        /**
         * Final settings object.
         *
         * @type {Object}
         */
        this.settings = Helpers.mergeDeep(this.defaultSettings, customSettings);

        /**
         * @type {PIXIE.app}
         */
        this.pixiApp = new PIXI.Application({
            width: this.holder.clientWidth,
            height: this.holder.clientHeight,
            antialias: true,    // default: false
            transparent: true, // default: false

            // Currently only resolution set to 1 are supported.
            resolution: 1 // default: 1
        });

        this.pixiApp.renderer.plugins.interaction.autoPreventDefault = false;
        this.pixiApp.renderer.view.style.touchAction = 'auto';

        this.moleculeEmitters = [];
        this.molecules = [];

        /**
         * Animation properties.
         */

        /**
         * List to hold PixiEase animations.
         *
         * @type {PixiEase}
         */
        this.PixiEaseList = new PixiEase.list({
            pauseOnBlur: true
        });

        /**
         * Holds reference to the current zoom animation.
         * We only allow one zoom event to run at once
         * otherwise there will be multiple zoom animations
         * running at once and you get weird jumps between
         * zooms.
         *
         * @type {PixieEase.to}
         */
        this.zoomAnimation = null;

        /**
         * Check if we have to activate the editor
         */
        if (this.settings.mode === MLCV_ENUMS.MODES.EDIT) {
            this.editor = new MlcvEditor(document, this);
        }

        if (this.settings.performanceMonitoring === true) {
            // Activate stats and log this class for use in the console.
            this.rStats = new RStats({
                values: {
                    frame: { caption: 'Total frame time (ms)', over: 16 },
                    raf: { caption: 'Time since last rAF (ms)' },
                    fps: { caption: 'Framerate (FPS)', below: 30 },
                    render: { caption: 'WebGL Render (ms)' }
                },

                groups: [
                    { caption: 'Framerate', values: ['fps', 'raf'] },
                    { caption: 'Frame Budget', values: ['frame', 'render'] }
                ]
            });
        }

        if (this.settings.debug === true) {
            this.drawRulers();

            // Log the chart to the console for inspection.
            console.log(this);
        }
    }

    fillWithRandomData(moleculeAmount = 500) {
        for (let i = 0; i < moleculeAmount; i++) {
            const x = this.pixiApp.screen.width / 2 + ((Math.random() * this.pixiApp.screen.width) - this.pixiApp.screen.width / 2 );
            const y = this.pixiApp.screen.height / 2 + ((Math.random() * this.pixiApp.screen.height) - this.pixiApp.screen.height / 2);

            const molecule = new Molecule(
                this,
                x,
                y,
                4,
                25 + Math.random() * 25
            );

            this.molecules.push(molecule);

            this.pixiApp.stage.addChild(molecule.container);
        }

        return this;
    }

    /**
     * Initialized the chart.
     * Bundle functions that need to run upon init here.
     *
     * @return {ForceRadarScatterplot}
     */
    init() {
        this.setupLayers();

        this.initialized = true;
        return this;
    }

    startRenderLoop() {
        this.paused = false;
        this.then = Date.now();
        this.render();

        return this;
    }

    /**
     * Renders all the layers.
     *
     * @return {ForceRadarScatterplot}
     */
    render() {
        const now = Date.now();

        if (this.settings.performanceMonitoring === true) {
            this.rStats('frame').start();
            this.rStats('rAF').tick();
            this.rStats('FPS').frame();
        }


        const elapsed = now - this.then;

        // Loop over all molecules and render them.
        for (let i = 0; i < this.molecules.length; i++) {
            this.molecules[i].render(elapsed);
        }

        // Loop over all emitters and render them.
        for (let i = 0; i < this.moleculeEmitters.length; i++) {
            this.moleculeEmitters[i].render(elapsed);
        }

        if (this.settings.performanceMonitoring === true) {
            this.rStats('frame').end();
            this.rStats().update();
        }

        requestAnimationFrame(() => {
            this.render();
        });

        this.then = now;
        return this;
    }

    /**
     * Draw rulers in the chart so we can have a better picture of alignment.
     */
    drawRulers() {
        const rulerHorizontal = this.document.createElement('div');
        const rulerVertical = this.document.createElement('div');
        const chartBorderRuler = this.document.createElement('div');

        const baseStyles = [
            'background: #00F',
            'height: 1px',
            'left: 0',
            'opacity: 0.5',
            'pointer-events: none',
            'position: absolute',
            'top: 50%',
            'transform-origin: center'
        ];

        const horizontalRuleStyles = baseStyles.concat([
            'transform: translate(0, -50%)',
            'width: 100%'
        ]);

        const verticalRuleStyles = baseStyles.concat([
            'height: 100%',
            'left: 50%',
            'transform: translate(0, -50%)',
            'width: 1px'
        ]);

        rulerHorizontal.setAttribute('style', horizontalRuleStyles.join(';'));
        this.holder.appendChild(rulerHorizontal);

        rulerVertical.setAttribute('style', verticalRuleStyles.join(';'));
        this.holder.appendChild(rulerVertical);

        chartBorderRuler.setAttribute('style', [
            'border: 1px solid #F0F',
            'height: 100%',
            'left: 0',
            'pointer-events: none',
            'position: absolute',
            'top: 0',
            'width: 100%',
        ].join(';'));
        this.holder.appendChild(chartBorderRuler);
    }

    /**
     * Sets up all the necessary layers for the visualisation.
     */
    setupLayers() {
        this.createPixiApp();
        // this.createPointsLayer();
        // this.createTargetsLayer();
    }

    createPixiApp() {
        this.holder.appendChild(this.pixiApp.view);
    }

    /**
     * Adders
     */
    addEmitter(emitter, createMolecules = true) {
        this.moleculeEmitters.push(emitter);
        this.pixiApp.stage.addChild(emitter.container);

        if (createMolecules === true) {
            emitter.initMolecules();
        }
    }

    /**
     * @param  {string} id
     * @return {?MoleculeEmitter}
     */
    findEmitterById(id) {
        for (let i = 0; i < this.moleculeEmitters.length; i++) {
            const emitter = this.moleculeEmitters[i];

            if (emitter.id === id) {
                return emitter;
            }
        }

        return null;
    }

    /**
     * Getters
     */
    getCenterCoordinates() {
        return {
            x: this.pixiApp.screen.width / 2,
            y: this.pixiApp.screen.height / 2
        };
    }

    /**
     * Setters
     */
    importState(state) {
        for (let i = 0; i < state.emitters.length; i++) {
            this.importEmitter(state.emitters[i]);
        }
    }

    importEmitter(state) {
        const emitter = new MoleculeEmitter(
            state.id,
            this,
            state.settings
        );

        emitter.initMolecules(state.molecules);
        this.addEmitter(emitter, false);
    }

    setState(state) {
        this.removeEmittersNotFoundInState(state);

        // Update existing or import new emitters.
        for (let i = 0; i < state.emitters.length; i++) {
            // Try to find an emitter with the same id.
            const foundEmitter = this.findEmitterById(state.emitters[i].id);

            if (foundEmitter !== null) {
                foundEmitter.setStateMolecules(state.emitters[i].molecules);
            } else {
                this.importEmitter(state.emitters[i]);
            }
        }
    }

    /**
     * @param {Object} state
     */
    removeEmittersNotFoundInState(state) {
        const moleculeEmittersToRemove = [];

        // get all the ids of the new emitters.
        const newEmitterIds = state.emitters.map(emitter => {
            return emitter.id;
        });

        // Loop over existing emitters and see if they are in the new state.
        for (let i = 0; i < this.moleculeEmitters.length; i++) {
            const emitter = this.moleculeEmitters[i];

            if (newEmitterIds.indexOf(emitter.id) === -1) {
                // do not remove emitters here because
                // the array we are looping over will be
                // edited in place.
                moleculeEmittersToRemove.push(emitter);
            }
        }

        // Remove obsolete emitters.
        for (let i = 0; i < moleculeEmittersToRemove.length; i++) {
            this.removeEmitter(moleculeEmittersToRemove[i]);
        }
    }

    /**
     * Export the current state of the viz.
     *
     * We will export all the emitters including the state of their molecules.
     *
     * After that we will export all the molecules without an emitter.
     *
     * @return {Object} JSON object.
     */
    exportState() {
        const state = {
            originalDimension: {
                height: this.pixiApp.screen.height,
                width: this.pixiApp.screen.width
            },
            emitters: []
        };

        // Loop over all molecule emitters and export them.
        for (let i = 0; i < this.moleculeEmitters.length; i++) {
            const emitter = this.moleculeEmitters[i];

            state.emitters.push(emitter.exportState());
        }

        return state;
    }

    /**
     * TODO Pretty sure it is smarter to put all objects in a container and
     * scale that container. but not sure. scaling the stage is fine for now.
     *
     * This import the default state from the states.
     *
     * Also checks against the original dimension vs the dimensions
     * of this app and sets the scale appropriately.
     *
     * @param  {Object} state
     * @return {MoleculeVizualisation}
     */
    importDefaultState(state) {
        const stage = this.pixiApp.stage;
        const screen = this.pixiApp.screen;
        let heightScaleDiff = 1;
        let widthScaleDiff = 1;
        let scale = 1;

        if (state.originalDimension.height !== screen.height) {
            heightScaleDiff = screen.height / state.originalDimension.height;
        }

        if (state.originalDimension.width !== screen.width) {
            widthScaleDiff = screen.width / state.originalDimension.width;
        }

        if (heightScaleDiff < widthScaleDiff) {
            scale = heightScaleDiff;
        } else {
            scale = widthScaleDiff;
        }

        this.importState(state);

        this.defaultScale = scale;
        // We must save this before applying the scale.
        this.defaultStageWidth = stage.width;
        this.defaultStageHeight = stage.height;

        stage.pivot.x = stage.width / 2;
        stage.pivot.y = stage.height / 2;

        // // Set scale on stage.
        stage.scale.x = scale;
        stage.scale.y = scale;

        stage.x = screen.width / 2;
        stage.y = screen.height / 2;

        return this;
    }

    removeEmitter(emitter) {
        const index = this.findIndexOfEmitter(emitter);

        if (index !== -1) {
            this.pixiApp.stage.removeChild(emitter.container);
            this.moleculeEmitters.splice(index, 1);
        } else {
            console.log('Emitter not found for deletion', emitter);
        }
    }

    findIndexOfEmitter(emitter) {
        for (let i = 0; i < this.moleculeEmitters.length; i++) {
            if (emitter === this.moleculeEmitters[i]) {
                return i;
            }
        }

        return -1;
    }

    centerOnEmitterWithId(id, offsetX = 0, offsetY = 0) {
        // We use the x scale because we expect both scales to always be equal.
        this.zoomOnEmitterWithId(id, this.pixiApp.stage.scale.x, offsetX, offsetY);
    }

    zoomOnEmitterWithId(id, scale, offsetX = 0, offsetY = 0, offsetIsRelative = false) {
        const emitter = this.findEmitterById(id);

        if (emitter !== null) {
            const pos = emitter.getLocalPosition();

            this.zoomOnCoordinates({
                x: pos.x,
                y: pos.y,
                scale: scale,
                offsetX: offsetX,
                offsetY: offsetY,
                offsetIsRelative: offsetIsRelative
            });
        } else {
            console.log('Cannot zoom on non-existing emitter', id);
        }
    }

    endCurrentZoomAnimation() {
        if (this.zoomAnimation !== null) {
            // There is no cancel or end function that works properly
            // this was the only way to stop the current running animation.
            this.zoomAnimation.pause = true;
        }

        this.zoomAnimation = null;
    }

    zoomOnCoordinates(options) {
        const screen = this.pixiApp.screen;

        this.endCurrentZoomAnimation();

        if (typeof options.duration !== 'number') {
            options.duration = 1000;
        }

        this.zoomAnimation = this.PixiEaseList.to(
            this.pixiApp.stage,
            {
                x: screen.width / 2,
                y: screen.height / 2,
                scale: options.scale,
                pivot: {
                    x: options.x - options.offsetX,
                    y: options.y - options.offsetY
                }
            },
            options.duration,
            {
                ease: 'easeInOutSine'
            }
        );

        this.currentScale = options.scale;
    }

    resetZoom(duration = 1000, callback) {
        const screen = this.pixiApp.screen;

        const stageScale = this.pixiApp.stage.scale;
        if (stageScale.x !== this.defaultScale && stageScale.y !== this.defaultScale) {
            this.endCurrentZoomAnimation();

            this.zoomAnimation = this.PixiEaseList.to(
                this.pixiApp.stage,
                {
                    x: screen.width / 2,
                    y: screen.height / 2,
                    scale: this.defaultScale,
                    pivot: {
                        // Divide by the current scale to get the original size.
                        x: this.defaultStageWidth / 2,
                        y: this.defaultStageHeight / 2
                    }
                },
                duration,
                {
                    ease: 'easeInOutSine'
                }
            );

            if (typeof callback === 'function') {
                this.zoomAnimation.on('done', callback);
            }
        } else if (typeof callback === 'function') {
            // We must run the callback no matter if we zoom or not.
            // if it is a function off course.
            callback();
        }
    }
}
