<script setup>
/**
 * Zero-dependency WYSIWYG editor using native contenteditable.
 * No external packages — works everywhere Vite serves.
 * Outputs HTML, binds with v-model.
 */
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import {
  Bold, Italic, Underline, List, ListOrdered,
  Heading2, Heading3, Quote, Link, Eraser, Minus
} from 'lucide-vue-next'

const props = defineProps({ modelValue: { type: String, default: '' } })
const emit  = defineEmits(['update:modelValue'])

const editor  = ref(null)   // ref to the contenteditable div
const focused = ref(false)
let skipWatch = false

/* Keep DOM in sync when parent changes value */
watch(() => props.modelValue, (v) => {
  if (skipWatch || !editor.value) return
  if (editor.value.innerHTML !== v) editor.value.innerHTML = v || ''
})

onMounted(() => {
  if (editor.value && props.modelValue)
    editor.value.innerHTML = props.modelValue
})

/* Emit on every input */
const onInput = () => {
  skipWatch = true
  emit('update:modelValue', editor.value?.innerHTML || '')
  skipWatch = false
}

/* Apply a format command */
const cmd = (command, value = null) => {
  editor.value?.focus()
  document.execCommand(command, false, value)
  onInput()
}

/* Heading helper */
const heading = (tag) => {
  editor.value?.focus()
  document.execCommand('formatBlock', false, tag)
  onInput()
}

/* Link prompt */
const insertLink = () => {
  const url = window.prompt('Enter URL:', 'https://')
  if (url) cmd('createLink', url)
}

/* Tab key → indent instead of leave */
const onKeydown = (e) => {
  if (e.key === 'Tab') { e.preventDefault(); cmd('insertHTML', '&nbsp;&nbsp;&nbsp;&nbsp;') }
}

const tools = [
  { icon: Heading2,     tip: 'Heading 2',  action: () => heading('h2') },
  { icon: Heading3,     tip: 'Heading 3',  action: () => heading('h3') },
  { sep: true },
  { icon: Bold,         tip: 'Bold (Ctrl+B)',       action: () => cmd('bold') },
  { icon: Italic,       tip: 'Italic (Ctrl+I)',     action: () => cmd('italic') },
  { icon: Underline,    tip: 'Underline (Ctrl+U)',  action: () => cmd('underline') },
  { sep: true },
  { icon: List,         tip: 'Bullet list',    action: () => cmd('insertUnorderedList') },
  { icon: ListOrdered,  tip: 'Numbered list',  action: () => cmd('insertOrderedList') },
  { sep: true },
  { icon: Quote,        tip: 'Blockquote',  action: () => heading('blockquote') },
  { icon: Link,         tip: 'Insert link', action: insertLink },
  { icon: Minus,        tip: 'Divider',     action: () => cmd('insertHorizontalRule') },
  { sep: true },
  { icon: Eraser,       tip: 'Clear formatting', action: () => { cmd('removeFormat'); heading('p') } },
]
</script>

<template>
  <div :class="['wysiwyg', { 'wysiwyg--focused': focused }]">
    <!-- Toolbar -->
    <div class="wysiwyg-toolbar" @mousedown.prevent>
      <template v-for="(t, i) in tools" :key="i">
        <div v-if="t.sep" class="wysiwyg-sep"/>
        <button
          v-else
          type="button"
          class="wysiwyg-btn"
          :title="t.tip"
          @click="t.action"
        >
          <component :is="t.icon" :size="15"/>
        </button>
      </template>
    </div>

    <!-- Editable area -->
    <div
      ref="editor"
      class="wysiwyg-body"
      contenteditable="true"
      data-placeholder="Write lesson notes, key points, transcript..."
      @input="onInput"
      @keydown="onKeydown"
      @focus="focused = true"
      @blur="focused = false"
    />
  </div>
</template>

<style scoped>
.wysiwyg {
  border: 1px solid var(--ma-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--ma-white);
  transition: border-color .15s;
}
.wysiwyg--focused { border-color: var(--ma-green); box-shadow: 0 0 0 3px var(--ma-green-tint); }

/* Toolbar */
.wysiwyg-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 2px;
  padding: 6px 10px;
  background: var(--ma-off-white);
  border-bottom: 1px solid var(--ma-border);
}
.wysiwyg-btn {
  display: flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border-radius: 6px;
  color: var(--ma-text-muted); border: none; background: none; cursor: pointer;
  transition: background .1s, color .1s;
}
.wysiwyg-btn:hover { background: var(--ma-green-tint); color: var(--ma-green-deep); }
.wysiwyg-sep { width: 1px; height: 18px; background: var(--ma-border); margin: 0 4px; }

/* Editable body */
.wysiwyg-body {
  min-height: 160px;
  max-height: 420px;
  overflow-y: auto;
  padding: 14px 16px;
  font-family: var(--font-body);
  font-size: .9rem;
  line-height: 1.75;
  color: var(--ma-text);
  outline: none;
}
.wysiwyg-body:empty::before {
  content: attr(data-placeholder);
  color: var(--ma-text-muted);
  font-style: italic;
  pointer-events: none;
}
/* Rich-text styles inside editor */
.wysiwyg-body :deep(h2) { font-family: var(--font-heading); font-size: 1.15rem; font-weight: 700; color: var(--ma-green-dark); margin: 12px 0 6px; }
.wysiwyg-body :deep(h3) { font-family: var(--font-heading); font-size: 1rem; font-weight: 700; color: var(--ma-green-dark); margin: 10px 0 4px; }
.wysiwyg-body :deep(ul), .wysiwyg-body :deep(ol) { padding-left: 22px; margin: 6px 0; }
.wysiwyg-body :deep(li) { margin: 2px 0; }
.wysiwyg-body :deep(blockquote) { border-left: 3px solid var(--ma-gold); padding-left: 14px; color: var(--ma-text-muted); margin: 8px 0; font-style: italic; }
.wysiwyg-body :deep(a) { color: var(--ma-green-deep); text-decoration: underline; }
.wysiwyg-body :deep(hr) { border: none; border-top: 1px solid var(--ma-border); margin: 12px 0; }
.wysiwyg-body :deep(strong) { font-weight: 700; }
.wysiwyg-body :deep(em) { font-style: italic; }
</style>
