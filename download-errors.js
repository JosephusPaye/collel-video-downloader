const errors = {
    connectionError: {
        title: 'Could not connect',
        message: 'Could not to connect. Make sure you are connected to the internet and try again.'
    },
    missingFormat: {
        title: 'Format not found',
        message: 'The format you requested was not found for the link entered. Not all sites support audio downloads.'
    },
    notFound: {
        title: 'Link not found',
        message: 'The link entered was not found. Check the link for errors.\nIf the link is correct, update the downloader from the Settings menu and try again.'
    },
    unsupportedUrl: {
        title: 'Link not supported',
        message: 'Downloads are not supported for the link entered.'
    },
    genericError: {
        title: 'Something went wrong',
        message: 'Could not process your request due to an internal error.'
    }
};

/**
 * Identify the given error object to show a friendly message to the user.
 *
 * @param  {Error} err
 * @return {Object}
 */
function identify(err) {
    if (err.message.includes('ERROR: requested format not available')) {
        return errors.missingFormat;
    }

    if (err.message.includes('ERROR: Unsupported URL')) {
        return errors.unsupportedUrl;
    }

    if (
        err.message.includes('is not a valid URL') ||
        err.message.includes('ERROR: Unable to download webpage: HTTP Error 404: Not Found') ||
        err.message.includes('ssl.CertificateError:')
    ) {
        return errors.notFound;
    }

    if (err.message.includes('ERROR: Unable to download webpage: <urlopen error [Errno 11001] getaddrinfo failed>')) {
        return errors.connectionError;
    }

    if (err.message.includes('ERROR: Unable to download webpage')) {
        return errors.notFound;
    }

    return errors.genericError;
}

module.exports = {
    identify: identify
};
