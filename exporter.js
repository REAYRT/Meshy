import { OBJExporter } from 'https://unpkg.com/three@0.153.0/examples/jsm/exporters/OBJExporter.js';
import { GLTFExporter } from 'https://unpkg.com/three@0.153.0/examples/jsm/exporters/GLTFExporter.js';

// Load JSZip dynamically
let JSZip = null;
async function loadJSZip() {
    if (JSZip) return JSZip;
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/jszip@3.10.1/dist/jszip.min.js';
    document.head.appendChild(script);
    return new Promise((resolve) => {
        script.onload = () => {
            JSZip = window.JSZip;
            resolve(JSZip);
        };
    });
}

export async function downloadOBJ(mesh)
{
    if (!mesh) return;
    
    const exporter = new OBJExporter();
    
    // If mesh is a group, export each child into a zip file
    if (mesh.isGroup && mesh.children.length > 0) {
        await loadJSZip();
        const zip = new JSZip();
        
        mesh.children.forEach((child, index) => {
            const exportMesh = child.clone(true);
            // Reset transform for Unreal: position at origin, no rotation
            // Scale 0.1 to convert mm to cm (Unreal units)
            exportMesh.position.set(0, 0, 0);
            exportMesh.rotation.set(0, 0, 0);
            exportMesh.scale.set(0.1, 0.1, 0.1);
            exportMesh.updateMatrixWorld(true);
            
            const result = exporter.parse(exportMesh);
            const filename = `led_wall_section_${index}.obj`;
            zip.file(filename, result);
        });
        
        const blob = await zip.generateAsync({ type: 'blob' });
        save(blob, 'led_wall_sections.zip');
    } else {
        // Single mesh export
        const exportMesh = mesh.clone(true);
        exportMesh.position.set(0, 0, 0);
        exportMesh.rotation.set(0, 0, 0);
        exportMesh.scale.set(0.1, 0.1, 0.1);
        exportMesh.updateMatrixWorld(true);
        
        const result = exporter.parse(exportMesh);
        saveString(result, 'led_wall.obj');
    }
}

export async function downloadGLB(mesh)
{
    if (!mesh) return;
    
    const exporter = new GLTFExporter();
    
    // If mesh is a group, export each child into a zip file
    if (mesh.isGroup && mesh.children.length > 0) {
        await loadJSZip();
        const zip = new JSZip();
        
        // Use Promise.all to wait for all exports
        const exportPromises = mesh.children.map((child, index) => {
            return new Promise((resolve, reject) => {
                const exportMesh = child.clone(true);
                // Reset transform for Unreal: position at origin, no rotation
                // Scale 0.1 to convert mm to cm (Unreal units)
                exportMesh.position.set(0, 0, 0);
                exportMesh.rotation.set(0, 0, 0);
                exportMesh.scale.set(0.1, 0.1, 0.1);
                exportMesh.updateMatrixWorld(true);
                
                const filename = `led_wall_section_${index}.glb`;
                exporter.parse(
                    exportMesh,
                    function (result) {
                        zip.file(filename, result);
                        resolve();
                    },
                    function (error) {
                        console.error(`Error exporting GLB section ${index}:`, error);
                        reject(error);
                    },
                    { binary: true }
                );
            });
        });
        
        await Promise.all(exportPromises);
        const blob = await zip.generateAsync({ type: 'blob' });
        save(blob, 'led_wall_sections.zip');
    } else {
        // Single mesh export
        const exportMesh = mesh.clone(true);
        exportMesh.position.set(0, 0, 0);
        exportMesh.rotation.set(0, 0, 0);
        exportMesh.scale.set(0.1, 0.1, 0.1);
        exportMesh.updateMatrixWorld(true);
        
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
