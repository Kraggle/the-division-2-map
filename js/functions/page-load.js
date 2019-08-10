import { jQuery as $ } from '../jQuery/jquery3.4.1.js';
import { L } from '../Leaflet/importer.js';
import { K } from '../K.js';
import { createMarker } from './create-marker.js';
import {
    empty,
    polyHoverAnimation,
    toCorrectType,
    sortObjByKeys,
    switchLayerGroups,
    toggleHideIcons,
    showHideLayers,
    showHideCategory,
    showHideAllLayers,
    setGridRotate,
    editIconMessage
} from './misc.js';
import { drawEventCreated } from '../extensions/L.Draw.Extended.js';
import { keypressEvent } from './shortcut.js';

// MARK: => PageLoad
export default function pageLoad() {

    K.loaded = false;
    K.cycle.reset();
    K.group.draw.clearLayers();

    // Check for clean map params and cookies and hide everything
    if (K.urlParam('noIcon') == 'true')
        K.local('hideIcon', true);

    if (K.urlParam('clean') == 'true')
        K.local('cleanMenu', true);

    if (!K.local('hideIcon'))
        $('#survival-logo').fadeIn(500);

    if (K.local('cleanMenu')) {
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
        url: 'php/get_markers.php'
    }).done(function(data) {
        K.each($.parseJSON(data), function(i, v) {
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
        K.each(K.bar.b, function(i, v) {
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

            K.each(K.shortcuts, function(sub, a) {
                shorts.append(`<span class="title sub">${sub.space()}</span>`);
                K.each(a, function(k, t) {
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

            K.extend(K.bar.b.power, {
                enabled: function() {
                    return !$(this._button).hasClass('enabled');
                },
                _click: function() {

                    let el = $(this._button),
                        buttons = $('.leaflet-top.leaflet-left').children().not('.power').find('a');

                    if (this.enabled() || K.check.doOnce) {

                        el.addClass('enabled');

                        K.each(K.bar.draw, function(i, type) {
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

                        K.each(K.bar.draw, function(i, type) {
                            type.enabler();
                        });

                        K.bar.b.group.enable();
                        K.bar.b.tools.enable();

                        switchLayerGroups();
                    }

                    K.local('powered', this.enabled());
                    K.check.doOnce = false;
                }
            });

            K.bar.b.save = L.control.button().addTo(K.myMap).disable();

            K.bar.b.cancel = L.control.button({
                text: '',
                title: 'Discard all unsaved changes',
                css: 'cancel',
                clickFn: function() {

                    $('<div />', {
                        class: 'screen-blank',
                        html: $('<div />', {
                            class: 'confirm',
                            html: $('<div />', {
                                class: 'message',
                                html: 'Are you sure you want to discard all changes?'
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
                            title: 'Discard',
                            html: 'Discard'
                        }).appendTo('.confirm')
                        .on('click', function() {
                            $('.screen-blank').remove();
                            K.save.clear();
                            pageLoad();
                        });
                }
            }).addTo(K.myMap).disable();

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

                    K.each(sortObjByKeys(K.map.type[K.mode]), function(category, types) {
                        $('.leaflet-menu').append(`<span class="leaflet-menu-item title">${category.space()}</span>`);
                        K.each(sortObjByKeys(types), function(type) {
                            $('.leaflet-menu').append(`<a class="leaflet-menu-item switch-active-group 
                                ${K.map.active[type] ? ' active' : ''}" type="${type}">${type.space().replace(' Of ', ' of ')}</a>`);
                        });

                    });

                    $('.switch-active-group').on('click', function() {
                        let t = $(this).attr('type');
                        $(this).toggleClass('active');
                        K.map.active[t] = !K.map.active[t];
                        // K.local('activeMap', K.extend({}, K.map.active));
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

                    $(el).after('<div id="slider-box" class="slider-panel"></div>');
                    K.each(gridTools, function(i, type) {
                        $('#slider-box').append(`<div class="leaflet-menu-slider">
                            <div id="slider-${type}" class="slider-class ${type}">
                                <div class="handle-${type} ui-slider-handle"></div>
                            </div>
                        </div>`);

                        $('#slider-' + type).slider({
                            min: (type == 'rotate' ? -45 : -100),
                            max: (type == 'rotate' ? 45 : 100),
                            step: (type == 'rotate' ? 0.5 : 1),
                            value: K.local(`grid-${type}`) || 0,
                            create: function() {
                                let val = $(this).slider('value');
                                $('.handle-' + type).text((type == 'rotate' ? val + ' deg' : (type == 'x-pos' ? 'X: ' + val : 'Y: ' + val)));
                            },
                            slide: function(e, ui) {
                                $('.handle-' + type).text((type == 'rotate' ? ui.value + ' deg' : (type == 'x-pos' ? 'X: ' + ui.value : 'Y: ' + ui.value)));
                                K.local('grid-' + type, ui.value);
                                setGridRotate();
                            },
                            change: function(e, ui) {
                                $('.handle-' + type).text((type == 'rotate' ? ui.value + ' deg' : (type == 'x-pos' ? 'X: ' + ui.value : 'Y: ' + ui.value)));
                                K.local('grid-' + type, ui.value);
                                setGridRotate();
                            }
                        });
                    });

                    $('#slider-box').append('<div class="slider-resets"></div>');
                    K.each(gridTools, function(i, type) {

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

            // drawButtons = $('.leaflet-draw-section');

            // L.Control.Draw EditStart
            K.myMap.on('draw:editstart', function() {
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
                K.each(K.bar.draw, function(i, type) {
                    type.disabler();
                });

                K.check.editing = true;
                editIconMessage();

                K.group.draw.eachLayer(function(l) {
                    if (l.dragging.enabled()) {
                        l.dragging.disable();
                        l.editing.wasDragging = true;
                    }
                });
            })

            // L.Control.Draw Edited
            K.myMap.on('draw:edited', function(e) {
                e.layers.eachLayer(function(l) {
                    l.saved(false)
                });
            })

            // L.Control.Draw EditStop
            K.myMap.on('draw:editstop', function() {

                K.bar.b.power.enable();
                K.bar.b.group.enable();
                K.bar.b.tools.enable();
                K.save.check();

                K.myMap.removeLayer(K.grid.overlay);
                K.bar.b.grid.disable();
                $('#slider-box').remove();

                K.bar.edit.Remove.enabler();
                K.each(K.bar.draw, function(i, type) {
                    type.enabler();
                });

                K.check.editing = false;

                polyHoverAnimation();
                // onZoomEnd(true);
                K.myMap.panBy([0, 0]);

                K.group.draw.eachLayer(function(l) {
                    if (l.editing.wasDragging) {
                        l.dragging.enable();
                        l.editing.wasDragging = false;
                    }
                });
            })

            // L.Control.Draw DeleteStart
            K.myMap.on('draw:deletestart', function() {
                K.check.deleting = true;

                K.each(K.bar.b, function(i, type) {
                    type.disable();
                });

                K.bar.edit.Edit.disabler();
                K.each(K.bar.draw, function(i, type) {
                    type.disabler();
                });

                K.myMap.addLayer(K.group.draw);

                setGridRotate();
            })

            // L.Control.Draw Deleted
            K.myMap.on('draw:deleted', function(e) {
                K.each(e.layers._layers, function(i, l) {
                    K.group.draw.removeLayer(i);
                    K.save.delete(l);

                    K.map.type.remove(l.options.type);
                });
            })

            // L.Control.Draw DeleteStop
            K.myMap.on('draw:deletestop', function() {
                K.check.deleting = false;

                K.bar.b.power.enable();
                K.bar.b.group.enable();
                K.save.check();

                K.bar.edit.Edit.enabler();
                K.each(K.bar.draw, function(i, type) {
                    type.enabler();
                });

                // onZoomEnd(true);
                K.myMap.panBy([0, 0]);
            });

            K.myMap.on('draw:drawstop', function() {
                if (K.user.type > 3) return;
                K.msg.show({
                    msg: 'Remember, you may have to zoom in to see the layers you create!',
                    time: 2500
                })
            });
        }

        K.user.type && K.check.doOnce && K.bar.b.power._onClick();

        // MARK: => PopulateMap
        const populateMap = function(e, id) {
            let l, // layer
                s = K.extend(true, {}, K.layer[e.t] || {}), // settings
                g = e.g, // geometry
                o = K.extend({}, s.o || {}, e.o || {}, { creator: e.c, id: id, shape: g.t }), // options
                p = K.extend({}, s.p || {}, e.p || {}); // popup

            if ((e.p || {}).content) delete p.list;
            if ((e.p || {}).list) delete p.content;

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

            // Create the icons for Marker Tools
            // ----------------------
            if (o.shape == 'marker' && o.type) {

                let obj = {
                    o: K.extend({}, o, {
                        className: (o.className || '').replace(/\w+ground/g, '').trim()
                    }),
                    p: p ? p : {}
                };

                K.each(K.modes.get, function(i, mode) {
                    let tool = K.tool.marker.layers[mode];
                    if (mode in o.mode) {
                        if (!(o.category in tool)) tool[o.category] = {};
                        if (!(o.type in tool[o.category])) tool[o.category][o.type] = obj;

                        // fill the icon array for the auto image assignment in popups
                        K.icons[o.type.space()] = obj.o.iconUrl;
                    }
                });
            }

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

            // Add the Layer editing tools on click if you created it
            K.user.type && (K.user.type >= 4 || o.creator.toLowerCase() == K.user.name.toLowerCase()) &&
                l.on('click', K.tool.layer.show);

            // K.getSetting(o, 'complete') && o.shape === 'marker' && 
            l.on('contextmenu', function(e) {
                // this.toggleCompleted();
                K.contextMenu.build(e, this);
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

            add && K.group.addLayer(l);
            l.markComplete();

            e.unsaved && l.saved(false);
        };

        // MARK: => PopulateMenus
        const populateMenus = function() {
            // onZoomEnd();
            K.myMap.panBy([0, 0]);

            // Only switch layers, remove duplicates and add draw control if we are superuser
            K.user.type && switchLayerGroups();
            K.completeHidden = K.local('completeHidden') || false;

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

            const list = sortObjByKeys(K.map.type[K.mode]);
            K.filters = K.local('filters') || {};

            K.each(list, function(category, types) {

                if (!K.length(types)) return;

                types = sortObjByKeys(types);

                $(sb).append(`<div class="sub title buttons">
                        <a class="collapse">
                            <span class="text">${category.firstToUpper()}</span>
                            <span class="control icon" title="Collapse/Expand ${category}"></span>
                        </a>
                        <a class="control hide-some" category="${category}" title="Show/Hide all ${category}"></a>
                    </div>`);

                K.each(types, function(type, i) {

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

                        let src = i[Math.floor(Math.random() * i.length)];
                        type == 'MainMission' && (src = 'images/marker-mission.svg');
                        type == 'SideMission' && (src = 'images/marker-mission-side.svg');

                        $('<img />', {
                            src: src
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
            });

            // Filter button events
            $('#side-bar .side-bar-button').off('click').on('click', function() {
                $(this).toggleClass('inactive');
                toggleHideIcons();
                let t = $(this).attr('label'),
                    ia = $(this).hasClass('inactive');

                // Set a cookie for reload

                K.filters = K.local('filters') || {};
                K.filters[t] = ia;
                K.local('filters', K.filters);

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

                K.local('completeHidden', K.completeHidden);
                K.complete.showHide();
            });

            K.complete.showHide();
            toggleHideIcons();

            $('#side-bar .collapse').off('click').on('click', function() {
                let icon = $('.icon', this),
                    list = $(this).parent().nextUntil('.sub.title');

                if (icon.hasClass('hidden')) {
                    list.each(function() {
                        $(this).show(400);
                    });

                    icon.removeClass('hidden');

                } else {
                    list.each(function() {
                        $(this).hide(400);
                    });

                    icon.addClass('hidden');
                }
            });

            // Credits
            $(sb).append(K.credits);

            // Show side bar if it was open before 
            if (K.local('sideBar') && !K.local('cleanMenu')) {
                let a = K.local('sideMenu');
                $('#side-bar, #side-bar .' + a).addClass('active ' + a);
            }

            polyHoverAnimation();

            $('.search [title!=""]').qtip({
                position: {
                    viewport: $('#mapid'),
                    my: 'top right',
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

            // $('[title!=""]').qtip({
            //     position: {
            //         viewport: $('#mapid'),
            //         my: 'left center',
            //         at: 'right center'
            //     },
            //     style: {
            //         classes: 'tooltip-style'
            //     },
            //     show: {
            //         delay: 250,
            //         solo: true
            //     },
            //     hide: {
            //         event: 'click mouseleave'
            //     },
            //     events: {
            //         hide: function(e, api) {
            //             api.destroy(true);
            //         }
            //     }
            // });

            $('body').on('mouseover', '[title!=""]', function() {

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
                        },
                        // events: {
                        //     hide: function(e, api) {
                        //         api.destroy(true);
                        //     }
                        // }
                    });
                    $(this).qtip('toggle', true);
                }
            });

            setTimeout(function() {
                $('#survival-logo, .loader-back').fadeOut(1000);
            }, 1000);

            $('.paypalBtn').off('click').on('click', function() {
                $('#side-bar .filters .paypalBtn').closest('form').submit();
            });

        };

        $.ajax({
            type: 'POST',
            url: 'php/file_exists.php',
            data: {
                data: K.user.name
            }
        }).done(function(a) {

            a = $.parseJSON(a);
            K.userPath = a ? 'data/' + K.user.name + '/geoJSON.json' : 'data/empty.json';

            $.ajax({
                type: 'POST',
                url: 'php/file_date.php',
                data: {
                    path: K.userPath
                }
            }).done(function(data) {

                data = $.parseJSON(data);

                $.getJSON(`${K.userPath}?v=${data.date}`, function(userJSON) {

                    $.ajax({
                        type: 'POST',
                        url: 'php/file_date.php',
                        data: {
                            path: 'data/geoJSON.json'
                        }
                    }).done(function(data) {

                        data = $.parseJSON(data);

                        $.getJSON(`data/geoJSON.json?v=${data.date}`, function(geoJSON) {

                            K.myMap.invalidateSize();

                            // clear all layers before adding the loaded ones
                            K.each(K.group.feature, function(i, mode) {
                                K.each(mode, function(j, group) {
                                    group.clearLayers();
                                    K.myMap.removeLayer(group);
                                });
                            });

                            K.modes.clear();
                            K.map.type.counts = {};
                            K.complete.layers = [];
                            K.timed.layers = [];

                            const unsaved = K.local('unsaved') || { features: {}, settings: {} };
                            K.each(unsaved.features, function(id, feature) {
                                feature.unsaved = true;
                            });
                            K.each(unsaved.settings, function(id, setting) {
                                setting.unsaved = true;
                            });

                            // merge the user data & unsaved changes with the main data
                            userJSON.features && K.extend(geoJSON.features, userJSON.features);
                            K.extend(geoJSON.features, unsaved.features);
                            K.layer = K.extend({}, geoJSON.settings, userJSON.settings || {}, unsaved.settings);

                            // change the incoming variables to the correct variable type
                            K.each(K.layer, function(type, obj) {
                                K.each(obj.o, function(set, val) {
                                    K.layer[type].o[set] = toCorrectType(set, val);
                                });
                            });

                            K.each(geoJSON.features, function(id, feature) {
                                populateMap(feature, id);
                            });

                        }).done(function() {
                            populateMenus();
                            K.setWorldTier();
                            K.loaded = true;

                            setTimeout(() => K.cycle.start(), 1000);

                            K.search.attach();

                            K.performURITasks();
                        });
                    });
                });
            });
        });
    });
}