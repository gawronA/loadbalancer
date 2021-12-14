/* eslint no-param-reassign: ["error", { "props": true, "ignorePropertyModificationsFor": ["thread", "client", "a", "b"] }] */

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let win;
let appState = 'init';
let params = {
    threadCount: 5,
    tickTime: 40,
    uploadSpeed: 25,
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
            fs[i] = { type: '', size: Math.floor(Math.random() * ((1e3) - 1 + 1)) + 1 };
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
                size: 250,
            },
            {
                type: 'mp3',
                size: 300,
            },
            {
                type: 'avi',
                size: 975,
            },
            {
                type: 'doc',
                size: 100,
            },
            {
                type: 'doc',
                size: 175,
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

const calculateWeight = (fileSize, time, clientCount) => (1 / clientCount) * time ** 2 + (clientCount / fileSize);

const sortFiles = () => {
    // create a file pool with clients indexes and wait time
    // sort files in a pool
    // reassign files to clients and set weight to the highest calculated
    // const filePool = [];
    const filePool = [];
    clients.forEach((client) => {
        client.files.forEach((file) => {
            filePool.push({
                clientId: client.id,
                file,
                waitTime: client.waitTime / 1000,
                weight: 0,
            });
        });
    });

    filePool.sort((a, b) => {
        a.weight = calculateWeight(a.file.size, a.waitTime, clients.length);
        b.weight = calculateWeight(b.file.size, b.waitTime, clients.length);
        return b.weight - a.weight;
    });

    const sortedClients = Array(clients.lenght);
    const filePoolLength = filePool.length;
    for (let i = 0; i < filePoolLength; i += 1) {
        // get the first file
        const file = filePool.shift();

        // if there is no client with index from file - create it
        if (typeof sortedClients[file.clientId] === 'undefined') {
            // does not exist
            sortedClients[file.clientId] = {
                id: clients[file.clientId].id,
                fileCount: clients[file.clientId].fileCount,
                files: [file.file],
                waitTime: clients[file.clientId].waitTime,
                weight: file.weight,
            };
        } else {
            // does exist - just append the file
            sortedClients[file.clientId].files.push(file.file);
        }
    }

    // replace client list with the sorted one
    clients = sortedClients;
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

    threads.forEach((thread) => {
        // if Thread is Idle assign a file to it, remove file from the clients pool and sort files
        if (thread.fileSize === 0 && clients.length > 0) {
            if (typeof (clients[0]) === 'undefined') {
                const a = 5;
            }
            thread.fileSize = clients[0].files[0].size;
            clients[0].files.shift();
            if (clients[0].files.length === 0) {
                clients.shift();
            }
        // If thread is Busy, recalculate processed size and time
        } else if (thread.fileSize !== 0) {
            thread.processedSize += params.uploadSpeed * (deltaTime / 1000);
            thread.processingTime += deltaTime;
            // if file processing has finished, go to Idle
            if (thread.processedSize >= thread.fileSize) {
                thread.fileSize = 0;
                thread.processedSize = 0;
                thread.processingTime = 0;
            }
        }
    });

    // Update waiting time for each client
    clients.forEach((client) => {
        if (typeof (client) !== 'undefined') client.waitTime += deltaTime;
    });

    if (clients.length > 0) sortFiles();
    updateRenderer();
};

const startSimulation = () => {
    lastTickTime = Date.now();
    timeToNextClient = randomUniform(params.minClientTta, params.maxClientTta);
    tickIntervalHandle = setInterval(tick, params.tickTime);
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

ipcMain.on('update', () => {
    updateRenderer();
});

const run = () => {
    createWindow();
};

app.whenReady().then(run);
