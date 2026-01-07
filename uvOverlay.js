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
        this.primaryUVs = null;   // Original TEXCOORD_0
        this.secondaryUVs = null; // TEXCOORD_1
        
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
        // Cache original primary/secondary UVs for labeled previews
        this.primaryUVs = geometry.attributes.uv ? geometry.attributes.uv.clone() : null;
        this.secondaryUVs = geometry.attributes.uv2 ? geometry.attributes.uv2.clone() : null;
        this.render();
    }
    
    render() {
        if (!this.geometry) return;
        
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Calculate positions for three stacked squares: Current (top), Primary (middle), Secondary (bottom)
        const x = width - this.margin - this.squareSize;
        const currentY = height - this.margin - this.squareSize * 3 - this.margin * 2;
        const primaryY = height - this.margin - this.squareSize * 2 - this.margin;
        const secondaryY = height - this.margin - this.squareSize;
        
        // Labels style
        ctx.font = '14px Arial';
        ctx.fillStyle = 'white';
        
        // Draw Current UVs (whatever is bound as TEXCOORD_0 on geometry)
        this.drawUVSpace(ctx, x, currentY, this.geometry, 'uv', 'rgba(0, 200, 255, 0.6)');
        ctx.fillText('Current UVs', x, currentY - 6);
        
        // Draw Warp UVs (original TEXCOORD_0 cached)
        if (this.primaryUVs && this.geometry.index) {
            this.drawUVBuffer(ctx, x, primaryY, this.primaryUVs, this.geometry.index, 'rgba(255, 80, 80, 0.6)');
        } else {
            this.drawEmpty(ctx, x, primaryY, 'Warp UVs not found');
        }
        ctx.fillText('Warp UVs', x, primaryY - 6);
        
        // Draw Full Volume UVs (original TEXCOORD_1 cached or live attr)
        const secondaryAttr = this.secondaryUVs || this.geometry.attributes.uv2;
        if (secondaryAttr && this.geometry.index) {
            this.drawUVBuffer(ctx, x, secondaryY, secondaryAttr, this.geometry.index, 'rgba(255, 220, 0, 0.6)');
        } else {
            this.drawEmpty(ctx, x, secondaryY, 'Full Volume UVs not found');
        }
        ctx.fillText('Full Volume UVs', x, secondaryY - 6);
    }
    
    drawUVSpace(ctx, x, y, geometry, uvAttribute, color) {
        const uvs = geometry.attributes[uvAttribute];
        const indices = geometry.index;
        
        if (!uvs || !indices) {
            console.warn(`UV overlay: ${uvAttribute} attribute not found`);
            this.drawEmpty(ctx, x, y, `${uvAttribute} not found`);
            return;
        }
        this.drawUVBuffer(ctx, x, y, uvs, indices, color);
    }

    drawUVBuffer(ctx, x, y, uvs, indices, color) {
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
            const y0 = y + (1 - v0) * size;
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

    drawEmpty(ctx, x, y, message) {
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, this.squareSize, this.squareSize);
        ctx.fillStyle = 'white';
        ctx.font = '14px Arial';
        ctx.fillText(message, x + 10, y + 20);
    }
    
    dispose() {
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
    }
}
