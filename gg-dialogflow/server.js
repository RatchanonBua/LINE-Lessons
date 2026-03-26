require("dotenv").config();
require("module-alias/register");

const express = require("express");
const bodyParser = require("body-parser");
// const endpoints = require("express-list-endpoints");

const app = express();
const port = process.env.SERVER_PORT;

app.use(express.json());
app.use(bodyParser.json());

const project01Router = require("@/project-01/router");
app.use("/project-01", project01Router);

app.listen(port, () => {
  console.log(`Started: ${port}`);
}).on("error", (error) => {
  console.error(`Error: ${error.message}`);
});