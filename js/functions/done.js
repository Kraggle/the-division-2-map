import { jQuery as $ } from '../jQuery/jquery3.4.1.js';
import { K } from '../K.js';

K.done = {
    showing: false,
    elements: null,

    start: function() {
        this.elements = $('#map-done .style-complete');
        this.elements.fadeOut(800);

        const todo = $('#map-todo .style-complete').length,
            done = this.elements.length,
            total = todo + done,
            percent = (done / total) * 100;

        $('<div />', {
            class: 'map-completion',
            title: 'The total completion of the map.<br><span style="color:#808080; font-size:9px;">Click to toggle the completed areas.</span>'
        }).append($('<div />', {
            class: 'percent',
            text: `${Math.round(percent)}%`
        }).css('width', percent + '%')).append($('<div />', {
            class: 'total',
            text: `[${done}/${todo}]`
        })).appendTo('body').on('click', () => {
            this.showing && this.elements.fadeOut(800);
            !this.showing && this.elements.fadeIn(800);
            this.showing = !this.showing;
        });
    }
};