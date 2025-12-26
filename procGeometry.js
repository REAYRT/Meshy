import * as THREE from './three.module.js';

export class ProcLedVolumeGeometry extends THREE.BufferGeometry {
  constructor(panelAngles = [90,90], panels = { x: 1, y: 1 }, panelDimensions = { x: 1, y: 1}, startingAngle = 0, startingPos = { x: 0, y: 0, z: 0 }) {
    super();

    this.startingAngle = startingAngle;
    this.panelAngles = panelAngles;
    this.panels = panels;
    this.panelDimensions = panelDimensions;
    this.startingPos = startingPos;

    const vertices = [];
    const uvs = [];
    const uv2s = []; // Second UV channel
    const indices = [];

    // Calculate aspect ratio for UV1
    const wallWidth = panels.x * panelDimensions.x;
    const wallHeight = panels.y * panelDimensions.y;
    const aspectRatio = wallWidth / wallHeight;
    
    // Determine scaling for UV1 to preserve aspect ratio
    let uv1ScaleX = 1.0;
    let uv1ScaleY = 1.0;
    
    if (aspectRatio > 1.0) {
      // Width is greater, scale Y down
      uv1ScaleY = 1.0 / aspectRatio;
    } else {
      // Height is greater, scale X down
      uv1ScaleX = aspectRatio;
    }

    let cumulativeAngleDeg = startingAngle;
    let vectorPos = new THREE.Vector3(startingPos.x, startingPos.y, startingPos.z);
    let nextPoint = vectorPos.clone();

    // Generate vertices and UVs
    for (let i = 0; i <= panels.x; i++)
    {
      if (i !== 0 && panelAngles[i - 1] !== undefined)
      {
        cumulativeAngleDeg += panelAngles[i - 1];
      }

      for (let j = 0; j <= panels.y; j++)
      {
        vectorPos.copy(nextPoint);
        vectorPos.z = j * panelDimensions.y;

        vertices.push(vectorPos.x, vectorPos.y, vectorPos.z);

        // UV0 - normalized across entire mesh
        const U = i / panels.x;
        const V = j / panels.y;
        uvs.push(U, V);
        
        // UV1 - aspect ratio preserved mapping
        const U2 = (i / panels.x) * uv1ScaleX;
        const V2 = (j / panels.y) * uv1ScaleY;
        uv2s.push(U2, V2);
      }

      const angleRad = THREE.MathUtils.degToRad(cumulativeAngleDeg);
      nextPoint.x = vectorPos.x + panelDimensions.x * Math.cos(angleRad);
      nextPoint.y = vectorPos.y + panelDimensions.x * Math.sin(angleRad);
      nextPoint.z = vectorPos.z;
    }

    // Generate triangles (indices)
    for (let i = 0; i < panels.x; i++)
    {
      for (let j = 0; j < panels.y; j++)
      {
        const topLeft = i * (panels.y + 1) + j;
        const topRight = (i + 1) * (panels.y + 1) + j;
        const bottomLeft = i * (panels.y + 1) + (j + 1);
        const bottomRight = (i + 1) * (panels.y + 1) + (j + 1);

        indices.push(topLeft, topRight, bottomLeft);
        indices.push(topRight, bottomRight, bottomLeft);
      }
    }

    this.cumulativeAngle = cumulativeAngleDeg;
    this.endingPos = vectorPos.clone();

    // Set attributes
    this.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    this.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    this.setAttribute('uv2', new THREE.Float32BufferAttribute(uv2s, 2));
    this.setIndex(indices);
    this.computeVertexNormals();
  }
}