const electron = require('electron')
const {remote, ipcRenderer } = electron

//const buildExecutor = require('./buildExecutor')

window.addEventListener('DOMContentLoaded', _ => {
    console.log('hello!')
    var showMoreButton = document.getElementById("expandArrow")
    showMoreButton.addEventListener("click", function onClick() {
        document.getElementById("stdoutPanel").classList.toggle("slds-hide")
    })
})

ipcRenderer.on('set-env-name', (event, buttonName) => {
    document.getElementById("envName").innerText = buttonName
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
    document.getElementById("completedSign").classList.toggle("slds-hide")
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