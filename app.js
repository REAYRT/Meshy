//Import the Three.js module. Pick a fixed version for stability.
import * as THREE from './three.module.js';
import { setupControls } from './controls.js';
import { ProcLedVolumeGeometry } from './procGeometry.js';
import { setupScene, scene, camera, renderer } from './sceneSetup.js';
import { update } from './update.js';
import { setupUI, settings, wallSettings } from './ui.js';
import { downloadOBJ, downloadGLB } from './exporter.js';
import { UVOverlay } from './uvOverlay.js';

setupScene();
setupControls(camera, renderer.domElement);

let ledMesh;
let wireframe;
let uvOverlay = new UVOverlay(renderer);
let currentTexture = null;
let currentFullGeometry = null;
let currentSectionGeometries = [];

function disposeObject(obj) {
    if (!obj) return;
    if (obj.isGroup) {
        obj.children.forEach(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (child.material.map && child.material.map !== currentTexture) {
                    child.material.map.dispose();
                }
                child.material.dispose();
            }
        });
    } else {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
            if (obj.material.map && obj.material.map !== currentTexture) {
                obj.material.map.dispose();
            }
            obj.material.dispose();
        }
    }
}

function createDefaultTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    // Placeholder until REAYRT.jpg loads
    ctx.fillStyle = '#000000ff';
    ctx.fillRect(0, 0, 1, 1);
    return new THREE.CanvasTexture(canvas);
}

function loadDefaultTexture() {
    const loader = new THREE.TextureLoader();
    loader.load(
        'REAYRT.jpg',
        (tex) => {
            currentTexture = tex;
            settings.previewTexture = 'REAYRT.jpg';
            if (ledMesh) {
                if (ledMesh.isGroup) {
                    ledMesh.children.forEach(child => {
                        child.material.map = tex;
                        child.material.needsUpdate = true;
                    });
                } else {
                    ledMesh.material.map = tex;
                    ledMesh.material.needsUpdate = true;
                }
            }
        },
        undefined,
        (err) => {
            console.warn('Failed to load REAYRT.jpg; using placeholder texture.', err);
        }
    );
}

function createLedWall()
{
    if (ledMesh)
    {
        scene.remove(ledMesh);
        disposeObject(ledMesh);
    }
    if (wireframe)
    {
        scene.remove(wireframe);
        disposeObject(wireframe);
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
    currentFullGeometry = ledWallGeometry;
    currentSectionGeometries = [];
    
    // Ensure default REAYRT.jpg starts loading if needed
    if (!currentTexture && !settings.previewTexture) {
        loadDefaultTexture();
    }
    // Use current texture or placeholder
    const texture = currentTexture || createDefaultTexture();
    
    // Material with texture to mark UVs as "used"
    const baseMaterial = new THREE.MeshStandardMaterial({ 
        map: texture,
        side: THREE.DoubleSide
    });

    // Build either a single mesh or subdivided sections
    const sectionize = wallSettings.subdivide && wallSettings.sectionWidth >= 1 && wallSettings.sectionWidth < panels.x;
    if (!sectionize) {
        const ledMaterial = baseMaterial.clone();
        ledMesh = new THREE.Mesh(ledWallGeometry, ledMaterial);
        ledMesh.name = 'LedWallMesh';
        ledMesh.rotation.x = -Math.PI / 2; // lay flat
        ledMesh.position.x = wallSettings.meshPosition.x;
        ledMesh.position.y = wallSettings.meshPosition.y;
        ledMesh.position.z = wallSettings.meshPosition.z;
        ledMesh.rotateOnWorldAxis(new THREE.Vector3(0,1,0), -THREE.MathUtils.degToRad(wallSettings.angles[0]));
        scene.add(ledMesh);
    } else {
        // Create a group and slice geometry into sections with local warp UVs
        const group = new THREE.Group();
        group.name = 'LedWallGroup';
        const maxCols = panels.x;
        const sectionWidth = Math.max(1, Math.min(wallSettings.sectionWidth, maxCols));
        const rowsPlus = panels.y + 1;

        const posAttr = ledWallGeometry.attributes.position;
        const uv2Attr = ledWallGeometry.attributes.uv2;

        for (let startCol = 0; startCol < maxCols; startCol += sectionWidth) {
            const endColExclusive = Math.min(startCol + sectionWidth, maxCols);
            const W = endColExclusive - startCol;

            const positions = [];
            const uvLocal = [];
            const uv2s = [];
            const indices = [];

            // Collect vertices for (W+1) x (rows+1)
            for (let iLocal = 0; iLocal <= W; iLocal++) {
                const iGlobal = startCol + iLocal;
                for (let j = 0; j <= panels.y; j++) {
                    const origIndex = iGlobal * rowsPlus + j;
                    const px = posAttr.array[origIndex * 3 + 0];
                    const py = posAttr.array[origIndex * 3 + 1];
                    const pz = posAttr.array[origIndex * 3 + 2];
                    positions.push(px, py, pz);

                    const u2 = uv2Attr.array[origIndex * 2 + 0];
                    const v2 = uv2Attr.array[origIndex * 2 + 1];
                    uv2s.push(u2, v2);

                    const U = W > 0 ? (iLocal / W) : 0;
                    const V = panels.y > 0 ? (j / panels.y) : 0;
                    uvLocal.push(U, V);
                }
            }

            // Build indices for local grid
            for (let iLocal = 0; iLocal < W; iLocal++) {
                for (let j = 0; j < panels.y; j++) {
                    const topLeft = iLocal * rowsPlus + j;
                    const topRight = (iLocal + 1) * rowsPlus + j;
                    const bottomLeft = iLocal * rowsPlus + (j + 1);
                    const bottomRight = (iLocal + 1) * rowsPlus + (j + 1);
                    indices.push(topLeft, topRight, bottomLeft);
                    indices.push(topRight, bottomRight, bottomLeft);
                }
            }

            const geom = new THREE.BufferGeometry();
            geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
            geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvLocal, 2));
            geom.setAttribute('uv2', new THREE.Float32BufferAttribute(uv2s, 2));
            geom.setIndex(indices);
            geom.computeVertexNormals();
            // Store original UV0 for preview toggling
            geom.userData.originalUV = geom.attributes.uv.clone();

            const mat = baseMaterial.clone();
            currentSectionGeometries.push(geom);

            const mesh = new THREE.Mesh(geom, mat);
            mesh.name = `LedWallSection_${startCol}_${endColExclusive - 1}`;
            mesh.rotation.x = -Math.PI / 2; // lay flat
            mesh.position.x = wallSettings.meshPosition.x;
            mesh.position.y = wallSettings.meshPosition.y;
            mesh.position.z = wallSettings.meshPosition.z;
            mesh.rotateOnWorldAxis(new THREE.Vector3(0,1,0), -THREE.MathUtils.degToRad(wallSettings.angles[0]));

            group.add(mesh);
        }

        ledMesh = group;
        scene.add(ledMesh);
    }
    
    // Create wireframe(s)
    const wireframeMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
    if (ledMesh.isGroup) {
        const wfGroup = new THREE.Group();
        ledMesh.children.forEach((child, index) => {
            const wfGeom = new THREE.WireframeGeometry(child.geometry);
            const wfMaterial = new THREE.LineBasicMaterial({ color: index % 2 === 0 ? 0x00ff00 : 0xff0000 });
            const wf = new THREE.LineSegments(wfGeom, wfMaterial);
            wf.rotation.copy(child.rotation);
            wf.position.copy(child.position);
            wfGroup.add(wf);
        });
        wireframe = wfGroup;
        scene.add(wireframe);
    } else {
        const wireframeGeometry = new THREE.WireframeGeometry(ledWallGeometry);
        wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
        wireframe.rotation.x = -Math.PI / 2;
        wireframe.position.copy(ledMesh.position);
        wireframe.rotateOnWorldAxis(new THREE.Vector3(0,1,0), -THREE.MathUtils.degToRad(wallSettings.angles[0]));
        scene.add(wireframe);
    }
    
    // Update UV overlay geometry source before any preview UV swapping
    setOverlaySource();

    // After overlay caches UVs, apply preview channel selection to viewport meshes
    applyPreviewChannelToMeshes();
}

function setOverlaySource() {
    const idx = settings.selectedSectionIndex;
    if (ledMesh && ledMesh.isGroup && Array.isArray(currentSectionGeometries) && idx >= 0 && idx < currentSectionGeometries.length) {
        uvOverlay.updateGeometry(currentSectionGeometries[idx]);
    } else {
        uvOverlay.updateGeometry(currentFullGeometry);
    }
}

function applyPreviewChannelToMeshes() {
    const channel = settings.previewUVChannel;
    const applyToGeometry = (geometry) => {
        if (channel === 1 && geometry.attributes.uv2) {
            if (!geometry.userData.originalUV) {
                geometry.userData.originalUV = geometry.attributes.uv.clone();
            }
            geometry.setAttribute('uv', geometry.attributes.uv2.clone());
        } else if (channel === 0 && geometry.userData.originalUV) {
            geometry.setAttribute('uv', geometry.userData.originalUV.clone());
        }
        if (geometry.attributes.uv) geometry.attributes.uv.needsUpdate = true;
    };
    if (ledMesh) {
        if (ledMesh.isGroup) {
            ledMesh.children.forEach(child => applyToGeometry(child.geometry));
        } else {
            applyToGeometry(ledMesh.geometry);
        }
    }
}

function updateUVChannel(channel) {
    settings.previewUVChannel = channel;
    applyPreviewChannelToMeshes();
}

function updateSelectedSectionIndex(idx) {
    settings.selectedSectionIndex = Number(idx);
    setOverlaySource();
}

createLedWall();
setupUI(ledMesh, {
    rebuild: createLedWall,
    updateUVChannel: updateUVChannel,
    updateSelectedSectionIndex: updateSelectedSectionIndex
}, {
    obj: () => downloadOBJ(ledMesh),
    glb: () => downloadGLB(ledMesh)
});

update(renderer, scene, camera, settings, uvOverlay);
