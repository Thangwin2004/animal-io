export class AudioManager {
  constructor() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.bgmGain = this.ctx.createGain();
    this.sfxGain = this.ctx.createGain();

    this.bgmGain.connect(this.ctx.destination);
    this.sfxGain.connect(this.ctx.destination);

    this.bgm = new Audio();
    this.bgm.loop = true;
    this.bgmSource = this.ctx.createMediaElementSource(this.bgm);
    this.localBgmGain = this.ctx.createGain();
    this.bgmSource.connect(this.localBgmGain);
    this.localBgmGain.connect(this.bgmGain);

    this.isBgmMuted = false;
    this.isSfxMuted = false;
    
    this.buffers = {}; // Lưu trữ âm thanh SFX load từ file
    
    // Resume context on first interaction
    const resumeAudio = () => {
      this.resumeContext();
      
      // Unlock / Resume BGM for iOS
      if (this.bgm.paused) {
        this.bgm.play().catch(() => {});
      }
      
      window.removeEventListener('pointerdown', resumeAudio);
      window.removeEventListener('touchstart', resumeAudio);
      window.removeEventListener('click', resumeAudio);
    };
    window.addEventListener('pointerdown', resumeAudio);
    window.addEventListener('touchstart', resumeAudio);
    window.addEventListener('click', resumeAudio);
  }

  async loadAudioBuffer(url, name) {
    try {
      const response = await window.fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
      this.buffers[name] = audioBuffer;
    } catch (e) {
      console.error("Error loading audio", url, e);
    }
  }

  loadSFX() {
    this.loadAudioBuffer("/assest/music/CharKnockDown.mp3", "die");      // Bị ăn - giữ nguyên
    this.loadAudioBuffer("/assest/music/Bounce1.mp3", "bounce");         // Va chạm nảy
    this.loadAudioBuffer("/assest/music/Card1.mp3", "pop");              // Thu thập food - gọn nhẹ
    this.loadAudioBuffer("/assest/music/Chest_Impact.mp3", "eat");       // Húc bay player - impact mạnh
    this.loadAudioBuffer("/assest/music/Button1.mp3", "click");          // Nút bấm
    this.loadAudioBuffer("/assest/music/CharHit.mp3", "hit");            // Va chạm húc nhẹ
    this.loadAudioBuffer("/assest/music/CharSpawn.mp3", "spawn");        // Hồi sinh
    this.loadAudioBuffer("/assest/music/EndGameWin.wav", "win");         // Chiến thắng
  }

  playBGM(url, volume = 0.05) {
    if (this.bgm.src && this.bgm.src.endsWith(url)) {
      if (this.bgm.paused) {
        this.bgm.play().catch(e => console.log("BGM Deferred"));
      }
      this.localBgmGain.gain.value = volume;
      return;
    }

    this.bgm.pause();
    this.bgm.src = url;
    this.bgm.load();
    this.localBgmGain.gain.value = volume;
    this.bgm.play().catch(e => console.log("BGM Deferred until interaction"));
  }

  playSFX(type, volume = 1.0) {
    this.resumeContext();
    
    // Create local gain for this specific SFX instance
    const localGain = this.ctx.createGain();
    localGain.gain.value = volume;
    localGain.connect(this.sfxGain);
    
    if (this.buffers[type]) {
      const source = this.ctx.createBufferSource();
      source.buffer = this.buffers[type];
      source.connect(localGain);
      source.start(0);
      return;
    }
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(localGain);

    const now = this.ctx.currentTime;
    
    if (type === 'eat') {
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'click') {
      osc.type = "square";
      osc.frequency.setValueAtTime(400, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'bounce') {
      osc.type = "sine";
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.1);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'pop') {
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else {
      osc.disconnect();
      gain.disconnect();
    }
  }

  toggleBGM() {
    this.isBgmMuted = !this.isBgmMuted;
    this.bgmGain.gain.value = this.isBgmMuted ? 0 : 1;
    return this.isBgmMuted;
  }
  
  toggleSFX() {
    this.isSfxMuted = !this.isSfxMuted;
    this.sfxGain.gain.value = this.isSfxMuted ? 0 : 1;
    return this.isSfxMuted;
  }
  
  resumeContext() {
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }
}
