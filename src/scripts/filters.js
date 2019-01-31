import {TreeViewModes} from "./treeview";
import $ from 'jquery';

class Filters {
  constructor(mode, onUpdate) {
    this.reset();
    this.init();
    this.onUpdate = onUpdate;
    this.mode = mode;
    this.filterDropdown = $('#filter-dropdown');
  }

  init() {
    const that = this;

    $('.dropdown-menu a').click(function(event) {
      const $target = $(event.currentTarget),
        value = $target.data('value'),
        type = $target.data('type'),
        $inp = $target.find('input');

      const selectedIdx = that.selected[type].indexOf(value);
      if (selectedIdx >= 0) {
        that.selected[type].splice(selectedIdx, 1);
        setTimeout(() => { $inp.prop('checked', false); }, 0);
      }
      else {
        that.selected[type].push(value);
        setTimeout(() => { $inp.prop('checked', true); }, 0);
      }

      if (that.onUpdate) that.onUpdate(that.selected);

      $( event.target ).blur();
      return false;
    });
  }

  reset() {
    this.selected = {
      tdl: ['tclin', 'tbio', 'tdark', 'tchem'],
      idg: ['gpcr', 'ogpcr', 'ion', 'kinase', 'nr', 'enzyme', 'epigenetic', 'tf', 'tf; epigenetic', 'transporter', 'uncategorized']
    };

    $.each($('#filter-menu').find('input'), function(idx, val) {
      $(val).prop('checked', true);
    });
  }

  setMode(mode) {
    this.mode = mode;
    if (this.mode === TreeViewModes.DISEASE) this.filterDropdown.show();
    else this.filterDropdown.hide();
  }
}

export default Filters;