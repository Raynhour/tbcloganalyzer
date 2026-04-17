<script setup lang="ts">
import { ref, computed } from 'vue';
import { useLazyQuery } from '@vue/apollo-composable';
import { GET_PLAYER_FIGHT_RAW_DATA } from '../graphql/queries';
import type { ConsumableReport } from '../types/consumables';
import { classColor, classIcon } from '../constants/classConfig';
import { computeMissingConsumables } from '../constants/missingConsumables';
import type { MissingType } from '../constants/missingConsumables';
import MissingConsumableBadge from './MissingConsumableBadge.vue';
import ConsumableMatrix from './ConsumableMatrix.vue';

const props = defineProps<{
  report: ConsumableReport;
  reportCode: string;
  fightId: number | null;
}>();

function formatSpec(spec: string): string {
  return spec.replace(/([a-z])([A-Z])/g, '$1 $2');
}

const categoryColors: Record<string, string> = {
  flask: 'bg-purple-900/40 text-purple-300',
  elixir: 'bg-blue-900/40 text-blue-300',
  potion: 'bg-red-900/40 text-red-300',
  food: 'bg-green-900/40 text-green-300',
  scroll: 'bg-yellow-900/40 text-yellow-300',
  weapon: 'bg-orange-900/40 text-orange-300',
  jc_neck: 'bg-pink-900/40 text-pink-300',
  sapper: 'bg-amber-900/40 text-amber-300',
  other: 'bg-gray-800 text-gray-400',
};

const categoryLabels: Record<string, string> = {
  flask: 'Flask',
  elixir: 'Elixir',
  potion: 'Potion',
  food: 'Food',
  scroll: 'Scroll',
  weapon: 'Weapon',
  jc_neck: 'JC neck',
  sapper: 'Sapper',
  other: 'Other',
};

interface UniqueConsumable {
  spellId: number;
  name: string;
  icon: string;
  category: string;
}

const viewMode = ref<'matrix' | 'detail'>('matrix');

const expandedFilterCategories = ref<Set<string>>(new Set());
const selectedSpellIds = ref<Set<number>>(new Set());
const selectedMissingTypes = ref<Set<MissingType>>(new Set());
const selectedMissingSpellIds = ref<Set<number>>(new Set());


// Consumables that always appear in the filter regardless of report data
const PINNED_CONSUMABLES: UniqueConsumable[] = [
  { spellId: 25294, name: 'Brilliant Mana Oil',          icon: 'inv_potion_100',               category: 'weapon' },
  { spellId: 25124, name: 'Superior Mana Oil',            icon: 'inv_potion_98',                category: 'weapon' },
  { spellId: 25122, name: 'Brilliant Wizard Oil',         icon: 'inv_potion_105',               category: 'weapon' },
  { spellId: 25123, name: 'Superior Wizard Oil',          icon: 'inv_potion_105',               category: 'weapon' },
  { spellId: 28898, name: 'Blessed Wizard Oil',           icon: 'inv_potion_105',               category: 'weapon' },
  { spellId: 34339, name: 'Adamantite Sharpening Stone',  icon: 'inv_stone_sharpeningstone_05', category: 'weapon' },
  { spellId: 34340, name: 'Adamantite Weightstone',       icon: 'inv_stone_weightstone_05',     category: 'weapon' },
];

const consumablesByCategory = computed(() => {
  const map = new Map<string, Map<number, UniqueConsumable>>();

  for (const c of PINNED_CONSUMABLES) {
    if (!map.has(c.category)) map.set(c.category, new Map());
    map.get(c.category)!.set(c.spellId, c);
  }

  for (const player of props.report.players) {
    for (const c of player.consumables) {
      if (!map.has(c.category)) map.set(c.category, new Map());
      const catMap = map.get(c.category)!;
      if (!catMap.has(c.spellId)) {
        catMap.set(c.spellId, { spellId: c.spellId, name: c.name, icon: c.icon, category: c.category });
      }
    }
  }
  return Object.keys(categoryColors)
    .filter((cat) => map.has(cat))
    .map((cat) => ({ category: cat, consumables: [...map.get(cat)!.values()] }));
});

function toggleFilterCategory(cat: string) {
  const newSet = new Set(expandedFilterCategories.value);
  if (newSet.has(cat)) {
    newSet.delete(cat);
  } else {
    newSet.add(cat);
  }
  expandedFilterCategories.value = newSet;
}

function consumableFilterState(spellId: number): 0 | 1 | 2 {
  if (selectedSpellIds.value.has(spellId)) return 1;
  if (selectedMissingSpellIds.value.has(spellId)) return 2;
  return 0;
}

function cycleConsumableFilter(spellId: number) {
  const state = consumableFilterState(spellId);
  const newInclude = new Set(selectedSpellIds.value);
  const newExclude = new Set(selectedMissingSpellIds.value);
  newInclude.delete(spellId);
  newExclude.delete(spellId);
  if (state === 0) newInclude.add(spellId);
  else if (state === 1) newExclude.add(spellId);
  selectedSpellIds.value = newInclude;
  selectedMissingSpellIds.value = newExclude;
}

const allMissingTypes: { type: MissingType; label: string }[] = [
  { type: 'battle_elixir', label: 'Battle Elixir' },
  { type: 'guardian_elixir', label: 'Guardian Elixir' },
  { type: 'scroll', label: 'Scroll' },
  { type: 'potion', label: 'Potion' },
  { type: 'weapon_oil', label: 'Weapon Oil' },
  { type: 'weapon_stone', label: 'Weapon Stone' },
];

const availableMissingTypes = computed(() => {
  const presentTypes = new Set<MissingType>();
  for (const player of props.report.players) {
    for (const m of computeMissingConsumables(player)) {
      presentTypes.add(m.type);
    }
  }
  return allMissingTypes.filter((t) => presentTypes.has(t.type));
});

function toggleMissingType(type: MissingType) {
  const newSet = new Set(selectedMissingTypes.value);
  if (newSet.has(type)) {
    newSet.delete(type);
  } else {
    newSet.add(type);
  }
  selectedMissingTypes.value = newSet;
}


const filteredPlayers = computed(() => {
  let players = props.report.players;

  if (selectedSpellIds.value.size > 0) {
    players = players
      .map((p) => ({
        ...p,
        consumables: p.consumables.filter((c) => selectedSpellIds.value.has(c.spellId)),
      }))
      .filter((p) => p.consumables.length > 0);
  }

  if (selectedMissingTypes.value.size > 0) {
    players = players.filter((p) => {
      const missing = computeMissingConsumables(originalPlayer(p.playerName));
      return missing.some((m) => selectedMissingTypes.value.has(m.type));
    });
  }

  if (selectedMissingSpellIds.value.size > 0) {
    players = players.filter((p) => {
      const orig = originalPlayer(p.playerName);
      const usedIds = new Set(orig.consumables.map((c) => c.spellId));
      return [...selectedMissingSpellIds.value].some((id) => !usedIds.has(id));
    });
  }

  return players;
});

function uptimeColor(percent: number): string {
  if (percent >= 80) return 'text-green-400';
  if (percent >= 50) return 'text-yellow-400';
  return 'text-red-400';
}

const expandedRawPlayer = ref<string | null>(null);
const rawData = ref<string | null>(null);
const rawLoading = ref(false);

const { load: loadRaw, onResult: onRawResult, onError: onRawError } = useLazyQuery(GET_PLAYER_FIGHT_RAW_DATA);

onRawResult((result) => {
  rawData.value = JSON.stringify(result.data?.playerFightRawData ?? {}, null, 2);
  rawLoading.value = false;
});

onRawError((err) => {
  rawData.value = `Error: ${err.message}`;
  rawLoading.value = false;
});

function toggleRawData(playerName: string) {
  if (expandedRawPlayer.value === playerName) {
    expandedRawPlayer.value = null;
    rawData.value = null;
    return;
  }

  if (props.fightId == null) return;

  expandedRawPlayer.value = playerName;
  rawData.value = null;
  rawLoading.value = true;

  loadRaw(undefined, {
    reportCode: props.reportCode,
    fightId: props.fightId,
    playerName,
  });
}

// Consumable encounter breakdown (prefetched)
const expandedConsumableKeys = ref<Set<string>>(new Set());

function toggleConsumableBreakdown(playerName: string, spellId: number) {
  const key = `${playerName}:${spellId}`;
  const newSet = new Set(expandedConsumableKeys.value);
  if (newSet.has(key)) {
    newSet.delete(key);
  } else {
    newSet.add(key);
  }
  expandedConsumableKeys.value = newSet;
}

function isConsumableExpanded(playerName: string, spellId: number): boolean {
  return expandedConsumableKeys.value.has(`${playerName}:${spellId}`);
}

function originalPlayer(playerName: string) {
  return props.report.players.find((p) => p.playerName === playerName)!;
}

</script>

<template>
  <div class="w-full max-w-4xl">
    <!-- Report title -->
    <h2 class="font-display text-lg font-semibold mb-5 tracking-wide" style="color: var(--text-primary); letter-spacing: 0.04em">
      {{ report.reportTitle }}
    </h2>

    <!-- Consumable filter -->
    <div v-if="consumablesByCategory.length" class="section-panel mb-4">
      <div
        class="flex items-center px-4 py-2.5"
        style="border-bottom: 1px solid var(--border-table)"
      >
        <span class="font-display text-xs uppercase tracking-widest" style="color: var(--text-muted); letter-spacing: 0.18em">
          Filter by consumable
        </span>
        <span
          v-if="selectedSpellIds.size + selectedMissingSpellIds.size > 0"
          class="ml-3 text-xs"
          style="color: var(--text-muted)"
        >
          {{ selectedSpellIds.size + selectedMissingSpellIds.size }} selected ·
          <button
            class="transition-colors"
            style="color: var(--gold)"
            @click="selectedSpellIds = new Set(); selectedMissingSpellIds = new Set()"
          >clear</button>
        </span>
      </div>
      <div class="space-y-px p-1">
        <div
          v-for="group in consumablesByCategory"
          :key="group.category"
          class="rounded overflow-hidden"
          style="border: 1px solid var(--border-subtle)"
        >
          <button
            class="w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors duration-150"
            :style="group.consumables.some((c) => selectedSpellIds.has(c.spellId) || selectedMissingSpellIds.has(c.spellId))
              ? 'background: var(--bg-elevated)'
              : 'background: var(--bg-surface)'"
            @click="toggleFilterCategory(group.category)"
          >
            <svg
              class="w-2.5 h-2.5 shrink-0 transition-transform duration-150"
              :class="{ 'rotate-90': expandedFilterCategories.has(group.category) }"
              style="color: var(--text-muted)"
              viewBox="0 0 12 12" fill="currentColor"
            >
              <path d="M4 2l4 4-4 4z" />
            </svg>
            <span
              class="inline-block px-2 py-0.5 text-xs font-medium rounded-full"
              :class="categoryColors[group.category] ?? categoryColors.other"
            >
              {{ categoryLabels[group.category] ?? group.category }}
            </span>
            <span class="ml-auto text-[10px]" style="color: var(--text-muted)">{{ group.consumables.length }}</span>
          </button>
          <div
            v-if="expandedFilterCategories.has(group.category)"
            class="px-3 py-2 space-y-0.5"
            style="background: var(--bg-base); border-top: 1px solid var(--border-table)"
          >
            <div
              v-for="cons in group.consumables"
              :key="cons.spellId"
              class="flex items-center gap-2 px-2 py-1 rounded text-xs transition-colors duration-100 cursor-default"
              style="color: var(--text-secondary)"
            >
              <button
                :data-testid="`consumable-toggle-${cons.spellId}`"
                class="w-4 h-4 rounded border text-[10px] flex items-center justify-center shrink-0 transition-colors duration-150"
                :class="consumableFilterState(cons.spellId) === 1
                  ? 'bg-green-700 border-green-500 text-white'
                  : consumableFilterState(cons.spellId) === 2
                    ? 'bg-red-800 border-red-600 text-white'
                    : ''"
                :style="consumableFilterState(cons.spellId) === 0
                  ? 'background: var(--bg-elevated); border-color: var(--border-default)'
                  : ''"
                @click.stop="cycleConsumableFilter(cons.spellId)"
              >
                <span v-if="consumableFilterState(cons.spellId) === 1">✓</span>
                <span v-else-if="consumableFilterState(cons.spellId) === 2">✗</span>
              </button>
              <img
                v-if="cons.icon"
                :src="`https://wow.zamimg.com/images/wow/icons/small/${cons.icon}.jpg`"
                :alt="cons.name"
                class="w-4 h-4 rounded"
              />
              <span>{{ cons.name }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Missing consumable filter -->
    <div v-if="availableMissingTypes.length" class="section-panel mb-6">
      <div
        class="flex items-center px-4 py-2.5"
        style="border-bottom: 1px solid var(--border-table)"
      >
        <span class="font-display text-xs uppercase tracking-widest" style="color: var(--text-muted); letter-spacing: 0.18em">
          Filter by missing
        </span>
        <span v-if="selectedMissingTypes.size > 0" class="ml-3 text-xs" style="color: var(--text-muted)">
          <button class="transition-colors" style="color: var(--gold)" @click="selectedMissingTypes = new Set()">clear</button>
        </span>
      </div>
      <div class="flex flex-wrap gap-2 p-3">
        <button
          v-for="t in availableMissingTypes"
          :key="t.type"
          class="cursor-pointer transition-opacity duration-150"
          :style="selectedMissingTypes.has(t.type) ? '' : 'opacity: 0.65'"
          @click="toggleMissingType(t.type)"
        >
          <MissingConsumableBadge
            :type="t.type"
            :label="t.label"
            :active="selectedMissingTypes.has(t.type)"
          />
        </button>
      </div>
    </div>

    <div v-if="filteredPlayers.length === 0" class="text-center py-10 text-sm" style="color: var(--text-muted)">
      No consumable usage found in this report.
    </div>

    <template v-if="filteredPlayers.length > 0">
      <!-- View mode toggle -->
      <div class="flex items-center gap-1 mb-4">
        <button
          class="px-3 py-1.5 text-xs rounded border transition-all duration-150"
          :class="viewMode === 'matrix' ? 'btn-gold-active' : 'btn-gold-inactive'"
          @click="viewMode = 'matrix'"
        >
          Matrix
        </button>
        <button
          class="px-3 py-1.5 text-xs rounded border transition-all duration-150"
          :class="viewMode === 'detail' ? 'btn-gold-active' : 'btn-gold-inactive'"
          @click="viewMode = 'detail'"
        >
          Detail
        </button>
      </div>

      <ConsumableMatrix
        v-if="viewMode === 'matrix'"
        :report="report"
        :players="filteredPlayers"
      />
    </template>

    <div v-if="viewMode === 'detail'" v-for="player in filteredPlayers" :key="player.playerName" class="mb-6">
      <h3 class="text-sm font-medium mb-2 flex items-center gap-2" style="color: var(--text-primary)">
        <img
          v-if="classIcon(player.class)"
          :src="classIcon(player.class)"
          :alt="player.class"
          class="w-5 h-5"
        />
        <span :style="{ color: classColor(player.class) }">{{ player.playerName }}</span>
        <span v-if="player.spec" class="text-xs font-normal" style="color: var(--text-muted)">{{ formatSpec(player.spec) }}</span>
      </h3>

      <div
        v-if="computeMissingConsumables(originalPlayer(player.playerName)).length"
        class="flex flex-wrap gap-1.5 mb-2"
      >
        <MissingConsumableBadge
          v-for="m in computeMissingConsumables(originalPlayer(player.playerName))"
          :key="m.type"
          :type="m.type"
          :label="m.label"
        />
      </div>

      <table
        class="w-full text-xs text-left rounded overflow-hidden"
        style="border: 1px solid var(--border-table); border-collapse: collapse"
      >
        <thead>
          <tr style="background: var(--bg-elevated)">
            <th class="px-4 py-2 font-medium" style="color: var(--text-muted); border-bottom: 1px solid var(--border-table)">Consumable</th>
            <th class="px-4 py-2 font-medium" style="color: var(--text-muted); border-bottom: 1px solid var(--border-table)">Category</th>
            <th class="px-4 py-2 font-medium text-right" style="color: var(--text-muted); border-bottom: 1px solid var(--border-table)">Count</th>
            <th class="px-4 py-2 font-medium text-right" style="color: var(--text-muted); border-bottom: 1px solid var(--border-table)">Uptime</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="consumable in player.consumables" :key="consumable.spellId">
            <tr
              class="transition-colors duration-100"
              :class="{ 'cursor-pointer': consumable.encounterBreakdown }"
              style="border-top: 1px solid var(--border-table)"
              :style="{ background: 'var(--bg-surface)' }"
              @mouseenter="($event.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)'"
              @mouseleave="($event.currentTarget as HTMLElement).style.background = 'var(--bg-surface)'"
              @click="consumable.encounterBreakdown && toggleConsumableBreakdown(player.playerName, consumable.spellId)"
            >
              <td class="px-4 py-2 flex items-center gap-2" style="color: var(--text-primary)">
                <svg
                  v-if="consumable.encounterBreakdown"
                  class="w-2.5 h-2.5 shrink-0 transition-transform duration-150"
                  :class="{ 'rotate-90': isConsumableExpanded(player.playerName, consumable.spellId) }"
                  style="color: var(--text-muted)"
                  viewBox="0 0 12 12" fill="currentColor"
                >
                  <path d="M4 2l4 4-4 4z" />
                </svg>
                <img
                  v-if="consumable.icon"
                  :src="`https://wow.zamimg.com/images/wow/icons/small/${consumable.icon}.jpg`"
                  :alt="consumable.name"
                  class="w-4 h-4 rounded"
                />
                {{ consumable.name }}
              </td>
              <td class="px-4 py-2">
                <span
                  class="inline-block px-2 py-0.5 text-[10px] font-medium rounded-full"
                  :class="categoryColors[consumable.category] ?? categoryColors.other"
                >
                  {{ consumable.category === 'jc_neck' ? 'JC neck' : consumable.category }}
                </span>
              </td>
              <td class="px-4 py-2 text-right font-data" style="color: var(--text-primary)">
                {{ consumable.count }}
              </td>
              <td class="px-4 py-2 text-right font-data">
                <span
                  v-if="consumable.uptimePercent !== null"
                  :class="uptimeColor(consumable.uptimePercent)"
                >
                  {{ consumable.uptimePercent }}%
                </span>
                <span v-else style="color: var(--text-muted)">&mdash;</span>
              </td>
            </tr>
            <tr
              v-if="isConsumableExpanded(player.playerName, consumable.spellId) && consumable.encounterBreakdown"
              style="border-top: 1px solid var(--border-table)"
            >
              <td colspan="4" class="px-4 py-3" style="background: var(--bg-base)">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  <div
                    v-for="enc in consumable.encounterBreakdown"
                    :key="enc.fightId"
                    class="flex items-center gap-2 px-3 py-1.5 rounded text-xs"
                    :class="enc.used ? 'bg-green-900/20 text-green-300' : 'bg-red-900/20 text-red-400'"
                  >
                    <span class="w-4 text-center">{{ enc.used ? '&#10003;' : '&#10007;' }}</span>
                    <span class="truncate">{{ enc.encounterName }}</span>
                    <span v-if="enc.kill === false" class="text-red-400 text-[10px]">(wipe)</span>
                    <span v-if="enc.used && enc.uptimePercent !== null" class="ml-auto text-[10px] font-data" :class="uptimeColor(enc.uptimePercent)">
                      {{ enc.uptimePercent }}%
                    </span>
                    <span v-else-if="enc.used && enc.count > 0" class="ml-auto text-[10px] font-data" style="color: var(--text-muted)">
                      x{{ enc.count }}
                    </span>
                  </div>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>

      <div v-if="fightId != null" class="mt-2">
        <button
          class="px-3 py-1 text-[10px] rounded border transition-colors duration-150 btn-gold-inactive"
          @click="toggleRawData(player.playerName)"
        >
          {{ expandedRawPlayer === player.playerName ? 'Hide' : 'Show' }} raw data
        </button>
      </div>

      <div v-if="expandedRawPlayer === player.playerName" class="mt-2">
        <div v-if="rawLoading" class="text-xs" style="color: var(--text-muted)">Loading…</div>
        <pre
          v-else-if="rawData"
          class="text-[11px] font-data rounded p-3 overflow-x-auto max-h-96"
          style="color: var(--text-secondary); background: var(--bg-surface); border: 1px solid var(--border-subtle)"
        >{{ rawData }}</pre>
      </div>
    </div>
  </div>
</template>
