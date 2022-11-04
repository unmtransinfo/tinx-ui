import ApiHelper from './apihelper';
import { ROOT_NODE } from "./constants";

/**
 * Possible modes for the TreeView.
 *
 * @type {{DISEASE: string, TARGET: string}}
 */
const TreeViewModes = {
  DISEASE: 'disease',
  TARGET: 'target'
};

/**
 * A TreeView is a dynamic tree of nodes that the user can click to expand or
 * collapse, which reveals or hides the node's children.
 */
class TreeView {

  /**
   *
   * @param {string} selector - A jQuery selector to use for finding the element to use as a TreeView
   * @param {string} initialMode - The initial mode of this TreeView. See `TreeViewModes`
   */
  constructor(selector, initialMode = TreeViewModes.DISEASE) {
    this.$elem = $(selector);
    this.mode = initialMode;
    this.rootNodeId = null;
    this.wasBackPressed = false;
  }

  /**
   * Initializes the TreeView.
   */
  init() {
    this.$elem.empty();

    return this._getRootNodes().then(data => {
      if (data && Array.isArray(data)) return this.appendTreeItems(data, ROOT_NODE);
      const { results = [] } = data;
      this.appendTreeItems(results, ROOT_NODE);
    });
  }

  /**
   * Updates the tree view mode ('disease' or 'target') and re-initializes
   *
   * @param {string} mode:    new mode
   */
  setMode(mode) {
    this.mode = mode;
    this.init();
  }

  /**
   * Informs the tree view of whether the back button was pressed since the last
   * URL change.
   * @param b
   */
  setWasBackPressed(b) {
    this.wasBackPressed = b;
  }

  getWasBackPressed() {
    return this.wasBackPressed;
  }

  /**
   * Collapse all currently expanded nodes.
   */
  collapseAll() {
    const that = this;
    this.$elem.find('li.tree-node.collapsible')
      .each(function() { that._toggleNodeCollapse($(this)); });
  }

  /**
   * Expand the TreeView to the node with a specific ID and mark that node as
   * selected.
   *
   * @param {Object|number} nodeData:  Data for the node to which to expand the TreeView. Will be
   *                                   a number if in Disease mode, or an object if in Target mode
   * @param {boolean?} plotLoaded:     Whether or not we have begun loading the plot for selected node
   */
  expandToNode(nodeData, plotLoaded = false) {
    this.collapseAll();
    this.$elem.find('li.tree-node.selected').removeClass('selected');
    const idVal = this.mode === TreeViewModes.DISEASE ? 'nodeDOID' : 'nodeId';
    const getAncestors = this.mode === TreeViewModes.DISEASE ?
      this._getDiseaseAncestorIds.bind(this):
      this._getDtoAncestorIds.bind(this);

    const nodeId = this.mode === TreeViewModes.DISEASE ?
        nodeData.doid :
        nodeData;

    // Get the list of ancestors for this node. Then expand each one
    getAncestors(nodeId).then((ids) => {
      // We're going to continually add new tasks to the end of this promise
      let promise = Promise.resolve();

      ids.forEach((id) => {
        promise = promise.then( () => {
          // Find the node for this node ID
          const $node = this.$elem.find('li.tree-node').filter(function() {
            return $(this).data(idVal) === id;
          });
          // If it's the node to which we're expanding, mark it selected
          const nodeId = this.mode === TreeViewModes.DISEASE ? nodeData.doid : nodeData.id;

          if ($node.data(idVal) === nodeId)
            this._select($node, plotLoaded);

          // Expand the node
          return this._toggleNodeCollapse($node);
        });
      });

      return promise;
    });
  }

  /**
   * Specifies the function to execute when the selection changes.
   * @param func
   */
  onSelectionChange(func) {
    this.selectionChangeHandler = func;
  }

  appendTreeItems(data, itemClass = null) {
    data.forEach(item => {
      this.$elem.append(this._makeListItem(item, itemClass));
    });
  }

  /**
   * Retrieve the ID of the root node for the current mode.
   * @private
   */
  _getRootNodeId() {
    if (this.rootNodeId !== null && typeof this.rootNodeId !== 'undefined')
      return Promise.resolve(this.rootNodeId);

    switch (this.mode) {
      case TreeViewModes.DISEASE:
        return ApiHelper.getDiseaseByDOID('DOID:4')
          .then(disease => this.rootNodeId = disease.doid); // Assign and return
      case TreeViewModes.TARGET:
        return Promise.resolve(0);
      default: throw `Unknown TreeViewMode: ${this.mode}`;
    }
  }

  _getRootNodes() {
    switch (this.mode) {
      case TreeViewModes.DISEASE:
        return this._getRootNodeId().then(id => ApiHelper.getDiseaseChildren(id).then(res => res) );
      case TreeViewModes.TARGET:
        return ApiHelper.getDTOChildren('PR:000000001');
      default: throw `Unknown TreeViewMode: ${this.mode}`;
    }
  }

  /**
   * Retrieve the children of the given ID for the current mode.
   * @private
   */
  _getChildren(id) {
    switch (this.mode) {
      case TreeViewModes.DISEASE: return ApiHelper.getDiseaseChildren(id);
      case TreeViewModes.TARGET: return ApiHelper.getDTOChildren(id);
      default: throw `Unknown TreeViewMode: ${this.mode}`;
    }
  }

  /**
   * Creates a list item (a tree node) fro the corresponding object, which
   * must have a name and ID property.
   *
   * @param obj The object for which to create the list item.
   * @param {string?} itemClass: optional class for this list item
   * @returns {*|jQuery} The node, as a jQuery element.
   * @private
   */
  _makeListItem(obj, itemClass = null) {
    if(!obj.id) return;

    const that = this;
    const onClick = (event) => {
      event.stopPropagation();
      const $target = $(event.currentTarget);
      that.setWasBackPressed(false);
      this._toggleNodeCollapse($target);
      this.$elem.find('li.tree-node.selected').removeClass('selected');
      this._select($target);
    };

    // Capitalize the first letter of the object's name
    const capitalName = obj.name[0].toLocaleUpperCase() + obj.name.slice(1);

    let childCount = null;
    if (this.mode === TreeViewModes.DISEASE) {
      childCount = obj.num_important_targets;
    }
    else if (this.mode === TreeViewModes.TARGET) {
      const { target } = obj;
      if (target && Array.isArray(target) && target.length) childCount = target[0].num_important_diseases;
    }

    const listItem = $("<li>")
      .addClass(`expandable tree-node`)
      .data({ nodeId: obj.id, nodeDOID: obj.doid, mode: this.mode, details: obj })
      .click(onClick.bind(this))
      .append(
        $("<span>").addClass("btn").text(capitalName)
      );

    // add child count to node if it is not a root node
    if (itemClass !== ROOT_NODE) {
      listItem.find('span.btn').append(
        $("<span>").addClass("badge badge-light").text(childCount)
      );
    }

    if (itemClass && itemClass.length) listItem.addClass(itemClass);

    return listItem;
  }

  /**
   * Retrieve an array containing the IDs of all ancestors (in order from top
   * to bottom) of the given disease ID.
   *
   * @param {int} id - The ID whose ancestors we want to find.
   * @returns {Promise} - A Promise of an array of IDs.
   * @private
   */
  _getDiseaseAncestorIds(id) {
    const addParents = (id, ls) => {
      ls.unshift(id);
      return ApiHelper.getDiseaseParent(id).then(parent => {
        const { parent_id } = parent;
        return this._getRootNodeId().then(rootNodeId => {
          if (parent_id && parent_id !== rootNodeId) return addParents(parent_id, ls);
          return ls;
        });
      });
    };

    return addParents(id, []);
  }

  /**
   * Retrieve an array containing the IDs of all ancestors (in order from top
   * to bottom) of the given DTO.
   *
   * @param {Object} dto - The  DTO whose ancestors we want to find.
   * @param {number} dto.id - The DTO's ID
   * @param {string} dto.parent - URL pointing to the DTO's parent
   * @returns {Promise} - A Promise of an array of IDs.
   * @private
   */
  _getDtoAncestorIds(dto) {

    const addParents = (data, ls) => {
      const { id, parent: parentUrl } = data;
      ls.unshift(id);

      return ApiHelper.getDTOParent(parentUrl).then(parentDto => {
        const { parent: newParentUrl } = parentDto;
        if (newParentUrl && newParentUrl.length) return addParents(parentDto, ls);

        ls.unshift(parentDto.id);
        return ls;
      });
    };

    return addParents(dto, []);
  }

  /**
   * Expand or collapse the given node.
   *
   * @param $target - The node to expand or collapse.
   * @returns {Promise} - A Promise that resolves when the task is complete and all children are loaded.
   * @private
   */
  _toggleNodeCollapse($target) {
    const id = this.mode === TreeViewModes.DISEASE ? $target.data('nodeDOID') : $target.data('nodeId');

    if ($target.hasClass('expandable')) {
      $target.removeClass('expandable').addClass('collapsible');
      // If the children have been loaded, make them visible.
      $target.find('ul').removeClass('hide');

      // If the children haven't been loaded, load them
      if (!$target.find('ul').length) {
        $target.append(
          $('<ul class="spinner-container">')
            .append($('<li class="tree-node">')
              .append($('.loading-spinner').first().clone().removeClass('hide'))
            )
        );
        return this._getChildren(id).then((data) => {
          $target.append($("<ul>").append(data.map(this._makeListItem.bind(this))));
          $target.find('ul.spinner-container').remove();
        });
      }
    } else if ($target.hasClass('collapsible')) {
      $target.removeClass('collapsible').addClass('expandable');
      $target.find('ul').addClass('hide');
    }

    return Promise.resolve();
  }

  _select($node, plotLoaded = false) {
    $node.addClass('selected');
    this.selectionChangeHandler($node.data(), $node, plotLoaded);
  }
}

export { TreeView, TreeViewModes };
