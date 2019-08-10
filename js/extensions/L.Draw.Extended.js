import { jQuery as $ } from '../jQuery/jquery3.4.1.js';
import { L } from '../Leaflet/importer.js';
import { K } from '../K.js';
import { ID, switchLayerGroups, polyHoverAnimation } from '../functions/misc.js';
import { createMarker } from '../functions/create-marker.js';

// MARK: [L] Draw (Extended)
// Included to be able to disable the Leaflet.Draw create buttons
L.Draw.Feature.include({

    // This has to be included to make sure it adds the disabler
    enable: function() {

        // Added by Kraggle
        /////////////////////
        if (this._disabled) {
            return;
        }

        if (this._enabled) {
            return;
        }

        L.Handler.prototype.enable.call(this);

        this.fire('enabled', {
            handler: this.type
        });

        this._map.fire(L.Draw.Event.DRAWSTART, {
            layerType: this.type
        });
    },

    toggle: function() {

        if (this._enabled) {
            L.Handler.prototype.disable.call(this);

            this._map.fire(L.Draw.Event.DRAWSTOP, {
                layerType: this.type
            });

            this.fire('disabled', {
                handler: this.type
            });

        } else {

            L.Handler.prototype.enable.call(this);

            this.fire('enabled', {
                handler: this.type
            });

            this._map.fire(L.Draw.Event.DRAWSTART, {
                layerType: this.type
            });
        }
    },

    disabler: function() {
        this._disabled = true;
        this.disable();
        this._updateDisabled();
        return this;
    },

    enabler: function() {
        this._disabled = false;
        this._updateDisabled();
        return this;
    },

    _updateDisabled: function() {
        let className = 'leaflet-disabled';

        if (!this._button) {
            this._button = document.getElementsByClassName('leaflet-draw-draw-' + this.type)[0];
        }

        L.DomUtil.removeClass(this._button, className);

        if (this._disabled) {
            L.DomUtil.addClass(this._button, className);
        }
    }
});

// Included to be able to disable the Leaflet.Draw delete button
L.EditToolbar.Delete.include({

    // This has to be included to make sure it adds the disabler
    enable: function() {

        // Added by Kraggle
        /////////////////////
        if (this._disabled) {
            return;
        }

        if (this._enabled || !this._hasAvailableLayers()) {
            return;
        }
        this.fire('enabled', {
            handler: this.type
        });

        this._map.fire(L.Draw.Event.DELETESTART, {
            handler: this.type
        });

        L.Handler.prototype.enable.call(this);

        this._deletableLayers
            .on('layeradd', this._enableLayerDelete, this)
            .on('layerremove', this._disableLayerDelete, this);
    },

    disabler: function() {
        this._disabled = true;
        this.disable();
        this._updateDisabled();
        return this;
    },

    enabler: function() {
        this._disabled = false;
        this._updateDisabled();
        return this;
    },

    _updateDisabled: function() {
        let className = 'leaflet-disabled';

        if (!this._button) {
            this._button = document.getElementsByClassName(`leaflet-draw-edit-${this.type}`)[0];
        }

        L.DomUtil.removeClass(this._button, className);

        if (this._disabled) {
            L.DomUtil.addClass(this._button, className);
        }
    }
});

// Included to be able to disable the Leaflet.Draw edit button
L.EditToolbar.Edit.include({

    // This has to be included to make sure it adds the disabler
    enable: function() {

        // Added by Kraggle
        /////////////////////
        if (this._disabled) {
            return;
        }

        if (this._enabled || !this._hasAvailableLayers()) {
            return;
        }
        this.fire('enabled', {
            handler: this.type
        });
        // this disable other handlers

        this._map.fire(L.Draw.Event.EDITSTART, {
            handler: this.type
        });
        // allow drawLayer to be updated before beginning edition.

        L.Handler.prototype.enable.call(this);
        this._featureGroup
            .on('layeradd', this._enableLayerEdit, this)
            .on('layerremove', this._disableLayerEdit, this);
    },

    disabler: function() {
        this._disabled = true;
        this.disable();
        this._updateDisabled();
        return this;
    },

    enabler: function() {
        this._disabled = false;
        this._updateDisabled();
        return this;
    },

    _updateDisabled: function() {
        let className = 'leaflet-disabled';

        if (!this._button) {
            this._button = document.getElementsByClassName(`leaflet-draw-edit-${this.type}`)[0];
        }

        L.DomUtil.removeClass(this._button, className);

        if (this._disabled) {
            L.DomUtil.addClass(this._button, className);
        }
    }
});

// MARK: => DrawEventCreated
export function drawEventCreated(e) {
    let layer = e.layer,
        type = e.layerType,
        shape = K.settingShape(type),
        copy = (K.local('copy') || {})[shape] || {},
        popup = copy.p || {};

    // Marker
    if (type == 'marker') {

        let selected = $('#marker-tools a.enabled');

        if (K.tool.marker.enabled() && selected.length) {

            let lvl = $('.outer.inputs input:checked').val(),
                cat = selected.attr('category'),
                typ = selected.attr('type'),
                j = K.tool.marker.layers[K.mode][cat][typ],
                p = j.o;

            lvl = (lvl ? ' ' + lvl : '');
            popup = j.p;

            layer = createMarker(K.extend({}, p, {
                id: ID(),
                latlng: layer._latlng,
                className: `${p.className}${lvl}`,
            }));

        } else {

            const icon = copy ? copy.o : K.map.defaults.marker;

            layer = createMarker(K.extend(icon, {
                id: ID(),
                latlng: layer._latlng,
                shape: 'marker'
            }));
        }

    } else { // Circle, Polyline, Polygon or Rectangle

        let obj = copy.o || K.map.defaults[shape];

        if (K.type(obj) == 'object') {

            let ll = layer._latlng;
            if (type == 'polyline') ll = layer._latlngs.removeDupes();
            else if (K.has(type, ['polygon', 'rectangle'])) ll = layer._latlngs[0].removeDupes();

            K.extend(obj, {
                id: ID(),
                pane: (obj.className == 'poly-hover' ? 'zonePane' : 'overlayPane'),
                shape: type
            });

            if (type == 'circle') obj.radius = layer._mRadius;

            layer = L[type](ll, obj);

        }
    }

    if (!K.empty(popup)) layer.bindPopup(popup);

    // Add the new layer to the map
    layer.options.creator = K.user.name;
    layer.options.group = layer.options.group || 'group08';

    K.group.addLayer(layer);

    layer.on('click', K.tool.layer.show);
    layer.getSetting('complete') && layer.options.shape === 'marker' && layer.on('contextmenu', function() {
        this.toggleCompleted();
    });

    layer.saved(false);
    layer.storeSettings();

    K.map.type.add(layer.options.type);

    switchLayerGroups();
    polyHoverAnimation();
}