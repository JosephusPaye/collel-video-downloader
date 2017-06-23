const { ipcRenderer } = require('electron');

/**
 * Find a download by its uid from the list of downloads.
 * Returns null if not found.
 *
 * @param  {String} uid
 * @param  {Array} downloads
 * @return {Object|null}
 */
function findDownload(uid, downloads) {
	for (let i = 0; i < downloads.length; i++) {
		if (uid == downloads[i].uid) {
			return {
				download: downloads[i],
				index: i
			};
		}
	}

	return null;
}

/**
 * Handle the user's request to cancel a download
 *
 * @param  {Object} download
 * @param  {DownloadQueue} downloadQueue
 */
function handleCancel(download, downloadQueue) {
	if (download.status !== 'Downloading') {
		return;
	}

	downloadQueue.cancelDownload(download);
}

/**
 * Handle a user's action on a download
 *
 * @param  {Object} data          An object with details about the download to act on
 * @param  {Array} downloads      The list of all downloads
 * @param  {Array} downloadQueue  The download queue
 */
function handle(data, downloads, downloadQueue) {
	const item = findDownload(data.downloadId, downloads);
	const itemOnQueue = findDownload(data.downloadId, downloadQueue.items);

	if (!item) {
		return;
	}

	switch (data.selectedOptionId) {
		case 'open':
			ipcRenderer.send('open-item', item.download.filepath);
			break;
		case 'open-in-browser':
			ipcRenderer.send('open-external', item.download.url);
			break;
		case 'show-in-folder':
			ipcRenderer.send('show-item-in-folder', item.download.filepath);
			break;
		case 'remove-from-list':
			downloads.splice(item.index, 1);

			if (itemOnQueue) {
				downloadQueue.items.splice(itemOnQueue.index, 1);
			}

			break;
		case 'cancel':
			handleCancel(item.download, downloadQueue);
			break;
	}
}

module.exports = {
	handle
};
