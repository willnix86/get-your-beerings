'use strict';

const OPEN_BREWERY_URL = 'https://api.openbrewerydb.org/breweries';
const DISTANCE_MATRIX_URL = 'http://www.mapquestapi.com/directions/v2/routematrix?key=3Tq7BgL2BLnK1uBtZosI3iLuhoqNDm4G';
const FOURSQUARE_VENUE_URL = 'https://api.foursquare.com/v2/venues/search';


let currPage = 1;
let searchTarget = $('#city');
let search = searchTarget.val();
let numResults = 0;

// Get user location

//1 User searches for a city
function watchSubmit() {

    $('#submit').click(function(e) {
        e.preventDefault();
        resetResults();
        searchTarget = $('#city');
        search = searchTarget.val();
        getDataFromAPI(search, getAPIResult);
        $('.js-results').prop('hidden', false);
        $('#city').val("");
        $('#next-page').prop('hidden', false);
    });

    $('.js-pagination').on('click', '#next-page', function(e){
        e.preventDefault();
        $('.js-results').empty();
        currPage++;
        getNextPage(search, getAPIResult);
    });

    $('.js-pagination').on('click', '#prev-page', function(e){
        e.preventDefault();
        $('.js-results').empty();
        currPage--;
        getPrevPage(search, getAPIResult);
        if (currPage <= 1) {
            $('#previous-page').prop('hidden', true);
        };
    });

}

// Reset results window
function resetResults() {
    $('.js-results').empty();
    $('#next-page').prop('hidden'), true;
    $('.js-pagination').prop('hidden', true);
}

function displayError(err) {
    $('.js-error').append(`<p>Sorry, this search encountered the following error: ${err}</p>`)
}

function formatQueryParams(params) {
    const queryItems = Object.keys(params)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    return queryItems.join('&');
  }

//2 Send and receive data from API
function getDataFromAPI(search, callback) {

    const params = {
        by_city: search,
        sort: '+type,+name',
        per_page: 10
    }

    $.getJSON(OPEN_BREWERY_URL, params, callback);
}

//2b Get next page
function getNextPage(search, callback) {

    const params = {
        by_city: search,
        sort: '+type,+name',
        page: currPage
    }

    $.getJSON(OPEN_BREWERY_URL, params, callback);

    $('#prev-page').prop('hidden', false);

}

//2c Get previous page
function getPrevPage(search, callback) {

    const params = {
        by_city: search,
        sort: '+type,+name',
        page: currPage
    }

    $.getJSON(OPEN_BREWERY_URL, params, callback);

}

//3 Retrieve single item
function getAPIResult(data) {

    if (data.length < 10) {
        $('#next-page').addClass('hidden');
    } else {
        for (let i = 0; i < data.length; i++) {
            numResults++;
            if (data[i].street !== "") {
                getBreweryID(i, data[i]);
                getDistance(i, data[i]);
                renderResult(i, data[i]);
            }
        }

        $('.totalResults').text('Total number of results: ' + numResults);
        
    }
};

// Retrieve image for each brewery
function getBreweryID(number, brewery) {
    
    const params = {
        client_id: 'UDLXPN3F3FDLXPIWUAI40YXL40CETQXRDZAVDRPYFLFTJHL4',
        client_secret: 'MP0EYU1LNSWMR20S3AXZDJ05KMQOMNIIPIRE4ZRTCXV4IFYI',
        v: 20180323,
        near: search,
        query: brewery.name,
        limit: 1
    }

    const queryString = formatQueryParams(params);
    const url = FOURSQUARE_VENUE_URL + '?' + queryString;
    
    fetch(url, params)
    .then(response =>response.json())
    .then(responseJson => getBreweryImage(number, responseJson.response.venues[0].id))
    .catch(error => displayError(error))
}

function getBreweryImage(number, breweryID) {

    const FOURSQUARE_PHOTOS_URL = `https://api.foursquare.com/v2/venues/${breweryID}/photos`;

    const params = {
        client_id: 'UDLXPN3F3FDLXPIWUAI40YXL40CETQXRDZAVDRPYFLFTJHL4',
        client_secret: 'MP0EYU1LNSWMR20S3AXZDJ05KMQOMNIIPIRE4ZRTCXV4IFYI',
        v: 20180323,
        group: 'venue',
        limit: 3
    }

    const queryString = formatQueryParams(params);
    const url = FOURSQUARE_PHOTOS_URL + '?' + queryString;
    
    fetch(url, params)
    .then(response =>response.json())
    .then(responseJson => renderImage(number, responseJson.response.photos.items))
    .catch(error => displayError(error))
    }

function renderImage(number, images) {
    for (let i=0; i < images.length; i++) {
        $('#result-' + number).find('div.images-container').append(`
        <div><img src=${images[i].prefix}200x200${images[i].suffix} alt='brewery picture'></div>
        `);
    }
    }

// Retrieve distance to each brewery
function getDistance(number, brewery) {

    const params = {

        locations: [
            {
                street: "1015 California Ave",
                city: "santa monica",
                county: "los angeles",
                state: "ca"
            },
            {
                latLng: {
                    lat: parseFloat(brewery.latitude),
                    lng: parseFloat(brewery.longitude)
                }
            }
        ]
    };

    $.ajax({
        type: 'POST',
        url: DISTANCE_MATRIX_URL,
        data: JSON.stringify(params),
        contentType: "application/json",
        dataType: 'json',
    })
    .done(function (response) {
        console.log(response.distance);

        if (response.distance) {

        $('#result-' + number).find('span.js-distance').text( response.distance[1].toFixed(1) + " mi");

        } else {
            $('#result-' + number).find('span.js-distance').text(' ');
        }

    })

}

// CREATE A WAY FOR SCREENREADER TO KNOW HOW MANY RESULTS THERE ARE!

//4 Display item on HTML
function renderResult(number, brewery) {
    $('.js-results').append(`
                <div id='result-${number}'>
                <a class='brewery-name' href='${brewery.website_url}' target="_default">${brewery.name}</a> <span class='js-distance'></span>
                <p class='brewery-type'>${brewery.brewery_type}</p>
                <address>
                    ${brewery.street}<br>
                    ${brewery.city}<br>
                    ${brewery.state}<br>
                    ${brewery.postal_code}<br>
                </address>
                <div class='images-container'></div>
                </div>
            `);
};

$(watchSubmit());