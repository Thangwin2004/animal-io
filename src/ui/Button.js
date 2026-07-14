import { Container, Graphics, Text, FillGradient } from 'pixi.js';

export class Button extends Container {
  constructor(text, onClick, currentR = 30) {
    super();
    this.onClick = onClick;
    this.currentR = currentR;
    
    this.content = new Container();
    this.addChild(this.content);

    this.shadow = new Graphics();
    this.bg = new Graphics();
    this.highlight = new Graphics();
    this.content.addChild(this.shadow, this.bg, this.highlight);

    this.label = new Text({
      text: text,
      style: {
        fontFamily: "'Fredoka', 'Baloo 2', 'Be Vietnam Pro', sans-serif", 
        fontSize: Math.max(16, currentR * 0.8),
        fill: '#5D4037',
        fontWeight: "900",
      }
    });
    this.label.anchor.set(0.5);
    this.label.y = -currentR * 0.08;
    this.content.addChild(this.label);

    const ratio = 3.2; 
    const width = currentR * 2 * ratio;
    const height = currentR * 2;

    // 1. 3D Base Shadow
    this.shadow.roundRect(-width / 2, -currentR + currentR * 0.22, width, height, currentR)
      .fill({ color: 0x000000, alpha: 0.2 })
      .roundRect(-width / 2, -currentR + currentR * 0.15, width, height, currentR)
      .fill({ color: 0xF57C00 }); 

    // 2. Main Face Background
    const btnGrad = new FillGradient(0, -currentR, 0, currentR);
    btnGrad.addColorStop(0, '#FFCC80');
    btnGrad.addColorStop(1, '#FFB74D');
    
    this.bg.roundRect(-width / 2, -currentR, width, height, currentR)
      .fill(btnGrad)
      .stroke({ width: Math.max(2.5, currentR * 0.15), color: 0xFFFFFF });

    // 3. Glossy sheen
    this.highlight.ellipse(0, -currentR / 2, width * 0.42, height * 0.2)
      .fill({ color: 0xffffff, alpha: 0.25 });

    this.eventMode = "static";
    this.cursor = "pointer";
    
    this.on("pointerover", () => {
      this.scale.set(1.05);
    });
    this.on("pointerout", () => {
      this.scale.set(1.0);
      this.content.y = 0;
    });
    this.on("pointerdown", () => {
      this.scale.set(0.92);
      this.content.y = currentR * 0.12;
    });
    this.on("pointerup", () => {
      this.scale.set(1.0);
      this.content.y = 0;
      if (this.onClick) this.onClick();
    });
    this.on("pointerupoutside", () => {
      this.content.y = 0;
    });
  }
}

import { Sprite } from 'pixi.js';

export class IconBtn extends Container {
  constructor(texture, onClick, radius = 35) {
    super();
    this.sprite = new Sprite();
    this.sprite.anchor.set(0.5, 0.45); // Bù trừ quang học
    this.addChild(this.sprite);
    
    if (texture) {
      this.setTexture(texture, radius);
    }
    
    this.eventMode = 'static';
    this.cursor = 'pointer';

    this.on('pointerdown', () => { this.scale.set(0.92); });
    this.on('pointerup', () => { this.scale.set(1); if (onClick) onClick(); });
    this.on('pointerupoutside', () => { this.scale.set(1); });
  }

  setTexture(texture, radius = 35) {
    this.sprite.texture = texture;
    if (texture && texture.width && texture.height) {
      const ratio = texture.width / texture.height;
      if (ratio > 1.2 || ratio < 0.8) {
        this.sprite.height = radius * 2;
        this.sprite.width = radius * 2 * ratio;
      } else {
        this.sprite.width = radius * 2;
        this.sprite.height = radius * 2;
      }
    } else {
      this.sprite.width = radius * 2;
      this.sprite.height = radius * 2;
    }
  }
}
