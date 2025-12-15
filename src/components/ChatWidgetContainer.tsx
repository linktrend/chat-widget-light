/** @jsx jsx */

import React from 'react';
import {ThemeProvider, jsx} from 'theme-ui';
import {z} from 'zod';

import getThemeConfig from '../theme';
import store from '../storage';
import Logger from '../logger';
import {
  ChatMessage,
  defaultSubtitle,
  defaultTitle,
  generateId,
  nowAsISOString,
} from '../utils';

export const OPEN_EVENT = 'ai-light:open';
export const CLOSE_EVENT = 'ai-light:close';
export const TOGGLE_EVENT = 'ai-light:toggle';
const MAX_MESSAGES = 200;
const FALLBACK_REPLY = 'I am having trouble reaching the server right now.';

type EndpointHealth = 'unknown' | 'reachable' | 'unreachable';

const lightWidgetPropsSchema = z.object({
  tenantId: z.string().min(1, 'tenantId is required'),
  aiEndpoint: z.string().min(1, 'aiEndpoint is required'),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  primaryColor: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  isOpenByDefault: z.boolean().optional(),
  debug: z.boolean().optional(),
});

const formatIssues = (issues: z.ZodIssue[]) =>
  issues
    .map((issue) => `${issue.path.join('.') || 'prop'}: ${issue.message}`)
    .join(' | ');

const sliceMessages = (messages: ChatMessage[]) =>
  Array.isArray(messages) ? messages.slice(-MAX_MESSAGES) : [];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export type LightWidgetProps = {
  tenantId: string;
  aiEndpoint: string;
  title?: string;
  subtitle?: string;
  primaryColor?: string;
  metadata?: Record<string, any>;
  isOpenByDefault?: boolean;
  debug?: boolean;
};

export type ContainerRenderProps = {
  isOpen: boolean;
  isLoaded: boolean;
  isSending: boolean;
  messages: ChatMessage[];
  error: string | null;
  sessionId: string;
  tenantId: string;
  title: string;
  subtitle: string;
  primaryColor?: string;
  metadata?: Record<string, any>;
  open: () => void;
  close: () => void;
  toggle: () => void;
  sendMessage: (text: string) => Promise<void>;
  clearError: () => void;
};

type Props = LightWidgetProps & {
  canToggle: boolean;
  children: (data: ContainerRenderProps) => React.ReactElement;
};

const ChatWidgetContainer = ({
  tenantId,
  aiEndpoint,
  title = defaultTitle,
  subtitle = defaultSubtitle,
  primaryColor = '#1890ff',
  metadata = {},
  isOpenByDefault = false,
  debug = false,
  canToggle,
  children,
}: Props) => {
  const isBrowser = typeof window !== 'undefined';
  const validation = React.useMemo(() => {
    const result = lightWidgetPropsSchema.safeParse({
      tenantId,
      aiEndpoint,
      title,
      subtitle,
      primaryColor,
      metadata,
      isOpenByDefault,
      debug,
    });

    return {
      isValid: result.success,
      data: result.success ? result.data : null,
      message: result.success ? null : formatIssues(result.error.issues),
    };
  }, [
    aiEndpoint,
    debug,
    isOpenByDefault,
    metadata,
    primaryColor,
    subtitle,
    tenantId,
    title,
  ]);

  const effectiveTenantId =
    validation.data?.tenantId || tenantId || 'unknown-tenant';
  const effectiveAiEndpoint = validation.data?.aiEndpoint || aiEndpoint;
  const effectiveTitle = validation.data?.title ?? title ?? defaultTitle;
  const effectiveSubtitle =
    validation.data?.subtitle ?? subtitle ?? defaultSubtitle;
  const effectivePrimaryColor =
    validation.data?.primaryColor ?? primaryColor ?? '#1890ff';
  const effectiveMetadata = validation.data?.metadata ?? metadata ?? {};
  const effectiveIsOpenByDefault =
    validation.data?.isOpenByDefault ?? isOpenByDefault;
  const effectiveDebug = validation.data?.debug ?? debug;

  const loggerRef = React.useRef(new Logger(effectiveDebug));
  const storage = React.useMemo(
    () => store(isBrowser ? window : undefined),
    [isBrowser]
  );
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [sessionId, setSessionId] = React.useState<string>(() => {
    const existing = storage.getSessionId(effectiveTenantId);

    if (existing) {
      return existing;
    }

    const next = generateId();

    storage.setSessionId(effectiveTenantId, next);

    return next;
  });
  const [messages, setMessages] = React.useState<ChatMessage[]>(() => {
    const transcript = storage.getTranscript(effectiveTenantId);

    return Array.isArray(transcript) ? transcript.slice(-MAX_MESSAGES) : [];
  });
  const [isSending, setIsSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isOpen, setIsOpen] = React.useState<boolean>(() => {
    if (!canToggle) {
      return true;
    }

    const cached = storage.getOpenState(effectiveTenantId);

    if (typeof cached === 'boolean') {
      return cached;
    }

    return !!effectiveIsOpenByDefault;
  });
  const endpointStatusRef = React.useRef<EndpointHealth>('unknown');

  React.useEffect(() => {
    loggerRef.current.debugModeEnabled = !!effectiveDebug;
  }, [effectiveDebug]);

  React.useEffect(() => {
    if (!validation.isValid && validation.message) {
      loggerRef.current.warn(
        'AI Light widget received invalid props. Using safe fallbacks.',
        validation.message
      );
    }
  }, [validation]);

  React.useEffect(() => {
    setIsLoaded(isBrowser);
  }, [isBrowser]);

  React.useEffect(() => {
    const next = storage.getSessionId(effectiveTenantId);

    if (next && next !== sessionId) {
      setSessionId(next);
    } else if (!next) {
      const created = generateId();

      storage.setSessionId(effectiveTenantId, created);
      setSessionId(created);
    }
  }, [effectiveTenantId, sessionId, storage]);

  React.useEffect(() => {
    const transcript = storage.getTranscript(effectiveTenantId);

    setMessages(Array.isArray(transcript) ? transcript : []);
  }, [effectiveTenantId, storage]);

  React.useEffect(() => {
    storage.setOpenState(effectiveTenantId, isOpen);
  }, [effectiveTenantId, isOpen, storage]);

  React.useEffect(() => {
    storage.setTranscript(effectiveTenantId, messages);
  }, [effectiveTenantId, messages, storage]);

  React.useEffect(() => {
    endpointStatusRef.current = 'unknown';
  }, [effectiveAiEndpoint]);

  const open = React.useCallback(() => {
    if (!canToggle) {
      return;
    }

    setIsOpen(true);
  }, [canToggle]);

  const close = React.useCallback(() => {
    if (!canToggle) {
      return;
    }

    setIsOpen(false);
  }, [canToggle]);

  const toggle = React.useCallback(() => {
    if (!canToggle) {
      return;
    }

    setIsOpen((prev) => !prev);
  }, [canToggle]);

  const ensureEndpointReachable = React.useCallback(async () => {
    if (endpointStatusRef.current === 'reachable') {
      return true;
    }

    if (endpointStatusRef.current === 'unreachable') {
      return false;
    }

    if (!isBrowser || !effectiveAiEndpoint) {
      return false;
    }

    let timeoutId: number | undefined;

    try {
      const controller = new AbortController();
      timeoutId = window.setTimeout(() => controller.abort(), 3000);
      const response = await fetch(effectiveAiEndpoint, {
        method: 'HEAD',
        signal: controller.signal,
      });
      window.clearTimeout(timeoutId);

      const reachable = !!response;
      endpointStatusRef.current = reachable ? 'reachable' : 'unreachable';
      if (!reachable) {
        setError('AI service appears unreachable. Please try again later.');
      }
      return reachable;
    } catch (err) {
      if (typeof timeoutId === 'number') {
        window.clearTimeout(timeoutId);
      }
      endpointStatusRef.current = 'unreachable';
      setError('AI service appears unreachable. Please try again later.');
      loggerRef.current.warn('AI endpoint appears unreachable.', err);
      return false;
    }
  }, [effectiveAiEndpoint, isBrowser]);

  React.useEffect(() => {
    if (!isBrowser) {
      return;
    }

    ensureEndpointReachable();
  }, [ensureEndpointReachable, isBrowser]);

  React.useEffect(() => {
    if (!isBrowser) {
      return;
    }

    const handleOpen = () => open();
    const handleClose = () => close();
    const handleToggle = () => toggle();

    window.addEventListener(OPEN_EVENT, handleOpen);
    window.addEventListener(CLOSE_EVENT, handleClose);
    window.addEventListener(TOGGLE_EVENT, handleToggle);

    return () => {
      window.removeEventListener(OPEN_EVENT, handleOpen);
      window.removeEventListener(CLOSE_EVENT, handleClose);
      window.removeEventListener(TOGGLE_EVENT, handleToggle);
    };
  }, [isBrowser, open, close, toggle]);

  const retryWithBackoff = React.useCallback(
    async <T,>(
      fn: () => Promise<T>,
      retries = 2,
      baseDelayMs = 250,
      maxDelayMs = 2000
    ) => {
      let attempt = 0;
      let lastError: unknown = null;

      while (attempt <= retries) {
        try {
          return await fn();
        } catch (err) {
          lastError = err;
          if (attempt === retries) {
            break;
          }
          const waitMs = Math.min(baseDelayMs * 2 ** attempt, maxDelayMs);
          await delay(waitMs);
        }
        attempt += 1;
      }

      throw lastError;
    },
    []
  );

  const sendMessage = React.useCallback(
    async (text: string) => {
      const trimmed = text.trim();

      if (!trimmed) {
        return;
      }

      if (!isBrowser) {
        loggerRef.current.warn(
          'Ignoring sendMessage during SSR render; browser APIs unavailable.'
        );
        setError('Cannot send messages while rendering on the server.');
        return;
      }

      const userMessage: ChatMessage = {
        id: generateId(),
        author: 'user',
        text: trimmed,
        createdAt: nowAsISOString(),
      };

      setMessages((current) => sliceMessages([...current, userMessage]));
      setIsSending(true);
      setError(null);

      try {
        const payload = {
          sessionId,
          tenantId: effectiveTenantId,
          message: trimmed,
          metadata: effectiveMetadata || {},
        };

        const reachable = await ensureEndpointReachable();

        if (!reachable) {
          const aiMessage: ChatMessage = {
            id: generateId(),
            author: 'ai',
            text: FALLBACK_REPLY,
            createdAt: nowAsISOString(),
          };
          setMessages((current) => sliceMessages([...current, aiMessage]));
          setError(
            'Unable to reach the AI service. Displaying a fallback reply.'
          );
          return;
        }

        const attemptRequest = async () => {
          const response = await fetch(effectiveAiEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          });

          if (!response || !response.ok) {
            throw new Error(`Request failed: ${response?.status}`);
          }

          const data = await response.json();
          return data?.reply;
        };

        const reply = await retryWithBackoff(attemptRequest, 2);
        const finalReply = reply || FALLBACK_REPLY;

        const aiMessage: ChatMessage = {
          id: generateId(),
          author: 'ai',
          text: finalReply,
          createdAt: nowAsISOString(),
        };

        setMessages((current) => sliceMessages([...current, aiMessage]));

        if (!reply) {
          setError(
            'Unable to reach the AI service. Displaying a fallback reply.'
          );
        }
      } catch (err) {
        loggerRef.current.error('Failed to send message', err);
        const aiMessage: ChatMessage = {
          id: generateId(),
          author: 'ai',
          text: FALLBACK_REPLY,
          createdAt: nowAsISOString(),
        };
        setMessages((current) => sliceMessages([...current, aiMessage]));
        setError(
          'Unable to reach the AI service. Displaying a fallback reply.'
        );
      } finally {
        setIsSending(false);
      }
    },
    [
      effectiveAiEndpoint,
      effectiveMetadata,
      effectiveTenantId,
      ensureEndpointReachable,
      isBrowser,
      retryWithBackoff,
      sessionId,
    ]
  );

  const clearError = React.useCallback(() => setError(null), []);
  const theme = React.useMemo(
    () => getThemeConfig({primary: effectivePrimaryColor}),
    [effectivePrimaryColor]
  );

  if (!validation.isValid) {
    return null;
  }

  return (
    <ThemeProvider theme={theme}>
      {children({
        isOpen: canToggle ? isOpen : true,
        isLoaded,
        isSending,
        messages,
        error,
        sessionId,
        tenantId: effectiveTenantId,
        title: effectiveTitle,
        subtitle: effectiveSubtitle,
        primaryColor: effectivePrimaryColor,
        metadata: effectiveMetadata,
        open,
        close,
        toggle,
        sendMessage,
        clearError,
      })}
    </ThemeProvider>
  );
};

export default ChatWidgetContainer;
