// Initializing all elements constants
const temperateField = document.querySelector(".weather1");
const cityField = document.querySelector(".weather2 p");
const dateField = document.querySelector(".weather2 span");
const emojiField = document.querySelector(".weather3 img");
const weatherField = document.querySelector(".weather3 span");
const searchField = document.querySelector(".searchField");
const form = document.querySelector("form");

// Adding event listener to the form
form.addEventListener("submit", search);

// Define alert thresholds
const temperatureThreshold = 35; // example threshold for temperature

// Function to fetch Data from Weather API
const fetchData = async (target) => {
  try {
    const url = `https://api.weatherapi.com/v1/current.json?key=5b27a6ef3547402582e62007222306&q=${target}`;

    const response = await fetch(url);
    const data = await response.json();

    // Destructuring
    const {
      current: {
        temp_c,
        condition: { text, icon },
      },
      location: { name, localtime },
    } = data;

    // Round temperatures to nearest integer
    const roundedTemp = Math.round(temp);
    const roundedFeelsLike = Math.round(feels_like);
    const roundedTempMin = Math.round(temp_min);
    const roundedTempMax = Math.round(temp_max);

    // Store the weather data
    const weatherEntry = {
      temp: roundedTemp,
      feels_like: roundedFeelsLike,
      temp_min: roundedTempMin,
      temp_max: roundedTempMax,
      description,
      icon,
      dt: new Date(dt * 1000), // Convert Unix timestamp to Date object
    };

    weatherData.push(weatherEntry);

    // Update DOM
    updateDom(weatherEntry);
    handleRollups();
    checkAlerts();
    updateVisualization();
  } catch (error) {
    alert("Location not found");
  }
};

// Function to update DOM
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
    const avgTemp = Math.round(data.temps.reduce((a, b) => a + b, 0) / data.temps.length);
    const maxTemp = Math.max(...data.temps);
    const minTemp = Math.min(...data.temps);
    const dominantCondition = data.conditions
      .reduce((a, c) => (a[c] = (a[c] || 0) + 1, a), {});
    const mostFrequentCondition = Object.keys(dominantCondition).reduce((a, b) => dominantCondition[a] > dominantCondition[b] ? a : b);

    console.log(`Date: ${date}`);
    console.log(`Average Temp: ${avgTemp}°C`);
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

// Function to update visualization
function updateVisualization() {
  const dailyData = weatherData.reduce((acc, entry) => {
    const date = entry.dt.toISOString().split('T')[0]; // YYYY-MM-DD
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(entry.temp);

    return acc;
  }, {});

  const labels = Object.keys(dailyData);
  const temperatures = labels.map(date => {
    const temps = dailyData[date];
    return Math.round(temps.reduce((a, b) => a + b, 0) / temps.length); // Average temperature
  });

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Average Temperature',
          data: temperatures,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: ${context.parsed.y}°C`;
            }
          }
        }
      }
    },
  });
}

// Function to search the location
function search(e) {
  e.preventDefault();
  target = searchField.value.toLowerCase();
  fetchData(target);
}

// Adding event listener to the form
form.addEventListener("submit", search);

// Fetch data for all locations every 5 minutes
const fetchAllData = async () => {
  for (let target of targets) {
    await fetchData(target);
  }
};

setInterval(() => fetchAllData(), 5 * 60 * 1000);

// Initial data fetch for all locations
fetchAllData();
