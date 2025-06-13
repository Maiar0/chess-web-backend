const express = require('express');
const router = express.Router();
const ChessController = require('../controllers/chessController');

router.post('/newGame', ChessController.newGame); // Create a new game
router.post('/getInfo', ChessController.getInfo); // Get info on Game state
router.post('/move', ChessController.requestMove); // request a piece move
router.post('/choosecolor', ChessController.chooseColor); // Choose a color for the game
//router.post('/resign', ChessController.resign); // Offer a draw
router.post('/drawResponse', ChessController.drawResponse); // Offer draw response a draw
//router.post('/claimDraw', ChessController.claimDraw); // Claim a draw

module.exports = router; // Export the router for use in the main server file