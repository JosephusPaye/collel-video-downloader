const downloader = require('./downloader');

module.exports = class DownloadQueue {
    constructor(directory) {
        this.items = [];
        this.downloads = [];
        this.downloadInProgress = false;
        this.downloadDirectory = directory;
    }

    push(item) {
        this.items.push(item);

        if (!this.downloadInProgress) {
            this.next();
        }
    }

    next() {
        if (this.items.length === 0) {
            this.downloadInProgress = false;
            return;
        }

        const item = this.items.shift();

        item.status = 'Connecting...';
        this.downloadInProgress = true;

        const downloadOptions = {
            filename: item.filename + '.part',
            directory: this.downloadDirectory,
            args: item.args || []
        };

        const download = downloader.download(item.url, downloadOptions)
            .on('info', (info, tempFilePath) => {
                item.status = 'Downloading';
                item.size = info.size;
                item.filepath = tempFilePath;
            })
            .on('progress', progress => {
                item.progress = progress.percentage;
                item.speed = progress.speed;
                item.eta = progress.eta;
            })
            .on('finish', () => {
                item.speed = '-';
                item.eta = '-';

                this.next();
            })
            .on('file-renamed', path => {
                item.filepath = path;
                item.status = 'Complete';

                // Remove the download from list of downloads
                this.downloads = this.downloads.filter(d => d.uid !== item.uid);
            })
            .on('cancelled', () => {
                item.isCancelled = true;
                item.status = 'Cancelled';

                // Remove the download from list of downloads
                this.downloads = this.downloads.filter(d => d.uid !== item.uid);
            })
            .on('error', err => {
                item.hasError = true;
                item.status = 'Error';

                // Remove the download from list of downloads
                this.downloads = this.downloads.filter(d => d.uid !== item.uid);
            });

        download.uid = item.uid;
        this.downloads.push(download);
    }

    setDirectory(directory) {
        this.downloadDirectory = directory;
    }

    cancelDownload(item) {
        for (let i = 0; i < this.downloads.length; i++) {
            if (this.downloads[i].uid === item.uid) {
                this.downloads[i].cancel();
                break;
            }
        }
    }
}
