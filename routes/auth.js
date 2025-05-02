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

    try {
        const exists = await User.findOne({ username });
        if (exists) return res.status(400).json({ error: "Username already exists" });

        const hashed = bcrypt.hashSync(password, 10);
        const newUser = new User({ username, password: hashed });
        await newUser.save();

        res.json({ message: "User registered" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error during registration" });
    }
});

// LOGIN
router.post("/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ error: "User not found" });

        const valid = bcrypt.compareSync(password, user.password);
        if (!valid) return res.status(400).json({ error: "Invalid password" });

        res.json({ username });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error during login" });
    }
});

module.exports = router;
