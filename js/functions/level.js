import { jQuery as $ } from '../jQuery/jquery3.4.1.js';
import { K } from '../K.js';

K.level = {
    MAP: null,
    CONTROL: null,

    _click: function() {
        if ($(this).hasClass('active')) return;

        const data = $(this).data(),
            j = $(this).attr('floor');

        $.each(data.floors, function(i, el) {
            i == j ? $(el).fadeIn(400) : $(el).fadeOut(400);
        });

        $.each(data.buttons, function(i, el) {
            i == j ? $(el).addClass('active') : $(el).removeClass('active');
        });
    },

    build: function() {
        !this.MAP && (this.MAP = $('#svg-map'));
        !this.CONTROL && (this.CONTROL = $('#control-map'));

        $('g:regex(id,^l-\\d+$)', this.MAP).each(function() {

            const group = {
                floors: {},
                buttons: {}
            };

            // floors
            $(':regex(id,^l-\\d+-\\d+$)', this).each(function() {

                const floor = this.id.match(/\d+$/)[0];
                if (floor != 1) $(this).hide();

                group.floors[floor] = this;
            });

            // buttons
            $(':regex(id,^b-\\d+-\\d+$)', this).each(function() {
                $(this).addClass('level-button');
                K.level.CONTROL.append($(this).detach());
                $(this).on('click', K.level._click);

                const level = this.id.match(/\d+$/)[0];
                if (level == 1) $(this).addClass('active');

                group.buttons[level] = this;
                $(this).data(group);
                $(this).attr('floor', level);

                $('path', this).each(function() {
                    $(this).css('fill') == 'rgb(34, 89, 26)' && $(this).addClass('hover-path');
                });
            });
        });
    }
};