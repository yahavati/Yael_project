// Gregorian to Hebrew date converter using the Hebcal REST API

// Grab the HTML elements by their id
const dateInput   = document.getElementById("dateInput");
const afterSunset = document.getElementById("afterSunset");
const convertBtn  = document.getElementById("convertBtn");
const errorBox    = document.getElementById("error");
const resultBox   = document.getElementById("result");

// Default the date picker to today (local time, not UTC)
const now = new Date();
now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
dateInput.value = now.toISOString().slice(0, 10);

// buildUrl: builds the Hebcal converter URL for a given date
// (format from the API docs, section 1: Gregorian to Hebrew - single)
function buildUrl(date, isAfterSunset) {
  const params = new URLSearchParams({
    cfg: "json",  // response format
    g2h: "1",     // Gregorian -> Hebrew
    date: date,   // YYYY-MM-DD
    strict: "1"   // return 400 for invalid dates
  });

  if (isAfterSunset) {
    params.append("gs", "on"); // after sunset: Hebrew day has already changed
  }

  return "https://www.hebcal.com/converter?" + params.toString();
}

// convertDate: validates input, calls the API, shows the result or an error
async function convertDate() {
  const date = dateInput.value;

  // No date selected
  if (!date) {
    showError("נא לבחור תאריך");
    return;
  }

  // Loading state: disable the button until the response arrives
  hideAll();
  convertBtn.disabled = true;
  convertBtn.textContent = "טוען...";

  try {
    const url = buildUrl(date, afterSunset.checked);
    const response = await fetch(url);   // send the request and wait

    // Non-200 status means the server rejected the date
    if (!response.ok) {
      throw new Error("bad-date");
    }

    const data = await response.json();  // parse JSON into an object
    showResult(data);

  } catch (err) {
    if (err.message === "bad-date") {
      showError("התאריך שנבחר אינו תקין");
    } else {
      showError("אין חיבור לשירות. בדקו את חיבור האינטרנט ונסו שוב");
    }
  } finally {
    // Always restore the button
    convertBtn.disabled = false;
    convertBtn.textContent = "המר";
  }
}

// showResult: fills the result box from the API response
// Uses: data.hebrew, data.heDateParts {d, m, y}, data.events []
function showResult(data) {
  document.getElementById("hebrewDate").textContent = data.hebrew;
  document.getElementById("partDay").textContent    = data.heDateParts.d;
  document.getElementById("partMonth").textContent  = data.heDateParts.m;
  document.getElementById("partYear").textContent   = data.heDateParts.y;

  // Rebuild the events list: one <li> per event
  const eventsList = document.getElementById("events");
  eventsList.innerHTML = "";

  const events = data.events || [];
  if (events.length === 0) {
    eventsList.innerHTML = "<li>אין אירועים מיוחדים</li>";
  } else {
    events.forEach(function (eventName) {
      const li = document.createElement("li");
      li.textContent = eventName;
      eventsList.appendChild(li);
    });
  }

  resultBox.classList.remove("hidden");
}

// showError: displays a message in the red error box
function showError(message) {
  hideAll();
  errorBox.textContent = message;
  errorBox.classList.remove("hidden");
}

// hideAll: hides both the error box and the result box
function hideAll() {
  errorBox.classList.add("hidden");
  resultBox.classList.add("hidden");
}

// Run the conversion on button click or on Enter in the date field
convertBtn.addEventListener("click", convertDate);

dateInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter") convertDate();
});
