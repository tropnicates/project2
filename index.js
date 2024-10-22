const temperateField = document.querySelector(".weather1");
const cityField = document.querySelector(".weather2 p");
const dateField = document.querySelector(".weather2 span");
const emojiField = document.querySelector(".weather3 img");
const weatherField = document.querySelector(".weather3 span");
const searchField = document.querySelector(".searchField");
const form = document.querySelector("form");
const ctx = document.getElementById("weatherChart").getContext("2d");

const targets = [
  "delhi",
  "mumbai",
  "chennai",
  "bangalore",
  "kolkata",
  "hyderabad",
];
let weatherData = [];

const thresholds = {
  temperature: 35,
  humidity: 70,
  windSpeed: 15,
};

// const sgMail = require('@sendgrid/mail');
// sgMail.setApiKey('YOUR_SENDGRID_API_KEY');

// function sendEmail(alerts) {
//     const msg = {
//         to: 'kun9577@gmail.com',
//         from: 'ravish9577@gmail.com',
//         subject: 'Weather Alert',
//         text: `Alerts:\n${alerts.join('\n')}`,
//         html: `<strong>Alerts:</strong><br>${alerts.join('<br>')}`,
//     };

//     sgMail.send(msg)
//         .then(() => {
//             console.log('Email sent');
//         })
//         .catch((error) => {
//             console.error('Error sending email:', error);
//         });
// }

// const twilio = require('twilio');
// const accountSid = 'YOUR_TWILIO_ACCOUNT_SID';
// const authToken = 'YOUR_TWILIO_AUTH_TOKEN';

// const client = twilio(accountSid, authToken);

// function sendSMS(alerts) {
//     client.messages.create({
//         body: `Weather Alerts:\n${alerts.join('\n')}`,
//         from: '+918873232082',
//         to: '+917878211423',
//     })
//     .then(message => console.log('SMS sent:', message.sid))
//     .catch(error => console.error('Error sending SMS:', error));
// }

form.addEventListener("submit", search);

const fetchData = async (target) => {
  try {
    const url = `https://api.weatherapi.com/v1/current.json?key=5b27a6ef3547402582e62007222306&q=${target}`;

    const response = await fetch(url);
    const data = await response.json();

    const {
      current: {
        temp_c,
        feelslike_c,
        humidity,
        wind_kph,
        condition: { text, icon },
      },
      location: { name, localtime },
    } = data;

    const weatherEntry = {
      temp: temp_c,
      feelsLike: feelslike_c,
      humidity: humidity,
      windSpeed: wind_kph,
      description: text,
      icon: icon,
      dt: new Date(localtime),
    };

    weatherData.push(weatherEntry);

    updateDom(temp_c,feelslike_c, name, localtime, icon, text);
    await saveWeatherToDatabase(weatherEntry);
    handleRollups();
    checkAlerts();
    updateVisualization();
  } catch (error) {
    alert("Location not found");
  }
};

const saveWeatherToDatabase = async (weatherEntry) => {
  try {
    const response = await fetch('http://localhost:3000/weather', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(weatherEntry), 
    });

    if (response.ok) {
      console.log('Weather data saved successfully');
    } else {
      console.error('Failed to save weather data');
    }
  } catch (error) {
    console.error('Error saving weather data:', error);
  }
};

function updateDom(temperate, feelsLike, city, time, emoji, text) {
  const exactTime = time.split(" ")[1];
  const exactDate = time.split(" ")[0];
  const exactDay = getDayFullName(new Date(exactDate).getDay());

  temperateField.innerText = `${temperate}°C (Feels like: ${feelsLike}°C)`;
  cityField.innerText = city;
  dateField.innerText = `${exactTime} - ${exactDay}   ${exactDate}`;
  emojiField.src = `http:${emoji}`;
  weatherField.innerText = text;
}

function handleRollups() {
  const dailyData = weatherData.reduce((acc, entry) => {
    const date = entry.dt.toISOString().split("T")[0];
    if (!acc[date]) {
      acc[date] = {
        temps: [],
        humidities: [],
        windSpeeds: [],
        conditions: [],
      };
    }
    acc[date].temps.push(entry.temp);
    acc[date].humidities.push(entry.humidity);
    acc[date].windSpeeds.push(entry.windSpeed);
    acc[date].conditions.push(entry.description);

    return acc;
  }, {});

  for (const [date, data] of Object.entries(dailyData)) {
    const avgTemp = data.temps.reduce((a, b) => a + b, 0) / data.temps.length;
    const avgHumidity =
      data.humidities.reduce((a, b) => a + b, 0) / data.humidities.length;
    const avgWindSpeed =
      data.windSpeeds.reduce((a, b) => a + b, 0) / data.windSpeeds.length;
    const maxTemp = Math.max(...data.temps);
    const minTemp = Math.min(...data.temps);
    const dominantCondition = data.conditions.reduce(
      (a, c) => ((a[c] = (a[c] || 0) + 1), a),
      {}
    );
    const mostFrequentCondition = Object.keys(dominantCondition).reduce(
      (a, b) => (dominantCondition[a] > dominantCondition[b] ? a : b)
    );

    console.log(`Date: ${date}`);
    console.log(`Average Temp: ${avgTemp.toFixed(1)}°C`);
    console.log(`Average Humidity: ${avgHumidity.toFixed(1)}%`);
    console.log(`Average Wind Speed: ${avgWindSpeed.toFixed(1)} km/h`);
    console.log(`Max Temp: ${maxTemp}°C`);
    console.log(`Min Temp: ${minTemp}°C`);
    console.log(`Dominant Weather Condition: ${mostFrequentCondition}`);
  }
}


const alertField = document.createElement('div');
alertField.id = 'alertField';
document.body.appendChild(alertField);

function checkAlerts() {
  const latestData = weatherData[weatherData.length - 1];
  const alerts = [];

  if (latestData.temp > thresholds.temperature) {
    alerts.push(`Temperature exceeds by ${thresholds.temperature}°C!`);
  }
  if (latestData.humidity > thresholds.humidity) {
    alerts.push(`Humidity exceeds by ${thresholds.humidity}%!`);
  }
  if (latestData.windSpeed > thresholds.windSpeed) {
    alerts.push(`Wind speed exceeds by ${thresholds.windSpeed} km/h!`);
  }

  if (alerts.length > 0) {
    alertField.innerHTML = `<strong>Alerts:</strong> <br> ${alerts.join('<br>')}`;
    alertField.classList.add("alert-danger");
  }
}


let chart;
function updateVisualization() {
  const dailyData = weatherData.reduce((acc, entry) => {
    const date = entry.dt.toISOString().split("T")[0];
    if (!acc[date]) {
      acc[date] = {
        temps: [],
        humidities: [],
        windSpeeds: [],
      };
    }
    acc[date].temps.push(entry.temp);
    acc[date].humidities.push(entry.humidity);
    acc[date].windSpeeds.push(entry.windSpeed);

    return acc;
  }, {});

  const labels = Object.keys(dailyData);
  const temperatures = labels.map((date) => {
    const temps = dailyData[date].temps;
    return temps.reduce((a, b) => a + b, 0) / temps.length;
  });
  const humidities = labels.map((date) => {
    const humids = dailyData[date].humidities;
    return humids.reduce((a, b) => a + b, 0) / humids.length;
  });
  const windSpeeds = labels.map((date) => {
    const winds = dailyData[date].windSpeeds;
    return winds.reduce((a, b) => a + b, 0) / winds.length;
  });

  const chartData = {
    labels: labels,
    datasets: [
      {
        label: "Average Temperature (°C)",
        data: temperatures,
        borderColor: "rgb(255, 69, 0)", 
        backgroundColor: "rgba(255, 69, 0, 0.1)", 
        yAxisID: "y",
        tension: 0.4, 
      },
      {
        label: "Average Humidity (%)",
        data: humidities,
        borderColor: "rgb(54, 162, 235)",
        backgroundColor: "rgba(54, 162, 235, 0.1)",
        yAxisID: "y1",
        tension: 0.4,
      },
      {
        label: "Average Wind Speed (km/h)",
        data: windSpeeds,
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.1)",
        yAxisID: "y2",
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
        labels: {
          font: {
            size: 14,
            weight: "bold",
          },
          color: "white",
        },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        titleColor: "white",
        bodyColor: "white",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.3)",
        callbacks: {
          label: function (context) {
            const label = context.dataset.label || "";
            return `${label}: ${context.parsed.y.toFixed(1)}`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: "white",
          font: {
            size: 12,
          },
        },
        grid: {
          color: "rgba(255, 255, 255, 0.1)",
        },
      },
      y: {
        title: {
          display: true,
          text: "Temperature (°C)",
          color: "white",
          font: {
            size: 14,
          },
        },
        ticks: {
          color: "white",
        },
        grid: {
          color: "rgba(255, 255, 255, 0.1)",
        },
      },
      y1: {
        title: {
          display: true,
          text: "Humidity (%)",
          color: "white",
          font: {
            size: 14,
          },
        },
        ticks: {
          color: "white",
        },
        grid: {
          color: "rgba(255, 255, 255, 0.1)",
        },
        position: "right",
        grid: {
          drawOnChartArea: false,
        },
      },
      y2: {
        title: {
          display: true,
          text: "Wind Speed (km/h)",
          color: "white",
          font: {
            size: 14,
          },
        },
        ticks: {
          color: "white",
        },
        position: "right",
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  if (chart) {
    chart.data = chartData;
    chart.options = chartOptions;
    chart.update();
  } else {
    chart = new Chart(ctx, {
      type: "line",
      data: chartData,
      options: chartOptions,
    });
  }
}

function search(e) {
  e.preventDefault();

  const target = searchField.value.trim().toLowerCase();

  if (target) {
    fetchData(target);
  } else {
    alert("Please enter a valid location.");
  }
}

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

const fetchAllData = async () => {
  weatherData = [];
  for (let target of targets) {
    await fetchData(target);
  }
};

setInterval(fetchAllData, 5 * 60 * 1000);

fetchAllData();
