// API Key
var APIkey = "f6c07ef86365493fa87bc4a6bef5f02d";

//default city
var currentCity = "";
var lastCity = "";



// get the input location
var getCurrentConditions = (event) => {
    let city = $('#search-city').val();
    currentCity = $('#search-city').val();
    let queryURL = "https://api.openweathermap.org/data/2.5/weather?q=" + city + "&units=imperial" + "&APPID=" + APIkey;
    fetch(queryURL)
        .then((response) => {
            return response.json();
        })
        .then((response) => {
            // Save city to local storage
            saveCity(city);
            $('#search-error').text("");
            // Create icon for the current weather using Open Weather Maps
            let currentWeatherIcon = "https://openweathermap.org/img/w/" + response.weather[0].icon + ".png";
            // Offset UTC timezone - using moment.js
            let currentTimeUTC = response.dt;
            let currentTimeZoneOffset = response.timezone;
            let currentTimeZoneOffsetHours = currentTimeZoneOffset / 60 / 60;
            let currentMoment = moment.unix(currentTimeUTC).utc().utcOffset(currentTimeZoneOffsetHours);
            renderCities();
            // Obtain the 5day forecast for the searched city
            getFiveDayForecast(event);
            // Set the header text to the found city name
            $('#header-text').text(response.name);
            // HTML for the results of search
            let currentWeatherHTML = `
            <h3>${response.name} ${currentMoment.format("(MM/DD/YY)")}<img src="${currentWeatherIcon}"></h3>
            <ul class="list-unstyled">
                <li>Temperature: ${response.main.temp}&#8457;</li>
                <li>Humidity: ${response.main.humidity}%</li>
                <li>Wind Speed: ${response.wind.speed} mph</li>
            </ul>`;
            // Append the results to the DOM
            $('#current-weather').html(currentWeatherHTML);
            // Get the latitude and longitude for the UV search from Open Weather Maps API
            let latitude = response.coord.lat;
            let longitude = response.coord.lon;
            let uvQueryURL = "api.openweathermap.org/data/2.5/uvi?lat=" + latitude + "&lon=" + longitude + "&APPID=" + APIkey;
            // API solution for Cross-origin resource sharing (CORS) error: https://cors-anywhere.herokuapp.com/
            uvQueryURL = "https://cors-anywhere.herokuapp.com/" + uvQueryURL;
            // Fetch the UV information and build the color display for the UV index
            fetch(uvQueryURL)
                .then((response) => {
                    return response.json();
                })
                .then((response) => {
                    let uvIndex = response.value;
                    $('#uvIndex').html(`UV Index: <span id="uvVal"> ${uvIndex}</span>`);
                    if (uvIndex >= 0 && uvIndex < 3) {
                        $('#uvVal').attr("class", "uv-favorable");
                    } else if (uvIndex >= 3 && uvIndex < 8) {
                        $('#uvVal').attr("class", "uv-moderate");
                    } else if (uvIndex >= 8) {
                        $('#uvVal').attr("class", "uv-severe");
                    }
                });
        })
}

// Obtain the five day forecast 
var getFiveDayForecast = (event) => {
    let city = $('#search-city').val();
    // Set up URL for API search using forecast search
    let queryURL = "https://api.openweathermap.org/data/2.5/forecast?q=" + city + "&units=imperial" + "&APPID=" + APIkey;
    // Fetch from API
    fetch(queryURL)
        .then((response) => {
            return response.json();
        })
        .then((response) => { //put it to html
            let fiveDayForecastHTML = `
        <h2>5-Day Forecast:</h2>
        <div id="fiveDayForecastUl" class="d-inline-flex flex-wrap ">`;
            // Loop over the 5 day forecast and build the template HTML using UTC offset and Open Weather Map icon
            for (let i = 0; i < response.list.length; i++) {
                let dayData = response.list[i];
                let dayTimeUTC = dayData.dt;
                let timeZoneOffset = response.city.timezone;
                let timeZoneOffsetHours = timeZoneOffset / 60 / 60;
                let thisMoment = moment.unix(dayTimeUTC).utc().utcOffset(timeZoneOffsetHours);
                let iconURL = "https://openweathermap.org/img/w/" + dayData.weather[0].icon + ".png";
                // Only displaying mid-day forecasts
                if (thisMoment.format("HH:mm:ss") === "11:00:00" || thisMoment.format("HH:mm:ss") === "12:00:00" || thisMoment.format("HH:mm:ss") === "13:00:00") {
                    fiveDayForecastHTML += `
                <div class="weather-card card m-2 p0">
                    <ul class="list-unstyled p-3">
                        <li>${thisMoment.format("MM/DD/YY")}</li>
                        <li class="weather-icon"><img src="${iconURL}"></li>
                        <li>Temp: ${dayData.main.temp}&#8457;</li>
                        <br>
                        <li>Humidity: ${dayData.main.humidity}%</li>
                    </ul>
                </div>`;
                }
            }
            fiveDayForecastHTML += `</div>`;
            $('#five-day-forecast').html(fiveDayForecastHTML);
        })
}

//Save the city to localStorage
var saveCity = (newCity) => {
    let cityExists = false;
    // Check if City exists in local storage
    for (let i = 0; i < localStorage.length; i++) {
        if (localStorage["cities" + i] === newCity) {
            cityExists = true;
            break;
        }
    }
    if (cityExists === false) {
        localStorage.setItem('cities' + localStorage.length, newCity);
    }
}

var renderCities = () => {
    $('#city-results').empty();
    if (localStorage.length === 0) {
        if (lastCity) {
            $('#search-city').attr("value", lastCity);
        } else {
            $('#search-city').attr("value", "Toronto");
        }
    } else {
        let lastCityKey = "cities" + (localStorage.length - 1);
        lastCity = localStorage.getItem(lastCityKey);
        $('#search-city').attr("value", lastCity);
        for (let i = 0; i < localStorage.length; i++) {
            let city = localStorage.getItem("cities" + i);
            let cityEl;
            if (currentCity === "") {
                currentCity = lastCity;
            }
            // Set button class to active for currentCity
            if (city === currentCity) {
                cityEl = `<button type="button" class="list-group-item list-group-item-action active">${city}</button></li>`;
            } else {
                cityEl = `<button type="button" class="list-group-item list-group-item-action">${city}</button></li>`;
            }
        }
        // clear button 
        if (localStorage.length > 0) {
            $('#clear-storage').html($('<a id="clear-storage" href="#">clear</a>'));
        } else {
            $('#clear-storage').html('');
        }
    }

}

// New city search button event listener
$('#search-button').on("click", (event) => {
    event.preventDefault();
    currentCity = $('#search-city').val();
    getCurrentConditions(event);
});

// Old searched cities buttons event listener
$('#city-results').on("click", (event) => {
    event.preventDefault();
    $('#search-city').val(event.target.textContent);
    currentCity = $('#search-city').val();
    getCurrentConditions(event);
});

// Clear old searched cities from localStorage event listener
$("#clear-storage").on("click", (event) => {
    localStorage.clear();
    renderCities();
});

renderCities();

getCurrentConditions();