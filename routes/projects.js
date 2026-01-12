const express = require("express");
const router = express.Router();
const Project = require("../models/Project");
const Task = require("../models/Task");
const { auth, admin } = require("../middleware/auth");

// GET all projects
router.get("/", auth, async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create project
router.post("/", [auth, admin], async (req, res) => {
  const project = new Project({
    name: req.body.name,
    description: req.body.description,
    color: req.body.color || "#4f46e5",
  });

  try {
    const newProject = await project.save();
    res.status(201).json(newProject);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update project
router.put("/:id", [auth, admin], async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (req.body.name != null) project.name = req.body.name;
    if (req.body.description != null)
      project.description = req.body.description;
    if (req.body.color != null) project.color = req.body.color;

    const updatedProject = await project.save();
    res.json(updatedProject);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE project (and all its tasks)
router.delete("/:id", [auth, admin], async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Delete all tasks associated with this project
    await Task.deleteMany({ project: req.params.id });

    await project.deleteOne();
    res.json({ message: "Project and associated tasks deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
