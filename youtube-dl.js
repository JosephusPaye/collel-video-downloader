const downloadYoutubeDl = require('youtube-dl/lib/downloader');
const fs = require('fs');
const path = require('path');
const Promise = require('yaku/lib/yaku.core');
const Store = require('electron-store');

const store = new Store();

/**
 * Download or update the youtube-dl binary
 *
 * @param  {String} appDataDirectory The path to the app's data directory
 * @return {Promise}
 */
function initialize(appDataDirectory) {
    return new Promise((resolve, reject) => {
        const binPath = path.join(appDataDirectory, 'bin');

        downloadYoutubeDl(binPath, (err, result) => {
            if (err) {
                return reject(error);
            }

            const details = {
                lastOperationResult: result,
                updated: !result.includes('Already up to date '),
                version: result.replace('Downloaded youtube-dl ', '').replace('Already up to date ', ''),
                date: new Date()
            };

            store.set('youtubeDl', details);

            resolve(details);
        });
    });
}

/**
 * Get the current version of the youtube-dl binary
 *
 * @param  {String} appDataDirectory The path to the app's data directory
 * @return {Promise}
 */
function getVersion(appDataDirectory) {
    return new Promise((resolve, reject) => {
        if (store.has('youtubeDl')) {
            return resolve(store.get('youtubeDl.version'));
        }

        reject('youtube-dl not downloaded yet.');
    });
}

module.exports = {
    initialize: initialize,
    update: initialize,
    getVersion: getVersion
};
