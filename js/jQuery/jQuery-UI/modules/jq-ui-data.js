import { jQuery as $ } from '../../jquery3.4.1.js';

/*!
 * jQuery UI :data 1.12.1
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */

//>>label: :data Selector
//>>group: Core
//>>description: Selects elements which have data stored under the specified key.
//>>docs: http://api.jqueryui.com/data-selector/


$.extend($.expr[":"], {
    data: $.expr.createPseudo ?
        $.expr.createPseudo(function(dataName) {
            return function(elem) {
                return !!$.data(elem, dataName);
            };
        }) :

        // Support: jQuery <1.8
        function(elem, i, match) {
            return !!$.data(elem, match[3]);
        }
});