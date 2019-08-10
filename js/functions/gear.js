function setCollectionData() {

    $('#side-bar .img-check').removeClass('checked');

    $.ajax({
        type: 'POST',
        url: 'php/collection_data_get.php'
    }).done(function(a) {

        Cookies.json = true;

        setData = a.bMatch(/(\{|\[])".*(\}|\])/) ? $.parseJSON(a) : false;

        if (!setData) {
            let setData1 = Cookies.getJSON('setData1');
            let setData2 = Cookies.getJSON('setData2');
            if (K.type(setData1) === 'object' && K.type(setData2) === 'object')
                setData = K.extend({}, setData1, setData2);
        }

        setData && K.each(setData, function(index, val) {
            val && $(`#side-bar .img-check[name="${index}"]`).addClass('checked');
        });
        updateSetCounter();
    });
}

function updateSetCounter() {

    $('.set-piece').each(function(index, el) {

        let count = $(this).find('.img-check.checked').length;

        $(this).find('.counter').html(count || '');
        $(this).find('.set-bonus').removeClass('active');

        for (let i = count; i > 0; i--) {
            $(this).find('.set-bonus.' + i).addClass('active');
        }
    });

    let checks = '#side-bar .img-check',
        total = $(checks).length,
        got = $(checks + '.checked').length,
        left = total - got,
        counters = $('#side-bar .counter'),
        totalSets = counters.length,
        sets = 0,
        m;

    counters.each(function(index, el) {
        $(this).text() == 6 && sets++;
    });

    // Collect and store the data for reload
    let setData = {};
    $(checks).each(function(index, el) {
        setData[$(this).attr('name')] = $(this).hasClass('checked');
    });

    $('#side-bar .warning').html('');

    if (!K.user.type) {
        $('#side-bar .warning').html("This data is stored locally, if you would\
            like it to be persistant, please create an account or sign in.");

        // let setData1 = {};
        // let setData2 = setData;

        // while (K.length(setData1) < K.length(setData2)) {
        //     let key = Object.keys(setData2)[0];
        //     setData1[key] = setData2[key];
        //     delete setData2[key];
        // }

        K.local('setData', setData);

        // K.local('setData1', setData1);
        // K.local('setData2', setData2);

    } else {

        $.ajax({
            type: 'POST',
            url: 'php/collection_data_set.php',
            data: {
                setData: JSON.stringify(setData)
            }
        });
    }

    translator();
}