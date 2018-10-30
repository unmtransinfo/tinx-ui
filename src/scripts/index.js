import '../styles/index.scss';
import $ from 'jquery';
window.jQuery = $;
import 'bootstrap';
import 'bootstrap-3-typeahead';
import Typeaheads from "./typeaheads";
import { TreeView, TreeViewModes } from "./treeview";
import { Scatterplot } from './scatterplot';
import DetailModal from './detailmodal';

$(window).on("load", () => {
  const scatterplot = new Scatterplot('#plot-container');

  const treeView = new TreeView('#tree-view', TreeViewModes.DISEASE);
  treeView.init();

  const detailmodal = new DetailModal('#detail-modal');

  Typeaheads.init(treeView);

  treeView.onSelectionChange((data) => {
    scatterplot.loadPlot(data.mode, data.nodeId, data.details);

    if (data.mode === TreeViewModes.DISEASE) {
      $('#plot-title span.title').text('Targets associated with ');
      $('#plot-title a').text(data.details.name)
        .attr('href',
          `http://disease-ontology.org/term/${encodeURIComponent(data.details.doid)}`);
    }
  });

  scatterplot.onPointClick((d, subjectDetails) => {
    // Immediately hide any tooltips that are open
    $('#scatterplot-tooltip,#general-tooltip').css('opacity', '0');


    if ("target" in d) {
      detailmodal.show(d.target, subjectDetails);
    }
  });

  // Prevent FOUC issue
  // TODO: Maybe present a spinner instead?
  $('body').css({visibility: 'inherit'});
});

