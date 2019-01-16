import * as dat from '../node_modules/dat.gui/build/dat.gui';
import MoleculeEmitter from './MoleculeEmitter';

export default class MoleculeVizualisationEditor {
    /**
     * @param {Object} document
     * @param {} mlcv     Molecule Vizualisation.
     */
    constructor(document, mlcv) {
        this.document = document;

        /**
         * @type {MoleculeVizualisation}
         */
        this.mlcv = mlcv;

        this.newEmitter = new MoleculeEmitter();

        this.gui = new dat.GUI();

        console.log('GUI', this.gui);

        this.init();
    }

    init() {
        this.setupLayers();
    }

    setupLayers() {
        this.setupMoleculeEmitterControls();
    }

    setupMoleculeEmitterControls() {
        const newEmitterFolder = this.gui.addFolder('New Emitter');
        this.addEmitterSettingsToFolder(newEmitterFolder, this.newEmitter);
        newEmitterFolder.add(this, 'placeEmitter');
        newEmitterFolder.open();

        const mlcvFolder = this.gui.addFolder('MLCV');
        mlcvFolder.add(this, 'toggleDebug');
        mlcvFolder.add(this.mlcv.settings, 'debug').listen();
        mlcvFolder.add(this, 'toggleGizmos');
        mlcvFolder.add(this.mlcv.settings, 'showGizmos').listen();
        mlcvFolder.add(this.mlcv, 'exportState').name('Export current state');
        mlcvFolder.open();
    }

    placeEmitter(x = undefined, y = undefined) {
        console.log('Placing emitter');

        // If x and y are not valid. place in the middle of the vizualisation.
        if (typeof x !== 'number' && typeof y !== 'number') {
            const centerCoords = this.mlcv.getCenterCoordinates();
            x = centerCoords.x;
            y = centerCoords.y;
        }

        const emitter = new MoleculeEmitter(this.mlcv, {
            x: x,
            y: y,
            moleculeAmount: this.newEmitter.settings.moleculeAmount,
            spawnRadius: this.newEmitter.settings.spawnRadius,
            moleculeSize: this.newEmitter.settings.moleculeSize,
            moleculePointRadius: this.newEmitter.settings.moleculePointRadius,
            moleculeLineThickness: this.newEmitter.settings.moleculeLineThickness,
            sizeJitter: this.newEmitter.settings.sizeJitter,
            opacityJitter: this.newEmitter.settings.opacityJitter
        });

        console.log(x, y, emitter);

        this.mlcv.addEmitter(emitter);

        emitter.on('click', this.onClickEmitter.bind(this, emitter), 'dragGizmo');
    }

    toggleDebug() {
        this.mlcv.settings.debug = !this.mlcv.settings.debug;

        // loop over objects and turn on off
        for (let i = 0; i < this.mlcv.moleculeEmitters.length; i++) {
            const emitter = this.mlcv.moleculeEmitters[i];
            emitter.toggleDebug(this.mlcv.settings.debug);
        }
    }

    toggleGizmos() {
        this.mlcv.settings.showGizmos = !this.mlcv.settings.showGizmos;

        for (let i = 0; i < this.mlcv.moleculeEmitters.length; i++) {
            const emitter = this.mlcv.moleculeEmitters[i];
            emitter.toggleGizmos(this.mlcv.settings.showGizmos);
        }
    }

    onClickEmitter(emitter) {
        if (emitter !== this.selectedEmitter) {
            if (this.selectedEmitter !== undefined) {
                this.selectedEmitter.unhighlight();
                this.gui.removeFolder(this.gui.__folders['Selected Emitter']);
            }

            emitter.highlight();

            const selectedEmitterFolder = this.gui.addFolder('Selected Emitter');
            this.addEmitterSettingsToFolder(selectedEmitterFolder, emitter, true);
            selectedEmitterFolder.open();

            this.selectedEmitter = emitter;
        }
    }

    addEmitterSettingsToFolder(folder, emitter, recreateMoleculesOnChange = false) {
        const mlcAmountContr = folder.add(emitter.settings, 'moleculeAmount', 1, 100).step(1);
        const spawnRadiusContr = folder.add(emitter.settings, 'spawnRadius', 0, 200).step(1);
        const moleculeSizeContr = folder.add(emitter.settings, 'moleculeSize', 0, 500).step(1);
        const moleculePointRadiusContr = folder.add(emitter.settings, 'moleculePointRadius', 0, 250).step(1);
        const moleculeLineThicknessContr = folder.add(emitter.settings, 'moleculeLineThickness', 0, 100).step(1);
        const opacityJitterContr = folder.add(emitter.settings, 'opacityJitter', 0, 100).step(1);
        const sizeJitterContr = folder.add(emitter.settings, 'sizeJitter', 0, 100).step(1);

        if (recreateMoleculesOnChange === true) {
            mlcAmountContr.onChange(value => {
                emitter.recreateMolecules();
            });

            spawnRadiusContr.onChange(value => {
                emitter.recreateMolecules();
            });

            moleculeSizeContr.onChange(value => {
                emitter.recreateMolecules();
            });

            moleculePointRadiusContr.onChange(value => {
                emitter.recreateMolecules();
            });

            moleculeLineThicknessContr.onChange(value => {
                emitter.recreateMolecules();
            });

            opacityJitterContr.onChange(value => {
                emitter.recreateMolecules();
            });

            sizeJitterContr.onChange(value => {
                emitter.recreateMolecules();
            });
        }
    }
}
