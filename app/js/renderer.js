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

$(document).ready(() => {
    window.api.getAppState();
});
