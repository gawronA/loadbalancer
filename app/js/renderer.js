// let mainAppState;
// let mainThreads;
// let mainClients;

$('#mainBtn').on('click', () => {
    window.api.mainToggle();
});

const convertFileSizeToStr = (sizeInBytes) => {
    if (sizeInBytes / 1e9 > 1) {
        return `${(sizeInBytes / 1e9).toFixed(1)} GB`;
    }
    if (sizeInBytes / 1e6 > 1) {
        return `${(sizeInBytes / 1e6).toFixed(1)} MB`;
    }
    if (sizeInBytes / 1e3 > 1) {
        return `${(sizeInBytes / 1e3).toFixed(1)} kB`;
    }

    return `${(sizeInBytes / 1e0).toFixed(1)} B`;
};

const convertTimeToStr = (timeInMs) => {
    if (timeInMs / 1000 / 60 > 1) {
        return `${parseInt(timeInMs / 1000 / 60, 10)}m${parseInt(timeInMs / 1000, 10)}s`;
    }

    return `${parseInt(timeInMs / 1000, 10)}s`;
};

const updateAppState = (state) => {
    if (state === 'init') {
        $('#appInitContent').show();
        $('#appRunningContent').hide();
        $('#mainBtn').addClass('start');
        $('#mainBtn').removeClass('stop');
        $('#mainBtn').text('Start');
    } else if (state === 'running') {
        $('#appInitContent').hide();
        $('#appRunningContent').show();
        $('#mainBtn').addClass('stop');
        $('#mainBtn').removeClass('start');
        $('#mainBtn').text('Stop');
    }
};

const updateParams = (params) => {
    $('#threadCount').val = params.threadCount;
    $('#tickTime').val = params.tickTime;
    $('#uploadSpeed').val = params.uploadSpeed;
    $('#minClientTta').val = params.minClientTta;
    $('#maxClientTta').val = params.maxClientTta;
    $('#maxClients').val = params.maxClients;
};

const updateThreads = (threads) => {
    const phlr = $('.thread-table-placeholder');
    phlr.empty();

    threads.forEach((thread) => {
        phlr.append(`
            <table class="thread-table">
                <tr class="${thread.fileSize === 0 ? 'idle' : 'busy'}"><th>Thread_${thread.id}</th></tr>
                <tr><td>${convertFileSizeToStr(thread.processedSize)}/${convertFileSizeToStr(thread.fileSize)}</td></tr>
                <tr><td>${((thread.processedSize / thread.fileSize) * 100).toFixed(2)}% in ${convertTimeToStr(thread.processingTime)}</td></tr>
            </table>
        `);
    });
};

const updateClients = (clients) => {
    const table = $('.client-table tbody');
    $('tr', table).slice(1).remove();

    clients.forEach((client) => {
        let filesString = '';
        client.files.forEach((file) => {
            filesString += `${convertFileSizeToStr(file.size)} (${file.type}), `;
        });
        filesString = filesString.slice(0, -1);
        table.append(`
            <tr>
                <td>${client.id}</td>
                <td>${client.fileCount}</td>
                <td class="file-contents">${filesString}</td>
                <td>${convertTimeToStr(client.waitTime)}</td>
                <td>${client.weight}</td>
            </tr>
        `);
    });
};

window.api.onUpdate((event, data) => {
    const {
        mainAppState, mainParams, mainThreads, mainClients,
    } = data;
    updateAppState(mainAppState);
    updateParams(mainParams);
    updateThreads(mainThreads);
    updateClients(mainClients);
});
