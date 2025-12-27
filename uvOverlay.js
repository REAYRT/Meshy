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
        
        // Create border materials for UV space boundaries (white squares)
        this.borderMaterial = new THREE.LineBasicMaterial({ 
            color: 0xffffff, 
            linewidth: 2,
            depthTest: false,
            depthWrite: false
        });
        
        // Create UV space border boxes
        const borderGeometry = this.createBorderBox();
        this.uv0Border = new THREE.LineSegments(borderGeometry, this.borderMaterial);
        this.uv1Border = new THREE.LineSegments(borderGeometry.clone(), this.borderMaterial);
        
        this.overlayScene.add(this.uv0Border);
        this.overlayScene.add(this.uv1Border);
        
        // Create mesh materials for filled UV quads
        this.uv0MeshMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff0000, 
            side: THREE.DoubleSide,
            depthTest: false,
            depthWrite: false,
            transparent: true,
            opacity: 0.7
        });
        this.uv1MeshMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffff00, 
            side: THREE.DoubleSide,
            depthTest: false,
            depthWrite: false,
            transparent: true,
            opacity: 0.7
        });
        
        // Wireframe objects (will be created when geometry is updated)
        this.uv0Mesh = null;
        this.uv1Mesh = null;
        
        this.updatePositions();
        
        // Handle window resize
        window.addEventListener('resize', () => this.updatePositions());
    }
    
    createBorderBox() {
        // Create a square border from -0.5 to 0.5 (will be scaled to fit UV space)
        const positions = [
            -0.5, -0.5, 0,  0.5, -0.5, 0,  // Bottom
            0.5, -0.5, 0,  0.5,  0.5, 0,  // Right
            0.5,  0.5, 0, -0.5,  0.5, 0,  // Top
            -0.5,  0.5, 0, -0.5, -0.5, 0   // Left
        ];
        
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        return geometry;
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
        
        // Update border positions
        this.uv0Border.position.set(uv0X, uv0Y, 0);
        this.uv0Border.scale.set(squareSizeNDC, squareSizeNDCHeight, 1);
        
        this.uv1Border.position.set(uv1X, uv1Y, 0);
        this.uv1Border.scale.set(squareSizeNDC, squareSizeNDCHeight, 1);
        
        // Update mesh positions as well
        this.updateMeshPositions();
    }
    
    updateTextures(uv0Texture, uv1Texture) {
        // No longer needed but keeping for compatibility
    }
    
    updateGeometry(geometry) {
        console.log('Updating UV overlay geometry');
        
        // Remove old meshes
        if (this.uv0Mesh) {
            this.overlayScene.remove(this.uv0Mesh);
            this.uv0Mesh.geometry.dispose();
        }
        if (this.uv1Mesh) {
            this.overlayScene.remove(this.uv1Mesh);
            this.uv1Mesh.geometry.dispose();
        }
        
        // Create UV0 mesh
        const uv0Geometry = this.createUVMesh(geometry, 'uv');
        console.log('UV0 mesh triangles:', uv0Geometry.attributes.position.count / 3);
        this.uv0Mesh = new THREE.Mesh(uv0Geometry, this.uv0MeshMaterial);
        this.overlayScene.add(this.uv0Mesh);
        
        // Create UV1 mesh
        const uv1Geometry = this.createUVMesh(geometry, 'uv2');
        console.log('UV1 mesh triangles:', uv1Geometry.attributes.position.count / 3);
        this.uv1Mesh = new THREE.Mesh(uv1Geometry, this.uv1MeshMaterial);
        this.overlayScene.add(this.uv1Mesh);
        
        // Update positions to match the border boxes
        this.updateMeshPositions();
    }
    
    createUVMesh(geometry, uvAttribute) {
        const uvs = geometry.attributes[uvAttribute];
        const indices = geometry.index;
        
        if (!uvs) return new THREE.BufferGeometry();
        
        const positions = [];
        
        // Create triangles for each face
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
            const x0 = u0 - 0.5;
            const y0 = v0 - 0.5;
            const x1 = u1 - 0.5;
            const y1 = v1 - 0.5;
            const x2 = u2 - 0.5;
            const y2 = v2 - 0.5;
            
            // Add triangle
            positions.push(x0, y0, 0, x1, y1, 0, x2, y2, 0);
        }
        
        const meshGeometry = new THREE.BufferGeometry();
        meshGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        
        return meshGeometry;
    }
    
    updateMeshPositions() {
        if (!this.uv0Mesh || !this.uv1Mesh) return;
        
        const width = this.renderer.domElement.width;
        const height = this.renderer.domElement.height;
        
        const squareSizeNDC = (this.squareSize / width) * 2;
        const marginNDC = (this.margin / width) * 2;
        const squareSizeNDCHeight = (this.squareSize / height) * 2;
        const marginNDCHeight = (this.margin / height) * 2;
        
        // Position UV0 mesh (top square)
        const uv0X = 1 - marginNDC - squareSizeNDC / 2;
        const uv0Y = -1 + marginNDCHeight + squareSizeNDCHeight / 2 + squareSizeNDCHeight + marginNDCHeight;
        
        this.uv0Mesh.position.set(uv0X, uv0Y, 0.05);
        this.uv0Mesh.scale.set(squareSizeNDC, squareSizeNDCHeight, 1);
        
        // Position UV1 mesh (bottom square)
        const uv1X = 1 - marginNDC - squareSizeNDC / 2;
        const uv1Y = -1 + marginNDCHeight + squareSizeNDCHeight / 2;
        
        this.uv1Mesh.position.set(uv1X, uv1Y, 0.05);
        this.uv1Mesh.scale.set(squareSizeNDC, squareSizeNDCHeight, 1);
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
        this.borderMaterial.dispose();
        this.uv0MeshMaterial.dispose();
        this.uv1MeshMaterial.dispose();
        this.uv0Border.geometry.dispose();
        this.uv1Border.geometry.dispose();
        if (this.uv0Mesh) {
            this.uv0Mesh.geometry.dispose();
        }
        if (this.uv1Mesh) {
            this.uv1Mesh.geometry.dispose();
        }
    }
}
