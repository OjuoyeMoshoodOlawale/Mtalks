<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useCoursesStore } from '@/stores/courses'
import { useAuthStore }    from '@/stores/auth'
import { useUiStore }      from '@/stores/ui'
import api from '@/services/api'
import PublicHeader  from '@/components/layout/PublicHeader.vue'
import PublicFooter  from '@/components/layout/PublicFooter.vue'
import BaseLoader    from '@/components/common/BaseLoader.vue'
import BaseButton    from '@/components/common/BaseButton.vue'
import BaseConfirm   from '@/components/common/BaseConfirm.vue'
import { ChevronDown, ChevronUp, Play, Lock, CheckCircle, BookOpen } from 'lucide-vue-next'

const route   = useRoute()
const router  = useRouter()
const store   = useCoursesStore()
const auth    = useAuthStore()
const ui      = useUiStore()
const openMod = ref(null)
const enrolling = ref(false)
const showConfirm = ref(false)

onMounted(() => store.fetchOne(route.params.slug))

const course    = computed(() => store.current)
const isFree    = computed(() => course.value?.is_free || course.value?.price == 0)
const enrolled  = computed(() => course.value?.enrolled)
const price     = computed(() => isFree.value ? 'Free' : `₦${Number(course.value?.price).toLocaleString()}`)
const totalLessons = computed(() =>
  course.value?.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0)

const enrol = async () => {
  if (!auth.isLoggedIn) { router.push({ name: 'Login', query: { redirect: route.fullPath } }); return }
  if (!isFree.value) {
    // Paid: init Paystack
    enrolling.value = true
    try {
      const { data } = await api.post('/payments/initialize', { type: 'course', item_id: course.value.id })
      if (window.PaystackPop) {
        window.PaystackPop.setup({
          key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
          email: auth.user.email,
          amount: Math.round(course.value.price * 100),
          ref: data.data.reference,
          callback: () => { ui.toast('Payment successful! Enrolling you now…'); store.fetchOne(route.params.slug) },
          onClose: () => {}
        }).openIframe()
      }
    } catch (e) { ui.toastError(e.response?.data?.message || 'Payment init failed') }
    finally { enrolling.value = false }
    return
  }
  // Free
  showConfirm.value = true
}

const confirmEnrol = async () => {
  showConfirm.value = false; enrolling.value = true
  try {
    await api.post('/enrollments', { course_id: course.value.id })
    ui.toast('Enrolled! Start learning now.')
    store.fetchOne(route.params.slug)
  } catch (e) { ui.toastError(e.response?.data?.message || 'Enrolment failed') }
  finally { enrolling.value = false }
}
</script>

<template>
  <PublicHeader />

  <div v-if="store.loading || !course" style="padding:80px 0">
    <BaseLoader />
  </div>
  <div v-else>
    <!-- Hero -->
    <div class="course-hero">
      <div class="container course-hero-inner">
        <div class="course-hero-text">
          <span class="section-tag">Online Course</span>
          <h1 style="color:var(--ma-white);margin:10px 0 16px">{{ course.title }}</h1>
          <p style="color:rgba(255,255,255,.85);font-size:1rem;line-height:1.7;max-width:580px">{{ course.description }}</p>
          <div class="course-stats">
            <span>{{ course.modules?.length || 0 }} modules</span>
            <span>{{ totalLessons }} lessons</span>
            <span>{{ price }}</span>
          </div>
        </div>
        <div class="course-hero-card">
          <img :src="course.thumbnail || 'https://images.unsplash.com/photo-1512314889357-e157c22f938d?w=500&q=80&auto=format'" :alt="course.title" />
          <div class="enrol-card">
            <div class="enrol-price">{{ price }}</div>
            <template v-if="enrolled">
              <RouterLink :to="`/dashboard/courses/${course.id}/learn`" class="btn btn--primary w-full" style="justify-content:center">
                <Play :size="18" /> Continue Learning
              </RouterLink>
              <p style="text-align:center;margin-top:10px;font-size:.8rem;color:var(--ma-text-muted)"><CheckCircle :size="14" color="var(--ma-green)" /> You are enrolled</p>
            </template>
            <template v-else>
              <BaseButton @click="enrol" :loading="enrolling" class="w-full" style="justify-content:center">
                {{ isFree ? 'Enrol for Free' : `Pay ${price}` }}
              </BaseButton>
              <p style="text-align:center;margin-top:8px;font-size:.78rem;color:var(--ma-text-muted)">Lifetime access · Progress tracking</p>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- Curriculum -->
    <section class="section">
      <div class="container" style="max-width:780px">
        <h2 style="margin-bottom:24px">Course Curriculum</h2>
        <div class="curriculum">
          <div v-for="(mod, mi) in course.modules" :key="mod.id" class="module-item">
            <button class="module-header" @click="openMod = openMod === mi ? null : mi">
              <div style="display:flex;align-items:center;gap:12px">
                <BookOpen :size="18" color="var(--ma-green-deep)" />
                <div style="text-align:left">
                  <p style="font-weight:600;color:var(--ma-green-dark);margin:0">{{ mod.title }}</p>
                  <p style="font-size:.8rem;color:var(--ma-text-muted);margin:0">{{ mod.lessons?.length || 0 }} lessons</p>
                </div>
              </div>
              <component :is="openMod === mi ? ChevronUp : ChevronDown" :size="20" />
            </button>
            <div v-show="openMod === mi" class="lesson-list">
              <div v-for="lesson in mod.lessons" :key="lesson.id" class="lesson-row">
                <span style="display:flex;align-items:center;gap:8px">
                  <Lock v-if="!enrolled" :size="14" color="var(--ma-text-muted)" />
                  <Play v-else :size="14" color="var(--ma-green-deep)" />
                  {{ lesson.title }}
                </span>
                <span style="font-size:.78rem;color:var(--ma-text-muted)">{{ lesson.duration_min ? lesson.duration_min+'min' : '' }}</span>
              </div>
              <div v-if="mod.evaluation" class="lesson-row" style="background:var(--ma-gold-tint);border-radius:6px">
                <span style="font-weight:600;color:#7A5F00">Quiz: {{ mod.evaluation.title }}</span>
                <span style="font-size:.78rem;color:#7A5F00">Pass: {{ mod.evaluation.pass_score }}%</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="!enrolled" style="text-align:center;margin-top:36px">
          <BaseButton @click="enrol" :loading="enrolling" variant="primary" size="lg">
            {{ isFree ? 'Enrol for Free' : `Pay ${price} & Enrol` }}
          </BaseButton>
        </div>
      </div>
    </section>
  </div>

  <BaseConfirm
    v-if="showConfirm"
    title="Confirm free enrolment"
    :message="`You're about to enrol in &quot;${course?.title}&quot; for free. Confirm to get instant access.`"
    confirmText="Yes, Enrol Me"
    :loading="enrolling"
    @confirm="confirmEnrol"
    @cancel="showConfirm = false"
  />

  <PublicFooter />
</template>

<style scoped>
.course-hero{background:var(--ma-green-dark);padding:60px 0}
.course-hero-inner{display:grid;grid-template-columns:1fr 380px;gap:48px;align-items:start}
@media(max-width:900px){.course-hero-inner{grid-template-columns:1fr}}
.course-stats{display:flex;gap:16px;margin-top:20px;flex-wrap:wrap}
.course-stats span{background:rgba(255,255,255,.12);color:rgba(255,255,255,.85);padding:6px 14px;border-radius:20px;font-size:.82rem;font-weight:500}
.course-hero-card{background:var(--ma-white);border-radius:var(--radius-lg);overflow:hidden;box-shadow:var(--shadow-lg)}
.course-hero-card img{width:100%;height:200px;object-fit:cover}
.enrol-card{padding:24px}
.enrol-price{font-family:var(--font-heading);font-size:1.8rem;font-weight:700;color:var(--ma-green-dark);margin-bottom:16px;text-align:center}
.curriculum{border:1px solid var(--ma-border);border-radius:var(--radius-lg);overflow:hidden}
.module-item{border-bottom:1px solid var(--ma-border)}
.module-item:last-child{border-bottom:none}
.module-header{width:100%;display:flex;align-items:center;justify-content:space-between;padding:16px 20px;background:none;cursor:pointer;transition:background var(--trans-fast)}
.module-header:hover{background:var(--ma-green-tint)}
.lesson-list{border-top:1px solid var(--ma-border);background:var(--ma-off-white);padding:8px 12px}
.lesson-row{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;font-size:.875rem;border-radius:6px}
.lesson-row:hover{background:rgba(0,0,0,.03)}
</style>
