// Requiring up expres package
const express = require("express");
const app = express();

// Requireing the mongoose.js file (which connects us to database) from db folder
require("./db/mongoose");

// Requiring the routers
const userRouter = require("./routers/user");
const taskRouter = require("./routers/task");

// setting up the port for our server
const port = process.env.PORT;

// setting up express middleware
// app.use((req, res, next) => {
//   res.status(503).send("Site undermaintenance, please try back soon!");
// });

// setting up our express server to parse json request to object
app.use(express.json());

// using the routers via our express route
app.use(userRouter);
app.use(taskRouter);

// Starting the express server to listen
app.listen(port, () => {
  console.log("Server up and running on port: ", port);
});
