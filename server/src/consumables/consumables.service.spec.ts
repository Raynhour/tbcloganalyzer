import { ConsumablesService, WclEvent, WclActor } from './consumables.service';

describe('ConsumablesService', () => {
  let service: ConsumablesService;

  beforeEach(() => {
    service = new ConsumablesService();
  });

  const actors: WclActor[] = [
    { id: 1, name: 'Legolas', subType: 'Hunter', icon: 'Hunter-BeastMastery' },
    { id: 2, name: 'Gandalf', subType: 'Mage', icon: 'Mage-Fire' },
  ];

  const raidStart = 0;
  const raidEnd = 1000;

  it('should group events by target player and count consumables', () => {
    const events: WclEvent[] = [
      {
        timestamp: 100,
        type: 'applybuff',
        sourceID: 1,
        targetID: 1,
        abilityGameID: 28507,
      },
      {
        timestamp: 200,
        type: 'applybuff',
        sourceID: 1,
        targetID: 1,
        abilityGameID: 28507,
      },
      {
        timestamp: 300,
        type: 'applybuff',
        sourceID: 2,
        targetID: 2,
        abilityGameID: 28508,
      },
    ];

    const result = service.processEvents(events, actors, raidStart, raidEnd);

    expect(result).toHaveLength(2);

    const gandalf = result.find((p) => p.playerName === 'Gandalf')!;
    expect(gandalf.class).toBe('Mage');
    expect(gandalf.consumables).toHaveLength(1);
    expect(gandalf.consumables[0].name).toBe('Destruction Potion');
    expect(gandalf.consumables[0].count).toBe(1);
    expect(gandalf.consumables[0].uptimePercent).toBeNull();

    const legolas = result.find((p) => p.playerName === 'Legolas')!;
    expect(legolas.consumables).toHaveLength(1);
    expect(legolas.consumables[0].name).toBe('Haste Potion');
    expect(legolas.consumables[0].count).toBe(2);
    expect(legolas.consumables[0].uptimePercent).toBeNull();
  });

  it('should track buffs by targetID, not sourceID', () => {
    // Player 2 casts a JC neck buff on player 1
    const events: WclEvent[] = [
      {
        timestamp: 0,
        type: 'applybuff',
        sourceID: 2,
        targetID: 1,
        abilityGameID: 31040,
      },
      {
        timestamp: 500,
        type: 'removebuff',
        sourceID: 2,
        targetID: 1,
        abilityGameID: 31040,
      },
    ];

    const result = service.processEvents(events, actors, raidStart, raidEnd);
    // Buff should appear on Legolas (target), not Gandalf (source)
    expect(result).toHaveLength(1);
    expect(result[0].playerName).toBe('Legolas');
    expect(result[0].consumables[0].uptimePercent).toBe(50);
  });

  it('should calculate uptime for non-potion consumables', () => {
    const events: WclEvent[] = [
      {
        timestamp: 0,
        type: 'applybuff',
        sourceID: 1,
        targetID: 1,
        abilityGameID: 28540,
      },
      {
        timestamp: 500,
        type: 'removebuff',
        sourceID: 1,
        targetID: 1,
        abilityGameID: 28540,
      },
    ];

    const result = service.processEvents(events, actors, raidStart, raidEnd);
    const legolas = result.find((p) => p.playerName === 'Legolas')!;
    expect(legolas.consumables[0].uptimePercent).toBe(50);
  });

  it('should treat open buff windows as lasting until raid end', () => {
    const events: WclEvent[] = [
      {
        timestamp: 0,
        type: 'applybuff',
        sourceID: 1,
        targetID: 1,
        abilityGameID: 28540,
      },
    ];

    const result = service.processEvents(events, actors, raidStart, raidEnd);
    const legolas = result.find((p) => p.playerName === 'Legolas')!;
    expect(legolas.consumables[0].uptimePercent).toBe(100);
  });

  it('should cap uptime at 100%', () => {
    const events: WclEvent[] = [
      {
        timestamp: 0,
        type: 'applybuff',
        sourceID: 1,
        targetID: 1,
        abilityGameID: 28540,
      },
      {
        timestamp: 1200,
        type: 'removebuff',
        sourceID: 1,
        targetID: 1,
        abilityGameID: 28540,
      },
    ];

    const result = service.processEvents(events, actors, raidStart, raidEnd);
    const legolas = result.find((p) => p.playerName === 'Legolas')!;
    expect(legolas.consumables[0].uptimePercent).toBe(100);
  });

  it('should categorize unknown spell IDs as other', () => {
    const events: WclEvent[] = [
      {
        timestamp: 100,
        type: 'applybuff',
        sourceID: 1,
        targetID: 1,
        abilityGameID: 99999,
      },
    ];

    const result = service.processEvents(events, actors, raidStart, raidEnd);
    expect(result[0].consumables[0].category).toBe('other');
    expect(result[0].consumables[0].name).toBe('Unknown (99999)');
  });

  it('should return empty array for no events', () => {
    const result = service.processEvents([], actors, raidStart, raidEnd);
    expect(result).toEqual([]);
  });

  it('should ignore events targeting unknown actors', () => {
    const events: WclEvent[] = [
      {
        timestamp: 100,
        type: 'applybuff',
        sourceID: 1,
        targetID: 999,
        abilityGameID: 28507,
      },
    ];

    const result = service.processEvents(events, actors, raidStart, raidEnd);
    expect(result).toEqual([]);
  });

  it('should sort players alphabetically', () => {
    const events: WclEvent[] = [
      {
        timestamp: 100,
        type: 'applybuff',
        sourceID: 2,
        targetID: 2,
        abilityGameID: 28508,
      },
      {
        timestamp: 200,
        type: 'applybuff',
        sourceID: 1,
        targetID: 1,
        abilityGameID: 28507,
      },
    ];

    const result = service.processEvents(events, actors, raidStart, raidEnd);
    expect(result[0].playerName).toBe('Gandalf');
    expect(result[1].playerName).toBe('Legolas');
  });

  it('should sort consumables by category', () => {
    const events: WclEvent[] = [
      {
        timestamp: 100,
        type: 'applybuff',
        sourceID: 1,
        targetID: 1,
        abilityGameID: 28507,
      },
      {
        timestamp: 200,
        type: 'applybuff',
        sourceID: 1,
        targetID: 1,
        abilityGameID: 28540,
      },
      {
        timestamp: 300,
        type: 'applybuff',
        sourceID: 1,
        targetID: 1,
        abilityGameID: 28497,
      },
    ];

    const result = service.processEvents(events, actors, raidStart, raidEnd);
    const categories = result[0].consumables.map((c) => c.category);
    expect(categories).toEqual(['elixir', 'flask', 'potion']);
  });

  describe('with fightWindow', () => {
    it('should include pre-applied buffs active during the fight', () => {
      // Flask applied at timestamp 50 (before fight), removed at 800 (after fight ends)
      const events: WclEvent[] = [
        {
          timestamp: 50,
          type: 'applybuff',
          sourceID: 1,
          targetID: 1,
          abilityGameID: 28540,
        },
        {
          timestamp: 800,
          type: 'removebuff',
          sourceID: 1,
          targetID: 1,
          abilityGameID: 28540,
        },
      ];

      const result = service.processEvents(events, actors, raidStart, raidEnd, {
        startTime: 200,
        endTime: 500,
      });

      expect(result).toHaveLength(1);
      const legolas = result[0];
      expect(legolas.consumables[0].name).toBe('Flask of Pure Death');
      expect(legolas.consumables[0].count).toBe(1); // pre-applied, still counts as 1
      expect(legolas.consumables[0].uptimePercent).toBe(100); // active entire fight
    });

    it('should exclude consumables not active during the fight', () => {
      // Potion used at timestamp 50, fight is 200-500
      const events: WclEvent[] = [
        {
          timestamp: 50,
          type: 'applybuff',
          sourceID: 1,
          targetID: 1,
          abilityGameID: 28507,
        },
        {
          timestamp: 60,
          type: 'removebuff',
          sourceID: 1,
          targetID: 1,
          abilityGameID: 28507,
        },
      ];

      const result = service.processEvents(events, actors, raidStart, raidEnd, {
        startTime: 200,
        endTime: 500,
      });

      expect(result).toEqual([]);
    });

    it('should calculate uptime only within fight window', () => {
      // Flask applied at 100, removed at 400, fight is 200-500
      const events: WclEvent[] = [
        {
          timestamp: 100,
          type: 'applybuff',
          sourceID: 1,
          targetID: 1,
          abilityGameID: 28540,
        },
        {
          timestamp: 400,
          type: 'removebuff',
          sourceID: 1,
          targetID: 1,
          abilityGameID: 28540,
        },
      ];

      const result = service.processEvents(events, actors, raidStart, raidEnd, {
        startTime: 200,
        endTime: 500,
      });

      const legolas = result[0];
      // Overlap: 200-400 = 200ms out of 300ms fight duration = 67%
      expect(legolas.consumables[0].uptimePercent).toBe(67);
    });

    it('should skip players with no consumables active during fight', () => {
      const events: WclEvent[] = [
        {
          timestamp: 50,
          type: 'applybuff',
          sourceID: 1,
          targetID: 1,
          abilityGameID: 28507,
        },
        {
          timestamp: 60,
          type: 'removebuff',
          sourceID: 1,
          targetID: 1,
          abilityGameID: 28507,
        },
        {
          timestamp: 250,
          type: 'applybuff',
          sourceID: 2,
          targetID: 2,
          abilityGameID: 28508,
        },
      ];

      const result = service.processEvents(events, actors, raidStart, raidEnd, {
        startTime: 200,
        endTime: 500,
      });

      expect(result).toHaveLength(1);
      expect(result[0].playerName).toBe('Gandalf');
    });

    it('should detect pre-existing buffs from combatantInfo', () => {
      // No applybuff events for Crab's flask — it was applied before logging
      const events: WclEvent[] = [];
      const fightWindow = { startTime: 200, endTime: 500 };
      const combatantInfos = [
        {
          sourceID: 1,
          auras: [
            {
              source: 1,
              ability: 28520,
              stacks: 1,
              icon: '',
              name: 'Flask of Relentless Assault',
            },
          ],
        },
      ];

      const result = service.processEvents(
        events,
        actors,
        raidStart,
        raidEnd,
        fightWindow,
        combatantInfos,
      );

      expect(result).toHaveLength(1);
      expect(result[0].playerName).toBe('Legolas');
      expect(result[0].consumables[0].name).toBe('Flask of Relentless Assault');
      expect(result[0].consumables[0].count).toBe(1);
      expect(result[0].consumables[0].uptimePercent).toBe(100);
    });

    it('should not duplicate consumables from combatantInfo and events', () => {
      // Flask in combatantInfo AND has a removebuff during fight
      const fightWindow = { startTime: 200, endTime: 500 };
      const events: WclEvent[] = [
        {
          timestamp: 400,
          type: 'removebuff',
          sourceID: 1,
          targetID: 1,
          abilityGameID: 28520,
        },
      ];
      const combatantInfos = [
        {
          sourceID: 1,
          auras: [
            {
              source: 1,
              ability: 28520,
              stacks: 1,
              icon: '',
              name: 'Flask of Relentless Assault',
            },
          ],
        },
      ];

      const result = service.processEvents(
        events,
        actors,
        raidStart,
        raidEnd,
        fightWindow,
        combatantInfos,
      );

      expect(result).toHaveLength(1);
      const legolas = result[0];
      expect(legolas.consumables).toHaveLength(1);
      expect(legolas.consumables[0].name).toBe('Flask of Relentless Assault');
      // Uptime: 200-400 = 200ms out of 300ms = 67%
      expect(legolas.consumables[0].uptimePercent).toBe(67);
    });

    it('should ignore non-consumable auras from combatantInfo', () => {
      const fightWindow = { startTime: 200, endTime: 500 };
      const combatantInfos = [
        {
          sourceID: 1,
          auras: [
            {
              source: 1,
              ability: 99999,
              stacks: 1,
              icon: '',
              name: 'Some Random Buff',
            },
          ],
        },
      ];

      const result = service.processEvents(
        [],
        actors,
        raidStart,
        raidEnd,
        fightWindow,
        combatantInfos,
      );

      expect(result).toEqual([]);
    });
  });

  describe('cast-only consumables', () => {
    it('should count cast events for mana/health potions using sourceID', () => {
      const events: WclEvent[] = [
        {
          timestamp: 100,
          type: 'cast',
          sourceID: 1,
          targetID: 1,
          abilityGameID: 28499,
        }, // Super Mana Potion
        {
          timestamp: 200,
          type: 'cast',
          sourceID: 2,
          targetID: 2,
          abilityGameID: 28495,
        }, // Super Healing Potion
        {
          timestamp: 300,
          type: 'cast',
          sourceID: 1,
          targetID: 1,
          abilityGameID: 28499,
        }, // Super Mana Potion again
      ];

      const result = service.processEvents(events, actors, raidStart, raidEnd);

      expect(result).toHaveLength(2);
      const legolas = result.find((p) => p.playerName === 'Legolas')!;
      expect(legolas.consumables).toHaveLength(1);
      expect(legolas.consumables[0].name).toBe('Super Mana Potion');
      expect(legolas.consumables[0].count).toBe(2);
      expect(legolas.consumables[0].uptimePercent).toBeNull();

      const gandalf = result.find((p) => p.playerName === 'Gandalf')!;
      expect(gandalf.consumables[0].name).toBe('Super Healing Potion');
      expect(gandalf.consumables[0].count).toBe(1);
    });

    it('should count healthstone usage', () => {
      const events: WclEvent[] = [
        {
          timestamp: 100,
          type: 'cast',
          sourceID: 1,
          targetID: 1,
          abilityGameID: 27235,
        },
      ];

      const result = service.processEvents(events, actors, raidStart, raidEnd);
      expect(result).toHaveLength(1);
      expect(result[0].consumables[0].name).toBe('Master Healthstone');
      expect(result[0].consumables[0].count).toBe(1);
    });

    it('should count dark rune and demonic rune usage', () => {
      const events: WclEvent[] = [
        {
          timestamp: 100,
          type: 'cast',
          sourceID: 1,
          targetID: 1,
          abilityGameID: 27869,
        },
        {
          timestamp: 200,
          type: 'cast',
          sourceID: 2,
          targetID: 2,
          abilityGameID: 16666,
        },
      ];

      const result = service.processEvents(events, actors, raidStart, raidEnd);
      expect(result).toHaveLength(2);

      const legolas = result.find((p) => p.playerName === 'Legolas')!;
      expect(legolas.consumables[0].name).toBe('Dark Rune');

      const gandalf = result.find((p) => p.playerName === 'Gandalf')!;
      expect(gandalf.consumables[0].name).toBe('Demonic Rune');
    });

    it('should mix cast-only and buff consumables for the same player', () => {
      const events: WclEvent[] = [
        {
          timestamp: 0,
          type: 'applybuff',
          sourceID: 1,
          targetID: 1,
          abilityGameID: 28540,
        }, // Flask
        {
          timestamp: 200,
          type: 'cast',
          sourceID: 1,
          targetID: 1,
          abilityGameID: 28499,
        }, // Super Mana Potion
      ];

      const result = service.processEvents(events, actors, raidStart, raidEnd);
      expect(result).toHaveLength(1);
      const legolas = result[0];
      expect(legolas.consumables).toHaveLength(2);
      const flask = legolas.consumables.find(
        (c) => c.name === 'Flask of Pure Death',
      )!;
      expect(flask.uptimePercent).toBe(100);
      const potion = legolas.consumables.find(
        (c) => c.name === 'Super Mana Potion',
      )!;
      expect(potion.count).toBe(1);
      expect(potion.uptimePercent).toBeNull();
    });
  });

  it('should handle multiple buff windows for uptime', () => {
    const events: WclEvent[] = [
      {
        timestamp: 0,
        type: 'applybuff',
        sourceID: 1,
        targetID: 1,
        abilityGameID: 28540,
      },
      {
        timestamp: 200,
        type: 'removebuff',
        sourceID: 1,
        targetID: 1,
        abilityGameID: 28540,
      },
      {
        timestamp: 500,
        type: 'applybuff',
        sourceID: 1,
        targetID: 1,
        abilityGameID: 28540,
      },
      {
        timestamp: 700,
        type: 'removebuff',
        sourceID: 1,
        targetID: 1,
        abilityGameID: 28540,
      },
    ];

    const result = service.processEvents(events, actors, raidStart, raidEnd);
    const legolas = result.find((p) => p.playerName === 'Legolas')!;
    expect(legolas.consumables[0].uptimePercent).toBe(40);
    expect(legolas.consumables[0].count).toBe(2);
  });
});
