import { jQuery as $ } from '../jQuery/jquery3.4.1.js';
import { K } from '../K.js';
import { switchLayerGroups } from './misc.js';

// MARK: [K] ContextMenu
K.contextMenu = {
    items: {
        complete: {
            value: (layer) => layer.complete ? 'Un-Complete' : 'Complete',
            icon: 'images/menu-complete-solo.svg',
            check: (layer) => layer.options.shape == 'marker' && !!layer.options.complete,
            action: (layer) => layer.toggleCompleted()
        },
        share: {
            value: 'Share',
            icon: 'images/menu-share.svg',
            check: (layer) => !!layer.options.type,
            action: (layer) => K.share(['layer'], layer)
        },
        search: {
            value: 'Search Similar',
            icon: 'images/menu-search.svg',
            check: (layer) => !!layer.options.type,
            action: (layer) => K.search.by('type', layer.options.type)
        },
        settings: {
            value: 'Settings',
            icon: 'images/menu-settings.svg',
            check: (layer) => K.bar.b.power.enabled() && (K.user.name == layer.options.creator || K.user.type > 3),
            action: (layer) => K.tool.layer._show(layer)
        },
        move: {
            value: (layer) => layer.dragging.enabled() ? 'End Move' : 'Move',
            icon: 'images/menu-move-solo.svg',
            check: (layer) => K.bar.b.power.enabled() && (K.user.name == layer.options.creator || K.user.type > 3),
            action: (layer) => {

                if (layer.dragging.enabled()) {
                    layer.dragging.disable();
                } else {
                    layer.dragging.enable();
                    layer.on('dragend', function() {
                        this.saved(false);
                    });
                }
            }
        },
        edit: {
            value: (layer) => layer.editing.edit ? 'End Edit' : 'Edit',
            icon: 'images/menu-edit-solo.svg',
            check: (layer) => K.bar.b.power.enabled() && (K.user.name == layer.options.creator || K.user.type > 3),
            action: (layer) => {
                layer.editing.edit = !layer.editing.edit;
                switchLayerGroups();
            }
        }
    },

    build: function(event, layer) {
        // console.log(event, layer);

        $('.context-menu').remove();

        const menu = $('<div />', {
            class: 'context-menu'
        }).css({
            top: event.containerPoint.y,
            left: event.containerPoint.x
        });

        K.each(this.items, function() {
            if (!this.check(layer)) return;

            menu.children().length && this.value == 'Settings' && $('<hr>').appendTo(menu);

            const $item = $('<div />', {
                class: 'menu-item ripple-me'
            });

            $('<img />', {
                src: this.icon || '',
                class: 'menu-icon'
            }).appendTo($item);

            $('<span />', {
                class: 'menu-text',
                text: K.type(this.value) == 'function' ? this.value(layer) : this.value
            }).appendTo($item);

            $item.appendTo(menu).on('click', () => {
                $('.context-menu').remove();
                this.action(layer);
            });
        });

        menu.children().length && menu.appendTo($('body'));
    }
};