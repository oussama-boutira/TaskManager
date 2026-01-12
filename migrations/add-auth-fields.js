const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Member = require("../models/Member");
const connectDB = require("../config/db");
require("dotenv").config();

const migrateAuthFields = async () => {
  await connectDB();

  try {
    console.log("Starting auth migration...");

    const members = await Member.find({});

    // Create default admin if not exists
    const adminEmail = "admin@example.com";
    let admin = await Member.findOne({ email: adminEmail });

    if (!admin) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("admin123", salt);

      await Member.create({
        name: "Admin",
        email: adminEmail,
        password: hashedPassword,
        role: "admin",
      });
      console.log("✓ Default admin created (admin@example.com / admin123)");
    } else {
      // Ensure admin has password and role
      let needsUpdate = false;
      if (!admin.password) {
        const salt = await bcrypt.genSalt(10);
        admin.password = await bcrypt.hash("admin123", salt);
        needsUpdate = true;
      }
      if (admin.role !== "admin") {
        admin.role = "admin";
        needsUpdate = true;
      }

      if (needsUpdate) {
        await admin.save();
        console.log("✓ Admin account updated");
      }
    }

    // Update existing members
    for (const member of members) {
      if (member.email === adminEmail) continue;

      let needsUpdate = false;

      if (!member.password) {
        const salt = await bcrypt.genSalt(10);
        // Default password for existing users: '123456'
        member.password = await bcrypt.hash("123456", salt);
        needsUpdate = true;
      }

      if (!member.role) {
        member.role = "user";
        needsUpdate = true;
      }

      if (needsUpdate) {
        await member.save();
        console.log(`✓ Updated member: ${member.name}`);
      }
    }

    console.log("Auth migration completed successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
};

migrateAuthFields();
