<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import * as THREE from 'three'
import { gsap }   from 'gsap'

const canvasEl = ref(null)
let renderer, scene, camera, animId
let particleMesh, ringMesh

onMounted(() => {
  const el = canvasEl.value
  const W  = el.clientWidth
  const H  = el.clientHeight

  /* ─── Renderer ─── */
  renderer = new THREE.WebGLRenderer({ canvas: el, alpha: true, antialias: true })
  renderer.setSize(W, H)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  /* ─── Scene + Camera ─── */
  scene  = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 200)
  camera.position.set(0, 0, 8)

  /* ─── Particles in a torus shape ─── */
  const PARTICLE_COUNT = 3500
  const positions = new Float32Array(PARTICLE_COUNT * 3)
  const colors    = new Float32Array(PARTICLE_COUNT * 3)

  const brandGreen  = new THREE.Color('#76C442')
  const deepGreen   = new THREE.Color('#1D6B1D')
  const gold        = new THREE.Color('#F0C130')

  const palette = [brandGreen, deepGreen, gold, new THREE.Color('#4A9E2C'), new THREE.Color('#EBF7DC')]

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const R = 3.5, r = 1.4
    const u = Math.random() * Math.PI * 2
    const v = Math.random() * Math.PI * 2
    const noise = (Math.random() - .5) * 0.45

    positions[i * 3]     = (R + r * Math.cos(v)) * Math.cos(u) + noise
    positions[i * 3 + 1] = (R + r * Math.cos(v)) * Math.sin(u) + noise
    positions[i * 3 + 2] = r * Math.sin(v) + noise

    const c = palette[Math.floor(Math.random() * palette.length)]
    colors[i * 3]     = c.r
    colors[i * 3 + 1] = c.g
    colors[i * 3 + 2] = c.b
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geo.setAttribute('color',    new THREE.BufferAttribute(colors, 3))

  const mat = new THREE.PointsMaterial({
    size: 0.048, vertexColors: true, transparent: true, opacity: 0.85, sizeAttenuation: true
  })

  particleMesh = new THREE.Points(geo, mat)
  scene.add(particleMesh)

  /* ─── Wireframe rings ─── */
  const addRing = (radius, tube, color, opacity) => {
    const rGeo = new THREE.TorusGeometry(radius, tube, 8, 80)
    const rMat = new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity })
    const mesh = new THREE.Mesh(rGeo, rMat)
    scene.add(mesh)
    return mesh
  }

  const ring1 = addRing(3.5, 0.025, 0x76C442, 0.25)
  const ring2 = addRing(3.5, 0.015, 0xF0C130, 0.12)
  ring2.rotation.x = Math.PI / 3

  /* ─── Ambient light for depth ─── */
  scene.add(new THREE.AmbientLight(0x76C442, .5))

  /* ─── GSAP entrance ─── */
  particleMesh.scale.set(0, 0, 0)
  particleMesh.material.opacity = 0
  gsap.to(particleMesh.scale, { x: 1, y: 1, z: 1, duration: 1.8, ease: 'power3.out', delay: .3 })
  gsap.to(particleMesh.material, { opacity: .85, duration: 2, ease: 'power2.out', delay: .3 })

  /* ─── Mouse parallax ─── */
  const mouse = { x: 0, y: 0 }
  const onMouseMove = (e) => {
    mouse.x = (e.clientX / window.innerWidth  - .5) * 2
    mouse.y = (e.clientY / window.innerHeight - .5) * 2
  }
  window.addEventListener('mousemove', onMouseMove)

  /* ─── Resize ─── */
  const onResize = () => {
    const W = el.clientWidth, H = el.clientHeight
    camera.aspect = W / H
    camera.updateProjectionMatrix()
    renderer.setSize(W, H)
  }
  window.addEventListener('resize', onResize)

  /* ─── Animation loop ─── */
  const clock = new THREE.Clock()
  const animate = () => {
    animId = requestAnimationFrame(animate)
    const t = clock.getElapsedTime()

    particleMesh.rotation.y = t * 0.06
    particleMesh.rotation.z = t * 0.02
    ring1.rotation.y = t * 0.12
    ring2.rotation.x = Math.PI / 3 + t * 0.08

    camera.position.x += (mouse.x * 1.2 - camera.position.x) * 0.04
    camera.position.y += (-mouse.y * 0.8 - camera.position.y) * 0.04
    camera.lookAt(scene.position)

    renderer.render(scene, camera)
  }
  animate()

  /* cleanup refs on unmount */
  el._cleanup = () => {
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('resize', onResize)
  }
})

onUnmounted(() => {
  cancelAnimationFrame(animId)
  renderer?.dispose()
  canvasEl.value?._cleanup?.()
})
</script>

<template>
  <canvas ref="canvasEl" class="hero-canvas" aria-hidden="true" />
</template>

<style scoped>
.hero-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}
</style>
