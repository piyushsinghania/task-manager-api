// Requiring up expres package
const express = require("express");

// Requiring data model
const User = require("../models/user");

// Requiring auth middleware
const auth = require("../middlewares/auth");
const { response } = require("express");

// Requiring multer package for integrating file upload facility
const multer = require("multer");

// Requiring sharp package for resizing and converting profile avatar's to png
const sharp = require("sharp");

// Requiring email functions so in order to send useful emails to the users
const {
  sendWelcomeEmail,
  sendCalcellationEmail,
} = require("../emails/accounts");

const router = new express.Router();

// setting up post request at users route so as to create a new user document (signup)
router.post("/users", async (req, res) => {
  const user = new User(req.body);

  try {
    await user.save();
    const token = await user.generateAuthToken();
    sendWelcomeEmail(user.email, user.name);
    res.status(201).send({ user, token });
  } catch (e) {
    res.status(400).send(e);
  }
});

// setting up post request at "/users/login" route so as to authenticate login
router.post("/users/login", async (req, res) => {
  try {
    const user = await User.findByCredentials(
      req.body.email,
      req.body.password
    );
    const token = await user.generateAuthToken();

    res.send({ user, token });
  } catch (e) {
    res.status(400).send();
  }
});

// setting up post request at "/users/logout" so as to logout a user
router.post("/users/logout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token != req.token;
    });

    await req.user.save();
    res.send();
  } catch (e) {
    res.status(500).send();
  }
});

// setting up post request at "/users/logoutAll" so as to logout all sessions of a user
router.post("/users/logoutAll", auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    res.send();
  } catch (e) {
    res.status(500).send();
  }
});

// setting up get request at users/me route so as to read a users profile from database
router.get("/users/me", auth, async (req, res) => {
  res.send(req.user);
});

// setting up patch request at "users/me" route so as to update a user's profile
router.patch("/users/me", auth, async (req, res) => {
  const updatesAllowed = ["name", "age", "email", "password"];
  const updates = Object.keys(req.body);
  const isValidOperation = updates.every((update) =>
    updatesAllowed.includes(update)
  );

  if (!isValidOperation) {
    return res.status(400).send({ error: "Invalid updates!" });
  }

  try {
    updates.forEach((update) => (req.user[update] = req.body[update]));
    await req.user.save();

    res.send(req.user);
  } catch (e) {
    res.status(500).send();
  }
});

// setting up delete request at "/users/me" route so as to delete a user document
router.delete("/users/me", auth, async (req, res) => {
  try {
    await req.user.remove();
    sendCalcellationEmail(req.user.email, req.user.name);
    res.send(req.user);
  } catch (e) {
    res.status(500).send();
  }
});

// For uploading profile picture for user
const upload = multer({
  limits: {
    fileSize: 1000000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error("Please upload an image file"));
    }
    cb(undefined, true);
  },
});

// setting up post request at "/users/me/avatar" route to upload profile picture of user
router.post(
  "/users/me/avatar",
  auth,
  upload.single("avatar"),
  async (req, res) => {
    const buffer = await sharp(req.file.buffer)
      .resize({ height: 250, width: 250 })
      .png()
      .toBuffer();

    req.user.avatar = buffer;
    await req.user.save();
    res.send();
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);

// setting up delete request at "/users/me/avatar" route to delete profile picture of user
router.delete("/users/me/avatar", auth, async (req, res) => {
  req.user.avatar = undefined;
  await req.user.save();
  res.send();
});

// setting up get request at "/users/:id/avatar" route to access user profile avatar
router.get("/users/:id/avatar", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user || !user.avatar) {
      throw new Error("Image not found");
    }

    res.set("Content-Type", "image/png");
    res.send(user.avatar);
  } catch (e) {
    res.status(404).send(e);
  }
});

module.exports = router;
