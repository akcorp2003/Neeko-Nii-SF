const fs = require('fs')
const exec = require('child_process').exec
const dialog = require('electron').remote.dialog

const configuration = require('./loadConfiguration')

const developBranch = "develop"

exports.completeFeature = _ => {
    var currentBranchName = configuration.getCurrentBranchName()
    console.log('current branch name: ' + currentBranchName)

    if( currentBranchName ) {
        if( currentBranchName.localeCompare(developBranch) === 0 ) {
            dialog.showMessageBox({
                type: "error",
                buttons: ["OK"],
                title: "You're On Develop Branch!",
                message: "You are currently on the develop branch. \n\nPlease switch to a feature branch to continue with the git flow process."
            })
        }
        else {
            runCompleteFeature(currentBranchName)
        }
    } else {
        //retry until we get some branch name
        setTimeout( function getBranchName() { module.exports.completeFeature() }, 1000 )
    }
}

function runCompleteFeature( currentBranchName ) {
    var repoPath = configuration.getRepoFilePath()
    var featureOutputPanel = document.getElementById("finishFeatureOutputPanel")
    featureOutputPanel.innerHTML = ""

    exec('git push -u origin ' + currentBranchName, {
        cwd: repoPath
    }, (err, stdout, stderr) => {
        displayLineToOutput("Running git push -u origin " + currentBranchName)
        displayLineToOutput(stdout)
        displayLineToOutput(stderr)

        exec('git pull origin develop', {
            cwd: repoPath
        }, (err, stdout, stderr) => {
            displayLineToOutput("Running git pull origin develop as the first step in the git flow process.")
            displayLineToOutput(stdout)
            displayLineToOutput(stderr)

            exec('git checkout develop', {
                cwd: repoPath
            }, (err, stdout, stderr) => {
                displayLineToOutput("Checking out develop.")
                displayLineToOutput(stdout)
                displayLineToOutput(stderr)

                exec('git merge ' + currentBranchName, {
                    cwd: repoPath
                }, (err, stdout, stderr) => {
                    displayLineToOutput("Merging your feature branch " + currentBranchName + " with develop.")
                    displayLineToOutput(stdout)
                    displayLineToOutput(stderr)

                    exec('git push', {
                        cwd: repoPath
                    }, (err, stdout, stderr) => {
                        displayLineToOutput("Pushing your changes to the remote.")
                        displayLineToOutput(stdout)
                        displayLineToOutput(stderr)
                        displayLineToOutput("Alright! Make sure there are no errors in the error messages. I printed everything out so you should be able to see if something went wrong.")
                        displayLineToOutput("I left your feature branch " + currentBranchName + " intact. You can delete it by running \"git branch -d " + currentBranchName + "\"")
                    })
                })
            })
        })
    })
}

function displayLineToOutput(line) {
    var featureOutputPanel = document.getElementById("finishFeatureOutputPanel")
    featureOutputPanel.innerHTML += line + "\n"
}