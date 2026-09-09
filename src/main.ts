import './style.css'
import * as THREE from 'three'

const app = document.querySelector<HTMLDivElement>('#app')!

app.innerHTML = `
  <main class="aim-lab">
    <header class="topbar">
      <div class="brand"><span class="brand-mark">+</span><span>AIM / LAB</span></div>
      <div class="session-status"><span class="status-dot"></span> SESSION READY</div>
    </header>
    <section class="range" aria-label="3D aim training range">
      <canvas id="range-canvas" aria-label="FPS training range"></canvas>
      <div class="crosshair" aria-hidden="true"><span></span><i></i></div>
      <div class="range-label">TRAINING RANGE <span>01</span></div>
      <div class="hud hud-left"><span class="hud-caption">ACCURACY</span><strong>--.-%</strong></div>
      <div class="hud hud-right"><span class="hud-caption">SCORE</span><strong>000000</strong></div>
      <button class="start-button" type="button">ENTER RANGE <span>↗</span></button>
    </section>
    <footer class="bottombar"><span>GRIDSHOT / BEGINNER</span><span>WASD MOVE &nbsp;·&nbsp; CLICK TO LOCK POINTER</span></footer>
  </main>
`

const canvas = document.querySelector<HTMLCanvasElement>('#range-canvas')!
const scene = new THREE.Scene()
scene.background = new THREE.Color('#0b0e12')
scene.fog = new THREE.Fog('#0b0e12', 9, 28)

const camera = new THREE.PerspectiveCamera(65, 1, 0.1, 100)
camera.position.set(0, 1.6, 5)

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.shadowMap.enabled = true

scene.add(new THREE.HemisphereLight('#d9e6ff', '#10151c', 2.4))
const keyLight = new THREE.DirectionalLight('#fff4df', 3)
keyLight.position.set(-4, 7, 4)
keyLight.castShadow = true
scene.add(keyLight)

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(32, 32),
  new THREE.MeshStandardMaterial({ color: '#171d24', roughness: 0.9 }),
)
floor.rotation.x = -Math.PI / 2
floor.receiveShadow = true
scene.add(floor)

const grid = new THREE.GridHelper(32, 32, '#33404a', '#1d252d')
grid.position.y = 0.01
scene.add(grid)

const target = new THREE.Mesh(
  new THREE.CylinderGeometry(0.72, 0.72, 0.16, 32),
  new THREE.MeshStandardMaterial({ color: '#e65b46', roughness: 0.45 }),
)
target.position.set(0, 2.2, -7)
target.rotation.x = Math.PI / 2
target.castShadow = true
scene.add(target)

const targetRing = new THREE.Mesh(
  new THREE.TorusGeometry(0.78, 0.035, 8, 32),
  new THREE.MeshBasicMaterial({ color: '#f7c95a' }),
)
targetRing.position.copy(target.position)
targetRing.rotation.x = Math.PI / 2
scene.add(targetRing)

function resizeRenderer(): void {
  const width = canvas.clientWidth
  const height = canvas.clientHeight
  renderer.setSize(width, height, false)
  camera.aspect = width / height
  camera.updateProjectionMatrix()
}

window.addEventListener('resize', resizeRenderer)
resizeRenderer()

const clock = new THREE.Clock()
function render(): void {
  const elapsed = clock.getElapsedTime()
  target.position.y = 2.2 + Math.sin(elapsed * 1.5) * 0.18
  targetRing.position.y = target.position.y
  renderer.render(scene, camera)
  requestAnimationFrame(render)
}

render()
