const downloader = require('./downloader');
const DownloadQueue = require('./download-queue');
const humanizer = require('./humanizer');
const path = require('path');
const Store = require('electron-store');
const url = require('url');
const youtubeDl = require('./youtube-dl');
const menu = require('./menus');
const { remote, shell, clipboard } = require('electron');

const store = new Store();
const appDataDirectory = remote.app.getPath('userData');

const downloadDirectory = store.get('downloadDirectory', remote.app.getPath('downloads'));
const downloadQueue = new DownloadQueue(downloadDirectory);

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
            }
        };
    },

    created() {
        if (!store.has('youtubeDl')) {
            this.showProgressOverlay('Setting up for first use. Please wait.', { type: 'progress' });

            youtubeDl.initialize(appDataDirectory)
                .then(this.hideMessageOverlay)
                .catch(err => {
                    console.log('Error initializing youtube-dl', err);
                    this.showErrorOverlay('An error occurred while setting up. Please check your internet connection and restart Video Downloader.');
                });
        }
    },

    methods: {
        onDownloadOptionSelect(option) {
            if (option.id === 'download-audio') {
                this.downloadAudio();
            } else if (option.id === 'get-url') {
                this.getVideoUrl();
            }
        },

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
            this.download(['--format=140']);
        },

        getVideoUrl() {
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
                status: 'Queued',
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
            console.error('Error getting video info', err);
            this.showDialog(
                'Link error',
                'No video found for the link entered. Check the link for errors.\nIf the link is correct, update the downloader from the Settings menu and try again.',
                { type: 'warning' }
            );
        },

        onSettingOptionSelect(option) {
            if (option.id === 'update-youtubedl') {
                this.updateYoutubeDl();
            } else if (option.id === 'about') {
                this.showAbout();
            }
        },

        updateYoutubeDl() {
            this.showProgressOverlay('Updating downloader. Please wait.');

            youtubeDl.update(appDataDirectory)
                .then((result) => {
                    this.hideMessageOverlay();

                    const title = result.updated ? 'Downloader updated' : 'Up to date';
                    const message = result.updated
                        ? 'Downloader was updated to version ' + result.version + '.'
                        : 'Downloader is already up to date. Current version: ' + result.version + '.'

                    this.showDialog(title, message);
                })
                .catch(err => {
                    this.hideMessageOverlay();
                    console.log('Error updating youtube-dl', err);

                    this.showDialog(
                        'Update error',
                        'An error occurred while updating the downloader. Please check your internet connection and try again.',
                        { type: 'warning'}
                    );
                });
        },

        showAbout() {
            const aboutWindow = new remote.BrowserWindow({ title: 'About Video Downloader', width: 340, height: 175, autoHideMenuBar: true });

            aboutWindow.loadURL(url.format({
                pathname: path.join(__dirname, 'about.html'),
                protocol: 'file:',
                slashes: true
            }));
        },

        openDownloadDirectory() {
            shell.openExternal(this.downloadDirectory);
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
            this.downloads = this.downloads.filter(d => d.status !== 'Complete');
        },

        showDialog(title, message, options = {}) {
            // Give the DOM time to update before showing the dialog,
            // since the dialog blocks the renderer. Tried $nextTick, but it
            // doesn't achieve the desired effect
            setTimeout(() => {
                remote.dialog.showMessageBox({
                    type: options.type || 'info',
                    title: title,
                    detail: message
                });
            }, 300);
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
