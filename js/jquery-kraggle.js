import { jQuery as $ } from './jQuery/jquery3.4.1.js';

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

// Match by regex
$.expr[':'].regex = function(elem, index, match) {
    var matchParams = match[3].split(','),
        validLabels = /^(data|css):/,
        attr = {
            method: matchParams[0].match(validLabels) ?
                matchParams[0].split(':')[0] : 'attr',
            property: matchParams.shift().replace(validLabels, '')
        },
        regexFlags = 'ig',
        regex = new RegExp(matchParams.join('').replace(/^\s+|\s+$/g, ''), regexFlags);
    return regex.test($(elem)[attr.method](attr.property));
}

$.extend({
    replaceTag: function(currentElem, newTagObj, keepProps) {
        var $currentElem = $(currentElem);
        var i, $newTag = $(newTagObj).clone();
        if (keepProps) { //{{{
            newTag = $newTag[0];
            newTag.className = currentElem.className;
            $.extend(newTag.classList, currentElem.classList);
            $.extend(newTag.attributes, currentElem.attributes);
        } //}}}
        $currentElem.wrapAll($newTag);
        $currentElem.contents().unwrap();
        // return node; (Error spotted by Frank van Luijn)
        return this; // Suggested by ColeLawrence
    }
});

$.fn.extend({
    replaceTag: function(newTagObj, keepProps) {
        // "return" suggested by ColeLawrence
        return this.each(function() {
            $.replaceTag(this, newTagObj, keepProps);
        });
    }
});