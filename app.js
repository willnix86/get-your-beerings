//const OPEN_BREWERY_URL = 'https://api.openbrewerydb.org/breweries';
const FOURSQUARE_VENUE_URL = 'https://api.foursquare.com/v2/venues/search';

let currIndex = 0;
let currResults = 10;
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
        $('#see-results').prop('hidden', true);
        $('.js-results').prop('hidden', false);
        $('#city').val("");
    });

    $('.js-pagination').on('click', '#see-results', function(e){
        e.preventDefault();
        $('#next-page').prop('hidden', false);
        if (currResults > 10) {
            $('#prev-page').prop('hidden', false);
        }
        renderResults(breweriesArr);
    });

    $('.js-pagination').on('click', '#next-page', function(e){
        e.preventDefault();
        $('.js-results').empty();
        currResults+=10;
        currIndex+=11;
        $('#prev-page').prop('hidden', false);
        renderResults(breweriesArr);
    });

    $('.js-pagination').on('click', '#prev-page', function(e){
        e.preventDefault();
        $('.js-results').empty();
        currResults-=10;
        currIndex-=11;
       renderResults(breweriesArr);
        if (currResults <= 10) {
            $('#previous-page').prop('hidden', true);
        }
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
    if (err !== '') {
    $('.js-alert').prop('hidden', false);
    $('.js-alert').append(`<p>Sorry, this search encountered the following error: ${err}</p>`)
    }
}

function formatQueryParams(params) {
    const queryItems = Object.keys(params)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    return queryItems.join('&');
  }

function getBreweries(search, callback) {

    const params = {
        client_id: 'UDLXPN3F3FDLXPIWUAI40YXL40CETQXRDZAVDRPYFLFTJHL4',
        client_secret: 'MP0EYU1LNSWMR20S3AXZDJ05KMQOMNIIPIRE4ZRTCXV4IFYI',
        v: 20180323,
        near: search,
        limit: 50,
        categoryId: '50327c8591d4c4b30a586d5d'
    }

    $.getJSON(FOURSQUARE_VENUE_URL, params, callback);

}

function getBreweryDetails(index, breweryID) {

    const FOURSQUARE_DETAILS_URL = `https://api.foursquare.com/v2/venues/${breweryID}`;

    const params = {
        client_id: 'UDLXPN3F3FDLXPIWUAI40YXL40CETQXRDZAVDRPYFLFTJHL4',
        client_secret: 'MP0EYU1LNSWMR20S3AXZDJ05KMQOMNIIPIRE4ZRTCXV4IFYI',
        v: 20180323
    }

    const queryString = formatQueryParams(params);
    const url = FOURSQUARE_DETAILS_URL + '?' + queryString;
    
    fetch(url)
        .then(response => {
            if (response.ok) {
                return response.json();
        }
        throw new Error(response.statusText);
    })
        .then(responseJson => addDetailsToBrewery(index, responseJson.response))
        .catch(error => displayError(error))

    }

function addDetailsToBrewery(index, details) {
  return breweriesArr[index].details = details;
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
                    lat: parseFloat(brewery.location.lat),
                    lng: parseFloat(brewery.location.lng)
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

            breweriesArr[index].distance = `${response.distance[1].toFixed(1)} mi`;

        } else {

            breweriesArr[index].distance = ' ';

        }
    
    })
    .fail(function(response) {
        response.distance = ' ';
        breweriesArr[index].distance = response.distance;

    })

}

function addDistanceAndImages(results) {
    breweriesArr = results.response.venues;

    for (let i = 0; i < breweriesArr.length; i++) {

        //getBreweryDetails(i, breweriesArr[i].id);
        getDistanceToBrewery(i, breweriesArr[i]);

        }

    setTimeout(function() {renderResults(breweriesArr);}, 1500);

    }  

function renderResults(results) {

    //$('#see-results').prop('hidden', true;
    $('#next-page').prop('hidden', false);

  /*  $(`
    <form name='sort-results'>
        <fieldset>
            <legend>Sort results</legend>
            <label for='name'><input class='sort-target' type='radio' name='sort' id='name' value='distance' checked>By Name</label>
            <label for='distance'><input class='sort-target' type='radio' name='sort' id='distance' value='distance'>By Distance</label>
        </fieldset>
    </form>
    `).insertBefore('.js-results'); */
    
    for (let i = currIndex; i <= currResults; i++) {
        let address = results[i].location.formattedAddress.join('<br>');

        $('.js-results').append(`
            <div id='${results[i].distance}' class='card'>
                <a class='brewery-name card-title' href='#' target="_default">${results[i].name}</a> <span class='js-distance'>${results[i].distance} </span>
                <address class='card-body>
                   ${address}
                </address>
            </div>
        `);

        }

};

$(watchClicks(), getUserLocation());

/* 

<img src=${results[i].details.venue.bestPhoto.prefix}200x200${results[i].details.venue.bestPhoto.suffix} alt='photo of ${results[i].name}><br> 

 ${results[i].location.address}<br>
                    ${results[i].location.city}<br>
                    ${results[i].location.state}<br>
                    ${results[i].location.postalCode}<br>

*/

