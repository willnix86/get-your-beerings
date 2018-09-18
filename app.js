const OPEN_BREWERY_URL = 'https://api.openbrewerydb.org/breweries';

let currPage = 1;
let searchTarget = $('#city');
let search = searchTarget.val();
let userCoords;
let breweriesArr = [];

function getUserLocation() {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(function(position) {
            return userCoords = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            }
        })
    } else {
        $('.js-alert').append("<p>Geolocation is currently unavailable.</p>");
    }
}

function watchClicks() {

    $('#submit').click(function(e) {
        e.preventDefault();
        resetResults();
        searchTarget = $('#city');
        search = searchTarget.val();
        getBreweries(search, addDistanceAndImages);
        $('.js-results').prop('hidden', false);
        $('#see-results').prop('hidden', false);
        $('#city').val("");
    });

    $('.js-pagination').on('click', '#see-results', function(e){
        e.preventDefault();
        renderResults(breweriesArr);
        $('#next-page').prop('hidden', false);
    });

    $('.js-pagination').on('click', '#next-page', function(e){
        e.preventDefault();
        $('.js-results').empty();
        currPage++;
        getNextPageOfResults(search, addDistanceAndImages);
        $('#see-results').prop('hidden', false);
    });

    $('.js-pagination').on('click', '#prev-page', function(e){
        e.preventDefault();
        $('.js-results').empty();
        currPage--;
        getPrevPageOfResults(search, addDistanceAndImages);
        if (currPage <= 1) {
            $('#previous-page').prop('hidden', true);
        };
        $('#see-results').prop('hidden', false);
    });

    $('main').on('change', '.sort-target', function(e){
        alert('changed');
    });

}

function resetResults() {
    $('.js-results').empty();
    $('#next-page').prop('hidden', true);
    $('#prev-page').prop('hidden', true);
}

function displayError(err) {
    $('.js-error').append(`<p>Sorry, this search encountered the following error: ${err}</p>`)
}

function formatQueryParams(params) {
    const queryItems = Object.keys(params)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    return queryItems.join('&');
  }

function getBreweries(search, callback) {

    const params = {
        by_city: search,
        sort: '+name',
        per_page: 10
    }

    $.getJSON(OPEN_BREWERY_URL, params, callback);

}

function getNextPageOfResults(search, callback) {

    const params = {
        by_city: search,
        sort: '+name',
        per_page: 10,
        page: currPage
    }

    $.getJSON(OPEN_BREWERY_URL, params, callback);

    $('#prev-page').prop('hidden', false);

}

function getPrevPageOfResults(search, callback) {

    const params = {
        by_city: search,
        sort: '+name',
        per_page: 10,
        page: currPage
    }

    $.getJSON(OPEN_BREWERY_URL, params, callback);

}

function getBreweryID(index, brewery) {
    const FOURSQUARE_VENUE_URL = 'https://api.foursquare.com/v2/venues/search';
    
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
    
    fetch(url)
        .then(response => {
            if (response.ok) {
                return response.json();
        }
        throw new Error(response.statusText);
    })    
        .then(responseJson => getBreweryImages(index, responseJson.response.venues[0].id))
        .catch(error => displayError(error))

}

function getBreweryImages(index, breweryID) {

    const FOURSQUARE_PHOTOS_URL = `https://api.foursquare.com/v2/venues/${breweryID}/photos`;

    const params = {
        client_id: 'UDLXPN3F3FDLXPIWUAI40YXL40CETQXRDZAVDRPYFLFTJHL4',
        client_secret: 'MP0EYU1LNSWMR20S3AXZDJ05KMQOMNIIPIRE4ZRTCXV4IFYI',
        v: 20180323,
        group: 'venue',
        limit: 2
    }

    const queryString = formatQueryParams(params);
    const url = FOURSQUARE_PHOTOS_URL + '?' + queryString;
    
    fetch(url)
        .then(response => {
            if (response.ok) {
                return response.json();
        }
        throw new Error(response.statusText);
    })
        .then(responseJson => addImagesToBrewery(index, responseJson.response.photos.items))
        .catch(error => displayError(error))

    }

function addImagesToBrewery(index, images) {
  return breweriesArr[index].images = images;
    }

function getDistanceToBrewery(index, brewery) {

    const DISTANCE_MATRIX_URL = 'http://www.mapquestapi.com/directions/v2/routematrix?key=3Tq7BgL2BLnK1uBtZosI3iLuhoqNDm4G';

    const params = {

        locations: [
            {
                latLng: {
                    lat: parseFloat(userCoords.lat),
                    lng: parseFloat(userCoords.lng)
                }
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

        if (response.distance && response.distance != 'undefined') {

            return breweriesArr[index].distance = `${response.distance[1].toFixed(1)} mi`;

        } else {

            return breweriesArr[index].distance = ' ';

        }

    })

}

function addDistanceAndImages(results) {
    breweriesArr = results;

    for (let i = 0; i < breweriesArr.length; i++) {

            getBreweryID(i, breweriesArr[i]);
            getDistanceToBrewery(i, breweriesArr[i]);

    }

    return breweriesArr;
}

function renderResults(results) {

  /*  $(`
    <form name='sort-results'>
        <fieldset>
            <legend>Sort results</legend>
            <label for='name'><input class='sort-target' type='radio' name='sort' id='name' value='distance' checked>By Name</label>
            <label for='distance'><input class='sort-target' type='radio' name='sort' id='distance' value='distance'>By Distance</label>
        </fieldset>
    </form>
    `).insertBefore('.js-results'); */
    
    for (let i = 0; i < results.length; i++) {

        if (results[i].brewery_type !== 'planning') {

            $('.js-results').append(`
            <div id='${results[i].distance}'>
                <a class='brewery-name' href='${results[i].website_url}' target="_default">${results[i].name}</a> <span class='js-distance'>${results[i].distance} </span>
                <address>
                    ${results[i].street}<br>
                    ${results[i].city}<br>
                    ${results[i].state}<br>
                    ${results[i].postal_code}<br>
                </address>
                <div class='brewery-images>
                <img src=${results[i].images[0].prefix}200x200${results[i].images[0].suffix} alt='a picture from ${results[i].name} by ${results[i].images[0].user.firstName} ${results[i].images[0].user.lastName}'>
                <img src=${results[i].images[1].prefix}200x200${results[i].images[1].suffix} alt='a picture from ${results[i].name} by ${results[i].images[1].user.firstName} ${results[i].images[1].user.lastName}'>
            </div>
            </div>
        `);

        }

    }

    $('#see-results').prop('hidden', true);
    //return breweriesArr = [];

};

$(watchClicks(), getUserLocation());

/*

            

*/