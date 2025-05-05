<template>
  <card-operations operation="records" @back="$emit('back')" />
</template>

<script setup>
import CardOperations from './CardOperations.vue';
import { defineEmits } from 'vue';

defineEmits(['back']);
</script>