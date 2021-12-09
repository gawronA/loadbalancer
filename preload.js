const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld(
    'api',
    {
        mainToggle: (data) => ipcRenderer.send('toggle', data),
        onUpdate: (func) => ipcRenderer.on('update', func),
    },
);
