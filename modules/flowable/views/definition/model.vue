<template>
  <div>
    <bpmn-model v-if="dataExit" :xml="xml" :is-view="false" @save="save" @showXML="showXML" />
    <!--在线查看xml-->
    <el-drawer :title="xmlTitle" :modal="false" direction="rtl" v-model="xmlOpen" size="60%">
      <!-- 设置对话框内容高度 -->
      <el-scrollbar>
        <pre v-highlight="xmlData"><code class="xml"></code></pre>
      </el-scrollbar>
    </el-drawer>
  </div>
</template>
<script setup>
import { getCurrentInstance, onMounted, reactive, ref } from 'vue';
import { readXml, roleList, saveXml, userList, expList } from "@ruoyi/module-flowable/api/definition";
import BpmnModel from '@ruoyi/module-flowable/components/Process'
import vkBeautify from 'vkbeautify'
import hljs from 'highlight.js'
import 'highlight.js/styles/atom-one-dark.css'
import modelerStore from '@ruoyi/module-flowable/components/Process/common/global'
import { useRoute } from 'vue-router';

const { proxy } = getCurrentInstance();
const route = useRoute();

const xml = ref("");
const modeler = ref("");
const dataExit = ref(false);
const xmlOpen = ref(false);
const xmlTitle = ref('');
const xmlData = ref('');

const vHighlight = {
  beforeMount(el, binding) {
    const targets = el.querySelectorAll('code');
    let target;
    let i;
    for (i = 0; i < targets.length; i += 1) {
      target = targets[i];
      if (typeof binding.value === 'string') {
        target.textContent = binding.value;
      }
      hljs.highlightBlock(target);
    }
  },
  updated(el, binding) {
    const targets = el.querySelectorAll('code');
    let target;
    let i;
    for (i = 0; i < targets.length; i += 1) {
      target = targets[i];
      if (typeof binding.value === 'string') {
        target.textContent = binding.value;
        hljs.highlightBlock(target);
      }
    }
  }
};

onMounted(() => {
  const deployId = route.query && route.query.deployId;
  if (deployId) {
    getXmlData(deployId);
  }
  getDataList();
});

/** xml 文件 */
function getXmlData(deployId) {
  readXml(deployId).then(res => {
    xml.value = res.data;
    modeler.value = res.data;
  })
}

/** 保存xml */
function save(data) {
  const params = {
    name: data.process.name,
    category: data.process.category,
    xml: data.xml
  }
  saveXml(params).then(res => {
    proxy.$modal.msgSuccess(res.msg)
    const obj = { path: "/flowable/definition", query: { t: Date.now() } };
    proxy.$tab.closeOpenPage(obj);
  })
}

/** 指定流程办理人员列表 */
function getDataList() {
  userList().then(res => {
    modelerStore.userList = res.data;
  })
  roleList().then(res => {
    modelerStore.roleList = res.data;
  })
  expList().then(res => {
    modelerStore.expList = res.data;
    dataExit.value = true;
  });
}

/** 展示xml */
function showXML(xmlValue) {
  xmlTitle.value = 'xml查看';
  xmlOpen.value = true;
  xmlData.value = vkBeautify.xml(xmlValue);
}
</script>
<style lang="scss" scoped>
.content-box {
  line-height: 10px;
}

// 修改对话框高度
.showAll_dialog {
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;

  :deep(.el-dialog) {
    margin: 0 auto !important;
    height: 80%;
    overflow: hidden;
    background-color: #ffffff;

    .el-dialog__body {
      position: absolute;
      left: 0;
      top: 54px;
      bottom: 0;
      right: 0;
      z-index: 1;
      overflow: hidden;
      overflow-y: auto;
      // 下边设置字体，我的需求是黑底白字
      color: #ffffff;
      padding: 0 15px;
    }
  }
}
</style>
