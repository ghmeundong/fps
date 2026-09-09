import './style.css'
import * as THREE from 'three'
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js'
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js'
import { gsap } from 'gsap'
import RAPIER from '@dimforge/rapier3d-compat'

await RAPIER.init()

const app = document.querySelector<HTMLDivElement>('#app')!
app.innerHTML = `
  <main class="aim-lab">
    <header class="topbar">
      <div class="brand"><span class="brand-mark">+</span><span>AIM / LAB</span></div>
    </header>
    <section class="range-shell">
      <div class="range" aria-label="3D aim training range">
      <canvas id="range-canvas" aria-label="FPS training range"></canvas>
      <div class="crosshair" aria-hidden="true"><span></span><i></i><b></b><em></em></div>
      <div class="hit-marker" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
      <div class="hud hud-left"><span class="hud-caption">ACCURACY</span><strong id="accuracy-value">--.-%</strong></div>
      <div class="hud hud-right"><span class="hud-caption">SCORE</span><strong id="score-value">000000</strong></div>
      <button class="settings-button" type="button" aria-label="Open settings" title="Open settings">⚙</button>
      <button class="fullscreen-button" type="button" aria-label="Enter fullscreen" title="Enter fullscreen">⛶</button>
      <div class="settings-overlay" aria-hidden="true">
        <button class="settings-close" type="button" aria-label="Close settings" title="Close settings">×</button>
        <section class="menu-home menu-view is-visible" aria-label="Pause menu">
          <h1>PAUSED</h1>
          <div class="menu-choice-list"><button class="menu-choice-button" id="menu-mode-button" type="button"><strong>MODE SELECT</strong><span>Choose a training scenario</span></button><button class="menu-choice-button" id="menu-settings-button" type="button"><strong>ENVIRONMENT SETTINGS</strong><span>Adjust your range configuration</span></button></div>
        </section>
        <section class="mode-menu menu-view" aria-label="Mode selection">
          <h1>MODE SELECT</h1>
          <div class="mode-layout">
            <nav class="mode-category-nav" aria-label="Mode categories"><button class="mode-category-button is-active" data-mode-category="flicking" type="button">FLICKING</button><button class="mode-category-button" data-mode-category="tracking" type="button">TRACKING</button></nav>
            <div class="mode-category-content"><section class="mode-panel is-visible" data-mode-panel="flicking"><h2>FLICKING</h2><div class="mode-select" role="group" aria-label="Flicking modes"><button class="mode-button is-active" data-mode="flickshot" type="button">FLICKSHOT</button><button class="mode-button" data-mode="microshot" type="button">MICROSHOT</button><button class="mode-button" data-mode="gridshot" type="button">GRIDSHOT</button><button class="mode-button" data-mode="reflexshot" type="button">REFLEXSHOT</button></div></section><section class="mode-panel" data-mode-panel="tracking"><h2>TRACKING</h2><div class="mode-select" role="group" aria-label="Tracking modes"><button class="mode-button" data-mode="strafetrack" type="button">STRAFETRACK</button><button class="mode-button" data-mode="spheretrack" type="button">SPHERETRACK</button><button class="mode-button" data-mode="fallingtrack" type="button">FALLING TRACK</button></div></section></div>
          </div>
        </section>
        <div class="settings-content">
          <div class="settings-heading"><span>ENVIRONMENT SETTINGS</span></div>
          <div class="settings-layout">
            <nav class="settings-nav" aria-label="Settings categories"><button class="settings-category is-active" data-category="display" type="button">DISPLAY &amp; GRAPHICS</button><button class="settings-category" data-category="weapon" type="button">WEAPON &amp; BALLISTICS</button><button class="settings-category" data-category="controls" type="button">MOUSE &amp; CONTROLS</button><button class="settings-category" data-category="crosshair" type="button">CROSSHAIR</button><button class="settings-category" data-category="targets" type="button">TARGETS &amp; ENVIRONMENT</button><button class="settings-category" data-category="sound" type="button">SOUND</button></nav>
            <div class="settings-category-content">
              <section class="settings-group settings-panel-group is-visible" data-category-panel="display"><h2>DISPLAY &amp; GRAPHICS</h2><label>RENDER DISTANCE <output id="render-distance-value">600</output><input id="render-distance-setting" type="range" min="100" max="600" step="10" value="600"></label><label>FOV <output id="fov-value">65</output><input id="fov-setting" type="range" min="45" max="103" step="1" value="65"></label><label>RESOLUTION SCALE <output id="resolution-scale-value">100%</output><input id="resolution-scale-setting" type="range" min="50" max="150" step="5" value="100"></label><label>MAX FPS <select id="max-fps-setting"><option value="0">UNLIMITED</option><option value="60">60</option><option value="144">144</option><option value="240">240</option></select></label><label class="toggle-row">ANTI-ALIASING <input id="antialiasing-setting" type="checkbox" checked></label></section>
              <section class="settings-group settings-panel-group" data-category-panel="weapon"><h2>WEAPON &amp; BALLISTICS</h2><div class="weapon-preview"><h2>CURRENT WEAPON</h2><canvas id="weapon-preview-canvas" aria-label="Current weapon preview"></canvas><strong id="current-weapon-name">COLT 1911</strong></div><label>WEAPON <select id="weapon-setting"><option value="auto">AUTO BY MODE</option><option value="pistol">PISTOL</option><option value="ak47">AK47</option></select></label><label>HITSCAN / PROJECTILE <select id="fire-mode-setting"><option value="projectile">PROJECTILE</option><option value="hitscan">HITSCAN</option></select></label><label>BULLET SPEED <output id="bullet-speed-value">253</output><input id="bullet-speed-setting" type="range" min="50" max="500" step="1" value="253"></label><label>RECOIL <output id="recoil-value">50%</output><input id="recoil-setting" type="range" min="0" max="100" value="50"></label><label>SPREAD <output id="spread-value">50%</output><input id="spread-setting" type="range" min="0" max="100" value="50"></label><label>MOVEMENT SPREAD <output id="movement-spread-value">225%</output><input id="movement-spread-setting" type="range" min="100" max="500" value="225"></label><label>AIM JUMP SPREAD <output id="aiming-jump-spread-value">550%</output><input id="aiming-jump-spread-setting" type="range" min="100" max="800" value="550"></label><label>HIPFIRE JUMP SPREAD <output id="hipfire-jump-spread-value">450%</output><input id="hipfire-jump-spread-setting" type="range" min="100" max="800" value="450"></label><label>BULLET DROP <output id="bullet-drop-value">100%</output><input id="bullet-drop-setting" type="range" min="0" max="200" value="100"></label></section>
              <section class="settings-group settings-panel-group" data-category-panel="controls"><h2>MOUSE &amp; CONTROLS</h2><label>SENSITIVITY <output id="settings-sensitivity-value">0.70</output><input id="settings-sensitivity" type="range" min="0.2" max="1.5" step="0.05" value="0.7"></label><label>DPI MULTIPLIER <output id="dpi-value">800</output><input id="dpi-setting" type="range" min="100" max="3200" step="100" value="800"></label><label>ADS RATIO <output id="ads-ratio-value">1.00</output><input id="ads-ratio-setting" type="range" min="0.1" max="2" step="0.05" value="1"></label><label>ADS FOV <output id="ads-fov-value">48</output><input id="ads-fov-setting" type="range" min="30" max="65" step="1" value="48"></label><label class="toggle-row">RAW INPUT <input id="raw-input-setting" type="checkbox" checked></label></section>
              <section class="settings-group settings-panel-group" data-category-panel="crosshair"><h2>CROSSHAIR</h2><label>STYLE <select id="crosshair-style-setting"><option>DOT + CROSS</option><option>DOT</option><option>CROSS</option><option>CIRCLE</option></select></label><label>COLOR <input id="crosshair-color-setting" type="color" value="#ffffff"></label><label>GAP <output id="crosshair-gap-value">14px</output><input id="crosshair-gap-setting" type="range" min="0" max="30" value="14"></label><label>LENGTH <output id="crosshair-length-value">8px</output><input id="crosshair-length-setting" type="range" min="2" max="24" value="8"></label><label>THICKNESS <output id="crosshair-thickness-value">1px</output><input id="crosshair-thickness-setting" type="range" min="1" max="5" value="1"></label><label>DOT SIZE <output id="crosshair-dot-size-value">5px</output><input id="crosshair-dot-size-setting" type="range" min="1" max="12" value="5"></label><label>CIRCLE SIZE <output id="crosshair-circle-size-value">30px</output><input id="crosshair-circle-size-setting" type="range" min="8" max="58" value="30"></label><label>OPACITY <output id="crosshair-opacity-value">90%</output><input id="crosshair-opacity-setting" type="range" min="10" max="100" value="90"></label><label>OUTLINE COLOR <input id="crosshair-outline-color-setting" type="color" value="#000000"></label><label>OUTLINE THICKNESS <output id="crosshair-outline-thickness-value">0px</output><input id="crosshair-outline-thickness-setting" type="range" min="0" max="4" value="0"></label><label class="toggle-row">DYNAMIC RESPONSE <input id="crosshair-dynamic-setting" type="checkbox" checked></label><label>DYNAMIC STRENGTH <output id="crosshair-dynamic-strength-value">100%</output><input id="crosshair-dynamic-strength-setting" type="range" min="0" max="200" value="100"></label><h2>HIT MARKER</h2><label>COLOR <input id="hit-marker-color-setting" type="color" value="#67d68b"></label><label>SIZE <output id="hit-marker-size-value">36px</output><input id="hit-marker-size-setting" type="range" min="16" max="72" value="36"></label><label>LENGTH <output id="hit-marker-length-value">9px</output><input id="hit-marker-length-setting" type="range" min="3" max="24" value="9"></label><label>THICKNESS <output id="hit-marker-thickness-value">1px</output><input id="hit-marker-thickness-setting" type="range" min="1" max="5" value="1"></label><label>GAP <output id="hit-marker-gap-value">10px</output><input id="hit-marker-gap-setting" type="range" min="4" max="24" value="10"></label><label>FADE TIME <output id="hit-marker-duration-value">0.22s</output><input id="hit-marker-duration-setting" type="range" min="0.05" max="1" step="0.01" value="0.22"></label></section>
              <section class="settings-group settings-panel-group" data-category-panel="targets"><h2>TARGETS &amp; ENVIRONMENT</h2><label>BACKGROUND <input id="background-color-setting" type="color" value="#0b0e12"></label><label>FLOOR <input id="floor-color-setting" type="color" value="#171d24"></label><label>GRID <input id="grid-color-setting" type="color" value="#33404a"></label><label>TARGET <input id="target-color-setting" type="color" value="#e33f32"></label><label>TARGET SIZE <output id="target-size-value">100%</output><input id="target-size-setting" type="range" min="50" max="150" value="100"></label><label>TRACKING SPEED <output id="tracking-speed-value">4.0</output><input id="tracking-speed-setting" type="range" min="1" max="10" step="0.5" value="4"></label><label>FALLING HORIZONTAL FORCE <output id="falling-horizontal-force-value">3.4</output><input id="falling-horizontal-force-setting" type="range" min="0" max="8" step="0.1" value="3.4"></label><label>FALLING LAUNCH <output id="falling-launch-value">12.0</output><input id="falling-launch-setting" type="range" min="0" max="20" step="0.5" value="12"></label><label>FALLING GRAVITY <output id="falling-gravity-value">18.0</output><input id="falling-gravity-setting" type="range" min="1" max="36" step="0.5" value="18"></label><label>FALLING RESPAWN DELAY <output id="falling-respawn-delay-value">0.60s</output><input id="falling-respawn-delay-setting" type="range" min="0.1" max="2" step="0.05" value="0.6"></label></section>
              <section class="settings-group settings-panel-group" data-category-panel="sound"><h2>SOUND</h2><label>GUNSHOT VOLUME <output id="gunshot-volume-value">50%</output><input id="gunshot-volume-setting" type="range" min="0" max="100" value="50"></label></section>
            </div>
          </div>
        </div>
      </div>
      </div>
    </section>
  </main>
`

const canvas = document.querySelector<HTMLCanvasElement>('#range-canvas')!
const crosshair = document.querySelector<HTMLElement>('.crosshair')!
const hitMarker = document.querySelector<HTMLElement>('.hit-marker')!
const range = document.querySelector<HTMLElement>('.range')!
const settingsButton = document.querySelector<HTMLButtonElement>('.settings-button')!
const settingsOverlay = document.querySelector<HTMLElement>('.settings-overlay')!
const settingsClose = document.querySelector<HTMLButtonElement>('.settings-close')!
const menuHome = document.querySelector<HTMLElement>('.menu-home')!
const modeMenu = document.querySelector<HTMLElement>('.mode-menu')!
const settingsContent = document.querySelector<HTMLElement>('.settings-content')!
const resetSettingsButton = document.createElement('button')
resetSettingsButton.type = 'button'
resetSettingsButton.className = 'settings-reset-button'
resetSettingsButton.textContent = 'RESET DEFAULTS'
settingsContent.querySelector('.settings-heading')?.append(resetSettingsButton)
resetSettingsButton.addEventListener('click', () => {
  localStorage.removeItem(settingsStorageKey)
  window.location.reload()
})
const menuModeButton = document.querySelector<HTMLButtonElement>('#menu-mode-button')!
const menuSettingsButton = document.querySelector<HTMLButtonElement>('#menu-settings-button')!
const modeCategoryButtons = [...document.querySelectorAll<HTMLButtonElement>('.mode-category-button')]
const modeCategoryPanels = [...document.querySelectorAll<HTMLElement>('[data-mode-panel]')]
let activeMenuView: 'home' | 'mode' | 'settings' = 'home'
const weaponPreviewCanvas = document.querySelector<HTMLCanvasElement>('#weapon-preview-canvas')!
const fullscreenButton = document.querySelector<HTMLButtonElement>('.fullscreen-button')!
const accuracyValue = document.querySelector<HTMLElement>('#accuracy-value')!
const scoreValue = document.querySelector<HTMLElement>('#score-value')!
const modeButtons = [...document.querySelectorAll<HTMLButtonElement>('.mode-button')]
const settingsCategoryButtons = [...document.querySelectorAll<HTMLButtonElement>('.settings-category')]
const settingsCategoryPanels = [...document.querySelectorAll<HTMLElement>('[data-category-panel]')]
const weaponCategoryButton = settingsCategoryButtons.find((button) => button.dataset.category === 'weapon')
const displayCategoryButton = settingsCategoryButtons.find((button) => button.dataset.category === 'display')
const settingsCategoryNav = weaponCategoryButton?.parentElement
if (weaponCategoryButton && displayCategoryButton && settingsCategoryNav) settingsCategoryNav.insertBefore(weaponCategoryButton, displayCategoryButton)
const weaponCategoryPanel = settingsCategoryPanels.find((panel) => panel.dataset.categoryPanel === 'weapon')
const displayCategoryPanel = settingsCategoryPanels.find((panel) => panel.dataset.categoryPanel === 'display')
const settingsCategoryContent = weaponCategoryPanel?.parentElement
if (weaponCategoryPanel && displayCategoryPanel && settingsCategoryContent) settingsCategoryContent.insertBefore(weaponCategoryPanel, displayCategoryPanel)
settingsCategoryButtons.forEach((button) => button.classList.toggle('is-active', button === weaponCategoryButton))
settingsCategoryPanels.forEach((panel) => panel.classList.toggle('is-visible', panel === weaponCategoryPanel))
const fovSetting = document.querySelector<HTMLInputElement>('#fov-setting')!
const fovValue = document.querySelector<HTMLOutputElement>('#fov-value')!
const bulletSpeedSetting = document.querySelector<HTMLInputElement>('#bullet-speed-setting')!
const bulletSpeedValue = document.querySelector<HTMLOutputElement>('#bullet-speed-value')!
const settingsSensitivity = document.querySelector<HTMLInputElement>('#settings-sensitivity')!
const settingsSensitivityValue = document.querySelector<HTMLOutputElement>('#settings-sensitivity-value')!
const renderDistanceSetting = document.querySelector<HTMLInputElement>('#render-distance-setting')!
const renderDistanceValue = document.querySelector<HTMLOutputElement>('#render-distance-value')!
const resolutionScaleSetting = document.querySelector<HTMLInputElement>('#resolution-scale-setting')!
const resolutionScaleValue = document.querySelector<HTMLOutputElement>('#resolution-scale-value')!
const antialiasingSetting = document.querySelector<HTMLInputElement>('#antialiasing-setting')!
const maxFpsSetting = document.querySelector<HTMLSelectElement>('#max-fps-setting')!
const fireModeSetting = document.querySelector<HTMLSelectElement>('#fire-mode-setting')!
const weaponSetting = document.querySelector<HTMLSelectElement>('#weapon-setting')!
const currentWeaponName = document.querySelector<HTMLElement>('#current-weapon-name')!
const recoilModeSetting = document.createElement('select')
recoilModeSetting.id = 'recoil-mode-setting'
recoilModeSetting.innerHTML = '<option value="recover">KICK + RECOVER</option><option value="sustained">SUSTAINED</option>'
const recoilModeLabel = document.createElement('label')
recoilModeLabel.textContent = 'RECOIL MODE '
recoilModeLabel.append(recoilModeSetting)
bulletSpeedSetting.closest('label')?.before(recoilModeLabel)
const recoilSetting = document.querySelector<HTMLInputElement>('#recoil-setting')!
const recoilValue = document.querySelector<HTMLOutputElement>('#recoil-value')!
const spreadSetting = document.querySelector<HTMLInputElement>('#spread-setting')!
const spreadValue = document.querySelector<HTMLOutputElement>('#spread-value')!
const movementSpreadSetting = document.querySelector<HTMLInputElement>('#movement-spread-setting')!
const movementSpreadValue = document.querySelector<HTMLOutputElement>('#movement-spread-value')!
const aimingJumpSpreadSetting = document.querySelector<HTMLInputElement>('#aiming-jump-spread-setting')!
const aimingJumpSpreadValue = document.querySelector<HTMLOutputElement>('#aiming-jump-spread-value')!
const hipfireJumpSpreadSetting = document.querySelector<HTMLInputElement>('#hipfire-jump-spread-setting')!
const hipfireJumpSpreadValue = document.querySelector<HTMLOutputElement>('#hipfire-jump-spread-value')!
const bulletDropSetting = document.querySelector<HTMLInputElement>('#bullet-drop-setting')!
const bulletDropValue = document.querySelector<HTMLOutputElement>('#bullet-drop-value')!
const trackingSpeedSetting = document.querySelector<HTMLInputElement>('#tracking-speed-setting')!
const trackingSpeedValue = document.querySelector<HTMLOutputElement>('#tracking-speed-value')!
const fallingHorizontalForceSetting = document.querySelector<HTMLInputElement>('#falling-horizontal-force-setting')!
const fallingHorizontalForceValue = document.querySelector<HTMLOutputElement>('#falling-horizontal-force-value')!
const fallingLaunchSetting = document.querySelector<HTMLInputElement>('#falling-launch-setting')!
const fallingLaunchValue = document.querySelector<HTMLOutputElement>('#falling-launch-value')!
const fallingGravitySetting = document.querySelector<HTMLInputElement>('#falling-gravity-setting')!
const fallingGravityValue = document.querySelector<HTMLOutputElement>('#falling-gravity-value')!
const fallingRespawnDelaySetting = document.querySelector<HTMLInputElement>('#falling-respawn-delay-setting')!
const fallingRespawnDelayValue = document.querySelector<HTMLOutputElement>('#falling-respawn-delay-value')!
const targetSizeSetting = document.querySelector<HTMLInputElement>('#target-size-setting')!
const targetSizeValue = document.querySelector<HTMLOutputElement>('#target-size-value')!
const backgroundColorSetting = document.querySelector<HTMLInputElement>('#background-color-setting')!
const floorColorSetting = document.querySelector<HTMLInputElement>('#floor-color-setting')!
const gridColorSetting = document.querySelector<HTMLInputElement>('#grid-color-setting')!
const targetColorSetting = document.querySelector<HTMLInputElement>('#target-color-setting')!
const gunshotVolumeSetting = document.querySelector<HTMLInputElement>('#gunshot-volume-setting')!
const gunshotVolumeValue = document.querySelector<HTMLOutputElement>('#gunshot-volume-value')!
const crosshairStyleSetting = document.querySelector<HTMLSelectElement>('#crosshair-style-setting')!
const crosshairColorSetting = document.querySelector<HTMLInputElement>('#crosshair-color-setting')!
const crosshairGapSetting = document.querySelector<HTMLInputElement>('#crosshair-gap-setting')!
const crosshairGapValue = document.querySelector<HTMLOutputElement>('#crosshair-gap-value')!
const crosshairLengthSetting = document.querySelector<HTMLInputElement>('#crosshair-length-setting')!
const crosshairLengthValue = document.querySelector<HTMLOutputElement>('#crosshair-length-value')!
const crosshairThicknessSetting = document.querySelector<HTMLInputElement>('#crosshair-thickness-setting')!
const crosshairThicknessValue = document.querySelector<HTMLOutputElement>('#crosshair-thickness-value')!
const crosshairDotSizeSetting = document.querySelector<HTMLInputElement>('#crosshair-dot-size-setting')!
const crosshairDotSizeValue = document.querySelector<HTMLOutputElement>('#crosshair-dot-size-value')!
const crosshairCircleSizeSetting = document.querySelector<HTMLInputElement>('#crosshair-circle-size-setting')!
const crosshairCircleSizeValue = document.querySelector<HTMLOutputElement>('#crosshair-circle-size-value')!
const crosshairOpacitySetting = document.querySelector<HTMLInputElement>('#crosshair-opacity-setting')!
const crosshairOpacityValue = document.querySelector<HTMLOutputElement>('#crosshair-opacity-value')!
const crosshairDynamicSetting = document.querySelector<HTMLInputElement>('#crosshair-dynamic-setting')!
const crosshairDynamicStrengthSetting = document.querySelector<HTMLInputElement>('#crosshair-dynamic-strength-setting')!
const crosshairDynamicStrengthValue = document.querySelector<HTMLOutputElement>('#crosshair-dynamic-strength-value')!
const hitMarkerColorSetting = document.querySelector<HTMLInputElement>('#hit-marker-color-setting')!
const hitMarkerSizeSetting = document.querySelector<HTMLInputElement>('#hit-marker-size-setting')!
const hitMarkerSizeValue = document.querySelector<HTMLOutputElement>('#hit-marker-size-value')!
const hitMarkerLengthSetting = document.querySelector<HTMLInputElement>('#hit-marker-length-setting')!
const hitMarkerLengthValue = document.querySelector<HTMLOutputElement>('#hit-marker-length-value')!
const hitMarkerThicknessSetting = document.querySelector<HTMLInputElement>('#hit-marker-thickness-setting')!
const hitMarkerThicknessValue = document.querySelector<HTMLOutputElement>('#hit-marker-thickness-value')!
const hitMarkerGapSetting = document.querySelector<HTMLInputElement>('#hit-marker-gap-setting')!
const hitMarkerGapValue = document.querySelector<HTMLOutputElement>('#hit-marker-gap-value')!
const hitMarkerDurationSetting = document.querySelector<HTMLInputElement>('#hit-marker-duration-setting')!
const hitMarkerDurationValue = document.querySelector<HTMLOutputElement>('#hit-marker-duration-value')!
const dpiSetting = document.querySelector<HTMLInputElement>('#dpi-setting')!
const dpiValue = document.querySelector<HTMLOutputElement>('#dpi-value')!
const adsRatioSetting = document.querySelector<HTMLInputElement>('#ads-ratio-setting')!
const adsRatioValue = document.querySelector<HTMLOutputElement>('#ads-ratio-value')!
const adsFovSetting = document.querySelector<HTMLInputElement>('#ads-fov-setting')!
const adsFovValue = document.querySelector<HTMLOutputElement>('#ads-fov-value')!
const rawInputSetting = document.querySelector<HTMLInputElement>('#raw-input-setting')!
const domeGridPanel = document.querySelector<HTMLElement>('[data-category-panel="targets"]')!
const domeGridSetting = document.createElement('input')
domeGridSetting.id = 'dome-grid-setting'
domeGridSetting.type = 'checkbox'
domeGridSetting.checked = false
const domeGridToggleLabel = document.createElement('label')
domeGridToggleLabel.className = 'toggle-row'
domeGridToggleLabel.textContent = 'NEON DOME GRID '
domeGridToggleLabel.append(domeGridSetting)
const domeGridColorSetting = document.createElement('input')
domeGridColorSetting.id = 'dome-grid-color-setting'
domeGridColorSetting.type = 'color'
domeGridColorSetting.value = '#39ff88'
const domeGridColorLabel = document.createElement('label')
domeGridColorLabel.textContent = 'DOME GRID COLOR '
domeGridColorLabel.append(domeGridColorSetting)
domeGridPanel.insertBefore(domeGridToggleLabel, floorColorSetting.closest('label'))
domeGridPanel.insertBefore(domeGridColorLabel, floorColorSetting.closest('label'))
const crosshairOutlineColorSetting = document.querySelector<HTMLInputElement>('#crosshair-outline-color-setting')!
const crosshairOutlineThicknessSetting = document.querySelector<HTMLInputElement>('#crosshair-outline-thickness-setting')!
const crosshairOutlineThicknessValue = document.querySelector<HTMLOutputElement>('#crosshair-outline-thickness-value')!
type ShootingMode = 'microshot' | 'flickshot' | 'gridshot' | 'reflexshot' | 'strafetrack' | 'spheretrack' | 'fallingtrack'
type WeaponId = 'pistol' | 'ak47'
type RecoilMode = 'recover' | 'sustained'
type WeaponProfile = {
  fireMode: 'projectile' | 'hitscan'
  bulletSpeed: number
  recoil: number
  spread: number
  movementSpread: number
  aimingJumpSpread: number
  hipfireJumpSpread: number
  bulletDrop: number
  recoilMode: RecoilMode
}
const weaponProfiles: Record<WeaponId, WeaponProfile> = {
  pistol: { fireMode: 'projectile', bulletSpeed: 253, recoil: 50, spread: 75, movementSpread: 235, aimingJumpSpread: 350, hipfireJumpSpread: 250, bulletDrop: 100, recoilMode: 'recover' },
  ak47: { fireMode: 'projectile', bulletSpeed: 710, recoil: 50, spread: 90, movementSpread: 235, aimingJumpSpread: 350, hipfireJumpSpread: 250, bulletDrop: 100, recoilMode: 'sustained' },
}
let shootingMode: ShootingMode = 'flickshot'
let weaponSelection: 'auto' | WeaponId = 'auto'
let activeWeapon: WeaponId = 'pistol'
let fireMode: 'projectile' | 'hitscan' = 'projectile'
let recoilMode: RecoilMode = 'recover'
let recoilMultiplier = 1
let spreadMultiplier = 1
let gravityMultiplier = 1
let trackingSpeed = 4
let fallingHorizontalForce = 3.4
let fallingLaunchSpeed = 12
let fallingGravity = 18
let fallingRespawnDelay = 0.6
let maxFps = 0
let targetSizeMultiplier = 1
let hitVfxEnabled = true
let hitSoundEnabled = true
let crosshairDynamicEnabled = true
let crosshairDynamicStrength = 1
let hitMarkerDuration = 0.22
let dpiMultiplier = 1
let adsSensitivityRatio = 1
let adsFov = 48
let resolutionScale = 1
let rawInputEnabled = true

function updateBallisticControlState(): void {
  const hitscanSelected = fireMode === 'hitscan'
  bulletSpeedSetting.disabled = hitscanSelected
  bulletDropSetting.disabled = hitscanSelected
  bulletSpeedSetting.closest('label')?.classList.toggle('is-disabled', hitscanSelected)
  bulletDropSetting.closest('label')?.classList.toggle('is-disabled', hitscanSelected)
}

const settingsStorageKey = 'aim-lab-settings-v1'
let restoringSettings = false
const persistedSettings = [
  ...document.querySelectorAll<HTMLInputElement | HTMLSelectElement>('.settings-overlay input, .settings-overlay select'),
]

function saveSettings(): void {
  const values: Record<string, string | boolean> = {}
  persistedSettings.forEach((control) => {
    values[control.id] = control instanceof HTMLInputElement && control.type === 'checkbox' ? control.checked : control.value
  })
  try {
    localStorage.setItem(settingsStorageKey, JSON.stringify(values))
  } catch { }
}

function restoreSettings(): void {
  restoringSettings = true
  try {
    const storedValues = JSON.parse(localStorage.getItem(settingsStorageKey) ?? '{}') as Record<string, string | boolean>
    persistedSettings.forEach((control) => {
      const storedValue = storedValues[control.id]
      if (storedValue === undefined) return
      if (control instanceof HTMLInputElement && control.type === 'checkbox') control.checked = storedValue === true
      else if (typeof storedValue === 'string') control.value = storedValue
      control.dispatchEvent(new Event('input'))
      control.dispatchEvent(new Event('change'))
    })
  } catch { }
  restoringSettings = false
}

persistedSettings.forEach((control) => {
  control.addEventListener('input', saveSettings)
  control.addEventListener('change', saveSettings)
})
try {
  const storedValues = JSON.parse(localStorage.getItem(settingsStorageKey) ?? '{}') as Record<string, string | boolean>
  if (typeof storedValues['antialiasing-setting'] === 'boolean') antialiasingSetting.checked = storedValues['antialiasing-setting']
} catch { }
const scene = new THREE.Scene()
scene.background = new THREE.Color('#0b0e12')
scene.fog = new THREE.Fog('#0b0e12', 28, 600)
const domeGridRadius = 260
const domeGridSegments = 48
const domeGridRings = 18
const domeGridVertices: number[] = []
const domeGridPoint = new THREE.Vector3()
for (let ring = 0; ring <= domeGridRings; ring += 1) {
  const theta = (ring / domeGridRings) * Math.PI * 0.5
  const ringRadius = Math.sin(theta) * domeGridRadius
  const ringHeight = Math.cos(theta) * domeGridRadius
  for (let segment = 0; segment < domeGridSegments; segment += 1) {
    const nextSegment = (segment + 1) % domeGridSegments
    domeGridPoint.set(Math.cos((segment / domeGridSegments) * Math.PI * 2) * ringRadius, ringHeight, Math.sin((segment / domeGridSegments) * Math.PI * 2) * ringRadius)
    domeGridVertices.push(domeGridPoint.x, domeGridPoint.y, domeGridPoint.z)
    domeGridPoint.set(Math.cos((nextSegment / domeGridSegments) * Math.PI * 2) * ringRadius, ringHeight, Math.sin((nextSegment / domeGridSegments) * Math.PI * 2) * ringRadius)
    domeGridVertices.push(domeGridPoint.x, domeGridPoint.y, domeGridPoint.z)
  }
}
for (let segment = 0; segment < domeGridSegments; segment += 1) {
  const longitude = (segment / domeGridSegments) * Math.PI * 2
  for (let ring = 0; ring < domeGridRings; ring += 1) {
    const theta = (ring / domeGridRings) * Math.PI * 0.5
    const nextTheta = ((ring + 1) / domeGridRings) * Math.PI * 0.5
    domeGridPoint.set(Math.cos(longitude) * Math.sin(theta) * domeGridRadius, Math.cos(theta) * domeGridRadius, Math.sin(longitude) * Math.sin(theta) * domeGridRadius)
    domeGridVertices.push(domeGridPoint.x, domeGridPoint.y, domeGridPoint.z)
    domeGridPoint.set(Math.cos(longitude) * Math.sin(nextTheta) * domeGridRadius, Math.cos(nextTheta) * domeGridRadius, Math.sin(longitude) * Math.sin(nextTheta) * domeGridRadius)
    domeGridVertices.push(domeGridPoint.x, domeGridPoint.y, domeGridPoint.z)
  }
}
const domeGridGeometry = new THREE.BufferGeometry()
domeGridGeometry.setAttribute('position', new THREE.Float32BufferAttribute(domeGridVertices, 3))
const domeGrid = new THREE.LineSegments(
  domeGridGeometry,
  new THREE.LineBasicMaterial({ color: '#39ff88', transparent: true, opacity: 0.16, depthWrite: false, fog: false }),
)
domeGrid.position.y = 0
domeGrid.visible = domeGridSetting.checked
scene.add(domeGrid)
const domeGridMaterial = domeGrid.material as THREE.LineBasicMaterial
domeGridSetting.addEventListener('change', () => {
  domeGrid.visible = domeGridSetting.checked
})
domeGridColorSetting.addEventListener('input', () => {
  domeGridMaterial.color.set(domeGridColorSetting.value)
})
const physicsWorld = new RAPIER.World({ x: 0, y: -9.81, z: 0 })
physicsWorld.createCollider(RAPIER.ColliderDesc.cuboid(1000, 0.1, 1000).setTranslation(0, -0.1, 0))

const camera = new THREE.PerspectiveCamera(65, 1, 0.1, 600)
let baseFov = camera.fov
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
const akHipRotation = new THREE.Euler(0.03, 0.04, 0.02)
const adsPosition = new THREE.Vector3(0, -0.25, -0.47)
const adsRotation = new THREE.Euler(-0.07, 0, 0)
const akAdsPosition = new THREE.Vector3(0.025, -0.26, -0.54)
const akAdsRotation = new THREE.Euler(0, 0, 0)
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
let coltModel: THREE.Object3D | null = null
let ak47Model: THREE.Object3D | null = null
let currentWeaponModel: THREE.Object3D | null = null
const weaponMuzzlePositions = new Map<WeaponId, THREE.Vector3>()
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
  muzzleFlash.position.y += 0.22
  muzzleFlash.position.z -= 0.08
  pistol.visible = false
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
  muzzleFlash.position.y += 0.22
  muzzleFlash.position.z -= 0.08
  colt.visible = false
  coltModel = colt
  weaponMuzzlePositions.set('pistol', modelMuzzle.position.clone())
  currentWeaponModel = colt
  weapon.add(colt)
  applyWeaponSelection()
}, undefined, (error) => {
  console.error('Failed to load Colt 1911 model or textures.', error)
})
const ak47Loader = new FBXLoader()
const ak47ModelUrl = new URL('./assets/AK47/AK47NoSubdiv.fbx', import.meta.url).href
ak47Loader.load(ak47ModelUrl, (ak47) => {
  ak47.rotation.set(0, Math.PI, 0)
  ak47.position.set(0, 0, 0)
  ak47.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.castShadow = false
      object.frustumCulled = false
      const materials = Array.isArray(object.material) ? object.material : [object.material]
      const blackMaterials = materials.map((material) => new THREE.MeshStandardMaterial({
        color: '#090909',
        metalness: 0.76,
        roughness: 0.34,
        side: material.side,
      }))
      object.material = Array.isArray(object.material) ? blackMaterials : blackMaterials[0]
    }
  })
  ak47.updateMatrixWorld(true)
  const akBounds = new THREE.Box3().setFromObject(ak47)
  const akSize = akBounds.getSize(new THREE.Vector3())
  ak47.scale.setScalar(2.2 / Math.max(akSize.x, akSize.y, akSize.z))
  ak47.updateMatrixWorld(true)
  const scaledBounds = new THREE.Box3().setFromObject(ak47)
  ak47.position.sub(scaledBounds.getCenter(new THREE.Vector3()))
  ak47.updateMatrixWorld(true)
  const akCenteredBounds = new THREE.Box3().setFromObject(ak47)
  weaponMuzzlePositions.set('ak47', new THREE.Vector3(
    (akCenteredBounds.min.x + akCenteredBounds.max.x) * 0.5,
    (akCenteredBounds.min.y + akCenteredBounds.max.y) * 0.5,
    Math.min(akCenteredBounds.min.z, akCenteredBounds.max.z) - 0.02,
  ))
  ak47.visible = false
  ak47Model = ak47
  weapon.add(ak47)
  applyWeaponSelection()
}, undefined, (error) => {
  console.error('Failed to load AK47 model.', error)
})
weapon.scale.setScalar(0.72)
weapon.position.copy(weaponPosition)
weapon.rotation.copy(weaponRotation)
camera.add(weapon)

const muzzleLocalPosition = new THREE.Vector3()
const gunshotSounds: Record<WeaponId, HTMLAudioElement> = {
  pistol: new Audio(new URL('./assets/sounds/freesound_community-9mm-pistol-shoot-short-reverb-7152.mp3', import.meta.url).href),
  ak47: new Audio(new URL('./assets/sounds/freesound_community-ak-47-89833.mp3', import.meta.url).href),
}
let soundVolumeMultiplier = 0.5
const gunshotReady: Record<WeaponId, boolean> = { pistol: false, ak47: false }
Object.entries(gunshotSounds).forEach(([weaponId, sound]) => {
  sound.preload = 'auto'
  sound.volume = soundVolumeMultiplier
  sound.addEventListener('canplaythrough', () => {
    gunshotReady[weaponId as WeaponId] = true
  })
  sound.load()
})

function resolveWeaponForMode(mode: ShootingMode): WeaponId {
  if (weaponSelection !== 'auto') return weaponSelection
  return mode === 'strafetrack' || mode === 'spheretrack' || mode === 'fallingtrack' ? 'ak47' : 'pistol'
}

function saveCurrentWeaponProfile(): void {
  if (restoringSettings) return
  const profile = weaponProfiles[activeWeapon]
  profile.fireMode = fireModeSetting.value as WeaponProfile['fireMode']
  profile.bulletSpeed = Number(bulletSpeedSetting.value)
  profile.recoil = Number(recoilSetting.value)
  profile.spread = Number(spreadSetting.value)
  profile.movementSpread = Number(movementSpreadSetting.value)
  profile.aimingJumpSpread = Number(aimingJumpSpreadSetting.value)
  profile.hipfireJumpSpread = Number(hipfireJumpSpreadSetting.value)
  profile.bulletDrop = Number(bulletDropSetting.value)
  profile.recoilMode = recoilModeSetting.value as RecoilMode
}

function applyWeaponProfile(weaponId: WeaponId): void {
  const profile = weaponProfiles[weaponId]
  fireMode = profile.fireMode
  fireModeSetting.value = profile.fireMode
  recoilMode = profile.recoilMode
  recoilModeSetting.value = profile.recoilMode
  bulletSpeedSetting.max = '1000'
  bulletSpeedSetting.value = profile.bulletSpeed.toString()
  bulletSpeedValue.value = profile.bulletSpeed.toString()
  recoilSetting.value = profile.recoil.toString()
  recoilValue.value = `${profile.recoil}%`
  spreadSetting.value = profile.spread.toString()
  spreadValue.value = `${profile.spread}%`
  movementSpreadSetting.value = profile.movementSpread.toString()
  movementSpreadValue.value = `${profile.movementSpread}%`
  aimingJumpSpreadSetting.value = profile.aimingJumpSpread.toString()
  aimingJumpSpreadValue.value = `${profile.aimingJumpSpread}%`
  hipfireJumpSpreadSetting.value = profile.hipfireJumpSpread.toString()
  hipfireJumpSpreadValue.value = `${profile.hipfireJumpSpread}%`
  bulletDropSetting.value = profile.bulletDrop.toString()
  bulletDropValue.value = `${profile.bulletDrop}%`
  projectileVelocity = profile.bulletSpeed
  recoilMultiplier = profile.recoil / 50
  spreadMultiplier = profile.spread / 50
  movementSpreadMultiplier = profile.movementSpread / 100
  aimingJumpSpreadMultiplier = profile.aimingJumpSpread / 100
  hipfireJumpSpreadMultiplier = profile.hipfireJumpSpread / 100
  gravityMultiplier = profile.bulletDrop / 100
  updateBallisticControlState()
}

function applyWeaponSelection(): void {
  activeWeapon = resolveWeaponForMode(shootingMode)
  applyWeaponProfile(activeWeapon)
  if (activeWeapon !== 'ak47') stopAutomaticFire()
  if (coltModel) coltModel.visible = activeWeapon === 'pistol'
  if (ak47Model) ak47Model.visible = activeWeapon === 'ak47'
  currentWeaponModel = activeWeapon === 'ak47' ? ak47Model : coltModel
  const muzzlePosition = weaponMuzzlePositions.get(activeWeapon)
  if (muzzlePosition) modelMuzzle.position.copy(muzzlePosition)
  currentWeaponName.textContent = activeWeapon === 'ak47' ? 'AK47' : 'COLT 1911'
  if (aiming) setAiming(true)
  else weaponRotation.copy(activeWeapon === 'ak47' ? akHipRotation : hipRotation)
}

function playGunshot(): void {
  const gunshotSound = gunshotSounds[activeWeapon]
  if (!hitSoundEnabled || !gunshotReady[activeWeapon] || gunshotSound.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return
  const shotSound = gunshotSound.cloneNode(true) as HTMLAudioElement
  shotSound.volume = soundVolumeMultiplier
  void shotSound.play().catch((error: unknown) => {
    console.error('Gunshot audio playback failed.', error)
  })
  shotSound.addEventListener('ended', () => shotSound.remove())
}

gunshotVolumeSetting.addEventListener('input', () => {
  soundVolumeMultiplier = Number(gunshotVolumeSetting.value) / 100
  Object.values(gunshotSounds).forEach((sound) => { sound.volume = soundVolumeMultiplier })
  gunshotVolumeValue.value = `${gunshotVolumeSetting.value}%`
})

function getMuzzleWorldPosition(): THREE.Vector3 {
  return modelMuzzle.localToWorld(muzzleLocalPosition.clone())
}

let aiming = false
let recoilPitch = 0
let appliedRecoilPitch = 0
let weaponRecoilPitch = 0
let weaponRecoilVisual = 0
const recoilLocalAxis = new THREE.Vector3(1, 0, 0)
const recoilRotation = new THREE.Quaternion()
const aimingSpread = 0.004
const hipfireSpread = 0.02
let movementSpreadMultiplier = 2.25
let aimingJumpSpreadMultiplier = 5.5
let hipfireJumpSpreadMultiplier = 4.5
function getShotSpread(moving: boolean, airborne: boolean): number {
  const baseSpread = aiming ? aimingSpread : hipfireSpread
  const movementMultiplier = moving ? movementSpreadMultiplier : 1
  const jumpMultiplier = airborne ? aiming ? aimingJumpSpreadMultiplier : hipfireJumpSpreadMultiplier : 1
  return baseSpread * spreadMultiplier * movementMultiplier * jumpMultiplier
}

function getSpreadPixels(moving: boolean, airborne: boolean): number {
  const spreadAngle = getShotSpread(moving, airborne)
  const fovRadians = THREE.MathUtils.degToRad(camera.fov)
  const viewportHeight = canvas.clientHeight || 1
  return Math.tan(spreadAngle) * viewportHeight / (2 * Math.tan(fovRadians / 2))
}

function triggerMuzzleFlash(): void {
  muzzleFlash.scale.set(0.7 + Math.random() * 0.3, 0.8 + Math.random() * 0.35, 0.7 + Math.random() * 0.3)
  gsap.killTweensOf(muzzleFlash.material)
  muzzleFlash.material.opacity = 0.78
  gsap.to(muzzleFlash.material, { opacity: 0, duration: 0.07, ease: 'power2.out' })
}

function applyRecoil(): void {
  const strength = (aiming ? 0.06 : 0.048) * recoilMultiplier
  recoilPitch += strength
  weaponRecoilPitch += strength * 0.9
  triggerMuzzleFlash()
}

function setAiming(nextAiming: boolean): void {
  aiming = nextAiming
  updatePointerSensitivity()
  const position = aiming
    ? activeWeapon === 'ak47' ? akAdsPosition : adsPosition
    : hipPosition
  const rotation = aiming
    ? activeWeapon === 'ak47' ? akAdsRotation : adsRotation
    : activeWeapon === 'ak47' ? akHipRotation : hipRotation
  gsap.to(weaponPosition, { x: position.x, y: position.y, z: position.z, duration: 0.18, ease: 'power2.out' })
  gsap.to(weaponRotation, { x: rotation.x, y: rotation.y, z: rotation.z, duration: 0.18, ease: 'power2.out' })
  gsap.to(camera, { fov: aiming ? adsFov : baseFov, duration: 0.2, ease: 'power2.out', onUpdate: () => camera.updateProjectionMatrix() })
}

function updatePointerSensitivity(): void {
  const baseSensitivity = Number(settingsSensitivity.value) * dpiMultiplier
  controls.pointerSpeed = baseSensitivity * (aiming ? adsSensitivityRatio : 1)
}

function handlePointerDown(event: PointerEvent): void {
  if (event.button === 2 && controls.isLocked) setAiming(true)
  if (event.button === 0 && controls.isLocked && !aiming) {
    event.preventDefault()
    if (activeWeapon === 'ak47') startAutomaticFire()
    else fireShot()
  }
}

function handlePointerUp(event: PointerEvent): void {
  if (event.button === 2) setAiming(false)
}

function releaseAim(): void {
  if (aiming) setAiming(false)
}

const akFireInterval = 60000 / 600
let automaticFireTimer: number | null = null

function startAutomaticFire(): void {
  if (activeWeapon !== 'ak47' || automaticFireTimer !== null) return
  fireShot()
  automaticFireTimer = window.setInterval(fireShot, akFireInterval)
}

function stopAutomaticFire(): void {
  if (automaticFireTimer === null) return
  window.clearInterval(automaticFireTimer)
  automaticFireTimer = null
}

canvas.addEventListener('pointerdown', handlePointerDown)
canvas.addEventListener('mousedown', (event) => {
  if (event.button === 0 && controls.isLocked && aiming) {
    event.preventDefault()
    if (activeWeapon === 'ak47') startAutomaticFire()
    else fireShot()
  }
})
document.addEventListener('pointerup', (event) => {
  handlePointerUp(event)
  if (event.button === 0) stopAutomaticFire()
})
document.addEventListener('pointercancel', () => {
  stopAutomaticFire()
  releaseAim()
})
window.addEventListener('mouseup', (event) => {
  if (event.button === 2) releaseAim()
  if (event.button === 0) stopAutomaticFire()
})
window.addEventListener('blur', () => {
  stopAutomaticFire()
  releaseAim()
})
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    stopAutomaticFire()
    releaseAim()
  }
})
canvas.addEventListener('contextmenu', (event) => event.preventDefault())

settingsSensitivity.addEventListener('input', () => {
  settingsSensitivityValue.value = Number(settingsSensitivity.value).toFixed(2)
  updatePointerSensitivity()
})
dpiSetting.addEventListener('input', () => {
  dpiMultiplier = Number(dpiSetting.value) / 800
  dpiValue.value = dpiSetting.value
  updatePointerSensitivity()
})
adsRatioSetting.addEventListener('input', () => {
  adsSensitivityRatio = Number(adsRatioSetting.value)
  adsRatioValue.value = adsRatioSetting.value
  updatePointerSensitivity()
})
adsFovSetting.addEventListener('input', () => {
  adsFov = Number(adsFovSetting.value)
  adsFovValue.value = adsFovSetting.value
  if (aiming) {
    camera.fov = adsFov
    camera.updateProjectionMatrix()
  }
})
rawInputSetting.addEventListener('change', () => {
  rawInputEnabled = rawInputSetting.checked
})

renderDistanceSetting.addEventListener('input', () => {
  const distance = Number(renderDistanceSetting.value)
  camera.far = distance
  scene.fog = new THREE.Fog(backgroundColorSetting.value, Math.max(28, distance * 0.15), distance)
  renderDistanceValue.value = renderDistanceSetting.value
  camera.updateProjectionMatrix()
})
maxFpsSetting.addEventListener('change', () => {
  maxFps = Number(maxFpsSetting.value)
})
fireModeSetting.addEventListener('change', () => {
  fireMode = fireModeSetting.value as 'projectile' | 'hitscan'
  saveCurrentWeaponProfile()
  updateBallisticControlState()
})
recoilModeSetting.addEventListener('change', () => {
  recoilMode = recoilModeSetting.value as RecoilMode
  saveCurrentWeaponProfile()
})
weaponSetting.addEventListener('change', () => {
  weaponSelection = weaponSetting.value as 'auto' | WeaponId
  applyWeaponSelection()
})
recoilSetting.addEventListener('input', () => {
  recoilMultiplier = Number(recoilSetting.value) / 50
  recoilValue.value = `${recoilSetting.value}%`
  if (!restoringSettings) weaponProfiles[activeWeapon].recoil = Number(recoilSetting.value)
})
spreadSetting.addEventListener('input', () => {
  spreadMultiplier = Number(spreadSetting.value) / 50
  spreadValue.value = `${spreadSetting.value}%`
  if (!restoringSettings) weaponProfiles[activeWeapon].spread = Number(spreadSetting.value)
})
movementSpreadSetting.addEventListener('input', () => {
  movementSpreadMultiplier = Number(movementSpreadSetting.value) / 100
  movementSpreadValue.value = `${movementSpreadSetting.value}%`
  if (!restoringSettings) weaponProfiles[activeWeapon].movementSpread = Number(movementSpreadSetting.value)
})
aimingJumpSpreadSetting.addEventListener('input', () => {
  aimingJumpSpreadMultiplier = Number(aimingJumpSpreadSetting.value) / 100
  aimingJumpSpreadValue.value = `${aimingJumpSpreadSetting.value}%`
  if (!restoringSettings) weaponProfiles[activeWeapon].aimingJumpSpread = Number(aimingJumpSpreadSetting.value)
})
hipfireJumpSpreadSetting.addEventListener('input', () => {
  hipfireJumpSpreadMultiplier = Number(hipfireJumpSpreadSetting.value) / 100
  hipfireJumpSpreadValue.value = `${hipfireJumpSpreadSetting.value}%`
  if (!restoringSettings) weaponProfiles[activeWeapon].hipfireJumpSpread = Number(hipfireJumpSpreadSetting.value)
})
bulletDropSetting.addEventListener('input', () => {
  gravityMultiplier = Number(bulletDropSetting.value) / 100
  bulletDropValue.value = `${bulletDropSetting.value}%`
  if (!restoringSettings) weaponProfiles[activeWeapon].bulletDrop = Number(bulletDropSetting.value)
})
trackingSpeedSetting.addEventListener('input', () => {
  trackingSpeed = Number(trackingSpeedSetting.value)
  trackingSpeedValue.value = trackingSpeed.toFixed(1)
  if (shootingMode === 'strafetrack') trackingVelocity.x = strafetrackDirection * trackingSpeed
})
fallingHorizontalForceSetting.addEventListener('input', () => {
  fallingHorizontalForce = Number(fallingHorizontalForceSetting.value)
  fallingHorizontalForceValue.value = fallingHorizontalForce.toFixed(1)
})
fallingLaunchSetting.addEventListener('input', () => {
  fallingLaunchSpeed = Number(fallingLaunchSetting.value)
  fallingLaunchValue.value = fallingLaunchSpeed.toFixed(1)
})
fallingGravitySetting.addEventListener('input', () => {
  fallingGravity = Number(fallingGravitySetting.value)
  fallingGravityValue.value = fallingGravity.toFixed(1)
})
fallingRespawnDelaySetting.addEventListener('input', () => {
  fallingRespawnDelay = Number(fallingRespawnDelaySetting.value)
  fallingRespawnDelayValue.value = `${fallingRespawnDelay.toFixed(2)}s`
})
targetSizeSetting.addEventListener('input', () => {
  targetSizeMultiplier = Number(targetSizeSetting.value) / 100
  gridTargets.forEach((gridTarget) => gridTarget.scale.setScalar(targetSizeMultiplier))
  targetSizeValue.value = `${targetSizeSetting.value}%`
})
backgroundColorSetting.addEventListener('input', () => {
  scene.background = new THREE.Color(backgroundColorSetting.value)
  scene.fog = new THREE.Fog(backgroundColorSetting.value, Math.max(28, camera.far * 0.15), camera.far)
})
floorColorSetting.addEventListener('input', () => {
  floor.material.color.set(floorColorSetting.value)
})
gridColorSetting.addEventListener('input', () => {
  gridMaterials.forEach((material) => material.color.set(gridColorSetting.value))
})
targetColorSetting.addEventListener('input', () => {
  targetMaterial.color.set(targetColorSetting.value)
})
crosshairStyleSetting.addEventListener('change', () => {
  const styleClass = {
    'DOT + CROSS': 'crosshair-dot-cross',
    DOT: 'crosshair-dot',
    CROSS: 'crosshair-cross',
    CIRCLE: 'crosshair-circle',
  }[crosshairStyleSetting.value] ?? 'crosshair-dot-cross'
  crosshair.classList.remove('crosshair-dot-cross', 'crosshair-dot', 'crosshair-cross', 'crosshair-circle')
  crosshair.classList.add(styleClass)
})
crosshairColorSetting.addEventListener('input', () => {
  crosshair.style.setProperty('--crosshair-color', crosshairColorSetting.value)
})
crosshairOutlineColorSetting.addEventListener('input', () => {
  crosshair.style.setProperty('--crosshair-outline-color', crosshairOutlineColorSetting.value)
})
crosshairOutlineThicknessSetting.addEventListener('input', () => {
  crosshair.style.setProperty('--crosshair-outline-thickness', `${crosshairOutlineThicknessSetting.value}px`)
  crosshairOutlineThicknessValue.value = `${crosshairOutlineThicknessSetting.value}px`
})
crosshairGapSetting.addEventListener('input', () => {
  crosshair.style.setProperty('--crosshair-gap', `${crosshairGapSetting.value}px`)
  crosshairGapValue.value = `${crosshairGapSetting.value}px`
})
crosshairLengthSetting.addEventListener('input', () => {
  crosshair.style.setProperty('--crosshair-length', `${crosshairLengthSetting.value}px`)
  crosshairLengthValue.value = `${crosshairLengthSetting.value}px`
})
crosshairThicknessSetting.addEventListener('input', () => {
  crosshair.style.setProperty('--crosshair-thickness', `${crosshairThicknessSetting.value}px`)
  crosshairThicknessValue.value = `${crosshairThicknessSetting.value}px`
})
crosshairDotSizeSetting.addEventListener('input', () => {
  crosshair.style.setProperty('--crosshair-dot-size', `${crosshairDotSizeSetting.value}px`)
  crosshairDotSizeValue.value = `${crosshairDotSizeSetting.value}px`
})
crosshairCircleSizeSetting.addEventListener('input', () => {
  crosshair.style.setProperty('--crosshair-circle-size', `${crosshairCircleSizeSetting.value}px`)
  crosshairCircleSizeValue.value = `${crosshairCircleSizeSetting.value}px`
})
crosshairOpacitySetting.addEventListener('input', () => {
  crosshair.style.opacity = `${Number(crosshairOpacitySetting.value) / 100}`
  crosshairOpacityValue.value = `${crosshairOpacitySetting.value}%`
})
crosshairDynamicSetting.addEventListener('change', () => {
  crosshairDynamicEnabled = crosshairDynamicSetting.checked
})
crosshairDynamicStrengthSetting.addEventListener('input', () => {
  crosshairDynamicStrength = Number(crosshairDynamicStrengthSetting.value) / 100
  crosshairDynamicStrengthValue.value = `${crosshairDynamicStrengthSetting.value}%`
})
hitMarkerColorSetting.addEventListener('input', () => {
  hitMarker.style.setProperty('--hit-marker-color', hitMarkerColorSetting.value)
})
hitMarkerSizeSetting.addEventListener('input', () => {
  hitMarker.style.setProperty('--hit-marker-size', `${hitMarkerSizeSetting.value}px`)
  hitMarkerSizeValue.value = `${hitMarkerSizeSetting.value}px`
})
hitMarkerLengthSetting.addEventListener('input', () => {
  hitMarker.style.setProperty('--hit-marker-length', `${hitMarkerLengthSetting.value}px`)
  hitMarkerLengthValue.value = `${hitMarkerLengthSetting.value}px`
})
hitMarkerThicknessSetting.addEventListener('input', () => {
  hitMarker.style.setProperty('--hit-marker-thickness', `${hitMarkerThicknessSetting.value}px`)
  hitMarkerThicknessValue.value = `${hitMarkerThicknessSetting.value}px`
})
hitMarkerGapSetting.addEventListener('input', () => {
  hitMarker.style.setProperty('--hit-marker-gap', `${hitMarkerGapSetting.value}px`)
  hitMarkerGapValue.value = `${hitMarkerGapSetting.value}px`
})
hitMarkerDurationSetting.addEventListener('input', () => {
  hitMarkerDuration = Number(hitMarkerDurationSetting.value)
  hitMarkerDurationValue.value = `${hitMarkerDuration.toFixed(2)}s`
})
updateBallisticControlState()

settingsCategoryButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const category = button.dataset.category
    settingsCategoryButtons.forEach((categoryButton) => categoryButton.classList.toggle('is-active', categoryButton === button))
    settingsCategoryPanels.forEach((panel) => panel.classList.toggle('is-visible', panel.dataset.categoryPanel === category))
  })
})

fovSetting.addEventListener('input', () => {
  baseFov = Number(fovSetting.value)
  camera.fov = aiming ? adsFov : baseFov
  fovValue.value = fovSetting.value
  camera.updateProjectionMatrix()
})

resolutionScaleSetting.addEventListener('input', () => {
  resolutionScale = Number(resolutionScaleSetting.value) / 100
  resolutionScaleValue.value = `${resolutionScaleSetting.value}%`
  renderer.setPixelRatio(getRenderPixelRatio())
  resizeRenderer()
})

const keys = new Set<string>()
const movement = new THREE.Vector3()
const direction = new THREE.Vector3()
const playerHeight = 1.6
const gravity = 18
const jumpVelocity = 7
let verticalVelocity = 0

function lockPointer(): void {
  controls.lock(rawInputEnabled)
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
  if (event.code === 'Escape') {
    if (document.fullscreenElement) {
      event.preventDefault()
      void document.exitFullscreen()
      return
    }
    event.preventDefault()
    if (!settingsOverlay.classList.contains('is-open')) openMenu()
    else if (activeMenuView === 'home') closeMenu()
    else showMenuView('home')
    return
  }
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

function showMenuView(view: 'home' | 'mode' | 'settings'): void {
  activeMenuView = view
  menuHome.classList.toggle('is-visible', view === 'home')
  modeMenu.classList.toggle('is-visible', view === 'mode')
  settingsContent.classList.toggle('is-visible', view === 'settings')
}

function openMenu(): void {
  if (controls.isLocked) controls.unlock()
  showMenuView('home')
  settingsOverlay.classList.add('is-open')
  settingsOverlay.setAttribute('aria-hidden', 'false')
}

function closeMenu(): void {
  settingsOverlay.classList.remove('is-open')
  settingsOverlay.setAttribute('aria-hidden', 'true')
}

canvas.addEventListener('click', lockPointer)
settingsButton.addEventListener('click', () => {
  openMenu()
})
settingsClose.addEventListener('click', () => {
  closeMenu()
})
menuModeButton.addEventListener('click', () => showMenuView('mode'))
menuSettingsButton.addEventListener('click', () => showMenuView('settings'))
settingsOverlay.addEventListener('click', (event) => {
  if (event.target === settingsOverlay) settingsClose.click()
})
fullscreenButton.addEventListener('click', () => { void toggleFullscreen() })
document.addEventListener('fullscreenchange', updateFullscreenButton)
document.addEventListener('keydown', handleKeyDown)
document.addEventListener('keyup', handleKeyUp)
controls.addEventListener('lock', handleLockChange)
controls.addEventListener('unlock', handleLockChange)

function getRenderPixelRatio(): number {
  return Math.min(window.devicePixelRatio * resolutionScale, 5)
}

let renderer = new THREE.WebGLRenderer({ canvas, antialias: antialiasingSetting.checked, powerPreference: 'high-performance' })
renderer.setPixelRatio(getRenderPixelRatio())
renderer.shadowMap.enabled = false

let projectileVelocity = 710
bulletSpeedSetting.addEventListener('input', () => {
  projectileVelocity = Number(bulletSpeedSetting.value)
  bulletSpeedValue.value = bulletSpeedSetting.value
  if (!restoringSettings) weaponProfiles[activeWeapon].bulletSpeed = projectileVelocity
})

const weaponPreviewScene = new THREE.Scene()
weaponPreviewScene.background = new THREE.Color('#11171d')
const weaponPreviewCamera = new THREE.PerspectiveCamera(35, 1, 0.01, 10)
weaponPreviewCamera.position.set(0, 0.05, 2.2)
weaponPreviewCamera.lookAt(0, 0, 0)
weaponPreviewScene.add(new THREE.HemisphereLight('#f4f6f5', '#10151c', 2.5))
const previewKeyLight = new THREE.DirectionalLight('#ffffff', 3)
previewKeyLight.position.set(-2, 3, 2)
weaponPreviewScene.add(previewKeyLight)
const weaponPreviewGroup = new THREE.Group()
weaponPreviewScene.add(weaponPreviewGroup)
const weaponPreviewRenderer = new THREE.WebGLRenderer({ canvas: weaponPreviewCanvas, antialias: true, alpha: false })
weaponPreviewRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
let previewSourceModel: THREE.Object3D | null = null
let weaponPreviewDragging = false
let weaponPreviewLastX = 0
weaponPreviewCanvas.addEventListener('pointerdown', (event) => {
  weaponPreviewDragging = true
  weaponPreviewLastX = event.clientX
  weaponPreviewCanvas.setPointerCapture(event.pointerId)
  weaponPreviewCanvas.classList.add('is-dragging')
})
weaponPreviewCanvas.addEventListener('pointermove', (event) => {
  if (!weaponPreviewDragging) return
  const deltaX = event.clientX - weaponPreviewLastX
  weaponPreviewLastX = event.clientX
  weaponPreviewGroup.rotation.y += deltaX * 0.012
})
const stopWeaponPreviewDrag = (event: PointerEvent) => {
  weaponPreviewDragging = false
  if (weaponPreviewCanvas.hasPointerCapture(event.pointerId)) weaponPreviewCanvas.releasePointerCapture(event.pointerId)
  weaponPreviewCanvas.classList.remove('is-dragging')
}
weaponPreviewCanvas.addEventListener('pointerup', stopWeaponPreviewDrag)
weaponPreviewCanvas.addEventListener('pointercancel', stopWeaponPreviewDrag)
weaponPreviewRenderer.setAnimationLoop(() => {
  const width = weaponPreviewCanvas.clientWidth
  const height = weaponPreviewCanvas.clientHeight
  if (width && height) {
    weaponPreviewRenderer.setSize(width, height, false)
    weaponPreviewCamera.aspect = width / height
    weaponPreviewCamera.updateProjectionMatrix()
    if (currentWeaponModel !== previewSourceModel) {
      weaponPreviewGroup.clear()
      previewSourceModel = currentWeaponModel
      if (previewSourceModel) {
        const previewModel = previewSourceModel.clone(true)
        previewModel.visible = true
        previewModel.updateMatrixWorld(true)
        const centeredBounds = new THREE.Box3().setFromObject(previewModel)
        previewModel.position.sub(centeredBounds.getCenter(new THREE.Vector3()))
        weaponPreviewGroup.add(previewModel)
      }
    }
    if (!weaponPreviewDragging) weaponPreviewGroup.rotation.y += 0.008
    weaponPreviewRenderer.render(weaponPreviewScene, weaponPreviewCamera)
  }
})

scene.add(new THREE.HemisphereLight('#d9e6ff', '#10151c', 2.4))
const keyLight = new THREE.DirectionalLight('#fff4df', 3)
keyLight.position.set(-4, 7, 4)
keyLight.castShadow = true
scene.add(keyLight)

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(3000, 3000),
  new THREE.MeshStandardMaterial({ color: '#171d24', roughness: 0.9 }),
)
floor.rotation.x = -Math.PI / 2
floor.receiveShadow = true
scene.add(floor)

const grid = new THREE.GridHelper(3000, 600, '#33404a', '#1d252d')
grid.position.y = 0.01
scene.add(grid)
const gridMaterials = (Array.isArray(grid.material) ? grid.material : [grid.material]) as THREE.LineBasicMaterial[]
const floorTileSize = 1500
const floorTilePosition = new THREE.Vector3()

function updateInfiniteFloor(): void {
  floorTilePosition.set(
    Math.floor(camera.position.x / floorTileSize + 0.5) * floorTileSize,
    0,
    Math.floor(camera.position.z / floorTileSize + 0.5) * floorTileSize,
  )
  floor.position.x = floorTilePosition.x
  floor.position.z = floorTilePosition.z
  grid.position.x = floorTilePosition.x
  grid.position.z = floorTilePosition.z
  domeGrid.position.x = camera.position.x
  domeGrid.position.z = camera.position.z
}

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
const trackingCenter = new THREE.Vector3()
const trackingVelocity = new THREE.Vector3()
const fallingVelocity = new THREE.Vector3()
let strafetrackDirection = 1
let strafetrackSwitchAt = 0
let fallingRespawnAt = 0
const trackingBounds = { x: 4.2, y: 0, z: 0 }
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
let reflexRespawnCall: gsap.core.Tween | null = null
let reflexHideCall: gsap.core.Tween | null = null
let reflexRespawnAt = 0
let reflexHideAt = 0
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

function getRandomVisibleTargetPosition(distanceMin = 14, distanceRange = 22, spread = 1): THREE.Vector3 {
  camera.updateMatrixWorld()
  camera.getWorldPosition(targetSpawnPosition)
  camera.getWorldDirection(targetSpawnForward)
  targetSpawnRight.setFromMatrixColumn(camera.matrixWorld, 0).normalize()
  targetSpawnUp.setFromMatrixColumn(camera.matrixWorld, 1).normalize()

  const distance = distanceMin + Math.random() * distanceRange
  const halfHeight = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * distance
  const halfWidth = halfHeight * camera.aspect
  const horizontalMargin = Math.min(2.4, halfWidth * 0.65)
  const verticalMargin = Math.min(1.3, halfHeight * 0.65)
  const horizontalOffset = (Math.random() * 2 - 1) * Math.max(0, halfWidth - horizontalMargin) * spread
  const verticalOffset = (Math.random() * 2 - 1) * Math.max(0, halfHeight - verticalMargin) * spread

  targetSpawnPosition
    .addScaledVector(targetSpawnForward, distance)
    .addScaledVector(targetSpawnRight, horizontalOffset)
    .addScaledVector(targetSpawnUp, verticalOffset)
  targetSpawnPosition.y = THREE.MathUtils.clamp(targetSpawnPosition.y, targetRadius + 0.15 + 0.55, 5.5)
  return targetSpawnPosition.clone()
}

function clearReflexTimers(): void {
  reflexRespawnCall?.kill()
  reflexHideCall?.kill()
  reflexRespawnCall = null
  reflexHideCall = null
}

function scheduleReflexTarget(position: THREE.Vector3): void {
  clearReflexTimers()
  target.position.copy(position)
  target.visible = false
  reflexRespawnAt = clock.getElapsedTime() + 0.5 + Math.random() * 1.5
  reflexHideAt = 0
}

function updateReflexTarget(elapsed: number): void {
  if (target.visible && elapsed >= reflexHideAt) {
    scheduleReflexTarget(getRandomVisibleTargetPosition(16, 12, 0.58))
    return
  }
  if (!target.visible && elapsed >= reflexRespawnAt) {
    target.visible = true
    reflexHideAt = elapsed + 0.5
  }
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

function resetTrackingTarget(mode: ShootingMode): void {
  camera.getWorldDirection(targetSpawnForward)
  camera.getWorldPosition(trackingCenter)
  trackingCenter.addScaledVector(targetSpawnForward, mode === 'fallingtrack' ? 15 : 18)
  trackingCenter.y = mode === 'fallingtrack' ? 5.8 : targetRadius + 0.15
  if (mode === 'fallingtrack') {
    target.visible = true
    target.position.set(
      trackingCenter.x + (Math.random() - 0.5) * 2.2,
      trackingCenter.y + Math.random() * 1.8,
      trackingCenter.z + (Math.random() - 0.5) * 2.2,
    )
    fallingVelocity.set((Math.random() - 0.5) * fallingHorizontalForce, fallingLaunchSpeed, (Math.random() - 0.5) * fallingHorizontalForce)
    return
  }
  target.position.copy(trackingCenter)
  strafetrackDirection = Math.random() > 0.5 ? 1 : -1
  strafetrackSwitchAt = clock.getElapsedTime() + 0.35 + Math.random() * 1.4
  trackingVelocity.set(strafetrackDirection * trackingSpeed, 0, 0)
}

function updateTrackingTarget(delta: number, elapsed: number): void {
  if (shootingMode === 'strafetrack') {
    if (elapsed >= strafetrackSwitchAt) {
      strafetrackDirection *= -1
      strafetrackSwitchAt = elapsed + 0.35 + Math.random() * 1.4
      trackingVelocity.x = strafetrackDirection * trackingSpeed
    }
    target.position.x += trackingVelocity.x * delta
    if (Math.abs(target.position.x - trackingCenter.x) > trackingBounds.x) trackingVelocity.x *= -1
    target.position.y = trackingCenter.y
    target.position.z = trackingCenter.z
    target.lookAt(camera.position)
    return
  }
  if (shootingMode === 'spheretrack') {
    const orbitTime = elapsed * 1.35
    target.position.set(
      trackingCenter.x + Math.sin(orbitTime * 1.17) * 3.2 + Math.sin(orbitTime * 2.3) * 0.8,
      trackingCenter.y + Math.sin(orbitTime * 0.83) * 1.8 + Math.cos(orbitTime * 1.9) * 0.65,
      trackingCenter.z + Math.cos(orbitTime * 1.07) * 2.4 + Math.sin(orbitTime * 1.73) * 0.7,
    )
    target.lookAt(camera.position)
    return
  }
  if (shootingMode === 'fallingtrack') {
    if (!target.visible) {
      if (elapsed >= fallingRespawnAt) resetTrackingTarget('fallingtrack')
      return
    }
    fallingVelocity.y -= fallingGravity * delta
    target.position.addScaledVector(fallingVelocity, delta)
    if (target.position.y <= -targetRadius) {
      target.visible = false
      fallingRespawnAt = elapsed + fallingRespawnDelay
    }
  }
}

function setShootingMode(nextMode: ShootingMode): void {
  shootingMode = nextMode
  applyWeaponSelection()
  clearReflexTimers()
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
  if (nextMode === 'reflexshot') {
    scheduleReflexTarget(getRandomVisibleTargetPosition(16, 12, 0.58))
    return
  }
  if (nextMode === 'strafetrack' || nextMode === 'spheretrack' || nextMode === 'fallingtrack') {
    resetTrackingTarget(nextMode)
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
  button.addEventListener('click', () => {
    setShootingMode(button.dataset.mode as ShootingMode)
    closeMenu()
    controls.lock(rawInputEnabled)
  })
})

modeCategoryButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const category = button.dataset.modeCategory
    modeCategoryButtons.forEach((categoryButton) => categoryButton.classList.toggle('is-active', categoryButton === button))
    modeCategoryPanels.forEach((panel) => panel.classList.toggle('is-visible', panel.dataset.modePanel === category))
  })
})

rebuildTargetPath(target.position)

function updateTargetMovement(elapsed: number): void {
  if (shootingMode === 'gridshot' || shootingMode === 'reflexshot' || shootingMode === 'strafetrack' || shootingMode === 'spheretrack' || shootingMode === 'fallingtrack') return
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
const projectileLifetime = 3

function spawnProjectile(direction: THREE.Vector3): void {
  shotOrigin.copy(getMuzzleWorldPosition())
  const muzzleVelocity = activeWeapon === 'ak47' ? 710 : projectileVelocity
  const bodyDescription = RAPIER.RigidBodyDesc.dynamic()
    .setTranslation(shotOrigin.x, shotOrigin.y, shotOrigin.z)
    .setLinvel(direction.x * muzzleVelocity, direction.y * muzzleVelocity, direction.z * muzzleVelocity)
    .setCcdEnabled(true)
  const body = physicsWorld.createRigidBody(bodyDescription)
  body.setGravityScale(gravityMultiplier, true)
  physicsWorld.createCollider(RAPIER.ColliderDesc.ball(projectileRadius).setDensity(1).setRestitution(0), body)
  const mesh = new THREE.Mesh(projectileGeometry, projectileMaterial)
  mesh.position.copy(shotOrigin)
  scene.add(mesh)
  const now = performance.now() / 1000
  projectiles.push({ body, mesh, bornAt: now, lastTrailAt: now, previousPosition: shotOrigin.clone() })
}

function updateProjectiles(now: number, delta: number): void {
  camera.getWorldPosition(cameraOrigin)
  physicsWorld.timestep = delta
  physicsWorld.step()
  for (let index = projectiles.length - 1; index >= 0; index -= 1) {
    const projectile = projectiles[index]
    const translation = projectile.body.translation()
    projectile.mesh.position.set(translation.x, translation.y, translation.z)
    if (projectile.mesh.position.distanceToSquared(cameraOrigin) > camera.far ** 2) {
      physicsWorld.removeRigidBody(projectile.body)
      scene.remove(projectile.mesh)
      projectiles.splice(index, 1)
      continue
    }
    if (now - projectile.lastTrailAt > 0.045) {
      createTracer(projectile.mesh.position)
      projectile.lastTrailAt = now
    }
    const projectilePosition = projectile.mesh.position
    const sweptPath = new THREE.Line3(projectile.previousPosition, projectilePosition)
    const hitTarget = gridTargets.find((candidate, targetIndex) => {
      if (!candidate.visible) return false
      const hitRadius = targetRadius * targetSizeMultiplier + projectileRadius
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
    if (hitFloor) createImpactSpark(projectilePosition)
    if (hitTarget || hitFloor || now - projectile.bornAt > projectileLifetime) {
      physicsWorld.removeRigidBody(projectile.body)
      scene.remove(projectile.mesh)
      projectiles.splice(index, 1)
    }
  }
}

const shotDirection = new THREE.Vector3()
const shotRaycaster = new THREE.Raycaster()
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
  if (hitVfxEnabled) {
    gsap.killTweensOf(hitMarker)
    gsap.fromTo(hitMarker, { opacity: 1, scale: 0.82 }, { opacity: 0, scale: 1, duration: hitMarkerDuration, ease: 'power2.out' })
  }
  if (shootingMode === 'strafetrack' || shootingMode === 'spheretrack' || shootingMode === 'fallingtrack') {
    updateAimStats()
    return
  }
  if (shootingMode === 'gridshot') {
    moveGridTargetToRandomCell(hitTarget)
  } else if (shootingMode === 'reflexshot') {
    impactOffset.copy(getRandomVisibleTargetPosition(16, 12, 0.58))
    scheduleReflexTarget(impactOffset)
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

function createImpactSpark(position: THREE.Vector3): void {
  if (!hitVfxEnabled) return
  for (let index = 0; index < 6; index += 1) {
    const spark = new THREE.Mesh(
      new THREE.SphereGeometry(0.018, 5, 5),
      new THREE.MeshBasicMaterial({ color: index % 2 === 0 ? '#ffd166' : '#ff7a45', transparent: true, opacity: 0.95, fog: false }),
    )
    const sparkMaterial = spark.material as THREE.MeshBasicMaterial
    const angle = (index / 6) * Math.PI * 2
    const distance = 0.08 + Math.random() * 0.12
    spark.position.copy(position)
    scene.add(spark)
    gsap.to(spark.position, {
      x: position.x + Math.cos(angle) * distance,
      y: position.y + 0.04 + Math.random() * 0.1,
      z: position.z + Math.sin(angle) * distance,
      duration: 0.16 + Math.random() * 0.08,
      ease: 'power2.out',
    })
    gsap.to(spark.scale, { x: 0.25, y: 0.25, z: 0.25, duration: 0.2, ease: 'power2.out' })
    gsap.to(sparkMaterial, { opacity: 0, duration: 0.2, onComplete: () => {
      scene.remove(spark)
      spark.geometry.dispose()
      sparkMaterial.dispose()
    } })
  }
}

function fireShot(): void {
  shotsFired += 1
  playGunshot()
  applyRecoil()
  shotOrigin.copy(getMuzzleWorldPosition())
  camera.getWorldPosition(cameraOrigin)
  camera.getWorldDirection(shotDirection)
  cameraRight.setFromMatrixColumn(camera.matrixWorld, 0)
  cameraUp.setFromMatrixColumn(camera.matrixWorld, 1)
  aimPoint.copy(cameraOrigin).addScaledVector(shotDirection, projectileAimDistance)
  const movingAtShot = controls.isLocked && (keys.has('KeyW') || keys.has('KeyA') || keys.has('KeyS') || keys.has('KeyD'))
  const airborneAtShot = controls.isLocked && camera.position.y > playerHeight + 0.05
  const shotSpread = getShotSpread(movingAtShot, airborneAtShot)
  const horizontalSpread = (Math.random() - 0.5) * shotSpread * projectileAimDistance
  const verticalSpread = (Math.random() - 0.5) * shotSpread * projectileAimDistance
  aimPoint.addScaledVector(cameraRight, horizontalSpread)
  aimPoint.addScaledVector(cameraUp, verticalSpread)
  shotDirection.copy(aimPoint).sub(shotOrigin).normalize()
  if (fireMode === 'hitscan') {
    shotRaycaster.set(cameraOrigin, shotDirection)
    const hit = shotRaycaster.intersectObjects(gridTargets.filter((candidate) => candidate.visible), false)[0]
    if (hit) registerTargetHit(hit.object as typeof target)
    updateAimStats()
    return
  }
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
let lastFrameAt = 0
function render(): void {
  const frameNow = performance.now()
  if (maxFps > 0 && frameNow - lastFrameAt < 1000 / maxFps) return
  lastFrameAt = frameNow
  const delta = Math.min(clock.getDelta(), 0.05)
  const elapsed = clock.getElapsedTime()
  snapshotTargetPositions()
  if (shootingMode === 'gridshot') updateGridLayout()
  if (shootingMode === 'reflexshot') updateReflexTarget(elapsed)
  if (target.visible) updateTargetMovement(elapsed)
  if (shootingMode === 'strafetrack' || shootingMode === 'spheretrack' || shootingMode === 'fallingtrack') updateTrackingTarget(delta, elapsed)
  updateProjectiles(performance.now() / 1000, delta)

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
  updateInfiniteFloor()

  const isMoving = controls.isLocked && direction.lengthSq() > 0
  const isAirborne = controls.isLocked && camera.position.y > playerHeight + 0.05
  const stationarySpreadPixels = getSpreadPixels(false, false)
  const dynamicSpreadPixels = getSpreadPixels(isMoving, isAirborne)
  const spreadPixels = crosshairDynamicEnabled
    ? stationarySpreadPixels + (dynamicSpreadPixels - stationarySpreadPixels) * crosshairDynamicStrength
    : stationarySpreadPixels
  const configuredGapScale = Number(crosshairGapSetting.value) / 14
  const crosshairGap = spreadPixels * configuredGapScale
  crosshair.style.setProperty('--crosshair-gap', `${crosshairGap}px`)
  weaponSwayFactor += ((isMoving ? 1 : 0) - weaponSwayFactor) * Math.min(1, delta * 10)
  const swayAmount = weaponSwayFactor * (aiming ? 0.003 : 0.008)
  const recoilEase = 1 - Math.exp(-38 * delta)
  const recoilPitchStep = (recoilPitch - appliedRecoilPitch) * recoilEase
  if (Math.abs(recoilPitchStep) > 0.000001) {
    recoilRotation.setFromAxisAngle(recoilLocalAxis, recoilPitchStep)
    camera.quaternion.multiply(recoilRotation).normalize()
    appliedRecoilPitch += recoilPitchStep
  }
  weaponRecoilVisual += (weaponRecoilPitch - weaponRecoilVisual) * (1 - Math.exp(-42 * delta))
  const weaponKick = weaponRecoilVisual * 0.8
  weapon.position.set(
    weaponPosition.x + Math.sin(elapsed * 4.5) * swayAmount,
    weaponPosition.y + Math.cos(elapsed * 2.25) * swayAmount * 0.65,
    weaponPosition.z + weaponKick * 0.45,
  )
  weapon.rotation.set(
    weaponRotation.x - weaponRecoilPitch * 0.8,
    weaponRotation.y,
    weaponRotation.z,
  )
  if (recoilMode === 'recover') recoilPitch *= Math.exp(-9 * delta)
  weaponRecoilPitch *= Math.exp(-16 * delta)

  renderer.render(scene, camera)
}

antialiasingSetting.addEventListener('change', () => {
  if (restoringSettings) return
  saveSettings()
  window.location.reload()
})

restoreSettings()
applyWeaponSelection()
renderer.setAnimationLoop(render)
