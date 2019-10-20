import { jQuery as $ } from '../jQuery/jquery3.4.1.js';
import { K } from '../K.js';
import { L } from '../Leaflet/leaflet1.5.1.js';

// MARK: [K] Level
K.level = {
    layers: {},

    _click: function() {
        if ($(this).hasClass('active')) return;

        const data = $(this).data(),
            j = +$(this).attr('floor');

        K.each(data.floors, function(i, el) {
            i == j ? $(el).fadeIn(400) : $(el).fadeOut(400);
        });

        K.each(data.buttons, function(i, el) {
            i == j ? $(el).addClass('active') : $(el).removeClass('active');
        });

        K.each(K.level.layers[$(this).attr('unit')], (f, a) => {
            f = +f;

            K.each(a, (i, l) => {
                f == j && l.setLevel('', 0);
                f < j && l.setLevel('underground', j - f);
                f > j && l.setLevel('overground', f - j);
            });
        });
    },

    build: function() {
        this.MAP = $('#svg-map');
        this.CONTROL = $('#control-map');

        $('g:regex(id,^l-\\d+$)', this.MAP).each(function() {

            const group = {
                floors: {},
                buttons: {}
            };

            // floors
            $(':regex(id,^l-\\d+-+\\d+$)', this).each(function() {

                const floor = this.id.match(/-(-{0,1}\d+$)/)[1];
                if (floor != 1) $(this).hide();

                group.floors[floor] = this;
            });

            // buttons
            $(':regex(id,^b-\\d+-+\\d+$)', this).each(function() {
                $(this).addClass('level-button');
                K.level.CONTROL.append($(this).detach());
                $(this).on('click', K.level._click);

                const level = this.id.match(/-(-{0,1}\d+$)/)[1],
                    unit = this.id.match(/-(\d+)-/)[1];
                if (level == 1) $(this).addClass('active');

                group.buttons[level] = this;
                $(this).data(group);
                $(this).attr({
                    floor: level,
                    unit: unit
                });

                $('path', this).each(function() {
                    $(this).css('fill') == 'rgb(34, 89, 26)' && $(this).addClass('hover-path');
                });
            });
        });
    }
};

// MARK: [L] Layer.setLevel
L.Marker.include({
    setLevel: function(level, floor) {
        this._level = level;

        this.updateIcon();
        this.setOpacity(Math.max(1 - (Math.abs(floor) / 5), 0));
    }
});