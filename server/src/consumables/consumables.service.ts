import { Injectable } from '@nestjs/common';
import { TBC_CONSUMABLES, CAST_ONLY_SPELL_IDS } from './consumables.constants';

export interface WclEvent {
  timestamp: number;
  type: string;
  sourceID: number;
  targetID: number;
  abilityGameID: number;
}

export interface FightWindow {
  startTime: number;
  endTime: number;
}

export interface CombatantInfo {
  sourceID: number;
  auras: { ability: number; [k: string]: any }[];
}

export interface WclActor {
  id: number;
  name: string;
  subType: string;
  icon: string;
}

export interface EncounterConsumableUsage {
  fightId: number;
  encounterName: string;
  kill: boolean | null;
  used: boolean;
  count: number;
  uptimePercent: number | null;
}

export interface ConsumableEntry {
  name: string;
  category: string;
  icon: string;
  spellId: number;
  count: number;
  uptimePercent: number | null;
  encounterBreakdown?: EncounterConsumableUsage[];
}

export interface PlayerConsumables {
  playerName: string;
  class: string;
  spec: string;
  consumables: ConsumableEntry[];
}

interface BuffWindow {
  start: number;
  end: number | null;
}

export interface TableAura {
  guid: number;
  name: string;
  totalUptime: number;
  totalUses: number;
}

export interface PlayerTableData {
  actorId: number;
  auras: TableAura[];
  totalTime: number;
  casts?: { abilityGameID: number; total: number }[];
}

@Injectable()
export class ConsumablesService {
  processEvents(
    events: WclEvent[],
    actors: WclActor[],
    raidStartTime: number,
    raidEndTime: number,
    fightWindow?: FightWindow,
    combatantInfos?: CombatantInfo[],
  ): PlayerConsumables[] {
    const actorMap = new Map(actors.map((a) => [a.id, a]));
    const effectiveStart = fightWindow?.startTime ?? raidStartTime;
    const effectiveEnd = fightWindow?.endTime ?? raidEndTime;
    const effectiveDuration = effectiveEnd - effectiveStart;

    // Track by playerID (who has the buff)
    const playerBuffWindows = new Map<number, Map<number, BuffWindow[]>>();
    const playerApplyCounts = new Map<number, Map<number, number>>();

    const ensurePlayer = (playerID: number) => {
      if (!playerBuffWindows.has(playerID)) {
        playerBuffWindows.set(playerID, new Map());
        playerApplyCounts.set(playerID, new Map());
      }
    };

    const ensureSpell = (playerID: number, spellId: number) => {
      ensurePlayer(playerID);
      if (!playerBuffWindows.get(playerID)!.has(spellId)) {
        playerBuffWindows.get(playerID)!.set(spellId, []);
      }
    };

    // Seed pre-existing buffs from combatantInfo
    if (combatantInfos) {
      for (const ci of combatantInfos) {
        if (!actorMap.has(ci.sourceID)) continue;
        for (const aura of ci.auras) {
          if (!TBC_CONSUMABLES.has(aura.ability)) continue;
          if (CAST_ONLY_SPELL_IDS.has(aura.ability)) continue;

          ensureSpell(ci.sourceID, aura.ability);
          playerBuffWindows
            .get(ci.sourceID)!
            .get(aura.ability)!
            .push({ start: effectiveStart, end: null });
          const counts = playerApplyCounts.get(ci.sourceID)!;
          counts.set(aura.ability, (counts.get(aura.ability) ?? 0) + 1);
        }
      }
    }

    // Process events
    for (const event of events) {
      const isCastOnly =
        event.type === 'cast' && CAST_ONLY_SPELL_IDS.has(event.abilityGameID);
      const playerID = isCastOnly ? event.sourceID : event.targetID;
      if (!actorMap.has(playerID)) continue;

      const spellId = event.abilityGameID;
      ensureSpell(playerID, spellId);

      const applyCounts = playerApplyCounts.get(playerID)!;
      const windows = playerBuffWindows.get(playerID)!.get(spellId)!;

      if (isCastOnly) {
        applyCounts.set(spellId, (applyCounts.get(spellId) ?? 0) + 1);
      } else if (event.type === 'applybuff') {
        applyCounts.set(spellId, (applyCounts.get(spellId) ?? 0) + 1);
        windows.push({ start: event.timestamp, end: null });
      } else if (event.type === 'removebuff') {
        const openWindow = windows.findLast((w) => w.end === null);
        if (openWindow) {
          openWindow.end = event.timestamp;
        }
      }
    }

    // Build results
    const results: PlayerConsumables[] = [];

    for (const [actorId, spellWindows] of playerBuffWindows) {
      const actor = actorMap.get(actorId)!;
      const applyCounts = playerApplyCounts.get(actorId)!;
      const consumables: ConsumableEntry[] = [];

      for (const [spellId, windows] of spellWindows) {
        const info = TBC_CONSUMABLES.get(spellId);
        const category = info?.category ?? 'other';
        const count = applyCounts.get(spellId) ?? 0;

        // When fightWindow is set, check if this consumable was active during the fight
        if (fightWindow && windows.length > 0) {
          const hasOverlap = windows.some((w) => {
            const wEnd = w.end ?? effectiveEnd;
            return w.start < effectiveEnd && wEnd > effectiveStart;
          });
          if (!hasOverlap) continue;
        }

        let uptimePercent: number | null = null;

        if (
          category !== 'potion' &&
          category !== 'other' &&
          effectiveDuration > 0
        ) {
          let totalUptime = 0;
          for (const w of windows) {
            const wEnd = w.end ?? effectiveEnd;
            // Clip to effective window
            const overlapStart = Math.max(w.start, effectiveStart);
            const overlapEnd = Math.min(wEnd, effectiveEnd);
            if (overlapStart < overlapEnd) {
              totalUptime += overlapEnd - overlapStart;
            }
          }
          uptimePercent = Math.round((totalUptime / effectiveDuration) * 100);
          uptimePercent = Math.min(uptimePercent, 100);
        }

        consumables.push({
          name: info?.name ?? `Unknown (${spellId})`,
          category,
          icon: info?.icon ?? '',
          spellId,
          count,
          uptimePercent,
        });
      }

      if (fightWindow && consumables.length === 0) continue;

      consumables.sort((a, b) => a.category.localeCompare(b.category));

      results.push({
        playerName: actor.name,
        class: actor.subType,
        spec: actor.icon?.split('-')[1] ?? '',
        consumables,
      });
    }

    results.sort((a, b) => a.playerName.localeCompare(b.playerName));
    return results;
  }

  processTableData(
    actors: WclActor[],
    playerTables: PlayerTableData[],
    isWipe = false,
    weaponEnchants?: Map<number, number[]>,
  ): PlayerConsumables[] {
    const actorMap = new Map(actors.map((a) => [a.id, a]));
    const results: PlayerConsumables[] = [];

    for (const pt of playerTables) {
      const actor = actorMap.get(pt.actorId);
      if (!actor) continue;

      const consumables: ConsumableEntry[] = [];

      for (const aura of pt.auras) {
        const info = TBC_CONSUMABLES.get(aura.guid);
        if (!info) continue;

        const category = info.category;
        let uptimePercent: number | null = null;

        if (
          !isWipe &&
          category !== 'potion' &&
          category !== 'other' &&
          pt.totalTime > 0
        ) {
          uptimePercent = Math.round((aura.totalUptime / pt.totalTime) * 100);
          uptimePercent = Math.min(uptimePercent, 100);
        }

        consumables.push({
          name: info.name,
          category,
          icon: info.icon,
          spellId: aura.guid,
          count: aura.totalUses,
          uptimePercent,
        });
      }

      // Merge cast-only consumables (potions/runes that don't apply buffs)
      if (pt.casts) {
        for (const cast of pt.casts) {
          const info = TBC_CONSUMABLES.get(cast.abilityGameID);
          if (!info) continue;

          consumables.push({
            name: info.name,
            category: info.category,
            icon: info.icon,
            spellId: cast.abilityGameID,
            count: cast.total,
            uptimePercent: null,
          });
        }
      }

      for (const spellId of weaponEnchants?.get(pt.actorId) ?? []) {
        if (consumables.some((c) => c.spellId === spellId)) continue;
        const info = TBC_CONSUMABLES.get(spellId);
        if (!info) continue;
        const enchantUptime = !isWipe && pt.totalTime > 0 ? 100 : null;
        consumables.push({
          name: info.name,
          category: info.category,
          icon: info.icon,
          spellId,
          count: 1,
          uptimePercent: enchantUptime,
        });
      }

      if (consumables.length === 0) continue;

      consumables.sort((a, b) => a.category.localeCompare(b.category));

      results.push({
        playerName: actor.name,
        class: actor.subType,
        spec: actor.icon?.split('-')[1] ?? '',
        consumables,
      });
    }

    results.sort((a, b) => a.playerName.localeCompare(b.playerName));
    return results;
  }

  processTableDataWithBreakdown(
    actors: WclActor[],
    fights: { id: number; name: string; kill: boolean | null }[],
    perFightPlayerTables: Map<number, PlayerTableData[]>,
    perFightWeaponEnchants?: Map<number, Map<number, number[]>>,
  ): PlayerConsumables[] {
    const actorMap = new Map(actors.map((a) => [a.id, a]));
    // actorId -> spellId -> { aggregated totals, per-encounter data }
    const playerData = new Map<
      number,
      Map<
        number,
        {
          totalCount: number;
          totalUptime: number;
          totalTime: number;
          encounters: EncounterConsumableUsage[];
        }
      >
    >();

    for (const fight of fights) {
      const fightTables = perFightPlayerTables.get(fight.id) ?? [];
      for (const pt of fightTables) {
        if (!actorMap.has(pt.actorId)) continue;
        if (!playerData.has(pt.actorId)) playerData.set(pt.actorId, new Map());
        const spellMap = playerData.get(pt.actorId)!;

        for (const aura of pt.auras) {
          const info = TBC_CONSUMABLES.get(aura.guid);
          if (!info) continue;

          if (!spellMap.has(aura.guid)) {
            spellMap.set(aura.guid, {
              totalCount: 0,
              totalUptime: 0,
              totalTime: 0,
              encounters: [],
            });
          }
          const entry = spellMap.get(aura.guid)!;
          entry.totalCount += aura.totalUses;
          entry.totalUptime += aura.totalUptime;
          entry.totalTime += pt.totalTime;

          let uptimePercent: number | null = null;
          const category = info.category;
          if (
            category !== 'potion' &&
            category !== 'other' &&
            pt.totalTime > 0
          ) {
            uptimePercent = Math.min(
              Math.round((aura.totalUptime / pt.totalTime) * 100),
              100,
            );
          }

          entry.encounters.push({
            fightId: fight.id,
            encounterName: fight.name,
            kill: fight.kill,
            used: true,
            count: aura.totalUses,
            uptimePercent,
          });
        }

        if (pt.casts) {
          for (const cast of pt.casts) {
            const info = TBC_CONSUMABLES.get(cast.abilityGameID);
            if (!info) continue;

            if (!spellMap.has(cast.abilityGameID)) {
              spellMap.set(cast.abilityGameID, {
                totalCount: 0,
                totalUptime: 0,
                totalTime: 0,
                encounters: [],
              });
            }
            const entry = spellMap.get(cast.abilityGameID)!;
            entry.totalCount += cast.total;

            entry.encounters.push({
              fightId: fight.id,
              encounterName: fight.name,
              kill: fight.kill,
              used: true,
              count: cast.total,
              uptimePercent: null,
            });
          }
        }

        for (const spellId of perFightWeaponEnchants
          ?.get(fight.id)
          ?.get(pt.actorId) ?? []) {
          const info = TBC_CONSUMABLES.get(spellId);
          if (!info) continue;
          if (!spellMap.has(spellId)) {
            spellMap.set(spellId, {
              totalCount: 1,
              totalUptime: 0,
              totalTime: 0,
              encounters: [],
            });
          }
          const entry = spellMap.get(spellId)!;
          // Skip if aura/cast data already recorded this fight
          if (entry.encounters.some((e) => e.fightId === fight.id)) continue;
          entry.totalUptime += pt.totalTime;
          entry.totalTime += pt.totalTime;
          entry.encounters.push({
            fightId: fight.id,
            encounterName: fight.name,
            kill: fight.kill,
            used: true,
            count: 1,
            uptimePercent: pt.totalTime > 0 ? 100 : null,
          });
        }
      }
    }

    const results: PlayerConsumables[] = [];

    for (const [actorId, spellMap] of playerData) {
      const actor = actorMap.get(actorId)!;
      const consumables: ConsumableEntry[] = [];

      for (const [spellId, data] of spellMap) {
        const info = TBC_CONSUMABLES.get(spellId)!;
        const category = info.category;

        let uptimePercent: number | null = null;
        if (
          category !== 'potion' &&
          category !== 'other' &&
          data.totalTime > 0
        ) {
          uptimePercent = Math.min(
            Math.round((data.totalUptime / data.totalTime) * 100),
            100,
          );
        }

        // Fill in encounters where this consumable was NOT used
        const allEncounters: EncounterConsumableUsage[] = fights.map(
          (fight) => {
            const existing = data.encounters.find(
              (e) => e.fightId === fight.id,
            );
            if (existing) return existing;
            return {
              fightId: fight.id,
              encounterName: fight.name,
              kill: fight.kill,
              used: false,
              count: 0,
              uptimePercent: null,
            };
          },
        );

        consumables.push({
          name: info.name,
          category,
          icon: info.icon,
          spellId,
          count: data.totalCount,
          uptimePercent,
          encounterBreakdown: allEncounters,
        });
      }

      if (consumables.length === 0) continue;
      consumables.sort((a, b) => a.category.localeCompare(b.category));

      results.push({
        playerName: actor.name,
        class: actor.subType,
        spec: actor.icon?.split('-')[1] ?? '',
        consumables,
      });
    }

    results.sort((a, b) => a.playerName.localeCompare(b.playerName));
    return results;
  }
}
