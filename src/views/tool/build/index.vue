<script setup lang="ts">
import { ref } from 'vue';
const vfdRef = ref(null);
</script>
<template>
    <div class="app-container">
        <v-form-designer ref="vfdRef" style="margin-left: 0;"></v-form-designer>
    </div>
</template>
<style lang="scss"></style>