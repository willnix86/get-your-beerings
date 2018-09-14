'use strict';

const OPEN_BREWERY_URL = 'https://api.openbrewerydb.org/breweries';
const DISTANCE_MATRIX_URL = 'http://www.mapquestapi.com/directions/v2/routematrix?key=3Tq7BgL2BLnK1uBtZosI3iLuhoqNDm4G';


let currPage = 1;
let searchTarget = $('#city');
let search = searchTarget.val();

// Get user location


//1 User searches for a city
function watchSubmit() {

    $('#submit').click(function(e) {
        e.preventDefault();
        resetResults();
        searchTarget = $('#city');
        search = searchTarget.val();
        getDataFromAPI(search, getAPIResult);
        $('.js-pagination').prop('hidden', false);
        $('#next-page').removeClass('hidden');
        $('#city').val("");
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
            $('#previous-page').addClass('hidden');
        };
    });

}

// Reset results window
function resetResults() {
    $('.js-results').empty();
    $('#next-page').addClass('hidden');
    $('.js-pagination').prop('hidden', true);
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

    $('#prev-page').removeClass('hidden');

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
        for (let i = 0; i < 1; i++) {

            if (data[i].street !== "") {
                getDistance(data[i]);
                renderResult(data[i]);
            }
        }
    }
};


// Retrieve distance to each brewery
function getDistance(brewery) {

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

        console.log(response.distance[1].toFixed(1));

    });

}

//4 Display item on HTML
function renderResult(brewery) {
    $('.js-results').prop('hidden', false);
    $('.js-results').append(`
                <div>
                <a class='brewery-name' href='${brewery.website_url}' target="_default">${brewery.name}</a> <p class='brewery-type'>${brewery.brewery_type}</p>
                <address>
                    ${brewery.street}<br>
                    ${brewery.city}<br>
                    ${brewery.state}<br>
                    ${brewery.postal_code}<br>
                </address>
                </div>
            `);
};

$(watchSubmit());