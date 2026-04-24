const fs = require('fs');

const indexHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Aesthetic Weather Dashboard</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="styles.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body>
    <div class="dashboard">
        <sidebar class="sidebar">
            <div class="logo">
                <i class="fa-solid fa-cloud-sun"></i>
                <h2>Weather.io</h2>
            </div>
            <nav class="nav-menu">
                <a href="#" class="active"><i class="fa-solid fa-border-all"></i> Dashboard</a>
                <a href="#"><i class="fa-solid fa-map-location-dot"></i> Map</a>
                <a href="#"><i class="fa-solid fa-heart"></i> Saved Locations</a>
                <a href="#"><i class="fa-solid fa-calendar-days"></i> Calendar</a>
            </nav>
            <div class="theme-switch-wrapper">
                <label class="theme-switch" for="checkbox">
                    <input type="checkbox" id="checkbox" />
                    <div class="slider round">
                        <i class="fa-solid fa-sun icon-sun"></i>
                        <i class="fa-solid fa-moon icon-moon"></i>
                    </div>
                </label>
                <em>Dark Mode</em>
            </div>
        </sidebar>

        <main class="main-content">
            <header class="top-header">
                <div class="search-bar">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <input type="text" placeholder="Search city...">
                </div>
                <div class="user-profile">
                    <img src="https://ui-avatars.com/api/?name=User&background=random" alt="User">
                </div>
            </header>

            <div id="loader" class="state-message">
                <div class="spinner"></div>
                <p>Fetching weather data...</p>
            </div>
            
            <div id="error-message" class="state-message hidden">
                <p id="error-text">Unable to fetch weather.</p>
                <button onclick="fetchWeatherData()">Try Again</button>
            </div>

            <div id="weather-content" class="dashboard-grid hidden">
                <!-- Current Weather -->
                <div class="widget current-weather">
                    <div class="location-info">
                        <h2 id="location-name">--</h2>
                        <p id="date"></p>
                    </div>
                    <div class="weather-main">
                        <div class="weather-icon" id="weather-icon">☁️</div>
                        <div class="temp">
                            <h1 id="temperature">--</h1><span class="unit">°C</span>
                        </div>
                    </div>
                    <p id="weather-desc" class="condition">--</p>
                </div>

                <!-- Highlights -->
                <div class="widget highlights">
                    <h3>Today's Highlights</h3>
                    <div class="highlights-grid">
                        <div class="highlight-card">
                            <p class="label">Wind Status</p>
                            <h2 id="wind-speed">-- <span class="unit">km/h</span></h2>
                            <p class="desc" id="wind-dir-desc">--</p>
                        </div>
                        <div class="highlight-card">
                            <p class="label">Humidity</p>
                            <h2 id="humidity">-- <span class="unit">%</span></h2>
                            <div class="progress-bar"><div class="progress" id="humidity-bar"></div></div>
                        </div>
                        <div class="highlight-card">
                            <p class="label">Visibility</p>
                            <h2 id="visibility">-- <span class="unit">km</span></h2>
                        </div>
                        <div class="highlight-card">
                            <p class="label">Air Pressure</p>
                            <h2 id="pressure">-- <span class="unit">hPa</span></h2>
                        </div>
                    </div>
                </div>

                <!-- Forecast -->
                <div class="widget forecast">
                    <h3>5-Day Forecast</h3>
                    <div class="forecast-list" id="forecast-list">
                        <!-- Populated by JS -->
                    </div>
                </div>
            </div>
        </main>
    </div>
    <script src="app.js"></script>
</body>
</html>`;

const stylesCSS = `:root {
    --bg-color: #f5f7fa;
    --sidebar-bg: #ffffff;
    --widget-bg: #ffffff;
    --text-main: #2d3748;
    --text-muted: #718096;
    --border-color: #e2e8f0;
    --primary-color: #4299e1;
    --accent-color: #e2e8f0;
    --shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

[data-theme="dark"] {
    --bg-color: #1a202c;
    --sidebar-bg: #2d3748;
    --widget-bg: #2d3748;
    --text-main: #f7fafc;
    --text-muted: #a0aec0;
    --border-color: #4a5568;
    --primary-color: #63b3ed;
    --accent-color: #4a5568;
    --shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: 'Poppins', sans-serif;
    transition: background-color 0.3s, color 0.3s, border-color 0.3s;
}

body {
    background-color: var(--bg-color);
    color: var(--text-main);
    overflow-x: hidden;
}

.dashboard {
    display: flex;
    min-height: 100vh;
}

/* Sidebar */
.sidebar {
    width: 250px;
    background-color: var(--sidebar-bg);
    padding: 30px 20px;
    border-right: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
}

.logo {
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--primary-color);
    margin-bottom: 50px;
    font-size: 1.2rem;
}

.logo i {
    font-size: 2rem;
}

.nav-menu {
    display: flex;
    flex-direction: column;
    gap: 15px;
    flex-grow: 1;
}

.nav-menu a {
    text-decoration: none;
    color: var(--text-muted);
    padding: 12px 15px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    gap: 15px;
    font-weight: 500;
}

.nav-menu a:hover, .nav-menu a.active {
    background-color: var(--primary-color);
    color: #fff;
}

/* Theme Switch */
.theme-switch-wrapper {
    display: flex;
    align-items: center;
    gap: 15px;
    padding: 15px 0;
    color: var(--text-muted);
}

.theme-switch {
    display: inline-block;
    height: 34px;
    position: relative;
    width: 60px;
}

.theme-switch input { display:none; }

.slider {
    background-color: #ccc;
    bottom: 0;
    cursor: pointer;
    left: 0;
    position: absolute;
    right: 0;
    top: 0;
    transition: .4s;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 8px;
}

.slider .icon-sun { color: #f39c12; font-size: 14px; z-index: 1;}
.slider .icon-moon { color: #f1c40f; font-size: 14px; z-index: 1;}

.slider:before {
    background-color: #fff;
    bottom: 4px;
    content: "";
    height: 26px;
    left: 4px;
    position: absolute;
    transition: .4s;
    width: 26px;
    z-index: 2;
}

input:checked + .slider { background-color: var(--primary-color); }
input:checked + .slider:before { transform: translateX(26px); }

.slider.round { border-radius: 34px; }
.slider.round:before { border-radius: 50%; }

/* Main Content */
.main-content {
    flex-grow: 1;
    padding: 30px 40px;
    overflow-y: auto;
}

.top-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 40px;
}

.search-bar {
    background-color: var(--widget-bg);
    border-radius: 20px;
    padding: 10px 20px;
    display: flex;
    align-items: center;
    gap: 10px;
    width: 300px;
    box-shadow: var(--shadow);
}

.search-bar input {
    border: none;
    background: transparent;
    outline: none;
    color: var(--text-main);
    width: 100%;
}

.user-profile img {
    width: 45px;
    height: 45px;
    border-radius: 50%;
}

/* Dashboard Grid */
.dashboard-grid {
    display: grid;
    grid-template-columns: 350px 1fr;
    grid-template-rows: auto auto;
    gap: 30px;
}

.widget {
    background-color: var(--widget-bg);
    border-radius: 20px;
    padding: 30px;
    box-shadow: var(--shadow);
}

/* Current Weather Widget */
.current-weather {
    grid-column: 1 / 2;
    grid-row: 1 / 3;
    display: flex;
    flex-direction: column;
}

.location-info h2 {
    font-size: 2rem;
    margin-bottom: 5px;
}
.location-info p {
    color: var(--text-muted);
}

.weather-main {
    margin: 40px 0;
    text-align: center;
}

.weather-icon {
    font-size: 8rem;
    margin-bottom: 20px;
    animation: float 3s ease-in-out infinite;
}

@keyframes float {
    0% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
    100% { transform: translateY(0px); }
}

.temp {
    display: flex;
    justify-content: center;
    align-items: flex-start;
}

.temp h1 {
    font-size: 5rem;
    font-weight: 300;
    line-height: 1;
}
.temp .unit {
    font-size: 2rem;
    margin-top: 10px;
}

.condition {
    text-align: center;
    font-size: 1.5rem;
    color: var(--primary-color);
    font-weight: 500;
}

/* Highlights */
.highlights {
    grid-column: 2 / 3;
    grid-row: 1 / 2;
}

.highlights h3 {
    margin-bottom: 20px;
    font-weight: 600;
}

.highlights-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
}

.highlight-card {
    background-color: var(--bg-color);
    border-radius: 15px;
    padding: 20px;
    text-align: center;
}

.highlight-card .label {
    color: var(--text-muted);
    font-size: 0.9rem;
    margin-bottom: 10px;
}

.highlight-card h2 {
    font-size: 2rem;
    font-weight: 600;
}
.highlight-card .unit {
    font-size: 1rem;
    font-weight: 400;
}

.progress-bar {
    width: 100%;
    height: 8px;
    background-color: var(--accent-color);
    border-radius: 4px;
    margin-top: 15px;
    overflow: hidden;
}

.progress {
    height: 100%;
    background-color: #f1c40f;
    width: 0%;
    transition: width 1s ease;
}

/* Forecast Widget */
.forecast {
    grid-column: 2 / 3;
    grid-row: 2 / 3;
}

.forecast h3 {
    margin-bottom: 20px;
}

.forecast-list {
    display: flex;
    justify-content: space-between;
    gap: 15px;
}

.forecast-item {
    background-color: var(--bg-color);
    border-radius: 15px;
    padding: 15px;
    text-align: center;
    flex: 1;
}

.forecast-item p {
    color: var(--text-muted);
    margin-bottom: 10px;
}

.forecast-item .icon {
    font-size: 2rem;
    margin: 10px 0;
}

.forecast-item .temps {
    font-weight: 500;
}

/* Utilities */
.hidden { display: none !important; }

.state-message {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 400px;
}

.spinner {
    width: 50px;
    height: 50px;
    border: 4px solid var(--accent-color);
    border-top: 4px solid var(--primary-color);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 20px;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

button {
    margin-top: 20px;
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    background: var(--primary-color);
    color: #fff;
    font-weight: 600;
    cursor: pointer;
}
`;

const appJS = `const weatherCodeMap = {
    0: { desc: 'Clear sky', icon: '☀️' },
    1: { desc: 'Mainly clear', icon: '🌤️' },
    2: { desc: 'Partly cloudy', icon: '⛅' },
    3: { desc: 'Overcast', icon: '☁️' },
    45: { desc: 'Fog', icon: '🌫️' },
    48: { desc: 'Depositing rime fog', icon: '🌫️' },
    51: { desc: 'Light Drizzle', icon: '🌧️' },
    53: { desc: 'Moderate Drizzle', icon: '🌧️' },
    55: { desc: 'Dense Drizzle', icon: '🌧️' },
    61: { desc: 'Slight Rain', icon: '🌦️' },
    63: { desc: 'Moderate Rain', icon: '🌧️' },
    65: { desc: 'Heavy Rain', icon: '🌧️' },
    71: { desc: 'Slight Snow', icon: '🌨️' },
    73: { desc: 'Moderate Snow', icon: '❄️' },
    75: { desc: 'Heavy Snow', icon: '❄️' },
    95: { desc: 'Thunderstorm', icon: '⛈️' }
};

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    fetchWeatherData();
});

const UI = {
    loader: document.getElementById('loader'),
    content: document.getElementById('weather-content'),
    error: document.getElementById('error-message'),
    errorText: document.getElementById('error-text'),
    
    date: document.getElementById('date'),
    locationName: document.getElementById('location-name'),
    temperature: document.getElementById('temperature'),
    icon: document.getElementById('weather-icon'),
    description: document.getElementById('weather-desc'),
    
    windSpeed: document.getElementById('wind-speed'),
    windDir: document.getElementById('wind-dir-desc'),
    humidity: document.getElementById('humidity'),
    humidityBar: document.getElementById('humidity-bar'),
    visibility: document.getElementById('visibility'),
    pressure: document.getElementById('pressure'),
    
    forecastList: document.getElementById('forecast-list'),
    themeToggle: document.getElementById('checkbox')
};

function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        UI.themeToggle.checked = true;
    }

    UI.themeToggle.addEventListener('change', function() {
        if (this.checked) {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
        }
    });
}

function setState(state) {
    UI.loader.classList.add('hidden');
    UI.content.classList.add('hidden');
    UI.error.classList.add('hidden');

    if (state === 'loading') {
        UI.loader.classList.remove('hidden');
    } else if (state === 'content') {
        UI.content.classList.remove('hidden');
    } else if (state === 'error') {
        UI.error.classList.remove('hidden');
    }
}

function formatDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    UI.date.textContent = new Date().toLocaleDateString('en-US', options);
}

function fetchWeatherData() {
    setState('loading');
    formatDate();

    if (!navigator.geolocation) {
        showError("Geolocation is not supported by your browser");
        return;
    }

    navigator.geolocation.getCurrentPosition(
        position => {
            const { latitude, longitude } = position.coords;
            getWeatherFromCoords(latitude, longitude);
            getLocationName(latitude, longitude);
        },
        err => {
            showError("Please allow location access to see your local weather.");
        }
    );
}

async function getWeatherFromCoords(lat, lon) {
    try {
        const url = \`https://api.open-meteo.com/v1/forecast?latitude=\${lat}&longitude=\${lon}&current_weather=true&hourly=relativehumidity_2m,visibility,surface_pressure&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto\`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch weather data");
        const data = await response.json();
        
        displayCurrentWeather(data.current_weather, data.hourly);
        displayForecast(data.daily);
        setState('content');
    } catch (err) {
        showError(err.message);
    }
}

async function getLocationName(lat, lon) {
    try {
        const res = await fetch(\`https://nominatim.openstreetmap.org/reverse?format=json&lat=\${lat}&lon=\${lon}\`);
        const data = await res.json();
        const city = data.address.city || data.address.town || data.address.village || data.address.county || 'Your Location';
        UI.locationName.textContent = city;
    } catch (err) {
        UI.locationName.textContent = "Current Location";
    }
}

function displayCurrentWeather(current, hourly) {
    const code = current.weathercode;
    const weatherInfo = weatherCodeMap[code] || { desc: 'Unknown', icon: '🌡️' };

    UI.temperature.textContent = Math.round(current.temperature);
    UI.icon.textContent = weatherInfo.icon;
    UI.description.textContent = weatherInfo.desc;
    
    // Wind
    UI.windSpeed.innerHTML = \`\${current.windspeed} <span class="unit">km/h</span>\`;
    UI.windDir.textContent = getWindDirection(current.winddirection);
    
    // Hourly data (using first available for current time roughly)
    const humidity = hourly.relativehumidity_2m[0];
    const visibility = (hourly.visibility[0] / 1000).toFixed(1); // to km
    const pressure = hourly.surface_pressure[0];

    UI.humidity.innerHTML = \`\${humidity} <span class="unit">%</span>\`;
    UI.humidityBar.style.width = \`\${humidity}%\`;
    
    UI.visibility.innerHTML = \`\${visibility} <span class="unit">km</span>\`;
    UI.pressure.innerHTML = \`\${Math.round(pressure)} <span class="unit">hPa</span>\`;
}

function displayForecast(daily) {
    UI.forecastList.innerHTML = '';
    // Display next 5 days
    for (let i = 1; i <= 5; i++) {
        const date = new Date(daily.time[i]);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const code = daily.weathercode[i];
        const max = Math.round(daily.temperature_2m_max[i]);
        const min = Math.round(daily.temperature_2m_min[i]);
        const icon = weatherCodeMap[code] ? weatherCodeMap[code].icon : '🌡️';

        const item = document.createElement('div');
        item.className = 'forecast-item';
        item.innerHTML = \`
            <p>\${dayName}</p>
            <div class="icon">\${icon}</div>
            <div class="temps">
                <span>\${max}°</span> / <span style="color: var(--text-muted);">\${min}°</span>
            </div>
        \`;
        UI.forecastList.appendChild(item);
    }
}

function getWindDirection(degree) {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(((degree %= 360) < 0 ? degree + 360 : degree) / 45) % 8;
    return directions[index];
}

function showError(msg) {
    setState('error');
    UI.errorText.textContent = msg;
}
`;

fs.writeFileSync('index.html', indexHTML);
fs.writeFileSync('styles.css', stylesCSS);
fs.writeFileSync('app.js', appJS);

console.log("Files updated successfully.");
