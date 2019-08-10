import { jQuery as $ } from '../jQuery/jquery3.4.1.js';
import { K } from '../K.js';

// MARK: [K] Shortcuts
K.shortcuts = {
    Draw: {
        M: 'Marker',
        P: 'Polygon',
        R: 'Rectangle',
        L: 'Polyline'
    },
    QuickMarker: {
        1: 'Airdrop',
        2: 'ComponentZone',
        3: 'FoodZone',
        4: 'WaterZone',
        5: 'Artifact',
        E: 'Comms',
        A: 'Echo',
        F: 'Food',
        D: 'Water',
        S: 'Component',
        W: 'Weapon',
        Q: 'Gear',
        Z: 'GroundLevel',
        X: 'Underground',
        C: 'Overground'
    }
};

export function keypressEvent(e) {

    if (!K.user.type || K.tool.layer.isOpen() || !K.bar.b.power.enabled() || $(e.target).is('input'))
        return;

    // Marker :---> M
    if (e.which == 109) {
        e.preventDefault();

        K.bar.draw.Marker.toggle();

        // Rectangle :---> R
    } else if (e.which == 114) {
        e.preventDefault();

        K.bar.draw.Rectangle.toggle()

        // Polygon :---> P
    } else if (e.which == 112) {
        e.preventDefault();

        K.bar.draw.Polygon.toggle()

        // Polyline :---> L
    } else if (e.which == 108) {
        e.preventDefault();

        K.bar.draw.Polyline.toggle()
    }

    let quickAction = function(type) {
        K.tool.marker.show(true);
        $('#marker-tools a[type="' + type + '"]').trigger('click');
    };

    let key = K.shortcuts.QuickMarker;

    // Quick Marker :---> S
    if (e.which == 115) {
        e.preventDefault();
        quickAction(key.S);

        // Quick Maker :---> 1
    } else if (e.which == 49) {
        e.preventDefault();
        quickAction(key['1']);

        // Quick Maker :---> 2
    } else if (e.which == 50) {
        e.preventDefault();
        quickAction(key['2']);

        // Quick Maker :---> 3
    } else if (e.which == 51) {
        e.preventDefault();
        quickAction(key['3']);
        // console.log('content');

        // Quick Maker :---> 4
    } else if (e.which == 52) {
        e.preventDefault();
        quickAction(key['4']);

        // Quick Maker :---> 5
    } else if (e.which == 53) {
        e.preventDefault();
        quickAction(key['5']);

        // Quick Maker :---> E
    } else if (e.which == 101) {
        e.preventDefault();
        quickAction(key.E);

        // Quick Maker :---> A
    } else if (e.which == 97) {
        e.preventDefault();
        quickAction(key.A);

        // Quick Maker :---> F
    } else if (e.which == 102) {
        e.preventDefault();
        quickAction(key.F);

        // Quick Maker :---> D
    } else if (e.which == 100) {
        e.preventDefault();
        quickAction(key.D);

        // Quick Maker :---> Q
    } else if (e.which == 113) {
        e.preventDefault();
        quickAction(key.Q);

        // Quick Maker :---> W
    } else if (e.which == 119) {
        e.preventDefault();
        quickAction(key.W);

        // Quick Maker :---> Z
    } else if (e.which == 122) {
        e.preventDefault();
        $('#marker-tools input[value=""]').prop('checked', true);
        $('#marker-tools a').removeClass('underground overground');

        // Quick Maker Underground :---> X
    } else if (e.which == 120) {
        e.preventDefault();
        $('#marker-tools input[value="underground"]').prop('checked', true);
        $('#marker-tools a').removeClass('underground overground').addClass('underground');

        // Quick Maker Overground :---> C
    } else if (e.which == 99) {
        e.preventDefault();
        $('#marker-tools input[value="overground"]').prop('checked', true);
        $('#marker-tools a').removeClass('underground overground').addClass('overground');
    }
}