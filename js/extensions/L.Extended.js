import { jQuery as $ } from '../jQuery/jquery3.4.1.js';
import { L } from '../Leaflet/importer.js';
import { K, classesToArray, stripAndCollapse } from '../K.js';
import { createGeoJSON } from '../functions/to-geo-json.js';
import { createIcon } from '../functions/create-marker.js';

// MARK: [L] Map (Popup)
L.Map.include({
    openPopup: function(popup, latlng, options) {
        if (!(popup instanceof L.Popup)) {
            popup = new L.Popup(options).setContent(popup);
        }

        if (latlng) {
            popup.setLatLng(latlng);
        }

        if (this.hasLayer(popup)) {
            return this;
        }

        if (popup.options.type != 'marker') {

            if (this._detail && this._detail.options.autoClose) {
                this.closeDetail();
            }

            this._detail = popup;
            return this.addLayer(popup);
        }

        if (this._popup && this._popup.options.autoClose) {
            this.closePopup();
        }

        this._popup = popup;

        return this.addLayer(popup);
    },

    closePopup: function(popup) {
        if (!popup || popup === this._popup) {
            popup = this._popup;
            this._popup = null;
        }
        if (popup) {
            this.removeLayer(popup);
        }
        return this;
    },

    closeDetail: function(popup) {
        if (!popup || popup === this._detail) {
            popup = this._detail;
            this._detail = null;
        }
        if (popup) {
            this.removeLayer(popup);
        }
        return this;
    }
});

// MARK: [L] Layer (Popup)
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

        if (this.isPopupOpen()) return this;

        let content = this.getSetting('content', true) || this.getSetting('list', true);
        this._popup.setContent(content);

        if (!latlng)
            latlng = layer.getCenter ? layer.getCenter() : layer.getLatLng();

        if (!this._popup._content) return this;

        if (this._popup && this._map) {
            // set popup source to this layer
            this._popup._source = layer;

            // update the popup (content, layout, ect...)
            this._popup.update();

            // open the popup on the map
            this._map.openPopup(this._popup, latlng);

            // console.log(this.getPopup().options, this._map.options, this.getPopup().getEvents());
        }

        return this;
    },

    bindPopup: function() {
        const a = arguments;
        let content = a[0],
            options = a[1] || {};
        if (K.type(a[0]) === 'object') {
            options = a[0];
            content = options.content;
        }

        this.popup = options;
        content = this.getSetting('content', true);

        let o = {
            className: this.getSetting('className', true),
            pane: this.options.shape == 'marker' ? 'popupPane' : 'messagePane',
            list: this.getSetting('list', true) || {},
            offset: L.point(-24, 42),
            closeButton: false,
            autoPan: false,
            minWidth: 15,
            maxWidth: 300,
            type: this.options.shape
        };

        if (!content && !K.empty(o.list))
            content = this.convertContent(o);

        if (!content) return this;

        content = content.bMatch(/^\$/) ? K.popupContent[content] : content;

        this._popup = new L.Popup(o, this);
        this._popup.setContent(content);

        if (!this._popupHandlersAdded) {
            this.on({
                click: this._openPopup,
                remove: this.closePopup,
                move: this._movePopup
            });

            this.on('mouseover click focus', this._openPopup);
            !K.keepPopupsOpen && this.options.shape == 'marker' && this.on('mouseout blur', this.closePopup);

            this._popupHandlersAdded = true;
        }

        return this;
    },

    convertContent: function(options) {
        let list = options.list,
            html = '',
            img, mark,
            gotList = list.list && list.list[0] && list.list[0].item;

        list.title && (html += list.title);

        const notes = [];

        K.each(list.subs, function(i, v) {
            let line = false;
            v.value && (line = `<p class="${v.color ? 'desc' : ''} ${v.note ? 'note' : ''}">
                    ${K.in(v.value.toLowerCase(), K.svg) ? K.svg[v.value.toLowerCase()] : ''}${v.value}
                </p>${v.line ? '<hr>' : ''}`);

            line && (v.note ? notes.push(line) : html += line)
        });

        if (gotList) {

            list.list.sort(function(a, b) {

                return (a.item < b.item ? -1 : a.item > b.item ? 1 : 0);
            });

            html += '<ul>';
            K.each(list.list, function(i, v) {

                if (!v) return true;

                mark = K.icons[v.item];
                img = `<img${mark ? ` src="${mark}"` : ''}>`;
                html += `<li>${img}<span>${v.item}</span><span class="qty">${v.qty > 1 ? '(x' + v.qty + ')' : ''}</span></li>`;
            });
            html += '</ul>';
        }

        K.each(notes, (i, v) => {
            i == 0 && gotList && (v = v.replace(/note"/, 'note bump"'));
            html += v;
        });

        return html;
    },

    closePopup: function() {

        if (this._popup && this._popup._content) {

            this._popup._close();
        }
        return this;
    },

    _openPopup: function(e) {
        var layer = e.layer || e.target;

        if (!this._popup) {
            return;
        }

        if (!this._map) {
            return;
        }

        // prevent map click
        L.DomEvent.stop(e);

        // if this inherits from Path its a vector and we can just
        // open the popup at the new location
        if (layer instanceof L.Path) {
            this.openPopup(e.layer || e.target, e.latlng);
            return;
        }

        // otherwise treat it like a marker and figure out
        // if we should toggle it open/closed
        if (this._map.hasLayer(this._popup) && this._popup._source === layer) {
            // this.closePopup();
        } else {
            this.openPopup(layer, e.latlng);
        }
    }
});

// MARK: [L] Layer (Complete)
// Included for layer complete functionality
L.Layer.include({
    toggleCompleted: function() {
        if (!this.getSetting('complete')) return;

        let pre = this.options.prerequisites,
            doIt = true;
        if (pre) {
            K.each(pre, function(i, id) {
                !K.complete.is(id) && (doIt = false);
            });
        }

        doIt && K.complete.toggle(this);
        doIt && this.markComplete();

        !doIt && K.msg.show({
            msg: 'Prerequisites are not met for this to be completed!',
            time: 4000
        });
    },

    setCompleted: function(done) {
        if (!this.getSetting('complete')) return;

        K.complete.set(done, this);
        this.markComplete();

    },

    markComplete: function() {
        if (!this.getSetting('complete')) return;

        // a initial check to see if this needs changing
        let done = this.complete = K.complete.is(this);
        if (!this.init && !done) {
            this.init = true;
            return;
        }
        this.init = true;

        // when timed, check it still needs the overlay 
        const time = this.options.time;
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
        else if (this.options.onComplete)
            this.updateStyle();

        if (!!this.options.link) {
            K.each(this.getLinked(), function() {
                if (this.complete != done)
                    this.setCompleted(done);
            });
        }

        if (done) K.complete.add(this);
        else K.complete.remove(this.options.id);

        K.complete.showHide();

        K.loaded && this.options.onComplete == 'toStoryMode' && K.setWorldTier();
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
});

// MARK: [L] Layer (Classes)
// Included for adding and removing classes to the layers
L.Layer.include({
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

// MARK: [L] Layer (Events)
L.Layer.include({

    initEvents: function() {
        this.on('contextmenu', function(e) {
            this.onContextMenu(e);
        });
    },

    onContextMenu: function(e) {
        this.closePopup();
        K.contextMenu.build(e, this);
    }
});

// MARK: [L] Polyline
L.Polyline.include({

    initialize: function(latlngs, options) {
        L.setOptions(this, options);

        // Added to condense the latlng to be more saveable
        if (K.in('shape', options)) {
            K.each(latlngs, (i, v) => {
                v.lat = L.Util.formatNum(v.lat);
                v.lng = L.Util.formatNum(v.lng);
            });
        }

        this._setLatLngs(latlngs);

        // this.options.creator && this.initEvents();
        this.initEvents();
    }
});

// MARK: [L] Circle
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

        this.initEvents();
        // this.options.creator && this.initEvents();
    }
});

L.Path.include({
    updateStyle: function() {
        if (this._renderer) {
            this._renderer._updateStyle(this);
        }
        return this;
    }
});

// MARK: [L] Marker
L.Marker.include({

    initialize: function(latlng, options) {
        L.setOptions(this, options);

        // Added to condense the latlng to be more saveable
        if (K.in('shape', options)) {
            latlng.lat = L.Util.formatNum(latlng.lat);
            latlng.lng = L.Util.formatNum(latlng.lng);
        }

        this._latlng = L.latLng(latlng);
        this.options.creator && (this.updateIcon());

        this.initEvents()

        this.options.cycle && K.cycle.add(this);
    },

    updateIcon: function(options = {}) {

        if (!this.options.icon) return this;

        const i = this.getSetting('iconUrl');

        this.options.icon = createIcon(K.extend({
            iconUrl: i,
            iconSize: this.getSetting('iconSize'),
            html: !i ? this.getSetting('html') : '',
            className: this.getSetting('className'),
            done: !this.options.onComplete && K.complete.is(this),
            time: K.complete.time(this),
            level: this.getSetting('level'),
            layer: this
        }, options));

        if (this._map) {
            this._initIcon();
            this.update();
        }

        this._popup && this.bindPopup(this.popup);

        return this;
    },

});

// MARK: [L] DivIcon
L.DivIcon.include({

    createIcon: function(oldIcon) {
        const o = this.options;

        const div = (oldIcon && oldIcon.tagName === 'DIV') ? oldIcon : document.createElement('div');

        let html = K.getSetting(o, 'html');
        (html || '').bMatch(/^\$/) && (html = K.htmlContent[html]);

        div.innerHTML = html || this.getIconHTML();
        o.layer && div.setAttribute('type', K.getSetting(o.layer.options, 'type'));

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

// MARK: [L] Icon
L.Icon.include({

    _setIconStyles: function(img, name) {
        let size, anchor, s, floor;
        const o = this.options,
            iz = `${name}Size`,
            cn = 'className',
            l = o.layer;

        if (!!l) {

            s = l.getSetting(iz);
            K.type(s) === 'number' && (s = [s, s]);

            size = L.point(s);
            anchor = L.point(name === 'shadow' && o.shadowAnchor || o.iconAnchor || size && size.divideBy(2, true));

            floor = (l.getSetting('level') || {}).floor || 0;
            floor = l._level != undefined ? l._level : floor < 0 ? 'underground' : floor > 0 ? 'overground' : '';

            img[cn] = `leaflet-marker-${name} ${l.getSetting(cn) || ''} ${l.getSetting(cn, true) || ''} ${floor} ${l.getSetting('group') || ''}`;

        } else {

            s = o[iz];
            K.type(s) === 'number' && (s = [s, s]);

            size = L.point(s);
            anchor = L.point(name === 'shadow' && o.shadowAnchor || o.iconAnchor || size && size.divideBy(2, true));

            img[cn] = `leaflet-marker-${name} ${o[cn] || ''}`;

        }

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
            o = layer.options;

        const c = layer.getSetting('className');

        c && L.DomUtil.addClass(path, c);
        o.interactive && L.DomUtil.addClass(path, 'leaflet-interactive');

        this._updateStyle(layer);
        this._layers[L.stamp(layer)] = layer;
    },

    _updateStyle: function(layer) {
        const path = layer._path,
            o = layer.options,
            stroke = layer.getSetting('stroke'),
            color = layer.getSetting('color'),
            opacity = layer.getSetting('opacity'),
            weight = layer.getSetting('weight'),
            fillColor = layer.getSetting('fillColor'),
            fillOpacity = layer.getSetting('fillOpacity');

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
            c = layer.getSetting('className');

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
            stroke = layer.getSetting('stroke'),
            color = layer.getSetting('color'),
            opacity = layer.getSetting('opacity'),
            weight = layer.getSetting('weight'),
            fill = layer.getSetting('fill'),
            fillColor = layer.getSetting('fillColor'),
            fillOpacity = layer.getSetting('fillOpacity');

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

// MARK: [L] DivOverlay
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

            if (K.mode == 'World Tier') {
                let rx = new RegExp('<p class="level">.+?</p>');
                if (content.bMatch(rx)) {
                    content = content.replace(rx, `<p class="level">
                        Level: <img src="images/mode-world-tier-${K.getWorldTier()}.svg" class="tier">
                    </p>`);
                }

                rx = new RegExp('<p.+>Level.+?</p>');
                if (content.bMatch(rx)) {
                    content = content.replace(rx, `<p class="description">
                        Level: <img src="images/mode-world-tier-${K.getWorldTier()}.svg" class="tier">
                    </p>`);
                }
            }

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

// MARK: [L] Popup
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

// MARK: [L] Control.Button
// Divmap custom button defaults
L.Control.Button = L.Control.extend({

    options: {
        position: 'topleft',
        container: 'map',
        text: '',
        title: 'Save all changes',
        css: 'save',
        clickFn: createGeoJSON
    },

    onAdd: function() {
        let control = 'leaflet-control',
            options = this.options,
            el = control + ' ' + options.container + ' leaflet-bar',
            container = document.getElementsByClassName(el)[0] || L.DomUtil.create('div', el);

        this._button = this._createButton(options.text, options.title,
            control + '-' + options.css, container, this._onClick);

        return container;
    },

    onRemove: function() {

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

    _onClick: function() {
        if (!this._disabled)
            this.options.clickFn();
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