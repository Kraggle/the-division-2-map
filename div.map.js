K.mapVersion = '0.1.28';

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
        var className = 'leaflet-disabled';

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
        var className = 'leaflet-disabled';

        if (!this._button) {
            this._button = document.getElementsByClassName('leaflet-draw-edit-' + this.type)[0];
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
        //this disable other handlers

        this._map.fire(L.Draw.Event.EDITSTART, {
            handler: this.type
        });
        //allow drawLayer to be updated before beginning edition.

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
        var className = 'leaflet-disabled';

        if (!this._button) {
            this._button = document.getElementsByClassName('leaflet-draw-edit-' + this.type)[0];
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
            for (var id in this._layers) {
                layer = this._layers[id];
                break;
            }
        }

        if (!this._popup._content) return this;

        this._popup.setContent(this.wrapContent(this._popup._content));

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

    bindPopup: function(content, options) {

        options = $.extend({
            className: "",
            pane: (options.className || '').contains('poly-info') ? "messagePane" : "popupPane",
            list: {},
            offset: L.point(-24, 42),
            closeButton: false,
            autoPan: false,
            minWidth: 15,
            maxWidth: 300
        }, options);

        if (!content && options.list.title)
            content = this.convertContent(options);

        content = this.wrapContent(content);

        if (content instanceof L.Popup) {
            L.setOptions(content, options);
            this._popup = content;
            content._source = this;

        } else if ($.type(content) == 'object' && '_content' in content && !content._content) {

            return this;

        } else {

            content = (content || "").bMatch(/^\$/) ? K.popupContent[content] : content;

            if (!this._popup || options) {
                this._popup = new L.Popup(options, this);
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
        var list = options.list,
            html = "",
            img, mark;

        if (list.title)
            html += list.title;

        $.each(list.subs, function(i, v) {
            var cls = v.color ? ' class="desc"' : '';
            if (v.value) html += `<p${cls}>${v.value}</p>`;
        });

        if (list.list && list.list[0] && list.list[0].item) {

            list.list.sort(function(a, b) {

                return (a.item < b.item ? -1 : a.item > b.item ? 1 : 0);
            });

            html += '<ul>';
            $.each(list.list, function(i, v) {

                if (!v) return true;

                var n = (v.item || '').replace(/ /g, '');
                $.each(K.tool.marker.layers, function(j, w) {
                    if (w[n])
                        mark = w[n];
                });

                img = `<img${mark ? ' src="' + mark.properties.icon.options.iconUrl + '"' : ''}>`;
                html += `<li>${img}<span>${v.item}</span><span class="qty">'${v.qty > 1 ? "(x" + v.qty + ")" : ""}</span></li>`;
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

    wrapContent: function(content) {
        return content;
        // console.log(content);
        // Wrap the content if it's too long
        var b = $('<div />', {
                id: "wrapBreaker"
            }).css({
                "position": "fixed",
                "left": "-50000px",
                "white-space": "nowrap"
            }).appendTo('body'),
            w = $('<div />', {
                id: "wrapHolder"
            }).css({
                "position": "fixed",
                "left": "-50000px"
            }).appendTo('body');

        w.html(content);

        $("p, li", w).each(function(i, el) {
            b.html('');

            var img = '';
            if ($("img", this).length)
                img = $("img", this).detach();

            var words = $(this).html().split(/<br>| /),
                last;

            b.html(img);

            for (const word of words) {
                if (!word.length) continue;
                last = b.html();
                b.html(last + ' ' + word);
                if (b.width() > 250) b.html(`${last}<br>${word}`);
            }

            $(this).html(b.html().trim());
        });

        content = $(w).html();

        b.remove();
        w.remove();

        // console.log(content);

        return content;
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

        var node = this._contentNode;
        var content = (typeof this._content === 'function') ? this._content(this._source || this) : this._content;

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
        var container = this._contentNode,
            style = container.style;

        // style.width = '';
        // style.whiteSpace = 'nowrap';

        var width = container.offsetWidth,
            height = container.offsetHeight;
        // width = Math.min(width, this.options.maxWidth);
        // width = Math.max(width, this.options.minWidth);

        if ($.trim(this._content).split(/ /).length > 1) {

            for (let i = width; i > 1; i--) {
                style.width = i + "px";
                if (container.offsetHeight > height) {
                    style.width = (i + 1) + "px";
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

// Adjustments for under and overground markers so they don't sit level 
L.Icon.include({

    _setIconStyles: function(img, name) {
        var options = this.options;
        var sizeOption = options[name + 'Size'];

        if (typeof sizeOption === 'number') {
            sizeOption = [sizeOption, sizeOption];
        }

        var size = L.point(sizeOption),
            anchor = L.point(name === 'shadow' && options.shadowAnchor || options.iconAnchor ||
                size && size.divideBy(2, true));

        img.className = 'leaflet-marker-' + name + ' ' + (options.className || '');

        if (anchor) {
            img.style.marginLeft = (-anchor.x) + 'px';
            img.style.marginTop = (-anchor.y) + 'px';

            if ((options.className || '').contains('overground'))
                img.style.marginTop = (-size.y) + 'px';
            else if ((options.className || '').contains('underground'))
                img.style.marginTop = 0;
        }

        if (size) {
            img.style.width = size.x + 'px';
            img.style.height = size.y + 'px';
        }
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
        var control = 'leaflet-control',
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
        var link = L.DomUtil.create('a', className, container);
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
        var className = 'leaflet-disabled';

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

Cookies.json = true;

K.extend({
    currentUpdate: "17/01/2018",
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
        doOnce: true
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
            if (r = Object.keys(this.unsaved._layers).length + this.deleted.length)
                K.bar.b.save.enable();
            else
                K.bar.b.save.disable();
            return r;
        }
    },
    lng: "en",
    map: {
        active: Cookies.get('activeMap') || [],
        group: {
            groupAll: [],
            groupDZ: ['n/a'],
            groupHidden: ['n/a'],
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
        property: {
            polygon: [
                "category", "color", "weight", "opacity", "fillColor",
                "fill", "fillOpacity", "stroke", "group", "shape",
                "type", "className", "id", "mode", "creator"
            ],
            polyline: [
                "category", "color", "weight", "opacity", "stroke",
                "group", "shape", "type", "className", "id", "mode", "creator"
            ],
            marker: [
                "category", "noIcon", "icon", "group", "type", "shape",
                "opacity", "id", "mode", "creator"
            ],
            popup: ["className"]
        },
        defaults: {
            marker: {
                category: "default",
                className: "anim-icon",
                group: "group08",
                iconSize: [22, 22],
                iconUrl: "images/marker-poi-contaminated.svg",
                mode: "all",
                shape: "marker",
                type: "Contaminated"
            },
            polygon: {
                category: "default",
                className: "",
                color: "#c22e2e",
                fill: 1,
                fillColor: "#672f2f",
                fillOpacity: 0.05,
                group: "group08",
                mode: "all",
                opacity: 0.4,
                pane: "overlayPane",
                shape: "polygon",
                smoothFactor: 1,
                stroke: 1,
                type: "ContaminatedZone",
                weight: 1
            },
            polyline: {
                category: "default",
                color: "#207e70",
                group: "groupAll",
                mode: "all",
                opacity: 1,
                pane: "overlayPane",
                shape: "polyline",
                smoothFactor: 1,
                stroke: 1,
                type: "",
                weight: 5
            }
        },
        settings: {
            counts: {
                category: [],
                iconUrl: [],
                iconSize: [],
                className: [],
                color: [],
                fillColor: [],
                popup: {
                    className: []
                },
                opacity: [],
                fillOpacity: [],
                fill: [true, false],
                interactive: [true, false],
                stroke: [true, false],
                weight: [],
                type: [],
                mode: [],
                group: []
            },
            marker: ["category", "type", "className", "iconUrl", "opacity", "iconSize", "html", "mode", "group", "id"],
            popup: ["className", "content", "list"],
            polygon: ["category", "type", "fill", "fillColor", "fillOpacity", "stroke", "color", "opacity", "weight", "className", "mode", "group", "id"],
            polyline: ["category", "type", "color", "opacity", "weight", "className", "mode", "group", "id"],
            types: {
                category: "string",
                className: "string",
                color: "string",
                fill: "boolean",
                fillColor: "string",
                fillOpacity: "number",
                group: "string",
                html: "string",
                iconSize: "array",
                iconUrl: "string",
                id: "string",
                mode: "string",
                opacity: "number",
                stroke: "boolean",
                type: "string",
                weight: "number"
            }
        },
        zIndex: ["PointOfInterest", "Hideout", "Contaminated", "Landmark", "CrashSite"],
    },
    mode: {
        get: Cookies.get('mode') || 'normal',
        not: function(mode = false, other) {
            if (!mode)
                return this.get == "normal" ? ["survival", "last stand", "survival last stand"] : ["normal", "survival", "normal survival"];
            return this.get == mode ? other : mode;
        }
    },
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


            var dot = '<div class="dot"></div>';

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
    pane: {},
    popupContent: {
        $rucksack: "<span class='title'>Rucksack</span><p>Could contain...</p><ul><li><img src='images/crate-clothing.svg'><span>Clothing</span><span class='qty'></span></li><li><img src='images/crate-food.svg'><span>Food</span><span class='qty'></span></li><li><img src='images/crate-drink.svg'><span>Drink</span><span class='qty'></span></li></ul>",
        $crateElite: "<span class='title'>Elite Crate</span><p>Contains a combination of...</p><ul><li><img src='images/crate-gear.svg'><span>Gear</span><span class='qty'></span></li><li><img src='images/crate-weapons.svg'><span>Weapon</span><span class='qty'></span></li><li><img src='images/crate-clothing.svg'><span>Clothing</span><span class='qty'></span></li><li><img src='images/crate-medication.svg'><span>Medication</span><span class='qty'></span></li><li><img src='images/crate-medkit.svg'><span>Medkit</span><span class='qty'></span></li><li><img src='images/crate-food.svg'><span>Food</span><span class='qty'></span></li><li><img src='images/crate-drink.svg'><span>Drink</span><span class='qty'></span></li></ul>"
    },
    shortcuts: {
        Draw: {
            M: "Marker",
            P: "Polygon",
            R: "Rectangle",
            L: "Polyline"
        },
        QuickMarker: {
            1: "Airdrop",
            2: "Component Zone",
            3: "Food Zone",
            4: "Water Zone",
            5: "Artifact",
            E: "Comms",
            A: "Echo",
            F: "Food",
            D: "Water",
            S: "Component",
            W: "Weapon",
            Q: "Gear",
            Z: "Ground Level",
            X: "Underground",
            C: "Overground"
        }
    },
    tool: {},
    user: {
        name: false,
        type: 0,
        error: false
    },
    local: {
        data: {},
        lang: false,
        email: (Cookies.get('email-check') != undefined ? Cookies.get('email-check') : true),
        total: 0,
        count: 0,
        languages: false,
        users: [],
        delete: {},
        save: {},
        update: function() {
            $.proxy(K.local._update(), K.local);
        },
        _update: function() {
            if (this.select) {
                var $t = $('#translate textarea'),
                    $c = $('.contribute'),
                    data = this.data[this.select];
                if (this.lang in data) {
                    $t.val(data[this.lang]);
                    $t.attr('original', data[this.lang]);
                    $c.show().children('.user').html(data[this.lang + "-user"]);
                } else {
                    $t.val('');
                    $t.attr('original', '');
                    $c.hide();
                }
            }

            if (this.lang) {
                this.total = 0;
                this.count = 0;
                $.each(this.data, function(k, v) {
                    // console.log(k, hex_sha512(k));
                    var $b = $('#' + hex_sha512(k)),
                        l = K.local;
                    // console.log(l.lang, v, l.lang in v);
                    if (l.lang in v) {
                        l.count++;
                        $b.addClass('got');
                    } else
                        $b.removeClass('got');
                    l.total++;
                });

                $('#translate .display').removeClass('blink-me');
                $('#translate .number').html(((this.count * 100) / this.total).toFixed(1));

                $.getJSON("data/languages.json", function(data) {
                    var l = K.local;
                    l.languages = data;
                    if (l.languages[l.lang].got)
                        $('#done-check a').addClass('checked');
                    else
                        $('#done-check a').removeClass('checked');
                });
            }
        }
    },
    modes: {
        get: ['normal', 'survival', 'last stand'],
        create: function() {
            $.each(this.get, function(index, mode) {
                K.group.feature[mode] = {};
                K.map.type[mode] = {};
            });
        }
    },
    updateMarker: function(icon) {
        var mark;
        icon = icon || (Cookies.get('copy') && $.type(mark = Cookies.get('copy').marker) == 'object' ? mark : {});

        var o = ('icon' in icon) ? icon.icon.options : {},
            url = 'images/marker-poi-contaminated.svg',
            options = {
                iconSize: o.iconSize || [22, 22],
                iconUrl: o.iconUrl || url,
                html: o.html || `<img class='halo' src='images/_a.svg'><img src='${o.iconUrl || url}' class='icon'>`,
                className: o.className || 'anim-icon'
            };

        if (!K.drawIcon) {

            // L.Control.Draw
            var createIcon = L.Icon.extend({ options: options });

            // Create the drawControl for adding and editing new layers with default settings
            K.drawControl = new L.Control.Draw({
                draw: {
                    circle: false,
                    marker: {
                        icon: new createIcon()
                    }
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
K.group.mode = K.group.feature[K.mode.get];

// $.each(Cookies.get(), function(i, v) {
//    Cookies.remove(i);
// });

// console.log(Cookies.get());

/*====================================
=            MARKER TOOLS            =
====================================*/
K.tool.marker = {
    full: false,
    layers: {},

    fill: function() {
        var _this = K.tool.marker;
        !_this.full && $.each(K.modes.get, function(i, mode) {
            _this.layers[mode] = {};
        });
        _this.full = true;
    },

    enabled: function() {
        return !!$('#marker-tools').length;
    },

    show: function() {

        var skip = $.type(arguments[0]) == "boolean" ? arguments[0] : false;
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
            containment: "#mapid",
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
                Cookies.set('toolPos', this.position);
            }
        }).resizable({
            containment: "#mapid",
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
                Cookies.set('toolPos', this.position);
            }
        });

        this.position = Cookies.get('toolPos') || false;

        if (this.position) tools.css(this.position);

        var iconSize = function() {
            var n = $('a', this).length,
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

        $.each(sortObjByKeys(this.layers[K.mode.get]), function(category, layers) {

            // $('<span />', {
            //     "class": "category"
            // }).text(category).appendTo('.outer.icons');

            $.each(sortObjByKeys(layers), function(i, layer) {
                var p = layer.properties,
                    active = (p.type == (Cookies.get('markerToolIcon') || 'Contaminated') ? "enabled" : ''),
                    key = false;

                $.each(K.shortcuts.QuickMarker, function(k, t) {

                    if (p.type.space() == t && p.type != 'Underground') {
                        key = k;
                        return;
                    }
                });

                if (p.mode.contains(K.mode.get) || p.mode == "all") {
                    $('<a />', {
                        "class": active,
                        title: category + '<br>' + p.type.replace('Survival', '').space(),
                        category: category,
                        type: p.type,
                        html: '<img src="' + p.icon.options.iconUrl + '">' + (key ? '<span class="key">' + key + '</span>' : '')
                    }).data('properties', p).appendTo('.outer.icons');
                }
            });
        });

        $('#marker-tools a').on('mousedown', function() {
            var typ = $(this).attr('type');

            $(this).siblings('a').removeClass('enabled');
            $(this).addClass('enabled');
            Cookies.set('markerToolIcon', typ);

            K.updateMarker($(this).data('properties'));

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
K.tool.layer = {

    // Settings to use through all functions
    group: '',
    icon: {},
    id: 0,
    join: false,
    layer: {},
    new: {},
    pop: {},
    shape: '',

    //Check if the menu is already open
    isOpen: function() {
        return !!$('#settings-menu').length;
    },

    //Open the menu
    show: function() {
        K.tool.layer._show.call(K.tool.layer, this);
    },

    _show: function(layer) {
        var _this = this;

        // Cancel if we are in editing or deleting modes
        if (K.check.deleting || K.check.editing || !K.bar.b.power.enabled())
            return this;

        if (!this.tags) {
            this.tags = [];

            var layers = {};
            $.each(K.tool.marker.layers, function(i, mode) {
                $.extend(layers, mode);
            });
            layers = sortObjByKeys(layers);
            $.each(layers, function(v, i) {
                _this.tags.push(v.space());
            });
        }

        this._hide();

        this.layer = layer;
        this.shape = layer.options.shape;
        this.id = layer._leaflet_id;

        // Add the settings if they don't already exist
        if (!("saved" in layer.editing)) layer.editing.saved = true;

        if (!("options" in layer)) layer.options = {};

        if (this.shape == "marker") {
            if (!("icon" in layer.options)) layer.options.icon = {};
            if (!("options" in layer.options.icon)) layer.options.icon.options = {};
            this.icon = layer.options.icon.options;
        }

        if (!("_popup" in layer)) layer._popup = {};
        if (!("_content" in layer._popup)) layer._popup._content = "";
        if (!("options" in layer._popup)) layer._popup.options = {};
        if (!("list" in layer._popup.options)) layer._popup.options.list = {};

        this.group = layer.options.group;
        this.pop = layer.getPopup();

        layer.makeBackup();

        // Used to make holes in polys
        if (this.join) {

            this.join._latlngs.push(layer._latlngs[0]);

            this.new = L.polygon(this.join._latlngs, $.extend({}, this.join.options, {
                pane: (this.join.options.className == "poly-hover" ? "zonePane" : "overlayPane"),

            }));

            this.pop = this.join._popup;

            // Add a new popup if it has one
            if (this.pop._content || this.pop.options.list.title) {
                var o = this.pop;
                this.new.bindPopup(o._content, {
                    className: o.options.className,
                    list: o.options.list || {}
                });
            }

            removeLayer(this.join);
            removeLayer(layer, this.group, true);
            K.group.mode[this.new.options.group].addLayer(this.new);
            this.new.on('click', K.tool.layer.show);

            this.new.saved(false);

            this.join = false;

            K.msg.hide();

            return this;
        }

        // Sorts settings 
        $.each(K.map.settings.counts, function(a, v) {
            if ($.type(v) == "array") {
                $.unique(v)
                v.sort();
            } else if ($.type(v) == "object") {
                $.each(v, function(b, w) {
                    $.unique(w)
                    w.sort();
                });
            }
        });

        // Outline the layer that is being edited
        $(layer[K.isInArray(layer.options.shape, ['polygon', 'polyline']) ? '_path' : '_icon']).addClass('leaflet-layer-editing');

        // Create the menu
        $('body').append('<div id="settings-menu" class="settings-divider"><div class="settings-side left"></div><div class="settings-side right"></div></div>');

        $('#settings-menu').on('remove', function() {
            $('.leaflet-layer-editing').removeClass('leaflet-layer-editing');
        }).draggable({
            containment: "#mapid",
            start: function() {
                $(this).css({
                    transform: 'translate(0, 0)'
                });
            },
            stop: function() {
                this.position = $.extend({}, $(this).position(), {
                    transform: 'translate(0, 0)'
                });
                Cookies.set('menuPos', this.position);
            }
        });

        this.position = Cookies.get('menuPos') || false;

        if (this.position) {
            var w = $(window).width() - 300,
                h = $(window).height() - 515;
            this.position.left = w < this.position.left ? w : this.position.left;
            this.position.top = h < this.position.top ? h : this.position.top;
            $('#settings-menu').css(this.position);
        }

        $('.settings-side.left').append(
            '<div class="settings-tools marker">\
			<span class="settings-title">' + layer.options.shape.toUpperCase() + '</span>\
			</div>\
			<div class="settings-tools popup">\
			<span class="settings-title">POPUP</span>\
			</div>\
			<div class="settings-tools buttons"></div>\
			<div class="settings-tools save">\
			<a class="settings-save" aria-label="save">CONFIRM</a>\
			<a class="settings-cancel" aria-label="cancel">CANCEL</a>\
			</div>\
			<div class="creator">' + layer.options.creator + '</div>\
			<div class="unsaved" ' + (layer.editing.saved ? 'style="display: none"' : '') + '>Save me!</div>');

        var btn = $('<a class="settings icon" />'),
            box = '.settings-tools.buttons',
            btns = [{
                cls: 'copy',
                title: 'Copy these settings'
            }, {
                cls: 'paste',
                title: 'Paste copied settings',
                type: ["polygon", "polyline"]
            }, {
                cls: 'edit' + (layer.editing.edit ? ' end' : ''),
                title: 'Add this to editable layer'
            }, {
                cls: 'move' + (layer.dragging.enabled() ? ' end' : ''),
                title: 'Drag this layer'
            }, {
                cls: 'join',
                title: 'Make another polygon a hole in this',
                type: ["polygon"]
            }, {
                cls: 'split',
                title: 'Split these polygons',
                type: ["polygon"]
            }, {
                cls: 'dupe',
                title: 'Duplicate this poly',
                type: ["polygon"]
            }, {
                cls: 'delete',
                title: 'Delete this layer'
            }, {
                cls: 'to-type',
                title: 'Copy selected setting to all of Type'
            }];

        for (i in btns) {
            b = btns[i];
            if (b.cls && (!b.type || K.isInArray(this.shape, b.type))) {
                btn.clone().attr({
                    "aria-label": b.cls,
                    "title": b.title
                }).addClass(b.cls).appendTo(box);
            }
        }

        this.updateSaved();

        // Fill the menu with settings
        $.each(K.map.settings[this.shape], function(i, n) {
            $('<a />', {
                'class': 'dnt settings-item ' + n,
                'aria-label': n,
                'html': n.firstToUpper()
            }).appendTo('.settings-tools.marker');
        });

        // Fill the popup menu with settings
        $.each(K.map.settings.popup, function(i, n) {
            $('<a />', {
                'class': 'dnt settings-item ' + n,
                'aria-label': 'popup-' + n,
                'html': n.firstToUpper()
            }).appendTo('.settings-tools.popup');
        });

        // Apply the button click functions
        $('.settings-item')
            .on('mousedown', this._settingClick)
            .on('mouseover', this._settingOver)
            .on('mouseleave', this._settingLeave);
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
        if ("_latlngs" in layer && layer._latlngs.length == 1)
            $('.settings.split').hide();
        else {
            $('.settings.split').on('click', function() {
                _this._split.call(_this);
            });
        }

        if (layer.editing.window)
            $('[aria-label="' + layer.editing.window + '"]').trigger('mousedown');

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
        var div = L.DomUtil.get('settings-menu');
        L.DomEvent.disableClickPropagation(div);
        L.DomEvent.on(div, 'mousewheel', L.DomEvent.stopPropagation);

        return this;
    },

    /* 
     * Left side setting click
     * Populate the right menu
     */
    _settingClick: function() {

        var fn = K.tool.layer,
            layer = fn.layer,
            setting = $(this).attr('aria-label'),
            isPopup = setting.bMatch('popup-'),
            set = (isPopup ? K.map.settings.counts.popup : K.map.settings.counts);

        layer.editing.window = setting;
        setting = setting.replace('popup-', '');

        var val = layer.options[setting];

        if (isPopup) {
            val = (setting == "content" ? fn.pop._content : fn.pop.options[setting]);
        } else if (fn.shape == "marker" && K.isInArray(setting, ["className", "iconUrl", "iconSize", "html"])) {
            val = fn.icon[setting];
        }

        // Fill the right menu with the title and apply button
        $('.settings-side.right').html(
            '<div class="settings-tools right-bar" aria-label="' + setting + '">\
			<span class="settings-title">' + (isPopup ? 'POPUP ' : '') + setting.space().toUpperCase() + '</span>\
			</div>');

        if (!K.isInArray(setting, ['id'])) {

            $('.right .settings-title').after('<a class="settings icon copy inline" title="Copy this setting" setting="' + setting + '" which="' + (isPopup ? 'popup' : 'icon') + '"></a>');
            $('.right .settings-title').after('<a class="settings icon paste inline" title="Paste this setting" setting="' + setting + '" which="' + (isPopup ? 'popup' : 'icon') + '"></a>');

            $('.settings.copy.inline').on('click', fn._copySingle);
            $('.settings.paste.inline').on('click', fn._pasteSingle);
        }

        // If presets exist, fill the menu with them
        if (setting in set) {

            // Append the input
            $('.settings-tools.right-bar').append('<input type="text" class="settings-item input ' + setting + '" name="' + setting +
                '" role="input" value="' + (val ? val : '') + '" setting="' + setting + '" which="' + (isPopup ? 'popup' : 'icon') + '">');

            var img, col, num = 1,
                retHtml = '<div class="scroll-box">',
                colors = [];

            $.each(set[setting], function(z, i) {

                img = ($.type(i) == "string" ? i.contains('.svg') : false);
                col = ($.type(i) == "string" ? i.contains('#') : false);

                if (col) {
                    colors.push(i);
                    return true;
                }

                var fst = '<div class="settings-icons">',
                    lst = '</div>',
                    trd = lst + fst;

                retHtml += (img && num == 1 ? fst : '') + '<a \
				class="settings-item selector' + (col ? ' color' : (img ? ' icon' : '')) + '" \
				aria-label="' + i + '" \
				role="button"' +
                    (val == i ? ' style="background-color: #2f474e; ' + (col ? ' color: ' + i + ';' : '') + '"' : (col ? ' style="color: ' + i + ';"' : '')) + '>' +
                    (img ? '<img src="' + i + '" height="30" width="30">' : i) +
                    '</a>' + (img && num == set[setting].length ? lst : (img && num % 3 == 0 ? trd : ''));
                num++;
            });

            retHtml = $(retHtml + '</div>');
            if (img) retHtml.addClass('has-icons');

            $('.settings-tools.right-bar').append(retHtml);

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

        } else if (setting === "list") {

            if ($.type(val) != 'object') {
                fn.pop.options[setting] = {};
                val = {};
            }

            $('.settings-tools.right-bar').append(
                '<span class="help">This is an alternative to content, with this it will automatically arrange the content to display correctly in the html tags with images included. Filling this out will remove whatever is in content.</span>\
				<div class="scroll-box">\
				<div class="section title">\
				<span>TITLE</span><br>\
				<input type="text" class="settings-item input list" name="list-title" role="input" value="' + (val.title ? val.title : '') + '" setting="list-title" which="popup" placeholder="Title">\
				</div>\
				<div class="section subs">\
				<a class="add subs" title="Add another paragraph">+</a><span>PARAGRAPH</span><br>\
				</div>\
				<div class="section list">\
				<a class="add list" title="Add another item">+</a><span>LIST</span><br>\
				</div>\
				</div>'
            );

            if (!val.subs) val.subs = [{
                value: '',
                class: 'white'
            }];

            var input = $('<input />', {
                type: "text",
                "class": "settings-item input list",
                which: "popup"
            });

            var toggle = $(`<label class="switch"> 
                    <input type="checkbox" class="settings-item input list check">
                    <span class="slider"></span>
                </label>`);

            $.each(val.subs, function(i, itm) {

                var inpt = input.clone().attr({
                    name: 'list-sub',
                    value: itm.value,
                    num: i,
                    placeholder: "Paragraph"
                }).appendTo('.section.subs');

                if (itm.color) inpt.addClass('gray');

                toggle.clone().appendTo('.section.subs').find('input').attr({
                    name: 'list-sub-class',
                    num: i
                }).prop('checked', itm.color);

                $('<br>').appendTo('.section.subs');
            });

            if (!val.list) val.list = [{
                item: '',
                qty: ''
            }];

            $.each(val.list, function(i, itm) {

                input.clone().attr({
                    name: 'list-item',
                    value: itm.item,
                    num: i,
                    placeholder: "Item"
                }).autocomplete({
                    source: fn.tags,
                    autoFocus: true,
                    appendTo: '#settings-menu'
                }).appendTo('.section.list');

                input.clone().attr({
                    type: "number",
                    min: 1,
                    name: 'list-qty',
                    value: itm.qty || 1,
                    num: i,
                    placeholder: "Qty"
                }).appendTo('.section.list');

                $('<br>').appendTo('.section.list');
            });

            $('a.add').on('click', function() {
                var focus = false,
                    name, i;

                if ($(this).hasClass('subs')) {

                    name = 'input[name="list-sub"]';
                    i = $(name).length;

                    input.clone().attr({
                        name: 'list-sub',
                        setting: 'list-sub',
                        num: i,
                        placeholder: "Paragraph"
                    }).appendTo('.section.subs');

                    toggle.clone().appendTo('.section.subs').find('input').attr({
                        name: 'list-sub-class',
                        num: i
                    });

                    $('<br>').appendTo('.section.subs');

                } else {

                    name = 'input[name="list-item"]';
                    i = $(name).length;

                    input.clone().attr({
                        name: 'list-item',
                        setting: 'list-item',
                        num: i,
                        placeholder: "Item"
                    }).autocomplete({
                        source: fn.tags,
                        autoFocus: true,
                        appendTo: '#settings-menu'
                    }).appendTo('.section.list');

                    input.clone().attr({
                        type: "number",
                        min: 1,
                        name: 'list-qty',
                        setting: 'list-qty',
                        num: i,
                        placeholder: "Qty"
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

        } else {
            $('.settings-tools.right-bar').append(`<textarea  rows=2 cols=20 wrap="hard" class="settings-item input ${setting}" name="${setting}" setting="${setting}" which="${isPopup ? 'popup' : 'icon'}">${val ? val : ''}</textarea>`)
            //     .append($('<div />', {
            //         id: "settings-textarea",
            //         "class": "textarea"
            //     }));

            // var myCodeMirror = CodeMirror(document.getElementById('settings-textarea'), {
            //     mode: 'html',
            //     lineNumbers: true
            // });
            // console.log(document.getElementById('settings-textarea'), myCodeMirror);
        }

        var apply = function() {

            var $input = $('.settings-item.input'),
                setting = $input.attr('setting'),
                value = $input.val();

            if ($(this).hasClass('list')) {

                setting = 'list';
                value = {};

                value.title = $('.input[name="list-title"]').val();
                value.subs = [];

                $('.input[name="list-sub"]').each(function() {

                    var t = $(this).val();
                    if (!t) return true;
                    var c = $(this).next('label').find('input').is(':checked');
                    value.subs.push({
                        value: t,
                        color: c
                    });
                });

                value.list = [];

                $('.input[name="list-item"]').each(function() {

                    var no = $(this).attr('num'),
                        t = $(this).val();

                    if (!t) return true

                    value.list.push({
                        item: t,
                        qty: $('.input[name="list-qty"][num="' + no + '"]').val() || 1
                    });
                });
                removeEmpty(value);
            }

            if ($input.attr('which') == 'popup') layer.updatePopup(setting, value);
            else layer.applySetting(setting, value);

            // K.tool.layer._refresh();
        };

        // Menu buttons event
        $('.settings-item.selector').on('click', function() {

            var $input = $('.settings-item.input');

            if ($(this).hasClass('color')) {

                var hex = $(this).attr('aria-label');
                $input.css({
                    'background-color': hex,
                    'color': textColor(hex)
                });
            }

            $('.settings-side.right a:not(.settings-apply)').css('background-color', '#24373d');
            $(this).css('background-color', '#2f474e');

            $input.val($(this).attr('aria-label'));
            apply.call(this);
        });

        var inputRenew = function() {
            // Apply button event
            $('.input').each(function() {
                var el = $(this),
                    binds = "propertychange change click keyup input paste focus blur";

                el.data('oldVal', el.val());

                el.unbind(binds);
                el.bind(binds, function() {

                    var check = $(this).hasClass('check');

                    if (!check && el.data('oldVal') == el.val())
                        return;

                    !check && el.data('oldVal', el.val());

                    apply.call(this);

                    var title = $('input[name="list-title"]');
                    title.removeClass('incorrect');
                    if (!title.val())
                        title.addClass('incorrect');

                    if (check) {
                        var input = $(this).parent('label').prev('input');
                        input.removeClass('gray');
                        if ($(this).is(':checked')) input.addClass('gray');
                    }

                });

                el.bind('blur', function() {
                    if (el.data('oldVal') == el.val())
                        return;

                    apply.call(this);
                });
            });
        }

        inputRenew();

        // $("#settings-menu .scroll-box").mCustomScrollbar({
        // 	scrollInertia: 1000,
        // 	autoHideScrollbar: true
        // });

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
    },

    _settingOver: function() {

        var fn = K.tool.layer,
            layer = fn.layer,
            setting = $(this).attr('aria-label'),
            isPopup = setting.bMatch('popup-');

        setting = setting.replace('popup-', '');

        var value = layer.options[setting] || '';
        if (isPopup) {
            value = (setting == "content" ? fn.pop._content : fn.pop.options[setting]);
        } else if (fn.shape == "marker" && K.isInArray(setting, ["className", "iconUrl", "iconSize", "html"])) {
            value = fn.icon[setting];
        }

        if ($.type(value) == "object")
            value = JSON.stringify(value);

        if (K.isInArray(setting, ["content", "html"]))
            value = safeTags(value);

        if ($.type(value) == "string" && !value)
            value = undefined;

        var cv = 'current-value';

        if (!$('.' + cv, this).length && value != undefined) {

            $('<span />', {
                "class": cv
            }).appendTo(this);

        }

        $('.' + cv, this).html(value).fadeIn(250);
    },

    _settingLeave: function() {
        $('.current-value').fadeOut(500);
    },

    //Confirm the settings that you have changed and remove the backup
    _save: function() {

        var copy = Cookies.get('copy') || {},
            layer = this.layer;

        this._hide();

        if (this.shape == "marker") {

            copy.marker = $.extend({}, this.icon, K.curtail({}, layer.options, ["id"]));

        } else if (this.shape == "polyline") {

            copy.polyline = K.curtail({}, layer.options, ["id"]);

        } else if (this.shape == "polygon") {

            copy.polygon = K.curtail({}, layer.options, ["id"]);
        }

        var p = this.pop,
            o = p.options;

        copy[this.shape + 'Popup'] = p._content ? {
            content: (p._content && !(o && o.list && o.list.title) ? p._content : ''),
            options: {
                className: (o && o.className ? o.className : ''),
                list: (o && o.list ? $.extend(true, {}, o.list) : {})
            }
        } : {};

        Cookies.set('copy', copy);

        delete layer.backup;

        if (!layer.options.mode.contains(K.mode.get) && layer.options.mode != 'all') {
            K.group.mode[layer.options.group].removeLayer(layer._leaflet_id);
        }
    },

    //Confirm the settings that you have changed
    _cancel: function() {

        this._hide();
        var layer = this.layer,
            o = layer.options,
            p = layer._popup,
            b = layer.backup;

        $.extend(true, o, b.options);

        if (b.popup) {
            $(p._container)
                .removeClass(p.options.className)
                .addClass(b.popup.options.className);
            $.extend(true, p, b.popup);
        }

        // Restore old settings
        if (o.shape == "marker") {

            layer.setLatLng(b.pos.latlng);

            var i = o.icon.options;
            layer.setIcon(L.divIcon({
                iconUrl: i.iconUrl,
                iconSize: i.iconSize,
                html: (i.className.contains('anim-icon') ? "<img class='halo' src='images/_a.svg'>" : "") +
                    "<img src='" + (i.iconUrl || '') + "' class='icon'>",
                className: i.className
            }));
            layer.setOpacity(o.opacity);

            // Create a polyline with the new settings
        } else if (K.isInArray(o.shape, ["polyline", "polygon"])) {

            layer.setLatLngs(b.pos.latlngs);
            layer.setStyle(o);
        }

        layer.saved(true);
    },

    //Copy settings 
    _copy: function() {

        var copy = Cookies.get('copy') || {},
            layer = this.layer;

        if (this.shape == "marker") {

            // Save the settings for use later on 
            copy.layerer = $.extend({}, this.icon, K.curtail({}, layer.options, ["id"]));

        } else if (this.shape == "polyline") {

            copy.polyline = K.curtail({}, layer.options, "id");

        } else if (this.shape == "polygon") {

            copy.polygon = K.curtail({}, layer.options, "id");
        }

        var p = this.pop,
            o = p.options;

        copy[this.shape + 'Popup'] = p._content ? {
            content: (p._content && !(o && o.list && o.list.title) ? p._content : ''),
            options: {
                className: (o && o.className ? o.className : ''),
                list: (o && o.list ? $.extend(true, {}, o.list) : {})
            }
        } : {};


        Cookies.set('copy', copy);

        K.msg.show({
            msg: 'Settings copied!',
            time: 2000
        });
    },

    _copySingle: function() {

        var copy = Cookies.get('copy') || {},
            fn = K.tool.layer,
            pop = $(this).attr('which') == "popup",
            set = $(this).attr('setting'),
            val = set == 'list' ? removeEmpty(fn.pop.options.list) : $('.input').val();

        if (val == null || val == undefined || ($.type(val) == "string" && !val) || ($.type(val) == "object" && !Object.keys(val).length)) {

            K.msg.show({
                msg: 'Copy failed!',
                time: 2000
            });
            return;
        }

        if (!("options" in copy)) copy.options = {
            popup: {}
        };

        if (pop) copy.options.popup[set] = val;
        else copy.options[set] = val;

        Cookies.set("copy", copy);

        K.msg.show({
            msg: 'Setting copied!',
            time: 2000
        });
    },

    //Paste copied settings 
    _paste: function() {

        var layer = this.layer,
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
            pane: (sets.className == "poly-hover" ? "zonePane" : "overlayPane")
        });

        this.new = (this.shape == "polyline" ? L.polyline(layer._latlngs, sets) : (polyType(layer._latlngs) == "Rectangle" ?
            L.rectangle(layer._latlngs, sets) : L.polygon(layer._latlngs, sets)));

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
        var copy = Cookies.get('copy') || {};

        var fn = K.tool.layer,
            pop = $(this).attr('which') == "popup",
            set = $(this).attr('setting');

        if ((!('options' in copy)) || (pop && !copy.options.popup[set]) || (!pop && !copy.options[set])) {

            K.msg.show({
                msg: 'There is no copied setting!',
                time: 2000
            });
            return;
        }

        if (set == 'list') {

            var list = copy.options.popup.list,
                input;

            $('input').val('');

            for (var j = 0; j < 2; j++) {

                if (list.subs) {
                    for (var i = 0; i < list.subs.length; i++) {

                        if (!list.subs[i].value) continue;

                        input = $('[name="list-sub"][num="' + i + '"]');

                        if (!input.length) $('a.add.subs').trigger('click');

                        input.val(list.subs[i].value);
                        input.next('label').find('input').prop('checked', list.subs[i].color);
                    }
                }

                if (list.list) {
                    for (i = 0; i < list.list.length; i++) {

                        if (!list.list[i].item) continue;

                        input = $('[name="list-item"][num="' + i + '"]');

                        if (!input.length) $('a.add.list').trigger('click');

                        input.val(list.list[i].item);
                        $('[name="list-qty"][num="' + i + '"]').val(list.list[i].qty);
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

    //Delete the layer
    _delete: function() {

        var _this = this;
        this._hide();

        $('<div />', {
            "class": "screen-blank",
            "html": $('<div />', {
                "class": "confirm",
                "html": $('<div />', {
                    "class": "message",
                    "html": "Are you sure you want to delete this layer?"
                })
            })
        }).appendTo('body');

        $('<a />', {
                "class": "button no",
                "title": "Cancel",
                "html": "Cancel"
            }).appendTo('.confirm')
            .on('click', function() {
                $('.screen-blank').remove();
            });

        $('<a />', {
                "class": "button yes",
                "title": "Delete",
                "html": "Delete"
            }).appendTo('.confirm')
            .on('click', function() {
                _this._trueDelete.call(_this);
                $('.screen-blank').remove();
            });

    },

    _trueDelete: function() {

        var layer = this.layer;
        removeLayer(layer, this.group, true);
    },

    _toType: function() {

        var layer = this.layer,
            o = layer.options,
            p = layer._popup,
            setting = layer.editing.window,
            isPopup = setting.bMatch('popup-'),
            value;

        if (!(setting && o.type && setting != "type")) return;

        setting = setting.replace('popup-', '');

        switch (isPopup ? 1 : this.type == "marker" && K.isInArray(setting, ["className", "iconUrl", "iconSize", "html"]) ? 2 : 0) {
            case 1:
                value = (setting == "content" ? p._content : p.options[setting]);
                break;
            case 2:
                value = o.icon.options[setting];
                break;
            default:
                value = o[setting];
        }

        $.each(K.group.mode, function(i, g) {
            $.each(g._layers, function(i, l) {
                if (l.options.type != o.type) return;
                if (isPopup) l.updatePopup(setting, value);
                else l.applySetting(setting, value);
            });
        });

        K.msg.show({
            msg: 'Setting copied to all ' + o.type,
            time: 2000
        });
    },

    //Duplicate a polygon or polyline
    _dupe: function() {

        this._hide();
        var layer = this.layer;

        var nSettings = $.extend({}, layer.options, {
            id: ID()
        });

        var ll = layer._latlngs,
            pType = polyType(ll);
        if (pType != "Rectangle") {
            if (pType == "Polygon") ll = ll[0];
            ll.splice(1, 0, L.latLng(((ll[0].lat + ll[1].lat) / 2), ((ll[0].lng + ll[1].lng) / 2)));
        } else {
            ll[0][0].lng -= 0.000001;
            ll[0][1].lng -= 0.000001;
        }

        this.new = (polyType(layer._latlngs) == "Polyline" ? L.polyline(layer._latlngs, nSettings) : (polyType(layer._latlngs) == "Rectangle" ?
            L.rectangle(layer._latlngs, nSettings) : L.polygon(layer._latlngs, nSettings)));

        K.group.mode[layer.options.group].addLayer(this.new);
        this.new.on('click', this.show);

        this.new.saved(false);

        // if (pType != "Rectangle")
        createGeoJSON();

        switchLayerGroups();
        polyHoverAnimation();

        K.msg.show({
            msg: 'Duplicated',
            time: 2000
        });
    },

    //Join polygons together
    _join: function() {

        var layer = this.layer;

        this.join = layer;
        layer.off('click').bringToBack();

        this._hide();
        K.msg.show({
            msg: 'Select the shape to join!',
            time: 3000
        });
    },

    //Toggle dragging of this layer
    _move: function() {

        var fn = K.tool.layer,
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

    //Add the layer to the draw group for editing
    _edit: function() {

        var fn = K.tool.layer,
            layer = fn.layer;

        layer.editing.edit = !layer.editing.edit;
        $(this).toggleClass('end');
        switchLayerGroups();
    },

    //Split the joined polygons
    _split: function() {

        this._hide();
        var layer = this.layer,
            newLayer = this.new,
            show = this.show;

        $.each(layer._latlngs, function(i, m) {
            sets = $.extend({}, layer.options, {
                id: ID()
            });

            newLayer = polyType([m]) == "Rectangle" ? L.rectangle([m], sets) : L.polygon([m], sets);

            K.group.mode[newLayer.options.group].addLayer(newLayer);
            newLayer.on('click', show);

            newLayer.saved(false);
        });

        removeLayer(layer, this.group, true);

        // Save all the hard work

        switchLayerGroups();
        polyHoverAnimation();
    },

    //Hide the menu
    _hide: function() {
        $('#settings-menu').remove();
    },

    //Refreshes the mark after a commit
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

L.Layer.include({
    tools: K.tool.layer,
    backup: false,

    //Backup the original settings
    makeBackup: function() {

        var backup = function(obj) {
            var rObj = {};

            for (key in obj) {
                if ($.type(obj[key]) === 'object') {
                    rObj[key] = backup(obj[key]);

                } else if ($.type(obj[key]) !== 'function' && !key.bMatch(/^_/)) {
                    rObj[key] = obj[key];
                }
            }

            return rObj;
        }

        var t = !this.backup ? "backup" : "paste";

        this[t] = {};
        this[t].options = backup(this.options);

        if (this._popup) {
            this[t].popup = {};
            this[t].popup._content = this._popup._content;

            if (this._popup.options)
                this[t].popup.options = backup(this._popup.options);
        }

        if (t == "backup") {

            if (K.isInArray(this.options.shape, ['polygon', 'polyline'])) {

                this.backup.pos = {
                    latlngs: L.LatLngUtil.cloneLatLngs(this.getLatLngs())
                };

            } else if (this.options.shape == 'marker') {

                this.backup.pos = {
                    latlng: L.LatLngUtil.cloneLatLng(this.getLatLng())
                };
            }
        }

        return this;
    },

    //Apply the settings that you are changing
    applySetting: function(setting, value) {

        if (!this.backup) this.makeBackup();

        // Add the settings to the correct locations
        if (this.options.shape == "marker" && K.isInArray(setting, ["className", "iconUrl", "iconSize", "html"])) {

            var p = this.options.icon.options,
                layer = this;
            p[setting] = value.bMatch(/\d+,\d+/) ? value.split(',') : value;

            $.ajax({
                type: 'HEAD',
                url: p.iconUrl,
                success: function() {

                    p.html = !p.iconUrl ? p.html : (p.className.contains('anim-icon') ? "<img class='halo' src='images/_a.svg'>" : "") +
                        "<img src='" + (p.iconUrl || '') + "' class='icon'>";

                    layer.setIcon(L.divIcon({
                        iconUrl: p.iconUrl,
                        iconSize: p.iconSize,
                        html: p.html,
                        className: p.className
                    }));

                    layer.saved(false);
                }
            });

        } else this.options[setting] = value;


        // Apply the settings to the original layer (not marker)
        this.options.shape != "marker" && this.setStyle(this.options);
        this.options.shape == "marker" && this.setOpacity(this.options.opacity);

        this.saved(false);
        return this;
    },

    updatePopup: function(setting, value) {

        if (!this.backup) this.makeBackup();

        var p = this._popup;

        if (setting == 'list') {

            p.options.list = value;
            p._content = this.convertContent(p.options);

        } else if (setting == "content") {

            p._content = value;
            p.options.list = {};

        } else if (setting == "className") {

            p.options[setting] = value;

            var ocn = p.oldClassName || this.backup.popup.options.className;
            $(p._container).removeClass(ocn).addClass(value);
            p.oldClassName = value;
        }

        if (p instanceof L.Popup) {

            var isOpen = this.isPopupOpen();

            this.closePopup();
            this.bindPopup(p._content, p.options);

            if (!p._content)
                this.unbindPopup();
            else {
                L.setOptions(p, p.options);
                if (isOpen) this.openPopup();
            }

        } else if (p && p._content) {
            this.bindPopup(p._content, p.options);
        }

        this.saved(false);
    },

    saved: function(saved) {
        var tool = K.tool.layer;
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
$(function() {

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
        url: "includes/map_date.php",
    }).done(function(a) {
        K.mapVersion = a;

        // Map Image Overlay
        L.imageOverlay(`images/map.svg?v=${K.mapVersion}`, [
            [15, -15],
            [-15, 15]
        ], {
            attribution: '<a title="Tom Clancy\'s The Division 2" href="https://tomclancy-thedivision.ubisoft.com/">The Division 2</a>',
            pane: "mapPane"
        }).addTo(K.myMap);

    });

    // Add the main groups to the map
    K.myMap.addLayer(K.group.mode.groupAll).addLayer(K.group.mode.groupDZ);

    // On Zoom and Pan
    K.myMap.on('zoomend moveend', function(e) {
        zoom = e.target._zoom;
        onZoomEnd();

        Cookies.set("zoom", K.myMap.getZoom());
        Cookies.set("pan", K.myMap.getCenter());

        polyHoverAnimation();
    });

    // Toggle map mode buttons
    $('.side-menu-toggle.mode').on('click', function() {
        var $t = $(this);
        K.mode.get = $t.hasClass('one') ? K.mode.not('survival', 'normal') : K.mode.not('last stand', 'normal');
        Cookies.set('mode', K.mode.get);
        K.group.mode = K.group.feature[K.mode.get];
        K.bar.b.power && !K.bar.b.power.enabled() ? K.check.doOnce = true : true;
        pageLoad();
    });

    // Toggle menu buttons
    $('#side-bar .side-menu-toggle:not(.mode):not(.full)').on('click', function() {

        var sb = $("#side-bar"),
            c = 'active',
            a = $(this).attr('button'),
            o = Cookies.get('sideMenu'),
            setCookies = function() {
                Cookies.set('sideBar', sb.hasClass(c));
                Cookies.set('sideMenu', a);
            };

        if ($(this).hasClass(c)) {
            sb.removeClass(c + " " + a);
            setTimeout(function() {
                sb.children().removeClass(c);
                setCookies();
            }, 1000);
        } else if (sb.hasClass(c)) {
            sb.removeClass(c + " " + o);
            setTimeout(function() {
                sb.children().removeClass(c);
                sb.addClass(c + " " + a);
                sb.children("." + a).addClass(c);
                setCookies();
            }, 1000);
        } else {
            sb.addClass(c + " " + a);
            sb.children("." + a).addClass(c);
            setCookies();
        }
    });

    // Correctly position the menu buttons
    $("#side-bar > a").each(function(i, el) {
        $(this).css("top", i = 0 ? "10px" : (10 + (i * 40)) + "px");
    });

    // Toggle fullscreen button
    var el = $('#side-bar .side-menu-toggle.full');
    el.on('click', toggleFullScreen);
    $(document).on('webkitfullscreenchange mozfullscreenchange fullscreenchange', function(e) {
        el.toggleClass('yes');
    });

    // Set change log if they have not seen it before
    if (!K.urlParam('overwolf') && Cookies.get('currentUpdate') != K.currentUpdate) {
        Cookies.set('sideMenu', 'changes');
        Cookies.set('sideBar', true);
        Cookies.set('currentUpdate', K.currentUpdate);
    }

    // console.log(navigator.language);
    K.lng = Cookies.get('lang') || 'en';

    // $.getJSON("data/local.json", function(data) {
    // 	K.local.data = data;
    // 	// console.log(K.local.data);
    // 	K.translator = $('body').translate({
    // 		lang: K.lng,
    // 		t: K.local.data
    // 	});
    // }).fail(function(e) {
    // 	console.log(e)
    // });

    // User account controls
    $('#side-bar .login').on('click', '.page', function() {
        var page = $(this).attr('name');

        $.ajax({
            url: "includes/" + page + ".php"

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
            url: "includes/logout.php"

        }).done(function(a) {

            K.user.name = false;
            K.user.type = 0;

            $('#side-bar .login .side-content').html(a);

            pageLoad();
        });
    });

    // Remember me
    ///////////////
    $('#side-bar').on('click', '#rem-check', function() {

        $.ajax({
            type: "POST",
            url: "includes/validator.php",
            data: {
                checked: $(this).prop('checked')
            }
        });
    });

    // Hide Menus on no click
    $(document).mousedown(function(e) {
        var container = $(".settings-divider, .switch-active-group, #slider-box, .group-switch");
        if (!container.is(e.target) && container.has(e.target).length === 0) {
            $(container).remove();
        }
    });

    // Error handling in inputs
    $('#side-bar').on('focus', '.login .input', function() {
        $('.' + $(this).attr('name')).show(500);

    }).on('blur', '.login .input', function() {
        $('.' + $(this).attr('name')).hide(500);

    }).on('propertychange change click keyup input paste', '.login .input', function() {
        var el = $(this),
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

    // $('.language-button').on('click', function(e) {

    // 	K.oldLng = $('.language-button.active').attr('code');

    // 	K.lng = $(this).attr('code');
    // 	Cookies.set("lang", K.lng);
    // 	$('.language-button').removeClass('active');
    // 	$(this).addClass('active');
    // 	translator();

    // 	$.getJSON("data/languages.json", function(data) {
    // 		if (data[K.oldLng].reload)
    // 			location.reload();

    // 		if (data[K.lng].by == "")
    // 			$('span.lang.credits').hide();
    // 		else {
    // 			$('span.lang.credits').show();
    // 			$('a.lang.credits').html(data[K.lng].by).attr('href', 'mailto:' + data[K.lng].email);
    // 		}
    // 	});
    // });

    // // Translator Form Stuffs
    // $("#translate .list").mCustomScrollbar({
    // 	scrollInertia: 500,
    // 	mouseWheel:{ scrollAmount: 200 },
    // 	autoHideScrollbar: true
    // });

    // tinysort('.list .content li');

    // $('.lang-select').selectric();

    // $(".selectric-items").mCustomScrollbar({
    // 	scrollInertia: 500,
    // 	mouseWheel:{ scrollAmount: 200 },
    // 	// autoHideScrollbar: true
    // });

    // $('#translate .local-button').each(function(i, el) {
    // 	$(this).attr('id', hex_sha512($(this).attr('local')));
    // });

    // $('.lang-select').on('change', function() {
    // 	var l = K.local;

    // 	$('.other .sub-title').html($(".lang-select option:selected").text() + " Translation");
    // 	l.lang = $(".lang-select option:selected").val();
    // 	l.lang = (l.lang == "Select Language" ? false : l.lang);
    // 	if (!l.lang) {
    // 		$('.other').hide();
    // 		$('#done-check').hide();
    // 	} else if (l.select) {
    // 		$('.other').show();
    // 		$('#done-check').show();
    // 	} else {
    // 		$('#done-check').show();
    // 	}
    // 	l.update();
    // });

    // $('.local-button').on('click', function() {
    // 	var l = K.local;

    // 	$('.local-button').removeClass('active');
    // 	$(this).addClass('active');

    // 	l.select = $(this).attr('local');
    // 	$('.default').show();
    // 	$('.default .english').text(l.select);
    // 	if (l.lang) {
    // 		$('.other').show();
    // 		$('#done-check').show();
    // 	} else {
    // 		$('.other').hide();
    // 		$('#done-check').hide();
    // 	} 
    // 	l.lang ? $('.other').show() : $('.other').hide();
    // 	l.update();

    // 	if (l.select.bMatch(/^ .* $/)) // begins and ends in space
    // 		l.white = 1
    // 	else if (l.select.bMatch(/^ /)) // begins in space
    // 		l.white = 2
    // 	else if (l.select.bMatch(/ $/)) // ends in space
    // 		l.white = 3
    // 	else 
    // 		l.white = 0
    // });

    // $('#translate textarea').on('blur', function() {
    // 	var l = K.local; 	
    // 	l.val = $(this).val();

    // 	if (l.val == $(this).attr('original'))
    // 		return

    // 	if (l.val) {
    //  		// Clean and save the new translation with a user

    //  		if (l.white == 1) 
    //  			l.val = " " + l.val.trim() + " ";
    //  		else if (l.white == 2)
    //  			l.val = " " + l.val.trim();
    //  		else if (l.white == 3)
    //  			l.val =  l.val.trim() + " ";
    //  		else 
    //  			l.val =  l.val.trim();

    //  		l.val = l.val.replace(/^([+-])(\d)/, "$1 $2");

    //  		// console.log(l.val, l.select, K.user.name);

    //  		l.save[l.select] = {};
    //  		l.save[l.select][l.lang] = l.val;
    //  		l.save[l.select][l.lang + "-user"] = K.user.name;

    //  	} else {
    //  		// Remove the saved value but still add a user

    //  		delete l.data[l.select][l.lang];
    //  		l.data[l.select][l.lang + "-user"] = K.user.name;
    //  		if ($.isArray(l.delete[l.select]))
    //  			l.delete[l.select].push(l.lang);
    //  		else 
    //  			l.delete[l.select] = [l.lang];
    //  	}

    //  	// console.log(l.select, l.save);

    //  	$.ajax({
    //  		url: "includes/check_login.php"

    //  	}).done(function(a) {

    //  		a = $.parseJSON(a);
    //  		K.user.name = a.username || false;
    //  		K.user.type = a.usertype || 0;

    //  		K.user.name && $.ajax({
    //  			type: "POST",
    //  			url: "includes/write_local.php",
    //  			data: {
    //  				data: JSON.stringify(K.local.save),
    //  				delete: JSON.stringify(K.local.delete)
    //  			}
    //  		}).done(function(a) {
    //  			// console.log(a);
    //  			$.getJSON("data/local.json", function(data) {
    //  				K.local.data = data;
    //  				K.local.save = {};
    //  				K.local.delete = {};
    //  				K.local.update();
    //  			});
    //  		});
    //  	});
    //  });

    // $('.add-trans').on('click', function(e) {

    // 	$.ajax({
    // 		url: "includes/check_login.php"

    // 	}).done(function(a) {

    // 		a = $.parseJSON(a);
    // 		K.user.name = a.username || false;
    // 		K.user.type = a.usertype || 0;

    // 		if (K.user.name) {

    // 			K.bar.b.power.enabled() && K.bar.b.power._click();
    // 			$('#translate, #screen-blank').show();
    // 			$('#translate .name span').html(K.user.name);

    // 			if (K.local.email)
    // 				$('#email-check a').addClass('checked');
    // 			else
    // 				$('#email-check a').removeClass('checked');
    // 		}
    // 	});
    // });

    // $('#translate .close').on('click', function(e) {
    // 	$('#translate, #screen-blank').hide();
    // });

    // $('#done-check').on('click', function(e) {

    // 	var l = K.local,
    // 		p = l.languages[l.lang];

    // 	if ((l.count * 100) / l.total < 25) {
    // 		$('#translate .display').addClass('blink-me');
    // 		return;
    // 	}

    // 	$(this).children('a').toggleClass('checked');
    // 	p.got = !p.got;

    // 	l.users = {};
    // 	$.each(l.data, function(i, v) {
    // 		var l = K.local, u = l.lang + "-user";
    // 		if (l.lang in v) {
    // 			if (v[u] in l.users) {
    // 				l.users[v[u]].count++;
    // 			} else {
    // 				l.users[v[u]] = {
    // 					count: 1
    // 				};
    // 			}
    // 		}
    // 	});

    // 	K.t = [];
    // 	$.each(l.users, function(k, v) {
    // 		K.t.push([k, v.count]);
    // 	});

    // 	l.users = K.t;
    // 	l.users.sort(function(a, b) {
    // 		return a[1] + b[1];
    // 	})

    // 	p.by = '';
    // 	for (var i = 0; i < l.users.length; i++) {
    // 		p.by = p.by + ", " + l.users[i][0];
    // 	}
    // 	p.by = p.by.replace(/^, /, '');

    //  	$.ajax({
    //  		url: "includes/check_login.php"

    //  	}).done(function(a) {

    //  		a = $.parseJSON(a);
    //  		K.user.name = a.username || false;
    //  		K.user.type = a.usertype || 0;

    //  		K.user.name && $.ajax({
    //  			type: "POST",
    //  			url: "includes/toJSON.php",
    //  			data: {
    //  				json: JSON.stringify(K.local.languages),
    //  				path: '../data/languages.json'
    //  			}
    //  		});
    //  	});
    // });

    // $('#email-check').on('click', function(e) {
    // 	var l = K.local;
    // 	l.email = !l.email;
    // 	Cookies.set('email-check', l.email);
    // 	$(this).children('a').toggleClass('checked');
    // });

    // Add user as donator if they have correct token
    if ($.type(K.urlParam('d')) == "string") {
        $.ajax({
            type: "POST",
            url: "includes/process_donator.php",
            data: {
                load: K.urlParam('d')
            }
        }).done(function(a) {
            window.location.href = window.location.href.split("?")[0];
        });
    }

    pageLoad();
}); /*=====  End of DOCUMENT LOADED  ======*/

/*=================================
=            PAGE LOAD            =
=================================*/
function pageLoad() {

    // Check for clean map params and cookies and hide everything
    if (K.urlParam("noIcon") == "true")
        Cookies.set('hideIcon', true);

    if (K.urlParam("clean") == "true")
        Cookies.set('cleanMenu', true);

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

    if (K.urlParam("overwolf") == "true") {
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

    $.ajaxSetup({
        cache: false
    });

    // Load all available markers
    $.ajax({
        url: "includes/get_markers.php"
    }).done(function(data) {
        K.map.settings.counts.iconUrl = $.parseJSON(data);
    });

    $.ajax({
        url: "includes/check_login.php"

    }).done(function(a) {

        a = $.parseJSON(a);
        K.user.name = a.username || false;
        K.user.type = a.usertype || 0;
        K.user.donate = a.donate || 0;

        !K.user.donate && !K.urlParam("overwolf") && $('#alert').show();
        K.user.donate && $('#alert').hide();

        // setCollectionData();

        // Clear a few things incase you have logged out
        $('#message').removeClass('master');
        var shorts = $('#side-bar .shorts .side-content');
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

            !K.urlParam("overwolf") && $('.side-menu-toggle.shorts').show();
            var key = function(k, t) {
                return '<div class="item"><div>' + k + '</div><div class="grey">-</div> <span>' + t.replace(' Survival', '') + '</span></div>';
            };
            shorts.append('<span class="title">Shortcuts</span>');

            $.each(K.shortcuts, function(sub, a) {
                shorts.append('<span class="title sub">' + sub.space() + '</span>');
                $.each(a, function(k, t) {
                    shorts.append(key(k, t));
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

                    var el = $(this._button),
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

                    Cookies.set('powered', this.enabled());
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

                    var div = document.getElementsByClassName('group-switch')[0];
                    L.DomEvent.disableClickPropagation(div);
                    L.DomEvent.on(div, 'mousewheel', L.DomEvent.stopPropagation);

                    var list = $.merge(K.map.mode[K.mode.get], K.map.mode.all).sort();
                    $.unique(list);
                    $.each(list, function(i, t) {
                        $('.leaflet-menu').append('<a class="leaflet-menu-item switch-active-group' + (K.map.active[t] ? ' active' : '') +
                            '" type="' + t + '">' + t.space() + '</a>');
                    });

                    $('.switch-active-group').on('click', function(e) {
                        var t = $(this).attr('type');
                        $(this).toggleClass('active');
                        K.map.active[t] = !K.map.active[t];
                        Cookies.set('activeMap', $.extend({}, K.map.active));
                        switchLayerGroups();
                    });

                    // $(".group-switch").mCustomScrollbar({
                    // 	scrollInertia: 1000,
                    // 	autoHideScrollbar: true
                    // });

                    // switchLayerGroups();
                }
            }).addTo(K.myMap);

            K.bar.b.grid = L.control.button({
                text: '',
                title: 'Grid modifier tools',
                css: 'grid',
                clickFn: function() {
                    var el = arguments[0]._button;

                    if ($('#slider-box').length) {
                        $('#slider-box').remove();
                        return;
                    }

                    var gridTools = ['rotate', 'x-pos', 'y-pos'];

                    $(el).after('<div id="slider-box"></div>');
                    $.each(gridTools, function(i, type) {
                        $('#slider-box').append('<div class="leaflet-menu-slider"><div id="slider-' + type + '" class="slider-class ' +
                            type + '"><div class="handle-' + type + ' ui-slider-handle"></div></div></div>');

                        $('#slider-' + type).slider({
                            min: (type == "rotate" ? -45 : -100),
                            max: (type == "rotate" ? 45 : 100),
                            step: (type == "rotate" ? 0.5 : 1),
                            value: Cookies.get("grid-" + type) || 0,
                            create: function() {
                                var val = $(this).slider("value");
                                $('.handle-' + type).text((type == "rotate" ? val + " deg" : (type == "x-pos" ? "X: " + val : "Y: " + val)));
                            },
                            slide: function(e, ui) {
                                $('.handle-' + type).text((type == "rotate" ? ui.value + " deg" : (type == "x-pos" ? "X: " + ui.value : "Y: " + ui.value)));
                                Cookies.set("grid-" + type, ui.value);
                                setGridRotate();
                            },
                            change: function(e, ui) {
                                $('.handle-' + type).text((type == "rotate" ? ui.value + " deg" : (type == "x-pos" ? "X: " + ui.value : "Y: " + ui.value)));
                                Cookies.set("grid-" + type, ui.value);
                                setGridRotate();
                            }
                        });
                    });

                    $('#slider-box').append('<div class="slider-resets"></div>');
                    $.each(gridTools, function(i, type) {

                        $('.slider-resets').append('<a class="slider-button reset-' + type + '">Reset ' + type.firstToUpper() + '</a>');

                        $('.slider-button.reset-' + type).on('click', function() {
                            $('#slider-' + type).slider('value', 0);
                        });
                    });

                    $('.slider-resets').append('<a class="slider-button reset-all">Reset All</a>');

                    $('.slider-button.reset-all').on('click', function() {

                        $('.slider-class').slider('value', 0);
                    });

                    var div = L.DomUtil.get('slider-box');
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
                    var i = l._leaflet_id;
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
                K.msg.show({
                    msg: 'Remember, you may have to zoom in to see the layers you create!',
                    time: 2500
                })
            });
        }

        K.user.type && K.check.doOnce && K.bar.b.power._onClick();

        var btn = '#side-bar a.mode',
            b1 = K.mode.not('survival', 'normal'),
            b2 = K.mode.not('last stand', 'normal');
        $.each(K.modes.get, function(i, mode) {
            $(btn).removeClass(mode);
        });
        $(btn + '.one').text(b1.titleCase() + ' Map').addClass(b1);
        $(btn + '.two').text(b2.titleCase() + ' Map').addClass(b2);
        $.each(K.modes.get, function(i, mode) {
            $('#logo').removeClass(mode);
        });
        $('#logo').addClass(K.mode.get);

        /*=====================================
        =            IMPORT LAYERS            =
        =====================================*/
        $.ajax({
            type: "POST",
            url: "includes/file_exists.php",
            data: {
                data: K.user.name
            }
        }).done(function(a) {

            a = $.parseJSON(a);
            K.userPath = a ? "data/" + K.user.name + "/geoJSON.json" : "data/empty.json";

            $.getJSON(K.userPath, function(userJSON) {

                $.getJSON("data/geoJSON.json", function(geoJSON) {

                    $.each(K.group.feature, function(i, mode) {
                        $.each(mode, function(j, group) {
                            group.clearLayers();
                            K.myMap.removeLayer(group);
                        });
                    });

                    K.map.type.counts = {};

                    userJSON.features && $.extend(geoJSON.features, userJSON.features);

                    $.each(geoJSON.features, function(i, e) {
                        var newLayer,
                            p = e.properties,
                            g = e.geometry;

                        if (p) {

                            if (!p.type) p.type = '';

                            // Fill up groupMap for the filters
                            //----------------------------------
                            p.type && !K.isInArray(p.type, K.map.group[p.group]) && K.map.group[p.group].push(p.type);

                            // Fill up typeMap for the filter menus and assigning types automatically
                            if (p.type && p.mode && p.shape) {
                                var filter = false;

                                // Filters for guests only, exclude--> Complete and Error Markers
                                if (K.user.type < 1) {
                                    if (!p.type.contains('Complete') && p.type != 'Error')
                                        filter = true;

                                    // Filters level 1, 2 & 3, exclude--> Complete and Error Markers (unless you created them)
                                } else if (K.user.type <= 3) {

                                    if (p.type.contains(K.user.name)) {
                                        filter = true;

                                    } else if (!p.type.contains('Complete') && p.type != 'Error') {
                                        filter = true;
                                    }

                                    // Staff only view everything on main database
                                } else if (K.user.type >= 4) {
                                    filter = true;
                                }

                                if (filter) {
                                    var val = p.fillColor;
                                    p.shape == 'marker' && (val = p.icon.options.iconUrl);
                                    p.shape == 'polyline' && (val = p.color);

                                    // Count how many we have of each type
                                    if (!K.map.type.counts[p.type])
                                        K.map.type.counts[p.type] = 1;
                                    else
                                        K.map.type.counts[p.type]++;

                                    $.each(K.modes.get, function(i, mode) {

                                        var category = p.category || 'Default',
                                            object = K.map.type[mode];

                                        if (!object[category]) object[category] = {};

                                        if (p.mode.bMatch(mode) || p.mode == "all") {
                                            if (!object[category][p.type])
                                                object[category][p.type] = [];

                                            if (!K.isInArray(val, object[category][p.type])) {
                                                object[category][p.type].push(val);

                                                if (p.shape == "polygon")
                                                    object[category][p.type].push(p.color);
                                            }
                                        }
                                    });
                                }
                            } //--------------- End Filters

                            // Create the array if it does not exist
                            if (!K.map.mode.hasOwnProperty(p.mode))
                                K.map.mode[p.mode] = [];

                            // Fill up the modeMap for automatic mode assigning
                            p.mode && p.type && !K.isInArray(p.type, K.map.mode[p.mode]) && K.map.mode[p.mode].push(p.type);

                            // Add the settings to the settings object for editing menus
                            for (n in p) {
                                p[n] = toCorrectType(n, p[n]);
                                n in K.map.settings.counts && addSet(K.map.settings.counts[n], p[n]);
                            }

                            // Create icon
                            // ----------------------
                            if (p.shape == "marker" && p.type) {

                                var obj = $.extend(true, {}, e, {
                                    properties: {
                                        icon: {
                                            options: {
                                                className: (p.icon.options.className || '').replace(/\w+ground/g, '').trim()
                                            }
                                        }
                                    }
                                });

                                $.each(K.modes.get, function(i, mode) {
                                    var tool = K.tool.marker.layers[mode];
                                    if (p.mode.contains(mode) || p.mode == "all") {
                                        if (!(p.category in tool)) tool[p.category] = {};
                                        if (!(p.type in tool[p.category])) tool[p.category][p.type] = obj;
                                    }
                                });
                            }

                            // Polyline
                            // ----------------------
                            if (g.type == "Polyline") {
                                newLayer = L.polyline(g.coordinates, p);

                                // Polygon or Rectangle
                                // ----------------------
                            } else if (g.type == "Polygon" || g.type == "Rectangle") {

                                var obj = $.extend(p, {
                                    pane: p.pane || (p.className == "poly-hover" ? "zonePane" : "overlayPane")
                                });

                                newLayer = (g.type == "Rectangle" ? L.rectangle(g.coordinates, obj) : L.polygon(g.coordinates, obj));

                                // Marker
                                // ----------------------
                            } else if (g.type == "Point") {

                                newLayer = createMarker($.extend(p, p.icon.options, {
                                    latlng: g.coordinates
                                }));

                                // Add the settings to the settings object for editing menus
                                for (n in p.icon.options) {
                                    p.icon.options[n] = toCorrectType(n, p.icon.options[n]);
                                    n in K.map.settings.counts && addSet(K.map.settings.counts[n], p.icon.options[n]);
                                }
                            }

                            // Popup
                            // ----------------------
                            if ("popup" in e && ("content" in e.popup ||
                                    ("options" in e.popup && "list" in e.popup.options && e.popup.options.list.title))) {

                                var o = e.popup;

                                if (!o.options.className) o.options.className = "";

                                newLayer.bindPopup(o.content, {
                                    className: o.options.className,
                                    list: o.options.list || {}
                                });

                                // Add the settings to the settings object for editing menus
                                K.user.type && addSet(K.map.settings.counts.popup.className, e.popup.options.className);
                            }

                            // Add the Layer editing tools on click if you created it
                            K.user.type && (K.user.type >= 4 || p.creator.toLowerCase() == K.user.name.toLowerCase()) &&
                                newLayer.on('click', K.tool.layer.show);

                            // Add the new layer to the correct group
                            var add = false;

                            // For guests only show main DB layers, exclude--> Complete and Error Markers
                            if (K.user.type < 1) {
                                if (!p.type.contains('Complete') && p.type != 'Error')
                                    add = true;

                                // For levels 1, 2 & 3, show all of main and created by you
                            } else if (K.user.type <= 3) {

                                if (p.type.contains(K.user.name))
                                    add = true;
                                else if (!p.type.contains('Complete') && p.type != 'Error')
                                    add = true;

                            } else if (K.user.type >= 4) {
                                add = true;
                            }

                            add && addToFeatureGroups(newLayer);
                        }
                    });

                    // console.log(K.group.feature);
                    // console.log(K.test.counter);

                    /*=====  End of IMPORT LAYERS  ======*/
                }).fail(function() {
                    console.log("error");
                }).done(function() {

                    onZoomEnd();

                    // Only switch layers, remove duplicates and add draw control if we are superuser
                    K.user.type && switchLayerGroups();

                    //////////////////////////////////////////////////////
                    //
                    //             Side Menu
                    //
                    //////////////////////////////////////////////////////
                    var sb = '#side-bar .filters .side-content';
                    $(sb).html('');
                    $(sb).append('<a class="hide-all">Hide All</a><span href="#" class="title">' + K.mode.get.titleCase() + ' Filters</span>');

                    var list = K.map.type[K.mode.get];
                    list = sortObjByKeys(list);

                    $.each(list, function(t, a) {

                        a = sortObjByKeys(a);

                        var f = Cookies.get('filters') || {};

                        $(sb).append('<span class="sub title">' + (Object.keys(a).length ? t.firstToUpper() : '') + '</span>');
                        $.each(a, function(n, i) {

                            var c = f[n] || false;

                            var el = $('<a />', {
                                "class": "side-bar-button " + (c ? 'inactive' : ''),
                                set: t,
                                label: n,
                                html: $('<span />', {
                                    html: n.space().replace(/Dz/, 'DZ').replace(/ (Survival|Complete)/, '').replace(' Of ', ' of ')
                                }),

                            }).appendTo(sb);

                            $('<span />', {
                                html: '[ x' + K.map.type.counts[n] + ' ]',
                                "class": "quantity"
                            }).appendTo(el);

                            if (i[0].contains('.svg')) {

                                $('<img />', {
                                    src: i[Math.floor(Math.random() * i.length)]
                                }).prependTo(el);

                            } else if (t == "polyline") {

                                $('<div />', {
                                    "class": "polyline"
                                }).css({
                                    backgroundColor: i[0]
                                }).prependTo(el);

                            } else {

                                $('<div />', {
                                    "class": "polygon"
                                }).css({
                                    borderColor: i[1],
                                    backgroundColor: i[0]
                                }).prependTo(el);
                            }

                            // Hide the layers that were hidden on the last load
                            c && showHideLayers(t, n, true);
                        });
                    });

                    // Filter button events
                    $('#side-bar .side-bar-button').off('click').on('click', function() {
                        $(this).toggleClass('inactive');
                        togglehideAll();
                        var t = $(this).attr('label'),
                            g = false,
                            ia = $(this).hasClass('inactive');

                        // Set a cookie for reload

                        var filters = Cookies.get('filters') || {};
                        filters[t] = ia;
                        Cookies.set('filters', filters);

                        // Add the layers to the shown or hidden groups
                        showHideLayers($(this).attr('set'), t, ia);
                    });

                    $('#side-bar .hide-all').off('click').on('click', function() {
                        showhideAllLayers(!$(this).hasClass('hidden'));
                        togglehideAll();
                    });

                    togglehideAll();

                    // Credits
                    $(sb).append(K.credits);

                    // Show side bar if it was open before 
                    if (Cookies.get('sideBar') && !Cookies.get('cleanMenu')) {
                        var a = Cookies.get('sideMenu');
                        $('#side-bar, #side-bar .' + a).addClass('active ' + a);
                    }

                    // $("#side-bar > div").mCustomScrollbar({
                    // 	// scrollInertia: 1000,
                    // 	// mouseWheel: { 
                    // 	// 	scrollAmount: 200
                    // 	// }
                    // });

                    polyHoverAnimation();
                    // translator();
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

                    $('.paypalBtn').off('click').on('click', function(event) {
                        $('#side-bar .filters .paypalBtn').closest('form').submit();
                        // console.log($('#side-bar .filters .paypalBtn').closest('form'));
                    });

                    // Get rid of me later
                    // I just remove defunct cookies
                    // $.each(K.map.type[K.mode.get], function(t, a) {
                    // 	$.each(a, function(n, i) {
                    // 		Cookies.remove(n);
                    // 	});
                    // });
                });
            });
        });
    });
} /*=====  End of PAGE LOAD  ======*/

// Donate
/////////
function doDonator() {

    $.ajax({
        type: "POST",
        url: "includes/process_donator.php",
        data: {
            email: $('#donator').val()
        }
    }).done(function(a) {
        // console.log(a);
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
        type: "POST",
        url: "includes/process_login.php",
        data: {
            email: _this.username.value,
            p: _this.p.value
        }
    }).done(function(a) {

        if (Cookies.get('username')) {
            K.user.name = Cookies.get('username');
            K.user.type = Cookies.get('usertype');
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
        type: "POST",
        url: "includes/process_register.php",
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
        type: "POST",
        url: "includes/process_reset.php",
        data: {
            token: K.urlParam("token"),
            p: _this.p.value
        }
    }).done(function(a) {

        a = a.bMatch(/^(\{|\[])".*(\}|\])$/) ? $.parseJSON(a) : a;
        if ($.type(a) == 'object' && a.error)
            $('#side-bar .login .error').html(a.error);
        else
            window.location.href = window.location.href.split("?")[0];

    });
}

// Forgot
////////////
function doForgot() {

    _this = document.getElementById('forgot');

    $.ajax({
        type: "POST",
        url: "includes/process_forgot.php",
        data: {
            email: _this.email.value
        }
    }).done(function(a) {

        var result = a.bMatch(/^(\{|\[])".*(\}|\])$/) ? $.parseJSON(a) : a;

        $.ajax({
            url: "includes/login.php"

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

function translator() {
    return;
    if (!K.translator || !K.translator.lang)
        return

    K.local.added = false;

    $('body *:not(c)').contents().filter(function() {
        return (this.nodeType == 3) && this.nodeValue.match(/\S{3,}/) && !$(this).parent().hasClass('dnt') &&
            !$(this).is('textarea') && !$(this).is('input') &&
            !this.nodeValue.bMatch(/(x\d+|^ \d{4}$|^\d+$|[^\w]{3,}|\d+[trns]|\.\w{1,3}$)/);
    }).wrap("<c class='trn' />");

    // console.log(K.lng)

    $.when(K.translator.lang(K.lng)).done(function() {

        $('.trn').each(function(index, el) {
            var str = $(this).attr('data-trn-key');

            // console.log(str)

            if (!(str in K.local.data) && str != undefined) {
                K.local.data[str] = {};
                // console.log("Translation added: " + str)
                K.local.added = true;
            }
        });
    });

    // console.log(K.local.data);

    // console.log(K.local.added);

    // Save this all to a file
    !$('html').hasClass('translated-ltr') && K.local.added && $.ajax({
        type: "POST",
        url: "includes/write_local.php",
        data: {
            data: JSON.stringify(K.local.data),
            delete: JSON.stringify({})
        }
    }).done(function(a) {
        // console.log(a);
    });
}

//////////////////////////////////////////////////////
//
//             Shortcuts
//
//////////////////////////////////////////////////////   
function keypressEvent(e) {
    // console.log(e.which);

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

    var quickAction = function(_e, type) {
        K.tool.marker.show(true);
        $('#marker-tools a').removeClass('enabled');
        $('#marker-tools a[type="' + type + '"]').addClass('enabled');
        K.bar.draw.Marker.enable();
    };

    // Quick Marker Rucksack :---> S
    if (e.which == 115) {
        e.preventDefault();
        quickAction(e, 'Rucksack');

        // Quick Maker Electronics :---> 1
    } else if (e.which == 49) {
        e.preventDefault();
        quickAction(e, 'ElectronicsSurvival');

        // Quick Maker Fabric :---> 2
    } else if (e.which == 50) {
        e.preventDefault();
        quickAction(e, 'FabricSurvival');

        // Quick Maker Tools :---> 3
    } else if (e.which == 51) {
        e.preventDefault();
        quickAction(e, 'ToolsSurvival');
        // console.log("content");

        // Quick Maker Weapon Parts :---> 4
    } else if (e.which == 52) {
        e.preventDefault();
        quickAction(e, 'WeaponPartsSurvival');

        // Quick Maker Clothes :---> 5
    } else if (e.which == 53) {
        e.preventDefault();
        quickAction(e, 'Clothing');

        // Quick Maker Medkit :---> E
    } else if (e.which == 101) {
        e.preventDefault();
        quickAction(e, 'Medkit');

        // Quick Maker Medication :---> A
    } else if (e.which == 97) {
        e.preventDefault();
        quickAction(e, 'Medication');

        // Quick Maker Food :---> F
    } else if (e.which == 102) {
        e.preventDefault();
        quickAction(e, 'Food');

        // Quick Maker Drink :---> D
    } else if (e.which == 100) {
        e.preventDefault();
        quickAction(e, 'Drink');

        // Quick Maker Gear :---> Q
    } else if (e.which == 113) {
        e.preventDefault();
        quickAction(e, 'Gear');

        // Quick Maker Weapon :---> W
    } else if (e.which == 119) {
        e.preventDefault();
        quickAction(e, 'Weapon');

        // Quick Maker Ground :---> Z
    } else if (e.which == 122) {
        e.preventDefault();
        $('#marker-tools input[value=""]').prop("checked", true);
        $('#marker-tools a').removeClass('underground overground');

        // Quick Maker Underground :---> X
    } else if (e.which == 120) {
        e.preventDefault();
        $('#marker-tools input[value="underground"]').prop("checked", true);
        $('#marker-tools a').removeClass('underground overground').addClass('underground');

        // Quick Maker Overground :---> C
    } else if (e.which == 99) {
        e.preventDefault();
        $('#marker-tools input[value="overground"]').prop("checked", true);
        $('#marker-tools a').removeClass('underground overground').addClass('overground');
    }
};

//////////////////////////////////////////////////////
//
//            Draw Event Created
//
//////////////////////////////////////////////////////
function drawEventCreated(e) {
    var layer = e.layer,
        type = e.layerType,
        val = '',
        popup = false,
        copy = Cookies.get('copy') || {};

    // Marker
    // ----------------------
    if (type == 'marker') {

        var selected = $('#marker-tools a.enabled');

        if (K.tool.marker.enabled() && selected.length) {

            var lvl = $("input[name='radio']:checked").val(),
                cat = selected.attr('category'),
                typ = selected.attr('type'),
                j = K.tool.marker.layers[K.mode.get][cat][typ],
                p = j.properties;

            lvl = (lvl ? ' ' + lvl : '');

            layer = createMarker($.extend({}, p, p.icon.options, {
                id: ID(),
                latlng: layer._latlng,
                className: p.icon.options.className + lvl,
            }));

            popup = j.popup;

        } else {

            icon = $.type(mark = copy.marker) == 'object' ? mark : K.map.defaults.marker;

            layer = createMarker($.extend({}, icon, {
                id: ID(),
                latlng: layer._latlng
            }));
        }
    }

    // Polygon or Rectangle
    // ----------------------
    if (type == 'polygon' || type == 'rectangle') {

        var obj = copy.polygon || K.map.defaults.polygon;
        if (obj && $.type(obj) == 'object') {

            var ll = layer._latlngs[0].removeDupes();

            $.extend(obj, {
                id: ID(),
                pane: (obj.className == "poly-hover" ? "zonePane" : "overlayPane"),
                mode: obj.mode || K.mode.get
            });

            layer = type == 'rectangle' ? L.rectangle(ll, obj) : L.polygon(ll, obj);
        }
    }

    // Polyline
    // ----------------------
    if (type == 'polyline') {

        var obj = copy.polyline || K.map.defaults.polyline;
        if (obj && $.type(obj) == 'object') {

            layer = L.polyline(layer._latlngs.removeDupes(), $.extend(obj, {
                id: ID(),
                mode: obj.mode || K.mode.get
            }));
        }
    }

    o = popup || copy[type + 'Popup'] || {};

    // Bind a popup to the new layer
    if (o.content || (o.options && o.options.list && o.options.list.title))
        layer.bindPopup(o.content, $.extend(true, {}, o.options));

    // Add the new layer to the map
    layer.options.creator = K.user.name;
    layer.options.group = layer.options.group || "group08";

    K.group.mode[layer.options.group].addLayer(layer);
    layer.on('click', K.tool.layer.show);

    layer.saved(false);

    switchLayerGroups();
    polyHoverAnimation();
}

function setCollectionData() {

    $('#side-bar .img-check').removeClass('checked');

    $.ajax({
        type: "POST",
        url: "includes/collection_data_get.php"
    }).done(function(a) {

        Cookies.json = true;

        setData = a.bMatch(/(\{|\[])".*(\}|\])/) ? $.parseJSON(a) : false;

        if (!setData) {
            var setData1 = Cookies.getJSON('setData1');
            var setData2 = Cookies.getJSON('setData2');
            if ($.type(setData1) === 'object' && $.type(setData2) === 'object')
                setData = $.extend({}, setData1, setData2);
        }

        setData && $.each(setData, function(index, val) {
            val && $('#side-bar .img-check[name="' + index + '"]').addClass('checked');
        });
        updateSetCounter();
    });
}

function updateSetCounter() {

    $('.set-piece').each(function(index, el) {

        var count = $(this).find('.img-check.checked').length;

        $(this).find('.counter').html(count || '');
        $(this).find('.set-bonus').removeClass('active');

        for (var i = count; i > 0; i--) {
            $(this).find('.set-bonus.' + i).addClass('active');
        }
    });

    var checks = '#side-bar .img-check',
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

    // if (total == got) {
    // 	m = "You have all<span> " + total + " </span>set pieces, of all<span> " + totalSets + " </span> sets! Go you! Now what?? Try Survival!"
    // } else if (left && got) {
    // 	m = "You have<span> " + got + " </span>of the<span> " + total + " </span>pieces, only<span> " + left + " </span>to go! ";
    // 	if (sets)
    // 		m += "You also have<span> " + sets + " </span>of the<span> " + totalSets + " </span>sets complete!";
    // 	else if (got > 5)
    // 		m += "You don't have any of the<span> " + totalSets + " </span>sets complete yet though. Shame!"
    // } else {
    // 	m = "There are<span> " + total + " </span>set pieces in<span> " + totalSets + " </span>sets to find! Get collecting!";
    // }

    // $('#side-bar .gear .message').html(m);

    // Collect and store the data for reload
    var setData = {};
    $(checks).each(function(index, el) {
        setData[$(this).attr('name')] = $(this).hasClass('checked');
    });

    $('#side-bar .warning').html('');

    if (!K.user.type) {
        $('#side-bar .warning').html("This data is stored as a cookie, if you would\
            like it to be persistant, please create an account or sign in.");

        var setData1 = {};
        var setData2 = setData;

        while (Object.keys(setData1).length < Object.keys(setData2).length) {
            var key = Object.keys(setData2)[0];
            setData1[key] = setData2[key];
            delete setData2[key];
        }

        Cookies.set('setData1', setData1);
        Cookies.set('setData2', setData2);

    } else {

        $.ajax({
            type: "POST",
            url: "includes/collection_data_set.php",
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
    if ($.type(obj) != "boolean") {
        obj.remove();
        obj = false;
    }
}

function removeEmpty(obj) {
    var typ = $.type(obj) == "array";

    $.each(obj, function(i, v) {

        if (K.isInArray($.type(v), ['object', 'array']))

            obj[i] = removeEmpty(v);

        var t = $.type(v);

        if ((t == "string" && !v) ||
            (t == "object" && !Object.keys(v).length) ||
            (t == "array" && !v.length) ||
            (t == "function"))

            typ ? obj.splice(i, 1) : delete obj[i];
    });

    return obj;
}

function sortObjByKeys(object) {
    var keys = Object.keys(object),
        rObj = {};

    keys.sort(naturalCompare);

    $.each(keys, function(i, v) {
        rObj[v] = object[v];
    });

    return rObj;
}

function addToFeatureGroups(layer) {
    var m = layer.options.mode,
        g = layer.options.group;
    $.each(K.modes.get, function(i, mode) {
        (m.contains(mode) || m == "all") && K.group.feature[mode][g].addLayer(layer);
    });
}

function polyHoverAnimation(stop) {
    var polys = $('path.leaflet-interactive:not(.poly-hover):not([fill="none"])');

    polys.off('mouseover mouseout');

    if (stop)
        return;

    polys.on('mouseover', function() {
        var _this = $(this),
            cls = _this.attr('class').split(' ');

        $.each(cls, function(i, c) {
            if (c.contains('phg'))
                _this = $('path.' + c);
        });

        _this.addClass('hover');

    }).on('mouseout', function() {
        var _this = $(this),
            cls = _this.attr('class').split(' ');

        $.each(cls, function(i, c) {
            if (c.contains('phg'))
                _this = $('path.' + c);
        });

        _this.removeClass('hover');
    });
}

function editIconMessage() {

    var editIcon = $('.leaflet-editing-icon'),
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

    var grid = $('.leaflet-overlay-pane').children().last();

    if (grid.attr('src') != "images/grid.svg")
        return

    var gridM = grid.css('transform').split(',');

    K.grid.x = (!K.grid.x || reset ? gridM[4] : K.grid.x);
    K.grid.y = (!K.grid.y || reset ? gridM[5].replace(')', '') : K.grid.y);
    K.grid.r = Cookies.get('grid-rotate') || 0;

    var gridXAlt = Cookies.get('grid-x-pos') || 0,
        gridYAlt = Cookies.get('grid-y-pos') || 0;

    Number(K.grid.x);
    Number(K.grid.y);
    Number(K.grid.r);
    Number(gridXAlt);
    Number(gridYAlt);

    var css = 'translate3d(' + (K.grid.x * (gridXAlt / 100000 + 1)) + 'px, ' + (K.grid.y * (gridYAlt / 100000 + 1)) + 'px, 0px) rotate(' + K.grid.r + 'deg)';
    // console.log(gridX, gridXAlt, gridY, gridYAlt, (gridXAlt / 100000 + 1), (gridYAlt / 100000 + 1));
    // console.log('translate3d('+css+')');

    grid.css({
        transformOrigin: 'center',
        transform: css
    });
}

function togglehideAll() {
    if (!$('#side-bar .side-bar-button:not(.inactive)').length)
        $('#side-bar .hide-all').addClass('hidden').html('Show All');
    else
        $('#side-bar .hide-all').removeClass('hidden').html('Hide All');
}

//////////////////////////////////////////////////////
//
//             Create Marker
//
//////////////////////////////////////////////////////
function createMarker(p) {
    cn = p.className || '';

    p.html = (p.iconUrl ? "" : p.html);

    return L.marker(p.latlng, {
        icon: L.divIcon({
            iconUrl: p.iconUrl || '',
            iconSize: p.iconSize || '',
            html: p.html || (cn.contains('anim-icon') ? "<img class='halo' src='images/_a.svg'>" : "") +
                "<img src='" + (p.iconUrl || '') + "' class='icon'>",
            className: cn.filter()
        }),
        creator: p.creator,
        category: p.category || 'default',
        id: p.id,
        opacity: p.opacity || '',
        group: p.group || '',
        type: p.type || getType(p.iconUrl, p.group, (p.iconUrl ? 'marker' : 'html')),
        shape: p.shape || 'marker',
        riseOnHover: true,
        zIndexOffset: K.isInArray(p.type, K.map.zIndex) ? 1000 : 0,
        mode: p.mode || getMode(p.type)
    });
}

function showhideAllLayers(show) {
    $.each(K.map.type[K.mode.get], function(category, array) {
        $.each(array, function(type, i) {
            var btn = $('[set="' + category + '"][label="' + type + '"]');

            btn.removeClass('inactive');
            show && btn.addClass('inactive');

            var filters = Cookies.get('filters') || {};
            filters[type] = show;
            Cookies.set('filters', filters);

            showHideLayers(category, type, show);
        });
    });
}

// Used to show hide layers based on attributes
function showHideLayers(category, type, h) {

    switchLayerGroups(true);

    var g, show, hide;
    // Find which group to look in
    $.each(K.map.group, function(grp, a) {
        if (K.isInArray(type, a)) {
            g = K.group.mode[grp];

            show = (h ? K.group.mode.groupHidden : g);
            hide = (h ? g : K.group.mode.groupHidden);

            show && hide && hide.eachLayer(function(l) {
                var i = l._leaflet_id;
                if (l.options.type == type && l.options.category == category) {
                    show.addLayer(hide.getLayer(i));
                    hide.removeLayer(i);
                }
            });
        }
    });

    switchLayerGroups();
    polyHoverAnimation();
}

function toCorrectType(n, v) {
    var t = K.map.settings.types[n];
    if (t == "number")
        return Number(v);
    else if (t == "boolean")
        return !!v;
    return v;
}

// Check if the key is in the object then place it if not
function addSet(i, v, n) {

    if ($.type(v) == "array")
        v = v.join(',');
    v && !K.isInArray(v, i) && i.push(v);
}

function offset(latlng, oLat, oLng) {
    if (oLat)
        latlng.lat += oLat;
    if (oLng)
        latlng.lng += oLng;
    return latlng;
}

function textColor(hex) {
    var hex = hex.substring(1), // strip #
        rgb = parseInt(hex, 16), // convert rrggbb to decimal
        r = (rgb >> 16) & 0xff, // extract red
        g = (rgb >> 8) & 0xff, // extract green
        b = (rgb >> 0) & 0xff, // extract blue
        luma = 0.2126 * r + 0.7152 * g + 0.0722 * b; // per ITU-R BT.709

    return (luma < 40 ? "#ffffff" : '#000000');
}

function removeLayer(layer, group, del) {
    var grp = group || layer.options.group,
        id = layer._leaflet_id;
    del && K.save.delete(layer);
    K.group.draw.removeLayer(id);
    $.each(K.modes.get, function(i, mode) {
        K.group.feature[mode][grp].removeLayer(id);
    });
}

// Create a L.point from array or seperate numbers
function createPoint(e, f) {
    if (!$.isArray(e))
        return L.point(e, f);
    return L.point(e[0], e[1]);
}

// Used to add whole groups to and from the Draw Control layer
function switchLayerGroups(d) {

    $.ajax({
        url: "includes/check_login.php"

    }).done(function(a) {

        a = $.parseJSON(a);
        K.user.name = a.username || false;
        K.user.type = a.usertype || 0;

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
                    l.editing.currentGroup = "drawLayer";
                    K.group.draw.addLayer(K.group.mode[l.options.group].getLayer(l._leaflet_id));
                    K.group.mode[l.options.group].removeLayer(l._leaflet_id);
                }
            });
        });

        K.myMap.removeLayer(K.group.draw).addLayer(K.group.draw).addLayer(K.group.mode.groupAll);

        // Show and hide layers after the change
        onZoomEnd(true);
    });
}

//////////////////////////////////////////////////////
//
//             Save to geoJSON
//
//////////////////////////////////////////////////////
function createGeoJSON() {

    $('#settings-menu').remove();

    K.backup = K.user.name;

    $.ajax({
        url: "includes/check_login.php"

    }).done(function(a) {

        a = $.parseJSON(a);
        K.user.name = a.username || false;
        K.user.type = a.usertype || 0;


        if (K.backup != K.user.name) {
            alert("I'm sorry but your account information is incorrect, you cannot save your changes! Please log in and try again!");
            return;
        }

        K.msg.show({
            msg: 'SAVING...',
            dots: true
        });

        var feature,
            geoData = {
                features: {},
                deleted: K.save.deleted
            };

        // Switch the groups back to their correct homes first
        switchLayerGroups(true);

        // Go though each layer
        K.save.unsaved.eachLayer(function(layer) {

            // Marker
            // ----------------------
            if ("_latlng" in layer) {
                feature = {
                    properties: {
                        icon: {
                            options: {}
                        }
                    },
                    geometry: {
                        type: "Point",
                        coordinates: layer._latlng
                    }
                };

                var iO = layer.options.icon.options;

                if ($.type(iO.html) === 'array')
                    iO.html = iO.html.join('');

                $.each(layer.options, function(k, z) {
                    feature.properties[k] = fix(z);
                });

                $.each(feature.properties, function(i, v) {
                    !K.isInArray(i, K.map.property.marker) && delete feature.properties[i];
                    !v && delete feature.properties[i];
                });

                iO.iconUrl && delete feature.properties.icon.options.html;

                $.each(feature.properties.icon.options, function(i, v) {
                    !v && delete feature.properties[i];
                });

                delete feature.properties.icon._initHooksCalled;

                // Polyline
                // ----------------------
            } else if ("_latlngs" in layer && "lat" in layer._latlngs[0]) {

                feature = {
                    properties: {},
                    geometry: {
                        type: "Polyline",
                        coordinates: layer._latlngs
                    }
                };

                $.each(layer.options, function(k, z) {
                    feature.properties[k] = fix(z);
                });

                $.each(feature.properties, function(i, v) {
                    !K.isInArray(i, K.map.property.polyline) && delete feature.properties[i];
                    !v && delete feature.properties[i];
                });

                // Polygon or Rectangle
                // ----------------------
            } else if ("_latlngs" in layer) {
                feature = {
                    properties: {},
                    geometry: {
                        type: polyType(layer._latlngs),
                        coordinates: layer._latlngs
                    }
                };

                $.each(layer.options, function(k, z) {
                    feature.properties[k] = fix(z);
                });

                $.each(feature.properties, function(i, v) {
                    !K.isInArray(i, K.map.property.polygon) && delete feature.properties[i];
                    !v && delete feature.properties[i];
                });
            }

            if ("_popup" in layer && layer._popup && layer._popup._content) {

                feature.popup = {
                    content: layer._popup._content,
                    options: {
                        className: layer._popup.options.className,
                        list: layer._popup.options.list
                    }
                };

                // Set popup content to variable if one exists
                $.each(K.popupContent, function(k, s) {
                    if (layer._popup._content == s) {
                        feature.popup.content = k;
                    }
                });

                if (feature.popup.options.list.title) delete feature.popup.content;
            }

            feature.properties.mode = layer.options.mode || getMode(layer.options.type);
            feature.properties.id = layer.options.id || ID();

            // Push the new item into the feature object
            geoData.features[feature.properties.id] = feature;

        });

        //Save this all to a file
        $.ajax({
            type: "POST",
            url: "includes/write.php",
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

function fix(s) {
    return (Number(s) ? Number(s) : s)
}

function polyType(l) {
    return l.length == 1 && l[0].length == 4 && l[0][0].lat == l[0][3].lat && l[0][0].lng == l[0][1].lng ? 'Rectangle' : l[0].lat ? 'Polyline' : 'Polygon';
}

// Get the layer type for the show hide menu
function getType(o, g, a) {
    if (!K.isInArray(a, ["marker", "polyline", "polygon"]))
        return '';
    var type = '';
    o = o.replace('images/', '');
    $.each(K.map.type, function(h, tg) {

        $.each(tg[a], function(i, v) {

            if (K.isInArray(o, v)) {
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
        if (K.isInArray(type, array)) {
            fMode = mode;
            return;
        }
    });
    return fMode;
}

// Functions to show and hide layers based on zoom level and wether editing the layer
function onZoomEnd() {
    setGridRotate(true);
    zoom = K.myMap.getZoom();

    $.each(K.group.mode, function(g, n) {
        var a = g.replace('group', '');
        a = a.contains('_') ? a.split('_') : a.bMatch(/\d+/) ? Number(a) : a.contains('Hidden') ? false : 0;

        if ((typeof a == "number" && zoom >= a) || (typeof a == "object" && zoom >= a[0] && zoom <= a[1])) {
            if (g == "groupDZ")
                K.myMap.removeLayer(K.group.mode[g])
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
        var range = input.createTextRange();
        range.collapse(true);
        range.moveEnd('character', selectionEnd);
        range.moveStart('character', selectionStart);
        range.select();
    }
}

function setCaretToPos(input, posA, posB) {
    setSelectionRange(input, posA, (posB || posA));
}

var ID = function() {
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

    for (var i = 0; i < a.length; ++i) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

var tagsToReplace = {
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
    var ax = [],
        bx = [];

    a.replace(/(\d+)|(\D+)/g, function(_, $1, $2) {
        ax.push([$1 || Infinity, $2 || ""])
    });
    b.replace(/(\d+)|(\D+)/g, function(_, $1, $2) {
        bx.push([$1 || Infinity, $2 || ""])
    });

    while (ax.length && bx.length) {
        var an = ax.shift();
        var bn = bx.shift();
        var nn = (an[0] - bn[0]) || an[1].localeCompare(bn[1]);
        if (nn) return nn;
    }

    return ax.length - bx.length;
}