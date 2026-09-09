import './style.css'
import * as THREE from 'three'
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js'

const app = document.querySelector<HTMLDivElement>('#app')!

app.innerHTML = `
  <main class="aim-lab">
    <header class="topbar">
      <div class="brand"><span class="brand-mark">+</span><span>AIM / LAB</span></div>
      <div class="session-status"><span class="status-dot"></span><span id="session-label">SESSION READY</span></div>
    </header>
    <section class="range" aria-label="3D aim training range">
      <canvas id="range-canvas" aria-label="FPS training range"></canvas>
      <div class="crosshair" aria-hidden="true"><span></span><i></i></div>
      <div class="range-label">TRAINING RANGE <span>01</span></div>
      <div class="hud hud-left"><span class="hud-caption">ACCURACY</span><strong>--.-%</strong></div>
      <div class="hud hud-right"><span class="hud-caption">SCORE</span><strong>000000</strong></div>
      <label class="sensitivity-control">SENS <output id="sensitivity-value">0.70</output><input id="sensitivity" type="range" min="0.2" max="1.5" step="0.05" value="0.7" aria-label="Mouse sensitivity"></label>
      <button class="start-button" type="button">ENTER RANGE <span>↗</span></button>
    </section>
    <footer class="bottombar"><span>GRIDSHOT / BEGINNER</span><span>WASD MOVE &nbsp;·&nbsp; CLICK TO LOCK POINTER</span></footer>
  </main>
`

const canvas = document.querySelector<HTMLCanvasElement>('#range-canvas')!
const range = document.querySelector<HTMLElement>('.range')!
const startButton = document.querySelector<HTMLButtonElement>('.start-button')!
const sessionLabel = document.querySelector<HTMLSpanElement>('#session-label')!
const sensitivityInput = document.querySelector<HTMLInputElement>('#sensitivity')!
const sensitivityValue = document.querySelector<HTMLOutputElement>('#sensitivity-value')!
const scene = new THREE.Scene()
scene.background = new THREE.Color('#0b0e12')
scene.fog = new THREE.Fog('#0b0e12', 9, 28)

const camera = new THREE.PerspectiveCamera(65, 1, 0.1, 100)
camera.position.set(0, 1.6, 5)
const controls = new PointerLockControls(camera, canvas)
controls.pointerSpeed = 0.7
scene.add(controls.object)

sensitivityInput.addEventListener('input', () => {
  const sensitivity = Number(sensitivityInput.value)
  controls.pointerSpeed = sensitivity
  sensitivityValue.value = sensitivity.toFixed(2)
})

const keys = new Set<string>()
const movement = new THREE.Vector3()
const direction = new THREE.Vector3()
const playerHeight = 1.6
const playerRadius = 0.35
const gravity = 18
const jumpVelocity = 7
let verticalVelocity = 0

function lockPointer(): void {
  controls.lock()
}

function handleKeyDown(event: KeyboardEvent): void {
  keys.add(event.code)
  if (event.code === 'Space' && controls.isLocked && camera.position.y <= playerHeight + 0.01) {
    verticalVelocity = jumpVelocity
  }
}

function handleKeyUp(event: KeyboardEvent): void {
  keys.delete(event.code)
}

function handleLockChange(): void {
  const locked = controls.isLocked
  sessionLabel.textContent = locked ? 'POINTER LOCKED' : 'SESSION READY'
  startButton.textContent = locked ? 'ESC TO RELEASE' : 'ENTER RANGE ↗'
  range.classList.toggle('is-locked', locked)
}

startButton.addEventListener('click', lockPointer)
canvas.addEventListener('click', lockPointer)
document.addEventListener('keydown', handleKeyDown)
document.addEventListener('keyup', handleKeyUp)
controls.addEventListener('lock', handleLockChange)
controls.addEventListener('unlock', handleLockChange)

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
  const delta = Math.min(clock.getDelta(), 0.05)
  const elapsed = clock.getElapsedTime()
  target.position.y = 2.2 + Math.sin(elapsed * 1.5) * 0.18
  targetRing.position.y = target.position.y

  movement.set(0, 0, 0)
  if (controls.isLocked) {
    direction.set(Number(keys.has('KeyD')) - Number(keys.has('KeyA')), 0, Number(keys.has('KeyS')) - Number(keys.has('KeyW')))
    if (direction.lengthSq() > 0) {
      direction.normalize()
      movement.copy(direction).multiplyScalar(4.5 * delta)
      controls.moveRight(movement.x)
      controls.moveForward(movement.z)
    }

    verticalVelocity -= gravity * delta
    camera.position.y += verticalVelocity * delta
    if (camera.position.y < playerHeight) {
      camera.position.y = playerHeight
      verticalVelocity = 0
    }
    camera.position.x = THREE.MathUtils.clamp(camera.position.x, -14 + playerRadius, 14 - playerRadius)
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, -14 + playerRadius, 14 - playerRadius)
  }

  renderer.render(scene, camera)
  requestAnimationFrame(render)
}

render()
