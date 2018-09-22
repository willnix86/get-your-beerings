const BEER_ME_DATA = {
    userCoords: {},
    breweriesArr: [],
    arrayIndex: 0,
    numberOfRows: 4,
    numberOfCols: 4,
    search: '',
    radius: 5
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
        BEER_ME_DATA.search = searchTarget.val();
        BEER_ME_DATA.radius = ($('#radius').val() * 1609.34);
        getBreweries(BEER_ME_DATA.search, BEER_ME_DATA.radius);
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
    BEER_ME_DATA.radius = 5;
    BEER_ME_DATA.search = '';
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
        limit: 50,
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
        .then(responseJson => getDistances(responseJson))
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
                    <div class='card-logo__wrapper'>
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

        if (BEER_ME_DATA.arrayIndex >= (results.length - 2)) {
            numberOfRows = 1;
            numberOfCols = 2;
        }

        if (BEER_ME_DATA.arrayIndex >= results.length) {
            $('#next-page').prop('hidden', true);
        }

    }

    initMap(BEER_ME_DATA.breweriesArr);
};

function initMap(locations) {

    let map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: BEER_ME_DATA.breweriesArr[0].location.lat, lng: BEER_ME_DATA.breweriesArr[0].location.lng},
        zoom: 11,
        styles: [
                    {
                    "elementType": "geometry",
                    "stylers": [
                        {
                        "color": "#ebe3cd"
                        }
                    ]
                    },
                    {
                    "elementType": "labels.text.fill",
                    "stylers": [
                        {
                        "color": "#523735"
                        }
                    ]
                    },
                    {
                    "elementType": "labels.text.stroke",
                    "stylers": [
                        {
                        "color": "#f5f1e6"
                        }
                    ]
                    },
                    {
                    "featureType": "administrative",
                    "elementType": "geometry.stroke",
                    "stylers": [
                        {
                        "color": "#c9b2a6"
                        },
                        {
                        "saturation": -40
                        }
                    ]
                    },
                    {
                    "featureType": "administrative.land_parcel",
                    "elementType": "geometry.stroke",
                    "stylers": [
                        {
                        "color": "#dcd2be"
                        }
                    ]
                    },
                    {
                    "featureType": "administrative.land_parcel",
                    "elementType": "labels",
                    "stylers": [
                        {
                        "visibility": "off"
                        }
                    ]
                    },
                    {
                    "featureType": "administrative.land_parcel",
                    "elementType": "labels.text.fill",
                    "stylers": [
                        {
                        "color": "#ae9e90"
                        }
                    ]
                    },
                    {
                    "featureType": "landscape.natural",
                    "elementType": "geometry",
                    "stylers": [
                        {
                        "color": "#dfd2ae"
                        }
                    ]
                    },
                    {
                    "featureType": "poi",
                    "elementType": "geometry",
                    "stylers": [
                        {
                        "color": "#dfd2ae"
                        }
                    ]
                    },
                    {
                    "featureType": "poi",
                    "elementType": "labels.text",
                    "stylers": [
                        {
                        "visibility": "off"
                        }
                    ]
                    },
                    {
                    "featureType": "poi",
                    "elementType": "labels.text.fill",
                    "stylers": [
                        {
                        "color": "#93817c"
                        }
                    ]
                    },
                    {
                    "featureType": "poi.business",
                    "stylers": [
                        {
                        "visibility": "off"
                        }
                    ]
                    },
                    {
                    "featureType": "poi.park",
                    "elementType": "geometry.fill",
                    "stylers": [
                        {
                        "color": "#a5b076"
                        }
                    ]
                    },
                    {
                    "featureType": "poi.park",
                    "elementType": "labels.text.fill",
                    "stylers": [
                        {
                        "color": "#447530"
                        }
                    ]
                    },
                    {
                    "featureType": "road",
                    "elementType": "geometry",
                    "stylers": [
                        {
                        "color": "#f5f1e6"
                        }
                    ]
                    },
                    {
                    "featureType": "road",
                    "elementType": "labels.icon",
                    "stylers": [
                        {
                        "visibility": "off"
                        }
                    ]
                    },
                    {
                    "featureType": "road.arterial",
                    "elementType": "geometry",
                    "stylers": [
                        {
                        "color": "#fdfcf8"
                        }
                    ]
                    },
                    {
                    "featureType": "road.highway",
                    "elementType": "geometry",
                    "stylers": [
                        {
                        "color": "#f8c967"
                        }
                    ]
                    },
                    {
                    "featureType": "road.highway",
                    "elementType": "geometry.stroke",
                    "stylers": [
                        {
                        "color": "#f9c833"
                        }
                    ]
                    },
                    {
                    "featureType": "road.highway.controlled_access",
                    "elementType": "geometry",
                    "stylers": [
                        {
                        "color": "#e98d58"
                        }
                    ]
                    },
                    {
                    "featureType": "road.highway.controlled_access",
                    "elementType": "geometry.stroke",
                    "stylers": [
                        {
                        "color": "#fe9850"
                        }
                    ]
                    },
                    {
                    "featureType": "road.local",
                    "elementType": "labels",
                    "stylers": [
                        {
                        "visibility": "off"
                        }
                    ]
                    },
                    {
                    "featureType": "road.local",
                    "elementType": "labels.text.fill",
                    "stylers": [
                        {
                        "color": "#806b63"
                        }
                    ]
                    },
                    {
                    "featureType": "transit",
                    "stylers": [
                        {
                        "visibility": "off"
                        }
                    ]
                    },
                    {
                    "featureType": "transit.line",
                    "elementType": "geometry",
                    "stylers": [
                        {
                        "color": "#dfd2ae"
                        }
                    ]
                    },
                    {
                    "featureType": "transit.line",
                    "elementType": "labels.text.fill",
                    "stylers": [
                        {
                        "color": "#8f7d77"
                        }
                    ]
                    },
                    {
                    "featureType": "transit.line",
                    "elementType": "labels.text.stroke",
                    "stylers": [
                        {
                        "color": "#ebe3cd"
                        }
                    ]
                    },
                    {
                    "featureType": "transit.station",
                    "elementType": "geometry",
                    "stylers": [
                        {
                        "color": "#dfd2ae"
                        }
                    ]
                    },
                    {
                    "featureType": "water",
                    "elementType": "geometry.fill",
                    "stylers": [
                        {
                        "color": "#b9d3c2"
                        }
                    ]
                    },
                    {
                    "featureType": "water",
                    "elementType": "labels.text.fill",
                    "stylers": [
                        {
                        "color": "#92998d"
                        }
                    ]
                    }
                ],
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
