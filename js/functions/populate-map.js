import { jQuery as $ } from '../jQuery/jquery3.4.1.js';
import { L } from '../Leaflet/leaflet1.5.1.js';
import { K } from '../K.js';
import { createMarker } from './create-marker.js';
import { toCorrectType } from './misc.js';

// MARK: => PopulateMap
export const populateMap = function(e, id) {
    let l, // layer
        s = K.extend(true, {}, K.layer[e.t] || {}), // settings
        g = e.g, // geometry
        o = K.extend({}, s.o || {}, e.o || {}, { creator: e.c, id: id, shape: g.t }), // options
        p = K.extend({}, s.p || {}, e.p || {}); // popup

    if ((e.p || {}).content) delete p.list;
    if ((e.p || {}).list) delete p.content;

    if (o.iconUrl) o.iconUrl = o.iconUrl.replace('../', '');

    if (!o) return;

    // convert the mode arrays to objects
    K.each(o.mode, function(mode, obj) {
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

            K.each(K.modes.get, function(i, mode) {

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
        K.settings.add(s, o[s], o.shape);
    }

    // fill up classRemoval array for later
    let pCn = p.className ? p.className : '';
    pCn && !K.classRemoval.contains(pCn) && (K.classRemoval = `${K.classRemoval.trim()} ${pCn}`);
    !K.classRemoval.contains(o.group) && (K.classRemoval = `${K.classRemoval.trim()} ${o.group}`);

    if (g.t != 'marker') { // Circle, Polyline, Polygon and Rectangle
        let obj = K.extend(o, {
            pane: o.pane || (o.className == 'poly-hover' ? 'zonePane' : 'overlayPane')
        });

        if (g.t == 'circle') obj.radius = g.r;

        l = L[g.t](g.c, o);

    } else if (g.t == 'marker') { // Marker

        l = createMarker(K.extend(o, {
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
        K.user.type && K.settings.add('className', p.className, o.shape, true);
    }

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

    add && K.group.addLayer(l);
    l.markComplete();

    e.unsaved && l.saved(false);

    const copy = K.local('copy') || {},
        shape = K.settingShape(g.t);

    !copy[shape] && o.type === K.map.defaults[shape] && l.copy(false);
    g.t == 'polyline' && !copy.polyline && l.copy(false);

    // Create the icons for Marker Tools
    // ----------------------
    if (o.shape == 'marker' && o.type) {

        K.tool.marker.add(l);

        // fill the icon array for the auto image assignment in popups
        K.icons[o.type.space()] = o.iconUrl;
    }
};