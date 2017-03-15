const fs = require('fs')
const exec = require('child_process').exec
const electron = require('electron')
const path = require('path')
const readline = require('readline')
const async = require('async')

const configuration = require('./loadConfiguration')

var pathToBuildProperties

var interval = setTimeout(function wait() {
    console.log('running!!')
    if( configuration.getWorkspaceFilePath() ) {
        console.log('set!!')
        pathToBuildProperties = path.join(configuration.getWorkspaceFilePath(), "build.properties")
        clearInterval(interval)
    }
}, 250)

var writeQueue = async.queue(function (jsonArguments, callback) {
    console.log(pathToBuildProperties)
    if(fs.existsSync(pathToBuildProperties)) {
        var envAndBuildId = JSON.parse(jsonArguments)

        fs.readFile(pathToBuildProperties, function insertDeployId(err, data) {
            if( err ) {
                return console.log(err)
            }

            var replacementText = envAndBuildId[0] + "." + "deployRequestId = " + envAndBuildId[1] + "\n"
            //var textToReplace =  envAndBuildId[0] + "." + "deployRequestId ="
            var textToReplace = envAndBuildId[0] + "." + "deployRequestId =.*(\n|\n\r)"
            var regexStatement = new RegExp(textToReplace, "g")
            var replacedFile = data.toString().replace(regexStatement, replacementText)

            fs.writeFile(pathToBuildProperties, replacedFile, function (err) {
                if ( err ) {
                    return console.log(err)
                }
            })
        })
    }
    callback()
}, 1)

exports.writeBuildIdToFile = (envOfBuild, idOfBuild, buildWindow) => {
    var argArray = []
    argArray.push(envOfBuild)
    argArray.push(idOfBuild)
    console.log(argArray)
    var jsonOfArguments = JSON.stringify(argArray)
    writeQueue.push(jsonOfArguments, function (err) {
        console.log('finished with this task')
        buildWindow.webContents.send('activate-abort-button')
    })
}