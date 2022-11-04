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
	sequence: [], // computer sequence to guess
	humanSequence: [], // human guesses so far in sequence
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
	activateTileByColor: (color) => {
		$.getTileByColor(color).classList.add('activated');
	},
	deactivateTileByColor: (color) => {
		$.getTileByColor(color).classList.remove('activated');
	},
	getTileByColor: (color) => document.querySelector(`[data-tile='${color}']`),
	getSoundByColor: (color) => document.querySelector(`[data-sound='${color}']`),
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

const resetGame = () => update(initialState);

const handleColorClicked = async (color) => {
	update({ humanSequence: [...state.humanSequence, color] });

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

	const answeredFullSequenceCorrectly =
		state.humanSequence.length === state.sequence.length;
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

		await sleep(1000);

		nextRound();
	} else {
		// still guessing...
		update({
			info: getRemainingGuessesMessage(remainingGuesses),
		});
	}
};

$.tiles.addEventListener('click', (event) => {
	const { tile } = event.target.dataset;

	if (tile) {
		handleColorClicked(tile);
	}
});

const getRemainingGuessesMessage = (remaining) =>
	`Your turn. click ${remaining} tile(s).`;

const allowHumanToGuess = () => {
	update({
		info: getRemainingGuessesMessage(state.level),
		allowTileClicks: true,
	});
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const computerShowSequence = async (seq) => {
	for (const color of seq) {
		$.getSoundByColor(color).play();
		update({ activatedColor: color });
		await sleep(600); // sleep while activated for the flashing effect
		update({ activatedColor: '' });
		await sleep(50);
	}
};

const getRandomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

const nextRound = async () => {
	const level = state.level + 1;

	update({
		heading: `Level ${level} of ${TOTAL_LEVELS}`,
		level: level,
		allowTileClicks: false,
		info: 'Wait for the computer',
	});

	const nextSequence = [...state.sequence, getRandomColor()];
	await computerShowSequence(nextSequence);

	update({ sequence: nextSequence });

	await sleep(1000);
	allowHumanToGuess();
};

const startGame = () => {
	update({ showStartButton: false });

	nextRound();
};

$.startBtn.addEventListener('click', startGame);
