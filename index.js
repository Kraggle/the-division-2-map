// jQuery and Plugins
import { jQuery as $ } from './js/jQuery/jquery3.4.1.js';
window.$ = $;
import './js/jQuery/jQuery-UI/importer.js';

// Kraggle Universal
import './js/jquery-kraggle.js';
import { K } from './js/K.js';
window.K = K;

// Leaflet and Plugins
import { L } from './js/Leaflet/importer.js';
window.L = L;

// Extensions
import './js/extensions/K.Extended.js';
import './js/extensions/L.Draw.Extended.js';
import './js/extensions/L.Extended.js';

// Tools
import './js/tools/marker.js';
import './js/tools/layer.js';

// Functions
import { doDonator, doLogin, doRegister, doReset, doForgot, loadReset } from './js/functions/account.js';
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

    // Toggle menu buttons
    $('#side-bar .bar-toggle:not(.full)').on('click', function() {

        const sb = $('#side-bar'),
            c = 'active',
            ta = '.bar-toggle.active, .bar-box.active',
            to = ', .bar-toggle-wrap',
            a = $(this).attr('button'),
            o = K.local('sideMenu'),
            save = () => {
                K.local('sideBar', sb.hasClass(c));
                K.local('sideMenu', a);
            };

        if ($(this).hasClass(c)) {
            sb.removeClass(`${c} ${a}`);
            setTimeout(function() {
                $(ta + to, sb).removeClass(c);
                save();
            }, 1000);
        } else if (sb.hasClass(c)) {
            sb.removeClass(`${c} ${o}`);
            setTimeout(function() {
                $(ta, sb).removeClass(c);
                sb.addClass(`${c} ${a}`);
                $(`.${a}`, sb).addClass(c);
                save();
            }, 1000);
        } else {
            sb.addClass(`${c} ${a}`);
            $(`.${a}`, sb).addClass(c);
            save();
        }
    });

    $('.bar-open').on('click', function() {
        $('.bar-toggle-wrap').toggleClass('active')
    });

    // Correctly position the menu buttons
    $('#side-bar .bar-toggle').each(function(i) {
        $(this).css('top', i == 0 ? '10px' : (10 + (i * 40)) + 'px');
    });

    // Toggle fullscreen button
    let el = $('#side-bar .bar-toggle.full');
    el.on('click', toggleFullScreen);
    $(document).on('webkitfullscreenchange mozfullscreenchange fullscreenchange', function() {
        el.toggleClass('yes');
    });

    // Set change log if user has not seen it before
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

            a && $('#side-bar .login .box-content').parent().html(a);
        });
    });

    K.urlParam('forgot') && loadReset(K.urlParam('token'));

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
    $('#side-bar').on('click', '#logout', function() {

        $.ajax({
            url: 'php/logout.php'

        }).done(function(a) {

            K.user.name = false;
            K.user.type = 0;
            K.user.data = false;

            $('#side-bar .login .box-content').parent().html(a);

            pageLoad();
        });
    });

    // Remember me
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
    $(document).on('mousedown touchstart', function(e) {
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
    $('#side-bar .bar-toggle').on('mouseenter touchstart', function() {
        $(this).css('left', '-' + ($(this).width() + 50) + 'px');
    }).on('mouseleave touchmove click', function() {
        $(this).css('left', '-35px');
    });

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

    // MARK: ~ Mode Menu
    $.getJSON("data/modes.json", function(data) {
        const menu = $('.bar-box.mode .box-content');
        menu.append($('<span />', {
            class: 'title',
            text: 'Map Modes'
        }));

        K.each(data, function() {
            $('<div />', {
                class: 'mode-wrap ripple-me' + (this.name == K.local('mode') ? ' active' : ''),
                mode: this.name
            }).append($('<img />', {
                class: 'mode-icon',
                src: this.icon
            })).append($('<span />', {
                class: 'mode-name',
                text: this.name
            })).append($('<div />', {
                class: 'mode-desc span-row',
                html: this.descriptor
            })).appendTo(menu).on('click', function() {
                if (!$(this).hasClass('active')) {

                    $(this).siblings().removeClass('active');
                    $(this).addClass('active');

                    K.mode = $(this).attr('mode');
                    K.local('mode', K.mode);
                    K.group.mode = K.group.feature[K.mode];
                    K.bar.b.power && !K.bar.b.power.enabled() ? K.check.doOnce = true : true;

                    setTimeout(() => {
                        pageLoad();
                    }, 1000);
                }
            });
        });

        menu.append($('<div />', {
            include: '/docs/credits.html'
        }));

    });

    $('body').on('click', '.ripple-me', function(e) {
        const ripple = $('.ripple'),
            x = e.pageX,
            y = e.pageY,
            duration = 600;

        let animationFrame,
            animationStart;

        const animationStep = function(timestamp) {
            if (!animationStart)
                animationStart = timestamp;

            const frame = timestamp - animationStart;
            if (frame < duration) {
                const easing = (frame / duration) * (2 - (frame / duration)),

                    circle = `circle at ${x}px ${y}px`,
                    color = `rgba(175, 101, 44, ${(0.3 * (1 - easing))})`,
                    stop = 10 * easing + "%";

                ripple.css({
                    "background-image": "radial-gradient(" + circle + ", " + color + " " + stop + ", transparent " + stop + ")"
                });

                animationFrame = window.requestAnimationFrame(animationStep);

            } else {
                ripple.css({
                    "background-image": "none"
                });
                window.cancelAnimationFrame(animationFrame);
            }

        };

        animationFrame = window.requestAnimationFrame(animationStep);
    });

    pageLoad();
});