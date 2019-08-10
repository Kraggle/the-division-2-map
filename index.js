// jQuery and Plugins
import { jQuery as $ } from './js/jQuery/jquery3.4.1.js';
import './js/jQuery/jQuery-UI/importer.js';

// Kraggle Universal
import './js/jquery-kraggle.js';
import { K } from './js/K.js';

// Leaflet and Plugins
import { L } from './js/Leaflet/importer.js';

// Extensions
import './js/extensions/K.Extended.js';
import './js/extensions/L.Draw.Extended.js';
import './js/extensions/L.Extended.js';

// Tools
import './js/tools/marker.js';
import './js/tools/layer.js';

// Functions
import { doDonator, doLogin, doRegister, doReset, doForgot } from './js/functions/account.js';
import './js/functions/complete.js';
import './js/functions/context-menu.js';
import './js/functions/cycle.js';
// import './js/functions/gear.js';
import './js/functions/map.js';
import {
    toggleFullScreen,
    onZoomEnd,
    polyHoverAnimation
} from './js/functions/misc.js';
import './js/functions/search.js';
import './js/functions/share.js';
import './js/functions/shortcut.js';
import './js/functions/uri-tasks.js';
import pageLoad from './js/functions/page-load.js';

// Import Stylesheets 
K.loadStyles([
    './js/Leaflet/leaflet1.0.3.css',
    './js/jQuery/jquery-ui1.12.1.css',
    './js/Utility/huebee.css',
    './js/Leaflet/Draw/leaflet.draw.css',
    './js/Utility/jquery.qtip.css',
    './index.css'
]);

// temporary to update to new mode names
if (!K.local('mode') || K.has(K.local('mode'), ['normal', 'Story']) || !K.has(K.local('mode'), K.modes.get))
    K.local('mode', 'Story Mode');

// MARK: [$] Document Ready
$(function() {

    K.includeHTML();

    K.initMap();

    // Import credits
    $.ajax({
        url: 'docs/credits.html',
    }).done(function(a) {
        K.credits = a;
    });

    // Create the modes in marker tools layers
    K.tool.marker.fill();

    // $('#survival-logo').show(1000);

    $.ajax({
        url: 'php/map_date.php',
    }).done(function(a) {
        K.mapVersion = a;

        // Map Image Overlay
        L.imageOverlay(`images/map.svg?v=${K.mapVersion}`, [
            [15, -15],
            [-15, 15]
        ], {
            attribution: `<a title="Tom Clancy's The Division 2" href="https://tomclancy-thedivision.ubisoft.com/">The Division 2</a>`,
            pane: 'mapPane'
        }).addTo(K.myMap);

    });

    // Add the main groups to the map
    K.myMap.addLayer(K.group.mode.groupAll);

    // On Zoom and Pan
    K.myMap.on('zoomend moveend', function() {
        // zoom = e.target._zoom;
        onZoomEnd();

        K.local('zoom', K.myMap.getZoom());
        K.local('pan', K.myMap.getCenter());

        polyHoverAnimation();
    });

    // MARK: ~ Create Mode Buttons
    // Create the mode buttons
    const mC = $('.map-mode-box'),
        mB = $('.map-mode', mC).detach();
    K.each(K.modes.get, function(i, mode) {
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
                K.local('mode', K.mode);
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
            o = K.local('sideMenu');

        if ($(this).hasClass(c)) {
            sb.removeClass(`${c} ${a}`);
            setTimeout(function() {
                sb.children().removeClass(c);
            }, 1000);
        } else if (sb.hasClass(c)) {
            sb.removeClass(`${c} ${o}`);
            setTimeout(function() {
                sb.children().removeClass(c);
                sb.addClass(`${c} ${a}`);
                sb.children(`.${a}`).addClass(c);
            }, 1000);
        } else {
            sb.addClass(`${c} ${a}`);
            sb.children(`.${a}`).addClass(c);
        }

        K.local('sideBar', sb.hasClass(c));
        K.local('sideMenu', a);
    });

    // Correctly position the menu buttons
    $('#side-bar > a').each(function(i) {
        $(this).css('top', i == 0 ? '10px' : (10 + (i * 40)) + 'px');
    });

    // Toggle fullscreen button
    let el = $('#side-bar .side-menu-toggle.full');
    el.on('click', toggleFullScreen);
    $(document).on('webkitfullscreenchange mozfullscreenchange fullscreenchange', function() {
        el.toggleClass('yes');
    });

    // Set change log if they have not seen it before
    if (!K.urlParam('overwolf') && K.local('currentUpdate') != K.currentUpdate) {
        K.local('sideMenu', 'changes');
        K.local('sideBar', true);
        K.local('currentUpdate', K.currentUpdate);
    }

    // User account controls
    $('#side-bar .login').on('click', '.page', function() {
        let page = $(this).attr('name');

        $.ajax({
            url: `php/${page}.php`

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
            url: 'php/logout.php'

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
            url: 'php/validator.php',
            data: {
                checked: $(this).prop('checked')
            }
        });
    });

    // MARK: ~ Hide Menus
    // Hide Menus on no click
    $(document).mousedown(function(e) {
        if (K.check.grabbing) return;
        const container = $('.settings-divider, .switch-active-group, #slider-box, .group-switch, .context-menu');
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
            re = vl.bMatch(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
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
    // $(window).bind('beforeunload', function() {
    //     if (K.save.check()) {
    //         if (navigator.userAgent.toLowerCase().match(/msie|chrome/)) {
    //             if (window.aysHasPrompted) {
    //                 return;
    //             }
    //             window.aysHasPrompted = true;
    //             window.setTimeout(function() {
    //                 window.aysHasPrompted = false;
    //             }, 900);
    //         }
    //         return 'are you sure';
    //     }
    //     return;
    // });

    if (K.local('powered') !== undefined)
        K.check.doOnce = !K.local('powered');

    // Add user as donator if they have correct token
    if (K.type(K.urlParam('d')) == 'string') {
        $.ajax({
            type: 'POST',
            url: 'php/process_donator.php',
            data: {
                load: K.urlParam('d')
            }
        }).done(function() {
            window.location.href = window.location.href.split('?')[0];
        });
    }

    pageLoad();
});