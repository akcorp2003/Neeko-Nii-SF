const electron = require('electron')

const { app, BrowserWindow, ipcMain: ipc, Menu } = electron

let mainWindow = null

app.on('ready', _ => {
    mainWindow = new BrowserWindow({
        width: 945,
        height: 725,
        resizeable: false
    })

    mainWindow.loadURL(`file://${__dirname}/neeko-main.html`)

    mainWindow.toggleDevTools()

    mainWindow.on('close', _ => {
        mainWindow = null
    })
})

ipc.on('build-process-started', (evt, param) => {
    console.log('caught build process start!')
})