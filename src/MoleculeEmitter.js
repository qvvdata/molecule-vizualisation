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

            // Amount of molecules this emitter will spawn.
            moleculeAmount: 10,

            // Size of the molecule.
            moleculeSize: 40,

            // Length of the line between molecules. in percent.
            // 100% means it spans from endpoint to endpoint.
            // 0% means no line.
            moleculeLineLengthScale: 100,

            // Line thickness of the connecting line.
            moleculeLineThickness: 2,

            // Radius of each endpoint.
            moleculePointRadius: 5,

            // How far from the center are are alloed to spawn molecules.
            spawnRadius: 100,

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
            this.removeMolecules();

            this.molecules = this.createMolecules();

            for (let i = 0; i < this.molecules.length; i++) {
                this.container.addChild(this.molecules[i].container);
            }
        }
    }

    removeMolecules() {
        for (let i = 0; i < this.molecules.length; i++) {
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
            const position = this.calculateMoleculePosition();

            const settings = {
                x: position.x,
                y: position.y,
                radius: this.settings.moleculePointRadius,
                size: this.settings.moleculeSize,
                lineThickness: this.settings.moleculeLineThickness,
                lineLengthScale: this.settings.moleculeLineLengthScale
            };

            if (this.settings.sizeJitter > 0) {
                settings.scale = this.calculateMoleculeScale();
            }

            if (this.settings.opacityJitter > 0) {
                settings.opacity = this.calculateMoleculeOpacity();
            }

            const molecule = new Molecule(this.mlcv, settings);

            molecules.push(molecule);
        }

        return molecules;
    }

    calculateMoleculeOpacity() {
        const diff = Math.random() * this.settings.opacityJitter / 100;
        return 1.0 - diff;
    }

    calculateMoleculeScale() {
        const scaleDiff = Math.random() * this.settings.sizeJitter / 100;
        return 1.0 - scaleDiff;
    }

    calculateMoleculePosition() {
        const angle = Math.random() * 360;

        return {
            x: Math.cos(Helpers.degToRad(angle)) * Math.random() * this.settings.spawnRadius,
            y: Math.sin(Helpers.degToRad(angle)) * Math.random() * this.settings.spawnRadius
        };
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
     * @param {Number}
     */
    setMoleculeLineLengthScale(scale) {
        this.settings.moleculeLineLengthScale = scale;

        // Update all molecule sizes.
        for (let i = 0; i < this.molecules.length; i++) {
            this.molecules[i].setLineLengthScale(scale);
        }
    }

    /**
     * @param {Number} value
     */
    setMoleculeLineThickness(thickness) {
        this.settings.moleculeLineThickness = thickness;

        // Update all molecule sizes.
        for (let i = 0; i < this.molecules.length; i++) {
            this.molecules[i].setLineThickness(thickness);
        }
    }

    /**
     * @param {Number}
     */
    setMoleculePointRadius(radius) {
        this.settings.moleculePointRadius = radius;

        // Update all molecule sizes.
        for (let i = 0; i < this.molecules.length; i++) {
            this.molecules[i].setRadius(radius);
        }
    }

    setMoleculeSize(size) {
        this.settings.moleculeSize = size;

        for (let i = 0; i < this.molecules.length; i++) {
            this.molecules[i].setSize(size);
        }
    }

    setOpacityJitter(value) {
        this.settings.opacityJitter = value;

        // Loop over all the molecules and recalculate the opacity;
        for (let i = 0; i < this.molecules.length; i++) {
            this.molecules[i].setOpacity(this.calculateMoleculeOpacity());
        }
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

    setSizeJitter(value) {
        this.settings.sizeJitter = value;

        // Loop over all the molecules and recalculate the opacity;
        for (let i = 0; i < this.molecules.length; i++) {
            this.molecules[i].setScale(this.calculateMoleculeScale());
        }
    }

    /**
     * @param {Number} radius
     */
    setSpawnRadius(radius, showGizmos = false) {
        this.settings.spawnRadius = radius;

        if (this.radiusGizmo !== null) {
            this.container.removeChild(this.radiusGizmo);
        }

        if (this.highlightGizmo !== null) {
            this.container.removeChild(this.highlightGizmo);
        }

        if (this.mlcv.settings.showGizmos === true || showGizmos === true) {
            this.radiusGizmo = this.createSpawnRadiusGizmo();
            this.container.addChild(this.radiusGizmo);


            this.highlightGizmo = this.createHighlightGizmo();
            this.container.addChild(this.highlightGizmo);
        }

        this.recreateMolecules();
    }

    /**
     * @param {Number}
     */
    setX(x) {
        this.settings.x = x;
        this.container.x = x;
    }

    /**
     * @param {Number}
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
        } else {
            this.hideGizmos();
        }
    }

    hideGizmos() {
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

    createHighlightGizmo() {
        return this.createSpawnRadiusGizmo(0xFF0000);
    }

    highlight() {
        this.highlightGizmo = this.createHighlightGizmo();
        this.container.addChild(this.highlightGizmo);
    }

    unhighlight() {
        if (this.highlightGizmo !== null) {
            this.container.removeChild(this.highlightGizmo);
        }
    }

    /**
     * Export the state of this emitter.
     *
     * We export the settings of the emitter and each molecule.
     * @return {Object}
     */
    exportState() {
        const state = {
            settings: Helpers.mergeDeep({}, this.settings),
            molecules: []
        };

        for (let i = 0; i < this.molecules.length; i++) {
            const molecule = this.molecules[i];
            state.molecules.push(molecule.export());
        }

        return state;
    }

    randomizePositions() {
        // Loop over all the molecules and recalculate the opacity;
        for (let i = 0; i < this.molecules.length; i++) {
            this.molecules[i].setPosition(this.calculateMoleculePosition());
        }
    }
}
