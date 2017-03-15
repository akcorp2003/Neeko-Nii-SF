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

//this entire chain will need to be modernized
//check these stackoverflow links: http://stackoverflow.com/questions/42568238/node-js-exit-out-of-exec-after-continuous-commands/42583040#42583040
//and http://stackoverflow.com/questions/32559822/how-to-stop-executing-waterfall-on-error-in-async-of-node-js
function runCompleteFeature( currentBranchName ) {
    var repoPath = configuration.getRepoFilePath()
    var featureOutputPanel = document.getElementById("finishFeatureOutputPanel")
    featureOutputPanel.innerHTML = ""

    updateCurrentBranch(currentBranchName, repoPath)
}

function updateCurrentBranch(currentBranchName, repoPath) {
    exec('git pull', {
        cwd: repoPath
    }, (err, stdout, stderr) => {
        displayLineToOutput("Running git pull")
        displayLineToOutput(stdout)
        displayLineToOutput(stderr)

        if( err != null ) {
            dialog.showMessageBox({
                type: "error",
                buttons: ["OK"],
                title: "Error on Pull!",
                message: "Whoops! There's a pull error." + '\n\n' + "Common causes could be merge conflicts or no network connection. Please review the output to see exactly what it is."
            }, (response) => {
                return
            })
        } else {
            pushBranchToOrigin(currentBranchName, repoPath)
        }
    })
}

function displayLineToOutput(line) {
    var featureOutputPanel = document.getElementById("finishFeatureOutputPanel")
    featureOutputPanel.innerHTML += line + "\n"
}

function pushBranchToOrigin(currentBranchName, repoPath) {
    exec('git push -u origin ' + currentBranchName, {
        cwd: repoPath
    }, (err, stdout, stderr) => {
        displayLineToOutput("Running git push -u origin " + currentBranchName)
        displayLineToOutput(stdout)
        displayLineToOutput(stderr)

        if( err != null ) {
            dialog.showMessageBox({
                type: "error",
                buttons: ["OK"],
                title: "Error on Push!",
                message: "Whoops! There's a push error." + '\n\n' + "Common causes could be merge conflicts or no network connection. Please review the output to see exactly what it is."
            }, (response) => {
                return
            })
        } else {
            pullFromDevelop(currentBranchName, repoPath)
        }  
    })
}

function pullFromDevelop(currentBranchName, repoPath) {
    exec('git pull origin develop', {
        cwd: repoPath
    }, (err, stdout, stderr) => {
        displayLineToOutput("Running git pull origin develop as the first step in the git flow process.")
        displayLineToOutput(stdout)
        displayLineToOutput(stderr)

        if( err != null ) {
            dialog.showMessageBox({
                type: "error",
                buttons: ["OK"],
                title: "Error on Pull!",
                message: "Whoops! There's a pull error." + '\n\n' + "You could have some uncommited files. I don't really know. Please review the output to see exactly what it is."
            }, (response) => {
                return
            })
        } else {
            checkoutDevelop(currentBranchName, repoPath)
        }
    })
}

function checkoutDevelop(currentBranchName, repoPath) {
    exec('git checkout develop', {
        cwd: repoPath
    }, (err, stdout, stderr) => {
        displayLineToOutput("Checking out develop.")
        displayLineToOutput(stdout)
        displayLineToOutput(stderr)

        if( err != null ) {
            dialog.showMessageBox({
                type: "error",
                buttons: ["OK"],
                title: "Error on Checkout!",
                message: "Whoops! There's a checkout error." + '\n\n' + "You could have some uncommited files. Please review the output to see exactly what it is."
            }, (response) => {
                return
            })
        } else {
            mergeCurrentBranch(currentBranchName, repoPath)
        }
    })
}

function mergeCurrentBranch(currentBranchName, repoPath) {
    exec('git merge ' + currentBranchName, {
        cwd: repoPath
    }, (err, stdout, stderr) => {
        displayLineToOutput("Merging your feature branch " + currentBranchName + " with develop.")
        displayLineToOutput(stdout)
        displayLineToOutput(stderr)

        if( err != null ) {
            dialog.showMessageBox({
                type: "error",
                buttons: ["OK"],
                title: "Error on Merge!",
                message: "Whoops! There's a merge error." + '\n\n' + "You could have some uncommited files or merge conflicts. I don't really know. Please review the output to see exactly what it is."
            }, (response) => {
                return
            })
        } else {
            pushDevelop(currentBranchName, repoPath)
        }
    })
}

function pushDevelop(currentBranchName, repoPath) {
    exec('git push', {
        cwd: repoPath
    }, (err, stdout, stderr) => {
        displayLineToOutput("Pushing your changes to the remote.")
        displayLineToOutput(stdout)
        displayLineToOutput(stderr)

        if( err != null ) {
            dialog.showMessageBox({
                type: "error",
                buttons: ["OK"],
                title: "Error on Push!",
                message: "Whoops! There's a push error." + '\n\n' + "You could have merge conflicts or no network connection. Please review the output to see exactly what it is."
            }, (response) => {
                return
            })
        } else {
            displayLineToOutput("Alright! Make sure there are no errors in the error messages. I printed everything out so you should be able to see if something went wrong.")
            displayLineToOutput("I left your feature branch " + currentBranchName + " intact. You can delete it by running \"git branch -d " + currentBranchName + "\"")
        }
    })
}