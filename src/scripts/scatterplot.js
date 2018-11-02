import * as d3 from 'd3v4';
import { TreeViewModes } from "./treeview";
import ApiHelper from './apihelper';
import xss from 'xss';

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

  // Update values
  div.select('.value.full-name').text(target.name);
  div.select('.value.family').text(target.famext || target.fam || '(Unknown)');

  const updateLink = (selector, text, url) => {
    const elem = div.select(selector);
    const anchor = elem.select('a');
    if (anchor.size()) anchor.attr('href', url).text(text);
    else elem.text(text);
  };

  updateLink('.value.pharos', target.uniprot, `https://pharos.nih.gov/idg/targets/${encodeURIComponent(target.uniprot)}`)
  updateLink('.value.drug-central', target.uniprot, `http://drugcentral.org/?q=${encodeURIComponent(target.uniprot)}`)

  const dtoid = target.dtoid
    ? target.dtoid.replace(/_/g, ':')
    : null;

  updateLink('.value.dto-id', dtoid || "", `https://newdrugtargets.org/?target=${encodeURIComponent(dtoid)}`)

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
    this.container.html('').selectAll('*').remove();
    this.svg = this.container.append('svg');
    this.subjectDetails = {
      name: 'a given disease'
    };
    this.datapoints = [];
    this.subjectDetails = {
      name: 'a given disease'
    };
    this.pointClickHandler = () => undefined;

    this.axisTooltips = {
      importance: 'A <b>greater</b> importance score implies that <b>more</b> has been published about the association between the given target and %%disease_name%%.',
      novelty:    'A <b>greater</b> novelty score implies that <b>less</b> has been published about the given target.'
    };

    window.addEventListener('resize', this.redraw.bind(this));
    this.redraw();
    this._initLegend();
  }

  /**
   * Load the plot for the given entity.
   *
   * @param mode - Disease or target
   * @param id - The ID of the disease or target for which to display associated datapoints
   */
  loadPlot(mode, id, details) {
    this.subjectDetails = details;

    this.startSpinner();
    this.svg.selectAll('.datapoint').remove();

    if (mode === TreeViewModes.DISEASE) {
      ApiHelper.getDiseaseTargets(id, 1000).then((data) => {
        this.datapoints = data.results .map((d) =>
          ({
            x: parseFloat(d.target.novelty),
            y: parseFloat(d.importance),
            target: d.target
          })
        );
        this.redraw();
      });
    }
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
   *
   * @param {PointClickHandler} clickHandler
   */
  onPointClick(clickHandler) {
    this.pointClickHandler = clickHandler;
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

    const points = plot.selectAll('.datapoint')
      .data(this.datapoints)
      .enter()
      .append('path')
      .attr('class', (d) =>
        'datapoint ' + (d.target ? `tdl-${d.target.tdl} ` : '')
      )
      .attr('d', (d) => d3.symbol().size([60]).type(this._pointShape(d))())
      .attr('transform', (d) => `translate(${x(d.x)}, ${y(d.y)})`)
      .on('mouseover', function(d) { that.showTooltip(d, d3.select(this)); })
      .on('mouseout', function() { that.clearTooltip(false); })
      .on('click', function(d) { that.pointClickHandler(d, that.subjectDetails); });

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
   */
  showTooltip(d, elem) {
    const {target} = d;

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
    const top = (pointRect.y - pointRect.height / 2) - tooltipRect.height / 2;

    tooltipDiv.select('.popover-header').text(target.sym);
    updateTargetDetails(tooltipDiv, target);

    tooltipDiv
      .style('left', `${left}px`)
      .style('top', `${top}px`)
      .transition()
      .delay(100)
      .style('opacity', 1.0);
  }

  /**
   * Display the tooltip on an axis label when the user hovers over it.
   *
   * TODO: This has a lot of repitition with showTooltip. Can we DRY this up?
   *
   * @param elem The d3 element the user hovered over.
   */
  showAxisTooltip(elem) {
    const tooltipDiv = d3.select('#general-tooltip');

    // Update the tooltip's content. xss is used to sanitize
    // Do this first so that geometry is right
    tooltipDiv.select('.content')
      .html(xss(elem.attr('title')));

    const pointRect = elem.node().getBoundingClientRect();
    const tooltipRect = tooltipDiv.node().getBoundingClientRect();
    const top = (pointRect.y + pointRect.height / 2) - tooltipRect.height / 2;

    // Determine left-right placement based upon value of data-placement
    let left = 0;
    if (elem.attr('data-placement') === 'right') {
      left = pointRect.x + pointRect.width + 5;
      tooltipDiv.classed('bs-popover-right', true).classed('bs-popover-left', false);
    } else if (elem.attr('data-placement') === 'left' ) {
      left = pointRect.x - pointRect.width / 2 - tooltipRect.width + 5;
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
