function checkDiv(aDiv) {
  //return aDiv;
  return aDiv.children[1].dataset.seId === "allocation.scheduledEndTime.input" || aDiv.children[1].dataset.seId === "allocation.realEndTime.input";
}

var searches = Array.from(document.querySelectorAll("#property-field")).filter(checkDiv);

searches.forEach(function(e) {
  if (e.children[1].dataset.seId === "allocation.scheduledEndTime.input") {
    chrome.storage.sync.set({scheduledEndTime: e.children[1].innerText, scheduledTimeFlag: true});
    //console.log(e.children[1].innerText);
  } else if (e.children[1].dataset.seId === "allocation.realEndTime.input") {
    chrome.storage.sync.set({realEndTime: e.children[1].innerText, realTimeFlag: true});
    //console.log(e.children[1].innerText);
  }
})
