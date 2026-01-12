const express = require("express");
const router = express.Router();
const Member = require("../models/Member");
const { auth, admin } = require("../middleware/auth");

// GET all members
router.get("/", auth, async (req, res) => {
  try {
    const members = await Member.find();
    res.json(members);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create member
router.post("/", [auth, admin], async (req, res) => {
  const member = new Member({
    name: req.body.name,
    email: req.body.email,
  });

  try {
    const newMember = await member.save();
    res.status(201).json(newMember);
    await member.deleteOne();
    res.json({ message: "Member deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
