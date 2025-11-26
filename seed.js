const mongoose = require("mongoose");
const Member = require("./models/Member");
const Task = require("./models/Task");
const connectDB = require("./config/db");
require("dotenv").config();

const seedData = async () => {
  await connectDB();

  try {
    // Clear existing data
    await Member.deleteMany({});
    await Task.deleteMany({});

    // Create Members
    const members = await Member.create([
      { name: "Alice Dupont", email: "alice@example.com" },
      { name: "Bob Martin", email: "bob@example.com" },
      { name: "Charlie Durand", email: "charlie@example.com" },
    ]);

    console.log("Members created");

    // Create Tasks
    await Task.create([
      {
        title: "Configurer le serveur",
        description: "Mettre en place Express et MongoDB",
        priority: "Haute",
        status: "done",
        assignedTo: members[0]._id,
      },
      {
        title: "Créer le frontend",
        description: "Développer l'interface HTML/CSS",
        priority: "Moyenne",
        status: "in_progress",
        assignedTo: members[1]._id,
      },
      {
        title: "Tests unitaires",
        description: "Écrire les tests pour l'API",
        priority: "Basse",
        status: "todo",
        assignedTo: members[2]._id,
      },
      {
        title: "Déployer en production",
        description: "Configurer le serveur de production",
        priority: "Haute",
        status: "todo",
      },
    ]);

    console.log("Tasks created");
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedData();
