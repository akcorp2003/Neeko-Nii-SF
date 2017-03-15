const fs = require('fs')
const exec = require('child_process').exec
const path = require('path')
const readline = require('readline')
const dialog = require('electron').remote.dialog

const configurationLoader = require('./loadConfiguration')
const panelDisplayer = require('./panelDisplayer')
const octiconHandler = require('./octiconHandler')

exports.createFeature = (featureName) => {
    //first pull from develop
    var filepath = configurationLoader.getRepoFilePath()
    if( filepath ) {
        console.log('running git flow procedures')
        document.getElementById("gitOutput").innerHTML = ""
        if( configurationLoader.cacheHasBranchName("feature/" + featureName) || configurationLoader.cacheHasBranchName("release/" + featureName) ||
            configurationLoader.cacheBranchNames("HOTFIX/" + featureName) || configurationLoader.cacheBranchNames(featureName) ) {
            dialog.showMessageBox({
                type: "error",
                buttons: ["OK"],
                title: "Branch name already exists!",
                message: "You already have a branch named " + featureName + ". If you don't see it, it's probably a remote branch."
            })
        } else {
            runGitFlowProcedures(filepath, featureName)
        }
    } else {
        while( true ) {
            filepath = configurationLoader.getRepoFilePath()
            if ( filepath ) {
                break
            }
        }

        if( configurationLoader.cacheHasBranchName(featureName) ) {
            console.log(featureName)
            console.log('feature already there!')
        } else {
            runGitFlowProcedures(filepath, featureName)
        }     
    }
}

function runGitFlowProcedures( repoPath, featureName ) {
    exec('git checkout develop', {
        cwd: repoPath
    }, (err, stdout, stderr) => {
        displayOutputToPanel('Running git checkout develop')
        displayOutputToPanel(stdout)
        displayOutputToPanel(stderr)
        exec('git pull', {
            cwd: repoPath
        }, (err, stdout, stderr) => {
            displayOutputToPanel('Running git pull')

            displayOutputToPanel(stdout)
            displayOutputToPanel(stderr)

            exec('git checkout -b feature/' + featureName + ' develop', {
                cwd: repoPath
            }, (err, stdout, stderr) => {
                displayOutputToPanel('Running git checkout -b feature/' + featureName + ' develop. i.e. Just creating a feature branch')
                displayOutputToPanel(stdout)
                displayOutputToPanel(stderr)
                displayOutputToPanel('If there are no error messages above, congrats! \nYou can develop now on the feature/' + featureName + ' branch!')

                var featureOutputPanel = document.getElementById("featurePanel")
                
                var existingNextStepBtn = document.getElementById("nextStepBtn")
                if( existingNextStepBtn != null ) {
                    featureOutputPanel.removeChild(existingNextStepBtn)
                }

                var nextStepButton = document.createElement("button")
                nextStepButton.className += "slds-button slds-button--brand slds-align--absolute-center"
                nextStepButton.innerHTML += "NEXT STEP!"
                nextStepButton.setAttribute("id", "nextStepBtn")

                nextStepButton.addEventListener("click", function () {
                    panelDisplayer.hideFeatureCreationPanel()
                    panelDisplayer.showMainPanel()
                    octiconHandler.clickOcticon("gitcommit")
                })


                featureOutputPanel.appendChild(nextStepButton)

            })       
        })
    })

}

function displayOutputToPanel (line ) {

    var gitPanel = document.getElementById("gitOutput")
    gitPanel.innerHTML += line + "\n"
}