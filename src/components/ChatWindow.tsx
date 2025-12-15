/** @jsx jsx */

import {jsx} from 'theme-ui';

import ChatWidgetContainer, {LightWidgetProps} from './ChatWidgetContainer';
import ErrorBoundary from './ErrorBoundary';
import ChatUI from './ChatUI';

const NAMESPACE = 'ai-light';

/* eslint-disable react/no-unknown-property */

type Props = LightWidgetProps & {};

const ChatWindow = (props: Props) => {
  return (
    <ErrorBoundary>
      <ChatWidgetContainer {...props} canToggle={false}>
        {(config) => {
          const {
            isLoaded,
            messages,
            isSending,
            error,
            title,
            subtitle,
            primaryColor,
            sendMessage,
            clearError,
          } = config;

          return (
            <div
              className={`${NAMESPACE}__chat-window-container`}
              sx={{
                opacity: isLoaded ? 1 : 0,
                bg: 'background',
                variant: 'styles.ChatWindowContainer',
                border: '1px solid',
                borderColor: 'muted',
                borderRadius: 8,
                overflow: 'hidden',
                isolation: 'isolate',
              }}
            >
              <ChatUI
                title={title}
                subtitle={subtitle}
                primaryColor={primaryColor}
                messages={messages}
                isSending={isSending}
                error={error}
                onSend={sendMessage}
                onClearError={clearError}
              />
            </div>
          );
        }}
      </ChatWidgetContainer>
    </ErrorBoundary>
  );
};

export default ChatWindow;
