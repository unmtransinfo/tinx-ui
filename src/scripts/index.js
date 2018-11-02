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

  // User selects something from the treeview
  treeView.onSelectionChange((data) => {
    const defaultThreshold = 300;
    $('#threshold-slider').attr('max', 2000).val(defaultThreshold).attr('disabled', false);
    scatterplot.loadPlot(data.mode, data.nodeId, data.details, defaultThreshold);

    if (data.mode === TreeViewModes.DISEASE) {
      $('#plot-title span.title').text('Targets associated with ');
      $('#plot-title a').text(data.details.name)
        .attr('href',
          `http://disease-ontology.org/term/${encodeURIComponent(data.details.doid)}`);
    }
  });

  // User clicks a datapoint
  scatterplot.onPointClick((d, subjectDetails) => {
    // Immediately hide any tooltips that are open
    $('#scatterplot-tooltip,#general-tooltip').css('opacity', '0');

    if ("target" in d) {
      detailmodal.show(d.target, subjectDetails);
    }
  });

  // The plot finishes loading
  scatterplot.onPlotLoaded((datapoints, totalCount) =>
    $('#threshold-slider').attr('max', totalCount < 2000 ? totalCount : 2000)
  );

  // User changes the threshold slider
  $('#threshold-slider').change(function() {
    scatterplot.changeThreshold($(this).val());
  });

  // Prevent FOUC issue
  // TODO: Maybe present a spinner instead?
  $('body').css({visibility: 'inherit'});
});

