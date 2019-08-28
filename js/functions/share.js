import { jQuery as $ } from '../jQuery/jquery3.4.1.js';
import { L } from '../Leaflet/leaflet1.5.1.js';
import { K } from '../K.js';

// MARK: [K] Share
K.share = function(tasks, layer) {
    const uri = [];

    if (K.in('search', tasks)) {
        uri.push(encodeURI(`search=${K.search.SEARCH.val()}`));

        for (const key in K.search.CHECK) {
            const el = K.search.CHECK[key];
            el.is(':checked') && uri.push(`search${el.attr('btn').titleCase()}=true`);
        }

        const sort = $('.search .sort input:checked');
        sort.length && (uri.push(`searchSort=${sort.attr('btn')}`), uri.push(`searchDir=${sort.attr('dir')}`));
    }

    if (K.in('layer', tasks) && layer instanceof L.Layer)
        uri.push(`layer=${layer.options.id}`);

    $('#copy-input').val(`${window.location.origin}?${uri.join('&')}`);
    const copy = document.getElementById('copy-input');
    copy.select();
    document.execCommand('copy');

    K.msg.show({
        msg: 'Shareable link copied to the clipboard!',
        time: 2000
    });
};