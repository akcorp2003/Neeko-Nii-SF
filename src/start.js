const fs = require('fs')
const exec = require('child_process').exec
const os = require('os')
const electron = require('electron')

const { ipcRenderer: ipc } = electron

const dialog = require('electron').remote.dialog

const configurationLoader = require('./loadConfiguration')
const buildExecutor = require('./buildExecutor')
const featureCreator = require('./featureCreator')
const featureCompleter = require('./featureCompleter')
const panelDisplayer = require('./panelDisplayer')
const circleHandler = require('./circleHandler')

const defaultCircleColor = "#2b8cbe"
const selectedCircleColor = "#a8ddb5" 

var interval = null
var cacheBranchNamesInterval = null
let branchNameTimer

window.addEventListener('DOMContentLoaded', _ => {
    console.log(__dirname)
    configurationLoader.populateMainWindow()

    var buildButton = document.getElementById("buildBtn")
    buildButton.addEventListener("click", function () {
        buildExecutor.runBuildProcess(this, ( workingBuildDirectory ) => {
            console.log('inside the callback: ' + workingBuildDirectory)

            buildExecutor.executeNETCoreSFBuild(workingBuildDirectory, function executeAnt ( workingAntDirectory ) {
                buildExecutor.executeAnt(workingAntDirectory)
            })
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

    circleHandler.setCirclesOnSideBar()

    configurationLoader.setBuildBar()
    

    interval = setInterval( function() { configurationLoader.findDirtyFiles() }, 5000 )
    cacheBranchNamesInterval = setInterval( function() { configurationLoader.cacheBranchNames() }, 1000)
})

exports.resetDirtyFilesInterval = _ => {
    clearInterval(interval)
}

exports.startDirtyFilesInterval = _ => {
    interval = setInterval( function() { configurationLoader.findDirtyFiles() }, 5000 )
}

exports.resetCacheBranchNamesInterval = _ => {
    clearInterval(cacheBranchNamesInterval)
}

window.setInterval( function() { configurationLoader.updateTitle() }, 5000)

ipc.on('settings-closed', (evt) => {
    configurationLoader.populateMainWindow()
    configurationLoader.setBuildBar()
})