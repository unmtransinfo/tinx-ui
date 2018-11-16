import ApiHelper from './apihelper';
import { TreeViewModes } from "./treeview";

// Singleton
class Typeaheads {
  init(treeView, scatterplot) {
    this.mode = treeView.mode;
    this.scatterplot = scatterplot;
    this.initTreeViewSearch(treeView);
  }

  setMode(mode) {
    this.mode = mode;
  }

  initTreeViewSearch(treeView) {
    $('#tree-view-search').typeahead({
      source: (query, callback) => {
        if (this.mode === TreeViewModes.DISEASE) {
          ApiHelper.findDisease(query)
            .then((x) => x.results)
            .then(callback);
        }
        else if (this.mode === TreeViewModes.TARGET) {
          ApiHelper.findTarget(query, true)
            .then(data => data.results)
            .then(callback);
        }
      },
      displayText: (x) => `${x.name.charAt(0).toLocaleUpperCase() + x.name.slice(1)}`,
      afterSelect: (x) => {
        // start loading plot for selection
        this.scatterplot.loadPlot(this.mode, x.id, x);
        // expand the tree view to selected node
        if (this.mode === TreeViewModes.DISEASE) treeView.expandToNode(x.id, true);
        else ApiHelper.getDTO(x.dtoid).then(data => treeView.expandToNode(data, true));
      }
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
