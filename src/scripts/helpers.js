class Helpers {
  /**
   * Extracts specified param from URL if it exists.
   *
   * @param {string} param:   URL param to extract
   * @returns {string} The decoded URL param if it exists
   */
  getUrlParam(param) {
    const params = window.location.href.split('?')[1] || '';
    const paramVars = params.split('&').map(x => x.split('='));

    const targetParam = paramVars.find(x => x[0] === param);

    if (targetParam) return decodeURIComponent(targetParam[1]);
  }
}

export default new Helpers();
