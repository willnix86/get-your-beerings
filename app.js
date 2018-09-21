const BEER_ME_DATA = {
    userCoords: {},
    breweriesArr: [],
    arrayIndex: 0,
    numberOfRows: 4,
    numberOfCols: 4
}

function getUserLocation() {

    loadingScreen();
    
    navigator.geolocation.getCurrentPosition(function(position) {
        BEER_ME_DATA.userCoords.lat = position.coords.latitude;
        BEER_ME_DATA.userCoords.lng = position.coords.longitude;

        $('.lds-default').remove();
        $(`
        <form name='brewery-search' class='brewery-search'>
            <fieldset>
                <legend>Enter Location</legend>

                <label for="city"><input type="text" id="city" name="city" placeholder="e.g Chicago, London"></label>

                <label for='radius'>Search within:</label>
                <select form='brewery-search' name='radius' id='radius'>
                    <option value='5'>5 miles</option>
                    <option value='10'>10 miles</option>
                    <option value='20'>20 miles</option>
                </select>
                
                <label for="submit"><button type="submit" id="submit" name="submit">Submit</button></label>

            </fieldset>
        </form>
        `).insertAfter('header');
        $('#city').focus();

    }, function() {
        $('.lds-default').remove();
        $(`
        <form name='brewery-search' class='brewery-search'>
            <fieldset>
                <legend>Enter Location</legend>

                <label for="city"><input type="text" id="city" name="city" placeholder="e.g Chicago, London"></label>

                <label for='radius'>Search within:</label>
                <select form='brewery-search' name='radius' id='radius'>
                    <option value='5'>5 miles</option>
                    <option value='10'>10 miles</option>
                    <option value='20'>20 miles</option>
                </select>
                
                <label for="submit"><button type="submit" id="submit" name="submit">Submit</button></label>

            </fieldset>
        </form>

        <section class='js-alert' role="alert" aria-live='assertive'>
            <p>Geolocation is currently unavailable. You can still search for breweries, but we can't tell you how close they are.</p>
        </section>

        `).insertAfter('header');
        $('#city').focus();

    }, {timeout:10000})
    
};

function loadingScreen() {
    $(`
        <div class="lds-default"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>
    `).insertBefore('#map');
}

function watchClicks() {

    $('body').on('submit', '.brewery-search', function(e) {
        e.preventDefault();
        resetResults();
        let searchTarget = $('#city');
        let search = searchTarget.val();
        let radius = ($('#radius').val() * 1609.34);
        getBreweries(search, radius);
        $('#city').val("");
    });

    $('.js-pagination').on('click', '#next-page', function(e){
        e.preventDefault();
        renderResults(BEER_ME_DATA.breweriesArr);
    });

    $('main').on('change', '.sort-target', function(e){
        $('.js-results').remove();
        BEER_ME_DATA.arrayIndex = 0;
        BEER_ME_DATA.numberOfRows = 4;
        BEER_ME_DATA.numberOfCols = 4;
        if ($('#name').prop('checked')) {
        sortResults(getNameVal, BEER_ME_DATA.breweriesArr);
        } else if ($('#distance').prop('checked')) {
        sortResults(getDistanceVal, BEER_ME_DATA.breweriesArr);
        }
    });
}

function resetResults() {
    BEER_ME_DATA.arrayIndex = 0;
    BEER_ME_DATA.numberOfRows = 4;
    BEER_ME_DATA.numberOfCols = 4;
    $('.js-results').remove();
    $('#sort-results').remove();
    $('#map').empty();
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

function getBreweries(search, radius) {

    const searchURL = 'https://api.foursquare.com/v2/venues/search';

    const params = {
        client_id: 'UDLXPN3F3FDLXPIWUAI40YXL40CETQXRDZAVDRPYFLFTJHL4',
        client_secret: 'MP0EYU1LNSWMR20S3AXZDJ05KMQOMNIIPIRE4ZRTCXV4IFYI',
        v: 20180323,
        near: search,
        query: 'brewery',
        radius: radius,
        limit: 5,
        categoryId: '50327c8591d4c4b30a586d5d'
    }

    let queryString = formatQueryParams(params);
    let url=  searchURL + '?' + queryString;

    fetch(url)
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            throw new Error(response.statusText);
        })
        .then(responseJson => getDistancesWhileTesting(responseJson))
        .catch(error => displayError(error))

}

function getDistances(results) {

    BEER_ME_DATA.breweriesArr = results.response.venues;

    for (let i = 0; i < BEER_ME_DATA.breweriesArr.length; i++) {

        var origin = new google.maps.LatLng(parseFloat(BEER_ME_DATA.userCoords.lat), parseFloat(BEER_ME_DATA.userCoords.lng));

        var destination = new google.maps.LatLng(parseFloat(BEER_ME_DATA.breweriesArr[i].location.lat), parseFloat(BEER_ME_DATA.breweriesArr[i].location.lng));

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
                BEER_ME_DATA.breweriesArr[i].distance = response.rows[0].elements[0].distance;
                
            } else {
                BEER_ME_DATA.breweriesArr[i].distance = {
                    value: ' ',
                    text: ' '
                }
            }

        });

    } 
    
    setTimeout(function() {sortResults(getDistanceVal,BEER_ME_DATA.breweriesArr);}, 1500);

} 

function getDistancesWhileTesting(results) {
    BEER_ME_DATA.breweriesArr = results.response.venues;
    
    for (let i = 0; i < BEER_ME_DATA.breweriesArr.length; i++) {
    
        const DISTANCE_MATRIX_URL = 'http://www.mapquestapi.com/directions/v2/routematrix?key=3Tq7BgL2BLnK1uBtZosI3iLuhoqNDm4G';
    
        const params = {
    
            locations: [
                {
                    latLng: {
                        lat: parseFloat(BEER_ME_DATA.userCoords.lat),
                        lng: parseFloat(BEER_ME_DATA.userCoords.lng)
                    }
                },
                {
                    latLng: {
                        lat: parseFloat(BEER_ME_DATA.breweriesArr[i].location.lat),
                        lng: parseFloat(BEER_ME_DATA.breweriesArr[i].location.lng)
                    }
                }
            ]
        };
    
        if (BEER_ME_DATA.userCoords === undefined) {
    
            BEER_ME_DATA.breweriesArr[i].distance = {
                value: ' ',
                text: ' '
            }
    
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
        
                    BEER_ME_DATA.breweriesArr[i].distance = `${response.distance[1].toFixed(1)} mi`;
        
                } else {
        
                    BEER_ME_DATA.breweriesArr[i].distance = {
                        value: ' ',
                        text: ' '
                    }
        
                }
            
            })
            .fail(function(response) {
                BEER_ME_DATA.breweriesArr[i].distance = {
                    value: ' ',
                    text: ' '
                }
        
            })
    
        } 
        
        setTimeout(function() {sortResults(getDistanceVal,BEER_ME_DATA.breweriesArr);}, 1500);
    
    } 
}

function getDistanceVal(obj) {
    return obj.distance.value;
}

function getNameVal(obj) {
    return obj.name.toUpperCase();
}

function sortResults(propertyRetriever, array) {
    array.sort(function (a, b) {
        let valueA = propertyRetriever(a);
        let valueB = propertyRetriever(b);

            if (valueA < valueB) {
                return -1;
            } else if (valueA > valueB) {
                return 1;
            } else {
                return 0;
            }
        });

    renderResults(array);

}

function renderResults(results) {

    $('#next-page').prop('hidden', false);

    let resultsStr = '';

    for (let rowNumber = 0; rowNumber < BEER_ME_DATA.numberOfRows; rowNumber++) {

        resultsStr = `<div class='js-results row' aria-live='polite'>`;

        for (let columnNumber = 0, i = BEER_ME_DATA.arrayIndex; columnNumber < BEER_ME_DATA.numberOfCols; columnNumber++, i++) {
debugger
            let address = results[i].location.formattedAddress.join('<br>');

            if (results[i].distance.value == null || results[i].distance.text == null) {
                results[i].distance = {
                    value: ' ',
                    text: ' '
                }
            }
            
            resultsStr += `
            <div id='${results[i].distance.value}' class='col-3 card'>
                <div class='card-body'>
                    <div>
                        <img class='card-logo' src='images/bottlecap.png' alt='brewery icon'> 
                    </div>
                    <a class='brewery-name card-title' href="https://www.google.com/search?q=${results[i].name}" target="_default">${results[i].name}</a> 
                    <p class='js-distance'>${results[i].distance.text} </p>
                    <address class='card-text'>
                        ${address}
                    </address>
                </div>
            </div>
            `;

        }

        resultsStr += `</div>`;

        $(resultsStr).insertBefore('.js-pagination');
        
        BEER_ME_DATA.arrayIndex += 4;

        if (BEER_ME_DATA.arrayIndex >= 48) {
            numberOfRows = 1;
            numberOfCols = 2;
        }

        if (BEER_ME_DATA.arrayIndex >= 52) {
            $('#next-page').prop('hidden', true);
        }

    }

    initMap(BEER_ME_DATA.breweriesArr);
};

function initMap(locations) {

    let map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: BEER_ME_DATA.breweriesArr[0].location.lat, lng: BEER_ME_DATA.breweriesArr[0].location.lng},
        zoom: 11,
        disableDefaultUI: true,
        zoomControl: true
    });

    let image = {
        url: 'http://devnx.io/beer-me/images/marker.png',
        size: new google.maps.Size(60, 60),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(15, 21),
        scaledSize: new google.maps.Size(30, 30),
    } 

    let infowindow = new google.maps.InfoWindow();

    let markers = [];

    for (i = 0; i < locations.length; i++) {

        let pos = {lat: locations[i].location.lat, lng: locations[i].location.lng};

        let marker = new google.maps.Marker({position: pos, icon: image, map: map});

        markers.push(marker);

        google.maps.event.addListener(marker, 'click', (function(marker, i) {
            return function() {
                infowindow.setContent(`
                    <div class='marker-window'>
                    <img class='marker-logo' src='images/sign.png' alt='brewery icon'> 
                    <a href='http://www.google.com/search?q=${locations[i].name}' target='_default'>${locations[i].name}</a>
                    </div>
                    `);
                infowindow.setPosition(pos);
                infowindow.open(map, (marker - 19));
            }
        })(marker, i));
    
    }

    let markerCluster = new MarkerClusterer(map, markers,
        {imagePath: 'images/m'});

    if ($('#sort-results').length == 0) {
        $(`
            <form name='sort-results' id='sort-results'>
                <fieldset>
                    <legend>Sort results</legend>
                    <label for='name'><input class='sort-target' type='radio' name='sort' id='name' value='sort'>By Name</label>
                    <label for='distance'><input class='sort-target' type='radio' name='sort' id='distance' value='sort' checked>By Distance</label>
                </fieldset>
            </form>
        `).insertAfter('#map');
    };

}

$(watchClicks(), getUserLocation());
