<script setup lang="ts">
import { onMounted, ref } from 'vue';
const vfdRef = ref<any>(null);
onMounted(() => {
    console.log(vfdRef.value);
    const sectionDom: HTMLDivElement = vfdRef.value.$el;
    const mainHeader = sectionDom.querySelector('.main-header');
    // if (mainHeader) {
    //     mainHeader.remove();
    // }
})
</script>
<template>
    <div class="vForm">
        <v-form-designer ref="vfdRef"></v-form-designer>
    </div>
</template>
<style lang="scss" scoped>
.vForm {
    .main-container {
        margin-left: 0 !important;
        height: calc(100vh - 84px) !important;
        overflow-y: auto;
    }

    :deep {
        // .main-header {
        //     display: none;
        // }
    }
}
</style>