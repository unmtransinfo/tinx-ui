import ApiHelper from './apihelper';
import xss from 'xss';
import { updateTargetDetails } from "./scatterplot";

/**
 * Renders a detail modal, displaying details about a disease-target
 * association.
 */
class DetailModal {
  /**
   *
   * @param {string} selector - The div to use as the modal
   */
  constructor(selector) {
    this.$elem = $(selector);
    this.selector = selector;

    // Start of last page of articles loaded
    this.pageStart = 0;

    // Start of next page of article to load
    this.pageEnd = 0;

    // Number of articles per page
    this.perPage = 10;

    // Is there another page?
    this.hasNext = false;

    // Disease to detail
    this.disease = null;

    // Target to detail
    this.target = null;

    // Used to prevent API requests from running over each other
    this.lastPageRequestTime = 0;

    // Attach click handlers to pagination
    this.$elem.find('.pagination .next').click(this.nextPage.bind(this));
    this.$elem.find('.pagination .previous').click(this.previousPage.bind(this));
  }

  /**
   * Displays a modal for the specified target and disease.
   *
   * @param {{}} target Target to detail.
   * @param {{}} disease Disease to detail.
   */
  show(target, disease) {
    this.disease = disease;
    this.target = target;
    this.pageStart = 0;
    this.pageEnd = 0;

    this.$elem.find('.modal-title').text(`${target.name} and ${disease.name}`);

    // Update disease fields
    this.$elem.find('.disease-name').text(this._upperFirst(disease.name));
    this.$elem.find('.disease-summary').text(disease.summary);

    // Update target fields
    this.$elem.find('.target-name').text(target.name);

    // Hide pagination while we wait to find out how many articles there are
    this.$elem.find('.pagination .article-stats').addClass('hide');

    updateTargetDetails(this.selector, target);

    this.nextPage();

    this.$elem.modal({ show: true });
  }

  /**
   * Loads the next page of articles.
   */
  nextPage() {
    this.loadPage(this.pageEnd)
      .then(this._updatePrevNextState.bind(this));
  }

  /**
   * Loads the previous page of articles.
   */
  previousPage() {
    this.loadPage(this.pageStart - this.perPage)
      .then(this._updatePrevNextState.bind(this));
  }

  /**
   * Enables / disables the previous and next buttons based upon the current
   * page of results.
   * @private
   */
  _updatePrevNextState() {
    const $previous = this.$elem.find('.pagination .previous');
    const $next = this.$elem.find('.pagination .next');

    if (this.pageStart > 0 ) $previous.removeClass('disabled');
    else $previous.addClass('disabled');

    if (this.hasNext) $next.removeClass('disabled');
    else $next.addClass('disabled');
  }

  /**
   * Load a page beginning at the specified offset.
   *
   * @param start First article to load.
   * @returns {Promise} A Promise that completes when the UI has updated.
   */
  loadPage(start) {
    this.startSpinner();
    const requestTime = new Date().getTime();
    this.lastPageRequestTime = requestTime;

    return ApiHelper.getDiseaseTargetArticles(this.disease.id, this.target.id, start, this.perPage)
      .then((data) => {
        if (requestTime === this.lastPageRequestTime) {
          const $articleStats = this.$elem.find('.pagination .article-stats');
          $articleStats.find('.first-in-page').text(start + 1);
          $articleStats.find('.last-in-page').text(start + data.results.length);
          $articleStats.find('.total-count').text(data.count);
          $articleStats.removeClass('hide');

          this._populateArticleList(data.results);

          this.pageStart = start;
          this.pageEnd = start + data.results.length;
          this.hasNext = !!data.next;

          this.stopSpinner();
        }
      });
  }

  /**
   * Starts the "Loading..." spinner.
   */
  startSpinner() {
    this.$elem.find('.loading-spinner').removeClass('hide');
    this.$elem.find('#article-list').addClass('hide');
  }

  /**
   * Hides the "Loading..." spinner.
   */
  stopSpinner() {
    this.$elem.find('.loading-spinner').addClass('hide');
    this.$elem.find('#article-list').removeClass('hide');
  }

  /**
   * Capitalizes the first letter of a string.
   * @param s
   * @returns {string}
   * @private
   */
  _upperFirst(s) {
    return s[0].toLocaleUpperCase() + s.slice(1);
  }

  /**
   * Updates the DOM to display the articles contained in results.
   *
   * @param results
   * @private
   */
  _populateArticleList(results) {
    const $template = this.$elem.find('.pubmed-article-template').first();
    const $articleList = this.$elem.find('#article-list');
    $articleList.empty();

    const $cards = results.map((article) => {
      const $card = $template.clone();
      $card.removeClass('.pubmed-article-template');

      $card.find('.article-title').text(article.title);
      $card.find('.article-authors').text(article.authors);
      $card.find('.article-journal').text(article.journal);

      const abstractDivId = `pubmed-article-${xss(article.id)}`;

      $card.find('.abstract')
        .attr('id',abstractDivId)
        .find('p')
        .text(article.abstract);

      $card.find('a.collapse-toggle')
        .attr('data-target', `#${abstractDivId}`);

      $card.find('.pubmed-link')
        .attr('href', `https://www.ncbi.nlm.nih.gov/pubmed/${encodeURIComponent(article.id)}/`);

      $card.removeClass('hide');

      return $card;
    });

    $cards.forEach((x) => $articleList.append(x));
  }
}

export default DetailModal;