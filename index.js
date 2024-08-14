// Initializing all elements constants
const temperateField = document.querySelector(".weather1");
const cityField = document.querySelector(".weather2 p");
const dateField = document.querySelector(".weather2 span");
const emojiField = document.querySelector(".weather3 img");
const weatherField = document.querySelector(".weather3 span");
const searchField = document.querySelector(".searchField");
const form = document.querySelector("form");

// Default Location
let target = "New Delhi";
let weatherData = []; // Array to hold weather data for rollups and aggregates

// Define alert thresholds
const temperatureThreshold = 35; // example threshold for temperature

// Function to fetch Data from Weather API
const fetchData = async (target) => {
  try {
    const apiKey = "YOUR_OPENWEATHERMAP_API_KEY";
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${target}&appid=${apiKey}&units=metric`;

    const response = await fetch(url);
    const data = await response.json();

    // Destructuring
    const {
      main: { temp, feels_like, temp_min, temp_max },
      weather: [{ description, icon }],
      dt,
    } = data;

    // Convert temperature values from Kelvin to Celsius (already in Celsius here)
    // Store the weather data
    const weatherEntry = {
      temp,
      feels_like,
      temp_min,
      temp_max,
      description,
      icon,
      dt: new Date(dt * 1000), // Convert Unix timestamp to Date object
    };

    weatherData.push(weatherEntry);

    // Calling update Dom Function
    updateDom(weatherEntry);
    handleRollups();
    checkAlerts();
  } catch (error) {
    alert("Location not found");
  }
};

// Function to update Dom
function updateDom({ temp, description, icon, dt }) {
  const exactTime = dt.toLocaleTimeString();
  const exactDate = dt.toLocaleDateString();
  const exactDay = dt.toLocaleDateString('en-US', { weekday: 'long' });

  temperateField.innerText = `${temp}°C`;
  cityField.innerText = target.charAt(0).toUpperCase() + target.slice(1);
  dateField.innerText = `${exactTime} - ${exactDay} ${exactDate}`;
  emojiField.src = `http://openweathermap.org/img/wn/${icon}.png`;
  weatherField.innerText = description;
}

// Function to handle rollups and aggregates
function handleRollups() {
  const dailyData = weatherData.reduce((acc, entry) => {
    const date = entry.dt.toISOString().split('T')[0]; // YYYY-MM-DD
    if (!acc[date]) {
      acc[date] = {
        temps: [],
        conditions: [],
      };
    }
    acc[date].temps.push(entry.temp);
    acc[date].conditions.push(entry.description);

    return acc;
  }, {});

  for (const [date, data] of Object.entries(dailyData)) {
    const avgTemp = data.temps.reduce((a, b) => a + b, 0) / data.temps.length;
    const maxTemp = Math.max(...data.temps);
    const minTemp = Math.min(...data.temps);
    const dominantCondition = data.conditions
      .reduce((a, c) => (a[c] = (a[c] || 0) + 1, a), {});
    const mostFrequentCondition = Object.keys(dominantCondition).reduce((a, b) => dominantCondition[a] > dominantCondition[b] ? a : b);

    console.log(`Date: ${date}`);
    console.log(`Average Temp: ${avgTemp.toFixed(1)}°C`);
    console.log(`Max Temp: ${maxTemp}°C`);
    console.log(`Min Temp: ${minTemp}°C`);
    console.log(`Dominant Weather Condition: ${mostFrequentCondition}`);
  }
}

// Function to check for alerts
function checkAlerts() {
  const latestData = weatherData[weatherData.length - 1];
  if (latestData.temp > temperatureThreshold) {
    console.log(`Alert: Temperature exceeds ${temperatureThreshold}°C!`);
    // Optional: Trigger an email or other notification here
  }
}

// Function to search the location
function search(e) {
  e.preventDefault();
  target = searchField.value.toLowerCase();
  fetchData(target);
}

// Adding event listener to the form
form.addEventListener("submit", search);

// Fetch data every 5 minutes
setInterval(() => fetchData(target), 5 * 60 * 1000);

// Initial data fetch
fetchData(target);
