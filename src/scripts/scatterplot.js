import * as d3 from 'd3v4';
import { TreeViewModes } from "./treeview";
import ApiHelper from './apihelper';

/* Plot margins. */
const margin = {
  top: 60,
  right: 20,
  bottom: 30,
  left: 40
};

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
    this.datapoints = [];
    window.addEventListener('resize', this.redraw.bind(this));
    this.redraw();
  }

  /**
   * Load the plot for the given entity.
   *
   * @param mode - Disease or target
   * @param id - The ID of the disease or target for which to display associated datapoints
   */
  loadPlot(mode, id) {
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
      .text('Novelty');

    const gY = plot.append('g')
      .attr('class', 'y axis')
      .call(yAxis);
    gY.append('text')
        .attr('class', 'label')
        .attr('transform', 'rotate(-90)')
        .attr('y', 6)
        .attr('dy', '.71em')
        .style('text-anchor', 'end')
        .text('Importance');

    const points = plot.selectAll('.datapoint')
      .data(this.datapoints)
      .enter()
      .append('circle')
      .attr('class', (d) =>
        'datapoint ' + (d.target ? `tdl-${d.target.tdl} ` : '')
      )
      .attr('cx', (d) => x(d.x))
      .attr('cy', (d) => y(d.y))
      .on('mouseover', function(d) { that.showTooltip(d, d3.select(this)); })
      .on('mouseout', this.clearTooltip.bind(this));

    const zoom = d3.zoom()
      .scaleExtent([.5, 20])
      .extent([[0, 0], [width, height]])
      .on("zoom", () => {
        const newX = d3.event.transform.rescaleX(x);
        const newY = d3.event.transform.rescaleY(y);
        gX.call(xAxis.scale(newX));
        gY.call(yAxis.scale(newY));
        points.data(this.datapoints)
          .attr('cx', (d) => newX(d.x))
          .attr('cy', (d) => newY(d.y));
      });
    this.svg.call(zoom);
  }

  /**
   * Clears the tooltip.
   */
  clearTooltip() {
    this.svg.classed('tooltip-visible', false);
    this.svg.select('.selected').classed('selected', false);
    d3.select('#scatterplot-tooltip')
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

    this.clearTooltip();
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

    // Update values
    tooltipDiv.select('.popover-header').text(target.name);
    tooltipDiv.select('.value.full-name').text('TODO');
    tooltipDiv.select('.value.family').text(target.famext || target.fam || '');

    // Update tdl badge
    tooltipDiv.select('.badge-tdl')
      .attr('data-tdl', target.tdl || '')
      .select('span')
      .text(target.tdl);

    // Update idgdfam badge
    tooltipDiv.select('.badge-idgfam')
      .attr('data-idgfam', target.fam || '')
      .select('span')
      .text(target.fam || 'Uncategorized');

    tooltipDiv
      .style('left', `${left}px`)
      .style('top', `${top}px`)
      .transition()
      .delay(100)
      .style('opacity', 1.0);
  }
}


export default Scatterplot;