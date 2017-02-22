const panelDisplayer = require('./panelDisplayer')

const defaultCircleColor = "#2b8cbe"
const selectedCircleColor = "#a8ddb5" 

exports.setCirclesOnSideBar = _ => {
    var sideBar = document.getElementById("sideBar")
    console.log(Array.from(sideBar.children))
    Array.from(sideBar.children)
        .map( function getSvgsFromDiv(circleDiv) {
            return Array.from(circleDiv.children)
                    .filter( function getSvgs(childElement) {
                        var svgName = "svg"
                        if( childElement.nodeName.localeCompare(svgName) === 0 ) {
                            return true
                        } else {
                            return false
                        }
                    })
        })
        .reduce( function flatten(alreadyFlattenedArray, someArray) {
            return alreadyFlattenedArray.concat(someArray)
        }, [])
        .forEach( function setCircle(svgElement) {
            svgElement.onclick = function() {
                activateOrDeactivateCircleOnClick(svgElement) 
                showAppropriatePanel(svgElement)
            }
            svgElement.onmouseenter = function() { changeCircleColor(svgElement, selectedCircleColor) }
            svgElement.onmouseleave = function() { changeCircleColor(svgElement, defaultCircleColor) }
        })
    console.log("setting circle")
    module.exports.clickCircle("1")
}

function activateOrDeactivateCircleOnClick(svgElement) {
    if( svgElement.classList.contains("clicked") ) {
        resetSVGElement(svgElement)
    } else {
        //We're only allowing one button to be clicked at a time. The order the clicks happen doesn't matter.
        var currentCircleNumber = getTextInCircle(svgElement)
        resetOtherCircles(currentCircleNumber)
        svgElement.classList.add("clicked")
        changeCircleColor(svgElement, selectedCircleColor)
        svgElement.onmouseenter = null
        svgElement.onmouseleave = null
    }
}

function resetSVGElement(svgElement) {
    svgElement.classList.remove("clicked")
    changeCircleColor(svgElement, defaultCircleColor)
    svgElement.onmouseenter = function() { changeCircleColor(svgElement, selectedCircleColor) }
    svgElement.onmouseleave = function() { changeCircleColor(svgElement, defaultCircleColor) }
}

function changeCircleColor( svgElement, colorValue) {
    Array.from(svgElement.children)
        .filter( function getCircles(childElement) {
            if( childElement.nodeName.localeCompare("circle") === 0) {
                return true
            } else {
                return false
            }
        })
        .reduce( function flatten(alreadyFlattenedArray, someArray) {
            return alreadyFlattenedArray.concat(someArray)
        }, [])
        .forEach(function addHoverColor(circleElement) {
            circleElement.style.fill = colorValue
        })
}

function resetOtherCircles( currentCircle ) {
    var sideBar = document.getElementById("sideBar")
    Array.from(sideBar.children)
        .map( function getSvgsFromDiv(circleDiv) {
            return Array.from(circleDiv.children)
                    .filter( function getSvgs(childElement) {
                        var svgName = "svg"
                        if( childElement.nodeName.localeCompare(svgName) === 0 ) {
                            return true
                        } else {
                            return false
                        }
                    })
        })
        .reduce( function flatten(alreadyFlattenedArray, someArray) {
            return alreadyFlattenedArray.concat(someArray)
        }, [])
        .filter( function getCirclesToReset(svgElement) {
            var text = getTextInCircle(svgElement)
            if( text.localeCompare(currentCircle) !== 0) {
                return true
            } else {
                return false
            }
        })
        .forEach( function resetCircleIfApplicable(svgElement) {
            if( svgElement.classList.contains("clicked") ) {
                resetSVGElement(svgElement)
            } else {
                changeCircleColor(svgElement, defaultCircleColor)
            }
            
        })
}

function getTextInCircle(svgElement) {
    console.log('inside getTextInCircle!')
    var text = Array.from(svgElement.children)
                .filter( function (svgChild) {
                    if( svgChild.localName.localeCompare("text") === 0 ) {
                        return true;
                    } else {
                        return false;
                    }
                })
                .reduce( function flatten(alreadyFlattenedArray, someArray) {
                    return alreadyFlattenedArray.concat(someArray)
                }, [])
                .map( function getText(textElement) {
                    return textElement.innerHTML
                })
    return text[0]
}

function showAppropriatePanel(svgElement) {
    var text = getTextInCircle(svgElement)
    console.log('after text in circle!' + text)
    if( text.localeCompare("1") === 0 ) {
        panelDisplayer.hideMainPanel()
        panelDisplayer.hideBuildPanel()
        panelDisplayer.hideFinishFeaturePanel()
        panelDisplayer.showFeatureCreationPanel()
    } else if( text.localeCompare("3") === 0 ) {
        panelDisplayer.hideBuildPanel()
        panelDisplayer.hideFeatureCreationPanel()
        panelDisplayer.hideMainPanel()
        panelDisplayer.showFinishFeaturePanel()
    } else {
        console.log('showing default stuff')
        //by default, always show main panel
        panelDisplayer.hideBuildPanel()
        panelDisplayer.hideFeatureCreationPanel()
        panelDisplayer.hideFinishFeaturePanel()
        panelDisplayer.showMainPanel()
    }
}

exports.clickCircle = ( circleNumber ) => {
    var circleToClick = getSvgCircle( circleNumber )
    console.log('circle to click:')
    console.log(circleToClick)
    if( circleToClick != null ) {
        activateOrDeactivateCircleOnClick(circleToClick)
    }
}

function getSvgCircle( innerTextOfCircle ) {
    var sideBar = document.getElementById("sideBar")
    var circleToClick =  Array.from(sideBar.children)
                        .map( function getSvgsFromDiv(circleDiv) {
                            return Array.from(circleDiv.children)
                                    .filter( function getSvgs(childElement) {
                                        var svgName = "svg"
                                        if( childElement.nodeName.localeCompare(svgName) === 0 ) {
                                            return true
                                        } else {
                                            return false
                                        }
                                    })
                        })
                        .reduce( function flatten(alreadyFlattenedArray, someArray) {
                            return alreadyFlattenedArray.concat(someArray)
                        }, [])
                        .filter( function getCircle(svgElement) {
                            var text = getTextInCircle(svgElement)
                            if( text.localeCompare( innerTextOfCircle ) === 0) {
                                return true
                            } else {
                                return false
                            }
                        })
    if( circleToClick != null && circleToClick.length > 0 ) {
        return circleToClick[0]
    } else {
        return null
    }
}