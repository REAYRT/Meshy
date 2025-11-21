import GUI from './lil-gui.esm.min.js';

export const settings = {
    animationSpeed: 0.002,
    autoRotate: false
};

export function setupUI(mesh) {
    const gui = new GUI();
    gui.domElement.style.top = '0px';
    gui.domElement.style.left = '0px';
    gui.domElement.style.right = 'auto';
    
    const folder = gui.addFolder('Mesh Position');
    folder.add(mesh.position, 'x').name('Position X');
    folder.add(mesh.position, 'y').name('Position Y');
    folder.add(mesh.position, 'z').name('Position Z');

    const animFolder = gui.addFolder('Animation');
    animFolder.add(settings, 'autoRotate').name('Auto Rotate');
    animFolder.add(settings, 'animationSpeed', 0, 0.05).name('Speed');
    
    return gui;
}
