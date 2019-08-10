import { jQuery as $ } from '../jQuery/jquery3.4.1.js';
import { K } from '../K.js';

// MARK: [K] => PerformURITasks
K.performURITasks = function() {
    const params = K.urlParam() || {};

    if (K.in('search', params)) {
        $('.side-menu-toggle.search:not(.active)').trigger('click');

        K.search.CHECK.EXACT.prop('checked', !!params.searchExact);
        K.search.CHECK.MATCH.prop('checked', !!params.searchMatch);
        K.search.CHECK.ONLY.prop('checked', !!params.searchOnly);

        if (K.in('searchSort', params)) {
            $('.search .sort input').prop('checked', false);
            const type = params.searchSort.toUpperCase(),
                dir = (params.searchDir || 'asc').toUpperCase();
            K.search.SORT[type][dir].prop('checked', true);
        }

        K.search.SEARCH.val(params.search).trigger('change');
    }

    if (K.in('layer', params)) {
        const layer = K.group.getLayer(params.layer);
        if (layer instanceof L.Layer) {
            if (layer._latlng) {
                const group = layer.options.group;
                let zoom = group.bMatch(/\d+/) ? Number(group.match(/\d+/)) :
                    7;

                K.myMap.flyTo(layer._latlng, zoom + 2, {
                    maxZoom: 15
                });

                K.myMap.once('moveend', () => {
                    $(layer._icon).addClass('pan-pointer');
                });

            } else K.myMap.flyToBounds(layer._latlngs, {
                animate: true,
                padding: L.point([250, 250]),
                maxZoom: 15
            });
        }
    }

    // TODO: pan + zoom
    // if (K.in('pan', params)) {

    // }

    // if (K.in('zoom', params)) {

    // }

    window.history.replaceState({}, document.title, window.location.origin);
};