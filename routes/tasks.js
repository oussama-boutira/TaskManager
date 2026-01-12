const express = require("express");
const router = express.Router();
const Task = require("../models/Task");
const { auth, admin } = require("../middleware/auth");

// GET all tasks
router.get("/", auth, async (req, res) => {
  try {
    let query = {};

    // If not admin, only show assigned tasks
    if (req.user.role !== "admin") {
      query.assignedTo = req.user.id;
    }

    if (req.query.status) {
      query.status = req.query.status;
    }
    if (req.query.project) {
      query.project = req.query.project;
    }
    const tasks = await Task.find(query)
      .populate("assignedTo")
      .populate("project");
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create task
router.post("/", auth, admin, async (req, res) => {
  const task = new Task({
    title: req.body.title,
    description: req.body.description,
    priority: req.body.priority,
    status: req.body.status,
    assignedTo: req.body.assignedTo,
    project: req.body.project,
    tags: req.body.tags,
    startDate: req.body.startDate,
    dueDate: req.body.dueDate,
  });

  try {
    const newTask = await task.save();
    res.status(201).json(newTask);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update task
router.put("/:id", auth, admin, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (req.body.title != null) task.title = req.body.title;
    if (req.body.description != null) task.description = req.body.description;
    if (req.body.priority != null) task.priority = req.body.priority;
    if (req.body.status != null) task.status = req.body.status;
    if (req.body.assignedTo !== undefined)
      task.assignedTo = req.body.assignedTo; // Can be null
    if (req.body.project !== undefined) task.project = req.body.project;
    if (req.body.tags != null) task.tags = req.body.tags;
    if (req.body.startDate !== undefined) task.startDate = req.body.startDate;
    if (req.body.dueDate !== undefined) task.dueDate = req.body.dueDate;

    const updatedTask = await task.save();
    res.json(updatedTask);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE task
router.delete("/:id", auth, admin, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    await task.deleteOne();
    res.json({ message: "Task deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
