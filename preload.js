const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld(
    'api',
    {
        start: (data) => ipcRenderer.send('start', data),
        stop: (data) => ipcRenderer.send('stop', data),
        getAppState: () => ipcRenderer.send('getAppState'),
        onAppState: (func) => ipcRenderer.on('appState', func),
    },
);
