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

    if (data.mode === TreeViewModes.DISEASE) {
      $('#plot-title span').text('Targets associated with ');
      $('#plot-title a').text(data.details.name)
        .attr('href',
              `http://disease-ontology.org/term/${encodeURIComponent(data.details.doid)}`);
    }
  });

  // Prevent FOUC issue
  // TODO: Maybe present a spinner instead?
  $('body').css({visibility: 'inherit'});
});

