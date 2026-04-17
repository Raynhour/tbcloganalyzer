import { describe, it, expect } from 'vitest';
import { computeMissingConsumables } from './missingConsumables';
import type { PlayerConsumables } from '../types/consumables';

function makePlayer(overrides: Partial<PlayerConsumables>): PlayerConsumables {
  return {
    playerName: 'Test',
    class: 'Mage',
    spec: 'Fire',
    consumables: [],
    ...overrides,
  };
}

describe('computeMissingConsumables', () => {
  describe('battle elixir detection', () => {
    it('Greater Arcane Elixir (17539) satisfies battle elixir requirement', () => {
      const player = makePlayer({
        consumables: [{ name: 'Greater Arcane Elixir', category: 'elixir', icon: 'inv_potion_25', spellId: 17539, count: 1, uptimePercent: 90 }],
      });
      const missing = computeMissingConsumables(player);
      expect(missing.some((m) => m.type === 'battle_elixir')).toBe(false);
    });

    it('Elixir of the Mongoose (17538) satisfies battle elixir requirement', () => {
      const player = makePlayer({
        class: 'Hunter',
        spec: 'BeastMastery',
        consumables: [{ name: 'Elixir of the Mongoose', category: 'elixir', icon: 'inv_potion_32', spellId: 17538, count: 1, uptimePercent: 95 }],
      });
      const missing = computeMissingConsumables(player);
      expect(missing.some((m) => m.type === 'battle_elixir')).toBe(false);
    });

    it('missing battle elixir is flagged when neither flask nor battle elixir present', () => {
      const player = makePlayer({ consumables: [] });
      const missing = computeMissingConsumables(player);
      expect(missing.some((m) => m.type === 'battle_elixir')).toBe(true);
    });
  });

  describe('wizard oil detection', () => {
    it('Superior Wizard Oil (22522) satisfies weapon oil requirement for caster DPS', () => {
      const player = makePlayer({
        spec: 'Fire',
        consumables: [{ name: 'Superior Wizard Oil', category: 'weapon', icon: 'inv_potion_141', spellId: 22522, count: 1, uptimePercent: null }],
      });
      const missing = computeMissingConsumables(player);
      expect(missing.some((m) => m.type === 'weapon_oil')).toBe(false);
    });

    it('missing weapon oil is flagged for caster DPS with no oil', () => {
      const player = makePlayer({ spec: 'Fire', consumables: [] });
      const missing = computeMissingConsumables(player);
      expect(missing.some((m) => m.type === 'weapon_oil')).toBe(true);
    });
  });
});
