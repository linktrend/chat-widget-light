## AI Gateway API Contract

### Endpoint
- Method: `POST`
- Path: your AI gateway endpoint (e.g., `process.env.NEXT_PUBLIC_AI_GATEWAY_URL`)
- Headers: `Content-Type: application/json` (add auth headers if required)

### Request body
```json
{
  "sessionId": "uuid",
  "tenantId": "string",
  "message": "string",
  "metadata": {}
}
```
- `sessionId`: opaque identifier persisted per tenant/site by the widget.
- `tenantId`: required site identifier.
- `message`: user text.
- `metadata`: optional contextual payload (e.g., page path, locale).

### Response body
```json
{ "reply": "string" }
```
- `reply`: text to render back in the chat. If missing or empty, the widget shows a built-in fallback reply.

### Notes
- Return non-2xx to signal failure; the widget will retry with backoff and then fall back gracefully.
- Keep responses small to preserve widget bundle size and network usage.
