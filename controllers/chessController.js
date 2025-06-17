const ApiResponse = require('../utils/ApiResponse');
const MoveUtils = require('../utils/chess/MoveUtils');
const ChessGameService = require('../services/chess/ChessGameService');
const ApiError = require('../utils/ApiError');
const LogSession = require('../utils/logging/LogSession');
const req = require('express/lib/request');
const ChessDbManager = require('../db/ChessDbManager');

exports.requestMove = async (req, res) => {
    console.log('Request move received');
    const { io } = require('./chessSocketController');
    const {gameId, payload, playerId} = req.body;   
    const log = new LogSession(gameId);
    let svc = new ChessGameService(gameId, log);
    try{
        const { from, to, promoteTo } = payload;
        result = svc.requestMove(from, to, promoteTo, playerId); 
        if(svc.isAisTurn()){
            svc = new ChessGameService(gameId, log); // Reinitialize to ensure fresh state for AI processing
            result = await svc.processAiMove(); // Process AI's turn if it's AI's turn
        }
        const state = getState(svc); // get the game state after the move
        io.to(gameId).emit('gameState', state); // Emit the game state to all connected clients in the room
        log.addEvent('Response State:' + JSON.stringify(state));
        return res.json(ApiResponse.success(
            state 
        )); 
    }catch(err){
        const status = err.status || 500;
        res.status(status).json(ApiResponse.error(err.message, status));
        log.addEvent('Error:' + err);
    }finally{
        log.writeToFile();
        console.log('Request move response sent');
    }
}
//instantiate a new game
exports.newGame = async (req, res) => {
    console.log('New game request received');
    const {gameId, playerId, payload} = req.body;
    const log = new LogSession(gameId);
    const svc = new ChessGameService(gameId, log);
    try {
        log.addEvent('Request received new game');
        const { isAi } = payload;
        if (svc.newGame(isAi)) {
            return res.json(ApiResponse.success(
                state = getState(svc) // Get the current game state
            ));
        } else {
            throw new ApiError("Failed to start a new game", 400);
        }
    } catch (err) {
        const status = err.status || 500;
        res.status(status).json(ApiResponse.error(err.message, status));
        log.addEvent('Error:' + err);
    } finally {
        log.writeToFile();
        console.log('New game request response sent');
    }
}
//For getting state information about game
exports.getInfo = async (req, res) => {
    console.log('Get game info request received');
    const { gameId, playerId } = req.body;
    const log = new LogSession(gameId);
    const svc = new ChessGameService(gameId, log);

    try {
        log.addEvent('Request received get info');
        const result = svc.infoGame(playerId);
        if (result) {
            return res.json(ApiResponse.success(
                getState(svc) // Get the current game state
            ));
        } else {
            throw new ApiError("Failed to get game info", 400);
        }
    } catch (err) {
        res.status(err.status || 500).json(ApiResponse.error(err.message, err.status || 500));
    } finally {
        log.writeToFile();
        console.log('Get game info request response sent');
    }
}

exports.chooseColor = async (req, res) => {
    console.log('Choose color request received');
    const { gameId, playerId, payload } = req.body;
    const log = new LogSession(gameId);
    try {
        const { color } = payload;
        log.addEvent('Request received choose color' + color);
        const svc = new ChessGameService(gameId, log);
        const result = svc.chooseColor(playerId, color);
        if (result) {
            return res.json(ApiResponse.messageResponse(
                result
            ));
        } else {
            throw new ApiError("Failed to choose color", 400);
        }
    } catch (err) {
        const status = err.status || 500;
        res.status(status).json(ApiResponse.error(err.message, status));
        log.addEvent('Error:' + err);
    } finally {
        log.writeToFile();
        console.log('Choose color request response sent');
    }
}
exports.resign = async (req, res) => {
    console.log('Request resign received');
    const { io } = require('./chessSocketController');
    const {gameId, payload, playerId} = req.body;
    const log = new LogSession(gameId);
    const svc = new ChessGameService(gameId, log);
    const db = new ChessDbManager();
    try{
        const color = db.getPlayerColor(gameId, playerId);
        if(!color){
            throw new ApiError("Player is not in the game", 400);
        }
        const { resign } = payload;
        if(resign){
            io.to(gameId).emit('resignation',{ playerId: playerId, by: db.getPlayerColor(gameId, playerId) })
        }
        
    }catch(err){
        const status = err.status || 500;
        res.status(status).json(ApiResponse.error(err.message, status));
        log.addEvent('Error:' + err);
    }finally{
        log.writeToFile();
        console.log('Request premature end response sent');
    }
}
exports.drawResponse = async (req, res) => {
    console.log('Request drawResponse received');
    const { io } = require('./chessSocketController');
    const {gameId, payload, playerId} = req.body;
    const log = new LogSession(gameId);
    const svc = new ChessGameService(gameId, log);
    const db = new ChessDbManager();
    try{
        const { accept } = payload;
        //get playerId color
        const accepted = accept === 'Accept' ? 1: 0;
        let drawStatus = db.getDrawStatus(gameId);
        if(accepted === 1){
            console.log('Player ' + playerId + ' accepted the draw offer');
            if(db.getPlayer(gameId, 'black') === 'ai'){//check if AI and set alertnate to true
                console.log(`Player is AI game, setting draw status for black to ${accepted}`);
                db.setDrawStatus(gameId, 'black', accepted)
            }
            const playerColor = db.getPlayerColor(gameId, playerId);
            if(!playerColor){
                console.log(`Player${playerId} cant not respond to draw in this game ${gameId}`);
                return
            }
            db.setDrawStatus(gameId, playerColor, accepted);//Save response to DB if playerId calls back correct color
            drawStatus = db.getDrawStatus(gameId);
            if(drawStatus.black  && drawStatus.white ){//Check if both users have accepted draw
                console.log('Both players accepted the draw offer');
                io.to(gameId).emit('drawResult', drawStatus);//Emit if we are drawing game
            }else{
                //do nothing if both answers are not true
            }
        }else{
            console.log('Player ' + playerId + ' declined the draw offer');
            db.setDrawStatus(gameId, 'white', 0);//reset DB's
            db.setDrawStatus(gameId, 'black', 0);
            drawStatus = db.getDrawStatus(gameId);
            const by = db.getPlayerColor(gameId, playerId);
            io.to(gameId).emit('drawResult', {by: by, drawStatus}); // Emit the draw result to all connected clients in the room
        }
        drawStatus = db.getDrawStatus(gameId);
        return res.json(ApiResponse.success(
                drawStatus // Get the current game state
            ));
    }catch(err){
        const status = err.status || 500;
        res.status(status).json(ApiResponse.error(err.message, status));
        log.addEvent(`Error: ${err}`);
    }finally{
        log.writeToFile();
        console.log('Request drawResponse response sent');
    }
}
exports.claimDraw = async (req, res) => {
    console.log('Request claimDraw received');
    const { io } = require('./chessSocketController');
    const {gameId, playerId} = req.body;
    const log = new LogSession(gameId);
    const svc = new ChessGameService(gameId, log);
    const db = new ChessDbManager();
    try{
        const color = db.getPlayerColor(gameId, playerId);
        if(!color){
            throw new ApiError("Player is not in the game", 400);
        }
        if(svc.evaluateStatus().includes('draw')){
            io.to(gameId).emit('drawClaimed', { by: color });
        }else{
            throw new ApiError("Claim draw failed, game is not drawable", 400);
        }
        return res.json(ApiResponse.success(
            getState(svc) // Get the current game state
        ));
    }catch(err){
        const status = err.status || 500;
        res.status(status).json(ApiResponse.error(err.message, status));
        log.addEvent('Error:' + err);
    }finally{
        log.writeToFile();
        console.log('Request claimDraw response sent');
    }
}
/**
 * Retrieves the current state of the chess game from the provided service object.
 *
 * @param {Object} svc - The service object containing game state information.
 * @param {Object} svc.chessBoard - The chess board object.
 * @param {string} svc.chessBoard.fen - The FEN string representing the board state.
 * @param {string} svc.gameId - The unique identifier for the game.
 * @param {string} svc.chessBoard.activeColor - The color whose turn it is to move.
 * @param {string} svc.capturedString - A string representing captured pieces.
 * @param {boolean} svc.CheckMate - Indicates if the game is in checkmate.
 * @param {string} svc.status - The current status of the game.
 * @returns {Object} The current state of the chess game, including FEN, game ID, active color, check status, captured pieces, checkmate status, and game status.
 */
function getState(svc){
    return state = {
                    fen: svc.chessBoard.fen, // Get the FEN string from the gameservice
                    gameId: svc.gameId, // Get the game ID
                    activeColor: svc.chessBoard.activeColor, // Get the active color (turn)
                    inCheck: MoveUtils.isKingInCheck(svc.chessBoard.fen), // Check if the active color is in check
                    capturedString: svc.capturedString, // Get the captured pieces
                    checkMate: svc.CheckMate, // Check if the game is in checkmate
                    status: svc.status, // Get the game status
                };
}