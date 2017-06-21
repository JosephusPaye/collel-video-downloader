const path = require('path');
const url = require('url');
const { remote } = require('electron');

const windowOptions = {
    title: 'About Video Downloader',
    width: 340,
    height: 175,
    resizable: false,
    autoHideMenuBar: true
};

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
