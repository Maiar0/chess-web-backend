const ApiResponse = require('../utils/ApiResponse');
const MoveUtils = require('../utils/chess/MoveUtils');
const ChessGameService = require('../services/chess/ChessGameService');
const ApiError = require('../utils/ApiError');
const LogSession = require('../utils/logging/LogSession');

exports.handle = async (req, res) => {
    const { io } = require('./chessSocketController');
    console.log('-----------------Recieved Request-----------------');
    const {action, gameId, payload, playerId} = req.body;
    const log = new LogSession(gameId,{ gameId: gameId, playerId: playerId });
    console.log('(action:', action, ')(gameId:', gameId, ')(payload:', payload,')(playerId:', playerId,')');
    const svc = new ChessGameService(gameId, log);
    try{
        let result = false;
        const {from, to, promoteTo, isAi} = payload;
        log.addEvent('Request received', { action: action, move: {from, to}, promoteTo: promoteTo, isAi: isAi });

        switch(action){
            case 'move':
                result = await svc.requestMove(from, to, promoteTo, playerId); 
                let state = {
                    fen: svc.officialFen, // Get the FEN string from the chess board
                    gameId: svc.gameId, // Get the game ID
                    activeColor: svc.chessBoard.activeColor, // Get the active color (turn)
                    inCheck: MoveUtils.isKingInCheck(svc.officialFen), // Check if the active color is in check
                    capturedString: svc.capturedString, // Get the captured pieces
                    checkMate: svc.CheckMate // Check if the game is in checkmate
                };
                io.to(gameId).emit('gameState', state); // Emit the game state to all connected clients in the room
                log.addEvent('Completed Move State:', {endState: state})
                log.setResult('Move applied successfully.');
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
                svc.officialFen, // Get the FEN string from the chess board
                svc.gameId, // Get the game ID
                svc.chessBoard.activeColor, // Get the active color (turn)
                MoveUtils.isKingInCheck(svc.officialFen), // Check if the active color is in check
                svc.capturedString,// Get the captured pieces
                svc.CheckMate
            );
        }else{
            responseEnvelope = ApiResponse.error("Unkown Error", 400); // Return an error response if the move is invalid
        }
        return res.json(responseEnvelope); // Return the response envelope as JSON
    }catch (err) {
        log.addError(err);
        const status = err.status || 500;
        res.status(status).json(ApiResponse.error(err.message, status));
    } finally{
        log.writeToFile();
    }
}