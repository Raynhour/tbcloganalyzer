<script setup lang="ts">
defineProps<{
  modelValue: string;
  loading: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
  submit: [];
}>();

function onSubmit() {
  emit('submit');
}
</script>

<template>
  <form @submit.prevent="onSubmit" class="flex gap-2 w-full">
    <input
      :value="modelValue"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      type="text"
      placeholder="Paste Warcraft Logs report URL or code..."
      :disabled="loading"
      class="input-gold flex-1 px-4 py-3 text-sm rounded"
    />
    <button
      type="submit"
      :disabled="loading || !modelValue.trim()"
      class="font-display px-6 py-3 text-xs uppercase rounded tracking-widest font-semibold transition-opacity duration-200 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
      style="
        background: var(--gold);
        color: #0c0a08;
        border: none;
        letter-spacing: 0.1em;
      "
    >
      {{ loading ? 'Loading…' : 'Analyze' }}
    </button>
  </form>
</template>
