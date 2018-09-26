const BEER_ME_DATA = {
    userCoords: {},
    breweriesArr: [],
    arrayIndex: 0,
    numberOfRows: 5,
    numberOfCols: 4,
    search: '',
    radius: 8046.7,
    latLng: {},
    markers: [],
    mapStatus: false
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
                <p class='legend-sub'>Search by City, State, or Post-Code</p>

                <label for="city"><input type="text" id="city" name="city" placeholder="e.g Chicago, London, MK45 4EP"></label>

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

        BEER_ME_DATA.userCoords.lat = 0;
        BEER_ME_DATA.userCoords.lng = 0;

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
        BEER_ME_DATA.numberOfRows = 5;
        BEER_ME_DATA.numberOfCols = 4;
        BEER_ME_DATA.markers = [];
        if ($('#name').prop('checked')) {
            sortResults(getNameVal, BEER_ME_DATA.breweriesArr);
        } else if ($('#distance').prop('checked')) {
            sortResults(getDistanceVal, BEER_ME_DATA.breweriesArr);
        } else if ($('#rating').prop('checked')) {
            sortResults(getRatingVal, BEER_ME_DATA.breweriesArr);
        }
    });

    $('main').on('click', '.card', function(e) {
        let index = $(this).attr('id');
        let place_id =$(this).find('span').attr('id');
        checkCardFace(index, place_id)
    });

}

function getSearchLatLng (search) {

    const url = `https://us1.locationiq.com/v1/search.php?key=pk.70c39f1d416f753085ae36d8245124d4&format=json&q=${search}`
  
    fetch(url)
    .then(response => {
        if (!response.ok) {
            response.json()
            .then(function(json) {
                let error;
                if (json.error == 'Unable to geocode') {
                    error = `Sorry, we couldn't find the location you entered. Please check your spelling and try again!`;
                } else if (json.error == 'Rate Limited Second' || json.error == 'Rate Limited Minute' || json.error == 'Rate Limited Day') {
                    error = `Sorry, we seem to have hit a snag. Please try again later!`
                }
    
                $(`
                        <section class='js-alert' role="alert" aria-live='assertive'>
                            <p>${error}</p>
                        </section>
                    `).insertAfter('form');
                    $('.js-alert').text(`Sorry, we encountered the following error(s): ${err}`);
    
            })
        } else if (response.ok) {
            return response.json();
        }
        throw new Error(response.statusText);
        })
        .then(responseJson => addSearchCoords(responseJson[0]))

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
    BEER_ME_DATA.radius = 8046.7;
    BEER_ME_DATA.search = '';
    BEER_ME_DATA.breweriesArr = [];
    BEER_ME_DATA.latLng = {};
    BEER_ME_DATA.markers = [];
    $('.js-results').remove();
    $('#sort-results').remove();
    $('#map').empty();
}

function formatQueryParams(params) {
    const queryItems = Object.keys(params)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    return queryItems.join('&');
}

function getDistances(breweries, map) {

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
                if (response.rows[0].elements[0].status == 'ZERO_RESULTS') {
                    breweries[i].distance = {
                        value: 0,
                        text: ' '
                    }
                } else {

                    breweries[i].distance = response.rows[0].elements[0].distance;

                }
                
            } else {

                breweries[i].distance = {
                    value: '0',
                    text: ' '
                }

            }

        });

    } 

    setTimeout(function() {sortResults(getDistanceVal, breweries, map)}, 1500);
    
}

function checkCardFace(index, place_id){

    if ($(`#${index}`).children().hasClass('back')) {
        $(`#${index}`).html(`
                <span id='${BEER_ME_DATA.breweriesArr[index].place_id}' class='hidden'></span>
                <div class='card-body front'>
                    <div class='card-logo__wrapper'>
                        <img class='card-logo' src='images/bottlecap.png' alt='brewery icon'> 
                    </div>
                    <a class='card-title' href='${BEER_ME_DATA.breweriesArr[index].website}' target='_default'>${BEER_ME_DATA.breweriesArr[index].name}</a>
                    <p class='distance'>${BEER_ME_DATA.breweriesArr[index].distance.text}</p>
                    <address class='card-text'>
                    ${BEER_ME_DATA.breweriesArr[index].formatted_address}
                    </address>
                    <p class='rating'>Rating: ${BEER_ME_DATA.breweriesArr[index].ratingObj.text}</p>
                </div>
            </div>
        `);
        } else {
            getExtraDetails(index, place_id);
        }
    };

function getExtraDetails(index, brewery) {

        var request = {
            placeId: brewery,
            fields: ['opening_hours', 'website']
        };

        service.getDetails(request, callback);
        
        function callback(place, status) {

            let hoursArr;
            let hours;

            if (status == google.maps.places.PlacesServiceStatus.OK) {
                if (place.website != null) {
                    BEER_ME_DATA.breweriesArr[index].website = place.website;
                } else {
                    BEER_ME_DATA.breweriesArr[index].website = "https://www.google.com/search?q=" + BEER_ME_DATA.breweriesArr[index].name;
                }

                if (place.opening_hours != null) {
                    
                    BEER_ME_DATA.breweriesArr[index].opening_hours = place.opening_hours;

                    hoursArr = BEER_ME_DATA.breweriesArr[index].opening_hours.weekday_text;
                    
                    hours = hoursArr.join('<br>');

                } else {

                    hours = `For our hours of business, please check the ${BEER_ME_DATA.breweriesArr[index].name} website.`;
                    
                }

                if (BEER_ME_DATA.breweriesArr[index].rating == 0) {
                    BEER_ME_DATA.breweriesArr[index].rating = 'N/A';
                }

                $(`#${index}`).html(`
                    <div class='card-body back'>
                        <a class='card-title' href='${BEER_ME_DATA.breweriesArr[index].website}' target='_default'>${BEER_ME_DATA.breweriesArr[index].name}</a>
                        <p class='hours-title'>Opening Hours</p>
                        <address class='card-text hours'>
                        ${hours}
                        </address>
                    </div>
                `);

            } else {
                console.log(status);
            }
    }

}      

function getDistanceVal(obj) {
    return obj.distance.value;
}

function getNameVal(obj) {
    return obj.name.toUpperCase();
}

function getRatingVal(obj) {
    return obj.ratingObj.value;
}

function sortResults(propertyRetriever, array, map) {

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

    renderResults(array, map);

}

function renderResults(results, map) {

    //$('#next-page').prop('hidden', false);

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

            if (results[i].rating != null) {

                results[i].ratingObj = {
                    value: results[i].rating,
                    text: results[i].rating.toString()
                }
            } else {

                results[i].ratingObj.text = 'N/A';

            }

            // for (let i = 1; i <= results[i].rating; i++) {
            //     ratingStr += `<img class='star' src='images/star.png' alt='a star bottle-cap'>`;
            // }
    
            resultsStr += `
            <div id='${i}' class='col-3 card'>
                <span id='${results[i].place_id}' class='hidden'></span>
                <div class='card-body front'>
                    <div class='card-logo__wrapper'>
                        <img class='card-logo' src='images/bottlecap.png' alt='brewery icon'> 
                    </div>
                    <p class='brewery-name'>${results[i].name}</p>
                    <p class='distance'>${results[i].distance.text}</p>
                    <address class='card-text'>
                    ${results[i].formatted_address}
                    </address>
                    <p class='rating'>Rating: ${results[i].ratingObj.text}</p>
                </div>
            </div>
            `;

            ratingStr = '';

        }

        resultsStr += `</div>`;

        $(resultsStr).insertBefore('.js-pagination');
        
        BEER_ME_DATA.arrayIndex += 4;

    }

    if (BEER_ME_DATA.mapStatus === false) {
        setMarkers(map);
    } else {
        resetMap();
    }

};

function setMarkers(map) {

    let image = {
        url: 'http://devnx.io/beerings/images/marker.png',
        size: new google.maps.Size(60, 60),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(15, 21),
        scaledSize: new google.maps.Size(30, 30),
    } 

    let infowindow = new google.maps.InfoWindow();

    if (BEER_ME_DATA.markers.length === 0) {

        for (i = 0; i < BEER_ME_DATA.breweriesArr.length; i++) {
            
            let breweryLatLng = {lat: BEER_ME_DATA.breweriesArr[i].lat, lng: BEER_ME_DATA.breweriesArr[i].lng};

            let marker = new google.maps.Marker({position: breweryLatLng, icon: image, map: map});

            BEER_ME_DATA.markers.push(marker);

            google.maps.event.addListener(marker, 'click', (function(marker, i) {
                return function() {

                    let pos = {lat: BEER_ME_DATA.breweriesArr[i].lat,lng: BEER_ME_DATA.breweriesArr[i].lng};

                    infowindow.setContent(`
                        <div class='marker-window'>
                        <img class='marker-logo' src='images/sign.png' alt='brewery icon'> 
                        <p class='marker-title'>${BEER_ME_DATA.breweriesArr[i].name}</p>
                        <p>Rating: ${BEER_ME_DATA.breweriesArr[i].ratingObj.text}<p>
                        <p>${BEER_ME_DATA.breweriesArr[i].formatted_address}</p>
                        </div>
                        `);
                    infowindow.setPosition(pos);
                    infowindow.open(map, (marker - 19));
                }
            })(marker, i));

            google.maps.event.addListener(map, 'click', (function() {
                    infowindow.close();
                })
            );
            
        }

    }

}

function initMap() {

    BEER_ME_DATA.mapStatus = true;

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

    let searchRadius = BEER_ME_DATA.radius;
    
    let request = {
        query: 'brewery',
        location: searchLocation,
        radius: searchRadius
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
            getDistances(BEER_ME_DATA.breweriesArr, map);
        }
    }

}

function resetMap() {
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

    let image = {
        url: 'http://devnx.io/beerings/images/marker.png',
        size: new google.maps.Size(60, 60),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(15, 21),
        scaledSize: new google.maps.Size(30, 30),
    } 

    let infowindow = new google.maps.InfoWindow();

    if (BEER_ME_DATA.markers.length === 0) {

        for (i = 0; i < BEER_ME_DATA.breweriesArr.length; i++) {
            
            let breweryLatLng = {lat: BEER_ME_DATA.breweriesArr[i].lat, lng: BEER_ME_DATA.breweriesArr[i].lng};

            let marker = new google.maps.Marker({position: breweryLatLng, icon: image, map: map});

            BEER_ME_DATA.markers.push(marker);

            google.maps.event.addListener(marker, 'click', (function(marker, i) {
                return function() {
                    let pos = {lat: BEER_ME_DATA.breweriesArr[i].lat,lng: BEER_ME_DATA.breweriesArr[i].lng};

                    infowindow.setContent(`
                        <div class='marker-window'>
                        <img class='marker-logo' src='images/sign.png' alt='brewery icon'> 
                        <p class='marker-title'>${BEER_ME_DATA.breweriesArr[i].name}</p>
                        <p>Rating: ${BEER_ME_DATA.breweriesArr[i].ratingObj.text}<p>
                        <p>${BEER_ME_DATA.breweriesArr[i].formatted_address}</p>
                        </div>
                        `);
                    infowindow.setPosition(pos);
                    infowindow.open(map, (marker - 19));
                }
            })(marker, i));

            google.maps.event.addListener(map, 'click', (function() {
                    infowindow.close();
                })
            );
            
        }

    }

    if ($('#sort-results').length == 0) {
        $(`
            <form name='sort-results' id='sort-results'>
                <fieldset>
                    <legend>Sort results</legend>
                    <label for='name'><input class='sort-target' type='radio' name='sort' id='name' value='sort'>By Name</label>
                    <label for='distance'><input class='sort-target' type='radio' name='sort' id='distance' value='sort' checked>By Distance</label>
                    <label for='rating'><input class='sort-target' type='radio' name='sort' id='rating' value='sort'>By Rating</label>
                </fieldset>
                <p class='more-info'>Click a card for more info</p>
            </form>
        `).insertAfter('#map');
    };

}

$(watchClicks(), getUserLocation());
