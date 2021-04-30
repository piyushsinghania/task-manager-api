const mongoose = require("mongoose");
const validator = require("validator");

// Requiring the Task model
const Task = require("./task");

// Requiring bcryptjs package in order to hash passwords
const bcrypt = require("bcryptjs");

// Requiring jsonwebtoken package in order to create token while user login/signup
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      default: "Anonymous",
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("Email validation failed");
        }
      },
    },
    password: {
      type: String,
      require: true,
      minLength: 7,
      trim: true,
      validate(value) {
        if (value.toLowerCase().includes("password")) {
          throw new Error("Password can't be 'password' ");
        }
      },
    },
    age: {
      type: Number,
      default: 0,
      validate(value) {
        if (value < 0) {
          throw new Error("Age must be a positive number");
        }
      },
    },
    tokens: [
      {
        token: {
          type: String,
          required: true,
        },
      },
    ],
    avatar: {
      type: Buffer,
    },
  },
  {
    timestamps: true,
  }
);

// creating a virtual field on userSchema for relationship between user and tasks
userSchema.virtual("tasks", {
  ref: "Task",
  localField: "_id",
  foreignField: "owner",
});

// toJSON function gets called while sending a json response
// this in turn helps us to restrict the data being exposed
userSchema.methods.toJSON = function () {
  const user = this;
  const userData = user.toObject();

  delete userData.password;
  delete userData.tokens;
  delete userData.avatar;

  return userData;
};

// creating jsonwebtoken while user login/signup
// methods are also called instance methods
userSchema.methods.generateAuthToken = async function () {
  const user = this;
  const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET);

  user.tokens = user.tokens.concat({ token });

  await user.save();

  return token;
};

// validating user login via email and password
// statics are also called model methods
userSchema.statics.findByCredentials = async (email, password) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new Error("Unable to login!");
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new Error("Unable to login!");
  }

  return user;
};

// hashing user password before creating or updating
userSchema.pre("save", async function (next) {
  const user = this;

  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 8);
  }

  next();
});

// Deleting user tasks before deleting the user
userSchema.pre("remove", async function (next) {
  const user = this;
  await Task.deleteMany({ owner: user._id });
  next();
});

const User = mongoose.model("User", userSchema);

module.exports = User;
