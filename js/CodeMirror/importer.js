import { CodeMirror } from './lib/codemirror.js';
import './mode/htmlmixed/htmlmixed.js';
import './mode/javascript/javascript.js';
import './mode/css/css.js';
import './mode/xml/xml.js';
import './addon/edit/closebrackets.js';
import './addon/fold/xml-fold.js';
import './addon/edit/closetag.js';
import './addon/comment/comment.js';
import { K } from '../K.js';

K.loadStyles([
    './js/CodeMirror/lib/codemirror.css',
    './js/CodeMirror/theme/onedarkpro.css'
]);

export { CodeMirror };