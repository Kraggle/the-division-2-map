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

    let quickAction = function(type) {
        K.tool.marker.show(true);
        $('#marker-tools a[type="' + type + '"]').trigger('click');
    };

    let key = K.shortcuts.QuickMarker;

    if (e.altKey && e.key == 'r') {
        e.preventDefault();

        K.mapLoader();

        // Marker :---> M
    } else if (e.key == 'm') {
        e.preventDefault();

        K.bar.draw.Marker.toggle();

        // Rectangle :---> R
    } else if (e.key == 'r') {
        e.preventDefault();

        K.bar.draw.Rectangle.toggle()

        // Polygon :---> P
    } else if (e.key == 'p') {
        e.preventDefault();

        K.bar.draw.Polygon.toggle()

        // Polyline :---> L
    } else if (e.key == 'l') {
        e.preventDefault();

        K.bar.draw.Polyline.toggle()

        // Quick Marker :---> S
    } else if (e.key == 's') {
        e.preventDefault();
        quickAction(key.S);

        // Quick Maker :---> 1
    } else if (e.key == '1') {
        e.preventDefault();
        quickAction(key['1']);

        // Quick Maker :---> 2
    } else if (e.key == '2') {
        e.preventDefault();
        quickAction(key['2']);

        // Quick Maker :---> 3
    } else if (e.key == '3') {
        e.preventDefault();
        quickAction(key['3']);
        // console.log('content');

        // Quick Maker :---> 4
    } else if (e.key == '4') {
        e.preventDefault();
        quickAction(key['4']);

        // Quick Maker :---> 5
    } else if (e.key == '5') {
        e.preventDefault();
        quickAction(key['5']);

        // Quick Maker :---> E
    } else if (e.key == 'e') {
        e.preventDefault();
        quickAction(key.E);

        // Quick Maker :---> A
    } else if (e.key == 'a') {
        e.preventDefault();
        quickAction(key.A);

        // Quick Maker :---> F
    } else if (e.key == 'f') {
        e.preventDefault();
        quickAction(key.F);

        // Quick Maker :---> D
    } else if (e.key == 'd') {
        e.preventDefault();
        quickAction(key.D);

        // Quick Maker :---> Q
    } else if (e.key == 'q') {
        e.preventDefault();
        quickAction(key.Q);

        // Quick Maker :---> W
    } else if (e.key == 'w') {
        e.preventDefault();
        quickAction(key.W);

        // Quick Maker :---> Z
    } else if (e.key == 'z') {
        e.preventDefault();
        $('#marker-tools input[value=""]').prop('checked', true);
        $('#marker-tools a').removeClass('underground overground');

        // Quick Maker Underground :---> X
    } else if (e.key == 'x') {
        e.preventDefault();
        $('#marker-tools input[value="underground"]').prop('checked', true);
        $('#marker-tools a').removeClass('underground overground').addClass('underground');

        // Quick Maker Overground :---> C
    } else if (e.key == 'c') {
        e.preventDefault();
        $('#marker-tools input[value="overground"]').prop('checked', true);
        $('#marker-tools a').removeClass('underground overground').addClass('overground');

    }
}