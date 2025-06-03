<template>
  <div>
    <svg-icon icon-class="gitee" @click="goto"  style="font-size: 1.14em;margin-top: 14.3px"/>
  </div>
</template>

<script setup>
const url = ref('https://gitee.com/geek-xd');

function goto() {
  window.open(url.value)
}
</script>
