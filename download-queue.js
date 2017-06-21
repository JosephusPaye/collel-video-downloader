const youtubeDl = require('./downloader');

module.exports = class DownloadQueue {
    constructor(directory) {
        this.items = [];
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

        const self = this;
        const item = this.items.shift();

        item.status = 'Requesting...';
        this.downloadInProgress = true;

        youtubeDl.download(item.url, { filename: item.filename + '.part', directory: this.downloadDirectory, args: item.args || [] })
            .on('info', info => {
                item.status = 'Downloading';
                item.size = info.size;
            })
            .on('progress', progress => {
                item.progress = progress.percentage;
                item.speed = progress.speed;
                item.eta = progress.eta;
            })
            .on('finish', () => {
                item.speed = '-';
                item.eta = '-';

                self.next();
            })
            .on('file-renamed', path => {
                item.filepath = path;
                item.status = 'Complete';
            })
            .on('error', err => {
                item.hasError = true;
                item.status = 'Error';

                console.error('Download error', err);
            });
    }

    setDirectory(directory) {
        this.downloadDirectory = directory;
    }
}
