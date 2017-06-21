const { ipcRenderer } = require('electron');

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

function handleCancel(download, downloadQueue) {
	if (download.status !== 'Downloading') {
		return;
	}

	downloadQueue.cancelDownload(download);
}

function handle(data, downloads, downloadQueue) {
	const result = findDownload(data.downloadId, downloads);

	if (!result) {
		return;
	}

	switch (data.selectedOptionId) {
		case 'open':
			ipcRenderer.send('open-item', result.download.filepath);
			break;
		case 'open-in-browser':
			ipcRenderer.send('open-external', result.download.url);
			break;
		case 'show-in-folder':
			ipcRenderer.send('show-item-in-folder', result.download.filepath);
			break;
		case 'remove-from-list':
			downloads.splice(result.index, 1);
			break;
		case 'cancel':
			handleCancel(result.download, downloadQueue);
			break;
	}
}

module.exports = {
	handle
};
