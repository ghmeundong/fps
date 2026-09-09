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
    <footer class="bottombar"><div class="mode-select" role="group" aria-label="Shooting mode"><button class="mode-button is-active" data-mode="gridshot" type="button">GRIDSHOT</button><button class="mode-button" data-mode="flicking" type="button">FLICKING</button><button class="mode-button" data-mode="tracking" type="button">TRACKING</button></div><span>WASD MOVE &nbsp;·&nbsp; CLICK TO LOCK POINTER</span></footer>
  </main>
`

const canvas = document.querySelector<HTMLCanvasElement>('#range-canvas')!
const crosshair = document.querySelector<HTMLElement>('.crosshair')!
const range = document.querySelector<HTMLElement>('.range')!
const startButton = document.querySelector<HTMLButtonElement>('.start-button')!
const sessionLabel = document.querySelector<HTMLSpanElement>('#session-label')!
const sensitivityInput = document.querySelector<HTMLInputElement>('#sensitivity')!
const sensitivityValue = document.querySelector<HTMLOutputElement>('#sensitivity-value')!
const accuracyValue = document.querySelector<HTMLElement>('#accuracy-value')!
const scoreValue = document.querySelector<HTMLElement>('#score-value')!
const modeButtons = [...document.querySelectorAll<HTMLButtonElement>('.mode-button')]
type ShootingMode = 'gridshot' | 'flicking' | 'tracking'
let shootingMode: ShootingMode = 'gridshot'
const scene = new THREE.Scene()
scene.background = new THREE.Color('#0b0e12')
scene.fog = new THREE.Fog('#0b0e12', 28, 140)
const physicsWorld = new RAPIER.World({ x: 0, y: -3.5, z: 0 })
physicsWorld.createCollider(RAPIER.ColliderDesc.cuboid(1000, 0.1, 1000).setTranslation(0, -0.1, 0))

const camera = new THREE.PerspectiveCamera(65, 1, 0.1, 160)
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
const muzzleFlash = new THREE.Mesh(
  new THREE.ConeGeometry(0.07, 0.24, 8),
  new THREE.MeshBasicMaterial({ color: '#ffd36b', transparent: true, opacity: 0, fog: false }),
)
muzzleFlash.rotation.x = -Math.PI / 2
muzzleFlash.position.set(0, 0.11, -0.7)
weapon.add(muzzleFlash)
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

const muzzleLocalPosition = new THREE.Vector3(0, -0.14, 0)
function getMuzzleWorldPosition(): THREE.Vector3 {
  return weaponBarrel.localToWorld(muzzleLocalPosition.clone())
}

let aiming = false
let recoilPitch = 0
let recoilYaw = 0
let appliedRecoilPitch = 0
let appliedRecoilYaw = 0

function triggerMuzzleFlash(): void {
  muzzleFlash.scale.set(0.65 + Math.random() * 0.35, 0.8 + Math.random() * 0.5, 0.65 + Math.random() * 0.35)
  gsap.killTweensOf(muzzleFlash.material)
  muzzleFlash.material.opacity = 0.9
  gsap.to(muzzleFlash.material, { opacity: 0, duration: 0.07, ease: 'power2.out' })
}

function applyRecoil(): void {
  const strength = aiming ? 0.018 : 0.035
  recoilPitch += strength
  recoilYaw += (Math.random() - 0.5) * strength * 0.8
  triggerMuzzleFlash()
}

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
  if (event.button === 0 && controls.isLocked && !aiming) {
    event.preventDefault()
    fireShot()
  }
}

function handlePointerUp(event: PointerEvent): void {
  if (event.button === 2) setAiming(false)
}

canvas.addEventListener('pointerdown', handlePointerDown)
canvas.addEventListener('mousedown', (event) => {
  if (event.button === 0 && controls.isLocked && aiming) {
    event.preventDefault()
    fireShot()
  }
})
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

const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1))
renderer.shadowMap.enabled = false

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
  new THREE.SphereGeometry(0.72, 24, 16),
  new THREE.MeshBasicMaterial({ color: '#e33f32', fog: false }),
)
target.position.set(0, 2.2, -7)
scene.add(target)

const targetPathCenter = new THREE.Vector3()
const targetPathSample = new THREE.Vector3()
const targetPath = new THREE.CatmullRomCurve3([], true, 'catmullrom', 0.5)
let targetPathSeed = 0
let targetPathStartedAt = 0
let targetPathSpeed = 0.11
const gridPositions = [
  new THREE.Vector3(-3, 2.2, -8), new THREE.Vector3(0, 3.4, -9), new THREE.Vector3(3, 2.4, -8),
  new THREE.Vector3(-2.5, 1.2, -10), new THREE.Vector3(2.4, 1.4, -10),
]

function rebuildTargetPath(center: THREE.Vector3, startTime = 0): void {
  targetPathCenter.copy(center)
  targetPathSeed = Math.random() * Math.PI * 2
  targetPathStartedAt = startTime
  targetPath.points = [
    new THREE.Vector3(center.x - 2.5, center.y + 0.4, center.z + 1.4),
    new THREE.Vector3(center.x + 2.2, center.y + 1.1, center.z + 0.6),
    new THREE.Vector3(center.x + 2.8, center.y - 0.35, center.z - 1.4),
    new THREE.Vector3(center.x - 1.8, center.y - 0.8, center.z - 1.7),
    new THREE.Vector3(center.x - 3, center.y + 0.1, center.z - 0.2),
  ]
}

function setShootingMode(nextMode: ShootingMode): void {
  shootingMode = nextMode
  modeButtons.forEach((button) => button.classList.toggle('is-active', button.dataset.mode === nextMode))
  const nextCenter = nextMode === 'gridshot'
    ? gridPositions[Math.floor(Math.random() * gridPositions.length)]
    : new THREE.Vector3((Math.random() - 0.5) * 8, 1.6 + Math.random() * 2.6, -9 - Math.random() * 8)
  targetPathSpeed = nextMode === 'tracking' ? 0.075 : nextMode === 'flicking' ? 0.16 : 0.11
  rebuildTargetPath(nextCenter, clock.getElapsedTime())
  target.position.copy(nextCenter)
}

modeButtons.forEach((button) => {
  button.addEventListener('click', () => setShootingMode(button.dataset.mode as ShootingMode))
})

rebuildTargetPath(target.position)

function updateTargetMovement(elapsed: number): void {
  const pathTime = ((elapsed - targetPathStartedAt) * targetPathSpeed) % 1
  targetPath.getPointAt(pathTime, targetPathSample)
  const noiseTime = elapsed * 1.7 + targetPathSeed
  const strafeX = Math.sin(noiseTime) * 0.42 + Math.sin(noiseTime * 2.37) * 0.16
  const strafeY = Math.sin(noiseTime * 0.83) * 0.3 + Math.cos(noiseTime * 1.91) * 0.12
  target.position.set(targetPathSample.x + strafeX, targetPathSample.y + strafeY, targetPathSample.z)
}

type Projectile = {
  body: RAPIER.RigidBody
  mesh: THREE.Mesh
  bornAt: number
  lastTrailAt: number
}

const projectiles: Projectile[] = []
const projectileMaterial = new THREE.MeshBasicMaterial({ color: '#fff1a3', fog: false })
const projectileGeometry = new THREE.SphereGeometry(0.035, 8, 8)
const projectileVelocity = 150
const projectileLifetime = 3

function spawnProjectile(direction: THREE.Vector3): void {
  shotOrigin.copy(getMuzzleWorldPosition())
  const bodyDescription = RAPIER.RigidBodyDesc.dynamic()
    .setTranslation(shotOrigin.x, shotOrigin.y, shotOrigin.z)
    .setLinvel(direction.x * projectileVelocity, direction.y * projectileVelocity, direction.z * projectileVelocity)
    .setCcdEnabled(true)
  const body = physicsWorld.createRigidBody(bodyDescription)
  physicsWorld.createCollider(RAPIER.ColliderDesc.ball(0.035).setDensity(1), body)
  const mesh = new THREE.Mesh(projectileGeometry, projectileMaterial)
  mesh.position.copy(shotOrigin)
  scene.add(mesh)
  const now = performance.now() / 1000
  projectiles.push({ body, mesh, bornAt: now, lastTrailAt: now })
  createTracer(mesh.position)
}

function updateProjectiles(now: number): void {
  physicsWorld.step()
  for (let index = projectiles.length - 1; index >= 0; index -= 1) {
    const projectile = projectiles[index]
    const translation = projectile.body.translation()
    projectile.mesh.position.set(translation.x, translation.y, translation.z)
    if (now - projectile.lastTrailAt > 0.045) {
      createTracer(projectile.mesh.position)
      projectile.lastTrailAt = now
    }
    const projectilePosition = projectile.mesh.position
    const hitTarget = target.visible && projectilePosition.distanceToSquared(target.position) < 0.64
    if (hitTarget) {
      registerTargetHit()
    }
    if (hitTarget || now - projectile.bornAt > projectileLifetime || translation.y < -1) {
      physicsWorld.removeRigidBody(projectile.body)
      scene.remove(projectile.mesh)
      projectiles.splice(index, 1)
    }
  }
}

const shotDirection = new THREE.Vector3()
const shotOrigin = new THREE.Vector3()
const cameraOrigin = new THREE.Vector3()
const aimPoint = new THREE.Vector3()
const cameraRight = new THREE.Vector3()
const cameraUp = new THREE.Vector3()
const impactOffset = new THREE.Vector3()
const projectileAimDistance = 45
let shotsFired = 0
let shotsHit = 0
let score = 0

function updateAimStats(): void {
  const accuracy = shotsFired === 0 ? '--.-' : ((shotsHit / shotsFired) * 100).toFixed(1)
  accuracyValue.textContent = `${accuracy}%`
  scoreValue.textContent = score.toString().padStart(6, '0')
}

function registerTargetHit(): void {
  shotsHit += 1
  score += 100
  if (shootingMode === 'gridshot') {
    impactOffset.copy(gridPositions[Math.floor(Math.random() * gridPositions.length)])
  } else {
    impactOffset.set((Math.random() - 0.5) * 8, 1.4 + Math.random() * 2.2, -10 - Math.random() * 12)
  }
  rebuildTargetPath(impactOffset, clock.getElapsedTime())
  target.position.copy(targetPath.points[0])
  target.visible = false
  gsap.delayedCall(0.28, () => {
    target.visible = true
  })
  updateAimStats()
}

function createTracer(position: THREE.Vector3): void {
  const smokePuff = new THREE.Mesh(
    new THREE.SphereGeometry(0.035 + Math.random() * 0.045, 8, 6),
    new THREE.MeshBasicMaterial({ color: '#aeb4b5', transparent: true, opacity: 0.24, depthTest: false, depthWrite: false, fog: false }),
  )
  const smokeMaterial = smokePuff.material as THREE.MeshBasicMaterial
  smokePuff.position.copy(position)
  smokePuff.renderOrder = 10
  scene.add(smokePuff)
  gsap.to(smokePuff.position, { x: position.x + (Math.random() - 0.5) * 0.14, y: position.y + 0.12 + Math.random() * 0.18, z: position.z + (Math.random() - 0.5) * 0.14, duration: 0.45, ease: 'sine.out' })
  gsap.to(smokePuff.scale, { x: 2.4, y: 2.4, z: 2.4, duration: 0.45, ease: 'sine.out' })
  gsap.to(smokeMaterial, { opacity: 0, duration: 0.45, onComplete: () => {
    scene.remove(smokePuff)
    smokePuff.geometry.dispose()
    smokeMaterial.dispose()
  } })
}

function fireShot(): void {
  shotsFired += 1
  applyRecoil()
  shotOrigin.copy(getMuzzleWorldPosition())
  camera.getWorldPosition(cameraOrigin)
  camera.getWorldDirection(shotDirection)
  cameraRight.setFromMatrixColumn(camera.matrixWorld, 0)
  cameraUp.setFromMatrixColumn(camera.matrixWorld, 1)
  aimPoint.copy(cameraOrigin).addScaledVector(shotDirection, projectileAimDistance)
  const movingAtShot = controls.isLocked && (keys.has('KeyW') || keys.has('KeyA') || keys.has('KeyS') || keys.has('KeyD'))
  const shotSpread = aiming ? 0.004 : movingAtShot ? 0.045 : 0.02
  const horizontalSpread = (Math.random() - 0.5) * shotSpread * projectileAimDistance
  const verticalSpread = (Math.random() - 0.5) * shotSpread * projectileAimDistance
  aimPoint.addScaledVector(cameraRight, horizontalSpread)
  aimPoint.addScaledVector(cameraUp, verticalSpread)
  shotDirection.copy(aimPoint).sub(shotOrigin).normalize()
  spawnProjectile(shotDirection)
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
  if (target.visible) updateTargetMovement(elapsed)
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
  const crosshairGap = aiming ? 6 : isMoving ? 24 : 14
  crosshair.style.setProperty('--crosshair-gap', `${crosshairGap}px`)
  const swayAmount = isMoving ? (aiming ? 0.008 : 0.018) : 0
  weapon.position.set(
    weaponPosition.x + Math.sin(elapsed * 6.5) * swayAmount,
    weaponPosition.y + Math.cos(elapsed * 3.25) * swayAmount * 0.65,
    weaponPosition.z,
  )
  weapon.rotation.set(weaponRotation.x, weaponRotation.y, weaponRotation.z + Math.sin(elapsed * 4) * swayAmount)

  const recoilPitchDelta = recoilPitch - appliedRecoilPitch
  const recoilYawDelta = recoilYaw - appliedRecoilYaw
  if (Math.abs(recoilPitchDelta) > 0.00001 || Math.abs(recoilYawDelta) > 0.00001) {
    camera.rotation.x -= recoilPitchDelta
    camera.rotation.y += recoilYawDelta
    appliedRecoilPitch = recoilPitch
    appliedRecoilYaw = recoilYaw
    recoilPitch *= Math.exp(-12 * delta)
    recoilYaw *= Math.exp(-14 * delta)
  }

  renderer.render(scene, camera)
}

renderer.setAnimationLoop(render)
