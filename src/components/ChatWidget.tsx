/** @jsx jsx */

import React, {CSSProperties} from 'react';
import {motion} from 'framer-motion';
import {jsx} from 'theme-ui';

import WidgetToggle from './WidgetToggle';
import ChatWidgetContainer, {LightWidgetProps} from './ChatWidgetContainer';
import ErrorBoundary from './ErrorBoundary';
import ChatUI from './ChatUI';

type ToggleButtonOptions = {
  isOpen: boolean;
  isDisabled: boolean;
  onToggleOpen: () => void;
};

type StyleOverrides = {
  chatContainer?: CSSProperties;
  toggleContainer?: CSSProperties;
  toggleButton?: CSSProperties;
};

type PositionConfig = {
  side: 'left' | 'right';
  offset: number;
};

const DEFAULT_X_OFFSET = 20;
const NAMESPACE = 'ai-light';

const normalizePositionConfig = (
  position?: 'left' | 'right' | PositionConfig
): PositionConfig => {
  if (!position) {
    return {side: 'right', offset: DEFAULT_X_OFFSET};
  }

  switch (position) {
    case 'left':
      return {side: 'left', offset: DEFAULT_X_OFFSET};
    case 'right':
      return {side: 'right', offset: DEFAULT_X_OFFSET};
    default:
      return position;
  }
};

const getDefaultStyles = (
  styles: StyleOverrides = {},
  position: PositionConfig
): StyleOverrides => {
  const {
    chatContainer: chatContainerStyle = {},
    toggleContainer: toggleContainerStyle = {},
    toggleButton: toggleButtonStyle = {},
  } = styles;
  const {side = 'right', offset = DEFAULT_X_OFFSET} = position;

  switch (side) {
    case 'left':
      return {
        chatContainer: {left: offset, right: 'auto', ...chatContainerStyle},
        toggleContainer: {left: offset, right: 'auto', ...toggleContainerStyle},
        toggleButton: toggleButtonStyle,
      };
    case 'right':
    default:
      return {
        chatContainer: {right: offset, left: 'auto', ...chatContainerStyle},
        toggleContainer: {right: offset, left: 'auto', ...toggleContainerStyle},
        toggleButton: toggleButtonStyle,
      };
  }
};

type Props = LightWidgetProps & {
  hideToggleButton?: boolean;
  iconVariant?: 'outlined' | 'filled';
  position?: 'left' | 'right' | PositionConfig;
  renderToggleButton?: (options: ToggleButtonOptions) => React.ReactElement;
  styles?: StyleOverrides;
};

const ChatWidget = (props: Props) => {
  return (
    <ErrorBoundary>
      <ChatWidgetContainer {...props} canToggle>
        {(config) => {
          const {
            isLoaded,
            isOpen,
            isSending,
            messages,
            error,
            title,
            subtitle,
            primaryColor,
            sendMessage,
            toggle,
            clearError,
          } = config;
          const {
            hideToggleButton,
            iconVariant,
            renderToggleButton,
            position = 'right',
            styles = {},
          } = props;

          const positionConfig = normalizePositionConfig(position);
          const {
            chatContainer: chatContainerStyle = {},
            toggleContainer: toggleContainerStyle = {},
            toggleButton: toggleButtonStyle = {},
          } = getDefaultStyles(styles, positionConfig);
          const hiddenStyle = {
            pointerEvents: 'none',
            height: 0,
            minHeight: 0,
          } as any;

          return (
            <React.Fragment>
              <motion.div
                className={`${NAMESPACE}__chat-window-container`}
                animate={isOpen ? 'open' : 'closed'}
                initial='closed'
                variants={{
                  closed: {opacity: 0, y: 4},
                  open: {opacity: 1, y: 0},
                }}
                transition={{duration: 0.2, ease: 'easeIn'}}
                style={(isOpen ? chatContainerStyle : hiddenStyle) as any}
                sx={{
                  bg: 'background',
                  variant: 'styles.WidgetContainer',
                  overflow: 'hidden',
                  isolation: 'isolate',
                }}
                data-ai-light-root
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
              </motion.div>

              {isLoaded && !hideToggleButton && (
                <motion.div
                  className={`${NAMESPACE}__toggle-container`}
                  initial={false}
                  style={toggleContainerStyle}
                  animate={isOpen ? 'open' : 'closed'}
                  sx={{
                    variant: 'styles.WidgetToggleContainer',
                  }}
                >
                  {renderToggleButton &&
                  typeof renderToggleButton === 'function' ? (
                    renderToggleButton({
                      isOpen,
                      onToggleOpen: toggle,
                      isDisabled: isSending,
                    })
                  ) : (
                    <WidgetToggle
                      style={toggleButtonStyle}
                      isDisabled={isSending}
                      isOpen={isOpen}
                      customIconUrl={undefined}
                      iconVariant={iconVariant}
                      toggle={toggle}
                    />
                  )}
                </motion.div>
              )}
            </React.Fragment>
          );
        }}
      </ChatWidgetContainer>
    </ErrorBoundary>
  );
};

export default ChatWidget;
