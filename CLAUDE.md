# Log Analyzer

WoW TBC combat log analyzer. Monorepo with:
- `client/` — Vue 3 + Apollo Client frontend
- `server/` — NestJS GraphQL backend, fetches data from WarcraftLogs API v2

## Agent Routing

- **Frontend tasks** (Vue components, UI, client-side logic) → use `frontend-developer` agent
- **Backend tasks** (NestJS services, resolvers, data processing) → use `backend-developer` agent
- **GraphQL tasks** (schema design, resolvers, Apollo, WCL API queries) → use `graphql-architect` agent
- **After implementation** (writing or updating tests) → use `test-engineer` agent

## Adding New Consumables

All consumable data lives in `server/src/consumables/consumables.constants.ts`.

### Steps

1. **Add the spell ID to `TBC_CONSUMABLES`** — the map key is the WCL spell/buff ID (not the item ID):
   ```ts
   [SPELL_ID, { name: 'Consumable Name', category: 'elixir', icon: 'inv_potion_xxx' }],
   ```
   Categories: `flask` | `elixir` | `potion` | `food` | `scroll` | `weapon` | `jc_neck` | `sapper` | `other`

2. **Cast-only consumables** (potions/healthstones/sappers that have no persistent buff) — also add the spell ID to `CAST_ONLY_SPELL_IDS`. These are detected via `cast` events, not `applybuff`/`removebuff`.

3. **Weapon enchants** (oils/stones applied as weapon buffs) — add a mapping in `WEAPON_ENCHANT_TO_SPELL_ID`:
   ```ts
   [ENCHANT_ID, SPELL_ID], // Enchant ID from WCL gear data → spell ID in TBC_CONSUMABLES
   ```
   The enchant ID comes from WCL's table gear data (not the same as the spell or item ID).

4. **Frontend "missing" detection** — if the new consumable affects whether a player is flagged as missing a buff, see `client/CLAUDE.md` for which sets to update in `client/src/constants/missingConsumables.ts`.

### Finding IDs
- Spell/buff IDs: check WarcraftLogs for the actual buff ID applied to the player (use a real log)
- Weapon enchant IDs: inspect WCL gear table data for the `permanentEnchant` field value
- Icons: use the WoW icon name (lowercase, underscores), e.g. `inv_potion_127`
