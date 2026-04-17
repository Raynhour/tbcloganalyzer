export type ConsumableCategory =
  | 'flask'
  | 'elixir'
  | 'potion'
  | 'food'
  | 'scroll'
  | 'weapon'
  | 'jc_neck'
  | 'sapper'
  | 'other';

export interface ConsumableInfo {
  name: string;
  category: ConsumableCategory;
  icon: string;
}

export const TBC_CONSUMABLES = new Map<number, ConsumableInfo>([
  // Flasks
  [
    28540,
    { name: 'Flask of Pure Death', category: 'flask', icon: 'inv_potion_115' },
  ],
  [
    28521,
    {
      name: 'Flask of Blinding Light',
      category: 'flask',
      icon: 'inv_potion_116',
    },
  ],
  [
    28520,
    {
      name: 'Flask of Relentless Assault',
      category: 'flask',
      icon: 'inv_potion_117',
    },
  ],
  [
    28519,
    {
      name: 'Flask of Mighty Restoration',
      category: 'flask',
      icon: 'inv_potion_118',
    },
  ],
  [
    28518,
    {
      name: 'Flask of Fortification',
      category: 'flask',
      icon: 'inv_potion_119',
    },
  ],
  [
    42735,
    {
      name: 'Flask of Chromatic Wonder',
      category: 'flask',
      icon: 'inv_potion_48',
    },
  ],
  [
    46839,
    {
      name: 'Shattrath Flask of Pure Death',
      category: 'flask',
      icon: 'inv_potion_115',
    },
  ],
  [
    46837,
    {
      name: 'Shattrath Flask of Blinding Light',
      category: 'flask',
      icon: 'inv_potion_116',
    },
  ],
  [
    46835,
    {
      name: 'Shattrath Flask of Relentless Assault',
      category: 'flask',
      icon: 'inv_potion_117',
    },
  ],
  [
    46843,
    {
      name: 'Shattrath Flask of Mighty Restoration',
      category: 'flask',
      icon: 'inv_potion_118',
    },
  ],
  [
    46841,
    {
      name: 'Shattrath Flask of Fortification',
      category: 'flask',
      icon: 'inv_potion_119',
    },
  ],

  // Battle Elixirs
  [
    28497,
    {
      name: 'Elixir of Major Agility',
      category: 'elixir',
      icon: 'inv_potion_127',
    },
  ],
  [
    28501,
    {
      name: 'Elixir of Major Firepower',
      category: 'elixir',
      icon: 'inv_potion_146',
    },
  ],
  [
    28493,
    {
      name: 'Elixir of Major Frost Power',
      category: 'elixir',
      icon: 'inv_potion_148',
    },
  ],
  [
    28503,
    {
      name: 'Elixir of Major Shadow Power',
      category: 'elixir',
      icon: 'inv_potion_145',
    },
  ],
  [
    28491,
    {
      name: 'Elixir of Healing Power',
      category: 'elixir',
      icon: 'inv_potion_142',
    },
  ],
  [
    28490,
    {
      name: 'Elixir of Major Strength',
      category: 'elixir',
      icon: 'inv_potion_147',
    },
  ],
  [
    33721,
    { name: "Adept's Elixir", category: 'elixir', icon: 'inv_potion_96' },
  ],
  [
    33720,
    { name: 'Onslaught Elixir', category: 'elixir', icon: 'inv_potion_58' },
  ],
  [
    33726,
    { name: 'Elixir of Mastery', category: 'elixir', icon: 'inv_potion_111' },
  ],
  [
    28504,
    {
      name: 'Elixir of Major Agility',
      category: 'elixir',
      icon: 'inv_potion_127',
    },
  ],
  [
    11406,
    {
      name: 'Elixir of Demonslaying',
      category: 'elixir',
      icon: 'inv_potion_27',
    },
  ],
  [
    17539,
    {
      name: 'Greater Arcane Elixir',
      category: 'elixir',
      icon: 'inv_potion_25',
    },
  ],
  [
    17538,
    {
      name: 'Elixir of the Mongoose',
      category: 'elixir',
      icon: 'inv_misc_monsterscales_07',
    },
  ],

  // Guardian Elixirs
  [
    28502,
    {
      name: 'Elixir of Major Defense',
      category: 'elixir',
      icon: 'inv_potion_122',
    },
  ],
  [
    28509,
    {
      name: 'Elixir of Major Mageblood',
      category: 'elixir',
      icon: 'inv_potion_151',
    },
  ],
  [
    28514,
    {
      name: 'Elixir of Draenic Wisdom',
      category: 'elixir',
      icon: 'inv_potion_155',
    },
  ],
  [
    39628,
    { name: 'Elixir of Ironskin', category: 'elixir', icon: 'inv_potion_159' },
  ],
  [
    39627,
    {
      name: 'Elixir of Draenic Wisdom',
      category: 'elixir',
      icon: 'inv_potion_155',
    },
  ],
  [
    39625,
    {
      name: 'Elixir of Major Fortitude',
      category: 'elixir',
      icon: 'inv_potion_158',
    },
  ],

  // Potions
  [28507, { name: 'Haste Potion', category: 'potion', icon: 'inv_potion_108' }],
  [
    28508,
    { name: 'Destruction Potion', category: 'potion', icon: 'inv_potion_107' },
  ],
  [
    28499,
    { name: 'Super Mana Potion', category: 'potion', icon: 'inv_potion_137' },
  ],
  [
    28515,
    { name: 'Ironshield Potion', category: 'potion', icon: 'inv_potion_133' },
  ],
  [
    38929,
    { name: 'Fel Mana Potion', category: 'potion', icon: 'inv_potion_91' },
  ],
  [
    28495,
    { name: 'Super Healing Potion', category: 'potion', icon: 'inv_potion_73' },
  ],
  [
    17531,
    { name: 'Major Mana Potion', category: 'potion', icon: 'inv_potion_76' },
  ],
  [
    8499,
    { name: 'Superior Mana Potion', category: 'potion', icon: 'inv_potion_50' },
  ],

  // Healthstones
  [
    27235,
    { name: 'Master Healthstone', category: 'potion', icon: 'inv_stone_04' },
  ],
  [
    27236,
    { name: 'Master Healthstone', category: 'potion', icon: 'inv_stone_04' },
  ],
  [
    27237,
    { name: 'Master Healthstone', category: 'potion', icon: 'inv_stone_04' },
  ],

  // Runes
  [27869, { name: 'Dark Rune', category: 'potion', icon: 'inv_misc_rune_04' }],
  [
    16666,
    { name: 'Demonic Rune', category: 'potion', icon: 'inv_misc_rune_04' },
  ],

  // Food Buffs
  [
    33263,
    {
      name: 'Blackened Basilisk',
      category: 'food',
      icon: 'inv_misc_food_86_basilisk',
    },
  ],
  [
    33261,
    { name: 'Grilled Mudfish', category: 'food', icon: 'inv_misc_food_78' },
  ],
  [
    33259,
    { name: 'Roasted Clefthoof', category: 'food', icon: 'inv_misc_food_60' },
  ],
  [
    33257,
    { name: 'Spicy Crawdad', category: 'food', icon: 'inv_misc_fish_16' },
  ],
  [
    33265,
    {
      name: 'Blackened Sporefish',
      category: 'food',
      icon: 'inv_misc_food_79',
    },
  ],
  [
    33254,
    {
      name: "Fisherman's Feast",
      category: 'food',
      icon: 'inv_misc_food_88_ravagernuggets',
    },
  ],
  [
    43764,
    {
      name: 'Spicy Hot Talbuk',
      category: 'food',
      icon: 'inv_misc_food_84_roastclefthoof',
    },
  ],
  [
    43722,
    {
      name: 'Skullfish Soup',
      category: 'food',
      icon: 'inv_misc_food_63',
    },
  ],
  [
    33268,
    {
      name: 'Golden Fish Sticks',
      category: 'food',
      icon: 'inv_misc_fish_18',
    },
  ],

  // Scrolls
  [
    33077,
    { name: 'Scroll of Agility V', category: 'scroll', icon: 'inv_scroll_02' },
  ],
  [
    33082,
    { name: 'Scroll of Strength V', category: 'scroll', icon: 'inv_scroll_02' },
  ],
  [
    33079,
    {
      name: 'Scroll of Protection V',
      category: 'scroll',
      icon: 'inv_scroll_07',
    },
  ],
  [
    33078,
    {
      name: 'Scroll of Intellect V',
      category: 'scroll',
      icon: 'inv_scroll_01',
    },
  ],
  [
    33080,
    { name: 'Scroll of Spirit V', category: 'scroll', icon: 'inv_scroll_06' },
  ],

  // Temporary Weapon Buffs (Oils / Stones)
  [
    28019,
    { name: 'Superior Wizard Oil', category: 'weapon', icon: 'inv_potion_141' },
  ],
  [
    25122,
    {
      name: 'Brilliant Wizard Oil',
      category: 'weapon',
      icon: 'inv_potion_105',
    },
  ],
  [
    25124,
    { name: 'Superior Mana Oil', category: 'weapon', icon: 'inv_potion_98' },
  ],
  [
    34340,
    {
      name: 'Adamantite Weightstone',
      category: 'weapon',
      icon: 'inv_stone_weightstone_05',
    },
  ],
  [
    34339,
    {
      name: 'Adamantite Sharpening Stone',
      category: 'weapon',
      icon: 'inv_stone_sharpeningstone_05',
    },
  ],
  [
    25294,
    { name: 'Brilliant Mana Oil', category: 'weapon', icon: 'inv_potion_100' },
  ],
  [
    28898,
    {
      name: 'Blessed Wizard Oil',
      category: 'weapon',
      icon: 'inv_potion_105',
    },
  ],
  [
    22760,
    {
      name: 'Elemental Sharpening Stone',
      category: 'weapon',
      icon: 'inv_stone_sharpeningstone_05',
    },
  ],

  // JC Necks (group buff on-use, 30 min duration)
  [
    31035,
    {
      name: 'Blood of the Martyr',
      category: 'jc_neck',
      icon: 'inv_jewelry_necklace_16',
    },
  ],
  [
    31038,
    {
      name: 'Brooch of Unrelenting Frost',
      category: 'jc_neck',
      icon: 'inv_jewelry_necklace_17',
    },
  ],
  [
    31040,
    {
      name: 'Chain of the Twilight Owl',
      category: 'jc_neck',
      icon: 'inv_jewelry_necklace_18',
    },
  ],
  [
    31036,
    {
      name: 'Embrace of the Dawn',
      category: 'jc_neck',
      icon: 'inv_jewelry_necklace_16',
    },
  ],
  [
    31039,
    {
      name: 'Eye of the Night',
      category: 'jc_neck',
      icon: 'inv_jewelry_necklace_17',
    },
  ],

  // Sappers
  [
    30486,
    {
      name: 'Super Sapper Charge',
      category: 'sapper',
      icon: 'spell_fire_selfdestruct',
    },
  ],
  [
    13241,
    {
      name: 'Goblin Sapper Charge',
      category: 'sapper',
      icon: 'spell_fire_selfdestruct',
    },
  ],

  // Other
  [
    28714,
    { name: 'Flame Cap', category: 'other', icon: 'inv_misc_herb_flamecap' },
  ],
]);

export const CONSUMABLE_SPELL_IDS = Array.from(TBC_CONSUMABLES.keys());

// Consumables that only appear as "cast" events (no buff applied)
export const CAST_ONLY_SPELL_IDS = new Set([
  28499, // Super Mana Potion
  28495, // Super Healing Potion
  17531, // Major Mana Potion
  8499, // Superior Mana Potion
  27235, // Master Healthstone (0/2)
  27236, // Master Healthstone (1/2)
  27237, // Master Healthstone (2/2)
  27869, // Dark Rune
  16666, // Demonic Rune
  30486, // Super Sapper Charge
  13241, // Goblin Sapper Charge
]);

// Maps WoW weapon enchant IDs (from WCL table gear data) to canonical spell IDs in TBC_CONSUMABLES
export const WEAPON_ENCHANT_TO_SPELL_ID = new Map<number, number>([
  [2629, 25294], // Brilliant Mana Oil
  [2628, 25122], // Brilliant Wizard Oil
  [2627, 25124], // Superior Mana Oil
  [2626, 28019], // Superior Wizard Oil
  [3345, 34340], // Adamantite Weightstone
  [3344, 34339], // Adamantite Sharpening Stone
  [2841, 28898], // Blessed Wizard Oil
  [2504, 22760], // Elemental Sharpening Stone
]);

export const WEAPON_SLOTS = new Set([15, 16]); // mainhand, offhand
