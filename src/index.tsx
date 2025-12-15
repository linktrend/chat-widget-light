import ChatWidget from './components/ChatWidget';
import ChatWindow from './components/ChatWindow';
import {
  CLOSE_EVENT,
  OPEN_EVENT,
  TOGGLE_EVENT,
} from './components/ChatWidgetContainer';

const dispatchIfBrowser = (eventName: string) => {
  if (typeof window === 'undefined' || typeof Event === 'undefined') {
    return;
  }

  window.dispatchEvent(new Event(eventName));
};

export const open = () => dispatchIfBrowser(OPEN_EVENT);
export const close = () => dispatchIfBrowser(CLOSE_EVENT);
export const toggle = () => dispatchIfBrowser(TOGGLE_EVENT);

export const WidgetController = {
  open,
  close,
  toggle,
};

export {ChatWidget, ChatWindow};
export type {LightWidgetProps} from './components/ChatWidgetContainer';

export default ChatWidget;
