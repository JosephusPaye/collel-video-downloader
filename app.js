const aboutWindow = require('./about-window');
const downloadAction = require('./download-actions');
const downloadErrors = require('./download-errors');
const humanizer = require('./humanizer');
const menu = require('./menus');
const shortId = require('shortid');
const Store = require('electron-store');
const youtubeDl = require('./youtube-dl');
const { remote, clipboard, ipcRenderer } = require('electron');

const store = new Store();
const appDataDirectory = remote.app.getPath('userData');

let downloader;
let downloadQueue;
const downloadDirectory = store.get('downloadDirectory', remote.app.getPath('downloads'));

const vm = new Vue({
    el: '#app',

    data() {
        return {
            input: '',
            downloads: [],
            fetchingInfo: false,
            downloadDirectory: downloadDirectory,
            settingsMenu: menu.settings,
            downloadOptionsMenu: menu.downloadOptions,
            messageOverlay: {
                type: 'progress',
                shown: false,
                message: ''
            },
            // A map of download status to the corresponding context menu
            contextMenus: {
                'Connecting...': 'downloadConnecting',
                'Queued': 'downloadQueued',
                'Downloading': 'downloadInProgress',
                'Complete': 'downloadComplete',
                'Error': 'downloadErrors',
                'Cancelled': 'downloadCancelled'
            }
        };
    },

    created() {
        // Lazily initialize './downloader' and './download-queue'. This is done to ensure that
        // the youtube-dl binary has been downloaded first, since those files import the
        // 'youtube-dl' package, which throws an error if the binary isn't available.
        if (store.has('youtubeDl')) {
            this.initializeDownloader();
        } else {
            this.showProgressOverlay('Setting up for first use. Please wait.', { type: 'progress' });

            youtubeDl.initialize(appDataDirectory)
                .then(() => {
                    this.hideMessageOverlay();
                    this.initializeDownloader();
                })
                .catch(err => {
                    console.error('Error initializing youtube-dl', err);
                    this.showErrorOverlay('An error occurred while setting up. Please check your internet connection and restart Collel.');
                });
        }

        // Listen for menu item selection from the main process
        ipcRenderer.on('context-menu-item-selected', this.onContextMenuItemSelect);
    },

    methods: {
        download(args = []) {
            if (this.input.trim().length === 0) {
                return;
            }

            this.fetchingInfo = true;

            downloader.getInfo(this.input, args)
                .then(info => {
                    this.input = '';
                    [].concat(info).forEach(item => { this.addDownload(item, args); });
                })
                .catch(this.showUrlError)
                .finally(() => {
                    this.fetchingInfo = false;
                });
        },

        downloadAudio() {
            this.download(['-f=mp3/m4a/bestaudio']);
        },

        getVideoUrl() {
            if (this.input.trim().length === 0) {
                return;
            }

            this.fetchingInfo = true;

            downloader.getInfo(this.input)
                .then(info => {
                    clipboard.writeText(info.fileurl);
                    this.showUrlSuccess(info);
                })
                .catch(this.showUrlError)
                .finally(() => {
                    this.fetchingInfo = false;
                });
        },

        addDownload(videoInfo, args = []) {
            const video = {
                uid: shortId.generate(),
                status: 'Queued',
                isCancelled: false,
                hasError: false,
                filename: videoInfo.filename,
                filepath: '',
                size: '-',
                eta: '-',
                speed: '-',
                progress: 0,
                url: videoInfo.url,
                info: videoInfo,
                args: args
            };

            this.downloads.push(video);
            downloadQueue.push(video);
        },

        showUrlSuccess(info) {
            this.showDialog(
                'Video URL copied',
                'Download URL for video "' + info.title + '" has been copied to the clipboard.',
                { type: 'info' }
            );
        },

        showUrlError(err) {
            console.error('Error fetching video info', err);
            const message = downloadErrors.identify(err);

            this.showDialog(
                message.title,
                message.message
            );
        },

        onSettingOptionSelect(option) {
            if (option.id === 'update-youtubedl') {
                this.updateYoutubeDl();
            } else if (option.id === 'about') {
                this.showAbout();
            }
        },

        onDownloadOptionSelect(option) {
            if (option.id === 'download-audio') {
                this.downloadAudio();
            } else if (option.id === 'get-url') {
                this.getVideoUrl();
            }
        },

        onInputContextMenu(e, data) {
            ipcRenderer.send('show-context-menu', {
                menuId: 'input',
                hasSelection: window.getSelection().toString().length > 0
            });
        },

        onContextMenu(item) {
            ipcRenderer.send('show-context-menu', {
                downloadId: item.uid,
                menuId: this.contextMenus[item.status]
            });
        },

        onContextMenuItemSelect(event, data) {
            downloadAction.handle(data, this.downloads, downloadQueue);
        },

        initializeDownloader() {
            const DownloadQueue = require('./download-queue');

            downloader = require('./downloader');
            downloadQueue = new DownloadQueue(downloadDirectory);
        },

        updateYoutubeDl() {
            this.showProgressOverlay('Updating downloader. Please wait.');

            youtubeDl.update(appDataDirectory)
                .then((result) => {
                    this.hideMessageOverlay();

                    const title = result.updated ? 'Downloader updated' : 'Up to date';
                    const message = result.updated ?
                        'Downloader was updated to version ' + result.version + '.' :
                        'Downloader is already up to date. Current version: ' + result.version + '.'

                    this.showDialog(title, message);
                })
                .catch(err => {
                    console.error('Error updating youtube-dl', err);
                    this.hideMessageOverlay();

                    this.showDialog(
                        'Update error',
                        'An error occurred while updating the downloader. Please check your internet connection and try again.',
                        { type: 'warning' }
                    );
                });
        },

        showAbout() {
            aboutWindow.show();
        },

        openDownloadDirectory() {
            ipcRenderer.send('open-item', this.downloadDirectory);
        },

        changeDownloadDirectory() {
            const options = {
                title: 'Select download folder',
                defaultPath: this.downloadDirectory,
                properties: ['openDirectory']
            };

            remote.dialog.showOpenDialog(options, paths => {
                const directory = paths[0];

                store.set('downloadDirectory', directory);
                this.downloadDirectory = directory;

                downloadQueue.setDirectory(directory);
            });
        },

        clearCompletedDownloads() {
            // Remove downloads that are complete, cancelled or have errors
            this.downloads = this.downloads.filter(d => {
                return d.status !== 'Complete' && d.status !== 'Error' && d.status !== 'Cancelled';
            });
        },

        showDialog(title, message, options = {}) {
            remote.dialog.showMessageBox({
                type: options.type || 'info',
                title: title,
                detail: message
            }, () => {});
        },

        showProgressOverlay(message) {
            this.showMessageOverlay(message, { type: 'progress' });
        },

        showErrorOverlay(message) {
            this.showMessageOverlay(message, { type: 'error' });
        },

        showMessageOverlay(message, { type }) {
            this.messageOverlay.type = type;
            this.messageOverlay.message = message;
            this.messageOverlay.shown = true;
        },

        hideMessageOverlay() {
            this.messageOverlay.shown = false;
        }
    },

    filters: {
        prettyBytes: humanizer.bytes,
        prettySpeed: humanizer.speed,
        prettyDuration: humanizer.duration,
        prettyPercentage: humanizer.percentage
    }
});
