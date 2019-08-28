import { jQuery as $ } from '../jQuery/jquery3.4.1.js';
import { L } from '../Leaflet/importer.js';
import { K } from '../K.js';
import {
    sortObjByKeys,
    removeEmpty,
    textColor,
    ID,
    polyType,
    switchLayerGroups,
    polyHoverAnimation,
    switchLayerGroup
} from '../functions/misc.js';
import { CodeMirror } from '../CodeMirror/importer.js';
import { Huebee } from '../Utility/huebee.pkgd.js';

// MARK: [K] Tool.Layer
K.tool.layer = {

    // Settings to use through all functions
    join: false,
    layer: {},
    new: {},
    element: null,
    shape: false,
    modeSwitch: false,
    setting: null,
    isPopup: false,

    // Check if the menu is already open
    isOpen: function() {
        return !!$('#settings-menu').length;
    },

    // Open the menu
    show: function() {
        K.tool.layer._show.call(K.tool.layer, this);
    },

    _show: function(layer) {
        console.log(`Editing layer with ID: ${layer.options.id}`, layer);

        let self = this;

        // Cancel if we are in editing or deleting modes
        if (K.check.deleting || K.check.editing || !K.bar.b.power.enabled())
            return this;

        if (!this.tags) {
            this.tags = [];

            K.each(K.icons, function(v) {
                self.tags.push(v);
            });

            this.tags.sort();
        }

        // close any other menu that is already open
        this._hide();

        this.layer = layer;
        this.shape = K.settingShape(layer.options.shape);

        // Add the settings if they don't already exist
        if (!K.in('saved', layer.editing)) layer.editing.saved = true;

        layer.makeBackup();

        // Used to make holes in polygons
        if (this.join) {

            this.join._latlngs.push(layer._latlngs[0]);

            this.new = L.polygon(this.join._latlngs, K.extend({}, this.join.options, {
                pane: (this.join.options.className == 'poly-hover' ? 'zonePane' : 'overlayPane'),
            }));

            let p = this.join.popup;

            // Add a new popup if it has one
            if (p.content || p.list)
                this.new.bindPopup(p);

            K.group.removeLayer(this.join);
            K.group.removeLayer(layer);
            K.group.addLayer(this.new);

            this.new.saved(false);
            this.new.storeSettings();

            this.join = false;
            K.msg.hide();

            return this;
        }

        // Outline the layer that is being edited
        $(layer[layer.options.shape != 'marker' ? '_path' : '_icon']).addClass('leaflet-layer-editing');

        // Create the menu
        $('body').append(`<div id="settings-menu" class="settings-divider">
            <div class="settings-side left"></div>
            <div class="settings-side right"></div>
        </div>`);

        $('#settings-menu').on('remove', function() {
            $('.leaflet-layer-editing').removeClass('leaflet-layer-editing');

            // self._save();

        }).draggable({
            containment: '#map-id',
            start: function() {
                $(this).css({
                    transform: 'translate(0, 0)'
                });
            },
            stop: function() {
                this.position = K.extend({}, $(this).position(), {
                    transform: 'translate(0, 0)'
                });
                K.local('menuPos', this.position);
            },
            handle: '.settings-title'
        });

        this.position = K.local('menuPos') || false;

        if (this.position) {
            let w = $(window).width() - 300,
                h = $(window).height() - 515;
            this.position.left = w < this.position.left ? w : this.position.left;
            this.position.top = h < this.position.top ? h : this.position.top;
            $('#settings-menu').css(this.position);
        }

        $('.settings-side.left').append(
            `<div class="settings-tools marker">
			    <span class="settings-title">${layer.options.shape.toUpperCase()}</span>
			</div>
			<div class="settings-tools popup">
			    <span class="settings-title">POPUP</span>
			</div>
			<div class="settings-tools buttons"></div>
			<div class="settings-tools save">
                <!-- <a class="settings-save button ripple-me" aria-label="save">CONFIRM</a> -->
                <a class="settings-cancel button ripple-me" aria-label="cancel">CANCEL</a>
			</div>
			<div class="creator">${layer.options.creator}</div>
            <div class="unsaved" ${layer.editing.saved ? 'style="display: none"' : ''}>Save me!</div>`
        );

        let btn = $('<a class="settings icon button ripple-me" />'),
            box = '.settings-tools.buttons',
            btns = [{
                cls: 'copy',
                title: 'Copy these settings',
                action: function() {
                    layer.copy();
                }
            }, {
                cls: 'paste',
                title: 'Paste copied settings',
                action: function() {
                    self._paste();
                }
            }, {
                cls: 'copy-loc',
                title: 'Copy this layers position',
                action: function() {
                    layer.copyLocation();
                }
            }, {
                cls: 'paste-loc',
                title: 'Paste copied position',
                action: function() {
                    self._pasteLocation();
                }
            }, {
                cls: 'edit' + (layer.editing.edit ? ' end' : ''),
                title: 'Add this to editable layer',
                action: function() {
                    self._edit();
                }
            }, {
                cls: 'move' + (layer.dragging.enabled() ? ' end' : ''),
                title: 'Drag this layer',
                action: function() {
                    self._move();
                }
            }, {
                cls: 'join',
                title: 'Make another polygon a hole in this',
                type: ['polygon'],
                action: function() {
                    self._join();
                }
            }, {
                cls: 'split',
                title: 'Split these polygons',
                type: ['polygon'],
                action: function() {
                    self._split();
                }
            }, {
                cls: 'dupe',
                title: 'Duplicate this poly',
                type: ['polygon'],
                action: function() {
                    self._dupe();
                }
            }, {
                cls: 'delete',
                title: 'Delete this layer',
                action: function() {
                    self._delete();
                }
            }, {
                cls: 'to-type',
                title: 'Copy selected setting to all of Type',
                action: function() {
                    self._toType();
                }
            }];

        for (let i in btns) {
            const b = btns[i];
            if (b.cls && (!b.type || K.has(this.shape, b.type))) {
                btn.clone().attr({
                    'aria-label': b.cls,
                    title: b.title
                }).addClass(b.cls).appendTo(box).on('click', b.action);
            }
        }

        this.updateSaved();

        // Fill the menu with settings
        let shape = layer.options.shape;
        K.each(K.settings.main, function(i, n) {
            if (!K.has(shape, n.for)) return;
            $('<a />', {
                class: 'dnt settings-item button ripple-me ' + i,
                setting: i,
                html: i.firstToUpper().space()
            }).appendTo('.settings-tools.marker');
        });

        // Fill the popup menu with settings
        K.each(K.settings.popup, function(i) {
            $('<a />', {
                class: 'dnt settings-item button ripple-me ' + i,
                setting: i,
                popup: true,
                html: i.firstToUpper().space()
            }).appendTo('.settings-tools.popup');
        });

        // Apply the button click functions
        $('.settings-item').on('click', function() {
            self.element = $(this);
            self.setting = layer.editing.window = $(this).attr('setting');
            self.isPopup = $(this).attr('popup');
            self._settingClick();
        });
        $('.settings-cancel').on('click', function() {
            self._cancel();
        });
        $('.settings.paste').on('mouseover', function() {
            self._pasteOver(layer);
        }).on('mouseout', function() {
            self._pasteOut(layer);
        });
        if (K.in('_latlngs', layer) && layer._latlngs.length == 1)
            $('.settings.split').hide();
        else {
            $('.settings.split').on('click', function() {
                self._split();
            });
        }

        layer.editing.window && $(`.settings-item[setting="${layer.editing.window}"]`).trigger('click');

        $('.settings.icon[title!=""]').qtip({
            position: {
                viewport: $('#map-id'),
                my: 'bottom left',
                at: 'top center'
            },
            style: {
                classes: 'tooltip-style'
            },
            show: {
                event: 'mouseenter',
                delay: 250,
                solo: true
            },
            hide: {
                event: 'click mouseleave'
            }
        });

        // Disable the drag and scroll events on the settings menus
        let div = L.DomUtil.get('settings-menu');
        L.DomEvent.disableClickPropagation(div);
        L.DomEvent.on(div, 'mousewheel', L.DomEvent.stopPropagation);

        return this;
    },

    /* 
     * Left side setting click
     * Populate the right menu
     */
    // MARK: [K] Tool.Layer => SettingClick
    _settingClick: function() {

        let self = this,
            layer = this.layer,
            setting = this.setting,
            isPopup = this.isPopup,
            object = K.settings[isPopup ? 'popup' : 'main'],
            values = [],
            box, toggle, input, editor;

        if (!setting) return;

        layer.editing.window = setting;

        if (K.in('values', object[setting])) {
            // get and sort settings 
            values = sortObjByKeys(object[setting].values);
        }

        let value = layer.options[setting];
        isPopup && (value = layer.popup ? layer.popup[setting] : '');

        // Fill the right menu with the title and apply button
        $('.settings-side.right').html(
            `<div class="settings-tools right-bar" aria-label="${setting}">
			    <span class="settings-title">${isPopup ? 'POPUP ' : ''}${setting.space().toUpperCase()}</span>
            </div>`
        );

        if (!K.has(setting, ['id'])) {

            $('.right .settings-title').after(`<a class="settings icon copy inline ripple-me" title="Copy this setting" 
                setting="${setting}" which="${isPopup ? 'popup' : 'icon'}"></a>`);
            $('.right .settings-title').after(`<a class="settings icon paste inline ripple-me" title="Paste this setting" 
                setting="${setting}" which="${isPopup ? 'popup' : 'icon'}"></a>`);

            $('.settings.copy.inline').on('click', function() {
                self._copySingle();
            });
            $('.settings.paste.inline').on('click', function() {
                self._pasteSingle();
            });
        }

        let bx = $('.settings-tools.right-bar');
        bx.parent().removeClass('code');

        // add the mode switch
        if (K.length(layer.options.mode) > 1 && !K.has(setting, [
                'mode', 'id', 'category', 'type', 'time', 'link', 'group', 'prerequisites', 'onComplete'
            ])) {

            const mode = layer.getMode(isPopup);

            let changes = false;
            K.in(setting, mode) && (changes = true);
            changes && (value = layer.getModeSetting(setting, isPopup));

            const mC = $('<div />', {
                    class: 'mode-container edit'
                }),
                desc = $('<span />', {
                    class: 'name',
                    html: 'Modify for mode:'
                }),
                notes = [
                    'This will modify this setting for the original layer, no changes will be made to any modified modes.',
                    `This will modify this setting for ${K.mode} only, no changes will be made to the original layer.\nSwitching this with changes already made will delete any changes for ${K.mode}.`
                ],
                help = $('<span />', {
                    class: 'help',
                    html: notes[+changes]
                });

            toggle = $(`<label class="switch ripple-me">
                <span class="label"></span>
                <span class="back"></span>
                <input type="checkbox" class="settings-item mode-switch check">
                <span class="slider"></span>
            </label>`);

            bx.append(mC.append(desc).append(toggle).append(help));

            $('input', toggle).prop('checked', changes).on('change', function() {
                changes = $(this).is(':checked');
                help.text(notes[+changes]);

                if (!changes) {
                    K.in(setting, mode) && delete mode[setting];
                    self.modeSwitch = true;
                    self._settingClick();
                    apply();
                }

                setContentHeight();
            });
        }

        // add the description of the setting
        object[setting].description && bx.append(`<span class="help">${object[setting].description}</span>`);

        const setContentHeight = function() {
            const right = $('.settings-side .right-bar');
            let adjust, height = 0,
                max = 8;

            $('.settings-side.left .settings-tools:not(.buttons)').each(function() {
                max += $(this).outerHeight();
            });

            $('> div:not(.scroll-box):not(.CodeMirror-wrap):visible, > span, > input', right).each(function() {
                height += $(this).outerHeight();
            });

            if ((adjust = $('.scroll-box', right)).length) {
                adjust.css('max-height', (max - height) + 'px');

            } else if ((adjust = $('.CodeMirror-wrap', right)).length) {
                adjust.css('height', (max - height) + 'px')

            } else if ((adjust = $('textarea', right)).length) {
                adjust.css('height', (max - height) + 'px')
            }
        };

        // List population functions
        const resetList = function() {
            $('.right-bar .list-box').remove();

            $('.settings-tools.right-bar').append(
                `<div class="scroll-box list-box">
				    <div class="section title">
                        <span class="header">TITLE</span><br>
                        <input type="text" class="settings-item input list" name="list-title" role="input" setting="list-title" which="popup" placeholder="Title">
                    </div>
                    <div class="section subs">
                        <a class="add subs button ripple-me" title="Add another paragraph">+</a>
                        <span class="header">PARAGRAPH</span>
                        <br>
                    </div>
                    <div class="section list">
                        <a class="add list button ripple-me" title="Add another item">+</a>
                        <span class="header">LIST</span>
                        <br>
                    </div>
				</div>`
            );

            // reusable elements
            box = $('<div />', {
                class: 'setting-container clone',
                num: 0
            });

            input = $('<input />', {
                type: 'text',
                class: 'settings-item input list',
                which: 'popup'
            });

            toggle = $(`<label class="switch ripple-me">
                <span class="label"></span>
                <span class="back"></span>
                <input type="checkbox" class="settings-item input list check">
                <span class="slider"></span>
            </label>`);

            // create the list paragraph section
            let bx = box.clone().addClass('subs').appendTo('.section.subs'),
                tg;

            input.clone().attr({
                name: 'list-sub',
                num: 0,
                placeholder: 'Paragraph'
            }).appendTo(bx);

            $('<br>').appendTo(bx);

            // color button
            tg = toggle.clone().appendTo(bx);
            tg.find('input').attr({
                name: 'list-sub-class',
                cat: 'color',
                num: 0
            });
            tg.find('.label').text('Color:');

            // underline button
            tg = toggle.clone().appendTo(bx);
            tg.find('input').attr({
                name: 'list-sub-class',
                cat: 'line',
                num: 0
            });
            tg.find('.label').text('Line:');
            tg.find('.slider').addClass('note');

            // note button
            tg = toggle.clone().appendTo(bx);
            tg.find('input').attr({
                name: 'list-sub-class',
                cat: 'note',
                num: 0
            });
            tg.find('.label').text('Note:');
            tg.find('.slider').addClass('note');

            // create the list bullet section
            bx = box.clone().addClass('list').appendTo('.section.list');

            input.clone().attr({
                name: 'list-item',
                num: 0,
                placeholder: 'Item',
                autocomplete: true
            }).autocomplete({
                source: self.tags,
                autoFocus: true,
                appendTo: '#settings-menu'
            }).appendTo(bx);

            input.clone().attr({
                type: 'number',
                min: 1,
                name: 'list-qty',
                num: 0,
                placeholder: 'Qty'
            }).appendTo(bx);
        };

        const cloneList = function(identifier) {
            const clone = $(identifier).clone(),
                i = +clone.attr('num') + 1;
            clone.attr('num', i);

            $('input', clone).each(function() {
                $(this).attr('num', i);
                if ($(this).attr('type') == 'checkbox')
                    $(this).prop('checked', false);
                else
                    $(this).val('');

                $(this).attr('autocomplete') && $(this).autocomplete({
                    source: self.tags,
                    autoFocus: true,
                    appendTo: '#settings-menu'
                })
            });

            $(identifier).removeClass('clone').parent().append(clone);

            return clone;
        };

        const populateList = function(value) {
            if (!K.empty(value)) {
                value.title && $('[setting=list-title]').val(value.title);

                K.empty(value.subs) && (value.subs = []);
                K.each(value.subs, function(i, itm) {
                    const tag = '.subs.clone';
                    let clone = $(tag);
                    if (i) clone = cloneList(tag);

                    $('input[name=list-sub]', clone).val(itm.value);
                    $('input[cat=color]', clone).prop('checked', itm.color);
                    $('input[cat=note]', clone).prop('checked', itm.note);
                    $('input[cat=line]', clone).prop('checked', itm.line);
                });

                K.empty(value.list) && (value.list = []);
                K.each(value.list, function(i, itm) {
                    const tag = '.list.clone';
                    let clone = $(tag);
                    if (i) clone = cloneList(tag);

                    $('input[name=list-item]', clone).val(itm.item);
                    $('input[name=list-qty]', clone).val(itm.qty);
                });
            }
        };

        if (K.user.type > 3 && !K.in(setting, ['id'])) {

            $('.settings-tools.right-bar').append(
                `<div class="restore-container hide">
                    <div class="restore-back img ripple-me"></div>
                    <span class="restore-text">Current</span>
                    <div class="restore-forward img ripple-me"></div>
                </div>`
            );

            const rc = $('.restore-container'),
                rb = $('.restore-back', rc),
                rf = $('.restore-forward', rc),
                rt = $('.restore-text', rc);

            let num, items;

            $.ajax({
                type: 'POST',
                url: 'php/get_restore.php',
                data: {
                    id: layer.options.id,
                    setting: setting,
                    type: isPopup ? 'p' : 'o'
                }
            }).done(function(data) {
                items = $.parseJSON(data);

                K.each(items, function(key, val) {
                    K.equals(val, value) && delete items[key];
                });

                if (K.empty(items)) return;

                rc.removeClass('hide');
                rb.addClass('enabled');

                items.Current = value;

                num = K.length(items) - 1;

                setContentHeight();
            });

            rc.on('click', '.enabled', function() {

                const key = Object.keys(items)[$(this).hasClass('restore-back') ? --num : ++num],
                    item = items[key];

                if (num == 0) {
                    rb.removeClass('enabled');
                    rf.addClass('enabled');
                } else if (num == K.length(items)) {
                    rf.removeClass('enabled');
                    rb.addClass('enabled');
                } else {
                    rf.addClass('enabled');
                    rb.addClass('enabled');
                }

                rt.text(key);
                if (setting == 'list') {
                    resetList();
                    populateList(item);

                    inputRenew();
                    apply.call($('[name=list-title]'));

                } else if (setting == 'mode') {

                    layer.applySetting({ setting: 'mode', value: K.type(item) != 'object' ? {} : item });

                    $('.mode-container .input.mode').each(function() {
                        const mode = $(this).attr('mode');
                        $(this).prop('checked', K.has(mode, layer.options.mode));
                        const cont = $(this).parents('.mode-container');
                        cont.removeClass('changes');
                        !K.empty(layer.options.mode[mode]) && cont.addClass('changes');
                    });

                } else if (setting == 'link') {

                    $('.setting-container.links').each(function() {
                        if ($('input', this).attr('num') == 0)
                            $('input', this).val('');
                        else $(this).remove();
                    });

                    if (K.type(item) == 'array') {
                        K.each(item, function(i, v) {
                            if (i) $('.add.links').trigger('click');
                            $(`input[num=${i}]`).val(v);
                        });
                    }

                } else if (K.length(values)) {
                    $(`[aria-label="${item}"]`).trigger('click');

                } else {
                    apply.call($('textarea.input').text(item));
                    editor && editor.setValue(item);
                }
            });
        }

        if (setting === 'list') {

            resetList();

            if (K.type(value) != 'object') {
                layer.popup.list = {};
                value = {};
            }

            populateList(value);

            $('.settings-side.right').off('click', '.list-box a.add').on('click', '.list-box a.add', function() {
                let focus = false,
                    name = $(this).hasClass('subs') ? '.subs.clone' : '.list.clone';

                cloneList(name);

                $(` ${name.replace('.clone', '')} input[type=text]`).each(function() {
                    if (!$(this).val() && !focus) {
                        $(this).focus();
                        focus = true;
                    }
                });

                inputRenew();
            });

        } else if (K.in(setting, ['link', 'prerequisites', 'cycle'])) {

            $('.settings-tools.right-bar').append(
                `<div class="scroll-box">
                    <div class="section links">
                        <a class="add links button ripple-me" title="Add another paragraph">+</a>
                        <span class="header">IDS</span><br>
                    </div>
				</div>`
            );

            if (!value) value = [''];

            box = $('<div />', {
                class: 'setting-container links'
            });

            input = $('<input />', {
                name: 'list-link',
                type: 'text',
                class: 'settings-item input link',
                setting: setting,
                placeholder: 'Layer ID'
            });

            let grab = $('<a />', {
                class: 'settings-item link grab ripple-me'
            });

            let trash = $('<a />', {
                class: 'settings-item link trash ripple-me'
            });

            K.each(value, function(i, v) {
                let bx = box.clone().appendTo('.section.links');

                input.clone().attr({
                    value: v,
                    num: i
                }).appendTo(bx);

                // grab button
                grab.clone().attr({
                    num: i
                }).appendTo(bx);

                // trash button
                trash.clone().attr({
                    num: i
                }).appendTo(bx);
            });

            $('a.add').on('click', function() {
                let focus = false,
                    name = 'input[name="list-link"]',
                    i = $(name).length;

                let bx = box.clone().appendTo('.section.links');

                input.clone().attr({
                    num: i
                }).appendTo(bx);

                // grab button
                grab.clone().attr({
                    num: i
                }).appendTo(bx);

                // trash button
                trash.clone().attr({
                    num: i
                }).appendTo(bx);

                $(name).each(function(i, el) {
                    if (!$(el).val() && !focus) {
                        $(el).focus();
                        focus = true;
                    }
                });

                inputRenew();
            });

            $('.section.links').on('click', '.trash', function() {

                if ($('.section.links input').length == 1) {
                    $('.section.links input').val('');
                } else {
                    $(`.section.links [num=${$(this).attr('num')}]`).parent().remove();
                    $('.setting-container').each(function(i) {
                        $('[num]', this).attr('num', i);
                    });
                }

                apply.call(this);
            });

            $('.section.links').on('click', '.grab', function() {

                K.check.grabbing = true;
                let i = $(this).attr('num'),
                    layers = K.group.feature[K.mode].everyLayer,
                    _this = this;

                layers.eachLayer(function(l) {

                    // change the click to get the layers id
                    l.off('click');
                    l.on('click', function() {

                        $(`.section.links .input[num=${i}]`).val(this.options.id);
                        apply.call(_this);
                        K.check.grabbing = false;

                        layers.eachLayer(function(l) {
                            l.off('click');
                        });

                    });

                    K.msg.show({
                        msg: 'Select the layer you would like to link to this.',
                        time: 2000
                    });
                });
            });

        } else if (setting === 'mode') {

            const mC = $('<div />', {
                class: 'mode-container'
            });

            const desc = $('<span />', {
                class: 'name'
            });

            toggle = $(`<label class="switch ripple-me">
                <span class="label"></span>
                <span class="back"></span>
                <input type="checkbox" class="settings-item input mode check">
                <span class="slider"></span>
            </label>`);

            K.each(K.modes.get, function(i, mode) {
                const cont = mC.clone().appendTo(bx);
                desc.clone().text(mode).appendTo(cont);
                const tg = toggle.clone().appendTo(cont);
                $('input', tg).prop('checked', K.has(mode, layer.options.mode)).attr('mode', mode);
                K.has(mode, layer.options.mode) && !K.empty(layer.options.mode[mode]) && cont.addClass('changes');
            });

        } else if (K.length(values)) {
            // If presets exist, fill the menu with them

            if (setting === 'className' && !isPopup)
                value = K.stripClasses(value);

            // Append the input
            bx.append(`<input type="text" class="settings-item input ${setting}" name="${setting}" 
                role="input" value="${value ? value : ''}" setting="${setting}" which="${isPopup ? 'popup' : 'icon'}">`);

            let img, col, num = 1,
                retHtml = '<div class="scroll-box">',
                colors = [];

            K.each(values, function(i, z) {

                if (setting == 'type' && !K.has(K.settingShape(layer.options.shape), z.shape)) return;

                img = (K.type(i) == 'string' ? i.contains('.svg') : false);
                col = (K.type(i) == 'string' ? i.contains('#') : false);

                if (col) {
                    colors.push(i);
                    return true;
                }

                let fst = '<div class="settings-icons">',
                    lst = '</div>',
                    trd = lst + fst;

                retHtml += `${img && num == 1 ? fst : ''}
                    <a class="settings-item button ripple-me selector${col ? ' color' : (img ? ' icon' : '')}" aria-label="${i}" role="button"
                        ${value == i ? ` style="background-color: #2f474e; ${(col ? ` color: ${i};` : '')}"` : (col ? ` style="color: ${i};"` : '')}>
                        ${img ? `<img src="${i}" height="30" width="30">` : i} 
                    </a>
                    ${img && num == values.length ? lst : (img && num % 3 == 0 ? trd : '')}`;
                num++;
            });

            retHtml = $(retHtml + '</div>');
            if (img) retHtml.addClass('has-icons');

            bx.append(retHtml);

            $.unique(colors);
            colors.sort();

            col && new Huebee($('.settings-item.input')[0], {
                notation: 'hex',
                hues: 16,
                shades: 8,
                saturations: 5,
                customColors: colors,
                staticOpen: true
            }).on('change', function() {
                $('.settings-item.input').trigger('change');
            });

        } else {
            bx.append(`<textarea type="text" rows=2 cols=20 wrap="hard" class="settings-item input ${setting}" name="${setting}" setting="${setting}" which="${isPopup ? 'popup' : 'icon'}"${setting == 'id' ? ' readonly' : ''}>${value ? value : ''}</textarea>`);

            if (K.in(setting, ['html', 'content'])) {
                bx.parent().addClass('code');

                editor = CodeMirror.fromTextArea($(`textarea.${setting}`)[0], {
                    lineNumbers: true,
                    mode: 'htmlmixed',
                    indentUnit: 4,
                    theme: 'one-dark',
                    indentWithTabs: true,
                    showCursorWhenSelecting: true,
                    autoCloseBrackets: true,
                    autoCloseTags: true,
                    lineWrapping: true
                });

                editor.on('change', function() {
                    $('textarea.input').text(editor.getValue()).trigger('input');
                })
            }
        }

        const apply = function() {

            const $input = $('.settings-item.input'),
                $mode = $('.mode-switch'),
                o = {
                    setting: $input.attr('setting'),
                    value: $input.val(),
                    forMode: $mode.length && $mode.is(':checked')
                };

            if ($(this).hasClass('list')) {

                o.setting = 'list';
                o.value = {};

                o.value.title = $('.input[name="list-title"]').val();
                o.value.subs = [];

                $('.input[name="list-sub"]').each(function() {

                    let t = $(this).val();
                    if (!t) return true;
                    let p = $(this).parent(),
                        c = p.find('[cat=color]').is(':checked'),
                        l = p.find('[cat=line]').is(':checked'),
                        n = p.find('[cat=note]').is(':checked');

                    let r = { value: t };
                    c && (r.color = c);
                    l && (r.line = l);
                    n && (r.note = n);

                    o.value.subs.push(r);
                });

                o.value.list = [];

                $('.input[name="list-item"]').each(function() {

                    let no = $(this).attr('num'),
                        t = $(this).val();

                    if (!t) return true

                    o.value.list.push({
                        item: t,
                        qty: $(`.input[name="list-qty"][num="${no}"]`).val() || 1
                    });
                });

                removeEmpty(o.value);

            } else if ($(this).hasClass('link')) {

                // o.setting = 'link';
                o.value = [];

                $('[name=list-link]').each(function() {
                    let v = $(this).val();
                    if (v) o.value.push(v);
                });

                removeEmpty(o.value);

            } else if ($(this).hasClass('mode')) {

                o.setting = 'mode';
                o.value = layer.backup.options.mode || layer.options.mode || {};

                $('input', bx).each(function() {
                    const mode = $(this).attr('mode');
                    if (!$(this).is(':checked')) delete o.value[mode];
                    else if (!(mode in o.value)) o.value[mode] = {};
                });

            } else if (o.setting == 'className' && !isPopup) {

                let color = K.in('popup', layer) && K.in('className', layer.popup) ? layer.popup.className : '';
                o.value += ` ${layer.options.group} ${color}`;
            }

            isPopup && layer.updatePopup(o);
            !isPopup && layer.applySetting(o);
        };

        // Menu buttons event
        $('.settings-item.selector').on('click', function() {

            let $input = $('.settings-item.input');

            if ($(this).hasClass('color')) {

                let hex = $(this).attr('aria-label');
                $input.css({
                    'background-color': hex,
                    color: textColor(hex)
                });
            }

            $('.settings-side.right a:not(.settings-apply)').css('background-color', '#24373d');
            $(this).css('background-color', '#2f474e');

            $input.val($(this).attr('aria-label'));
            apply.call(this);
        });

        const inputRenew = function() {
            // Apply button event
            $('.input').each(function() {
                if (!!$(this).prop('readonly')) return;

                let el = $(this),
                    binds = {
                        text: 'propertychange change focus input paste',
                        number: 'propertychange change focus input paste',
                        checkbox: 'change',
                    },
                    type = $(this).attr('type');

                el.data('oldVal', el.val());

                el.unbind(binds[type]);
                el.bind(binds[type], function() {

                    let check = $(this).hasClass('check');

                    if (!check && el.data('oldVal') == el.val()) return;

                    !check && el.data('oldVal', el.val());

                    let title = $('input[name="list-title"]');
                    title.removeClass('incorrect');
                    if (!title.val())
                        title.addClass('incorrect');

                    if (check) {
                        let input = $(this).parent('label').prev('input');
                        input.removeClass('gray');
                        if ($(this).is(':checked')) input.addClass('gray');
                    }

                    apply.call(this);
                });
            });
        }

        inputRenew();
        setContentHeight();

        $('.inline.icon[title!=""]').qtip({
            position: {
                viewport: $('#map-id'),
                my: 'right center',
                at: 'left center'
            },
            style: {
                classes: 'tooltip-style'
            },
            show: {
                event: 'mouseenter',
                delay: 250,
                solo: true
            },
            hide: {
                event: 'click mouseleave'
            }
        });

        this.modeSwitch && apply();
        this.modeSwitch = false;
        return this;
    },

    // Confirm the settings that you have changed
    _cancel: function() {

        this._hide();
        let layer = this.layer,
            o = layer.options,
            b = layer.backup;

        K.extend(true, o, b.options);

        if (b.popup) {
            layer.unbindPopup();
            layer.bindPopup(b.popup);
        }

        // Restore old settings
        if (o.shape == 'marker') {

            layer.setLatLng(b.pos.latlng);
            layer.updateIcon();

            // Create a polyline with the new settings
        } else if (K.has(o.shape, ['polyline', 'polygon'])) {

            layer.setLatLngs(b.pos.latlngs);
            layer.setStyle(o);

        } else if (o.shape == 'circle') {

            layer.setLatLng(b.pos.latlng);
            layer.setRadius(b.pos.radius);
        }

        K.complete.is(layer) && K.complete.add(layer);

        layer.storeSettings();
        layer.saved(true);
    },

    _copySingle: function() {

        const copy = K.local('copySingle') || {},
            layer = this.layer,
            isPopup = this.isPopup,
            setting = this.setting,
            value = layer[isPopup ? 'popup' : 'options'][setting];

        if (K.empty(value)) {
            K.msg.show({
                msg: 'Copy failed!',
                time: 2000
            });
            return this;
        }

        const t = isPopup ? 'p' : 'o';
        if (!K.in(t, copy)) copy[t] = {};
        copy[t][setting] = value;

        K.local('copySingle', copy);

        K.msg.show({
            msg: 'Setting copied!',
            time: 2000
        });

        return this;
    },

    // Paste copied settings 
    _paste: function() {

        let layer = this.layer,
            copy = K.local('copy') || {},
            options = copy[K.settingShape(layer.options.shape)] || false;

        if (!options) {
            K.msg.show({
                msg: 'You need to copy something first!',
                time: 2000
            });
            return;
        }

        K.each(options.o, function(setting, value) {
            layer.applySetting({ setting: setting, value: value });
        });

        K.each(options.p, function(setting, value) {
            layer.updatePopup({ setting: setting, value: value });
        });

        K.msg.show({
            msg: 'Settings pasted!',
            time: 2000
        });

        this._settingClick();
    },

    // Paste copied location 
    _pasteLocation: function() {

        let layer = this.layer,
            copy = K.local('location') || {},
            pos = copy[layer.options.shape] || false;

        if (!pos) {
            K.msg.show({
                msg: 'You need to copy a position first!',
                time: 2000
            });
            return;
        }

        layer.setLatLng && layer.setLatLng(pos);
        layer.setLatLngs && layer.setLatLngs(pos);

        K.msg.show({
            msg: 'Position pasted!',
            time: 2000
        });
    },

    _pasteSingle: function() {
        const copy = K.local('copySingle') || {},
            layer = this.layer,
            isPopup = this.isPopup,
            ms = $('.mode-switch'),
            t = isPopup ? 'p' : 'o',
            o = {
                setting: this.setting,
                forMode: ms.length ? ms.is(':checked') : false,
            };

        if ((!K.in(t, copy)) || !K.in(this.setting, copy[t])) {

            K.msg.show({
                msg: 'There is no copied setting!',
                time: 2000
            });
            return;
        }

        o.value = copy[t][this.setting];
        isPopup && layer.updatePopup(o);
        !isPopup && layer.applySetting(o);

        this._settingClick();
    },

    _pasteOver: function() {
        let c, layer = this.layer,
            s = K.settingShape(layer.options.shape);
        if (layer.options.shape == 'marker') return;
        layer.makeBackup()
            .setStyle(K.extend(layer.options, c = K.local('copy') && K.in(s, c) ? c[s] || {} : {}));
    },

    _pasteOut: function() {
        const layer = this.layer;
        if (layer.options.shape == 'marker') return;
        layer.setStyle(K.extend(layer.options, layer.paste.options));
    },

    // Delete the layer
    _delete: function() {

        let _this = this;
        this._hide();

        $('<div />', {
            class: 'screen-blank',
            html: $('<div />', {
                class: 'confirm',
                html: $('<div />', {
                    class: 'message',
                    html: 'Are you sure you want to delete this layer?'
                })
            })
        }).appendTo('body');

        $('<a />', {
                class: 'button no ripple-me',
                title: 'Cancel',
                html: 'Cancel'
            }).appendTo('.confirm')
            .on('click', function() {
                $('.screen-blank').remove();
            });

        $('<a />', {
                class: 'button yes ripple-me',
                title: 'Delete',
                html: 'Delete'
            }).appendTo('.confirm')
            .on('click', function() {
                _this._trueDelete.call(_this);
                $('.screen-blank').remove();
            });

    },

    _trueDelete: function() {
        this.layer.delete();
    },

    // MARK: [K] Tool.Layer => ToType
    _toType: function() {

        const layer = this.layer,
            isPopup = this.isPopup,
            setting = this.setting;

        if (!(setting && layer.options.type && setting != 'type')) return;

        const $mode = $('.mode-switch'),
            o = {
                setting: setting,
                value: K.getSetting(layer[isPopup ? 'popup' : 'options'], setting),
                forMode: $mode.length && $mode.is(':checked')
            };

        // update the global settings for this change
        const g = K.layer[layer.options.type],
            t = isPopup ? 'p' : 'o';
        g.changed = true;
        !K.in(t, g) && (g[t] = {});
        if (o.forMode) {
            !K.in('mode', g[t]) && (g[t].mode = {
                [K.mode]: {}
            });
            !K.in(t, g[t].mode[K.mode]) && (g[t].mode[K.mode][t] = {});
            g[t].mode[K.mode][t][setting] = o.value;
        } else g[t][setting] = o.value;

        K.each(K.group.mode, function(i, g) {
            K.each(g._layers, function(i, l) {
                if (l.options.type != layer.options.type) return;
                if (isPopup) l.updatePopup(o);
                else l.applySetting(o);
            });
        });

        K.msg.show({
            msg: 'Setting copied to all ' + layer.options.type.space(),
            time: 2000
        });
    },

    // Duplicate a polygon or polyline
    _dupe: function() {

        this._hide();
        let layer = this.layer;

        let set = K.extend({}, layer.options, {
            id: ID()
        });

        let ll = layer._latlngs,
            pType = polyType(ll);

        if (layer.shape == 'circle') {

            ll = layer._latlng;
            ll.lng -= 0.000001;
            ll.lng -= 0.000001;

        } else if (K.has(pType, ['polygon', 'polyline'])) {

            if (pType == 'polygon') ll = ll[0];
            ll.splice(1, 0, L.latLng(((ll[0].lat + ll[1].lat) / 2), ((ll[0].lng + ll[1].lng) / 2)));

        } else {

            ll[0][0].lng -= 0.000001;
            ll[0][1].lng -= 0.000001;
        }

        this.new = layer.shape == 'circle' ? L.circle(layer._latlng, K.extend(set, {
            radius: layer._mRadius
        })) : L[pType](layer._latlngs, set);

        K.group.addLayer(this.new);
        this.new.on('click', this.show);

        this.new.saved(false);

        // createGeoJSON();

        switchLayerGroups();
        polyHoverAnimation();

        K.msg.show({
            msg: 'Duplicated',
            time: 2000
        });
    },

    // Join polygons together
    _join: function() {

        let layer = this.layer;

        this.join = layer;
        layer.off('click').bringToBack();

        this._hide();
        K.msg.show({
            msg: 'Select the shape to join!',
            time: 3000
        });
    },

    // Toggle dragging of this layer
    _move: function() {

        let fn = K.tool.layer,
            layer = fn.layer;

        if (layer.dragging.enabled()) {
            layer.dragging.disable();
            $('.settings.icon.move').removeClass('end');
        } else {
            layer.dragging.enable();
            $('.settings.icon.move').addClass('end');
            layer.on('dragend', function() {
                this.saved(false);
            });
        }
    },

    // Add the layer to the draw group for editing
    _edit: function() {

        let fn = K.tool.layer,
            layer = fn.layer;

        layer.editing.edit = !layer.editing.edit;
        $('.settings.icon.edit').toggleClass('end');
        switchLayerGroups();
    },

    // Split the joined polygons
    _split: function() {

        this._hide();
        let layer = this.layer,
            newLayer,
            show = this.show;

        K.each(layer._latlngs, function(i, m) {
            const sets = K.extend({}, layer.options, {
                id: ID()
            });

            newLayer = L[polyType([m])]([m], sets);

            K.group.addLayer(newLayer);
            newLayer.on('click', show);

            newLayer.saved(false);
        });

        K.group.removeLayer(layer);

        // Save all the hard work

        switchLayerGroups();
        polyHoverAnimation();
    },

    // Hide the menu
    _hide: function() {
        $('#settings-menu').remove();
    },

    // Refreshes the mark after a commit
    _refresh: function() {
        K.tool.layer._hide();
        K.tool.layer._show.call(K.tool.layer, K.tool.layer.layer);
    },

    updateSaved: function() {

        // Color the save button to remind you it needs pressing
        if (!this.layer.editing.saved || (this.layer.backup && this.layer.backup.changes)) {
            $('.settings-save').css('background-color', '#735711');
            $('.unsaved').show();

        } else {
            $('.settings-save').css('background-color', '#24373d');
            $('.unsaved').hide();
        }
    }
};

// MARK: [L] Layer (Tools)
L.Layer.include({
    tools: K.tool.layer,
    backup: false,

    // Backup the original settings
    makeBackup: function() {

        let t = !this.backup ? 'backup' : 'paste';

        this.oldType = this.options.type;

        this[t] = {};
        this[t].options = K.reduce({}, this.options, K.map.property[this.options.shape]);

        if (this.popup)
            this[t].popup = K.extend({}, this.popup);

        if (t == 'backup') {

            if (K.has(this.options.shape, ['polygon', 'polyline'])) {
                this.backup.pos = {
                    latlngs: L.LatLngUtil.cloneLatLngs(this.getLatLngs())
                };

            } else if (this.options.shape == 'marker') {

                this.backup.pos = {
                    latlng: L.LatLngUtil.cloneLatLng(this.getLatLng())
                };

            } else if (this.options.shape == 'circle') {

                this.backup.pos = {
                    latlng: L.LatLngUtil.cloneLatLng(this.getLatLng()),
                    radius: this._mRadius
                };
            }
        }

        return this;
    },

    // MARK: [L] Layer => ApplySetting
    // Apply the settings that you are changing
    applySetting: function(options) {

        const o = K.extend({
                setting: undefined, // this has to be a valid setting for the layer
                value: undefined, // this is the value that is going to change
                skipSave: false, // this is used when applying a setting but not to be saved 
                forMode: false // this is used to apply the setting into the mode setting
            }, options),
            group = this.options.group;

        if (o.setting == 'group' && !K.in(o.value, K.map.group)) return this;

        !this.backup && !o.skipSave && this.makeBackup();

        // set oldType to check for changes and update objects
        o.setting == 'type' && (this.oldType = this.options.type);

        let m = o.forMode ? this.getMode() : false;
        const mSp = this.getModeSettingPath(o.setting);
        !o.forMode && mSp !== null && delete mSp[o.setting];

        // Add the settings to the correct locations
        if (this.options.shape == 'marker' && K.has(o.setting, ['className', 'iconUrl', 'iconSize', 'html'])) {

            let p = this.options;

            o.value = K.type(o.value) == 'string' && o.value.bMatch(/\d+,\d+/) ? o.value.split(',') : o.value;
            !m && (p[o.setting] = o.value);
            m && (m[o.setting] = o.value);

            this.updateIcon();
            K.complete.is(this) && K.complete.add(this);

        } else if (m) m[o.setting] = o.value
        else this.options[o.setting] = o.value;

        o.setting == 'group' && switchLayerGroup(this, group);

        // Apply the settings to the original layer (not marker)
        this.options.shape != 'marker' && this.setStyle(this.options);
        // this.options.shape == 'marker' && this.setOpacity(this.options.opacity);

        // add the settings to global if they don't already exist
        const type = this.options.type;
        // adjust the counts for the new and old types
        // also being aware that the new or old type may be blank
        if (type != this.oldType) {
            K.map.type.add(type);
            K.map.type.remove(this.oldType);
        }

        // if we are changing the type, we need to apply all of the 
        // other settings to match it, if it exists already
        if (type != this.oldType && K.in(type, K.layer)) {
            this.oldType = type;
            const _this = this;
            K.each(K.curtail({}, K.layer[type].o, ['type', 'shape']), function(key, val) {

                _this.applySetting({
                    setting: key,
                    value: val,
                    forMode: o.forMode
                });
            });

            K.layer[type].p && K.each(K.layer[type].p, function(key, val) {
                _this.updatePopup({
                    setting: key,
                    value: val,
                    forMode: o.forMode
                });
            });

            if (!K.layer[type].p) {
                this.unbindPopup();
                this.popup = undefined;
            }
        }

        if (K.empty(this.options.mode)) this.options.mode = {
            [K.mode]: {}
        };

        this.storeSettings();
        !o.skipSave && this.saved(false);

        return this;
    },

    // returns the mode object creating it if it does not exist
    getMode: function(isPopup) {
        const m = this.options.mode[K.mode],
            t = isPopup ? 'p' : 'o';
        !K.in(t, m) && (m[t] = {});

        return m[t];
    },

    // returns the setting from the mode object if it exists
    getModeSetting: function(setting, isPopup, mode = K.mode) {
        // if (!this.options.mode) return null;

        if (!this.options.mode) return null;

        const m = this.options.mode[mode],
            t = isPopup ? 'p' : 'o';

        if (K.in(t, m) && K.in(setting, m[t]))
            return m[t][setting];

        return null;
    },

    // returns the path to the mode setting
    getModeSettingPath: function(setting, isPopup) {
        const m = this.options.mode[K.mode],
            t = isPopup ? 'p' : 'o';

        if (K.in(t, m) && K.in(setting, m[t]))
            return m[t];

        return null;
    },

    getSetting: function(setting, isPopup) {
        const o = (isPopup ? this.popup : this.options) || {};
        let modeValue = this.getModeSetting(setting, isPopup);

        if (setting != 'complete' && this.complete && this.options.onComplete == 'toStoryMode')
            modeValue = this.getModeSetting(setting, isPopup, 'Story Mode');

        if (modeValue !== null) return modeValue;
        // console.log(setting, '=', o[setting]);
        return o[setting];
    },

    // MARK: [L] Layer => UpdatePopup
    updatePopup: function(options) {

        const o = K.extend({
            setting: undefined, // this has to be a valid setting for the layer
            value: undefined, // this is the value that is going to change
            forMode: false // this is used to apply the setting into the mode setting
        }, options);

        if (!this.backup) this.makeBackup();

        const mSp = this.getModeSettingPath(o.setting, true);
        !o.forMode && mSp !== null && delete mSp[o.setting];
        !this.popup && (this.popup = {});
        !o.forMode && (this.popup[o.setting] = o.value);
        o.forMode && (this.getMode(true)[o.setting] = o.value);

        this.unbindPopup();
        this.hasPopupContent() && this.bindPopup(this.popup);

        this.storeSettings();
        this.saved(false);

        return this;
    },

    hasPopupContent: function() {
        if (!this.popup) return false;
        return this.getSetting('content', true) || !K.empty(this.getSetting('list', true));
    },

    storeSettings: function() {
        const counts = K.map.type.counts,
            type = this.options.type;

        if (counts[type] == 1) {
            !(type in K.layer) && (K.layer[type] = {});

            const m = K.layer[type],
                o = this.options;

            if (o.shape == 'marker') {
                // K.extend(o, o.icon.options);
                o.iconUrl && delete o.html;
                !o.iconUrl && delete o.iconUrl;
            }

            m.o = K.reduce({}, o, K.map.property[this.options.shape]);
            K.in('link', m.o) && delete m.o.link;
            m.changed = true;

            if (this.popup) {
                const p = this.popup;
                m.p = { className: p.className };
                !K.empty(p.list) && (m.p.list = p.list);
                !m.p.list && (m.p.content = p.content);
            }

            if (counts[this.oldType] == 0) {
                delete K.layer[this.oldType];
                delete K.map.type.counts[this.oldType];
            }
        }

        return this;
    },

    saved: function(saved) {
        let tool = K.tool.layer;
        this.editing.saved = saved;
        !this.backup && this.makeBackup();
        this.backup.changes = !saved;

        if (!saved) K.save.add(this);
        else {
            K.save.remove(this);
            delete this.backup;
        }

        if (tool.isOpen()) tool.updateSaved();

        return this;
    },

    delete: function() {
        K.map.type.remove(this.options.type);
        K.save.delete(this);
    },

    // Copy settings 
    copy: function() {

        let copy = K.local('copy') || {};

        copy[K.settingShape(this.options.shape)] = {
            o: K.reduce({}, this.options, K.map.property[this.options.shape]),
            p: this.popup ? this.popup : false
        };

        K.local('copy', copy);

        K.msg.show({
            msg: 'Settings copied!',
            time: 2000
        });

        // K.updateMarker();

        return this;
    },

    // Copy location 
    copyLocation: function() {

        let copy = K.local('location') || {};

        copy[this.options.shape] = this._latlng || this._latlngs;

        K.local('location', copy);

        K.msg.show({
            msg: 'Position copied!',
            time: 2000
        });

        // K.updateMarker();

        return this;
    },

});