# portfolio-chatbot-widget

This folder contains the standalone chatbot widget, used as a submodule in other projects. For usage and integration instructions, see the main README.

## Submodule Usage

This widget is intended to be included as a git submodule in other repositories (e.g., portfolio-chatbot, static Portfolio website).

### How to Add as Submodule

```
git submodule add <widget-repo-url> widget
```

### How to Update Submodule

```
git submodule update --remote widget
```

### How to Initialize Submodules After Cloning

```
git submodule update --init --recursive
```

For more details, see the main project documentation.

## Quick start (embedding)

Add the stylesheet and script to your page:

```html
<link rel="stylesheet" href="widget/chatbot-widget.css" />
<script defer src="env-loader.js"></script>
<script defer src="widget/chatbot-widget.js"></script>
```

By default, the widget injects a floating button (💬) in the bottom-right corner. Clicking it opens the chat.

### Configure the API endpoint

The widget looks for the endpoint in this order:

1. `window.CHATBOT_API`
2. `getEnv('CHATBOT_API')` (if you load an `env-loader.js` that exposes `window.getEnv`)

Examples:

```html
<!-- Option A: via env loader and .env at project root -->
<!-- .env: CHATBOT_API=https://<api-id>.execute-api.<region>.amazonaws.com/prod/chat -->
<script defer src="env-loader.js"></script>

<!-- Option B: set directly -->
<script>window.CHATBOT_API = 'https://<api-id>.execute-api.<region>.amazonaws.com/prod/chat';</script>
```

### Configure FAQ items (optional)

You can provide a list of frequently asked questions that appear when users click the FAQ button in the header.
The widget will read from either of these globals (first non-empty wins):

- `window.PortfolioChatbotConfig.faqs`
- `window.siteContent.chatbot.faqs`

Example:

```js
window.siteContent = window.siteContent || {};
window.siteContent.chatbot = window.siteContent.chatbot || {};
window.siteContent.chatbot.faqs = [
	'What are your key projects?',
	'What AI/Machine Learning projects have you worked on?',
	'What certifications do you have?',
	'How can I contact you?'
];
```

If not provided, the widget uses a sensible default list.

### Health check (backend)

The server provides a `GET /status` endpoint for quick verification.

```bash
curl -sS https://<api-id>.execute-api.<region>.amazonaws.com/prod/status
```

If you see `{"status":"ok",...}`, your API is reachable and configured.

### Notes

- When opening the HTML file directly with the `file://` protocol, network requests and CORS may fail. Use a local web server (e.g., `python -m http.server`).
- The widget attempts to load its CSS from `widget/chatbot-widget.css`. If you serve it from a different path, adjust the `<link>` tag accordingly.
