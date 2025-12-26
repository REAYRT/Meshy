import * as THREE from './three.module.js';

export const scene = new THREE.Scene();
export let camera;
export let renderer;

export function setupScene() {
    // Camera
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000000);
    camera.position.set(5000, 5000, 5000);
    camera.lookAt(-5000, 0, -5000);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Lighting
    const ambient = new THREE.AmbientLight(0x404040, 100.0);
    scene.add(ambient);

    // Grid Plane
    createGridPlane();

    // Resize handling
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

function createGridPlane() {
    const geometry = new THREE.PlaneGeometry(10000, 10000, 10, 10);
    const material = new THREE.MeshBasicMaterial({color: 0x444444, wireframe: true});
    const plane = new THREE.Mesh(geometry, material);
    plane.name = 'gridPlane';

    plane.rotation.x = -Math.PI / 2; // lay flat
    
    plane.position.x = -5000;
    plane.position.y = 0;
    plane.position.z = -5000;

    scene.add(plane);
}