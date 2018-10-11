import '../styles/index.scss';
import $ from 'jquery';
window.jQuery = $;
import 'bootstrap';
import 'bootstrap-3-typeahead';
import Typeaheads from "./typeaheads";
import { TreeView, TreeViewModes } from "./treeview";
import Scatterplot from './scatterplot';

$(window).on("load", () => {
  const scatterplot = new Scatterplot('#plot-container');

  const treeView = new TreeView('#tree-view', TreeViewModes.DISEASE);
  treeView.init();

  Typeaheads.init(treeView);

  treeView.onSelectionChange((data) => {
    scatterplot.loadPlot(data.mode, data.nodeId);
  });

  // Prevent FOUC issue
  // TODO: Maybe present a spinner instead?
  $('body').css({visibility: 'inherit'});
});

