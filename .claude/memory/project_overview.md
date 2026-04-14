---
name: WoW TBC Log Analyzer project
description: Monorepo web app analyzing Warcraft Logs reports for TBC consumable usage — Vue 3 + Apollo Client frontend, NestJS + GraphQL backend
type: project
---

WoW TBC log analyzer that fetches data from Warcraft Logs API v2 (GraphQL, OAuth 2.0 client credentials) and displays consumable usage per player (potions, flasks, elixirs, food, scrolls, weapon buffs).

**Why:** User wants to track raid consumable usage across players for TBC raids.

**How to apply:** Full GraphQL stack end-to-end. Backend uses `graphql-request` to call WCL API. Frontend uses `@apollo/client` + `@vue/apollo-composable`. Styled with Tailwind CSS v4. Tests: Jest (backend), Vitest (frontend).
