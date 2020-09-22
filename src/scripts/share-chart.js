import $ from "jquery";
import { TreeViewModes } from "./treeview";

class ShareChart {
  constructor() {
    this.shareChartBtn = $('#share-chart-btn');
    const that = this;

    this.shareChartBtn.popover({
      container: 'body',
      placement: 'bottom',
      content: this.popoverContent(),
      title: '<span>Share this chart</span><i class="fa fa-times" id="close-btn"></i>',
      template: '<div class="popover share-chart-popover" role="tooltip"><div class="arrow"></div><h3 class="popover-header"></h3><div class="popover-body"></div></div>',
      html: true
    }).on('shown.bs.popover', function() {
      const $popover = $('.share-chart-popover');
      const $input = $popover.find('input');
      const url = that.shareChartBtn.data('url');

      $input.val(url);

      // close button handler
      const elem = $(this);
      const closeBtn = $popover.find('#close-btn');
      closeBtn.on('click', null);
      closeBtn.on('click', () => elem.popover('hide'));

      const copyBtn = $popover.find('button[id="copy-link"]');
      copyBtn.on('click', null);
      copyBtn.on('click', () => {
        $input.select();
        document.execCommand("copy");
      });
    });
  }

  /**
   * Builds and returns share chart popover content
   *
   * @param {string?} url:   URL of the chart to share
   * @returns {*|jQuery}
   */
  popoverContent() {
    const elem = $('<div/>', {class: 'share-chart-content'}).append(
      $('<span>', {text: 'URL'})
    ).append(
      $('<input>', {type: 'text', value: '', class: 'form-control', readonly: 'readonly'})
    ).append(
      $('<button>', {text: 'Copy Link', class: 'btn btn-secondary', id: 'copy-link'})
    );
    return elem;
  }

  /**
   * Update share chart popover URL
   *
   * @param {number} id:    disease or target ID
   * @param {string} mode:  current mode
   */
  setUrl(id, mode, wasBackPressed) {
    const origin = window.location.origin;
    const url = `${origin}?${mode}=${id}`;
    this.shareChartBtn.attr('data-url', url);

    if (!wasBackPressed) {
      // Update URL in browser bar (without reloading)
      history.pushState(document.body.innerHTML, document.title, url);
    }
  }

  close() {
    this.shareChartBtn.popover('hide');
  }
}

export default ShareChart;
