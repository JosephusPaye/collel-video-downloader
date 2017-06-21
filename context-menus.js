const { Menu } = require('electron');

function createMenu(menuId, onClick) {
    const open = {
        id: 'open',
        label: 'Open',
        click: onClick
    };

    const openInBrowser = {
        id: 'open-in-browser',
        label: 'Open in browser',
        click: onClick
    };

    const showInFolder = {
        id: 'show-in-folder',
        label: 'Show in folder',
        click: onClick
    };

    const removeFromList = {
        id: 'remove-from-list',
        label: 'Remove from list',
        click: onClick
    };

    const cancel = {
        id: 'cancel',
        label: 'Cancel',
        click: onClick
    };

    const separator = {
        type: 'separator'
    };

    switch(menuId) {
        case 'downloadConnecting':
            return Menu.buildFromTemplate([openInBrowser]);
        case 'downloadQueued':
        case 'downloadError':
        case 'downloadCancelled':
            return Menu.buildFromTemplate([removeFromList, separator, openInBrowser]);
        case 'downloadInProgress':
            return Menu.buildFromTemplate([showInFolder, cancel, separator, openInBrowser]);
        case 'downloadComplete':
            return Menu.buildFromTemplate([open, showInFolder, removeFromList, separator, openInBrowser]);
        default:
            return null;
    };
}

module.exports = createMenu;
