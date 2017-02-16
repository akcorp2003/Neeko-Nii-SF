const fs = require('fs')
const spawn = require('child_process').spawn
const exec = require('child_process').exec
const electron = require('electron')
const path = require('path')
const rimraf = require('rimraf')
const os = require('os')


const { ipcRenderer: ipc } = electron
const dialog = require('electron').remote.dialog

const configurationLoader = require('./loadConfiguration')
const starter = require('./start')

const NETCoreFolder = "sf-build"
const NETCoreDLLName = "sfbuild.dll"
const returnButtonID = "returnButton"

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

exports.runBuildProcess = (button, done) => {
    disableButton(button)

    showBuildPanel()

    var branchName = document.getElementById("programName").innerText.replace("Current branch: ", "").replace(/(\r\n|\n|\r)/gm,"")
    
    starter.resetDirtyFilesInterval()

    var listOfFiles = document.getElementById("fileListPanel")
    var filesToBuildIntoManifest = Array.from(listOfFiles.childNodes).map( function(paragraphElement) {
        return paragraphElement.innerText
    })

    var directoryName = path.join(__dirname, '..', branchName.replace(/\//g, "_"))
    if(!fs.existsSync(directoryName)){
        fs.mkdirSync(directoryName)
        writeManifest(directoryName, filesToBuildIntoManifest)
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
                        console.log('recreating the branch directory...')
                        fs.mkdirSync(directoryName)
                        writeManifest(directoryName, filesToBuildIntoManifest)
                        done(directoryName)
                    })
                } else {
                    reenableBuildButton()
                    returnInterfaceToStartup()
                    starter.startDirtyFilesInterval()
                    return
                }
            })
            
        )
    }
}

exports.executeNETCoreSFBuild = ( workingDirectory, done ) => {
    var sfBuildExecutionPath = path.join("..", NETCoreFolder, NETCoreDLLName)
    console.log('execution path: ' + sfBuildExecutionPath)
    console.log('workign directory: ' + workingDirectory)
    //if(fs.existsSync())
    var sfbuildDotNet = spawn('dotnet',  [sfBuildExecutionPath], {
        cwd: workingDirectory
    })

    sfbuildDotNet.stdout.on('data', function(data) {
        var outputPanel = document.getElementById("stdoutPanel")
        var paragraph = document.createElement("p")
        var stdoutput = document.createTextNode(data)
        paragraph.appendChild(stdoutput)

        outputPanel.appendChild(paragraph)
    
    })

    sfbuildDotNet.stderr.on('data', function(data) {
        console.log(data.toString())
    })

    sfbuildDotNet.on('exit', function(code) {
        console.log('child process exited with: ' + code.toString())
        reenableBuildButton()
        done(workingDirectory)
    })

    sfbuildDotNet.on('error', (err) => {
        dialog.showMessageBox({
            title: ".NET Core Not Installed?",
            type: "error",
            buttons: ["OK"],
            message: "I think you didn\'t install .NET Core. Please install it."
        }, _ => {
            reenableBuildButton()
            return
        })
    })
}

exports.executeAnt = ( workingDirectory ) => {
    console.log('Ant directory: ' + workingDirectory)

    //grab the selected environment
    var buildBarChildren = document.getElementById("buildBar").childNodes
    //console.log(Array.from(buildBarChildren))
    var array = Array.from(buildBarChildren)
    var selectedEnvironments = Array.from(buildBarChildren).filter( function ( button ) {
        if( button.nodeType !== Node.TEXT_NODE ) {
            return button.classList.contains("slds-button--brand")
        } else {
            return false
        }   
    }).map( function ( selectedButton ) {
        if( selectedButton != null ) {
            return selectedButton.innerHTML.trim().toLowerCase().replace(/(\r\n|\n|\r)/gm,"")
        }
    })

    //only supporting one environment deployment at the moment

    var antMigrationTool = spawn('ant', ["deploy_" + selectedEnvironments[0]], {
        cwd: workingDirectory
    })

    antMigrationTool.stdout.on('data', function(data) {
        var outputPanel = document.getElementById("stdoutPanel")
        var paragraph = document.createElement("p")
        var stdoutput = document.createTextNode(data)
        paragraph.appendChild(stdoutput)

        outputPanel.appendChild(paragraph)
    })

    antMigrationTool.stderr.on('data', function(data) {
        console.log(data.toString())
    })

    antMigrationTool.on('exit', function(code) {
        console.log('child process exited with: ' + code.toString())
        dialog.showMessageBox({
            title: "Completed",
            type: "info",
            buttons: ["OK"],
            message: "Please check the side panel to see if your deployment succeeded."
        }, _ => {
            var outputPanel = document.getElementById("stdoutPanel")
            var backButton = document.createElement("button")
            backButton.className += "slds-button slds-button--neutral"
            backButton.innerHTML += "BACK"

            backButton.addEventListener("click", function onClick() {
                returnInterfaceToStartup()
            })
            var paddingParagraph = document.createElement("br")
            outputPanel.appendChild(paddingParagraph)
            outputPanel.appendChild(backButton)

            starter.startDirtyFilesInterval()
        })
    })

    antMigrationTool.on('error', (err) => {
        dialog.showMessageBox({
            title: "Ant Not In Path?",
            type: "error",
            buttons: ["OK"],
            message: "I think you don\'t have Ant in your PATH. Please add it."
        }, _ => {
            return
        })
    })
}