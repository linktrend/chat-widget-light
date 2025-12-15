/** @jsx jsx */

import React from 'react';
import {jsx} from 'theme-ui';

import {ChatMessage} from '../utils';

const NAMESPACE = 'ai-light';

/* eslint-disable react/no-unknown-property */

type Props = {
  title: string;
  subtitle?: string;
  primaryColor?: string;
  messages: ChatMessage[];
  isSending: boolean;
  error: string | null;
  onSend: (text: string) => Promise<void>;
  onClearError: () => void;
};

const ChatUI = ({
  title,
  subtitle,
  primaryColor = '#1890ff',
  messages,
  isSending,
  error,
  onSend,
  onClearError,
}: Props) => {
  const [input, setInput] = React.useState('');
  const transcriptRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [messages, isSending]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const value = input.trim();

    if (!value || isSending) {
      return;
    }

    await onSend(value);
    setInput('');
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      await handleSubmit(e as any);
    }
  };

  const renderMessage = (message: ChatMessage) => {
    const isUser = message.author === 'user';
    const bubbleColor = isUser ? primaryColor : '#f5f5f5';
    const textColor = isUser ? '#fff' : '#141414';

    return (
      <div
        key={message.id}
        sx={{
          display: 'flex',
          justifyContent: isUser ? 'flex-end' : 'flex-start',
          mb: 2,
        }}
      >
        <div
          sx={{
            maxWidth: '80%',
            backgroundColor: bubbleColor,
            color: textColor,
            borderRadius: 12,
            px: 3,
            py: 2,
            fontSize: 1,
            boxShadow: isUser
              ? 'rgba(0, 0, 0, 0.12) 0px 1px 6px'
              : 'rgba(0, 0, 0, 0.05) 0px 1px 3px',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {message.text}
        </div>
      </div>
    );
  };

  return (
    <div
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'background',
      }}
    >
      <div
        sx={{
          borderBottom: '1px solid',
          borderColor: 'muted',
          p: 3,
          background: 'linear-gradient(135deg, #fff, #fafafa)',
        }}
      >
        <div sx={{fontSize: 2, fontWeight: 600, mb: 1}}>{title}</div>
        {subtitle ? (
          <div sx={{fontSize: 1, color: 'gray'}}>{subtitle}</div>
        ) : null}
      </div>

      <div
        ref={transcriptRef}
        className={`${NAMESPACE}__transcript`}
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 3,
          backgroundColor: '#fff',
        }}
        role='log'
        aria-live='polite'
        aria-relevant='additions text'
      >
        {messages.map(renderMessage)}

        {isSending ? (
          <div
            sx={{fontSize: 1, color: 'gray'}}
            aria-live='polite'
            role='status'
          >
            AI is thinking...
          </div>
        ) : null}
      </div>

      {error ? (
        <div
          id={`${NAMESPACE}-error`}
          sx={{
            px: 3,
            py: 2,
            color: '#d4380d',
            backgroundColor: '#fff1f0',
            borderTop: '1px solid #ffd8bf',
          }}
        >
          {error}
          <button
            type='button'
            onClick={onClearError}
            sx={{
              marginLeft: 8,
              background: 'transparent',
              border: 'none',
              color: primaryColor,
              cursor: 'pointer',
            }}
          >
            Dismiss
          </button>
        </div>
      ) : null}

      <form
        onSubmit={handleSubmit}
        sx={{
          display: 'flex',
          alignItems: 'center',
          borderTop: '1px solid',
          borderColor: 'muted',
          px: 3,
          py: 2,
          gap: 2,
        }}
      >
        <textarea
          aria-label='Chat message'
          value={input}
          onChange={(e) => {
            if (error) {
              onClearError();
            }

            setInput(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          placeholder='Type your message...'
          disabled={isSending}
          aria-describedby={error ? `${NAMESPACE}-error` : undefined}
          sx={{
            flex: 1,
            border: '1px solid',
            borderColor: 'muted',
            borderRadius: 8,
            padding: '10px 12px',
            fontSize: 1,
            outline: 'none',
            minHeight: 44,
            resize: 'none',
            '&:focus': {
              borderColor: primaryColor,
              boxShadow: `0 0 0 2px ${primaryColor}33`,
            },
            '&:disabled': {
              backgroundColor: '#f5f5f5',
              cursor: 'not-allowed',
            },
          }}
        />

        <button
          type='submit'
          disabled={!input.trim() || isSending}
          sx={{
            border: 'none',
            borderRadius: 8,
            padding: '10px 14px',
            backgroundColor: primaryColor,
            color: '#fff',
            cursor: isSending ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            transition: 'opacity 0.2s ease',
            opacity: !input.trim() || isSending ? 0.6 : 1,
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatUI;
