import * as d3 from 'd3v4';
import { TreeViewModes } from "./treeview";
import ApiHelper from './apihelper';
import xss from 'xss';
import $ from 'jquery';

/* Plot margins. */
const margin = {
  top: 10,
  right: 20,
  bottom: 30,
  left: 40
};

/**
 * Updates the target details of the specified div. This is used both to update
 * the target details in the tooltip and also in the modal.
 *
 * @param {(string|Selection)} div Either a d3 selection or a string selector for the div to update.
 * @param {{}} target The target to use for updating the div.
 */
function updateTargetDetails(div, target) {
  if (typeof div === "string") div = d3.select(div);

  div.select('.main-row').style('display', null);
  div.select('.summary-row').style('display', 'none');

  // Update values
  div.select('.value.full-name').text(target.name);
  div.select('.value.family').text(target.famext || target.fam || '(Unknown)');

  const updateLink = (selector, text, url) => {
    const elem = div.select(selector);
    const anchor = elem.select('a');
    if (anchor.size()) anchor.attr('href', url).text(text);
    else elem.text(text);
  };

  updateLink('.value.pharos', target.uniprot, `https://pharos.nih.gov/idg/targets/${encodeURIComponent(target.uniprot)}`);
  updateLink('.value.drug-central', target.uniprot, `http://drugcentral.org/?q=${encodeURIComponent(target.uniprot)}`);

  const dtoid = target.dtoid
    ? target.dtoid.replace(/_/g, ':')
    : null;

  updateLink('.value.dto-id', dtoid || "", `https://newdrugtargets.org/?target=${encodeURIComponent(dtoid)}`);

  // Update tdl badge
  div.select('.badge-tdl')
    .attr('data-tdl', target.tdl || '')
    .select('span')
    .text(target.tdl);

  // Update idgdfam badge
  div.select('.badge-idgfam')
    .attr('data-idgfam', target.fam || '')
    .select('span')
    .text(target.fam || 'Uncategorized');

}

function updateDiseaseDetails(div, disease) {
  if (typeof div === "string") div = d3.select(div);
  div.select('.main-row').style('display', 'none');
  const summaryRow = div.select('.summary-row');
  summaryRow.style('display', null);
  summaryRow.select('p').text(disease.summary);
}

/**
 * A Scatterplot renders target-disease associations in a dynamic plot.
 */
class Scatterplot {
  /**
   *
   * @param selector - A d3 selector for the element in which to place the plot.
   */
  constructor(selector) {
    this.container = d3.select(selector);
    this.container.selectAll('.scatterplot').remove();
    this.svg = this.container.append('svg');
    this.currentMode = TreeViewModes.DISEASE;
    this.subjectId = null;
    this.subjectDetails = {
      name: 'a given disease'
    };
    this.datapoints = [];
    this.subjectDetails = {
      name: 'a given disease'
    };
    this.pointClickHandler = null;
    this.plotLoadedHandler = null;
    this.hoverTooltipEnabled = true;

    this.axisTooltips = {
      importance: 'A <b>greater</b> importance score implies that <b>more</b> has been published about the association between the given target and %%disease_name%%.',
      novelty:    'A <b>greater</b> novelty score implies that <b>less</b> has been published about the given target.'
    };

    this.sliderTooltipContent = (curr, total) => {
      const diseaseMode = this.currentMode === TreeViewModes.DISEASE;
      return `
      <b>${diseaseMode ? 'Targets' : 'Diseases'} to Display</b><br>
      Currently plotting only the most interesting ${curr} of ${total} 
      ${diseaseMode ? 'targets' : 'diseases'} associated with this 
      ${diseaseMode ? 'disease' : 'target'}
      `;
    };


    window.addEventListener('resize', this.redraw.bind(this));
    this.redraw();
    this._initLegend();
  }

  clear() {
    this.datapoints = [];
    this.redraw();
  }

  /**
   * Load the plot for the given entity.
   *
   * @param {string} mode - Disease or target
   * @param {int} id - The ID of the disease or target for which to display associated datapoints
   * @param {{}} details - Details about the subject of the plot.
   * @param {int} limit - Maximum number of points to retrieve.
   */
  loadPlot(mode, id, details, limit = 300) {
    this.currentMode = mode;
    this.subjectId = id;
    this.subjectDetails = details;

    this.startSpinner();
    this.svg.selectAll('.datapoint').remove();

    if (mode === TreeViewModes.DISEASE) {
      ApiHelper.getDiseaseTargets(id, limit).then((data) => {
        this.datapoints = data.results .map((d) =>
          ({
            x: parseFloat(d.target.novelty),
            y: parseFloat(d.importance),
            target: d.target
          })
        );
        this.redraw();

        if (this.plotLoadedHandler)
          this.plotLoadedHandler(this.datapoints, data.count, this.subjectDetails);
      });
    }
    else if (mode === TreeViewModes.TARGET) {
      ApiHelper.getTargetDiseases(id, limit).then(data => {
        this.datapoints = data.results.map((d) =>
          ({
            x: parseFloat(d.disease.novelty),
            y: parseFloat(d.importance),
            disease: d.disease
          })
        );

        this.redraw();

        if (this.plotLoadedHandler)
          this.plotLoadedHandler(this.datapoints, data.count, this.subjectDetails);
      });
    }
  }

  /**
   * Update the maximum number of datapoints to retrieve, and redraw the plot.
   *
   * @param {int} newThreshold - Maximum number of datapoints to retreive and render.
   */
  changeThreshold(newThreshold, max) {
    this.updateSliderTooltipContent(newThreshold, max);
    if (this.subjectId) {
      this.loadPlot(this.currentMode, this.subjectId, this.subjectDetails, newThreshold);
    }
  }

  updateSliderTooltipContent(value, total) {
    const tooltipDiv = d3.select('#general-tooltip');
    const content = this.sliderTooltipContent(value, total);
    tooltipDiv.select('.content')
      .html(xss(content));
  }

  showSliderTooltip(value, total) {
    const elem = d3.select('#threshold-slider');
    const content = this.sliderTooltipContent(value, total);
    this.showGeneralTooltip(content, elem, -20);
  }

  /**
   * Selects and shows tooltip for specified datapoint. Invoked when user
   * selects an options from the data search typeahead input
   *
   * @param {Object} selected:    item selected from the data search typeahead
   */
  selectAndShowTooltip(selected) {
    const that = this;

    const { target, disease }  = selected;
    const selectedId = this.currentMode === TreeViewModes.DISEASE ? target.id : disease.id;
    // const { id: selectedId } = target;

    if (!selectedId) {
      console.error('Missing ID for selected data item', selected);
      return;
    }

    const point = this.svg.selectAll('g .datapoint').filter(function(d) {
      if (!d) return false;
      const { target, disease } = d;
      // const { id: pointId } = target;
      const pointId = that.currentMode === TreeViewModes.DISEASE ? target.id : disease.id;
      return pointId && selectedId === pointId;
    }).filter((d, i) => i === 0);

    point.each(function() {
      that.showTooltip(selected, d3.select(this), true);
    });

    this.hoverTooltipEnabled = false;
  }

  /**
   * Hides/shows datapoints based on filter status
   *
   * @param {Object} filters:   filter data
   */
  filterData(filters) {
    if (!this.datapoints || !this.datapoints.length) return;

    const { tdl: tdlFilters = [], idg: idgFilters = [] } = filters;

    this.svg.selectAll('g .datapoint').each(function(d) {
      const { target = {} } = d;
      const { tdl } = target;
      let { fam } = target;
      if (!fam) fam = 'uncategorized';

      let visibility = null;

      if (!tdl || tdlFilters.indexOf(tdl.toLowerCase()) < 0) visibility = 'hidden';
      if (idgFilters.indexOf(fam.toLowerCase()) < 0) visibility = 'hidden';

      d3.select(this).style('visibility', visibility);
    });
  }

  /**
   * Definition of the PointClickHandler data type. (JSDoc only)
   *
   * @name PointClickHandler
   * @function
   * @param {{}} d - The data payload of datapoint that was clicked.
   * @param {{}} subjectDetails - Details about the subject (disease/target) of the current plot.
   */

  /**
   * Register a point click handler, a function that is triggered when a
   * datapoint in the scatterplot is clicked.
   *
   * TODO: Should we allow multiple handlers? Error if one has been set?
   *
   * @param {PointClickHandler} clickHandler
   */
  onPointClick(clickHandler) {
    if (this.pointClickHandler !== null)
      throw new Error("A handler for the pointClick event has already been registered.");
    this.pointClickHandler = clickHandler;
  }

  /**
   * Definition of the PlotLoadedHandler data type. (JSDoc only)
   *
   * @name PlotLoadedHandler
   * @function
   * @param {[{}]} data - The datapoints that were retrieved and rendered.
   * @param {{}} subjectDetails - Details about the subject (disease/target) of the current plot.
   */

  /**
   * Register a function to be triggered when the plot finishes loading.
   *
   * @param {PlotLoadedHandler} plotLoadedHandler
   */
  onPlotLoaded(plotLoadedHandler) {
    if (this.plotLoadedHandler !== null)
      throw new Error("A handler for the plotLoaded event has already been registered.");
    this.plotLoadedHandler = plotLoadedHandler;
  }

  /**
   * Render the plot. Called when the window is resized or new data is to be
   * loaded.
   */
  redraw() {
    const that = this;
    const width = this.container.node().clientWidth - margin.left - margin.right;
    const height = this.container.node().clientHeight - margin.top - margin.bottom;

    this.svg
      .attr('class', 'scatterplot')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom);

    this.svg.select('*').remove();

    const x = d3.scaleLog()
      .domain(d3.extent(this.datapoints, (d) => d.x))
      .nice()
      .range([0, width]);

    const y = d3.scaleLog()
      .domain(d3.extent(this.datapoints, (d) => d.y))
      .nice()
      .range([height, 0]);

    const xAxis = d3.axisBottom(x);
    const yAxis = d3.axisLeft(y);

    const plot = this.svg
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    const gX = plot.append('g')
      .attr('class', 'x axis')
      .attr('transform', `translate(0, ${height})`)
      .call(xAxis);

    gX.append('text')
      .attr('class', 'label')
      .attr('x', width)
      .attr('y', -6)
      .style('text-anchor', 'end')
      .text('Novelty')
      .attr('data-placement', 'left')
      .attr('title', this.axisTooltips.novelty)
      .on('mouseover', function(d) { that.showAxisTooltip(d3.select(this)); })
      .on('mouseout', () => that.clearTooltip(false));

    const gY = plot.append('g')
      .attr('class', 'y axis')
      .call(yAxis);

    gY.append('text')
      .attr('class', 'label')
      .attr('transform', 'rotate(-90)')
      .attr('y', 6)
      .attr('dy', '.71em')
      .style('text-anchor', 'end')
      .text('Importance')
      .attr('data-placement', 'right')
      .attr('title', this.axisTooltips.importance
        .replace(/%%disease_name%%/g, this.subjectDetails.name))
      .on('mouseover', function(d) { that.showAxisTooltip(d3.select(this)); })
      .on('mouseout', () => that.clearTooltip(false));

    /**
     * Determines the class name for a datapoint.
     * @param d
     * @returns {string}
     */
    const className = (d) => {
      if (d.target)
        return `tdl-${d.target.tdl}`;
      else if (d.disease && d.disease.category)
        return `disease ${d.disease.category.replace(/\s/g, '-')}`;
      else if (d.disease)
        return `disease unknown`;
      else
        return '';
    };

    const points = plot.selectAll('.datapoint')
      .data(this.datapoints)
      .enter()
      .append('path')
      .attr('class', (d) => 'datapoint ' + className(d) )
      .attr('d', (d) => d3.symbol().size([60]).type(this._pointShape(d))())
      .attr('transform', (d) => `translate(${x(d.x)}, ${y(d.y)})`)
      .on('mouseover', function(d) {
        if (that.hoverTooltipEnabled) that.showTooltip(d, d3.select(this));
      })
      .on('mouseout', function() {
        if (that.hoverTooltipEnabled) that.clearTooltip(false);
      })
      .on('click', function(d) {
        if (that.pointClickHandler)
          that.pointClickHandler(d, that.subjectDetails);
      });

    const zoom = d3.zoom()
      .scaleExtent([.5, 20])
      .extent([[0, 0], [width, height]])
      .on("zoom", () => {
        const newX = d3.event.transform.rescaleX(x);
        const newY = d3.event.transform.rescaleY(y);
        gX.call(xAxis.scale(newX));
        gY.call(yAxis.scale(newY));
        points.data(this.datapoints)
          .attr('transform', (d) => `translate(${newX(d.x)}, ${newY(d.y)})`);
      });

    this.svg.call(zoom);

    this.stopSpinner();
  }

  /**
   * Clears the tooltip.
   */
  clearTooltip(triggeredByMouseEnter) {
    this.svg.classed('tooltip-visible', triggeredByMouseEnter);

    if (!triggeredByMouseEnter)
      this.svg.select('.previously-selected').classed('previously-selected', false);

    this.svg.select('.selected')
      .classed('selected', false)
      .classed('previously-selected', true);

    d3.select('#scatterplot-tooltip')
      .transition()
      .delay(1000)
      .duration(500)
      .style('opacity', 0.0);

    d3.select('#general-tooltip')
      .transition()
      .delay(1000)
      .duration(500)
      .style('opacity', 0.0);
  }

  /**
   * Displays the tooltip using the provided datapoint and SVG element.
   *
   * @param d - Data about the selected point
   * @param elem - A d3 selection containing the element next to which to display the tooltip.
   * @param forSearchItem - Whether or not we are showing a tooltip for item selected from data
   * search typeahead
   */
  showTooltip(d, elem, forSearchItem = false) {
    const that = this;
    const { target, disease } = d;

    this.clearTooltip(true);
    this.svg.classed('tooltip-visible', true);
    elem.classed('selected', true);

    const tooltipDiv = d3.select('#scatterplot-tooltip');
    const pointRect = elem.node().getBoundingClientRect();
    const tooltipRect = tooltipDiv.node().getBoundingClientRect();

    // If tooltip will go over the right edge, display it on the left-side of
    // the point instead of right-side.
    let left = 0;
    if (pointRect.x + pointRect.width + tooltipRect.width + 5 > window.innerWidth) {
      tooltipDiv.classed('bs-popover-right', false).classed('bs-popover-left', true);
      left = pointRect.x - pointRect.width - tooltipRect.width - 5;
    } else {
      tooltipDiv.classed('bs-popover-right', true).classed('bs-popover-left', false);
      left = pointRect.x + pointRect.width + 5;
    }

    // Absolute top of the tooltip
    const top = (pointRect.y - pointRect.height / 2) - tooltipRect.height / 2 + window.scrollY;

    const tooltipHeader = this.currentMode === TreeViewModes.DISEASE ? target.sym : disease.name;
    tooltipDiv.select('.popover-header').text(tooltipHeader);
    this.currentMode === TreeViewModes.DISEASE ? updateTargetDetails(tooltipDiv, target) : updateDiseaseDetails(tooltipDiv, disease);

    tooltipDiv
      .style('left', `${left}px`)
      .style('top', `${top}px`)
      .transition()
      .delay(100)
      .style('opacity', 1.0);

    const tooltipActions = tooltipDiv.select('.actions-row');

    if (forSearchItem) {
      tooltipDiv.style('pointer-events', 'auto');
      tooltipActions.style('display', null);
      const detailsButton = tooltipActions.select('#view-details-button');
      const closeButton = tooltipActions.select('#close-modal-button');

      detailsButton.on('click', null);
      detailsButton.on('click', function() {
        that.pointClickHandler(d, that.subjectDetails);
        that.hoverTooltipEnabled = true;
      });
      closeButton.on('click', function() {
        that.clearTooltip(false);
        that.hoverTooltipEnabled = true;
      });
    }
    else {
      tooltipDiv.style('pointer-events', 'none');
      tooltipActions.style('display', 'none');
    }
  }

  /**
   * Display the tooltip on an axis label when the user hovers over it.
   *
   * TODO: This has a lot of repitition with showTooltip. Can we DRY this up?
   *
   * @param elem The d3 element the user hovered over.
   */
  showAxisTooltip(elem) {
    const content = elem.attr('title');
    this.showGeneralTooltip(content, elem);
  }

  showGeneralTooltip(content, elem, customXOffset = 0) {
    const tooltipDiv = d3.select('#general-tooltip');

    // Update the tooltip's content. xss is used to sanitize
    // Do this first so that geometry is right
    tooltipDiv.select('.content')
      .html(xss(content));

    const pointRect = elem.node().getBoundingClientRect();
    const tooltipRect = tooltipDiv.node().getBoundingClientRect();
    const top = (pointRect.y + pointRect.height / 2) - tooltipRect.height / 2 + window.scrollY;

    // Determine left-right placement based upon value of data-placement
    let left = 0;
    if (elem.attr('data-placement') === 'right') {
      left = pointRect.x + pointRect.width + 5 + customXOffset;
      tooltipDiv.classed('bs-popover-right', true).classed('bs-popover-left', false);
    } else if (elem.attr('data-placement') === 'left' ) {
      left = pointRect.x - pointRect.width / 2 - tooltipRect.width + 5 + customXOffset;
      tooltipDiv.classed('bs-popover-right', false).classed('bs-popover-left', true);
    }

    // Position the div
    tooltipDiv
      .style('left', `${left}px`)
      .style('top', `${top}px`)
      .transition()
      .delay(100)
      .style('opacity', 1.0);
  }

  /**
   * Shows the loading spinner.
   */
  startSpinner() {
    const plotTitle = d3.select('#plot-title');
    console.log(plotTitle);
    plotTitle.select('.loading-spinner').classed('hide', false);
    plotTitle.selectAll('span.title,a').classed('hide', true);
  }

  /**
   * Hides the loading spinner.
   */
  stopSpinner() {
    const plotTitle = d3.select('#plot-title');
    plotTitle.select('.loading-spinner').classed('hide', true);
    plotTitle.selectAll('span.title,a').classed('hide', false);
  }

  /**
   * Renders shapes inside of the legend.
   *
   * @private
   */
  _initLegend() {
    const that = this;
    d3.selectAll('#plot-legend svg.shape-icon')
      .each(function() {
        const elem = d3.select(this);

        elem.append('path')
          .attr('d', (d) => d3.symbol()
            .size([70])
            .type(that._pointShape(elem.attr('data-label')))()
          )
          .attr('transform', `translate(8, 8.5)`);
      });

  }

  /**
   * Determins the shape to render for the point d.
   * @param {{}|string} d - A target object or a string indicating the IDG family.
   * @returns {*} A d3 symbol.
   * @private
   */
  _pointShape(d) {
    let fam = null;
    if (typeof d === "string") fam = d;
    else if (!d.target || !d.target.fam) return d3.symbolCircle;
    else  fam = d.target.fam;

    const famShapes = {
      'gpcr'   : d3.symbolSquare,
      'ogpcr'  : d3.symbolWye,
      'ion'    : d3.symbolDiamond,
      'kinase' : d3.symbolTriangle,
      'nr'     : d3.symbolCross
    };

    return famShapes[fam.toLocaleLowerCase()] || d3.symbolCircle;
  }
}


export { Scatterplot, updateTargetDetails };
