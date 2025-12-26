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
        
        // UV1 - per-panel mapping (0-1 within each panel)
        const U2 = (i % panels.x) / panels.x;
        const V2 = (j % panels.y) / panels.y;
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