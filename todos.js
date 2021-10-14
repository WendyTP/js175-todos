const express = require("express");
const morgan = require("morgan");
const flash = require("express-flash");  // flash messages
const session = require("express-session");  // required by express-flash -> store flash messages (provide support ofr persisting data)
const { body, validationResult } = require("express-validator");
const TodoList = require("./lib/todolist");
const Todo = require("./lib/todo");
const {sortTodoLists, sortTodos} = require("./lib/sort");
const store = require("connect-loki");

const app = express();
const host = "localhost";
const port = 3000;
const LokiStore = store(session);

app.set("views", "./views");
app.set("view engine", "pug");

app.use(morgan("common"));
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false}));

app.use(session({
  cookie: {
    httpOnly: true,
    maxAge: 31 * 24 * 60 * 60 * 1000, // 31 days in miliseconds
    path: "/",
    secure: false,
  },

  name: "launch-school-todos-session-id",
  resave: false,
  saveUninitialized: true,
  secret: "this is not very secure",
  store: new LokiStore({}), // tell express-session to use connect-loki as the store
}));

app.use(flash());

// Set up persistent session data
app.use((req, res, next) => {
  let todoLists = [];
  if ("todoLists" in req.session) {
    req.session.todoLists.forEach(todoList => {
      todoLists.push(TodoList.makeTodoList(todoList));
    });
  }

  req.session.todoLists = todoLists;
  next();
});

app.use((req, res, next) => {
  res.locals.flash = req.session.flash;
  delete req.session.flash;
  next();
});




//////////////////////////////////////////////////////// function
// Find a todo list with the indicated ID. Returns `undefined` if not found.
const findTodoList = function(todoListId, todoLists) {
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
// Render the list of todo lists
app.get("/", (req, res) => {
  res.render("lists", {
    todoLists: sortTodoLists(req.session.todoLists),
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
  let todoList = findTodoList(listId, req.session.todoLists);
  if (todoList === undefined) {
    next(new Error("Not found."));
  } else {
    res.render("list", {
      todoList: todoList,
      todos: sortTodos(todoList),
    });
  }
});

// Create a new todo list
app.post("/lists", 
  // validate input
  [
    body("todoListTitle")
      .trim()
      .isLength({min: 1})
      .withMessage("The list title is required")
      .isLength({max: 100})
      .withMessage("List title must be between 1 and 100 characters.")
      .custom((title, { req }) => {
        let todoLists = req.session.todoLists;
        let duplicate = req.session.todoLists.find(list => list.title === title);
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
      req.session.todoLists.push(new TodoList(req.body.todoListTitle));
      req.flash("success", "The todo list has been created.");
      res.redirect("/");
    }
  }
);

// Toggle completion status of a todo
app.post("/lists/:todoListId/todos/:todoId/toggle", (req, res, next) => {
  let todoListId = req.params.todoListId;
  let todoId = req.params.todoId;
  
  let todoList = findTodoList(todoListId, req.session.todoLists);
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

// Delete a todo
app.post("/lists/:todoListId/todos/:todoId/destroy", (req, res,next) => {
  let {todoListId, todoId} = {...req.params};
  let todoList = findTodoList(todoListId, req.session.todoLists);
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

// Mark all todos as done
app.post("/lists/:todoListId/complete_all", (req, res, next) => {
  let todoListId = req.params.todoListId;
  let todoList = findTodoList(todoListId, req.session.todoLists);

  if (!todoList) {
    next(new Error("Not found."));
  } else {
    todoList.markAllDone();
    req.flash("success", `All todos have been marked as done.`);
    res.redirect(`/lists/${todoListId}`);
  }
});

// Create a new todo and add it to the specified list
app.post("/lists/:todoListId/todos", 
    // validate input
  [
    body("todoTitle")
      .trim()
      .isLength({min: 1})
      .withMessage("The todo title is required.")
      .isLength({max: 100})
      .withMessage("Todo title must be between 1 and 100 characters.")
  ],

  (req, res, next) => {
   
    let todoListId = req.params.todoListId;
    let todoList = findTodoList(todoListId, req.session.todoLists);

    if (!todoList) {
      next(new Error("Not found."));
    } else {
      let errors = validationResult(req);

      if (!errors.isEmpty()) {
        errors.array().forEach(message => req.flash("error", message.msg));
        
        res.render("list", {
          flash: req.flash(),
          todoList: todoList,
          todos: sortTodos(todoList),
          todoTitle: req.body.todoTitle,
        });
      } else {
        todoList.add(new Todo(req.body.todoTitle));
        req.flash("success", "The todo has been created.");
        res.redirect(`/lists/${todoListId}`);
      }
    }
  }
);

// Render edit todo list form
app.get("/lists/:todoListId/edit", (req, res, next) => {
  let listId = req.params.todoListId;
  let todoList = findTodoList(listId, req.session.todoLists);
  if (todoList === undefined) {
    next(new Error("Not found."));
  } else {
    res.render("edit-list", {
      todoList: todoList,
    });
  }
});

// delete todo List
app.post("/lists/:todoListId/destroy", (req, res, next) => {
  let todoLists = req.session.todoLists;
  let todoListId = req.params.todoListId;
  let todoListTitle = todoList.title;
  let todoListIdx = todoLists.findIndex(todoList => todoList.id === todoListId);
  
  if (todoListIdx === -1) {
    next(new Error("Not found."));
  } else {
    todoLists.splice(todoListIdx, 1);
    req.flash("success", `${todoListTitle} is deleted.`);
    res.redirect("/lists");
  }
});

// edit todo list title
app.post("/lists/:todoListId/edit",
  [
    body("todoListTitle")
      .trim()
      .isLength({min: 1})
      .withMessage("The list title is required")
      .isLength({max: 100})
      .withMessage("List title must be between 1 and 100 characters.")
      .custom((title, { req }) => {
        let todoLists = req.session.todoLists;
        let duplicate = todoLists.find(list => list.title === title);
        return duplicate === undefined;
      })
      .withMessage("List title must be unique."),
  ],

  (req, res, next) => {
    let todoListId = req.params.todoListId;
    let todoList = findTodoList(todoListId, req.session.todoLists);

    if (!todoList) {
      next(new Error("Not found."));
    } else {
      let errors = validationResult(req);

      if (!errors.isEmpty()) {
        errors.array().forEach(message => req.flash("error", message.msg));
        
        res.render("edit-list", {
          flash: req.flash(),
          todoList: todoList,
          todoListTitle: req.body.todoListTitle,
        });

      } else {
        todoList.setTitle(req.body.todoListTitle);
        req.flash("success", "The todo list title has been edited.");
        res.redirect(`/lists/${todoListId}`);
      }
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