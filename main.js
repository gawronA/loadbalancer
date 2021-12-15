/* eslint no-param-reassign: ["error", { "props": true, "ignorePropertyModificationsFor": ["thread", "client", "a", "b", "deltaTime"] }] */

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
            id: this.clientCounter++,
            fileCount: fCount,
            files: fs,
            waitTime: 0,
            weight: 0,
        };
    }

    createSmallFile() {
        return {
            id: this.clientCounter++,
            fileCount: 1,
            files: [{
                type: '',
                size: Math.floor(Math.random() * ((200) - 1 + 1)) + 1,
            }],
            waitTime: 0,
            weight: 0,
        };
    }

    createMediumFile() {
        return {
            id: this.clientCounter++,
            fileCount: 1,
            files: [{
                type: '',
                size: Math.floor(Math.random() * ((750) - 200 + 1)) + 200,
            }],
            waitTime: 0,
            weight: 0,
        };
    }

    createLargeFile() {
        return {
            id: this.clientCounter++,
            fileCount: 1,
            files: [{
                type: '',
                size: Math.floor(Math.random() * ((1000) - 750 + 1)) + 750,
            }],
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

// eslint-disable-next-line arrow-body-style
// const calculateWeight = (maxFileSize, minFileSize, fileSize, maxWaitTime, minWaitTime, time, clientCount) => {
//     // eslint-disable-next-line max-len
//     return (((1 / clientCount) * (time - minWaitTime)) / ((maxWaitTime - minWaitTime) ** 2)) + (clientCount / (fileSize - minFileSize) / (maxFileSize - minFileSize));
// };

// eslint-disable-next-line arrow-body-style
const calculateWeight = (maxFileSize, minFileSize, fileSize, maxWaitTime, minWaitTime, time, clientCount) => {
    // eslint-disable-next-line max-len
    const normSize = (fileSize - minFileSize) / (maxFileSize - minFileSize);
    const normTime = (time - minWaitTime) / (maxWaitTime - minWaitTime);
    return -(normSize - 1) + normTime;
};

const sortFiles = () => {
    // create a file pool with clients indexes and wait time
    // sort files in a pool
    // reassign files to clients and set weight to the highest calculated
    // const filePool = [];
    let maxFileSize = -1;
    let minFileSize = -1;
    let maxWaitTime = -1;
    let minWaitTime = -1;
    const filePool = [];
    clients.forEach((client) => {
        if (client.waitTime > maxWaitTime)maxWaitTime = client.waitTime;
        if (client.waitTime < minWaitTime)minWaitTime = client.waitTime;
        client.files.forEach((file) => {
            if (file.size > maxFileSize) maxFileSize = file.size;
            if (file.size < minFileSize)minFileSize = file.size;
            filePool.push({
                clientId: client.id,
                file,
                waitTime: client.waitTime,
                weight: 0,
            });
        });
    });

    filePool.sort((a, b) => {
        a.weight = calculateWeight(maxFileSize, minFileSize, a.file.size, maxWaitTime, minWaitTime, a.waitTime, clients.length);
        b.weight = calculateWeight(maxFileSize, minFileSize, b.file.size, maxWaitTime, minWaitTime, b.waitTime, clients.length);
        return b.weight - a.weight;
    });

    // const sortedClients = Array(clients.lenght);
    const sortedClients = [];
    const filePoolLength = filePool.length;
    for (let i = 0; i < filePoolLength; i += 1) {
        // get the first file
        const file = filePool.shift();

        // if there is no client with index from file - create it
        if (typeof sortedClients.find((e) => (typeof (e) === 'undefined' ? false : e.id === file.clientId)) === 'undefined') {
            // does not exist
            // find client in clients
            const client = clients.find((e) => e.id === file.clientId);
            sortedClients.push({
                id: client.id,
                fileCount: client.fileCount,
                files: [file.file],
                waitTime: client.waitTime,
                weight: file.weight,
            });
        } else {
            // does exist - just append the file
            sortedClients.find((e) => e.id === file.clientId).files.push(file.file);
        }
    }

    // replace client list with the sorted one
    clients = sortedClients;
};

const randomUniform = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const tick = (deltaTime = 0) => {
    const now = Date.now();
    // eslint-disable-next-line no-param-reassign
    if (deltaTime === 0) deltaTime = now - lastTickTime;
    lastTickTime = now;

    timeToNextClient -= deltaTime;
    if (timeToNextClient <= 0 && clients.length < params.maxClients) {
        clients.push(clientGenerator.create());
        timeToNextClient = randomUniform(params.minClientTta, params.maxClientTta);
    }

    threads.forEach((thread) => {
        // if Thread is Idle assign a file to it, remove file from the clients pool and sort files
        if (thread.fileSize === 0 && clients.length > 0) {
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
    } else if (appState === 'running' || appState === 'paused') {
        appState = 'init';
        stopSimulation();
    }
    updateRenderer();
});

ipcMain.on('pause', () => {
    if (appState !== 'paused') {
        appState = 'paused';
        clearInterval(tickIntervalHandle);
    } else {
        appState = 'running';
        lastTickTime = Date.now();
        tickIntervalHandle = setInterval(tick, params.tickTime);
    }
    updateRenderer();
});

ipcMain.on('step', () => {
    tick(params.tickTime);
});

ipcMain.on('addSmallFile', () => {
    clients.push(clientGenerator.createSmallFile());
    updateRenderer();
});

ipcMain.on('addMediumFile', () => {
    clients.push(clientGenerator.createMediumFile());
    updateRenderer();
});

ipcMain.on('addLargeFile', () => {
    clients.push(clientGenerator.createLargeFile());
    updateRenderer();
});

ipcMain.on('update', () => {
    updateRenderer();
});

const run = () => {
    createWindow();
};

app.whenReady().then(run);
