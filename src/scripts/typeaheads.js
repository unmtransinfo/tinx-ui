import ApiHelper from './apihelper';
import { TreeViewModes } from "./treeview";

// Singleton
class Typeaheads {
  init(treeView) {
    this.mode = treeView.mode;
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

  /**
   * Initializes data search functionality
   *
   * @param {Array<Object>} data:   datapoints
   * @param {Function} onSelect:    callback invoked on option select
   */
  initDataSearch(data, onSelect) {
    const input = $('#search-input');
    const typeahead = input.data('typeahead');

    const placeholder = this.mode === TreeViewModes.DISEASE ? 'Search for a target...' : 'Search for a disease...';
    input.attr('placeholder', placeholder);

    if (typeahead) {
      typeahead.source = data;
    }
    else {
      input.typeahead({
          source: data,
          displayText: x => x.target.name,
          afterSelect: x => {
              if (onSelect) onSelect(x);
              input.val('');
          }
      });
    }
  }
}

export default new Typeaheads();
