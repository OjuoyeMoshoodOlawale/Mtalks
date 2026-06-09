import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  /* ─ Public ─ */
  { path: '/',             name: 'Home',          component: () => import('@/views/public/HomeView.vue') },
  { path: '/about',        name: 'About',         component: () => import('@/views/public/AboutView.vue') },
  { path: '/services',     name: 'Services',      component: () => import('@/views/public/ServicesView.vue') },
  { path: '/courses',      name: 'Courses',       component: () => import('@/views/public/CoursesView.vue') },
  { path: '/courses/:slug',name: 'CourseDetail',  component: () => import('@/views/public/CourseDetailView.vue') },
  { path: '/events',       name: 'Events',        component: () => import('@/views/public/EventsView.vue') },
  { path: '/events/:slug', name: 'EventDetail',   component: () => import('@/views/public/EventDetailView.vue') },
  { path: '/team',         name: 'Team',          component: () => import('@/views/public/TeamView.vue') },
  { path: '/testimonials', name: 'Testimonials',  component: () => import('@/views/public/TestimonialsView.vue') },
  { path: '/consultation', name: 'Consultation',  component: () => import('@/views/public/ConsultationView.vue') },
  { path: '/contact',      name: 'Contact',       component: () => import('@/views/public/ContactView.vue') },
  { path: '/privacy-policy',name:'Privacy',       component: () => import('@/views/public/LegalView.vue'), props: { page: 'privacy' } },
  { path: '/terms',        name: 'Terms',         component: () => import('@/views/public/LegalView.vue'), props: { page: 'terms' } },

  /* ─ Auth ─ */
  { path: '/login',        name: 'Login',         component: () => import('@/views/auth/LoginView.vue'),   meta: { guestOnly: true } },
  { path: '/register',     name: 'Register',      component: () => import('@/views/auth/RegisterView.vue'),meta: { guestOnly: true } },
  { path: '/verify-email', name: 'VerifyEmail',   component: () => import('@/views/auth/VerifyEmailView.vue') },
  { path: '/forgot-password',name:'ForgotPass',   component: () => import('@/views/auth/ForgotPasswordView.vue'), meta: { guestOnly: true } },

  /* ─ Student ─ */
  { path: '/dashboard',        name: 'Dashboard',    component: () => import('@/views/student/StudentDashboard.vue'), meta: { requiresAuth: true } },
  { path: '/dashboard/courses',name: 'MyCourses',    component: () => import('@/views/student/MyCoursesView.vue'),   meta: { requiresAuth: true } },
  { path: '/dashboard/courses/:id/learn', name: 'Learn', component: () => import('@/views/student/CoursePlayerView.vue'), meta: { requiresAuth: true } },
  { path: '/dashboard/events', name: 'MyEvents',     component: () => import('@/views/student/MyEventsView.vue'),    meta: { requiresAuth: true } },
  { path: '/dashboard/profile',name: 'Profile',      component: () => import('@/views/student/ProfileView.vue'),     meta: { requiresAuth: true } },

  /* ─ Admin ─ */
  { path: '/admin',                  name: 'AdminDash',    component: () => import('@/views/admin/AdminDashboard.vue'),       meta: { requiresAdmin: true } },
  { path: '/admin/courses',          name: 'AdminCourses', component: () => import('@/views/admin/CoursesManagement.vue'),    meta: { requiresAdmin: true } },
  { path: '/admin/courses/:id/edit', name: 'CourseEditor', component: () => import('@/views/admin/CourseEditorView.vue'),     meta: { requiresAdmin: true } },
  { path: '/admin/events',           name: 'AdminEvents',  component: () => import('@/views/admin/EventsManagement.vue'),     meta: { requiresAdmin: true } },
  { path: '/admin/events/:id/edit',  name: 'EventEditor',  component: () => import('@/views/admin/EventEditorView.vue'),      meta: { requiresAdmin: true } },
  { path: '/admin/users',            name: 'AdminUsers',   component: () => import('@/views/admin/UsersManagement.vue'),      meta: { requiresAdmin: true } },
  { path: '/admin/payments',         name: 'AdminPay',     component: () => import('@/views/admin/PaymentsView.vue'),         meta: { requiresAdmin: true } },
  { path: '/admin/analytics',        name: 'Analytics',    component: () => import('@/views/admin/AnalyticsView.vue'),        meta: { requiresAdmin: true } },
  { path: '/admin/team',             name: 'AdminTeam',    component: () => import('@/views/admin/TeamManagement.vue'),       meta: { requiresAdmin: true } },
  { path: '/admin/testimonials',     name: 'AdminTestimonials', component: () => import('@/views/admin/TestimonialsManagement.vue'), meta: { requiresAdmin: true } },
  { path: '/admin/faqs',             name: 'AdminFaqs',    component: () => import('@/views/admin/FaqManagement.vue'),        meta: { requiresAdmin: true } },
  { path: '/admin/settings',         name: 'AdminSettings',component: () => import('@/views/admin/SettingsView.vue'),         meta: { requiresAdmin: true } },
  { path: '/admin/logs',             name: 'AdminLogs',    component: () => import('@/views/admin/ErrorLogsView.vue'),        meta: { requiresAdmin: true } },
  { path: '/admin/messages',         name: 'AdminMessages',component: () => import('@/views/admin/MessagesView.vue'),          meta: { requiresAdmin: true } },

  /* ─ 404 ─ */
  { path: '/:pathMatch(.*)*', name: 'NotFound', component: () => import('@/views/public/NotFoundView.vue') }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0, behavior: 'smooth' })
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (auth.accessToken && !auth.user) await auth.fetchMe()

  if (to.meta.requiresAdmin && !auth.isAdmin)   return { name: 'Home' }
  if (to.meta.requiresAuth  && !auth.isLoggedIn) return { name: 'Login', query: { redirect: to.fullPath } }
  if (to.meta.guestOnly     && auth.isLoggedIn)  return { name: 'Dashboard' }
})

export default router
