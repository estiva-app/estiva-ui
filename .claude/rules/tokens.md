---
paths:
  - "tokens.css"
  - "tailwind-preset.js"
  - "tailwind.config.js"
  - "tokens.test.ts"
  - "src/cn.ts"
  - "src/cn.test.ts"
---

# Tokens

Loads when you read a token file, the preset, or `cn()`.
`npm run lint`, `tokens.test.ts` and `cn.test.ts` check the rest.

- A designed transparent colour (a wash, an outline, a glow, the scrim) is a token of its own, defined in every theme block (D16). If the one you need is missing, add it; do not approximate it with a modifier or a `-muted` colour.
- `tokens.test.ts`: every theme defines every token the preset names, and no other. Never weaken it.
