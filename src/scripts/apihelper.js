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
      endpointWithParams = endpointWithParams.split(`:${k}`).join(params[k])
    );

    // Create the final URL to request
    const url = `${config.API_ROOT}${endpointWithParams}`;

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
      params: { diseaseId: diseaseId }
    });
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
   * Gets the parent of a disease.
   * @param diseaseId
   * @returns {Promise<any>}
   */
  getDiseaseParent(diseaseId) {
    return this.makeRequest({
      method: 'GET',
      endpoint: '/diseases/:diseaseId/parent/',
      params: { diseaseId: diseaseId }
    });
  }

  getDiseaseTargets(diseaseId, limit = 100, offset = 0) {
    return this.makeRequest({
      method: 'GET',
      endpoint: '/diseases/:diseaseId/targets/',
      params: { diseaseId: diseaseId },
      data: { limit: limit, offset: offset }
    });
  }
}

export default new ApiHelper();
