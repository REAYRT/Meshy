//Import the Three.js module. Pick a fixed version for stability.
import * as THREE from './three.module.js';
import { setupControls } from './controls.js';
import { ProcLedVolumeGeometry } from './procGeometry.js';
import { setupScene, scene, camera, renderer } from './sceneSetup.js';
import { update } from './update.js';
import { setupUI, settings, wallSettings } from './ui.js';
import { downloadOBJ } from './exporter.js';
import { UVOverlay } from './uvOverlay.js';

setupScene();
setupControls(camera, renderer.domElement);

let ledMesh;
let wireframe;
let uvOverlay = new UVOverlay(renderer);

function createLedWall()
{
    if (ledMesh)
    {
        scene.remove(ledMesh);
        ledMesh.geometry.dispose();
        ledMesh.material.dispose();
    }
    if (wireframe)
    {
        scene.remove(wireframe);
        wireframe.geometry.dispose();
        wireframe.material.dispose();
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
    
    // Solid color material
    const ledMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x444444,
        side: THREE.DoubleSide
    });

    ledMesh = new THREE.Mesh(ledWallGeometry, ledMaterial);
    ledMesh.name = 'LedWallMesh';
    ledMesh.rotation.x = -Math.PI / 2; // lay flat
    
    ledMesh.position.x = wallSettings.meshPosition.x;
    ledMesh.position.y = wallSettings.meshPosition.y;
    ledMesh.position.z = wallSettings.meshPosition.z;
    ledMesh.rotateOnWorldAxis(new THREE.Vector3(0,1,0), -THREE.MathUtils.degToRad(wallSettings.angles[0]));
    scene.add(ledMesh);
    
    // Create wireframe
    const wireframeGeometry = new THREE.WireframeGeometry(ledWallGeometry);
    const wireframeMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
    wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
    wireframe.rotation.x = -Math.PI / 2;
    wireframe.position.copy(ledMesh.position);
    wireframe.rotateOnWorldAxis(new THREE.Vector3(0,1,0), -THREE.MathUtils.degToRad(wallSettings.angles[0]));
    scene.add(wireframe);
    
    // Update UV overlay geometry
    uvOverlay.updateGeometry(ledWallGeometry);
}

createLedWall();
setupUI(ledMesh, createLedWall, () => downloadOBJ(ledMesh));

update(renderer, scene, camera, settings, uvOverlay);
