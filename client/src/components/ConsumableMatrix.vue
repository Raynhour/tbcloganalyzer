<script setup lang="ts">
import { computed } from 'vue';
import type { ConsumableReport, PlayerConsumables, ConsumableEntry } from '../types/consumables';
import { classColor, classIcon } from '../constants/classConfig';
import { computeMissingConsumables } from '../constants/missingConsumables';
import MissingConsumableBadge from './MissingConsumableBadge.vue';

const props = defineProps<{
  report: ConsumableReport;
  players: PlayerConsumables[];
}>();

function formatSpec(spec: string): string {
  return spec.replace(/([a-z])([A-Z])/g, '$1 $2');
}

function uptimeColor(percent: number): string {
  if (percent >= 80) return 'text-green-400';
  if (percent >= 50) return 'text-yellow-400';
  return 'text-red-400';
}

// Encounter IDs that actually have encounterBreakdown data
const encIdsWithData = computed(() => {
  const ids = new Set<number>();
  for (const player of props.players) {
    for (const c of player.consumables) {
      for (const enc of c.encounterBreakdown ?? []) {
        ids.add(enc.fightId);
      }
    }
  }
  return ids;
});

// One column per encounter: All Fights + each fight that has data
const encounterCols = computed(() => [
  { id: null as number | null, name: 'All Fights', kill: null as boolean | null, encounterId: null as number | null },
  ...props.report.encounters.filter((e) => encIdsWithData.value.has(e.id)),
]);

// Consumables used by a player in a specific encounter
function consumablesInEncounter(player: PlayerConsumables, fightId: number): ConsumableEntry[] {
  return player.consumables.filter(
    (c) => c.encounterBreakdown?.find((e) => e.fightId === fightId)?.used === true,
  );
}

// Count/uptime label for a consumable in a specific encounter
function encLabel(c: ConsumableEntry, fightId: number): { uptime: number | null; count: number } {
  const enc = c.encounterBreakdown?.find((e) => e.fightId === fightId);
  return { uptime: enc?.uptimePercent ?? null, count: enc?.count ?? 0 };
}

// Missing consumables for a specific encounter (synthetic player with only that fight's consumables)
function missingInEncounter(player: PlayerConsumables, fightId: number) {
  return computeMissingConsumables({ ...player, consumables: consumablesInEncounter(player, fightId) });
}

function originalPlayer(playerName: string): PlayerConsumables {
  return props.report.players.find((p) => p.playerName === playerName)!;
}
</script>

<template>
  <div class="overflow-x-auto rounded" style="border: 1px solid var(--border-subtle)">
    <table class="text-xs border-collapse w-full" style="background: var(--bg-surface)">
      <thead>
        <tr style="background: var(--bg-elevated)">
          <!-- Player column -->
          <th
            class="sticky left-0 z-10 min-w-44 px-3 py-2.5 text-left font-normal"
            style="
              background: var(--bg-elevated);
              color: var(--text-muted);
              border-bottom: 1px solid var(--border-default);
              border-right: 1px solid var(--border-default);
            "
          >
            Player
          </th>

          <!-- One column per encounter -->
          <th
            v-for="enc in encounterCols"
            :key="enc.id ?? 'all'"
            class="px-3 py-2.5 text-left font-normal"
            style="
              min-width: 180px;
              border-bottom: 1px solid var(--border-default);
              border-left: 1px solid var(--border-subtle);
              color: var(--text-secondary);
            "
          >
            <div class="flex items-center gap-1.5">
              <img
                v-if="enc.id !== null && enc.encounterId"
                :src="`https://assets.rpglogs.com/img/warcraft/bosses/${enc.encounterId % 10000}-icon.jpg`"
                :alt="enc.name"
                class="w-6 h-6 rounded shrink-0"
              />
              <span class="font-display text-[10px] uppercase tracking-wider whitespace-nowrap">
                {{ enc.name }}
              </span>
              <span v-if="enc.kill === false" class="text-[9px] text-red-400 normal-case tracking-normal font-sans">wipe</span>
            </div>
          </th>

        </tr>
      </thead>

      <tbody>
        <tr
          v-for="player in players"
          :key="player.playerName"
          style="border-bottom: 1px solid var(--border-subtle)"
          @mouseenter="($event.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)'"
          @mouseleave="($event.currentTarget as HTMLElement).style.background = ''"
        >
          <!-- Player name (sticky) -->
          <td
            class="sticky left-0 z-10 px-3 py-2 whitespace-nowrap align-top"
            style="background: inherit; border-right: 1px solid var(--border-default)"
          >
            <div class="flex items-center gap-1.5">
              <img
                v-if="classIcon(player.class)"
                :src="classIcon(player.class)"
                :alt="player.class"
                class="w-5 h-5 rounded shrink-0"
              />
              <span :style="{ color: classColor(player.class) }" class="font-medium">{{ player.playerName }}</span>
              <span v-if="player.spec" class="text-[10px]" style="color: var(--text-muted)">{{ formatSpec(player.spec) }}</span>
            </div>
          </td>

          <!-- All Fights cell -->
          <td
            class="px-3 py-2 align-top"
            style="border-left: 1px solid var(--border-subtle)"
          >
            <div class="flex flex-wrap gap-x-3 gap-y-1.5 mb-1.5">
              <div
                v-for="c in player.consumables"
                :key="c.spellId"
                class="flex items-center gap-1"
                :title="c.name"
              >
                <img
                  :src="`https://wow.zamimg.com/images/wow/icons/small/${c.icon}.jpg`"
                  :alt="c.name"
                  class="rounded ring-1 ring-green-500/40"
                  style="width: 20px; height: 20px; min-width: 20px"
                />
                <span
                  v-if="c.uptimePercent !== null"
                  class="text-[10px] font-data"
                  :class="uptimeColor(c.uptimePercent)"
                >{{ c.uptimePercent }}%</span>
                <span v-else class="text-[10px] font-data" style="color: var(--text-muted)">×{{ c.count }}</span>
              </div>
            </div>
            <div v-if="computeMissingConsumables(originalPlayer(player.playerName)).length" class="flex flex-wrap gap-1">
              <MissingConsumableBadge
                v-for="m in computeMissingConsumables(originalPlayer(player.playerName))"
                :key="m.type"
                :type="m.type"
                :label="m.label"
              />
            </div>
          </td>

          <!-- Per-encounter cells -->
          <td
            v-for="enc in encounterCols.slice(1)"
            :key="enc.id!"
            class="px-3 py-2 align-top"
            style="border-left: 1px solid var(--border-subtle)"
          >
            <div v-if="consumablesInEncounter(player, enc.id!).length" class="flex flex-wrap gap-x-3 gap-y-1.5 mb-1.5">
              <div
                v-for="c in consumablesInEncounter(player, enc.id!)"
                :key="c.spellId"
                class="flex items-center gap-1"
                :title="c.name"
              >
                <img
                  :src="`https://wow.zamimg.com/images/wow/icons/small/${c.icon}.jpg`"
                  :alt="c.name"
                  class="rounded ring-1 ring-green-500/40"
                  style="width: 20px; height: 20px; min-width: 20px"
                />
                <template v-if="encLabel(c, enc.id!).uptime !== null">
                  <span
                    class="text-[10px] font-data"
                    :class="uptimeColor(encLabel(c, enc.id!).uptime!)"
                  >{{ encLabel(c, enc.id!).uptime }}%</span>
                </template>
                <span v-else class="text-[10px] font-data" style="color: var(--text-muted)">×{{ encLabel(c, enc.id!).count }}</span>
              </div>
            </div>
            <div v-if="missingInEncounter(player, enc.id!).length" class="flex flex-wrap gap-1">
              <MissingConsumableBadge
                v-for="m in missingInEncounter(player, enc.id!)"
                :key="m.type"
                :type="m.type"
                :label="m.label"
              />
            </div>
            <span
              v-if="!consumablesInEncounter(player, enc.id!).length && !missingInEncounter(player, enc.id!).length"
              style="color: var(--border-default)"
            >—</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
