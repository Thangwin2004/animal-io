export class OverlayManager {
  constructor(game) {
    this.game = game;
  }

  createBaseOverlay(id) {
    const overlay = document.createElement("div");
    overlay.id = id;
    overlay.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.65);display:flex;align-items:center;justify-content:center;z-index:9999;";
    return overlay;
  }

  showReviveOffer(onRevive, onSkip) {
    const overlay = this.createBaseOverlay('revive-overlay');

    const cardW = 380;
    const cardH = 400;
    
    const card = document.createElement("div");
    card.style.cssText = `position:relative; width:${cardW}px; height:${cardH}px; flex-shrink:0; border-radius:24px; background:#FFFDF8; box-shadow:0 15px 30px rgba(0,0,0,0.2); display:flex; flex-direction:column; align-items:center;`;

    const cardInner = document.createElement("div");
    cardInner.style.cssText = `position:absolute; top:0; left:0; width:100%; height:100%; border-radius:24px; background:#FFFDF8; display:flex; flex-direction:column; align-items:center; padding-top:20px; box-sizing:border-box; border:4px solid #FFF3D6;`;

    const heart = document.createElement("div");
    heart.innerText = "💖";
    heart.style.cssText = "font-size:100px; animation: heartbeat 1s infinite; filter:drop-shadow(0 5px 10px rgba(0,0,0,0.5)); margin-top:10px;";

    const title = document.createElement("div");
    title.innerText = "BẠN CÓ MUỐN HỒI SINH KHÔNG?";
    title.style.cssText = "color:#5D4037; font-family:'Fredoka', 'Baloo 2', 'Be Vietnam Pro', sans-serif; font-size:22px; font-weight:bold; margin-top:20px; text-align:center; padding: 0 20px;";

    const yesBtn = document.createElement("button");
    yesBtn.style.cssText = "margin-top:30px; background:linear-gradient(to bottom, #FFCC80, #FFB74D); border:3px solid #fff; border-radius:15px; padding:12px 60px; color:#5D4037; font-family:'Fredoka', 'Impact', 'Arial Black', sans-serif; font-size:26px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:10px; box-shadow: 0 6px 0 #F57C00, 0 10px 15px rgba(0,0,0,0.2); transition: transform 0.1s;";
    yesBtn.innerHTML = `<img src="/assest/iconbtn/images.png" style="height:30px;"> CÓ`;
    
    yesBtn.onmousedown = () => yesBtn.style.transform = "translateY(6px)";
    yesBtn.onmouseup = () => yesBtn.style.transform = "translateY(0)";
    yesBtn.onmouseleave = () => yesBtn.style.transform = "translateY(0)";
    yesBtn.onclick = () => {
      this.game.audioManager.playSFX('click');
      overlay.remove();
      if (onRevive) onRevive();
    };

    const noLink = document.createElement("div");
    noLink.innerText = "Không, cảm ơn";
    noLink.style.cssText = "margin-top:25px; color:#8D6E63; font-family:'Fredoka', 'Baloo 2', 'Be Vietnam Pro', sans-serif; font-size:16px; text-decoration:underline; cursor:pointer; font-weight:bold;";
    noLink.onclick = () => {
      overlay.remove();
      if (onSkip) onSkip();
    };

    cardInner.appendChild(heart);
    cardInner.appendChild(title);
    cardInner.appendChild(yesBtn);
    cardInner.appendChild(noLink);

    card.appendChild(cardInner);
    overlay.appendChild(card);

    if (!document.getElementById("heartbeat-style")) {
      const style = document.createElement("style");
      style.id = "heartbeat-style";
      style.innerHTML = `@keyframes heartbeat { 0% { transform: scale(1); } 15% { transform: scale(1.15); } 30% { transform: scale(1); } 45% { transform: scale(1.15); } 100% { transform: scale(1); } }`;
      document.head.appendChild(style);
    }

    const handleResize = () => {
      const cw = window.innerWidth;
      const ch = window.innerHeight;
      const scale = Math.min(1.0, cw / 420, ch / 450);
      card.style.transform = `scale(${scale})`;
    };
    window.addEventListener("resize", handleResize);
    handleResize();

    const originalRemove = overlay.remove.bind(overlay);
    overlay.remove = () => {
      window.removeEventListener("resize", handleResize);
      originalRemove();
    };

    document.body.appendChild(overlay);
  }

  showSettings(onResume, isIngame = false) {
    const overlay = this.createBaseOverlay('settings-overlay');

    const cardW = 420;
    const cardH = isIngame ? 380 : 280;
    
    const card = document.createElement("div");
    card.style.cssText = `position:relative; width:${cardW}px; height:${cardH}px; flex-shrink:0; border-radius:24px; background:#FFFDF8; box-shadow:0 12px 25px rgba(0,0,0,0.2); display:flex; flex-direction:column; align-items:center;`;

    const cardInner = document.createElement("div");
    cardInner.style.cssText = `position:absolute; top:0; left:0; width:100%; height:100%; border-radius:24px; background:#FFFDF8; display:flex; flex-direction:column; align-items:center; padding-top:60px; box-sizing:border-box; gap:15px; border:4px solid #FFF3D6;`;

    // Title Ribbon
    const ribbon = document.createElement("div");
    ribbon.style.cssText = `position:absolute; top:-15px; width:260px; height:46px; border-radius:23px; background:linear-gradient(to bottom, #FFCC80, #FFB74D); border:3.5px solid #fff; box-shadow:0 5px 0 #F57C00; display:flex; justify-content:center; align-items:center; color:#5D4037; font-family:'Fredoka', 'Baloo 2', 'Be Vietnam Pro', sans-serif; font-size:22px; font-weight:900; letter-spacing:2px; box-sizing:border-box;`;

    ribbon.innerText = "CÀI ĐẶT GAME";

    const sheen = document.createElement("div");
    sheen.style.cssText = `position:absolute; top:2px; width:42%; height:30%; border-radius:50%; background:rgba(255,255,255,0.25);`;
    ribbon.appendChild(sheen);

    // Rows
    const createRow = (label, isMuted, onToggle) => {
      const row = document.createElement("div");
      row.style.cssText = `width:360px; height:70px; border-radius:12px; background:#fbfaf5; border:3px solid #fff; display:flex; justify-content:space-between; align-items:center; padding:0 20px; box-sizing:border-box;`;
      
      const text = document.createElement("span");
      text.style.cssText = `font-family:'Fredoka', 'Baloo 2', 'Be Vietnam Pro', sans-serif; font-size:18px; font-weight:bold; color:#47363B; letter-spacing:0.8px; white-space:nowrap;`;
      text.innerText = label;

      const dots = document.createElement("div");
      dots.style.cssText = `flex:1; border-bottom: 4px dotted #c0bba0; margin: 0 15px; position:relative; top:5px;`;

      const toggle = document.createElement("div");
      toggle.style.cssText = `width:96px; height:46px; border-radius:23px; background:${isMuted ? '#E8E3D8' : '#81C784'}; border:3px solid #fff; box-shadow: inset 0 3px 6px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.1); cursor:pointer; position:relative; transition: background 0.25s, transform 0.1s; flex-shrink:0; display:flex; align-items:center;`;
      
      const statusText = document.createElement("span");
      statusText.innerText = isMuted ? "OFF" : "ON";
      statusText.style.cssText = `color:#fff; font-family:'Impact', 'Arial Black', sans-serif; font-size:18px; position:absolute; width:100%; text-align:center; padding-right:${isMuted ? '0' : '32px'}; padding-left:${isMuted ? '32px' : '0'}; box-sizing:border-box; transition: padding 0.25s; text-shadow: 0 2px 3px rgba(0,0,0,0.4); pointer-events:none;`;

      const knob = document.createElement("div");
      knob.style.cssText = `width:36px; height:36px; border-radius:50%; background:#fff; position:absolute; top:2px; left:${isMuted ? '3px' : '51px'}; transition: left 0.25s cubic-bezier(0.3, 1.2, 0.5, 1); box-shadow: 0 3px 6px rgba(0,0,0,0.4); pointer-events:none;`;
      
      toggle.appendChild(statusText);
      toggle.appendChild(knob);

      toggle.onclick = () => {
        this.game.audioManager.playSFX('click');
        const newState = onToggle(); // trả về true nếu Muted (OFF)
        toggle.style.background = newState ? '#E8E3D8' : '#81C784';
        knob.style.left = newState ? '3px' : '51px';
        statusText.innerText = newState ? "OFF" : "ON";
        statusText.style.paddingRight = newState ? '0' : '32px';
        statusText.style.paddingLeft = newState ? '32px' : '0';
      };
      
      toggle.onmousedown = () => toggle.style.transform = "scale(0.92)";
      toggle.onmouseup = () => toggle.style.transform = "scale(1)";
      toggle.onmouseleave = () => toggle.style.transform = "scale(1)";

      row.appendChild(text);
      row.appendChild(dots);
      row.appendChild(toggle);
      return row;
    };

    const bgmRow = createRow("ÂM NHẠC", this.game.audioManager.isBgmMuted, () => this.game.audioManager.toggleBGM());
    const sfxRow = createRow("HIỆU ỨNG", this.game.audioManager.isSfxMuted, () => this.game.audioManager.toggleSFX());

    cardInner.appendChild(bgmRow);
    cardInner.appendChild(sfxRow);

    if (isIngame) {
      const btnRow = document.createElement("div");
      btnRow.style.cssText = `display:flex; justify-content:center; gap:40px; margin-top:5px;`;

      const createNavBtn = (iconUrl, onClick) => {
        const btn = document.createElement("button");
        btn.style.cssText = `width:70px; height:70px; border:none; background:transparent; background-image:url('${iconUrl}'); background-size:contain; background-position:center; background-repeat:no-repeat; cursor:pointer; transition:transform 0.1s;`;
        btn.onclick = () => {
          this.game.audioManager.playSFX('click');
          overlay.remove();
          onClick();
        };
        btn.onmousedown = () => btn.style.transform = "scale(0.9)";
        btn.onmouseup = () => btn.style.transform = "scale(1)";
        btn.onmouseleave = () => btn.style.transform = "scale(1)";
        return btn;
      };

      const homeBtn = createNavBtn('/assest/iconbtn/Home_btn.png', () => {
        if (onResume) onResume();
        this.game.switchScene('Menu');
      });
      const replayBtn = createNavBtn('/assest/iconbtn/replay_btn.png', () => {
        if (onResume) onResume();
        this.game.switchScene('Game');
      });
      
      btnRow.appendChild(homeBtn);
      btnRow.appendChild(replayBtn);
      cardInner.appendChild(btnRow);
    }

    // Close Button
    const closeBtn = document.createElement("button");
    closeBtn.style.cssText = `position:absolute; top:-15px; right:-10px; width:60px; height:60px; border:none; background:transparent; background-image:url('/assest/iconbtn/close_btn.png'); background-size:85%; background-position:center; background-repeat:no-repeat; cursor:pointer; z-index:10; transition:transform 0.1s;`;
    closeBtn.onclick = () => {
      this.game.audioManager.playSFX('click');
      overlay.remove();
      if (onResume) onResume();
    };
    closeBtn.onmousedown = () => closeBtn.style.transform = "scale(0.9)";
    closeBtn.onmouseup = () => closeBtn.style.transform = "scale(1)";
    closeBtn.onmouseleave = () => closeBtn.style.transform = "scale(1)";

    card.appendChild(cardInner);
    card.appendChild(ribbon);
    card.appendChild(closeBtn);
    overlay.appendChild(card);

    const handleResize = () => {
      const cw = window.innerWidth;
      const ch = window.innerHeight;
      const scale = Math.min(1.0, cw / 450, ch / 450);
      card.style.transform = `scale(${scale})`;
    };
    window.addEventListener("resize", handleResize);
    handleResize();

    const originalRemove = overlay.remove.bind(overlay);
    overlay.remove = () => {
      window.removeEventListener("resize", handleResize);
      originalRemove();
    };

    document.body.appendChild(overlay);
  }

  showLeaderboard() {
    const overlay = this.createBaseOverlay('leaderboard-overlay');

    const cardW = 500;
    const cardH = 580;
    
    const card = document.createElement("div");
    card.style.cssText = `position:relative; width:${cardW}px; height:${cardH}px; flex-shrink:0; border-radius:24px; background:#FFFDF8; box-shadow:0 15px 30px rgba(0,0,0,0.2); display:flex; flex-direction:column; align-items:center;`;

    const cardInner = document.createElement("div");
    cardInner.style.cssText = `position:absolute; top:0; left:0; width:100%; height:100%; border-radius:24px; background:#FFFDF8; display:flex; flex-direction:column; align-items:center; padding-top:40px; box-sizing:border-box; border:4px solid #FFF3D6;`;
    
    // Ribbon
    const ribbon = document.createElement("div");
    ribbon.style.cssText = `position:absolute; top:-20px; width:300px; height:46px; border-radius:23px; background:linear-gradient(to bottom, #FFCC80, #FFB74D); border:3.5px solid #fff; box-shadow:0 5px 0 #F57C00; display:flex; justify-content:center; align-items:center; color:#5D4037; font-family:'Fredoka', 'Baloo 2', 'Be Vietnam Pro', sans-serif; font-size:20px; font-weight:900;`;
    ribbon.innerText = "BẢNG VÀNG THÀNH TÍCH";

    // Headers
    const headers = document.createElement("div");
    headers.style.cssText = `width:450px; display:flex; color:#5D4037; font-family:'Fredoka', 'Baloo 2', 'Be Vietnam Pro', sans-serif; font-size:18px; font-weight:bold; margin-top:10px; margin-bottom:10px; padding:0 25px; box-sizing:border-box;`;
    headers.innerHTML = `<div style="flex:1;">HẠNG</div><div style="flex:2;">THÀNH VIÊN</div><div style="flex:1; text-align:right;">ĐIỂM SỐ</div>`;

    // List container
    const list = document.createElement("div");
    list.style.cssText = `width:450px; height:360px; overflow-y:auto; display:flex; flex-direction:column; gap:8px;`;

    const createPlayerRow = (rank, name, score, isOdd) => {
      const row = document.createElement("div");
      row.style.cssText = `width:100%; height:44px; min-height:44px; border-radius:8px; background:${isOdd ? '#FFF3D6' : '#FFFDF8'}; border:1px solid #D8A15D; display:flex; align-items:center; padding:0 15px; box-sizing:border-box; color:#5D4037; font-family:'Fredoka', 'Baloo 2', 'Be Vietnam Pro', sans-serif; font-size:16px; font-weight:bold;`;
      
      let rankStr = rank;
      if (rank === 1) rankStr = '🥇';
      else if (rank === 2) rankStr = '🥈';
      else if (rank === 3) rankStr = '🥉';

      row.innerHTML = `<div style="flex:1; font-size:20px;">${rankStr}</div>
                       <div style="flex:2; display:flex; align-items:center; gap:10px;">
                         <img src="/assest/image/imagebldp/001_avatar_laclac.png" style="width:28px; height:28px; border-radius:50%; object-fit:cover; border:2px solid #fff;">
                         ${name}
                       </div>
                       <div style="flex:1; text-align:right; font-size:18px;">${score}</div>`;
      return row;
    };

    // Dummy data
    for (let i = 1; i <= 10; i++) {
      list.appendChild(createPlayerRow(i, `Player ${i}`, 10000 - i * 500, i % 2 !== 0));
    }

    // Personal Best Footer
    const pbScore = localStorage.getItem('animal_io_best_score') || 0;
    const footer = document.createElement("div");
    footer.style.cssText = `width:450px; height:50px; border-radius:8px; background:#fff3cd; border:2px solid #FFD64A; margin-top:10px; display:flex; align-items:center; padding:0 15px; box-sizing:border-box; color:#47363B; font-family:'Fredoka', 'Baloo 2', 'Be Vietnam Pro', sans-serif; font-size:16px; font-weight:bold;`;
    footer.innerHTML = `<div style="flex:1; font-size:20px;">-</div>
                        <div style="flex:2; display:flex; align-items:center; gap:10px;">
                          <img src="/assest/image/imagebldp/007_avatar_tiguawhite.png" style="width:28px; height:28px; border-radius:50%; object-fit:cover; border:2px solid #fff;">
                          Bạn (Khách)
                        </div>
                        <div style="flex:1; text-align:right; font-size:18px;">${pbScore}</div>`;

    // Close Button (X) at Top Right
    const closeBtn = document.createElement("button");
    closeBtn.style.cssText = `position:absolute; top:-15px; right:-10px; width:60px; height:60px; border:none; background:transparent; background-image:url('/assest/iconbtn/close_btn.png'); background-size:85%; background-position:center; background-repeat:no-repeat; cursor:pointer; z-index:10; transition:transform 0.1s;`;
    closeBtn.onclick = () => {
      this.game.audioManager.playSFX('click');
      overlay.remove();
    };
    closeBtn.onmousedown = () => closeBtn.style.transform = "scale(0.9)";
    closeBtn.onmouseup = () => closeBtn.style.transform = "scale(1)";
    closeBtn.onmouseleave = () => closeBtn.style.transform = "scale(1)";

    cardInner.appendChild(headers);
    cardInner.appendChild(list);
    cardInner.appendChild(footer);
    
    card.appendChild(cardInner);
    card.appendChild(ribbon);
    card.appendChild(closeBtn);
    overlay.appendChild(card);

    const handleResize = () => {
      const cw = window.innerWidth;
      const ch = window.innerHeight;
      const scale = Math.min(1.0, cw / 550, ch / 750);
      card.style.transform = `scale(${scale})`;
    };
    window.addEventListener("resize", handleResize);
    handleResize();

    const originalRemove = overlay.remove.bind(overlay);
    overlay.remove = () => {
      window.removeEventListener("resize", handleResize);
      originalRemove();
    };

    document.body.appendChild(overlay);
  }
}
