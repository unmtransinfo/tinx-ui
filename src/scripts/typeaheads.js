import ApiHelper from './apihelper';

// Singleton
class Typeaheads {
  init(treeView) {
    this.initTreeViewSearch(treeView);
  }

  initTreeViewSearch(treeView) {
    $('#tree-view-search').typeahead({
      source: (query, callback) => {
        ApiHelper.findDisease(query)
          .then((x) => x.results)
          .then(callback);
      },
      displayText: (x) => `${x.name.charAt(0).toLocaleUpperCase() + x.name.slice(1)}`,
      afterSelect: (x) => treeView.expandToNode(x.id)
    });
  }
}

export default new Typeaheads();
