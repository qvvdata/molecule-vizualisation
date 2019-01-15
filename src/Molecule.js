import * as PIXI from '../node_modules/pixi.js/dist/pixi';
import PixiEase from '../node_modules/pixi-ease/dist/index';

export default class Molecule {
    constructor(mcv, x, y, radius, width) {
        this.x = x;
        this.y = y;
        this.radius = radius;

        this.width = width;


        this.container = new PIXI.Container();

        this.container.position.set(x, y);

        this.container.rotation = Math.random() * (2 * Math.PI);

        // console.log(this.container);




        var circle = new PIXI.Graphics();
        circle.beginFill(0x000000);
        circle.drawCircle(0 + radius, 0 + radius, radius);
        circle.endFill();
        this.circle = circle;

        var endCircle = new PIXI.Graphics();
        endCircle.beginFill(0x000000);
        endCircle.drawCircle(width - radius, 0 + radius, radius);
        endCircle.endFill();

        const line = new PIXI.Graphics();
        // line.beginFill(0x000000);
        line.lineStyle(1, 0x00000, 1);
        line.moveTo(0, 0 + radius);
        line.lineTo(width, 0 + radius);
        // line.endFill();
        this.line = line;

        this.container.addChild(line);
        this.container.addChild(circle);
        this.container.addChild(endCircle);

        this.container.pivot.x = this.container.width / 2;
        this.container.pivot.y = this.container.height / 2;

        if (mcv.settings.debug === true) {
            const bounds = new PIXI.Graphics();
            bounds.lineStyle(1, 0xFF00FF, 1);
            bounds.drawRect(0, 0, this.container.width, this.container.height);
            this.container.addChild(bounds);
        }

        this.animation = new PixiEase.to(
            this.container,
            {
                x: this.x + Math.random() * 50,
                y: this.y + Math.random() * 50
            },
            5000,
            {
                repeat: true,
                reverse: true
            }
        );

        // this.animation = new PixiEase.angle(
        //     this.container,
        //     Math.PI * 2,
        //     1,
        //     0,
        //     {

        //     }
        // );
        //
        // this.animation = new PixiEase.shake(this.container, 2, 2000, {
        //     repeat: true,
        //     reverse: true
        // });

        // this.animation = new PixiEase.tint(this.line, [0x0000FF, 0xFFFFFF], 1000, {
        //     repeat: true,
        //     reverse: true
        // });

        // console.log(this.animation);
    }


    render(elapsed) {
        // this.container.rotation -= 0.01;
        // console.log(elapsed);
        this.animation.update(elapsed);
    }
}
