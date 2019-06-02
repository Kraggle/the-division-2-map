K.currentUpdate = '15/05/2019';
K.iconVersion = '1';
K.modes = {
    get: [
        'Story Mode',
        'World Tier I',
        'World Tier II',
        'World Tier III',
        'World Tier IV',
        'World Tier V'
    ],
    create: function() {
        $.each(this.get, function(i, mode) {
            K.group.feature[mode] = {};
            K.map.type[mode] = {};
        });
    }
};

/*========================================
=            LEAFLET INCLUDES            =
========================================*/
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

// Included to remove the clear all option from Leaflet.Draw
L.EditToolbar.include({

    getActions: function() {
        return [{
            title: L.drawLocal.edit.toolbar.actions.save.title,
            text: L.drawLocal.edit.toolbar.actions.save.text,
            callback: this._save,
            context: this
        }, {
            title: L.drawLocal.edit.toolbar.actions.cancel.title,
            text: L.drawLocal.edit.toolbar.actions.cancel.text,
            callback: this.disable,
            context: this
        }];
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

// Included to modify the way popups work
L.Layer.include({

    openPopup: function(layer, latlng) {
        if (!(layer instanceof L.Layer)) {
            latlng = layer;
            layer = this;
        }

        if (layer instanceof L.FeatureGroup) {
            for (let id in this._layers) {
                layer = this._layers[id];
                break;
            }
        }

        if (!this._popup._content) return this;

        this._popup.setContent(this._popup._content);

        if (!latlng) {
            latlng = layer.getCenter ? layer.getCenter() : layer.getLatLng();
        }

        if (!this._popup._content) return this;

        if (this._popup && this._map) {
            // set popup source to this layer
            this._popup._source = layer;

            // update the popup (content, layout, ect...)
            this._popup.update();

            // open the popup on the map
            this._map.openPopup(this._popup, latlng);
        }

        return this;
    },

    bindPopup: function() {
        const a = arguments;
        let content = a[0],
            options = a[1] || {};
        if ($.type(a[0]) === 'object') {
            options = a[0];
            content = options.content;
        }

        this.popup = options;
        const cn = this.getSetting('className', true);
        content = this.getSetting('content', true);

        let o = {
            className: cn,
            pane: (cn || '').contains('poly-info') ? 'messagePane' : 'popupPane',
            list: this.getSetting('list', true) || {},
            offset: L.point(-24, 42),
            closeButton: false,
            autoPan: false,
            minWidth: 15,
            maxWidth: 300
        };

        if (!content && o.list.title)
            content = this.convertContent(o);

        if (content instanceof L.Popup) {
            L.setOptions(content, o);
            this._popup = content;
            content._source = this;

        } else if ($.type(content) == 'object' && K.in('_content', content) && !content._content) {

            return this;

        } else {

            content = (content || '').bMatch(/^\$/) ? K.popupContent[content] : content;

            if (!this._popup || o) {
                this._popup = new L.Popup(o, this);
            }
            this._popup.setContent(content);
        }

        if (!this._popupHandlersAdded) {
            this.on({
                click: this._openPopup,
                remove: this.closePopup,
                move: this._movePopup
            });

            this.on('mouseover click focus', this._openPopup).on('mouseout blur', this.closePopup);

            this._popupHandlersAdded = true;
        }

        return this;
    },

    convertContent: function(options) {
        let list = options.list,
            html = '',
            img, mark;

        if (list.title)
            html += list.title;

        $.each(list.subs, function(i, v) {
            if (v.value) html += `<p class="${v.color ? 'desc' : ''} ${v.note ? 'note' : ''}">${v.value}</p>${v.line ? '<hr>' : ''}`;
        });

        if (list.list && list.list[0] && list.list[0].item) {

            list.list.sort(function(a, b) {

                return (a.item < b.item ? -1 : a.item > b.item ? 1 : 0);
            });

            html += '<ul>';
            $.each(list.list, function(i, v) {

                if (!v) return true;

                let n = (v.item || '').replace(/ /g, '');
                $.each(K.tool.marker.layers, function(j, w) {
                    if (w[n])
                        mark = w[n];
                });

                img = `<img${mark ? ` src="${mark.properties.iconUrl}"` : ''}>`;
                html += `<li>${img}<span>${v.item}</span><span class="qty">'${v.qty > 1 ? '(x' + v.qty + ')' : ''}</span></li>`;
            });
            html += '</ul>';
        }

        return html;
    },

    closePopup: function() {

        if (this._popup && this._popup._content) {

            this._popup._close();
        }
        return this;
    },

    toggleCompleted: function() {
        if (!this.options.complete) return;

        K.complete.toggle(this);
        this.markComplete();

    },

    setCompleted: function(done) {
        if (!this.options.complete) return;

        K.complete.set(done, this);
        this.markComplete();

    },

    markComplete: function() {
        if (!this.options.complete) return;

        // a startup check to see if this needs changing
        let done = this.complete = K.complete.is(this);
        if (!this.init && !done) {
            this.init = true;
            return;
        }
        this.init = true;

        // when timed, check it still needs the overlay 
        let time = this.options.time;
        if (time && done) {
            if (K.complete.time(this)) {
                K.timed.add(this);
            } else {
                K.complete.set(false, this);
                K.timed.remove(this.options.id);

                done = this.complete = K.complete.is(this);
            }
        }

        // set the correct overlay on the marker
        if (this.options.shape === 'marker')
            this.updateIcon();

        if (!!this.options.link) {
            $.each(this.getLinked(), function() {
                if (this.complete != done)
                    this.setCompleted(done);
            });
        }

        if (done) K.complete.add(this);
        else K.complete.remove(this.options.id);

        K.complete.showHide();
    },

    getLinked: function() {
        let links = this.options.link;
        if (!links) return [];

        let layers = [];

        K.group.feature[K.mode].everyLayer.eachLayer(function(l) {
            if (K.has(l.options.id, links)) layers.push(l);
        });

        return layers;
    },

    addClass: function(value) {
        let classes = classesToArray(value),
            cur, curValue, clazz, j, finalValue,
            className = this.options.shape === 'marker' ? this.options.icon.options.className : this.options.className;

        if (classes.length) {
            curValue = className || '';
            cur = ` ${stripAndCollapse(curValue)} `;

            if (cur) {
                j = 0;
                while ((clazz = classes[j++])) {
                    if (cur.indexOf(` ${clazz} `) < 0)
                        cur += clazz + " ";
                }

                // Only assign if different to avoid unneeded rendering.
                finalValue = stripAndCollapse(cur);
                if (curValue !== finalValue) {
                    this.applySetting({
                        setting: 'className',
                        value: finalValue,
                        skipSave: true
                    });
                }
            }
        }

        return this;
    },

    removeClass: function(value) {

        let classes = classesToArray(value),
            cur, curValue, clazz, j, finalValue,
            className = this.options.shape === 'marker' ? this.options.icon.options.className : this.options.className;

        if (classes.length) {
            curValue = className || '';
            cur = ` ${stripAndCollapse(curValue)} `;

            if (cur) {
                j = 0;
                while ((clazz = classes[j++])) {

                    // Remove *all* instances
                    while (cur.indexOf(` ${clazz} `) > -1) {
                        cur = cur.replace(` ${clazz} `, " ");
                    }
                }

                // Only assign if different to avoid unneeded rendering.
                finalValue = stripAndCollapse(cur);
                if (curValue !== finalValue) {
                    this.applySetting({
                        setting: 'className',
                        value: finalValue,
                        skipSave: true
                    });
                }
            }
        }

        return this;
    }
});

L.Polyline.include({

    initialize: function(latlngs, options) {
        L.setOptions(this, options);

        // Added to condense the latlng to be more saveable
        if (K.in('shape', options)) {
            $.each(latlngs, (i, v) => {
                v.lat = L.Util.formatNum(v.lat);
                v.lng = L.Util.formatNum(v.lng);
            });
        }

        this._setLatLngs(latlngs);
    }
});

L.Circle.include({

    initialize: function(latlng, options, legacyOptions) {
        if (typeof options === 'number') {
            // Backwards compatibility with 0.7.x factory (latlng, radius, options?)
            options = L.extend({}, legacyOptions, { radius: options });
        }
        L.setOptions(this, options);

        // Added to condense the latlng to be more saveable
        if (K.in('shape', options)) {
            latlng.lat = L.Util.formatNum(latlng.lat);
            latlng.lng = L.Util.formatNum(latlng.lng);
            this.options.radius = L.Util.formatNum(this.options.radius);
        }

        this._latlng = L.latLng(latlng);

        if (isNaN(this.options.radius)) { throw new Error('Circle radius cannot be NaN'); }

        // @section
        // @aka Circle options
        // @option radius: Number; Radius of the circle, in meters.
        this._mRadius = this.options.radius;
    }
});

L.Marker.include({

    initialize: function(latlng, options) {
        L.setOptions(this, options);

        // Added to condense the latlng to be more saveable
        if (K.in('shape', options)) {
            latlng.lat = L.Util.formatNum(latlng.lat);
            latlng.lng = L.Util.formatNum(latlng.lng);
        }

        this._latlng = L.latLng(latlng);
    },

    updateIcon: function(options = {}) {

        if (!this.options.icon) return this;

        const i = this.getSetting('iconUrl');

        this.options.icon = createIcon($.extend({
            iconUrl: i,
            iconSize: this.getSetting('iconSize'),
            html: !i ? this.getSetting('html') : '',
            className: this.getSetting('className'),
            done: K.complete.is(this),
            time: K.complete.time(this)
        }, options));

        if (this._map) {
            this._initIcon();
            this.update();
        }

        this._popup && this.bindPopup(this.popup);

        return this;
    },

});

L.DivIcon.include({ // MARK: L.DivIcon {extended}

    createIcon: function(oldIcon) {
        const o = this.options;

        const div = (oldIcon && oldIcon.tagName === 'DIV') ? oldIcon : document.createElement('div');

        div.innerHTML = K.getSetting(this.options, 'html') || this.getIconHTML();

        if (o.bgPos) {
            var bgPos = L.point(o.bgPos);
            div.style.backgroundPosition = (-bgPos.x) + 'px ' + (-bgPos.y) + 'px';
        }
        this._setIconStyles(div, 'icon');

        return div;
    },

    getIconHTML: function() {
        const o = this.options;

        return `${K.getSetting(o, 'className').contains('anim-icon') ? `<img class="halo" src="images/_a.svg">` : ''} 
                <img src="${K.getSetting(o, 'iconUrl') || ''}" class="icon">
                ${o.done && !o.time ? '<img src="images/complete.svg" class="done">' : ''}
                ${o.done && o.time ? `<span class="time">${o.time}</span>` : ''}
                ${K.svg.dot}`.replace(/ {2,}/g, ' ');
    }
});

L.Icon.include({

    _setIconStyles: function(img, name) {
        const o = this.options,
            m = K.in('mode', o) && K.in('o', o.mode[K.mode]) ? o.mode[K.mode].o : false,
            iz = `${name}Size`,
            cn = 'className';

        let s = K.in(iz, m) ? m[iz] : o[iz];
        typeof s === 'number' && (s = [s, s]);

        let size = L.point(s),
            anchor = L.point(name === 'shadow' && o.shadowAnchor || o.iconAnchor ||
                size && size.divideBy(2, true));

        img.className = `leaflet-marker-${name} ${(K.in(cn, m) ? m[cn] : o[cn]) || ''}`;

        if (anchor) {
            img.style.marginLeft = (-anchor.x) + 'px';
            img.style.marginTop = (-anchor.y) + 'px';
        }

        if (size) {
            img.style.width = size.x + 'px';
            img.style.height = size.y + 'px';
        }
    }
});

L.SVG.include({

    _initPath: function(layer) {
        const path = layer._path = L.SVG.create('path'),
            o = layer.options,
            m = K.in('o', o.mode[K.mode]) ? o.mode[K.mode].o : false,
            cn = 'className',
            c = K.in(cn, m) ? m[cn] : o[cn];

        c && L.DomUtil.addClass(path, c);
        o.interactive && L.DomUtil.addClass(path, 'leaflet-interactive');

        this._updateStyle(layer);
        this._layers[L.stamp(layer)] = layer;
    },

    _updateStyle: function(layer) {
        const path = layer._path,
            o = layer.options,
            m = K.in('o', o.mode[K.mode]) ? o.mode[K.mode].o : false,
            stroke = K.in('stroke', m) ? m.stroke : o.stroke,
            color = K.in('color', m) ? m.color : o.color,
            opacity = K.in('opacity', m) ? m.opacity : o.opacity,
            weight = K.in('weight', m) ? m.weight : o.weight,
            fillColor = K.in('fillColor', m) ? m.fillColor : o.fillColor,
            fillOpacity = K.in('fillOpacity', m) ? m.fillOpacity : o.fillOpacity;

        if (!path) { return; }

        if (stroke) {
            path.setAttribute('stroke', color);
            path.setAttribute('stroke-opacity', opacity);
            path.setAttribute('stroke-width', weight);
            path.setAttribute('stroke-linecap', o.lineCap);
            path.setAttribute('stroke-linejoin', o.lineJoin);

            if (o.dashArray) {
                path.setAttribute('stroke-dasharray', o.dashArray);
            } else {
                path.removeAttribute('stroke-dasharray');
            }

            if (o.dashOffset) {
                path.setAttribute('stroke-dashoffset', o.dashOffset);
            } else {
                path.removeAttribute('stroke-dashoffset');
            }
        } else {
            path.setAttribute('stroke', 'none');
        }

        if (o.fill) {
            path.setAttribute('fill', fillColor || color);
            path.setAttribute('fill-opacity', fillOpacity);
            path.setAttribute('fill-rule', o.fillRule || 'evenodd');
        } else {
            path.setAttribute('fill', 'none');
        }
    }
});

L.SVG.include(!L.Browser.vml ? {} : {

    _initPath: function(layer) {
        const container = layer._container = L.SVG.create('shape'),
            o = layer.options,
            m = K.in('o', o.mode[K.mode]) ? o.mode[K.mode].o : false,
            cn = 'className',
            c = K.in(cn, m) ? m[cn] : o[cn];

        L.DomUtil.addClass(container, 'leaflet-vml-shape ' + (c || ''));

        container.coordsize = '1 1';

        layer._path = L.SVG.create('path');
        container.appendChild(layer._path);

        this._updateStyle(layer);
        this._layers[L.stamp(layer)] = layer;
    },

    _updateStyle: function(layer) {
        var lStroke = layer._stroke,
            lFill = layer._fill;
        const o = layer.options,
            container = layer._container,
            m = K.in('o', o.mode[K.mode]) ? o.mode[K.mode].o : false,
            stroke = K.in('stroke', m) ? m.stroke : o.stroke,
            color = K.in('color', m) ? m.color : o.color,
            opacity = K.in('opacity', m) ? m.opacity : o.opacity,
            weight = K.in('weight', m) ? m.weight : o.weight,
            fill = K.in('fill', m) ? m.fill : o.fill,
            fillColor = K.in('fillColor', m) ? m.fillColor : o.fillColor,
            fillOpacity = K.in('fillOpacity', m) ? m.fillOpacity : o.fillOpacity;

        container.stroked = !!stroke;
        container.filled = !!fill;

        if (stroke) {
            !lStroke && (lStroke = layer._stroke = L.SVG.create('stroke'));

            container.appendChild(lStroke);
            lStroke.weight = weight + 'px';
            lStroke.color = color;
            lStroke.opacity = opacity;

            if (o.dashArray) {
                lStroke.dashStyle = L.Util.isArray(o.dashArray) ?
                    o.dashArray.join(' ') :
                    o.dashArray.replace(/( *, *)/g, ' ');
            } else lStroke.dashStyle = '';

            lStroke.endcap = o.lineCap.replace('butt', 'flat');
            lStroke.joinstyle = o.lineJoin;

        } else if (lStroke) {
            container.removeChild(lStroke);
            layer._stroke = null;
        }

        if (fill) {
            !lFill && (lFill = layer._fill = L.SVG.create('fill'));

            container.appendChild(lFill);
            lFill.color = fillColor || color;
            lFill.opacity = fillOpacity;

        } else if (lFill) {
            container.removeChild(lFill);
            layer._fill = null;
        }
    }
});

L.DivOverlay.include({

    _updateContent: function() {

        if (this instanceof L.Popup && this.options.list && this.options.list.title) {
            this._content = this.convertContent(this.options);
        }

        if (!this._content) {
            return;
        }

        let node = this._contentNode;
        let content = (typeof this._content === 'function') ? this._content(this._source || this) : this._content;

        if (typeof content === 'string') {
            node.innerHTML = content;
        } else {
            while (node.hasChildNodes()) {
                node.removeChild(node.firstChild);
            }
            node.appendChild(content);
        }
        this.fire('contentupdate');
    }
});

L.Popup.include({

    _updateLayout: function() {
        let container = this._contentNode,
            style = container.style;

        // style.width = '';
        // style.whiteSpace = 'nowrap';

        let width = container.offsetWidth,
            height = container.offsetHeight;
        // width = Math.min(width, this.options.maxWidth);
        // width = Math.max(width, this.options.minWidth);

        let words = '',
            el = $(`<div>${this._content}</div>`);
        el.children().each(function() {
            words = ` ${words.trim()} ${$(this).text()} `;
            $(this).remove();
        });
        words = `${words.trim()} ${$(el).text()}`.trim();

        if (words.split(/ /).length > 2) {

            for (let i = width; i > 1; i--) {
                style.width = i + 'px';
                if (container.offsetHeight > height) {
                    style.width = (i + 1) + 'px';
                    break;
                }
            }
        }

        // style.width = (width - 10) + 'px';
        style.whiteSpace = '';

        style.height = '';

        var
            maxHeight = this.options.maxHeight,
            scrolledClass = 'leaflet-popup-scrolled';

        if (maxHeight && height > maxHeight) {
            style.height = maxHeight + 'px';
            L.DomUtil.addClass(container, scrolledClass);
        } else {
            L.DomUtil.removeClass(container, scrolledClass);
        }

        this._containerWidth = this._container.offsetWidth;
    }
});

// Divmap custom button defaults
L.Control.Button = L.Control.extend({

    options: {
        position: 'topleft',
        container: 'map',
        text: '',
        title: 'Save to JSON',
        css: 'save',
        clickFn: createGeoJSON
    },

    onAdd: function(map) {
        let control = 'leaflet-control',
            options = this.options,
            el = control + ' ' + options.container + ' leaflet-bar',
            container = document.getElementsByClassName(el)[0] || L.DomUtil.create('div', el);

        this._button = this._createButton(options.text, options.title,
            control + '-' + options.css, container, this._onClick);

        return container;
    },

    onRemove: function(map) {

    },

    disable: function() {
        this._disabled = true;
        this._updateDisabled();
        return this;
    },

    enable: function() {
        this._disabled = false;
        this._updateDisabled();
        return this;
    },

    _onClick: function(e) {
        if (!this._disabled)
            this.options.clickFn(this);
    },

    _createButton: function(html, title, className, container, fn) {
        let link = L.DomUtil.create('a', className, container);
        link.innerHTML = html;
        link.href = '#';
        link.title = title;

        link.setAttribute('role', 'button');
        link.setAttribute('aria-label', title);

        L.DomEvent
            .on(link, 'mousedown dblclick', L.DomEvent.stopPropagation)
            .on(link, 'click', L.DomEvent.stop)
            .on(link, 'click', fn, this)

        return link;
    },

    _updateDisabled: function() {
        let className = 'leaflet-disabled';

        L.DomUtil.removeClass(this._button, className);

        if (this._disabled) {
            L.DomUtil.addClass(this._button, className);
        }
    }
});

L.control.button = function(options) {
    return new L.Control.Button(options);
};

/*=====  End of LEAFLET INCLUDES  ======*/

// temporary to update to new mode names
if (K.has(Cookies.get('mode'), ['normal', 'Story'])) Cookies.set('mode', 'Story Mode');

Cookies.json = true;

K.extend({ // MARK: K
    lastCheck: false,
    pane: {},
    tool: {},
    expires: { expires: 28 },
    classRemoval: '',

    checkLogin: function(callback) {
        let end = new Date(K.lastCheck || '').getTime(),
            now = new Date().getTime(),
            gap = now - end;

        if (!K.lastCheck || gap > 60000) {
            $.ajax({
                url: 'includes/check_login.php'
            }).done(function(a) {
                a = $.parseJSON(a);
                K.user.name = a.username || false;
                K.user.type = a.usertype || 0;
                K.user.donate = a.donate || 0;

                K.user.data = false;
                K.user.name && K.user.getData();

                if (callback) callback();
                K.lastCheck = new Date();
            });

        } else if (callback) callback();
    },

    complete: {
        layers: [],
        add: function(layer) {
            let add = true;
            $.each(K.complete.layers, function(i, l) {
                if (layer.options.id === l.options.id) add = false;
            });
            add && K.complete.layers.push(layer);

            if (!K.timed.interval) K.timed.action();
        },
        remove: function(id) {
            let index = false;
            for (let i = 0; i < K.complete.layers.length; i++) {
                const v = K.complete.layers[i];
                if (id === v.options.id) {
                    index = i;
                    break;
                }
            }

            if ($.type(index) === 'number') K.complete.layers.splice(index, 1);
        },
        is: function(layer) {
            let uD = K.user.data,
                id = layer.options.id;
            if (!uD && !K.in('complete', localStorage)) K.local('complete', {});
            if (uD) return K.in(id, uD);
            return K.in(id, K.local('complete'));
        },
        time: function(layer) {
            if (!K.complete.is(layer)) return false;
            let uD = K.user.data,
                id = layer.options.id,
                time = uD ? uD[id] : K.local('complete')[id];

            if ($.type(time) === 'string') {
                let end = new Date(time).getTime(),
                    now = new Date().getTime(),
                    gap = end - now,
                    hrs = Math.ceil((gap % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                    min = Math.ceil((gap % (1000 * 60 * 60)) / (1000 * 60));

                if (gap < 0) {
                    K.complete.set(false, layer);
                    time = false;
                } else if (hrs) time = hrs + 'h';
                else if (min) time = min + 'm';

            } else time = false;

            return time;
        },
        toggle: function(layer) {
            return K.complete.set(!layer.complete, layer);
        },
        set: function(done, layer) {

            let uD = K.user.data,
                id = layer.options.id,
                time = layer.options.time;
            if (!uD && !K.in('complete', localStorage)) K.local('complete', {});
            let obj = uD ? uD : K.local('complete');

            if (done) {
                obj[id] = time ? new Date().addHours(time).toString() : true;
                K.complete.add(layer);
            } else {
                delete obj[id];
                K.complete.remove(layer.options.id);
            }

            layer.complete = done;

            !uD && K.local('complete', obj);
            if (uD) {
                if (K.complete.timeout) clearTimeout(K.complete.timeout);
                K.complete.timeout = setTimeout(() => {
                    $.ajax({
                        type: "POST",
                        url: 'includes/write_complete.php',
                        data: {
                            data: JSON.stringify(K.user.data)
                        }
                    }).done(() => {
                        console.log("saved data!", K.user.data);
                    });
                }, 1000);
            }

            return layer.complete;
        },
        timeout: false,
        showHide: function() {

            switchLayerGroups(true);

            let h = K.completeHidden,
                layers = K.complete.layers,
                gC = K.group.mode.groupComplete,
                g, show, hide, i, hidden;

            K.filters = Cookies.get('filters') || {};

            $.each(layers, function(x, layer) {
                hidden = K.filters[layer.options.type];
                g = K.group.mode[hidden ? 'groupHidden' : layer.options.group];
                i = layer._leaflet_id;

                show = (h ? gC : g);
                hide = (h ? g : gC);

                if (hide.getLayer(i)) {
                    show.addLayer(hide.getLayer(i));
                    hide.removeLayer(i);
                }
            });

            switchLayerGroups();
            polyHoverAnimation();
        }
    },

    timed: {
        layers: [],
        interval: false,
        add: function(layer) {
            let add = true;
            $.each(K.timed.layers, function(i, l) {
                if (layer.options.id === l.options.id) add = false;
            });
            add && K.timed.layers.push(layer);
        },
        action: function() {
            K.timed.interval = setInterval(() => {

                if (!K.timed.layers.length) {
                    clearInterval(K.timed.interval);
                    K.timed.interval = false;
                    return;
                }

                $.each(K.timed.layers, function(i, layer) {
                    layer.markComplete();
                });

                K.complete.showHide();

            }, 60000);
        },
        remove: function(id) {
            let index = false;
            for (let i = 0; i < K.timed.layers.length; i++) {
                const v = K.timed.layers[i];
                if (id === v.options.id) {
                    index = i;
                    break;
                }
            }

            if ($.type(index) === 'number') K.timed.layers.splice(index, 1);
        }
    },

    bar: {
        b: {
            save: false,
            group: false,
            grid: false,
            tools: false
        },
        draw: {},
        edit: {}
    },

    check: {
        editing: false,
        deleting: false,
        disabled: false,
        doOnce: true,
        grabbing: false
    },

    drawControl: false,

    group: {
        save: new L.FeatureGroup(),
        draw: new L.FeatureGroup([], {
            makeBoundsAware: false
        }),
        feature: {}
    },

    grid: {
        overlay: L.imageOverlay('images/grid.svg', [
            [-19.05, -19.05],
            [19.05, 19.05]
        ]),
        x: 0,
        y: 0,
        r: 0
    },

    save: {
        unsaved: new L.FeatureGroup(),
        deleted: [],
        add: function(layer) {
            this.unsaved.addLayer(layer);
            this.check();
        },
        remove: function(layer) {
            this.unsaved.removeLayer(layer._leaflet_id);
            this.check();
        },
        delete: function(layer) {
            this.remove(layer);
            this.deleted.push(layer.options.id);
            this.check();
        },
        check: function() {
            if (r = K.length(this.unsaved._layers) + this.deleted.length)
                K.bar.b.save.enable();
            else
                K.bar.b.save.disable();
            return r;
        }
    },

    map: {
        active: Cookies.get('activeMap') || [],
        group: {
            everyLayer: [],
            groupAll: [],
            groupHidden: [],
            groupComplete: [],
            group08: [],
            group09: [],
            group10: [],
            group11: [],
            group12: []
        },
        type: {
            counts: {}
        },
        mode: {},
        property: { // these are used to clear unwanted settings before saving
            polygon: [
                'category', 'color', 'weight', 'opacity', 'fillColor',
                'fill', 'fillOpacity', 'stroke', 'group',
                'type', 'className', 'mode', 'complete'
            ],
            circle: [
                'category', 'color', 'weight', 'opacity', 'fillColor',
                'fill', 'fillOpacity', 'stroke', 'group', 'type',
                'className', 'mode', 'complete'
            ],
            rectangle: [
                'category', 'color', 'weight', 'opacity', 'fillColor',
                'fill', 'fillOpacity', 'stroke', 'group', 'type',
                'className', 'mode', 'complete'
            ],
            polyline: [
                'category', 'color', 'weight', 'opacity', 'stroke',
                'complete', 'group', 'type', 'className', 'mode'
            ],
            marker: [
                'category', 'group', 'type', 'time', 'iconSize', 'html',
                'mode', 'complete', 'link', 'iconUrl', 'className'
            ],
            popup: ['className']
        },
        defaults: { // speaks for itself, these are the defaults when creating a layer
            marker: {
                category: 'default',
                className: 'anim-icon',
                group: 'group08',
                iconSize: [22, 22],
                iconUrl: 'images/marker-poi-contaminated.svg',
                mode: 'all',
                shape: 'marker',
                type: 'Contaminated'
            },
            polygon: {
                category: 'default',
                className: '',
                color: '#c22e2e',
                fill: 1,
                fillColor: '#672f2f',
                fillOpacity: 0.05,
                group: 'group08',
                mode: 'all',
                opacity: 0.4,
                pane: 'overlayPane',
                shape: 'polygon',
                smoothFactor: 1,
                stroke: 1,
                type: 'ContaminatedZone',
                weight: 1
            },
            rectangle: {
                category: 'default',
                className: '',
                color: '#c22e2e',
                fill: 1,
                fillColor: '#672f2f',
                fillOpacity: 0.05,
                group: 'group08',
                mode: 'all',
                opacity: 0.4,
                pane: 'overlayPane',
                shape: 'rectangle',
                smoothFactor: 1,
                stroke: 1,
                type: 'ContaminatedZone',
                weight: 1
            },
            circle: {
                category: 'default',
                className: '',
                color: '#c22e2e',
                fill: 1,
                fillColor: '#672f2f',
                fillOpacity: 0.05,
                group: 'group08',
                mode: 'all',
                opacity: 0.4,
                pane: 'overlayPane',
                shape: 'circle',
                smoothFactor: 1,
                stroke: 1,
                type: 'ContaminatedZone',
                weight: 1
            },
            polyline: {
                category: 'default',
                color: '#207e70',
                group: 'groupAll',
                mode: 'all',
                opacity: 1,
                pane: 'overlayPane',
                shape: 'polyline',
                smoothFactor: 1,
                stroke: 1,
                type: '',
                weight: 5
            }
        },
        zIndex: ['PointOfInterest', 'Hideout', 'Contaminated', 'Landmark', 'CrashSite'],
    },

    // MARK: ^ Settings
    settings: { // these are for the layer tools, so it knows which settings to show
        main: {
            category: {
                values: {},
                description: 'Categories are used to organize the filter menu.',
                for: ['marker', 'polygon', 'polyline', 'circle', 'rectangle'],
                type: 'string'
            },
            type: {
                values: {},
                description: 'Type is used for both the filter menu and to make it easier to change settings in bulk.',
                for: ['marker', 'polygon', 'polyline', 'circle', 'rectangle'],
                type: 'string'
            },
            mode: {
                description: 'Mode is used to suggest what map mode the layers are for.\n\nAs the modes are created they will be added to the list bellow.\n\nWhen more than one mode is selected, most other options will have a new mode switch to allow that option to be changed leaving the original the same.',
                for: ['marker', 'polygon', 'polyline', 'circle', 'rectangle'],
                type: 'object'
            },
            group: {
                values: {},
                description: 'Group is used to set what zoom level of the map the layer will appear on.\nThere are set options from Group08 to Group12 with a GroupAll to never hide the layer.',
                for: ['marker', 'polygon', 'polyline', 'circle', 'rectangle'],
                type: 'string'
            },
            className: {
                values: {},
                description: 'Class Name is the element class added to the layer, this is used for the marker level (overground/underground) and the hover effect.',
                for: ['marker', 'polygon', 'polyline', 'circle', 'rectangle'],
                type: 'string'
            },
            fill: {
                values: {
                    true: { shape: [] },
                    false: { shape: [] }
                },
                description: 'Fill is used to say if a shape has a fill color.',
                for: ['polygon', 'circle', 'rectangle'],
                type: 'boolean'
            },
            fillColor: {
                values: {},
                description: 'Fill Color is used to set the color of the filled shape.',
                for: ['polygon', 'circle', 'rectangle'],
                type: 'string'
            },
            fillOpacity: {
                values: {},
                description: 'Fill Opacity is used to set the opacity of the filled shape.',
                for: ['polygon', 'circle', 'rectangle'],
                type: 'number'
            },
            iconUrl: {
                values: {},
                description: 'Icon URL is to set the URL of the required icon, although you can use external icons, it is recommended to use one from the list bellow.',
                for: ['marker'],
                type: 'string'
            },
            iconSize: {
                values: {},
                description: 'Icon Size is used to set the icon size, it should always be two of the same number, e.g. \'26, 26\'.',
                for: ['marker'],
                type: 'array'
            },
            html: {
                description: 'HTML shouldn\'t be used unless you know what you are doing, this is used to create the layers that show the street names.',
                for: ['marker'],
                type: 'string'
            },
            stroke: {
                values: {
                    true: { shape: [] },
                    false: { shape: [] }
                },
                description: 'Stroke is used to set if the shape has a stroke or not.',
                for: ['polygon', 'circle', 'rectangle'],
                type: 'boolean'
            },
            color: {
                values: {},
                description: 'Color is the stroke color for the shape.',
                for: ['polygon', 'polyline', 'circle', 'rectangle'],
                type: 'string'
            },
            opacity: {
                values: {},
                description: 'Opacity is used to set the opacity of the Stroke.',
                for: ['polygon', 'polyline', 'circle', 'rectangle'],
                type: 'number'
            },
            weight: {
                values: {},
                description: 'Weight is used to set the thickness of the Stroke.',
                for: ['polygon', 'polyline', 'circle', 'rectangle'],
                type: 'number'
            },
            complete: {
                values: {
                    true: { shape: [] },
                    false: { shape: [] }
                },
                description: 'Complete is used to show that a layer can be marked by the user as completed.',
                for: ['marker', 'polygon', 'polyline', 'circle', 'rectangle'],
                type: 'boolean'
            },
            time: {
                values: {},
                description: `Time is used in conjunction with Complete to only set a layer as complete for this length of time. This is helpful for things that can be collected again at a later date. For this to work Complete must be 'True'.`,
                for: ['marker'],
                type: 'number'
            },
            link: {
                description: 'Link is used in conjunction with Complete to also hide the linked layer(s) after the this layer has been completed. The ID of the layers are required to link them. The list should be comma separated.',
                for: ['marker'],
                type: 'array'
            },
            id: {
                description: 'The ID is set automatically and should never be changed. It is used to identify the layer in the data file to update it with changes.',
                for: ['marker', 'polygon', 'polyline', 'circle', 'rectangle'],
                type: 'string'
            },
        },
        popup: {
            className: {
                values: {},
                description: 'Class Name is used to set the color of the title in the Popup and it also sets the popup to be in the top left corner with the poly-hover class.',
                for: ['marker', 'polygon', 'polyline', 'circle', 'rectangle'],
                type: 'string'
            },
            content: {
                description: 'Content can be used for the Popups Content, it is preferred to use the List for this though as that uses less storage space and automatically creates the HTML content for the Popup. Any HTML can be used here.',
                for: ['marker', 'polygon', 'polyline', 'circle', 'rectangle'],
                type: 'string'
            },
            list: {
                description: 'This is an alternative to content, with this it will automatically arrange the content to display correctly in the html tags with images included. Filling this out will remove whatever is in content.',
                for: ['marker', 'polygon', 'polyline', 'circle', 'rectangle'],
                type: 'object'
            },
        }
    },

    mode: Cookies.get('mode') || 'Story Mode',

    msg: {
        note: $('.notification'),
        show: function(options) {

            $.proxy(K.msg._show(options), K.msg);
        },
        _show: function(options) {

            options = $.extend({
                msg: '',
                time: 0,
                dots: false
            }, options);

            let dot = '<div class="dot"></div>';

            if (!this.note.length) {
                $('body').append('<div class="notification"></div>');
                this.note = $('.notification');
            }

            if (!options.msg)
                return;

            this.timeout && clearTimeout(this.timeout);

            this.note.removeClass('dots');
            options.dots && this.note.addClass('dots');
            this.note.html(options.msg + (options.dots ? '<div class="dot-box">' + dot + dot + dot + dot + dot + '</div>' : ''));

            this.note.fadeIn(500);

            if (options.time) this.timeout = setTimeout(this.hide, options.time);
        },
        hide: function() {
            $.proxy(K.msg._hide(), K.msg);
        },
        _hide: function() {
            this.note.fadeOut(500);
            this.timeout = false;
        },
        timeout: false
    },

    myMap: L.map('mapid', {
        center: Cookies.get('pan') || [0, 0],
        zoom: Cookies.get('zoom') || 7,
        minZoom: 7,
        maxZoom: 15,
        maxBounds: [
            [8.3, -14.9],
            [-8.3, 14.9]
        ],
        zoomSnap: 0.25,
        zoomDelta: 0.5,
        wheelPxPerZoomLevel: 100,
        zoomControl: false,
        attributionControl: true
    }),

    popupContent: {
        $rucksack: "<span class='title'>Rucksack</span><p>Could contain...</p><ul><li><img src='images/crate-clothing.svg'><span>Clothing</span><span class='qty'></span></li><li><img src='images/crate-food.svg'><span>Food</span><span class='qty'></span></li><li><img src='images/crate-drink.svg'><span>Drink</span><span class='qty'></span></li></ul>",
        $crateElite: "<span class='title'>Elite Crate</span><p>Contains a combination of...</p><ul><li><img src='images/crate-gear.svg'><span>Gear</span><span class='qty'></span></li><li><img src='images/crate-weapons.svg'><span>Weapon</span><span class='qty'></span></li><li><img src='images/crate-clothing.svg'><span>Clothing</span><span class='qty'></span></li><li><img src='images/crate-medication.svg'><span>Medication</span><span class='qty'></span></li><li><img src='images/crate-medkit.svg'><span>Medkit</span><span class='qty'></span></li><li><img src='images/crate-food.svg'><span>Food</span><span class='qty'></span></li><li><img src='images/crate-drink.svg'><span>Drink</span><span class='qty'></span></li></ul>"
    },

    shortcuts: {
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
    },

    user: {
        name: false,
        type: 0,
        error: false,
        data: false,
        getData: function() {
            if (!K.user.name) return;

            $.ajax({
                url: 'includes/data_exists.php'
            }).done(function(data) {
                K.user.data = {}
                data = $.parseJSON(data);
                if (!data) return;

                $.getJSON(`data/${K.user.name}/complete.json?v=${data}`, function(data) {
                    if (K.local('complete')) {
                        $.extend(data, K.local('complete'));
                        localStorage.removeItem('complete');

                        $.ajax({
                            type: "POST",
                            url: 'includes/write_complete.php',
                            data: {
                                data: JSON.stringify(data)
                            }
                        });
                    }

                    K.user.data = data;
                });
            });
        }
    },

    updateMarker: function(icon) {
        let mark;
        icon = icon || (Cookies.get('copy') && $.type(mark = Cookies.get('copy').marker) == 'object' ? mark : {});

        let o = icon || {},
            url = 'images/marker-poi-contaminated.svg',
            options = {
                iconSize: o.iconSize || [22, 22],
                iconUrl: o.iconUrl || url,
                html: o.html || `<img class='halo' src='images/_a.svg'><img src='${o.iconUrl || url}' class='icon'>`,
                className: o.className || 'anim-icon'
            };

        if (!K.drawIcon) {

            // L.Control.Draw
            let icon = L.Icon.extend({ options: options });

            // Create the drawControl for adding and editing new layers with default settings
            K.drawControl = new L.Control.Draw({
                draw: {
                    marker: {
                        icon: new icon()
                    },
                    // circle: false
                },
                edit: {
                    featureGroup: K.group.draw,
                    selectedPathOptions: {
                        maintainColor: true,
                        moveMarkers: true
                    }
                }
            });

            K.drawIcon = K.drawControl.options.draw.marker.icon;

        } else $.extend(K.drawIcon.options, options);
    },

    svg: {
        dot: `<svg class="bg-dot" viewBox="0 0 64 64"><path class="dot-color" d="M32,3.1C16.039,3.1,3.1,16.039,3.1,32c0,15.961,12.939,28.9,28.9,28.9c15.961,0,28.9-12.939,28.9-28.9 C60.9,16.039,47.961,3.1,32,3.1z M32,48.5c-9.113,0-16.5-7.387-16.5-16.5S22.887,15.5,32,15.5S48.5,22.887,48.5,32 S41.113,48.5,32,48.5z"/></svg>`,
        'black tusk': `<svg class="icon-npc black-tusk" viewBox="0 0 64 64"><path class="st0" d="M32 1.5l-30.5 30.5 30.5 30.5 30.5-30.5-30.5-30.5zm-20.57 30.5l17.94-17.94v18.06l-4.71 4.71 7.34 7.34 7.34-7.34-4.71-4.71v-18.06l17.94 17.94-20.57 20.57-20.57-20.57z"/></svg>`,
        'true sons': `<svg class="icon-npc true-sons" viewBox="0 0 64 64"><path d="M4.5 55.6h34.8l-13.4-33.1h-21.4zm27.1-37.9l3 5.6h24.9v-5.6zm5.3 10l3 5.6h19.6v-5.6zm-10.2-19.3l2.6 5h30.2v-5zm15.5 29.3l3 5.7h14.3v-5.7z"/></svg>`,
        'hyenas': `<svg class="icon-npc hyenas" viewBox="0 0 64 64"><path d="M48 24.1l11.5-4.5-1.4-3.5-7.1 2.9 3.8-7-3.2-1.8-6 11-13.6 5.3-14.2-4.8-5.5-9.6-3.4 1.9 3.4 6-6.6-2.3-1.2 3.5 10.6 3.6 4 6.9-11.7 4.6 1.4 3.5 12.1-4.9 10.8 19 10.9-19.9 12 4 1.1-3.5-11.3-3.8 3.7-6.7zm-5.4 2.2l-1.8 3.3-3.5-1.2 5.3-2.1zm-22.1.3l6 2-4 1.7-2-3.7zm11.2 19.6l-7.3-12.7 7.6-3 7 2.4-7.3 13.3z"/></svg>`,
        'outcasts': `<svg class="icon-npc outcasts" viewBox="0 0 64 64"><path d="M59.109 18.941a.986.986 0 0 0-.114-.296c-.262-.441-.821-.592-1.248-.338a.898.898 0 0 0-.427.864c.53 4.26-1.419 8.621-5.331 10.947-5.279 3.139-12.115 1.385-15.267-3.917-3.152-5.302-1.428-12.145 3.85-15.284 3.912-2.326 8.675-1.955 12.163.546.284.192.657.22.963.037.428-.254.562-.817.299-1.258a1 1 0 0 0-.205-.242c-4.76-4.16-11.48-5.174-16.808-2.007a13.165 13.165 0 0 0-4.37 4.242 1.186 1.186 0 0 1-1.967.07 13.16 13.16 0 0 0-4.489-3.817c-5.503-2.851-12.153-1.444-16.661 2.987a.982.982 0 0 0-.19.253c-.235.455-.07 1.01.372 1.238a.895.895 0 0 0 .959-.094c3.337-2.701 8.069-3.349 12.111-1.256 5.454 2.825 7.575 9.556 4.738 15.033s-9.559 7.629-15.013 4.804c-4.041-2.094-6.242-6.333-5.962-10.617a.893.893 0 0 0-.477-.837c-.441-.229-.99-.044-1.227.411a.999.999 0 0 0-.097.301c-1.018 6.238 1.67 12.481 7.174 15.332a13.108 13.108 0 0 0 4.183 1.337 1.17 1.17 0 0 1 .921 1.587 13.862 13.862 0 0 0-.934 4.999c0 6.394 4.306 11.819 10.315 13.847a.93.93 0 0 0 .718-1.708c-3.933-1.776-6.685-5.803-6.685-10.499 0-3.951 1.945-7.435 4.903-9.499v8.551a1.443 1.443 0 0 0 2.884 0v-9.989a10.9 10.9 0 0 1 1.83-.415v11.189a1.647 1.647 0 1 0 3.294 0v-11.161c.629.101 1.241.252 1.83.456v9.272a1.442 1.442 0 1 0 2.884 0v-7.76c2.849 2.08 4.714 5.489 4.714 9.353 0 4.696-2.752 8.724-6.685 10.499a.93.93 0 1 0 .718 1.708c6.007-2.028 10.315-7.454 10.315-13.847 0-2.053-.452-4.003-1.256-5.777a1.185 1.185 0 0 1 1.016-1.691 13.214 13.214 0 0 0 5.998-1.83c5.323-3.166 7.642-9.555 6.261-15.724zm-25.193 12.743h-4.196a1.048 1.048 0 0 1-.911-1.564l2.098-3.705a1.048 1.048 0 0 1 1.823 0l2.098 3.705a1.048 1.048 0 0 1-.912 1.564zM12.618 29.146l4.804-5.045 4.58 4.434 2.291-2.366-4.6-4.453 4.904-5.15-2.384-2.273-4.886 5.131-4.756-4.606-2.291 2.366 4.776 4.626-4.822 5.063zm38.473-15.853l-4.887 5.131-4.756-4.606-2.291 2.366 4.776 4.625-4.822 5.064 2.384 2.272 4.805-5.045 4.58 4.435 2.291-2.366-4.6-4.454 4.904-5.149z"/></svg>`,
        
    },

    stripClasses: function(value) {
        let classes = classesToArray(K.classRemoval),
            cur, curValue, clazz, j, finalValue,
            className = value;

        if (classes.length) {
            curValue = className || '';
            cur = ` ${stripAndCollapse(curValue)} `;

            if (cur) {
                j = 0;
                while ((clazz = classes[j++])) {

                    // Remove *all* instances
                    while (cur.indexOf(` ${clazz} `) > -1) {
                        cur = cur.replace(` ${clazz} `, " ");
                    }
                }

                finalValue = stripAndCollapse(cur);
            }
        }

        return finalValue;
    },

    // this changes values in arrays to strings and ignores functions
    valuesToString(obj) {

        if (K.has($.type(obj), ['object', 'array'])) {
            $.each(obj, function(i, v) {
                if ($.type(v) == 'function') return;
                obj[i] = K.has($.type(v), ['object', 'array']) ? K.valuesToString(v) : v.toString();
            });
        } else return obj.toString();

        return obj;
    },

    data: {
        types: {}
    },

    settingShape: shape => K.has(shape, ['polyline', 'rectangle']) ? 'polygon' : shape,

    getSetting: (obj, setting) => {
        const m = K.in('mode', obj) && K.in('o', obj.mode[K.mode]) ? obj.mode[K.mode].o : false;
        return m && K.in(setting, m) ? m[setting] : obj[setting];
    }
});

K.modes.create();
$.each(K.group.feature, function(i, m) {
    $.each(K.map.group, function(g, a) {
        m[g] = new L.FeatureGroup();
    });
});

K.myMap.createPane('messagePane', L.DomUtil.get('message'));
K.myMap.createPane('mapPane');
K.myMap.createPane('zonePane');
K.group.mode = K.group.feature[K.mode];

/*====================================
=            MARKER TOOLS            =
====================================*/
K.tool.marker = { // MARK: Marker Tools
    full: false,
    layers: {},

    fill: function() {
        let _this = K.tool.marker;
        !_this.full && $.each(K.modes.get, function(i, mode) {
            _this.layers[mode] = {};
        });
        _this.full = true;
    },

    enabled: function() {
        return !!$('#marker-tools').length;
    },

    show: function() {

        let skip = $.type(arguments[0]) == 'boolean' ? arguments[0] : false;
        K.tool.marker._show.call(K.tool.marker, skip);
    },

    _show: function(skip) {
        if (this.enabled()) {
            if (skip) return;

            $('#marker-tools').remove();
            return;
        }

        $('body').append('<div id="marker-tools"></div>');
        tools = $('#marker-tools');
        tools.append(
            '<div class="outer inputs">\
			<div>\
			<input id="_1" type="radio" name="radio" value="" checked><label for="_1">Z - Ground</label></br>\
			<input id="_2" type="radio" name="radio" value="underground"><label for="_2">X - Subway</label></br>\
			<input id="_3" type="radio" name="radio" value="overground"><label for="_3">C - Roof</label></br>\
			</div>\
			</div>\
			<div class="outer icons"></div>'
        );

        tools.draggable({
            containment: '#mapid',
            start: function() {
                $(this).css({
                    transform: 'translateX(0)',
                    bottom: 'initial'
                });
            },
            stop: function() {
                this.position = $.extend({}, $(this).position(), {
                    transform: 'translateX(0)',
                    bottom: 'initial',
                    width: $(this).width(),
                    height: $(this).height()
                });
                Cookies.set('toolPos', this.position, K.expires);
            }
        }).resizable({
            containment: '#mapid',
            minHeight: 92,
            minWidth: 250,
            resize: function() {
                iconSize.call($('.outer.icons'));
            },
            stop: function() {
                this.position = $.extend({}, $(this).position(), {
                    transform: 'translateX(0)',
                    bottom: 'initial',
                    width: $(this).width(),
                    height: $(this).height()
                });
                Cookies.set('toolPos', this.position, K.expires);
            }
        });

        this.position = Cookies.get('toolPos') || false;

        if (this.position) tools.css(this.position);

        let iconSize = function() {
            let n = $('a', this).length,
                a = $(this).width(),
                b = $(this).height(),
                i, x, y, m, k, o, oX, oY, w, oK, oM;

            for (i = 1; i < n + 1; i++) {
                m = Math.round(i);
                k = Math.ceil(n / i);
                x = (a / m);
                y = (b / k);
                if (Math.abs(x - y) > o)
                    break;
                oX = x;
                oY = y;
                oK = k;
                oM = m;
                o = Math.abs(x - y)
            }
            w = (Math.min(oX, oY) - 16);
            $('a', this).width(w).height(w);

            $('div.spacer').remove();
            for (i = 0; i < (oK * oM) - n; i++) {
                $('<div class="spacer" />').width(w + 16).height(0).appendTo(this);
            }
        }

        $('input[name="radio"]').on('change', function() {
            $('a', tools).removeClass('underground overground').addClass($(this).val());
        });

        $.each(sortObjByKeys(this.layers[K.mode]), function(category, layers) {

            $.each(sortObjByKeys(layers), function(i, layer) {
                let p = layer.o,
                    active = (p.type == (Cookies.get('markerToolIcon') || 'Contaminated') ? 'enabled' : ''),
                    key = false;

                $.each(K.shortcuts.QuickMarker, function(k, t) {

                    if (p.type == t && p.type != 'Underground') {
                        key = k;
                        return;
                    }
                });

                if (K.mode in p.mode) {
                    $('<a />', {
                        class: active,
                        title: category + '<br>' + p.type.replace('Survival', '').space(),
                        category: category,
                        type: p.type,
                        html: `<img src="${p.iconUrl}">${key ? '<span class="key">' + key + '</span>' : ''}`
                    }).data('properties', p).appendTo('.outer.icons');
                }
            });
        });

        $('#marker-tools a').on('click', function() {
            let typ = $(this).attr('type');

            $(this).siblings('a').removeClass('enabled');
            $(this).addClass('enabled');
            Cookies.set('markerToolIcon', typ, K.expires);

            let o = $(this).data('properties');
            K.updateMarker($.extend(true, {}, o, {
                className: o.className.add($('.outer.inputs input:checked').val())
            }));

            K.bar.draw.Marker.enable();
        });

        iconSize.call($('.outer.icons'));

        $(window).off('resize')
            .on('resize', function() {
                iconSize.call($('.outer.icons'));
            });

        $('.outer.icons [title!=""]').qtip({
            position: {
                viewport: $('#mapid'),
                my: 'top center',
                at: 'bottom center'
            },
            style: {
                classes: 'tooltip-style'
            },
            show: {
                delay: 250,
                solo: true
            },
            hide: {
                event: 'click mouseleave'
            }
        });
    }
}; /*=====  End of MARKER TOOLS  ======*/

/*===================================
=           LAYER TOOLS            =
===================================*/
K.tool.layer = { // MARK: Layer Tools

    // Settings to use through all functions
    group: '',
    icon: {},
    id: 0,
    join: false,
    layer: {},
    new: {},
    pop: {},
    shape: '',

    // Check if the menu is already open
    isOpen: function() {
        return !!$('#settings-menu').length;
    },

    // Open the menu
    show: function() {
        K.tool.layer._show.call(K.tool.layer, this);
    },

    _show: function(layer) {
        console.log(`Editing layer with ID: ${layer.options.id}`, layer);
        // K.settingShape(layer.options.shape)

        let _this = this;

        // if (layer.options.link) console.log(layer.getLinked());

        // Cancel if we are in editing or deleting modes
        if (K.check.deleting || K.check.editing || !K.bar.b.power.enabled())
            return this;

        if (!this.tags) {
            this.tags = [];

            let layers = {};
            $.each(K.tool.marker.layers, function(i, mode) {
                $.extend(layers, mode);
            });
            layers = sortObjByKeys(layers);
            $.each(layers, function(v, i) {
                _this.tags.push(v.space());
            });
        }

        // console.log(layer);

        this._hide();

        this.layer = layer;
        this.shape = layer.options.shape;
        this.id = layer._leaflet_id;

        // Add the settings if they don't already exist
        if (!K.in('saved', layer.editing)) layer.editing.saved = true;

        this.group = layer.options.group;
        this.pop = layer.getPopup();

        layer.makeBackup();

        // Used to make holes in polys
        if (this.join) {

            this.join._latlngs.push(layer._latlngs[0]);

            this.new = L.polygon(this.join._latlngs, $.extend({}, this.join.options, {
                pane: (this.join.options.className == 'poly-hover' ? 'zonePane' : 'overlayPane'),
            }));

            this.pop = this.join._popup;

            // Add a new popup if it has one
            if (this.pop._content || this.pop.list.title)
                this.new.bindPopup(this.pop);

            removeLayer(this.join);
            removeLayer(layer, this.group, true);
            K.group.mode[this.new.options.group].addLayer(this.new);

            this.new.on('click', K.tool.layer.show);
            this.new.options.complete && this.new.options.shape === 'marker' && this.new.on('contextmenu', function() {
                this.toggleCompleted(true);
            });

            this.new.saved(false);
            this.join = false;
            K.msg.hide();

            return this;
        }

        // Outline the layer that is being edited
        $(layer[layer.options.shape != 'marker' ? '_path' : '_icon']).addClass('leaflet-layer-editing');

        // Create the menu
        $('body').append('<div id="settings-menu" class="settings-divider"><div class="settings-side left"></div><div class="settings-side right"></div></div>');

        $('#settings-menu').on('remove', function() {
            $('.leaflet-layer-editing').removeClass('leaflet-layer-editing');
        }).draggable({
            containment: '#mapid',
            start: function() {
                $(this).css({
                    transform: 'translate(0, 0)'
                });
            },
            stop: function() {
                this.position = $.extend({}, $(this).position(), {
                    transform: 'translate(0, 0)'
                });
                Cookies.set('menuPos', this.position, K.expires);
            }
        });

        this.position = Cookies.get('menuPos') || false;

        if (this.position) {
            let w = $(window).width() - 300,
                h = $(window).height() - 515;
            this.position.left = w < this.position.left ? w : this.position.left;
            this.position.top = h < this.position.top ? h : this.position.top;
            $('#settings-menu').css(this.position);
        }

        $('.settings-side.left').append(
            `<div class="settings-tools marker">
			    <span class="settings-title">${layer.options.shape.toUpperCase()}</span>
			</div>
			<div class="settings-tools popup">
			    <span class="settings-title">POPUP</span>
			</div>
			<div class="settings-tools buttons"></div>
			<div class="settings-tools save">
                <a class="settings-save button" aria-label="save">CONFIRM</a>
                <a class="settings-cancel button" aria-label="cancel">CANCEL</a>
			</div>
			<div class="creator">${layer.options.creator}</div>
            <div class="unsaved" ${layer.editing.saved ? 'style="display: none"' : ''}>Save me!</div>`
        );

        let btn = $('<a class="settings icon button" />'),
            box = '.settings-tools.buttons',
            btns = [{
                cls: 'copy',
                title: 'Copy these settings'
            }, {
                cls: 'paste',
                title: 'Paste copied settings',
                type: ['polygon', 'polyline', 'circle']
            }, {
                cls: 'edit' + (layer.editing.edit ? ' end' : ''),
                title: 'Add this to editable layer'
            }, {
                cls: 'move' + (layer.dragging.enabled() ? ' end' : ''),
                title: 'Drag this layer'
            }, {
                cls: 'join',
                title: 'Make another polygon a hole in this',
                type: ['polygon']
            }, {
                cls: 'split',
                title: 'Split these polygons',
                type: ['polygon']
            }, {
                cls: 'dupe',
                title: 'Duplicate this poly',
                type: ['polygon']
            }, {
                cls: 'delete',
                title: 'Delete this layer'
            }, {
                cls: 'to-type',
                title: 'Copy selected setting to all of Type'
            }];

        for (i in btns) {
            b = btns[i];
            if (b.cls && (!b.type || K.has(this.shape, b.type))) {
                btn.clone().attr({
                    'aria-label': b.cls,
                    title: b.title
                }).addClass(b.cls).appendTo(box);
            }
        }

        this.updateSaved();

        // Fill the menu with settings
        let shape = this.shape;
        $.each(K.settings.main, function(i, n) {
            if (!K.has(shape, n.for)) return;
            $('<a />', {
                class: 'dnt settings-item button ' + i,
                'aria-label': i,
                html: i.firstToUpper().space()
            }).appendTo('.settings-tools.marker');
        });

        // Fill the popup menu with settings
        $.each(K.settings.popup, function(i, n) {
            $('<a />', {
                class: 'dnt settings-item button ' + i,
                'aria-label': 'popup-' + i,
                html: i.firstToUpper().space()
            }).appendTo('.settings-tools.popup');
        });

        // Apply the button click functions
        $('.settings-item')
            .on('click', this._settingClick);
        // .on('mouseover', this._settingOver)
        // .on('mouseleave', this._settingLeave);
        $('.settings-save').on('click', function() {
            _this._save.call(_this);
        });
        $('.settings-cancel').on('click', function() {
            _this._cancel.call(_this);
        });
        $('.settings.copy').on('click', function() {
            _this._copy.call(_this);
        });
        $('.settings.paste').on('click', function() {
            _this._paste.call(_this);
        }).on('mouseover', function() {
            _this._pasteOver.call(_this, layer);
        }).on('mouseout', function() {
            _this._pasteOut.call(_this, layer);
        });
        $('.settings.delete').on('click', function() {
            _this._delete.call(_this);
        });
        $('.settings.dupe').on('click', function() {
            _this._dupe.call(_this);
        });
        $('.settings.join').on('click', function() {
            _this._join.call(_this);
        });
        $('.settings.to-type').on('click', function() {
            _this._toType.call(_this);
        });
        $('.settings.move').on('click', this._move);
        $('.settings.edit').on('click', this._edit);

        if (K.in('_latlngs', layer) && layer._latlngs.length == 1)
            $('.settings.split').hide();
        else {
            $('.settings.split').on('click', function() {
                _this._split.call(_this);
            });
        }

        if (layer.editing.window)
            $(`[aria-label="${layer.editing.window}"]`).trigger('mousedown');

        $('.settings.icon[title!=""]').qtip({
            position: {
                viewport: $('#mapid'),
                my: 'bottom left',
                at: 'top center'
            },
            style: {
                classes: 'tooltip-style'
            },
            show: {
                delay: 250,
                solo: true
            },
            hide: {
                event: 'click mouseleave'
            }
        });

        // Disable the drag and scroll events on the settings menus
        let div = L.DomUtil.get('settings-menu');
        L.DomEvent.disableClickPropagation(div);
        L.DomEvent.on(div, 'mousewheel', L.DomEvent.stopPropagation);

        return this;
    },

    /* 
     * Left side setting click
     * Populate the right menu
     */
    _settingClick: function(e, modeSwitch) { // MARK: ^ Setting Click

        let _t = this,
            fn = K.tool.layer,
            layer = fn.layer,
            setting = $(this).attr('aria-label'),
            isPopup = setting.bMatch('popup-'),
            object = isPopup ? K.settings.popup : K.settings.main,
            values = [],
            box, toggle, input;

        layer.editing.window = setting;
        setting = setting.replace('popup-', '');

        if (K.in('values', object[setting])) {
            // get and sort settings 
            values = sortObjByKeys(object[setting].values);
        }

        let value = layer.options[setting];
        isPopup && (value = layer.popup[setting]);

        // Fill the right menu with the title and apply button
        $('.settings-side.right').html(
            `<div class="settings-tools right-bar" aria-label="' + setting + '">
			    <span class="settings-title">${isPopup ? 'POPUP ' : ''}${setting.space().toUpperCase()}</span>
            </div>`
        );

        if (!K.has(setting, ['id'])) {

            $('.right .settings-title').after(`<a class="settings icon copy inline" title="Copy this setting" 
                setting="' + setting + '" which="${isPopup ? 'popup' : 'icon'}"></a>`);
            $('.right .settings-title').after(`<a class="settings icon paste inline" title="Paste this setting" 
                setting="' + setting + '" which="${isPopup ? 'popup' : 'icon'}"></a>`);

            $('.settings.copy.inline').on('click', fn._copySingle);
            $('.settings.paste.inline').on('click', fn._pasteSingle);
        }

        let bx = $('.settings-tools.right-bar');

        // add the mode switch
        if (K.length(layer.options.mode) > 1 && !K.has(setting, ['mode', 'id', 'category', 'type', 'complete', 'time', 'link', 'group'])) {

            const mode = layer.getMode(isPopup);

            let changes = false;
            K.in(setting, mode) && (changes = true);
            changes && (value = layer.getModeSetting(setting, isPopup));

            const mC = $('<div />', {
                    class: 'mode-container edit'
                }),
                desc = $('<span />', {
                    class: 'name',
                    html: 'Modify for mode:'
                }),
                msgs = [
                    'This will modify this setting for the original layer, no changes will be made to any modified modes.',
                    `This will modify this setting for ${K.mode} only, no changes will be made to the original layer.\nSwitching this with changes already made will delete any changes for ${K.mode}.`
                ],
                help = $('<span />', {
                    class: 'help',
                    html: msgs[+changes]
                });

            toggle = $(`<label class="switch">
                <span class="label"></span>
                <span class="back"></span>
                <input type="checkbox" class="settings-item mode-switch check">
                <span class="slider"></span>
            </label>`);

            bx.append(mC.append(desc).append(toggle).append(help));

            $('input', toggle).prop('checked', changes).on('change', function() {
                changes = $(this).is(':checked');
                help.text(msgs[+changes]);

                if (!changes) {
                    K.in(setting, mode) && delete mode[setting];
                    K.tool.layer._settingClick.call(_t, true);
                    apply();
                }
            });
        }

        // add the description of the setting
        object[setting].description && bx.append(`<span class="help">${object[setting].description}</span>`);

        if (setting === 'list') {

            if ($.type(value) != 'object') {
                fn.pop.options[setting] = {};
                value = {};
            }

            $('.settings-tools.right-bar').append(
                `<div class="scroll-box">
				    <div class="section title">
                        <span class="header">TITLE</span><br>
                        <input type="text" class="settings-item input list" name="list-title" role="input" value="${value.title ? value.title : ''}" setting="list-title" which="popup" placeholder="Title">
                    </div>
                    <div class="section subs">
                        <a class="add subs button" title="Add another paragraph">+</a>
                        <span class="header">PARAGRAPH</span>
                        <br>
                    </div>
                    <div class="section list">
                        <a class="add list button" title="Add another item">+</a>
                        <span class="header">LIST</span>
                        <br>
                    </div>
				</div>`
            );

            if (!value.subs) value.subs = [{
                value: '',
                color: false,
                note: false,
                line: false
            }];

            box = $('<div />', {
                class: 'setting-container'
            });

            input = $('<input />', {
                type: 'text',
                class: 'settings-item input list',
                which: 'popup'
            });

            toggle = $(`<label class="switch">
                    <span class="label"></span>
                    <span class="back"></span>
                    <input type="checkbox" class="settings-item input list check">
                    <span class="slider"></span>
                </label>`);

            $.each(value.subs, function(i, itm) {

                let bx = box.clone().appendTo('.section.subs'),
                    tg;

                let inpt = input.clone().attr({
                    name: 'list-sub',
                    value: itm.value,
                    num: i,
                    placeholder: 'Paragraph'
                }).appendTo(bx);

                if (itm.color) inpt.addClass('gray');

                $('<br>').appendTo(bx);

                // color button
                tg = toggle.clone().appendTo(bx);
                tg.find('input').attr({
                    name: 'list-sub-class',
                    cat: 'color',
                    num: i
                }).prop('checked', itm.color);
                tg.find('.label').text('Color:');

                // underline button
                tg = toggle.clone().appendTo(bx);
                tg.find('input').attr({
                    name: 'list-sub-class',
                    cat: 'line',
                    num: i
                }).prop('checked', itm.line);
                tg.find('.label').text('Line:');
                tg.find('.slider').addClass('note');

                // note button
                tg = toggle.clone().appendTo(bx);
                tg.find('input').attr({
                    name: 'list-sub-class',
                    cat: 'note',
                    num: i
                }).prop('checked', itm.note);
                tg.find('.label').text('Note:');
                tg.find('.slider').addClass('note');

                $('<br>').appendTo('.section.subs');
            });

            if (!value.list) value.list = [{
                item: '',
                qty: ''
            }];

            $.each(value.list, function(i, itm) {

                input.clone().attr({
                    name: 'list-item',
                    value: itm.item,
                    num: i,
                    placeholder: 'Item'
                }).autocomplete({
                    source: fn.tags,
                    autoFocus: true,
                    appendTo: '#settings-menu'
                }).appendTo('.section.list');

                input.clone().attr({
                    type: 'number',
                    min: 1,
                    name: 'list-qty',
                    value: itm.qty || 1,
                    num: i,
                    placeholder: 'Qty'
                }).appendTo('.section.list');

                $('<br>').appendTo('.section.list');
            });

            $('a.add').on('click', function() {
                let focus = false,
                    name, i, tg;

                if ($(this).hasClass('subs')) {

                    name = 'input[name="list-sub"]';
                    i = $(name).length;

                    let bx = box.clone().appendTo('.section.subs');

                    input.clone().attr({
                        name: 'list-sub',
                        setting: 'list-sub',
                        num: i,
                        placeholder: 'Paragraph'
                    }).appendTo(bx);

                    $('<br>').appendTo(bx);

                    // color button
                    tg = toggle.clone().appendTo(bx);
                    tg.find('input').attr({
                        name: 'list-sub-class',
                        cat: 'color',
                        num: i
                    });
                    tg.find('.label').text('Color:');

                    // line button
                    tg = toggle.clone().appendTo(bx);
                    tg.find('input').attr({
                        name: 'list-sub-class',
                        cat: 'line',
                        num: i
                    });
                    tg.find('.label').text('Line:');
                    tg.find('.slider').addClass('note');

                    // note button
                    tg = toggle.clone().appendTo(bx);
                    tg.find('input').attr({
                        name: 'list-sub-class',
                        cat: 'note',
                        num: i
                    });
                    tg.find('.label').text('Note:');
                    tg.find('.slider').addClass('note');

                    $('<br>').appendTo('.section.subs');

                } else {

                    name = 'input[name="list-item"]';
                    i = $(name).length;

                    input.clone().attr({
                        name: 'list-item',
                        setting: 'list-item',
                        num: i,
                        placeholder: 'Item'
                    }).autocomplete({
                        source: fn.tags,
                        autoFocus: true,
                        appendTo: '#settings-menu'
                    }).appendTo('.section.list');

                    input.clone().attr({
                        type: 'number',
                        min: 1,
                        name: 'list-qty',
                        setting: 'list-qty',
                        num: i,
                        placeholder: 'Qty'
                    }).appendTo('.section.list');

                    $('<br>').appendTo('.section.list');

                }

                $(name).each(function(i, el) {
                    if (!$(el).val() && !focus) {
                        $(el).focus();
                        focus = true;
                    }
                });

                inputRenew();
            });

        } else if (setting === 'link') {

            $('.settings-tools.right-bar').append(
                `<div class="scroll-box">
                    <div class="section links">
                        <a class="add links button" title="Add another paragraph">+</a>
                        <span class="header">LINKED IDS</span><br>
                    </div>
				</div>`
            );

            if (!value) value = [''];

            box = $('<div />', {
                class: 'setting-container links'
            });

            input = $('<input />', {
                name: 'list-link',
                type: 'text',
                class: 'settings-item input link',
                placeholder: 'Layer ID'
            });

            let grab = $('<a />', {
                class: 'settings-item link grab'
            });

            let trash = $('<a />', {
                class: 'settings-item link trash'
            });

            $.each(value, function(i, v) {
                let bx = box.clone().appendTo('.section.links');

                input.clone().attr({
                    value: v,
                    num: i
                }).appendTo(bx);

                // grab button
                grab.clone().attr({
                    num: i
                }).appendTo(bx);

                // trash button
                trash.clone().attr({
                    num: i
                }).appendTo(bx);
            });

            $('a.add').on('click', function() {
                let focus = false,
                    name = 'input[name="list-link"]',
                    i = $(name).length;

                let bx = box.clone().appendTo('.section.links');

                input.clone().attr({
                    num: i
                }).appendTo(bx);

                // grab button
                grab.clone().attr({
                    num: i
                }).appendTo(bx);

                // trash button
                trash.clone().attr({
                    num: i
                }).appendTo(bx);

                $(name).each(function(i, el) {
                    if (!$(el).val() && !focus) {
                        $(el).focus();
                        focus = true;
                    }
                });

                inputRenew();
            });

            $('.section.links').on('click', '.trash', function() {
                $(`.section.links [num=${$(this).attr('num')}]`).parent().remove();
                $('.setting-container').each(function(i) {
                    $('[num]', this).attr('num', i);
                });

                apply.call(this);
            });

            $('.section.links').on('click', '.grab', function() {

                K.check.grabbing = true;
                let i = $(this).attr('num'),
                    layers = K.group.feature[K.mode].everyLayer,
                    _this = this;

                layers.eachLayer(function(l) {

                    // change the click to get the layers id
                    l.off('click');
                    l.on('click', function() {

                        $(`.section.links .input[num=${i}]`).val(this.options.id);
                        apply.call(_this);
                        K.check.grabbing = false;

                        layers.eachLayer(function(l) {
                            // put the layer tools back on the layer
                            l.off('click');
                            K.user.type && (K.user.type >= 4 || l.options.creator.toLowerCase() == K.user.name.toLowerCase()) &&
                                l.on('click', K.tool.layer.show);
                        });

                    });

                    K.msg.show({
                        msg: 'Select the layer you would like to link to this.',
                        time: 2000
                    });
                });
            });

        } else if (setting === 'mode') {

            const mC = $('<div />', {
                class: 'mode-container'
            });

            const desc = $('<span />', {
                class: 'name'
            });

            toggle = $(`<label class="switch">
                <span class="label"></span>
                <span class="back"></span>
                <input type="checkbox" class="settings-item input mode check">
                <span class="slider"></span>
            </label>`);

            $.each(K.modes.get, function(i, mode) {
                const cont = mC.clone().appendTo(bx);
                desc.clone().text(mode).appendTo(cont);
                const tg = toggle.clone().appendTo(cont);
                $('input', tg).prop('checked', K.has(mode, layer.options.mode)).attr('mode', mode);
            });

        } else if (K.length(values)) {
            // If presets exist, fill the menu with them

            if (setting === 'className' && !isPopup)
                value = K.stripClasses(value);

            // Append the input
            bx.append(`<input type="text" class="settings-item input ${setting}" name="${setting}" 
                role="input" value="${value ? value : ''}" setting="${setting}" which="${isPopup ? 'popup' : 'icon'}">`);

            let img, col, num = 1,
                retHtml = '<div class="scroll-box">',
                colors = [];

            $.each(values, function(i, z) {

                if (setting == 'type' && !K.has(K.settingShape(layer.options.shape), z.shape)) return;

                img = ($.type(i) == 'string' ? i.contains('.svg') : false);
                col = ($.type(i) == 'string' ? i.contains('#') : false);

                if (col) {
                    colors.push(i);
                    return true;
                }

                let fst = '<div class="settings-icons">',
                    lst = '</div>',
                    trd = lst + fst;

                retHtml += `${img && num == 1 ? fst : ''}
                    <a class="settings-item button selector${col ? ' color' : (img ? ' icon' : '')}" aria-label="${i}" role="button"
                        ${value == i ? ` style="background-color: #2f474e; ${(col ? ` color: ${i};` : '')}"` : (col ? ` style="color: ${i};"` : '')}>
                        ${img ? `<img src="${i}" height="30" width="30">` : i} 
                    </a>
                    ${img && num == values.length ? lst : (img && num % 3 == 0 ? trd : '')}`;
                num++;
            });

            retHtml = $(retHtml + '</div>');
            if (img) retHtml.addClass('has-icons');

            bx.append(retHtml);

            $.unique(colors);
            colors.sort();

            col && new Huebee($('.settings-item.input')[0], {
                notation: 'hex',
                hues: 16,
                shades: 8,
                saturations: 5,
                customColors: colors,
                staticOpen: true
            }).on('change', function() {
                $('.settings-item.input').trigger('click');
            });

        } else {
            bx.append(`<textarea type="text" rows=2 cols=20 wrap="hard" class="settings-item input ${setting}" name="${setting}" setting="${setting}" which="${isPopup ? 'popup' : 'icon'}"${setting == 'id' ? ' readonly' : ''}>${value ? value : ''}</textarea>`);
        }

        const apply = function() {

            const $input = $('.settings-item.input'),
                $mode = $('.mode-switch'),
                o = {
                    setting: $input.attr('setting'),
                    value: $input.val(),
                    forMode: $mode.length && $mode.is(':checked')
                };

            if ($(this).hasClass('list')) {

                o.setting = 'list';
                o.value = {};

                o.value.title = $('.input[name="list-title"]').val();
                o.value.subs = [];

                $('.input[name="list-sub"]').each(function() {

                    let t = $(this).val();
                    if (!t) return true;
                    let p = $(this).parent(),
                        c = p.find('[cat=color]').is(':checked'),
                        l = p.find('[cat=line]').is(':checked'),
                        n = p.find('[cat=note]').is(':checked');

                    let r = { value: t };
                    c && (r.color = c);
                    l && (r.line = l);
                    n && (r.note = n);

                    o.value.subs.push(r);
                });

                o.value.list = [];

                $('.input[name="list-item"]').each(function() {

                    let no = $(this).attr('num'),
                        t = $(this).val();

                    if (!t) return true

                    o.value.list.push({
                        item: t,
                        qty: $(`.input[name="list-qty"][num="${no}"]`).val() || 1
                    });
                });

                removeEmpty(o.value);

            } else if ($(this).hasClass('link')) {

                o.setting = 'link';
                o.value = [];

                $('[name=list-link]').each(function(i, el) {
                    let v = $(this).val();
                    if (v) o.value.push(v);
                });

                removeEmpty(o.value);

            } else if ($(this).hasClass('mode')) {

                o.setting = 'mode';
                o.value = layer.backup.options.mode || layer.options.mode || {};

                $('input', bx).each(function() {
                    const mode = $(this).attr('mode');
                    if (!$(this).is(':checked')) delete o.value[mode];
                    else if (!(mode in o.value)) o.value[mode] = {};
                });

            } else if (o.setting == 'className' && !isPopup) {

                let color = K.in('popup', layer) && K.in('className', layer.popup) ? layer.popup.className : '';
                o.value += ` ${layer.options.group} ${color}`;
            }

            isPopup && layer.updatePopup(o);
            !isPopup && layer.applySetting(o);
        };

        // Menu buttons event
        $('.settings-item.selector').on('click', function() {

            let $input = $('.settings-item.input');

            if ($(this).hasClass('color')) {

                let hex = $(this).attr('aria-label');
                $input.css({
                    'background-color': hex,
                    color: textColor(hex)
                });
            }

            $('.settings-side.right a:not(.settings-apply)').css('background-color', '#24373d');
            $(this).css('background-color', '#2f474e');

            $input.val($(this).attr('aria-label'));
            apply.call(this);
        });

        const inputRenew = function() {
            // Apply button event
            $('.input').each(function() {
                if (!!$(this).prop('readonly')) return;

                let el = $(this),
                    binds = {
                        text: 'propertychange change focus input paste',
                        number: 'propertychange change focus input paste',
                        checkbox: 'change',
                    },
                    type = $(this).attr('type');

                el.data('oldVal', el.val());

                el.unbind(binds[type]);
                el.bind(binds[type], function(e) {

                    let check = $(this).hasClass('check');

                    if (!check && el.data('oldVal') == el.val()) return;

                    !check && el.data('oldVal', el.val());

                    let title = $('input[name="list-title"]');
                    title.removeClass('incorrect');
                    if (!title.val())
                        title.addClass('incorrect');

                    if (check) {
                        let input = $(this).parent('label').prev('input');
                        input.removeClass('gray');
                        if ($(this).is(':checked')) input.addClass('gray');
                    }

                    apply.call(this);
                });

                // el.bind('blur', function() {
                //     if (el.data('oldVal') == el.val())
                //         return;

                //     apply.call(this);
                // });
            });
        }

        inputRenew();

        $('.inline.icon[title!=""]').qtip({
            position: {
                viewport: $('#mapid'),
                my: 'right center',
                at: 'left center'
            },
            style: {
                classes: 'tooltip-style'
            },
            show: {
                delay: 250,
                solo: true
            },
            hide: {
                event: 'click mouseleave'
            }
        });

        modeSwitch && apply();
    },

    _settingOver: function() {

        let fn = K.tool.layer,
            layer = fn.layer,
            setting = $(this).attr('aria-label'),
            isPopup = setting.bMatch('popup-');

        setting = setting.replace('popup-', '');

        let value = layer.options[setting] || '';
        if (isPopup) value = (setting == 'content' ? fn.pop._content : fn.pop.options[setting]);

        if ($.type(value) == 'object')
            value = JSON.stringify(value);

        if (K.has(setting, ['content', 'html']))
            value = safeTags(value);

        if ($.type(value) == 'string' && !value)
            value = undefined;

        let cv = 'current-value';

        if (!$('.' + cv, this).length && value != undefined) {

            $('<span />', {
                class: cv
            }).appendTo(this);

        }

        $('.' + cv, this).html(value).fadeIn(250);
    },

    _settingLeave: function() {
        $('.current-value').fadeOut(500);
    },

    // Confirm the settings that you have changed and remove the backup
    _save: function() {

        let copy = Cookies.get('copy') || {},
            layer = this.layer;

        this._hide();

        if (this.shape == 'marker') {

            copy.marker = $.extend({}, this.icon, K.curtail({}, layer.options, ['id']));

        } else if (this.shape == 'polyline') {

            copy.polyline = K.curtail({}, layer.options, ['id']);

        } else if (this.shape == 'polygon') {

            copy.polygon = K.curtail({}, layer.options, ['id']);

        } else if (this.shape == 'circle') {

            copy.circle = K.curtail({}, layer.options, ['id']);
        }

        let p = this.pop,
            o = p.options;

        copy[this.shape + 'Popup'] = p._content ? {
            content: (p._content && !(o && o.list && o.list.title) ? p._content : ''),
            options: {
                className: (o && o.className ? o.className : ''),
                list: (o && o.list ? $.extend(true, {}, o.list) : {})
            }
        } : {};

        Cookies.set('copy', copy, K.expires);

        delete layer.backup;

        if (!(K.mode in layer.options.mode)) {
            K.group.mode[layer.options.group].removeLayer(layer._leaflet_id);
        }
    },

    // Confirm the settings that you have changed
    _cancel: function() {

        this._hide();
        let layer = this.layer,
            o = layer.options,
            b = layer.backup;

        $.extend(true, o, b.options);

        if (b.popup) {
            layer.unbindPopup();
            layer.bindPopup(b.popup);
        }

        // Restore old settings
        if (o.shape == 'marker') {

            layer.setLatLng(b.pos.latlng);
            layer.updateIcon();
            // layer.setOpacity(o.opacity);

            // Create a polyline with the new settings
        } else if (K.has(o.shape, ['polyline', 'polygon'])) {

            layer.setLatLngs(b.pos.latlngs);
            layer.setStyle(o);

        } else if (o.shape == 'circle') {

            layer.setLatLng(b.pos.latlng);
            layer.setRadius(b.pos.radius);
        }

        K.complete.is(layer) && K.complete.add(layer);

        layer.storeSettings();
        layer.saved(true);
    },

    // Copy settings 
    _copy: function() {

        let copy = Cookies.get('copy') || {},
            layer = this.layer;

        if (this.shape == 'marker') {

            // Save the settings for use later on 
            copy.marker = $.extend({}, this.icon, K.curtail({}, layer.options, ['id']));

        } else if (this.shape == 'polyline') {

            copy.polyline = K.curtail({}, layer.options, 'id');

        } else if (this.shape == 'polygon') {

            copy.polygon = K.curtail({}, layer.options, 'id');

        } else if (this.shape == 'polygon') {

            copy.circle = K.curtail({}, layer.options, 'id');
        }

        let p = this.pop,
            o = p.options;

        copy[this.shape + 'Popup'] = p._content ? {
            content: (p._content && !(o && o.list && o.list.title) ? p._content : ''),
            options: {
                className: (o && o.className ? o.className : ''),
                list: (o && o.list ? $.extend(true, {}, o.list) : {})
            }
        } : {};


        Cookies.set('copy', copy, K.expires);

        K.msg.show({
            msg: 'Settings copied!',
            time: 2000
        });
    },

    _copySingle: function() {

        let copy = Cookies.get('copy') || {},
            fn = K.tool.layer,
            pop = $(this).attr('which') == 'popup',
            set = $(this).attr('setting'),
            val = set == 'list' ? removeEmpty(fn.pop.options.list) : $('.input').val();

        if (val == null || val == undefined || ($.type(val) == 'string' && !val) || ($.type(val) == 'object' && !K.length(val))) {

            K.msg.show({
                msg: 'Copy failed!',
                time: 2000
            });
            return;
        }

        if (!K.in('options', copy)) copy.options = {
            popup: {}
        };

        if (pop) copy.options.popup[set] = val;
        else copy.options[set] = val;

        Cookies.set('copy', copy, K.expires);

        K.msg.show({
            msg: 'Setting copied!',
            time: 2000
        });
    },

    // Paste copied settings 
    _paste: function() {

        let layer = this.layer,
            copy = Cookies.get('copy') || {},
            sets = copy[this.shape] || false;

        if (!sets) {
            K.msg.show({
                msg: 'You need to copy something first!',
                time: 2000
            });
            return;
        }

        sets = $.extend({}, layer.options, sets, {
            pane: (sets.className == 'poly-hover' ? 'zonePane' : 'overlayPane')
        });

        this.new = layer.shape == 'circle' ? L.circle(layer._latlng, $.extend(sets, {
            radius: layer._mRadius
        })) : L[polyType(layer._latlngs)](layer._latlngs, sets);

        removeLayer(layer, this.group);
        K.group.mode[layer.options.group].addLayer(this.new);
        this.new.on('click', this.show);

        // Save all the hard work
        this.new.saved(false);

        switchLayerGroups();
        polyHoverAnimation();
        K.msg.show({
            msg: 'Settings pasted!',
            time: 2000
        });

        this._refresh();
    },

    _pasteSingle: function() {
        let copy = Cookies.get('copy') || {};

        let fn = K.tool.layer,
            pop = $(this).attr('which') == 'popup',
            set = $(this).attr('setting');

        if ((!K.in('options', copy)) || (pop && !copy.options.popup[set]) || (!pop && !copy.options[set])) {

            K.msg.show({
                msg: 'There is no copied setting!',
                time: 2000
            });
            return;
        }

        if (set == 'list') {

            let list = copy.options.popup.list,
                input;

            $('input').val('');

            for (let j = 0; j < 2; j++) {

                if (list.subs) {
                    for (let i = 0; i < list.subs.length; i++) {

                        if (!list.subs[i].value) continue;

                        input = $(`[name="list-sub"][num="${i}"]`);

                        if (!input.length) $('a.add.subs').trigger('click');

                        input.val(list.subs[i].value);
                        let p = input.parent();

                        p.find('[cat=color]').prop('checked', list.subs[i].color);
                        p.find('[cat=line]').prop('checked', list.subs[i].line);
                        p.find('[cat=note]').prop('checked', list.subs[i].note);
                    }
                }

                if (list.list) {
                    for (i = 0; i < list.list.length; i++) {

                        if (!list.list[i].item) continue;

                        input = $(`[name="list-item"][num="${i}"]`);

                        if (!input.length) $('a.add.list').trigger('click');

                        input.val(list.list[i].item);
                        $(`[name="list-qty"][num="${i}"]`).val(list.list[i].qty);
                    }
                }
            }

            $('[name="list-title"]').val(list.title).trigger('blur');

            return;
        }

        $('.input').val(pop ? copy.options.popup[set] : copy.options[set]).trigger('blur');
    },

    _pasteOver: function(layer) {
        layer.makeBackup();

        layer.setStyle($.extend(layer.options, Cookies.get('copy') ? Cookies.get('copy')[this.shape] || {} : {}));
    },

    _pasteOut: function(layer) {

        layer.setStyle($.extend(layer.options, layer.paste.options));
    },

    // Delete the layer
    _delete: function() {

        let _this = this;
        this._hide();

        $('<div />', {
            class: 'screen-blank',
            html: $('<div />', {
                class: 'confirm',
                html: $('<div />', {
                    class: 'message',
                    html: 'Are you sure you want to delete this layer?'
                })
            })
        }).appendTo('body');

        $('<a />', {
                class: 'button no',
                title: 'Cancel',
                html: 'Cancel'
            }).appendTo('.confirm')
            .on('click', function() {
                $('.screen-blank').remove();
            });

        $('<a />', {
                class: 'button yes',
                title: 'Delete',
                html: 'Delete'
            }).appendTo('.confirm')
            .on('click', function() {
                _this._trueDelete.call(_this);
                $('.screen-blank').remove();
            });

    },

    _trueDelete: function() {

        let layer = this.layer;
        removeLayer(layer, this.group, true);
    },

    _toType: function() { // MARK: ^ To Type

        const layer = this.layer;
        let setting = layer.editing.window;

        if (!(setting && layer.options.type && setting != 'type')) return;

        const isPopup = setting.bMatch('popup-')
        setting = setting.replace('popup-', '');

        const $mode = $('.mode-switch'),
            o = {
                setting: setting,
                value: K.getSetting(layer[isPopup ? 'popup' : 'options'], setting),
                forMode: $mode.length && $mode.is(':checked')
            };

        // update the global settings for this change
        const g = K.layer[layer.options.type],
            t = isPopup ? 'p' : 'o';
        g.changed = true;
        !K.in(t, g) && (g[t] = {});
        if (o.forMode) {
            !K.in('mode', g[t]) && (g[t].mode = {
                [K.mode]: {}
            });
            !K.in(t, g[t].mode[K.mode]) && (g[t].mode[K.mode][t] = {});
            g[t].mode[K.mode][t][setting] = o.value;
        } else g[t][setting] = o.value;

        $.each(K.group.mode, function(i, g) {
            $.each(g._layers, function(i, l) {
                if (l.options.type != layer.options.type) return;
                if (isPopup) l.updatePopup(o);
                else l.applySetting(o);
            });
        });

        K.msg.show({
            msg: 'Setting copied to all ' + layer.options.type.space(),
            time: 2000
        });
    },

    // Duplicate a polygon or polyline
    _dupe: function() {

        this._hide();
        let layer = this.layer;

        let set = $.extend({}, layer.options, {
            id: ID()
        });

        let ll = layer._latlngs,
            pType = polyType(ll);

        if (layer.shape == 'circle') {

            ll = layer._latlng;
            ll.lng -= 0.000001;
            ll.lng -= 0.000001;

        } else if (K.has(pType, ['polygon', 'polyline'])) {

            if (pType == 'polygon') ll = ll[0];
            ll.splice(1, 0, L.latLng(((ll[0].lat + ll[1].lat) / 2), ((ll[0].lng + ll[1].lng) / 2)));

        } else {

            ll[0][0].lng -= 0.000001;
            ll[0][1].lng -= 0.000001;
        }

        this.new = layer.shape == 'circle' ? L.circle(layer._latlng, $.extend(set, {
            radius: layer._mRadius
        })) : L[pType](layer._latlngs, set);

        K.group.mode[layer.options.group].addLayer(this.new);
        this.new.on('click', this.show);

        this.new.saved(false);

        // createGeoJSON();

        switchLayerGroups();
        polyHoverAnimation();

        K.msg.show({
            msg: 'Duplicated',
            time: 2000
        });
    },

    // Join polygons together
    _join: function() {

        let layer = this.layer;

        this.join = layer;
        layer.off('click').bringToBack();

        this._hide();
        K.msg.show({
            msg: 'Select the shape to join!',
            time: 3000
        });
    },

    // Toggle dragging of this layer
    _move: function() {

        let fn = K.tool.layer,
            layer = fn.layer;

        if (layer.dragging.enabled()) {
            layer.dragging.disable();
            $(this).removeClass('end');
        } else {
            layer.dragging.enable();
            $(this).addClass('end');
            layer.on('dragend', function() {
                this.saved(false);
            });
        }
    },

    // Add the layer to the draw group for editing
    _edit: function() {

        let fn = K.tool.layer,
            layer = fn.layer;

        layer.editing.edit = !layer.editing.edit;
        $(this).toggleClass('end');
        switchLayerGroups();
    },

    // Split the joined polygons
    _split: function() {

        this._hide();
        let layer = this.layer,
            newLayer,
            show = this.show;

        $.each(layer._latlngs, function(i, m) {
            sets = $.extend({}, layer.options, {
                id: ID()
            });

            newLayer = L[polyType([m])]([m], sets);

            K.group.mode[newLayer.options.group].addLayer(newLayer);
            newLayer.on('click', show);

            newLayer.saved(false);
        });

        removeLayer(layer, this.group, true);

        // Save all the hard work

        switchLayerGroups();
        polyHoverAnimation();
    },

    // Hide the menu
    _hide: function() {
        $('#settings-menu').remove();
    },

    // Refreshes the mark after a commit
    _refresh: function() {
        K.tool.layer._hide();
        K.tool.layer._show.call(K.tool.layer, K.tool.layer.layer);
    },

    updateSaved: function() {

        // Color the save button to remind you it needs pressing
        if (!this.layer.editing.saved || (this.layer.backup && this.layer.backup.changes)) {
            $('.settings-save').css('background-color', '#735711');
            $('.unsaved').show();

        } else {
            $('.settings-save').css('background-color', '#24373d');
            $('.unsaved').hide();
        }
    }
};

L.Layer.include({ // MARK: Layer Include
    tools: K.tool.layer,
    backup: false,

    // Backup the original settings
    makeBackup: function() {

        let backup = function(obj) {
            let rObj = {};

            for (key in obj) {
                if ($.type(obj[key]) === 'object') {
                    rObj[key] = backup(obj[key]);

                } else if ($.type(obj[key]) !== 'function' && !key.bMatch(/^_/)) {
                    rObj[key] = obj[key];
                }
            }

            return rObj;
        }

        let t = !this.backup ? 'backup' : 'paste';

        this[t] = {};
        this[t].options = backup(this.options);

        if (this.popup)
            this[t].popup = backup(this.popup);

        if (t == 'backup') {

            if (K.has(this.options.shape, ['polygon', 'polyline'])) {
                this.backup.pos = {
                    latlngs: L.LatLngUtil.cloneLatLngs(this.getLatLngs())
                };

            } else if (this.options.shape == 'marker') {

                this.backup.pos = {
                    latlng: L.LatLngUtil.cloneLatLng(this.getLatLng())
                };

            } else if (this.options.shape == 'circle') {

                this.backup.pos = {
                    latlng: L.LatLngUtil.cloneLatLng(this.getLatLng()),
                    radius: this._mRadius
                };
            }
        }

        return this;
    },

    // Apply the settings that you are changing
    applySetting: function(options) { // MARK: ^ Apply Setting

        const o = $.extend({
            setting: undefined, // this has to be a valid setting for the layer
            value: undefined, // this is the value that is going to change
            skipSave: false, // this is used when applying a setting but not to be saved 
            forMode: false // this is used to apply the setting into the mode setting
        }, options);

        if (!this.backup && !o.skipSave) this.makeBackup();

        const oldType = this.options.type;
        let m = o.forMode ? this.getMode() : false;
        const mSp = this.getModeSettingPath(o.setting);
        !o.forMode && mSp !== null && delete mSp[o.setting];

        // Add the settings to the correct locations
        if (this.options.shape == 'marker' && K.has(o.setting, ['className', 'iconUrl', 'iconSize', 'html'])) {

            let p = this.options,
                layer = this;

            o.value = $.type(o.value) == 'string' && o.value.bMatch(/\d+,\d+/) ? o.value.split(',') : o.value;
            !m && (p[o.setting] = o.value);
            m && (m[o.setting] = o.value);

            $.ajax({
                type: 'HEAD',
                url: this.getSetting('iconUrl'),
                success: function() {

                    layer.updateIcon();
                    K.complete.is(layer) && K.complete.add(layer);
                }
            });

        } else if (m) m[o.setting] = o.value
        else this.options[o.setting] = o.value;

        // Apply the settings to the original layer (not marker)
        this.options.shape != 'marker' && this.setStyle(this.options);
        // this.options.shape == 'marker' && this.setOpacity(this.options.opacity);

        // add the settings to global if they don't already exist
        const type = this.options.type,
            counts = K.map.type.counts;
        if (type && o.setting == 'type') {
            this.oldType = oldType;
            if (!(type in counts)) counts[type] = 0;
            counts[type] += 1;
            counts[oldType] -= 1;
        }

        this.storeSettings();
        !o.skipSave && this.saved(false);

        // as we are changing the type, we need to apply all of the 
        // other settings to match it, if it exists already
        if (type && o.setting == 'type') {
            const _this = this;
            $.each(K.curtail({}, K.layer[type].o, ['type', 'shape']), function(key, val) {
                _this.applySetting({
                    setting: key,
                    value: val,
                    forMode: o.forMode
                });
            });

            K.layer[type].p && $.each(K.layer[type].p, function(key, val) {
                _this.updatePopup({
                    setting: key,
                    value: val,
                    forMode: o.forMode
                });
            });
        }

        return this;
    },

    // returns the mode object creating it if it does not exist
    getMode: function(isPopup) {
        const m = this.options.mode[K.mode],
            t = isPopup ? 'p' : 'o';
        !K.in(t, m) && (m[t] = {});

        return m[t];
    },

    // returns the setting from the mode object if it exists
    getModeSetting: function(setting, isPopup) {
        const m = this.options.mode[K.mode],
            t = isPopup ? 'p' : 'o';

        if (K.in(t, m) && K.in(setting, m[t]))
            return m[t][setting];

        return null;
    },

    // returns the path to the mode setting
    getModeSettingPath: function(setting, isPopup) {
        const m = this.options.mode[K.mode],
            t = isPopup ? 'p' : 'o';

        if (K.in(t, m) && K.in(setting, m[t]))
            return m[t];

        return null;
    },

    getSetting: function(setting, isPopup) {
        const o = isPopup ? this.popup : this.options,
            modeValue = this.getModeSetting(setting, isPopup);

        if (modeValue !== null) return modeValue;
        return o[setting];
    },

    updatePopup: function(options) { // MARK: ^ Update Popup

        const o = $.extend({
            setting: undefined, // this has to be a valid setting for the layer
            value: undefined, // this is the value that is going to change
            forMode: false // this is used to apply the setting into the mode setting
        }, options);

        if (!this.backup) this.makeBackup();

        const mSp = this.getModeSettingPath(o.setting, true);
        !o.forMode && mSp !== null && delete mSp[o.setting];
        !o.forMode && (this.popup[o.setting] = o.value);
        o.forMode && (this.getMode(true)[o.setting] = o.value);

        this.unbindPopup();
        this.hasPopupContent() && this.bindPopup(this.popup);

        this.storeSettings();
        this.saved(false);
    },

    hasPopupContent: function() {
        if (!this.popup) return false;
        return this.getSetting('content', true) || !K.empty(this.getSetting('list', true));
    },

    storeSettings: function() {
        const counts = K.map.type.counts,
            type = this.options.type;

        if (counts[type] == 1) {
            !(type in K.layer) && (K.layer[type] = {});

            const m = K.layer[type],
                o = this.options;

            if (o.shape == 'marker') {
                $.extend(o, o.icon.options);
                o.iconUrl && delete o.html;
                !o.iconUrl && delete o.iconUrl;
            }

            m.o = K.reduce({}, o, K.map.property[this.options.shape]);
            K.in('link', m.o) && delete m.o.link;
            m.changed = true;

            if (this.popup) {
                const p = this.popup;
                m.p = { className: p.className };
                !K.empty(p.list) && (m.p.list = p.list);
                !m.p.list && (m.p.content = p.content);
            }

            if (counts[this.oldType] == 0) {
                delete K.layer[this.oldType];
                delete K.map.type.counts[this.oldType];
            }
        }
    },

    saved: function(saved) {
        let tool = K.tool.layer;
        this.editing.saved = saved;
        this.backup.changes = !saved;

        if (!saved) K.save.add(this);
        else {
            K.save.remove(this);
            delete this.backup;
        }

        if (tool.isOpen()) tool.updateSaved();
    }
});
/*=====  End of LAYER TOOLS  ======*/

/*=======================================
=            DOCUMENT LOADED            =
=======================================*/
$(function() { // MARK: Document Loaded

    // Import credits php
    $.ajax({
        url: 'includes/credits.php',
    }).done(function(a) {
        K.credits = a;
    });

    // Create the modes in marker tools layers
    K.tool.marker.fill();

    // $('#survival-logo').show(1000);

    $.ajax({
        url: 'includes/map_date.php',
    }).done(function(a) {
        K.mapVersion = a;

        // Map Image Overlay
        L.imageOverlay(`images/map.svg?v=${K.mapVersion}`, [
            [15, -15],
            [-15, 15]
        ], {
            attribution: '<a title="Tom Clancy\'s The Division 2" href="https:// tomclancy-thedivision.ubisoft.com/">The Division 2</a>',
            pane: 'mapPane'
        }).addTo(K.myMap);

    });

    // Add the main groups to the map
    K.myMap.addLayer(K.group.mode.groupAll);

    // On Zoom and Pan
    K.myMap.on('zoomend moveend', function(e) {
        zoom = e.target._zoom;
        onZoomEnd();

        Cookies.set('zoom', K.myMap.getZoom(), K.expires);
        Cookies.set('pan', K.myMap.getCenter(), K.expires);

        polyHoverAnimation();
    });

    // Create the mode buttons
    const mC = $('.map-mode-box'), // MARK: ^ Create Mode Buttons
        mB = $('.map-mode', mC).detach();
    $.each(K.modes.get, function(i, mode) {
        const nB = mB.clone();
        $('img', nB).attr('src', `images\\mode-${mode.toLowerCase().replace(/ /g, '-')}.svg`);
        $('span', nB).text(mode);
        nB.attr('mode', mode);
        mC.append(nB);
        mode == K.mode && nB.addClass('active');
    });

    const reorderModes = function() {
        const gap = 45;
        let i = 0;
        $('.map-mode').each(function() {
            if ($(this).hasClass('active')) $(this).css('top', 0);
            else {
                i++;
                $(this).css('top', (i * gap) + 'px');
            }
        });
    };
    reorderModes();

    // Add click control for the mode buttons
    $('.map-mode').on('click', function() {
        if (mC.hasClass('active')) {
            if (!$(this).hasClass('active')) {

                $(this).siblings().removeClass('active');
                $(this).addClass('active');

                reorderModes();

                K.mode = $(this).attr('mode');
                Cookies.set('mode', K.mode, K.expires);
                K.group.mode = K.group.feature[K.mode];
                K.bar.b.power && !K.bar.b.power.enabled() ? K.check.doOnce = true : true;

                setTimeout(() => {
                    pageLoad();
                }, 1000);
            }
            mC.removeClass('active');

        } else mC.addClass('active');
    });

    // Toggle menu buttons
    $('#side-bar .side-menu-toggle:not(.mode):not(.full)').on('click', function() {

        let sb = $('#side-bar'),
            c = 'active',
            a = $(this).attr('button'),
            o = Cookies.get('sideMenu'),
            setCookies = function() {
                Cookies.set('sideBar', sb.hasClass(c), K.expires);
                Cookies.set('sideMenu', a, K.expires);
            };

        if ($(this).hasClass(c)) {
            sb.removeClass(`${c} ${a}`);
            setTimeout(function() {
                sb.children().removeClass(c);
                setCookies();
            }, 1000);
        } else if (sb.hasClass(c)) {
            sb.removeClass(`${c} ${o}`);
            setTimeout(function() {
                sb.children().removeClass(c);
                sb.addClass(`${c} ${a}`);
                sb.children(`.${a}`).addClass(c);
                setCookies();
            }, 1000);
        } else {
            sb.addClass(`${c} ${a}`);
            sb.children(`.${a}`).addClass(c);
            setCookies();
        }
    });

    // Correctly position the menu buttons
    $('#side-bar > a').each(function(i, el) {
        $(this).css('top', i = 0 ? '10px' : (10 + (i * 40)) + 'px');
    });

    // Toggle fullscreen button
    let el = $('#side-bar .side-menu-toggle.full');
    el.on('click', toggleFullScreen);
    $(document).on('webkitfullscreenchange mozfullscreenchange fullscreenchange', function(e) {
        el.toggleClass('yes');
    });

    // Set change log if they have not seen it before
    if (!K.urlParam('overwolf') && Cookies.get('currentUpdate') != K.currentUpdate) {
        Cookies.set('sideMenu', 'changes', K.expires);
        Cookies.set('sideBar', true, K.expires);
        Cookies.set('currentUpdate', K.currentUpdate, K.expires);
    }

    // User account controls
    $('#side-bar .login').on('click', '.page', function() {
        let page = $(this).attr('name');

        $.ajax({
            url: `includes/${page}.php`

        }).done(function(a) {

            a && $('#side-bar .login .side-content').html(a);
        });
    });

    $('#side-bar').on('click', '#regform .button', doRegister);
    $('#side-bar').on('keypress', '#regform .input', function(e) {
        e.which == 13 && doRegister();
    });

    $('#side-bar').on('click', '#donate.button', doDonator);
    $('#side-bar').on('keypress', '#donator', function(e) {
        e.which == 13 && doDonator();
    });

    $('#side-bar').on('click', '#login .button', doLogin);
    $('#side-bar').on('keypress', '#login .input', function(e) {
        e.which == 13 && doLogin();
    });

    $('#side-bar').on('click', '#reset .button', doReset);
    $('#side-bar').on('keypress', '#reset .input', function(e) {
        e.which == 13 && doReset();
    });

    $('#side-bar').on('click', '#forgot .button', doForgot);
    $('#side-bar').on('keypress', '#forgot .input', function(e) {
        e.which == 13 && doForgot();
    });

    $('form').submit(function() {
        return false;
    });

    // Logout
    //////////
    $('#side-bar').on('click', '#logout', function() {

        $.ajax({
            url: 'includes/logout.php'

        }).done(function(a) {

            K.user.name = false;
            K.user.type = 0;
            K.user.data = false;

            $('#side-bar .login .side-content').html(a);

            pageLoad();
        });
    });

    // Remember me
    ///////////////
    $('#side-bar').on('click', '#rem-check', function() {

        $.ajax({
            type: 'POST',
            url: 'includes/validator.php',
            data: {
                checked: $(this).prop('checked')
            }
        });
    });

    // Hide Menus on no click
    $(document).mousedown(function(e) { // MARK: ^ Hide Menus
        if (K.check.grabbing) return;
        const container = $('.settings-divider, .switch-active-group, #slider-box, .group-switch');
        if (!container.is(e.target) && container.has(e.target).length === 0) {
            $(container).remove();
        }

        if ($('.map-mode-box').hasClass('active') && !$(e.target).hasClass('map-mode'))
            $('.map-mode-box').removeClass('active');
    });

    // Error handling in inputs
    $('#side-bar').on('focus', '.login .input', function() {
        $('.' + $(this).attr('name')).show(500);

    }).on('blur', '.login .input', function() {
        $('.' + $(this).attr('name')).hide(500);

    }).on('propertychange change click keyup input paste', '.login .input', function() {
        let el = $(this),
            ty = el.attr('id'),
            vl = el.val(),
            re = false;
        if (ty == 'email' || ty == 'donator') {
            re = vl.bMatch(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
        } else if (ty == 'username') {
            re = vl.bMatch(/^\w+$/);
        } else if (ty == 'password') {
            re = vl.bMatch(/(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/);
        } else if (ty == 'confirmpwd') {
            re = vl == $('#password').val();
        }
        el.addClass('incorrect');
        re && el.removeClass('incorrect');
    });

    // Menu icon sliders
    $('#side-bar .side-menu-toggle').on('mouseenter touchstart', function() {
        $(this).css('left', '-' + ($(this).width() + 50) + 'px');

    }).on('mouseleave touchmove click', function() {
        $(this).css('left', '-35px');
    });

    // Gear set button controls
    // $('.set-piece .img-check').on('click', function() {
    //     $(this).toggleClass('checked');
    //     updateSetCounter($(this));
    // });

    // $('.set-piece .check svg').on('click', function() {
    //     $(this).siblings('a').toggleClass('checked');
    //     updateSetCounter($(this));
    // });

    // $('.set-piece .size').on('click', function() {
    //     $(this).toggleClass('min');
    //     $(this).parent().toggleClass('min');
    //     // updateSetCounter($(this));
    // });

    // Save changes warning
    $(window).bind('beforeunload', function() {
        if (K.save.check()) {
            if (navigator.userAgent.toLowerCase().match(/msie|chrome/)) {
                if (window.aysHasPrompted) {
                    return;
                }
                window.aysHasPrompted = true;
                window.setTimeout(function() {
                    window.aysHasPrompted = false;
                }, 900);
            }
            return 'are you sure';
        }
        return;
    });

    if (Cookies.get('powered') !== undefined)
        K.check.doOnce = !Cookies.get('powered');

    // Add user as donator if they have correct token
    if ($.type(K.urlParam('d')) == 'string') {
        $.ajax({
            type: 'POST',
            url: 'includes/process_donator.php',
            data: {
                load: K.urlParam('d')
            }
        }).done(function(a) {
            window.location.href = window.location.href.split('?')[0];
        });
    }

    pageLoad();
}); /*=====  End of DOCUMENT LOADED  ======*/

/*=================================
=            PAGE LOAD            =
=================================*/
function pageLoad() { // MARK: Page Load

    // Check for clean map params and cookies and hide everything
    if (K.urlParam('noIcon') == 'true')
        Cookies.set('hideIcon', true, K.expires);

    if (K.urlParam('clean') == 'true')
        Cookies.set('cleanMenu', true, K.expires);

    if (!Cookies.get('hideIcon'))
        $('#survival-logo').fadeIn(500);

    if (Cookies.get('cleanMenu')) {
        $('.side-menu-toggle.login').hide(0);
        $('.side-menu-toggle.filters').hide(0);
        $('.side-menu-toggle.full').hide(0);
        $('.side-menu-toggle.changes').hide(0);
        $('.side-menu-toggle.todo').hide(0);
        $('.side-menu-toggle.gear').hide(0);
        $('.side-menu-toggle.language').hide(0);
        $('.side-menu-toggle.shorts').hide(0);
        $('.leaflet-control-attribution.leaflet-control').hide(0);
        $('#logo').hide(0);
    }

    if (K.urlParam('overwolf') == 'true') {
        $('.side-menu-toggle.full').hide(0);
        $('.side-menu-toggle.changes').hide(0);
        $('.side-menu-toggle.todo').hide(0);
        $('.side-menu-toggle.language').hide(0);
        $('.side-menu-toggle.shorts').hide(0);
        $('.leaflet-control-attribution.leaflet-control').hide(0);
        $('#alert').hide(0);
        $('#logo').hide(0);

        $('#side-bar .side-menu-toggle.gear').css('top', '170px');
    }

    // Load all available markers
    $.ajax({
        url: 'includes/get_markers.php'
    }).done(function(data) {
        $.each($.parseJSON(data), function(i, v) {
            K.settings.main.iconUrl.values[v] = { shape: [] };
        });
    });

    K.checkLogin(() => {

        !K.user.donate && !K.urlParam('overwolf') && $('#alert').show();
        K.user.donate && $('#alert').hide();

        // setCollectionData();

        // Clear a few things incase you have logged out
        $('#message').removeClass('master');
        let shorts = $('#side-bar .shorts .side-content');
        shorts.html('');
        $('.side-menu-toggle.shorts').hide();
        $.each(K.bar.b, function(i, v) {
            empty(v);
        });
        empty(K.drawControl);
        $('document').off('keypress');
        $('#side-bar a.login').removeClass('out');

        // Check if we are user to edit the map
        if (K.user.type) {

            $('#side-bar a.login').addClass('out');

            //////////////////////////////////////////////////////
            //
            //             Editing Buttons
            //
            //////////////////////////////////////////////////////
            $('#message').addClass('master');

            !K.urlParam('overwolf') && $('.side-menu-toggle.shorts').show();
            let key = function(k, t) {
                return `<div class="item">
                    <div>${k}</div>
                    <div class="grey">-</div>
                    <span>${t.replace(' Survival', '')}</span>
                </div>`;
            };
            shorts.append('<span class="title">Shortcuts</span>');

            $.each(K.shortcuts, function(sub, a) {
                shorts.append(`<span class="title sub">${sub.space()}</span>`);
                $.each(a, function(k, t) {
                    shorts.append(key(k, t.space()));
                });
            });

            shorts.append(K.credits);

            K.bar.b.power = L.control.button({
                text: '',
                container: 'power',
                title: 'Enable/disable tools',
                css: 'power',
                clickFn: function() {
                    K.bar.b.power._click();
                }
            }).addTo(K.myMap);

            K.bar.b.power = $.extend(K.bar.b.power, {
                enabled: function() {
                    return !$(this._button).hasClass('enabled');
                },
                _click: function() {

                    let el = $(this._button),
                        buttons = $('.leaflet-top.leaflet-left').children().not('.power').find('a');

                    if (this.enabled() || K.check.doOnce) {

                        el.addClass('enabled');

                        $.each(K.bar.draw, function(i, type) {
                            type.disabler();
                        });

                        $('#marker-tools, .group-switch, #settings-menu').remove();
                        K.bar.b.group.disable();
                        K.bar.b.tools.disable();

                        switchLayerGroups(true);

                        $(buttons.get().reverse()).each(function(index, btn) {
                            setTimeout(function() {
                                $(btn).css('transform', 'translateX(-50px)');
                            }, (index * 40));
                        });

                    } else {

                        buttons.each(function(index, btn) {
                            setTimeout(function() {
                                $(btn).css('transform', 'translateX(0px)');
                            }, (index * 40));
                        });

                        el.removeClass('enabled');

                        $.each(K.bar.draw, function(i, type) {
                            type.enabler();
                        });

                        K.bar.b.group.enable();
                        K.bar.b.tools.enable();

                        switchLayerGroups();
                    }

                    Cookies.set('powered', this.enabled(), K.expires);
                    K.check.doOnce = false;
                }
            });

            K.bar.b.save = L.control.button().addTo(K.myMap).disable();

            K.bar.b.group = L.control.button({
                text: '',
                title: 'Switch editable layers',
                css: 'group',
                clickFn: function() {

                    if ($('.group-switch').length) {
                        $('.group-switch').remove();
                        return;
                    }

                    $('body').append('<div class="leaflet-menu group-switch"></div>');

                    let div = document.getElementsByClassName('group-switch')[0];
                    L.DomEvent.disableClickPropagation(div);
                    L.DomEvent.on(div, 'mousewheel', L.DomEvent.stopPropagation);

                    let list = $.merge(K.map.mode[K.mode], K.map.mode.all).sort();
                    $.unique(list);
                    $.each(list, function(i, t) {
                        $('.leaflet-menu').append(`<a class="leaflet-menu-item switch-active-group 
                            ${K.map.active[t] ? ' active' : ''}" type="${t}">${t.space()}</a>`);
                    });

                    $('.switch-active-group').on('click', function(e) {
                        let t = $(this).attr('type');
                        $(this).toggleClass('active');
                        K.map.active[t] = !K.map.active[t];
                        Cookies.set('activeMap', $.extend({}, K.map.active), K.expires);
                        switchLayerGroups();
                    });
                }
            }).addTo(K.myMap);

            K.bar.b.grid = L.control.button({
                text: '',
                title: 'Grid modifier tools',
                css: 'grid',
                clickFn: function() {
                    let el = arguments[0]._button;

                    if ($('#slider-box').length) {
                        $('#slider-box').remove();
                        return;
                    }

                    let gridTools = ['rotate', 'x-pos', 'y-pos'];

                    $(el).after('<div id="slider-box"></div>');
                    $.each(gridTools, function(i, type) {
                        $('#slider-box').append(`<div class="leaflet-menu-slider">
                            <div id="slider-${type}" class="slider-class ${type}">
                                <div class="handle-${type} ui-slider-handle"></div>
                            </div>
                        </div>`);

                        $('#slider-' + type).slider({
                            min: (type == 'rotate' ? -45 : -100),
                            max: (type == 'rotate' ? 45 : 100),
                            step: (type == 'rotate' ? 0.5 : 1),
                            value: Cookies.get(`grid-${type}`) || 0,
                            create: function() {
                                let val = $(this).slider('value');
                                $('.handle-' + type).text((type == 'rotate' ? val + ' deg' : (type == 'x-pos' ? 'X: ' + val : 'Y: ' + val)));
                            },
                            slide: function(e, ui) {
                                $('.handle-' + type).text((type == 'rotate' ? ui.value + ' deg' : (type == 'x-pos' ? 'X: ' + ui.value : 'Y: ' + ui.value)));
                                Cookies.set('grid-' + type, ui.value, K.expires);
                                setGridRotate();
                            },
                            change: function(e, ui) {
                                $('.handle-' + type).text((type == 'rotate' ? ui.value + ' deg' : (type == 'x-pos' ? 'X: ' + ui.value : 'Y: ' + ui.value)));
                                Cookies.set('grid-' + type, ui.value, K.expires);
                                setGridRotate();
                            }
                        });
                    });

                    $('#slider-box').append('<div class="slider-resets"></div>');
                    $.each(gridTools, function(i, type) {

                        $('.slider-resets').append(`<a class="slider-button reset-${type}">Reset ${type.firstToUpper()}</a>`);

                        $('.slider-button.reset-' + type).on('click', function() {
                            $('#slider-' + type).slider('value', 0);
                        });
                    });

                    $('.slider-resets').append('<a class="slider-button reset-all">Reset All</a>');

                    $('.slider-button.reset-all').on('click', function() {

                        $('.slider-class').slider('value', 0);
                    });

                    let div = L.DomUtil.get('slider-box');
                    L.DomEvent.disableClickPropagation(div);
                    L.DomEvent.on(div, 'mousewheel', L.DomEvent.stopPropagation);

                }
            }).addTo(K.myMap).disable();

            K.bar.b.tools = L.control.button({
                text: '',
                title: 'Toggle marker tool panel',
                css: 'tools',
                clickFn: K.tool.marker.show
            }).addTo(K.myMap);

            K.updateMarker();

            // L.Control.Draw Events
            // ----------------------
            K.myMap.addControl(K.drawControl).on('draw:created', drawEventCreated);

            K.bar.draw.Polygon = K.drawControl._toolbars.draw._modes.polygon.handler;
            K.bar.draw.Polyline = K.drawControl._toolbars.draw._modes.polyline.handler;
            K.bar.draw.Rectangle = K.drawControl._toolbars.draw._modes.rectangle.handler;
            K.bar.draw.Marker = K.drawControl._toolbars.draw._modes.marker.handler;
            K.bar.draw.Circle = K.drawControl._toolbars.draw._modes.circle.handler;

            K.bar.edit.Edit = K.drawControl._toolbars.edit._modes.edit.handler;
            K.bar.edit.Remove = K.drawControl._toolbars.edit._modes.remove.handler;

            // Setup hotkeys for drawing shapes
            $(document).off('keypress');
            $(document).on('keypress', keypressEvent);

            drawButtons = $('.leaflet-draw-section');

            // L.Control.Draw EditStart
            K.myMap.on('draw:editstart', function(e) {
                polyHoverAnimation(true);

                $('#settings-menu, .group-switch, #marker-tools').remove();
                K.bar.b.power.disable();
                K.bar.b.group.disable();
                K.bar.b.save.disable();
                K.bar.b.tools.disable();

                K.myMap.addLayer(K.group.draw).addLayer(K.grid.overlay);
                K.bar.b.grid.enable();
                setGridRotate();

                K.bar.edit.Remove.disabler();
                $.each(K.bar.draw, function(i, type) {
                    type.disabler();
                });

                K.check.editing = true;
                editIconMessage();
            })

            // L.Control.Draw Edited
            K.myMap.on('draw:edited', function(e) {
                e.layers.eachLayer(function(l) {
                    l.saved(false)
                });
            })

            // L.Control.Draw EditStop
            K.myMap.on('draw:editstop', function(e) {

                K.bar.b.power.enable();
                K.bar.b.group.enable();
                K.bar.b.tools.enable();
                K.save.check();

                K.myMap.removeLayer(K.grid.overlay);
                K.bar.b.grid.disable();
                $('#slider-box').remove();

                K.bar.edit.Remove.enabler();
                $.each(K.bar.draw, function(i, type) {
                    type.enabler();
                });

                K.check.editing = false;

                polyHoverAnimation();
                onZoomEnd(true);
            })

            // L.Control.Draw DeleteStart
            K.myMap.on('draw:deletestart', function(e) {
                K.check.deleting = true;

                $.each(K.bar.b, function(i, type) {
                    type.disable();
                });

                K.bar.edit.Edit.disabler();
                $.each(K.bar.draw, function(i, type) {
                    type.disabler();
                });

                K.myMap.addLayer(K.group.draw).addLayer(K.grid.overlay);

                setGridRotate();
            })

            // L.Control.Draw Deleted
            K.myMap.on('draw:deleted', function(e) {
                K.group.draw.eachLayer(function(l) {
                    let i = l._leaflet_id;
                    K.group.draw.removeLayer(i);
                    K.save.delete(l)
                });
            })

            // L.Control.Draw DeleteStop
            K.myMap.on('draw:deletestop', function(e) {
                K.check.deleting = false;

                K.bar.b.power.enable();
                K.bar.b.group.enable();
                K.save.check();

                K.bar.edit.Edit.enabler();
                $.each(K.bar.draw, function(i, type) {
                    type.enabler();
                });

                onZoomEnd(true);
            });

            K.myMap.on('draw:drawstop', function(e) {
                if (K.user.type > 3) return;
                K.msg.show({
                    msg: 'Remember, you may have to zoom in to see the layers you create!',
                    time: 2500
                })
            });
        }

        K.user.type && K.check.doOnce && K.bar.b.power._onClick();

        const populateMap = function(e, id) { // MARK: ^ Populate Map
            let l, // layer
                s = $.extend(true, {}, K.layer[e.t] || {}), // settings
                g = e.g, // geometry
                o = $.extend({}, s.o || {}, e.o || {}, { creator: e.c, id: id, shape: g.t }), // options
                p = $.extend({}, s.p || {}, e.p || {}); // popup

            if ((e.p || {}).content) delete p.list;
            if ((e.p || {}).list) delete p.content;

            if (!o) return;

            // convert the mode arrays to objects
            $.each(o.mode, function(mode, obj) {
                if (K.type(obj) === 'array') o.mode[mode] = {};
            });

            if (!o.type) o.type = '';

            // Fill up groupMap for the filters
            //----------------------------------
            o.type && !K.has(o.type, K.map.group[o.group]) && K.map.group[o.group].push(o.type);

            // Fill up typeMap for the filter menus and assigning types automatically
            if (o.type && o.mode && o.shape) {
                let filter = false;

                // Filters for guests only, exclude--> Complete and Error Markers
                if (K.user.type < 1) {
                    if (!o.type.contains('Complete') && o.type != 'Error')
                        filter = true;

                    // Filters level 1, 2 & 3, exclude--> Complete and Error Markers (unless you created them)
                } else if (K.user.type <= 3) {

                    if (o.type.contains(K.user.name)) {
                        filter = true;

                    } else if (!o.type.contains('Complete') && o.type != 'Error') {
                        filter = true;
                    }

                    // Staff only view everything on main database
                } else if (K.user.type >= 4) {
                    filter = true;
                }

                if (filter) {
                    let val = o.fillColor;
                    o.shape == 'marker' && (val = o.iconUrl);
                    o.shape == 'polyline' && (val = o.color);

                    // Count how many we have of each type
                    if (!K.map.type.counts[o.type])
                        K.map.type.counts[o.type] = 1;
                    else
                        K.map.type.counts[o.type]++;

                    $.each(K.modes.get, function(i, mode) {

                        let cat = o.category || 'Default',
                            obj = K.map.type[mode];

                        if (!obj[cat]) obj[cat] = {};

                        if (K.in(mode, o.mode)) {
                            if (!obj[cat][o.type])
                                obj[cat][o.type] = [];

                            if (!K.has(val, obj[cat][o.type])) {
                                obj[cat][o.type].push(val);

                                if (K.has(o.shape, ['polygon', 'circle', 'rectangle']))
                                    obj[cat][o.type].push(o.color);
                            }
                        }
                    });
                }
            } //--------------- End Filters

            // Create the array if it does not exist
            if (!(o.mode in K.map.mode)) K.map.mode[o.mode] = [];

            // Fill up the modeMap for automatic mode assigning
            o.mode && o.type && !K.has(o.type, K.map.mode[o.mode]) &&
                K.map.mode[o.mode].push(o.type);

            // Add the settings to the settings object for editing menus
            for (s in o) {
                o[s] = toCorrectType(s, o[s]);
                s == 'className' && (o[s] = K.stripClasses(o[s]));
                s in K.settings.main && K.in('values', K.settings.main[s]) &&
                    addSet(K.settings.main[s].values, o[s], o.shape);
            }

            // fill up classRemoval array for later
            let pCn = p.className ? p.className : '';
            pCn && !K.classRemoval.contains(pCn) && (K.classRemoval = `${K.classRemoval.trim()} ${pCn}`);
            !K.classRemoval.contains(o.group) && (K.classRemoval = `${K.classRemoval.trim()} ${o.group}`);

            // Create the icons for Marker Tools
            // ----------------------
            if (o.shape == 'marker' && o.type) {

                let obj = {
                    o: $.extend({}, o, {
                        className: (o.className || '').replace(/\w+ground/g, '').trim()
                    }),
                    p: p ? p : {}
                };

                $.each(K.modes.get, function(i, mode) {
                    let tool = K.tool.marker.layers[mode];
                    if (mode in o.mode) {
                        if (!(o.category in tool)) tool[o.category] = {};
                        if (!(o.type in tool[o.category])) tool[o.category][o.type] = obj;
                    }
                });
            }

            if (g.t != 'marker') { // Circle, Polyline, Polygon and Rectangle
                let obj = $.extend(o, {
                    pane: o.pane || (o.className == 'poly-hover' ? 'zonePane' : 'overlayPane')
                });

                if (g.t == 'circle') obj.radius = g.r;

                l = L[g.t](g.c, o);

            } else if (g.t == 'marker') { // Marker

                o.className += ` ${o.group}  ${pCn}`;

                l = createMarker($.extend(o, {
                    latlng: g.c
                }));
            }

            // used to update the popups content to list format automatically (admin only)
            if (K.user.type == 5 && p.content && p.className != 'poly-info' && p.content.bMatch('<p')) {
                console.log(id, p);
                let el = $('<div />').append(p.content),
                    list = { title: false, subs: [] };
                el.children().each(function() {
                    if ($(this).prop('nodeName') == 'P' && $(this).text() != '') {
                        let item = {};
                        item.value = $(this).text();
                        $(this).next().prop('nodeName') == 'HR' && (item.line = true);
                        $(this).hasClass('desc') && (item.color = true);
                        $(this).hasClass('note') && (item.note = true);
                        list.subs.push(item);
                    }
                    $(this).remove();
                });

                list.title = $(el).text().trim();
                delete p.content;
                p.list = list;
                l.saved(false);
            }

            // Popup
            // ----------------------
            if (p && K.in('content', p) || K.in('list', p)) {

                l.bindPopup(p);

                // Add the settings to the settings object for editing menus
                K.user.type && addSet(K.settings.popup.className.values, p.className, o.shape);
            }

            // Add the Layer editing tools on click if you created it
            K.user.type && (K.user.type >= 4 || o.creator.toLowerCase() == K.user.name.toLowerCase()) &&
                l.on('click', K.tool.layer.show);

            o.complete && o.shape === 'marker' && l.on('contextmenu', function() {
                this.toggleCompleted(true);
            });

            // Add the new layer to the correct group
            let add = false;

            // For guests only show main DB layers, exclude--> Complete and Error Markers
            if (K.user.type < 1) {
                if (!o.type.contains('Complete') && o.type != 'Error')
                    add = true;

                // For levels 1, 2 & 3, show all of main and created by you
            } else if (K.user.type <= 3) {

                if (o.type.contains(K.user.name))
                    add = true;
                else if (!o.type.contains('Complete') && o.type != 'Error')
                    add = true;

            } else if (K.user.type >= 4) {
                add = true;
            }

            add && addToFeatureGroups(l);
            l.markComplete();
        };

        const populateMenus = function() { // MARK: ^ Populate Menus
            onZoomEnd();

            // Only switch layers, remove duplicates and add draw control if we are superuser
            K.user.type && switchLayerGroups();
            K.completeHidden = Cookies.get('completeHidden') || false;

            //////////////////////////////////////////////////////
            //
            //             Side Menu
            //
            //////////////////////////////////////////////////////
            let sb = '#side-bar .filters .side-content';
            $(sb).html('');
            $(sb).append(`<a class="hide-all" title="Show/Hide all!"></a>
                <span class="title">Filters</span>
                <a class="hide-complete${K.completeHidden ? ' hidden">Show' : '">Hide'} Complete</a>`);

            let list = K.map.type[K.mode];
            list = sortObjByKeys(list);
            K.filters = Cookies.get('filters') || {};

            $.each(list, function(category, types) {

                if (K.length(types)) {

                    types = sortObjByKeys(types);

                    $(sb).append(`<div class="sub title buttons">
                            <a class="collapse">
                                <span class="text">${category.firstToUpper()}</span>
                                <span class="control icon" title="Collapse/Expand ${category}"></span>
                            </a>
                            <a class="control hide-some" category="${category}" title="Show/Hide all ${category}"></a>
                        </div>`);

                    $.each(types, function(type, i) {

                        let active = K.filters[type] || false;

                        let el = $('<a />', {
                            class: 'side-bar-button ' + (active ? 'inactive' : ''),
                            set: category,
                            label: type,
                            html: $('<span />', {
                                html: type.space().replace(/Dz/, 'DZ').replace(/ (Survival|Complete)/, '').replace(' Of ', ' of ')
                            }),

                        }).appendTo(sb);

                        $('<span />', {
                            html: '[ x' + K.map.type.counts[type] + ' ]',
                            class: 'quantity'
                        }).appendTo(el);

                        if (i[0].contains('.svg')) {

                            $('<img />', {
                                src: i[Math.floor(Math.random() * i.length)]
                            }).prependTo(el);

                        } else if (category == 'polyline') {

                            $('<div />', {
                                class: 'polyline'
                            }).css({
                                backgroundColor: i[0]
                            }).prependTo(el);

                        } else {

                            $('<div />', {
                                class: 'polygon'
                            }).css({
                                borderColor: i[1],
                                backgroundColor: i[0]
                            }).prependTo(el);
                        }

                        // Hide the layers that were hidden on the last load
                        active && showHideLayers(category, type, true);
                    });
                }
            });

            // Filter button events
            $('#side-bar .side-bar-button').off('click').on('click', function() {
                $(this).toggleClass('inactive');
                toggleHideIcons();
                let t = $(this).attr('label'),
                    ia = $(this).hasClass('inactive');

                // Set a cookie for reload

                K.filters = Cookies.get('filters') || {};
                K.filters[t] = ia;
                Cookies.set('filters', K.filters, K.expires);

                // Add the layers to the shown or hidden groups
                showHideLayers($(this).attr('set'), t, ia);
            });

            $('#side-bar .hide-all').off('click').on('click', function() {
                showHideAllLayers(!$(this).hasClass('hidden'));
                toggleHideIcons();
            });

            $('#side-bar .hide-some').off('click').on('click', function() {
                showHideCategory($(this).attr('category'), !$(this).hasClass('hidden'));
                toggleHideIcons();
            });

            $('#side-bar .hide-complete').off('click').on('click', function() {
                if (K.completeHidden) {
                    $(this).removeClass('hidden').text('Hide Complete');
                    K.completeHidden = false;
                } else {
                    $(this).addClass('hidden').text('Show Complete');
                    K.completeHidden = true;
                }

                Cookies.set('completeHidden', K.completeHidden);
                K.complete.showHide();
            });

            K.complete.showHide();
            toggleHideIcons();

            $('#side-bar .collapse').off('click').on('click', function() {
                let icon = $('.icon', this),
                    list = $(this).parent().nextUntil('.sub.title');

                if (icon.hasClass('hidden')) {
                    list.each(function(i, el) {
                        $(this).show(400);
                    });

                    icon.removeClass('hidden');

                } else {
                    list.each(function(i, el) {
                        $(this).hide(400);
                    });

                    icon.addClass('hidden');
                }
            });

            // Credits
            $(sb).append(K.credits);

            // Show side bar if it was open before 
            if (Cookies.get('sideBar') && !Cookies.get('cleanMenu')) {
                let a = Cookies.get('sideMenu');
                $('#side-bar, #side-bar .' + a).addClass('active ' + a);
            }

            polyHoverAnimation();

            $('[title!=""]').qtip({
                position: {
                    viewport: $('#mapid'),
                    my: 'left center',
                    at: 'right center'
                },
                style: {
                    classes: 'tooltip-style'
                },
                show: {
                    delay: 250,
                    solo: true
                },
                hide: {
                    event: 'click mouseleave'
                }
            });

            $(document).on('mouseover', '[title!=""]', function(e) {

                if ($(this).attr('title')) {

                    $(this).removeAttr('oldtitle');
                    $(this).qtip('destroy', true);
                    $(this).qtip({
                        position: {
                            viewport: $('#mapid'),
                            my: 'left center',
                            at: 'right center'
                        },
                        style: {
                            classes: 'tooltip-style'
                        },
                        show: {
                            delay: 250,
                            solo: true
                        },
                        hide: {
                            event: 'click mouseleave'
                        }
                    });
                    $(this).qtip('toggle', true);
                }
            });

            setTimeout(function() {
                $('#survival-logo').fadeOut(1000);
            }, 1000);

            $('.paypalBtn').off('click').on('click', function() {
                $('#side-bar .filters .paypalBtn').closest('form').submit();
            });

        };

        $.ajax({
            type: 'POST',
            url: 'includes/file_exists.php',
            data: {
                data: K.user.name
            }
        }).done(function(a) {

            a = $.parseJSON(a);
            K.userPath = a ? 'data/' + K.user.name + '/geoJSON.json' : 'data/empty.json';

            $.ajax({
                type: 'POST',
                url: 'includes/file_date.php',
                data: {
                    path: K.userPath
                }
            }).done(function(data) {

                data = $.parseJSON(data);

                $.getJSON(`${K.userPath}?v=${data.date}`, function(userJSON) {

                    $.ajax({
                        type: 'POST',
                        url: 'includes/file_date.php',
                        data: {
                            path: 'data/geoJSON.json'
                        }
                    }).done(function(data) {

                        data = $.parseJSON(data);

                        $.getJSON(`data/geoJSON.json?v=${data.date}`, function(geoJSON) {

                            // clear all layers before adding the loaded ones
                            $.each(K.group.feature, function(i, mode) {
                                $.each(mode, function(j, group) {
                                    group.clearLayers();
                                    K.myMap.removeLayer(group);
                                });
                            });

                            K.map.type.counts = {};
                            K.complete.layers = [];
                            K.timed.layers = [];

                            // merge the user data with the main data
                            userJSON.features && $.extend(geoJSON.features, userJSON.features);
                            K.layer = $.extend({}, geoJSON.settings, userJSON.settings || {});

                            // change the incoming variables to the correct variable type
                            $.each(K.layer, function(type, obj) {
                                $.each(obj.o, function(set, val) {
                                    K.layer[type].o[set] = toCorrectType(set, val);
                                });
                            });

                            $.each(geoJSON.features, function(id, feature) {
                                populateMap(feature, id);
                            });

                        }).done(function() { populateMenus(); });
                    });
                });
            });
        });
    });
} /*=====  End of PAGE LOAD  ======*/

// Donate
/////////
function doDonator() {

    $.ajax({
        type: 'POST',
        url: 'includes/process_donator.php',
        data: {
            email: $('#donator').val()
        }
    }).done(function(a) {
        a = $.parseJSON(a);
        if (a.success) {
            $('#side-bar .login .success').html(a.success);
            $('#side-bar .login .error').html('');
            $('#donator').val('');
        } else {
            $('#side-bar .login .error').html(a.error);
            $('#side-bar .login .success').html('');
        }
    });
}

// Login
/////////
function doLogin() {

    _this = document.getElementById('login');
    formhash(_this, _this.password);

    $.ajax({
        type: 'POST',
        url: 'includes/process_login.php',
        data: {
            email: _this.username.value,
            p: _this.p.value
        }
    }).done(function(a) {

        if (Cookies.get('username')) {
            K.user.name = Cookies.get('username');
            K.user.type = Cookies.get('usertype');
            K.user.getData();
        }

        if (!Cookies.get('donate')) {
            $('#alert').show();
        } else {
            $('#alert').hide();
        }

        if (a) {
            $('#side-bar .login .side-content').html(a);
            K.check.doOnce = true;
            pageLoad();
        }
    });
}

// Register
////////////
function doRegister() {

    _this = document.getElementById('regform');
    if (!regformhash(_this, _this.username, _this.email, _this.password, _this.confirmpwd)) {

        $('#side-bar .login .error').html(K.user.error);
        return;
    }

    $.ajax({
        type: 'POST',
        url: 'includes/process_register.php',
        data: {
            username: _this.username.value,
            email: _this.email.value,
            p: _this.p.value
        }
    }).done(function(a) {
        a = a.bMatch(/^(\{|\[])".*(\}|\])$/) ? $.parseJSON(a) : a;
        if ($.type(a) == 'object' && a.error)
            $('#side-bar .login .error').html(a.error);
        else
            $('#side-bar .login .side-content').html(a);
    });
}

// Reset
////////////
function doReset() {

    _this = document.getElementById('reset');
    if (!resetformhash(_this, _this.password, _this.confirmpwd)) {

        $('#side-bar .login .error').html(K.user.error);
        return;
    }

    $.ajax({
        type: 'POST',
        url: 'includes/process_reset.php',
        data: {
            token: K.urlParam('token'),
            p: _this.p.value
        }
    }).done(function(a) {

        a = a.bMatch(/^(\{|\[])".*(\}|\])$/) ? $.parseJSON(a) : a;
        if ($.type(a) == 'object' && a.error)
            $('#side-bar .login .error').html(a.error);
        else
            window.location.href = window.location.href.split('?')[0];

    });
}

// Forgot
////////////
function doForgot() {

    _this = document.getElementById('forgot');

    $.ajax({
        type: 'POST',
        url: 'includes/process_forgot.php',
        data: {
            email: _this.email.value
        }
    }).done(function(a) {

        let result = a.bMatch(/^(\{|\[])".*(\}|\])$/) ? $.parseJSON(a) : a;

        $.ajax({
            url: 'includes/login.php'

        }).done(function(b) {

            b && $('#side-bar .login .side-content').html(b);

            if ($.type(result) == 'object') {

                if (result.error)
                    $('#side-bar .login .error').html(result.error);
                if (result.success) {
                    $('#side-bar .login .success').html(result.success);
                }
            }
        });

    });
}

function randomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}

//////////////////////////////////////////////////////
//
//             Shortcuts
//
//////////////////////////////////////////////////////   
function keypressEvent(e) {

    if (!K.user.type || K.tool.layer.isOpen() || !K.bar.b.power.enabled())
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
};

//////////////////////////////////////////////////////
//
//            Draw Event Created
//
//////////////////////////////////////////////////////
function drawEventCreated(e) { // MARK: Draw Event Created
    let layer = e.layer,
        type = e.layerType,
        popup = false,
        copy = Cookies.get('copy') || {},
        color, def = 'marker';

    // Marker
    // ----------------------
    if (type == 'marker') {

        let selected = $('#marker-tools a.enabled');

        if (K.tool.marker.enabled() && selected.length) {

            let lvl = $('input[name="radio"]:checked').val(),
                cat = selected.attr('category'),
                typ = selected.attr('type'),
                j = K.tool.marker.layers[K.mode][cat][typ],
                p = j.o;

            lvl = (lvl ? ' ' + lvl : '');
            popup = j.p;
            color = $.type(popup) === 'object' && K.in('options', popup) ? popup.options.className : '';

            layer = createMarker($.extend({}, p, {
                id: ID(),
                latlng: layer._latlng,
                className: `${p.className}${lvl} ${p.group} ${color}`
            }));

        } else {

            icon = $.type(mark = copy.marker) == 'object' ? mark : K.map.defaults.marker;

            layer = createMarker($.extend({}, icon, {
                id: ID(),
                latlng: layer._latlng
            }));
        }

        layer.markComplete();
    }

    if (type != 'marker') { // Circle / Polyline / Polygon / Rectangle

        def = type != 'polyline' ? 'polygon' : type;
        let obj = copy[def] || K.map.defaults[def];

        if ($.type(obj) == 'object') {

            let ll = layer._latlng;
            if (type == 'polyline') ll = layer._latlngs.removeDupes();
            else if (K.has(type, ['polygon', 'rectangle'])) ll = layer._latlngs[0].removeDupes();

            $.extend(obj, {
                id: ID(),
                pane: (obj.className == 'poly-hover' ? 'zonePane' : 'overlayPane'),
                mode: obj.mode || K.mode,
                shape: type
            });

            if (type == 'circle') obj.radius = layer._mRadius;

            layer = L[type](ll, obj);

        }
    }

    o = popup || copy[def + 'Popup'] || {};

    // Bind a popup to the new layer
    if (o.content || !K.empty(o.list))
        layer.bindPopup(o);

    // Add the new layer to the map
    layer.options.creator = K.user.name;
    layer.options.group = layer.options.group || 'group08';

    K.group.mode[layer.options.group].addLayer(layer);

    layer.on('click', K.tool.layer.show);
    layer.options.complete && layer.options.shape === 'marker' && layer.on('contextmenu', function() {
        this.toggleCompleted(true);
    });

    layer.saved(false);

    switchLayerGroups();
    polyHoverAnimation();
}

function setCollectionData() {

    $('#side-bar .img-check').removeClass('checked');

    $.ajax({
        type: 'POST',
        url: 'includes/collection_data_get.php'
    }).done(function(a) {

        Cookies.json = true;

        setData = a.bMatch(/(\{|\[])".*(\}|\])/) ? $.parseJSON(a) : false;

        if (!setData) {
            let setData1 = Cookies.getJSON('setData1');
            let setData2 = Cookies.getJSON('setData2');
            if ($.type(setData1) === 'object' && $.type(setData2) === 'object')
                setData = $.extend({}, setData1, setData2);
        }

        setData && $.each(setData, function(index, val) {
            val && $(`#side-bar .img-check[name="${index}"]`).addClass('checked');
        });
        updateSetCounter();
    });
}

function updateSetCounter() {

    $('.set-piece').each(function(index, el) {

        let count = $(this).find('.img-check.checked').length;

        $(this).find('.counter').html(count || '');
        $(this).find('.set-bonus').removeClass('active');

        for (let i = count; i > 0; i--) {
            $(this).find('.set-bonus.' + i).addClass('active');
        }
    });

    let checks = '#side-bar .img-check',
        total = $(checks).length,
        got = $(checks + '.checked').length,
        left = total - got,
        counters = $('#side-bar .counter'),
        totalSets = counters.length,
        sets = 0,
        m;

    counters.each(function(index, el) {
        $(this).text() == 6 && sets++;
    });

    // Collect and store the data for reload
    let setData = {};
    $(checks).each(function(index, el) {
        setData[$(this).attr('name')] = $(this).hasClass('checked');
    });

    $('#side-bar .warning').html('');

    if (!K.user.type) {
        $('#side-bar .warning').html("This data is stored as a cookie, if you would\
            like it to be persistant, please create an account or sign in.");

        let setData1 = {};
        let setData2 = setData;

        while (K.length(setData1) < K.length(setData2)) {
            let key = Object.keys(setData2)[0];
            setData1[key] = setData2[key];
            delete setData2[key];
        }

        Cookies.set('setData1', setData1, K.expires);
        Cookies.set('setData2', setData2, K.expires);

    } else {

        $.ajax({
            type: 'POST',
            url: 'includes/collection_data_set.php',
            data: {
                setData: JSON.stringify(setData)
            }
        }).done(function(a) {

            Cookies.remove('setData');
        });
    }

    translator();
}

function empty(obj) {
    if ($.type(obj) != 'boolean') {
        obj.remove();
        obj = false;
    }
}

function removeEmpty(obj) {
    let typ = $.type(obj) == 'array';

    $.each(obj, function(i, v) {

        if (K.has($.type(v), ['object', 'array']))

            obj[i] = removeEmpty(v);

        let t = $.type(v);

        if ((t == 'string' && !v) ||
            (t == 'object' && !K.length(v)) ||
            (t == 'array' && !v.length) ||
            (t == 'function'))

            typ ? obj.splice(i, 1) : delete obj[i];
    });

    return obj;
}

function sortObjByKeys(object) {
    let keys = Object.keys(object),
        rObj = {};

    keys.sort(naturalCompare);

    $.each(keys, function(i, v) {
        rObj[v] = object[v];
    });

    return rObj;
}

function addToFeatureGroups(layer) {
    let m = layer.options.mode,
        g = layer.options.group;
    layer.currentGroup = g;
    $.each(K.modes.get, function(i, mode) {
        (mode in m) && K.group.feature[mode][g].addLayer(layer) &&
            K.group.feature[mode].everyLayer.addLayer(layer);
    });
}

function polyHoverAnimation(stop) {
    let polys = $('path.leaflet-interactive:not(.poly-hover):not([fill="none"])');

    polys.off('mouseover mouseout');

    if (stop)
        return;

    polys.on('mouseover', function() {
        let _this = $(this),
            cls = _this.attr('class').split(' ');

        $.each(cls, function(i, c) {
            if (c.contains('phg'))
                _this = $('path.' + c);
        });

        _this.addClass('hover');

    }).on('mouseout', function() {
        let _this = $(this),
            cls = _this.attr('class').split(' ');

        $.each(cls, function(i, c) {
            if (c.contains('phg'))
                _this = $('path.' + c);
        });

        _this.removeClass('hover');
    });
}

function editIconMessage() {

    let editIcon = $('.leaflet-editing-icon'),
        elMessage = $('#message'),
        elWarning;

    if (!elMessage.children('.message').length)
        elMessage.append('<div class="message"></div>');

    elWarning = elMessage.children('.message');

    editIcon.length > 1000 && elWarning.text('There are ' + editIcon.length + ' editing icons, \
		you may want to switch groups to speed things up!');

    elWarning.text('');
    K.check.editing && setTimeout(editIconMessage, 2000);
}

function setGridRotate(reset) {

    let grid = $('.leaflet-overlay-pane').children().last();

    if (grid.attr('src') != 'images/grid.svg')
        return

    let gridM = grid.css('transform').split(',');

    K.grid.x = (!K.grid.x || reset ? gridM[4] : K.grid.x);
    K.grid.y = (!K.grid.y || reset ? gridM[5].replace(')', '') : K.grid.y);
    K.grid.r = Cookies.get('grid-rotate') || 0;

    let gridXAlt = Cookies.get('grid-x-pos') || 0,
        gridYAlt = Cookies.get('grid-y-pos') || 0;

    Number(K.grid.x);
    Number(K.grid.y);
    Number(K.grid.r);
    Number(gridXAlt);
    Number(gridYAlt);

    let css = `translate3d(${K.grid.x * (gridXAlt / 100000 + 1)}px, 
        ${K.grid.y * (gridYAlt / 100000 + 1)}px, 0px) rotate(${K.grid.r}deg)`;

    grid.css({
        transformOrigin: 'center',
        transform: css
    });
}

function toggleHideIcons() {
    if (!$('#side-bar .side-bar-button:not(.inactive)').length)
        $('#side-bar .hide-all').addClass('hidden');
    else
        $('#side-bar .hide-all').removeClass('hidden');

    $('#side-bar .filters .side-content').children('').each(function() {
        if ($(this).hasClass('sub')) {
            let group = $(this).nextUntil('.sub, div'),
                count = 0;

            group.each(function() {
                $(this).hasClass('inactive') && count++;
            });

            $('.hide-some', this).removeClass('hidden');
            count == group.length && $('.hide-some', this).addClass('hidden');
        }
    });
}

//////////////////////////////////////////////////////
//
//             Create Marker
//
//////////////////////////////////////////////////////
function createMarker(p) { // MARK: Create Marker

    !p.mode && (p.mode = {
        [K.mode]: {}
    });

    const i = K.getSetting(p, 'iconUrl');

    // new settings happen here
    return L.marker(p.latlng, $.extend(p, {
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

function createIcon(options) {
    return L.divIcon($.extend({
        iconUrl: '',
        iconSize: '',
        html: '',
        className: '',
        done: false,
        time: false,
        mode: {}
    }, options));
}

function showHideAllLayers(show) {
    $.each(K.map.type[K.mode], function(category, array) {
        $.each(array, function(type, i) {
            let btn = $(`[set="${category}"][label="${type}"]`);

            btn.removeClass('inactive');
            show && btn.addClass('inactive');

            K.filters = Cookies.get('filters') || {};
            K.filters[type] = show;
            Cookies.set('filters', K.filters, K.expires);

            showHideLayers(category, type, show);
        });
    });
}

function showHideCategory(category, show) {
    $.each(K.map.type[K.mode][category], function(type) {
        let btn = $(`[set="${category}"][label="${type}"]`);

        btn.removeClass('inactive');
        show && btn.addClass('inactive');

        K.filters = Cookies.get('filters') || {};
        K.filters[type] = show;
        Cookies.set('filters', K.filters, K.expires);

        showHideLayers(category, type, show);
    });
}

// Used to show hide layers based on attributes
function showHideLayers(category, type, h) {

    switchLayerGroups(true);

    let g, show, hide, group;
    // Find which group to look in
    $.each(K.map.group, function(grp, a) {
        if (K.has(type, a)) {
            g = K.group.mode[grp];

            show = (h ? K.group.mode.groupHidden : g);
            hide = (h ? g : K.group.mode.groupHidden);

            group = (h ? 'groupHidden' : grp);

            show && hide && hide.eachLayer(function(l) {
                let i = l._leaflet_id;
                if (l.options.type == type && l.options.category == category) {
                    show.addLayer(hide.getLayer(i));
                    hide.removeLayer(i);

                    l.currentGroup = group;
                }
            });
        }
    });

    switchLayerGroups();
    polyHoverAnimation();
}

function toCorrectType(setting, value) {
    if (!K.settings.main[setting]) return value;
    const type = K.settings.main[setting].type;
    if (type == 'number')
        return Number(value);
    else if (type == 'boolean') {
        return value == 'true' ? true : value == 'false' ? false : !!value;
    }

    if (setting == 'mode') {
        $.each(value, function(mode, val) {
            if (K.empty(val) && K.type(val) == 'array') value[mode] = {};
        });
    }

    return value;
}

// Check if the key is in the object then place it if not
function addSet(i, v, shape) {
    if ($.type(v) == 'array')
        v = v.join(',');
    if (v) {
        shape = K.has(shape, ['rectangle', 'circle']) ? 'polygon' : shape;
        !(v in i) && (i[v] = { shape: [] });
        !K.has(shape, i[v].shape) && i[v].shape.push(shape);
    }
}

function offset(latlng, oLat, oLng) {
    if (oLat)
        latlng.lat += oLat;
    if (oLng)
        latlng.lng += oLng;
    return latlng;
}

function textColor(hex) {
    hex = hex.substring(1), // strip #
        rgb = parseInt(hex, 16), // convert rrggbb to decimal
        r = (rgb >> 16) & 0xff, // extract red
        g = (rgb >> 8) & 0xff, // extract green
        b = (rgb >> 0) & 0xff, // extract blue
        luma = 0.2126 * r + 0.7152 * g + 0.0722 * b; // per ITU-R BT.709

    return (luma < 40 ? '#ffffff' : '#000000');
}

function removeLayer(layer, group, del) {
    let grp = group || layer.options.group,
        id = layer._leaflet_id;
    del && K.save.delete(layer);
    K.group.draw.removeLayer(id);
    $.each(K.modes.get, function(i, mode) {
        K.group.feature[mode][grp].removeLayer(id);
    });
}

// Create a L.point from array or separate numbers
function createPoint(e, f) {
    if (!$.isArray(e))
        return L.point(e, f);
    return L.point(e[0], e[1]);
}

// Used to add whole groups to and from the Draw Control layer
function switchLayerGroups(d) {

    // $.ajax({
    //     url: 'includes/check_login.php'

    // }).done(function(a) {

    //     a = $.parseJSON(a);
    //     K.user.name = a.username || false;
    //     K.user.type = a.usertype || 0;

    // Remove current layers in the K.group.draw to original group
    $.each(K.group.draw._layers, function(i, l) {

        l.editing.currentGroup = l.options.group;
        K.group.mode[l.options.group].addLayer(K.group.draw.getLayer(i));
        K.group.draw.removeLayer(i);
    });

    // Move layers to drawLayer
    !d && $.each(K.group.mode, function(j, g) {

        g.eachLayer(function(l) {
            if ((K.map.active[l.options.type] && (l.options.creator == K.user.name || K.user.type > 3)) ||
                l.editing.edit) {
                l.editing.currentGroup = 'drawLayer';
                K.group.draw.addLayer(K.group.mode[l.options.group].getLayer(l._leaflet_id));
                K.group.mode[l.options.group].removeLayer(l._leaflet_id);
            }
        });
    });

    K.myMap.removeLayer(K.group.draw).addLayer(K.group.draw).addLayer(K.group.mode.groupAll);

    // Show and hide layers after the change
    onZoomEnd(true);
    // });
}

//////////////////////////////////////////////////////
//
//             Save to geoJSON
//
//////////////////////////////////////////////////////
function createGeoJSON() { // MARK: Create GeoJSON

    $('#settings-menu').remove();

    K.backup = K.user.name;

    K.checkLogin(() => {

        if (K.backup != K.user.name) {
            alert('I\'m sorry but your account information is incorrect, you cannot save your changes! Please log in and try again!');
            return;
        }

        K.msg.show({
            msg: 'SAVING...',
            dots: true
        });

        let feature;
        const geoData = {
            features: {},
            settings: {},
            deleted: K.save.deleted
        };

        // Switch the groups back to their correct homes first
        switchLayerGroups(true);

        // pull in the global settings that have changed
        $.each(K.layer, function(type, obj) {
            const s = geoData.settings;

            if (!obj.changed) return;
            !s[type] && (s[type] = {});
            !K.empty(obj.o) && (s[type].o = obj.o);
            !K.empty(obj.p) && (s[type].p = obj.p);
        });

        // Go though each layer
        K.save.unsaved.eachLayer(function(layer) {

            const o = layer.options,
                id = o.id,
                sets = {},
                pop = {},
                type = o.type;

            // clear the empty mode objects
            $.each(o.mode, function(mode, obj) {
                K.in('o', obj) && K.empty(obj.o) && delete obj.o;
                K.in('p', obj) && K.empty(obj.p) && delete obj.p;
            });

            // remove the classes that were not added for aesthetics
            layer.removeClass(K.classRemoval);

            feature = { c: o.creator }
            type && (feature.t = type);

            // create the feature
            if (o.shape == 'circle') { // Circle
                feature.g = {
                    t: 'circle',
                    c: K.valuesToString(layer._latlng),
                    r: layer._mRadius.toString()
                };

            } else if (o.shape == 'marker') { // Marker
                feature.g = {
                    t: 'marker',
                    c: K.valuesToString(layer._latlng)
                };

                o.iconUrl && delete o.html;
                o.className = K.stripClasses(o.className);

            } else { // Polyline, Polygon and Rectangle
                feature.g = {
                    t: o.shape,
                    c: K.valuesToString(layer._latlngs)
                };
            }

            // only add settings that have definitely changed 
            $.each(o, function(i, v) {
                if (K.has(i, K.map.property[o.shape])) {
                    const sv = type && K.layer[type] ? K.layer[type].o[i] : 'false',
                        sm = K.settings.main;

                    if (sv == 'false' || !K.equals(sv, v)) // do this if there is a type
                        sets[i] = i in sm && sm[i].type == 'number' ? v.toString() : v;
                }
            });

            // push the changed settings into the feature
            !K.empty(sets) && (feature.o = sets);

            // grab the popup if it is different from the original
            if (layer.popup && layer.popup.content) {

                const p = layer.popup;
                const sv = K.layer[type] ? K.layer[type].p : {};

                p.className != sv.className && (pop.className = p.className);

                if (p.list && p.list.title) // set up with list only
                    !K.equals(sv.list, p.list) && (pop.list = p.list);
                else // set up with content
                    sv.content != p.content && (pop.content = p.content);

                // Set popup content to variable if one exists
                $.each(K.popupContent, function(k, s) {
                    pop.content == s && (pop.content = k);
                });
            }

            // push the changed popup settings into the feature
            !K.empty(pop) && (feature.p = pop);

            // Push the new item into the feature object
            geoData.features[id] = feature;
        });

        console.log('saved data...', geoData);
        // console.log(JSON.stringify(geoData));
        // return;
        // Save this all to a file
        $.ajax({
            type: 'POST',
            url: 'includes/write.php',
            data: {
                data: JSON.stringify(geoData)
            }

        }).done(function(a) {

            a = a.bMatch(/^(\{|\[])".*(\}|\])$/) ? $.parseJSON(a) : a;
            if ($.type(a) == 'object' && a.message) {
                alert(a.message);

            } else {

                // Disable the save button and clear the editing from the modified layers
                K.bar.b.save.disable();

                K.save.unsaved.clearLayers();
                K.save.deleted = [];

                polyHoverAnimation();
                K.msg.hide();
                pageLoad();
            }
        });
    });

}

function toggleFullScreen() {

    if (!document.fullscreenElement && !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {

        if (document.documentElement.requestFullscreen)
            document.documentElement.requestFullscreen();
        else if (document.documentElement.msRequestFullscreen)
            document.documentElement.msRequestFullscreen();
        else if (document.documentElement.mozRequestFullScreen)
            document.documentElement.mozRequestFullScreen();
        else if (document.documentElement.webkitRequestFullscreen)
            document.documentElement.webkitRequestFullscreen(Element.ALLOWKEYBOARD_INPUT);

    } else {

        if (document.exitFullscreen)
            document.exitFullscreen();
        else if (document.msExitFullscreen)
            document.msExitFullscreen();
        else if (document.mozCancelFullScreen)
            document.mozCancelFullScreen();
        else if (document.webkitExitFullscreen)
            document.webkitExitFullscreen();
    }
}

function fixNum(s) {
    return (Number(s) ? Number(s) : s)
}

function polyType(l) {
    return l.length == 1 && l[0].length == 4 && l[0][0].lat == l[0][3].lat && l[0][0].lng == l[0][1].lng ?
        'rectangle' : l[0].lat ? 'polyline' : 'polygon';
}

// Get the layer type for the show hide menu
function getType(o, g, a) {
    if (!K.has(a, ['marker', 'polyline', 'polygon']))
        return '';
    let type = '';
    o = o.replace('images/', '');
    $.each(K.map.type, function(h, tg) {

        $.each(tg[a], function(i, v) {

            if (K.has(o, v)) {
                type = i;
                return;
            }
        });
        if (type) return;
    });
    return type;
}

function getMode(type) {
    fMode = 'all';
    $.each(K.map.mode, function(mode, array) {
        if (K.has(type, array)) {
            fMode = mode;
            return;
        }
    });
    return fMode;
}

function setAllLayerClick() {
    let layers = K.group.feature[K.mode].everyLayer;

    layers.eachLayer(function(l) {

        l.off('click');

        if (K.check.grabbing) {
            l.on('click', function() {
                return this.options.id;
            });

        } else {
            // Add the Layer editing tools on click if you created it
            K.user.type && (K.user.type >= 4 || l.options.creator.toLowerCase() == K.user.name.toLowerCase()) &&
                l.on('click', K.tool.layer.show);
        }
    });
}

// Functions to show and hide layers based on zoom level and wether editing the layer
function onZoomEnd() {
    setGridRotate(true);
    zoom = K.myMap.getZoom();

    let classes = '';
    for (let i = 7; i < 12; i++) {
        classes += ` z${i}`;
    }

    $('#mapid').removeClass(classes);
    $('#mapid').addClass(`z${Math.floor(zoom)}`);

    $.each(K.group.mode, function(g, n) {
        let a = g.replace('group', '');
        a = a.contains('_') ? a.split('_') : a.bMatch(/\d+/) ? Number(a) :
            K.has(a, ['Hidden', 'Complete', 'everyLayer']) ? false : 0;

        if ((typeof a == 'number' && zoom >= a - 1) || (typeof a == 'object' && zoom >= a[0] - 1 && zoom <= a[1] + 1)) {
            K.myMap.addLayer(K.group.mode[g])
        } else
            K.myMap.removeLayer(K.group.mode[g])
    });
}

function urlExists(url, callback) {
    $.ajax({
        type: 'HEAD',
        url: url,
        success: function() {
            callback(true);
        },
        error: function() {
            callback(false);
        }
    });
}

function setSelectionRange(input, selectionStart, selectionEnd) {
    if (input.setSelectionRange) {
        input.focus();
        input.setSelectionRange(selectionStart, selectionEnd);
    } else if (input.createTextRange) {
        let range = input.createTextRange();
        range.collapse(true);
        range.moveEnd('character', selectionEnd);
        range.moveStart('character', selectionStart);
        range.select();
    }
}

function setCaretToPos(input, posA, posB) {
    setSelectionRange(input, posA, (posB || posA));
}

let ID = function() {
    return '_' + Math.random().toString(36).substr(2, 9);
};

function arraysEqual(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length != b.length) return false;

    // If you don't care about the order of the elements inside
    // the array, you should sort both arrays here.

    a.sort();
    b.sort();

    for (let i = 0; i < a.length; ++i) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

let tagsToReplace = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;'
};

function replaceTag(tag) {
    return tagsToReplace[tag] || tag;
}

function safeTags(str) {
    return str.replace(/[&<>]/g, replaceTag);
}

function hideAlert() {
    $('#alert').hide();
}

function naturalCompare(a, b) {
    let ax = [],
        bx = [];

    a.replace(/(\d+)|(\D+)/g, function(_, $1, $2) {
        ax.push([$1 || Infinity, $2 || ''])
    });
    b.replace(/(\d+)|(\D+)/g, function(_, $1, $2) {
        bx.push([$1 || Infinity, $2 || ''])
    });

    while (ax.length && bx.length) {
        let an = ax.shift();
        let bn = bx.shift();
        let nn = (an[0] - bn[0]) || an[1].localeCompare(bn[1]);
        if (nn) return nn;
    }

    return ax.length - bx.length;
}