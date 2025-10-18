import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'lil-gui'

/**
 * Base
 */
// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

/**
* Textures
*/
const textureLoader = new THREE.TextureLoader()
textureLoader.crossOrigin = 'anonymous'

const cubeTextureLoader = new THREE.CubeTextureLoader()
cubeTextureLoader.crossOrigin = 'anonymous'

/**
 * Create VR-like Environment
 */
let environmentMapTexture;
try {
    environmentMapTexture = cubeTextureLoader.load([
        'https://raw.githubusercontent.com/ClideHiraji/Jagape-ITE18-Act1.10/main/static/textures/environmentMaps/3/px.jpg',
        'https://raw.githubusercontent.com/ClideHiraji/Jagape-ITE18-Act1.10/main/static/textures/environmentMaps/3/nx.jpg',
        'https://raw.githubusercontent.com/ClideHiraji/Jagape-ITE18-Act1.10/main/static/textures/environmentMaps/3/py.jpg',
        'https://raw.githubusercontent.com/ClideHiraji/Jagape-ITE18-Act1.10/main/static/textures/environmentMaps/3/ny.jpg',
        'https://raw.githubusercontent.com/ClideHiraji/Jagape-ITE18-Act1.10/main/static/textures/environmentMaps/3/pz.jpg',
        'https://raw.githubusercontent.com/ClideHiraji/Jagape-ITE18-Act1.10/main/static/textures/environmentMaps/3/nz.jpg'
    ])
    scene.background = environmentMapTexture
} catch (error) {
    console.warn('Environment map failed to load, using fallback color')
    scene.background = new THREE.Color(0x222222)
    environmentMapTexture = null
}

/**
 * Objects
 */
const material = new THREE.MeshStandardMaterial({
    metalness: 0.7,
    roughness: 0.2
})

// Only set envMap if the texture loaded successfully
if (environmentMapTexture) {
    material.envMap = environmentMapTexture
    material.envMapIntensity = 1.0
}

const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 32, 32), 
    material
)
sphere.position.x = -1.5

const plane = new THREE.Mesh(
    new THREE.BoxGeometry(1, 0, 1, 10), 
    material
)

const torus = new THREE.Mesh(
    new THREE.TorusGeometry(0.3, 0.2, 16, 32),
    material
)
torus.position.x = 1.5

scene.add(sphere, plane, torus)

// Set UV2 attributes safely
const setUV2 = (geometry) => {
    if (geometry.attributes.uv) {
        const uvArray = geometry.attributes.uv.array
        geometry.setAttribute('uv2', new THREE.BufferAttribute(uvArray, 2))
    }
}

setUV2(sphere.geometry)
setUV2(plane.geometry)
setUV2(torus.geometry)

/**
* Lights
*/
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
scene.add(ambientLight)

const pointLight = new THREE.PointLight(0xffffff, 0.5)
pointLight.position.x = 2
pointLight.position.y = 3
pointLight.position.z = 4
scene.add(pointLight)

// Add point light helper
const pointLightHelper = new THREE.PointLightHelper(pointLight, 0.2)
scene.add(pointLightHelper)

/**
* Debug
*/
const gui = new dat.GUI()

// Material folder
const materialFolder = gui.addFolder('Material')
materialFolder.add(material, 'metalness').min(0).max(1).step(0.001)
materialFolder.add(material, 'roughness').min(0).max(1).step(0.001)
if (environmentMapTexture) {
    materialFolder.add(material, 'envMapIntensity').min(0).max(3).step(0.001)
}

// Ambient Light folder
const ambientLightFolder = gui.addFolder('Ambient Light')
ambientLightFolder.add(ambientLight, 'intensity').min(0).max(2).step(0.001)
ambientLightFolder.addColor(ambientLight, 'color')

// Point Light folder
const pointLightFolder = gui.addFolder('Point Light')
pointLightFolder.add(pointLight, 'intensity').min(0).max(2).step(0.001)
pointLightFolder.addColor(pointLight, 'color')
pointLightFolder.add(pointLight.position, 'x').min(-5).max(5).step(0.1)
pointLightFolder.add(pointLight.position, 'y').min(-5).max(5).step(0.1)
pointLightFolder.add(pointLight.position, 'z').min(-5).max(5).step(0.1)

// Environment folder
const environmentFolder = gui.addFolder('Environment')
environmentFolder.addColor({ color: '#222222' }, 'color').onChange((value) => {
    if (!environmentMapTexture) {
        scene.background = new THREE.Color(value)
    }
})
environmentFolder.add({ useEnvMap: !!environmentMapTexture }, 'useEnvMap').onChange((value) => {
    if (environmentMapTexture) {
        scene.background = value ? environmentMapTexture : new THREE.Color(0x222222)
    }
})

// Open folders
materialFolder.open()
ambientLightFolder.open()
pointLightFolder.open()

window.addEventListener('resize', () =>
{
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set(0, 0, 2) 
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.rotateSpeed = 0.5

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

// Optional: Enable tone mapping for better visuals
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1

/**
 * Fullscreen mode
 */
window.addEventListener('dblclick', () =>
{
    if(!document.fullscreenElement)
    {
        canvas.requestFullscreen().catch(err => {
            console.log('Fullscreen error:', err)
        })
    }
    else
    {
        document.exitFullscreen()
    }
})

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    // Update objects
    sphere.rotation.y = 0.1 * elapsedTime
    plane.rotation.y = 0.1 * elapsedTime
    torus.rotation.y = 0.1 * elapsedTime
    
    sphere.rotation.x = 0.15 * elapsedTime
    plane.rotation.x = 0.15 * elapsedTime
    torus.rotation.x = 0.15 * elapsedTime

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    window.requestAnimationFrame(tick)
}

tick()  
