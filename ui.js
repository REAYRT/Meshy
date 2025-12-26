import GUI from './lil-gui.esm.min.js';

export const settings = {
    animationSpeed: 0.002,
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
        const data = await response.json();
        return data.ids;
    } catch (error) {
        console.error('Failed to fetch panel list:', error);
        return [];
    }
}

async function fetchPanelData(panelId) {
    try {
        const response = await fetch(`https://api.reayrt.com/products/get/${panelId}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`Failed to fetch panel data for ${panelId}:`, error);
        return null;
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
    const panelOptions = { 'Custom': 'custom' };
    let panelController;
    
    // Fetch and populate panel list
    fetchPanelList().then(panelIds => {
        panelIds.forEach(id => {
            // Format display name: "roe-cb5" -> "ROE CB5"
            const displayName = id.split('-').map(part => 
                part.toUpperCase()
            ).join(' ');
            panelOptions[displayName] = id;
        });
        
        // Update the controller options
        if (panelController) {
            panelController.options(panelOptions);
        }
    });
    
    panelController = wallFolder.add(wallSettings, 'selectedPanel', panelOptions)
        .name('Panel Type')
        .onChange(async (value) => {
            if (value !== 'custom') {
                const panelData = await fetchPanelData(value);
                if (panelData) {
                    wallSettings.panelWidth = panelData.physicalSize.width;
                    wallSettings.panelHeight = panelData.physicalSize.height;
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
    animFolder.add(settings, 'animationSpeed', 0, 0.05).name('Speed');

    const exportFolder = gui.addFolder('Export');
    const exportObj = { download: onDownload };
    exportFolder.add(exportObj, 'download').name('Download OBJ');
    
    return gui;
}
