import { jQuery as $ } from '../jQuery/jquery3.4.1.js';
import { L } from '../Leaflet/leaflet1.0.3.js';
import { K } from '../K.js';

// MARK: [ [  F U N C T I O N S  ] ]
export function randomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}

export function empty(obj) {
    if (K.type(obj) != 'boolean') {
        obj.remove();
        obj = false;
    }
}

export function removeEmpty(obj) {
    let typ = K.type(obj) == 'array';

    K.each(obj, function(i, v) {

        if (K.has(K.type(v), ['object', 'array']))

            obj[i] = removeEmpty(v);

        let t = K.type(v);

        if ((t == 'string' && !v) ||
            (t == 'object' && !K.length(v)) ||
            (t == 'array' && !v.length) ||
            (t == 'function'))

            typ ? obj.splice(i, 1) : delete obj[i];
    });

    return obj;
}

export function sortObjByKeys(object) {
    let keys = Object.keys(object),
        rObj = {};

    keys.sort(naturalCompare);

    K.each(keys, function(i, v) {
        rObj[v] = object[v];
    });

    return rObj;
}

export function polyHoverAnimation(stop) {
    let poly = $('path.leaflet-interactive:not(.poly-hover):not([fill="none"])');

    poly.off('mouseover mouseout');

    if (stop)
        return;

    poly.on('mouseover', function() {
        let _this = $(this),
            cls = _this.attr('class').split(' ');

        K.each(cls, function(i, c) {
            if (c.contains('phg'))
                _this = $('path.' + c);
        });

        _this.addClass('hover');

    }).on('mouseout', function() {
        let _this = $(this),
            cls = _this.attr('class').split(' ');

        K.each(cls, function(i, c) {
            if (c.contains('phg'))
                _this = $('path.' + c);
        });

        _this.removeClass('hover');
    });
}

export function editIconMessage() {

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

export function setGridRotate(reset) {

    let grid = $('.leaflet-overlay-pane').children().last();

    if (grid.attr('src') != 'images/grid.svg')
        return

    let gridM = grid.css('transform').split(',');

    K.grid.x = (!K.grid.x || reset ? gridM[4] : K.grid.x);
    K.grid.y = (!K.grid.y || reset ? gridM[5].replace(')', '') : K.grid.y);
    K.grid.r = K.local('grid-rotate') || 0;

    let gridXAlt = K.local('grid-x-pos') || 0,
        gridYAlt = K.local('grid-y-pos') || 0;

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

export function toggleHideIcons() {
    if (!$('#side-bar .side-bar-button:not(.inactive)').length)
        $('#side-bar .hide-all').addClass('hidden');
    else
        $('#side-bar .hide-all').removeClass('hidden');

    $('#side-bar .filters .box-content .category-wrap').each(function() {
        const group = $('.side-bar-button', this);
        let count = 0;

        group.each(function() {
            $(this).hasClass('inactive') && count++;
        });

        $('.hide-some', this).removeClass('hidden');
        count == group.length && $('.hide-some', this).addClass('hidden');
    });
}

export function showHideAllLayers(show) {
    K.each(K.map.type[K.mode], function(category, array) {
        K.each(array, function(type) {
            let btn = $(`[set="${category}"][label="${type}"]`);

            btn.removeClass('inactive');
            show && btn.addClass('inactive');

            K.filters = K.local('filters') || {};
            K.filters[type] = show;
            K.local('filters', K.filters);

            showHideLayers(category, type, show);
        });
    });
}

export function showHideCategory(category, show) {
    K.each(K.map.type[K.mode][category], function(type) {
        let btn = $(`[set="${category}"][label="${type}"]`);

        btn.removeClass('inactive');
        show && btn.addClass('inactive');

        K.filters = K.local('filters') || {};
        K.filters[type] = show;
        K.local('filters', K.filters);

        showHideLayers(category, type, show);
    });
}

// Used to show hide layers based on attributes
export function showHideLayers(category, type, h) {

    switchLayerGroups(true);

    let g, show, hide, group;
    // Find which group to look in
    K.each(K.map.group, function(grp, a) {
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

export function toCorrectType(setting, value) {
    if (!K.settings.main[setting]) return value;
    const type = K.settings.main[setting].type;
    if (type == 'number')
        return Number(value);
    else if (type == 'boolean') {
        return value == 'true' ? true : value == 'false' ? false : !!value;
    }

    if (setting == 'mode') {
        K.each(value, function(mode, val) {
            if (K.empty(val) && K.type(val) == 'array') value[mode] = {};
        });
    }

    return value;
}

export function offset(latlng, oLat, oLng) {
    if (oLat)
        latlng.lat += oLat;
    if (oLng)
        latlng.lng += oLng;
    return latlng;
}

export function textColor(hex) {
    hex = hex.substring(1); // strip #
    let rgb = parseInt(hex, 16), // convert rrggbb to decimal
        r = (rgb >> 16) & 0xff, // extract red
        g = (rgb >> 8) & 0xff, // extract green
        b = (rgb >> 0) & 0xff, // extract blue
        luma = 0.2126 * r + 0.7152 * g + 0.0722 * b; // per ITU-R BT.709

    return (luma < 40 ? '#ffffff' : '#000000');
}

export function switchLayerGroup(layer, oldGroup) {
    const group = layer.options.group;

    K.group.removeLayer(layer);
    K.group.addLayer(layer);

    $(layer._icon).removeClass(oldGroup).addClass(group);
}

// Create a L.point from array or separate numbers
export function createPoint(e, f) {
    if (!$.isArray(e))
        return L.point(e, f);
    return L.point(e[0], e[1]);
}

// Used to add whole groups to and from the Draw Control layer
export function switchLayerGroups(skip) {

    // Remove current layers in the K.group.draw to original group
    K.group.draw.eachLayer(function(l) {
        K.group.fromDraw(l);
    });

    // Move layers to drawLayer
    !skip && K.each(K.group.all(), function(i, l) {
        if ((K.map.active[l.options.type] && (l.options.creator == K.user.name || K.user.type > 3)) || l.editing.edit) {
            K.group.toDraw(l);
        }
    });

    K.myMap.removeLayer(K.group.draw).addLayer(K.group.draw).addLayer(K.group.mode.groupAll);

    // Show and hide layers after the change
    // onZoomEnd(true);
    K.myMap.panBy([0, 0]);
}

export function toggleFullScreen() {

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

export function fixNum(s) {
    return (Number(s) ? Number(s) : s)
}

export function polyType(l) {
    return l.length == 1 && l[0].length == 4 && l[0][0].lat == l[0][3].lat && l[0][0].lng == l[0][1].lng ?
        'rectangle' : l[0].lat ? 'polyline' : 'polygon';
}

// Get the layer type for the show hide menu
export function getType(o, g, a) {
    if (!K.has(a, ['marker', 'polyline', 'polygon']))
        return '';
    let type = '';
    o = o.replace('images/', '');
    K.each(K.map.type, function(h, tg) {

        K.each(tg[a], function(i, v) {

            if (K.has(o, v)) {
                type = i;
                return;
            }
        });
        if (type) return;
    });
    return type;
}

export function getMode(type) {
    let fMode = 'all';
    K.each(K.map.mode, function(mode, array) {
        if (K.has(type, array)) {
            fMode = mode;
            return;
        }
    });
    return fMode;
}

export function setAllLayerClick() {
    let layers = K.group.feature[K.mode].everyLayer;

    layers.eachLayer(function(l) {

        l.off('click');

        if (K.check.grabbing) {
            l.on('click', function() {
                return this.options.id;
            });

        } else {
            // Add the Layer editing tools on click if you created it
            // K.user.type && (K.user.type >= 4 || l.options.creator.toLowerCase() == K.user.name.toLowerCase()) &&
            //     l.on('click', K.tool.layer.show);
        }
    });
}

// Functions to show and hide layers based on zoom level and wether editing the layer
export function onZoomEnd() {
    setGridRotate(true);
    const zoom = K.myMap.getZoom() + (K.touchOnly ? 1 : 0);

    let classes = '';
    for (let i = 7; i < 12; i++) {
        classes += ` z${i}`;
    }

    $('#map-id').removeClass(classes);
    $('#map-id').addClass(`z${Math.floor(zoom)}`);

    K.each(K.group.mode, function(g) {
        let a = g.replace('group', '');
        a = a.contains('_') ? a.split('_') : a.bMatch(/\d+/) ? Number(a) :
            K.has(a, ['Hidden', 'Complete', 'everyLayer']) ? false : 0;

        if ((typeof a == 'number' && zoom >= a - 1) || (typeof a == 'object' && zoom >= a[0] - 1 && zoom <= a[1] + 1)) {
            K.myMap.addLayer(K.group.mode[g])
        } else
            K.myMap.removeLayer(K.group.mode[g])
    });
}

export function urlExists(url, callback) {
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

export function setSelectionRange(input, selectionStart, selectionEnd) {
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

export function setCaretToPos(input, posA, posB) {
    setSelectionRange(input, posA, (posB || posA));
}

export let ID = function() {
    return '_' + Math.random().toString(36).substr(2, 9);
};

export function arraysEqual(a, b) {
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

export function replaceTag(tag) {
    return tagsToReplace[tag] || tag;
}

export function safeTags(str) {
    return str.replace(/[&<>]/g, replaceTag);
}

export function hideAlert() {
    $('#alert').hide();
}

export function naturalCompare(a, b) {
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

class Timed {
    run(callback, time) {
        this.time = time;
        this.callback = callback;

        this._action();
    }

    _action() {
        this.timeout && (clearTimeout(this.timeout));
        this.timeout = setTimeout(this.callback, this.time);
    }
}

export function timed() {
    return new Timed();
}