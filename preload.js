const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld(
    'api',
    {
        mainToggle: (data) => ipcRenderer.send('toggle', data),
        pause: () => ipcRenderer.send('pause'),
        step: () => ipcRenderer.send('step'),
        addSmallFile: () => ipcRenderer.send('addSmallFile'),
        addMediumFile: () => ipcRenderer.send('addMediumFile'),
        addLargeFile: () => ipcRenderer.send('addLargeFile'),
        onUpdate: (func) => ipcRenderer.on('update', func),
        update: () => ipcRenderer.send('update'),
    },
);
