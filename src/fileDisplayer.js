const fs = require('fs')
const exec = require('child_process').exec
const path = require('path')
const readline = require('readline')

const configurationLoader = require('./loadConfiguration')

const sfHTMLIcon = "salesforce-lightning-design-system-2.2.1/assets/icons/doctype-sprite/svg/symbols.svg#html"
const sfHTMLIconPNG = "salesforce-lightning-design-system-2.2.1/assets/icons/doctype/html_60.png"
const win32 = "win32"

//will store the cleaned filepaths of files
let selectedFilesCache = []

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

function createSelectAllButton() {
    var fileListPanel = document.getElementById("fileListPanel")

    var selectAllButton = document.createElement("button")
    selectAllButton.innerText = "Select All"
    selectAllButton.classList.add("slds-button")
    selectAllButton.classList.add("slds-button--neutral")
    selectAllButton.addEventListener("click", function selectAll() {
        var listOfFiles = document.getElementById("fileListPanel")
        Array.from(listOfFiles.childNodes)
        .filter(function(node) {
            return !node.classList.contains("selectedFile") && !node.classList.contains("slds-button")
        })
        .forEach( function selectNode(itemNode) {
            console.log(itemNode)
            itemNode.classList.add("selectedFile")

            var filePathName = itemNode.getElementsByClassName("fullFilePath")[0].innerText
            console.log(filePathName)
            if( !selectedFilesCache.includes(filePathName) ) {
                selectedFilesCache.push(filePathName)
            }
            
        })

    })
    fileListPanel.insertBefore(selectAllButton, fileListPanel.firstChild)
}

function createFilePanels(pathToRepoDirectory, currentBranchName, stdout, done) {
    var lines
    if( process.platform.localeCompare(win32) === 0 ) {
        lines = stdout.toString().split('\r\n')
    }
    
    lines = stdout.toString().split('\n')
    lines.forEach(function(line) {
        if( line.trim() ) {
            var folderAndFileNames = line.split(path.sep)
            var parentDirectories = folderAndFileNames.splice(0, folderAndFileNames.length - 1)

            var filename = folderAndFileNames[0]

            //remove the root folder
            parentDirectories.splice(0, 1)
            console.log(parentDirectories)
            var cleanedFilepath = path.join.apply(null, parentDirectories.concat(folderAndFileNames))

            var itemDiv = document.createElement("div")
            itemDiv.classList.add("slds-item")
            itemDiv.classList.add("hoverable")


            if( selectedFilesCache.includes(cleanedFilepath) ) {
                itemDiv.classList.add("selectedFile")
            }
            

            itemDiv.addEventListener('click', function clicked() {
                var myPath = this.getElementsByClassName("fullFilePath")
                var pathToFile = path.join(pathToRepoDirectory, "src", myPath[0].innerText)

                if( this.classList.contains("selectedFile") ) {
                    console.log('removing: ' + myPath[0].innerText)
                    var index = selectedFilesCache.indexOf(myPath[0].innerText)
                    if( index > -1 ) {
                        selectedFilesCache.splice(index, 1)
                    }
                } else {
                    console.log('adding: ' + myPath[0].innerText)
                    selectedFilesCache.push(myPath[0].innerText)
                }
                                    
                this.classList.toggle("selectedFile")
                
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

            document.getElementById("fileListPanel").appendChild(itemDiv)
        }  
    })

    done(null)
}

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

        createFilePanels(pathToRepoDirectory, currentBranchName, stdout, _ => {
            createSelectAllButton()
        })
    })
}

exports.clearFilesCache = _ => {
    selectedFilesCache = []
}