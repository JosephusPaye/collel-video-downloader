const downloader = require('./download');
// const DownloadQueue  = require('./download-queue');
const humanizer = require('./humanizer');

const app = new Vue({
    el: '#app',

    data() {
        return {
            input: '',
            fetchingInfo: false,
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
					this.addDownload(info);
				})
				.catch(err => {
					this.fetchingInfo = false;
					this.showUrlError(err);
				});
    	},

    	addDownload(videoInfo) {
    		const video = {
			    status: 'Queued',
			    filename: videoInfo.filename,
			    filepath: '',
			    filesize: '-',
			    eta: '-',
			    speed: '-',
			    progress: 0,
			    url: videoInfo.url,
			    info: videoInfo
			};

			console.log(video);

    		this.downloads.push(video);
    	},

    	showUrlError(err) {
			console.error('Url error', err);
    	}
    },

    filters: {
        prettyBytes: humanizer.bytes,
        prettySpeed: humanizer.speed,
        prettyDuration: humanizer.duration
    }
});
