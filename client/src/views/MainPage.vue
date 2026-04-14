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
    class="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden"
    style="background: var(--bg-base)"
  >
    <!-- Ambient radial glow -->
    <div
      class="absolute inset-0 pointer-events-none"
      style="background: radial-gradient(ellipse 80% 50% at 50% 50%, rgba(196, 151, 60, 0.055) 0%, transparent 65%)"
    ></div>

    <!-- Top border accent -->
    <div
      class="absolute top-0 left-0 right-0 h-px"
      style="background: linear-gradient(to right, transparent, var(--border-accent), transparent)"
    ></div>

    <!-- Bottom border accent -->
    <div
      class="absolute bottom-0 left-0 right-0 h-px"
      style="background: linear-gradient(to right, transparent, var(--border-subtle), transparent)"
    ></div>

    <div class="relative z-10 flex flex-col items-center w-full max-w-2xl">
      <!-- Title -->
      <h1
        class="font-display text-center mb-5 uppercase tracking-widest"
        style="
          font-size: clamp(1.8rem, 5vw, 3rem);
          font-weight: 700;
          color: var(--gold);
          text-shadow: 0 0 40px rgba(196, 151, 60, 0.4), 0 0 80px rgba(196, 151, 60, 0.15);
          letter-spacing: 0.12em;
          line-height: 1.2;
        "
      >
        WoW TBC<br class="sm:hidden" /><span class="hidden sm:inline"> </span>Log Analyzer
      </h1>

      <!-- Decorative divider -->
      <div class="flex items-center gap-4 w-full max-w-xs mb-5">
        <div
          class="flex-1 h-px"
          style="background: linear-gradient(to right, transparent, var(--border-accent))"
        ></div>
        <span style="color: var(--gold); opacity: 0.55; font-size: 11px">✦</span>
        <div
          class="flex-1 h-px"
          style="background: linear-gradient(to left, transparent, var(--border-accent))"
        ></div>
      </div>

      <p
        class="text-xs uppercase tracking-widest mb-12"
        style="color: var(--text-muted); letter-spacing: 0.22em"
      >
        Consumable Analysis · Warcraft Logs Reports
      </p>

      <ReportInput v-model="reportUrl" :loading="false" @submit="onSubmit" />
    </div>
  </div>
</template>
