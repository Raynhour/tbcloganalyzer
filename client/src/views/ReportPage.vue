<script setup lang="ts">
import { computed, watch, ref } from 'vue';
import { useQuery, useMutation, useApolloClient } from '@vue/apollo-composable';
import { useRouter } from 'vue-router';
import { GET_CONSUMABLES, CLEAR_REPORT_CACHE } from '../graphql/queries';
import type { ConsumableReport } from '../types/consumables';
import { classConfig, classColor, classIcon } from '../constants/classConfig';
import ReportInput from '../components/ReportInput.vue';
import ConsumableTable from '../components/ConsumableTable.vue';

const props = defineProps<{ id: string; fightId?: string }>();
const router = useRouter();
const reportUrl = ref(props.id);
const bossOnly = ref(true);
const hideWipes = ref(false);
const selectedClasses = ref<Set<string>>(new Set());

const selectedFightId = computed<number | null>(() => {
  if (!props.fightId) return null;
  const n = Number(props.fightId);
  return Number.isFinite(n) ? n : null;
});

const allEncounters = computed(() => report.value?.encounters ?? []);

function filterEncounters(encounters: ConsumableReport['encounters']) {
  return encounters.filter((e) => {
    if (bossOnly.value && e.kill === null) return false;
    if (hideWipes.value && e.kill === false) return false;
    return true;
  });
}

const filteredEncounters = computed(() => filterEncounters(allEncounters.value));

const { result, loading, error } = useQuery<{
  reportConsumables: ConsumableReport;
}>(GET_CONSUMABLES, () => ({
  reportCode: props.id,
  fightId: selectedFightId.value ?? undefined,
  bossOnly: selectedFightId.value === null ? bossOnly.value || undefined : undefined,
  hideWipes: selectedFightId.value === null ? hideWipes.value || undefined : undefined,
}));

const report = computed(() => result.value?.reportConsumables ?? null);

const activeClasses = computed(() => {
  if (!report.value) return [];
  const classes = new Set(report.value.players.map((p) => p.class));
  return Object.keys(classConfig).filter((c) => classes.has(c));
});

const filteredReport = computed(() => {
  if (!report.value) return null;
  if (selectedClasses.value.size === 0) return report.value;
  return {
    ...report.value,
    players: report.value.players.filter((p) => selectedClasses.value.has(p.class)),
  };
});

watch(
  () => props.id,
  (id) => {
    reportUrl.value = id;
    selectedClasses.value = new Set();
  },
);

watch([bossOnly, hideWipes], () => {
  if (selectedFightId.value !== null) {
    const stillVisible = filteredEncounters.value.some((e) => e.id === selectedFightId.value);
    if (!stillVisible) navigateToFight(null);
  }
});

function navigateToFight(fightId: number | null) {
  if (fightId === null) {
    router.push(`/${props.id}`);
  } else {
    router.push(`/${props.id}/${fightId}`);
  }
}

function toggleClassFilter(className: string) {
  const newSet = new Set(selectedClasses.value);
  if (newSet.has(className)) {
    newSet.delete(className);
  } else {
    newSet.add(className);
  }
  selectedClasses.value = newSet;
}

function onSubmit() {
  const input = reportUrl.value.trim();
  if (!input) return;

  const urlMatch = input.match(/warcraftlogs\.com\/reports\/([A-Za-z0-9]+)/);
  const code = urlMatch ? urlMatch[1] : input;
  router.push(`/${code}`);
}

const { client } = useApolloClient();
const { mutate: clearCache, loading: clearingCache } = useMutation(CLEAR_REPORT_CACHE);

async function onClearCache() {
  await clearCache({ reportCode: props.id });
  await client.resetStore();
}
</script>

<template>
  <div
    class="min-h-screen flex flex-col items-center px-4 py-12"
    style="background: var(--bg-base)"
  >
    <!-- Header -->
    <router-link
      to="/"
      class="font-display text-2xl font-bold mb-1 tracking-widest uppercase transition-opacity duration-200 hover:opacity-75"
      style="color: var(--cyan); letter-spacing: 0.1em"
    >
      WoW TBC Log Analyzer
    </router-link>
    <p class="text-xs uppercase tracking-widest mb-8" style="color: var(--text-muted); letter-spacing: 0.2em">
      Consumable Analysis · Warcraft Logs Reports
    </p>

    <div class="flex items-center gap-3 w-full max-w-2xl">
      <div class="flex-1">
        <ReportInput v-model="reportUrl" :loading="loading" @submit="onSubmit" />
      </div>
      <button
        class="px-3 py-2 text-xs rounded border transition-all duration-150 whitespace-nowrap"
        style="border-color: var(--border-subtle); background: var(--bg-surface); color: var(--text-muted)"
        :disabled="clearingCache"
        @click="onClearCache"
      >
        {{ clearingCache ? 'Clearing…' : 'Clear cache' }}
      </button>
    </div>

    <div
      v-if="error"
      class="mt-6 p-4 rounded-lg max-w-2xl w-full text-sm"
      style="background: rgba(127,29,29,0.25); border: 1px solid rgba(185,28,28,0.4); color: #fca5a5"
    >
      {{ error.message }}
    </div>

    <div v-if="loading" class="mt-8 text-sm" style="color: var(--text-muted)">
      Fetching report data…
    </div>

    <div v-if="report" class="mt-8 w-full max-w-4xl">

      <!-- Encounter filter -->
      <div v-if="allEncounters.length" class="section-panel mb-4">
        <div
          class="flex items-center justify-between px-4 py-2.5"
          style="border-bottom: 1px solid var(--border-subtle)"
        >
          <span class="font-display text-xs uppercase tracking-widest" style="color: var(--text-muted); letter-spacing: 0.18em">
            Encounters
          </span>
          <div class="flex items-center gap-4">
            <label class="flex items-center gap-2 text-xs cursor-pointer select-none" style="color: var(--text-secondary)">
              <input
                v-model="bossOnly"
                type="checkbox"
                class="accent-cyan w-3.5 h-3.5 rounded cursor-pointer"
              />
              Boss only
            </label>
            <label class="flex items-center gap-2 text-xs cursor-pointer select-none" style="color: var(--text-secondary)">
              <input
                v-model="hideWipes"
                type="checkbox"
                class="accent-cyan w-3.5 h-3.5 rounded cursor-pointer"
              />
              Hide wipes
            </label>
          </div>
        </div>
        <div class="flex flex-wrap gap-1.5 p-3">
          <button
            class="px-3 py-1.5 text-xs rounded border transition-all duration-150"
            :class="selectedFightId === null ? 'btn-cyan-active' : 'btn-cyan-inactive'"
            @click="navigateToFight(null)"
          >
            All fights
          </button>
          <button
            v-for="encounter in filteredEncounters"
            :key="encounter.id"
            class="px-3 py-1.5 text-xs rounded border transition-all duration-150"
            :class="selectedFightId === encounter.id ? 'btn-cyan-active' : 'btn-cyan-inactive'"
            @click="navigateToFight(encounter.id)"
          >
            {{ encounter.name }}
            <span v-if="encounter.kill === false" class="ml-1 text-red-400 text-[10px]">(wipe)</span>
          </button>
        </div>
      </div>

      <!-- Class filter -->
      <div v-if="activeClasses.length" class="section-panel mb-6">
        <div
          class="px-4 py-2.5"
          style="border-bottom: 1px solid var(--border-subtle)"
        >
          <span class="font-display text-xs uppercase tracking-widest" style="color: var(--text-muted); letter-spacing: 0.18em">
            Classes
          </span>
        </div>
        <div class="flex flex-wrap gap-1.5 p-3">
          <button
            v-for="cls in activeClasses"
            :key="cls"
            class="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded border transition-all duration-150"
            :style="selectedClasses.has(cls)
              ? { borderColor: classColor(cls), background: 'rgba(0,0,0,0.4)', opacity: '1' }
              : { borderColor: 'var(--border-subtle)', background: 'var(--bg-surface)', opacity: '0.55' }"
            @click="toggleClassFilter(cls)"
          >
            <img
              v-if="classIcon(cls)"
              :src="classIcon(cls)"
              :alt="cls"
              class="w-4 h-4 rounded"
            />
            <span :style="{ color: classColor(cls) }">{{ cls }}</span>
          </button>
        </div>
      </div>

      <ConsumableTable :report="filteredReport!" :report-code="id" :fight-id="selectedFightId" />
    </div>
  </div>
</template>
