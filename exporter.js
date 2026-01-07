import * as THREE from './three.module.js';
import { OBJExporter } from 'https://unpkg.com/three@0.153.0/examples/jsm/exporters/OBJExporter.js';
import { GLTFExporter } from 'https://unpkg.com/three@0.153.0/examples/jsm/exporters/GLTFExporter.js';

export function downloadOBJ(mesh)
{
    if (!mesh) return;
    
    // Clone for export to avoid modifying scene
    const exportMesh = mesh.clone(true);
    
    // Convert from Three.js (Y-up) to Unreal Engine (Z-up)
    // Rotate 90 degrees around X to convert Y-up to Z-up
    exportMesh.rotation.set(Math.PI / 2, 0, 0);
    exportMesh.updateMatrixWorld(true);

    const exporter = new OBJExporter();
    const result = exporter.parse(exportMesh);
    saveString(result, 'led_wall.obj');
}

export function downloadGLB(mesh)
{
    if (!mesh) return;
    
    // Clone for export to avoid modifying scene
    const exportMesh = mesh.clone(true);
    
    // Convert from Three.js (Y-up) to Unreal Engine (Z-up)
    // Rotate 90 degrees around X to convert Y-up to Z-up
    exportMesh.rotation.set(Math.PI / 2, 0, 0);
    exportMesh.updateMatrixWorld(true);
    
    const exporter = new GLTFExporter();
    exporter.parse(
        exportMesh,
        function (result) {
            save(new Blob([result], { type: 'application/octet-stream' }), 'led_wall.glb');
        },
        function (error) {
            console.error('Error exporting GLB:', error);
        },
        { binary: true }
    );
}

function saveString(text, filename)
{
    save(new Blob([text], { type: 'text/plain' }), filename);
}

function save(blob, filename)
{
    const link = document.createElement('a');
    link.style.display = 'none';
    document.body.appendChild(link);
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    document.body.removeChild(link);
}
