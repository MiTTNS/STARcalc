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

## Further work to be done:
* Options page: build out the options page to allow users to change out hours of opperation for times like summer
* Paid button: once a fee has been calculated the extension should allow the user to specify that the fee 
has been paid.  Doing so would add a line to a Google Sheets spreadsheet that the sups could refrence.  I have 
some refrences that could be helpful in making this but I still need to make sure they are good.  
* Firefox: this version works in chromium based browsers but not Firefox, and I like Firefox.  

## Install link: 
[Chrome](https://chrome.google.com/webstore/detail/star-lab-late-fee-calcula/doblbnpleipongdkgccbcbcplbeekmkc/related?hl=en&authuser=0)


# Below is file explanations
### popup.js

This file is attached to popup.html and is where most of the heavy lifting is done.  Up at the top is a definition 
for the Day class that is used to calculate late fees.  This class will need to be added to and edited in an 
effort to make the hours of opperation editable.  
   
   As a brief aside, the Day class used to have a method that took advantage of its recursive relationship 
   to the following day to calculate and return late fees.  This was changed to the while loop below because 
   the STAR lab has been open longer than 1000 days.  
   
Below the class are all the days of the week, the actual week array that holds those days, and refrences to 
elements of popup.html used to trigger events and show results.  

Finally we get to the good stuff at `getLatesBtn.onclick = function(element) {`.  The line following this clears 
the space used to output messages but after that we have...

```javascript
chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.executeScript(tabs[0].id, {file: 'getDates.js'}, function(results) {
      chrome.storage.sync.get(["scheduledEndTime", "realEndTime", "scheduledTimeFlag", "realTimeFlag"], function(data) {
```

The first line gives us access to the tabs the browser has open.   The second uses the current tab to execute a 
script called getDates.js in the context of this current tab.  getDates.js is able to read the contents of that tab to find 
the scheduled and actual end dates of of an allocation as well as set a pair of boolean flags indicating success or failure.  
Finally, the third line requests those values retrieved on the second line.  Those values are wrapped up in a 
data object refered to as "data" and passed into an un-named callback function where the rest of the opperations will
happen.  

   Another asside, if you aren't familiar with callbacks you should get acquainted, they are used everywhere in extensions
   and JavaScript in general.  Basically, imagine you have a function that takes some number and a callback as arguments.
   The number is just a integer, it might be used in some calculation, but say you need to do something with the result 
   and you need that result to be used after the calculation is completed in the function.  In an asynchronous environment
   like js this could be tricky, so instead of calling your function and then writing code directly following that function
   call you decide you want to be able to extend the code that the function runs.  So what do you do?  You make the 
   function that does your calculations take a callback as one of its arguments.  This callback acts as a second function
   that the origional function can call when it is done with its own work.  You can specify anything you want this 
   second (callback) function to do as long as you know what arguments the first function will try to pass in to that 
   callback.  Now stop imagining, because that's reality kid.  

Next we check that the flags are true to ensure we found the correct dates followed by a bunch of data massaging shown below...

```javascript
var splitStartDate = data.scheduledEndTime.split(" ");
var startDateDate = new Date(splitStartDate[0] + " " + splitStartDate[1] + " " + splitStartDate[2]);
var startTime = splitStartDate[3].split(":");
var startHour = (splitStartDate[4] == "PM" && startTime[0] != "12" ? parseInt(startTime[0]) + 12 : parseInt(startTime[0]));
var startMin = startTime[1];

var splitEndDate = data.realEndTime.split(" ");
var endDateDate = new Date(splitEndDate[0] + " " + splitEndDate[1] + " " + splitEndDate[2]);
var endTime = splitEndDate[3].split(":");
var endHour = (splitEndDate[4] == "PM" && endTime[0] != "12" ? parseInt(endTime[0]) + 12 : parseInt(endTime[0]));
var endMin = endTime[1];

var days = (endDateDate - startDateDate) / 86400000;

var lates = 0;
```

Basically were turning the String dates we pulled from the DOM into something we can use.  The names here aren't great, if
someone came along with new names for the variables I'd be okay with that.  
For refrence, "startDate" refers to the scheduled end time for a checkout.  It is the start time for the accrual late fees.
"endDate" refers to the actual end time of a checkout.  It is the end time for the accrual of late fees.  The prefix "split" 
refers to a version of those stringly typed date values that has been turned into an array.  The suffex "Date" (an extra 
occurance of the word "Date") refers to a Date object made using the original start and end dates.  The "Hour" and 
"Min" variables are going to be used later to decide how many hours late a checkout is.  The "Hour" variables are set using 
ternary operations.  If you arent familiar with ternarys I'll have more on that below.  Finally, days is calculated 
by subtracting the start date from the end date.  This normally gives the result in milliseconds, but dividing by 
86400000 turns that into days.  

Next...
```javascript
if (days < 0 || (days == 0 && (endHour - startHour <= 0 || (endHour - startHour == 0 && endMin > startMin)))) {
  var noLateDiv = document.createElement('div');
  var noLateP = document.createElement('p');

  noLateDiv.appendChild(noLateP);
  noLateP.textContent = "not late";
  root.appendChild(noLateDiv);

  chrome.storage.sync.set({scheduledTimeFlag: false, realTimeFlag: false});

  return
}
```
Just checking that the equipment is actually late.  I'm mostly sure this works right, but I kept getting distracted 
while working on it so if someone could prove it does or does not work that'd be great.  Inside the conditional it
outputs text saying the equipment is not late, resets the flags, and before returning early to pervent 
the rest of the code from running.

```javascript
if (days == 0) {
  endHours = endHour - startHour - (endMin < startMin ? 1 : 0);
  startHours = 0;
} else if (days > 0) {
  startHours = week[startDateDate.getDay()].closeHour - startHour - (parseInt(startMin) == 0 ? 0 : 1);
  endHours = endHour - week[endDateDate.getDay()].openHour - (parseInt(endMin) < parseInt(startMin) ? 1 : 0) + (parseInt(endMin) > 0 ? 1 : 0);
} else {
  // comments omitted
            
  var noLateDiv = document.createElement('div');
  var noLateP = document.createElement('p');

  noLateDiv.appendChild(noLateP);
  noLateP.textContent = "not late";
  root.appendChild(noLateDiv);

  chrome.storage.sync.set({scheduledTimeFlag: false, realTimeFlag: false});

  return
}
```

This section is all about setting up the hours for the days where a late fee is accued, but a full day does 
not elapse.  How this part and the next part work together is one of the things that has change the most accross
the different versions of the project.  If you can come up with a better way to do this let me know.  

For now it does subtraction with startHour, endHour, and the lab's hours of opperation (depending on how many 
days late the equipment is) then adding in some boolean modifiers based on the relationship between the time the
fee started accuring and the time it stopped.

Finally there is an else block that I think is redundant but I still haven't taken the time to prove.  

Ok, we just need two more things.  

```javascript
lates = 0;
day = week[startDateDate.getDay()];
```
Lates refers to the number of times a late fee has accrued.  In the UI this value will be expressed and the 
number of hours the allocation is late.  Technically this terminology is incorrect because if the allocation goes 
over night it only accures once, so I use the variable name ```lates```.  Anyway, we're making sure it's zeored 
out.  Next we're using ```startDateDate```, a date object, to index into the array ```week```, which holdes all of 
the day objects.  

We're ready to go, the next part finds out how much the late fee is worth.  

```javascript
while (days > 0 || startHours > 0 || endHours > 0) {
  if (days > 0 && startHours > 0) {
    lates += startHours;
    startHours = 0;
    days -= 1;
    lates += 1;
    day = day.nextDay;
  } else if (days > 0) {
    if (day.addsLates) {
      lates += day.hoursOpen;
      lates += 1;
    }
    days -= 1;
    day = day.nextDay;
  } else {
    lates += endHours;
    endHours = 0;
  }
}
```

This part is pretty straight forward, we just loop through the days of the week 
and add the proper amount to ```lates```.

```javascript
let div = document.createElement('div');

let p1 = document.createElement('p');
p1.textContent = "hours: " + lates;

let p2 = document.createElement('p');
p2.textContent = "late fee: $" + lates * 5;

div.appendChild(p1);
div.appendChild(p2);

root.appendChild(div);
```

We're finally in the home stretch, we just need some html elements to lode our calculated late fee into.  If you 
don't remember the top of the file where we declared ```root``` it's just a part of the popup that we use to show 
data.  Now for some one last thing ```chrome.storage.sync.set({scheduledTimeFlag: false, realTimeFlag: false});```, 
we just need to reset the flags for the time values.  These are just how we ensure the page we're on actually has 
dates.  If you look at the js document there is an else block right below this line that is what happens if both of 
these flags are not true.  

### getDates.js

Despite its small size, this file is super important.  This is what reads the DOM to find the dates for when the allocation 
was supposed to be returned and when it was actually returned.  If the extension ever stops working you should check 
the structure of WebCheckout and compair it to how this file looks through the page.  In its current state, the part 
of WebCheckout that has the info we want should look something like this:

```html
<div id="property-field" class="propery-row">
  <div class="property-sheet-label">
    scheduledEndTime:
  </div>
  <div class="property-sheet-value" data-se-id="allocation.scheduledEndTime.input">
    <property-display>
      <timestamp-renderer>
        <ng-form>
          <div class="">
            Jan 20, 2019 1:30 PM
          </div>
        </ng-form>
      </timestamp-renderer>
    </property-display>
  </div>
</div>
<br>
<div id="property-field" class="propery-row">
  <div class="property-sheet-label">
    realEndTime:
  </div>
  <div class="property-sheet-value" data-se-id="allocation.realEndTime.input">
    <property-display>
      <timestamp-renderer>
        <ng-form>
          <div class="">
            Jan 31, 2019 1:30 PM
          </div>
        </ng-form>
      </timestamp-renderer>
    </property-display>
  </div>
</div>
```

This would be surrounded by several other similar structures that make up the column on the left side of the page.  
We care about two things here, the id "property-field" and the "data-se-id" attributes.  Let's look at something: 

```javascript
var searches = Array.from(document.querySelectorAll("#property-field")).filter(checkDiv);
```
```querySelectorAll``` gives us every html element with the id "property-field".  There are a lot of those so we 
filter the results using the filter method that's apart of arrays.  That method takes a function as an argument 
(we have a word for that, remember callbacks).  The function we supply it is called ```checkDiv```, here it is:

```javascript
function checkDiv(aDiv) {
  return aDiv.children[1].dataset.seId === "allocation.scheduledEndTime.input" || aDiv.children[1].dataset.seId === "allocation.realEndTime.input";
}
```

I'm sure at least one person looking at this will not be familar with the dataset attributes in html so I'm going 
to leave a link [here](https://developer.mozilla.org/en-US/docs/Web/API/HTMLOrForeignElement/dataset) to get you 
up to speed.  These are a little weird, but the important part is that the function ```checkDiv(aDiv)``` 
is looking at the "seId" dataset attribute to determine if we need the entire div for the next part.  

Ok, we got through the hard part, we should have our data.  Now we just need to make it available.  

```javascript
searches.forEach(function(e) {
  if (e.children[1].dataset.seId === "allocation.scheduledEndTime.input") {
    chrome.storage.sync.set({scheduledEndTime: e.children[1].innerText, scheduledTimeFlag: true});
    //console.log(e.children[1].innerText);
  } else if (e.children[1].dataset.seId === "allocation.realEndTime.input") {
    chrome.storage.sync.set({realEndTime: e.children[1].innerText, realTimeFlag: true});
    //console.log(e.children[1].innerText);
  }
})
```

Loop thorugh each of the html elements and place them in the containers for either scheduled or real end time.  Also 
set the flags to true to indicate that the dates have been found.  The commented out part just prints the html elements 
in console.  I had that there for debugging, sometimes it helps to see what your working with.  
