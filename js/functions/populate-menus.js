import { jQuery as $ } from '../jQuery/jquery3.4.1.js';
import { K } from '../K.js';
import {
    polyHoverAnimation,
    sortObjByKeys,
    switchLayerGroups,
    toggleHideIcons,
    showHideLayers,
    showHideCategory,
    showHideAllLayers
} from './misc.js';

// MARK: => PopulateMenus
export const populateMenus = function() {
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
    let sb = '#side-bar .filters .box-content';
    $(sb).html('');
    $(sb).append(`<a class="hide-all ripple-me" title="Show/Hide all!"></a>
                <span class="title">Filters</span>
                <a class="hide-complete ripple-me${K.completeHidden ? ' hidden">Show' : '">Hide'} Complete</a>`);

    const list = sortObjByKeys(K.map.type[K.mode]);
    K.filters = K.local('filters') || {};

    K.each(list, function(category, types) {

        if (!K.length(types)) return;

        types = sortObjByKeys(types);

        const wrap = $('<div />', {
            class: 'category-wrap'
        }).appendTo($(sb));

        wrap.append(`<div class="sub title buttons">
                        <a class="collapse ripple-me">
                            <span class="text">${category.firstToUpper()}</span>
                            <span class="control icon" title="Collapse/Expand ${category}"></span>
                        </a>
                        <a class="control hide-some ripple-me" category="${category}" title="Show/Hide all ${category}"></a>
                    </div>`);

        K.each(types, function(type, i) {

            const active = K.filters[type] || false,

                el = $('<a />', {
                    class: 'side-bar-button ripple-me' + (active ? ' inactive' : ''),
                    set: category,
                    label: type
                }).appendTo(wrap),

                space = $('<div />', {
                    class: 'spacer'
                }).appendTo(el);

            if (i[0].contains('.svg')) {

                let src = i[Math.floor(Math.random() * i.length)];
                type == 'MainMission' && (src = 'images/marker-mission.svg');
                type == 'SideMission' && (src = 'images/marker-mission-side.svg');

                $('<img />', {
                    class: 'visual',
                    src: src
                }).appendTo(space);

            } else if (category == 'polyline') {

                $('<div />', {
                    class: 'polyline visual'
                }).css({
                    backgroundColor: i[0]
                }).appendTo(space);

            } else {

                $('<div />', {
                    class: 'polygon visual'
                }).css({
                    borderColor: i[1],
                    backgroundColor: i[0]
                }).appendTo(space);
            }

            $('<span />', {
                class: 'name',
                text: type.space().replace(/Dz/, 'DZ').replace(/ (Survival|Complete)/, '').replace(' Of ', ' of ')
            }).appendTo(space);

            $('<span />', {
                class: 'quantity',
                text: '[ x' + K.map.type.counts[type] + ' ]'
            }).appendTo(space);

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
        $('#side-bar').addClass('active ' + a);
        $('.bar-toggle-wrap, #side-bar .' + a).addClass('active');
    }

    polyHoverAnimation();

    $('.search [title!=""]').qtip({
        position: {
            viewport: $('#map-id'),
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
    //         viewport: $('#map-id'),
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
                    viewport: $('#map-id'),
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
}