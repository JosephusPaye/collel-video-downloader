module.exports = class DownloadQueue {
	constructor(items) {
		this.items = [].concat(items);
		this.downloadInProgress = false;
	}

	push(item) {
		this.items.push(item);

		if (!this.downloadInProgress) {
			this.start();
		}
	},

	pop() {

	}

	start() {

	}
}
