const humanizeDuration = require('humanize-duration');
const prettyBytes = require('pretty-bytes');

// Create a custom instance humanizer
// See: https://github.com/EvanHahn/HumanizeDuration.js#humanizers
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

/**
 * Round the given value to the nearest 10
 *
 * @param  {Number} value
 * @return {Number}
 */
function round(value) {
    return Math.round(value * 100) / 100;
}

/**
 * Convert the given value into a human-readable duration
 *
 * @param  {Number} value
 * @return {String}
 */
function duration(value) {
    value = value * 1000;

    // Assume 1 second for values less than 1 second
    if (value > 0 && value < 1000) {
        value = 1000;
    }

    return prettyDuration(value);
}

/**
 * Run the given humanizer with a value if the value is valid,
 * otherwise return the value unchanged.
 *
 * @param  {Number}   value
 * @param  {Function} humanizer
 * @param  {String}   append
 * @return {Number|String}
 */
function runHumanizer(value, humanizer, append = '') {
    if (typeof value !== 'number') {
        return value;
    }

    return humanizer(value) + append;
}

module.exports = {
    bytes(value) {
        return runHumanizer(value, prettyBytes);
    },

    speed(value) {
        return runHumanizer(value, prettyBytes, '/s');
    },

    duration(value) {
        return runHumanizer(value, duration);
    },

    percentage(value) {
        return runHumanizer(value, round, '%');
    }
};
