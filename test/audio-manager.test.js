import assert from 'node:assert/strict';
import test from 'node:test';

class FakeGain {
  gain = { value: 1 };

  connect() {}
}

class FakeAudioContext {
  destination = {};

  createGain() {
    return new FakeGain();
  }

  createMediaElementSource() {
    return { connect() {} };
  }
}

class FakeAudio {
  loop = false;
  paused = true;

  play() {
    return Promise.resolve();
  }
}

globalThis.window = {
  AudioContext: FakeAudioContext,
  addEventListener() {},
  removeEventListener() {},
};
globalThis.Audio = FakeAudio;

const { AudioManager } = await import('../src/core/AudioManager.js');

test('platform mute silences both channels without losing local preferences', () => {
  const audio = new AudioManager();

  assert.equal(audio.setMuted(true), true);
  assert.equal(audio.bgmGain.gain.value, 0);
  assert.equal(audio.sfxGain.gain.value, 0);

  audio.toggleBGM();
  assert.equal(audio.isBgmMuted, true);
  assert.equal(audio.bgmGain.gain.value, 0);

  assert.equal(audio.setMuted(false), false);
  assert.equal(audio.bgmGain.gain.value, 0);
  assert.equal(audio.sfxGain.gain.value, 1);

  audio.toggleBGM();
  assert.equal(audio.bgmGain.gain.value, 1);
});
