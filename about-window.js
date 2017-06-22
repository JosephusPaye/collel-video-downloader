const path = require('path');
const url = require('url');
const { remote } = require('electron');

const windowOptions = {
    title: 'About Collel Video Downloader',
    width: 340,
    height: 175,
    resizable: false,
    autoHideMenuBar: true
};

/**
 * Create and show the About window
 */
function show() {
    (new remote.BrowserWindow(windowOptions))
    .loadURL(url.format({
        pathname: path.join(__dirname, 'about.html'),
        protocol: 'file:',
        slashes: true
    }));
}

module.exports = {
	show: show
};
