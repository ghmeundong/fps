import './style.css'
import * as THREE from 'three'
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js'
import { gsap } from 'gsap'
import RAPIER from '@dimforge/rapier3d-compat'

await RAPIER.init()

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
      <div class="hud hud-left"><span class="hud-caption">ACCURACY</span><strong id="accuracy-value">--.-%</strong></div>
      <div class="hud hud-right"><span class="hud-caption">SCORE</span><strong id="score-value">000000</strong></div>
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
const accuracyValue = document.querySelector<HTMLElement>('#accuracy-value')!
const scoreValue = document.querySelector<HTMLElement>('#score-value')!
const scene = new THREE.Scene()
scene.background = new THREE.Color('#0b0e12')
scene.fog = new THREE.Fog('#0b0e12', 14, 52)
const physicsWorld = new RAPIER.World({ x: 0, y: -3.5, z: 0 })
physicsWorld.createCollider(RAPIER.ColliderDesc.cuboid(1000, 0.1, 1000).setTranslation(0, -0.1, 0))

const camera = new THREE.PerspectiveCamera(65, 1, 0.1, 60)
camera.position.set(0, 1.6, 5)
const controls = new PointerLockControls(camera, canvas)
controls.pointerSpeed = 0.7
scene.add(controls.object)

const weapon = new THREE.Group()
const weaponPosition = new THREE.Vector3(0.44, -0.27, -0.58)
const weaponRotation = new THREE.Euler(-0.03, 0.04, 0.02)
const hipPosition = weaponPosition.clone()
const hipRotation = weaponRotation.clone()
const adsPosition = new THREE.Vector3(0, -0.17, -0.43)
const adsRotation = new THREE.Euler(-0.07, 0, 0)
const weaponBodyMaterial = new THREE.MeshStandardMaterial({ color: '#090a0b', roughness: 0.34, metalness: 0.78, fog: false })
const weaponSlideMaterial = new THREE.MeshStandardMaterial({ color: '#17191b', roughness: 0.27, metalness: 0.88, fog: false })
const weaponBody = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.15, 0.52), weaponBodyMaterial)
weaponBody.position.z = -0.18
weaponBody.castShadow = false
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
  if (event.button === 0 && controls.isLocked) fireShot()
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

type Projectile = {
  body: RAPIER.RigidBody
  mesh: THREE.Mesh
  bornAt: number
}

const projectiles: Projectile[] = []
const projectileMaterial = new THREE.MeshBasicMaterial({ color: '#fff1a3', fog: false })
const projectileGeometry = new THREE.SphereGeometry(0.035, 8, 8)
const projectileVelocity = 90
const projectileLifetime = 3

function spawnProjectile(): void {
  camera.getWorldPosition(shotOrigin)
  camera.getWorldDirection(shotDirection)
  const bodyDescription = RAPIER.RigidBodyDesc.dynamic()
    .setTranslation(shotOrigin.x, shotOrigin.y, shotOrigin.z)
    .setLinvel(shotDirection.x * projectileVelocity, shotDirection.y * projectileVelocity, shotDirection.z * projectileVelocity)
    .setCcdEnabled(true)
  const body = physicsWorld.createRigidBody(bodyDescription)
  physicsWorld.createCollider(RAPIER.ColliderDesc.ball(0.035).setDensity(1), body)
  const mesh = new THREE.Mesh(projectileGeometry, projectileMaterial)
  mesh.position.copy(shotOrigin)
  scene.add(mesh)
  projectiles.push({ body, mesh, bornAt: performance.now() / 1000 })
}

function updateProjectiles(now: number): void {
  physicsWorld.step()
  for (let index = projectiles.length - 1; index >= 0; index -= 1) {
    const projectile = projectiles[index]
    const translation = projectile.body.translation()
    projectile.mesh.position.set(translation.x, translation.y, translation.z)
    if (now - projectile.bornAt > projectileLifetime || translation.y < -1) {
      physicsWorld.removeRigidBody(projectile.body)
      scene.remove(projectile.mesh)
      projectiles.splice(index, 1)
    }
  }
}

const raycaster = new THREE.Raycaster()
const shotDirection = new THREE.Vector3()
const shotOrigin = new THREE.Vector3()
const impactOffset = new THREE.Vector3()
let shotsFired = 0
let shotsHit = 0
let score = 0

function updateAimStats(): void {
  const accuracy = shotsFired === 0 ? '--.-' : ((shotsHit / shotsFired) * 100).toFixed(1)
  accuracyValue.textContent = `${accuracy}%`
  scoreValue.textContent = score.toString().padStart(6, '0')
}

function createTracer(end: THREE.Vector3): void {
  weaponBarrel.getWorldPosition(shotOrigin)
  const tracerDirection = end.clone().sub(shotOrigin)
  const tracerLength = tracerDirection.length()
  const tracerCenter = shotOrigin.clone().addScaledVector(tracerDirection, 0.5)
  const tracerGroup = new THREE.Group()
  const tracerOuter = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.018, tracerLength, 8),
    new THREE.MeshBasicMaterial({ color: '#f7c95a', transparent: true, opacity: 0.8, depthTest: false, depthWrite: false, fog: false }),
  )
  const tracerCore = new THREE.Mesh(
    new THREE.CylinderGeometry(0.007, 0.007, tracerLength, 8),
    new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 1, depthTest: false, depthWrite: false, fog: false }),
  )
  tracerGroup.add(tracerOuter, tracerCore)
  const tracerMeshes = [tracerOuter, tracerCore]
  tracerGroup.position.copy(tracerCenter)
  tracerGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tracerDirection.normalize())
  tracerGroup.renderOrder = 10
  scene.add(tracerGroup)
  gsap.to(tracerMeshes.map((mesh) => mesh.material), { opacity: 0, duration: 0.35, onComplete: () => {
    scene.remove(tracerGroup)
    tracerMeshes.forEach((mesh) => {
      mesh.geometry.dispose()
      mesh.material.dispose()
    })
  } })
}

function fireShot(): void {
  shotsFired += 1
  camera.getWorldPosition(shotOrigin)
  camera.getWorldDirection(shotDirection)
  raycaster.set(shotOrigin, shotDirection)
  const hit = raycaster.intersectObject(target, false)[0]
  const tracerEnd = hit ? hit.point : shotOrigin.clone().addScaledVector(shotDirection, 45)
  createTracer(tracerEnd)

  if (hit) {
    shotsHit += 1
    score += 100
    impactOffset.set((Math.random() - 0.5) * 8, 1.4 + Math.random() * 2.2, -10 - Math.random() * 12)
    target.position.copy(impactOffset)
    targetRing.position.copy(target.position)
  }

  spawnProjectile()
  updateAimStats()
}

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
  updateProjectiles(performance.now() / 1000)

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
