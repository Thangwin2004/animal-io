const STORAGE_KEY = "winkgames:bo-lac-thu-nhun:language";
const SUPPORTED_LANGUAGES = Object.freeze(["en", "vi"]);

const messages = {
  en: {
    "document.title": "Animal IO",
    "menu.play": "PLAY NOW",
    "settings.title": "SETTINGS",
    "settings.music": "MUSIC",
    "settings.sfx": "SOUND FX",
    "settings.language": "LANGUAGE",
    "settings.english": "English",
    "settings.vietnamese": "Tiếng Việt",
    "revive.title": "DO YOU WANT TO REVIVE?",
    "revive.yes": "YES",
    "revive.skip": "No, thanks",
    "leaderboard.title": "LEADERBOARD",
    "leaderboard.empty": "No records yet. Play to set the first record.",
    "leaderboard.guest": "Guest",
    "leaderboard.member": "Member",
    "leaderboard.memberRank": "Member #{rank}",
    "gameover.title": "GAME\nOVER",
    "gameover.score": "SCORE",
    "gameover.best": "RECORD",
  },
  vi: {
    "document.title": "Bộ Lạc Thú Nhún",
    "menu.play": "CHƠI NGAY",
    "settings.title": "CÀI ĐẶT",
    "settings.music": "ÂM NHẠC",
    "settings.sfx": "HIỆU ỨNG",
    "settings.language": "NGÔN NGỮ",
    "settings.english": "English",
    "settings.vietnamese": "Tiếng Việt",
    "revive.title": "BẠN CÓ MUỐN HỒI SINH KHÔNG?",
    "revive.yes": "CÓ",
    "revive.skip": "Không, cảm ơn",
    "leaderboard.title": "BẢNG VÀNG",
    "leaderboard.empty": "Chưa có thành tích. Hãy chơi để thiết lập kỷ lục đầu tiên.",
    "leaderboard.guest": "Bạn (Khách)",
    "leaderboard.member": "Thành viên",
    "leaderboard.memberRank": "Thành viên #{rank}",
    "gameover.title": "ÔI TIẾC\nQUÁ!",
    "gameover.score": "ĐIỂM SỐ",
    "gameover.best": "KỶ LỤC",
  },
};

function normalizeLanguage(value) {
  if (typeof value !== "string") return null;
  const base = value.trim().toLowerCase().split(/[-_]/)[0];
  return SUPPORTED_LANGUAGES.includes(base) ? base : null;
}

function readStoredLanguage() {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    return normalizeLanguage(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

export class I18nManager {
  constructor() {
    this.hasLocalOverride = Boolean(readStoredLanguage());
    this.language = readStoredLanguage() || "en";
    this.listeners = new Set();
    this.applyDocumentLanguage();
  }

  get currentLanguage() {
    return this.language;
  }

  applyDocumentLanguage() {
    if (globalThis.document?.documentElement) {
      document.documentElement.lang = this.language;
      const title = this.t("document.title");
      if (title) {
        document.title = title;
      }
    }
  }

  setLanguage(language, { persist = true } = {}) {
    const normalized = normalizeLanguage(language) || "en";
    if (persist) {
      try {
        if (typeof window !== "undefined" && window.localStorage) {
          window.localStorage.setItem(STORAGE_KEY, normalized);
        }
      } catch {
        // Fallback for isolated session
      }
    }
    if (normalized === this.language) return false;
    this.language = normalized;
    this.applyDocumentLanguage();
    for (const listener of this.listeners) {
      try {
        listener(normalized);
      } catch (err) {
        console.error("i18n listener failed:", err);
      }
    }
    return true;
  }

  syncFromWink(state) {
    if (state?.locale) {
      return this.setLanguage(state.locale, { persist: false });
    }
    return false;
  }

  t(key, variables = {}) {
    const dict = messages[this.language] || messages.en;
    const template = dict[key] ?? messages.en[key] ?? messages.vi[key] ?? key;
    return String(template).replace(/\{(\w+)\}/g, (_, name) =>
      variables[name] === undefined || variables[name] === null
        ? `{${name}}`
        : String(variables[name]),
    );
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export const i18n = new I18nManager();
export const t = (key, variables) => i18n.t(key, variables);
export { SUPPORTED_LANGUAGES };
