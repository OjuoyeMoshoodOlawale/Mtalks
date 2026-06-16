<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import PublicHeader from '@/components/layout/PublicHeader.vue'
import PublicFooter from '@/components/layout/PublicFooter.vue'
import { Heart, Star, Award, Shield, BookOpen, Users, Handshake, TrendingUp } from 'lucide-vue-next'

import { useSeoMeta } from '@/composables/useSeoMeta'

useSeoMeta({
  title:       'About Us',
  description: 'Learn about Coach Madinah Sanni and the story behind Muhsinah Academy — transforming Muslim marriages and relationships across Nigeria since 2014.',
  url:         '/about',
})

gsap.registerPlugin(ScrollTrigger)

const values = [
  { icon: Heart,     title: 'Compassion',    desc: 'Every client is seen, heard, and treated with genuine warmth.' },
  { icon: Shield,    title: 'Confidentiality',desc: 'All sessions are completely private. What is shared stays here.' },
  { icon: Star,      title: 'Excellence',    desc: 'We commit to the highest professional and ethical standards.' },
  { icon: Award,     title: 'Integrity',     desc: 'Honest, trustworthy guidance rooted in Islamic values.' },
  { icon: TrendingUp,title: 'Growth',        desc: 'Every engagement is designed to produce measurable, lasting change.' },
  { icon: Handshake, title: 'Professionalism',desc: 'Reliable, structured, and respectful coaching at every step.' },
]

onMounted(() => {
  gsap.utils.toArray('.reveal').forEach(el => {
    gsap.from(el, { y: 30, opacity: 0, duration: .8, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 88%' } })
  })
})
</script>

<template>
  <div class="page-view">
  <PublicHeader />

  <div class="about-hero">
    <div class="container">
      <span class="section-tag">Our Story</span>
      <h1>About Muhsinah Academy</h1>
      <p class="section-sub" style="color:rgba(255,255,255,.8)">A coaching practice built on purpose, empathy, and over 15 years of transforming lives.</p>
    </div>
  </div>

  <!-- Founder -->
  <section class="section">
    <div class="container">
      <div class="founder-grid">
        <div class="founder-img reveal">
          <img src="/images/team/coach-madinah.jpg" alt="Coach Madinah Sanni" />
          <div class="founder-badge"><Award :size="20" color="var(--ma-gold)"/> 15+ Years Experience</div>
        </div>
        <div class="reveal">
          <span class="section-tag">Meet Your Coach</span>
          <h2>Coach Madinah Sanni</h2>
          <p style="margin-top:16px;line-height:1.85">Madinah Sanni is an experienced marriage and relationship coach with over 15 years of hands-on expertise helping individuals, couples, and families build healthier relationships and stronger family units.</p>
          <p style="margin-top:12px;line-height:1.85">Her approach blends evidence-based coaching methodologies with deep Islamic wisdom — creating a space where clients feel both professionally guided and spiritually supported.</p>
          <p style="margin-top:12px;line-height:1.85">Through personalized sessions, structured programmes, and group coaching events, she has guided hundreds of clients through some of the most challenging seasons of their relationships — helping them restore trust, improve communication, and rediscover joy in their marriages.</p>
          <div class="founder-stats">
            <div><span class="stat-n">15+</span><span class="stat-l">Years</span></div>
            <div><span class="stat-n">500+</span><span class="stat-l">Clients</span></div>
            <div><span class="stat-n">100%</span><span class="stat-l">Confidential</span></div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Mission & Vision -->
  <section class="section section--green">
    <div class="container">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:40px">
        <div class="mv-card reveal">
          <BookOpen :size="32" color="var(--ma-green-deep)" style="margin-bottom:16px"/>
          <h3>Our Mission</h3>
          <p>To empower individuals and couples with the knowledge, tools, and confidence needed to build healthy, fulfilling, and lasting relationships rooted in Islamic values and human dignity.</p>
        </div>
        <div class="mv-card reveal">
          <Users :size="32" color="var(--ma-green-deep)" style="margin-bottom:16px"/>
          <h3>Our Vision</h3>
          <p>To create stronger families, healthier relationships, and thriving communities through effective coaching, mentorship, and purpose-driven education across Nigeria and beyond.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Core Values -->
  <section class="section">
    <div class="container text-center">
      <span class="section-tag">What We Stand For</span>
      <h2 class="section-title">Our Core Values</h2>
      <div class="grid-3" style="margin-top:36px">
        <div v-for="v in values" :key="v.title" class="value-card reveal">
          <div class="value-icon"><component :is="v.icon" :size="26"/></div>
          <h4>{{ v.title }}</h4>
          <p>{{ v.desc }}</p>
        </div>
      </div>
    </div>
  </section>

  <section class="section section--dark text-center">
    <div class="container">
      <h2 style="color:var(--ma-white);margin-bottom:16px">Ready to Begin Your Transformation?</h2>
      <p style="color:rgba(255,255,255,.75);margin-bottom:32px;max-width:520px;margin-inline:auto">Every healthy family begins with one decision. Let that decision start today.</p>
      <RouterLink to="/consultation" class="btn btn--primary btn--lg">Book a Consultation</RouterLink>
    </div>
  </section>

  <PublicFooter />
  </div>
</template>

<style scoped>
.about-hero{background:var(--ma-green-dark);padding:70px 0;color:var(--ma-white)}
.about-hero h1{color:var(--ma-white);margin:8px 0 12px}
.founder-grid{display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:center}
@media(max-width:768px){.founder-grid{grid-template-columns:1fr}}
.founder-img{position:relative;border-radius:var(--radius-xl);overflow:hidden}
.founder-img img{width:100%;height:420px;object-fit:cover}
.founder-badge{position:absolute;bottom:20px;left:20px;background:var(--ma-green-dark);color:var(--ma-white);padding:10px 16px;border-radius:var(--radius-md);display:flex;align-items:center;gap:8px;font-size:.85rem;font-weight:600}
.founder-stats{display:flex;gap:24px;margin-top:28px}
.founder-stats div{display:flex;flex-direction:column}
.stat-n{font-family:var(--font-heading);font-size:2rem;font-weight:700;color:var(--ma-green)}
.stat-l{font-size:.82rem;color:var(--ma-text-muted)}
.mv-card{background:var(--ma-white);border:1px solid var(--ma-border);border-radius:var(--radius-lg);padding:32px}
.mv-card h3{margin-bottom:12px;color:var(--ma-green-dark)}
.mv-card p{color:var(--ma-text-muted);line-height:1.75}
.value-card{background:var(--ma-white);border:1px solid var(--ma-border);border-radius:var(--radius-lg);padding:28px;text-align:center}
.value-icon{width:60px;height:60px;background:var(--ma-green-tint);color:var(--ma-green-deep);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px}
.value-card h4{color:var(--ma-green-dark);margin-bottom:8px}
.value-card p{font-size:.875rem;color:var(--ma-text-muted);line-height:1.6}
</style>
