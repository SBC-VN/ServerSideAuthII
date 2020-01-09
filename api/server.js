// *****************************************************************************
// Server.js - This file is the initial starting point for the Node/Express server.
//
// ******************************************************************************
// *** Dependencies
// =============================================================
var express = require('express');
var cors = require('cors');

// Sets up the Express App
// =============================================================
var app = express();



// The API is going to run on port 3000 (as expected by the client)
let PORT = process.env.PORT || 3000;

// Sets up the Express app to handle data parsing
app.use(cors())
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Routes
// =============================================================
require("./routes/apiRoutes.js")(app);

// Run the site!
// =============================================================

app.listen(PORT, function() {
  console.log("Match App listening on http://localhost:" + PORT);
});

