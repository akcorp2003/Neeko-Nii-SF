const fs = require('fs')
const exec = require('child_process').exec
const path = require('path')
const readline = require('readline')

const configurationLoader = require('./loadConfiguration')

const remote = require('electron').remote
const dialog = require('electron').remote.dialog

const sfHTMLIcon = "salesforce-lightning-design-system-2.2.1/assets/icons/doctype-sprite/svg/symbols.svg#html"
const sfHTMLIconPNG = "salesforce-lightning-design-system-2.2.1/assets/icons/doctype/html_60.png"
const win32 = "win32"
const fileNotFound = "FILE NOT FOUND!"

//will store the cleaned filepaths of files
let selectedFilesToBuildCache = []
let selectedFilesToCommitCache = []

//this function aims to create a DOM element that looks like the following:
/*
<div id="fileListPanel" class="slds-col slds-m-horizontal--large slds-border--right slds-size--1-of-1 slds-scrollable slds-has-dividers--bottom-space">
    <div class="slds-item hoverable">
        <div class="slds-tile slds-media">
            <div class="slds-media__figure">
                <div class="slds-icon" aria-hidden="true">
                    <img src="salesforce-lightning-design-system-2.2.1/assets/icons/doctype/html_60.png" />
                </div>
            </div>
            <div class="slds-media__body">
                <h2 class="slds-truncate">file name!!</h2>
                <div class="slds-tile__detail slds-text-body--small">
                    <ul class="slds-list--horizontal">
                        <li class="slds-item fullFilePath">full file path!!</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</div>
*/


exports.loadDirtyFiles = (pathToRepoDirectory, currentBranchName) => {
    exec('git diff --name-only --diff-filter=duxb develop ' + currentBranchName, {
        cwd: pathToRepoDirectory
    }, (err, stdout, stderr) => {
        //clear out the current dirty files
        //this might not be the most optimum way to do it...
        var dirtyFileList = document.getElementById("fileListPanel")
        while( dirtyFileList.firstChild ) {
            dirtyFileList.removeChild(dirtyFileList.firstChild)
        }

        createFilePanels(pathToRepoDirectory, currentBranchName, stdout, dirtyFileList, _ => {
            createSelectAllButton(dirtyFileList)
        })
    })
}

exports.clearFilesCache = _ => {
    selectedFilesToBuildCache = []
}

exports.clearCommitedFilesCache = _ => {
    selectedFilesToCommitCache = []
}

function createSelectAllButton(panelToPopulate) {
    var fileListPanel = panelToPopulate

    var selectAllButton = document.createElement("button")
    selectAllButton.innerText = "Select All"
    selectAllButton.classList.add("slds-button")
    selectAllButton.classList.add("slds-button--neutral")
    selectAllButton.addEventListener("click", function selectAll() {
        var listOfFiles = panelToPopulate
        Array.from(listOfFiles.childNodes)
        .filter(function(node) {
            return !node.classList.contains("selectedFile") && !node.classList.contains("slds-button")
        })
        .forEach( function selectNode(itemNode) {
            itemNode.classList.add("selectedFile")

            var filePathName = itemNode.getElementsByClassName("fullFilePath")[0].innerText
            if(panelToPopulate.id == 'fileListPanel') {
                if( !selectedFilesToBuildCache.includes(filePathName) ) {
                    selectedFilesToBuildCache.push(filePathName)
                } 
            } else if(panelToPopulate.id == 'commitFileListPanel') {
                if( !selectedFilesToCommitCache.includes(filePathName) ) {
                    selectedFilesToCommitCache.push(filePathName)
                }
            }
            
        })

    })
    fileListPanel.insertBefore(selectAllButton, fileListPanel.firstChild)
}

function createFilePanels(pathToRepoDirectory, currentBranchName, stdout, panelToPopulate, done) {
    var lines
    if( process.platform.localeCompare(win32) === 0 ) {
        lines = stdout.toString().split('\r\n')
    }
    
    lines = stdout.toString().split('\n')
    lines.forEach(function(line) {
        if( line.trim() ) {
            //regardless of platform, git always outputs the "/"
            var folderAndFileNames = line.split("/")
            var parentDirectories = folderAndFileNames.splice(0, folderAndFileNames.length - 1)

            var filename = folderAndFileNames[0]

            //remove the root folder
            parentDirectories.splice(0, 1)
            var cleanedFilepath = path.join.apply(null, parentDirectories.concat(folderAndFileNames))

            var itemDiv = document.createElement("div")
            itemDiv.classList.add("slds-item")
            itemDiv.classList.add("hoverable")


            //maintain the selected status
            if( panelToPopulate.id == 'fileListPanel' ) {
                if( selectedFilesToBuildCache.includes(cleanedFilepath) ) {
                    itemDiv.classList.add("selectedFile")
                }
            } else {
                if( selectedFilesToCommitCache.includes(cleanedFilepath) ) {
                    itemDiv.classList.add("selectedFile")
                }
            }

            itemDiv.addEventListener('click', function clicked() {
                var myPath = this.getElementsByClassName("fullFilePath")
                var pathToFile = path.join(pathToRepoDirectory, "src", myPath[0].innerText)

                if( this.classList.contains("selectedFile") ) {
                    console.log('removing: ' + myPath[0].innerText)
                    if(panelToPopulate.id == 'fileListPanel') {
                        var index = selectedFilesToBuildCache.indexOf(myPath[0].innerText)
                        if( index > -1 ) {
                            selectedFilesToBuildCache.splice(index, 1)
                        }
                    } else {
                        var index = selectedFilesToCommitCache.indexOf(myPath[0].innerText)
                        if( index > -1 ) {
                            selectedFilesToCommitCache.splice(index, 1)
                        }
                    }
                    
                } else {
                    console.log('adding: ' + myPath[0].innerText)
                    if( panelToPopulate.id == 'fileListPanel' ) {
                        selectedFilesToBuildCache.push(myPath[0].innerText)
                    } else {
                        console.log('added to commit cache')
                        selectedFilesToCommitCache.push(myPath[0].innerText)
                    }
                    
                }
                                    
                this.classList.toggle("selectedFile")
                
                //to differentiate which file panel to populate, there is a class on the file panel
                //that will indicate which file contents panel to populate
                var fileContents
                if( panelToPopulate.id == 'fileListPanel' ) {
                    fileContents = document.getElementById("fileContents")
                } else {
                    fileContents = document.getElementById("uncommitedFileContents")
                }

                //first clear out the existing text
                fileContents.innerHTML = ""
                if(fs.existsSync(pathToFile)){
                    fs.readFile(pathToFile, (err, data) => {
                        if( err ) {
                            dialog.showMessageBox({
                                type: "error",
                                buttons: ["OK"],
                                title: "Error Reading File",
                                message: "There was an error loading the file." + '\n\n' + err
                            }, function (response) {
                                return
                            })
                        } else {
                            fileContents.innerHTML = data
                        }
                    })
                } else {
                    fileContents.innerHTML = fileNotFound + "\n"
                    console.log('Could not find file!!')
                }
            })

            var tileDiv = document.createElement("div")
            tileDiv.classList.add("slds-tile")
            tileDiv.classList.add("slds-media")

            var mediaFigureDiv = document.createElement("div")
            mediaFigureDiv.classList.add("slds-media__figure")

            var iconDiv = document.createElement("div")
            iconDiv.classList.add("slds-icon")

            var img = document.createElement("img")
            img.setAttribute("src", sfHTMLIconPNG)

            iconDiv.appendChild(img)

            mediaFigureDiv.appendChild(iconDiv)

            tileDiv.appendChild(mediaFigureDiv)

            var mediaBodyDiv = document.createElement("div")
            mediaBodyDiv.classList.add("slds-media__body")

            var mediaBodyHeader = document.createElement("h2")
            mediaBodyHeader.classList.add("slds-truncate")
            mediaBodyHeader.innerText += filename
            mediaBodyDiv.appendChild(mediaBodyHeader)

            var tileDetailDiv = document.createElement("div")
            tileDetailDiv.classList.add("slds-tile__detail")
            tileDetailDiv.classList.add("slds-text-body--small")

            var fileDetailsList = document.createElement("ul")
            fileDetailsList.classList.add("slds-list--horizontal")

            var detailsElement = document.createElement("li")
            detailsElement.classList.add("slds-item")
            detailsElement.classList.add("fullFilePath")
            detailsElement.innerText += cleanedFilepath
            
            fileDetailsList.appendChild(detailsElement)

            tileDetailDiv.appendChild(fileDetailsList)
            
            mediaBodyDiv.appendChild(tileDetailDiv)

            tileDiv.appendChild(mediaBodyDiv)

            itemDiv.appendChild(tileDiv)

            panelToPopulate.appendChild(itemDiv)
        }  
    })

    done(null)
}

exports.clearFileContentsPanel = _ => {
    document.getElementById("fileContents").innerHTML = ""
}

exports.loadUncommitedFiles = (pathToRepoDirectory, currentBranchName) => {
    exec('git diff --name-only', {
        cwd: pathToRepoDirectory
    }, (err, stdout, stderr) => {
        var uncommitedFileList = document.getElementById("commitFileListPanel")
        while( uncommitedFileList.firstChild ) {
            uncommitedFileList.removeChild(uncommitedFileList.firstChild)
        }

        createFilePanels(pathToRepoDirectory, currentBranchName, stdout, uncommitedFileList, _ => {
            createSelectAllButton(uncommitedFileList)
        })        
    })
}