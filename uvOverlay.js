import * as THREE from './three.module.js';

export class UVOverlay {
    constructor(renderer) {
        this.renderer = renderer;
        
        // Create a 2D canvas overlay
        this.canvas = document.createElement('canvas');
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.zIndex = '1000';
        document.body.appendChild(this.canvas);
        
        this.ctx = this.canvas.getContext('2d');
        
        // Size of each UV preview square
        this.squareSize = 200; // pixels
        this.margin = 20; // pixels from edge
        
        // Store geometry data
        this.geometry = null;
        
        // Handle window resize
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.render();
    }
    
    updateTextures(uv0Texture, uv1Texture) {
        // No longer needed but keeping for compatibility
    }
    
    updateGeometry(geometry) {
        this.geometry = geometry;
        this.render();
    }
    
    render() {
        if (!this.geometry) return;
        
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Calculate positions for UV0 (top square) and UV1 (bottom square)
        const uv0X = width - this.margin - this.squareSize;
        const uv0Y = height - this.margin - this.squareSize * 2 - this.margin;
        
        const uv1X = width - this.margin - this.squareSize;
        const uv1Y = height - this.margin - this.squareSize;
        
        // Draw UV0
        this.drawUVSpace(ctx, uv0X, uv0Y, this.geometry, 'uv', 'rgba(255, 0, 0, 0.7)');
        
        // Draw UV1
        this.drawUVSpace(ctx, uv1X, uv1Y, this.geometry, 'uv2', 'rgba(255, 255, 0, 0.7)');
    }
    
    drawUVSpace(ctx, x, y, geometry, uvAttribute, color) {
        const uvs = geometry.attributes[uvAttribute];
        const indices = geometry.index;
        
        if (!uvs || !indices) return;
        
        const size = this.squareSize;
        
        // Draw border
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, size, size);
        
        // Draw mesh triangles
        ctx.fillStyle = color;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        
        for (let i = 0; i < indices.count; i += 3) {
            const i0 = indices.array[i];
            const i1 = indices.array[i + 1];
            const i2 = indices.array[i + 2];
            
            const u0 = uvs.array[i0 * 2];
            const v0 = uvs.array[i0 * 2 + 1];
            const u1 = uvs.array[i1 * 2];
            const v1 = uvs.array[i1 * 2 + 1];
            const u2 = uvs.array[i2 * 2];
            const v2 = uvs.array[i2 * 2 + 1];
            
            // Convert UV (0-1) to canvas pixel coordinates
            const x0 = x + u0 * size;
            const y0 = y + (1 - v0) * size; // Flip V
            const x1 = x + u1 * size;
            const y1 = y + (1 - v1) * size;
            const x2 = x + u2 * size;
            const y2 = y + (1 - v2) * size;
            
            // Draw filled triangle
            ctx.beginPath();
            ctx.moveTo(x0, y0);
            ctx.lineTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }
    }
    
    dispose() {
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
    }
}
