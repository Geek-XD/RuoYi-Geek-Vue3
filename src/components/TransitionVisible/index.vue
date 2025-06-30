<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'

interface Props {
  name?: string
  tag?: string
  once?: boolean
  stagger?: number
  threshold?: number
}

const props = withDefaults(defineProps<Props>(), {
  name: 'fade-transform',
  tag: 'div',
  once: true,
  stagger: 50,
  threshold: 0.1
})

const rootRef = ref<HTMLElement | null>(null)
const observers: IntersectionObserver[] = []
const observerChildMap = new Map<IntersectionObserver, HTMLElement>()
const childrenVisibility = ref<boolean[]>([])

// 分组元素可见性处理
function handleGroupChild(entry: IntersectionObserverEntry, child: HTMLElement, index: number) {
  const wasVisible = childrenVisibility.value[index]

  if (entry.isIntersecting && !wasVisible) {
    childrenVisibility.value[index] = true

    // 设置交错延迟
    if (props.stagger > 0) {
      child.style.transitionDelay = `${index * props.stagger}ms`
    }

    // 触发进入动画
    child.classList.remove(`${props.name}-enter-from`)
    child.classList.add(`${props.name}-enter-active`, `${props.name}-enter-to`)

    // 动画结束清理
    const cleanup = () => {
      child.classList.remove(`${props.name}-enter-active`)
      if (props.stagger > 0) {
        child.style.transitionDelay = ''
      }
      child.removeEventListener('transitionend', cleanup)
    }
    child.addEventListener('transitionend', cleanup, { once: true })

    // 一次性动画后停止观察
    if (props.once) {
      const observer = Array.from(observerChildMap.entries())
        .find(([_, element]) => element === child)?.[0]
      if (observer) {
        observer.unobserve(child)
      }
    }
  } else if (!entry.isIntersecting && wasVisible && !props.once) {
    childrenVisibility.value[index] = false

    // 重置到初始状态
    child.classList.remove(`${props.name}-enter-to`, `${props.name}-enter-active`)
    child.classList.add(`${props.name}-enter-from`)
    if (props.stagger > 0) {
      child.style.transitionDelay = ''
    }
  }
}

// 初始化分组元素观察
function observeGroupChildren() {
  if (!rootRef.value) return

  const children = Array.from(rootRef.value.children) as HTMLElement[]
  childrenVisibility.value = Array(children.length).fill(false)

  children.forEach((child, index) => {
    // 设置初始状态 - 确保元素是隐藏的
    child.classList.add(`${props.name}-enter-from`)

    // 确保移除任何可能存在的动画类
    child.classList.remove(
      `${props.name}-enter-active`,
      `${props.name}-enter-to`,
      `${props.name}-leave-from`,
      `${props.name}-leave-active`,
      `${props.name}-leave-to`
    )

    const observer = new IntersectionObserver(
      (entries) => entries.forEach(entry => handleGroupChild(entry, child, index)),
      { threshold: props.threshold }
    )

    observer.observe(child)
    observers.push(observer)
    observerChildMap.set(observer, child)
  })
}

// 清理所有观察者
function cleanupObservers() {
  observers.forEach(observer => observer.disconnect())
  observers.length = 0
  observerChildMap.clear()
}

// 初始化组件
function initialize() {
  cleanupObservers()
  observeGroupChildren()
}

onMounted(() => nextTick(initialize))
onBeforeUnmount(cleanupObservers)
</script>

<template>
  <component :is="props.tag" ref="rootRef">
    <slot />
  </component>
</template>
