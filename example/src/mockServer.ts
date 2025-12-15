type FetchInput = RequestInfo | URL;

export const setupMockServer = () => {
  if (typeof window === 'undefined' || typeof window.fetch !== 'function') {
    return;
  }

  const originalFetch = window.fetch.bind(window);
  const mockUrlSuffix = '/api/mock/chat/light';

  window.fetch = async (input: FetchInput, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();

    if (url.endsWith(mockUrlSuffix)) {
      try {
        const body = init?.body ? JSON.parse(init.body as string) : {};
        const message = body?.message || '';

        const reply = `Echo: ${message}`;

        return new Response(JSON.stringify({reply}), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        });
      } catch (err) {
        return new Response(JSON.stringify({reply: 'Mock server error'}), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }
    }

    return originalFetch(input as any, init);
  };
};
