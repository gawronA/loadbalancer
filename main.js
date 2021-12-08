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

const updateThreadState = () => {
    win.webContents.send('threadState', [
        {
            id: 1,
            processedSize: 54324,
            fileSize: 10300200,
            fileSizeUnit: 'Byte',
            processingTime: 0.423,
            processingTimeUnit: 's',
        },
        {
            id: 1,
            processedSize: 432,
            fileSize: 6543,
            fileSizeUnit: 'MB',
            processingTime: 3,
            processingTimeUnit: 's',
        },
    ]);
};

ipcMain.on('getAppState', () => {
    updateAppState(appState);
});

ipcMain.on('start', (event, data) => {
    console.log(`App has started ${data}`);
    updateAppState('running');
    updateThreadState();
});

ipcMain.on('stop', (event, data) => {
    console.log(`App has stopped ${data}`);
    updateAppState('init');
});

const run = () => {
    createWindow();
    updateThreadState();
};

app.whenReady().then(run);
