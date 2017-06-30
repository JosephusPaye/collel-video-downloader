const { Menu } = require('electron');

/**
 * Create a menu corresponding to the given menu id
 *
 * @param  {String}  menuId        The type of menu to create
 * @param  {Boolean} hasSelection  Whether or not text was selected when the menu was invoked
 * @param  {Function}  onClick     A function to call when an item is selected in the menu.
 *                                 Is called with the selected menu item.
 * @return {Electron.Menu}
 */
function createMenu(menuId, hasSelection = false, onClick) {
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

    const retry = {
        id: 'retry',
        label: 'Retry',
        click: onClick
    };

    const separator = {
        type: 'separator'
    };

    const cut = {
        label: 'Cut',
        role: 'cut',
        enabled: hasSelection
    };

    const copy = {
        label: 'Copy',
        role: 'copy',
        enabled: hasSelection
    };

    const paste = {
        label: 'Paste',
        role: 'paste'
    };

    switch (menuId) {
        case 'downloadConnecting':
            return Menu.buildFromTemplate([openInBrowser]);
        case 'downloadQueued':
            return Menu.buildFromTemplate([removeFromList, separator, openInBrowser]);
        case 'downloadError':
        case 'downloadCancelled':
            return Menu.buildFromTemplate([retry, removeFromList, separator, openInBrowser]);
        case 'downloadInProgress':
            return Menu.buildFromTemplate([showInFolder, cancel, separator, openInBrowser]);
        case 'downloadComplete':
            return Menu.buildFromTemplate([open, showInFolder, removeFromList, separator, openInBrowser]);
        case 'input':
            return Menu.buildFromTemplate([cut, copy, paste]);
        default:
            return null;
    };
}

module.exports = createMenu;
