# STARcalc
STAR lab late fee calculator

Like the rest of the extension, this is a work in progress.  
If you are a SLAB and want to help out I've included some helpful links below.  
They are basically in the order you should view them if you have no idea what you are 
doing, but feel free to jump around.

1. [an introduction to extension development made by Google](https://developer.chrome.com/extensions/getstarted)
2. [content script basics](https://developer.chrome.com/extensions/content_scripts)
  * we aren't explicitly using content scripts, but we are running scripts in the context of the page content
  * using content scripts are actually where I'd like to get the extension, only having the extension 
  available if there is a late fee to calculate
3. [documentation page for tabs.executeScript](https://developer.chrome.com/extensions/tabs#method-executeScript)
  * this is what we actually use over content scripts
