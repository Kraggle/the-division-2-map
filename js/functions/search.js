import { jQuery as $ } from '../jQuery/jquery3.4.1.js';
import { L } from '../Leaflet/importer.js';
import { K } from '../K.js';

// MARK: [K] Search
K.search = {
    options: {
        keys: ['creator', 'type', 'category', 'content']
    },

    paths: {
        creator: 'layer.options.creator',
        type: 'layer.options.type',
        category: 'layer.options.category',
        content: 'layer._popup._content'
    },

    defaultPath: [
        [50, 50],
        [51, 50]
    ],

    line: L.polyline([
        [50, 50],
        [51, 50]
    ], {
        group: 'groupAll',
        weight: 2,
        color: '#724ab1',
        opacity: 0.4
    }),

    // elements
    elements: [{
        key: 'NONE',
        selector: '.search .no-results'
    }, {
        key: 'LIST',
        selector: '.search .results'
    }, {
        key: 'SEARCH',
        selector: '#search',
        event: 'input change paste',
        action: function(el) {
            const val = $(el).val().trim().replace(/\s{2,}/, ' ').replace(/:\s+(\w+ )/, ':$1');

            if (this.timeout) clearTimeout(this.timeout);
            this.timeout = setTimeout(() => {
                this.populate(val);
            }, 400);
        }
    }, {
        key: 'CLEAR',
        selector: '#search-clear',
        action: function() {
            this.SEARCH.val('').trigger('change').focus();
        }
    }, {
        key: 'MORE',
        selector: '.search .more',
        action: function() {
            this.display();
        }
    }, {
        key: 'ITEM',
        selector: '.search .result.clone-me',
        call: ['detach']
    }, {
        key: 'COUNT',
        selector: '.search .count'
    }, {
        key: 'SHARE',
        selector: '.search .share',
        action: function() {
            K.share(['search']);
        }
    }, {
        key: 'BTN.CATEGORY',
        selector: '.search .quick .category'
    }, {
        key: 'BTN.TYPE',
        selector: '.search .quick .type'
    }, {
        key: 'BTN.CREATOR',
        selector: '.search .quick .creator'
    }, {
        key: 'BTN.CONTENT',
        selector: '.search .quick .content'
    }, {
        key: 'SORT.CATEGORY.ASC',
        selector: '.search .sort input.category.asc'
    }, {
        key: 'SORT.CATEGORY.DESC',
        selector: '.search .sort input.category.desc'
    }, {
        key: 'SORT.TYPE.ASC',
        selector: '.search .sort input.type.asc'
    }, {
        key: 'SORT.TYPE.DESC',
        selector: '.search .sort input.type.desc'
    }, {
        key: 'SORT.CONTENT.ASC',
        selector: '.search .sort input.content.asc'
    }, {
        key: 'SORT.CONTENT.DESC',
        selector: '.search .sort input.content.desc'
    }, {
        key: 'SORT.DATE.ASC',
        selector: '.search .sort input.date.asc'
    }, {
        key: 'SORT.DATE.DESC',
        selector: '.search .sort input.date.desc'
    }, {
        key: 'SORT.DISTANCE.ASC',
        selector: '.search .sort input.distance.asc'
    }, {
        key: 'SORT.DISTANCE.DESC',
        selector: '.search .sort input.distance.desc'
    }, {
        key: 'CHECK.EXACT',
        selector: '.search .checks input.exact',
        event: 'change',
        value: K.local('search-exact') || false,
        action: function(el) {
            K.local('search-exact', $(el).is(':checked'));
            this.SEARCH.trigger('change').focus();
        }
    }, {
        key: 'CHECK.MATCH',
        selector: '.search .checks input.match',
        event: 'change',
        value: K.local('search-match') || false,
        action: function(el) {
            K.local('search-match', $(el).is(':checked'));
            this.SEARCH.trigger('change').focus();
        }
    }, {
        key: 'CHECK.PATH',
        selector: '.search .checks input.path',
        event: 'change',
        value: K.local('search-path') || false,
        action: function(el) {
            K.local('search-path', $(el).is(':checked'));
            if ($(el).is(':checked')) {
                K.myMap.addLayer(K.search.line);
            } else {
                K.myMap.removeLayer(K.search.line);
            }
        }
    }, {
        key: 'CHECK.ONLY',
        selector: '.search .checks input.only',
        event: 'change',
        value: K.local('search-only') || false,
        action: function() {

        }
    }, {
        key: 'MENU',
        selector: '.bar-toggle.search'
    }],

    // used for the display list
    list: null,
    loaded: 0,
    terms: false,
    keySearch: false,
    timeout: false,

    attach: function() {
        $('#search').val('');
        K.group.clearSearch();
        K.group.search();

        const _this = this;

        K.each(this.elements, function() {
            const split = this.key.split('.');
            let path = _this;
            for (let i = 0, l = split.length; i < l; i++) {
                const key = split[i];
                if (i != l - 1) {
                    !path[key] && (path[key] = {});
                    path = path[key];
                } else {
                    if (!$(this.selector).length) continue;

                    path[key] = $(this.selector);
                    const $el = path[key];

                    // do any attached function calls on the jQuery element
                    if (this.call)
                        for (const call of this.call) $el[call]();

                    if (K.type(this.value) == 'boolean')
                        $el.prop('checked', this.value);

                    // add any attached actions with events if declared
                    const event = this.event || 'click',
                        action = this.action;
                    action && $el.off(event).on(event, function() {
                        action.call(_this, this);
                    });
                }
            }
        });

        K.each(this.BTN, function() {

            $(this).off('click').on('click', function() {
                let val = _this.SEARCH.val().trim().replace(/\s{2,}/, ' ').replace(/:\s+(\w+ )/, ':$1');
                const type = $(this).attr('type');

                if (!val.contains(type)) {
                    const text = `${val} ${type}:${type == 'creator' && K.user.name ? K.user.name : ''}`;
                    val = text.trim();
                }

                _this.SEARCH.val(val);

                const words = val.split(' ');
                let key = false,
                    start = -1,
                    end = val.length - 1;

                for (let i = 0; i < words.length; i++) {
                    const word = words[i];
                    if (word.contains(':')) {
                        const split = word.split(':');
                        if (split[0] == type) {
                            if (split[1] != '') {
                                key = split[0];
                                start = val.indexOf(type + ':' + split[1]) + type.length + 1;
                                end = start + split[1].length;
                            } else
                                start = end = val.indexOf(type + ':') + type.length + 1;
                        } else key = false;
                    } else if (key)
                        end = end + 1 + word.length;
                }

                _this.SEARCH.selectRange(start, end).trigger('change');
            });
        });

        const sort = K.local('searchSort') || {
            btn: 'date',
            dir: 'asc'
        };
        $(`.search .sort input[btn=${sort.btn}][dir=${sort.dir}]`).prop('checked', true);

        K.each(this.SORT, function() {
            K.each(this, function() {

                $(this).off('change').on('change', function() {
                    const checked = $(this).is(':checked'),
                        all = '.search .sort input';

                    $(all).prop('checked', false);
                    $(this).prop('checked', checked);

                    !$(all + ':checked').length && _this.SORT.DATE.ASC.prop('checked', true);

                    _this.trigger();

                    const active = $(all + ':checked');
                    K.local('searchSort', {
                        btn: active.attr('btn'),
                        dir: active.attr('dir')
                    });
                });
            });
        });

        this.CHECK.PATH.is(':checked') && K.myMap.addLayer(K.search.line);
    },

    results: function(string, options) {
        if (!string) return [];

        options = this.options = K.extend(this.options, options);

        const keySearch = this.keySearch = {},
            getQuoted = /"(\w[^"]+\w)"/g,
            removeQuoted = /['"]\w[^"']+\w["']/g;

        // find and remove the key searches
        const keys = string.match(/(\w+:[^:]{0,}(?= \w+:)|\w+:.{0,}$)/g) || [];
        string = string.replace(/ ?\w+:.*/g, '').trim();

        // find and remove quoted strings
        const terms = this.terms = string.match(getQuoted) || [];
        K.each(terms, (i, term) => terms[i] = term.replace('"', ''));

        string = string.replace(removeQuoted, '').replace(/\s{2,}/, ' ').trim();

        let words = string.split(' ');
        for (let i = 0; i < words.length; i++)
            words[i] && terms.push(words[i]);

        for (const value of keys) {
            const keyVal = value.split(':'),
                key = keyVal[0];

            keySearch[key] = {
                key: key,
                values: keyVal[1].match(getQuoted) || []
            };

            words = keyVal[1].replace(removeQuoted, '').replace(/\s{2,}/, ' ').trim();
            !options.exactMatch && (words = words.split(' '));
            options.exactMatch && (words = [words]);
            for (let i = 0; i < words.length; i++)
                words[i] && keySearch[key].values.push(key == 'type' ? words[i].space() : words[i]);
        }

        const results = [];

        K.each(K.group.search(), function() {
            let skip = false;

            this.matches = [];

            // first check the keySearches are a match
            for (const key in keySearch) {
                if (!K.in(key, options.keys)) continue;
                const k = keySearch[key];
                !K.length(k.values) && (skip = true);
                for (let i = 0; i < k.values.length; i++) {
                    const v = k.values[i] || 'ignorer',
                        c = options.matchCase;
                    if (options.exactMatch && key != 'content')
                        !(this[key] || '').equals(v, c) && (skip = true);
                    else !(this[key] || '').contains(v, c) && (skip = true);
                }
            }

            // skip if the keySearch didn't match 
            if (skip) return;

            for (let key in keySearch) this.matches.push(key);

            // now we check the other search terms match any other keys
            let match = true;
            if (terms.length) {
                match = false;
                for (let i = 0; i < options.keys.length; i++) {
                    const key = options.keys[i];
                    let found = 0;

                    for (let j = 0; j < terms.length; j++) {
                        const word = terms[j];
                        K.type(this[key]) == 'string' && this[key].contains(word, options.matchCase) && found++;
                    }

                    if (found == terms.length) {
                        match = true;
                        this.matches.push(key);
                    }
                }
            }

            match && results.push(this);
        });

        return results;
    },

    populate: function(string) {
        $('.pan-pointer').removeClass('pan-pointer');

        const options = {
            matchCase: this.CHECK.MATCH.is(':checked'),
            exactMatch: this.CHECK.EXACT.is(':checked'),
            resultsOnly: this.CHECK.ONLY.is(':checked')
        };

        this.line.setLatLngs(this.defaultPath);
        this.list = this.results(string, options);
        this.sort();
        this.loaded = 0;

        if (!K.length(this.list)) {
            this.LIST.hide();
            this.NONE.show();
            this.COUNT.html('');
            this.SHARE.hide();
            this.line.setLatLngs(this.defaultPath);
            return;
        }

        this.NONE.hide();
        this.LIST.show().html('');
        this.SHARE.show();
        this.LIST.animate({ scrollTop: 0 }, 400);

        this.counter.set(this.list.length);

        this.display();
    },

    counter: {
        set: function(to) {
            this.to = to;
            if (this.time) clearTimeout(this.time);
            this.action();
        },
        time: false,
        to: false,
        on: 0,
        action: function() {
            if (this.on == this.to) return;

            const gap = Math.abs(this.to - this.on),
                by = gap > 500 ? 50 : gap > 250 ? 25 : gap > 100 ? 10 : gap > 25 ? 5 : 1;

            this.to < this.on ? (this.on -= by) : (this.on += by);
            K.search.COUNT.html(`There ${this.on == 1 ? 'is only' : 'are'} <span class="num">${this.on}</span> result${this.on == 1 ? '' : 's'}!`);


            this.time = setTimeout(() => {
                this.action()
            }, 3);
        }
    },

    display: function() {
        const max = this.loaded + 50;
        this.MORE.hide();


        for (; this.loaded < this.list.length; this.loaded++) {
            if (this.loaded == max) {
                this.MORE.show();
                break;
            }

            const result = this.list[this.loaded],
                item = this.ITEM.clone().removeClass('clone-me').appendTo(this.LIST),
                icon = result.layer.options.iconUrl;

            $('.num', item).text(this.loaded + 1);

            if (icon)
                $('.icon', item).attr('src', icon);
            else {
                $('.poly', item).css({
                    backgroundColor: result.layer.options.fillColor,
                    borderColor: result.layer.options.color
                });

                $('.content', item).addClass('poly-info');
            }

            for (let i = 0; i < this.options.keys.length; i++) {

                const key = this.options.keys[i];
                let text = K.getPropByString(result, this.paths[key]);

                $(`.${key}.text`, item).html(key == 'type' ? text.space() : text);
            }

            if (K.empty(result.content)) $('.content.text', item).hide();

            for (let i = 0; i < result.matches.length; i++) {

                const key = result.matches[i],
                    el = $(`.${key}.text`, item);

                for (let j = 0; j < this.terms.length; j++) {
                    const term = this.terms[j];
                    el.replaceAll(new RegExp(`(${term})`, `${this.options.matchCase ? '' : 'i'}g`), '<strong>$1</strong>');
                }

                const kS = this.keySearch[key];
                if (kS) {
                    for (let j = 0; j < kS.values.length; j++) {
                        const term = kS.values[j];
                        el.replaceAll(new RegExp(`(${term})`, `${this.options.matchCase ? '' : 'i'}g`), '<strong>$1</strong>');
                    }
                }
            }

            item.on('click', function() {

                // console.log(result);

                $('.pan-pointer').removeClass('pan-pointer');

                const layer = K.group.getLayer(result.layer.options.id);
                let zoom = layer.options.group.replace('group', '').replace(/^0/, '');
                zoom = (isNaN(zoom) ? 9 : parseInt(zoom)) + 2;

                if (layer._latlng) {
                    K.myMap.flyTo(result.layer._latlng, zoom, {
                        maxZoom: 15
                    });

                    K.myMap.once('moveend', () => {
                        $(layer._icon).addClass('pan-pointer');
                    });

                } else K.myMap.flyToBounds(result.layer._latlngs, {
                    animate: true,
                    padding: L.point([250, 250]),
                    maxZoom: 15
                });
            });

            item.show();
        }
    },

    map: false,
    // MARK: [K] Search => Sort
    sort: function() {

        if (!K.length(this.list)) return;

        const values = {};
        $('.search .sort input:checked').each(function() {
            values[$(this).attr('btn')] = $(this).attr('dir');
        });

        if (K.in('distance', values)) {
            let n = 1,
                distances = [],
                len = this.list.length;

            const findFor = (item) => {
                const latLng1 = item.layer._latlng || L.latLngBounds(item.layer._latlngs).getCenter();
                let smallest = {
                    index: -1,
                    distance: Infinity,
                    latLng: [0, 0]
                };

                K.each(this.list, (i, item2) => {

                    if (K.in('distance', item2) || item === item2) return;

                    const latLng2 = item2.layer._latlng || L.latLngBounds(item2.layer._latlngs).getCenter(),
                        distance = latLng1.distanceTo(latLng2) / 1000;

                    distance < smallest.distance && (smallest = {
                        distance: distance,
                        index: i,
                        latLng: latLng2
                    });
                });

                if (this.list[smallest.index]) {
                    if (distances.length > len / 4 && smallest.distance > Math.max.apply(Math, distances)) {
                        placeBeforeClosest(this.list[smallest.index]);
                        return;
                    }

                    smallest.distance > 5 && n++;
                    distances.push(smallest.distance);
                    this.list[smallest.index].distance = n;
                    findFor(this.list[smallest.index]);
                }
            };

            const placeBeforeClosest = (item) => {
                const latLng1 = item.layer._latlng || L.latLngBounds(item.layer._latlngs).getCenter(),
                    smallest = {
                        index: -1,
                        distance: Infinity
                    };

                K.each(this.list, (i, item2) => {

                    if (item === item2 || !K.in('distance', item2)) return;

                    const latLng2 = item2.layer._latlng || L.latLngBounds(item2.layer._latlngs).getCenter(),
                        distance = latLng1.distanceTo(latLng2) / 1000;

                    distance < smallest.distance && (smallest.distance = distance, smallest.index = i);
                });

                let increase = Infinity;

                if (this.list[smallest.index]) {
                    n = this.list[smallest.index].distance - 1;
                    distances.push(smallest.distance);
                    n++;
                    item.distance = increase = n;
                }

                let findItem;

                K.each(this.list, (i, item1) => {
                    if (item !== item1 && item1.distance >= increase) {
                        item1.distance++;
                        item1.distance > n && (n = item1.distance, findItem = item1);
                    }
                });

                findItem && findFor(findItem);
            };

            let northWest, value = Infinity;
            K.each(this.list, (i, item) => {
                const lls = item.layer._latlng || L.latLngBounds(item.layer._latlngs).getCenter(),
                    distance = lls.distanceTo([8.3, -14.9]);
                distance < value && (value = distance, northWest = i);
            });

            this.list[northWest].distance = 0;
            findFor(this.list[northWest]);

        }

        this.list.sort((a, b) => {
            for (const key in values) {
                const dir = values[key] == 'asc';

                if (K.empty(a[key])) return 1
                if (K.empty(b[key])) return -1

                if ((dir && a[key] > b[key]) || (!dir && a[key] < b[key])) return 1;
                if ((dir && a[key] < b[key]) || (!dir && a[key] > b[key])) return -1;
            }
        });

        const path = [];
        K.each(this.list, (i, item) => {
            path.push(item.layer._latlng || L.latLngBounds(item.layer._latlngs).getCenter());
        });
        this.line.setLatLngs(path);
    },

    find: function(id) {
        for (let i = 0; i < this.list.length; i++) {
            const item = this.list[i];
            if (item.layer.options.id == id) {
                // this.list.splice(i, 1);
                return item;
            }
        }
    },

    trigger: function() {
        this.SEARCH && this.SEARCH.trigger('change');
    },

    by: function(type, string) {
        this.MENU.not('.active').trigger('click');
        this.SORT.DISTANCE.ASC.prop('checked', true).trigger('change');
        this.CHECK.EXACT.prop('checked', true);
        this.CHECK.MATCH.prop('checked', true);
        this.SEARCH.val(`${type}:${string.space()}`).trigger('change');
    }
};