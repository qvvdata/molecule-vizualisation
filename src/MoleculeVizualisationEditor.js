import * as dat from '../node_modules/dat.gui/build/dat.gui';
import MoleculeEmitter from './MoleculeEmitter';

export default class MoleculeVizualisationEditor {
    /**
     * @param {Object} document
     * @param {} mlcv     Molecule Vizualisation.
     */
    constructor(document, mlcv) {
        this.document = document;

        this.mlcv = mlcv;

        this.init();
    }

    init() {
        this.setupLayers();
    }

    setupLayers() {
        this.setupMoleculeEmitterControls();
    }

    setupMoleculeEmitterControls() {
        const em = new MoleculeEmitter();
        const gui = new dat.GUI();

        gui.add(em, 'moleculeAmount', 1, 100).step(1);

        console.log(em);
    }
}
