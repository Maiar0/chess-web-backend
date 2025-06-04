require('dotenv').config(); // Load environment variables from .env file

const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

//import routes
const chessRoutes = require('./routes/chessRoutes.js');
app.use('/api/chess', chessRoutes); // Use the chess routes for API calls

//server setup
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
