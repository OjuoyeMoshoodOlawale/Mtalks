<script setup>
import { RouterLink } from 'vue-router'
import PublicHeader from '@/components/layout/PublicHeader.vue'
import PublicFooter from '@/components/layout/PublicFooter.vue'
import { Heart, Users, BookOpen, Mic2, ChevronRight, CheckCircle } from 'lucide-vue-next'

import { useSeoMeta } from '@/composables/useSeoMeta'

useSeoMeta({
  title:       'Our Services',
  description: 'From life coaching to marriage counselling — explore all the professional services offered by Coach Madinah Sanni and the Muhsinah Academy team.',
  url:         '/services',
})


const services = [
  { icon: Heart, title: 'Marriage Coaching', slug: 'marriage', img: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=600&q=70&auto=format',
    tagline: 'Rebuild. Reconnect. Renew.',
    desc: 'Whether you are newlyweds adjusting to shared life, or a couple navigating deep conflict, our marriage coaching provides structured, evidence-based support to help you rediscover each other.',
    benefits: ['Improved communication skills','Conflict resolution strategies','Rebuilding emotional intimacy','Practical tools for daily harmony','Islamic perspective on marriage roles'] },
  { icon: Users, title: 'Relationship Coaching', slug: 'relationship', img: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&q=70&auto=format',
    tagline: 'For individuals navigating love and connection.',
    desc: 'Whether you are single and seeking healthy patterns, or in a relationship and struggling to grow, individual relationship coaching helps you understand your own dynamics and make intentional choices.',
    benefits: ['Identifying unhealthy relationship patterns','Building self-worth and confidence','Preparing for marriage','Setting healthy boundaries','Developing emotional intelligence'] },
  { icon: BookOpen, title: 'Premarital Counselling', slug: 'premarital', img: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=600&q=70&auto=format',
    tagline: 'Start your marriage the right way.',
    desc: 'Our premarital programme equips couples with the awareness, tools, and conversations they need before they walk down the aisle — preventing unnecessary conflict and building a solid foundation.',
    benefits: ['Understanding each other\'s expectations','Financial compatibility conversations','Communication styles','Family dynamics and in-law relationships','Intimate life and Islamic guidance'] },
  { icon: Mic2, title: 'Family & Life Coaching', slug: 'family', img: 'https://images.unsplash.com/photo-1511895426328-dc8714191011?w=600&q=70&auto=format',
    tagline: 'Supporting the whole family unit.',
    desc: 'From parent-child relationships to personal purpose and identity, our family coaching supports everyone in the household to thrive individually and collectively.',
    benefits: ['Parent-child communication','Parenting strategies for different ages','Personal development and purpose','Managing life transitions','Blended family dynamics'] },
]
</script>

<template>
  <div class="page-view">
  <PublicHeader />

  <div style="background:var(--ma-green-dark);padding:70px 0;color:var(--ma-white)">
    <div class="container">
      <span class="section-tag">What We Offer</span>
      <h1 style="color:var(--ma-white);margin:10px 0 14px">Our Services</h1>
      <p style="color:rgba(255,255,255,.75);max-width:560px">Every service is tailored to meet you where you are — and guide you to where you're meant to be.</p>
    </div>
  </div>

  <section class="section">
    <div class="container">
      <div style="display:flex;flex-direction:column;gap:64px">
        <div v-for="(s, i) in services" :key="s.slug" :class="['service-row', {reverse: i%2===1}]">
          <div class="service-img">
            <img :src="s.img" :alt="s.title" loading="lazy"/>
          </div>
          <div class="service-text">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">
              <div class="service-icon-wrap"><component :is="s.icon" :size="24"/></div>
              <span class="section-tag" style="margin:0">{{ s.title }}</span>
            </div>
            <h2 style="margin-bottom:10px">{{ s.tagline }}</h2>
            <p style="color:var(--ma-text-muted);line-height:1.8;margin-bottom:20px">{{ s.desc }}</p>
            <ul class="service-benefits">
              <li v-for="b in s.benefits" :key="b"><CheckCircle :size="16" color="var(--ma-green)"/> {{ b }}</li>
            </ul>
            <RouterLink to="/consultation" class="btn btn--primary" style="margin-top:24px;display:inline-flex">
              Book a Session <ChevronRight :size="18"/>
            </RouterLink>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="section section--dark text-center">
    <div class="container">
      <h2 style="color:var(--ma-white);margin-bottom:14px">Not sure which service is right for you?</h2>
      <p style="color:rgba(255,255,255,.75);margin-bottom:28px">Book a free discovery call and let Coach Madinah guide you to the best starting point.</p>
      <RouterLink to="/consultation" class="btn btn--primary btn--lg">Book a Free Discovery Call</RouterLink>
    </div>
  </section>

  <PublicFooter />
  </div>
</template>

<style scoped>
.service-row{display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:center}
.service-row.reverse{direction:rtl}.service-row.reverse>*{direction:ltr}
@media(max-width:768px){.service-row,.service-row.reverse{grid-template-columns:1fr;direction:ltr}}
.service-img{border-radius:var(--radius-xl);overflow:hidden}
.service-img img{width:100%;height:380px;object-fit:cover}
.service-icon-wrap{width:44px;height:44px;background:var(--ma-green-tint);color:var(--ma-green-deep);border-radius:var(--radius-md);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.service-benefits{display:flex;flex-direction:column;gap:8px;margin-top:4px}
.service-benefits li{display:flex;align-items:center;gap:8px;font-size:.9rem;color:var(--ma-text-muted)}
</style>
