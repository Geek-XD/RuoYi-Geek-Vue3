<script setup lang="ts">
import { getTemplate, updateTemplate } from '@/api/form/template';
import modal from '@/plugins/modal';
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
const vfDesigner = ref<any>(null);
const route = useRoute();
onMounted(() => {
    console.log(vfDesigner.value);
    const sectionDom: HTMLDivElement = vfDesigner.value.$el;
    const mainHeader = sectionDom.querySelector('.main-header');
    if (route.query.id) {
        getTemplate(route.query.id).then((res: any) => {
            vfDesigner.value.setFormJson(JSON.parse(res.data.formSchema ?? {}));
        })
    }
    // if (mainHeader) {
    //     mainHeader.remove();
    // }
})

const saveFormJson = () => {
    let formJson = vfDesigner.value.getFormJson()
    updateTemplate({
        formId: route.query.id,
        formSchema: JSON.stringify(formJson)
    }).then((res: any) => {
        modal.msgSuccess('保存成功');
    })
    console.log(route.query.id, formJson);
}

</script>
<template>
    <div class="vForm">
        <v-form-designer ref="vfDesigner">
            <template #customSaveButton>
                <el-link type="primary" underline="never" @click="saveFormJson" icon='promotion'>保存</el-link>
            </template>
        </v-form-designer>
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