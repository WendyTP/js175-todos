// Sort todo or todoList titles alphabetically (case-insensitive)
const sortByTitle = function(itemA, itemB) {
  let titleA = itemA.title.toLowerCase();
  let titleB = itemB.title.toLowerCase();

  if (titleA < titleB) {
    return -1;
  } else if (titleA > titleB) {
    return 1;
  } else {
    return 0;
  }
};

module.exports = {
  // return the list of todo lists sorted by completion status and title.
  sortTodoLists: function(lists) {
    let undoneLists = lists.filter(todoList => !todoList.isDone());
    let doneLists = lists.filter(todoList => todoList.isDone());
  
    undoneLists.sort(sortByTitle);
    doneLists.sort(sortByTitle);
    return [].concat(undoneLists,doneLists);
  },

  // sort a list of todos
  sortTodos: function(todoList) {
    let undoneTodos = todoList.todos.filter(todo => !todo.isDone());
    let doneTodos = todoList.todos.filter(todo => todo.isDone());
  
    undoneTodos.sort(sortByTitle);
    doneTodos.sort(sortByTitle);
    return [].concat(undoneTodos,doneTodos);
  },
};
