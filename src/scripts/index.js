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
import { ROOT_NODE } from "./constants";

$(window).on("load", () => {
  const defaultThreshold = 300;
  const shareChart = new ShareChart();
  const scatterplot = new Scatterplot('#plot-container');
  const treeView = new TreeView('#tree-view', TreeViewModes.DISEASE);
  const detailmodal = new DetailModal('#detail-modal');
  const exporter = new Exporter(TreeViewModes.DISEASE);
  const aboutModal = $('#about-modal');
  const $thresholdSlider = $('#threshold-slider');

  treeView.init();
  Typeaheads.init(treeView, scatterplot);

  const filters = new Filters(TreeViewModes.DISEASE, filters => {
    scatterplot.filterData(filters);
  });

  checkUrlParams();

  // User selects something from the treeview
  treeView.onSelectionChange((data, node, plotLoaded = false) => {
    const { mode, nodeId, details } = data;
    $thresholdSlider.attr('max', 2000).val(defaultThreshold).attr('disabled', false);

    if (!plotLoaded && !node.hasClass(ROOT_NODE)) {
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
      shareChart.setUrl(nodeId, mode, treeView.getWasBackPressed());
    }

    // update plot title only if selected node is not a root
    if (node.hasClass(ROOT_NODE)) return;

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
    $thresholdSlider.attr('max', totalCount < 2000 ? totalCount : 2000);
    filters.reset();
    Typeaheads.initDataSearch(datapoints, (selected) => {
      scatterplot.selectAndShowTooltip(selected);
    });
  });

  // Threshold slider functionality
  $thresholdSlider
    .change(function() {
      scatterplot.changeThreshold($(this).val(), $(this).attr('max'));
    })
    .mouseover(function() {
      scatterplot.showSliderTooltip($(this).val(), $(this).attr('max'));
    })
    .mouseout(function() {
      scatterplot.clearTooltip(false);
    });

  $('.nav-item').click(function() {
    const elem = $(this);
    treeView.setWasBackPressed(false);

    $('.nav-item').removeClass('active');
    elem.addClass('active');

    const value = elem.find('.nav-link').data('value');

    if (value === 'about') {
      return aboutModal.modal({ show: true });
    }

    $('body').attr('data-mode', value);
    scatterplot.clear();
    $('#plot-title span.title').text('');
    $('#plot-title a').text('');

    onModeUpdate(value);
  });

  // Prevent FOUC issue
  // TODO: Maybe present a spinner instead?
  $('body').css({visibility: 'inherit'});

  /**
   * Check for URL params and populate the chart with appropriate
   * data if any are present
   */
  function checkUrlParams(wasBackPressed = false) {
    const diseaseParam = Helpers.getUrlParam('disease');
    const targetParam = Helpers.getUrlParam('target');

    treeView.setWasBackPressed(wasBackPressed);

    if (diseaseParam) {
      onModeUpdate(TreeViewModes.DISEASE);
      ApiHelper.getDisease(parseInt(diseaseParam)).then(data => {
        scatterplot.loadPlot(TreeViewModes.DISEASE, data.id, data, defaultThreshold);
        treeView.expandToNode(data.id);
      });
    }
    else if (targetParam) {
      onModeUpdate(TreeViewModes.TARGET);
      ApiHelper.getDTO(targetParam).then(data => {
        const { target } = data;
        if (target && Array.isArray(target) && target.length) {
          scatterplot.loadPlot(TreeViewModes.TARGET, target[0].id, target[0], defaultThreshold);
          treeView.expandToNode(data, true);
        }
      });
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
    shareChart.close();
  }

  window.onpopstate = (e) => {
    if(e.state){
      checkUrlParams(true);
    }
  };
});

// Google analytics
(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments);},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m);
})(window,document,'script','//www.google-analytics.com/analytics.js','ga');
ga('create', 'UA-68556349-1', 'auto');
ga('send', 'pageview');

