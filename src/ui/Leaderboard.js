import { Container, Graphics, Text, TextStyle } from 'pixi.js';

export class Leaderboard extends Container {
  constructor() {
    super();
    this.bg = new Graphics().roundRect(0, 0, 300, 400, 20).fill({color: 0x000000, alpha: 0.8});
    this.addChild(this.bg);

    const style = new TextStyle({
      fontFamily: 'Arial', fontSize: 24, fill: '#ffcc00', fontWeight: 'bold'
    });
    this.title = new Text({ text: 'LEADERBOARD', style });
    this.title.anchor.set(0.5, 0);
    this.title.x = 150;
    this.title.y = 20;
    this.addChild(this.title);
  }

  updateList(players) {
    // Tương lai cập nhật danh sách
  }
}
