const temperateField = document.querySelector(".weather1");
const cityField = document.querySelector(".weather2 p");
const dateField = document.querySelector(".weather2 span");
const emojiField = document.querySelector(".weather3 img");
const weatherField = document.querySelector(".weather3 span");
const searchField = document.querySelector(".searchField");
const form = document.querySelector("form");
const ctx = document.getElementById('weatherChart').getContext('2d');

const targets = ["delhi", "mumbai", "chennai", "bangalore", "kolkata", "hyderabad"];
let weatherData = []; 

const thresholds = {
    temperature: 35, 
    humidity: 70,    
    windSpeed: 15    
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
                humidity,
                wind_kph,
                condition: { text, icon },
            },
            location: { name, localtime },
        } = data;

        const weatherEntry = {
            temp: temp_c,
            humidity: humidity,
            windSpeed: wind_kph,
            description: text,
            icon: icon,
            dt: new Date(localtime),
        };

        weatherData.push(weatherEntry);

        updateDom(temp_c, name, localtime, icon, text);
        handleRollups();
        checkAlerts();
        updateVisualization();
    } catch (error) {
        alert("Location not found");
    }
};

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

function handleRollups() {
    const dailyData = weatherData.reduce((acc, entry) => {
        const date = entry.dt.toISOString().split('T')[0]; 
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
        const avgHumidity = data.humidities.reduce((a, b) => a + b, 0) / data.humidities.length;
        const avgWindSpeed = data.windSpeeds.reduce((a, b) => a + b, 0) / data.windSpeeds.length;
        const maxTemp = Math.max(...data.temps);
        const minTemp = Math.min(...data.temps);
        const dominantCondition = data.conditions
            .reduce((a, c) => (a[c] = (a[c] || 0) + 1, a), {});
        const mostFrequentCondition = Object.keys(dominantCondition).reduce((a, b) => dominantCondition[a] > dominantCondition[b] ? a : b);

        console.log(`Date: ${date}`);
        console.log(`Average Temp: ${avgTemp.toFixed(1)}°C`);
        console.log(`Average Humidity: ${avgHumidity.toFixed(1)}%`);
        console.log(`Average Wind Speed: ${avgWindSpeed.toFixed(1)} km/h`);
        console.log(`Max Temp: ${maxTemp}°C`);
        console.log(`Min Temp: ${minTemp}°C`);
        console.log(`Dominant Weather Condition: ${mostFrequentCondition}`);
    }
}

function checkAlerts() {
    const latestData = weatherData[weatherData.length - 1];
    const alerts = [];

    if (latestData.temp > thresholds.temperature) {
        alerts.push(`Temperature exceeds ${thresholds.temperature}°C!`);
    }
    if (latestData.humidity > thresholds.humidity) {
        alerts.push(`Humidity exceeds ${thresholds.humidity}%!`);
    }
    if (latestData.windSpeed > thresholds.windSpeed) {
        alerts.push(`Wind speed exceeds ${thresholds.windSpeed} km/h!`);
    }

    if (alerts.length > 0) {
        console.log('Alerts:', alerts);

        // sendEmail(alerts);

        // sendSMS(alerts);
      }
}

let chart; 

function updateVisualization() {
    const dailyData = weatherData.reduce((acc, entry) => {
        const date = entry.dt.toISOString().split('T')[0];
        if (!acc[date]) {
            acc[date] = {
                temps: [],
                humidities: [],
                windSpeeds: []
            };
        }
        acc[date].temps.push(entry.temp);
        acc[date].humidities.push(entry.humidity);
        acc[date].windSpeeds.push(entry.windSpeed);

        return acc;
    }, {});

    const labels = Object.keys(dailyData);
    const temperatures = labels.map(date => {
        const temps = dailyData[date].temps;
        return temps.reduce((a, b) => a + b, 0) / temps.length; 
    });
    const humidities = labels.map(date => {
        const humids = dailyData[date].humidities;
        return humids.reduce((a, b) => a + b, 0) / humids.length; 
    });
    const windSpeeds = labels.map(date => {
        const winds = dailyData[date].windSpeeds;
        return winds.reduce((a, b) => a + b, 0) / winds.length; 
    });

    const chartData = {
        labels: labels,
        datasets: [
            {
                label: 'Average Temperature (°C)',
                data: temperatures,
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                yAxisID: 'y',
            },
            {
                label: 'Average Humidity (%)',
                data: humidities,
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                yAxisID: 'y1',
            },
            {
                label: 'Average Wind Speed (km/h)',
                data: windSpeeds,
                borderColor: 'rgb(54, 162, 235)',
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                yAxisID: 'y2',
            },
        ],
    };

    if (chart) {
        chart.data = chartData;
        chart.update();
    } else {
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
                                const label = context.dataset.label || '';
                                return `${label}: ${context.parsed.y.toFixed(1)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Temperature (°C)',
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Humidity (%)',
                        },
                        grid: {
                            drawOnChartArea: false,
                        },
                    },
                    y2: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        offset: true,
                        title: {
                            display: true,
                            text: 'Wind Speed (km/h)',
                        },
                        grid: {
                            drawOnChartArea: false,
                        },
                    },
                }
            },
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
