const ApiResponse = require('../utils/ApiResponse');
const MoveUtils = require('../utils/chess/MoveUtils');
const ChessGameService = require('../services/chess/ChessGameService');
const ApiError = require('../utils/ApiError');
const LogSession = require('../utils/logging/LogSession');
const req = require('express/lib/request');



exports.handle = async (req, res) => {
    const { io } = require('./chessSocketController');
    console.log('-----------------Recieved Request-----------------');
    const {action, gameId, payload, playerId} = req.body;
    const log = new LogSession(gameId);
    let svc = new ChessGameService(gameId, log);
    try{
        let result = false;
        const {from, to, promoteTo, isAi} = payload;
        
        log.addEvent('Request received' + JSON.stringify(getState(svc)));

        switch(action){
            case 'move':
                result = svc.requestMove(from, to, promoteTo, playerId); 
                if(svc.isAisTurn()){
                    svc = new ChessGameService(gameId, log); // Reinitialize to ensure fresh state for AI processing
                    result = await svc.processAiMove(); // Process AI's turn if it's AI's turn
                }
                const state = getState(svc); // get the game state after the move
                io.to(gameId).emit('gameState', state); // Emit the game state to all connected clients in the room
                log.addEvent('Response State:' + JSON.stringify(state));
                break;
            case 'newGame':
                if(svc.newGame(isAi)){
                    console.log('-----------------New game started',isAi, '---------------');
                    result = true;
                }
                break;
            case 'info':
            if(svc.infoGame(playerId)){
                console.log('-----------------Game info requested', gameId,'---------------------');
                log.addEvent('Info Request State:' + JSON.stringify(getState(svc)));
                result = true;
            }
                break;
            default: 
                throw new ApiError("Bad request: " + action ,400);
        }
        console.log('-----------------Request Completed-----------------');
        let responseEnvelope = null; // Initialize the response envelope
        if(result){
            responseEnvelope = ApiResponse.successResponse(//TODO:: we should grab data from database?
                svc.chessBoard.fen, // Get the FEN string from the chess board
                svc.gameId, // Get the game ID
                svc.chessBoard.activeColor, // Get the active color (turn)
                MoveUtils.isKingInCheck(svc.chessBoard.fen), // Check if the active color is in check
                svc.capturedString,// Get the captured pieces
                svc.CheckMate,
                svc.status
            );
        }else{
            responseEnvelope = ApiResponse.error("Unkown Error", 400); // Return an error response if the move is invalid
        }
        return res.json(responseEnvelope); // Return the response envelope as JSON
    }catch (err) {
        const status = err.status || 500;
        res.status(status).json(ApiResponse.error(err.message, status));
        log.addEvent('Error:' + err);
    } finally{
        log.writeToFile();
    }
}
exports.requestMove = async (req, res) => {
    const { io } = require('./chessSocketController');
    const {action, gameId, payload, playerId} = req.body;   
    const log = new LogSession(gameId);
    let svc = new ChessGameService(gameId, log);
    try{
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
    }
}
//instantiate a new game
exports.newGame = async (req, res) => {
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
    }
}
//For getting state information about game
exports.getInfo = async (req, res) => {
    const { gameId, playerId, payload } = req.body;
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
    }
}

exports.chooseColor = async (req, res) => {
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
    }
}
exports.requestPrematureEnd = async (req, res) => {
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
                break;
            case 'resign':
                io.to(gameId).emit('resigned', playerId);
                //emit resign;
                break;
            default:
                throw new ApiError("Bad request: " + action ,400);
        }
    }catch(err){
        res.status(err.status || 500).json(ApiResponse.error(err.message, err.status || 500));
    }finally{
        log.writeToFile();
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