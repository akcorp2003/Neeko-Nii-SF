const fs = require('fs')
const spawn = require('child_process').spawn
const exec = require('child_process').exec
const electron = require('electron')
const path = require('path')
const rimraf = require('rimraf')
const os = require('os')

const { ipcRenderer: ipc } = electron
const remote = require('electron').remote
const dialog = require('electron').remote.dialog

const configurationLoader = require('./loadConfiguration')
const starter = require('./start')

const NETCoreFolder = "sf-build"
const NETCoreDLLName = "sfbuild.dll"
const returnButtonID = "returnButton"

var sfbuildDotNet
var antMigrationTool

exports.runBuildProcess = (button, buildWindow, document, done) => {
    var branchName = document.getElementById("branchName").innerText.replace("Current branch: ", "").replace(/(\r\n|\n|\r)/gm,"")
    var listOfFiles = document.getElementById("fileListPanel")
    var filesToBuildIntoManifest = Array.from(listOfFiles.childNodes)
        .filter( function (fileItem) {
            return fileItem.classList.contains("selectedFile")
        })
        .map( function(fileItem) {
            var classesWithFilePath = fileItem.getElementsByClassName("fullFilePath")
            console.log('extracted this: ' + classesWithFilePath[0].innerText)
            return classesWithFilePath[0].innerText
        })

    buildWindow.webContents.send('update-manifest-stage')
    if( filesToBuildIntoManifest.length === 0 ) {
        dialog.showMessageBox({
            type: "warning",
            buttons: ["Yes", "No"],
            title: "Empty Manifest!",
            message: "You currently don't have any files in the manifest. \n\nAre you sure you want to continue with the build?"},
            ( function (response) {
                if( response === 0 ) {
                    executeBuild(filesToBuildIntoManifest, button, branchName, buildWindow, done)
                } else {
                    buildWindow.destroy()
                    return
                }
            })
        )
    } else {
        executeBuild(filesToBuildIntoManifest, button, branchName, buildWindow, done)
    }
}

function executeBuild(filesToBuildIntoManifest, button, branchName, buildWindow, done) {
    var workspacePath = configurationLoader.getWorkspaceFilePath()
    console.log('WORKSPACE PATH: ' + workspacePath)
    var directoryName = path.join(workspacePath, button.innerText.toLowerCase() + "_" + branchName.replace(/\//g, "_"))
    if(!fs.existsSync(directoryName)){

        fs.mkdirSync(directoryName)
        buildWindow.webContents.send('update-text-status', 'Writing manifest...')
        writeManifest(directoryName, filesToBuildIntoManifest)
        buildWindow.webContents.send('update-manifest-stage')
        done(directoryName)

    } else {
        dialog.showMessageBox({ 
            type: "warning", 
            buttons: ["Yes", "No"], 
            title: "Deployment Folder Exists!", 
            message: "You previously built a deployment for this branch. It is in " + directoryName + ". \n\nClicking Yes will DELETE the folder and its contents. \n\nClicking No will stop this build and leave your folder intact. "},
            ( function (response) {
                if( response === 0 ) {

                    rimraf(directoryName, function() {
                        fs.mkdirSync(directoryName)
                        buildWindow.webContents.send('update-text-status', 'Writing manifest...')
                        writeManifest(directoryName, filesToBuildIntoManifest)
                        buildWindow.webContents.send('update-manifest-stage')
                        done(directoryName)
                    })

                } else {
                    buildWindow.destroy()
                    return
                }
            })
            
        )
    }
}

exports.executeNETCoreSFBuild = ( workingDirectory, buildWindow, document, done ) => {
    buildWindow.webContents.send('update-text-status', 'Packaging files...')
    buildWindow.webContents.send('update-packaging-stage')

    var workspaceFolderPath = configurationLoader.getWorkspaceFilePath()
    var sfBuildExecutionPath = path.join(workspaceFolderPath, NETCoreFolder, NETCoreDLLName)
    console.log('execution path: ' + sfBuildExecutionPath)
    console.log('working directory: ' + workingDirectory)

    sfbuildDotNet = spawn('dotnet',  [sfBuildExecutionPath], {
        cwd: workingDirectory
    })

    sfbuildDotNet.stdout.on('data', function(data) {
        buildWindow.webContents.send('update-stdout-panel', data)
    })

    sfbuildDotNet.stderr.on('data', function(data) {
        console.log(data.toString())
    })

    sfbuildDotNet.on('exit', function(code) {
        console.log('child process exited with: ' + code.toString())
        buildWindow.webContents.send('update-packaging-stage')
        done(workingDirectory)
    })

    sfbuildDotNet.on('error', (err) => {
        dialog.showMessageBox({
            title: ".NET Core Not Installed?",
            type: "error",
            buttons: ["OK"],
            message: "I think you didn\'t install .NET Core. Please install it."
        }, _ => {
            console.log(err)
            buildWindow.webContents.send('rollback-stages')
            return
        })
    })
}

exports.executeAnt = ( workingDirectory, buildEnvironment, buildWindow, document ) => {

    //only supporting one environment deployment at the moment
    console.log('Environment selected: ' + buildEnvironment)

    var failed = 0

    buildWindow.webContents.send('update-ant-stage')
    buildWindow.webContents.send('update-text-status', 'Running ant deploy_' + buildEnvironment.toLowerCase())

    antMigrationTool = spawn('ant', ["deploy_" + buildEnvironment.toLowerCase()], {
        cwd: workingDirectory
    })

    antMigrationTool.stdout.on('data', function(data) {
        if(data.includes("Request for a deploy submitted successfully")) {
            //indicates the server likes us
            buildWindow.webContents.send('update-ant-stage')
            buildWindow.webContents.send('update-deploy-stage')
        }

        if(data.includes("failed") || data.includes("fail") || data.includes("FAILED") || data.includes("Failed")) {
            console.log('FAILED!! FAILED!! FAILED!!')
            failed = 1
        }
        buildWindow.webContents.send('update-stdout-panel', data)
    })

    antMigrationTool.stderr.on('data', function(data) {
        buildWindow.webContents.send('update-stdout-panel', data.toString())
    })

    antMigrationTool.on('exit', function(code) {
        console.log('child process exited with: ' + code.toString())
        if( failed === 1 ) {
            dialog.showMessageBox({
                title: "Error",
                type: "info",
                buttons: ["OK"],
                message: "Oh noes! Something went wrong! Click 'Show More' to see what happened. \n\n Close the build window after you're done."
            }, _ => {
                starter.startDirtyFilesInterval()
                buildWindow.webContents.send('update-text-status', 'Error...')
                buildWindow.webContents.send('failed')
            })

        } else {
            dialog.showMessageBox({
                title: "Completed",
                type: "info",
                buttons: ["OK"],
                message: "Yay! Everything went well. \n\n For a sanity check, click 'Show More' just to be sure I deployed your items."
            }, _ => {
                starter.startDirtyFilesInterval()
                buildWindow.webContents.send('update-deploy-stage')
                buildWindow.webContents.send('update-text-status', 'Completed!')
                buildWindow.webContents.send('all-complete')
            })
        }
        
    })

    antMigrationTool.on('error', (err) => {
        dialog.showMessageBox({
            title: "Ant Not In Path?",
            type: "error",
            buttons: ["OK"],
            message: "I think you don\'t have Ant in your PATH. Please add it."
        }, _ => {
            buildWindow.webContents.send('rollback-stages')
            return
        })
    })
}

function disableButton ( button ) {
    //neutralize button
    if(button.classList.contains("slds-button--success")) {
        button.classList.remove("slds-button--success")
    }
    button.classList.add("slds-button--neutral")
    var disabledState = document.createAttribute("disabled")
    disabledState.value = ""
    button.setAttributeNode(disabledState)
}

function showBuildPanel () {
    clearStdoutPanel()

    var mainPanel = document.getElementById("mainPanel")
    var buildPanel = document.getElementById("buildPanel")

    if( !mainPanel.classList.contains("slds-hide") ) {
        mainPanel.classList.add("slds-hide")
    }

    if( buildPanel.classList.contains("slds-hide") ) {
        buildPanel.classList.remove("slds-hide")
    }
}

function clearStdoutPanel() {
    var stdoutPanel = document.getElementById("stdoutPanel")
    while(stdoutPanel.hasChildNodes()) {
        stdoutPanel.removeChild(stdoutPanel.lastChild)
    }
}

function returnInterfaceToStartup() {
    var mainPanel = document.getElementById("mainPanel")
    var buildPanel = document.getElementById("buildPanel")

    if( mainPanel.classList.contains("slds-hide") ) {
        mainPanel.classList.remove("slds-hide")
    }

    if( !buildPanel.classList.contains("slds-hide") ) {
        buildPanel.classList.add("slds-hide")
    }
}

function reenableBuildButton () {
    var buildButton = document.getElementById("buildBtn")
    if( !buildButton.classList.contains("slds-button--success") ) {
        buildButton.classList.add("slds-button--success")
        buildButton.removeAttribute("disabled")
    }
}

function writeManifest( parentDirectoryToManifest, filesToAddIntoManifest ) {
    var file = fs.createWriteStream(path.join(parentDirectoryToManifest, "manifest.txt"))
    file.on('error', function (err) {
        //yeah, error handling is not so cool 
        console.log(err)
        return
    })
    filesToAddIntoManifest.forEach( function ( line ) {
        console.log('writing line: ' + line)
        file.write(line + '\n')
    })

    file.end()
}

exports.killAllBuildProcesses = _ => {
    sfbuildDotNet.stdout.pause()
    sfbuildDotNet.kill('SIGINT')
    antMigrationTool.stdout.pause()
    antMigrationTool.kill('SIGINT')
}