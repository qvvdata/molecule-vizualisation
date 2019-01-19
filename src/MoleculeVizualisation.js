import Helpers from './Helpers';
import MLCV_ENUMS from './enums';
import MlcvEditor from './MoleculeVizualisationEditor';
import Molecule from './Molecule';
import MoleculeEmitter from './MoleculeEmitter';
import * as PIXI from '../node_modules/pixi.js/dist/pixi';
import PixiEase from '../node_modules/pixi-ease/dist/index';
import RStats from '../node_modules/rstatsjs/src/rStats';

/**
 *
 * Paint mode
 *     - Save to a state.
 *
 *     - How to save transitions ?
 *         - Move emitters ?
 *         - Move bunch of molecules?
 * edit mode
 *     - to edit already placed molecules
 *     - turn off animations and show only original position.
 *
 * - Analyze mode:
 *     - feed a black and white texture and fill it in ?
 *         - research
 *
 * - Feed states and update molecules.
 *     - Need animation interpolation and easing.
 *     - Colour transitions as well.
 *
 * - zooming and scaling of vizualisation.
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

        this.PixiEaseList = new PixiEase.list({
            pauseOnBlur: true
        });

        /**
         * @type {PIXIE.app}
         */
        this.pixiApp = new PIXI.Application({
            width: this.holder.clientWidth,
            height: this.holder.clientHeight,
            antialias: true,    // default: false
            transparent: true, // default: false
            resolution: 1       // default: 1
        });

        this.moleculeEmitters = [];
        this.molecules = [];


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
            emitterState.id,
            this,
            emitterState.settings
        );

        emitter.initMolecules(emitterState.molecules);
        this.addEmitter(emitter, false);
    }

    setState(state) {
        for (let i = 0; i < state.emitters.length; i++) {
            // Try to find an emitter with the same id.
            const foundEmitter = this.findEmitterById(emitterState.id);

            if (foundEmitter !== null) {
                foundEmitter.setState(state.emitters[i])
            } else {
                this.importEmitter(state.emitters[i]);
            }
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
        let heightScaleDiff = 1;
        let widthScaleDiff = 1;
        let scale = 1;

        if (state.originalDimension.height !== this.pixiApp.screen.height) {
            heightScaleDiff = this.pixiApp.screen.height / state.originalDimension.height;
        }

        if (state.originalDimension.width !== this.pixiApp.screen.width) {
            widthScaleDiff = this.pixiApp.screen.width / state.originalDimension.width;
        }

        if (heightScaleDiff < widthScaleDiff) {
            scale = heightScaleDiff;
        } else {
            scale = widthScaleDiff;
        }

        this.importState(state);

        // testing animation.
        // setTimeout(() => {
        //     this.PixiEaseList.to(
        //         this.pixiApp.stage,
        //         {
        //             scale: scale
        //         },
        //         1000,
        //         {
        //             ease: 'easeInOutSine'
        //         }
        //     );

        // }, 1000);

        this.pixiApp.stage.scale.x = scale;
        this.pixiApp.stage.scale.y = scale;

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
}
