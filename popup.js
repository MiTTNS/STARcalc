class Day {
  constructor(openHour, closeHour, nextDay, addsLates) {
    this.openHour = openHour;
    this.closeHour = closeHour;
    this.nextDay = nextDay;
    this.hoursOpen = closeHour - openHour;
    this.addsLates = addsLates;
  }
}


let saturday = new Day(0, 0, 0, false);
let friday = new Day(10, 18, saturday, true);
let thursday = new Day(10, 22, friday, true);
let wednesday = new Day(10, 22, thursday, true);
let tuesday = new Day(10, 22, wednesday, true);
let monday = new Day(10, 22, tuesday, true);
let sunday = new Day(12, 18, monday, true);

saturday.nextDay = sunday;

let week = [sunday, monday, tuesday, wednesday, thursday, friday, saturday];
// I could detect changes to dyas of the week w/ a flag
// this flag could also be used to tell the user if normal hours are biung used

let getLatesBtn = document.getElementById('getLatesBtn');
let root = document.getElementById('root');
// ^^ this refers to the button in popup.html

var startHours = 0;
var endHours = 0;
var day = monday;

getLatesBtn.onclick = function(element) {
  root.innerHTML = "";
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.executeScript(tabs[0].id, {file: 'getDates.js'}, function(results) {
      chrome.storage.sync.get(["scheduledEndTime", "realEndTime", "scheduledTimeFlag", "realTimeFlag"], function(data) {
        //this is where I do the calculation
        if (data.scheduledTimeFlag && data.realTimeFlag) {
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

          var lates = 0; // this could be moved up

          if (days < 0 || (days == 0 && (endHour - startHour <= 0 || (endHour - startHour == 0 && endMin > startMin)))) {
            var noLateDiv = document.createElement('div');
            var noLateP = document.createElement('p');

            noLateDiv.appendChild(noLateP);
            noLateP.textContent = "not late";
            root.appendChild(noLateDiv);

            chrome.storage.sync.set({scheduledTimeFlag: false, realTimeFlag: false});

            return
          }

          if (days == 0) {
            endHours = endHour - startHour - (endMin < startMin ? 1 : 0);
            startHours = 0;
          } else if (days > 0) {
            startHours = week[startDateDate.getDay()].closeHour - startHour - (parseInt(startMin) == 0 ? 0 : 1);
            endHours = endHour - week[endDateDate.getDay()].openHour - (parseInt(endMin) < parseInt(startMin) ? 1 : 0) + (parseInt(endMin) > 0 ? 1 : 0);
          } else {
            // return b/c this isn't late
            // this should actually be an unreachable case
            // I'm going to keep the not late block before all this to catch
            // non late returns, but also have this block output a message
            // indicating this should be unreachable
            // but if you see it let me know
          }

          lates = 0;
          day = week[startDateDate.getDay()];

          while (days > 0 || startHours > 0 || endHours > 0) {
            if (days > 0 && startHours > 0) {
              lates += startHours;
              startHours = 0;
              days -= 1;
              lates += 1;
              day = day.nextDay;
            } else if (days > 0) {// and we accrue
              if (day.addsLates) {
                lates += day.hoursOpen;
                lates += 1;
              }
              days -= 1;
              day = day.nextDay;
              // this needs to look at if the day accrues
            } else {
              lates += endHours;
              endHours = 0;
            }
          }

          // instead of calling Day.lates() put a while loop here
          // or that could be in the else block above
          // I also need to check the flags somewhere

          let div = document.createElement('div');

          let p1 = document.createElement('p');
          p1.textContent = "hours: " + lates;

          let p2 = document.createElement('p');
          p2.textContent = "late fee: $" + lates * 5;

          div.appendChild(p1);
          div.appendChild(p2);

          root.appendChild(div);

          chrome.storage.sync.set({scheduledTimeFlag: false, realTimeFlag: false});
        } else {
          let div = document.createElement('div');

          let p1 = document.createElement('p');
          p1.textContent = "you are prob on the wrong page";

          div.appendChild(p1);

          root.appendChild(div);
        }
      });
    });
  });
};
