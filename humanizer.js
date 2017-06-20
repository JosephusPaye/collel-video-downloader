const prettyBytes = require('pretty-bytes');
const humanizeDuration = require('humanize-duration');

const prettyDuration = humanizeDuration.humanizer({
    delimiter: ' ',
    largest: 2,
    round: true,
    spacer: '',
    language: 'shortEn',
    languages: {
        shortEn: {
            y() {
                return 'y';
           	},
            mo() {
                return 'mo';
            },
            w() {
                return 'w';
            },
            d() {
                return 'd';
            },
            h() {
                return 'h';
            },
            m() {
                return 'm';
            },
            s() {
                return 's';
            },
            ms() {
                return 'ms';
            }
        }
    }
});

function callHumanizer(value, fn, append = '') {
    if (typeof value !== 'number') {
        return value;
    }

    return fn(value) + append;
}

module.exports = {
    bytes(value) {
        return callHumanizer(value, prettyBytes);
    },

    speed(value) {
        return callHumanizer(value, prettyBytes, '/s');
    },

    duration(value) {
        return callHumanizer(value, prettyDuration);
    }
};
