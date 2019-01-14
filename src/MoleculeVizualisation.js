import Helpers from './Helpers';
import MLCV_ENUMS from './enums';
import Molecule from './Molecule';
import * as PIXI from '../node_modules/pixi.js/dist/pixi';
import RStats from '../node_modules/rstatsjs/src/rStats.js';

/**
 *
 * Paint mode
 *     - Paint the molecules
 *         - Emmiters?
 *
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
            debug: false
        };

        /**
         * Final settings object.
         *
         * @type {Object}
         */
        this.settings = Helpers.mergeDeep(this.defaultSettings, customSettings);

        /**
         * @type {String}
         */
        this.mode = MLCV_ENUMS.MODES.VIEW;

        /**
         * @type {PIXIE.app}
         */
        this.pixieApp = new PIXI.Application({
            width: this.holder.clientWidth,
            height: this.holder.clientHeight,
            antialias: true,    // default: false
            transparent: true, // default: false
            resolution: 1       // default: 1
        });

        this.molecules = [];

        if (this.settings.debug === true) {
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

            this.drawRulers();

            // Log the chart to the console for inspection.
            console.log(this);
        }
    }

    fillWithRandomData(moleculeAmount = 500) {
        for (let i = 0; i < moleculeAmount; i++) {
            const x = this.pixieApp.screen.width / 2 + ((Math.random() * this.pixieApp.screen.width) - this.pixieApp.screen.width / 2 );
            const y = this.pixieApp.screen.height / 2 + ((Math.random() * this.pixieApp.screen.height) - this.pixieApp.screen.height / 2);

            const molecule = new Molecule(
                this,
                x,
                y,
                4,
                50
            );

            this.molecules.push(molecule);

            this.pixieApp.stage.addChild(molecule.container);
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

    /**
     * Renders all the layers.
     *
     * @return {ForceRadarScatterplot}
     */
    render() {
        if (this.settings.debug === true) {
            this.rStats('frame').start();
            this.rStats('rAF').tick();
            this.rStats('FPS').frame();
        }


        for (let i = 0; i < this.molecules.length; i++) {
            this.molecules[i].render();
        }

        if (this.settings.debug === true) {
            this.rStats('frame').end();
            this.rStats().update();
        }

        requestAnimationFrame(() => {
            this.render();
        });

        return this;
    }

    /**
     * Export the current state of the chart
     *
     * @return {Object} JSON object.
     */
    exportState() {

    }

    /**
     * Draw rulers in the chart so we can have a better picture of alignment.
     */
    drawRulers() {
        const rulerHorizontal = this.document.createElement('div');
        const rulerVertical = this.document.createElement('div');
        const chartBorderRuler = this.document.createElement('div');

        const baseStyles = [
            'position: absolute',
            'height: 1px',
            'width: 100%',
            'left: 0',
            'top: 50%',
            'background: #00F',
            'transform-origin: center'
        ];

        const horizontalRuleStyles = baseStyles.concat(['transform: translate(0, -50%)']);
        const verticalRuleStyles = baseStyles.concat(['transform: translate(0, -50%) rotate(90deg)']);

        rulerHorizontal.setAttribute('style', horizontalRuleStyles.join(';'));
        this.holder.appendChild(rulerHorizontal);

        rulerVertical.setAttribute('style', verticalRuleStyles.join(';'));
        this.holder.appendChild(rulerVertical);

        chartBorderRuler.setAttribute('style', [
            'position: absolute',
            'top: 0',
            'left: 0',
            'width: 100%',
            'height: 100%',
            'border: 1px solid #F0F'
        ].join(';'));
        this.holder.appendChild(chartBorderRuler);
    }

    /**
     * Sets up all the necessary layers for the visualisation.
     */
    setupLayers() {
        this.createPixieApp();
        // this.createPointsLayer();
        // this.createTargetsLayer();
    }

    createPixieApp() {
        this.holder.appendChild(this.pixieApp.view);
    }
}
