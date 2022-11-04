// -- CONSTANTS

const TOTAL_LEVELS = 5;
const COLORS = ['red', 'green', 'blue', 'yellow'];

// -- STATE

const initialState = {
	heading: 'Simon Game',
	info: '',
	level: 0,
	showStartButton: true,
	allowTileClicks: false,
	computerColorsToGuess: [], // computer sequence to guess
	playerGuesses: [], // human guesses so far in sequence
};

let state = initialState;

// -- DOM

const $ = {
	heading: document.querySelector('#heading'),
	tiles: document.querySelector('#tiles'),
	info: document.querySelector('#info'),
	startBtn: document.querySelector('#start-button'),

	// -- DOM HELPERS

	setHeading: (heading) => {
		$.heading.textContent = heading;
	},
	setInfo: (info) => {
		if (info) {
			$.info.classList.remove('hidden');
			$.info.textContent = info;
		} else {
			$.info.classList.add('hidden');
		}
	},
	getTileByColor: (color) => document.querySelector(`[data-tile='${color}']`),
	activateTileByColor: (color) => {
		$.getTileByColor(color).classList.add('activated');
	},
	deactivateTileByColor: (color) => {
		$.getTileByColor(color).classList.remove('activated');
	},
	playSoundByColor: (color) =>
		document.querySelector(`[data-sound='${color}']`).play(),
	setStartButtonShown: (showStartButton) => {
		if (showStartButton) {
			$.startBtn.classList.remove('hidden');
		} else {
			$.startBtn.classList.add('hidden');
		}
	},
	setTileClicksAllowed: (allowTileClicks) => {
		if (allowTileClicks) {
			$.tiles.classList.remove('unclickable');
		} else {
			$.tiles.classList.add('unclickable');
		}
	},
};

// -- RENDER ON STATE UPDATE

const createUpdater = () => {
	const render = (keysChangedMap) => {
		if (keysChangedMap.heading) $.setHeading(state.heading);

		if (keysChangedMap.info !== undefined) $.setInfo(state.info);

		if (keysChangedMap.activatedColor !== undefined) {
			// activate / deactivate tiles
			if (state.activatedColor) {
				COLORS.filter((color) => color !== state.activatedColor).forEach(
					$.deactivateTileByColor,
				);
				$.activateTileByColor(state.activatedColor);
			} else {
				COLORS.forEach($.deactivateTileByColor);
			}
		}

		if (keysChangedMap.showStartButton !== undefined)
			$.setStartButtonShown(state.showStartButton);

		if (keysChangedMap.allowTileClicks !== undefined)
			$.setTileClicksAllowed(state.allowTileClicks);
	};

	return (stateChanges) => {
		state = { ...state, ...stateChanges };

		const keysChangedMap = Object.keys(stateChanges).reduce(
			(keys, key) => ({
				...keys,
				[key]: true,
			}),
			{},
		);

		render(keysChangedMap);
	};
};

const update = createUpdater();

// -- STATE UPDATE HELPERS

const resetGame = () => update(initialState);

const allowPlayerToGuess = () => {
	update({
		info: getRemainingGuessesMessage(state.level),
		allowTileClicks: true,
	});
};

const flashColors = async (colorsToFlash) => {
	for (const color of colorsToFlash) {
		$.playSoundByColor(color);
		update({ activatedColor: color });
		await sleep(600); // sleep while activated for the flashing effect
		update({ activatedColor: '' });
		await sleep(50);
	}
};

// -- UTILS

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getRandomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

// -- GAME LOGIC

const hasLost = () => {
	const index = state.playerGuesses.length - 1;

	const guess = state.playerGuesses[index];
	const answer = state.computerColorsToGuess[index];

	return guess !== answer;
};

// dependent on hasLost being computed first
const hasFinishedRound = () =>
	state.playerGuesses.length === state.computerColorsToGuess.length;

// dependent on hasLost being computed first
const hasWon = () => {
	const hasFinishedAllLevels = state.level === TOTAL_LEVELS;

	return hasFinishedRound() && hasFinishedAllLevels;
};

const getRemainingGuessesMessage = (remaining) =>
	`Your turn. click ${remaining} tile(s).`;

const handleLoss = () => {
	alert('Sorry, game over.');
	resetGame();
};

const handleWin = async () => {
	// show that there are no guesses left..
	update({
		info: getRemainingGuessesMessage(0),
	});
	await sleep(50); // allow info to update and show
	alert('You won!');
	resetGame();
};

const handleRoundFinished = async () => {
	update({
		playerGuesses: [],
		info: 'Success! Keep going!',
	});

	await sleep(1000);

	nextRound();
};

const handleWaitingForNextGuess = () => {
	const remainingGuesses =
		state.computerColorsToGuess.length - state.playerGuesses.length;

	// still guessing...
	update({
		info: getRemainingGuessesMessage(remainingGuesses),
	});
};

const handleColorClicked = async (color) => {
	update({ playerGuesses: [...state.playerGuesses, color] });

	$.playSoundByColor(color);

	if (hasLost()) {
		handleLoss();
	} else if (hasWon()) {
		await handleWin();
	} else if (hasFinishedRound()) {
		await handleRoundFinished();
	} else {
		handleWaitingForNextGuess();
	}
};

const nextRound = async () => {
	const nextLevel = state.level + 1;

	update({
		heading: `Level ${nextLevel} of ${TOTAL_LEVELS}`,
		level: nextLevel,
		allowTileClicks: false,
		info: 'Wait for the computer',
	});

	const nextComputerColorsToGuess = [
		...state.computerColorsToGuess,
		getRandomColor(),
	];

	await flashColors(nextComputerColorsToGuess);

	update({ computerColorsToGuess: nextComputerColorsToGuess });

	await sleep(500);

	allowPlayerToGuess();
};

const startGame = () => {
	update({ showStartButton: false });

	nextRound();
};

// -- EVENT HANDLERS

const handleTilesContainerClicked = (event) => {
	const { tile } = event.target.dataset;

	if (tile) {
		handleColorClicked(tile);
	}
};

$.tiles.addEventListener('click', handleTilesContainerClicked);

$.startBtn.addEventListener('click', startGame);
