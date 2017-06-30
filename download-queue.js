const downloader = require('./downloader');

/**
 * The DownloadQueue class, handles downloading and item status updates (progress, status, etc).
 */
class DownloadQueue {
    /**
     * Create an instance of DownloadQueue with the given directory
     *
     * @param  {String} directory
     * @return {DownloadQueue}
     */
    constructor(directory) {
        // The download directory
        this.downloadDirectory = directory;

        // Whether or not a download is currently in progress for this queue
        this.downloadInProgress = false;

        // The list of downloads currently in progress
        this.downloads = [];

        // The list of items waiting to download
        this.items = [];
    }

    /**
     * Add a new item unto the queue, and start download if the queue is empty
     *
     * @param  {Object} item
     */
    push(item) {
        this.items.push(item);

        if (!this.downloadInProgress) {
            this.next();
        }
    }

    /**
     * Process the next item on the download queue
     */
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

                // Move on to the next item
                this.next();
            });

        download.uid = item.uid;

        this.downloads.push(download);
    }

    /**
     * Change the download directory
     *
     * @param {String} directory
     */
    setDirectory(directory) {
        this.downloadDirectory = directory;
    }

    /**
     * Cancel the download corresponding to the given item
     *
     * @param  {Object} item The download item
     */
    cancelDownload(item) {
        for (let i = 0; i < this.downloads.length; i++) {
            if (this.downloads[i].uid === item.uid) {
                this.downloads[i].cancel();
                break;
            }
        }
    }
}

module.exports = DownloadQueue;
