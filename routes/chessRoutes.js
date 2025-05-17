const express = require('express');
const router = express.Router();
const ChessController = require('../controllers/chessController');

router.post('/newGame', ChessController.handle); // Create a new game
router.post('/action', ChessController.handle); // Move a piece

module.exports = router; // Export the router for use in the main server file