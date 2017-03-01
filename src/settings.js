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
        localRepoText.setAttribute("placeholder", "ex. C:\\Users\\Ana\\myRepo")
        workspacePath.setAttribute("placeholder", "ex. C:\\Users\\Ana\\workspace")
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
        var workspacePath
        var repoPath
        if(fs.existsSync(configFilepath)) {
            pathsFile = fs.createWriteStream(configFilepath)
            pathsFile.on('error', function (err) {
                dialog.showMessageBox({
                    type: "error",
                    buttons: ["OK"],
                    title: "Fatal error...",
                    message: "I can't find my own config path... You will need to reinstall me." + '\n\n'  + "File an issue on BitBucket so my creator knows about this. \n\nHere's the error" + err
                }, function() {
                    return
                })
            })

            repoPath = document.getElementById("localRepoText").value 
            workspacePath = document.getElementById("workspacePath").value


            pathsFile.write(repoPathHead + repoPath + '\n')
            pathsFile.write(workspacePathHead + workspacePath + '\n')

            pathsFile.end()

            pathsFile.on('finish', function callWriteEnvFile() {
                console.log('finished pathsfile')
                writeEnvFile(workspacePath, repoPath)
            })
        }
        
    })
})

function writeEnvFile(workspacePath, repoPath) {
    var envFile
    if( fs.existsSync(envFilepath) ) {
        envFile = fs.createWriteStream(envFilepath)
        envFile.on('error', function (err) {
            dialog.showMessageBox({
                    type: "error",
                    buttons: ["OK"],
                    title: "Fatal error...",
                    message: "I can't find my own env path... You will need to reinstall me." + '\n\n' + "File an issue on BitBucket so my creator knows about this. \n\nHere's the error" + err
                }, function() {
                    return
                })
        })

        var envs = document.getElementById("envs").value.split(",")
        envs.forEach( function(env) {
            if( env && env.localeCompare(" ") !== 0 ) {
                env = env.trim()
                envFile.write(env + '\n')
            } 
        })

        envFile.end()

        envFile.on('finish', function syncConfigs() {
            console.log('finished env file')
            syncSFBuildConfigs(workspacePath, repoPath)
        })

    }
}

function syncSFBuildConfigs(workspacePath, repoPath) {
    //also update the .NET config files. They are located in the workspace folder
    var sfBuildConfigFilepath = path.join(workspacePath, "configs", "build.config")
    console.log(sfBuildConfigFilepath)
    var sfBuildEnvFilepath = path.join(workspacePath, "configs", "build.env")
    console.log(sfBuildEnvFilepath)

    //We don't care when we can't find either file. .NET Core will break a bit.
    //It's up to the user to make sure the files are all assembled properly.
    if( !fs.existsSync(sfBuildConfigFilepath) || !fs.existsSync(sfBuildEnvFilepath) ) {
        dialog.showMessageBox({
            type: "warning",
            buttons: ["OK"],
            title: "SFBuild Configs Not Found",
            message: "I can't find the build.config or build.env files in the  configs folder for SFBuild .NET Core. Make sure you placed the configs folder into your workspace " + workspacePath + "." + '\n\n' + "As a result, ant may not work."
        }, function() {
            var window = remote.getCurrentWindow()
            window.close()
            return
        })
        
    }

    var sfBuildConfigsFile
    if( fs.existsSync(sfBuildConfigFilepath) ) {
        sfBuildConfigsFile = fs.createWriteStream(sfBuildConfigFilepath)
        sfBuildConfigsFile.on('error', function (err) {
            dialog.showMessageBox({
                type: "error",
                buttons: ["OK"],
                title: "Error Writing to Configs",
                message: "There was an error writing to build.config file in " + workspacePath + "." + '\n\n' + "As a result, ant may not work." + '\n\n' + "Here's the error: " + err
            }, function() {
                var window = remote.getCurrentWindow()
                window.close()
                return
            })
        })

        sfBuildConfigsFile.write(repoPathHead + repoPath + '\n')
        sfBuildConfigsFile.write(workspacePathHead + workspacePath + '\n')

        sfBuildConfigsFile.end()
    }
    
    var sfBuildEnvFile
    if( fs.existsSync(sfBuildEnvFilepath) ) {
        sfBuildEnvFile = fs.createWriteStream(sfBuildEnvFilepath)
        sfBuildEnvFile.on('error', function(err) {
            dialog.showMessageBox({
                type: "error",
                buttons: ["OK"],
                title: "Error Writing to Configs",
                message: "There's an error writing to build.env in " + workspacePath + "." + '\n\n' + "As a result, ant may not work." + '\n\n' + "Here's the error " + err
            }, function() {
                var window = remote.getCurrentWindow()
                window.close()
                return
            })
        })

        var envs = document.getElementById("envs").value.split(",")
        envs.forEach( function(env) {
            if( env && env.localeCompare(" ") !== 0 ) {
                env = env.trim()
                console.log(env)
                sfBuildEnvFile.write(env + '\n')
            } 
        })

        sfBuildEnvFile.end()

        sfBuildEnvFile.on('finish', () => {
            var window = remote.getCurrentWindow()
            window.close()
        })
    }

}