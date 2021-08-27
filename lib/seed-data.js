const TodoList = require("./todolist");
const Todo = require("./todo");

let todoList1 = new TodoList("Work Todos");
todoList1.add(new Todo("Get coffee"));
todoList1.add(new Todo("Chat with colleagues"));
todoList1.add(new Todo("meeting"));
todoList1.markDone("Get coffee");
todoList1.markDone("Chat with colleagues");

let todoList2 = new TodoList("Home Todos");
todoList2.add(new Todo("Feed the cats"));
todoList2.add(new Todo("Go to bed"));
todoList2.add(new Todo("Buy milk"));
todoList2.add(new Todo("Study for Launch School"));
todoList2.markDone("Feed the cats");
todoList2.markDone("Go to bed");
todoList2.markDone("Buy milk");
todoList2.markDone("Study for Launch School");

let todoList3 = new TodoList("Additional Todos");
todoList3.add(new Todo("Feed the cats"));
todoList3.markDone("Feed the cats");

let todoLists = [
  todoList1,
  todoList2,
  todoList3,
];


module.exports = todoLists;