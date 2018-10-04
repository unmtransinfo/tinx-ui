import '../styles/index.scss';
import $ from 'jquery';
window.jQuery = $;
import 'bootstrap';
import 'bootstrap-3-typeahead';
import Typeaheads from "./typeaheads";
import TreeView from "./treeview";

$(document).ready(() => {
  Typeaheads.init();
  TreeView.init();
});
