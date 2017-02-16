const fs = require('fs')
const exec = require('child_process').exec
const os = require('os')
const electron = require('electron')

const configurationLoader = require('./loadConfiguration')
const buildExecutor = require('./buildExecutor')

var interval = null


window.addEventListener('DOMContentLoaded', _ => {
    console.log(__dirname)
    configurationLoader.loadRepoDirectory()

    var buildButton = document.getElementById("buildBtn")
    buildButton.addEventListener("click", function () {
        buildExecutor.runBuildProcess(this, ( workingBuildDirectory ) => {
            console.log('inside the callback: ' + workingBuildDirectory)

            buildExecutor.executeNETCoreSFBuild(workingBuildDirectory, function executeAnt ( workingAntDirectory ) {
                buildExecutor.executeAnt(workingAntDirectory)
            })
        })
    })

    var myButton = document.getElementById("myBtn")
    myButton.addEventListener("click", function () {
        if(this.classList.contains("slds-button--brand")) {
            this.classList.remove("slds-button--brand")
            this.classList.add("slds-button--neutral")
        } else {
            this.classList.remove("slds-button--neutral")
            this.classList.add("slds-button--brand")
        }
    })

    configurationLoader.setBuildBar()

    interval = setInterval( function() { configurationLoader.findDirtyFiles() }, 5000 )
})

exports.resetDirtyFilesInterval = _ => {
    console.log('stopped interval...hopefully')
    clearInterval(interval)
}

exports.startDirtyFilesInterval = _ => {
    interval = setInterval( function() { configurationLoader.findDirtyFiles() }, 5000 )
}

window.setInterval( function() { configurationLoader.updateTitle() }, 5000)