const GAME_TITLE = 'Simon';
const TOTAL_LEVELS = 5;
const DELAY_BETWEEN_TILE_FLASHES = 600;

// -- Get elements on the page
const heading = document.querySelector('#heading');
const tiles = document.querySelector('#tiles');
const info = document.querySelector('#info');
const startButton = document.querySelector('#start-button');

// -- Element helpers
function hideStartButton() {
  startButton.classList.add('hidden');
}

function showStartButton() {
  startButton.classList.remove('hidden');
}

function showInfoMessage(message) {
  info.classList.remove('hidden');
  info.textContent = message;
}

function hideInfoMessage() {
  info.classList.add('hidden');
}

function setHeading(nextHeading) {
  heading.textContent = nextHeading;
}

function preventTileClicks() {
  tiles.classList.add('unclickable');
}

function allowTileClicks() {
  tiles.classList.remove('unclickable');
}

function flashTileByColor(color) {
  const tile = document.querySelector(`[data-tile='${color}']`);

  tile.classList.add('activated');

  setTimeout(() => {
    tile.classList.remove('activated');
  }, DELAY_BETWEEN_TILE_FLASHES / 2);
}

function playTileColorSound(color) {
  const sound = document.querySelector(`[data-sound='${color}']`);
  sound.play();
}

// -- Game logic and data
let level = 0;
let sequence = [];
let humanSequence = [];

function startGame() {
  hideStartButton();
  showInfoMessage('Wait for the computer');
  nextRound();
}

function resetGame() {
  level = 0;
  sequence = [];
  humanSequence = [];
  showStartButton();
  hideInfoMessage();
  setHeading(GAME_TITLE);
  preventTileClicks();
}

function nextRound() {
  level = level + 1;
  preventTileClicks();

  setHeading(`Level ${level} of ${TOTAL_LEVELS}`);

  let nextSequence = [...sequence, getRandomTile()];
  computerShowSequence(nextSequence);

  sequence = [...nextSequence];

  setTimeout(() => {
    allowHumanToGuess();
  }, level * DELAY_BETWEEN_TILE_FLASHES + 1000);
}

function getRandomTile() {
  let tiles = ['red', 'green', 'blue', 'yellow'];
  let random = tiles[Math.floor(Math.random() * tiles.length)];

  return random;
}

function computerShowSequence(seq) {
  seq.forEach((color, index) => {
    setTimeout(() => flashTile(color), (index + 1) * DELAY_BETWEEN_TILE_FLASHES);
  });
}

function flashTile(color) {
 playTileColorSound(color);
 flashTileByColor(color); 
}

function allowHumanToGuess() {
  allowTileClicks();
  showRemainingGuessesMessage(level);
}

function showRemainingGuessesMessage(remaining) {
  showInfoMessage(`Your turn. click ${remaining} tile(s).`);
}

function handleColorClicked(color) {
  humanSequence.push(color);
  let index = humanSequence.length - 1;

  playTileColorSound(color);

  let remainingGuesses = sequence.length - humanSequence.length;
  let guess = humanSequence[index];
  let actual = sequence[index];

  // wrong
  if (guess !== actual) {
    alert('Game over');
    resetGame();
    return;
  }

  if (humanSequence.length === sequence.length) {
    if (level === TOTAL_LEVELS) {
      alert('You won!');
      resetGame();
      return;
    }

    humanSequence = [];
    showInfoMessage('Success! Keep going!');

    setTimeout(() => {
      nextRound();
    }, 1000);
  } else {
    showRemainingGuessesMessage(remainingGuesses);
  }
}

// Events for elements on the page
startButton.addEventListener('click', startGame);

tiles.addEventListener('click', event => {
  const { tile } = event.target.dataset;

  if (tile) {
    handleColorClicked(tile);
  }
});
