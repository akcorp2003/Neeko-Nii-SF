const { dialog } = require('electron')
const exec = require('child_process').exec
const readline = require('readline')
const fs = require('fs')
const path = require('path')

const fileDisplayer = require('./fileDisplayer')

const configFilepath = path.join(__dirname, '..', 'configs', 'build.config')
const envFilepath = path.join(__dirname, '..', 'configs', 'build.env')
const win32 = "win32"
var repoFilepath
var workspaceFilepath
var currentBranchName
var branchCacheInterval = null

let branchNamesCache = new Set()

exports.populateMainWindow = _ => {
    console.log('Config file path using join: ' + configFilepath)
    if( fs.existsSync(configFilepath) ){
        const configFileLine = readline.createInterface({
            input: fs.createReadStream(configFilepath)
        })

        configFileLine.on('line', (line) => {
           var filePaths = line.split('=')
           if( filePaths != null ){
               if( filePaths[0].trim().localeCompare('repo.path') === 0 ){
                    console.log(filePaths[1].trim())
                    repoFilepath = filePaths[1].trim()

                    setTitle( (err, branchName) => {
                        fileDisplayer.loadDirtyFiles(repoFilepath, branchName)
                    })    
               } else if( filePaths[0].trim().localeCompare('workspace.path') === 0 ) {
                    console.log(filePaths[1].trim())
                    workspaceFilepath = filePaths[1].trim()
               }
           }
        })


    } else {
        console.log('Can\'t find this crap.')
    }
}

exports.findDirtyFiles = _ => {
    console.log('updating dirty files')
    fileDisplayer.loadDirtyFiles(repoFilepath, currentBranchName)
    fileDisplayer.loadUncommitedFiles(repoFilepath, currentBranchName)
}

exports.updateTitle = _ => {
    exec('git rev-parse --abbrev-ref HEAD', {
        cwd: repoFilepath
    }, (err, stdout, stderr) => {
        var branchName = stdout
        var programTitle = document.getElementById("branchName")
        var branchNameOnScreen = programTitle.innerHTML.replace("Current branch: ", "")

        if( branchName !== branchNameOnScreen ) {
            console.log('clearing selectedFiles cache')
            fileDisplayer.clearFilesCache()
            programTitle.innerHTML = programTitle.innerHTML.replace(branchNameOnScreen, "")
            programTitle.innerHTML = 'Current branch: ' + branchName
            currentBranchName = branchName
            module.exports.findDirtyFiles()
            fileDisplayer.clearFileContentsPanel()
        }
    })
}

exports.setBuildStrip = _ => {
    clearBuildBar()    

    if(fs.existsSync(envFilepath)) {
        const envFileLine = readline.createInterface({
            input: fs.createReadStream(envFilepath)
        })

        envFileLine.on('line', (line) => {
            if( line.trim().localeCompare("#") != 0 && line.trim() )
            {
                var buttonStrip = document.getElementById("buttonStrip")
                var envButton = document.createElement("button")
                envButton.className += "slds-button slds-button--neutral"
                if(line.trim().localeCompare("prod") != 0) {
                    envButton.innerHTML = line.trim().toUpperCase()
                } else {
                    envButton.innerHTML = line.trim()
                }
                

                //using the brand or neutral class to determine if the user selected the 
                envButton.addEventListener("click", function() {
                    if(this.classList.contains("slds-button--brand")) {
                        this.classList.remove("slds-button--brand")
                        this.classList.add("slds-button--neutral")
                    } else {
                        this.classList.remove("slds-button--neutral")
                        this.classList.add("slds-button--brand")
                    }
                    
                })

                buttonStrip.appendChild(envButton)
            }
            
        })
    } else {
        console.log('Whoops! Can\'t find the env file.')
    }
}

function clearBuildBar() {
    var buildBar = document.getElementById("buttonStrip")
    var childNodes = Array.from(buildBar.children)
                    .filter( function getCustomEnvironments(envButton) {
                        console.log(envButton)
                        if( envButton.getAttribute("id") != null ) {
                            if( envButton.getAttribute("id").localeCompare("buildBtn") === 0 || envButton.getAttribute("id").localeCompare("myEnvBtn") === 0) {
                                return false
                            } else {
                                return true
                            }
                        }
                        else {
                            return true
                        }
                    })
                    .forEach( function removeChildFromBuildBar(childButton) {
                        buildBar.removeChild(childButton)
                    })
    
}

exports.getRepoFilePath = _ => {
    return repoFilepath
}

exports.getWorkspaceFilePath = _ => {
    return workspaceFilepath
}

exports.getCurrentBranchName = _ => {
    return document.getElementById("branchName").innerText.replace('Current branch: ', '').replace(/(\r\n|\n|\r)/gm,"")
}

function setTitle (done) {
    //git command for looking at current branch name
    exec('git rev-parse --abbrev-ref HEAD', {
        cwd: repoFilepath
    }, (err, stdout, stderr) => {
        currentBranchName = stdout
        var programTitle = document.getElementById("branchName")
        programTitle.innerHTML = "Current branch: " + currentBranchName
        done(null, currentBranchName)
    })
}

exports.cacheBranchNames = _ => {
    runCacheBranchNames()
}

function runCacheBranchNames() {
    if( repoFilepath ) {
        clearInterval(branchCacheInterval)
        exec('git branch -a', {
            cwd: repoFilepath
        }, (err, stdout, stderr) => {
            var branchNames
            if( process.platform.localeCompare(win32) === 0 ) {
                branchNames = stdout.split('\r\n')
            }
            branchNames = stdout.toString().split('\n')

            branchNames.forEach( function addToCache(branchName) {
                if( branchName ) {
                    var cleanedBranchName = branchName.trim().replace(/\*/g, "").replace(/remotes\/origin\//, "").trim()
                    branchNamesCache.add(cleanedBranchName)
                }   
            })
        })

    } else {
        console.log('Repo filepath is not ready yet!')
        clearTimeout(branchCacheInterval)
        branchCacheInterval = setTimeout( function () { runCacheBranchNames() }, 250 )
    }
}

exports.cacheHasBranchName = ( branchName ) => {
    return branchNamesCache.has(branchName)
}