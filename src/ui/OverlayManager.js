import gsap from 'gsap';

export class OverlayManager {
  constructor(game) {
    this.game = game;
  }

  createBaseOverlay(id) {
    const overlay = document.createElement("div");
    overlay.id = id;
    // Dark transparent background with Blur effect for background (backdrop-filter)
    overlay.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;z-index:9999;";
    return overlay;
  }

  createCloseButton(onClick) {
    const btn = document.createElement("button");
    btn.style.cssText = `position:absolute; top:-15px; right:-15px; width:48px; height:48px; border-radius:50%; border:4px solid #fff; background:linear-gradient(to bottom, #FF5252, #D32F2F); box-shadow:0 6px 0 #B71C1C, 0 8px 15px rgba(0,0,0,0.3); cursor:pointer; z-index:10; transition:transform 0.1s; display:flex; justify-content:center; align-items:center; padding:0;`;
    btn.innerHTML = `<svg viewBox="0 0 24 24" width="28" height="28"><path fill="#ffffff" stroke="#ffffff" stroke-width="2.5" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41z"/></svg>`;
    btn.onclick = onClick;
    btn.onmousedown = () => btn.style.transform = "scale(0.9) translateY(2px)";
    btn.onmouseup = () => btn.style.transform = "scale(1) translateY(0)";
    btn.onmouseleave = () => btn.style.transform = "scale(1) translateY(0)";
    return btn;
  }

  animateCardOpen(card) {
    gsap.fromTo(card, 
      { scale: 0.5, opacity: 0, y: 100 }, 
      { scale: 1, opacity: 1, y: 0, duration: 0.5, ease: "back.out(1.2)" }
    );
  }

  showReviveOffer(onRevive, onSkip) {
    const overlay = this.createBaseOverlay('revive-overlay');

    const cardW = Math.min(380, window.innerWidth * 0.92);
    const cardH = 480;
    
    const card = document.createElement("div");
    card.style.cssText = `position:relative; width:${cardW}px; height:${cardH}px; flex-shrink:0; border-radius:30px; background:#F6EAD7; box-shadow:0 15px 30px rgba(0,0,0,0.4), inset 0 -8px 0 rgba(139,74,0,0.15); display:flex; flex-direction:column; align-items:center; border:5px solid #C89B54;`;

    const cardInner = document.createElement("div");
    cardInner.style.cssText = `position:absolute; top:0; left:0; width:100%; height:calc(100% - 12px); border-radius:24px; background:linear-gradient(to bottom, #FFFDF9, #FFF9EE); display:flex; flex-direction:column; align-items:center; padding-top:20px; box-sizing:border-box;`;

    const heart = document.createElement("div");
    heart.innerText = "💖";
    heart.style.cssText = "font-size:100px; animation: heartbeat 1s infinite; filter:drop-shadow(0 5px 10px rgba(0,0,0,0.5)); margin-top:10px;";

    const title = document.createElement("div");
    title.innerText = "BẠN CÓ MUỐN HỒI SINH KHÔNG?";
    title.style.cssText = "color:#FF9800; text-shadow: -2px -2px 0 #8B4A00, 2px -2px 0 #8B4A00, -2px 2px 0 #8B4A00, 2px 2px 0 #8B4A00; font-family:'Nunito', 'Baloo 2', sans-serif; font-size:32px; font-weight:900; margin-top:20px; text-align:center; padding: 0 20px; line-height: 1.2; text-shadow: 0 4px 0px rgba(0,0,0,0.2);";

    const yesBtn = document.createElement("button");
    yesBtn.style.cssText = "position:relative; margin-top:30px; background:linear-gradient(to bottom, #FFD54F, #FB8C00); border:4px solid #fff; border-radius:30px; padding:12px 50px; color:#ffffff; text-shadow: -2px -2px 0 #8B4A00, 2px -2px 0 #8B4A00, -2px 2px 0 #8B4A00, 2px 2px 0 #8B4A00; font-family:'Nunito', 'Baloo 2', sans-serif; font-size:28px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:10px; box-shadow: 0 8px 0 #E65100, 0 12px 20px rgba(0,0,0,0.3); transition: transform 0.1s;";
    yesBtn.innerHTML = `<svg viewBox="0 0 24 24" width="28" height="28" style="z-index:2; position:relative;"><path fill="#ffffff" stroke="#8B4A00" stroke-width="1.5" d="M8,5.14V19.14L19,12.14L8,5.14Z" /></svg> <span style="z-index:2; position:relative;">CÓ</span>`;
    
    // Highlight for Candy Crush button
    const sheen = document.createElement("div");
    sheen.style.cssText = `position:absolute; top:2px; left:10%; width:80%; height:40%; border-radius:30px; background:rgba(255,255,255,0.3); pointer-events:none; z-index:1;`;
    yesBtn.appendChild(sheen);

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
    noLink.style.cssText = "margin-top:25px; color:#8B4A00; opacity: 0.8; font-family:'Baloo 2', 'Be Vietnam Pro', sans-serif; font-size:18px; text-decoration:underline; cursor:pointer; font-weight:700;";
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
    this.animateCardOpen(card);
  }

  showSettings(onResume, isIngame = false) {
    const overlay = this.createBaseOverlay('settings-overlay');

    const cardW = Math.min(420, window.innerWidth * 0.92);
    const cardH = isIngame ? 420 : 300; // Increased spacing
    
    const card = document.createElement("div");
    card.style.cssText = `position:relative; width:${cardW}px; height:${cardH}px; flex-shrink:0; border-radius:30px; background:#F6EAD7; box-shadow:0 15px 30px rgba(0,0,0,0.4), inset 0 -8px 0 rgba(139,74,0,0.15); display:flex; flex-direction:column; align-items:center; border:5px solid #C89B54;`;

    const cardInner = document.createElement("div");
    cardInner.style.cssText = `position:absolute; top:0; left:0; width:100%; height:calc(100% - 12px); border-radius:24px; background:linear-gradient(to bottom, #FFFDF9, #FFF9EE); display:flex; flex-direction:column; align-items:center; padding-top:60px; box-sizing:border-box; gap:25px;`;

    // Title Ribbon <====>
    const ribbon = document.createElement("div");
    ribbon.style.cssText = `
      position:absolute; top:-27px; left:50%; transform:translateX(-50%);
      width:min(330px, 90vw); height:54px;
      background: linear-gradient(180deg, #FFD54F 0%, #FFA000 100%);
      clip-path: polygon(15px 0%, calc(100% - 15px) 0%, 100% 50%, calc(100% - 15px) 100%, 15px 100%, 0% 50%);
      display:flex; justify-content:center; align-items:center;
      color:#fff; font-family:'Nunito', 'Baloo 2', sans-serif; font-size:24px; font-weight:900;
      text-shadow: -2px -2px 0 #8B4A00, 2px -2px 0 #8B4A00, -2px 2px 0 #8B4A00, 2px 2px 0 #8B4A00;
      box-shadow: 0 4px 0 #E65100;
      white-space: nowrap;
      z-index:10;
    `;
    ribbon.innerText = "CÀI ĐẶT GAME";

    // Rows
    const createRow = (label, isMuted, onToggle) => {
      const row = document.createElement("div");
      row.style.cssText = `width:90%; max-width:360px; height:75px; border-radius:20px; background:#FFF5D1; border:3px solid #E7C66E; display:flex; justify-content:space-between; align-items:center; padding:0 25px; box-sizing:border-box; box-shadow: inset 0 2px 5px rgba(0,0,0,0.05);`;
      
      const text = document.createElement("span");
      text.style.cssText = `font-family:'Nunito', 'Baloo 2', sans-serif; font-size:24px; color:#8B4A00; letter-spacing:1px; text-shadow: -1px -1px 0 #8B4A00, 1px -1px 0 #8B4A00, -1px 1px 0 #8B4A00, 1px 1px 0 #8B4A00; white-space:nowrap;`;
      text.innerText = label;

      const toggle = document.createElement("div");
      toggle.style.cssText = `width:110px; height:50px; border-radius:25px; background:${isMuted ? '#FFB3B3' : '#79D64C'}; border:4px solid #fff; box-shadow: inset 0 3px 6px rgba(0,0,0,0.2), 0 4px 6px rgba(0,0,0,0.1); cursor:pointer; position:relative; transition: background 0.25s, transform 0.1s; flex-shrink:0; display:flex; align-items:center;`;
      
      const statusText = document.createElement("span");
      statusText.innerText = isMuted ? "OFF" : "ON";
      statusText.style.cssText = `color:#fff; font-family:'Nunito', 'Baloo 2', sans-serif; font-size:20px; position:absolute; width:100%; text-align:center; padding-right:${isMuted ? '0' : '36px'}; padding-left:${isMuted ? '36px' : '0'}; box-sizing:border-box; transition: padding 0.25s; text-shadow: 0 2px 3px rgba(0,0,0,0.4); pointer-events:none; -webkit-text-stroke: 1px rgba(0,0,0,0.2);`;

      const knob = document.createElement("div");
      knob.style.cssText = `width:38px; height:38px; border-radius:50%; background:#fff; position:absolute; top:2px; left:${isMuted ? '4px' : '60px'}; transition: left 0.25s cubic-bezier(0.3, 1.2, 0.5, 1); box-shadow: 0 3px 6px rgba(0,0,0,0.4); pointer-events:none;`;
      
      toggle.appendChild(statusText);
      toggle.appendChild(knob);

      toggle.onclick = () => {
        this.game.audioManager.playSFX('click');
        const newState = onToggle();
        toggle.style.background = newState ? '#FFB3B3' : '#79D64C';
        knob.style.left = newState ? '4px' : '60px';
        statusText.innerText = newState ? "OFF" : "ON";
        statusText.style.paddingRight = newState ? '0' : '36px';
        statusText.style.paddingLeft = newState ? '36px' : '0';
      };
      
      toggle.onmousedown = () => toggle.style.transform = "scale(0.92)";
      toggle.onmouseup = () => toggle.style.transform = "scale(1)";
      toggle.onmouseleave = () => toggle.style.transform = "scale(1)";

      row.appendChild(text);
      row.appendChild(toggle);
      return row;
    };

    const bgmRow = createRow("ÂM NHẠC", this.game.audioManager.isBgmMuted, () => this.game.audioManager.toggleBGM());
    const sfxRow = createRow("HIỆU ỨNG", this.game.audioManager.isSfxMuted, () => this.game.audioManager.toggleSFX());

    cardInner.appendChild(bgmRow);
    cardInner.appendChild(sfxRow);

    if (isIngame) {
      const btnRow = document.createElement("div");
      btnRow.style.cssText = `display:flex; justify-content:center; gap:40px; margin-top:15px;`;

      const createNavBtn = (iconName, onClick, colorTop, colorBot, colorShadow) => {
        const btn = document.createElement("button");
        btn.style.cssText = `position:relative; width:70px; height:70px; border-radius:50%; border:3px solid #fff; background:linear-gradient(to bottom, ${colorTop}, ${colorBot}); box-shadow: 0 6px 0 ${colorShadow}, 0 8px 12px rgba(0,0,0,0.3); cursor:pointer; transition:transform 0.1s; display:flex; justify-content:center; align-items:center; padding:0;`;
        
        const ICONS = {
            'home': '<svg viewBox="0 0 24 24" width="38" height="38" style="z-index:2; position:relative;"><path fill="#ffffff" d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>',
            'replay': '<svg viewBox="0 0 512 512" width="36" height="36" style="z-index:2; position:relative;"><path fill="#ffffff" d="M500.3 256c0 135.3-109.7 245-245 245C118 501 8 387 8 248c0-8.8 7.2-16 16-16h48c8.8 0 16 7.2 16 16 0 92.8 75.2 168 168 168 92.8 0 168-75.2 168-168S348.8 88 256 88c-43.5 0-83.3 16.5-113.3 43.6l39.5 39.5c14 14 4.1 37.9-15.7 37.9H24c-13.3 0-24-10.7-24-24V44.5c0-19.8 23.9-29.7 37.9-15.7l40.3 40.3C116.1 33.4 182.2 0 256 0c135.3 0 244.3 109.7 244.3 256z"/></svg>'
        };
        btn.innerHTML = ICONS[iconName];

        const sheen = document.createElement("div");
        sheen.style.cssText = `position:absolute; top:2px; left:15%; width:70%; height:35%; border-radius:40%; background:rgba(255,255,255,0.25); pointer-events:none; z-index:1;`;
        btn.appendChild(sheen);

        btn.onclick = () => {
          this.game.audioManager.playSFX('click');
          overlay.remove();
          if (onClick) onClick();
        };
        btn.onmousedown = () => btn.style.transform = "scale(0.9) translateY(4px)";
        btn.onmouseup = () => btn.style.transform = "scale(1) translateY(0)";
        btn.onmouseleave = () => btn.style.transform = "scale(1) translateY(0)";
        return btn;
      };

      const homeBtn = createNavBtn('home', () => {
        if (onResume) onResume();
        this.game.switchScene('Menu');
      }, '#6AB8FF', '#1E88E5', '#1565C0'); // Blue
      
      const replayBtn = createNavBtn('replay', () => {
        if (onResume) onResume();
        this.game.switchScene('Game');
      }, '#FFD54F', '#FB8C00', '#E65100'); // Yellow
      
      btnRow.appendChild(homeBtn);
      btnRow.appendChild(replayBtn);
      cardInner.appendChild(btnRow);
    }

    // Close Button
    const closeBtn = this.createCloseButton(() => {
      this.game.audioManager.playSFX('click');
      overlay.remove();
      if (onResume) onResume();
    });

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
    this.animateCardOpen(card);
  }

  showLeaderboard() {
    const overlay = this.createBaseOverlay('leaderboard-overlay');

    const cardW = Math.min(500, window.innerWidth * 0.92);
    const cardH = 620; // Taller for spacing
    
    const card = document.createElement("div");
    card.style.cssText = `position:relative; width:${cardW}px; height:${cardH}px; flex-shrink:0; border-radius:30px; background:#F6EAD7; box-shadow:0 15px 30px rgba(0,0,0,0.4), inset 0 -8px 0 rgba(139,74,0,0.15); display:flex; flex-direction:column; align-items:center; border:5px solid #C89B54;`;

    const cardInner = document.createElement("div");
    cardInner.style.cssText = `position:absolute; top:0; left:0; width:100%; height:calc(100% - 12px); border-radius:24px; background:linear-gradient(to bottom, #FFFDF9, #FFF9EE); display:flex; flex-direction:column; align-items:center; padding-top:50px; box-sizing:border-box;`;
    
    // Ribbon <====>
    const ribbon = document.createElement("div");
    ribbon.style.cssText = `
      position:absolute; top:-27px; left:50%; transform:translateX(-50%);
      width:min(440px, 90vw); height:54px;
      background: linear-gradient(180deg, #FFD54F 0%, #FFA000 100%);
      clip-path: polygon(15px 0%, calc(100% - 15px) 0%, 100% 50%, calc(100% - 15px) 100%, 15px 100%, 0% 50%);
      display:flex; justify-content:center; align-items:center;
      color:#fff; font-family:'Nunito', 'Baloo 2', sans-serif; font-size:26px; font-weight:900;
      text-shadow: -2px -2px 0 #8B4A00, 2px -2px 0 #8B4A00, -2px 2px 0 #8B4A00, 2px 2px 0 #8B4A00;
      box-shadow: 0 4px 0 #E65100;
      white-space: nowrap;
      z-index:10;
    `;
    ribbon.innerText = "BẢNG VÀNG THÀNH TÍCH";

    // Headers
    const headers = document.createElement("div");
    headers.style.cssText = `width:100%; max-width:450px; display:flex; color:#8B4A00; font-family:'Nunito', 'Baloo 2', sans-serif; font-size:20px; margin-top:10px; margin-bottom:10px; padding:0 15px; box-sizing:border-box;`;
    headers.innerHTML = `<div style="flex:1;">HẠNG</div><div style="flex:2;">THÀNH VIÊN</div><div style="flex:1; text-align:right;">ĐIỂM SỐ</div>`;

    // List container
    const list = document.createElement("div");
    list.style.cssText = `width:96%; max-width:450px; height:380px; overflow-y:auto; display:flex; flex-direction:column; gap:8px; padding-bottom: 10px;`;

    const createPlayerRow = (rank, name, score, isOdd, avatarSrc) => {
      const row = document.createElement("div");
      row.style.cssText = `width:100%; height:50px; min-height:50px; border-radius:12px; background:${isOdd ? '#FFF5D1' : '#FFFDF9'}; border:2px solid ${isOdd ? '#E7C66E' : '#F6EAD7'}; display:flex; align-items:center; padding:0 15px; box-sizing:border-box; color:#8B4A00; font-family:'Baloo 2', 'Be Vietnam Pro', sans-serif; font-size:20px; font-weight:700;`;
      
      let rankStr = rank;
      if (rank === 1) rankStr = '🥇';
      else if (rank === 2) rankStr = '🥈';
      else if (rank === 3) rankStr = '🥉';

      row.innerHTML = `<div style="flex:1; font-size:18px;">${rankStr}</div>
        <div style="flex:2; display:flex; align-items:center; gap:6px;">
            <img src="${avatarSrc || '/assest/image/imagenobackgrd/001_avatar_laclac.png'}" style="width:28px; height:28px; border-radius:50%; border:2px solid #FFF; object-fit:cover;"/>
            <span style="font-size:16px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${name}</span>
        </div>
        <div style="flex:1; text-align:right; font-size:18px;">${score}</div>`;
      return row;
    };

    const pbScore = parseInt(localStorage.getItem('animal_io_best_score')) || 0;

    let players = [];
    for (let i = 1; i <= 10; i++) {
      players.push({ name: `Player ${i}`, score: 10000 - i * 500, avatar: '/assest/image/imagenobackgrd/001_avatar_laclac.png' });
    }
    players.push({ name: 'Bạn (Khách)', score: pbScore, isMe: true, avatar: '/assest/image/imagenobackgrd/007_avatar_tiguawhite.png' });
    
    players.sort((a, b) => b.score - a.score);
    let myRank = players.findIndex(p => p.isMe) + 1;
    
    players.slice(0, 10).forEach((p, index) => {
      const isOdd = (index + 1) % 2 !== 0;
      const row = createPlayerRow(index + 1, p.name, p.score, isOdd, p.avatar);
      if (p.isMe) {
        row.style.background = '#E3F2FD';
        row.style.borderColor = '#6AB8FF';
      }
      list.appendChild(row);
    });

    // Personal Best Footer
    const footer = document.createElement("div");
    footer.style.cssText = `width:96%; max-width:450px; height:60px; border-radius:12px; background:#FFFDF9; border:3px solid #6AB8FF; box-shadow: inset 0 2px 10px rgba(106,184,255,0.2); margin-top:15px; display:flex; align-items:center; padding:0 15px; box-sizing:border-box; color:#1E88E5; font-family:'Baloo 2', 'Be Vietnam Pro', sans-serif; font-size:20px; font-weight:800;`;
    footer.innerHTML = `<div style="flex:1; font-size:24px;">${myRank > 0 ? myRank : '-'}</div>
                        <div style="flex:2; display:flex; align-items:center; gap:10px;">
                          <img src="/assest/image/imagenobackgrd/007_avatar_tiguawhite.png" style="width:36px; height:36px; border-radius:50%; object-fit:cover; border:2px solid #1E88E5;">
                          Bạn (Khách)
                        </div>
                        <div style="flex:1; text-align:right; font-size:24px; font-family:'Nunito', 'Baloo 2', sans-serif;">${pbScore}</div>`;

    // Close Button (X) at Top Right
    const closeBtn = this.createCloseButton(() => {
      this.game.audioManager.playSFX('click');
      overlay.remove();
    });

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
    this.animateCardOpen(card);
  }
}
