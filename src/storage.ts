// TODO: do something different for dev vs prod
const PREFIX = '__AI_LIGHT__';
const MAX_MESSAGES = 200;

type StorageType = 'local' | 'session' | 'cookie' | 'memory' | 'none' | null;

type RawStorage = {
  getItem: (key: string) => any;
  setItem: (key: string, value: any) => void;
  removeItem: (key: string) => any;
};

interface Storage {
  get: (key: string) => any;
  set: (key: string, value: any) => void;
  remove: (key: string) => any;
}

const checksum = (value: any) => {
  try {
    const serialized = JSON.stringify(value);
    let hash = 0;
    for (let i = 0; i < serialized.length; i += 1) {
      hash = (hash << 5) - hash + serialized.charCodeAt(i);
      hash |= 0; // force 32-bit
    }
    return hash.toString(16);
  } catch (e) {
    return '0';
  }
};

const encode = (value: any) =>
  JSON.stringify({
    value,
    checksum: checksum(value),
  });

const safeParse = (value: string | null) => {
  if (!value) {
    return {ok: false, value: null};
  }

  try {
    const parsed = JSON.parse(value);
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      !('value' in parsed) ||
      !('checksum' in parsed)
    ) {
      return {ok: false, value: null};
    }

    const matches = parsed.checksum === checksum(parsed.value);
    return {ok: !!matches, value: matches ? parsed.value : null};
  } catch (e) {
    return {ok: false, value: null};
  }
};

const createFallbackStorage = (): RawStorage => {
  const db: Record<string, any> = {};
  return {
    getItem(key: string) {
      return key in db ? db[key] : null;
    },
    setItem(key: string, value: any) {
      db[key] = value;
    },
    removeItem(key: string) {
      delete db[key];
    },
  };
};

const wrapStorage = (storage: RawStorage): Storage => ({
  get: (key: string) => {
    const parsed = safeParse(storage.getItem(`${PREFIX}${key}`));
    if (!parsed.ok) {
      storage.removeItem(`${PREFIX}${key}`);
    }
    return parsed.value;
  },
  set: (key: string, value: any) =>
    storage.setItem(`${PREFIX}${key}`, encode(value)),
  remove: (key: string) => storage.removeItem(`${PREFIX}${key}`),
});

const useLocalStorage = (w: any): Storage => {
  try {
    const storage = w && w.localStorage;
    if (!storage) {
      throw new Error('No localStorage available');
    }
    return wrapStorage(storage);
  } catch (e) {
    return wrapStorage(createFallbackStorage());
  }
};

const useSessionStorage = (w: any): Storage => {
  try {
    const storage = w && w.sessionStorage;
    if (!storage) {
      throw new Error('No sessionStorage available');
    }
    return wrapStorage(storage);
  } catch (e) {
    return wrapStorage(createFallbackStorage());
  }
};

const useCookieStorage = (): Storage => {
  try {
    throw new Error('Cookie storage has not been implemented!');
  } catch (e) {
    return wrapStorage(createFallbackStorage());
  }
};

const getPreferredStorage = (w: any, type: StorageType = 'local'): Storage => {
  try {
    if (!w) {
      return wrapStorage(createFallbackStorage());
    }

    switch (type) {
      case 'local':
        return useLocalStorage(w);
      case 'session':
        return useSessionStorage(w);
      case 'cookie':
        return useCookieStorage();
      case 'memory':
      default:
        return wrapStorage(createFallbackStorage());
    }
  } catch (e) {
    return wrapStorage(createFallbackStorage());
  }
};

const sessionKey = (tenantId: string) => `[${tenantId}].session`;
const transcriptKey = (tenantId: string) => `[${tenantId}].messages`;
const openStateKey = (tenantId: string) => `[${tenantId}].open`;

export default function store(
  w: any,
  options: {defaultType?: StorageType; openStateType?: StorageType} = {}
) {
  const {defaultType = 'local', openStateType = 'session'} = options;
  const defaultStorage = getPreferredStorage(w, defaultType);
  const openStateStorage = getPreferredStorage(w, openStateType);

  return {
    getSessionId: (tenantId: string) => defaultStorage.get(sessionKey(tenantId)),
    setSessionId: (tenantId: string, id: string) =>
      defaultStorage.set(sessionKey(tenantId), id),
    clearSessionId: (tenantId: string) =>
      defaultStorage.remove(sessionKey(tenantId)),
    getTranscript: (tenantId: string) =>
      (() => {
        const raw = defaultStorage.get(transcriptKey(tenantId));
        if (!Array.isArray(raw)) {
          return [];
        }

        return raw.slice(-MAX_MESSAGES);
      })(),
    setTranscript: (tenantId: string, transcript: any[]) =>
      defaultStorage.set(
        transcriptKey(tenantId),
        Array.isArray(transcript)
          ? transcript.slice(-MAX_MESSAGES)
          : []
      ),
    clearTranscript: (tenantId: string) =>
      defaultStorage.remove(transcriptKey(tenantId)),
    getOpenState: (tenantId: string) =>
      openStateStorage.get(openStateKey(tenantId)),
    setOpenState: (tenantId: string, state: string | boolean) =>
      openStateStorage.set(openStateKey(tenantId), state),
    clearOpenState: (tenantId: string) =>
      openStateStorage.remove(openStateKey(tenantId)),
  };
}
