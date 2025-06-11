const express = require('express');
const router = express.Router();
const ChessController = require('../controllers/chessController');

router.post('/newGame', ChessController.handle); // Create a new game
router.post('/action', ChessController.handle); // Move a piece
router.post('/choosecolor', ChessController.chooseColor); // Choose a color for the game
//router.post('/offerDraw', ChessController.offerDraw); // Offer a draw
//router.post('/claimDraw', ChessController.claimDraw); // Claim a draw

module.exports = router; // Export the router for use in the main server file