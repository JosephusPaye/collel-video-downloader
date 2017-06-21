const path = require('path');
const url = require('url');
const createMenu = require('./context-menus');
const { app, BrowserWindow, dialog, ipcMain, shell } = require('electron');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

/**
 * Create the main window
 */
function createWindow() {
    mainWindow = new BrowserWindow({
        autoHideMenuBar: true,
        height: 600,
        minHeight: 300,
        minWidth: 640,
        title: 'Video Downloader',
        width: 920
    });

    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true
    }));

    // Dereference the window object on close to allow for GC
    mainWindow.on('closed', function() {
        mainWindow = null
    });
}

// Create the main window when Electron is ready
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function() {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Create a new window if no windows are open the user clicks the dock icon.
app.on('activate', function() {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow();
    }
});

// Handle requests for a context menu from the renderer
ipcMain.on('show-context-menu', (event, options) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const menu = createMenu(options.menuId, (menuItem) => {
        event.sender.send('context-menu-item-selected', {
            selectedOptionId: menuItem.id,
            downloadId: options.downloadId
        });
    });

    if (menu !== null) {
        menu.popup(win);
    }
});

// Show the warning message for invalid paths passed to shell.openItem()/shell.showItemInFolder()
function showMovedItemWarning() {
    dialog.showMessageBox({
        type: 'warning',
        title: 'Unable to open',
        detail: 'Unable to open the item as its file has been moved, renamed or deleted.'
    });
}

// Handling this here because calling shell.showItemInFolder() in the renderer doesn't
// bring the new application to the foreground after opening the item.
// See: https://github.com/electron/electron/issues/4349#issuecomment-256365499
ipcMain.on('open-item', (event, path) => {
    if (!shell.openItem(path)) {
        showMovedItemWarning();
    };
});

// Same as above
ipcMain.on('show-item-in-folder', (event, path) => {
    if (!shell.showItemInFolder(path)) {
        showMovedItemWarning();
    }
});

// Same as above
ipcMain.on('open-external', (event, path) => {
    shell.openExternal(path);
});
