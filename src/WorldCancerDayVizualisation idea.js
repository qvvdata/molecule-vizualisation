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

        // Start looping animation?
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



    getMostPrevalentCancerTypeData(gender, ageGroup) {
        // If gender and a ageGroup are not given account for that.
        // Find the most prevalent cancer type

        // Figure out all the data here.
    }



    activateExplorationMode() {
        // Zoom out.

        // Show click markers.

        // Activate click markers.

        // Activate looping animation.
    }

    disableExplorationMode() {
        // Turn on click handlers.
    }

    onClickMarker() {
        // Find the emitter id.

        // Zoom to that emitter.

        // On zoom end show the text overlay.
    }

    onClickFilter() {
        // get type of filter from data-attr.
        // Get value of from data-attr

        // save value to filter property.
    }

    onClickStartStoryMode() {
        const cancerData = this.getMostPrevalentCancerTypeData(this.gender, this.ageGroup);

        // Zoom to emitter with the id of the cancer
        // this.mlcv.zoomOnEmitterWithId(id);


        // merge in the cancer state with the default state.

        // Set the combined state to the mlcv.
        // this.mlcv.setState(defaultSTate);
    }

    onClickPrevious() {
        this.currentStep--;
    }

    onClickNext() {
        this.currentStep++;

        this.showStep(++this.currentStep);
    }

    showStep(step) {

    }

    showStep1() {

    }

}

