# Business AI Audit — by ATL.AI

> A lightweight, open-source conversational audit tool that helps businesses identify AI automation opportunities in minutes.

## What it does

A 4-step onboarding flow that collects business context, sends it to an AI model, and generates a personalized report showing:

- Top 3 AI automation opportunities
- Estimated ROI and hours saved
- Recommended first system to build
- Implementation timeline

## Demo

Live version: [atl.ai/analysis](https://atl.ai/analysis)

## Stack

- Vanilla HTML, CSS, JavaScript — zero frameworks
- Anthropic Claude API (claude-sonnet) for report generation
- Google Sheets via Apps Script for lead capture (optional)
- Fully static — deployable on Vercel, Netlify, or GitHub Pages

## Getting Started

### 1. Clone the repo
```bash
git clone https://github.com/atlaihq/business-ai-audit.git
cd business-ai-audit
```

### 2. Add your API key
Open `analysis.js` and replace:
```js
const ANTHROPIC_API_KEY = "YOUR_API_KEY_HERE";
```

Get your key at: https://platform.anthropic.com/api-keys

> ⚠️ Never commit your real API key. Use environment variables in production.

### 3. Open locally
Use VS Code Live Server or any static server:
```bash
npx serve .
```

### 4. (Optional) Connect Google Sheets
To save responses to a spreadsheet, deploy a Google Apps Script web app and replace:
```js
const SHEETS_URL = "YOUR_APPS_SCRIPT_URL_HERE";
```

See `/docs/sheets-setup.md` for full instructions.

## File Structure

```
business-ai-audit/
├── analysis.html      # Main page
├── analysis.css       # All styles
├── analysis.js        # Chat flow + API call
├── docs/
│   └── sheets-setup.md
└── README.md
```

## Customization

All questions, styles, and report structure are easy to modify inside `analysis.js`.
The system prompt sent to Claude is clearly labeled and documented.

## Security Notes

- Never expose your Anthropic API key on the frontend in production
- For production use, proxy API calls through a backend (Vercel Edge Functions, Cloudflare Workers, etc.)
- This repo is intended as a reference implementation

## License

MIT — free to use, modify, and deploy.

---

Built by [ATL.AI](https://atl.ai) — Custom AI Infrastructure for Ambitious Businesses.
