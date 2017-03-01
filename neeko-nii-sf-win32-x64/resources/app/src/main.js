const electron = require('electron')
const fixPath = require('fix-path')
const { app, BrowserWindow, ipcMain: ipc, Menu } = electron

const menuTemplate = require('./menu')

let mainWindow = null

app.on('ready', _ => {
    if(process.platform === 'darwin') {
        fixPath()
    }
    

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

    const menuContents = Menu.buildFromTemplate(menuTemplate(mainWindow))
    Menu.setApplicationMenu(menuContents)

})