// Singleton
class TreeView {
  init() {
    $.ajax({
      url: 'http://localhost:8000/diseases/5688/children/',
      success: (data) => {
        const $treeView = $('#tree-view');
        data.forEach((disease) =>
          $treeView.append($("<li>").html(disease.name))
        );
      }
    });
  }
}

export default new TreeView();