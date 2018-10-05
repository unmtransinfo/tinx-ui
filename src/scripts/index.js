import '../styles/index.scss';
import $ from 'jquery';
window.jQuery = $;
import 'bootstrap';
import 'bootstrap-3-typeahead';
import Typeaheads from "./typeaheads";
import { TreeView, TreeViewModes } from "./treeview";

$(document).ready(() => {
  const treeView = new TreeView('#tree-view', TreeViewModes.DISEASE);
  treeView.init();

  Typeaheads.init(treeView);

  // Prevent FOUC issue
  // TODO: Maybe present a spinner instead?
  $('body').css({display: 'inherit'});
});
