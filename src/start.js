const fs = require('fs')
const exec = require('child_process').exec
const os = require('os')
const electron = require('electron')

const { ipcRenderer: ipc } = electron


const dialog = require('electron').remote.dialog
const BrowserWindow = require('electron').remote.BrowserWindow

const configurationLoader = require('./loadConfiguration')
const featureCreator = require('./featureCreator')
const buildExecutor = require('./buildExecutor')
const featureCompleter = require('./featureCompleter')
const panelDisplayer = require('./panelDisplayer')
const octiconHandler = require('./octiconHandler')
const menuIconHandler = require('./menuIcon')
const fileCommiter = require('./fileCommiter')

const defaultCircleColor = "#2b8cbe"
const selectedCircleColor = "#a8ddb5" 

var dirtyFilesInterval = null

var cacheBranchNamesInterval = null
let branchNameTimer
var buildWindows = []

var btnEnvironmentToWindowID = {}

window.addEventListener('DOMContentLoaded', _ => {
    console.log(__dirname)

    configurationLoader.populateMainWindow()

    var createFeatureButton = document.getElementById("createFeature")
    createFeatureButton.addEventListener("click", function onClick() {
        var branchName = document.getElementById("branch-name").value.replace(/ /g, "_" )
        console.log(branchName)
        if( branchName ) {
            featureCreator.createFeature(branchName)
        } else {
            dialog.showMessageBox({
                type: "error",
                buttons: ["OK"],
                title: "No Feature Branch Name",
                message: "Please enter a name for your feature"
            })
        }
    })

    var commitButton = document.getElementById("commitBtn")
    commitButton.addEventListener("click", function() {
        fileCommiter.commitFiles(document)
    })

    var buildButton = document.getElementById("buildBtn")
    buildButton.addEventListener("click", function () {
        module.exports.resetDirtyFilesInterval()

        var buttonList = document.getElementById("buttonStrip")
        Array.from(buttonList.children)
        .filter(function (button) {
            return button.classList.contains("slds-button--brand")
        })
        .forEach(function (selectedButton) {
            let buildWindow = new BrowserWindow({
                                                    width: 873,
                                                    height: 203,
                                                    resizeable: false
                                                })

            buildWindow.loadURL(`file://${__dirname}/buildScreen.html`)

            buildWindow.on('close', _ => {
                //buildWindow = null
                buildExecutor.killAllBuildProcesses()
                console.log('I closed')
            })

            buildWindow.toggleDevTools()

            console.log(selectedButton.innerText.toLowerCase())

            btnEnvironmentToWindowID[selectedButton.innerText.toLowerCase()] = buildWindow.id

            buildWindow.webContents.on('did-finish-load', () => {
                buildWindow.webContents.send('set-env-name', selectedButton.innerText)
                buildExecutor.runBuildProcess(selectedButton, buildWindow, document, ( workingBuildDirectory ) => {
                    console.log('inside the callback: ' + workingBuildDirectory)

                    buildExecutor.executeNETCoreSFBuild(workingBuildDirectory, buildWindow, document, function executeAnt ( workingAntDirectory ) {
                        buildExecutor.executeAnt(workingAntDirectory, selectedButton.innerText, buildWindow, document)
                    })
                })
            })

            buildWindows.push(buildWindow)
        })
        
    })

    var myEnvButton = document.getElementById("myEnvBtn")
    myEnvButton.addEventListener("click", function () {
        if(this.classList.contains("slds-button--brand")) {
            this.classList.remove("slds-button--brand")
            this.classList.add("slds-button--neutral")
        } else {
            this.classList.remove("slds-button--neutral")
            this.classList.add("slds-button--brand")
        }
    })

    var menuIcon = document.getElementById("menu")
    menuIcon.onclick = function () {
        console.log('menu icon clicked!')
        menuIconHandler.openOrCloseMenu(document)
    }

    var finishFeatureButton = document.getElementById("finishFeature")
    finishFeatureButton.addEventListener("click", function onClick() {
        featureCompleter.completeFeature()
    })

    var checkForDuplicateBranchName = document.getElementById("branch-name")
    checkForDuplicateBranchName.addEventListener('keyup', evt => {
        clearTimeout(branchNameTimer)
        branchNameTimer = setTimeout( _ => {
            console.log('Captured text: ' + evt.target.value)
            var featureInput = document.getElementById("featureNameInput")
            if( configurationLoader.cacheHasBranchName("feature/" + evt.target.value) || configurationLoader.cacheHasBranchName("release/" + evt.target.value) ||
                configurationLoader.cacheBranchNames("HOTFIX/" + evt.target.value) || configurationLoader.cacheBranchNames(evt.target.value)) {
                console.log('feature input: ' + featureInput)
                featureInput.classList.add("slds-has-error")
                var error = document.createElement("div")
                error.setAttribute("id", "feature-branch-error-message")
                error.classList.add("slds-form-element__help")
                error.innerText += "This branch name already exists."

                featureInput.appendChild(error)
            } else {
                featureInput.classList.remove("slds-has-error")
                var error = document.getElementById("feature-branch-error-message")
                if( error != null) {
                    featureInput.removeChild(error)
                }  
            }
        }, 500)
    })

    octiconHandler.setOcticonsOnSidebar()

    configurationLoader.setBuildStrip()

    

    dirtyFilesInterval = setInterval( function() { configurationLoader.findDirtyFiles() }, 5000 )
    cacheBranchNamesInterval = setInterval( function() { configurationLoader.cacheBranchNames() }, 1000)
})

exports.resetDirtyFilesInterval = _ => {
    clearInterval(dirtyFilesInterval)
}

exports.startDirtyFilesInterval = _ => {
    dirtyFilesInterval = setInterval( function() { configurationLoader.findDirtyFiles() }, 5000 )
}

exports.resetCacheBranchNamesInterval = _ => {
    clearInterval(cacheBranchNamesInterval)
}

window.setInterval( function() { configurationLoader.updateTitle() }, 5000)

ipc.on('settings-closed', (evt) => {
    configurationLoader.populateMainWindow()
    configurationLoader.setBuildStrip()
})