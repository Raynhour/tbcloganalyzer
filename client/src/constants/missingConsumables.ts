import type { PlayerConsumables } from '../types/consumables';

// Battle elixirs (offensive) — flask replaces both
const BATTLE_ELIXIR_IDS = new Set([
  28497, // Elixir of Major Agility
  28504, // Elixir of Major Agility (alt ID)
  28501, // Elixir of Major Firepower
  28493, // Elixir of Major Frost Power
  28503, // Elixir of Major Shadow Power
  28491, // Elixir of Healing Power
  28490, // Elixir of Major Strength
  33721, // Adept's Elixir
  33720, // Onslaught Elixir
  33726, // Elixir of Mastery
  11406, // Elixir of Demonslaying
  17539, // Greater Arcane Elixir
  17538, // Elixir of the Mongoose
]);

// Guardian elixirs (defensive/utility) — flask replaces both
const GUARDIAN_ELIXIR_IDS = new Set([
  28502, // Elixir of Major Defense
  28509, // Elixir of Major Mageblood
  28514, // Elixir of Draenic Wisdom
  39627, // Elixir of Draenic Wisdom (Shattrath)
  39628, // Elixir of Ironskin
  39625, // Elixir of Major Fortitude
]);

// Physical DPS classes that always need scrolls regardless of spec
const SCROLL_REQUIRED_CLASSES = new Set(['Warrior', 'Rogue', 'Hunter']);

// Specs from hybrid classes that need scrolls
const SCROLL_REQUIRED_SPECS = new Set(['Retribution', 'Enhancement', 'Feral']);

// Mana oils — healing specs are expected to use one
const MANA_OIL_IDS = new Set([
  25294, // Brilliant Mana Oil
  25124, // Superior Mana Oil
]);

// Wizard oils — caster DPS specs
const WIZARD_OIL_IDS = new Set([
  25122, // Brilliant Wizard Oil
  28019, // Superior Wizard Oil
  28898, // Blessed Wizard Oil
]);


const HEALING_SPECS = new Set(['Holy', 'Discipline', 'Restoration']);

// Caster DPS specs that benefit from wizard oils
const CASTER_DPS_SPECS = new Set([
  'Arcane', 'Fire', 'Frost', 'Shadow', 'Balance', 'Elemental',
  'Destruction', 'Affliction', 'Demonology',
]);

function needsManaOil(spec: string): boolean {
  return HEALING_SPECS.has(spec);
}

function needsWizardOil(spec: string): boolean {
  return CASTER_DPS_SPECS.has(spec);
}


function needsScroll(cls: string, spec: string): boolean {
  return SCROLL_REQUIRED_CLASSES.has(cls) || SCROLL_REQUIRED_SPECS.has(spec);
}

export type MissingType = 'battle_elixir' | 'guardian_elixir' | 'scroll' | 'potion' | 'weapon_oil' | 'weapon_stone';

export interface MissingConsumable {
  type: MissingType;
  label: string;
}

export function computeMissingConsumables(player: PlayerConsumables): MissingConsumable[] {
  const missing: MissingConsumable[] = [];

  const hasFlask = player.consumables.some((c) => c.category === 'flask');
  const hasBattleElixir = hasFlask || player.consumables.some((c) => BATTLE_ELIXIR_IDS.has(c.spellId));
  const hasGuardianElixir = hasFlask || player.consumables.some((c) => GUARDIAN_ELIXIR_IDS.has(c.spellId));

  if (!hasBattleElixir) {
    missing.push({ type: 'battle_elixir', label: 'Battle Elixir' });
  }
  if (!hasGuardianElixir) {
    missing.push({ type: 'guardian_elixir', label: 'Guardian Elixir' });
  }

  if (needsScroll(player.class, player.spec)) {
    const hasScroll = player.consumables.some((c) => c.category === 'scroll');
    if (!hasScroll) {
      missing.push({ type: 'scroll', label: 'Scroll' });
    }
  }

  const hasPotion = player.consumables.some((c) => c.category === 'potion');
  if (!hasPotion) {
    missing.push({ type: 'potion', label: 'Potion' });
  }

  if (needsManaOil(player.spec)) {
    const hasManaOil = player.consumables.some((c) => MANA_OIL_IDS.has(c.spellId));
    if (!hasManaOil) {
      missing.push({ type: 'weapon_oil', label: 'Mana Oil' });
    }
  }

  if (needsWizardOil(player.spec)) {
    const hasWizardOil = player.consumables.some(
      (c) => WIZARD_OIL_IDS.has(c.spellId) || MANA_OIL_IDS.has(c.spellId),
    );
    if (!hasWizardOil) {
      missing.push({ type: 'weapon_oil', label: 'Weapon Oil' });
    }
  }

  return missing;
}
