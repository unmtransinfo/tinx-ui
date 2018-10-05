import ApiHelper from './apihelper';

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
  }

  /**
   * Initializes the TreeView.
   */
  init() {
    this.$elem.empty();
    return this._getChildren(this._rootNodeId())
      .then((data) => {
        data.forEach((disease) =>
          this.$elem.append(this._makeListItem(disease))
        );
      });
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
   * @param nodeId The node to which to expand the TreeView.
   */
  expandToNode(nodeId) {
    this.collapseAll();
    this.$elem.find('li.tree-node.selected').removeClass('selected');

    // Get the list of ancestors for this node. Then expand each one
    this._getAncestorIds(nodeId).then((ids) => {
      // We're going to continually add new tasks to the end of this promise
      let promise = Promise.resolve();

      ids.forEach((id) => {
        promise = promise.then( () => {
          // Find the node for this node ID
          const $node = this.$elem.find('li.tree-node').filter(function() {
            return $(this).data('nodeId') === id;
          });

          // If it's the node to which we're expanding, mark it selected
          if ($node.data('nodeId') === nodeId)
            $node.addClass('selected');

          // Expand the node
          return this._toggleNodeCollapse($node);
        });
      });

      return promise;
    });
  }

  /**
   * Retrieve the ID of the root node for the current mode.
   * @private
   */
  _rootNodeId() {
    switch (this.mode) {
      case TreeViewModes.DISEASE: return 5688;  // TODO: We can't hardcode this
      case TreeViewModes.TARGET: return 0;
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
      default: throw `Unknown TreeViewMode: ${this.mode}`;
    }
  }

  /**
   * Creates a list item (a tree node) fro the corresponding object, which
   * must have a name and ID property.
   *
   * @param obj The object for which to create the list item.
   * @returns {*|jQuery} The node, as a jQuery element.
   * @private
   */
  _makeListItem(obj) {
    const onClick = (event) => {
      event.stopPropagation();
      const $target = $(event.currentTarget);
      this._toggleNodeCollapse($target);
      this.$elem.find('li.tree-node.selected').removeClass('selected');
      $target.addClass('selected');
    };

    // Capitalize the first letter of the object's name
    const capitalName = obj.name[0].toLocaleUpperCase() + obj.name.slice(1);

    return $("<li>")
      .addClass("expandable tree-node")
      .data({ nodeId: obj.id, mode: this.mode })
      .click(onClick.bind(this))
      .append( $("<span>").addClass("btn").text(capitalName) );
  }

  /**
   * Retrieve an array containing the IDs of all ancestors (in order from top
   * to bottom) of the given ID.
   *
   * @param {int} id - The ID whose ancestors we want to find.
   * @returns {Promise} - A Promise of an array of IDs.
   * @private
   */
  _getAncestorIds(id) {
    const getParent = this.mode === TreeViewModes.DISEASE
      ? ApiHelper.getDiseaseParent.bind(ApiHelper)
      : undefined;

    const addParents = (id, ls) => {
      ls.unshift(id);
      return getParent(id).then((parent) => {
        if (parent.id && parent.id !== this._rootNodeId()) return addParents(parent.id, ls);
        else return ls;
      });
    };

    return addParents(id, []);
  }

  /**
   * Expand or collapse the given node.
   *
   * @param $target - The node to expand or collapse.
   * @returns {Promise} - A Promise that resolves when the task is complete and all children are loaded.
   * @private
   */
  _toggleNodeCollapse($target) {
    const id = $target.data('nodeId');

    if ($target.hasClass('expandable')) {
      $target.removeClass('expandable').addClass('collapsible');
      // If the children have been loaded, make them visible.
      $target.find('ul').removeClass('hide');

      // If the children haven't been loaded, load them
      if (!$target.find('ul').length) {
        return this._getChildren(id).then((data) => {
          $target.append($("<ul>").append(data.map(this._makeListItem.bind(this))));
        });
      }
    } else if ($target.hasClass('collapsible')) {
      $target.removeClass('collapsible').addClass('expandable');
      $target.find('ul').addClass('hide');
    }

    return Promise.resolve();
  }
}

export { TreeView, TreeViewModes };