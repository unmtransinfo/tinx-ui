import TomSelect from "tom-select";
import ApiHelper from "./apihelper";
import { TreeViewModes } from "./treeview";

// Singleton
class Typeaheads {
  init(treeView, scatterplot) {
    this.mode = treeView.mode;
    this.scatterplot = scatterplot;
    this._treeSearch = null;
    this._dataSearch = null;
    this.initTreeViewSearch(treeView);
  }

  setMode(mode) {
    this.mode = mode;
    this.updateInputs();
  }

  initTreeViewSearch(treeView) {
    const el = document.getElementById("tree-view-search");

    this._treeSearch = new TomSelect(el, {
      valueField: "_tsId",
      labelField: "name",
      searchField: ["name"],
      maxOptions: 15,
      // Only fire the remote load once the user has typed something
      shouldLoad: (query) => query.length > 0,
      load: (query, callback) => {
        ApiHelper.getSearchResults(query, this.mode)
          .then((data) => {
            // Attach a stable unique key so Tom Select can track options
            const tagged = data.map((item, i) =>
              Object.assign({}, item, {
                _tsId: `${item.doid || item.dtoid || item.name || i}`,
              }),
            );
            callback(tagged);
          })
          .catch(() => callback([]));
      },
      render: {
        option: (item) => {
          const name = item.name
            ? item.name.charAt(0).toLocaleUpperCase() + item.name.slice(1)
            : item._tsId;
          return `<div class="option">${name}</div>`;
        },
      },
      onItemAdd: (value) => {
        const item = this._treeSearch.options[value];
        // Reset the input immediately so it is ready for the next search
        this._treeSearch.clear(true);
        this._treeSearch.clearOptions();
        this._treeSearch.close();

        treeView.setWasBackPressed(false);
        this.scatterplot.clear();
        this.scatterplot.startSpinner();
        // TODO For some reason, the code that loads the chart right away got deleted ...
        // What we should do is load the chart, then pass plotLoaded as true.
        if (this.mode === TreeViewModes.DISEASE) {
          treeView.expandToNode(item, false);
        } else {
          ApiHelper.getDTO(item.dtoid).then((data) =>
            treeView.expandToNode(data, false),
          );
        }
      },
    });

    this.updateInputs();
  }

  /**
   * Updates placeholder and aria-label for both typeahead inputs.
   */
  updateInputs() {
    const [treePlaceholder, dataPlaceholder] =
      this.mode === TreeViewModes.DISEASE
        ? ["Search for a disease...", "Search for a target..."]
        : ["Search for a target...", "Search for a disease..."];

    if (this._treeSearch) {
      this._setTsPlaceholder(this._treeSearch, treePlaceholder);
    }

    if (this._dataSearch) {
      this._setTsPlaceholder(this._dataSearch, dataPlaceholder);
    } else {
      // initDataSearch hasn't been called yet — update the raw input directly
      const rawInput = document.getElementById("search-input");
      if (rawInput) {
        rawInput.setAttribute("placeholder", dataPlaceholder);
        rawInput.setAttribute("aria-label", dataPlaceholder);
      }
    }
  }

  /**
   * Sets placeholder and aria-label on a TomSelect instance's visible input.
   *
   * @param {TomSelect} ts
   * @param {string} value
   */
  _setTsPlaceholder(ts, value) {
    ts.control_input.setAttribute("placeholder", value);
    ts.control_input.setAttribute("aria-label", value);
  }

  /**
   * Initializes (or refreshes) data search functionality.
   * Safe to call multiple times — re-uses the existing Tom Select instance
   * and simply swaps the option set.
   *
   * @param {Array<Object>} data:   datapoints
   * @param {Function} onSelect:    callback invoked on option select
   */
  initDataSearch(data, onSelect) {
    const tagged = this._tagData(data);

    if (this._dataSearch) {
      // Swap the option set without re-creating the widget
      this._dataSearch.clearOptions();
      this._dataSearch.addOptions(tagged);
      this.updateInputs();
      return;
    }

    const el = document.getElementById("search-input");

    this._dataSearch = new TomSelect(el, {
      valueField: "_tsId",
      labelField: "_displayName",
      searchField: ["_displayName"],
      maxOptions: 50,
      options: tagged,
      render: {
        option: (item) => `<div class="option">${item._displayName}</div>`,
      },
      onItemAdd: (value) => {
        const item = this._dataSearch.options[value];
        this._dataSearch.clear(true);
        if (onSelect) onSelect(item);
      },
    });

    this.updateInputs();
  }

  /**
   * Annotates each datapoint with the fields Tom Select needs:
   *   _tsId          — stable unique key (index-based)
   *   _displayName   — the label shown in the dropdown
   *
   * @param {Array<Object>} data
   * @returns {Array<Object>}
   */
  _tagData(data) {
    return data.map((item, i) => {
      const { target, disease } = item;
      const displayName = target
        ? target.name
        : disease
          ? disease.name
          : `item-${i}`;
      return Object.assign({}, item, {
        _tsId: String(i),
        _displayName: displayName,
      });
    });
  }
}

export default new Typeaheads();
