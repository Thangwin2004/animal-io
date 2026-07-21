import { Container, Graphics, Text, FillGradient, Sprite } from 'pixi.js';

export class Button extends Container {
  constructor(text, onClick, currentR = 30, fixedWidth = null) {
    super();
    this.onClick = onClick;
    this.currentR = currentR;

    this.content = new Container();
    this.addChild(this.content);

    this.shadow = new Graphics();
    this.bg = new Graphics();
    this.content.addChild(this.shadow, this.bg);

    this.label = new Text({
      text: text,
      style: {
        fontFamily: "'Nunito', 'Baloo 2', sans-serif",
        fontSize: Math.max(16, currentR * 0.9),
        fill: '#ffffff',
        fontWeight: "900",
        stroke: { color: '#E65100', width: 5, join: 'round' },
        dropShadow: { color: '#D84315', alpha: 1, distance: 3, blur: 0 }
      }
    });
    this.label.anchor.set(0.5);
    this.label.y = 0;
    this.content.addChild(this.label);

    const width = fixedWidth || (this.label.width + currentR * 3);
    const height = currentR * 2;

    // 1. Solid Shadow (Offset down)
    this.shadow.roundRect(-width / 2, -height / 2 + currentR * 0.25, width, height, currentR)
      .fill({ color: 0xD84315 });

    // 2. Main Face Background (Flat with thick border)
    const btnGrad = new FillGradient(0, -height / 2, 0, height / 2);
    btnGrad.addColorStop(0, '#FF7043');
    btnGrad.addColorStop(1, '#F4511E');

    this.bg.roundRect(-width / 2, -height / 2, width, height, currentR)
      .fill(btnGrad)
      .stroke({ width: Math.max(4, currentR * 0.15), color: 0xFFFFFF });

    // 3. Candy Crush Highlight (Thêm độ bóng bẩy)
    const highlightWidth = width * 0.8;
    const highlightHeight = height * 0.4;
    this.highlight = new Graphics();
    this.highlight.roundRect(-highlightWidth / 2, -height / 2 + currentR * 0.1, highlightWidth, highlightHeight, currentR * 0.8)
      .fill({ color: 0xffffff, alpha: 0.25 });
    this.content.addChild(this.highlight);

    this.eventMode = "static";
    this.cursor = "pointer";

    this.on("pointerdown", (e) => {
      e.stopPropagation();
      this.content.scale.set(0.95);
      this.content.y = currentR * 0.15;
    });
    this.on("pointerup", (e) => {
      e.stopPropagation();
      this.content.scale.set(1);
      this.content.y = 0;
      if (this.onClick) this.onClick();
    });
    this.on("pointerupoutside", (e) => {
      e.stopPropagation();
      this.content.scale.set(1);
      this.content.y = 0;
    });
  }
}

const ICONS = {
    'home': `<svg viewBox="0 0 24 24" width="40" height="40"><path fill="#ffffff" d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>`,
    'gear': `<svg viewBox="0 0 24 24" width="40" height="40"><path fill="#ffffff" d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.06-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.73,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.06,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.43-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.49-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/></svg>`,
    'trophy': `<svg viewBox="0 0 24 24" width="40" height="40"><path fill="#ffffff" d="M19,5h-2V3H7v2H5C3.9,5,3,5.9,3,7v1c0,2.55,1.92,4.63,4.39,4.94c0.63,1.5,1.98,2.63,3.61,2.96V19H7v2h10v-2h-4v-3.1 c1.63-0.33,2.98-1.46,3.61-2.96C19.08,12.63,21,10.55,21,8V7C21,5.9,20.1,5,19,5z M5,8V7h2v3.82C5.84,10.4,5,9.3,5,8z M19,8 c0,1.3-0.84,2.4-2,2.82V7h2V8z"/></svg>`,
    'replay': `<svg viewBox="0 0 512 512" width="40" height="40"><path fill="#ffffff" d="M500.3 256c0 135.3-109.7 245-245 245C118 501 8 387 8 248c0-8.8 7.2-16 16-16h48c8.8 0 16 7.2 16 16 0 92.8 75.2 168 168 168 92.8 0 168-75.2 168-168S348.8 88 256 88c-43.5 0-83.3 16.5-113.3 43.6l39.5 39.5c14 14 4.1 37.9-15.7 37.9H24c-13.3 0-24-10.7-24-24V44.5c0-19.8 23.9-29.7 37.9-15.7l40.3 40.3C116.1 33.4 182.2 0 256 0c135.3 0 244.3 109.7 244.3 256z"/></svg>`,
    'lightning': `<svg viewBox="0 0 24 24" width="40" height="40"><path fill="#ffffff" d="M7 2v11h3v9l7-12h-4l4-8z"/></svg>`
};

export class IconBtn extends Container {
  constructor(iconName, onClick, currentR = 35, labelText = '', theme = 'green') {
    super();
    this.onClick = onClick;
    this.currentR = currentR;
    
    let colorTop, colorBot, colorShadow, colorStroke;
    if (theme === 'green') {
        colorTop = '#66BB6A'; colorBot = '#43A047'; colorShadow = 0x2E7D32; colorStroke = 0xFFFFFF;
    } else if (theme === 'orange') {
        colorTop = '#FFB74D'; colorBot = '#F57C00'; colorShadow = 0xE65100; colorStroke = 0xFFFFFF;
    } else if (theme === 'blue') {
        colorTop = '#6AB8FF'; colorBot = '#1E88E5'; colorShadow = 0x1565C0; colorStroke = 0xFFFFFF;
    } else { // yellow (replay)
        colorTop = '#FFD54F'; colorBot = '#FB8C00'; colorShadow = 0xE65100; colorStroke = 0xFFFFFF;
    }

    this.content = new Container();
    this.addChild(this.content);

    this.shadow = new Graphics();
    this.bg = new Graphics();
    this.content.addChild(this.shadow, this.bg);

    if (ICONS[iconName]) {
      this.icon = new Graphics();
      this.icon.svg(ICONS[iconName]);
      if (iconName === 'replay') {
          this.icon.pivot.set(256, 256); 
          this.icon.scale.set((currentR * 1.3) / 512); // Slightly larger
      } else {
          // ViewBox is 24x24
          this.icon.pivot.set(12, 12); 
          this.icon.scale.set((currentR * 1.3) / 24); 
      }
      this.icon.y = 0;
      this.content.addChild(this.icon);
    }

    // 1. 3D Base Shadow (Solid offset)
    this.shadow.circle(0, currentR * 0.15, currentR)
      .fill({ color: colorShadow });

    // 2. Main Face Background (Flat gradient + Thick stroke)
    const btnGrad = new FillGradient(0, -currentR, 0, currentR);
    btnGrad.addColorStop(0, colorTop);
    btnGrad.addColorStop(1, colorBot);
    
    this.bg.circle(0, 0, currentR)
      .fill(btnGrad)
      .stroke({ width: Math.max(3, currentR * 0.15), color: colorStroke });

    // 3. Candy Crush Highlight (Thêm độ bóng bẩy)
    this.highlight = new Graphics();
    this.highlight.ellipse(0, -currentR * 0.4, currentR * 0.7, currentR * 0.4)
      .fill({ color: 0xffffff, alpha: 0.25 });
    this.content.addChild(this.highlight);

    // Thêm chữ bên dưới nếu có
    if (labelText) {
      this.label = new Text({
        text: labelText,
        style: {
          fontFamily: "'Baloo 2', 'Fredoka', 'Be Vietnam Pro', sans-serif",
          fontSize: Math.max(14, currentR * 0.5),
          fill: '#ffffff',
          fontWeight: "900",
          stroke: { color: '#000000', width: 4, join: 'round' },
        }
      });
      this.label.anchor.set(0.5, 0); // Neo ở trên cùng giữa
      this.label.y = currentR + 5; // Nằm ngay dưới shadow của nút
      this.content.addChild(this.label);
    }

    this.eventMode = 'static';
    this.cursor = 'pointer';

    this.on('pointerdown', (e) => { e.stopPropagation(); this.content.scale.set(0.95); this.content.y = currentR * 0.1; });
    this.on('pointerup', (e) => { e.stopPropagation(); this.content.scale.set(1); this.content.y = 0; if (this.onClick) this.onClick(); });
    this.on('pointerupoutside', (e) => { e.stopPropagation(); this.content.scale.set(1); this.content.y = 0; });
  }

  setTexture(texture, radius) {
    // Tương thích ngược, không làm gì cả
  }
}
