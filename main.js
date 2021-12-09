const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let win;
let appState = 'init';
let threads;
let clients;

let processingSpeed;
let tickIntervalHandle;
let lastTickTime;

const createWindow = () => {
    win = new BrowserWindow({
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
    });
    win.loadFile('index.html');
};

const initThreads = (count) => {
    threads = new Array(count);
    for (let i = 0; i < count; i += 1) {
        threads[i] = {
            id: i,
            fileSize: 0,
            processedSize: 0,
            processingTime: 0,
        };
    }
};

const initClients = () => {
    clients = [{
        id: 0,
        fileCount: 5,
        files: [
            {
                type: 'mp3',
                size: 4587741,
            },
            {
                type: 'mp3',
                size: 6341234,
            },
            {
                type: 'avi',
                size: 503341234,
            },
            {
                type: 'doc',
                size: 8639,
            },
            {
                type: 'doc',
                size: 5356,
            }],
        waitTime: 1474765,
        weight: 12354,
    }];
};

const updateRenderer = () => {
    win.webContents.send('update', {
        mainAppState: appState,
        mainThreads: threads,
        mainClients: clients,
    });
};

const tick = () => {
    const now = Date.now();
    const deltaTime = now - lastTickTime;
    lastTickTime = now;

    /* eslint no-param-reassign: ["error", { "props": true, "ignorePropertyModificationsFor": ["thread"] }] */
    threads.forEach((thread) => {
        if (thread.fileSize === 0 && clients.length > 0) {
            thread.fileSize = clients[0].files[0].size;
            clients[0].files.shift();
            if (clients[0].files.length === 0) {
                clients.shift();
            }
        } else if (thread.fileSize !== 0) {
            thread.processedSize += processingSpeed * (deltaTime / 1000);
            thread.processingTime += deltaTime / 1000;
            if (thread.processedSize >= thread.fileSize) {
                thread.fileSize = 0;
                thread.processedSize = 0;
                thread.processingTime = 0;
            }
        }
    });

    updateRenderer();
};

const startSimulation = (period, speed) => {
    processingSpeed = speed;
    lastTickTime = Date.now();
    tickIntervalHandle = setInterval(tick, period);
};

const stopSimulation = () => {
    clearInterval(tickIntervalHandle);
};

ipcMain.on('toggle', (event, data) => {
    if (appState === 'init') {
        appState = 'running';
        initThreads(5);
        initClients();
        startSimulation(40, 100000);
        updateRenderer();
    } else if (appState === 'running') {
        appState = 'init';
        stopSimulation();
        updateRenderer();
    }
});

const run = () => {
    createWindow();
};

app.whenReady().then(run);
