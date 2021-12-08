let mainAppState;

$('#mainBtn').on('click', () => {
    if (mainAppState === 'init') {
        window.api.start('hello');
    } else if (mainAppState === 'running') {
        window.api.stop('bye');
    }
    // window.api.start('hello');
    // $('#appInitContent').hide();
    // $('#appRunningContent').show();
    // $('#mainBtn.start').addClass('stop');
    // $('#mainBtn.start').removeClass('start');
});

window.api.onAppState((event, state) => {
    mainAppState = state;
    if (mainAppState === 'init') {
        $('#appInitContent').show();
        $('#appRunningContent').hide();
        $('#mainBtn').addClass('start');
        $('#mainBtn').removeClass('stop');
    } else if (mainAppState === 'running') {
        $('#appInitContent').hide();
        $('#appRunningContent').show();
        $('#mainBtn').addClass('stop');
        $('#mainBtn').removeClass('start');
    }
});

window.api.onThreadState((event, data) => {
    const table = $('#threadTable');
    $('tr.headers', table).empty();
    $('tr.progress', table).empty();
    $('tr.stats', table).empty();

    data.forEach((thread) => {
        $('tr.headers', table).append(`<th>Thread_${thread.id}</th>`);
        $('tr.progress', table).append(`<td>${thread.processedSize}/${thread.fileSize} ${thread.fileSizeUnit}</td>`);
        $('tr.stats', table).append(`<td>${((thread.processedSize / thread.fileSize) * 100).toFixed(2)}% in ${thread.processingTime}${thread.processingTimeUnit}</td>`);
    });
});
$(document).ready(() => {
    window.api.getAppState();
});
