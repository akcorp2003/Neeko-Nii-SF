const { dialog } = require('electron')
const exec = require('child_process').exec
const readline = require('readline')
const fs = require('fs')
const path = require('path')

const fileDisplayer = require('./fileDisplayer')

const configFilepath = path.join(__dirname, '..', 'configs', 'build.config')
const envFilepath = path.join(__dirname, '..', 'configs', 'build.env')
var repoFilepath
var currentBranchName

exports.pathToRepo = repoFilepath
exports.activeBranchName = currentBranchName

function setTitle (done) {
    //git command for looking at current branch name
    exec('git rev-parse --abbrev-ref HEAD', {
        cwd: repoFilepath
    }, (err, stdout, stderr) => {
        currentBranchName = stdout
        var programTitle = document.getElementById("programName")
        console.log('setted branch name to: ' + currentBranchName)
        programTitle.innerText += " " + currentBranchName
        done(null, currentBranchName)
    })
}

exports.loadRepoDirectory = _ => {
    console.log('Config file path using join: ' + configFilepath)
    if(fs.existsSync(configFilepath)){
        const configFileLine = readline.createInterface({
            input: fs.createReadStream(configFilepath)
        })

        configFileLine.on('line', (line) => {
           var filePaths = line.split('=')
           if(filePaths != null){
               if(filePaths[0].trim().localeCompare('repo.path') === 0){
                    console.log(filePaths[1].trim())
                    repoFilepath = filePaths[1].trim()
                    setTitle( (err, branchName) => {
                        fileDisplayer.loadDirtyFiles(repoFilepath, branchName)
                    })
                    
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
}

exports.updateTitle = _ => {
    exec('git rev-parse --abbrev-ref HEAD', {
        cwd: repoFilepath
    }, (err, stdout, stderr) => {
        var branchName = stdout
        var programTitle = document.getElementById("programName")
        var branchNameOnScreen = programTitle.innerText.replace('Current branch: ', '');
        if( branchName.localeCompare(branchNameOnScreen) !== 0 ) {
            programTitle.innerText = programTitle.innerText.replace(branchNameOnScreen, '')
            programTitle.innerText += ' ' + branchName
            currentBranchName = branchName
        }
    })
}

exports.setBuildBar = _ => {
    if(fs.existsSync(envFilepath)) {
        const envFileLine = readline.createInterface({
            input: fs.createReadStream(envFilepath)
        })

        envFileLine.on('line', (line) => {
            console.log(line.trim())
            if( line.trim().localeCompare("#") != 0 && line.trim() )
            {
                var buildBar = document.getElementById("buildBar")
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

                buildBar.appendChild(envButton)
            }
            
        })
    } else {
        console.log('Whoops! Can\'t find the env file.')
    }
}