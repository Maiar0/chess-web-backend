const ApiResponse = require('../utils/ApiResponse');
const MoveUtils = require('../utils/chess/MoveUtils');
const ChessGameService = require('../services/chess/ChessGameService');
const ApiError = require('../utils/ApiError');

exports.handle = (req, res) => {
    const {action, gameId, payload} = req.body;
    const svc = new ChessGameService(gameId);
    console.log('-----------------Turn Start-----------------');
    try{
        let result = false;
        const {from, to} = payload;
        switch(action){
            case 'move':
                if(svc.requestMove(from, to)){
                    console.log('Move successful from', from, 'to', to);
                    if(svc.endTurn()){
                        console.log('-----------------Turn End-----------------');
                        result = true;
                    }
                }
                break;
            case 'promote':
                if(svc.requestPromotion(from, to, payload.promoteTo)){
                    if(svc.endTurn()){
                        result = true;
                    }
                }
                break;
            case 'newGame':
                if(svc.newGame()){
                    console.log('-----------------New game started---------------');
                    result = true;
                }
                break;
            case 'info':
            if(svc.newGame(gameId)){
                console.log('-----------------Game info requested', gameId,'---------------------');
                result = true;
            }
                break;
            default: 
                throw new ApiError("Action Unknown: " + action,520);
        }
        let responseEnvelope = null; // Initialize the response envelope
        if(result){
            responseEnvelope = ApiResponse.successResponse(//TODO:: we should grab data from database
                svc.officialFen, // Get the FEN string from the chess board
                svc.gameId, // Get the game ID
                svc.chessBoard.activeColor, // Get the active color (turn)
                MoveUtils.isKingInCheck(svc.chessBoard.fen), // Check if the active color is in check
                svc.capturedString,// Get the captured pieces
                svc.CheckMate
            );
        }else{
            responseEnvelope = ApiResponse.error("Invalid Move", err.status); // Return an error response if the move is invalid
        }
        return res.json(responseEnvelope); // Return the response envelope as JSON
    }catch (err) {
        const status = err.status || 500;
        res.status(status).json(ApiResponse.error(err.message, status));
  }
}