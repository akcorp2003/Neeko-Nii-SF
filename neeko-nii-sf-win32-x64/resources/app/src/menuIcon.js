exports.openOrCloseMenu = (document) => {

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
    var finishFeaturePanel = document.getElementById("finishFeaturePanel")
    var commitPanel = document.getElementById("commitPanel")
    if( sideBar.classList.contains("sideBarExpanded") ) {
        featurePanel.style.marginLeft = "150px"
        mainPanel.style.marginLeft = "210px"
        finishFeaturePanel.style.marginLeft = "150px"
        commitPanel.style.marginLeft = "210px"
    } else {
        featurePanel.style.marginLeft = "90px"
        mainPanel.style.marginLeft = "90px"
        finishFeaturePanel.style.marginLeft = "90px"
        commitPanel.style.marginLeft = "90px"
    }
}