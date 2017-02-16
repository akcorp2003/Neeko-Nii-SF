const fs = require('fs')
const exec = require('child_process').exec
const path = require('path')
const readline = require('readline')

const configurationLoader = require('./loadConfiguration')

exports.loadDirtyFiles = (pathToRepoDirectory, currentBranchName) => {
    exec('git diff --name-only develop ' + currentBranchName, {
        cwd: pathToRepoDirectory
    }, (err, stdout, stderr) => {
        //clear out the current dirty files
        //this might not be the most optimum way to do it...
        var dirtyFileList = document.getElementById("fileListPanel")
        while( dirtyFileList.firstChild ) {
            dirtyFileList.removeChild(dirtyFileList.firstChild)
        }
                
        var lines = stdout.toString().split('\n')
        lines.forEach(function(line) {
            if( line.trim() ) {
                var filepathWithNoSrcFolder = line.split(path.sep)

                //remove the root folder
                filepathWithNoSrcFolder.splice(0, 1)
                var cleanedFilepath = path.join.apply(null, filepathWithNoSrcFolder)

                var paragraph = document.createElement("p")
                var fileButton = document.createElement("button")
                fileButton.className += "slds-button"
                fileButton.innerHTML += cleanedFilepath

                fileButton.addEventListener("click", function() {
                    var pathToFile = path.join(pathToRepoDirectory, "src", this.innerText)
                    if(fs.existsSync(pathToFile)){
                        //first clear out the existing text
                        var fileContents = document.getElementById("fileContents")
                        fileContents.innerHTML = ""

                        const fileLine = readline.createInterface({
                            input: fs.createReadStream(pathToFile)
                        })

                        fileLine.on('line', (line) => {
                            fileContents.innerHTML += line + "\n"
                        })


                    } else {
                        console.log('Could not find file!!')
                    } 
                })

                paragraph.appendChild(fileButton)

                document.getElementById("fileListPanel").appendChild(paragraph)
            }  
        })
    })
}