import GUI from './lil-gui.esm.min.js';

export const settings = {
    animationSpeed: 0.0005,
    autoRotate: true,
    previewUVChannel: 0,
    previewTexture: null,
    selectedSectionIndex: -1
};

export const wallSettings = {
    columns: 25,
    rows: 9,
    panelWidth: 600,
    panelHeight: 337.5,
    selectedPanel: 'custom',
    meshPosition: { x: -8416, y: 0, z: 0 },
    subdivide: true,
    sectionWidth: 10,
    angles: [
        -0.25368095,
        -0.032730339,
        0.159354292,
        0.31911372,
        0.338674629,
        -0.227717673,
        0.349316523,
        -3.380341983,
        -9.885565084,
        -9.693422478,
        -9.285937288,
        -10.09091338,
        -9.418451933,
        -9.662015937,
        -3.676759343,
        -2.262141607,
        -3.869870441,
        -3.037342416,
        -3.570971597,
        -3.325188299,
        -3.373401551,
        -4.001089943,
        -4.334711906,
        -2.92656502,
        -4.145880329
    ]
};

// API functions for LED panels
async function fetchPanelList() {
    try {
        const response = await fetch('https://api.reayrt.com/products/getall');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.panels || [];
    } catch (error) {
        console.error('Failed to fetch panel list:', error);
        return [];
    }
}

export function setupUI(mesh, onUpdate, onDownload)
{
    const gui = new GUI();
    gui.domElement.style.top = '0px';
    gui.domElement.style.left = '0px';
    gui.domElement.style.right = 'auto';
    
    const folder = gui.addFolder('Mesh Position');
    folder.add(wallSettings.meshPosition, 'x', -20000, 20000).name('Position X').onChange(() => {
        mesh.position.x = wallSettings.meshPosition.x;
    });
    folder.add(wallSettings.meshPosition, 'y', -20000, 20000).name('Position Y').onChange(() => {
        mesh.position.y = wallSettings.meshPosition.y;
    });
    folder.add(wallSettings.meshPosition, 'z', -20000, 20000).name('Position Z').onChange(() => {
        mesh.position.z = wallSettings.meshPosition.z;
    });

    const wallFolder = gui.addFolder('Wall Settings');
    
    // LED Panel Type Selector
    const panelOptions = { 'Custom': 'custom', 'Loading...': 'loading' };
    const panelDataMap = new Map(); // Store panel data for quick access
    let panelController;
    
    // Fetch and populate panel list
    fetchPanelList().then(panels => {
        // Clear loading option
        delete panelOptions['Loading...'];
        
        if (panels.length === 0) {
            panelOptions['Error Loading Panels'] = 'error';
        } else {
            panels.forEach(panel => {
                panelOptions[panel.displayName] = panel.id;
                panelDataMap.set(panel.id, panel);
            });
        }
        
        // Update the controller options
        if (panelController) {
            panelController.options(panelOptions);
        }
    }).catch(error => {
        console.error('Failed to load panels:', error);
        delete panelOptions['Loading...'];
        panelOptions['Error Loading Panels'] = 'error';
        if (panelController) {
            panelController.options(panelOptions);
        }
    });
    
    // Helper to trigger mesh rebuild regardless of onUpdate being a function or an object
    const triggerRebuild = () => {
        if (typeof onUpdate === 'function') {
            onUpdate();
        } else if (onUpdate && typeof onUpdate.rebuild === 'function') {
            onUpdate.rebuild();
        }
    };

    panelController = wallFolder.add(wallSettings, 'selectedPanel', panelOptions)
        .name('Panel Type')
        .onChange((value) => {
            if (value !== 'custom' && value !== 'loading' && value !== 'error') {
                const panelData = panelDataMap.get(value);
                if (panelData) {
                    wallSettings.panelWidth = panelData.dimensions.width;
                    wallSettings.panelHeight = panelData.dimensions.height;
                    // Update the controllers to reflect new values
                    widthController.updateDisplay();
                    heightController.updateDisplay();
                    triggerRebuild();
                }
            }
        });
    
    let anglesFolder = wallFolder.addFolder('Angles');
    
    const refreshAngles = () => {
        // Resize array
        const targetLength = wallSettings.columns;
        while (wallSettings.angles.length < targetLength) {
            wallSettings.angles.push(0);
        }
        while (wallSettings.angles.length > targetLength) {
            wallSettings.angles.pop();
        }

        // Rebuild UI
        anglesFolder.destroy();
        anglesFolder = wallFolder.addFolder('Angles');
        for(let i = 0; i < wallSettings.angles.length; i++) {
            anglesFolder.add(wallSettings.angles, i, -45, 45).name(`Angle ${i}`).onChange(triggerRebuild);
        }
        // Always start minimized
        anglesFolder.close();
    };

    wallFolder.add(wallSettings, 'columns', 1, 50, 1).onChange(() => {
        refreshAngles();
        triggerRebuild();
    });
    wallFolder.add(wallSettings, 'rows', 1, 20, 1).onChange(() => { triggerRebuild(); });
    wallFolder.add(wallSettings, 'subdivide').name('Subdivide by Width').onChange(() => { refreshSectionSelector(); triggerRebuild(); });
    wallFolder.add(wallSettings, 'sectionWidth', 1, 50, 1).name('Section Width (panels)').onChange(() => {
        // Clamp to current columns
        if (wallSettings.sectionWidth < 1) wallSettings.sectionWidth = 1;
        if (wallSettings.sectionWidth > wallSettings.columns) wallSettings.sectionWidth = wallSettings.columns;
        refreshSectionSelector();
        triggerRebuild();
    });
    const widthController = wallFolder.add(wallSettings, 'panelWidth', 100, 1000).onChange(() => {
        wallSettings.selectedPanel = 'custom';
        panelController.updateDisplay();
        triggerRebuild();
    });
    const heightController = wallFolder.add(wallSettings, 'panelHeight', 100, 1000).onChange(() => {
        wallSettings.selectedPanel = 'custom';
        panelController.updateDisplay();
        triggerRebuild();
    });

    // Initial build
    for(let i = 0; i < wallSettings.angles.length; i++) {
        anglesFolder.add(wallSettings.angles, i, -45, 45).name(`Angle ${i}`).onChange(triggerRebuild);
    }
    // Always start minimized
    anglesFolder.close();

    const animFolder = gui.addFolder('Animation');
    animFolder.add(settings, 'autoRotate').name('Auto Rotate');

    const textureFolder = gui.addFolder('Texture Preview');
    textureFolder.add(settings, 'previewUVChannel', { 'Warp UVs': 0, 'Full Volume UVs': 1 }).name('UV Channel').onChange((value) => {
        if (onUpdate.updateUVChannel) {
            onUpdate.updateUVChannel(value);
        }
    });

    // Section selection for UV preview
    let sectionController;
    const buildSectionOptions = () => {
        const options = { 'All Sections': -1 };
        const cols = wallSettings.columns;
        const w = Math.max(1, Math.min(wallSettings.sectionWidth || 1, cols));
        const enable = !!wallSettings.subdivide;
        if (enable) {
            const count = Math.ceil(cols / w);
            for (let i = 0; i < count; i++) {
                options[`Section ${i}`] = i;
            }
        }
        return options;
    };
    const refreshSectionSelector = () => {
        const opts = buildSectionOptions();
        if (!sectionController) {
            sectionController = textureFolder.add(settings, 'selectedSectionIndex', opts)
                .name('UV Section')
                .onChange((value) => {
                    if (onUpdate.updateSelectedSectionIndex) {
                        onUpdate.updateSelectedSectionIndex(value);
                    }
                });
        } else {
            sectionController.options(buildSectionOptions());
            sectionController.updateDisplay();
        }
    };
    refreshSectionSelector();

    const exportFolder = gui.addFolder('Export');
    const exportObj = { 
        downloadOBJ: onDownload.obj,
        downloadGLB: onDownload.glb 
    };
    exportFolder.add(exportObj, 'downloadOBJ').name('Download OBJ');
    exportFolder.add(exportObj, 'downloadGLB').name('Download GLB');
    
    return gui;
}
