<script setup>
import { Eye, EyeOff } from 'lucide-vue-next'
import { ref } from 'vue'

const props = defineProps({
  modelValue: [String, Number],
  label:      String,
  type:       { type: String, default: 'text' },
  placeholder:String,
  error:      String,
  required:   Boolean
})
const emit  = defineEmits(['update:modelValue'])
const show  = ref(false)
const inputType = () => props.type === 'password' ? (show.value ? 'text' : 'password') : props.type
</script>
<template>
  <div class="form-group">
    <label v-if="label" class="form-label">
      {{ label }} <span v-if="required" style="color:#D32F2F">*</span>
    </label>
    <div style="position:relative">
      <input
        :type="inputType()"
        :value="modelValue"
        :placeholder="placeholder"
        :class="['form-input', { 'is-error': error }]"
        @input="emit('update:modelValue', $event.target.value)"
        v-bind="$attrs"
      />
      <button
        v-if="type === 'password'"
        type="button"
        @click="show = !show"
        style="position:absolute;right:12px;top:50%;transform:translateY(-50%);color:var(--ma-text-muted)"
        :aria-label="show ? 'Hide password' : 'Show password'"
      >
        <EyeOff v-if="show" :size="18" /> <Eye v-else :size="18" />
      </button>
    </div>
    <p v-if="error" class="form-error">{{ error }}</p>
  </div>
</template>
