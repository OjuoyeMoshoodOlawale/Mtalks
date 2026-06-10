<script setup>
import { ref, watch, onMounted } from 'vue'
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'

const props  = defineProps({ modelValue: { type: String, default: '' } })
const emit   = defineEmits(['update:modelValue'])
const content = ref(props.modelValue || '')

watch(() => props.modelValue, (v) => { if (v !== content.value) content.value = v })

const toolbarOptions = [
  [{ header: [2, 3, false] }],
  ['bold', 'italic', 'underline'],
  [{ list: 'ordered' }, { list: 'bullet' }],
  ['blockquote', 'link'],
  ['clean'],
]
</script>

<template>
  <div class="wysiwyg-wrap">
    <QuillEditor
      v-model:content="content"
      content-type="html"
      :toolbar="toolbarOptions"
      theme="snow"
      placeholder="Write lesson notes, transcript, or additional content here..."
      @update:content="emit('update:modelValue', $event)"
    />
  </div>
</template>

<style scoped>
.wysiwyg-wrap { border: 1px solid var(--ma-border); border-radius: var(--radius-md); overflow: hidden; }
.wysiwyg-wrap :deep(.ql-toolbar) { border-bottom: 1px solid var(--ma-border) !important; border-top: none !important; border-left: none !important; border-right: none !important; background: var(--ma-off-white); }
.wysiwyg-wrap :deep(.ql-toolbar .ql-active) { color: var(--ma-gold) !important; }
.wysiwyg-wrap :deep(.ql-toolbar button:hover) { color: var(--ma-gold) !important; }
.wysiwyg-wrap :deep(.ql-container) { border: none !important; font-family: var(--font-body); font-size: .9rem; min-height: 150px; max-height: 400px; overflow-y: auto; }
.wysiwyg-wrap :deep(.ql-editor) { padding: 12px 16px; line-height: 1.7; }
.wysiwyg-wrap :deep(.ql-editor.ql-blank::before) { color: var(--ma-text-muted); font-style: italic; }
</style>
