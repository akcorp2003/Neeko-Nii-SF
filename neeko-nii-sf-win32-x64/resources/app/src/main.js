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
        width: 1045,
        height: 825,
        resizeable: false
    })

    mainWindow.loadURL(`file://${__dirname}/Ana-main.html`)

    mainWindow.on('close', _ => {
        mainWindow = null
    })

    const menuContents = Menu.buildFromTemplate(menuTemplate(mainWindow))
    Menu.setApplicationMenu(menuContents)

})

app.on('window-all-closed', app.quit)