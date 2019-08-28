/*
 Classes, functions and prototypes used in websites by Kraggle
 (c) 2019 Kraig Larner
*/

export const K = {
    version: "1.0"
};

const arr = [],
    indexOf = arr.indexOf,
    isWindow = function isWindow(obj) {
        return obj != null && obj === obj.window;
    },
    class2type = {},
    toString = class2type.toString,
    hasOwn = class2type.hasOwnProperty,
    fnToString = hasOwn.toString,
    ObjectFunctionString = fnToString.call(Object);

/*
 * @namespace Util
 *
 * Various utility functions, used by internally.
 */

K.Util = {

    formatLatLngs: function(latLngs, digits = 5) {
        const pow = Math.pow(10, digits);

        switch (K.Util.type(latLngs)) {
            case 'object': // just a Lat, Lng object
                latLngs.lat = Math.round(latLngs.lat * pow) / pow;
                latLngs.lng = Math.round(latLngs.lng * pow) / pow;
                break;
            case 'array': // could be array of arrays, or simply array of objects
                for (let i = 0; i < latLngs.length; i++)
                    latLngs[i] = K.Util.formatLatLngs(latLngs[i], digits);
                break;
            case 'number': // just a lat or a lng
                return Math.round(latLngs * pow) / pow;
        }

        return latLngs;
    },


    // // @function extend(dest: Object, src?: Object): Object
    // // Merges the properties of the `src` object (or multiple objects) into `dest` object and returns the latter. Has an `K.extend` shortcut.
    extend: function() {
        let options, name, src, copy, copyIsArray, clone,
            target = arguments[0] || {},
            i = 1,
            length = arguments.length,
            deep = false;

        // Handle a deep copy situation
        if (typeof target === "boolean") {
            deep = target;

            // Skip the boolean and the target
            target = arguments[i] || {};
            i++;
        }

        // Handle case when target is a string or something (possible in deep copy)
        if (typeof target !== "object" && !K.Util.isFunction(target)) {
            target = {};
        }

        // Extend jQuery itself if only one argument is passed
        if (i === length) {
            target = this;
            i--;
        }

        for (; i < length; i++) {

            // Only deal with non-null/undefined values
            if ((options = arguments[i]) != null) {

                // Extend the base object
                for (name in options) {
                    src = target[name];
                    copy = options[name];

                    // Prevent never-ending loop
                    if (target === copy) {
                        continue;
                    }

                    // Recurse if we're merging plain objects or arrays
                    if (deep && copy && (K.Util.isPlainObject(copy) ||
                            (copyIsArray = K.Util.isArray(copy)))) {

                        if (copyIsArray) {
                            copyIsArray = false;
                            clone = src && K.Util.isArray(src) ? src : [];

                        } else {
                            clone = src && K.Util.isPlainObject(src) ? src : {};
                        }

                        // Never move original objects, clone them
                        target[name] = K.Util.extend(deep, clone, copy);

                        // Don't bring in undefined values
                    } else if (copy !== undefined) {
                        target[name] = copy;
                    }
                }
            }
        }

        // Return the modified object
        return target;
    },

    each: function(obj, callback) {
        let length, i = 0;

        if (isArrayLike(obj)) {
            length = obj.length;
            for (; i < length; i++) {
                if (callback.call(obj[i], i, obj[i]) === false) {
                    break;
                }
            }
        } else {
            for (i in obj) {
                if (callback.call(obj[i], i, obj[i]) === false) {
                    break;
                }
            }
        }

        return obj;
    },

    type: function(obj) {
        if (obj == null) {
            return obj + "";
        }

        // Support: Android <=2.3 only (functionish RegExp)
        return typeof obj === "object" || typeof obj === "function" ?
            class2type[toString.call(obj)] || "object" :
            typeof obj;
    },

    isFunction: function(obj) {
        return K.Util.type(obj) === "function";
    },

    isPlainObject: function(obj) {
        let proto, Ctor;

        // Detect obvious negatives
        // Use toString instead of jQuery.type to catch host objects
        if (!obj || toString.call(obj) !== "[object Object]") {
            return false;
        }

        proto = Object.getPrototypeOf(obj);

        // Objects with no prototype (e.g., `Object.create( null )`) are plain
        if (!proto) {
            return true;
        }

        // Objects with prototype are plain iff they were constructed by a global Object function
        Ctor = hasOwn.call(proto, "constructor") && proto.constructor;
        return typeof Ctor === "function" && fnToString.call(Ctor) === ObjectFunctionString;
    },

    // @function create(proto: Object, properties?: Object): Object
    // Compatibility polyfill for [Object.create](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object/create)
    create: Object.create || (function() {
        function F() {}
        return function(proto) {
            F.prototype = proto;
            return new F();
        };
    })(),

    // @function bind(fn: Function, …): Function
    // Returns a new function bound to the arguments passed, like [Function.prototype.bind](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Function/bind).
    // Has a `K.bind()` shortcut.
    bind: function(fn, obj) {
        const slice = Array.prototype.slice;

        if (fn.bind) {
            return fn.bind.apply(fn, slice.call(arguments, 1));
        }

        const args = slice.call(arguments, 2);

        return function() {
            return fn.apply(obj, args.length ? args.concat(slice.call(arguments)) : arguments);
        };
    },

    // @function stamp(obj: Object): Number
    // Returns the unique ID of an object, assiging it one if it doesn't have it.
    stamp: function(obj) {
        /*eslint-disable */
        obj._k_id = obj._k_id || ++K.Util.lastId;
        return obj._k_id;
        /*eslint-enable */
    },

    // @property lastId: Number
    // Last unique ID used by [`stamp()`](#util-stamp)
    lastId: 0,

    // @function throttle(fn: Function, time: Number, context: Object): Function
    // Returns a function which executes function `fn` with the given scope `context`
    // (so that the `this` keyword refers to `context` inside `fn`'s code). The function
    // `fn` will be called no more than one time per given amount of `time`. The arguments
    // received by the bound function will be any arguments passed when binding the
    // function, followed by any arguments passed when invoking the bound function.
    // Has an `K.bind` shortcut.
    throttle: function(fn, time, context) {
        let lock, args, wrapperFn, later;

        later = function() {
            // reset lock and call if queued
            lock = false;
            if (args) {
                wrapperFn.apply(context, args);
                args = false;
            }
        };

        wrapperFn = function() {
            if (lock) {
                // called too soon, queue to call later
                args = arguments;

            } else {
                // call and lock until later
                fn.apply(context, arguments);
                setTimeout(later, time);
                lock = true;
            }
        };

        return wrapperFn;
    },

    // @function wrapNum(num: Number, range: Number[], includeMax?: Boolean): Number
    // Returns the number `num` modulo `range` in such a way so it lies within
    // `range[0]` and `range[1]`. The returned value will be always smaller than
    // `range[1]` unless `includeMax` is set to `true`.
    wrapNum: function(x, range, includeMax) {
        const max = range[1],
            min = range[0],
            d = max - min;
        return x === max && includeMax ? x : ((x - min) % d + d) % d + min;
    },

    // @function falseFn(): Function
    // Returns a function which always returns `false`.
    falseFn: function() { return false; },

    // @function formatNum(num: Number, digits?: Number): Number
    // Returns the number `num` rounded to `digits` decimals, or to 5 decimals by default.
    formatNum: function(num, digits) {
        const pow = Math.pow(10, digits || 5);
        return Math.round(num * pow) / pow;
    },

    // @function trim(str: String): String
    // Compatibility polyfill for [String.prototype.trim](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String/Trim)
    trim: function(str) {
        return str.trim ? str.trim() : str.replace(/^\s+|\s+$/g, '');
    },

    // @function splitWords(str: String): String[]
    // Trims and splits the string on whitespace and returns the array of parts.
    splitWords: function(str) {
        return K.Util.trim(str).split(/\s+/);
    },

    // @function setOptions(obj: Object, options: Object): Object
    // Merges the given properties to the `options` of the `obj` object, returning the resulting options. See `Class options`. Has an `K.setOptions` shortcut.
    setOptions: function(obj, options) {
        if (!K.Util.in('options', obj)) {
            obj.options = obj.options ? K.Util.create(obj.options) : {};
        }
        for (const i in options) {
            obj.options[i] = options[i];
        }
        return obj.options;
    },

    // @function getParamString(obj: Object, existingUrl?: String, uppercase?: Boolean): String
    // Converts an object into a parameter URL string, e.g. `{a: "foo", b: "bar"}`
    // translates to `'?a=foo&b=bar'`. If `existingUrl` is set, the parameters will
    // be appended at the end. If `uppercase` is `true`, the parameter names will
    // be uppercased (e.g. `'?A=foo&B=bar'`)
    getParamString: function(obj, existingUrl, uppercase) {
        const params = [];
        for (const i in obj) {
            params.push(encodeURIComponent(uppercase ? i.toUpperCase() : i) + '=' + encodeURIComponent(obj[i]));
        }
        return ((!existingUrl || existingUrl.indexOf('?') === -1) ? '?' : '&') + params.join('&');
    },

    // @function template(str: String, data: Object): String
    // Simple templating facility, accepts a template string of the form `'Hello {a}, {b}'`
    // and a data object like `{a: 'foo', b: 'bar'}`, returns evaluated string
    // `('Hello foo, bar')`. You can also specify functions instead of strings for
    // data values — they will be evaluated passing `data` as an argument.
    template: function(str, data) {
        return str.replace(K.Util.templateRe, function(str, key) {
            let value = data[key];

            if (value === undefined) {
                throw new Error('No value provided for variable ' + str);

            } else if (typeof value === 'function') {
                value = value(data);
            }
            return value;
        });
    },

    templateRe: /\{ *([\w_-]+) *\}/g,

    // @function isArray(obj): Boolean
    // Compatibility polyfill for [Array.isArray](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array/isArray)
    isArray: Array.isArray || function(obj) {
        return (Object.prototype.toString.call(obj) === '[object Array]');
    },

    // @function indexOf(array: Array, el: Object): Number
    // Compatibility polyfill for [Array.prototype.indexOf](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array/indexOf)
    indexOf: function(array, el) {
        for (let i = 0; i < array.length; i++) {
            if (array[i] === el) { return i; }
        }
        return -1;
    },

    urlParam: function(name) {
        const a = {};
        let r = window.location.href.match(/\?([^#]*)/);

        if (r == null)
            return null;

        r = r[1].split('&');

        K.Util.each(r, function(k, v) {
            v = v.split('=');
            a[v[0]] = decodeURI(v[1]);
        });

        return a[name] || a;
    },

    // Delete keys from object that exist in array 
    // (send {} as first argument to make new object)
    curtail: function() {
        let a = arguments[0],
            e = arguments[1];

        if (!Object.keys(a).length && Object.keys(e).length) {
            a = K.Util.extend({}, arguments[1]);
            e = arguments[2];
        }

        if (e && typeof e != "object")
            e = [e];

        K.Util.each(e, function(i, v) {
            if (v in a) delete a[v];
        });

        return a;
    },

    // Delete keys from object that don't exist in array 
    // (send {} as first argument to make new object)
    reduce: function() {
        let a = arguments[0],
            e = arguments[1];

        if (!Object.keys(a).length && Object.keys(e).length) {
            a = K.Util.extend({}, arguments[1]);
            e = arguments[2];
        }

        if (e && typeof e != "object")
            e = [e];

        K.Util.each(a, function(k) {
            !K.Util.isInArray(k, e) && delete a[k];
        });

        return a;
    },

    inArray: (value, obj, i) => {
        return obj == null ? -1 : indexOf.call(obj, value, i);
    },

    isInArray: (value, obj) => {
        switch (K.Util.type(obj)) {
            case 'array':
                return K.Util.inArray(value, obj) == -1 ? false : true;
            case 'object':
                return value in obj;
            default:
                return false;
        }
    },

    local: (key, value) => {
        if (value === undefined) {
            if (key === undefined) return localStorage;
            return JSON.parse(localStorage.getItem(key));
        } else {
            localStorage.setItem(key, JSON.stringify(value));
        }
    },

    localRemove: (key) => localStorage.removeItem(key),

    isIterable: function(obj) {
        return K.Util.isInArray(K.Util.type(obj), ['array', 'object']);
    },

    // checks if both passed variables match
    equals: (obj1, obj2) => {
        const type1 = K.Util.type(obj1),
            type2 = K.Util.type(obj2);

        // compare if they both match types
        if (type1 == type2) {

            switch (type1) {
                case 'array':
                    if (K.Util.empty(obj1) && K.Util.empty(obj2)) return true;
                    if (obj1.length != obj2.length) return false;
                    for (let i = 0, len = obj1.length; i < len; i++) {
                        if (!K.isInArray(obj1[i], obj2)) return false;
                    }
                    break;

                case 'object':
                    if (K.Util.empty(obj1) && K.Util.empty(obj2)) return true;

                    for (let p in obj1) {
                        // Check property exists on both objects
                        if (!K.Util.isInArray(p, obj2)) return false;
                        if (!K.Util.equals(obj1[p], obj2[p])) return false;
                    }

                    // Check obj2 for any extra properties
                    for (const p in obj2) {
                        if (typeof(obj1[p]) == 'undefined') return false;
                    }
                    break;

                case 'number':
                case 'string':
                case 'boolean':
                    if (obj1 != obj2) return false;
                    break;

                case 'function':
                    if (obj1.toString() != obj2.toString()) return false;
                    break;

                default:
                    if (!obj1 != !obj2) return false;
            }
        } else {
            if (K.Util.empty(obj1) && K.Util.empty(obj2)) return true;

            switch (type1) {
                case 'array':
                case 'object':
                    // return false as the types don't match
                    return false;
                case 'number':
                    if (!obj1 && K.Util.isNull(obj2)) return true;
                    if (obj1 && !obj2) return false;
                case 'string':
                case 'boolean':
                    if (obj1 != obj2) return false;
                    break;
                default:
                    if (!obj1 != !obj2) return false;
                    break;
            }
        }

        // if we have gotten here we are all good, so return true
        return true;
    },

    isNull: (obj) => {
        return K.Util.isInArray(K.Util.type(obj), ['null', 'undefined']);
    },

    length: (item) => {
        const type = K.Util.type(item);
        if (type == 'object') return Object.keys(item).length;
        else if (type == 'array') return item.length;
        return 0;
    },

    empty: (obj) => {
        switch (K.Util.type(obj)) {
            case 'object':
                for (let name in obj) return false;
                return true;
            case 'array':
                return !obj.length;
            case 'number':
            case 'boolean':
                return false;
            default:
                return !obj;
        }
    },

    getPropByString: (obj, string) => {
        if (!string)
            return obj;

        const props = string.split('.');

        let i = 0;
        for (let iLen = props.length - 1; i < iLen; i++) {
            const prop = props[i],
                candidate = obj[prop];

            if (candidate !== undefined) obj = candidate;
            else break;
        }
        return obj[props[i]];
    }
};

// shortcuts for most used utility functions
K.extend = K.Util.extend;
K.isInArray = K.Util.isInArray;
K.isArray = K.Util.isArray;
K.has = K.Util.isInArray;
K.in = K.Util.isInArray;
K.curtail = K.Util.curtail;
K.reduce = K.Util.reduce;
K.urlParam = K.Util.urlParam;
K.bind = K.Util.bind;
K.stamp = K.Util.stamp;
K.setOptions = K.Util.setOptions;
K.each = K.Util.each;
K.equals = K.Util.equals;
K.isIterable = K.Util.isIterable;
K.type = K.Util.type;
K.length = K.Util.length;
K.empty = K.Util.empty;
K.local = K.Util.local;
K.localRemove = K.Util.localRemove;
K.getPropByString = K.Util.getPropByString;

K.includeHTML = function() {
    let z, i, el, file, x;
    /* Loop through a collection of all HTML elements: */
    z = document.querySelectorAll('[include]');
    for (i = 0; i < z.length; i++) {
        el = z[i];
        /*search for elements with a certain attribute:*/
        file = el.getAttribute("include");
        if (file) {
            /* Make an HTTP request using the attribute value as the file name: */
            x = new XMLHttpRequest();
            x.onreadystatechange = function() {
                if (this.readyState == 4) {
                    if (this.status == 200) el.innerHTML = this.responseText;
                    if (this.status == 404) el.innerHTML = "Page not found.";
                    /* Remove the attribute, and call this function once more: */
                    el.removeAttribute("include");
                    K.includeHTML();
                }
            }
            x.open("GET", file, true);
            x.send();
            /* Exit the function: */
            return;
        }
    }
}

K.imgToSvg = function(cls, callback) {
    const doc = document;

    doc.querySelectorAll(`img.${cls}`).forEach((img) => {
        const imgId = img.id,
            imgClass = img.className,
            imgURL = img.src,
            imgStyle = img.getAttribute('style'),
            x = new XMLHttpRequest();

        x.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                const svg = this.responseXML.getElementsByTagName('svg')[0];

                // replace the id
                imgId && (svg.id = imgId);

                // replace the classes
                imgClass && svg.setAttribute('class', imgClass.removeClass('svg-me'));

                // remove invalid attribute
                svg.removeAttribute('xmlns:a');

                // set the viewbox if it's not set
                const vB = svg.getAttribute('viewBox'),
                    w = svg.getAttribute('width'),
                    h = svg.getAttribute('height');
                !vB && w && h && (svg.setAttribute('viewBox', `0 0 ${h} ${w}`));

                imgStyle && svg.setAttribute('style', imgStyle);

                // replace the img with the svg
                img.replaceWith(svg);

                callback && callback.call(svg);
            }
        };
        x.open("GET", imgURL, true);
        x.send();
    })
}

K.loadStyles = function(stylesheets) {
    stylesheets.forEach(url => {
        const link = document.createElement('link');
        link.setAttribute('rel', 'stylesheet');
        link.setAttribute('href', url);

        document.head.appendChild(link);
    });
}

// @class Class
// @aka K.Class

// @section
// @uninheritable

K.Class = function() {};

K.Class.extend = function(props) {

    // @function extend(props: Object): Function
    // [Extends the current class](#class-inheritance) given the properties to be included.
    // Returns a Javascript function that is a class constructor (to be called with `new`).
    const NewClass = function() {

        // call the constructor
        if (this.initialize) {
            this.initialize.apply(this, arguments);
        }

        // call all constructor hooks
        this.callInitHooks();
    };

    const parentProto = NewClass.__super__ = this.prototype;

    const proto = K.Util.create(parentProto);
    proto.constructor = NewClass;

    NewClass.prototype = proto;

    // inherit parent's statics
    for (const i in this) {
        if (K.in(i, this) && i !== 'prototype') {
            NewClass[i] = this[i];
        }
    }

    // mix static properties into the class
    if (props.statics) {
        K.extend(NewClass, props.statics);
        delete props.statics;
    }

    // mix includes into the prototype
    if (props.includes) {
        K.Util.extend.apply(null, [proto].concat(props.includes));
        delete props.includes;
    }

    // merge options
    if (proto.options) {
        props.options = K.Util.extend(K.Util.create(proto.options), props.options);
    }

    // mix given properties into the prototype
    K.extend(proto, props);

    proto._initHooks = [];

    // add method for calling all hooks
    proto.callInitHooks = function() {

        if (this._initHooksCalled) { return; }

        if (parentProto.callInitHooks) {
            parentProto.callInitHooks.call(this);
        }

        this._initHooksCalled = true;

        for (let i = 0, len = proto._initHooks.length; i < len; i++) {
            proto._initHooks[i].call(this);
        }
    };

    return NewClass;
};


// @function include(properties: Object): this
// [Includes a mixin](#class-includes) into the current class.
K.Class.include = function(props) {
    K.extend(this.prototype, props);
    return this;
};

// @function mergeOptions(options: Object): this
// [Merges `options`](#class-options) into the defaults of the class.
K.Class.mergeOptions = function(options) {
    K.extend(this.prototype.options, options);
    return this;
};

// @function addInitHook(fn: Function): this
// Adds a [constructor hook](#class-constructor-hooks) to the class.
K.Class.addInitHook = function(fn) { // (Function) || (String, args...)
    const args = Array.prototype.slice.call(arguments, 1);

    const init = typeof fn === 'function' ? fn : function() {
        this[fn].apply(this, args);
    };

    this.prototype._initHooks = this.prototype._initHooks || [];
    this.prototype._initHooks.push(init);
    return this;
};



/*
 * @class Evented
 * @aka K.Evented
 * @inherits Class
 *
 * A set of methods shared between event-powered classes (like `Map` and `Marker`). Generally, events allow you to execute some function when something happens with an object (e.g. the user clicks on the map, causing the map to fire `'click'` event).
 *
 * @example
 *
 * ```js
 * map.on('click', function(e) {
 * 	alert(e.latlng);
 * } );
 * ```
 *
 * Leaflet deals with event listeners by reference, so if you want to add a listener and then remove it, define it as a function:
 *
 * ```js
 * function onClick(e) { ... }
 *
 * map.on('click', onClick);
 * map.off('click', onClick);
 * ```
 */


K.Evented = K.Class.extend({

    /* @method on(type: String, fn: Function, context?: Object): this
     * Adds a listener function (`fn`) to a particular event type of the object. You can optionally specify the context of the listener (object the this keyword will point to). You can also pass several space-separated types (e.g. `'click dblclick'`).
     *
     * @alternative
     * @method on(eventMap: Object): this
     * Adds a set of type/listener pairs, e.g. `{click: onClick, mousemove: onMouseMove}`
     */
    on: function(types, fn, context) {

        // types can be a map of types/handlers
        if (typeof types === 'object') {
            for (const type in types) {
                // we don't process space-separated events here for performance;
                // it's a hot path since Layer uses the on(obj) syntax
                this._on(type, types[type], fn);
            }

        } else {
            // types can be a string of space-separated words
            types = K.Util.splitWords(types);

            for (let i = 0, len = types.length; i < len; i++) {
                this._on(types[i], fn, context);
            }
        }

        return this;
    },

    /* @method off(type: String, fn?: Function, context?: Object): this
     * Removes a previously added listener function. If no function is specified, it will remove all the listeners of that particular event from the object. Note that if you passed a custom context to `on`, you must pass the same context to `off` in order to remove the listener.
     *
     * @alternative
     * @method off(eventMap: Object): this
     * Removes a set of type/listener pairs.
     *
     * @alternative
     * @method off: this
     * Removes all listeners to all events on the object.
     */
    off: function(types, fn, context) {

        if (!types) {
            // clear all listeners if called without arguments
            delete this._events;

        } else if (typeof types === 'object') {
            for (const type in types) {
                this._off(type, types[type], fn);
            }

        } else {
            types = K.Util.splitWords(types);

            for (let i = 0, len = types.length; i < len; i++) {
                this._off(types[i], fn, context);
            }
        }

        return this;
    },

    // attach listener (without syntactic sugar now)
    _on: function(type, fn, context) {
        this._events = this._events || {};

        /* get/init listeners for type */
        let typeListeners = this._events[type];
        if (!typeListeners) {
            this._events[type] = typeListeners = [];
        }

        if (context === this) {
            // Less memory footprint.
            context = undefined;
        }
        const newListener = { fn: fn, ctx: context },
            listeners = typeListeners;

        // check if fn already there
        for (let i = 0, len = listeners.length; i < len; i++) {
            if (listeners[i].fn === fn && listeners[i].ctx === context) {
                return;
            }
        }

        listeners.push(newListener);
    },

    _off: function(type, fn, context) {
        let listeners,
            i,
            len;

        if (!this._events) { return; }

        listeners = this._events[type];

        if (!listeners) {
            return;
        }

        if (!fn) {
            // Set all removed listeners to noop so they are not called if remove happens in fire
            for (i = 0, len = listeners.length; i < len; i++) {
                listeners[i].fn = K.Util.falseFn;
            }
            // clear all listeners for a type if function isn't specified
            delete this._events[type];
            return;
        }

        if (context === this) {
            context = undefined;
        }

        if (listeners) {

            // find fn and remove it
            for (i = 0, len = listeners.length; i < len; i++) {
                const l = listeners[i];
                if (l.ctx !== context) { continue; }
                if (l.fn === fn) {

                    // set the removed listener to noop so that's not called if remove happens in fire
                    l.fn = K.Util.falseFn;

                    if (this._firingCount) {
                        /* copy array in case events are being fired */
                        this._events[type] = listeners = listeners.slice();
                    }
                    listeners.splice(i, 1);

                    return;
                }
            }
        }
    },

    // @method fire(type: String, data?: Object, propagate?: Boolean): this
    // Fires an event of the specified type. You can optionally provide an data
    // object — the first argument of the listener function will contain its
    // properties. The event can optionally be propagated to event parents.
    fire: function(type, data, propagate) {
        if (!this.listens(type, propagate)) { return this; }

        const event = K.Util.extend({}, data, { type: type, target: this });

        if (this._events) {
            const listeners = this._events[type];

            if (listeners) {
                this._firingCount = (this._firingCount + 1) || 1;
                for (let i = 0, len = listeners.length; i < len; i++) {
                    const l = listeners[i];
                    l.fn.call(l.ctx || this, event);
                }

                this._firingCount--;
            }
        }

        if (propagate) {
            // propagate the event to parents (set with addEventParent)
            this._propagateEvent(event);
        }

        return this;
    },

    // @method listens(type: String): Boolean
    // Returns `true` if a particular event type has any listeners attached to it.
    listens: function(type, propagate) {
        const listeners = this._events && this._events[type];
        if (listeners && listeners.length) { return true; }

        if (propagate) {
            // also check parents for listeners if event propagates
            for (const id in this._eventParents) {
                if (this._eventParents[id].listens(type, propagate)) { return true; }
            }
        }
        return false;
    },

    // @method once(…): this
    // Behaves as [`on(…)`](#evented-on), except the listener will only get fired once and then removed.
    once: function(types, fn, context) {

        if (typeof types === 'object') {
            for (const type in types) {
                this.once(type, types[type], fn);
            }
            return this;
        }

        const handler = K.bind(function() {
            this
                .off(types, fn, context)
                .off(types, handler, context);
        }, this);

        // add a listener that's executed once and removed after that
        return this
            .on(types, fn, context)
            .on(types, handler, context);
    },

    // @method addEventParent(obj: Evented): this
    // Adds an event parent - an `Evented` that will receive propagated events
    addEventParent: function(obj) {
        this._eventParents = this._eventParents || {};
        this._eventParents[K.stamp(obj)] = obj;
        return this;
    },

    // @method removeEventParent(obj: Evented): this
    // Removes an event parent, so it will stop receiving propagated events
    removeEventParent: function(obj) {
        if (this._eventParents) {
            delete this._eventParents[K.stamp(obj)];
        }
        return this;
    },

    _propagateEvent: function(e) {
        for (const id in this._eventParents) {
            this._eventParents[id].fire(e.type, K.extend({ layer: e.target }, e), true);
        }
    }
});

const proto = K.Evented.prototype;

K.Mixin = { Events: proto };

K.isWindow = isWindow;

// Populate the class2type map
K.each("Boolean Number String Function Array Date RegExp Object Error Symbol".split(" "), function(i, name) {
    class2type["[object " + name + "]"] = name.toLowerCase();
});

export function isArrayLike(obj) {

    // Support: real iOS 8.2 only (not reproducible in simulator)
    // `in` check used to prevent JIT error (gh-2145)
    // hasOwn isn't used here due to false negatives
    // regarding Nodelist length in IE
    const length = !!obj && "length" in obj && obj.length,
        type = K.Util.type(obj);

    if (type === "function" || K.isWindow(obj)) {
        return false;
    }

    return type === "array" || length === 0 ||
        typeof length === "number" && length > 0 && (length - 1) in obj;
}

let rnothtmlwhite = (/[^\x20\t\r\n\f]+/g);

export function classesToArray(value) {
    if (Array.isArray(value)) {
        return value;
    }
    if (typeof value === "string") {
        return value.match(rnothtmlwhite) || [];
    }
    return [];
}

export function stripAndCollapse(value) {
    let tokens = value.match(rnothtmlwhite) || [];
    return tokens.join(" ");
}

K.isMobile = () => navigator.userAgent.bMatch(/Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile/i);

// MARK: [ [  P R O T O T Y P E S  ] ]
if (!Array.prototype.removeDupes) {
    Array.prototype.removeDupes = function() {
        const r = [],
            a = [];

        K.each(this, function(i, v) {
            const vs = JSON.stringify(v);
            if (!K.isInArray(vs, r)) {
                r.push(vs);
                a.push(v);
            }
        });
        return a;
    }
}

if (!String.prototype.filter) {
    String.prototype.filter = function() {
        const s = this.toString().split(' '),
            r = [];


        s.clean('');

        if (s.length < 2)
            return s[0];

        K.each(s, function(i, v) {
            if (!K.isInArray(v, r))
                r.push(v);
        });

        return r.join(' ');
    }
}

if (!Array.prototype.clean) {
    Array.prototype.clean = function(deleteValue) {
        for (let i = 0; i < this.length; i++) {
            if (this[i] == deleteValue) {
                this.splice(i, 1);
                i--;
            }
        }
        return this;
    }
}

if (!Array.prototype.average) {
    Array.prototype.average = function() {
        if (this.length) {
            let sum = this.reduce((a, b) => a + b);
            return sum / this.length;
        }

        return 0;
    }
}

if (!String.prototype.bMatch) {
    String.prototype.bMatch = function(regExp) {
        const s = this.toString();

        if (s.match(regExp) === null)
            return false;

        return true;
    }
}

if (!String.prototype.contains) {
    String.prototype.contains = function(str = '', matchCase = false) {
        let s = this.toString();

        !matchCase && (s = s.toLowerCase(), str = str.toLowerCase());

        if (s.indexOf(str) == -1)
            return false;

        return true;
    }
}

// Adds a space before each uppercase letter but not when they are grouped [e.g. FBI] 
if (!String.prototype.space) {
    String.prototype.space = function() {
        const s = this.toString();

        return s.replace(/([A-Z])([A-Z])([a-z])|([a-z])([A-Z])/g, '$1$4 $2$3$5').trim();
    }
}

if (!String.prototype.titleCase) {
    String.prototype.titleCase = function() {
        const s = this.toString();

        return s.replace(/(?:^|\s)\w/g, function(match) {
            return match.toUpperCase();
        });
    }
}

// Change the first character in a string to uppercase
if (!String.prototype.firstToUpper) {
    String.prototype.firstToUpper = function() {
        const s = this.toString();
        return s.substr(0, 1).toUpperCase() + s.substr(1);
    }
}

// Checks that two strings are equal, with optional case sensitivity
if (!String.prototype.equals) {
    String.prototype.equals = function(other, matchCase = false) {
        if (K.type(other) != 'string') return false;

        let me = this.toString();
        if (!matchCase) {
            me = me.toLowerCase();
            other = other.toLowerCase();
        }
        return me == other;
    }
}

// Change the first character in a string to uppercase
if (!String.prototype.addClass) {
    String.prototype.addClass = function(value) {

        let classes = classesToArray(value),
            cur, curValue, clazz, j,
            string = this.toString();

        if (classes.length) {
            curValue = string || '';
            cur = ` ${stripAndCollapse(curValue)} `;

            if (cur) {
                j = 0;
                while ((clazz = classes[j++])) {
                    if (cur.indexOf(` ${clazz} `) < 0)
                        cur += clazz + " ";
                }

                return stripAndCollapse(cur);
            }
        }

        return string;
    }
}

// Change the first character in a string to uppercase
if (!String.prototype.removeClass) {
    String.prototype.removeClass = function(value) {

        let classes = classesToArray(value),
            cur, curValue, clazz, j,
            string = this.toString();

        if (classes.length) {
            curValue = string || '';
            cur = ` ${stripAndCollapse(curValue)} `;

            if (cur) {
                j = 0;
                while ((clazz = classes[j++])) {

                    // Remove *all* instances
                    while (cur.indexOf(` ${clazz} `) > -1) {
                        cur = cur.replace(` ${clazz} `, " ");
                    }
                }

                return stripAndCollapse(cur);
            }
        }

        return string;
    }
}

// Get a string/regex value from another string
if (!String.prototype.get) {
    String.prototype.get = function(value) {
        let string = this.toString();
        let match = string.match(value);
        return K.empty(match) ? '' : match[0];
    }
}

if (!Date.prototype.addHours) {
    Date.prototype.addHours = function(h) {
        this.setTime(this.getTime() + (h * 60 * 60 * 1000));
        return this;
    }
}

if (!Date.prototype.addMinutes) {
    Date.prototype.addMinutes = function(h) {
        this.setTime(this.getTime() + (h * 60 * 1000));
        return this;
    }
}