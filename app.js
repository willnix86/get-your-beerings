const FOURSQUARE_VENUE_URL = 'https://api.foursquare.com/v2/venues/search';

let searchTarget = $('#city');
let search = searchTarget.val();
let userCoords = {};
let breweriesArr = [];
let numberOfRows = 4;
let numberOfCols = 4;
let arrayIndex = 0;

// workout arounds:
    // one big data obj
    // smaller functions ie 'getCoods'
    // use const for objs/arrays so it fixes datatype

function getUserLocation() {

    if ("geolocation" in navigator) {
    
        navigator.geolocation.getCurrentPosition(function(position) {
            userCoords.lat = position.coords.latitude;
            userCoords.lng = position.coords.longitude;
            $(`
            <form name='brewery-search'>
                <fieldset>
                    <legend>Enter Location</legend>

                    <label for="city"><input type="text" id="city" name="city" placeholder="e.g Chicago, London"></label>
                    

                    <label for="submit"><button type="submit" id="submit" name="submit">Submit</button></label>

                </fieldset>
            </form>
            `).insertAfter('header');

        }, function(error) {

            if (error.message === 'User denied Geolocation') {
                $(`
                <form name='brewery-search'>
                    <fieldset>
                        <legend>Enter Location</legend>
    
                        <label for="city"><input type="text" id="city" name="city" placeholder="e.g Chicago, London"></label>
                        
    
                        <label for="submit"><button type="submit" id="submit" name="submit">Submit</button></label>
    
                    </fieldset>
                </form>

                <section class='js-alert' role="alert" aria-live='assertive'>
                    <p>Geolocation is currently unavailable. You can still search for breweries, but we can't tell you how close they are.</p>
                </section>
                
                `).insertAfter('header');
                
                };

            }

        )}

    }


function watchClicks() {

    $('body').on('click', '#submit', function(e) {
        e.preventDefault();
        resetResults();
        searchTarget = $('#city');
        search = searchTarget.val();
        getBreweries(search, addDistanceAndImages);
        $('#city').val("");
    });

    $('.js-pagination').on('click', '#next-page', function(e){
        e.preventDefault();
        //$('#prev-page').prop('hidden', false);
        renderResults(breweriesArr);
    });

  /*  $('.js-pagination').on('click', '#prev-page', function(e){
        e.preventDefault();
        $('.js-results').remove();
        arrayIndex-=16;
       renderResults(breweriesArr);
        if (arrayIndex <= 15) {
            $('#previous-page').prop('hidden', true);
        }
    }); */

  /*  $('main').on('change', '.sort-target', function(e){
        alert('changed');
    }); */

}

function resetResults() {
    $('.js-results').remove();
    $('#next-page').prop('hidden', true);
    numberOfRows = 4;
    numberOfCols = 4;
    arrayIndex = 0;

    //$('#prev-page').prop('hidden', true);
}

function displayError(err) {
    $('.js-alert').prop('hidden', false);
    $('.js-alert').append(`<p>Sorry, we encountered the following error: ${err}</p>`)
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

    if (userCoords === undefined) {

        breweriesArr[index].distance = ' ';

    } else {

        $.ajax({
            type: 'POST',
            url: DISTANCE_MATRIX_URL,
            data: JSON.stringify(params),
            contentType: "application/json",
            dataType: 'json',
        })
        .done(function (response) {
    
            if (response.distance && response.distance != undefined) {
    
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

    let resultsStr;

    for (let rowNumber = 0; rowNumber < numberOfRows; rowNumber++) {
        resultsStr = `<div class='js-results row' aria-live='polite'>`

        for (let columnNumber = 0, i = arrayIndex; columnNumber < numberOfCols; columnNumber++, i++) {

            let address = results[i].location.formattedAddress.join('<br>');
            
            resultsStr += `<div id='${results[i].distance}' class='col-3 card'><a class='brewery-name card-title' href='https://www.google.com/search?q=${results[i].name}' target="_default">${results[i].name}</a> <span class='js-distance'>${results[i].distance} </span>
            <address class='card-body'>
               ${address}
            </address>
            </div>
            `;

        }

        resultsStr += `</div>`;

        $(resultsStr).insertBefore('.js-pagination');
        
        arrayIndex += 4;

        if (arrayIndex >= 48) {
            numberOfRows = 1;
            numberOfCols = 2;
        }

        if (arrayIndex >= 52) {
            $('#next-page').prop('hidden', true);
        }

    }

};

$(watchClicks(), getUserLocation());

/* 

<img src=${results[i].details.venue.bestPhoto.prefix}200x200${results[i].details.venue.bestPhoto.suffix} alt='photo of ${results[i].name}><br> 


*/

