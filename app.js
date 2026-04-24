const weatherCodeMap = {
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

const STORAGE_KEYS = {
    theme: 'theme',
    savedLocations: 'savedLocationsV1'
};

const appState = {
    activeView: 'dashboard',
    currentLocation: null,
    dailyForecast: null,
    hasWeather: false,
    savedLocations: []
};

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initNavigation();
    initSavedLocations();
    initSearch();
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
    themeToggle: document.getElementById('checkbox'),

    navDashboard: document.getElementById('nav-dashboard'),
    navSaved: document.getElementById('nav-saved'),
    navCalendar: document.getElementById('nav-calendar'),

    savedPanel: document.getElementById('saved-panel'),
    calendarPanel: document.getElementById('calendar-panel'),
    savedLocationsList: document.getElementById('saved-locations-list'),

    saveLocationBtn: document.getElementById('save-location-btn'),
    calendarDate: document.getElementById('calendar-date'),
    calendarWeather: document.getElementById('calendar-weather'),
    citySearch: document.getElementById('city-search')
};

function initTheme() {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.theme) || 'light';
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        UI.themeToggle.checked = true;
    }

    UI.themeToggle.addEventListener('change', function() {
        if (this.checked) {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem(STORAGE_KEYS.theme, 'dark');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem(STORAGE_KEYS.theme, 'light');
        }
    });
}

function initNavigation() {
    UI.navDashboard.addEventListener('click', (e) => {
        e.preventDefault();
        setMainView('dashboard');
    });

    UI.navSaved.addEventListener('click', (e) => {
        e.preventDefault();
        setMainView('saved');
    });

    UI.navCalendar.addEventListener('click', (e) => {
        e.preventDefault();
        setMainView('calendar');
    });
}

function setMainView(view) {
    appState.activeView = view;

    UI.navDashboard.classList.toggle('active', view === 'dashboard');
    UI.navSaved.classList.toggle('active', view === 'saved');
    UI.navCalendar.classList.toggle('active', view === 'calendar');

    UI.savedPanel.classList.add('hidden');
    UI.calendarPanel.classList.add('hidden');
    UI.loader.classList.add('hidden');
    UI.error.classList.add('hidden');
    UI.content.classList.add('hidden');

    if (view === 'dashboard') {
        if (appState.hasWeather) {
            UI.content.classList.remove('hidden');
        } else {
            UI.loader.classList.remove('hidden');
        }
        return;
    }

    if (view === 'saved') {
        UI.savedPanel.classList.remove('hidden');
        renderSavedLocations();
        return;
    }

    UI.calendarPanel.classList.remove('hidden');
    renderCalendarForDate(UI.calendarDate.value);
}

function setState(state) {
    UI.loader.classList.add('hidden');
    UI.content.classList.add('hidden');
    UI.error.classList.add('hidden');

    if (appState.activeView !== 'dashboard') return;

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
    setMainView('dashboard');
    setState('loading');
    formatDate();

    if (!navigator.geolocation) {
        showError("Geolocation is not supported by your browser");
        return;
    }

    navigator.geolocation.getCurrentPosition(
        position => {
            const { latitude, longitude } = position.coords;
            loadWeatherByCoords(latitude, longitude);
        },
        err => {
            showError("Please allow location access to see your local weather.");
        }
    );
}

async function loadWeatherByCoords(lat, lon, locationName) {
    setMainView('dashboard');
    setState('loading');
    formatDate();

    try {
        const [data, resolvedLocationName] = await Promise.all([
            getWeatherFromCoords(lat, lon),
            locationName ? Promise.resolve(locationName) : getLocationName(lat, lon)
        ]);

        appState.currentLocation = {
            name: resolvedLocationName,
            lat,
            lon
        };

        UI.locationName.textContent = resolvedLocationName;
        displayCurrentWeather(data.current_weather, data.hourly);
        displayForecast(data.daily);
        appState.dailyForecast = data.daily;
        appState.hasWeather = true;

        initCalendarControl(data.daily);
        setState('content');
    } catch (err) {
        showError(err.message);
    }
}

async function getWeatherFromCoords(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relativehumidity_2m,visibility,surface_pressure&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch weather data');
    return response.json();
}

async function getLocationName(lat, lon) {
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
        const data = await res.json();
        const city = data.address.city || data.address.town || data.address.village || data.address.county || 'Your Location';
        return city;
    } catch (err) {
        return 'Current Location';
    }
}

function initSearch() {
    UI.citySearch.addEventListener('keydown', async (event) => {
        if (event.key !== 'Enter') return;
        const cityName = UI.citySearch.value.trim();
        if (!cityName) return;

        try {
            setMainView('dashboard');
            setState('loading');
            const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`);
            if (!response.ok) throw new Error('City search failed');

            const data = await response.json();
            if (!data.results || data.results.length === 0) {
                throw new Error('City not found. Try another name.');
            }

            const result = data.results[0];
            const label = result.country
                ? `${result.name}, ${result.country}`
                : result.name;

            await loadWeatherByCoords(result.latitude, result.longitude, label);
            UI.citySearch.value = '';
        } catch (err) {
            showError(err.message);
        }
    });
}

function displayCurrentWeather(current, hourly) {
    const code = current.weathercode;
    const weatherInfo = weatherCodeMap[code] || { desc: 'Unknown', icon: '🌡️' };

    UI.temperature.textContent = Math.round(current.temperature);
    UI.icon.textContent = weatherInfo.icon;
    UI.description.textContent = weatherInfo.desc;
    
    // Wind
    UI.windSpeed.innerHTML = `${current.windspeed} <span class="unit">km/h</span>`;
    UI.windDir.textContent = getWindDirection(current.winddirection);
    
    const currentTimeIndex = hourly.time ? hourly.time.indexOf(current.time) : -1;
    const index = currentTimeIndex >= 0 ? currentTimeIndex : 0;

    const humidity = hourly.relativehumidity_2m[index];
    const visibility = (hourly.visibility[index] / 1000).toFixed(1);
    const pressure = hourly.surface_pressure[index];

    UI.humidity.innerHTML = `${humidity} <span class="unit">%</span>`;
    UI.humidityBar.style.width = `${humidity}%`;
    
    UI.visibility.innerHTML = `${visibility} <span class="unit">km</span>`;
    UI.pressure.innerHTML = `${Math.round(pressure)} <span class="unit">hPa</span>`;
}

function displayForecast(daily) {
    UI.forecastList.innerHTML = '';
    // Display next 5 days
    for (let i = 1; i <= 5 && i < daily.time.length; i++) {
        const date = new Date(daily.time[i]);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const code = daily.weathercode[i];
        const max = Math.round(daily.temperature_2m_max[i]);
        const min = Math.round(daily.temperature_2m_min[i]);
        const icon = weatherCodeMap[code] ? weatherCodeMap[code].icon : '🌡️';

        const item = document.createElement('div');
        item.className = 'forecast-item';
        item.innerHTML = `
            <p>${dayName}</p>
            <div class="icon">${icon}</div>
            <div class="temps">
                <span>${max}°</span> / <span style="color: var(--text-muted);">${min}°</span>
            </div>
        `;
        UI.forecastList.appendChild(item);
    }
}

function initSavedLocations() {
    appState.savedLocations = getSavedLocations();
    renderSavedLocations();

    UI.saveLocationBtn.addEventListener('click', () => {
        if (!appState.currentLocation) return;

        const existing = appState.savedLocations.some(
            (item) => locationKey(item) === locationKey(appState.currentLocation)
        );

        if (existing) {
            alert('Location is already saved.');
            return;
        }

        appState.savedLocations.push(appState.currentLocation);
        persistSavedLocations();
        renderSavedLocations();
        alert('Location saved successfully.');
    });
}

function getSavedLocations() {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.savedLocations);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed.filter((item) => (
            item &&
            typeof item.name === 'string' &&
            typeof item.lat === 'number' &&
            typeof item.lon === 'number'
        ));
    } catch (err) {
        return [];
    }
}

function persistSavedLocations() {
    localStorage.setItem(STORAGE_KEYS.savedLocations, JSON.stringify(appState.savedLocations));
}

function locationKey(location) {
    return `${location.lat.toFixed(3)},${location.lon.toFixed(3)}`;
}

function renderSavedLocations() {
    if (!UI.savedLocationsList) return;

    UI.savedLocationsList.innerHTML = '';

    if (appState.savedLocations.length === 0) {
        UI.savedLocationsList.innerHTML = `
            <div class="saved-location-item">
                <h4>No locations saved yet</h4>
                <p>Open Dashboard and use "Save This Location".</p>
            </div>
        `;
        return;
    }

    appState.savedLocations.forEach((location, index) => {
        const item = document.createElement('div');
        item.className = 'saved-location-item';
        item.innerHTML = `
            <h4>${location.name}</h4>
            <p>${location.lat.toFixed(2)}, ${location.lon.toFixed(2)}</p>
            <div class="saved-location-actions">
                <button class="load-btn" data-index="${index}">Load</button>
                <button class="remove-btn" data-index="${index}">Remove</button>
            </div>
        `;

        UI.savedLocationsList.appendChild(item);
    });

    UI.savedLocationsList.querySelectorAll('.load-btn').forEach((button) => {
        button.addEventListener('click', async () => {
            const index = Number(button.dataset.index);
            const location = appState.savedLocations[index];
            if (!location) return;
            await loadWeatherByCoords(location.lat, location.lon, location.name);
        });
    });

    UI.savedLocationsList.querySelectorAll('.remove-btn').forEach((button) => {
        button.addEventListener('click', () => {
            const index = Number(button.dataset.index);
            if (Number.isNaN(index)) return;

            appState.savedLocations.splice(index, 1);
            persistSavedLocations();
            renderSavedLocations();
        });
    });
}

function initCalendarControl(daily) {
    if (!daily || !daily.time || daily.time.length === 0) {
        UI.calendarDate.value = '';
        UI.calendarDate.min = '';
        UI.calendarDate.max = '';
        return;
    }

    UI.calendarDate.min = daily.time[0];
    UI.calendarDate.max = daily.time[daily.time.length - 1];

    const todayIso = new Date().toISOString().slice(0, 10);
    if (todayIso >= UI.calendarDate.min && todayIso <= UI.calendarDate.max) {
        UI.calendarDate.value = todayIso;
    } else {
        UI.calendarDate.value = daily.time[0];
    }

    renderCalendarForDate(UI.calendarDate.value);
}

UI.calendarDate.addEventListener('change', (event) => {
    renderCalendarForDate(event.target.value);
});

function renderCalendarForDate(dateValue) {
    if (!appState.dailyForecast || !dateValue) {
        UI.calendarWeather.textContent = 'Select a date to see forecast information.';
        return;
    }

    const index = appState.dailyForecast.time.indexOf(dateValue);
    if (index === -1) {
        UI.calendarWeather.textContent = 'No forecast data available for this date.';
        return;
    }

    const code = appState.dailyForecast.weathercode[index];
    const weatherInfo = weatherCodeMap[code] || { desc: 'Unknown', icon: '🌡️' };
    const max = Math.round(appState.dailyForecast.temperature_2m_max[index]);
    const min = Math.round(appState.dailyForecast.temperature_2m_min[index]);
    const humanDate = new Date(dateValue).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
    });

    UI.calendarWeather.innerHTML = `
        <p><strong>${humanDate}</strong></p>
        <p style="font-size: 1.4rem;">${weatherInfo.icon} ${weatherInfo.desc}</p>
        <p>High: <strong>${max}°C</strong> | Low: <strong>${min}°C</strong></p>
    `;
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

window.fetchWeatherData = fetchWeatherData;
