const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let win;
let appState = 'init';
let params = {
    threadCount: 5,
    tickTime: 40,
    uploadSpeed: 2000000,
    minClientTta: 200,
    maxClientTta: 3000,
    maxClients: 50,
};
let threads;
let clients;

let tickIntervalHandle;
let lastTickTime;
let timeToNextClient;

class ClientGenerator {
    clientCounter = 0;

    constructor(config) {
        this.config = config;
    }

    create() {
        const fCount = Math.floor(Math.random() * (5 - 1 + 1)) + 1;
        const fs = new Array(fCount);
        for (let i = 0; i < fCount; i += 1) {
            fs[i] = { type: '', size: Math.floor(Math.random() * ((512 * 1e6) - 1e3 + 1)) + 1e3 };
        }
        return {
            // eslint-disable-next-line no-plusplus
            id: this.clientCounter++,
            fileCount: fCount,
            files: fs,
            waitTime: 0,
            weight: 0,
        };
    }
}

const clientGenerator = new ClientGenerator(0);

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
    clients = [];
    clients.push({
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
    });
};

const updateRenderer = () => {
    win.webContents.send('update', {
        mainAppState: appState,
        mainParams: params,
        mainThreads: threads,
        mainClients: clients,
    });
};

const randomUniform = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const tick = () => {
    const now = Date.now();
    const deltaTime = now - lastTickTime;
    lastTickTime = now;

    timeToNextClient -= deltaTime;
    if (timeToNextClient <= 0) {
        clients.push(clientGenerator.create());
        timeToNextClient = randomUniform(params.minClientTta, params.maxClientTta);
    }

    /* eslint no-param-reassign: ["error", { "props": true, "ignorePropertyModificationsFor": ["thread"] }] */
    threads.forEach((thread) => {
        if (thread.fileSize === 0 && clients.length > 0) {
            thread.fileSize = clients[0].files[0].size;
            clients[0].files.shift();
            if (clients[0].files.length === 0) {
                clients.shift();
            }
        } else if (thread.fileSize !== 0) {
            thread.processedSize += params.uploadSpeed * (deltaTime / 1000);
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

const startSimulation = () => {
    lastTickTime = Date.now();
    timeToNextClient = randomUniform(params.minClientTta, params.maxClientTta);
    tickIntervalHandle = setInterval(tick, params.period);
};
const stopSimulation = () => {
    clearInterval(tickIntervalHandle);
};

ipcMain.on('toggle', (event, data) => {
    if (appState === 'init') {
        appState = 'running';
        params = data;
        initThreads(params.threadCount);
        initClients();
        startSimulation();
        updateRenderer();
    } else if (appState === 'running') {
        appState = 'init';
        stopSimulation();
        updateRenderer();
    }
});

const run = () => {
    createWindow();
    win.webContents.on('dom-ready', () => {
        updateRenderer();
    });
};

app.whenReady().then(run);
