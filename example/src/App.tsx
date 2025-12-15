import React from 'react';

import {ChatWidget, ChatWindow, WidgetController} from 'ai-light-widget';
import {setupMockServer} from './mockServer';

const DEMO_TENANT_ID = 'demo-tenant';
const DEMO_AI_ENDPOINT = '/api/mock/chat/light';

type Props = {disco?: boolean; displayChatWindow?: boolean};

const App = ({disco, displayChatWindow}: Props) => {
  const colors = [
    '#1890ff',
    '#f5222d',
    '#7cb305',
    '#52c41a',
    '#13c2c2',
    '#722ed1',
    '#eb2f96',
  ];

  const [primaryColor, setPrimaryColor] = React.useState(colors[0]);

  React.useEffect(() => {
    setupMockServer();
  }, []);

  React.useEffect(() => {
    if (!disco) {
      return;
    }

    const interval = setInterval(() => {
      const idx = colors.indexOf(primaryColor);
      const next = (idx + 1) % (colors.length - 1);

      setPrimaryColor(colors[next]);
    }, 2000);

    return () => clearInterval(interval);
  }, [disco, colors, primaryColor]);

  return (
    <>
      {displayChatWindow ? (
        <div
          style={{
            padding: 32,
            height: 480,
            width: '50%',
            minWidth: 320,
            maxWidth: 400,
          }}
        >
          <ChatWindow
            tenantId={DEMO_TENANT_ID}
            aiEndpoint={DEMO_AI_ENDPOINT}
            title='AI Light Widget'
            subtitle='Always-open window'
            primaryColor={primaryColor}
            metadata={{page: 'demo-chat-window'}}
          />
        </div>
      ) : (
        <ChatWidget
          tenantId={DEMO_TENANT_ID}
          aiEndpoint={DEMO_AI_ENDPOINT}
          title='AI Light Widget'
          subtitle='Ask me anything'
          primaryColor={primaryColor}
          isOpenByDefault
          metadata={{page: 'demo-widget'}}
        />
      )}

      <div style={{marginTop: 24}}>
        <button onClick={WidgetController.open} style={{marginRight: 8}}>
          Open
        </button>
        <button onClick={WidgetController.close} style={{marginRight: 8}}>
          Close
        </button>
        <button onClick={WidgetController.toggle}>Toggle</button>
      </div>
    </>
  );
};

export default App;
