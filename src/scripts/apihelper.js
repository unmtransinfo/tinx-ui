import config from '../config';

/**
 * A helper to facilitate requests to the TIN-X API.
 *
 * @Singleton
 */
class ApiHelper {
  /**
   * Makes a request to the TIN-X API and returns a Promise with the response.
   *
   *
   * @param {Object} args - The arguments used to make the request.
   * @param {string} args.method - The request method (e.g., "GET" or "POST")
   * @param {string} args.endpoint - The endpoint to request, which may contain :parameters to substitute
   * @param {Object} [args.data] - Payload data to submit as a post body or url parameters
   * @param {Object} [args.params] - Parameters to substitute in the endpoint URL.
   * @returns {Promise<any>} The response
   */
  makeRequest(args) {
    const { method, endpoint, data = {}, params = {} } = args;

    // Substitute any url params in endpoint
    let endpointWithParams = endpoint;
    Object.keys(params).forEach((k) =>
      endpointWithParams = endpointWithParams
        .split(`:${k}`)
        .join(encodeURIComponent(params[k]))
    );

    // Create the final URL to request
    const url = `${config.API_ROOT}${endpointWithParams}`;

    return this.makeSimpleRequest(url, method, data);
  }

  /**
   * Makes a request to the TIN-X API and returns a Promise with the response.
   *
   * @param {string} url:     full URL of the endpoint to hit
   * @param {string} method:  request method
   * @param {Object} data:    payload data to submit as a post body or url parameters
   * @returns {Promise<any>} The response
   */
  makeSimpleRequest(url, method, data = {}) {
    return new Promise((resolve, reject) =>
      $.ajax({
        url: url,
        method: method,
        data: data,
        success: resolve,
        error: reject
      })
    );
  }

  /**
   * Retrieves the children of the given disease.
   *
   * @param diseaseId - The ID of the disease whose children should be returned.
   * @returns {Promise<any>}
   */
  getDiseaseChildren(diseaseId) {
    return this.makeRequest({
      method: 'GET',
      endpoint: '/diseases/:diseaseId/children/',
      params: { diseaseId }
    });
  }

  /**
   * Gets a single disease by DOID. If no disease matches that identifier (or
   * multiple do, which shouldn't happen), returns null.
   *
   * @param doid The disease ontology ID (DOID) to look up.
   * @returns {Promise<any | never>} A promise containing an object or null.
   */
  getDiseaseByDOID(doid) {
    return this.makeRequest({
      method: 'GET',
      endpoint: '/diseases/',
      data: {doid}
    }).then(data => 'results' in data && data.results.length === 1
          ? data.results[0]
          : null
    );
  }

  /**
   * Searches for a disease.
   * @param query The search query to use to find a disease.
   * @returns {Promise<any>}
   */
  findDisease(query) {
    return this.makeRequest({
      method: 'GET',
      endpoint: '/diseases/',
      data: {search: query}
    });
  }

  /**
   * Retrieves the specified disease
   *
   * @param {string} diseaseId:   target disease ID
   * @returns {Promise<any>}
   */
  getDisease(diseaseId) {
    return this.makeRequest({
      method: 'GET',
      endpoint: '/diseases/:diseaseId',
      params: { diseaseId }
    });
  }

  /**
   * Gets the parent of a disease.
   * @param diseaseId
   * @returns {Promise<any>}
   */
  getDiseaseParent(diseaseId) {
    return this.makeRequest({
      method: 'GET',
      endpoint: '/diseases/:diseaseId/parent/',
      params: { diseaseId }
    });
  }

  getDiseaseTargets(disease, limit = 100, offset = 0) {
    if ('id' in disease)
      return this.makeRequest({
        method: 'GET',
        endpoint: '/diseases/:diseaseId/targets/',
        params: { diseaseId: disease.id },
        data: { limit, offset }
      });
    else if ('targets' in disease)
      return this.makeSimpleRequest('GET', disease.targets);
  }

  getSearchResults(query, type) {
    return this.makeRequest({
      method: 'GET',
      endpoint: '/search/?type=:type&q=:query',
      params: {type, query}
    });
  }

  getDiseaseTargetArticles(diseaseId, targetId, offset = 0, limit=5) {
    return this.makeRequest({
      method: 'GET',
      endpoint: '/diseases/:diseaseId/targets/:targetId/articles',
      params: { diseaseId, targetId },
      data: {limit, offset}
    });

  }

  getDTOs(hasParent = null) {
    const data = hasParent ? {'has_parent': hasParent} : {};
    return this.makeRequest({
      method: 'GET',
      endpoint: '/dto/',
      data
    });
  }

  getDTO(dtoId) {
    return this.makeRequest({
      method: 'GET',
      endpoint: '/dto/:dtoId/',
      params: { dtoId }
    });
  }

  getDTOChildren(dtoId) {
    return this.makeRequest({
      method: 'GET',
      endpoint: '/dto/:dtoId/children/',
      params: { dtoId }
    });
  }

  getTargetDiseases(targetId, limit = 100, offset = 0) {
    return this.makeRequest({
      method: 'GET',
      endpoint: '/targets/:targetId/diseases/',
      params: { targetId },
      data: { limit, offset }
    });
  }

  getDTOParent(parentUrl) {
    // Bit of a kludge. The API sometimes gives back HTTP URLS. In that case,
    // we want to convert these to HTTPS (if we're talking to production).
    if (config.API_ROOT.substr(0, 5) === 'https' && parentUrl.substr(0,5) === 'http:')
      parentUrl = parentUrl.substr(0, 4) + 's' + parentUrl.substr(4);

    return this.makeSimpleRequest(parentUrl, 'GET');
  }

  findTarget(query, inDto) {
    const data = {search: query};
    if (inDto) data['in_dto'] = 2;
    return this.makeRequest({
      method: 'GET',
      endpoint: '/targets/',
      data
    });
  }
}

export default new ApiHelper();
