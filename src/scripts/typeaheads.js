import ApiHelper from './apihelper';
import { TreeViewModes } from "./treeview";

// Singleton
class Typeaheads {
  init(treeView, scatterplot) {
    this.mode = treeView.mode;
    this.scatterplot = scatterplot;
    this.treeViewSearch = $('#tree-view-search');
    this.dataSearch = $('#search-input');
    this.initTreeViewSearch(treeView);
  }

  setMode(mode) {
    this.mode = mode;
    this.updateInputs();
  }

  initTreeViewSearch(treeView) {
    this.treeViewSearch.typeahead({
      source: (query, callback) => {
        if (this.mode === TreeViewModes.DISEASE) {
          ApiHelper.getSearchResults(query, TreeViewModes.DISEASE)
            .then((data) => {
              const converted_data = [];
              data.forEach(element => {
                converted_data.push({
                  text: element.text.replace('[\'', '').replace('\']', ''),
                  doid: element.doid.replace('[\'', '').replace('\']', ''),
                  doid_exact: element.doid_exact.replace('[\'', '').replace('\']', ''),
                  name: element.name.replace('[\'', '').replace('\']', ''),
                  summary: element.summary.replace('[\'', '').replace('\']', ''),
                });
              });
              return converted_data;
            })
            .then(callback);
        }
        else if (this.mode === TreeViewModes.TARGET) {
          ApiHelper.getSearchResults(query, TreeViewModes.TARGET)
            .then(data => data)
            .then(callback);
        }
      },
      matcher: () => true,
      items: 15,
      displayText: (x) => `${x.name.charAt(0).toLocaleUpperCase() + x.name.slice(1)}`,
      afterSelect: (x) => {
        this.treeViewSearch.val('');
        treeView.setWasBackPressed(false);
        this.scatterplot.clear();
        this.scatterplot.startSpinner();

        // TODO For some reason, the code that loads the chart right away got deleted ...
        // What we should do is load the chart, then pass plotLoaded as true.
        if (this.mode === TreeViewModes.DISEASE) treeView.expandToNode(x, false);
        else ApiHelper.getDTO(x.dtoid).then(data => treeView.expandToNode(data, false));
      }
    });

    this.updateInputs();
  }

  /**
   * Updates placeholder and aria-label for typeahead inputs
   */
  updateInputs() {
    if (this.mode === TreeViewModes.DISEASE) {
      this.setAttrs(this.treeViewSearch, 'Search for a disease...');
      this.setAttrs(this.dataSearch, 'Search for a target...');
    }
    else if (this.mode === TreeViewModes.TARGET) {
      this.setAttrs(this.treeViewSearch, 'Search for a target...');
      this.setAttrs(this.dataSearch, 'Search for a disease...');
    }
  }

  /**
   * Sets placeholder and aria-label for provided input to the specified value
   *
   * @param {Object} input:   input to update
   * @param {string} value:   string to use as placeholder and aria-label
   */
  setAttrs(input, value) {
    input.attr('placeholder', value);
    input.attr('aria-label', value);
  }

  /**
   * Initializes data search functionality
   *
   * @param {Array<Object>} data:   datapoints
   * @param {Function} onSelect:    callback invoked on option select
   */
  initDataSearch(data, onSelect) {
    const typeahead = this.dataSearch.data('typeahead');

    if (typeahead) {
      typeahead.source = data;
    }
    else {
      this.dataSearch.typeahead({
          source: data,
          displayText: x => {
            const { target, disease } = x;
            if (target) return target.name;
            return disease.name;
          },
          afterSelect: x => {
            if (onSelect) onSelect(x);
            this.dataSearch.val('');
          }
      });
    }

    this.updateInputs();
  }
}

export default new Typeaheads();
