const express = require("express");
const morgan = require("morgan");
const flash = require("express-flash");  // flash messages
const session = require("express-session");  // required by express-flash -> store flash messages (provide support ofr persisting data)
const { body, validationResult } = require("express-validator");
const TodoList = require("./lib/todolist");
const {sortTodoLists, sortTodos} = require("./lib/sort");

const app = express();
const host = "localhost";
const port = 3000;

// Static data for initial testing (data only lasts during running of app)
let todoLists = require("./lib/seed-data");

app.set("views", "./views");
app.set("view engine", "pug");

app.use(morgan("common"));
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false}));

app.use(session({
  name: "launch-school-todos-session-id",
  resave: false,
  saveUninitialized: true,
  secret: "this is not very secure",
}));

app.use(flash());

app.use((req, res, next) => {
  res.locals.flash = req.session.flash;
  delete req.session.flash;
  next();
});




//////////////////////////////////////////////////////// function
const findTodoList = function(todoListId) {
  return todoLists.find(todoList => {
    return Number(todoList.id) === Number(todoListId)
  });
};

const findTodo = function(todoList, todoId) {
  if (todoList === undefined) {
    return undefined;
  } else {
    return todoList.findById(Number(todoId));
  }
}


/////////////////////////////////////////////////////////// routes
app.get("/", (req, res) => {
  res.render("lists", {
    todoLists: sortTodoLists(todoLists),
  });
});

app.get("/lists/new", (req, res) => {
  res.render("new-list");
});

app.get("/lists", (req, res) => {
  res.redirect("/");
});

// Render individual todo list and its todos
app.get("/lists/:todoListId", (req, res, next) => {
  let listId = req.params.todoListId;
  let todoList = findTodoList(listId);
  if (todoList === undefined) {
    next(new Error("Not found."));
  } else {
    res.render("list", {
      todoList: todoList,
      todos: sortTodos(todoList),
    });
  }
});


app.post("/lists", 
  // validate input
  [
    body("todoListTitle")
      .trim()
      .isLength({min: 1})
      .withMessage("The list title is required")
      .isLength({max: 100})
      .withMessage("List title must be between 1 and 100 characters.")
      .custom(title => {
        let duplicate = todoLists.find(list => list.title === title);
        return duplicate === undefined;
      })
      .withMessage("List title must be unique."),
  ],

  (req, res) => {
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      errors.array().forEach(message => req.flash("error", message.msg));
      res.render("new-list", {
        flash: req.flash(),
        todoListTitle: req.body.todoListTitle,
      });
    } else {
      todoLists.push(new TodoList(req.body.todoListTitle));
      req.flash("success", "The todo list has been created.");
      res.redirect("/");
    }
  }
);

app.post("/lists/:todoListId/todos/:todoId/toggle", (req, res, next) => {
  let todoListId = req.params.todoListId;
  let todoId = req.params.todoId;
  
  let todoList = findTodoList(todoListId);
  let todo = findTodo(todoList, todoId);

  if (!todo) {
    next(new Error("Not found."));
  } else {
    let todoTitle = todo.title;
    if (todo.isDone()) {
      todo.markUndone();
      req.flash("success", `${todoTitle} marked as NOT done!`)
    } else {
      todo.markDone();
      req.flash("success", `${todoTitle} marked as done!`);
    }

    res.redirect(`/lists/${todoListId}`);
  }
});

app.post("/lists/:todoList.id/todos/:todo.id/destroy", (req, res,next) => {
  let {todoListId, todoId} = {...req.params};
  let todoList = findTodoList(todoListId);
  let todo = findTodo(todoList, todoId);

  if (!todo) {
    next(new Error("Not found."));
  } else {
    let todoTitle = todo.title;
    let todoIdx = todoList.findIndexOf(todo);
    todoList.removeAt(todoIdx);
    
    req.flash("success", `${todoTitle} is deleted.`);
    res.redirect(`/lists/${todoListId}`);
  }
});

app.post("/lists/:todoListId/complete_all", (req, res, next) => {
  let todoListId = req.params.todoListId;
  let todoList = findTodoList(todoListId);

  if (!todoList) {
    next(new Error("Not found."));
  } else {
    todoList.markAllDone();
    req.flash("success", `All todos have been marked as done.`);
    req.redirect(`/lists/${todoListId}`);
  }
});

// Error handler middleware (not flash errors message)
app.use((err, req, res, _next) => {
  console.log(err); //Writes more extensive information to the console log
  res.status(404).send(err.message);
});

// Listener
app.listen(port, host, () => {
  console.log(`Todos is listening on port ${port} of ${host}!`);
});