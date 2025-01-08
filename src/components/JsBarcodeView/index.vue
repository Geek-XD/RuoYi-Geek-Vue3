<script setup>
import JsBarcode from 'jsbarcode'
import { nextTick, onMounted } from 'vue';

const props = defineProps({
    data: {
        type: String,
        required: true,
        default: ''
    },
    options: {
        type: Object,
        default: () => ({})
    }
});
watch(() => props.data, () => { generateJsBarcode() });
const generateJsBarcode = async () => {
    JsBarcode(barcodeRef.value, props.data, props.options)
};
const barcodeRef = ref(null)
onMounted(() => {
    generateJsBarcode()
})
</script>
<template>
    <div>
        <img ref="barcodeRef"></img>
    </div>
</template>