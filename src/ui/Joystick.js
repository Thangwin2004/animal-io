import { Container, Graphics } from 'pixi.js';

export class VirtualJoystick extends Container {
  constructor() {
    super();
    this.base = new Graphics();
    this.base.circle(0, 0, 70).fill({ color: 0xffffff, alpha: 0.15 });
    this.base.setStrokeStyle({ width: 3, color: 0xffffff, alpha: 0.3 });
    this.base.stroke();
    
    this.knob = new Graphics();
    this.knob.circle(0, 0, 30).fill({ color: 0xffffff, alpha: 0.6 });
    this.knob.setStrokeStyle({ width: 2, color: 0xffffff, alpha: 0.8 });
    this.knob.stroke();
    
    this.addChild(this.base);
    this.addChild(this.knob);
    
    this.visible = false;
    this.vector = { x: 0, y: 0 };
    this.maxRadius = 70;
  }

  showAt(x, y) {
    this.x = x;
    this.y = y;
    this.visible = true;
    this.knob.x = 0;
    this.knob.y = 0;
    this.vector = { x: 0, y: 0 };
  }

  hide() {
    this.visible = false;
    this.vector = { x: 0, y: 0 };
  }

  updateKnob(x, y) {
    let dx = x - this.x;
    let dy = y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > this.maxRadius) {
      dx = (dx / dist) * this.maxRadius;
      dy = (dy / dist) * this.maxRadius;
    }
    
    this.knob.x = dx;
    this.knob.y = dy;
    
    if (dist > 5) {
      this.vector.x = dx / this.maxRadius;
      this.vector.y = dy / this.maxRadius;
    } else {
      this.vector.x = 0;
      this.vector.y = 0;
    }
  }
}
