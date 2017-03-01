const electron = require('electron')

const { app, BrowserWindow } = electron

let settingsWindow = null

module.exports = mainWindow => {
    const name = app.getName()
    const template = [
        {
            label: "File",
            submenu: [
                {
                    label: 'Path Settings',
                    click: _ => {
                        settingsWindow = new BrowserWindow({
                                            width: 473,
                                            height: 363,
                                            resizeable: false
                                        })
                        settingsWindow.loadURL(`file://${__dirname}/Settings.html`)

                        settingsWindow.on('close', _ => {
                            mainWindow.webContents.send('settings-closed')
                            settingsWindow = null
                        })
                    }
                },
                {
                    label: 'Quit',
                    accelerator: 'Command+Q',
                    click: _ => { app.quit()}
                }
            ]
        }
    ]

    if( process.platform === 'darwin' ) {
        template.unshift({
            label: name,
            submenu: [
                {
                    label: 'About ' + name,
                    role: 'about'
                },
                { type: 'separator' },
                {
                    label: 'Quit',
                    accelerator: 'Command+Q',
                    click: _ => { app.quit()}
                }
            ]
        })
    }

    return template
}