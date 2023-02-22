import '../styles/index.scss';
import $ from 'jquery';
//import $ from 'jQuery';
window.jQuery = $;
import 'datatables.net';
import 'bootstrap';
import 'bootstrap-3-typeahead';
import Typeaheads from "./typeaheads";
import { TreeView, TreeViewModes } from "./treeview";
import { Scatterplot } from './scatterplot';
import { TableView } from './tableview';
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
  const tableview = new TableView(TreeViewModes.DISEASE, '#table-view', '#table-search-input');
  const aboutModal = $('#about-modal');
  const tableModal = $('#table-modal');
  const $thresholdSlider = $('#threshold-slider');


  treeView.init();
  Typeaheads.init(treeView, scatterplot);

  const filters = new Filters(TreeViewModes.DISEASE, filters => {
    scatterplot.filterData(filters);
    tableview.filterData(filters);
  });

  checkUrlParams();

  // User selects something from the treeview
  treeView.onSelectionChange((data, node, plotLoaded = false) => {
    const { mode, nodeId, nodeDOID, details } = data;

    $thresholdSlider.attr('max', 2000).val(defaultThreshold).attr('disabled', false);

    tableview.clear();

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
      shareChart.setUrl(data.mode === TreeViewModes.DISEASE ? nodeDOID : nodeId, mode, treeView.getWasBackPressed());
    }

    // update plot title only if selected node is not a root
    if (node.hasClass(ROOT_NODE)) return;

    if (mode === TreeViewModes.DISEASE) {
      $('#plot-title span.title').text('Targets associated with ');
      $('#plot-title a').text(details.name).prop('title', details.name)
        .attr('href',
          `http://disease-ontology.org/term/${encodeURIComponent(details.doid)}`);
    }
    else if (data.mode === TreeViewModes.TARGET) {
      const { details } = data;
      if (!details || !details.target || !Array.isArray(details.target)) return;

      const [ target ] = details.target;
      $('#plot-title span.title').text('Diseases associated with ');
      $('#plot-title a').text(details.name).prop('title', details.name)
        .attr('href',
          `//pharos.nih.gov/idg/targets/${encodeURIComponent(target.uniprot)}`);
    }
  });

  const detailModal = (d, subjectDetails) => {
    // Immediately hide any tooltips that are open
    $('#scatterplot-tooltip,#general-tooltip').css('opacity', '0');

    if ("target" in d) {
      detailmodal.show(d.target, subjectDetails);
    }

    if ("disease" in d) {
      detailmodal.show(subjectDetails, d.disease);
    }
  };

  // User clicks on a row
  tableview.onRowClick((d, subjectDetails) => {
    detailModal(d, subjectDetails);
  });

  // User clicks a datapoint
  scatterplot.onPointClick((d, subjectDetails) => {
    detailModal(d, subjectDetails);
  });

  // The plot finishes loading
  scatterplot.onPlotLoaded((datapoints, totalCount, subjectDetails) => {
    exporter.setData(datapoints, subjectDetails);
    tableview.setData(datapoints, subjectDetails);
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


// is this still used?
   $('#viewTableButton').click(function() {
    return tableModal.modal({ show: true });
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

    if (value === 'tutorials') {
      return aboutModal.modal({ show: true });
    }

    // Here we are updating the data-mode attribute on the body tag to reflect User actions such as clicking on the navigation links
    if (value === 'disease' || value === 'target') {
      $('body').attr('data-mode', value);
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
      ApiHelper.getDisease(diseaseParam).then(data => {
        scatterplot.loadPlot(TreeViewModes.DISEASE, data.doid, data, defaultThreshold);
        treeView.expandToNode(data);
      });
    }
    else if (targetParam) {
      onModeUpdate(TreeViewModes.TARGET);
      $('body').attr('data-mode', 'target');
      $('#disease-nav-item').removeClass('active');
      $('#target-nav-item').addClass('active');
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
    tableview.setMode(value);
    shareChart.close();
  }

  /**
   * Switch between Table and the default Plot view modes
   * using Click event handler
   *
   */
    $('#clicktable').click(function()  {
      $('#plot-container').hide();
      $('#table-container').show();
      $('#plot-legend').hide();
      $('#table-search-input').removeClass('hide');
      $('#table-search-input').attr('placeholder', `Search for a ${treeView.mode === TreeViewModes.DISEASE ? 'target' : 'disease'}...`);
      $('#search-input').addClass('hide');

    });

  $('#clickplot').click(function()  {
    $('#table-container').hide();
    $('#plot-container').show();
    $('#plot-legend').show();
    $('#table-search-input').addClass('hide');
    $('#search-input').removeClass('hide');

    scatterplot.redraw();
  });

  const tab = document.querySelectorAll(".tabcontainer");
  const toggleTab = function (element) {
    const tabBtn = element.querySelectorAll(".tab-btn");

    tabBtn[0].classList.add("tab-open");


    const removeTab = function (element) {
      for (const i of element) {
        i.classList.remove("tab-open");
      }
    };
    const openTab = function (index) {
      removeTab(tabBtn);
      tabBtn[index].classList.add("tab-open");
    };
    tabBtn.forEach((el, i) => (el.onclick = () => openTab(i)));
  };
  [...tab].forEach((el) => toggleTab(el));



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

