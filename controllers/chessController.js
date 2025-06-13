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
            state // TODO:: should we even return state socket shoud take care of that?
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
exports.requestPrematureEnd = async (req, res) => {
    console.log('Request premature end received');
    const { io } = require('./chessSocketController');
    const {gameId, payload, playerId} = req.body;
    const log = new LogSession(gameId);
    const svc = new ChessGameService(gameId, log);
    try{
        const { message } = payload;
        switch(message){
            case 'draw':
                if(svc.requestDraw()){
                    io.to(gameId).emit('drawClaimed');
                }else{
                    
                }
                //TODO:: I should save something to db here
                break;
            case 'resign':
                io.to(gameId).emit('resigned', playerId);
                //emit resign;
                //TODO:: I should save something to db here
                break;
            default:
                throw new ApiError("Bad request: " + action ,400);
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
                db.setDrawStatus(gameId, 'black', accepted)
            }
            const playerColor = db.getPlayerColor(gameId, playerId);
            if(!playerColor){
                console.log(`Player${playerId} cant not respond to draw in this game ${gameId}`);
                return
            }
            db.setDrawStatus(gameId, playerColor, accepted);//Save response to DB if playerId calls back correct color
            drawStatus = db.getDrawStatus(gameId);
            if(drawStatus.black && drawStatus.white){//Check if both users have accepted draw
                io.to(gameId).emit('gameDrawn', drawStatus);//Emit if we are drawing game
            }else{
                //do nothing if both answers are not true
            }
        }else{
            console.log('Player ' + playerId + ' declined the draw offer');
            db.setDrawStatus(gameId, 'white', 0);//reset DB's
            db.setDrawStatus(gameId, 'black', 0);
            drawStatus = db.getDrawStatus(gameId);
            io.to(gameId).emit('drawFailed', drawStatus)
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

//gets current game state
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