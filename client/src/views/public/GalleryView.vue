<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import api from '@/services/api'
import PublicHeader from '@/components/layout/PublicHeader.vue'
import PublicFooter from '@/components/layout/PublicFooter.vue'
import BaseLoader   from '@/components/common/BaseLoader.vue'
import { Image, X, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { useSeoMeta } from '@/composables/useSeoMeta'

useSeoMeta({
  title:       'Gallery',
  description: 'Moments from Muhsinah Academy events, retreats, summits and coaching sessions across Nigeria.',
  url:         '/gallery',
})

const images   = ref([])
const loading  = ref(true)
const category = ref('All')
const lightbox = ref(null)   // index of open image

onMounted(async () => {
  try {
    const { data } = await api.get('/gallery')
    images.value = data.data || []
  } finally { loading.value = false }
})

const categories = computed(() => {
  const cats = [...new Set(images.value.map(i => i.category || 'General'))]
  return ['All', ...cats]
})
const filtered = computed(() =>
  category.value === 'All' ? images.value
    : images.value.filter(i => (i.category || 'General') === category.value))

const openLightbox  = (i) => { lightbox.value = i; document.body.style.overflow = 'hidden' }
const closeLightbox = ()  => { lightbox.value = null; document.body.style.overflow = '' }
const lbNext = () => { if (lightbox.value < filtered.value.length - 1) lightbox.value++ }
const lbPrev = () => { if (lightbox.value > 0) lightbox.value-- }

const onKey = (e) => {
  if (lightbox.value === null) return
  if (e.key === 'Escape')     closeLightbox()
  if (e.key === 'ArrowRight') lbNext()
  if (e.key === 'ArrowLeft')  lbPrev()
}

onMounted(() => {
  window.addEventListener('keydown', onKey)
})
onUnmounted(() => {
  window.removeEventListener('keydown', onKey)
})
</script>

<template>
  <div class="gallery-page">
    <PublicHeader />

    <div class="page-hero">
      <div class="container">
        <span class="section-tag">Gallery</span>
        <h1>Moments That Matter</h1>
        <p>Snapshots from our summits, retreats, and coaching journeys.</p>
      </div>
    </div>

    <div class="container page-body">
      <div v-if="loading" class="center-wrap"><BaseLoader/></div>

      <div v-else-if="!images.length" class="center-wrap empty">
        <Image :size="48" color="var(--ma-border)"/>
        <p>Gallery photos coming soon, insha'Allah.</p>
      </div>

      <template v-else>
        <!-- Category filter -->
        <div class="cat-tabs" v-if="categories.length > 2">
          <button v-for="c in categories" :key="c"
            class="cat-tab" :class="{active: category===c}" @click="category=c">
            {{ c }}
          </button>
        </div>

        <!-- Masonry-ish grid -->
        <div class="gallery-grid">
          <button
            v-for="(img, i) in filtered" :key="img.id"
            class="gallery-item"
            @click="openLightbox(i)"
            :aria-label="`View ${img.title || 'photo'}`"
          >
            <img :src="img.thumb" :alt="img.title || 'Muhsinah Academy'" loading="lazy"/>
            <div class="gallery-overlay" v-if="img.title"><span>{{ img.title }}</span></div>
          </button>
        </div>
      </template>
    </div>

    <!-- Lightbox -->
    <Teleport to="body">
      <div v-if="lightbox !== null" class="lb-overlay" @click.self="closeLightbox">
        <button class="lb-close" @click="closeLightbox" aria-label="Close"><X :size="26"/></button>
        <button class="lb-nav lb-prev" @click="lbPrev" :disabled="lightbox===0" aria-label="Previous">
          <ChevronLeft :size="30"/>
        </button>
        <figure class="lb-figure" @contextmenu.prevent>
          <img :src="filtered[lightbox]?.url" :alt="filtered[lightbox]?.title || ''" draggable="false"/>
          <figcaption v-if="filtered[lightbox]?.title">{{ filtered[lightbox].title }}</figcaption>
        </figure>
        <button class="lb-nav lb-next" @click="lbNext" :disabled="lightbox===filtered.length-1" aria-label="Next">
          <ChevronRight :size="30"/>
        </button>
        <p class="lb-counter">{{ lightbox + 1 }} / {{ filtered.length }}</p>
      </div>
    </Teleport>

    <PublicFooter />
  </div>
</template>

<style scoped>
.gallery-page{background:var(--ma-off-white);min-height:100vh}
.page-hero{background:var(--ma-green-dark);color:#fff;padding:64px 0 48px;text-align:center}
.page-hero h1{font-family:var(--font-heading);font-size:clamp(1.8rem,4vw,2.6rem);margin:10px 0 8px}
.page-hero p{opacity:.75}
.section-tag{display:inline-block;font-size:.75rem;letter-spacing:.2em;text-transform:uppercase;color:var(--ma-gold);font-weight:700}
.page-body{padding:40px 0 72px}
.center-wrap{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:70px 0;color:var(--ma-text-muted)}
/* Category tabs */
.cat-tabs{display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin-bottom:28px}
.cat-tab{padding:7px 18px;border-radius:18px;border:1px solid var(--ma-border);background:var(--ma-white);font-size:.83rem;cursor:pointer;color:var(--ma-text-muted);transition:all .15s}
.cat-tab.active,.cat-tab:hover{background:var(--ma-green);color:#fff;border-color:var(--ma-green)}
/* Grid */
.gallery-grid{columns:3 280px;column-gap:14px}
.gallery-item{display:block;width:100%;margin-bottom:14px;border:none;background:none;padding:0;cursor:zoom-in;border-radius:var(--radius-md);overflow:hidden;position:relative;break-inside:avoid}
.gallery-item img{width:100%;display:block;transition:transform .35s ease}
.gallery-item:hover img{transform:scale(1.04)}
.gallery-overlay{position:absolute;inset:auto 0 0 0;background:linear-gradient(transparent, rgba(13,59,21,.85));color:#fff;font-size:.8rem;padding:18px 12px 10px;opacity:0;transition:opacity .25s}
.gallery-item:hover .gallery-overlay{opacity:1}
/* Lightbox */
.lb-overlay{position:fixed;inset:0;background:rgba(8,20,10,.94);z-index:1100;display:flex;align-items:center;justify-content:center}
.lb-figure{max-width:88vw;max-height:84vh;text-align:center}
.lb-figure img{max-width:100%;max-height:78vh;border-radius:8px;user-select:none;box-shadow:0 10px 50px rgba(0,0,0,.5)}
.lb-figure figcaption{color:rgba(255,255,255,.8);margin-top:12px;font-size:.9rem}
.lb-close{position:absolute;top:18px;right:18px;background:none;border:none;color:rgba(255,255,255,.8);cursor:pointer;padding:6px}
.lb-close:hover{color:#fff}
.lb-nav{position:absolute;top:50%;transform:translateY(-50%);background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.2);color:#fff;width:50px;height:50px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:background .15s}
.lb-nav:hover:not(:disabled){background:var(--ma-green)}
.lb-nav:disabled{opacity:.25;cursor:default}
.lb-prev{left:18px}
.lb-next{right:18px}
.lb-counter{position:absolute;bottom:18px;left:50%;transform:translateX(-50%);color:rgba(255,255,255,.6);font-size:.82rem}
@media(max-width:640px){.lb-nav{width:40px;height:40px}.lb-prev{left:8px}.lb-next{right:8px}}
</style>
