<template>
  <div
      class="el-input-tag input-tag-wrapper"
      :class="[size ? 'el-input-tag--' + size : '']"
      @click="focusTagInput">
    <el-tag
        v-for="(tag, idx) in innerTags"
        v-bind="$attrs"
        :key="tag"
        :size="size"
        effect="dark"
        closable
        :disable-transitions="false"
        @close="remove(idx)">
      {{tag}}
    </el-tag>
    <input
        v-if="!readOnly"
        class="tag-input"
        :placeholder="placeholder"
        @input="inputTag"
        :value="newTag"
        @keydown.delete.stop = "removeLastTag"
    />
<!--    @keydown = "addNew"
        @blur = "addNew"-->
  </div>
</template>


<script setup>
import { getCurrentInstance, ref, watch } from 'vue'
import { StrUtil } from '@ruoyi/core/utils/StrUtil'

defineOptions({ name: 'ElInputTag' })

const props = defineProps({
  value: {
    type: String,
    default: ''
  },
  addTagOnKeys: {
    type: Array,
    default: () => []
  },
  size: {
    type: String,
    default: 'small'
  },
  placeholder: String,
})

const emit = defineEmits(['input'])
const { proxy } = getCurrentInstance()

const newTag = ref('')
const innerTags = ref([])
const readOnly = ref(true)

watch(() => props.value, (newVal) => {
  if (StrUtil.isNotBlank(newVal)) {
    innerTags.value = newVal.split(',')
  } else {
    innerTags.value = []
  }
}, { immediate: true })

function focusTagInput() {
  if (readOnly.value || !proxy?.$el.querySelector('.tag-input')) {
    return
  }
  proxy.$el.querySelector('.tag-input').focus()
}

function inputTag(ev) {
  newTag.value = ev.target.value
}

function addNew(e) {
  if (e && (!props.addTagOnKeys.includes(e.keyCode)) && (e.type !== 'blur')) {
    return
  }
  if (e) {
    e.stopPropagation()
    e.preventDefault()
  }
  let addSuccess = false
  if (newTag.value.includes(',')) {
    newTag.value.split(',').forEach(item => {
      if (addTag(item.trim())) {
        addSuccess = true
      }
    })
  } else {
    if (addTag(newTag.value.trim())) {
      addSuccess = true
    }
  }
  if (addSuccess) {
    tagChange()
    newTag.value = ''
  }
}

function addTag(tag) {
  tag = tag.trim()
  if (tag && !innerTags.value.includes(tag)) {
    innerTags.value.push(tag)
    return true
  }
  return false
}

function remove(index) {
  innerTags.value.splice(index, 1)
  tagChange()
}

function removeLastTag() {
  if (newTag.value) {
    return
  }
  innerTags.value.pop()
  tagChange()
}

function tagChange() {
  emit('input', innerTags.value)
}
</script>

<style scoped>
.el-form-item.is-error .el-input-tag {
  border-color: #f56c6c;
}
.input-tag-wrapper {
  position: relative;
  font-size: 14px;
  background-color: #fff;
  background-image: none;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
  box-sizing: border-box;
  color: #606266;
  display: inline-block;
  outline: none;
  padding: 0 10px 0 5px;
  transition: border-color .2s cubic-bezier(.645,.045,.355,1);
  width: 100%;
}
.el-tag {
  margin-right: 4px;
}

.tag-input {
  background: transparent;
  border: 0;
  font-size: inherit;
  outline: none;
  padding-left: 0;
  width: 100px;
}
.el-input-tag {
  min-height: 42px;
}
.el-input-tag--small {
  min-height: 32px;
  line-height: 32px;
  font-size: 12px;
}

.el-input-tag--default {
  min-height: 34px;
  line-height: 34px;
}

.el-input-tag--large {
  min-height: 36px;
  line-height: 36px;
}

</style>
