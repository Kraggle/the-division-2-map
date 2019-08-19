import { jQuery as $ } from '../jQuery/jquery3.4.1.js';
import { L } from '../Leaflet/importer.js';
import { K } from '../K.js';
import { createGeoJSON } from "./to-geo-json.js";

K.bar = {
    b: {
        save: false,
        group: false,
        grid: false,
        tools: false
    },
    draw: {},
    edit: {}
};

K.check = {
    editing: false,
    deleting: false,
    disabled: false,
    doOnce: true,
    grabbing: false
};

K.drawControl = false;

// MARK: [K] Group
K.group = {
    _search: {},

    save: new L.FeatureGroup(),

    draw: new L.FeatureGroup([], {
        makeBoundsAware: false
    }),

    feature: {},

    getLayer: function(id) {
        let r = null;
        this.mode.everyLayer.eachLayer(function(l) {
            if (l.options.id == id) r = l;
        });
        return r;
    },

    addLayer: function(layer) {
        if (!(layer instanceof L.Layer)) return this;

        layer.currentGroup = layer.options.group;

        for (let mode in layer.options.mode) {
            if (!K.in(mode, this.feature)) continue;
            this.feature[mode][layer.options.group].addLayer(layer);
            this.feature[mode].everyLayer.addLayer(layer);
        }

        return this;
    },

    removeLayer: function(layer, group) {
        if (!(layer instanceof L.Layer)) return this;
        !group && (group = layer.currentGroup || layer.options.group);

        for (let mode in layer.options.mode) {
            this.feature[mode][group].removeLayer(layer);
            this.feature[mode].everyLayer.removeLayer(layer);
        }

        return this;
    },

    all: function() {
        return this.feature[K.mode].everyLayer._layers;
    },

    search: function() {
        if (K.empty(this._search)) {
            const search = this._search;
            let i = 0;

            this.feature[K.mode].everyLayer.eachLayer(function(l) {
                K.in('type', l.options) && !K.empty(l.options.type) && (search[l.options.id] = {
                    layer: l,
                    creator: l.options.creator,
                    type: l.options.type.space(),
                    content: l._popup ? $('<div />', { html: l._popup._content }).text().replace(/[\s\n]+/g, ' ').space() : '',
                    category: l.options.category,
                    date: i++
                });
            });
        }

        return this._search;
    },

    clearSearch: function() {
        this._search = {};
    }
};

K.grid = {
    overlay: L.imageOverlay('images/grid.svg', [
        [-19.05, -19.05],
        [19.05, 19.05]
    ]),
    x: 0,
    y: 0,
    r: 0
};

// MARK: [K] Save
K.save = {
    unsaved: new L.FeatureGroup(),
    deleted: [],
    data: false,

    add: function(layer) {
        this.addLayer(layer);
        this.check();
        this.store();
    },

    remove: function(layer) {
        this.removeLayer(layer);
        this.check();
        this.store();
    },

    delete: function(layer) {
        this.removeLayer(layer);
        this.deleted.push(layer.options.id);
        K.group.removeLayer(layer);
        this.check();
        this.store();
    },

    check: function() {
        const r = K.length(this.unsaved._layers) + this.deleted.length;
        if (r) {
            K.bar.b.save.enable();
            K.bar.b.cancel.enable();
        } else {
            K.bar.b.save.disable();
            K.bar.b.cancel.disable();
        }
        return r;
    },

    store: function() {
        createGeoJSON(true);
        K.local('unsaved', this.data);
    },

    clear: function() {
        this.unsaved.clearLayers();
        this.deleted = [];
        this.data = false;
        K.local('unsaved', this.data);
        this.check();
    },

    addLayer: function(layer) {
        if (!(layer instanceof L.Layer)) return;
        !this.unsaved.hasLayer(layer) && this.unsaved.addLayer(layer);
    },

    removeLayer: function(layer) {
        if (!(layer instanceof L.Layer)) return;
        this.unsaved.hasLayer(layer) && this.unsaved.removeLayer(layer);
    },
};

K.map = {
    active: [],
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
        counts: {},
        add: function(type) {
            if (type) {
                !K.in(type, this.counts) && (this.counts[type] = 0);
                this.counts[type] += 1;
                this.updateButton(type);
            }
        },
        remove: function(type) {
            if (type) {
                this.counts[type] -= 1;
                this.updateButton(type);
            }
        },
        updateButton: function(type) {
            $(`.side-bar-button[label=${type}] .quantity`).text(`[ x${this.counts[type]} ]`);
        }
    },
    mode: {},
    property: { // these are used to clear unwanted settings before saving
        polygon: [
            'category', 'color', 'weight', 'opacity', 'fillColor',
            'fill', 'fillOpacity', 'stroke', 'group',
            'type', 'className', 'mode', 'complete', 'prerequisites', 'onComplete'
        ],
        circle: [
            'category', 'color', 'weight', 'opacity', 'fillColor',
            'fill', 'fillOpacity', 'stroke', 'group', 'type',
            'className', 'mode', 'complete', 'prerequisites', 'onComplete'
        ],
        rectangle: [
            'category', 'color', 'weight', 'opacity', 'fillColor',
            'fill', 'fillOpacity', 'stroke', 'group', 'type',
            'className', 'mode', 'complete', 'prerequisites', 'onComplete'
        ],
        polyline: [
            'category', 'color', 'weight', 'opacity', 'stroke',
            'complete', 'group', 'type', 'className', 'mode', 'prerequisites', 'onComplete'
        ],
        marker: [
            'category', 'group', 'type', 'time', 'iconSize', 'html', 'cycle',
            'mode', 'complete', 'link', 'iconUrl', 'className', 'prerequisites', 'onComplete'
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
            mode: {
                [K.mode]: {}
            },
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
            mode: {
                [K.mode]: {}
            },
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
            mode: {
                [K.mode]: {}
            },
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
            mode: {
                [K.mode]: {}
            },
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
            mode: {
                [K.mode]: {}
            },
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
};

// MARK: [K] Settings
K.settings = { // these are for the layer tools, so it knows which settings to show

    add: function(setting, value, shape, popup) {

        K.isArray(value) && (value = value.join(','));

        let i = this[popup ? 'popup' : 'main'][setting] || false;
        i && K.in('values', i) && (i = i.values);

        // Check if the key is in the object then place it if not
        if (!K.empty(value) && i) {
            shape = K.settingShape(shape);
            !(value in i) && (i[value] = { shape: [] });
            !K.has(shape, i[value].shape) && i[value].shape.push(shape);
        }
    },

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
            description: `Time is used in conjunction with Complete to only set a layer as complete for this length of time. This is helpful for things that can be collected again at a later date. For this to work 'Complete' must be 'True'.`,
            for: ['marker', 'polygon', 'polyline', 'circle', 'rectangle'],
            type: 'number'
        },
        link: {
            description: 'Link is used in conjunction with Complete to also hide the linked layer(s) after the this layer has been completed. The ID of the layers are required to link them. The list should be comma separated.',
            for: ['marker', 'polygon', 'polyline', 'circle', 'rectangle'],
            type: 'array'
        },
        onComplete: {
            values: {
                toStoryMode: { shape: [] }
            },
            description: `Used along with complete, this is useless unless you use the preset actions, this just tells the javascript what to do with the layer once it is marked as complete.`,
            for: ['marker', 'polygon', 'polyline', 'circle', 'rectangle'],
            type: 'string'
        },
        prerequisites: {
            description: `Used along with complete, if there are any layer ids here, then this cannot be compelted until they are first complete.`,
            for: ['marker', 'polygon', 'polyline', 'circle', 'rectangle'],
            type: 'array'
        },
        cycle: {
            description: `Used to cycle visible marker, handy for when there are multiple, overlapping markers, like with the Activities and Resource Nodes.`,
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
};

K.mode = K.local('mode') || 'Story Mode';

K.popupContent = {};

// MARK: [K] UpdateMarker
K.updateMarker = function(icon) {
    const copy = K.local('copy') || {};
    icon = icon || (K.in('marker', copy) ? copy.marker.o : {});

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

    } else K.extend(K.drawIcon.options, options);
};

K.settingShape = shape => K.has(shape, ['polyline', 'rectangle']) ? 'polygon' : shape;

K.getSetting = (obj, setting) => {
    const m = K.in('mode', obj) && K.in('o', obj.mode[K.mode]) ? obj.mode[K.mode].o : false;
    return m && K.in(setting, m) ? m[setting] : obj[setting];
};

K.strongholds = [
    '_tthw137te',
    '_hy004vpns',
    '_isbq2fsd0',
    '_zvuruwgpn'
];

K.getWorldTier = () => {
    let i = 1;
    K.each(K.strongholds, function(j, id) {
        K.complete.is(id) && i++;
    });
    return i;
};

K.setWorldTier = () => {
    $('[mode="World Tier"] img').attr('src', `images/mode-world-tier-${K.getWorldTier()}.svg`);
};

K.modes.create = function() {
    K.each(this.get, function(i, mode) {
        K.group.feature[mode] = {};
        K.map.type[mode] = {};
    });
};

K.modes.clear = function() {
    K.each(this.get, function(i, mode) {
        K.map.type[mode] = {};
    });
};

K.modes.create();
K.each(K.group.feature, function(i, m) {
    K.each(K.map.group, function(g) {
        m[g] = new L.FeatureGroup([], {
            makeBoundsAware: true
        });
    });
});

K.initMap = () => {
    K.myMap = L.map('map-id', {
        center: K.local('pan') || [0, 0],
        zoom: K.local('zoom') || (K.touchOnly ? 6 : 7),
        minZoom: K.touchOnly ? 6 : 7,
        maxZoom: K.touchOnly ? 12 : 15,
        maxBounds: [
            [8.3, -14.9],
            [-8.3, 14.9]
        ],
        zoomSnap: 0.25,
        zoomDelta: 0.5,
        wheelPxPerZoomLevel: 100,
        zoomControl: false,
        attributionControl: true,
        closePopupOnClick: false
    });

    K.myMap.createPane('messagePane', L.DomUtil.get('message'));
    K.myMap.createPane('mapPane');
    K.myMap.createPane('zonePane');
}

K.group.mode = K.group.feature[K.mode];

K.refreshMap = () => {
    K.myMap._size = false;
    K.myMap.fire('zoomend');
}