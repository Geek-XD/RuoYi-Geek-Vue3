<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick, useSlots } from 'vue'

interface Props {
  name?: string
  appear?: boolean
  tag?: string
  group?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  name: 'fade-transform',
  appear: false,
  tag: 'div',
  group: false
})
const rootRef = ref<HTMLElement | null>(null)
const visible = ref(false)
const observers: IntersectionObserver[] = []

const isGroup = !!props.group
const tag = props.tag
const name = props.name

function observe() {
  if (!rootRef.value) return
  if (isGroup) {
    const children = Array.from(rootRef.value.children) as HTMLElement[]
    children.forEach(child => {
      // 初始状态设为不可见，并准备动画
      child.style.opacity = '0'
      child.classList.add(`${name}-enter-from`)
      child.classList.add(`${name}-enter-active`)

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // 进入可视区域，触发进入动画
            child.classList.remove(`${name}-enter-from`)
            child.classList.add(`${name}-enter-to`)
            child.style.opacity = '1'
            // 动画结束后移除active类
            child.addEventListener('transitionend', () => {
              child.classList.remove(`${name}-enter-active`)
            }, { once: true })
            // 停止观察，动画只触发一次
            observer.unobserve(child)
          }
        })
      }, { threshold: 0.1 })
      observer.observe(child)
      observers.push(observer)
    })
  } else {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        visible.value = entry.isIntersecting
      })
    }, { threshold: 0.1 })
    observer.observe(rootRef.value)
    observers.push(observer)
  }
}

onMounted(() => {
  nextTick(() => {
    observe()
  })
})

onBeforeUnmount(() => {
  observers.forEach(observer => observer.disconnect())
})
</script>

<template>
  <component v-if="isGroup" :is="tag" ref="rootRef">
    <slot />
  </component>
  <transition v-else :name="name" :appear="appear">
    <div v-show="visible" ref="rootRef">
      <slot />
    </div>
  </transition>
</template>
