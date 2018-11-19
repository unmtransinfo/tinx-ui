import $ from "jquery";
import { TreeViewModes } from "./treeview";

class ShareChart {
  constructor() {
    this.shareChartBtn = $('#share-chart-btn');

    this.shareChartBtn.popover({
      container: 'body',
      content: this.popoverContent(),
      placement: 'bottom',
      title: '<span>Share this chart</span><button id="close-btn">Close</button>',
      template: '<div class="popover share-chart-popover" role="tooltip"><div class="arrow"></div><h3 class="popover-header"></h3><div class="popover-body"></div></div>',
      html: true
    }).on('shown.bs.popover', function() {
      // close button handler
      const elem = $(this);
      const closeBtn = $('.share-chart-popover').find('#close-btn');
      closeBtn.on('click', null);
      closeBtn.on('click', () => elem.popover('hide'));
    });
  }

  /**
   * Builds and returns share chart popover content
   *
   * @param {string?} url:   URL of the chart to share
   * @returns {*|jQuery}
   */
  popoverContent(url) {
    const elem = $('<div/>', {class: 'share-chart-content'}).append(
      $('<span/>', {text: 'URL:'})
    ).append(
      $('<input/>', {type: 'text', value: url, class: 'form-control'})
    );
    return elem;
  }

  /**
   * Update share chart popover URL
   *
   * @param {number} id:    disease or target ID
   * @param {string} mode:  current mode
   */
  setUrl(id, mode) {
    const origin = window.location.origin;
    //TODO: can this just be mode?
    const url = `${origin}?${mode === TreeViewModes.DISEASE ? TreeViewModes.DISEASE : TreeViewModes.TARGET}=${id}`;
    this.shareChartBtn.attr('data-content', this.popoverContent(url).html()).data('bs.popover').setContent();
  }

  close() {
    this.shareChartBtn.popover('hide');
  }
}

export default ShareChart;