export function calculateAngles(distancesFromOrigin, panelwidth)
{
  const anglesAtOrigin = [];
  const leftEdgeAngles = [];
  const rightEdgeAngles = [];

  for (let i = 0; i < distancesFromOrigin.length - 1; i++)
  {
    const leftSide = distancesFromOrigin[i];
    const rightSide = distancesFromOrigin[i + 1];
    const panelSize = panelwidth;
    
    // Angle at origin = 180 - (leftEdgeAngle + rightEdgeAngle)
    anglesAtOrigin.push(calculateAngleAtOrigin(leftSide, rightSide, panelSize)[0] * -1);

    // Left edge angle in radians, then degrees
    leftEdgeAngles.push(calculateAngleAtOrigin(leftSide, rightSide, panelSize)[1] * -1);
    
    // Right edge angle in radians, then degrees
    rightEdgeAngles.push(calculateAngleAtOrigin(leftSide, rightSide, panelSize)[2] * -1);
  }
  
  return [anglesAtOrigin];
}

export function calculateAngleAtOrigin(left, right, panel) {
  // Angle at origin: acos( (left^2 + right^2 - panel^2) / (2 * left * right) )
  const cosOrigin = (left * left + right * right - panel * panel) / (2 * left * right);
  const angleAtOrigin = Math.acos(Math.max(-1, Math.min(1, cosOrigin))) * 180 / Math.PI;

  // Angle at left: acos( (left^2 + panel^2 - right^2) / (2 * left * panel) )
  const cosLeft = (left * left + panel * panel - right * right) / (2 * left * panel);
  const angleAtLeft = Math.acos(Math.max(-1, Math.min(1, cosLeft))) * 180 / Math.PI;

  // Angle at right: acos( (right^2 + panel^2 - left^2) / (2 * right * panel) )
  const cosRight = (right * right + panel * panel - left * left) / (2 * right * panel);
  const angleAtRight = Math.acos(Math.max(-1, Math.min(1, cosRight))) * 180 / Math.PI;

  return [angleAtOrigin, angleAtLeft, angleAtRight];
}