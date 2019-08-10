import { L } from '../Leaflet/importer.js';
import { K } from '../K.js';

// MARK: => CreateMarker
export function createMarker(p) {

    !p.mode && (p.mode = {
        [K.mode]: {}
    });

    const i = K.getSetting(p, 'iconUrl');

    // new settings happen here
    return L.marker(p.latlng, K.extend(p, {
        icon: createIcon({
            iconUrl: i,
            iconSize: K.getSetting(p, 'iconSize'),
            html: !i ? K.getSetting(p, 'html') : '',
            className: K.getSetting(p, 'className'),
            mode: p.mode
        }),
        shape: 'marker',
        riseOnHover: true,
        zIndexOffset: K.has(p.type, K.map.zIndex) ? 1000 : 0
    }));
}

export function createIcon(options) {
    return L.divIcon(K.extend({
        iconUrl: '',
        iconSize: '',
        html: '',
        className: '',
        done: false,
        time: false,
        mode: {}
    }, options));
}