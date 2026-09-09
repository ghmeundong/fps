import './style.css'
import * as THREE from 'three'
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js'
import { gsap } from 'gsap'

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
scene.fog = new THREE.Fog('#0b0e12', 14, 52)

const camera = new THREE.PerspectiveCamera(65, 1, 0.1, 60)
camera.position.set(0, 1.6, 5)
const controls = new PointerLockControls(camera, canvas)
controls.pointerSpeed = 0.7
scene.add(controls.object)

const weapon = new THREE.Group()
const weaponPosition = new THREE.Vector3(0.32, -0.27, -0.58)
const weaponRotation = new THREE.Euler(-0.03, 0.04, 0.02)
const hipPosition = weaponPosition.clone()
const hipRotation = weaponRotation.clone()
const adsPosition = new THREE.Vector3(0, -0.19, -0.48)
const adsRotation = new THREE.Euler(0, 0, 0)
const weaponBodyMaterial = new THREE.MeshStandardMaterial({ color: '#090a0b', roughness: 0.34, metalness: 0.78, fog: false })
const weaponSlideMaterial = new THREE.MeshStandardMaterial({ color: '#17191b', roughness: 0.27, metalness: 0.88, fog: false })
const weaponBody = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.15, 0.52), weaponBodyMaterial)
weaponBody.position.z = -0.18
weaponBody.castShadow = true
weapon.add(weaponBody)
const weaponSlide = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.5), weaponSlideMaterial)
weaponSlide.position.set(0, 0.11, -0.2)
weapon.add(weaponSlide)
const weaponGrip = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.3, 0.14), weaponBodyMaterial)
weaponGrip.position.set(0, -0.16, 0.04)
weaponGrip.rotation.x = -0.23
weapon.add(weaponGrip)
const weaponBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.28, 12), weaponBodyMaterial)
weaponBarrel.rotation.x = Math.PI / 2
weaponBarrel.position.set(0, 0.11, -0.55)
weapon.add(weaponBarrel)
const rearSightLeft = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.032, 0.038), weaponBodyMaterial)
rearSightLeft.position.set(-0.032, 0.16, 0.01)
weapon.add(rearSightLeft)
const rearSightRight = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.032, 0.038), weaponBodyMaterial)
rearSightRight.position.set(0.032, 0.16, 0.01)
weapon.add(rearSightRight)
const frontSight = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.032, 0.038), weaponBodyMaterial)
frontSight.position.set(0, 0.16, -0.44)
weapon.add(frontSight)
weapon.scale.setScalar(0.72)
weapon.position.copy(weaponPosition)
weapon.rotation.copy(weaponRotation)
camera.add(weapon)

let aiming = false
function setAiming(nextAiming: boolean): void {
  aiming = nextAiming
  const position = aiming ? adsPosition : hipPosition
  const rotation = aiming ? adsRotation : hipRotation
  gsap.to(weaponPosition, { x: position.x, y: position.y, z: position.z, duration: 0.18, ease: 'power2.out' })
  gsap.to(weaponRotation, { x: rotation.x, y: rotation.y, z: rotation.z, duration: 0.18, ease: 'power2.out' })
  gsap.to(camera, { fov: aiming ? 48 : 65, duration: 0.2, ease: 'power2.out', onUpdate: () => camera.updateProjectionMatrix() })
}

function handlePointerDown(event: PointerEvent): void {
  if (event.button === 2 && controls.isLocked) setAiming(true)
}

function handlePointerUp(event: PointerEvent): void {
  if (event.button === 2) setAiming(false)
}

canvas.addEventListener('pointerdown', handlePointerDown)
document.addEventListener('pointerup', handlePointerUp)
canvas.addEventListener('contextmenu', (event) => event.preventDefault())

sensitivityInput.addEventListener('input', () => {
  const sensitivity = Number(sensitivityInput.value)
  controls.pointerSpeed = sensitivity
  sensitivityValue.value = sensitivity.toFixed(2)
})

const keys = new Set<string>()
const movement = new THREE.Vector3()
const direction = new THREE.Vector3()
const playerHeight = 1.6
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
  new THREE.PlaneGeometry(2000, 2000),
  new THREE.MeshStandardMaterial({ color: '#171d24', roughness: 0.9 }),
)
floor.rotation.x = -Math.PI / 2
floor.receiveShadow = true
scene.add(floor)

const grid = new THREE.GridHelper(2000, 200, '#33404a', '#1d252d')
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
    direction.set(Number(keys.has('KeyD')) - Number(keys.has('KeyA')), 0, Number(keys.has('KeyW')) - Number(keys.has('KeyS')))
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
  }

  const isMoving = controls.isLocked && direction.lengthSq() > 0
  const swayAmount = isMoving ? (aiming ? 0.008 : 0.018) : 0
  weapon.position.set(
    weaponPosition.x + Math.sin(elapsed * 6.5) * swayAmount,
    weaponPosition.y + Math.cos(elapsed * 3.25) * swayAmount * 0.65,
    weaponPosition.z,
  )
  weapon.rotation.set(weaponRotation.x, weaponRotation.y, weaponRotation.z + Math.sin(elapsed * 4) * swayAmount)

  renderer.render(scene, camera)
  requestAnimationFrame(render)
}

render()
