// Requiring up expres application
const app = require("./app");

// setting up the port for our server
const port = process.env.PORT;

// Starting the express server to listen
app.listen(port, () => {
  console.log("Server up and running on port: ", port);
});
