<script setup>
import { onMounted, onUnmounted } from 'vue'
import { X } from 'lucide-vue-next'

const props = defineProps({
  title:      String,
  size:       { type: String, default: 'md' },
  noPad:      Boolean,
  /** persistent: true  → clicking backdrop does NOT close (preserves form data) */
  persistent: { type: Boolean, default: true },
})
const emit = defineEmits(['close'])

const onKey = (e) => { if (e.key === 'Escape' && !props.persistent) emit('close') }
onMounted(()  => document.addEventListener('keydown', onKey))
onUnmounted(() => document.removeEventListener('keydown', onKey))
</script>

<template>
  <Teleport to="body">
    <div
      class="modal-backdrop"
      role="dialog"
      :aria-label="title"
      @click.self="!persistent && emit('close')"
    >
      <div :class="['modal', `modal--${size}`]">
        <!-- Header -->
        <div class="modal__header" v-if="title || $slots.header">
          <slot name="header">
            <h3 class="modal__title">{{ title }}</h3>
          </slot>
          <button class="modal__close" @click="emit('close')" aria-label="Close modal">
            <X :size="20" />
          </button>
        </div>

        <!-- Body — scrollable -->
        <div :class="['modal__body', { 'modal__body--no-pad': noPad }]">
          <slot />
        </div>

        <!-- Footer -->
        <div class="modal__footer" v-if="$slots.footer">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed; inset: 0;
  background: rgba(13,59,21,.55);
  display: flex; align-items: center; justify-content: center;
  z-index: var(--z-modal, 500);
  padding: 16px;
}
.modal {
  background: var(--ma-white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  width: 100%;
  display: flex; flex-direction: column;
  /* Never taller than 92% of viewport */
  max-height: calc(100vh - 32px);
  animation: modalIn .2s ease;
}
.modal--sm  { max-width: 420px }
.modal--md  { max-width: 580px }
.modal--lg  { max-width: 800px }
.modal--xl  { max-width: 1020px }

.modal__header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 24px;
  border-bottom: 1px solid var(--ma-border);
  flex-shrink: 0;   /* header never shrinks */
}
.modal__title {
  font-family: var(--font-heading);
  color: var(--ma-green-dark);
  font-size: 1.1rem; margin: 0;
}
.modal__close {
  display: flex; align-items: center; justify-content: center;
  width: 32px; height: 32px; border-radius: 50%;
  color: var(--ma-text-muted);
  transition: background var(--trans-fast);
  flex-shrink: 0;
}
.modal__close:hover { background: var(--ma-green-tint); color: var(--ma-green-deep) }

/* KEY FIX: body scrolls, header/footer stay fixed */
.modal__body {
  padding: 24px;
  overflow-y: auto;   /* ← scrolls when content overflows */
  flex: 1;
  overscroll-behavior: contain;
}
.modal__body--no-pad { padding: 0 }

.modal__footer {
  padding: 14px 24px;
  border-top: 1px solid var(--ma-border);
  display: flex; gap: 12px; justify-content: flex-end;
  flex-shrink: 0;   /* footer never shrinks */
  background: var(--ma-white);
}

@keyframes modalIn {
  from { opacity: 0; transform: scale(.95) translateY(10px) }
  to   { opacity: 1; transform: scale(1)  translateY(0) }
}

/* Mobile — full-width sheet */
@media(max-width: 600px) {
  .modal-backdrop { align-items: flex-end; padding: 0 }
  .modal {
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    max-height: 92vh;
    animation: sheetIn .25s ease;
  }
  @keyframes sheetIn {
    from { transform: translateY(100%) }
    to   { transform: translateY(0) }
  }
}
</style>
