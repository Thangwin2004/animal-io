import { Assets } from 'pixi.js';

export class AssetLoader {
  constructor() {
    this.avatars = [];
    this.ui = {};
  }

  async load(onProgress) {
    // 1. Tải UI song song
    const uiItems = [
      { key: 'playBtn', url: '/assest/iconbtn/continue_btn.png' },
      { key: 'leaderboardBtn', url: '/assest/iconbtn/trophy_btn.png' },
      { key: 'replayBtn', url: '/assest/iconbtn/replay_btn.png' },
      { key: 'homeBtn', url: '/assest/iconbtn/Home_btn.png' },
      { key: 'rewardBtn', url: '/assest/iconbtn/x2_btn.png' },
      { key: 'settingBtn', url: '/assest/iconbtn/setting_btn.png' },
      { key: 'closeBtn', url: '/assest/iconbtn/close_btn.png' },
      { key: 'backBtn', url: '/assest/iconbtn/back_btn.png' },
      { key: 'tuanNhun', url: '/assest/item/TuanNhun.png' },
      { key: 'menuBg', url: '/assest/image/menu_bg.png' },
      { key: 'testPlayer', url: '/assest/image/test_player.png' }
    ];

    await Promise.all(uiItems.map(async (item) => {
      this.ui[item.key] = await Assets.load(item.url);
    }));
    if (onProgress) onProgress(0.1);

    // 2. Tải items (Thức ăn) song song
    const itemNames = [
      'BanhChungBanhTet (1).png', 'banhmi.png', 'BimBim_02.png', 'Lycaphe.png', 'reddrink.png'
    ];
    this.items = await Promise.all(itemNames.map(name => Assets.load(`/assest/item/${name}`)));
    if (onProgress) onProgress(0.2);

    // 3. Tải avatars (44 nhân vật) song song
    const avatarNames = [
      '001_avatar_laclac.png', '002_avatar_cat_lick1.png', '003_avatar_duck.png',
      '004_avatar_turtle.png', '005_avatar_long.png', '006_avatar_horse.png',
      '007_avatar_tiguawhite.png', '008_avatar_husky.png', '009_avatar_doremonk.png',
      '010_avatar_echxanh1.png', '011_avatar_nudaeng.png', '012_avatar_hubcat.png',
      '013_avatar_unicorn.png', '014_avatar_zongbadou.png', '015_avatar_dauLan.png',
      '016_avatar_banhtung.png', '017_avatar_tiguayel.png', '018_avatar_megachard.png',
      '019_avatar_gigaboy.png', '020_avatar_cloudball.png', '021_avatar_culama.png',
      '022_avatar_poolpanda.png', '023_avatar_trollvn.png', '024_avatar_heothy.png',
      '025_avatar_zolype.png', '026_avatar_crick.png', '027_avatar_penguine.png',
      '028_avatar_timao.png', '029_avatar_caocal.png', '030_avatar_cowboy.png',
      '031_avatar_ninjadog.png', '032_avatar_petrocat.png', '033_avatar_richmonkey.png',
      '034_avatar_hazagi.png', '035_avatar_dogoin.png', '036_avatar_watermelon.png',
      '037_avatar_timone.png', '038_avatar_ronaldo.png', '039_avatar_hustmouse.png',
      '040_avatar_hitbear.png', '041_avatar_echxanh2.png', '042_avatar_zolype2.png',
      '043_avatar_cat_lick2.png', '044_avatar_poolpanda2.png'
    ];

    let loaded = 0;
    const avatarPromises = avatarNames.map(async (name) => {
      const tex = await Assets.load(`/assest/image/imagenobackgrd/${name}`);
      // Lấy tên nhân vật từ tên file
      tex.characterName = name.replace('.png', '').replace(/^\d+_avatar_/, '');
      loaded++;
      if (onProgress) onProgress(0.2 + (loaded / avatarNames.length) * 0.8);
      return tex;
    });

    this.avatars = await Promise.all(avatarPromises);
  }
}
