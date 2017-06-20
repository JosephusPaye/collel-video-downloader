const fs = require('fs');
const path = require('path');
const shortId = require('shortid');
const progress = require('progress-stream');
const youtubeDl = require('youtube-dl');

const defaultDirectory = path.join(__dirname, 'downloads');

/**
 * Download the video at the given URL
 *
 * @param  {String} url       The URL of the video
 * @param  {String} directory The path to set as youtube-dl's working directory
 * @param  {Array}  args      Args to pass to youtube-dl. Format: ['--format=22', '...']
 * @return {Stream}           The download progress stream
 */
function download(url, directory = defaultDirectory, args = []) {
    const execOptions = { cwd: directory };
    const downloadPath = path.join(directory, shortId.generate() + '.part');

    const progressStream = progress({ time: 300 });
    const fileStream = fs.createWriteStream(downloadPath);
    const downloadStream = youtubeDl(url, args, execOptions);

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
        fs.rename(downloadPath, path.join(directory, filename), err => {
            if (err) {
                console.error('Error renaming downloaded file', err);
            } else {
                progressStream.emit('file-renamed');
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
 * @param  {String} directory The path to set as youtube-dl's working directory
 * @param  {Array}  args      Args to pass to youtube-dl. Format: ['--format=22', '...']
 * @return {Promise}
 */
function getInfo(url, args = []) {
    return new Promise((resolve, reject) => {
        youtubeDl.getInfo(url, args, function(err, info) {
            if (err) {
                return reject(err);
            }

			console.log(info);

            resolve({
            	id: info.id,
            	title: info.title,
            	url: info.webpage_url,
            	fileurl: info.url,
            	thumbnail: info.thumbnail,
            	description: info.description,
            	filename: info._filename,
            	extension: info.ext,
            	format: {
            		id: info.format_id,
            		note: info.format_note,
            		resolution: info.width + 'x' + info.height
            	},
            	site: info.extractor_key,
            	uploader: info.uploader,
            	uploaderUrl: info.uploader_url,
            	duration: info.duration,
            });
        });
    });
}

// download('https://www.youtube.com/watch?v=dxWvtMOGAhw')
//     .on('info', info => { console.log('Downloading:', info._filename); })
//     .on('progress', p => { console.log(p.percentage); })
//     .on('finish', () => { console.log('Finished now yaya'); })
//     .on('part-file-deleted', () => { console.log('Cleaned up after error'); })
//     .on('file-renamed', () => { console.log('Renamed'); })
//     .on('error', err => { console.log('Error', JSON.stringify(err, null, '  ')) });

module.exports = {
    download: download,
    getInfo: getInfo
};
