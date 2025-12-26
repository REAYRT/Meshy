import * as THREE from './three.module.js';
import { updateControls } from './controls.js';

export function update(renderer, scene, camera, settings, uvOverlay) {
    requestAnimationFrame(() => update(renderer, scene, camera, settings, uvOverlay));

    if (settings && settings.autoRotate) {
        // Rotate camera around (-5000, 0, -5000)
        const target = new THREE.Vector3(-5000, 0, -5000);
        const speed = settings.animationSpeed;
        camera.position.sub(target);
        camera.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), speed);
        camera.position.add(target);
        camera.lookAt(target);
    } else {
        // Fly camera controls
        updateControls(camera);
    }

    renderer.render(scene, camera);
    
    // Render UV overlay on top
    if (uvOverlay) {
        uvOverlay.render();
    }
}
