const BEER_ME_DATA = {
    userCoords: {},
    breweriesArr: [],
    arrayIndex: 0,
    numberOfRows: 5,
    numberOfCols: 4,
    search: '',
    radius: 8046.7,
    latLng: {}
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
        getSearchLatLng(BEER_ME_DATA.search);
        $('#city').val("");
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
        } else if ($('#rating').prop('checked')) {
            sortResults(getRatingVal, BEER_ME_DATA.breweriesArr);
        }
    });

}

function getSearchLatLng (search) {

    const url = `https://us1.locationiq.com/v1/search.php?key=pk.70c39f1d416f753085ae36d8245124d4&format=json&q=${search}`

    fetch(url)
    .then(response => {
        if (response.ok) {
            return response.json();
        }
        throw new Error(response.statusText);
    })
    .then(responseJson => addSearchCoords(responseJson[0]))
    .catch(error => displayError(error))
    
}

function addSearchCoords(searchCoords) {
    BEER_ME_DATA.latLng = {
        lat: parseFloat(searchCoords.lat),
        lng: parseFloat(searchCoords.lon)
    }

    initMap();
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

function getDistances(breweries) {

    for (let i = 0; i < breweries.length; i++) {

        var origin = {lat: BEER_ME_DATA.userCoords.lat, lng: BEER_ME_DATA.userCoords.lng};

        var destination = {lat: breweries[i].lat, lng: breweries[i].lng};

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
                breweries[i].distance = response.rows[0].elements[0].distance;
                
            } else {
                breweries[i].distance = {
                    value: ' ',
                    text: ' '
                }
            }

        });

    } 
    
    setTimeout(function() {getExtraDetails(breweries)}, 1500);

}

function getExtraDetails(breweries) {

    for (i = 0; i <= 4; i++) {

        let index = 0;

        setTimeout(function() {

            for (let h = 0, j = index; h < 5; h++, j++) {

                var request = {
                    placeId: breweries[j].place_id,
                    fields: ['opening_hours', 'website']
                };

                service.getDetails(request, callback);
                
                function callback(place, status) {

                    if (status == google.maps.places.PlacesServiceStatus.OK) {
                        if (place.website != null) {
                            BEER_ME_DATA.breweriesArr[j].website = place.website;
                        } else {
                            BEER_ME_DATA.breweriesArr[j].website = "https://www.google.com/search?q=" + BEER_ME_DATA.breweriesArr[j].name;
                        }
    
                        if (place.opening_hours != null) {
                            BEER_ME_DATA.breweriesArr[j].opening_hours = place.opening_hours;
                        }

                        if (BEER_ME_DATA.breweriesArr[j].rating == 0) {
                            BEER_ME_DATA.breweriesArr[j].rating = 'N/A';
                        }

                    } else {
                        console.log(status);
                    }

                }
    
                index+=5;

            }

        }, i*1600);
        
    }

    sortResults(getDistanceVal,breweries);

}

function getDistancesWhileTesting(breweries) {

    for (let i = 0; i < breweries.length; i++) {
    
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
                        lat: parseFloat(BEER_ME_DATA.breweriesArr[i].lat),
                        lng: parseFloat(BEER_ME_DATA.breweriesArr[i].lng)
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

function getRatingVal(obj) {
    return obj.rating;
}

function sortResults(propertyRetriever, array) {

    if (propertyRetriever == getRatingVal) {
        array.sort(function (a, b) {
            let valueA = propertyRetriever(a);
            let valueB = propertyRetriever(b);
    
                if (valueA < valueB) {
                    return 1;
                } else if (valueA > valueB) {
                    return -1;
                } else {
                    return 0;
                }
            });
    } else {
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
    }

    renderResults(array);

}

function renderResults(results) {

    $('#next-page').prop('hidden', false);

    let resultsStr = '';

    for (let rowNumber = 0; rowNumber < BEER_ME_DATA.numberOfRows; rowNumber++) {

        resultsStr = `<div class='js-results row' aria-live='polite'>`;

        for (let columnNumber = 0, i = BEER_ME_DATA.arrayIndex; columnNumber < BEER_ME_DATA.numberOfCols; columnNumber++, i++) {

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
                    <a class='brewery-name card-title' href="${results[i].website}" target="_default">${results[i].name}</a> 
                    <span class='distance'>${results[i].distance.text}</span>
                    <p class='rating'>Rating: ${results[i].rating}</p>
                    <address class='card-text'>
                        ${results[i].formatted_address}
                    </address>
                </div>
            </div>
            `;

        }

        resultsStr += `</div>`;

        $(resultsStr).insertBefore('.js-pagination');
        
        BEER_ME_DATA.arrayIndex += 4;

        // if (BEER_ME_DATA.arrayIndex >= (results.length - 2)) {
        //     numberOfRows = 1;
        //     numberOfCols = 2;
        // }

        // if (BEER_ME_DATA.arrayIndex >= results.length) {
        //     $('#next-page').prop('hidden', true);
        // }

    }

};

function initMap() {

    let map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: BEER_ME_DATA.latLng.lat, lng: BEER_ME_DATA.latLng.lng},
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

    let searchLocation = {lat: BEER_ME_DATA.latLng.lat,lng: BEER_ME_DATA.latLng.lng};
    
    let request = {
        query: 'brewery',
        location: searchLocation,
        radius: BEER_ME_DATA.radius
    };

    service = new google.maps.places.PlacesService(map);

    let getNextPage = null;
    let moreButton = document.getElementById('next-page');
    moreButton.onclick = function() {
        moreButton.disabled = true;
        if (getNextPage) getNextPage();
    };

    service.textSearch(request, callback);

    function callback(results, status, pagination) {
        if (status == google.maps.places.PlacesServiceStatus.OK) {
            for (var i = 0; i < results.length; i++) {
                BEER_ME_DATA.breweriesArr.push(results[i]);  
                BEER_ME_DATA.breweriesArr[i].lat = results[i].geometry.location.lat();
                BEER_ME_DATA.breweriesArr[i].lng = results[i].geometry.location.lng();
                }

            moreButton.disabled = !pagination.hasNextPage;
            getNextPage = pagination.hasNextPage && function() {
                pagination.nextPage();
            };
            getDistances(BEER_ME_DATA.breweriesArr);
        }
    }

    let image = {
        url: 'http://devnx.io/beer-me/images/marker.png',
        size: new google.maps.Size(60, 60),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(15, 21),
        scaledSize: new google.maps.Size(30, 30),
    } 

    let infowindow = new google.maps.InfoWindow();

    let markers = [];

    for (i = 0; i < BEER_ME_DATA.breweriesArr.length; i++) {

        let pos = {lat: BEER_ME_DATA.breweriesArr[i].lat, lng: BEER_ME_DATA.breweriesArr[i].lng};

        let marker = new google.maps.Marker({position: pos, icon: image, map: map});

        markers.push(marker);

        google.maps.event.addListener(marker, 'click', (function(marker, i) {
            return function() {
                infowindow.setContent(`
                    <div class='marker-window'>
                    <img class='marker-logo' src='images/sign.png' alt='brewery icon'> 
                    <a href='${BEER_ME_DATA.breweriesArr[i].website}' target='_default'>${BEER_ME_DATA.breweriesArr[i].name}</a>
                    <p>Opening Hours:</p>
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
                    <label for='rating'><input class='sort-target' type='radio' name='sort' id='rating' value='sort'>By Rating</label>
                </fieldset>
            </form>
        `).insertAfter('#map');
    };

}

$(watchClicks(), getUserLocation());
