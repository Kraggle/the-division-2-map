// Replaces only the text content of an element ignoring
// all children, tags and properties
$.fn.replace = function(text, replace) {

    $(this).contents().each(function() {
        if (this.nodeType == 3)
            $(this).replaceWith($(this).text().replace(text, replace));
    });
};

// Iterates through elements replacing all text content 
$.fn.replaceAll = function(text, replace) {
    $(this).contents().each(function() {
        if (this.nodeType == 3)
            $(this).replaceWith($(this).text().replace(text, replace));
        else $(this).replaceAll(text, replace);
    });
};

$.fn.selectRange = function(start, end) {
    return this.each(function() {
        if (this.setSelectionRange) {
            this.focus();
            this.setSelectionRange(start, end);
        } else if (this.createTextRange) {
            var range = this.createTextRange();
            range.collapse(true);
            range.moveEnd('character', end);
            range.moveStart('character', start);
            range.select();
        }
    });
};

$.fn.setCursorPosition = function(pos) {
    this.each(function(i, elem) {
        if (elem.setSelectionRange) {
            elem.setSelectionRange(pos, pos);
        } else if (elem.createTextRange) {
            var range = elem.createTextRange();
            range.collapse(true);
            range.moveEnd('character', pos);
            range.moveStart('character', pos);
            range.select();
        }
    });
    return this;
};