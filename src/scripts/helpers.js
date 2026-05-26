class Helpers {
  /**
   * Extracts specified param from URL if it exists.
   *
   * @param {string} param:   URL param to extract
   * @returns {string} The decoded URL param if it exists
   */
  getUrlParam(param) {
    const url = new URL(window.location.href);
    const value = url.searchParams.get(param);
    return value === null ? undefined : value;
  }
}

export default new Helpers();
