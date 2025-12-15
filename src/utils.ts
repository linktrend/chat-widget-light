export type ChatMessage = {
  id: string;
  author: 'user' | 'ai' | 'system';
  text: string;
  createdAt: string;
};

export function noop() {}

export const generateId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return (crypto as any).randomUUID();
  }

  // RFC4122-ish fallback
  const hex = () =>
    Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);

  return `${hex()}${hex()}-${hex()}-${hex()}-${hex()}-${hex()}${hex()}${hex()}`;
};

export const nowAsISOString = () => new Date().toISOString();

export const defaultTitle = 'AI Light';
export const defaultSubtitle = 'Ask me anything';
