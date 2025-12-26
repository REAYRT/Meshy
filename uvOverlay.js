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
        this.uv0Mesh.geometry.dispose();
        this.uv1Mesh.geometry.dispose();
    }
}
