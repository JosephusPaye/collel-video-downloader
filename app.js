const downloader = require('./download');
const DownloadQueue = require('./download-queue');
const humanizer = require('./humanizer');
const Store = require('electron-store');
const { remote, shell } = require('electron');

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
            downloads: []
        };
    },

    methods: {
        download() {
            if (this.input.trim().length === 0) {
                return;
            }

            this.fetchingInfo = true;

            downloader.getInfo(this.input)
                .then(info => {
                    this.fetchingInfo = false;
                    [].concat(info).forEach(this.addDownload);
                })
                .catch(err => {
                    this.fetchingInfo = false;

                    // Give the DOM time to update (stop the spinner) before showing the dialog,
                    // since that blocks the renderer
                    setTimeout(() => {
                        this.showUrlError(err);
                    }, 300);
                });
        },

        addDownload(videoInfo) {
            const video = {
                status: 'Queued',
                filename: videoInfo.filename,
                filepath: '',
                size: '-',
                eta: '-',
                speed: '-',
                progress: 0,
                url: videoInfo.url,
                info: videoInfo
            };

            this.downloads.push(video);
            downloadQueue.push(video);
        },

        showUrlError(err) {
            console.error('Get info error', err);

            remote.dialog.showMessageBox({
                type: 'warning',
                title: 'Download error',
                detail: 'No video found for the link entered. Check the link for errors.\nIf you are sure the link is correct, update the downloader from the Settings menu and try downloading again.'
            });
        },

        openDownloadDirectory() {
            shell.openExternal(this.downloadDirectory);
        },

        changeDownloadDirectory() {
            const options = {
                title: 'Select download folder',
                defaultPath: this.downloadDirectory,
                properties: ['openDirectory'],
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
        }
    },

    filters: {
        prettyBytes: humanizer.bytes,
        prettySpeed: humanizer.speed,
        prettyDuration: humanizer.duration,
        prettyPercentage: humanizer.percentage
    }
});
