const fs = require('fs')
const exec = require('child_process').exec
const path = require('path')
const electron = require('electron')
const remote = require('electron').remote
const dialog = require('electron').remote.dialog

const configurationLoader = require('./loadConfiguration')

exports.commitFiles = (document) => {
    var pathToRepo = configurationLoader.getRepoFilePath()
    var listOfFiles = document.getElementById("commitFileListPanel")
    var filesToCommit = Array.from(listOfFiles.childNodes)
        .filter( function (fileItem) {
            return fileItem.classList.contains("selectedFile")
        })
        .map( function(fileItem) {
            var classesWithFilePath = fileItem.getElementsByClassName("fullFilePath")
            console.log('extracted this: ' + classesWithFilePath[0].innerText)
            return path.join("src", classesWithFilePath[0].innerText)
        })

    var filesToAddArgument = filesToCommit.reduce(function(fullFileString, currentFilePath) {
                                return fullFileString + " " + currentFilePath
                            }, "")

    addFiles(document, pathToRepo, filesToAddArgument)
}

function addFiles(document, pathToRepo, filesToAddArgument) {
    exec('git add' + filesToAddArgument, {
        cwd: pathToRepo
    }, (err, stdout, stderr) => {
        if( err != null ) {
            dialog.showMessageBox({
                title: "Error on Add",
                type: "error",
                buttons: ["OK"],
                message: "For some reason, I couldn't add your files... " + err + '\n\n' + "Here's the output from git: " + '\n\n' + stderr
            })
        } else {
            var commitMessage = document.getElementById("commitMessage").value
            commitFiles(document, commitMessage, pathToRepo)
        }
    })
}

function commitFiles(document, commitMessage, pathToRepo) {
    exec('git commit -m ' + '\"' + commitMessage + '\"', {
        cwd: pathToRepo
    }, (err, stdout, stderr) => {
        if( err != null ) {
            dialog.showMessageBox({
                title: "Error on Commit",
                type: "error",
                buttons: ["OK"],
                message: "For some reason, I couldn't commit your files... " + err + '\n\n' + "Here's the error from git: " + '\n\n' + stderr
            })
        } else {
            document.getElementById("uncommitedFileContents").innerHTML = ""
            document.getElementById("commitMessage").value = ""
        }
    })
}