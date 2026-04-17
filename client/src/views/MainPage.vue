<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import ReportInput from '../components/ReportInput.vue';

const router = useRouter();
const reportUrl = ref('');

function onSubmit() {
  const input = reportUrl.value.trim();
  if (!input) return;

  const urlMatch = input.match(/warcraftlogs\.com\/reports\/([A-Za-z0-9]+)/);
  const code = urlMatch ? urlMatch[1] : input;
  router.push(`/${code}`);
}
</script>

<template>
  <div
    class="min-h-screen flex flex-col items-center justify-center px-4"
    style="background: var(--bg-base)"
  >
    <div class="flex flex-col items-center w-full max-w-2xl">
      <!-- Title -->
      <h1
        class="font-display text-center mb-4 uppercase tracking-widest"
        style="
          font-size: clamp(1.8rem, 5vw, 3rem);
          font-weight: 700;
          color: var(--gold);
          letter-spacing: 0.12em;
          line-height: 1.2;
        "
      >
        WoW TBC<br class="sm:hidden" /><span class="hidden sm:inline"> </span>Log Analyzer
      </h1>

      <div class="divider-gold w-24 mb-4"></div>

      <p
        class="text-xs uppercase tracking-widest mb-10"
        style="color: var(--text-muted); letter-spacing: 0.2em"
      >
        Consumable Analysis · Warcraft Logs Reports
      </p>

      <ReportInput v-model="reportUrl" :loading="false" @submit="onSubmit" />
    </div>
  </div>

</template>
