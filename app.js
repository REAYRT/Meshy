//Import the Three.js module. Pick a fixed version for stability.
import * as THREE from './three.module.js';
import { calculateAngles } from './angleCalculator.js';
import { setupControls } from './controls.js';
import { ProcLedVolumeGeometry } from './procGeometry.js';
import { setupScene, scene, camera, renderer } from './sceneSetup.js';
import { update } from './update.js';
import { setupUI, settings } from './ui.js';

setupScene();
setupControls(camera, renderer.domElement);

//Create geometry + material + mesh.
const distances = [8420,8444,8510,8619,8771,8964,9190,9452,9713,9910,10043,10115,10117,10056,9930,9801,9684,9563,9447,9331,9218,9108,8995,8876,8766,8653];
const panelwidth = 600;
const angles = calculateAngles(distances, panelwidth)[0];

const testAngles = [0, 0, 0, -10, -10, -10, -10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

const ledWallGeometry = new ProcLedVolumeGeometry(angles, {x: 25, y: 9}, {x: 600, y: 337.5}, 90, {x: 0, y: 0, z: 0}); // procedural geometry
const ledMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000, wireframe: true }); // red wireframe for visibility
const ledMesh = new THREE.Mesh(ledWallGeometry, ledMaterial);
ledMesh.name = 'LedWallMesh';
ledMesh.rotation.x = -Math.PI / 2; // lay flat
scene.add(ledMesh);

ledMesh.position.x += -8416;
ledMesh.position.y += 0.0;
ledMesh.position.z += 0.0;

setupUI(ledMesh);

//Expose core objects so you can interact with them from the console or migrate functions from your other codebase into this context.
//window.app = { scene, camera, renderer, ledMesh, geometry: ledWallGeometry };

update(renderer, scene, camera, ledMesh, settings);