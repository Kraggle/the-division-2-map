import { jQuery as $ } from '../jQuery/jquery3.4.1.js';
import { K, classesToArray, stripAndCollapse } from '../K.js';

// MARK: [K] Variables
K.currentUpdate = '01-08-2019';
K.modes = {
    get: [
        'Story Mode',
        'World Tier'
    ]
};
K.keepPopupsOpen = false;
K.icons = {
    'Steel': 'images/marker-crate-materials-steel.svg',
    'Ceramics': 'images/marker-crate-materials-ceramic.svg',
    'Polycarbonate': 'images/marker-crate-materials-polycarb.svg',
    'Carbon Fibre': 'images/marker-crate-materials-carbon.svg',
    'Electronics': 'images/marker-crate-materials-electro.svg',
    'Titanium': 'images/marker-crate-materials-titanium.svg',
    'Trinket': 'images/marker-crate-trinkets.svg'
};

K.extend({
    loaded: false,
    lastCheck: false,
    pane: {},
    tool: {},
    expires: { expires: 28 },
    classRemoval: ''
});

// MARK: [K] CheckLogin
K.checkLogin = function(callback) {
    let end = new Date(K.lastCheck || '').getTime(),
        now = new Date().getTime(),
        gap = now - end;

    if (!K.lastCheck || gap > 60000) {
        $.ajax({
            url: 'php/check_login.php'
        }).done(function(a) {
            a = $.parseJSON(a);
            K.user.name = a.username || false;
            K.user.type = a.usertype || 0;
            K.user.donate = a.donate || 0;

            K.user.data = false;
            K.user.name && K.user.getData();

            if (callback) callback();
            K.lastCheck = new Date();
        });

    } else if (callback) callback();
};

// MARK: [K] Message
K.msg = {
    note: $('.notification'),
    show: function(options) {

        $.proxy(K.msg._show(options), K.msg);
    },
    _show: function(options) {

        options = K.extend({
            msg: '',
            time: 0,
            dots: false
        }, options);

        let dot = '<div class="dot"></div>';

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
};

K.svg = {
    dot: `<svg class="bg-dot" viewBox="0 0 64 64"><path class="dot-color" d="M32,3.1C16.039,3.1,3.1,16.039,3.1,32c0,15.961,12.939,28.9,28.9,28.9c15.961,0,28.9-12.939,28.9-28.9 C60.9,16.039,47.961,3.1,32,3.1z M32,48.5c-9.113,0-16.5-7.387-16.5-16.5S22.887,15.5,32,15.5S48.5,22.887,48.5,32 S41.113,48.5,32,48.5z"/></svg>`,
    'black tusk': `<svg class="icon-npc black-tusk" viewBox="0 0 64 64"><path class="st0" d="M32 1.5l-30.5 30.5 30.5 30.5 30.5-30.5-30.5-30.5zm-20.57 30.5l17.94-17.94v18.06l-4.71 4.71 7.34 7.34 7.34-7.34-4.71-4.71v-18.06l17.94 17.94-20.57 20.57-20.57-20.57z"/></svg>`,
    'true sons': `<svg class="icon-npc true-sons" viewBox="0 0 64 64"><path d="M4.5 55.6h34.8l-13.4-33.1h-21.4zm27.1-37.9l3 5.6h24.9v-5.6zm5.3 10l3 5.6h19.6v-5.6zm-10.2-19.3l2.6 5h30.2v-5zm15.5 29.3l3 5.7h14.3v-5.7z"/></svg>`,
    'hyenas': `<svg class="icon-npc hyenas" viewBox="0 0 64 64"><path d="M48 24.1l11.5-4.5-1.4-3.5-7.1 2.9 3.8-7-3.2-1.8-6 11-13.6 5.3-14.2-4.8-5.5-9.6-3.4 1.9 3.4 6-6.6-2.3-1.2 3.5 10.6 3.6 4 6.9-11.7 4.6 1.4 3.5 12.1-4.9 10.8 19 10.9-19.9 12 4 1.1-3.5-11.3-3.8 3.7-6.7zm-5.4 2.2l-1.8 3.3-3.5-1.2 5.3-2.1zm-22.1.3l6 2-4 1.7-2-3.7zm11.2 19.6l-7.3-12.7 7.6-3 7 2.4-7.3 13.3z"/></svg>`,
    'outcasts': `<svg class="icon-npc outcasts" viewBox="0 0 64 64"><path d="M59.109 18.941a.986.986 0 0 0-.114-.296c-.262-.441-.821-.592-1.248-.338a.898.898 0 0 0-.427.864c.53 4.26-1.419 8.621-5.331 10.947-5.279 3.139-12.115 1.385-15.267-3.917-3.152-5.302-1.428-12.145 3.85-15.284 3.912-2.326 8.675-1.955 12.163.546.284.192.657.22.963.037.428-.254.562-.817.299-1.258a1 1 0 0 0-.205-.242c-4.76-4.16-11.48-5.174-16.808-2.007a13.165 13.165 0 0 0-4.37 4.242 1.186 1.186 0 0 1-1.967.07 13.16 13.16 0 0 0-4.489-3.817c-5.503-2.851-12.153-1.444-16.661 2.987a.982.982 0 0 0-.19.253c-.235.455-.07 1.01.372 1.238a.895.895 0 0 0 .959-.094c3.337-2.701 8.069-3.349 12.111-1.256 5.454 2.825 7.575 9.556 4.738 15.033s-9.559 7.629-15.013 4.804c-4.041-2.094-6.242-6.333-5.962-10.617a.893.893 0 0 0-.477-.837c-.441-.229-.99-.044-1.227.411a.999.999 0 0 0-.097.301c-1.018 6.238 1.67 12.481 7.174 15.332a13.108 13.108 0 0 0 4.183 1.337 1.17 1.17 0 0 1 .921 1.587 13.862 13.862 0 0 0-.934 4.999c0 6.394 4.306 11.819 10.315 13.847a.93.93 0 0 0 .718-1.708c-3.933-1.776-6.685-5.803-6.685-10.499 0-3.951 1.945-7.435 4.903-9.499v8.551a1.443 1.443 0 0 0 2.884 0v-9.989a10.9 10.9 0 0 1 1.83-.415v11.189a1.647 1.647 0 1 0 3.294 0v-11.161c.629.101 1.241.252 1.83.456v9.272a1.442 1.442 0 1 0 2.884 0v-7.76c2.849 2.08 4.714 5.489 4.714 9.353 0 4.696-2.752 8.724-6.685 10.499a.93.93 0 1 0 .718 1.708c6.007-2.028 10.315-7.454 10.315-13.847 0-2.053-.452-4.003-1.256-5.777a1.185 1.185 0 0 1 1.016-1.691 13.214 13.214 0 0 0 5.998-1.83c5.323-3.166 7.642-9.555 6.261-15.724zm-25.193 12.743h-4.196a1.048 1.048 0 0 1-.911-1.564l2.098-3.705a1.048 1.048 0 0 1 1.823 0l2.098 3.705a1.048 1.048 0 0 1-.912 1.564zM12.618 29.146l4.804-5.045 4.58 4.434 2.291-2.366-4.6-4.453 4.904-5.15-2.384-2.273-4.886 5.131-4.756-4.606-2.291 2.366 4.776 4.626-4.822 5.063zm38.473-15.853l-4.887 5.131-4.756-4.606-2.291 2.366 4.776 4.625-4.822 5.064 2.384 2.272 4.805-5.045 4.58 4.435 2.291-2.366-4.6-4.454 4.904-5.149z"/></svg>`,

};

K.stripClasses = function(value) {
    let classes = classesToArray(K.classRemoval),
        cur, curValue, clazz, j, finalValue,
        className = value;

    if (classes.length) {
        curValue = className || '';
        cur = ` ${stripAndCollapse(curValue)} `;

        if (cur) {
            j = 0;
            while ((clazz = classes[j++])) {

                // Remove *all* instances
                while (cur.indexOf(` ${clazz} `) > -1) {
                    cur = cur.replace(` ${clazz} `, " ");
                }
            }

            finalValue = stripAndCollapse(cur);
        }
    }

    return finalValue;
};

// this changes values in arrays to strings and ignores functions
K.valuesToString = function(obj) {

    if (K.has(K.type(obj), ['object', 'array'])) {
        K.each(obj, function(i, v) {
            if (K.type(v) == 'function') return;
            obj[i] = K.has(K.type(v), ['object', 'array']) ? K.valuesToString(v) : v.toString();
        });
    } else return obj.toString();

    return obj;
};

K.data = {
    types: {}
};

// MARK: [K] User
K.user = {
    name: false,
    type: 0,
    error: false,
    data: false,
    getData: function() {
        if (!K.user.name) return;

        $.ajax({
            url: 'php/data_exists.php'
        }).done(function(data) {
            K.user.data = {}
            data = $.parseJSON(data);
            if (!data) return;

            $.getJSON(`data/${K.user.name}/complete.json?v=${data}`, function(data) {
                if (K.local('complete')) {
                    K.extend(data, K.local('complete'));
                    localStorage.removeItem('complete');

                    $.ajax({
                        type: "POST",
                        url: 'php/write_complete.php',
                        data: {
                            data: JSON.stringify(data)
                        }
                    });
                }

                K.user.data = data;
            });
        });
    }
};