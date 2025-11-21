import * as THREE from './three.module.js';

const keys = {};
let mouseLookEnabled = false;
const mouse = { x: 0, y: 0 };

export function setupControls(camera, domElement) {
    window.addEventListener('keydown', (e) => {keys[e.code] = true;});
    window.addEventListener('keyup', (e) => {keys[e.code] = false;});
    
    domElement.addEventListener('mousedown', (e) => {
        if (e.button === 2)
        {
            mouseLookEnabled = true;
            e.preventDefault();
        }
    });

    domElement.addEventListener('mouseup', (e) => {
        if (e.button === 2) {
            mouseLookEnabled = false;
        }
    });

    domElement.addEventListener('mousemove', (e) => {
        if (mouseLookEnabled) {
            mouse.x = e.movementX || 0;
            mouse.y = e.movementY || 0;
        }
    });

    domElement.addEventListener('wheel', (e) => {
        e.preventDefault();
        const zoomSpeed = 0.01;
        camera.translateZ(e.deltaY * zoomSpeed);
    });

    domElement.addEventListener('contextmenu', (e) => {
        e.preventDefault(); // Prevent context menu on right-click
    });
}

export function updateControls(camera) {
    const speed = 100;
    const sensitivity = 0.01;

    if (keys.KeyW) camera.translateZ(-speed);
    if (keys.KeyS) camera.translateZ(speed);
    if (keys.KeyA) camera.translateX(-speed);
    if (keys.KeyD) camera.translateX(speed);
    if (keys.KeyQ) camera.translateY(speed);
    if (keys.KeyE) camera.translateY(-speed);

    if (mouse.x !== 0 || mouse.y !== 0) {
        const euler = new THREE.Euler(0, 0, 0, 'YXZ');
        euler.setFromQuaternion(camera.quaternion);
        
        let yaw = euler.y;
        let pitch = euler.x;

        yaw -= mouse.x * sensitivity;
        pitch -= mouse.y * sensitivity;
        pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));
        camera.quaternion.setFromEuler(new THREE.Euler(pitch, yaw, 0, 'YXZ'));

        mouse.x = 0;
        mouse.y = 0;
    }
}
