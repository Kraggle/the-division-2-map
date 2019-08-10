import { jQuery as $ } from '../jQuery/jquery3.4.1.js';
import { K } from '../K.js';

// MARK [K] Cycle
K.cycle = {
    init: false,
    temp: [],
    groups: [],
    time: 5000,
    interval: false,

    reset: function() {
        this.init = false;
        this.temp = [];
        this.groups = [];

        if (this.interval) {
            clearInterval(this.interval);
            this.interval = false;
        }
    },

    start: function() {
        this.init = true;

        K.each(this.temp, function(i, layer) {
            K.cycle.add(layer);
            layer.showing = true;
        });

        this.temp = [];

        if (this.interval) {
            clearInterval(this.interval);
            this.interval = false;
        }
        this.interval = setInterval(() => K.cycle.action(), this.time);
        this.action();
    },

    add: function(layer) {
        if (!layer.options.cycle) return;

        if (!this.init) {
            this.temp.push(layer);
            return;
        }

        let add = true;
        K.each(this.groups, function(i, layers) {
            K.each(layers, function(i, l) {
                l === layer && (add = false);
            });
        });

        if (!add) return;

        const group = [layer];
        const addPoly = (layer) => {
            layer.cyclePoly = false;
            if (K.type(layer.options.link) != 'array') return;

            K.each(layer.options.link, function(i, id) {
                const link = K.group.getLayer(id);
                if (!link) return;
                if (link.options.shape != 'marker') {
                    layer.cyclePoly = link;
                }
            });
        };
        addPoly(layer);
        K.each(layer.options.cycle, function(i, id) {
            const l = K.group.getLayer(id);
            if (!l) return;
            group.push(l);
            addPoly(l);
        });

        this.groups.push(group);
    },

    action: function() {
        for (let i = 0; i < this.groups.length; i++) {
            const g = this.groups[i],
                group = [];

            for (let j = 0; j < g.length; j++) {
                const layer = g[j];
                !K.in('currentGroup', layer) && (layer.currentGroup = layer.options.group);
                if (!K.in(layer.currentGroup, ['groupHidden', 'groupComplete']))
                    group.push(layer);
            }

            const first = group[0];
            if (group.length == 1) {
                first.showing = true;
                $(first._icon).show();
                first.cyclePoly && $(first.cyclePoly._path).show();

                continue;
            }

            let next = false,
                done = false;
            for (let j = 0; j < group.length; j++) {
                const layer = group[j];

                if (next) {
                    layer.showing = true;
                    $(layer._icon).show();
                    layer.cyclePoly && $(layer.cyclePoly._path).show();
                    next = false;
                    done = true;

                } else if (layer.showing) {

                    layer.showing = false;
                    $(layer._icon).hide();
                    layer.cyclePoly && $(layer.cyclePoly._path).hide();
                    next = true;
                }

                const len = group.length - 1;
                if (len == j && (next || !done)) {
                    first.showing = true;
                    $(first._icon).show();
                    first.cyclePoly && $(first.cyclePoly._path).show();
                }
            }
        }
    }
};