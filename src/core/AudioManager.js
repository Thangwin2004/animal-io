export class AudioManager {
  constructor() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.bgmGain = this.ctx.createGain();
    this.sfxGain = this.ctx.createGain();

    this.bgmGain.connect(this.ctx.destination);
    this.sfxGain.connect(this.ctx.destination);

    this.bgm = null;
    this.isBgmMuted = false;
    this.isSfxMuted = false;
    
    this.buffers = {}; // Lưu trữ âm thanh SFX load từ file
    
    // Resume context on first interaction
    const resumeAudio = () => {
      this.resumeContext();
      window.removeEventListener('pointerdown', resumeAudio);
    };
    window.addEventListener('pointerdown', resumeAudio);
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
    this.loadAudioBuffer("/assest/music/CharKnockDown.mp3", "die");
    this.loadAudioBuffer("/assest/music/Bounce2.mp3", "bounce");
    this.loadAudioBuffer("/assest/music/LabelCollect.mp3", "pop");
    this.loadAudioBuffer("/assest/music/LevelUp.mp3", "eat");
  }

  playBGM(url, volume = 0.05) {
    if (this.bgm) {
      this.bgm.pause();
    }
    this.bgm = new Audio(url);
    this.bgm.loop = true;

    const source = this.ctx.createMediaElementSource(this.bgm);
    const localGain = this.ctx.createGain();
    localGain.gain.value = volume;

    source.connect(localGain);
    localGain.connect(this.bgmGain);

    this.bgm.play().catch(e => console.log("BGM Deferred until interaction"));
  }

  playSFX(type) {
    if (this.ctx.state === 'suspended') return;
    
    if (this.buffers[type]) {
      const source = this.ctx.createBufferSource();
      source.buffer = this.buffers[type];
      source.connect(this.sfxGain);
      source.start(0);
      return;
    }
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.sfxGain);

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
