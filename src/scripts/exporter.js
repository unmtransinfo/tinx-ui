import $ from 'jquery';
import {TreeViewModes} from "./treeview";

// new imports for Tabulator Tables below
import {TabulatorFull as Tabulator} from 'tabulator-tables';
import  "../../node_modules/tabulator-tables/dist/css/tabulator.min.css";

class Exporter {
  constructor(mode) {
    this.exportChartBtn = $('#export-chart-btn');
    this.exportChartBtn.addClass('disabled');
    this.mode = mode;
    this.subjectDetails = null;
    this.data = null;
    this.filters = {text: null, tags: {idg: null, tdl: null}};
  }

  /**
   * Converts array of datapoints to string used for CSV export
   *
   * @returns {string} String used in CSV export
   */
  convertToCSV() {
    const colDelim = ',';
    const lineDelim = '\n';
    const parsedData = this.mode === TreeViewModes.DISEASE ? this.parseDiseaseData() : this.parseTargetData();
    const keys = Object.keys(parsedData[0]);

    let res = keys.join(colDelim) + lineDelim;

    parsedData.forEach(x => {
      let ctr = 0;
      keys.forEach(key => {
        if (ctr > 0) res += colDelim;

        res += x[key];
        ctr++;
      });
      res += lineDelim;
    });

    return res;
  }

  /**
   * Converts disease plot data (targets) to keys and values used in CSV export. The object keys are
   * used to create CSV column headers, and the values are prepared for insert as a CSV row
   */
  parseDiseaseData() {
    return this.data.map(x => {
      const { x: novelty, y: importance, target } = x;
      return {
        id: target.id,
        name: `"${target.name}"` || '',
        sym: target.sym || '',
        fam: target.fam ? `"${target.fam}"` : '',
        famext: target.famext ? `"${target.famext}"` : '',
        tdl: target.tdl || '',
        uniprot: target.uniprot || '',
        dtoid: target.dtoid || '',
        'novelty_score': novelty,
        'importance_score': importance
      };
    });
  }

  /**
   * Converts target plot data (diseases) to keys and values used in CSV export. The object keys are
   * used to create CSV column headers, and the values are prepared for insert as a CSV row
   */
  parseTargetData() {
    return this.data.map(x => {
      const { x: novelty, y: importance, disease } = x;
      return {
        name: disease.name ? `"${disease.name}"` : '',
        doid: disease.doid,
        summary: disease.summary ? `"${disease.summary}"` : '',
        'novelty_score': novelty,
        'importance_score': importance
      };
    });
  }

  /**
   * Updates current mode
   *
   * @param {string} mode:  new mode
   */
  setMode(mode) {
    this.mode = mode;
    this.exportChartBtn.addClass('disabled');
  }

  /**
   * Updates the Export link with CSV data and filename
   */
  updateLink() {
    if (!this.subjectDetails || !this.data || !this.data.length) return;
    let csv = this.convertToCSV();
    if (!csv || !csv.length) return;

    const filename = this.filename();
    if (!csv.match(/^data:text\/csv/i)) {
      var csvForExport = 'data:text/csv;charset=utf-8,' + csv;
    }

    const data = encodeURI(csvForExport);

    this.exportChartBtn.attr({href: data, download: filename, target: '_blank'});
  }

  /**
   * Updates current data
   *
   * @param {Array<Object>} data:     current data
   * @param {Object} subjectDetails:  current tree-view selection
   */
  setData(data, subjectDetails) {
    this.subjectDetails = subjectDetails;
    this.data = data;
    this.updateLink();
    this.exportChartBtn.removeClass('disabled');
  }

  /**
   * Builds and returns filename for CSV export
   *
   * @returns {string} filename for CSV export
   */
  filename() {
    const { name } = this.subjectDetails;
    if (!name || !name.length) return 'export.csv';

    return `${name.replace(/\s+/g, '_').toLowerCase()}.csv`;
  }
}

export default Exporter;
