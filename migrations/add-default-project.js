const mongoose = require("mongoose");
const Project = require("../models/Project");
const Task = require("../models/Task");
const connectDB = require("../config/db");
require("dotenv").config();

const migrateToMultiProject = async () => {
  await connectDB();

  try {
    console.log("Starting migration to multi-project...");

    // Check if default project already exists
    let defaultProject = await Project.findOne({ name: "Mon Premier Projet" });

    if (!defaultProject) {
      // Create default project
      defaultProject = await Project.create({
        name: "Mon Premier Projet",
        description: "Projet par défaut contenant vos tâches existantes",
        color: "#4f46e5",
      });
      console.log("✓ Default project created");
    } else {
      console.log("✓ Default project already exists");
    }

    // Assign all tasks without a project to the default project
    const tasksWithoutProject = await Task.find({
      project: { $exists: false },
    });

    if (tasksWithoutProject.length > 0) {
      await Task.updateMany(
        { project: { $exists: false } },
        { $set: { project: defaultProject._id } }
      );
      console.log(
        `✓ Migrated ${tasksWithoutProject.length} tasks to default project`
      );
    } else {
      console.log("✓ All tasks already have a project assigned");
    }

    console.log("Migration completed successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
};

migrateToMultiProject();
