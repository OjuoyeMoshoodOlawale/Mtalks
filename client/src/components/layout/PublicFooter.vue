<script setup>
import { RouterLink } from 'vue-router'
import { Mail, Phone, MapPin, Instagram, Facebook, Youtube } from 'lucide-vue-next'
</script>
<template>
  <footer class="site-footer">
    <div class="container">
      <div class="footer-grid">
        <div>
          <div class="footer-brand">
            <span class="logo-icon">M</span>
            <span class="logo-text">MTalks <em>Academy</em></span>
          </div>
          <p class="footer-tagline">Helping Muslim Sisters and Couples Build Stronger, Healthier, and Lasting Relationships.</p>
          <div class="footer-social">
            <a href="#" aria-label="Instagram"><Instagram :size="20"/></a>
            <a href="#" aria-label="Facebook"><Facebook :size="20"/></a>
            <a href="#" aria-label="YouTube"><Youtube :size="20"/></a>
          </div>
        </div>
        <div>
          <h4 class="footer-heading">Quick Links</h4>
          <ul class="footer-links">
            <li><RouterLink to="/about">About Us</RouterLink></li>
            <li><RouterLink to="/services">Services</RouterLink></li>
            <li><RouterLink to="/courses">Online Courses</RouterLink></li>
            <li><RouterLink to="/events">Events</RouterLink></li>
            <li><RouterLink to="/consultation">Book Consultation</RouterLink></li>
          </ul>
        </div>
        <div>
          <h4 class="footer-heading">Contact</h4>
          <ul class="footer-links">
            <li><a href="mailto:madeenahsanni@gmail.com"><Mail :size="14"/> madeenahsanni@gmail.com</a></li>
            <li><a href="https://wa.me/2348039632700" target="_blank" rel="noopener"><Phone :size="14"/> WhatsApp Us</a></li>
            <li style="display:flex;align-items:flex-start;gap:6px"><MapPin :size="14" style="margin-top:3px;flex-shrink:0"/> Abuja, Nigeria</li>
          </ul>
        </div>
        <div>
          <h4 class="footer-heading">Legal</h4>
          <ul class="footer-links">
            <li><RouterLink to="/privacy-policy">Privacy Policy</RouterLink></li>
            <li><RouterLink to="/terms">Terms of Service</RouterLink></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <p>© {{ new Date().getFullYear() }} MTalks Life & Marriage Coaching. All rights reserved.</p>
        <p>Abuja, Nigeria · <a href="https://muhsinahacademy.com">muhsinahacademy.com</a></p>
      </div>
    </div>
  </footer>
</template>
<style scoped>
.site-footer{background:var(--ma-green-dark);color:rgba(255,255,255,.8);padding:60px 0 24px}
.footer-grid{display:grid;grid-template-columns:1.5fr 1fr 1fr 1fr;gap:40px;margin-bottom:48px}
@media(max-width:768px){.footer-grid{grid-template-columns:1fr 1fr;gap:32px}}
@media(max-width:480px){.footer-grid{grid-template-columns:1fr}}
.footer-brand{display:flex;align-items:center;gap:10px;margin-bottom:12px}
.logo-icon{width:38px;height:38px;background:var(--ma-green);color:var(--ma-green-dark);font-family:var(--font-heading);font-weight:700;font-size:1.3rem;display:flex;align-items:center;justify-content:center;border-radius:8px}
.logo-text{font-family:var(--font-heading);color:var(--ma-white);font-size:1.05rem}
.logo-text em{font-style:normal;color:var(--ma-green);margin-left:4px}
.footer-tagline{font-size:.88rem;line-height:1.6;opacity:.75;margin-bottom:16px;max-width:280px}
.footer-social{display:flex;gap:12px}
.footer-social a{color:rgba(255,255,255,.6);transition:color var(--trans-fast)}
.footer-social a:hover{color:var(--ma-green)}
.footer-heading{font-family:var(--font-heading);color:var(--ma-white);font-size:.95rem;margin-bottom:14px}
.footer-links{display:flex;flex-direction:column;gap:8px}
.footer-links li,.footer-links a{display:flex;align-items:center;gap:6px;font-size:.875rem;color:rgba(255,255,255,.65);transition:color var(--trans-fast)}
.footer-links a:hover{color:var(--ma-green)}
.footer-bottom{border-top:1px solid rgba(255,255,255,.1);padding-top:20px;display:flex;flex-wrap:wrap;gap:8px;justify-content:space-between;font-size:.8rem;opacity:.55}
.footer-bottom a:hover{opacity:1;color:var(--ma-green)}
</style>
