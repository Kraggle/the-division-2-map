import { jQuery as $ } from '../jQuery/jquery3.4.1.js';
import { K } from '../K.js';
import { sortObjByKeys, timed } from '../functions/misc.js';

// MARK: [K] Tool.Marker
K.tool.marker = {
    timer: timed(),

    layers: {},

    clear: function() {
        this.layers = {};
    },

    fill: function() {
        K.empty(this.layers) && K.each(K.modes.get, (i, mode) => {
            this.layers[mode] = {};
        });
    },

    add: function(layer) {
        this.fill();

        const o = layer.options,
            p = layer.popup;

        K.each(K.modes.get, (i, mode) => {
            const tool = this.layers[mode];
            if (mode in o.mode) {
                if (!K.in(o.category, tool)) tool[o.category] = {};
                if (!K.in(o.type, tool[o.category])) tool[o.category][o.type] = {
                    o: K.extend({}, o, {
                        className: (o.className || '').replace(/\w+ground/g, '').trim()
                    }),
                    p: p ? p : {}
                };
            }
        });

        this.refresh();
    },

    remove: function(category, type) {
        !K.map.type.counts[type] && K.each(K.modes.get, (i, mode) => {
            const tool = this.layers[mode];
            K.in(category, tool) && K.in(type, tool[category]) && delete tool[category][type];
        });

        this.refresh();
    },

    refresh: function() {
        this.timer.run(() => {
            this.enabled() && $('#marker-tools').remove() && this.show();
        }, 500);
    },

    enabled: function() {
        return !!$('#marker-tools').length;
    },

    show: function() {

        let skip = K.type(arguments[0]) == 'boolean' ? arguments[0] : false;
        K.tool.marker._show.call(K.tool.marker, skip);
    },

    _show: function(skip) {
        if (this.enabled()) {
            if (skip) return;

            $('#marker-tools').remove();
            return;
        }

        $('body').append('<div id="marker-tools" class="marker-panel"></div>');
        const tools = $('#marker-tools');
        tools.append(
            `<div class="outer inputs">
                <div class="switch ripple-me">
                    <input name="switch" id="_2" type="radio" name="radio" value="underground">
                    <label for="_2" class="label down" title="Underground">Below</label>
                    <input name="switch" id="_1" type="radio" name="radio" value="" checked>
                    <label for="_1" class="label level" title="Ground Level">Ground</label>
                    <input name="switch" id="_3" type="radio" name="radio" value="overground">
                    <label for="_3" class="label up" title="Overground">Above</label>
                    <div class="indicator"></div>
                </div>
			</div>
            <div class="outer scroller">
                <div class="icons"></div>
            </div>`
        );

        tools.draggable({
            containment: '#map-id',
            start: function() {
                $(this).css({
                    transform: 'translateX(0)',
                    bottom: 'initial'
                });
            },
            stop: function() {
                this.position = K.extend({}, $(this).position(), {
                    transform: 'translateX(0)',
                    bottom: 'initial',
                    width: $(this).width(),
                    height: $(this).height()
                });
                K.local('toolPos', this.position);
            }
        });

        this.position = K.local('toolPos') || false;

        if (this.position) {
            delete this.position.width;
            delete this.position.height;
            tools.css(this.position);
        }

        $('.switch input', tools).on('change', function() {
            $('a', tools).removeClass('underground overground').addClass($(this).val());
        });

        K.each(sortObjByKeys(this.layers[K.mode]), function(category, layers) {

            $('<span class="category"/>').text(category).appendTo('.outer .icons');

            K.each(sortObjByKeys(layers), function(i, layer) {
                let p = layer.o,
                    active = (p.type == (K.local('markerToolIcon') || 'Contaminated') ? 'enabled' : ''),
                    key = false;

                K.each(K.shortcuts.QuickMarker, function(k, t) {
                    p.type == t && p.type != 'Underground' && (key = k);
                });

                if (K.mode in p.mode) {
                    $('<a />', {
                        class: 'ripple-me ' + active,
                        title: category + '<br>' + p.type.replace('Survival', '').space(),
                        category: category,
                        type: p.type,
                        html: `<img src="${p.iconUrl}">${key ? '<span class="key">' + key + '</span>' : ''}`
                    }).data('properties', p).appendTo('.outer .icons');
                }
            });
        });

        $('#marker-tools a').on('click', function() {
            let typ = $(this).attr('type');

            $(this).siblings('a').removeClass('enabled');
            $(this).addClass('enabled');
            K.local('markerToolIcon', typ);
            K.updateMarker($(this).data('properties'));

            K.bar.draw.Marker.enable();
        });
    }
};