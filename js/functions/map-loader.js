import { jQuery as $ } from '../jQuery/jquery3.4.1.js';
import { L } from '../Leaflet/importer.js';
import { K } from '../K.js';

K.overlay = {
    main: null,
    controls: null
};

// MARK: [K] MapLoader
K.mapLoader = function() {
    $.ajax({
        url: 'php/map_date.php',
    }).done(function(a) {

        if (K.mapVersion != a) {
            K.mapVersion = a;

            K.overlay.main instanceof L.ImageOverlay && K.overlay.main.remove();
            K.overlay.controls instanceof L.ImageOverlay && K.overlay.controls.remove();

            // Map Image Overlay
            K.overlay.main = L.imageOverlay(`images/map.svg?v=${K.mapVersion}`, [
                [15, -15],
                [-15, 15]
            ], {
                attribution: `<a title="Tom Clancy's The Division 2" href="https://tomclancy-thedivision.ubisoft.com/">The Division 2</a>`,
                pane: 'mapPane'
            }).addTo(K.myMap);

            $('.leaflet-map-pane > .leaflet-image-layer').addClass('svg-me');
            K.imgToSvg('svg-me', function() {
                K.overlay.main._image = this;
                this.id = 'svg-map';

                K.overlay.controls = L.imageOverlay(`images/blank-map.svg`, [
                    [15, -15],
                    [-15, 15]
                ], {
                    pane: 'controlPane'
                }).addTo(K.myMap);

                $('.leaflet-control-pane > .leaflet-image-layer').addClass('svg-me');
                K.imgToSvg('svg-me', function() {
                    K.overlay.controls._image = this;
                    this.id = 'control-map';
                    $(this).addClass('level-control-layer');

                    // $('>*', this).remove();

                    K.level.build();
                    K.done.start();

                    $('#map-done').detach().insertAfter('#map-paths');
                });
            });
        }
    });
}