import Helpers from './Helpers';
import Mlcv from './MoleculeVizualisation';
import MLCV_STATES from './src/mlcvStates.js';

export default class WorldCancerDayVizualisation {
    constructor(document, holder, customSettings, mlcvSettings) {
        this.mlcv = new MoleculeVizualisation(document, holder, mlcvSettings);

        this.defaultSettings = {

        };

        this.settings = Helpers.mergeDeep(this.defaultSettings, customSettings);


        this.availableOrgans = {
            lungs: 'lungs'
        }

        init()
    }

    init() {
        this.mlcv.init()
            .importDefaultState(MLCV_STATES.Default)
            .startRenderLoop();
    }

    initOrgans() {
        // Initialize textures of all avaiable organs
        for ()
    }

    showOrgan(organ) {
        // If an organ is being shown
        // animate it away first.

        // Center and zoom to and load in new organ.
        // Figure out how to zoom.
    }


    convertOrganTextureIntoCoordinates(organ) {
        const coordinates = [];

        // Get texture of organ.

        return coordinates;
    }

    createOrganMolecules(organ) {
        const coordinates = convertOrganTextureIntoCoordinates(organ)

        // Create new emitter with default settings.
        // Should actually be a group because we will not emit anything.

        // loop over pixel coordinates and place molecules.
        // Have some randomization

        // Add emiter to vizualisation
    }

    // Create and place the
    initOrganMarkers() {

    }
}

