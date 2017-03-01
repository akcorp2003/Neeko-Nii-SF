exports.openOrCloseMenu = (document) => {
    var secondCircle = document.getElementsByClassName("secondCircle")
    console.log(secondCircle)
    Array.from(secondCircle).forEach(function toggleSecondCircle(circle) {
        console.log(circle)
        circle.classList.toggle("slds-align--absolute-center")
        circle.classList.toggle("slds-p-left--small")
    })

    var sideBar = document.getElementById("sideBar")
    sideBar.classList.toggle("sideBarExpanded")
    sideBar.classList.toggle("sideBarMinimized")
    
    var menuText = document.getElementsByClassName("expandedText")
    console.log(menuText)
    Array.from(menuText).forEach(function toggle(textDiv) {
        textDiv.classList.toggle("slds-hide")
    })

    

    var featurePanel = document.getElementById("featurePanel")
    var mainPanel = document.getElementById("mainPanel")
    var buildPanel = document.getElementById("buildPanel")
    var finishFeaturePanel = document.getElementById("finishFeaturePanel")
    if( sideBar.classList.contains("sideBarExpanded") ) {
        featurePanel.style.marginLeft = "150px"
        mainPanel.style.marginLeft = "210px"
        buildPanel.style.marginLeft = "210px"
        finishFeaturePanel.style.marginLeft = "150px"
    } else {
        featurePanel.style.marginLeft = "90px"
        mainPanel.style.marginLeft = "90px"
        buildPanel.style.marginLeft = "90px"
        finishFeaturePanel.style.marginLeft = "90px"
    }
}