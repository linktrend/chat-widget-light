## Next.js installation
- Install: `pnpm add ai-light-widget`
- If using React 17 with Next.js 13/14 app router, ensure `react`/`react-dom` peer versions align. The package ships ESM with a CJS fallback.
- Import with a client boundary: add `"use client"` to your component file if you render inside the app router.

## SSR-safe usage
- The widget expects `window` and `localStorage`; load it on the client only.
- Example (app router):
  ```tsx
  "use client";
  import dynamic from "next/dynamic";

  const ChatWidget = dynamic(() => import("ai-light-widget"), { ssr: false });

  export default function SupportWidget() {
    return (
      <ChatWidget
        tenantId="linktrend"
        aiEndpoint={process.env.NEXT_PUBLIC_AI_GATEWAY_URL!}
        primaryColor="#1890ff"
      />
    );
  }
  ```
- Page router: wrap usage in `useEffect` or a `dynamic(..., { ssr: false })` import to avoid server-side rendering.

## Setting tenantId per site
- Required prop: `tenantId` (string). Use a per-site identifier (e.g., slug or domain).
- Persisted data (sessionId, transcript, open state) are scoped by `tenantId`, so each derived site keeps its own conversation history.

## Derived site overrides (theme + branding)
- Optional props:
  - `primaryColor` to change button/window accent color.
  - `title` and `subtitle` to customize the header copy.
- Example:
  ```tsx
  <ChatWidget
    tenantId="factory-site-a"
    aiEndpoint={process.env.NEXT_PUBLIC_AI_GATEWAY_URL!}
    primaryColor="#7c3aed"
    title="Factory AI Copilot"
    subtitle="Ask about your site content"
  />
  ```

## Wiring to the AI gateway
- Required prop: `aiEndpoint` should point to your POST endpoint (see `docs/api-contract.md`).
- Recommend storing it in an env var such as `NEXT_PUBLIC_AI_GATEWAY_URL`.
- The widget sends `{ sessionId, tenantId, message, metadata }` as JSON; return `{ reply }`.
- You can attach site context via `metadata` (e.g., page path, locale).

## WidgetController open/close/toggle
- The library exports `WidgetController` with `open()`, `close()`, and `toggle()` helpers.
- These dispatch browser events listened to by the mounted widget.
- Example:
  ```tsx
  import { WidgetController } from "ai-light-widget";

  const openHelp = () => WidgetController.open();
  ```

## Troubleshooting & fallback behavior
- Validation: invalid props (e.g., missing `tenantId` or `aiEndpoint`) cause the widget to render nothing and log a warning.
- Network reachability: the widget makes a `HEAD` check to the endpoint; failures surface an inline error message.
- Request retry: message POSTs retry with backoff. If all attempts fail, a fallback reply is shown and the error is recorded.
- SSR guardrails: sending messages while rendering on the server is prevented and will log a warning.
- Storage: session ID, transcript, and open-state are persisted per `tenantId` using `localStorage`.
- If the AI gateway is unreachable, the user sees a friendly fallback reply and the widget stays usable for future attempts.
