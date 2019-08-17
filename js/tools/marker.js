import { jQuery as $ } from '../jQuery/jquery3.4.1.js';
import { K } from '../K.js';
import { sortObjByKeys } from '../functions/misc.js';

// MARK: [K] Tool.Marker
K.tool.marker = {
    full: false,
    layers: {},

    fill: function() {
        let _this = K.tool.marker;
        !_this.full && K.each(K.modes.get, function(i, mode) {
            _this.layers[mode] = {};
        });
        _this.full = true;
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