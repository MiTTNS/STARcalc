let hours = document.getElementById('hours');

function constructOptions() {
  let message = document.createElement('p')
  message.textContent = "this is where you world edit our open times"
  hours.appendChild(message)
}
constructOptions();
