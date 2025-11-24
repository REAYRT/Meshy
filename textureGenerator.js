import * as THREE from './three.module.js';

export function createUVGridTexture(columns = 10, rows = 10) {
    const size = 2048;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');
    
    // Fill background
    context.fillStyle = '#000000ff';
    context.fillRect(0, 0, size, size);
    
    context.lineWidth = 1;
    context.strokeStyle = '#ffffffff';
    context.font = '100px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    
    // Draw vertical lines (columns)
    const stepSizeX = size / columns;
    for (let i = 0; i <= columns; i++) {
        const pos = i * stepSizeX;
        context.beginPath();
        context.moveTo(pos, 0);
        context.lineTo(pos, size);
        context.stroke();
    }

    // Draw horizontal lines (rows)
    const stepSizeY = size / rows;
    for (let i = 0; i <= rows; i++) {
        const pos = i * stepSizeY;
        context.beginPath();
        context.moveTo(0, pos);
        context.lineTo(size, pos);
        context.stroke();
    }

    // Add text
    context.fillStyle = '#ff0000ff';
    context.fillText('UV (0,0)', 250, size - 250);
    context.fillText('UV (1,1)', size - 250, 250);
    context.fillText('UV (0,1)', 250, 250);
    context.fillText('UV (1,0)', size - 250, size - 250);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}
