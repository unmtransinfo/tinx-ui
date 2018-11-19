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
import Helpers from './helpers';
import ApiHelper from './apihelper';
import ShareChart from "./share-chart";
import Exporter from "./exporter";

$(window).on("load", () => {
  const defaultThreshold = 300;
  const shareChart = new ShareChart();
  const scatterplot = new Scatterplot('#plot-container');
  const treeView = new TreeView('#tree-view', TreeViewModes.DISEASE);
  const detailmodal = new DetailModal('#detail-modal');
  const exporter = new Exporter(TreeViewModes.DISEASE);
  const aboutModal = $('#about-modal');

  treeView.init();
  Typeaheads.init(treeView, scatterplot);

  checkUrlParams();

  const filters = new Filters(TreeViewModes.DISEASE, filters => {
    scatterplot.filterData(filters);
  });

  // User selects something from the treeview
  treeView.onSelectionChange((data, plotLoaded = false) => {
    const { mode, nodeId, details } = data;
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

    if (nodeId && mode) {
      shareChart.close();
      shareChart.setUrl(nodeId, mode);
    }

    if (mode === TreeViewModes.DISEASE) {
      $('#plot-title span.title').text('Targets associated with ');
      $('#plot-title a').text(details.name)
        .attr('href',
          `http://disease-ontology.org/term/${encodeURIComponent(details.doid)}`);
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

    if ("disease" in d) {
      detailmodal.show(subjectDetails, d.disease);
    }
  });

  // The plot finishes loading
  scatterplot.onPlotLoaded((datapoints, totalCount, subjectDetails) => {
    exporter.setData(datapoints, subjectDetails);
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

    if (value !== 'about') onModeUpdate(value);
    else aboutModal.modal({ show: true });
  });

  // Prevent FOUC issue
  // TODO: Maybe present a spinner instead?
  $('body').css({visibility: 'inherit'});

  /**
   * Check for URL params and populate the chart with appropriate
   * data if any are present
   */
  function checkUrlParams() {
    const diseaseParam = Helpers.getUrlParam('disease');

    if (diseaseParam) {
      ApiHelper.getDisease(diseaseParam).then(data => {
        scatterplot.loadPlot(TreeViewModes.DISEASE, data.id, data, defaultThreshold);
        treeView.expandToNode(data.id);
      }).catch(e => console.log(e));
    }
  }

  /**
   * Invoked when user switches between modes (target/disease).
   * Updates modes in various components
   *
   * @param {string} value: new mode
   */
  function onModeUpdate(value) {
    Typeaheads.setMode(value);
    treeView.setMode(value);
    filters.setMode(value);
    exporter.setMode(value);
  }
});

