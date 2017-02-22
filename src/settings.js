const fs = require('fs')
const exec = require('child_process').exec
const electron = require('electron')
const path = require('path')
const readline = require('readline')

const remote = require('electron').remote
const dialog = require('electron').remote.dialog

const win32 = "win32"
const darwin = "darwin"
const configFilepath = path.join(__dirname, '..', 'configs', 'build.config')
const envFilepath = path.join(__dirname, '..', 'configs', 'build.env')

const repoPathHead = "repo.path = "
const workspacePathHead = "workspace.path = "

window.addEventListener('DOMContentLoaded', _ => {
    var localRepoText = document.getElementById("localRepoText")
    var workspacePath = document.getElementById("workspacePath")

    if( process.platform.localeCompare(darwin) === 0 ) {
        localRepoText.setAttribute("placeholder", "ex. /Users/Ana/myRepo")
        workspacePath.setAttribute("placeholder", "ex. /Users/Ana/workspace")
    } else if ( process.platform.localeCompare(win32) === 0 ) {
        localRepoText.setAttribute("placeholder", "ex. C:\Users\Ana\myRepo")
        workspacePath.setAttribute("placeholder", "ex. C:\Users\Ana\workspace")
    }

    if( fs.existsSync(configFilepath) ) {
        const configFileLine = readline.createInterface({
            input: fs.createReadStream(configFilepath)
        })

        configFileLine.on('line', (line) => {
           var filePaths = line.split('=')
           if( filePaths != null ){
               if( filePaths[0].trim().localeCompare('repo.path') === 0 ){
                    console.log(filePaths[1].trim())
                    document.getElementById("localRepoText").value = filePaths[1].trim()    
               } else if( filePaths[0].trim().localeCompare('workspace.path') === 0 ) {
                   document.getElementById("workspacePath").value = filePaths[1].trim()
               }
           }
        })
    }

    if( fs.existsSync(envFilepath) ) {
        const configFileLine = readline.createInterface({
            input: fs.createReadStream(envFilepath)
        })

        configFileLine.on('line', (line) => {
            if( line ) {
                var cleanedLine = line.trim()
                document.getElementById("envs").value += cleanedLine + ", "
            }
        })
    }

    var submitButton = document.getElementById("submit")
    submitButton.addEventListener("click", function onClick() {
        var pathsFile
        if(fs.existsSync(configFilepath)) {
            pathsFile = fs.createWriteStream(configFilepath)
            pathsFile.on('error', function (err) {
                //yeah, error handling is not so cool 
                console.log(err)
                return
            })

            var repoPath = document.getElementById("localRepoText").value 
            var workspacePath = document.getElementById("workspacePath").value

            pathsFile.write(repoPathHead + repoPath + '\n')
            pathsFile.write(workspacePathHead + workspacePath + '\n')

            pathsFile.end()
        }

        var envFile
        if( fs.existsSync(envFilepath) ) {
            envFile = fs.createWriteStream(envFilepath)
            envFile.on('error', function (err) {
                //yeah, error handling is not so cool 
                console.log(err)
                return
            })

            var envs = document.getElementById("envs").value.split(",")
            envs.forEach( function(env) {
                if( env && env.localeCompare(" ") !== 0 ) {
                    env = env.trim()
                    envFile.write(env + '\n')
                } 
            })

            envFile.end()

            envFile.on('finish', () => {
                var window = remote.getCurrentWindow()
                window.close()
            })
        } 
        
    })
})