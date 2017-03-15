const electron = require('electron')
const { ipcRenderer } = electron

const remote = require('electron').remote

const dialog = require('electron').remote.dialog

window.addEventListener('DOMContentLoaded', _ => {
    var showMoreButton = document.getElementById("expandArrow")
    showMoreButton.addEventListener("click", function onClick() {
        document.getElementById("stdoutPanel").classList.toggle("slds-hide")
        this.classList.toggle("transform90Degs")

        var buildWindow = remote.getCurrentWindow()
        console.log(buildWindow)

        if( this.classList.contains("transform90Degs") ) {
            buildWindow.setSize(873, 473, true)
        } else {
            buildWindow.setSize(873, 203, true)
        }
    })

    var abortButton = document.getElementById("abort")
    abortButton.addEventListener("click", function onClick() {
        console.log("clicked!")
        ipcRenderer.send("abort", "yolo")
    })
})

ipcRenderer.on('set-env-name', (event, buttonName) => {
    document.getElementById("envName").innerText = "Environment: " + buttonName
})

ipcRenderer.on('update-text-status', (event, message) => {
    document.getElementById("currentStatus").innerText = message
})

ipcRenderer.on('update-manifest-stage', (event) => {
    var manifestStage = document.getElementById("manifestStage")
    updateStageElement(manifestStage)
})

ipcRenderer.on('update-packaging-stage', (event) => {
    var packagingStage = document.getElementById("packagingFilesStage")
    updateStageElement(packagingStage)
})

ipcRenderer.on('update-ant-stage', (event) => {
    var antStage = document.getElementById("antStage")
    updateStageElement(antStage)
})

ipcRenderer.on('update-deploy-stage', (event) => {
    var deployStage = document.getElementById("deployingStage")
    updateStageElement(deployStage)
})

ipcRenderer.on('update-stdout-panel', (event, message) => {
    var outputPanel = document.getElementById("stdoutPanel")
    var paragraph = document.createElement("p")
    var stdoutput = document.createTextNode(message)
    paragraph.appendChild(stdoutput)

    outputPanel.appendChild(paragraph)
})

ipcRenderer.on('all-complete', (event) => {
    var completedStage = document.getElementById("completed")
    updateStageElement(completedStage)
    updateStageElement(completedStage)
})

ipcRenderer.on('failed', (event) => {
    var failedStage = document.getElementById("deployingStage")
    errorElement(failedStage)
})

ipcRenderer.on('rollback-stages', (event) => {
    var stages = document.getElementById("progressItems")
    Array.from(stages.children)
    .forEach( function resetStage (stage) {
        stage.classList.remove("slds-is-current")
        stage.classList.remove("slds-is-complete")
        stage.classList.add("slds-is-incomplete")
    })
})

ipcRenderer.on('activate-abort-button', (event) => {
    console.log('caught!')
    var abortButton = document.getElementById("abort")
    abortButton.removeAttribute("disabled")
})

function updateStageElement( element ) {
    if( element.classList.contains("slds-is-incomplete") ) {
        element.classList.remove("slds-is-incomplete")
        element.classList.add("slds-is-current")
    } else {
        element.classList.remove("slds-is-current")
        element.classList.add("slds-is-complete")
    }  
}

function errorElement( element ) {
    element.classList.remove("slds-is-incomplete")
    element.classList.remove("slds-is-current")
    element.classList.add("slds-is-lost")
}