<script setup>
import PublicHeader from '@/components/layout/PublicHeader.vue'
import PublicFooter from '@/components/layout/PublicFooter.vue'

import { useSeoMeta } from '@/composables/useSeoMeta'

useSeoMeta({
  title:       'Privacy Policy & Terms',
  description: "Read the Muhsinah Academy privacy policy and terms of service. We are fully compliant with Nigeria's NDPR data protection regulations.",
  url:         '/legal',
})

const props = defineProps({ page: String })
const content = {
  privacy: {
    title: 'Privacy Policy',
    body: `Last updated: June 2026\n\nMuhsinah Academy (www.muhsinahacademy.com) is committed to protecting your personal information in accordance with the Nigeria Data Protection Regulation (NDPR) and international best practices.\n\n**Information We Collect**\nWe collect information you provide when registering, enrolling in courses, or registering for events — including your name, email address, and payment details.\n\n**How We Use Your Information**\nYour data is used solely to deliver our services (course access, event tickets, consultation bookings) and to communicate with you about your account. We never sell your data to third parties.\n\n**Payment Data**\nAll payments are processed securely through Paystack. We do not store card details on our servers.\n\n**Data Security**\nWe use industry-standard encryption and security practices to protect your data. Access is restricted to authorised personnel only.\n\n**Your Rights**\nYou have the right to access, correct, or request deletion of your personal data. Contact us at madeenahsanni@gmail.com.\n\n**Contact**\nFor privacy concerns: madeenahsanni@gmail.com`
  },
  terms: {
    title: 'Terms of Service',
    body: `Last updated: June 2026\n\n**Acceptance**\nBy accessing or using Muhsinah Academy, you agree to these terms.\n\n**Services**\nWe provide online coaching courses, live event registrations, and consultation booking. All content is for educational and personal development purposes.\n\n**Payments & Refunds**\nAll payments are final unless a technical error is confirmed. Contact us within 24 hours of payment for disputes.\n\n**Course Access**\nUpon successful enrolment and payment, you receive lifetime access to the enrolled course materials.\n\n**Event Tickets**\nTickets are non-transferable. WhatsApp group links are exclusively for registered participants.\n\n**Intellectual Property**\nAll course content, videos, and materials belong to Muhsinah Academy and Coach Madinah Sanni. Redistribution is prohibited.\n\n**Contact**\nmadeenahsanni@gmail.com`
  }
}
const c = content[props.page] || content.privacy
</script>

<template>
  <div class="page-view">
  <PublicHeader/>
  <div style="background:var(--ma-green-dark);padding:50px 0;color:var(--ma-white)">
    <div class="container"><h1 style="color:var(--ma-white)">{{ c.title }}</h1></div>
  </div>
  <section class="section">
    <div class="container" style="max-width:760px">
      <div class="legal-content" v-html="c.body.replace(/\n/g,'<br>').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')"/>
    </div>
  </section>
  <PublicFooter/>
  </div>
</template>

<style scoped>
.legal-content{line-height:1.85;color:var(--ma-text);font-size:.95rem}
.legal-content strong{color:var(--ma-green-dark);display:block;margin-top:20px;margin-bottom:6px}
</style>
