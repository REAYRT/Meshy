import GUI from './lil-gui.esm.min.js';

export const settings = {
    animationSpeed: 0.0005,
    autoRotate: true
};

export const wallSettings = {
    columns: 25,
    rows: 9,
    panelWidth: 600,
    panelHeight: 337.5,
    selectedPanel: 'custom',
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
    folder.add(mesh.position, 'x').name('Position X');
    folder.add(mesh.position, 'y').name('Position Y');
    folder.add(mesh.position, 'z').name('Position Z');

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
                    onUpdate();
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
            anglesFolder.add(wallSettings.angles, i, -45, 45).name(`Angle ${i}`).onChange(onUpdate);
        }
    };

    wallFolder.add(wallSettings, 'columns', 1, 50, 1).onChange(() => {
        refreshAngles();
        onUpdate();
    });
    wallFolder.add(wallSettings, 'rows', 1, 20, 1).onChange(onUpdate);
    const widthController = wallFolder.add(wallSettings, 'panelWidth', 100, 1000).onChange(() => {
        wallSettings.selectedPanel = 'custom';
        panelController.updateDisplay();
        onUpdate();
    });
    const heightController = wallFolder.add(wallSettings, 'panelHeight', 100, 1000).onChange(() => {
        wallSettings.selectedPanel = 'custom';
        panelController.updateDisplay();
        onUpdate();
    });

    // Initial build
    for(let i = 0; i < wallSettings.angles.length; i++) {
        anglesFolder.add(wallSettings.angles, i, -45, 45).name(`Angle ${i}`).onChange(onUpdate);
    }

    const animFolder = gui.addFolder('Animation');
    animFolder.add(settings, 'autoRotate').name('Auto Rotate');

    const exportFolder = gui.addFolder('Export');
    const exportObj = { download: onDownload };
    exportFolder.add(exportObj, 'download').name('Download OBJ');
    
    return gui;
}
