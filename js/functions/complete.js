import { jQuery as $ } from '../jQuery/jquery3.4.1.js';
import { K } from '../K.js';
import { switchLayerGroups, polyHoverAnimation } from '../functions/misc.js';

// MARK: [K] Complete
K.complete = {
    layers: [],
    add: function(layer) {
        let add = true;
        K.each(this.layers, function(i, l) {
            if (layer.options.id === l.options.id) add = false;
        });
        add && !layer.options.onComplete && this.layers.push(layer);

        if (!K.timed.interval) K.timed.action();
    },
    remove: function(id) {
        let index = false;
        for (let i = 0; i < this.layers.length; i++) {
            const v = this.layers[i];
            if (id === v.options.id) {
                index = i;
                break;
            }
        }

        if (K.type(index) === 'number') this.layers.splice(index, 1);
    },
    is: function(layer) {
        if (K.type(layer) == 'string') layer = K.group.getLayer(layer);
        if (!layer) return false;
        if (!layer.getSetting('complete')) return false;
        let uD = K.user.data,
            id = layer.options.id;
        if (!uD && !K.in('complete', K.local())) K.local('complete', {});
        if (uD) return K.in(id, uD);
        return K.in(id, K.local('complete'));
    },
    time: function(layer) {
        if (!this.is(layer)) return false;
        let uD = K.user.data,
            id = layer.options.id,
            time = uD ? uD[id] : K.local('complete')[id];

        if (K.type(time) === 'string') {
            let end = new Date(time).getTime(),
                now = new Date().getTime(),
                gap = end - now,
                hrs = Math.ceil((gap % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                min = Math.ceil((gap % (1000 * 60 * 60)) / (1000 * 60));

            if (gap < 0) {
                this.set(false, layer);
                time = false;
            } else if (hrs) time = hrs + 'h';
            else if (min) time = min + 'm';

        } else time = false;

        return time;
    },
    toggle: function(layer) {
        return this.set(!layer.complete, layer);
    },
    set: function(done, layer) {

        let uD = K.user.data,
            id = layer.options.id,
            time = layer.options.time;
        if (!uD && !K.in('complete', localStorage)) K.local('complete', {});
        let obj = uD ? uD : K.local('complete');

        if (done) {
            obj[id] = time ? new Date().addHours(time).toString() : true;
            this.add(layer);
        } else {
            delete obj[id];
            this.remove(layer.options.id);
        }

        layer.complete = done;

        !uD && K.local('complete', obj);
        if (uD) {
            if (this.timeout) clearTimeout(this.timeout);
            this.timeout = setTimeout(() => {
                $.ajax({
                    type: "POST",
                    url: 'php/write_complete.php',
                    data: {
                        data: JSON.stringify(K.user.data)
                    }
                }).done(() => {
                    console.log("saved data!", K.user.data);
                });
            }, 1000);
        }

        return layer.complete;
    },
    timeout: false,
    showHide: function() {

        switchLayerGroups(true);

        let h = K.completeHidden,
            layers = K.complete.layers,
            gC = K.group.mode.groupComplete,
            g, show, hide, i, hidden;

        K.filters = K.local('filters') || {};

        K.each(layers, function(x, layer) {
            hidden = K.filters[layer.options.type];
            const gn = hidden ? 'groupHidden' : layer.options.group;
            g = K.group.mode[gn];
            i = layer._leaflet_id;

            show = (h ? gC : g);
            hide = (h ? g : gC);

            if (hide.getLayer(i)) {
                show.addLayer(hide.getLayer(i));
                hide.removeLayer(i);

                layer.currentGroup = h ? 'groupComplete' : gn;
            }
        });

        switchLayerGroups();
        polyHoverAnimation();
    }
};

K.timed = {
    layers: [],
    interval: false,
    add: function(layer) {
        let add = true;
        K.each(K.timed.layers, function(i, l) {
            if (layer.options.id === l.options.id) add = false;
        });
        add && K.timed.layers.push(layer);
    },
    action: function() {
        K.timed.interval = setInterval(() => {

            if (!K.timed.layers.length) {
                clearInterval(K.timed.interval);
                K.timed.interval = false;
                return;
            }

            K.each(K.timed.layers, function(i, layer) {
                layer.markComplete();
            });

            K.complete.showHide();

        }, 60000);
    },
    remove: function(id) {
        let index = false;
        for (let i = 0; i < K.timed.layers.length; i++) {
            const v = K.timed.layers[i];
            if (id === v.options.id) {
                index = i;
                break;
            }
        }

        if (K.type(index) === 'number') K.timed.layers.splice(index, 1);
    }
};