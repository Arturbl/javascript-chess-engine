function PCEINDEX(pce, pceNum) {
    return (pce * 10 + pceNum);
}

var GameBoard = {};

GameBoard.pieces = new Array(BRD_SQ_NUM);
GameBoard.side = COLOURS.WHITE;
GameBoard.fiftyMove = 0; // players can claim a draw if both player made 50 moves
GameBoard.hisPly = 0; // count every move in the game
GameBoard.ply = 0; // half made in search tree
GameBoard.enPas = 0; // if a pawn advances two squares in starting move
GameBoard.castlePerm = 0; // check if castling is allowed
GameBoard.material = new Array(2); // WHITE, BLACK material of pieces
GameBoard.pceNum = new Array(13); // indexed by piece
GameBoard.pList = new Array(14 * 10);
GameBoard.posKey = 0; // unique that represents the position on the board

GameBoard.moveList = new Array(MAXDEPTH * MAXPOSITIONSMOVES);
GameBoard.moveScores = new Array(MAXDEPTH * MAXPOSITIONSMOVES);
GameBoard.moveListStart = new Array(MAXDEPTH);


function printBoard() {
    var sq, file, rank, piece;
    console.log("\nGame board:\n")
    for(let rank = RANKS.RANK_8; rank >= RANKS.RANK_1; rank--) {
        var line = (RankChar[rank] + " ");
        for(let file = FILES.FILE_A; file <= FILES.FILE_H; file++) {
            sq = FR2SQ(file, rank);
            piece = GameBoard.pieces[sq];
            line += (" " + PceChar[piece] + " ");
        }
        console.log(line);
    }
    console.log("");
    var line = " ";
    for (let file = FILES.FILE_A; file <= FILES.FILE_H; file++) {
        line += (' ' + FileChar[file] + ' ');
    }
    console.log(line);
    console.log("Side: " + SideChar[GameBoard.side]);
    console.log("enPas: " + GameBoard.enPas);
    line = "";
    if(GameBoard.castlePerm && CASTLEBIT.WKCA) line += 'K';
    if(GameBoard.castlePerm && CASTLEBIT.WQCA) line += 'Q';
    if(GameBoard.castlePerm && CASTLEBIT.BKCA) line += 'k';
    if(GameBoard.castlePerm && CASTLEBIT.BQCA) line += 'q';
    console.log("castle: " + line);
    console.log("key: " + GameBoard.posKey.toString(16))
}

function generatePosKey() {
    var sq = 0;
    var finalKey = 0;
    var piece = PIECES.EMPTY;
    for(let sq = 0; sq < BRD_SQ_NUM; ++sq) {
        piece = GameBoard.pieces[sq];
        if(piece !== PIECES.EMPTY && piece !== SQUARES.OFFBOARD) {
            finalKey ^= PieceKeys[(piece * 120) + sq];
        }
    }
    if(GameBoard.side === COLOURS.WHITE) {
        finalKey ^= SideKey;
    }
    if(GameBoard.enPas !== SQUARES.NO_SQ) {
        finalKey ^= PieceKeys[GameBoard.enPas];
    }
    finalKey ^= Castlekeys[GameBoard.castlePerm];
    return finalKey;
}

function resetBoard() {
    for(let index = 0; index < BRD_SQ_NUM; ++index) {
        GameBoard.pieces[index] = SQUARES.OFFBOARD;
    }
    for(let index = 0; index < 64; ++index) {
        GameBoard.pieces[SQ120(index)] = PIECES.EMPTY;
    }
    for(let index = 0; index < 14 * 120; ++index) {
        GameBoard.pList[index] = PIECES.EMPTY;
    }
    for(let index = 0; index < 2; ++index) {
        GameBoard.material[index] = 0;
    }
    for(let index = 0; index < 13; ++index) {
        GameBoard.pceNum[index] = 0;
    }
    GameBoard.side = COLOURS.BOTH;
    GameBoard.enPas = SQUARES.NO_SQ;
    GameBoard.fiftyMove = 0;
    GameBoard.ply = 0;
    GameBoard.hisPly = 0;
    GameBoard.castlePerm = 0;
    GameBoard.posKey = 0;
    GameBoard.moveListStart[GameBoard.ply] = 0;
}

// rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
function parseFen(fen) {
    resetBoard();
    var file = FILES.FILE_A;
    var rank = RANKS.RANK_8;
    var piece = 0;
    var count = 0;
    var i = 0;
    var sq120 = 0;
    var fenCount = 0; // fen[fenCount]
    while((rank >= RANKS.RANK_1) && fenCount < fen.length) {
        count = 1;
        switch (fen[fenCount]) {
            case 'p': piece = PIECES.bP; break;
            case 'r': piece = PIECES.bR; break;
            case 'n': piece = PIECES.bN; break;
            case 'b': piece = PIECES.bB; break;
            case 'k': piece = PIECES.bK; break;
            case 'q': piece = PIECES.bQ; break;
            case 'P': piece = PIECES.wP; break;
            case 'R': piece = PIECES.wR; break;
            case 'N': piece = PIECES.wN; break;
            case 'B': piece = PIECES.wB; break;
            case 'K': piece = PIECES.wK; break;
            case 'Q': piece = PIECES.wQ; break;

            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
            case '7':
            case '8':
                piece = PIECES.EMPTY;
                count = fen[fenCount].charCodeAt() - '0'.charCodeAt();
                break;
            case '/':
            case ' ':
                rank--;
                file = FILES.FILE_A;
                fenCount++;
                continue;
            default:
                console.log("FEN error")
                return;
        }
        for(let i = 0; i < count; i++) {
            sq120 = FR2SQ(file, rank);
            GameBoard.pieces[sq120] = piece;
            file++;
        }
        fenCount++;
    }
    GameBoard.side = (fen[fenCount] === 'w') ? COLOURS.WHITE : COLOURS.BLACK;
    fenCount += 2;
    for(let i = 0; i < 4; i++) {
        if(fen[fenCount] === '') {
            break;
        }
        switch (fen[fenCount]) {
            case 'K': GameBoard.castlePerm |= CASTLEBIT.WKCA; break;
            case 'Q': GameBoard.castlePerm |= CASTLEBIT.WQCA; break;
            case 'k': GameBoard.castlePerm |= CASTLEBIT.BKCA; break;
            case 'q': GameBoard.castlePerm |= CASTLEBIT.BKCA; break;
            default: break;
        }
        fenCount++;
    }
    fenCount++;
    if(fen[fenCount] !== '-') {
        file = fen[fenCount].charCodeAt() - 'a'.charCodeAt();
        rank = fen[fenCount + 1].charCodeAt() - '1'.charCodeAt();
        GameBoard.enPas = FR2SQ(file, rank);
    }
    GameBoard.posKey = generatePosKey();
}
