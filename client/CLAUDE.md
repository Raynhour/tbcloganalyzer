# Client — Adding New Consumables

This guide covers every place in the frontend that needs to be touched when adding a new consumable.

> Backend changes (server-side detection) are separate — see the root `CLAUDE.md`.

---

## Files involved

| File | Purpose |
|------|---------|
| `src/types/consumables.ts` | TypeScript types (usually no change needed) |
| `src/constants/missingConsumables.ts` | "Missing consumable" detection logic |

The frontend **does not** maintain its own consumable ID registry — the full list lives in the backend (`server/src/consumables/consumables.constants.ts`). The client receives consumable data from the GraphQL API already resolved (name, category, icon, spellId).

---

## When do you need to touch frontend code?

Only when the new consumable affects **"missing consumable" detection** — i.e. whether a player is flagged as missing a buff category.

### Case 1: New flask, food, potion, scroll, sapper — no frontend change needed

These categories are checked by `category` field only:
```ts
const hasFlask = player.consumables.some((c) => c.category === 'flask');
const hasPotion = player.consumables.some((c) => c.category === 'potion');
```
If the backend correctly sets the category, detection is automatic.

### Case 2: New battle elixir

Add the spell ID to `BATTLE_ELIXIR_IDS` in `src/constants/missingConsumables.ts`:

```ts
const BATTLE_ELIXIR_IDS = new Set([
  28497, // Elixir of Major Agility
  // ... existing entries ...
  YOUR_SPELL_ID, // Your New Elixir
]);
```

Flask already covers both elixir slots, so only add here if it's a true battle (offensive) elixir.

### Case 3: New guardian elixir

Add the spell ID to `GUARDIAN_ELIXIR_IDS` in `src/constants/missingConsumables.ts`:

```ts
const GUARDIAN_ELIXIR_IDS = new Set([
  28502, // Elixir of Major Defense
  // ... existing entries ...
  YOUR_SPELL_ID, // Your New Guardian Elixir
]);
```

### Case 4: New mana oil

Add the spell ID to `MANA_OIL_IDS`:

```ts
const MANA_OIL_IDS = new Set([
  25294, // Brilliant Mana Oil
  25124, // Superior Mana Oil
  YOUR_SPELL_ID, // New Mana Oil
]);
```

Healing specs (`Holy`, `Discipline`, `Restoration`) are checked against this set.

### Case 5: New wizard oil

Add the spell ID to `WIZARD_OIL_IDS`:

```ts
const WIZARD_OIL_IDS = new Set([
  25122, // Brilliant Wizard Oil
  28019, // Superior Wizard Oil
  28898, // Blessed Wizard Oil
  YOUR_SPELL_ID, // New Wizard Oil
]);
```

Caster DPS specs are checked against `WIZARD_OIL_IDS` and also fall back to `MANA_OIL_IDS` as acceptable.

### Case 6: New scroll-required class or spec

Scrolls are checked by class/spec membership, not by spell ID:

```ts
const SCROLL_REQUIRED_CLASSES = new Set(['Warrior', 'Rogue', 'Hunter']);
const SCROLL_REQUIRED_SPECS = new Set(['Retribution', 'Enhancement', 'Feral']);
```

Add to the appropriate set if a new class or spec should be required to use scrolls.

---

## Adding a new `MissingType`

If the new consumable introduces a brand-new category of "missing" check (not covered by existing types), update the union type in `src/constants/missingConsumables.ts`:

```ts
export type MissingType =
  | 'battle_elixir'
  | 'guardian_elixir'
  | 'scroll'
  | 'potion'
  | 'weapon_oil'
  | 'weapon_stone'
  | 'your_new_type'; // add here
```

Then add the detection logic inside `computeMissingConsumables()` and push to `missing[]`.

---

## Testing

After any change to `missingConsumables.ts`, run:

```bash
npx vitest run src/constants/missingConsumables.spec.ts
```

Add a test case in `missingConsumables.spec.ts` for the new consumable to verify detection works and doesn't break existing logic.
