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
    this.table = null;
    this.filters = {text: null, tags: {idg: null, tdl: null}};
    this.rowClickHandler = null;
  }

  onRowClick(clickHandler) {
    if (this.rowClickHandler !== null)
      throw new Error("A handler for the pointClick event has already been registered.");
    this.rowClickHandler = clickHandler;
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

  _applyFilters() {
    this.table.clearFilter();
    if(this.filters.tags.tdl)
      this.table.addFilter(...Object.values(this.filters.tags.tdl));
    if(this.filters.tags.idg)
      this.table.addFilter(...Object.values(this.filters.tags.idg));
    if(this.filters.text)
      this.table.addFilter(...Object.values(this.filters.text));
  }

  /**
   * Hides/shows datapoints based on filter status
   *
   * @param {Object} filters:   filter data
   */
  filterData(filters) {
    if(!this.table) return;
    this.filters.tags.idg = {field: 'family', type: 'keywords', value: filters.idg.join(' ')};
    this.filters.tags.tdl = {field: 'tdl', type: 'keywords', value: filters.tdl.join(' ')};
    this._applyFilters();
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
    const that = this;
    let csv = this.convertToCSV();
    if (!csv || !csv.length) return;

    const filename = this.filename();
    if (!csv.match(/^data:text\/csv/i)) {
      var csvForExport = 'data:text/csv;charset=utf-8,' + csv;
    }

    const data = encodeURI(csvForExport);

    this.exportChartBtn.attr({href: data, download: filename, target: '_blank'});

    //Tabulator Table search
var fieldEl = "name";
var typeEl = "like";
var valueEl = document.getElementById("search-input");

//Custom filter applied to the Name field based on the typed User input
function customFilter(data){
    return data.name < 3;
}

//Trigger setFilter function with correct parameters
function updateFilter(){
    var filterValues = table.getColumns();
    var typeVal = "like";
    // Sub array for OR comparison
    var filters = [[]];

    filterValues.forEach(val => {
        filters[0].push({
          field: val.getDefinition().field,
          type: typeVal,
          value: valueEl.value
        });
    });

    if(filters.length){
        table.setFilter(filters, typeVal, valueEl.value);
    }
}

//Update filters on value change
document.getElementById("search-input").addEventListener("keyup", updateFilter);

//Clear filters on "Clear Filters" button click
document.getElementById("filter-clear").addEventListener("click", function(){
  table.clearFilter();
});

  const removeHeader = (header, csv) => {
    const searchString = header.map(val => val.field).join(',');
    // Have to remove the trailing \n in addition to the headers
    const headlessCsv = csv.slice(searchString.length + 1);
    return headlessCsv;
  };

// initiate Tabulator table, depending on the mode (disease or target)
// first check the mode (disease or target)

const height = $(window).height() * 0.75;

if (this.mode == "disease") {
  const columns = [
    {title:"Name", field:"name"},
    {title:"Sym", field:"sym"},
    {title:"Family", field:"family"},
    {title:"Detailed Family", field:"detailed_family"},
    {title:"TDL", field:"tdl"},
    {title:"Uniprot", field:"uniprot"},
    {title:"dtoID", field:"dtoid"},
    {title:"Novelty Score", field:"novelty_score"},
    {title:"Importance Score", field:"importance_score"},
  ];
var csvData = removeHeader(columns, csv);;
var table = new Tabulator("#example-table", {
        maxHeight:height,
        data:csvData,
        layout:"fitColumns",
        importFormat:"csv",
        columns,
});
}

if (this.mode == "target") {
  const columns = [
    {title:"Name", field:"name"},
    {title:"DOID", field:"doid"},
    {title:"Summary", field:"summary"},
    {title:"Novelty Score", field:"novelty_score"},
    {title:"Importance Score", field:"importance_score"},
  ];
var csvData = removeHeader(columns, csv);
var table = new Tabulator("#example-table", {
        maxHeight:height,
        data:csvData,
        layout:"fitColumns",
        importFormat:"csv",
        columns,
});

    if (this.mode == "target") {
      var csvData = csv;
      var table = new Tabulator("#example-table", {
              height:405,
              data:csvData,
              layout:"fitDataFill",
              importFormat:"csv",
              columns:[
                {title:"Name", field:"name"},
                {title:"DOID", field:"doid"},
                {title:"Summary", field:"summary"},
                {title:"Novelty Score", field:"novelty_score"},
                {title:"Importance Score", field:"importance_score"},
               ],
      });
    }
    this.table = table;


    table.on(
        "rowClick",
        (e, row) =>
            this.rowClickHandler({[(this.mode === 'target' ? 'disease' : 'target')] : row.getData()},this.subjectDetails));
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
