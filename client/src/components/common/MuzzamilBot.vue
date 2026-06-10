<script setup>
import { ref, nextTick } from 'vue'
import api from '@/services/api'
import { MessageCircle, X, Send, Sparkles } from 'lucide-vue-next'

const open     = ref(false)
const input    = ref('')
const sending  = ref(false)
const chatBody = ref(null)

const messages = ref([
  {
    from: 'bot',
    text: "Assalamu alaikum!  I'm Muzzamil, your Muhsinah Academy assistant. Ask me about courses, events, consultations, payments, or certificates!"
  }
])

const quickAsks = [
  'What courses do you offer?',
  'How do I book a consultation?',
  'Upcoming events?',
  'How do payments work?'
]

const scrollToBottom = async () => {
  await nextTick()
  if (chatBody.value) chatBody.value.scrollTop = chatBody.value.scrollHeight
}

const send = async (text) => {
  const msg = (text || input.value).trim()
  if (!msg || sending.value) return
  input.value = ''
  messages.value.push({ from: 'user', text: msg })
  scrollToBottom()

  sending.value = true
  messages.value.push({ from: 'bot', text: '…', typing: true })
  scrollToBottom()

  try {
    const { data } = await api.post('/bot/ask', { message: msg })
    messages.value.pop() // remove typing indicator
    messages.value.push({ from: 'bot', text: data.data.answer })
  } catch {
    messages.value.pop()
    messages.value.push({
      from: 'bot',
      text: 'Sorry, I had trouble connecting. Please try again, or reach our team via the Contact page.'
    })
  } finally {
    sending.value = false
    scrollToBottom()
  }
}
</script>

<template>
  <div class="muzzamil-root">
    <!-- Chat panel -->
    <Transition name="muz-pop">
      <div v-if="open" class="muz-panel">
        <!-- Header -->
        <div class="muz-header">
          <div class="muz-avatar"><Sparkles :size="18"/></div>
          <div>
            <p class="muz-name">Muzzamil</p>
            <p class="muz-status"><span class="muz-dot"></span> Muhsinah Academy Assistant</p>
          </div>
          <button class="muz-close" @click="open=false" aria-label="Close chat"><X :size="18"/></button>
        </div>

        <!-- Messages -->
        <div class="muz-body" ref="chatBody">
          <div
            v-for="(m, i) in messages" :key="i"
            :class="['muz-msg', m.from === 'user' ? 'muz-msg--user' : 'muz-msg--bot']"
          >
            <span v-if="m.typing" class="muz-typing">
              <span></span><span></span><span></span>
            </span>
            <template v-else>{{ m.text }}</template>
          </div>

          <!-- Quick asks (only at start) -->
          <div v-if="messages.length <= 1" class="muz-quick">
            <button v-for="q in quickAsks" :key="q" class="muz-chip" @click="send(q)">
              {{ q }}
            </button>
          </div>
        </div>

        <!-- Input -->
        <form class="muz-input-row" @submit.prevent="send()">
          <input
            v-model="input"
            type="text"
            placeholder="Type your question…"
            class="muz-input"
            maxlength="500"
            autocomplete="off"
          />
          <button type="submit" class="muz-send" :disabled="sending || !input.trim()" aria-label="Send">
            <Send :size="16"/>
          </button>
        </form>
      </div>
    </Transition>

    <!-- Floating bubble -->
    <button class="muz-bubble" @click="open = !open" :aria-label="open ? 'Close chat' : 'Chat with Muzzamil'">
      <Transition name="muz-icon" mode="out-in">
        <X v-if="open" :size="24" key="x"/>
        <MessageCircle v-else :size="24" key="chat"/>
      </Transition>
    </button>
  </div>
</template>

<style scoped>
.muzzamil-root{position:fixed;bottom:20px;right:20px;z-index:999;display:flex;flex-direction:column;align-items:flex-end;gap:12px}
/* Bubble */
.muz-bubble{width:54px;height:54px;border-radius:50%;background:var(--ma-green-dark);color:var(--ma-green);border:2px solid var(--ma-green);display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 4px 20px rgba(13,59,21,.35);transition:transform .2s ease, background .2s ease}
.muz-bubble:hover{transform:scale(1.08);background:var(--ma-green);color:var(--ma-green-dark)}
/* Panel */
.muz-panel{width:min(360px, calc(100vw - 40px));height:480px;max-height:calc(100vh - 120px);background:var(--ma-white);border-radius:16px;box-shadow:0 12px 48px rgba(0,0,0,.22);display:flex;flex-direction:column;overflow:hidden;border:1px solid var(--ma-border)}
/* Header */
.muz-header{background:var(--ma-green-dark);color:#fff;padding:14px 16px;display:flex;align-items:center;gap:10px}
.muz-avatar{width:36px;height:36px;border-radius:50%;background:var(--ma-green);color:var(--ma-green-dark);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.muz-name{font-family:var(--font-heading);font-weight:700;font-size:.95rem}
.muz-status{font-size:.7rem;opacity:.75;display:flex;align-items:center;gap:5px}
.muz-dot{width:7px;height:7px;border-radius:50%;background:#4ade80;display:inline-block}
.muz-close{margin-left:auto;background:none;border:none;color:rgba(255,255,255,.7);cursor:pointer;padding:4px}
.muz-close:hover{color:#fff}
/* Body */
.muz-body{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;background:var(--ma-off-white)}
.muz-msg{max-width:82%;padding:10px 14px;border-radius:14px;font-size:.85rem;line-height:1.55;white-space:pre-line;word-break:break-word}
.muz-msg--bot{background:var(--ma-white);border:1px solid var(--ma-border);color:var(--ma-text);align-self:flex-start;border-bottom-left-radius:4px}
.muz-msg--user{background:var(--ma-green-deep);color:#fff;align-self:flex-end;border-bottom-right-radius:4px}
/* Typing dots */
.muz-typing{display:flex;gap:4px;padding:2px 0}
.muz-typing span{width:7px;height:7px;border-radius:50%;background:var(--ma-green);animation:muzBounce 1.2s infinite}
.muz-typing span:nth-child(2){animation-delay:.15s}
.muz-typing span:nth-child(3){animation-delay:.3s}
@keyframes muzBounce{0%,60%,100%{transform:translateY(0);opacity:.4}30%{transform:translateY(-5px);opacity:1}}
/* Quick chips */
.muz-quick{display:flex;flex-wrap:wrap;gap:6px;margin-top:4px}
.muz-chip{font-size:.75rem;padding:6px 12px;border-radius:14px;border:1px solid var(--ma-green);background:var(--ma-green-tint);color:var(--ma-green-deep);cursor:pointer;transition:background .15s}
.muz-chip:hover{background:var(--ma-green);color:#fff}
/* Input */
.muz-input-row{display:flex;gap:8px;padding:12px;border-top:1px solid var(--ma-border);background:var(--ma-white)}
.muz-input{flex:1;padding:9px 14px;border:1px solid var(--ma-border);border-radius:20px;font-size:.85rem;outline:none}
.muz-input:focus{border-color:var(--ma-green)}
.muz-send{width:38px;height:38px;border-radius:50%;background:var(--ma-green);color:var(--ma-green-dark);border:none;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;transition:background .15s}
.muz-send:hover:not(:disabled){background:var(--ma-green-mid);color:#fff}
.muz-send:disabled{opacity:.4;cursor:not-allowed}
/* Transitions */
.muz-pop-enter-active,.muz-pop-leave-active{transition:all .25s ease}
.muz-pop-enter-from,.muz-pop-leave-to{opacity:0;transform:translateY(16px) scale(.96)}
.muz-icon-enter-active,.muz-icon-leave-active{transition:all .15s ease}
.muz-icon-enter-from,.muz-icon-leave-to{opacity:0;transform:rotate(-90deg)}
@media(max-width:480px){.muzzamil-root{bottom:14px;right:14px}.muz-panel{height:70vh}}
@media print{.muzzamil-root{display:none}}
</style>
