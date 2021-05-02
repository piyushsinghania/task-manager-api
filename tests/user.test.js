const request = require("supertest");
const app = require("../src/app");
const User = require("../src/models/user");
const { userOneId, userOne, setupDatabase } = require("./fixtures/db");

beforeEach(setupDatabase);

//! Test script for signing up a new user
test("Should signup a new user", async () => {
  const response = await request(app)
    .post("/users")
    .send({
      name: "Test user",
      email: "test@example.com",
      password: "test1234",
      age: 20,
    })
    .expect(201);

  // Assert that the database was changed correctly
  const user = await User.findById(response.body.user._id);
  expect(user).not.toBeNull();

  // Assertions about the response
  expect(response.body).toMatchObject({
    user: {
      name: "Test user",
      email: "test@example.com",
    },
    token: user.tokens[0].token,
  });

  // Assetion that user password is not stored in plain text
  expect(user.password).not.toBe("test1234");
});

//! Test script for successfully loggig-in existing user
test("Should login existing user", async () => {
  const response = await request(app)
    .post("/users/login")
    .send({
      email: userOne.email,
      password: userOne.password,
    })
    .expect(200);

  const user = await User.findById(userOneId);
  expect(user.tokens[1].token).toBe(response.body.token);
});

//! Test script for blocking bad login request/ invalid login request
test("Should not login non existing user", async () => {
  await request(app)
    .post("/users/login")
    .send({
      email: "invaliduser",
      password: "invalidpass",
    })
    .expect(400);
});

//! Test script for reading user profile with authorization
test("Should get profile for user", async () => {
  await request(app)
    .get("/users/me")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);
});

//! Test script for blocking read request while un-authenticated
test("Should not get user profile", async () => {
  await request(app).get("/users/me").send().expect(401);
});

//! Test script for deleting user account while authorized
test("Should delete user account", async () => {
  await request(app)
    .delete("/users/me")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);

  const user = await User.findById(userOneId);
  expect(user).toBeNull();
});

//! Test script for blocking account delete request while un-authorized
test("Should not delete account for unauthenticated user", async () => {
  await request(app).delete("/users/me").send().expect(401);
});

//! Test script for uploading avatar for user profile
test("Should upload user profile avatar", async () => {
  await request(app)
    .post("/users/me/avatar")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .attach("avatar", "tests/fixtures/profile-pic.jpg")
    .expect(200);

  const user = await User.findById(userOneId);
  expect(user.avatar).toEqual(expect.any(Buffer));
});

//! Test script to update valid user fields
test("Should update valid user fields", async () => {
  await request(app)
    .patch("/users/me")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send({
      name: "Piyush",
    })
    .expect(200);

  // Assertion for confirming the update
  const user = await User.findById(userOneId);
  expect(user.name).toBe("Piyush");
});

//! Test script for blocking invalid user fields update
test("Should not update invalid user fields", async () => {
  await request(app)
    .patch("/users/me")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send({
      location: "Ranchi",
    })
    .expect(400);
});
