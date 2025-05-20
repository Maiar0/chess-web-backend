const ApiResponse = require('../utils/ApiResponse');
const ChessGameService = require('../services/chess/ChessGameService');

exports.handle = (req, res) => {
    const {action, gameId, payload} = req.body;
    const svc = new ChessGameService(gameId);

    try{
        let result = false;
        const {from, to} = payload;
        switch(action){
            case 'move':
                if(svc.requestMove(from, to)){
                    console.log('Move successful from', from, 'to', to);
                    if(svc.endTurn()){
                        console.log('Turn ended successfully');
                        result = true;
                    }//TODO:: This needs tested apropriately
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
                    console.log('New game started');
                    result = true;
                }
                break;
            case 'info':
            if(svc.newGame(gameId)){
                console.log('Game info requested', gameId);
                result = true;
            }
                break;
            default: 
                throw new Error("Action Unknown: " + action);
        }
        let responseEnvelope = null; // Initialize the response envelope
        if(result){
            responseEnvelope = ApiResponse.successResponse(
                svc.chessBoard.fen, // Get the FEN string from the chess board
                svc.gameId, // Get the game ID
                svc.chessBoard.activeColor, // Get the active color (turn)
                svc.chessBoard.isInCheck(svc.chessBoard.activeColor), // Check if the active color is in check
                svc.chessBoard.capturedPieces // Get the captured white pieces
            );
        }else{
            responseEnvelope = ApiResponse.error("Invalid Move", 400); // Return an error response if the move is invalid
        }
        return res.json(responseEnvelope); // Return the response envelope as JSON
    }catch(err){
        return res
            .status(500)
            .json(ApiResponse.error(err.message, 500)); // Return an error response with the error message and status code

    }
}