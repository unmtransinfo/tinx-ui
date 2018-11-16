import '../styles/index.scss';
import $ from 'jquery';
window.jQuery = $;
import 'bootstrap';
import 'bootstrap-3-typeahead';
import Typeaheads from "./typeaheads";
import { TreeView, TreeViewModes } from "./treeview";
import { Scatterplot } from './scatterplot';
import DetailModal from './detailmodal';
import Filters from './filters';

$(window).on("load", () => {
  const scatterplot = new Scatterplot('#plot-container');

  const treeView = new TreeView('#tree-view', TreeViewModes.DISEASE);
  treeView.init();

  const detailmodal = new DetailModal('#detail-modal');

  Typeaheads.init(treeView, scatterplot);

  const filters = new Filters(filters => {
    scatterplot.filterData(filters);
  });

  // User selects something from the treeview
  treeView.onSelectionChange((data, plotLoaded = false) => {
    const defaultThreshold = 300;
    $('#threshold-slider').attr('max', 2000).val(defaultThreshold).attr('disabled', false);
    if (!plotLoaded) {
      if (data.mode === TreeViewModes.DISEASE) scatterplot.loadPlot(data.mode, data.nodeId, data.details, defaultThreshold);
      else {
        const { details = {} } = data;
        const { target } = details;
        if (target && Array.isArray(target) && target.length) {
          scatterplot.loadPlot(data.mode, target[0].id, target[0], defaultThreshold);
        }
      }
    }

    if (data.mode === TreeViewModes.DISEASE) {
      $('#plot-title span.title').text('Targets associated with ');
      $('#plot-title a').text(data.details.name)
        .attr('href',
          `http://disease-ontology.org/term/${encodeURIComponent(data.details.doid)}`);
    }
    else if (data.mode === TreeViewModes.TARGET) {
      const { details } = data;
      if (!details || !details.target || !Array.isArray(details.target)) return;

      const [ target ] = details.target;
      $('#plot-title span.title').text('Diseases associated with ');
      $('#plot-title a').text(details.name)
        .attr('href',
          `//pharos.nih.gov/idg/targets/${encodeURIComponent(target.uniprot)}`);
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
  scatterplot.onPlotLoaded((datapoints, totalCount) => {
    $('#threshold-slider').attr('max', totalCount < 2000 ? totalCount : 2000);
    filters.reset();
    Typeaheads.initDataSearch(datapoints, (selected) => {
      scatterplot.selectAndShowTooltip(selected);
    });
  });

  // User changes the threshold slider
  $('#threshold-slider').change(function() {
    scatterplot.changeThreshold($(this).val());
  });

  $('.nav-item').click(function() {
    const elem = $(this);
    $('.nav-item').removeClass('active');
    elem.addClass('active');

    const value = elem.find('.nav-link').data('value');

    //TODO: handle about section
    if (value !== 'about') {
      Typeaheads.setMode(value);
      treeView.setMode(value);
    }
  });

  // Prevent FOUC issue
  // TODO: Maybe present a spinner instead?
  $('body').css({visibility: 'inherit'});
});

