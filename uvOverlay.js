import * as THREE from './three.module.js';

export class UVOverlay {
    constructor(renderer) {
        this.renderer = renderer;
        
        // Create orthographic camera for screen-space rendering
        this.overlayCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        this.overlayScene = new THREE.Scene();
        
        // Size of each UV preview square
        this.squareSize = 200; // pixels
        this.margin = 20; // pixels from edge
        
        // Create materials for UV0 and UV1
        this.uv0Material = new THREE.MeshBasicMaterial({ 
            color: 0xffffff,
            side: THREE.DoubleSide 
        });
        this.uv1Material = new THREE.MeshBasicMaterial({ 
            color: 0xffffff,
            side: THREE.DoubleSide 
        });
        
        // Create plane geometry for the squares
        const planeGeometry = new THREE.PlaneGeometry(2, 2);
        
        // Create meshes
        this.uv0Mesh = new THREE.Mesh(planeGeometry, this.uv0Material);
        this.uv1Mesh = new THREE.Mesh(planeGeometry, this.uv1Material);
        
        this.overlayScene.add(this.uv0Mesh);
        this.overlayScene.add(this.uv1Mesh);
        
        // Create wireframe materials for visualizing UV coordinates
        this.uv0WireMaterial = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 2 });
        this.uv1WireMaterial = new THREE.LineBasicMaterial({ color: 0xffff00, linewidth: 2 });
        
        // Wireframe objects (will be created when geometry is updated)
        this.uv0Wireframe = null;
        this.uv1Wireframe = null;
        
        this.updatePositions();
        
        // Handle window resize
        window.addEventListener('resize', () => this.updatePositions());
    }
    
    updatePositions() {
        const width = this.renderer.domElement.width;
        const height = this.renderer.domElement.height;
        
        // Convert pixel positions to normalized device coordinates (-1 to 1)
        const squareSizeNDC = (this.squareSize / width) * 2;
        const marginNDC = (this.margin / width) * 2;
        const squareSizeNDCHeight = (this.squareSize / height) * 2;
        const marginNDCHeight = (this.margin / height) * 2;
        
        // Position UV0 (top square) - bottom right corner
        const uv0X = 1 - marginNDC - squareSizeNDC / 2;
        const uv0Y = -1 + marginNDCHeight + squareSizeNDCHeight / 2 + squareSizeNDCHeight + marginNDCHeight; // Bottom + margin + height + gap
        
        // Position UV1 (bottom square) - bottom right corner
        const uv1X = 1 - marginNDC - squareSizeNDC / 2;
        const uv1Y = -1 + marginNDCHeight + squareSizeNDCHeight / 2;
        
        this.uv0Mesh.position.set(uv0X, uv0Y, 0);
        this.uv0Mesh.scale.set(squareSizeNDC / 2, squareSizeNDCHeight / 2, 1);
        
        this.uv1Mesh.position.set(uv1X, uv1Y, 0);
        this.uv1Mesh.scale.set(squareSizeNDC / 2, squareSizeNDCHeight / 2, 1);
        
        // Update wireframe positions as well
        this.updateWireframePositions();
    }
    
    updateTextures(uv0Texture, uv1Texture) {
        if (uv0Texture) {
            this.uv0Material.map = uv0Texture;
            this.uv0Material.needsUpdate = true;
        }
        if (uv1Texture) {
            this.uv1Material.map = uv1Texture;
            this.uv1Material.needsUpdate = true;
        }
    }
    
    updateGeometry(geometry) {
        // Remove old wireframes
        if (this.uv0Wireframe) {
            this.overlayScene.remove(this.uv0Wireframe);
            this.uv0Wireframe.geometry.dispose();
        }
        if (this.uv1Wireframe) {
            this.overlayScene.remove(this.uv1Wireframe);
            this.uv1Wireframe.geometry.dispose();
        }
        
        // Create UV0 wireframe
        const uv0Geometry = this.createUVWireframe(geometry, 'uv');
        this.uv0Wireframe = new THREE.LineSegments(uv0Geometry, this.uv0WireMaterial);
        this.overlayScene.add(this.uv0Wireframe);
        
        // Create UV1 wireframe
        const uv1Geometry = this.createUVWireframe(geometry, 'uv2');
        this.uv1Wireframe = new THREE.LineSegments(uv1Geometry, this.uv1WireMaterial);
        this.overlayScene.add(this.uv1Wireframe);
        
        // Update positions to match the texture planes
        this.updateWireframePositions();
    }
    
    createUVWireframe(geometry, uvAttribute) {
        const uvs = geometry.attributes[uvAttribute];
        const indices = geometry.index;
        
        if (!uvs) return new THREE.BufferGeometry();
        
        const positions = [];
        
        // Create lines for each triangle edge
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
            
            // Keep UV coords in 0-1 space, then center them around origin (-0.5 to 0.5)
            // This allows proper scaling later
            const x0 = u0 - 0.5;
            const y0 = v0 - 0.5;
            const x1 = u1 - 0.5;
            const y1 = v1 - 0.5;
            const x2 = u2 - 0.5;
            const y2 = v2 - 0.5;
            
            // Three edges of the triangle
            positions.push(x0, y0, 0, x1, y1, 0);
            positions.push(x1, y1, 0, x2, y2, 0);
            positions.push(x2, y2, 0, x0, y0, 0);
        }
        
        const wireGeometry = new THREE.BufferGeometry();
        wireGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        
        return wireGeometry;
    }
    
    updateWireframePositions() {
        if (!this.uv0Wireframe || !this.uv1Wireframe) return;
        
        const width = this.renderer.domElement.width;
        const height = this.renderer.domElement.height;
        
        const squareSizeNDC = (this.squareSize / width) * 2;
        const marginNDC = (this.margin / width) * 2;
        const squareSizeNDCHeight = (this.squareSize / height) * 2;
        const marginNDCHeight = (this.margin / height) * 2;
        
        // Position UV0 wireframe (top square)
        const uv0X = 1 - marginNDC - squareSizeNDC / 2;
        const uv0Y = -1 + marginNDCHeight + squareSizeNDCHeight / 2 + squareSizeNDCHeight + marginNDCHeight;
        
        this.uv0Wireframe.position.set(uv0X, uv0Y, 0.001);
        // Scale by 2x the texture plane scale since wireframe is in -0.5 to 0.5 space
        this.uv0Wireframe.scale.set(squareSizeNDC, squareSizeNDCHeight, 1);
        
        // Position UV1 wireframe (bottom square)
        const uv1X = 1 - marginNDC - squareSizeNDC / 2;
        const uv1Y = -1 + marginNDCHeight + squareSizeNDCHeight / 2;
        
        this.uv1Wireframe.position.set(uv1X, uv1Y, 0.001);
        // Scale by 2x the texture plane scale since wireframe is in -0.5 to 0.5 space
        this.uv1Wireframe.scale.set(squareSizeNDC, squareSizeNDCHeight, 1);
    }
    
    render() {
        // Save current state
        const autoClear = this.renderer.autoClear;
        
        // Render overlay without clearing the main scene
        this.renderer.autoClear = false;
        this.renderer.render(this.overlayScene, this.overlayCamera);
        
        // Restore state
        this.renderer.autoClear = autoClear;
    }
    
    dispose() {
        this.uv0Material.dispose();
        this.uv1Material.dispose();
        this.uv0WireMaterial.dispose();
        this.uv1WireMaterial.dispose();
        this.uv0Mesh.geometry.dispose();
        this.uv1Mesh.geometry.dispose();
        if (this.uv0Wireframe) {
            this.uv0Wireframe.geometry.dispose();
        }
        if (this.uv1Wireframe) {
            this.uv1Wireframe.geometry.dispose();
        }
    }
}
