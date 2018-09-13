const OPEN_BREWERY_URL = 'https://api.openbrewerydb.org/breweries';

//1 User searches for a city
function watchSubmit() {

    $('#submit').click(function(e) {
        let search = $('#city').val();
        e.preventDefault();
        $('.js-results').empty();
        getDataFromAPI(search, getAPIResult);
        $('#next-page').removeClass('hidden');
        $('#city').val("");
    });

}

//2 Send and receive data from API
function getDataFromAPI(search, callback) {

    const params = {
        by_city: search,
        sort: '+name',
        per_page: 10
    }

    $.getJSON(OPEN_BREWERY_URL, params, callback);
}


//2b Get next page


//2c Get previous page



//3 Retrieve single item
function getAPIResult(data) {
        
    for (i = 0; i < data.length; i++) {

        if (data[i].street !== "") {
            renderResult(data[i]);
        }
    }
};

//4 Display item on HTML
function renderResult(item) {
    let brewery = item;
    $('.js-results').append(`
                <div>
                <a class='brewery-name' href='${brewery.website_url}' target="_default">${brewery.name}</a>
                <address>
                    ${brewery.street}<br>
                    ${brewery.city}<br>
                    ${brewery.state}<br>
                    ${brewery.postal_code}<br>
                </address>
                </div>
            `);
};


$(watchSubmit);