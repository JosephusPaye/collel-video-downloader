const fs = require('fs');
const path = require('path');

const detailsFile = path.join(__dirname, '..', 'node_modules', 'youtube-dl', 'bin', 'details');
const binaryFile = path.join(__dirname, '..', 'node_modules', 'youtube-dl', 'bin', 'youtube-dl.exe');

if (fs.existsSync(detailsFile)) {
	fs.unlinkSync(detailsFile);
}

if (fs.existsSync(binaryFile)) {
	fs.unlinkSync(binaryFile);
}

console.log('Removed youtube-dl/bin/details and youtube-dl/bin/youtube-dl.exe');
