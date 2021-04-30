// Requiring up expres package
const express = require("express");

// Requiring data model
const Task = require("../models/task");

// Requiring auth middleware
const auth = require("../middlewares/auth");
const User = require("../models/user");

const router = new express.Router();

// setting up post request at tasks route so as to create a new task document
router.post("/tasks", auth, async (req, res) => {
  // const task = new Task(req.body);

  const task = new Task({
    ...req.body,
    owner: req.user._id,
  });

  try {
    await task.save();
    res.status(201).send(task);
  } catch (e) {
    res.status(400).send(e);
  }
});

// setting up get request for "/tasks?"" route so as to Read list of tasks
// from the database also with search query feature
// GET /tasks?completed=true
// GET /tasks?limit=10&skip=20
// GET /tasks?sortBy=createdAt:desc

router.get("/tasks", auth, async (req, res) => {
  const match = {};
  const sort = {};

  if (req.query.completed) {
    match.completed = req.query.completed === "true";
  }

  if (req.query.sortBy) {
    const parts = req.query.sortBy.split(":");
    sort[parts[0]] = parts[1] === "desc" ? -1 : 1;
  }

  try {
    await req.user
      .populate({
        path: "tasks",
        match,
        options: {
          limit: parseInt(req.query.limit), // ignored when not provided, parsed to NaN
          skip: parseInt(req.query.skip),
          sort,
        },
      })
      .execPopulate();
    const tasks = req.user.tasks;

    res.send(tasks);
  } catch (e) {
    res.status(500).send(e);
  }
});

// setting up get request for /tasks/:id route so as to Read a particular task from database
router.get("/tasks/:id", auth, async (req, res) => {
  const _id = req.params.id;

  try {
    const task = await Task.findOne({ _id, owner: req.user._id });

    if (!task) {
      return res.status(404).send();
    }

    res.send(task);
  } catch (e) {
    res.status(500).send(e);
  }
});

// setting up patch request for route "/tasks/:id" so as to update a specific task from database
router.patch("/tasks/:id", auth, async (req, res) => {
  const _id = req.params.id;
  const updatesAllowed = ["description", "completed"];
  const updates = Object.keys(req.body);
  const isValidOperation = updates.every((update) =>
    updatesAllowed.includes(update)
  );

  if (!isValidOperation) {
    return res.status(400).send({ error: "Invalid updates!" });
  }

  try {
    const task = await Task.findOne({ _id, owner: req.user._id });

    if (!task) {
      return res.status(404).send();
    }

    updates.forEach((update) => (task[update] = req.body[update]));
    await task.save();
    res.send(task);
  } catch (e) {
    res.status(500).send(e);
  }
});

// setting up delete request for route "/tasks/:id" so as to delete a task document
router.delete("/tasks/:id", auth, async (req, res) => {
  const _id = req.params.id;

  try {
    const task = await Task.findOneAndDelete({ _id, owner: req.user._id });

    if (!task) {
      return res.status(404).send();
    }

    res.send(task);
  } catch (e) {
    res.status(500).send();
  }
});

module.exports = router;
