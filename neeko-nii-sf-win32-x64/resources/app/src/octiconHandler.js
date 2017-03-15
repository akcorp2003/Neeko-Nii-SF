const panelDisplayer = require('./panelDisplayer')

const defaultOcticonColor = "#2b8cbe"
const selectedOcticonColor = "#FFF" 

exports.setOcticonsOnSidebar = _ => {
    var sideBar = document.getElementById("sideBar")
    console.log(Array.from(sideBar.children))
    Array.from(sideBar.children)
        .map( function getSvgsFromDiv(octiconDiv) {
            return Array.from(octiconDiv.children)
                    .filter( function getSvgs(childElement) {
                        return childElement.tagName == 'svg'
                    })
        })
        .reduce( function flatten(alreadyFlattenedArray, someArray) {
            return alreadyFlattenedArray.concat(someArray)
        }, [])
        .forEach( function setCircle(octicon) {
            octicon.onclick = function() {
                toggleOcticonOnClick(octicon) 
                showAppropriatePanel(octicon)
            }
            octicon.onmouseenter = function() { changeOcticonColor(octicon, selectedOcticonColor) }
            octicon.onmouseleave = function() { changeOcticonColor(octicon, defaultOcticonColor) }
        })

    module.exports.clickOcticon("gitfeature")
}

function toggleOcticonOnClick(svgElement) {
    if( svgElement.classList.contains("clicked") ) {
        resetSVGElement(svgElement)
    } else {
        //We're only allowing one button to be clicked at a time. The order the clicks happen doesn't matter.
        var currentOcticon = getOcticonId(svgElement)
        resetOtherOcticons(currentOcticon)
        svgElement.classList.add("clicked")
        changeOcticonColor(svgElement, selectedOcticonColor)
        //Nullify the hovering abilities
        svgElement.onmouseenter = null
        svgElement.onmouseleave = null
    }
}

function resetSVGElement(svgElement) {
    svgElement.classList.remove("clicked")
    changeOcticonColor(svgElement, defaultOcticonColor)
    svgElement.onmouseenter = function() { changeOcticonColor(svgElement, selectedOcticonColor) }
    svgElement.onmouseleave = function() { changeOcticonColor(svgElement, defaultOcticonColor) }
}

function changeOcticonColor( svgElement, colorValue) {
    Array.from(svgElement.children)
        .filter( function getCircles(childElement) {
            return childElement.tagName == 'path'
        })
        .reduce( function flatten(alreadyFlattenedArray, someArray) {
            return alreadyFlattenedArray.concat(someArray)
        }, [])
        .forEach(function addHoverColor(octiconPath) {
            octiconPath.style.fill = colorValue
        })
}

function resetOtherOcticons( currentOcticon ) {
    var sideBar = document.getElementById("sideBar")
    var stuff = Array.from(sideBar.children)
        .map( function getSvgsFromDiv(octiconDiv) {
            return Array.from(octiconDiv.children)
                    .filter( function getSvgs(childElement) {
                        return childElement.tagName == 'svg'
                    })
        })
        .reduce( function flatten(alreadyFlattenedArray, someArray) {
            return alreadyFlattenedArray.concat(someArray)
        }, [])
        .filter( function getCirclesToReset(svgElement) {
            var text = getOcticonId(svgElement)
            return text !== currentOcticon
        })
        .forEach( function resetCircleIfApplicable(svgElement) {
            if( svgElement.classList.contains("clicked") ) {
                resetSVGElement(svgElement)
            } else {
                changeOcticonColor(svgElement, defaultOcticonColor)
            }
            
        })
}

function getOcticonId(svgElement) {
    console.log('inside getOcticonId!')
    var text = Array.from(svgElement.children)
                .filter( function getOnlyPathElements(element) {
                    return element.tagName == 'path'
                })
                .map( function getText(pathElement) {
                    return pathElement.getAttribute('id')
                })
    return text[0]
}

function showAppropriatePanel(svgElement) {
    var text = getOcticonId(svgElement)
    if( text == 'gitfeature' ) {
        panelDisplayer.hideMainPanel()
        panelDisplayer.hideFinishFeaturePanel()
        panelDisplayer.hideCommitPanel()
        panelDisplayer.showFeatureCreationPanel()
    } else if( text == 'gitcommit' ) {
        panelDisplayer.hideMainPanel()
        panelDisplayer.hideFeatureCreationPanel()
        panelDisplayer.hideFinishFeaturePanel()
        panelDisplayer.showCommitPanel()
    } else if( text == 'gitfinish' ) {
        panelDisplayer.hideCommitPanel()
        panelDisplayer.hideFeatureCreationPanel()
        panelDisplayer.hideMainPanel()
        panelDisplayer.showFinishFeaturePanel()
    } else {
        //by default, always show main panel
        panelDisplayer.hideFeatureCreationPanel()
        panelDisplayer.hideCommitPanel()
        panelDisplayer.hideFinishFeaturePanel()
        panelDisplayer.showMainPanel()
    }
}

exports.clickOcticon = ( octicon ) => {
    var octiconToClick = getOcticonByName( octicon )
    console.log('circle to click:')
    console.log(octiconToClick)
    if( octiconToClick != null ) {
        toggleOcticonOnClick(octiconToClick)
    }
}

function getOcticonByName( octiconName ) {
    var sideBar = document.getElementById("sideBar")
    var octiconToClick =  Array.from(sideBar.children)
                        .map( function getSvgsFromDiv(octiconDiv) {
                            return Array.from(octiconDiv.children)
                                    .filter( function getSvgs(childElement) {
                                        return childElement.tagName == 'svg'
                                    })
                        })
                        .reduce( function flatten(alreadyFlattenedArray, someArray) {
                            return alreadyFlattenedArray.concat(someArray)
                        }, [])
                        .filter( function getCircle(svgElement) {
                            var text = getOcticonId(svgElement)
                            return text == octiconName
                        })
    if( octiconToClick != null && octiconToClick.length > 0 ) {
        return octiconToClick[0]
    } else {
        return null
    }
}