import { jQuery as $ } from '../jQuery/jquery3.4.1.js';
import { L } from '../Leaflet/importer.js';
import { K } from '../K.js';
import {
    empty,
    polyHoverAnimation,
    toCorrectType,
    sortObjByKeys,
    switchLayerGroups,
    setGridRotate,
    editIconMessage
} from './misc.js';
import { drawEventCreated } from '../extensions/L.Draw.Extended.js';
import { keypressEvent } from './shortcut.js';
import { populateMap } from './populate-map.js';
import { populateMenus } from './populate-menus.js';

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
        $('.bar-toggle.login').hide(0);
        $('.bar-toggle.filters').hide(0);
        $('.bar-toggle.full').hide(0);
        $('.bar-toggle.changes').hide(0);
        $('.bar-toggle.todo').hide(0);
        $('.bar-toggle.gear').hide(0);
        $('.bar-toggle.shorts').hide(0);
        $('.leaflet-control-attribution.leaflet-control').hide(0);
        $('#logo').hide(0);
    }

    if (K.urlParam('overwolf') == 'true') {
        $('.bar-toggle.full').hide(0);
        $('.bar-toggle.changes').hide(0);
        $('.bar-toggle.todo').hide(0);
        $('.bar-toggle.shorts').hide(0);
        $('.leaflet-control-attribution.leaflet-control').hide(0);
        $('#alert').hide(0);
        $('#logo').hide(0);

        // $('#side-bar .bar-toggle.gear').css('top', '170px');
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

        // Clear a few things in case you have logged out
        $('#message').removeClass('master');
        let shorts = $('#side-bar .shorts .box-content');
        shorts.html('');
        $('.bar-toggle.shorts').hide();
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

            !K.urlParam('overwolf') && $('.bar-toggle.shorts').show();
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