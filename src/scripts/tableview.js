import $ from "jquery";

import {TabulatorFull as Tabulator} from 'tabulator-tables';
import  "../../node_modules/tabulator-tables/dist/css/tabulator.min.css";

class TableView {
  constructor(mode, selector, searchSelector) {
    this.mode = mode;
    this.selector = selector;
    this.subjectDetails = [];
    this.rowClickHandler = null;
    this.searchSelector = searchSelector;

    this.initTable();

    const that = this;
    $(searchSelector).keyup(function() {
      that.table.setFilter("name", "like", this.value);
    });
  }

  onRowClick(clickHandler) {
    if (this.rowClickHandler !== null)
      throw new Error("A handler for the pointClick event has already been registered.");
    this.rowClickHandler = clickHandler;

  }

  setMode(mode) {
    this.mode = mode;
    this.data = [];
    this.table.setData([]);
    this.initTable();
  }

  initTable() {
    // If we've already initialized the table, destroy it first.
    if (this.table) this.table.destroy();

    // Iniitalize Tabulator
    this.table = new Tabulator(this.selector, {
      maxHeight: $(window).height() * 0.75,
      data: [],
      layout: 'fitColumns',
      columns: this.columns()
    });

    this.table.on('rowClick', (e, row) => this.rowClickHandler(
      {[(this.mode === 'target' ? 'disease' : 'target')]: row.getData()}, this.subjectDetails
    ));
  }

  filterData(filters) {
    const { tdl: tdlFilters = [], idg: idgFilters = [] } = filters;

    const filtered = this.data.filter(d => {
      const { tdl, family } = d;
      if (!tdl || tdlFilters.indexOf(tdl.toLowerCase()) < 0) return false;
      if (!family) {
        return idgFilters.indexOf('uncategorized') >= 0;
      } else {
        return (idgFilters.indexOf(family.toLowerCase()) >= 0);
      }
    });

    this.table.setData(filtered);
  }

  setData(datapoints, subjectDetails) {
    this.subjectDetails = subjectDetails;
    const mapper = this.mode === 'disease'
      ? this.mapDiseasePoint
      : this.mapTargetPoint;

    this.data = datapoints.map(mapper);
    this.updateTable();
  }

  clear() {
    this.data = [];
    this.updateTable();
  }

  updateTable() {
    this.table.setData(this.data);
  }

  columns() {
    return this.mode === "target"
      ? [
        {title: "Name", field: "name"},
        {title: "DOID", field: "doid"},
        {title: "Summary", field: "summary"},
        {title: "Novelty Score", field: "novelty_score"},
        {title: "Importance Score", field: "importance_score"},
      ] : [
        {title: "Name", field: "name"},
        {title: "Sym", field: "sym"},
        {title: "Family", field: "family"},
        {title: "Detailed Family", field: "detailed_family"},
        {title: "TDL", field: "tdl"},
        {title: "Uniprot", field: "uniprot"},
        {title: "dtoID", field: "dtoid"},
        {title: "Novelty Score", field: "novelty_score"},
        {title: "Importance Score", field: "importance_score"},
      ];
  }

  mapDiseasePoint(diseasePoint) {
    const { target }  = diseasePoint;
    return {
      id: target.id,
      name: target.name,
      sym: target.sym,
      family: target.fam,
      detailed_family: target.famext,
      tdl: target.tdl,
      uniprot: target.uniprot,
      dtoid: target.dtoid,
      novelty_score: diseasePoint.x,
      importance_score: diseasePoint.y,
    };
  }

  mapTargetPoint(targetPoint) {
    const { disease } = targetPoint;
    return {
      name: disease.name,
      doid: disease.doid,
      summary: disease.summary,
      novelty_score: targetPoint.x,
      importance_score: targetPoint.y,
    };
  }
}

export { TableView };