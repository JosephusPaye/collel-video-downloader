const fs = require('fs');
const path = require('path');
const shortId = require('shortid');
const progress = require('progress-stream');
const youtubeDl = require('youtube-dl');

const defaultOptions = {
    directory: path.join(__dirname, 'downloads'),
    args: []
};

/**
 * Download the video at the given URL
 *
 * @param  {String} url                 The URL of the video
 * @param  {String} options.directory   The path to set as youtube-dl's working directory
 * @param  {String} options.filename    The output filename
 * @param  {Array}  options.args        Args to pass to youtube-dl. Format: ['--format=22', '...']
 * @return {Stream}                     The download progress stream
 */
function download(url, options = {}) {
    options = Object.assign({}, defaultOptions, options);

    const execOptions = { cwd: options.directory };
    const downloadPath = path.join(
        options.directory,
        options.filename ? options.filename : (shortId.generate() + '.part')
    );

    const progressStream = progress({ time: 300 });
    const fileStream = fs.createWriteStream(downloadPath);
    const downloadStream = youtubeDl(url, options.args, execOptions);

    let hasDownloadError = false;
    let filename = '';

    // Emitted when the video info is initially retrieved
    downloadStream.on('info', info => {
        // Set the filename for later rename
        filename = info._filename;

        // Set the length (for the progress to work) and emit the info
        progressStream.setLength(info.size);
        progressStream.emit('info', info);
    });

    // Emitted on error from youtube-dl or http download
    downloadStream.on('error', err => {
        // Set the error status, for cleanup
        hasDownloadError = true;

        // Emit the error and close the file stream
        progressStream.emit('error', err);
        fileStream.end();
    });

    // Emitted when the download/file being resumed is complete
    downloadStream.on('complete', item => {
        progressStream.emit('resume-complete', item);
    });

    // Emitted when the current video in a playlist ends and the next video should begin.
    // Call download() to with the video object to download the next video
    downloadStream.on('next', video => {
        progressStream.emit('next-video', video);
    });

    // Emitted when the file stream is closed, either when the download is complete
    // or when there was an error downloading
    fileStream.on('finish', () => {
        // Clean up if there was an error
        if (hasDownloadError) {
            fs.unlink(downloadPath, err => {
                if (err) {
                    console.error('Error deleting part download file', err);
                } else {
                    progressStream.emit('part-file-deleted');
                }
            });

            return;
        }

        // Rename the file to it's actual name
        const newName = path.join(options.directory, filename);

        fs.rename(downloadPath, newName, err => {
            if (err) {
                console.error('Error renaming downloaded file', err);
            } else {
                progressStream.emit('file-renamed', newName);
            }
        });
    });

    // Pipe the download stream (an HTTP response) to the progress stream and then to a file
    downloadStream.pipe(progressStream).pipe(fileStream);

    return progressStream;
}

/**
 * Get the info of the video at the given url
 *
 * @param  {String} url       The URL of the video
 * @param  {Array}  args      Args to pass to youtube-dl. Format: ['--format=22', '...']
 * @return {Promise}
 */
function getInfo(url, args = []) {
    return new Promise((resolve, reject) => {
        youtubeDl.getInfo(url, args, (err, info) => {
            if (err) {
                return reject(err);
            }

            const transformed = [].concat(info).map(video => {
                return {
                    id: video.id,
                    title: video.title,
                    url: video.webpage_url,
                    fileurl: video.url,
                    thumbnail: video.thumbnail,
                    description: video.description,
                    filename: video._filename,
                    extension: video.ext,
                    format: {
                        id: video.format_id,
                        note: video.format_note,
                        resolution: video.width + 'x' + video.height
                    },
                    site: video.extractor_key,
                    uploader: video.uploader,
                    uploaderUrl: video.uploader_url,
                    duration: video.duration
                };
            });

            resolve(transformed.length > 1 ? transformed : transformed[0]);
        });
    });
}

// download('https://www.youtube.com/watch?v=dxWvtMOGAhw')
//     .on('info', info => { console.log('Downloading:', info._filename); })
//     .on('progress', p => { console.log(p.percentage); })
//     .on('finish', () => { console.log('Finished'); })
//     .on('part-file-deleted', () => { console.log('Cleaned up after error'); })
//     .on('file-renamed', () => { console.log('Renamed'); })
//     .on('error', err => { console.log('Error', JSON.stringify(err, null, '  ')) });

module.exports = {
    download: download,
    getInfo: getInfo
};
