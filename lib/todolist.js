const nextId = require("./next-id");
const Todo = require("./todo");

class TodoList {
  constructor(title) {
    this.id = nextId();
    this.title = title;
    this.todos = [];
  }

  add(todo) {
    if (!(todo instanceof Todo)) {
      throw new TypeError("can only add Todo objects.");
    }

    this.todos.push(todo);
  }

  size() {
    return this.todos.length;
  }

  first() {
    return this.todos[0];
  }

  last() {
    return this.todos[this.size() - 1];
  }

  // return the todo at the specified index
  itemAt(index) {
    this._validateIndex(index);
    return this.todos[index];
  }

  markDoneAt(index) {
    this.itemAt(index).markDone();
  }

  markUndoneAt(index) {
    this.itemAt(index).markUndone();
  }

  markDone(title) {
    let todo = this.findByTitle(title);
    if (todo !== undefined) {
      todo.markDone();
    }
  }

  // validate if all todos in the todolist is all done => return true or false
  isDone() {
    return this.size > 0 && this.todos.every(todo => todo.isDone());
  }

  toString() {
    let title = `---- ${this.title} ----`;
    let list = this.todos.map(todo =>  todo.toString().join("\n"));
    return `${title}\n${list}`;
  }

  shift() {
    return this.todos.shift();
  }

  pop() {
    return this.todos.pop();
  }

  removeAt(index) {
    this._validateIndex(index);
    return this.todos.splice(index, 1);
  }

  forEach(callback) {
    this.todos.forEach(todo => callback(todo));
  }

  filter(callback) {
    let newList = new TodoList(this.title);  // Q: new todoList will have new list id
    this.forEach(todo => {
      if (callback(todo)) {
        newList.add(todo);
      }
    });

    return newList;
  }

  // find a todo by its name (the first matching one)
  findByTitle(title) {
    return this.filter(todo => todo.title === title).first();
  }

  // find a todo by the todo's id
  findById(id) {
    return this.filter(todo => todo.id === id).first();
  }

  // find a todo by its index within the todoList
  findIndexOf(todoToFind) {
    let findId = todoToFind.id;
    return this.todos.findIndex(todo => todo.id === findId);
  }

  // return the todos which are done within the list
  allDone() {
    return this.filter(todo => todo.isDone());
  }

  allNotDone() {
    return this.filter(todo => !todo.isDone());
  }

  allTodos() {
    return this.filter(_ => true);  // why not just: return this.toArray()
  }

  markAllDone() {
    this.forEach(todo => todo.markDone());
  }

  markAllUndone() {
    this.forEach(todo => todo.markUndone());
  }

  toArray() {
    return this.todos.slice();
  }

  setTitle(title) {
    this.title = title;
  }

  _validateIndex(index) {  // _ in name indicates "private" method
    if (!(index in this.todos)) {
      throw new ReferenceError(`invalid index: ${index}`);
    }
  }

}

module.exports = TodoList;  // export the TodoList class