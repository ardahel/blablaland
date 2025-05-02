const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User Schema
const userSchema = new mongoose.Schema({
    username: String,
    password: String,
});

const User = mongoose.model("User", userSchema);

// REGISTER
router.post("/register", async (req, res) => {
    const { username, password } = req.body;

    const exists = await User.findOne({ username });
    if (exists) return res.status(400).send("Username already exists");

    const hashed = bcrypt.hashSync(password, 10);
    const newUser = new User({ username, password: hashed });
    await newUser.save();

    res.send("User registered");
});

// LOGIN
router.post("/login", async (req, res) => {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) return res.status(400).send("User not found");

    const valid = bcrypt.compareSync(password, user.password);
    if (!valid) return res.status(400).send("Invalid password");

    res.send({ username });
});

module.exports = router;
