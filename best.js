const TOTAL_LEVELS = 5;
const TIME_BETWEEN_TILE_FLASHES = 600;
const COLORS = ['red', 'green', 'blue', 'yellow'];
const ONE_SECOND = 1000;

const initialState = {
  heading: 'Simon Game',
  info: '',
  level: 0,
  showStartButton: true,
  allowTileClicks: false,
  sequence: [], // computer sequence to guess
  humanSequence: [], // human guesses so far in sequence
};

let state = initialState;

const update = (stateChanges) => {
  state = { ...state, ...stateChanges };
  view();
}

const $ = {
  heading: document.querySelector('#heading'),
  tiles: document.querySelector('#tiles'),
  info: document.querySelector('#info'),
  startBtn: document.querySelector('#start-button'),

  getTileByColor: color => document.querySelector(`[data-tile='${color}']`),
  getSoundByColor: color => document.querySelector(`[data-sound='${color}']`)
};

const activateTile = color => $.getTileByColor(color).classList.add('activated');
const deactivateTile = color => $.getTileByColor(color).classList.remove('activated');

const view = () => {
  $.heading.textContent = state.heading;

  if (state.info) {
    $.info.classList.remove('hidden');
    $.info.textContent = state.info;
  } else {
    $.info.classList.add('hidden');
  }

  // activate / deactivate tiles
  if (state.activatedColor) {
    COLORS
      .filter(color => color !== state.activatedColor)
      .forEach(deactivateTile);
    activateTile(state.activatedColor);
  } else {
    COLORS.forEach(deactivateTile);
  }

  if (state.showStartButton) {
    $.startBtn.classList.remove('hidden');
  } else {
    $.startBtn.classList.add('hidden');
  }

  if (state.allowTileClicks) {
    $.tiles.classList.remove('unclickable');
  } else {
    $.tiles.classList.add('unclickable');
  }
};

const resetGame = () => update(initialState);

const handleColorClicked = async (color) => {
  update({ humanSequence: [...state.humanSequence, color ] });

  const index = state.humanSequence.length - 1;

  $.getSoundByColor(color).play();

  const remainingGuesses = state.sequence.length - state.humanSequence.length;
  const guess = state.humanSequence[index];
  const actual = state.sequence[index];

  const isWrong = guess !== actual;

  if (isWrong) {
    alert('Sorry, game over.');
    resetGame();
    return;
  }

  const answeredFullSequenceCorrectly = state.humanSequence.length === state.sequence.length;
  const hasFinishedAllLevels = state.level === TOTAL_LEVELS;
  const hasFinishedRound = answeredFullSequenceCorrectly;

  const hasWon = hasFinishedRound && hasFinishedAllLevels;

  if (hasWon) {
    // show that there are no guesses left..
    update({
      info: getRemainingGuessesMessage(0),
    });
    alert('You won!');
    resetGame();
    return;
  } else if (hasFinishedRound) {
    update({
      humanSequence: [],
      info: 'Success! Keep going!',
    });

    await sleep(ONE_SECOND);

    nextRound();
  } else {
    // still guessing...
    update({
      info: getRemainingGuessesMessage(remainingGuesses),
    });
  }
}

$.tiles.addEventListener('click', event => {
  const { tile } = event.target.dataset;

  if (tile) {
    handleColorClicked(tile);
  }
});

const getRemainingGuessesMessage = (remaining) => `Your turn. click ${remaining} tile(s).`;

const allowHumanToGuess = () => {
  update({
    info: getRemainingGuessesMessage(state.level),
    allowTileClicks: true,
  });
};

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const computerShowSequence = async (seq) => {
  for (const color of seq) {
    $.getSoundByColor(color).play();
    update({ activatedColor: color });
    await sleep(TIME_BETWEEN_TILE_FLASHES);
    update({ activatedColor: '' });
    await sleep(50);
  }
};

const getRandomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

const nextRound = async () => {
  const level = state.level + 1;

  update({
    heading:`Level ${level} of ${TOTAL_LEVELS}`,
    level: level,
    allowTileClicks: false,
    info: 'Wait for the computer',
  });

  const nextSequence = [...state.sequence, getRandomColor()];
  await computerShowSequence(nextSequence);

  update({ sequence: nextSequence });

  await sleep(ONE_SECOND);
  allowHumanToGuess();
};

const startGame = () => {
  update({ showStartButton: false });

  nextRound();
};

$.startBtn.addEventListener('click', startGame);

