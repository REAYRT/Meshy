import { OBJExporter } from 'https://unpkg.com/three@0.153.0/examples/jsm/exporters/OBJExporter.js';

export function downloadOBJ(mesh)
{
    const exporter = new OBJExporter();
    const result = exporter.parse(mesh);
    saveString(result, 'led_wall.obj');
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
