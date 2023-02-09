$(function () {
    init();
    parseFen(START_FEN);
    printBoard()
});

function initFilesRanksBrd() {
    var index = 0;
    var file = FILES.FILE_A;
    var rank = RANKS.RANK_1;
    var sq = SQUARES.A1;
    for(let index = 0; index < BRD_SQ_NUM; ++index) {
        FilesBoard[index] = SQUARES.OFFBOARD;
        RanksBoard[index] = SQUARES.OFFBOARD;
    }
    for(let rank = RANKS.RANK_1; rank <= RANKS.RANK_8; ++rank) {
        for(let file = FILES.FILE_A; file <= FILES.FILE_H; ++file) {
            sq = FR2SQ(file, rank);
            FilesBoard[sq] = file;
            RanksBoard[sq] = rank;
        }
    }
}

function initHashKeys() {
    for(let index = 0; index < 14 * 120; ++index) {
        PieceKeys[index] = RAND_32;
    }
    SideKey = RAND_32();
    for(let index = 0; index < 16; ++index) {
        Castlekeys[index] = RAND_32();
    }
}

function initSq120to64() {
    var index = 0;
    var file = FILES.FILE_A;
    var rank = RANKS.RANK_1;
    var sq = SQUARES.A1;
    var sq64 = 0;
    for(let index = 0; index < BRD_SQ_NUM; ++index) {
        Sq120ToSq64[index] = 65;
    }
    for(let index = 0; index < BRD_SQ_NUM; ++index) {
        Sq64ToSq120[index] = 120;
    }
    for(let rank = RANKS.RANK_1; rank < RANKS.RANK_8; ++rank) {
        for(let file = FILES.FILE_A; file < FILES.FILE_H; ++file) {
            sq = FR2SQ(file, rank);
            Sq64ToSq120[sq64] = sq;
            Sq120ToSq64[sq] = sq64;
        }
    }
}

function init() {
    console.log("init() called")
    initFilesRanksBrd();
    initHashKeys();
}