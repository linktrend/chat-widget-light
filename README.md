# AI Light Widget

Native React chat widget powered by an AI backend. No iframes and no legacy vendor dependencies.

## Install

```bash
npm install --save ai-light-widget
```

## Usage (React)

```tsx
import React from 'react';
import {ChatWidget, WidgetController} from 'ai-light-widget';

const ExamplePage = () => {
  return (
    <>
      <ChatWidget
        tenantId="your-tenant-id"
        aiEndpoint="https://api.yourdomain.com/api/chat/light"
        title="AI Light Widget"
        subtitle="Ask me anything"
        primaryColor="#1890ff"
        metadata={{page: 'pricing'}}
        isOpenByDefault={false}
      />

      <button onClick={WidgetController.open}>Open</button>
      <button onClick={WidgetController.close}>Close</button>
      <button onClick={WidgetController.toggle}>Toggle</button>
    </>
  );
};
```

### Props

```ts
interface LightWidgetProps {
  tenantId: string;          // required
  aiEndpoint: string;        // required, POST /api/chat/light
  title?: string;
  subtitle?: string;
  primaryColor?: string;
  metadata?: Record<string, any>;
  isOpenByDefault?: boolean;
}
```

`WidgetController.open/close/toggle` programmatically control the floating widget via DOM events.

### Next.js (SSR-safe)

```tsx
import dynamic from 'next/dynamic';

const ChatWidget = dynamic(
  () => import('ai-light-widget').then((m) => m.ChatWidget),
  {ssr: false}
);

export default function Layout() {
  return (
    <ChatWidget
      tenantId='your-tenant-id'
      aiEndpoint='https://api.yourdomain.com/api/chat/light'
      primaryColor='#1890ff'
    />
  );
}
```

## Development

```bash
npm install
npm start
```

To run the example:

```bash
cd example
npm install
npm start
```

The example expects a reachable `aiEndpoint` that implements `POST /api/chat/light` and returns `{ reply: string }`.
