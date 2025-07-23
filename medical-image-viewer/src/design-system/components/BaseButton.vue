<template>
  <component
    :is="tag"
    :class="buttonClasses"
    :disabled="disabled || loading"
    :aria-disabled="disabled || loading"
    :aria-label="ariaLabel"
    :type="tag === 'button' ? type : undefined"
    @click="handleClick"
    @keydown="handleKeydown"
  >
    <!-- 加载状态 -->
    <div v-if="loading" class="button-loading">
      <svg class="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" stroke-opacity="0.25"/>
        <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
      </svg>
    </div>

    <!-- 左侧图标 -->
    <div v-if="$slots.icon && !loading" class="button-icon">
      <slot name="icon" />
    </div>

    <!-- 按钮文本 -->
    <span v-if="$slots.default" class="button-text">
      <slot />
    </span>

    <!-- 右侧图标 -->
    <div v-if="$slots.iconRight && !loading" class="button-icon-right">
      <slot name="iconRight" />
    </div>

    <!-- 键盘快捷键提示 -->
    <kbd v-if="shortcut && showShortcut" class="button-shortcut">
      {{ shortcut }}
    </kbd>
  </component>
</template>

<script setup lang="ts">
import { computed, useSlots } from 'vue'
import { designTokens } from '../tokens'

interface Props {
  // 基础属性
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'medical'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  tag?: 'button' | 'a' | 'router-link'
  type?: 'button' | 'submit' | 'reset'
  
  // 状态
  disabled?: boolean
  loading?: boolean
  active?: boolean
  
  // 样式
  fullWidth?: boolean
  rounded?: boolean
  
  // 无障碍访问
  ariaLabel?: string
  shortcut?: string
  showShortcut?: boolean
  
  // 医疗专用
  medical?: boolean
  critical?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  tag: 'button',
  type: 'button',
  disabled: false,
  loading: false,
  active: false,
  fullWidth: false,
  rounded: false,
  showShortcut: false,
  medical: false,
  critical: false
})

const emit = defineEmits<{
  click: [event: MouseEvent]
  keydown: [event: KeyboardEvent]
}>()

const slots = useSlots()

// 计算按钮类名
const buttonClasses = computed(() => {
  const classes = [
    'base-button',
    `base-button--${props.variant}`,
    `base-button--${props.size}`,
  ]

  // 状态类
  if (props.disabled) classes.push('base-button--disabled')
  if (props.loading) classes.push('base-button--loading')
  if (props.active) classes.push('base-button--active')
  
  // 样式类
  if (props.fullWidth) classes.push('base-button--full-width')
  if (props.rounded) classes.push('base-button--rounded')
  
  // 医疗专用类
  if (props.medical) classes.push('base-button--medical')
  if (props.critical) classes.push('base-button--critical')
  
  // 图标类
  if (slots.icon && !slots.default) classes.push('base-button--icon-only')
  if (slots.icon && slots.default) classes.push('base-button--with-icon')

  return classes
})

// 事件处理
const handleClick = (event: MouseEvent) => {
  if (props.disabled || props.loading) {
    event.preventDefault()
    return
  }
  emit('click', event)
}

const handleKeydown = (event: KeyboardEvent) => {
  if (props.disabled || props.loading) {
    event.preventDefault()
    return
  }
  
  // 空格键和回车键触发点击
  if (event.key === ' ' || event.key === 'Enter') {
    event.preventDefault()
    handleClick(event as any)
  }
  
  emit('keydown', event)
}
</script>

<style scoped>
.base-button {
  @apply relative inline-flex items-center justify-center;
  @apply font-medium text-sm leading-5;
  @apply border border-transparent;
  @apply transition-all duration-200 ease-in-out;
  @apply focus:outline-none focus:ring-2 focus:ring-offset-2;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
  @apply select-none;
  
  /* GPU 加速 */
  transform: translateZ(0);
  will-change: transform, opacity;
}

/* 尺寸变体 */
.base-button--xs {
  @apply px-2 py-1 text-xs;
  min-height: 24px;
}

.base-button--sm {
  @apply px-3 py-1.5 text-sm;
  min-height: 32px;
}

.base-button--md {
  @apply px-4 py-2 text-sm;
  min-height: 40px;
}

.base-button--lg {
  @apply px-6 py-3 text-base;
  min-height: 48px;
}

.base-button--xl {
  @apply px-8 py-4 text-lg;
  min-height: 56px;
}

/* 颜色变体 */
.base-button--primary {
  @apply bg-primary-600 text-white;
  @apply hover:bg-primary-700 active:bg-primary-800;
  @apply focus:ring-primary-500;
}

.base-button--secondary {
  @apply bg-neutral-100 text-neutral-900;
  @apply hover:bg-neutral-200 active:bg-neutral-300;
  @apply focus:ring-neutral-500;
}

.base-button--outline {
  @apply bg-transparent text-primary-600 border-primary-600;
  @apply hover:bg-primary-50 active:bg-primary-100;
  @apply focus:ring-primary-500;
}

.base-button--ghost {
  @apply bg-transparent text-neutral-600;
  @apply hover:bg-neutral-100 active:bg-neutral-200;
  @apply focus:ring-neutral-500;
}

.base-button--danger {
  @apply bg-red-600 text-white;
  @apply hover:bg-red-700 active:bg-red-800;
  @apply focus:ring-red-500;
}

.base-button--medical {
  @apply bg-medical-background text-medical-text border-medical-text;
  @apply hover:bg-medical-backgroundSecondary;
  @apply focus:ring-primary-500;
}

/* 状态变体 */
.base-button--active {
  @apply ring-2 ring-primary-500 ring-offset-2;
}

.base-button--loading {
  @apply cursor-wait;
}

.base-button--disabled {
  @apply opacity-50 cursor-not-allowed;
  @apply hover:bg-current active:bg-current;
}

/* 样式变体 */
.base-button--full-width {
  @apply w-full;
}

.base-button--rounded {
  @apply rounded-full;
}

.base-button--icon-only {
  @apply p-2;
  aspect-ratio: 1;
}

.base-button--critical {
  @apply animate-pulse;
}

/* 内部元素样式 */
.button-loading {
  @apply absolute inset-0 flex items-center justify-center;
}

.button-icon {
  @apply flex-shrink-0;
}

.button-icon-right {
  @apply flex-shrink-0 ml-2;
}

.button-text {
  @apply truncate;
}

.button-shortcut {
  @apply ml-2 px-1.5 py-0.5 text-xs;
  @apply bg-black bg-opacity-20 rounded;
  @apply font-mono;
}

/* 医疗专用样式 */
.base-button--medical {
  font-family: v-bind('designTokens.typography.fontFamily.medical.join(", ")');
}

/* 响应式设计 */
@media (max-width: 768px) {
  .base-button {
    @apply min-h-[44px]; /* 移动端最小触摸目标 */
  }
  
  .button-shortcut {
    @apply hidden; /* 移动端隐藏快捷键 */
  }
}

/* 高对比度模式 */
@media (prefers-contrast: high) {
  .base-button {
    @apply border-2;
  }
}

/* 减少动画模式 */
@media (prefers-reduced-motion: reduce) {
  .base-button {
    @apply transition-none;
  }
}

/* 深色模式 */
@media (prefers-color-scheme: dark) {
  .base-button--secondary {
    @apply bg-neutral-800 text-neutral-100;
    @apply hover:bg-neutral-700 active:bg-neutral-600;
  }
  
  .base-button--ghost {
    @apply text-neutral-300;
    @apply hover:bg-neutral-800 active:bg-neutral-700;
  }
}
</style>
