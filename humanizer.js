const prettyBytes = require('pretty-bytes');
const humanizeDuration = require('humanize-duration');

const prettyDuration = humanizeDuration.humanizer({
    delimiter: ' ',
    spacer: '',
    largest: 2,
    round: true,
    language: 'shortEn',
    units: ['mo', 'w', 'd', 'h', 'm', 's'],
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
            },
            decimal: '.'
        }
    }
});

function round(value) {
    return Math.round(value * 100) / 100;
}

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
        if (typeof value !== 'number') {
            return value;
        }

        value = value * 1000;

        if (value > 0 && value < 1000) {
            value = 1000; // Assume 1 second for values less than 1 second
        }

        return prettyDuration(value);
    },

    percentage(value) {
        return callHumanizer(value, round, '%');
    }
};
