<script setup>
import { X } from 'lucide-vue-next'
const props = defineProps({
  title:   String,
  size:    { type: String, default: 'md' },
  noPad:   Boolean
})
const emit = defineEmits(['close'])
</script>
<template>
  <Teleport to="body">
    <div class="modal-backdrop" @click.self="emit('close')" role="dialog" :aria-label="title">
      <div :class="['modal', `modal--${size}`]">
        <div class="modal__header" v-if="title || $slots.header">
          <slot name="header">
            <h3 class="modal__title">{{ title }}</h3>
          </slot>
          <button class="modal__close" @click="emit('close')" aria-label="Close">
            <X :size="20" />
          </button>
        </div>
        <div :class="['modal__body', { 'modal__body--no-pad': noPad }]">
          <slot />
        </div>
        <div class="modal__footer" v-if="$slots.footer">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>
<style scoped>
.modal-backdrop{position:fixed;inset:0;background:rgba(13,59,21,.55);display:flex;align-items:center;justify-content:center;z-index:var(--z-modal);padding:16px}
.modal{background:var(--ma-white);border-radius:var(--radius-lg);box-shadow:var(--shadow-lg);width:100%;animation:modalIn .2s ease}
.modal--sm{max-width:400px} .modal--md{max-width:560px} .modal--lg{max-width:780px} .modal--xl{max-width:1000px}
.modal__header{display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid var(--ma-border)}
.modal__title{font-family:var(--font-heading);color:var(--ma-green-dark);font-size:1.1rem;margin:0}
.modal__close{display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:50%;color:var(--ma-text-muted);transition:background var(--trans-fast)}
.modal__close:hover{background:var(--ma-green-tint);color:var(--ma-green-deep)}
.modal__body{padding:24px} .modal__body--no-pad{padding:0}
.modal__footer{padding:16px 24px;border-top:1px solid var(--ma-border);display:flex;gap:12px;justify-content:flex-end}
@keyframes modalIn{from{opacity:0;transform:scale(.95) translateY(10px)}to{opacity:1;transform:scale(1) translateY(0)}}
</style>
