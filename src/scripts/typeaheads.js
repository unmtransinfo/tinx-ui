// Singleton
class Typeaheads {
  init() {
    this.initTreeViewSearch();
  }

  initTreeViewSearch() {
    $('#tree-view-search').typeahead({
      source: (query, callback) => {
        const ret = $.ajax({
          url: 'http://127.0.0.1:8000/diseases',
          data: {
            search: query
          },
          success: (data) => {
            callback(data.results);
          }
        });
      },
      displayText: (x) => `${x.name}`
    });
  }
}

export default new Typeaheads();
