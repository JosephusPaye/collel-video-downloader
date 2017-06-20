const downloader = require('./download');
const DownloadQueue = require('./download-queue');
const humanizer = require('./humanizer');
const Store = require('electron-store');
const { remote, shell, clipboard } = require('electron');

const store = new Store();
const downloadDirectory = store.get('downloadDirectory', remote.app.getPath('downloads'));
const downloadQueue = new DownloadQueue(downloadDirectory);

new Vue({
    el: '#app',

    data() {
        return {
            input: '',
            fetchingInfo: false,
            downloadDirectory: downloadDirectory,
            downloads: [],
            downloadOptionsMenu: [{
                id: 'download-audio',
                label: 'Download audio only'
            }, {
                id: 'get-url',
                label: 'Get URL'
            }]
        };
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
                    this.fetchingInfo = false;
                    [].concat(info).forEach(item => { this.addDownload(item, args); });
                })
                .catch(err => {
                    this.fetchingInfo = false;
                    this.showDialog(() => { this.showUrlError(err); });
                });
        },

        downloadAudio() {
            this.download(['--format=140']);
        },

        getVideoUrl() {
            this.fetchingInfo = true;

            downloader.getInfo(this.input)
                .then(info => {
                    this.fetchingInfo = false;
                    clipboard.writeText(info.fileurl);
                    this.showDialog(() => { this.showUrlSuccess(info); });
                })
                .catch(err => {
                    this.fetchingInfo = false;
                    this.showDialog(() => { this.showUrlError(err); });
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
            remote.dialog.showMessageBox({
                type: 'info',
                title: 'Video URL copied',
                detail: 'Download URL for video "' + info.title + '" has been copied to the clipboard.'
            });
        },

        showUrlError(err) {
            console.error('Get info error', err);
            remote.dialog.showMessageBox({
                type: 'warning',
                title: 'Video error',
                detail: 'No video found for the link entered. Check the link for errors.\nIf the link is correct, update the downloader from the Settings menu and try again.'
            });
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

        updateYoutubeDl() {
            // Do it.
        },

        clearCompletedDownloads() {
            this.downloads = this.downloads.filter(d => d.status !== 'Complete');
        },

        showDialog(fn) {
            // Give the DOM time to update before showing the dialog,
            // since the dialog blocks the renderer. Tried $nextTick, but it
            // doesn't achieve the desired effect
            setTimeout(fn, 300);
        }
    },

    filters: {
        prettyBytes: humanizer.bytes,
        prettySpeed: humanizer.speed,
        prettyDuration: humanizer.duration,
        prettyPercentage: humanizer.percentage
    }
});
