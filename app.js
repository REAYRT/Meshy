//Import the Three.js module. Pick a fixed version for stability.
import * as THREE from './three.module.js';
import { calculateAngles } from './angleCalculator.js';
import { setupControls } from './controls.js';
import { ProcLedVolumeGeometry } from './procGeometry.js';
import { setupScene, scene, camera, renderer } from './sceneSetup.js';
import { update } from './update.js';
import { setupUI, settings, wallSettings } from './ui.js';
import { createUVGridTexture } from './textureGenerator.js';
import { downloadOBJ } from './exporter.js';

setupScene();
setupControls(camera, renderer.domElement);

let ledMesh;

function createLedWall()
{
    if (ledMesh)
    {
        scene.remove(ledMesh);
        ledMesh.geometry.dispose();
        ledMesh.material.map.dispose();
        ledMesh.material.dispose();
    }

    const panels = { x: wallSettings.columns, y: wallSettings.rows };
    const panelDimensions = { x: wallSettings.panelWidth, y: wallSettings.panelHeight };
    
    const ledWallGeometry = new ProcLedVolumeGeometry(
        wallSettings.angles.slice(1), 
        panels, 
        panelDimensions, 
        90, 
        {x: 0, y: 0, z: 0}
    );

    const texture = createUVGridTexture(panels.x, panels.y);
    const ledMaterial = new THREE.MeshStandardMaterial({ 
        map: texture,
        color: 0xffffff,
        wireframe: false 
    });

    ledMesh = new THREE.Mesh(ledWallGeometry, ledMaterial);
    ledMesh.name = 'LedWallMesh';
    ledMesh.rotation.x = -Math.PI / 2; // lay flat
    
    ledMesh.position.x = -8416;
    ledMesh.position.y = 0;
    ledMesh.position.z = 0;
    ledMesh.rotateOnWorldAxis(new THREE.Vector3(0,1,0), -THREE.MathUtils.degToRad(wallSettings.angles[0]));
    scene.add(ledMesh);
}

createLedWall();
setupUI(ledMesh, createLedWall, () => downloadOBJ(ledMesh));

update(renderer, scene, camera, settings);
update(renderer, scene, camera, settings);