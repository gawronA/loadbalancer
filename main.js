const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let win;
let appState = 'init';

const createWindow = () => {
    win = new BrowserWindow({
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
    });
    win.loadFile('index.html');
};
const updateAppState = (state) => {
    appState = state;
    win.webContents.send('appState', appState);
};

ipcMain.on('getAppState', () => {
    updateAppState(appState);
});

ipcMain.on('start', (event, data) => {
    console.log(`App has started ${data}`);
    updateAppState('running');
});

ipcMain.on('stop', (event, data) => {
    console.log(`App has stopped ${data}`);
    updateAppState('init');
});

const run = () => {
    createWindow();
};

app.whenReady().then(run);
