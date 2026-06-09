<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import PublicHeader from '@/components/layout/PublicHeader.vue'
import PublicFooter from '@/components/layout/PublicFooter.vue'
import HeroCanvas   from '@/components/public/HeroCanvas.vue'
import {
  Heart, BookOpen, Calendar, Users, Award, ShieldCheck, Star, ChevronRight,
  Mic2, MessageCircle, Phone
} from 'lucide-vue-next'

gsap.registerPlugin(ScrollTrigger)

const stats = [
  { value: '15+',  label: 'Years experience' },
  { value: '500+', label: 'Clients helped' },
  { value: '4',    label: 'Service areas' },
  { value: '100%', label: 'Confidential' },
]

const services = [
  { icon: Heart,    title: 'Marriage Coaching',         desc: 'Strengthen your bond, improve communication, and overcome relationship challenges together.' },
  { icon: Users,    title: 'Relationship Coaching',     desc: 'Personalized guidance for individuals seeking healthier, more fulfilling relationships.' },
  { icon: BookOpen, title: 'Premarital Counselling',    desc: 'Prepare for a successful, lasting marriage with structured pre-wedding coaching.' },
  { icon: Mic2,     title: 'Family & Life Coaching',    desc: 'Supporting personal growth, family harmony, and purpose-driven living.' },
]

const whyUs = [
  { icon: Award,       title: '15+ Years Experience',     desc: 'Decades of hands-on coaching have shaped a proven, compassionate methodology.' },
  { icon: Users,       title: 'Hundreds Served',          desc: 'Individuals, couples, and families from diverse backgrounds have transformed their lives.' },
  { icon: ShieldCheck, title: 'Trusted & Confidential',   desc: 'Your privacy is sacred. Every session is held in complete confidence.' },
  { icon: Star,        title: 'Practical Solutions',      desc: 'Actionable tools and strategies you can implement immediately.' },
]

const testimonials = [
  { name: 'Fatimah A.', quote: 'We gained a much better understanding of each other and our communication has improved significantly.', stars: 5 },
  { name: 'Ameerah O.', quote: 'Our relationship was transformed through the guidance and practical tools we received. Alhamdulillah.', stars: 5 },
  { name: 'Zainab M.', quote: 'The coaching sessions gave us clarity, confidence, and a renewed sense of purpose in our marriage.', stars: 5 },
]

const faqItems = [
  { q: 'Are sessions available online?', a: 'Yes, we offer both in-person sessions in Abuja and online coaching via video call.' },
  { q: 'Is coaching confidential?',      a: 'Absolutely. Every session is held in complete confidence. Your privacy is our priority.' },
  { q: 'How many sessions will I need?', a: 'Needs vary by individual or couple. We typically recommend starting with a discovery session.' },
  { q: 'Can I access courses anytime?',  a: 'Yes — once you enrol in a course, you have lifetime access to all lessons and materials.' },
]

const openFaq = ref(null)

onMounted(() => {
  gsap.from('.hero-text > *', {
    y: 40, opacity: 0, duration: 1, stagger: .15, ease: 'power3.out', delay: .5
  })
  gsap.utils.toArray('.reveal').forEach(el => {
    gsap.from(el, { y: 30, opacity: 0, duration: .8, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 88%' }
    })
  })
})
</script>

<template>
  <PublicHeader />

  <!-- ── HERO ── -->
  <section class="hero">
    <HeroCanvas />
    <div class="hero-overlay" />
    <div class="container hero-content">
      <div class="hero-text">
        <span class="badge badge--green hero-badge">Coach Madinah Sanni</span>
        <h1>Transforming Relationships<br><em>Through Guidance & Wisdom</em></h1>
        <p class="hero-sub">With over 15 years of experience, we help individuals, couples, and families navigate challenges, strengthen communication, and build lasting connections.</p>
        <div class="hero-cta">
          <RouterLink to="/consultation" class="btn btn--primary btn--lg">Book a Consultation</RouterLink>
          <RouterLink to="/courses" class="btn btn--outline btn--lg hero-btn-light">Explore Courses</RouterLink>
        </div>
      </div>
    </div>
    <div class="hero-stats">
      <div class="container">
        <div class="stats-row">
          <div v-for="s in stats" :key="s.label" class="stat-item">
            <span class="stat-value">{{ s.value }}</span>
            <span class="stat-label">{{ s.label }}</span>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ── ABOUT TEASER ── -->
  <section class="section">
    <div class="container">
      <div class="about-grid">
        <div class="about-image reveal">
          <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&q=80&auto=format" alt="Coach Madinah Sanni" loading="lazy" />
          <div class="about-badge">
            <Heart :size="20" color="#F0C130" />
            <span>15+ Years of Transforming Lives</span>
          </div>
        </div>
        <div class="about-text reveal">
          <span class="section-tag">Meet Your Coach</span>
          <h2>Coach Madinah Sanni</h2>
          <p>An experienced marriage and relationship coach with over 15 years of practical expertise helping individuals and couples build healthier relationships and stronger families.</p>
          <p style="margin-top:12px">Through personalized coaching, she has guided hundreds of clients to improve communication, resolve conflicts, restore trust, and create lasting relationships rooted in Islamic values.</p>
          <RouterLink to="/about" class="btn btn--primary" style="margin-top:24px">Learn More About Us <ChevronRight :size="18"/></RouterLink>
        </div>
      </div>
    </div>
  </section>

  <!-- ── WHY CHOOSE US ── -->
  <section class="section section--green">
    <div class="container text-center">
      <span class="section-tag">Why Muhsinah Academy</span>
      <h2 class="section-title">What Sets Us Apart</h2>
      <div class="grid-4" style="margin-top:40px">
        <div v-for="w in whyUs" :key="w.title" class="why-card reveal">
          <div class="why-icon"><component :is="w.icon" :size="28" /></div>
          <h4>{{ w.title }}</h4>
          <p>{{ w.desc }}</p>
        </div>
      </div>
    </div>
  </section>

  <!-- ── SERVICES ── -->
  <section class="section">
    <div class="container">
      <div class="text-center" style="margin-bottom:40px">
        <span class="section-tag">Our Services</span>
        <h2>How We Can Help You</h2>
        <p class="section-sub" style="margin:12px auto 0">Every service is tailored to meet you where you are and guide you to where you need to be.</p>
      </div>
      <div class="grid-2">
        <div v-for="s in services" :key="s.title" class="card service-card reveal">
          <div class="service-icon"><component :is="s.icon" :size="30" /></div>
          <h3>{{ s.title }}</h3>
          <p>{{ s.desc }}</p>
          <RouterLink to="/services" class="service-link">Learn more <ChevronRight :size="16"/></RouterLink>
        </div>
      </div>
      <div class="text-center" style="margin-top:36px">
        <RouterLink to="/services" class="btn btn--outline">View All Services</RouterLink>
      </div>
    </div>
  </section>

  <!-- ── TESTIMONIALS ── -->
  <section class="section section--dark">
    <div class="container text-center">
      <span class="section-tag" style="color:var(--ma-gold)">Testimonials</span>
      <h2 style="color:var(--ma-white);margin-bottom:40px">What Our Clients Say</h2>
      <div class="grid-3">
        <div v-for="t in testimonials" :key="t.name" class="testimonial-card reveal">
          <div class="stars">
            <Star v-for="i in t.stars" :key="i" :size="16" fill="#F0C130" color="#F0C130" />
          </div>
          <p>"{{ t.quote }}"</p>
          <strong>— {{ t.name }}</strong>
        </div>
      </div>
      <RouterLink to="/testimonials" class="btn btn--outline" style="margin-top:32px;border-color:rgba(255,255,255,.4);color:#fff">Read More Testimonials</RouterLink>
    </div>
  </section>

  <!-- ── FAQ ── -->
  <section class="section section--tint">
    <div class="container">
      <div class="text-center" style="margin-bottom:36px">
        <span class="section-tag">FAQ</span>
        <h2>Frequently Asked Questions</h2>
      </div>
      <div class="faq-list">
        <div v-for="(item, i) in faqItems" :key="i" class="faq-item reveal">
          <button class="faq-q" @click="openFaq = openFaq === i ? null : i" :aria-expanded="openFaq === i">
            {{ item.q }}
            <ChevronRight :size="18" :class="['faq-arrow', { 'faq-arrow--open': openFaq === i }]" />
          </button>
          <div v-show="openFaq === i" class="faq-a"><p>{{ item.a }}</p></div>
        </div>
      </div>
    </div>
  </section>

  <!-- ── CONTACT CTA ── -->
  <section class="section" style="background:var(--ma-green-tint)">
    <div class="container text-center">
      <span class="section-tag">Get Started</span>
      <h2>Ready to Begin Your Journey?</h2>
      <p class="section-sub" style="margin:12px auto 32px">Take the first step toward building a healthier relationship today. We're here to walk with you.</p>
      <div style="display:flex;flex-wrap:wrap;gap:16px;justify-content:center">
        <RouterLink to="/consultation" class="btn btn--primary btn--lg">Book a Consultation</RouterLink>
        <a href="https://wa.me/2348039632700" target="_blank" rel="noopener" class="btn btn--outline btn--lg">
          <MessageCircle :size="18" /> WhatsApp Us
        </a>
        <RouterLink to="/contact" class="btn btn--outline btn--lg">
          <Phone :size="18" /> Contact Us
        </RouterLink>
      </div>
    </div>
  </section>

  <PublicFooter />
</template>

<style scoped>
/* Hero */
.hero{position:relative;height:100vh;min-height:600px;display:flex;flex-direction:column;overflow:hidden;background:var(--ma-green-dark)}
.hero-overlay{position:absolute;inset:0;background:linear-gradient(135deg,rgba(13,59,21,.82) 0%,rgba(13,59,21,.45) 60%,rgba(13,59,21,.2) 100%);z-index:1}
.hero-content{position:relative;z-index:2;flex:1;display:flex;align-items:center}
.hero-text{max-width:680px}
.hero-badge{margin-bottom:16px;font-size:.8rem;letter-spacing:.06em}
.hero-text h1{color:var(--ma-white);line-height:1.15;margin-bottom:20px}
.hero-text h1 em{font-style:normal;color:var(--ma-green)}
.hero-sub{color:rgba(255,255,255,.82);font-size:1.1rem;max-width:540px;margin-bottom:32px}
.hero-cta{display:flex;flex-wrap:wrap;gap:14px}
.hero-btn-light{border-color:rgba(255,255,255,.5)!important;color:var(--ma-white)!important}
.hero-btn-light:hover{background:rgba(255,255,255,.08)!important}
.hero-stats{position:relative;z-index:2;background:rgba(13,59,21,.7);border-top:1px solid rgba(118,196,66,.3);backdrop-filter:blur(8px)}
.stats-row{display:flex;flex-wrap:wrap;gap:0}
.stat-item{flex:1;min-width:130px;padding:20px 24px;text-align:center;border-right:1px solid rgba(118,196,66,.2)}
.stat-item:last-child{border-right:none}
.stat-value{display:block;font-family:var(--font-heading);font-size:2rem;font-weight:700;color:var(--ma-green)}
.stat-label{display:block;font-size:.8rem;color:rgba(255,255,255,.65);margin-top:2px}
/* About */
.about-grid{display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:center}
@media(max-width:768px){.about-grid{grid-template-columns:1fr}}
.about-image{position:relative;border-radius:var(--radius-xl);overflow:hidden}
.about-image img{width:100%;height:420px;object-fit:cover}
.about-badge{position:absolute;bottom:20px;left:20px;background:var(--ma-green-dark);color:var(--ma-white);padding:10px 16px;border-radius:var(--radius-md);display:flex;align-items:center;gap:8px;font-size:.85rem;font-weight:600}
/* Why */
.why-card{background:var(--ma-white);border:1px solid var(--ma-border);border-radius:var(--radius-lg);padding:28px;text-align:center}
.why-icon{width:60px;height:60px;background:var(--ma-green-tint);color:var(--ma-green-deep);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px}
.why-card h4{font-family:var(--font-heading);margin-bottom:8px;color:var(--ma-green-dark)}
.why-card p{font-size:.9rem;color:var(--ma-text-muted)}
/* Services */
.service-card{padding:32px}
.service-icon{width:56px;height:56px;background:var(--ma-green-tint);color:var(--ma-green-deep);border-radius:var(--radius-md);display:flex;align-items:center;justify-content:center;margin-bottom:20px}
.service-card h3{margin-bottom:10px;font-size:1.15rem}
.service-card p{color:var(--ma-text-muted);font-size:.9rem}
.service-link{display:inline-flex;align-items:center;gap:4px;margin-top:16px;color:var(--ma-green-deep);font-weight:600;font-size:.875rem;transition:gap var(--trans-fast)}
.service-link:hover{gap:8px}
/* Testimonials */
.testimonial-card{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:var(--radius-lg);padding:28px;text-align:left}
.stars{display:flex;gap:2px;margin-bottom:14px}
.testimonial-card p{color:rgba(255,255,255,.8);font-style:italic;font-size:.95rem;line-height:1.7;margin-bottom:12px}
.testimonial-card strong{color:var(--ma-green);font-size:.85rem}
/* FAQ */
.faq-list{max-width:720px;margin:0 auto}
.faq-item{background:var(--ma-white);border:1px solid var(--ma-border);border-radius:var(--radius-md);margin-bottom:10px;overflow:hidden}
.faq-q{width:100%;display:flex;justify-content:space-between;align-items:center;padding:18px 20px;font-weight:600;font-size:.95rem;background:none;cursor:pointer;color:var(--ma-green-dark);text-align:left}
.faq-q:hover{background:var(--ma-green-tint)}
.faq-arrow{transition:transform var(--trans-base);flex-shrink:0}
.faq-arrow--open{transform:rotate(90deg)}
.faq-a{padding:0 20px 18px;color:var(--ma-text-muted);font-size:.9rem;line-height:1.7}
</style>
