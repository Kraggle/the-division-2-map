import { jQuery as $ } from '../jQuery/jquery3.4.1.js';
import { K } from '../K.js';
import { switchLayerGroups, timed } from './misc.js';
import pageLoad from './page-load.js';

const timer = timed();

// MARK: => CreateGeoJSON
export function createGeoJSON(store = false) {

    !store && $('#settings-menu').remove();

    K.backup = K.user.name;

    K.checkLogin(() => {

        const development = false;

        if (K.backup != K.user.name) {
            alert('I\'m sorry but your account information is incorrect, you cannot save your changes! Please log in and try again!');
            return;
        }

        !development && !store && K.msg.show({
            msg: 'SAVING...',
            dots: true
        });

        !store && switchLayerGroups(true);

        let feature;
        const geoData = {
            features: {},
            settings: {},
            deleted: K.save.deleted
        };

        // pull in the global settings that have changed
        K.each(K.layer, function(type, obj) {
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
            K.each(o.mode, function(mode, obj) {
                K.in('o', obj) && K.empty(obj.o) && delete obj.o;
                K.in('p', obj) && K.empty(obj.p) && delete obj.p;
            });

            // remove the classes that were added for aesthetics
            layer.removeClass(K.classRemoval);

            feature = { c: o.creator }
            type && (feature.t = type);

            // create the feature
            if (o.shape == 'circle') { // Circle
                feature.g = {
                    t: 'circle',
                    c: K.valuesToString(K.Util.formatLatLngs(layer._latlng)),
                    r: K.Util.formatLatLngs(layer._mRadius).toString()
                };

            } else if (o.shape == 'marker') { // Marker
                feature.g = {
                    t: 'marker',
                    c: K.valuesToString(K.Util.formatLatLngs(layer._latlng))
                };

                o.iconUrl && delete o.html;
                o.className = K.stripClasses(o.className);

            } else { // Polyline, Polygon and Rectangle
                feature.g = {
                    t: o.shape,
                    c: K.valuesToString(K.Util.formatLatLngs(layer._latlngs))
                };
            }

            // only add settings that have definitely changed 
            K.each(o, function(i, v) {
                if (K.has(i, K.map.property[o.shape])) {
                    const sv = type && K.layer[type] ? K.layer[type].o[i] : 'false',
                        sm = K.settings.main;

                    if (sv == 'false' || !K.equals(sv, v)) // do this if there is a type
                        sets[i] = i in sm && K.type(sm[i]) == 'number' ? v.toString() : v;
                }
            });

            // push the changed settings into the feature
            !K.empty(sets) && (feature.o = sets);

            // grab the popup if it is different from the original
            if (layer.popup && (layer.popup.content || (layer.popup.list && !K.empty(layer.popup.list)))) {

                const p = layer.popup;
                const sv = K.layer[type] ? K.layer[type].p : {};

                p.className != sv.className && (pop.className = p.className);

                if (p.list && p.list.title) // set up with list only
                    !K.equals(sv.list, p.list) && (pop.list = p.list);
                else // set up with content
                    sv.content != p.content && (pop.content = p.content);

                // Set popup content to variable if one exists
                K.each(K.popupContent, function(k, s) {
                    pop.content == s && (pop.content = k);
                });
            }

            // push the changed popup settings into the feature
            !K.empty(pop) && (feature.p = pop);

            // Push the new item into the feature object
            geoData.features[id] = feature;
        });

        // console.log(JSON.stringify(geoData));

        if (development) return;
        if (store) {
            K.save.data = geoData;

            timer.run(() => {
                console.log('There are %i unsaved features... %o', K.length(geoData.features) + K.length(geoData.deleted), geoData);
            }, 100);

            return geoData;
        }

        console.log('Saving features... %o', geoData);

        // Save this all to a file
        $.ajax({
            type: 'POST',
            url: 'php/write.php',
            data: {
                data: JSON.stringify(geoData)
            }

        }).done(function(a) {

            a = a.bMatch(/^(\{|\[])".*(\}|\])$/) ? $.parseJSON(a) : a;
            if (K.type(a) == 'object' && a.message) {
                alert(a.message);

            } else {

                K.save.clear();
                K.msg.hide();
                pageLoad();
            }
        });
    });

}