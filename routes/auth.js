const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Member = require("../models/Member");
const { auth } = require("../middleware/auth");

// POST /api/auth/register
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    let member = await Member.findOne({ email });
    if (member) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    member = new Member({
      name,
      email,
      password: hashedPassword,
      role: "user", // Default role
    });

    await member.save();

    const payload = {
      user: {
        id: member.id,
        role: member.role,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || "secret_key_123",
      { expiresIn: "24h" },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user: {
            id: member.id,
            name: member.name,
            email: member.email,
            role: member.role,
          },
        });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    let member = await Member.findOne({ email });
    if (!member) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }

    constisMatch = await bcrypt.compare(password, member.password);
    if (!constisMatch) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }

    const payload = {
      user: {
        id: member.id,
        role: member.role,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || "secret_key_123",
      { expiresIn: "24h" },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user: {
            id: member.id,
            name: member.name,
            email: member.email,
            role: member.role,
          },
        });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// GET /api/auth/me
router.get("/me", auth, async (req, res) => {
  try {
    const member = await Member.findById(req.user.id).select("-password");
    res.json(member);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

module.exports = router;
