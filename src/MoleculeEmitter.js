import * as PIXI from '../node_modules/pixi.js/dist/pixi';
import Molecule from './Molecule';

export default class MoleculeEmitter {
    constructor(x, y) {
        this.x = x;

        this.y = y;


        this.limitRadius = 100;

        this.moleculeAmount = 10;


        this.moleculeMinLength = 10;
        this.moleculeMaxLength = 50;

        this.moleculeMinPointRadius = 2;
        this.moleculeMaxPointRadius = 4;


        this.moleculeMovementRadius = 50;

        this.molecules = [];
    }
}
