//jshint esversion: 6
//jshint browser: true

let pieces = [];
let boardSquares = [];
let selectedSquare = null;
let moveHistory = [];
let currentCallback = null;
let fenBoard = Array(8).fill().map(() => Array(8).fill(null));
let pgnMoves = [];
let currentPgnMoveIndex = -1;

// Audio objects for various sounds
const checkSound = new Audio('../sounds/move-check.ogg');
const moveSound = new Audio('../sounds/move.ogg');
const captureSound = new Audio('../sounds/capture.ogg');
const promoteSound = new Audio('../sounds/promote.ogg');
const castleSound = new Audio('../sounds/castle.ogg');
const invalidSound = new Audio('../sounds/illegal.ogg');
const checkmateSound = new Audio('../sounds/game-end.ogg');
const gameStartSound = new Audio('../sounds/game-start.ogg');

let Player = function(color) {
  this.checked = false;
  this.color = color;
  this.castled = false;
  this.king = null;
  this.kingMoved = false;
  this.rooksMoved = {left: false, right: false};
  this.promote = null;
  this.moved = null;
}

let turn = 1;
let white = new Player("white");
let black = new Player("black");
let currentPlayer = white;

// Game settings
let isComputerOpponent = false;
let computerColor = null;
let timePerPlayer = 10 * 60;
let isUnlimitedTime = false;
let whiteTime = timePerPlayer;
let blackTime = timePerPlayer;

let SquareObject = function(x, y, color, selected, element, piece) {
  this.x = x;
  this.y = y;
  this.color = color;
  this.selected = selected;
  this.element = element;
  this.piece = piece;
}

SquareObject.prototype.setPiece = function(piece) {
  this.piece = piece;
  this.update();
};

SquareObject.prototype.unsetPiece = function() {
  this.piece = null;
  this.update();
};

SquareObject.prototype.update = function() {
  this.element.className = "square " + this.color + " " + (this.selected ? "selected" : "") + " " + (this.piece === null ? "empty" : this.piece.color + "-" + this.piece.type);
};

SquareObject.prototype.select = function() {
  this.selected = true;
  this.update();
};

SquareObject.prototype.deselect = function() {
  this.selected = false;
  this.update();
};

SquareObject.prototype.hasPiece = function() {
  return this.piece !== null;
}

let Piece = function(x, y, color, type) {
  this.color = color;
  this.type = type;
  this.x = x;
  this.y = y;
  this.captured = false;
  this.lastmoved = 0;
  this.advancedtwo = 0;
  this.hasMoved = false;
};

Piece.prototype.capture = function() {
  this.captured = true;
}

let Castle = function(x, y, color) {
  this.color = color;
  this.type = "castle";
  this.x = x;
  this.y = y;
  this.hasMoved = false;
};

Castle.prototype = new Piece();

Castle.prototype.isValidMove = function(toSquare) {
  let movementY = (toSquare.y - this.y);
  let movementX = (toSquare.x - this.x);
  let directionX = movementX ? (movementX / Math.abs(movementX)) : 0;
  let directionY = movementY ? (movementY / Math.abs(movementY)) : 0;
  let result = { valid: false, capture: null };
  if (movementX == 0 || movementY == 0) {
    let blocked = false;
    for (let testX = this.x + directionX, testY = this.y + directionY; testX != toSquare.x || testY != toSquare.y; testX += directionX, testY += directionY) {
      let testSquare = getSquare(testX, testY);
      blocked = blocked || testSquare.hasPiece();
    }
    if (!blocked) {
      if (!toSquare.hasPiece() || (toSquare.hasPiece() && toSquare.piece.color != this.color && toSquare.piece.type !== "king")) {
        result = { valid: true, capture: toSquare.hasPiece() ? toSquare : null };
      }
    }
  }
  return result;
};

let Knight = function(x, y, color) {
  this.color = color;
  this.type = "knight";
  this.x = x;
  this.y = y;
  this.hasMoved = false;
};

Knight.prototype = new Piece();

Knight.prototype.isValidMove = function(toSquare) {
  let movementY = toSquare.y - this.y;
  let movementX = toSquare.x - this.x;
  let result = { valid: false, capture: null };
  if ((Math.abs(movementX) == 2 && Math.abs(movementY) == 1) || (Math.abs(movementX) == 1 && Math.abs(movementY) == 2)) {
    if (!toSquare.hasPiece() || (toSquare.hasPiece() && toSquare.piece.color != this.color && toSquare.piece.type !== "king")) {
      result = { valid: true, capture: toSquare.hasPiece() ? toSquare : null };
    }
  }
  return result;
}

let Bishop = function(x, y, color) {
  this.color = color;
  this.type = "bishop";
  this.x = x;
  this.y = y;
  this.hasMoved = false;
};

Bishop.prototype = new Piece();

Bishop.prototype.isValidMove = function(toSquare) {
  let movementY = (toSquare.y - this.y);
  let movementX = (toSquare.x - this.x);
  let directionX = movementX ? (movementX / Math.abs(movementX)) : 0;
  let directionY = movementY ? (movementY / Math.abs(movementY)) : 0;
  let result = { valid: false, capture: null };
  if (Math.abs(movementX) == Math.abs(movementY)) {
    let blocked = false;
    for (let testX = this.x + directionX, testY = this.y + directionY; testX != toSquare.x || testY != toSquare.y; testX += directionX, testY += directionY) {
      let testSquare = getSquare(testX, testY);
      blocked = blocked || testSquare.hasPiece();
    }
    if (!blocked) {
      if (!toSquare.hasPiece() || (toSquare.hasPiece() && toSquare.piece.color != this.color && toSquare.piece.type !== "king")) {
        result = { valid: true, capture: toSquare.hasPiece() ? toSquare : null };
      }
    }
  }
  return result;
}

let Queen = function(x, y, color) {
  this.color = color;
  this.type = "queen";
  this.x = x;
  this.y = y;
  this.hasMoved = false;
};

Queen.prototype = new Piece();

Queen.prototype.isValidMove = function(toSquare) {
  let movementY = (toSquare.y - this.y);
  let movementX = (toSquare.x - this.x);
  let directionX = movementX ? (movementX / Math.abs(movementX)) : 0;
  let directionY = movementY ? (movementY / Math.abs(movementY)) : 0;
  let result = { valid: false, capture: null };
  if (Math.abs(movementX) == Math.abs(movementY) || movementX == 0 || movementY == 0) {
    let blocked = false;
    for (let testX = this.x + directionX, testY = this.y + directionY; testX != toSquare.x || testY != toSquare.y; testX += directionX, testY += directionY) {
      let testSquare = getSquare(testX, testY);
      blocked = blocked || testSquare.hasPiece();
    }
    if (!blocked) {
      if (!toSquare.hasPiece() || (toSquare.hasPiece() && toSquare.piece.color != this.color && toSquare.piece.type !== "king")) {
        result = { valid: true, capture: toSquare.hasPiece() ? toSquare : null };
      }
    }
  }
  return result;
}

let King = function(x, y, color) {
  this.color = color;
  this.type = "king";
  this.x = x;
  this.y = y;
  this.checkedBy = null;
  this.hasMoved = false;
};

King.prototype = new Piece();

King.prototype.isValidMove = function(toSquare) {
  let movementY = toSquare.y - this.y;
  let movementX = toSquare.x - this.x;
  let result = { valid: false, capture: null };
  if (Math.abs(movementX) <= 1 && Math.abs(movementY) <= 1 && (movementX != 0 || movementY != 0)) {
    if (!toSquare.hasPiece() || (toSquare.hasPiece() && toSquare.piece.color != this.color && toSquare.piece.type !== "king")) {
      result = { valid: true, capture: toSquare.hasPiece() ? toSquare : null };
    }
  } else if (movementY == 0 && Math.abs(movementX) == 2 && !this.hasMoved && !currentPlayer.rooksMoved[(movementX > 0 ? 'right' : 'left')] && !currentPlayer.checked) {
    let direction = movementX > 0 ? 1 : -1;
    let rookSide = direction > 0 ? 'right' : 'left';
    let rookX = direction > 0 ? 8 : 1;
    let rookSquare = getSquare(rookX, this.y);
    if (rookSquare.hasPiece() && rookSquare.piece.type === 'castle' && rookSquare.piece.color === this.color && !rookSquare.piece.hasMoved) {
      let blocked = false;
      for (let testX = this.x + direction; testX != rookX; testX += direction) {
        if (getSquare(testX, this.y).hasPiece()) {
          blocked = true;
          break;
        }
      }
      if (!blocked) {
        let pathSafe = true;
        let steps = Math.abs(movementX);
        for (let step = 1; step <= steps; step++) {
          let testX = this.x + (direction * step);
          let testPos = {x: testX, y: this.y, color: this.color};
          if (kingExposed(testPos)) {
            pathSafe = false;
            break;
          }
        }
        if (pathSafe) {
          result = { valid: true, capture: null, castle: true };
        }
      }
    }
  }
  return result;
}

let Pawn = function(x, y, color) {
  this.color = color;
  this.type = "pawn";
  this.x = x;
  this.y = y;
  this.hasMoved = false;
};

Pawn.prototype = new Piece();

Pawn.prototype.isValidMove = function(toSquare) {
  let movementY = (toSquare.y - this.y);
  let movementX = (toSquare.x - this.x);
  let direction = this.color == "white" ? -1 : 1;
  let result = { valid: false, capture: null };
  let startRank = this.color == "white" ? 7 : 2;
  if (!this.hasMoved && movementY == direction * 2 && movementX == 0 && this.y == startRank && !getSquare(this.x, this.y + direction).hasPiece() && !toSquare.hasPiece()) {
    result = { valid: true, capture: null };
  } else if (movementY == direction) {
    if (Math.abs(movementX) == 1) {
      if (toSquare.hasPiece() && toSquare.piece.color != this.color && toSquare.piece.type !== "king") {
        result = { valid: true, capture: toSquare };
      } else {
        let passantSquare = getSquare(toSquare.x, this.y);
        if (passantSquare.hasPiece() && passantSquare.piece.color != this.color && passantSquare.piece.type == "pawn" && passantSquare.piece.lastmoved == turn - 1 && Math.abs(passantSquare.y - toSquare.y) == 2) {
          result = { valid: true, capture: passantSquare };
          result.enPassant = true;
        }
      }
    } else if (movementX == 0 && !toSquare.hasPiece()) {
      result = { valid: true, capture: null };
    }
  }
  let promote = false;
  if ((this.color == "white" && toSquare.y == 1) || (this.color == "black" && toSquare.y == 8)) {
    promote = true;
  }
  if (promote && result.valid) {
    result.promote = true;
  }
  return result;
}

function toAlgebraicNotation(x, y) {
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  return files[x - 1] + (9 - y);
}

function pieceToSymbol(piece) {
  const symbols = {
    pawn: '♙',
    knight: '♘',
    bishop: '♗',
    castle: '♖',
    queen: '♕',
    king: '♔'
  };
  let symbol = symbols[piece.type];
  if (piece.color === 'black') {
    symbol = symbol.replace('♙', '♟').replace('♘', '♞').replace('♗', '♝').replace('♖', '♜').replace('♕', '♛').replace('♔', '♚');
  }
  return symbol;
}

function updateMoveNotation(startSquare, endSquare, piece, isCapture, isCastle, promotePiece, isEnPassant = false) {
  let moveText = '';
  const moveNumber = Math.ceil(turn / 2);
  
  if (isCastle) {
    moveText = endSquare.x > startSquare.x ? 'O-O' : 'O-O-O';
  } else {
    const pieceSymbol = piece.type === 'pawn' && !isCapture ? '' : pieceToSymbol(piece);
    const captureSymbol = isCapture ? 'x' : '';
    let fromNotation = toAlgebraicNotation(startSquare.x, startSquare.y);
    if (piece.type === 'pawn' && (isCapture || isEnPassant)) {
      fromNotation = toAlgebraicNotation(startSquare.x, startSquare.y);
    }
    moveText = `${pieceSymbol}${fromNotation}${captureSymbol}${toAlgebraicNotation(endSquare.x, endSquare.y)}`;
    if (promotePiece) {
      moveText += `=${pieceToSymbol(promotePiece)}`;
    }
    if (isEnPassant) {
      moveText += ' e.p.';
    }
  }

  moveHistory.push({ moveNumber, color: piece.color, moveText });
  
  const moveNotationContainer = document.getElementById('moveNotation');
  if (moveNotationContainer) {
    moveNotationContainer.innerHTML = '';
    
    let currentMoveDiv = null;
    moveHistory.forEach((move, index) => {
      if (move.color === 'white') {
        currentMoveDiv = document.createElement('span');
        currentMoveDiv.className = 'move-entry';
        currentMoveDiv.style.animationDelay = `${index * 0.1}s`;
        currentMoveDiv.textContent = `${move.moveNumber}. ${move.moveText} `;
        moveNotationContainer.appendChild(currentMoveDiv);
      } else if (currentMoveDiv) {
        currentMoveDiv.textContent += move.moveText + ' ';
      }
    });
    
    moveNotationContainer.scrollLeft = moveNotationContainer.scrollWidth;
  }
}

function animatePiece(startSquare, endSquare, piece, callback) {
  const startElement = startSquare.element;
  const endElement = endSquare.element;
  const pieceElement = startElement.querySelector(`.${piece.color}-${piece.type}`);
  
  if (!pieceElement) return callback();
  
  pieceElement.classList.add('piece-animating');
  
  const startRect = startElement.getBoundingClientRect();
  const endRect = endElement.getBoundingClientRect();
  
  const deltaX = endRect.left - startRect.left;
  const deltaY = endRect.top - startRect.top;
  
  pieceElement.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
  
  pieceElement.addEventListener('transitionend', function handler() {
    pieceElement.classList.remove('piece-animating');
    pieceElement.style.transform = '';
    startSquare.update();
    endSquare.update();
    pieceElement.removeEventListener('transitionend', handler);
    callback();
  }, { once: true });
}

function hidePromotionMenu() {
  const overlay = document.getElementById('promotionMessage');
  if (overlay) {
    overlay.classList.remove('show');
  }
}

function promote(type) {
  hidePromotionMenu();
  if (currentCallback) {
    currentCallback(type);
    currentCallback = null;
  }
}

function showPromotionMenu(square, piece, callback) {
  const overlay = document.getElementById('promotionMessage');
  if (!overlay) return;

  document.getElementById('alertText').textContent = 'Choose your promotion piece!';
  overlay.classList.add('show');

  currentCallback = (type) => {
    let promoteSquare = getSquare(piece.x, piece.y + (piece.color === 'white' ? -1 : 1));
    animatePiece(square, promoteSquare, piece, () => {
      callback(type);
    });
  };

  const squareRect = square.element.getBoundingClientRect();
  const overlayInner = overlay.querySelector('.overlay-inner');
  overlayInner.style.position = 'absolute';
  overlayInner.style.left = `${squareRect.left}px`;
  overlayInner.style.top = `${squareRect.top}px`;
}

function showFenEditor() {
  const fenEditor = document.getElementById('fenEditor');
  fenEditor.style.display = 'block';
  const miniBoard = document.getElementById('miniBoard');
  miniBoard.innerHTML = '';

  fenBoard = Array(8).fill().map(() => Array(8).fill(null));
  boardSquares.forEach(square => {
    if (square.piece) {
      const pieceType = `${square.piece.color[0]}${square.piece.type}`;
      fenBoard[8 - square.y][square.x - 1] = pieceType;
    }
  });

  for (let y = 1; y <= 8; y++) {
    for (let x = 1; x <= 8; x++) {
      let squareElement = document.createElement('div');
      let color = ((x + y) % 2 === 0) ? 'light' : 'dark';
      squareElement.className = `square ${color}`;
      squareElement.style.width = '25px';
      squareElement.style.height = '25px';
      squareElement.setAttribute('data-x', x);
      squareElement.setAttribute('data-y', y);
      squareElement.addEventListener('click', function() {
        const pieceType = document.getElementById('pieceSelect').value;
        fenBoard[8 - y][x - 1] = pieceType === 'empty' ? null : pieceType;
        updateMiniBoard();
      });
      miniBoard.appendChild(squareElement);
    }
  }
  updateMiniBoard();
}

function updateMiniBoard() {
  const miniBoard = document.getElementById('miniBoard');
  const squares = miniBoard.getElementsByClassName('square');
  Array.from(squares).forEach(square => {
    const x = parseInt(square.getAttribute('data-x')) - 1;
    const y = 8 - parseInt(square.getAttribute('data-y'));
    const piece = fenBoard[y][x];
    square.className = `square ${((x + y + 1) % 2 === 0) ? 'light' : 'dark'}`;
    if (piece) {
      const [color, type] = piece.split(/(?=[A-Z])/);
      square.classList.add(`${color === 'w' ? 'white' : 'black'}-${type.toLowerCase()}`);
    }
  });
}

function applyFenToBoard() {
  const fenEditor = document.getElementById('fenEditor');
  fenEditor.style.display = 'none';

  boardSquares.forEach(square => square.unsetPiece());
  pieces = [];
  white.king = null;
  black.king = null;

  const pieceMap = {
    wpawn: Pawn, wknight: Knight, wbishop: Bishop,
    wcastle: Castle, wqueen: Queen, wking: King,
    bpawn: Pawn, bknight: Knight, bbishop: Bishop,
    bcastle: Castle, bqueen: Queen, bking: King
  };

  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const pieceType = fenBoard[y][x];
      if (pieceType) {
        const [color, type] = pieceType.split(/(?=[A-Z])/);
        const PieceClass = pieceMap[pieceType];
        const piece = new PieceClass(x + 1, 8 - y, color === 'w' ? 'white' : 'black');
        pieces.push(piece);
        if (type.toLowerCase() === 'king') {
          if (color === 'w') white.king = piece;
          else black.king = piece;
        }
        getSquare(x + 1, 8 - y).setPiece(piece);
      }
    }
  }

  white.checked = false;
  white.kingMoved = false;
  white.rooksMoved = { left: false, right: false };
  black.checked = false;
  black.kingMoved = false;
  black.rooksMoved = { left: false, right: false };
  currentPlayer = white;
  turn = 1;
  moveHistory = [];

  updateKingCheckHighlight(white);
  updateKingCheckHighlight(black);
  const turnInfoEl = document.getElementById('turnInfo');
  if (turnInfoEl) turnInfoEl.innerHTML = "Player's turn: <b>White</b>";
}

function exportPgn() {
  let pgn = '[Event "Casual Game"]\n';
  pgn += '[Site "Local"]\n';
  pgn += `[Date "${new Date().toISOString().split('T')[0]}"]\n`;
  pgn += '[Round "1"]\n';
  pgn += '[White "Player"]\n';
  pgn += '[Black "Player"]\n';
  pgn += '[Result "*"]\n\n';

  let moveText = '';
  moveHistory.forEach((move, index) => {
    if (move.color === 'white') {
      moveText += `${move.moveNumber}. ${move.moveText} `;
    } else {
      moveText += `${move.moveText} `;
    }
  });

  pgn += moveText.trim() + ' *';

  const pgnDisplay = document.createElement('div');
  pgnDisplay.className = 'overlay show';
  pgnDisplay.innerHTML = `
    <div class="overlay-inner">
      <span class="overlay-title">PGN Export</span>
      <textarea rows="10" cols="50" readonly>${pgn}</textarea>
      <button onclick="this.parentElement.parentElement.remove()">Close</button>
    </div>
  `;
  document.body.appendChild(pgnDisplay);
}

function loadPgn() {
  const pgnInput = document.getElementById('pgnInput').value;
  pgnMoves = parsePgn(pgnInput);
  if (pgnMoves.length === 0) {
    alert('Invalid PGN format');
    return;
  }

  startGame();
  currentPgnMoveIndex = -1;

  const navigationDiv = document.createElement('div');
  navigationDiv.id = 'pgnNavigation';
  navigationDiv.innerHTML = `
    <button id="backPgnButton">Back</button>
    <button id="nextPgnButton">Next</button>
  `;
  document.body.appendChild(navigationDiv);

  document.getElementById('backPgnButton').addEventListener('click', () => navigatePgn(-1));
  document.getElementById('nextPgnButton').addEventListener('click', () => navigatePgn(1));
}

function parsePgn(pgn) {
  const moves = [];
  const lines = pgn.split('\n');
  let moveSection = '';
  lines.forEach(line => {
    if (!line.startsWith('[')) {
      moveSection += line + ' ';
    }
  });

  const moveTokens = moveSection.trim().split(/\s+/);
  let currentMove = { white: null, black: null };
  let moveNumber = 1;

  moveTokens.forEach(token => {
    if (token.match(/^\d+\./)) {
      moveNumber = parseInt(token);
    } else if (token && !['*', '1-0', '0-1', '1/2-1/2'].includes(token)) {
      if (currentMove.white === null) {
        currentMove.white = token;
      } else {
        currentMove.black = token;
        moves.push({ moveNumber, white: currentMove.white, black: currentMove.black });
        currentMove = { white: null, black: null };
      }
    }
  });

  if (currentMove.white && !currentMove.black) {
    moves.push({ moveNumber, white: currentMove.white, black: null });
  }

  return moves;
}

function navigatePgn(direction) {
  currentPgnMoveIndex += direction;

  if (currentPgnMoveIndex < -1) {
    currentPgnMoveIndex = -1;
    startGame();
    return;
  }
  if (currentPgnMoveIndex >= pgnMoves.length * 2) {
    currentPgnMoveIndex = pgnMoves.length * 2 - 1;
    return;
  }

  startGame();
  let moveCount = Math.floor(currentPgnMoveIndex / 2);
  let isWhiteMove = currentPgnMoveIndex % 2 === 0;

  for (let i = 0; i <= moveCount; i++) {
    const move = pgnMoves[i];
    if (move.white) {
      applyPgnMove(move.white, 'white');
    }
    if (move.black && (!isWhiteMove || i < moveCount)) {
      applyPgnMove(move.black, 'black');
    }
  }
}

function applyPgnMove(moveText, color) {
  const pieceMap = { '': 'pawn', 'N': 'knight', 'B': 'bishop', 'R': 'castle', 'Q': 'queen', 'K': 'king' };
  let pieceType = 'pawn';
  let targetSquare = '';
  let isCapture = moveText.includes('x');
  let promotion = null;
  let isCastle = moveText === 'O-O' || moveText === 'O-O-O';

  if (isCastle) {
    const king = color === 'white' ? white.king : black.king;
    const kingSquare = getSquare(king.x, king.y);
    const endX = moveText === 'O-O' ? 7 : 3;
    const endSquare = getSquare(endX, king.y);
    move(kingSquare, endSquare);
    return;
  }

  moveText = moveText.replace(/[+#]?/, '');
  if (moveText.includes('=')) {
    const parts = moveText.split('=');
    moveText = parts[0];
    promotion = pieceMap[parts[1]] || parts[1].toLowerCase();
  }

  const match = moveText.match(/([RNBQK]?)([a-h]?[1-8]?)?x?([a-h][1-8])/);
  if (!match) return;

  const pieceSymbol = match[1];
  const disambiguator = match[2] || '';
  targetSquare = match[3];
  pieceType = pieceMap[pieceSymbol] || 'pawn';

  const file = targetSquare[0].charCodeAt(0) - 'a'.charCodeAt(0) + 1;
  const rank = 9 - parseInt(targetSquare[1]);
  const endSquare = getSquare(file, rank);

  const candidates = pieces.filter(p => 
    p.color === color && 
    p.type === pieceType && 
    !p.captured &&
    (!disambiguator || 
      (disambiguator.length === 1 && p.x === (disambiguator.charCodeAt(0) - 'a'.charCodeAt(0) + 1)) ||
      (disambiguator.length === 2 && p.y === (9 - parseInt(disambiguator[1])))
    )
  );

  for (const piece of candidates) {
    const startSquare = getSquare(piece.x, piece.y);
    const moveResult = piece.isValidMove(endSquare);
    if (moveResult.valid && moveResult.capture === isCapture) {
      move(startSquare, endSquare);
      if (promotion) {
        const promoteSquare = getSquare(endSquare.x, endSquare.y);
        const newPiece = new ({ queen: Queen, castle: Castle, bishop: Bishop, knight: Knight }[promotion])(endSquare.x, endSquare.y, color);
        pieces[pieces.indexOf(piece)] = newPiece;
        promoteSquare.setPiece(newPiece);
      }
      break;
    }
  }
}

function setup() {
  const moveNotationContainer = document.createElement('div');
  moveNotationContainer.id = 'moveNotation';
  document.body.appendChild(moveNotationContainer);

  const promotionHTML = `
    <div class="overlay" id="promotionMessage">
      <div class="overlay-inner">
        <span class="overlay-title">Promotion!</span>
        <p class="overlay-text" id="alertText"></p>
        <ul id="promotionList" class="white">
          <li><a href="#" class="promotion-button queen" onclick="promote('queen');"></a></li>
          <li><a href="#" class="promotion-button castle" onclick="promote('castle');"></a></li>
          <li><a href="#" class="promotion-button bishop" onclick="promote('bishop');"></a></li>
          <li><a href="#" class="promotion-button knight" onclick="promote('knight');"></a></li>
        </ul>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', promotionHTML);

  const endMessageHTML = `
    <div class="overlay" id="endMessage">
      <div class="overlay-inner">
        <span class="overlay-title">Game Over!</span>
        <p class="overlay-text" id="endText"></p>
        <a href="#" class="overlay-button" onclick="newGame();">New Game</a>
        <a href="#" class="overlay-button" onclick="exportPgn();">Export PGN</a>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', endMessageHTML);

  showSettingsMenu();
}

function showSettingsMenu() {
  const settingsMenu = document.createElement('div');
  settingsMenu.id = 'settingsMenu';
  settingsMenu.className = 'overlay show';
  settingsMenu.innerHTML = `
    <div class="settings-container">
      <h2>Game Settings</h2>
      <label>Opponent:</label>
      <select id="opponentSelect">
        <option value="human">Human 👤</option>
        <option value="computer">engine 🖥</option>
      </select>
      <div id="computerColorDiv" style="display: none;">
        <label>engine Color:</label>
        <select id="computerColorSelect">
          <option value="black">Black ♙</option>
          <option value="white">White ♟</option>
        </select>
      </div>
      <label>Time per Player:</label>
      <select id="timeSelect">
        <option value="60">1 Minute</option>
        <option value="120">2 Minutes</option>
        <option value="180">3 Minutes</option>
        <option value="300">5 Minutes</option>
        <option value="600" selected>10 Minutes</option>
        <option value="900">15 Minutes</option>
        <option value="1200">20 Minutes</option>
        <option value="unlimited">Unlimited</option>
      </select>
      <label>Custom Position (FEN):</label>
      <button id="editPositionButton">Edit Position</button>
      <div id="fenEditor" style="display: none;">
        <div id="miniBoard" style="width: 200px; height: 200px; display: grid; grid-template: repeat(8, 1fr) / repeat(8, 1fr);"></div>
        <select id="pieceSelect">
          <option value="wpawn">White Pawn</option>
          <option value="wknight">White Knight</option>
          <option value="wbishop">White Bishop</option>
          <option value="wcastle">White Rook</option>
          <option value="wqueen">White Queen</option>
          <option value="wking">White King</option>
          <option value="bpawn">Black Pawn</option>
          <option value="bknight">Black Knight</option>
          <option value="bbishop">Black Bishop</option>
          <option value="bcastle">Black Rook</option>
          <option value="bqueen">Black Queen</option>
          <option value="bking">Black King</option>
          <option value="empty">Empty</option>
        </select>
        <button id="doneFenButton">Done</button>
      </div>
      <label>PGN Input:</label>
      <textarea id="pgnInput" rows="4" cols="50" placeholder="Enter PGN here"></textarea>
      <button id="loadPgnButton">Load PGN</button>
      <button id="startGameButton">Start Game</button>
    </div>
  `;
  document.body.appendChild(settingsMenu);

  document.getElementById('opponentSelect').addEventListener('change', function() {
    isComputerOpponent = this.value === 'computer';
    document.getElementById('computerColorDiv').style.display = isComputerOpponent ? 'block' : 'none';
  });

  document.getElementById('editPositionButton').addEventListener('click', showFenEditor);
  document.getElementById('doneFenButton').addEventListener('click', applyFenToBoard);
  document.getElementById('loadPgnButton').addEventListener('click', loadPgn);
  document.getElementById('startGameButton').addEventListener('click', startGame);
}

function startGame() {
  const timeSelectValue = document.getElementById('timeSelect').value;
  isUnlimitedTime = timeSelectValue === 'unlimited';
  timePerPlayer = isUnlimitedTime ? 0 : parseInt(timeSelectValue);
  whiteTime = isUnlimitedTime ? 0 : timePerPlayer;
  blackTime = isUnlimitedTime ? 0 : timePerPlayer;
  isComputerOpponent = document.getElementById('opponentSelect').value === 'computer';
  computerColor = isComputerOpponent ? document.getElementById('computerColorSelect').value : null;

  const settingsMenu = document.getElementById('settingsMenu');
  settingsMenu.remove();

  try {
    gameStartSound.play().catch(err => {
      console.error('Error playing game start sound:', err);
    });
  } catch (err) {
    console.error('Error with game start sound:', err);
  }

  let boardContainer = document.getElementById("board");
  if (boardContainer) {
    if (isComputerOpponent && computerColor === 'white') {
      boardContainer.classList.add('board-flipped');
    } else {
      boardContainer.classList.remove('board-flipped');
    }
  }

  boardSquares = [];
  for (let i = 1; i <= 8; i++) {
    for (let j = 1; j <= 8; j++) {
      let squareElement = document.createElement("div");
      let color = ((i + j) % 2 === 0) ? "light" : "dark";
      squareElement.addEventListener("click", squareClicked);
      squareElement.setAttribute("data-x", j);
      squareElement.setAttribute("data-y", i);
      let square = new SquareObject(j, i, color, false, squareElement, null);
      square.update();
      boardSquares.push(square);
      boardContainer.appendChild(squareElement);
    }
  }

  addBoardLabels(boardContainer, isComputerOpponent && computerColor === 'white');

  white = new Player("white");
  black = new Player("black");
  currentPlayer = white;
  pieces = [];
  moveHistory = [];
  turn = 1;

  // Place pieces only if fenBoard is empty (standard setup)
  if (!fenBoard.some(row => row.some(piece => piece))) {
    white.king = new King(5, 8, "white");
    black.king = new King(5, 1, "black");
    pieces.push(white.king);
    getSquare(white.king.x, white.king.y).setPiece(white.king);
    pieces.push(black.king);
    getSquare(black.king.x, black.king.y).setPiece(black.king);
    white.king.hasMoved = false;
    black.king.hasMoved = false;

    let whiteBackPieces = [
      new Castle(1, 8, "white"),
      new Knight(2, 8, "white"),
      new Bishop(3, 8, "white"),
      new Queen(4, 8, "white"),
      new Bishop(6, 8, "white"),
      new Knight(7, 8, "white"),
      new Castle(8, 8, "white")
    ];
    for (let p of whiteBackPieces) {
      p.hasMoved = false;
      pieces.push(p);
      getSquare(p.x, p.y).setPiece(p);
    }
    for (let i = 1; i <= 8; i++) {
      let pawn = new Pawn(i, 7, "white");
      pawn.hasMoved = false;
      pieces.push(pawn);
      getSquare(pawn.x, pawn.y).setPiece(pawn);
    }

    let blackBackPieces = [
      new Castle(1, 1, "black"),
      new Knight(2, 1, "black"),
      new Bishop(3, 1, "black"),
      new Queen(4, 1, "black"),
      new Bishop(6, 1, "black"),
      new Knight(7, 1, "black"),
      new Castle(8, 1, "black")
    ];
    for (let p of blackBackPieces) {
      p.hasMoved = false;
      pieces.push(p);
      getSquare(p.x, p.y).setPiece(p);
    }
    for (let i = 1; i <= 8; i++) {
      let pawn = new Pawn(i, 2, "black");
      pawn.hasMoved = false;
      pieces.push(pawn);
      getSquare(pawn.x, pawn.y).setPiece(pawn);
    }
  } else {
    applyFenToBoard();
  }

  updateKingCheckHighlight(white);
  updateKingCheckHighlight(black);

  if (!isUnlimitedTime) {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(updateTimer, 1000);
  } else {
    const whiteTimeEl = document.getElementById("whiteTime");
    const blackTimeEl = document.getElementById("blackTime");
    if (whiteTimeEl) whiteTimeEl.innerHTML = "Unlimited";
    if (blackTimeEl) blackTimeEl.innerHTML = "Unlimited";
  }

  if (isComputerOpponent && computerColor === 'white') {
    setTimeout(computerMove, 1000);
  }

  const turnInfoEl = document.getElementById("turnInfo");
  if (turnInfoEl) turnInfoEl.innerHTML = "Player's turn: <b>White</b>";
}

function newGame() {
  const endMessageEl = document.getElementById("endMessage");
  if (endMessageEl) endMessageEl.className = "overlay";
  const navigationDiv = document.getElementById('pgnNavigation');
  if (navigationDiv) navigationDiv.remove();
  pgnMoves = [];
  currentPgnMoveIndex = -1;
  fenBoard = Array(8).fill().map(() => Array(8).fill(null));
  showSettingsMenu();
}

function addBoardLabels(boardContainer, isFlipped) {
  document.querySelectorAll('.file-label, .rank-label').forEach(label => label.remove());

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  for (let i = 1; i <= 8; i++) {
    let fileLabel = document.createElement("div");
    fileLabel.className = 'file-label';
    fileLabel.style.position = 'absolute';
    fileLabel.style.bottom = '-20px';
    fileLabel.style.left = `${(i - 1) * 12.5}%`;
    fileLabel.style.width = '12.5%';
    fileLabel.style.textAlign = 'center';
    fileLabel.innerHTML = isFlipped ? files[8 - i] : files[i - 1];
    boardContainer.appendChild(fileLabel);

    let fileLabelTop = document.createElement("div");
    fileLabelTop.className = 'file-label';
    fileLabelTop.style.position = 'absolute';
    fileLabelTop.style.top = '-20px';
    fileLabelTop.style.left = `${(i - 1) * 12.5}%`;
    fileLabelTop.style.width = '12.5%';
    fileLabelTop.style.textAlign = 'center';
    fileLabelTop.innerHTML = isFlipped ? files[8 - i] : files[i - 1];
    boardContainer.appendChild(fileLabelTop);
  }

  for (let i = 1; i <= 8; i++) {
    let rankLabel = document.createElement("div");
    rankLabel.className = 'rank-label';
    rankLabel.style.position = 'absolute';
    rankLabel.style.left = '-20px';
    rankLabel.style.top = `${(8 - i) * 12.5}%`;
    rankLabel.style.height = '12.5%';
    rankLabel.style.lineHeight = '50px';
    rankLabel.innerHTML = isFlipped ? i : 9 - i;
    boardContainer.appendChild(rankLabel);

    let rankLabelRight = document.createElement("div");
    rankLabelRight.className = 'rank-label';
    rankLabelRight.style.position = 'absolute';
    rankLabelRight.style.right = '-20px';
    rankLabelRight.style.top = `${(8 - i) * 12.5}%`;
    rankLabelRight.style.height = '12.5%';
    rankLabelRight.style.lineHeight = '50px';
    rankLabelRight.innerHTML = isFlipped ? i : 9 - i;
    boardContainer.appendChild(rankLabelRight);
  }
}

function computerMove() {
  if (!isComputerOpponent || currentPlayer.color !== computerColor) return;

  let validMoves = [];
  let opponent = currentPlayer === white ? black : white;
  pieces.forEach(piece => {
    if (piece.color === computerColor && !piece.captured) {
      let startSquare = getSquare(piece.x, piece.y);
      for (let tx = 1; tx <= 8; tx++) {
        for (let ty = 1; ty <= 8; ty++) {
          let endSquare = getSquare(tx, ty);
          let moveResult = piece.isValidMove(endSquare);
          if (moveResult.valid) {
            let capturedPiece = null;
            let captureSquare = moveResult.capture;
            let isEnPassant = moveResult.enPassant;
            if (captureSquare) {
              capturedPiece = captureSquare.piece;
              if (capturedPiece) capturedPiece.capture();
              captureSquare.unsetPiece();
            }
            startSquare.unsetPiece();
            endSquare.setPiece(piece);
            piece.x = tx;
            piece.y = ty;
            piece.hasMoved = true;
            let exposed = kingExposed(currentPlayer.king);
            let oppExposed = !exposed ? kingExposed(opponent.king) : false;
            endSquare.unsetPiece();
            startSquare.setPiece(piece);
            piece.x = startSquare.x;
            piece.y = startSquare.y;
            if (capturedPiece) {
              capturedPiece.captured = false;
              captureSquare.setPiece(capturedPiece);
            }
            if (!exposed) {
              validMoves.push({ start: startSquare, end: endSquare, capture: !!moveResult.capture || isEnPassant, check: oppExposed });
            }
          }
        }
      }
    }
  });

  if (validMoves.length > 0) {
    let checkingCaptures = validMoves.filter(m => m.check && m.capture);
    let checks = validMoves.filter(m => m.check && !m.capture);
    let captures = validMoves.filter(m => !m.check && m.capture);
    let normals = validMoves.filter(m => !m.check && !m.capture);
    let preferred = checkingCaptures.length > 0 ? checkingCaptures :
                    checks.length > 0 ? checks :
                    captures.length > 0 ? captures : normals;
    let selectedMove = preferred[Math.floor(Math.random() * preferred.length)];
    move(selectedMove.start, selectedMove.end);
  }
}

let showEnd = function(message) {
  const endTextEl = document.getElementById("endText");
  const endMessageEl = document.getElementById("endMessage");
  if (endTextEl) endTextEl.innerHTML = message;
  if (endMessageEl) endMessageEl.className = "overlay show";
  if (!isUnlimitedTime && timerInterval) {
    clearInterval(timerInterval);
  }
}

let getSquare = function(x, y) {
  if (x < 1 || x > 8 || y < 1 || y > 8) return null;
  return boardSquares[(y - 1) * 8 + (x - 1)];
};

function showValidMoves(square) {
  clearValidMoves();
  let piece = square.piece;
  if (!piece) return;
  for (let tx = 1; tx <= 8; tx++) {
    for (let ty = 1; ty <= 8; ty++) {
      let tSquare = getSquare(tx, ty);
      if (!tSquare) continue;
      let moveResult = piece.isValidMove(tSquare);
      if (moveResult.valid) {
        let capturedPiece = null;
        let captureSquare = moveResult.capture;
        let isEnPassant = moveResult.enPassant;
        if (captureSquare) {
          capturedPiece = captureSquare.piece;
          if (capturedPiece) capturedPiece.capture();
          captureSquare.unsetPiece();
        }
        square.unsetPiece();
        tSquare.setPiece(piece);
        piece.x = tx;
        piece.y = ty;
        let exposed = kingExposed(currentPlayer.king);
        tSquare.unsetPiece();
        square.setPiece(piece);
        piece.x = square.x;
        piece.y = square.y;
        if (capturedPiece) {
          capturedPiece.captured = false;
          captureSquare.setPiece(capturedPiece);
        }
        if (!exposed) {
          tSquare.element.classList.add("valid-move");
        }
      }
    }
  }
}

function clearValidMoves() {
  boardSquares.forEach(square => {
    square.element.classList.remove("valid-move");
  });
}

function updateKingCheckHighlight(player) {
  boardSquares.forEach(square => {
    square.element.classList.remove("king-in-check");
  });
  if (player.checked && player.king) {
    let kingSquare = getSquare(player.king.x, player.king.y);
    if (kingSquare) kingSquare.element.classList.add("king-in-check");
  }
}

let squareClicked = function(e) {
  if (isComputerOpponent && currentPlayer.color === computerColor) return;
  let x = Number(this.getAttribute("data-x"));
  let y = Number(this.getAttribute("data-y"));
  let square = getSquare(x, y);
  if (!square) return;
  if (selectedSquare) {
    selectedSquare.deselect();
    clearValidMoves();
    if (selectedSquare === square) {
      selectedSquare = null;
      return;
    }
    if (move(selectedSquare, square)) {
      selectedSquare = null;
      if (isComputerOpponent && currentPlayer.color !== computerColor) {
        setTimeout(computerMove, 1000);
      }
    } else {
      try {
        invalidSound.play().catch(() => {});
      } catch (err) {}
      selectedSquare = null;
    }
  } else {
    if (square.hasPiece() && square.piece.color === currentPlayer.color) {
      square.select();
      selectedSquare = square;
      showValidMoves(square);
    } else {
      try {
        invalidSound.play().catch(() => {});
      } catch (err) {}
    }
  }
};

let move = function(start, end) {
  let piece = start.piece;
  if (!piece || piece.color !== currentPlayer.color) return false;
  currentPlayer.moved = piece;
  let moveResult = piece.isValidMove(end);
  if (!moveResult.valid) {
    return false;
  }
  
  let capturedPiece = null;
  let captureSquare = moveResult.capture;
  let isEnPassant = moveResult.enPassant;
  if (captureSquare) {
    capturedPiece = captureSquare.piece;
    if (capturedPiece) capturedPiece.capture();
    captureSquare.unsetPiece();
  }

  function completeMove(promoteType) {
    start.unsetPiece();
    end.setPiece(piece);
    piece.x = end.x;
    piece.y = end.y;
    piece.hasMoved = true;
    piece.lastmoved = turn;
    if (piece.type === "pawn" && Math.abs(start.y - end.y) === 2) {
      piece.advancedtwo = turn;
    }
    let exposed = kingExposed(currentPlayer.king);
    if (exposed) {
      end.unsetPiece();
      start.setPiece(piece);
      piece.x = start.x;
      piece.y = start.y;
      piece.hasMoved = false;
      if (capturedPiece) {
        capturedPiece.captured = false;
        captureSquare.setPiece(capturedPiece);
      }
      return false;
    }
    let soundPlayed = false;
    let promotedPiece = null;
    if (moveResult.castle) {
      let direction = end.x - start.x > 0 ? 1 : -1;
      let rookX = direction > 0 ? 8 : 1;
      let rookSquare = getSquare(rookX, start.y);
      let rook = rookSquare.piece;
      let newRookX = end.x - direction;
      let newRookSquare = getSquare(newRookX, end.y);
      rookSquare.unsetPiece();
      newRookSquare.setPiece(rook);
      rook.x = newRookX;
      rook.y = end.y;
      rook.hasMoved = true;
      currentPlayer.castled = true;
      currentPlayer.rooksMoved[direction > 0 ? 'right' : 'left'] = true;
      try { castleSound.play().catch(() => {}); } catch (err) {}
      soundPlayed = true;
    }
    if (isEnPassant && capturedPiece) {
      let capturedY = currentPlayer.color === 'white' ? end.y + 1 : end.y - 1;
      let capturedSquare = getSquare(end.x, capturedY);
      if (capturedSquare) capturedSquare.unsetPiece();
    }
    if (promoteType) {
      let index = pieces.indexOf(piece);
      if (index !== -1) {
        let NewPieceClass = { queen: Queen, castle: Castle, bishop: Bishop, knight: Knight }[promoteType];
        promotedPiece = new NewPieceClass(end.x, end.y, currentPlayer.color);
        promotedPiece.hasMoved = true;
        pieces[index] = promotedPiece;
        end.setPiece(promotedPiece);
        try { promoteSound.play().catch(() => {}); } catch (err) {}
        soundPlayed = true;
        piece = promotedPiece;
      }
    }
    if (piece.type === "king") {
      currentPlayer.kingMoved = true;
      piece.hasMoved = true;
    }
    if (piece.type === "castle") {
      let side = start.x === 1 ? 'left' : 'right';
      currentPlayer.rooksMoved[side] = true;
      piece.hasMoved = true;
    }
    if (!soundPlayed) {
      if (moveResult.capture || isEnPassant) {
        try { captureSound.play().catch(() => {}); } catch (err) {}
      } else {
        try { moveSound.play().catch(() => {}); } catch (err) {}
      }
    }
    let opponent = currentPlayer === white ? black : white;
    let prevChecked = opponent.checked;
    opponent.checked = kingExposed(opponent.king);
    let isCapture = !!moveResult.capture || isEnPassant;
    updateMoveNotation(start, end, piece, isCapture, moveResult.castle, promotedPiece, isEnPassant);
    if (opponent.checked) {
      opponent.king.checkedBy = piece;
      if (!prevChecked) {
        try { checkSound.play().catch(() => {}); } catch (err) {}
      }
      updateKingCheckHighlight(opponent);
      if (isCheckmate(opponent.king)) {
        try { checkmateSound.play().catch(() => {}); } catch (err) {}
        showEnd(`${currentPlayer.color.charAt(0).toUpperCase() + currentPlayer.color.slice(1)} wins by checkmate!`);
        return true;
      }
    } else {
      opponent.king.checkedBy = null;
      updateKingCheckHighlight(opponent);
      if (!hasLegalMoves(opponent)) {
        try { checkmateSound.play().catch(() => {}); } catch (err) {}
        showEnd("Stalemate - Draw!");
        return true;
      }
    }
    nextTurn();
    return true;
  }

  if (moveResult.promote) {
    if (isComputerOpponent && currentPlayer.color === computerColor) {
      animatePiece(start, end, piece, () => completeMove('queen'));
    } else {
      showPromotionMenu(end, piece, completeMove);
    }
  } else {
    animatePiece(start, end, piece, () => completeMove(null));
  }
  return true;
}

function hasLegalMoves(player) {
  for (let i = 0; i < pieces.length; i++) {
    let p = pieces[i];
    if (p.color === player.color && !p.captured) {
      let pSquare = getSquare(p.x, p.y);
      if (!pSquare) continue;
      for (let tx = 1; tx <= 8; tx++) {
        for (let ty = 1; ty <= 8; ty++) {
          let tSquare = getSquare(tx, ty);
          if (!tSquare) continue;
          let moveResult = p.isValidMove(tSquare);
          if (moveResult.valid) {
            let capturedPiece = null;
            let captureSquare = moveResult.capture;
            if (captureSquare) {
              capturedPiece = captureSquare.piece;
              if (capturedPiece) capturedPiece.capture();
              captureSquare.unsetPiece();
            }
            pSquare.unsetPiece();
            tSquare.setPiece(p);
            p.x = tx;
            p.y = ty;
            let exposed = kingExposed(player.king);
            tSquare.unsetPiece();
            pSquare.setPiece(p);
            p.x = pSquare.x;
            p.y = pSquare.y;
            if (capturedPiece) {
              capturedPiece.captured = false;
              captureSquare.setPiece(capturedPiece);
            }
            if (!exposed) {
              return true;
            }
          }
        }
      }
    }
  }
  return false;
}

let isCheckmate = function(king) {
  let player = king.color === "white" ? white : black;
  if (!player.checked) return false;
  return !hasLegalMoves(player);
};

let kingExposed = function(at) {
  if (!at || !at.x || !at.y || !at.color) return false;
  for (let i = 0; i < pieces.length; i++) {
    let piece = pieces[i];
    if (piece.color !== at.color && !piece.captured) {
      let square = getSquare(piece.x, piece.y);
      if (!square) continue;
      let targetSquare = getSquare(at.x, at.y);
      if (piece.type === "pawn") {
        let direction = piece.color === "white" ? -1 : 1;
        let movementY = (at.y - piece.y);
        let movementX = (at.x - piece.x);
        if (movementY === direction && Math.abs(movementX) === 1) {
          at.checkedBy = piece;
          return true;
        }
      } else {
        let originalPiece = targetSquare.piece;
        targetSquare.unsetPiece();
        let moveRes = piece.isValidMove(targetSquare);
        if (originalPiece !== null) {
          targetSquare.setPiece(originalPiece);
        }
        if (moveRes.valid) {
          at.checkedBy = piece;
          return true;
        }
      }
    }
  }
  return false;
};

let nextTurn = function() {
  turn++;
  currentPlayer = currentPlayer === white ? black : white;
  const turnInfoEl = document.getElementById("turnInfo");
  if (turnInfoEl) {
    turnInfoEl.innerHTML = `Player's turn: <b>${currentPlayer.color.charAt(0).toUpperCase() + currentPlayer.color.slice(1)}</b>`;
  }
  if (isComputerOpponent && currentPlayer.color === computerColor) {
    setTimeout(computerMove, 1000);
  }
}

let timerInterval;
function updateTimer() {
  if (isUnlimitedTime) return;
  if (currentPlayer === white) {
    whiteTime--;
    if (whiteTime <= 0) {
      showEnd("Black wins by time!");
      return;
    }
  } else {
    blackTime--;
    if (blackTime <= 0) {
      showEnd("White wins by time!");
      return;
    }
  }
  const whiteTimeEl = document.getElementById("whiteTime");
  const blackTimeEl = document.getElementById("blackTime");
  if (whiteTimeEl) whiteTimeEl.innerHTML = formatTime(whiteTime);
  if (blackTimeEl) blackTimeEl.innerHTML = formatTime(blackTime);
}

function formatTime(seconds) {
  let mins = Math.floor(seconds / 60);
  let secs = seconds % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

window.onload = setup;