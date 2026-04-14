<script setup lang="ts">
import type { MissingType } from '../constants/missingConsumables';

const { type, label, active } = defineProps<{
  type: MissingType;
  label: string;
  active?: boolean;
}>();

const missingTypeIcon: Record<string, string> = {
  battle_elixir: 'inv_potion_127',
  guardian_elixir: 'inv_potion_155',
  scroll: 'inv_scroll_02',
  potion: 'inv_potion_108',
  weapon_oil: 'inv_potion_100',
  weapon_stone: 'inv_stone_sharpeningstone_05',
};
</script>

<template>
  <span
    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border"
    :class="active
      ? 'bg-red-900/70 text-red-300 border-red-600'
      : 'bg-red-900/40 text-red-400 border-red-800/50'"
  >
    <img
      v-if="missingTypeIcon[type]"
      :src="`https://wow.zamimg.com/images/wow/icons/small/${missingTypeIcon[type]}.jpg`"
      :alt="label"
      class="w-4 h-4 rounded"
    />
    <span class="text-red-500">&#10007;</span>
    {{ label }}
  </span>
</template>
