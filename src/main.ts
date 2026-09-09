import './style.css'
import * as THREE from 'three'
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js'
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js'
import { gsap } from 'gsap'
import RAPIER from '@dimforge/rapier3d-compat'

await RAPIER.init()

const app = document.querySelector<HTMLDivElement>('#app')!
type ModeCategory = 'flicking'
const activeModeCategory: ModeCategory = 'flicking'

app.innerHTML = `
  <main class="aim-lab">
    <header class="topbar">
      <div class="brand"><span class="brand-mark">+</span><span>AIM / LAB</span></div>
    </header>
    <section class="range" aria-label="3D aim training range">
      <canvas id="range-canvas" aria-label="FPS training range"></canvas>
      <div class="crosshair" aria-hidden="true"><span></span><i></i><b></b><em></em></div>
      <div class="hit-marker" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
      <div class="range-label">TRAINING RANGE <span>01</span></div>
      <div class="hud hud-left"><span class="hud-caption">ACCURACY</span><strong id="accuracy-value">--.-%</strong></div>
      <div class="hud hud-right"><span class="hud-caption">SCORE</span><strong id="score-value">000000</strong></div>
      <label class="sensitivity-control">SENS <output id="sensitivity-value">0.70</output><input id="sensitivity" type="range" min="0.2" max="1.5" step="0.05" value="0.7" aria-label="Mouse sensitivity"></label>
      <button class="fullscreen-button" type="button" aria-label="Enter fullscreen" title="Enter fullscreen">⛶</button>
    </section>
    <footer class="bottombar"><div class="mode-category"><span class="category-label">${activeModeCategory.toUpperCase()}</span><div class="mode-select" role="group" aria-label="Flicking modes"><button class="mode-button is-active" data-mode="flickshot" type="button">FLICKSHOT</button><button class="mode-button" data-mode="microshot" type="button">MICROSHOT</button><button class="mode-button" data-mode="gridshot" type="button">GRIDSHOT</button></div></div></footer>
  </main>
`

const canvas = document.querySelector<HTMLCanvasElement>('#range-canvas')!
const crosshair = document.querySelector<HTMLElement>('.crosshair')!
const hitMarker = document.querySelector<HTMLElement>('.hit-marker')!
const range = document.querySelector<HTMLElement>('.range')!
const fullscreenButton = document.querySelector<HTMLButtonElement>('.fullscreen-button')!
const sensitivityInput = document.querySelector<HTMLInputElement>('#sensitivity')!
const sensitivityValue = document.querySelector<HTMLOutputElement>('#sensitivity-value')!
const accuracyValue = document.querySelector<HTMLElement>('#accuracy-value')!
const scoreValue = document.querySelector<HTMLElement>('#score-value')!
const modeButtons = [...document.querySelectorAll<HTMLButtonElement>('.mode-button')]
type ShootingMode = 'microshot' | 'flickshot' | 'gridshot'
let shootingMode: ShootingMode = 'flickshot'
const scene = new THREE.Scene()
scene.background = new THREE.Color('#0b0e12')
scene.fog = new THREE.Fog('#0b0e12', 28, 600)
const physicsWorld = new RAPIER.World({ x: 0, y: -9.81, z: 0 })
physicsWorld.createCollider(RAPIER.ColliderDesc.cuboid(1000, 0.1, 1000).setTranslation(0, -0.1, 0))

const camera = new THREE.PerspectiveCamera(65, 1, 0.1, 600)
camera.position.set(0, 1.6, 5)
const controls = new PointerLockControls(camera, canvas)
controls.pointerSpeed = 0.7
scene.add(controls.object)

const weapon = new THREE.Group()
const modelMuzzle = new THREE.Object3D()
weapon.add(modelMuzzle)
const weaponPosition = new THREE.Vector3(0.44, -0.27, -0.58)
const weaponRotation = new THREE.Euler(-0.03, 0.04, 0.02)
const hipPosition = weaponPosition.clone()
const hipRotation = weaponRotation.clone()
const adsPosition = new THREE.Vector3(0, -0.25, -0.47)
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
weaponBody.visible = false
weaponSlide.visible = false
weaponGrip.visible = false
weaponBarrel.visible = false
rearSightLeft.visible = false
rearSightRight.visible = false
frontSight.visible = false
const pistolLoader = new FBXLoader()
const activeWeaponModel: string = 'colt1911'
const pistolModelUrl = new URL('./assets/SilencedPistol/_silencedPistol.fbx', import.meta.url).href
pistolLoader.load(pistolModelUrl, (pistol) => {
  pistol.scale.setScalar(0.0008)
  pistol.rotation.set(0, -Math.PI / 2, 0)
  pistol.position.set(0, 0, 0)
  pistol.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.castShadow = false
      object.frustumCulled = false
    }
  })
  pistol.updateMatrixWorld(true)
  const modelBounds = new THREE.Box3().setFromObject(pistol)
  modelMuzzle.position.set(
    (modelBounds.min.x + modelBounds.max.x) * 0.5,
    (modelBounds.min.y + modelBounds.max.y) * 0.5,
    Math.min(modelBounds.min.z, modelBounds.max.z) - 0.02,
  )
  muzzleFlash.position.copy(modelMuzzle.position)
  muzzleFlash.position.y += 0.20
  muzzleFlash.position.z -= 0.08
  pistol.visible = activeWeaponModel === 'silenced'
  weapon.add(pistol)
}, undefined, (error) => {
  console.error('Failed to load SilencedPistol model.', error)
})
const coltLoader = new FBXLoader()
const coltModelUrl = new URL('./assets/Colt1911/colt1911.fbx', import.meta.url).href
coltLoader.load(coltModelUrl, (colt) => {
  colt.rotation.set(0, Math.PI, 0)
  colt.position.set(0, 0, 0)
  colt.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.castShadow = false
      object.frustumCulled = false
      const materials = Array.isArray(object.material) ? object.material : [object.material]
      const blackMaterials = materials.map((material) => new THREE.MeshStandardMaterial({
        color: '#050505',
        metalness: 0.82,
        roughness: 0.3,
        side: material.side,
      }))
      object.material = Array.isArray(object.material) ? blackMaterials : blackMaterials[0]
    }
  })
  colt.updateMatrixWorld(true)
  const coltBounds = new THREE.Box3().setFromObject(colt)
  const coltSize = coltBounds.getSize(new THREE.Vector3())
  colt.scale.setScalar(0.95 / Math.max(coltSize.x, coltSize.y, coltSize.z))
  colt.updateMatrixWorld(true)
  const scaledBounds = new THREE.Box3().setFromObject(colt)
  const scaledCenter = scaledBounds.getCenter(new THREE.Vector3())
  colt.position.sub(scaledCenter)
  colt.updateMatrixWorld(true)
  const centeredBounds = new THREE.Box3().setFromObject(colt)
  modelMuzzle.position.set(
    (centeredBounds.min.x + centeredBounds.max.x) * 0.5,
    (centeredBounds.min.y + centeredBounds.max.y) * 0.5,
    Math.min(centeredBounds.min.z, centeredBounds.max.z) - 0.02,
  )
  muzzleFlash.position.copy(modelMuzzle.position)
  muzzleFlash.position.y += 0.20
  muzzleFlash.position.z -= 0.08
  colt.visible = activeWeaponModel === 'colt1911'
  weapon.add(colt)
}, undefined, (error) => {
  console.error('Failed to load Colt 1911 model or textures.', error)
})
weapon.scale.setScalar(0.72)
weapon.position.copy(weaponPosition)
weapon.rotation.copy(weaponRotation)
camera.add(weapon)

const muzzleLocalPosition = new THREE.Vector3()
function getMuzzleWorldPosition(): THREE.Vector3 {
  return modelMuzzle.localToWorld(muzzleLocalPosition.clone())
}

let aiming = false
let recoilPitch = 0
let recoilYaw = 0
let appliedRecoilPitch = 0
let appliedRecoilYaw = 0
let weaponRecoilPitch = 0
let weaponRecoilYaw = 0

function triggerMuzzleFlash(): void {
  muzzleFlash.scale.set(0.7 + Math.random() * 0.3, 0.8 + Math.random() * 0.35, 0.7 + Math.random() * 0.3)
  gsap.killTweensOf(muzzleFlash.material)
  muzzleFlash.material.opacity = 0.78
  gsap.to(muzzleFlash.material, { opacity: 0, duration: 0.07, ease: 'power2.out' })
}

function applyRecoil(): void {
  const strength = aiming ? 0.018 : 0.035
  recoilPitch += strength
  recoilYaw += (Math.random() - 0.5) * strength * 0.8
  weaponRecoilPitch += strength * 0.9
  weaponRecoilYaw += (Math.random() - 0.5) * strength * 0.55
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

function releaseAim(): void {
  if (aiming) setAiming(false)
}

canvas.addEventListener('pointerdown', handlePointerDown)
canvas.addEventListener('mousedown', (event) => {
  if (event.button === 0 && controls.isLocked && aiming) {
    event.preventDefault()
    fireShot()
  }
})
document.addEventListener('pointerup', handlePointerUp)
document.addEventListener('pointercancel', releaseAim)
window.addEventListener('mouseup', (event) => {
  if (event.button === 2) releaseAim()
})
window.addEventListener('blur', releaseAim)
document.addEventListener('visibilitychange', () => {
  if (document.hidden) releaseAim()
})
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

async function toggleFullscreen(): Promise<void> {
  if (document.fullscreenElement) {
    await document.exitFullscreen()
  } else {
    await range.requestFullscreen()
  }
}

function updateFullscreenButton(): void {
  const isFullscreen = document.fullscreenElement === range
  fullscreenButton.textContent = isFullscreen ? '⛶' : '⛶'
  fullscreenButton.setAttribute('aria-label', isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen')
  fullscreenButton.title = isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'
  resizeRenderer()
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
  if (!locked) releaseAim()
  range.classList.toggle('is-locked', locked)
}

canvas.addEventListener('click', lockPointer)
fullscreenButton.addEventListener('click', () => { void toggleFullscreen() })
document.addEventListener('fullscreenchange', updateFullscreenButton)
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

const targetRadius = 0.72
const targetGeometry = new THREE.SphereGeometry(targetRadius, 24, 16)
const targetMaterial = new THREE.MeshBasicMaterial({ color: '#e33f32', fog: false })
const target = new THREE.Mesh(targetGeometry, targetMaterial)
target.position.set(0, 2.2, -7)
scene.add(target)
const gridTargetA = new THREE.Mesh(targetGeometry, targetMaterial)
const gridTargetB = new THREE.Mesh(targetGeometry, targetMaterial)
const gridTargets = [target, gridTargetA, gridTargetB]
const previousTargetPositions = gridTargets.map((gridTarget) => gridTarget.position.clone())
const targetCollisionSample = new THREE.Vector3()
gridTargetA.visible = false
gridTargetB.visible = false
scene.add(gridTargetA, gridTargetB)

const targetPathCenter = new THREE.Vector3()
const targetPathSample = new THREE.Vector3()
const targetPath = new THREE.CatmullRomCurve3([], true, 'catmullrom', 0.5)
let targetPathSeed = 0
let targetPathStartedAt = 0
let targetPathSpeed = 0.11
const microshotPositions = [
  new THREE.Vector3(-3, 2.2, -8), new THREE.Vector3(0, 3.4, -9), new THREE.Vector3(3, 2.4, -8),
  new THREE.Vector3(-2.5, 1.2, -10), new THREE.Vector3(2.4, 1.4, -10),
]
const targetSpawnForward = new THREE.Vector3()
const targetSpawnRight = new THREE.Vector3()
const targetSpawnUp = new THREE.Vector3()
const targetSpawnPosition = new THREE.Vector3()
const gridAnchor = new THREE.Group()
const gridCenter = new THREE.Vector3()
const gridLocalPosition = new THREE.Vector3()
const gridCellIndices = [0, 1, 2]
const gridCells = Array.from({ length: 9 }, (_, index) => index)
scene.add(gridAnchor)

function updateGridLayout(): void {
  gridAnchor.position.copy(gridCenter)
  camera.getWorldPosition(targetSpawnPosition)
  targetSpawnPosition.y = gridCenter.y
  gridAnchor.lookAt(targetSpawnPosition)
  gridTargets.forEach((gridTarget, targetIndex) => {
    const cell = gridCellIndices[targetIndex]
    const column = cell % 3 - 1
    const row = 1 - Math.floor(cell / 3)
    gridLocalPosition.set(column * 2.1, row * 2.1, 0)
    gridTarget.position.copy(gridCenter).add(gridLocalPosition.applyQuaternion(gridAnchor.quaternion))
  })
}

function resetGridTargets(): void {
  camera.getWorldDirection(targetSpawnForward)
  camera.getWorldPosition(gridCenter)
  gridCenter.addScaledVector(targetSpawnForward, 18)
  gridCenter.y = Math.max(gridCenter.y, targetRadius + 0.15 + 2.1)
  const shuffledCells = [...gridCells].sort(() => Math.random() - 0.5)
  gridCellIndices.splice(0, gridCellIndices.length, ...shuffledCells.slice(0, gridTargets.length))
  updateGridLayout()
}

function moveGridTargetToRandomCell(hitTarget: typeof target): void {
  const targetIndex = gridTargets.indexOf(hitTarget)
  const occupiedCells = new Set(gridCellIndices)
  occupiedCells.delete(gridCellIndices[targetIndex])
  const freeCells = gridCells.filter((cell) => !occupiedCells.has(cell))
  gridCellIndices[targetIndex] = freeCells[Math.floor(Math.random() * freeCells.length)]
  updateGridLayout()
}

function snapshotTargetPositions(): void {
  gridTargets.forEach((gridTarget, targetIndex) => {
    previousTargetPositions[targetIndex].copy(gridTarget.position)
  })
}

function getRandomVisibleTargetPosition(): THREE.Vector3 {
  camera.updateMatrixWorld()
  camera.getWorldPosition(targetSpawnPosition)
  camera.getWorldDirection(targetSpawnForward)
  targetSpawnRight.setFromMatrixColumn(camera.matrixWorld, 0).normalize()
  targetSpawnUp.setFromMatrixColumn(camera.matrixWorld, 1).normalize()

  const distance = 14 + Math.random() * 22
  const halfHeight = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * distance
  const halfWidth = halfHeight * camera.aspect
  const horizontalMargin = Math.min(2.4, halfWidth * 0.65)
  const verticalMargin = Math.min(1.3, halfHeight * 0.65)
  const horizontalOffset = (Math.random() * 2 - 1) * Math.max(0, halfWidth - horizontalMargin)
  const verticalOffset = (Math.random() * 2 - 1) * Math.max(0, halfHeight - verticalMargin)

  targetSpawnPosition
    .addScaledVector(targetSpawnForward, distance)
    .addScaledVector(targetSpawnRight, horizontalOffset)
    .addScaledVector(targetSpawnUp, verticalOffset)
  targetSpawnPosition.y = THREE.MathUtils.clamp(targetSpawnPosition.y, targetRadius + 0.15 + 0.55, 5.5)
  return targetSpawnPosition.clone()
}

function rebuildTargetPath(center: THREE.Vector3, startTime = 0): void {
  targetPathCenter.copy(center)
  targetPathSeed = Math.random() * Math.PI * 2
  targetPathStartedAt = startTime
  targetPath.points = [
    new THREE.Vector3(center.x - 1.2, center.y + 0.35, center.z + 0.7),
    new THREE.Vector3(center.x + 1.1, center.y + 0.65, center.z + 0.4),
    new THREE.Vector3(center.x + 1.4, center.y - 0.3, center.z - 0.7),
    new THREE.Vector3(center.x - 0.9, center.y - 0.55, center.z - 0.8),
    new THREE.Vector3(center.x - 1.5, center.y + 0.1, center.z - 0.1),
  ]
}

function setShootingMode(nextMode: ShootingMode): void {
  shootingMode = nextMode
  modeButtons.forEach((button) => button.classList.toggle('is-active', button.dataset.mode === nextMode))
  gridTargets.forEach((gridTarget) => {
    gsap.killTweensOf(gridTarget)
    gridTarget.visible = nextMode === 'gridshot'
  })
  target.visible = true
  if (nextMode === 'gridshot') {
    resetGridTargets()
    return
  }
  const nextCenter = nextMode === 'microshot'
    ? microshotPositions[Math.floor(Math.random() * microshotPositions.length)]
    : getRandomVisibleTargetPosition()
  targetPathSpeed = nextMode === 'flickshot' ? 0.075 : 0.11
  rebuildTargetPath(nextCenter, clock.getElapsedTime())
  target.position.copy(nextCenter)
}

modeButtons.forEach((button) => {
  button.addEventListener('click', () => setShootingMode(button.dataset.mode as ShootingMode))
})

rebuildTargetPath(target.position)

function updateTargetMovement(elapsed: number): void {
  if (shootingMode === 'gridshot') return
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
  previousPosition: THREE.Vector3
}

const projectiles: Projectile[] = []
const projectileMaterial = new THREE.MeshBasicMaterial({ color: '#fff1a3', fog: false })
const projectileGeometry = new THREE.SphereGeometry(0.035, 8, 8)
const projectileRadius = 0.035
const projectileVelocity = 300
const projectileLifetime = 3

function spawnProjectile(direction: THREE.Vector3): void {
  shotOrigin.copy(getMuzzleWorldPosition())
  const bodyDescription = RAPIER.RigidBodyDesc.dynamic()
    .setTranslation(shotOrigin.x, shotOrigin.y, shotOrigin.z)
    .setLinvel(direction.x * projectileVelocity, direction.y * projectileVelocity, direction.z * projectileVelocity)
    .setCcdEnabled(true)
  const body = physicsWorld.createRigidBody(bodyDescription)
  physicsWorld.createCollider(RAPIER.ColliderDesc.ball(projectileRadius).setDensity(1).setRestitution(0), body)
  const mesh = new THREE.Mesh(projectileGeometry, projectileMaterial)
  mesh.position.copy(shotOrigin)
  scene.add(mesh)
  const now = performance.now() / 1000
  projectiles.push({ body, mesh, bornAt: now, lastTrailAt: now, previousPosition: shotOrigin.clone() })
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
    const sweptPath = new THREE.Line3(projectile.previousPosition, projectilePosition)
    const hitTarget = gridTargets.find((candidate, targetIndex) => {
      if (!candidate.visible) return false
      const hitRadius = targetRadius + projectileRadius
      const previousPosition = previousTargetPositions[targetIndex]
      for (let sampleIndex = 0; sampleIndex <= 16; sampleIndex += 1) {
        targetCollisionSample.copy(previousPosition).lerp(candidate.position, sampleIndex / 16)
        const closestPoint = sweptPath.closestPointToPoint(targetCollisionSample, true, new THREE.Vector3())
        if (closestPoint.distanceToSquared(targetCollisionSample) <= (hitRadius + 0.08) ** 2) return true
      }
      return false
    })
    projectile.previousPosition.copy(projectilePosition)
    if (hitTarget) {
      registerTargetHit(hitTarget)
    }
    const hitFloor = translation.y <= projectileRadius + 0.01
    if (hitTarget || hitFloor || now - projectile.bornAt > projectileLifetime) {
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

function registerTargetHit(hitTarget: typeof target): void {
  shotsHit += 1
  score += 100
  gsap.killTweensOf(hitMarker)
  gsap.fromTo(hitMarker, { opacity: 1, scale: 0.82 }, { opacity: 0, scale: 1, duration: 0.22, ease: 'power2.out' })
  if (shootingMode === 'gridshot') {
    moveGridTargetToRandomCell(hitTarget)
  } else if (shootingMode === 'microshot') {
    impactOffset.copy(microshotPositions[Math.floor(Math.random() * microshotPositions.length)])
    rebuildTargetPath(impactOffset, clock.getElapsedTime())
    target.position.copy(impactOffset)
    target.visible = false
    gsap.delayedCall(0.28, () => {
      if (shootingMode === 'microshot') target.visible = true
    })
  } else {
    impactOffset.copy(getRandomVisibleTargetPosition())
    rebuildTargetPath(impactOffset, clock.getElapsedTime())
    target.position.copy(impactOffset)
    target.visible = false
    gsap.delayedCall(0.28, () => {
      if (shootingMode === 'flickshot') target.visible = true
    })
  }
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
  const shotSpread = aiming ? movingAtShot ? 0.009 : 0.004 : movingAtShot ? 0.045 : 0.02
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
let weaponSwayFactor = 0
function render(): void {
  const delta = Math.min(clock.getDelta(), 0.05)
  const elapsed = clock.getElapsedTime()
  snapshotTargetPositions()
  if (shootingMode === 'gridshot') updateGridLayout()
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
  const crosshairGap = aiming ? isMoving ? 9 : 6 : isMoving ? 24 : 14
  crosshair.style.setProperty('--crosshair-gap', `${crosshairGap}px`)
  weaponSwayFactor += ((isMoving ? 1 : 0) - weaponSwayFactor) * Math.min(1, delta * 10)
  const swayAmount = weaponSwayFactor * (aiming ? 0.003 : 0.008)
  const weaponKick = weaponRecoilPitch * 0.8
  weapon.position.set(
    weaponPosition.x + Math.sin(elapsed * 4.5) * swayAmount,
    weaponPosition.y + Math.cos(elapsed * 2.25) * swayAmount * 0.65,
    weaponPosition.z + weaponKick * 0.45,
  )
  weapon.rotation.set(
    weaponRotation.x + weaponRecoilPitch * 0.8,
    weaponRotation.y + weaponRecoilYaw,
    weaponRotation.z + Math.sin(elapsed * 2.8) * swayAmount * 0.45,
  )
  weaponRecoilPitch *= Math.exp(-18 * delta)
  weaponRecoilYaw *= Math.exp(-20 * delta)

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
