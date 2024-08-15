// Initializing all elements constants
const temperateField = document.querySelector(".weather1");
const cityField = document.querySelector(".weather2 p");
const dateField = document.querySelector(".weather2 span");
const emojiField = document.querySelector(".weather3 img");
const weatherField = document.querySelector(".weather3 span");
const searchField = document.querySelector(".searchField");
const form = document.querySelector("form");
const ctx = document.getElementById('weatherChart').getContext('2d');

// Default Locations
const targets = ["delhi", "mumbai", "chennai", "bangalore", "kolkata", "hyderabad"];
let weatherData = []; // Array to hold weather data for rollups and aggregates

// Define alert thresholds
const temperatureThreshold = 35; // Example threshold for temperature

// Adding event listener to the form
form.addEventListener("submit", search);

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

    // Store the weather data
    const weatherEntry = {
      temp: temp_c,
      description: text,
      icon: icon,
      dt: new Date(localtime),
    };

    weatherData.push(weatherEntry);

    // Update DOM
    updateDom(temp_c, name, localtime, icon, text);
    handleRollups();
    checkAlerts();
    updateVisualization();
  } catch (error) {
    alert("Location not found");
  }
};

// Function to update DOM
function updateDom(temperate, city, time, emoji, text) {
  const exactTime = time.split(" ")[1];
  const exactDate = time.split(" ")[0];
  const exactDay = getDayFullName(new Date(exactDate).getDay());

  temperateField.innerText = `${temperate}°C`;
  cityField.innerText = city;
  dateField.innerText = `${exactTime} - ${exactDay}   ${exactDate}`;
  emojiField.src = `http:${emoji}`;
  weatherField.innerText = text;
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

// Function to update visualization
let chart; // Declare chart variable globally

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
    return temps.reduce((a, b) => a + b, 0) / temps.length; // Average temperature
  });

  const chartData = {
    labels: labels,
    datasets: [
      {
        label: 'Average Temperature',
        data: temperatures,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
      },
    ],
  };

  if (chart) {
    // Update existing chart
    chart.data = chartData;
    chart.update();
  } else {
    // Create new chart
    chart = new Chart(ctx, {
      type: 'line',
      data: chartData,
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}°C`;
              }
            }
          }
        }
      },
    });
  }
}

// Function to search the location
function search(e) {
  e.preventDefault();

  const target = searchField.value.trim().toLowerCase();
  
  if (target) {
    fetchData(target);
  } else {
    alert("Please enter a valid location.");
  }
}

// Function to get the name of day
function getDayFullName(num) {
  switch (num) {
    case 0:
      return "Sunday";
    case 1:
      return "Monday";
    case 2:
      return "Tuesday";
    case 3:
      return "Wednesday";
    case 4:
      return "Thursday";
    case 5:
      return "Friday";
    case 6:
      return "Saturday";
    default:
      return "Don't Know";
  }
}

// Fetch data for all locations every 5 minutes
const fetchAllData = async () => {
  weatherData = []; // Clear existing data
  for (let target of targets) {
    await fetchData(target);
  }
};

setInterval(fetchAllData, 5 * 60 * 1000);

// Initial data fetch for all locations
fetchAllData();
