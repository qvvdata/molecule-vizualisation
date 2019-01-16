import Helpers from './Helpers';
import Molecule from './Molecule';
import * as PIXI from '../node_modules/pixi.js/dist/pixi';

export default class MoleculeEmitter {
    /**
     * @param {MoleculeVizualisation}
     * @param {Object} settings
     */
    constructor(mlcv = null, customSettings) {
        /**
         * @type {MoleculeVizualisation}
         */
        this.mlcv = mlcv;

        /**
         * @type {Boolean}
         */
        this.dragging = false;

        /**
         * Will be overwritten by custom settings.
         *
         * @type {Object}
         */
        this.defaultSettings = {
            // X position.
            x: 0,

            // Y position.
            y: 0,

            // Variation in opacity.
            opacityJitter: 50,

            // Variation in size. Percentage.
            sizeJitter: 20,

            // Size of the molecule.
            moleculeSize: 40,

            moleculePointRadius: 5,

            moleculeLineThickness: 2,


            // How far from the center are are alloed to spawn molecules.
            spawnRadius: 100,

            // Amount of molecules this emitter will spawn.
            moleculeAmount: 10,

            // How big is the movement radius of the molecule.
            moleculeMovementRadius: 100,
        };

        /**
         * Final settings object.
         *
         * @type {Object}
         */
        this.settings = Helpers.mergeDeep(this.defaultSettings, customSettings);

        this.molecules = [];

        /**
         * Will contain all the pixi instances of the molecules.
         *
         * @type {PIXI.Container}
         */
        this.container = this.createContainer();

        /**
         * List of events
         *
         * Key = eventType.
         *
         * @type {Object}
         */
        this.events = {};


        this.highlightGizmo = null;
        this.dragGizmo = null;
        this.radiusGizmo = null;

        if (this.mlcv !== null && this.mlcv.settings.showGizmos === true) {
            this.createGizmos();
        }
    }

    render(elapsed) {
        // Loop over all molecules and render them.
        for (let i = 0; i < this.molecules.length; i++) {
            this.molecules[i].render(elapsed);
        }
    }

    recreateMolecules() {
        if (this.mlcv !== null) {
            // this.mlcv.pixiApp.stage.removeChild(this.container);

            this.removeMolecules();

            this.molecules = this.createMolecules();

            for (let i = 0; i < this.molecules.length; i++) {
                this.container.addChild(this.molecules[i].container);
            }

            // this.mlcv.pixiApp.stage.addChild(this.container);
        }
    }

    removeMolecules() {
        for(let i = 0; i < this.molecules.length; i++) {
            this.container.removeChild(this.molecules[i].container);
        }
    }

    createGizmos() {
        this.dragGizmo = this.createDragHandleGizmo();
        this.container.addChild(this.dragGizmo);

        this.radiusGizmo = this.createSpawnRadiusGizmo();
        this.container.addChild(this.radiusGizmo);
    }

    createContainer() {
        const container = new PIXI.Container();
        container.x = this.settings.x;
        container.y = this.settings.y;

        return container;
    }

    createDebugRect() {
        const bounds = new PIXI.Graphics();
        bounds.lineStyle(1, 0xFF00FF, 1);
        bounds.drawRect(0, 0, this.container.width, this.container.height);

        return bounds;
    }

    createDragHandleGizmo(color = 0x0000FF) {
        const gizmo = new PIXI.Graphics();
        gizmo.beginFill(color);
        gizmo.drawCircle(0, 0, 10);
        gizmo.endFill();

        gizmo.interactive = true;
        gizmo.buttonMode = true;

        gizmo.on('click', this.onClickDragHandle.bind(this))
            .on('mousedown', this.onDragStart.bind(this))
            .on('mouseup', this.onDragEnd.bind(this))
            .on('mouseupoutside', this.onDragEnd.bind(this))
            .on('mousemove', this.onDragMove.bind(this, gizmo));

        return gizmo;
    }

    createSpawnRadiusGizmo(clr = 0x00FF00) {
        const gizmo = new PIXI.Graphics();
        gizmo.lineStyle(1, clr, 1);
        gizmo.drawCircle(0, 0, this.settings.spawnRadius);
        return gizmo;
    }

    createMolecules() {
        const molecules = [];

        for (let i = 0; i < this.settings.moleculeAmount; i++) {
            const x = 0 + (this.settings.spawnRadius / 2) - Math.random() * this.settings.spawnRadius;
            const y = 0 + (this.settings.spawnRadius / 2) - Math.random() * this.settings.spawnRadius;

            const radius = this.settings.moleculePointRadius;
            const length = this.settings.moleculeSize;
            const lineThickness = this.settings.moleculeLineThickness;

            const molecule = new Molecule(this.mlcv, x, y, radius, length, lineThickness);


            if (this.settings.sizeJitter > 0) {
                const scaleDiff = Math.random() * this.settings.sizeJitter / 100;
                const scale = 1.0 - scaleDiff;
                molecule.setScale(scale);


            }

            if (this.settings.opacityJitter > 0) {
                const diff = Math.random() * this.settings.opacityJitter / 100;
                const opacity = 1.0 - diff;
                molecule.setOpacity(opacity);
            }

            molecules.push(molecule);
        }

        return molecules;
    }

    /**
     * Events
     */

    /**
     * Click handler when clicking on the dragHandle gizmo.
     */
    onClickDragHandle() {
        // this.
    }

    onDragStart(event) {
        this.dragging = true;
        this.eventData = event.data;

        // console.log('on Drag Start', this, event, event.data);
    }

    onDragEnd() {
        this.dragging = false;

        // console.log('on Drag End');
    }

    onDragMove(gizmo) {
        // console.log('On Drag Move', this.dragging);
        if (this.dragging === true) {
            const newPosition = this.eventData.getLocalPosition(gizmo);
            // console.log('new position', newPosition);

            newPosition.x = this.settings.x + newPosition.x;
            newPosition.y = this.settings.y + newPosition.y;

            this.setPosition(newPosition);
        }
    }

    /**
     * Setters
     */

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

    /**
     * @param {Number} x
     */
    setX(x) {
        this.settings.x = x;
        this.container.x = x;
    }

    /**
     * @param {Number} y
     */
    setY(y) {
        this.settings.y = y;
        this.container.y = y;
    }

    /**
     * Toggles the gizmos on and off.
     *
     * if the gizmos don't exist they will be created and added to the container.
     *
     * If they exist and are turned off then we just turn of the visibility off.
     */
    toggleGizmos(bool) {
        if (bool === true) { // Show gizmos
            if (this.radiusGizmo !== null) {
                this.radiusGizmo.visible = true;
            } else {
                this.radiusGizmo = this.createSpawnRadiusGizmo();
                this.container.addChild(this.radiusGizmo);
            }

            if (this.dragGizmo !== null) {
                this.dragGizmo.visible = true;
            } else {
                this.dragGizmo = this.createDragHandleGizmo();
                this.container.addChild(this.dragGizmo);
            }

            // We do not create a highlight gizmo if it does not exist.
            // it will be automatically created when the user clicks on
            // the emtiter.
            if (this.highlightGizmo !== null) {
                this.highlightGizmo.visible = true;
            }
        } else { // Hide gizmos.
            if (this.radiusGizmo !== null) {
                this.radiusGizmo.visible = false;
            }

            if (this.dragGizmo !== null) {
                this.dragGizmo.visible = false;
            }

            if (this.highlightGizmo !== null) {
                this.highlightGizmo.visible = false;
            }
        }
    }

    /**
     * Toggles the debug items on and off for the emitters and molecules.
     */
    toggleDebug(bool) {
        // Toggle debug on all molecules.
        for (let i = 0; i < this.molecules.length; i++) {
            const molecule = this.molecules[i];
            molecule.toggleDebug(bool);
        }
    }

    on(eventType, func, targetObj = null) {
        if (this.events[eventType] === undefined) {
            this.events[eventType] = [];
        }

        this.events[eventType].push({
            func: func,
            targetObj: targetObj
        });

        if (targetObj !== null && this[targetObj] !== null) {
            this[targetObj].on(eventType, func);
        } else if (this.container !== null) {
            this.container.interactive = true;
            this.container.on(eventType, func);
        }
    }

    highlight() {
        this.highlightGizmo = this.createSpawnRadiusGizmo(0xFF0000);
        this.container.addChild(this.highlightGizmo);
    }

    unhighlight() {
        if (this.highlightGizmo !== null) {
            this.container.removeChild(this.highlightGizmo);
        }
    }
}
