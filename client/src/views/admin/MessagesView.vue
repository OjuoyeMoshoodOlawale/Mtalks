<script setup>
import { ref, computed, onMounted } from 'vue'
import AdminSidebar from '@/components/layout/AdminSidebar.vue'
import BaseLoader   from '@/components/common/BaseLoader.vue'
import BaseConfirm  from '@/components/common/BaseConfirm.vue'
import api from '@/services/api'
import { Menu, Mail, MailOpen, Trash2, Search, RefreshCw, MessageSquare } from 'lucide-vue-next'
import { useUiStore } from '@/stores/ui'

const ui           = useUiStore()
const sidebarOpen  = ref(false)
const loading      = ref(true)
const messages     = ref([])
const search       = ref('')
const filter       = ref('all')   // all | unread | read
const selected     = ref(null)
const delTarget    = ref(null)
const deleting     = ref(false)

onMounted(fetchAll)

async function fetchAll () {
  loading.value = true
  try {
    const { data } = await api.get('/contacts')
    messages.value = data.data || []
  } catch { ui.toastError('Failed to load messages') }
  finally   { loading.value = false }
}

async function openMessage (msg) {
  selected.value = msg
  if (!msg.is_read) {
    await api.patch(`/contacts/${msg.id}/read`).catch(() => {})
    msg.is_read = 1
  }
}

async function confirmDelete () {
  deleting.value = true
  try {
    await api.delete(`/contacts/${delTarget.value.id}`)
    messages.value = messages.value.filter(m => m.id !== delTarget.value.id)
    if (selected.value?.id === delTarget.value.id) selected.value = null
    ui.toast('Message deleted')
  } catch { ui.toastError('Delete failed') }
  finally { deleting.value = false; delTarget.value = null }
}

const filtered = computed(() => {
  let list = messages.value
  if (filter.value === 'unread') list = list.filter(m => !m.is_read)
  if (filter.value === 'read')   list = list.filter(m =>  m.is_read)
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(m =>
      m.name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      m.subject.toLowerCase().includes(q)
    )
  }
  return list
})

const unreadCount = computed(() => messages.value.filter(m => !m.is_read).length)

const fmtDate = d => new Date(d).toLocaleDateString('en-NG', {
  day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'
})
</script>

<template>
  <div class="admin-layout">
    <AdminSidebar :open="sidebarOpen" @close="sidebarOpen=false" />

    <div class="admin-main">
      <div class="admin-topbar">
        <button class="topbar-toggle hide-desktop" @click="sidebarOpen=true"><Menu :size="22"/></button>
        <h1 class="topbar-title">
          Messages
          <span v-if="unreadCount" class="unread-badge">{{ unreadCount }} unread</span>
        </h1>
        <button class="btn btn--sm btn--outline" @click="fetchAll" style="margin-left:auto">
          <RefreshCw :size="14"/> Refresh
        </button>
      </div>

      <div class="admin-content messages-layout">
        <!-- Left: list panel -->
        <aside class="msg-list-panel">
          <!-- Toolbar -->
          <div class="msg-toolbar">
            <div class="search-wrap">
              <Search :size="14" class="si"/>
              <input v-model="search" placeholder="Search messages…" class="search-inp"/>
            </div>
            <div class="filter-tabs">
              <button v-for="f in ['all','unread','read']" :key="f"
                class="ftab" :class="{active: filter===f}" @click="filter=f">
                {{ f.charAt(0).toUpperCase()+f.slice(1) }}
              </button>
            </div>
          </div>

          <div v-if="loading" style="padding:40px;text-align:center"><BaseLoader/></div>

          <div v-else-if="!filtered.length" class="empty-msg">
            <MessageSquare :size="36" color="var(--ma-border)"/>
            <p>No messages{{ filter!=='all'? ` (${filter})`  :'' }}</p>
          </div>

          <div v-else class="msg-list">
            <div
              v-for="m in filtered" :key="m.id"
              class="msg-item"
              :class="{ 'is-selected': selected?.id===m.id, 'is-unread': !m.is_read }"
              @click="openMessage(m)"
            >
              <div class="msg-avatar">{{ m.name[0].toUpperCase() }}</div>
              <div class="msg-item-body">
                <div class="msg-item-header">
                  <span class="msg-sender">{{ m.name }}</span>
                  <span class="msg-date">{{ fmtDate(m.created_at) }}</span>
                </div>
                <div class="msg-subject">{{ m.subject }}</div>
                <div class="msg-preview">{{ m.message.slice(0,80) }}…</div>
              </div>
              <div v-if="!m.is_read" class="unread-dot"></div>
            </div>
          </div>
        </aside>

        <!-- Right: message detail -->
        <main class="msg-detail">
          <div v-if="!selected" class="msg-detail-empty">
            <Mail :size="48" color="var(--ma-border)"/>
            <p>Select a message to read it</p>
          </div>

          <template v-else>
            <div class="msg-detail-header">
              <div class="msg-meta-row">
                <div class="msg-avatar msg-avatar--lg">{{ selected.name[0].toUpperCase() }}</div>
                <div>
                  <h3>{{ selected.name }}</h3>
                  <a :href="`mailto:${selected.email}`" class="msg-email">{{ selected.email }}</a>
                </div>
                <button class="btn btn--sm btn--danger" style="margin-left:auto"
                  @click="delTarget=selected">
                  <Trash2 :size="14"/> Delete
                </button>
              </div>
              <h2 class="msg-subject-title">{{ selected.subject }}</h2>
              <p class="msg-ts">{{ fmtDate(selected.created_at) }}</p>
            </div>

            <div class="msg-body">{{ selected.message }}</div>

            <div class="msg-actions">
              <a :href="`mailto:${selected.email}?subject=Re: ${encodeURIComponent(selected.subject)}`"
                class="btn btn--primary">
                <Mail :size="15"/> Reply by Email
              </a>
              <a v-if="selected.email"
                :href="`https://wa.me/?text=${encodeURIComponent('Hi '+selected.name+', ')}`"
                target="_blank" class="btn btn--outline">
                WhatsApp
              </a>
            </div>
          </template>
        </main>
      </div>
    </div>

    <BaseConfirm
      v-if="delTarget"
      title="Delete Message"
      :message="`Delete message from ${delTarget.name}? This cannot be undone.`"
      confirmText="Delete"
      :danger="true"
      :loading="deleting"
      @confirm="confirmDelete"
      @cancel="delTarget=null"
    />
  </div>
</template>

<style scoped>
.messages-layout{display:grid;grid-template-columns:360px 1fr;gap:0;min-height:calc(100vh - 60px);border-top:1px solid var(--ma-border)}
@media(max-width:900px){.messages-layout{grid-template-columns:1fr}}
/* List panel */
.msg-list-panel{border-right:1px solid var(--ma-border);display:flex;flex-direction:column;overflow:hidden}
.msg-toolbar{padding:12px 16px;border-bottom:1px solid var(--ma-border);display:flex;flex-direction:column;gap:8px}
.search-wrap{position:relative}
.si{position:absolute;left:9px;top:50%;transform:translateY(-50%);color:var(--ma-text-muted)}
.search-inp{width:100%;padding:7px 10px 7px 30px;border:1px solid var(--ma-border);border-radius:var(--radius-md);font-size:.83rem}
.search-inp:focus{outline:none;border-color:var(--ma-green)}
.filter-tabs{display:flex;gap:4px}
.ftab{padding:4px 12px;border-radius:12px;border:1px solid var(--ma-border);background:var(--ma-white);font-size:.78rem;cursor:pointer;color:var(--ma-text-muted)}
.ftab.active{background:var(--ma-green);color:#fff;border-color:var(--ma-green)}
.msg-list{overflow-y:auto;flex:1}
.msg-item{display:flex;gap:10px;padding:14px 16px;border-bottom:1px solid var(--ma-border);cursor:pointer;position:relative;transition:background var(--trans-fast)}
.msg-item:hover{background:var(--ma-green-tint)}
.msg-item.is-selected{background:var(--ma-green-tint);border-left:3px solid var(--ma-green)}
.msg-item.is-unread .msg-sender{font-weight:700;color:var(--ma-green-dark)}
.msg-avatar{width:36px;height:36px;border-radius:50%;background:var(--ma-green-deep);color:#fff;font-weight:700;font-size:.9rem;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.msg-avatar--lg{width:44px;height:44px;font-size:1.1rem}
.msg-item-body{flex:1;min-width:0}
.msg-item-header{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:2px}
.msg-sender{font-size:.85rem;color:var(--ma-text)}
.msg-date{font-size:.72rem;color:var(--ma-text-muted);white-space:nowrap}
.msg-subject{font-size:.83rem;color:var(--ma-green-dark);margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.msg-preview{font-size:.78rem;color:var(--ma-text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.unread-dot{width:8px;height:8px;background:var(--ma-green);border-radius:50%;flex-shrink:0;align-self:center}
.empty-msg{padding:60px 20px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:10px;color:var(--ma-text-muted)}
/* Detail panel */
.msg-detail{padding:28px;overflow-y:auto}
.msg-detail-empty{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;color:var(--ma-text-muted);text-align:center}
.msg-detail-header{padding-bottom:20px;border-bottom:1px solid var(--ma-border);margin-bottom:20px}
.msg-meta-row{display:flex;align-items:center;gap:12px;margin-bottom:12px}
.msg-meta-row h3{font-family:var(--font-heading);color:var(--ma-green-dark);font-size:1rem}
.msg-email{font-size:.85rem;color:var(--ma-green-mid);text-decoration:none}
.msg-email:hover{text-decoration:underline}
.msg-subject-title{font-family:var(--font-heading);font-size:1.15rem;color:var(--ma-green-dark);margin-bottom:4px}
.msg-ts{font-size:.78rem;color:var(--ma-text-muted)}
.msg-body{font-size:.92rem;line-height:1.8;color:var(--ma-text);white-space:pre-line;background:var(--ma-off-white);padding:20px;border-radius:var(--radius-md);margin-bottom:20px}
.msg-actions{display:flex;gap:10px}
/* topbar badge */
.unread-badge{background:var(--ma-green);color:#fff;font-size:.7rem;font-weight:700;padding:2px 8px;border-radius:10px;margin-left:8px;vertical-align:middle}
.btn--danger{background:#fee2e2;color:#b91c1c;border-color:#fca5a5}
.btn--danger:hover{background:#fca5a5}
</style>
