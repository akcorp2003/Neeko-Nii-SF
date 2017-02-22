exports.showFeatureCreationPanel = _ => {
    document.getElementById("featurePanel").classList.remove("slds-hide")
    document.getElementById("featureFooter").classList.remove("slds-hide")
}

exports.hideFeatureCreationPanel = _ => {
    document.getElementById("featurePanel").classList.add("slds-hide")
    document.getElementById("featureFooter").classList.add("slds-hide")
}

exports.showMainPanel = _ => {
    document.getElementById("mainPanel").classList.remove("slds-hide")
    document.getElementById("branchName").classList.remove("slds-hide")
}

exports.hideMainPanel = _ => {
    document.getElementById("mainPanel").classList.add("slds-hide")
    document.getElementById("branchName").classList.add("slds-hide")
}

exports.showBuildPanel = _ => {
    clearStdoutPanel()
    document.getElementById("buildPanel").classList.remove("slds-hide")
    document.getElementById("branchName").classList.remove("slds-hide")
}

exports.hideBuildPanel = _ => {
    document.getElementById("buildPanel").classList.add("slds-hide")
}

exports.showFinishFeaturePanel = _ => {
    document.getElementById("finishFeaturePanel").classList.remove("slds-hide")
    document.getElementById("featureFooter").classList.add("slds-hide")
    document.getElementById("branchName").classList.remove("slds-hide")
}

exports.hideFinishFeaturePanel = _ => {
    document.getElementById("finishFeaturePanel").classList.add("slds-hide")
    document.getElementById("branchName").classList.add("slds-hide")
}

function clearStdoutPanel() {
    var stdoutPanel = document.getElementById("stdoutPanel")
    while(stdoutPanel.hasChildNodes()) {
        stdoutPanel.removeChild(stdoutPanel.lastChild)
    }
}