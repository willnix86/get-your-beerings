const FOURSQUARE_VENUE_URL = 'https://api.foursquare.com/v2/venues/search';

let userCoords = {};
let breweriesArr = [];
let arrayIndex = 0;
let numberOfRows = 4;
let numberOfCols = 4;


// workout arounds:
    // one big data obj
    // smaller functions ie 'getCoods'
    // use const for objs/arrays so it fixes datatype

function getUserLocation() {
    
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

    }, function() {

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

     }, {timeout:10000})
    
    };

function watchClicks() {

    $('body').on('click', '#submit', function(e) {
        e.preventDefault();
        resetResults();
        let searchTarget = $('#city');
        let search = searchTarget.val();
        getBreweries(search, getDistances);
        $('#city').val("");
    });

    $('.js-pagination').on('click', '#next-page', function(e){
        e.preventDefault();
        renderResults(breweriesArr);
    });

    $('#map').on('click', 'google.maps.Marker', function(e) {
        alert('clicked');
    });

  /*  $('main').on('change', '.sort-target', function(e){
        alert('changed');
    }); */

}

function resetResults() {
    $('.js-results').remove();
}

function displayError(err) {
    $(`
        <section class='js-alert' role="alert" aria-live='assertive'>
                <p>Sorry, we encountered the following error(s): ${err}</p>
        </section>
    `).insertAfter('form');
    $('.js-alert').text(`Sorry, we encountered the following error(s): ${err}`);
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
        limit: 5,
        categoryId: '50327c8591d4c4b30a586d5d'
    }

    $.getJSON(FOURSQUARE_VENUE_URL, params, callback);

}

function getDistances(results) {

    breweriesArr = results.response.venues;

    for (let i = 0; i < breweriesArr.length; i++) {

      /*  const DISTANCE_MATRIX_URL = 'http://www.mapquestapi.com/directions/v2/routematrix?key=3Tq7BgL2BLnK1uBtZosI3iLuhoqNDm4G';

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
                    lat: parseFloat(breweriesArr[i].location.lat),
                    lng: parseFloat(breweriesArr[i].location.lng)
                }
            }
        ]
    };

    if (userCoords === undefined) {

        breweriesArr[i].distance = ' ';

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
    
                breweriesArr[i].distance = `${response.distance[1].toFixed(1)} mi`;
    
            } else {
    
                breweriesArr[i].distance = ' ';
    
            }
        
        })
        .fail(function(response) {
            response.distance = ' ';
            breweriesArr[i].distance = response.distance;
    
        })

    } */

        var origin = new google.maps.LatLng(parseFloat(userCoords.lat), parseFloat(userCoords.lng));

        var destination = new google.maps.LatLng(parseFloat(breweriesArr[i].location.lat), parseFloat(breweriesArr[i].location.lng));

        var service = new google.maps.DistanceMatrixService();

        service.getDistanceMatrix(
        {
            origins: [origin],
            destinations: [destination],
            travelMode: 'DRIVING',
            unitSystem: google.maps.UnitSystem.IMPERIAL,
            avoidHighways: false,
            avoidTolls: false
        }, function(response, status) {

            if (status == 'OK') {
                breweriesArr[i].distance = response.rows[0].elements[0].distance;
                
            } else {
                breweriesArr[i].distance = {
                    value: ' ',
                    text: ' '
                }
            }

        });

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

    let resultsStr = '';

    for (let rowNumber = 0; rowNumber < numberOfRows; rowNumber++) {

        resultsStr = `<div class='js-results row' aria-live='polite'>`;

        for (let columnNumber = 0, i = arrayIndex; columnNumber < numberOfCols; columnNumber++, i++) {

            let address = results[i].location.formattedAddress.join('<br>');
            
            resultsStr += `
            <div id='${results[i].distance.value}' class='col-3 card'>
                <div class='card-body'>
                    <div>
                        <img class='card-logo' src='images/bottlecap.png' alt='brewery icon'> 
                    </div>
                    <a class='brewery-name card-title' href="https://www.google.com/search?q=${results[i].name}" target="_default">${results[i].name}</a> <span class='js-distance'>${results[i].distance.text} </span>
                    <address class='card-text'>
                        ${address}
                    </address>
                </div>
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

    initMap(breweriesArr);

};

function initMap(locations) {

    let map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: userCoords.lat, lng: userCoords.lng},
        zoom: 11
    });

    let image = {
        url: 'http://devnx.io/beer-me/images/marker.png',
        size: new google.maps.Size(60, 60),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(15, 21),
        scaledSize: new google.maps.Size(30, 30),
    } 

    let markers = [];

    let iterator = 0;

    function drop() {

        for (let i = 0; i < locations.length; i++) {
            setTimeout(function() {
                addMarker();
            }, i * 200);
        }
    }

    function addMarker() {

        let pos = {lat: locations[iterator].location.lat, lng: locations[iterator].location.lng};

        markers.push(new google.maps.Marker({
            position: pos, 
            icon: image, 
            map: map,
            animation: google.maps.Animation.DROP
        }));

        iterator++;
 
    }

    drop();

}

$(watchClicks(), getUserLocation());

/* 
            <img class='card-image' src=${results[i].details.venue.photos.groups[1].items[1].prefix}200x200${results[i].details.venue.photos.groups[1].items[1].suffix} alt='photo of ${results[i].name}"> 
            <div class='card-status'>${results[i].details.venue.hours.status}</div>
            <div class='card-footer'>
                <a class='social-link' href='www.instagram.com/${results[i].details.venue.contact.instagram}><img class='social-img' src='images/insta.png' alt='instagram-link logo for ${results[i].name}'></a>
                <a class='social-link' href='tel:${results[i].details.venue.contact.phone}><img class='social-img' src='images/phone.png' alt='call ${results[i].name}'></a>
                <a class='social-link' href='www.twitter.com/${results[i].details.venue.contact.twitter}><img class='social-img' src='images/twitter.png' alt='twitter-link logo for ${results[i].name}'></a>
            </div>

*/

