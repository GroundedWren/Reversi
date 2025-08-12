/**
 * @file Reversi scripts
 * @author Vera Konigin vera@groundedwren.com
 */
 
window.GW = window.GW || {};
(function Reversi(ns) {
	ns.Data; //board data
	ns.Colors = {
		Black: "b",
		White: "w",
	};
	ns.SnapshotUnsubscribe = null;

	/**
	 * Undo button functionality
	 */
	const Last = {};
	(function Last(lastNs) {
		const DataObjArray = [];

		lastNs.push = function push(dataObj) {
			if(!dataObj) {
				return;
			}
			DataObjArray.push(dataObj);
			document.getElementById("btnUndo").removeAttribute("disabled");
		}

		lastNs.pop = function pop() {
			const dataObj = DataObjArray.pop();
			if(!DataObjArray.length) {
				disableUndo();
			}
			return dataObj;
		}

		lastNs.clear = function clear() {
			DataObjArray.length = 0;
			disableUndo();
		}

		function disableUndo() {
			const btnUndo = document.getElementById("btnUndo");
			if(btnUndo.matches(`:focus-within`)) {
				document.getElementById("spnStatus").focus();
			}
			btnUndo.setAttribute("disabled", "true");
		}
	})(Last);
	
	/**
	 * New local game
	 */
	ns.onNewGame = () => {
		document.getElementById("diaNew").close();
		document.querySelectorAll(`[id^="gwToast"]`).forEach(toastEl => toastEl.remove());

		Last.clear();
		document.querySelectorAll(`form`).forEach(frm => frm.reset());

		disconnectOnline();
		localStorage.removeItem("online-game");
		localStorage.removeItem("online-user");

		ns.generateGameData();
		ns.renderGame();
	};

	function disconnectOnline() {
		if(ns.SnapshotUnsubscribe) {
			ns.SnapshotUnsubscribe();
			ns.SnapshotUnsubscribe = null;
		}
		document.getElementById("outConnected").innerText = "";
		document.body.removeAttribute("data-connected");
	}

	/**
	 * Sets up Othello
	 */
	ns.generateGameData = () => {
		ns.Data = {
			ToMove: ns.Colors.Black
		};
		for(let rowIdx = 1; rowIdx <= 8; rowIdx++) {
			ns.Data[rowIdx] = {};
			for(let colIdx = 1; colIdx <= 8; colIdx++) {
				ns.Data[rowIdx][colIdx] = {
					Color: getInitialColor(rowIdx, colIdx),
				};
			}
		}
	};
	const initialState = {
		4: {
			4: ns.Colors.White,
			5: ns.Colors.Black,
		},
		5: {
			4: ns.Colors.Black,
			5: ns.Colors.White,
		},
	};
	function getInitialColor(rowIdx, colIdx) {
		return initialState.hasOwnProperty(rowIdx)
			? (initialState[rowIdx][colIdx] || "")
			: "";
	}

	/**
	 * Flips your color
	 * @param {string} color Current color
	 * @returns White if black, black if white
	 */
	ns.getOppositeColor = function getOppositeColor(color) {
		switch (color) {
			case ns.Colors.Black:
				return ns.Colors.White;
			case ns.Colors.White:
				return ns.Colors.Black;
			default:
				return "";
		}
	}

	/**
	 * Handler when the color that is up to move changes
	 */
	ns.onToggleToMove = () => {
		if(ns.Data.ToMove) {
			document.body.setAttribute("data-ToMove", ns.Data.ToMove);
		}
		else {
			document.body.removeAttribute("data-ToMove");
		}
		if(!document.body.hasAttribute("data-connected")) {
			if(ns.Data.ToMove === ns.Colors.White) {
				document.getElementById("radPpcW").click();
			}
			else {
				document.getElementById("radPpcB").click();
			}
		}

		updateInfoButtons();
	}

	/**
	 * Updates the state of the right panel info buttons
	 */
	function updateInfoButtons() {
		updateResetBtn();
		updateGrdBtn();
		updatePassBtn();
		updatePushBtn();
	}
	function updateResetBtn() {
		const btnReset = document.getElementById("btnReset");
		if(ns.Data.ToMove === ""
			&& document.getElementById("olbPpc").Value === ns.Colors.Black
			&& !!GW.Firebase?.Auth?.currentUser?.uid
		) {
			btnReset.classList.remove("hidden");
		}
		else {
			if(btnReset.matches(`:focus-within`)) {
				document.getElementById("spnStatus").focus();
			}
			btnReset.classList.add("hidden");
		}
	}
	function updateGrdBtn() {
		const btnGrd = document.getElementById("btnGrd");
		const ppc = document.getElementById("olbPpc").Value;
		if(ppc === ns.Data.ToMove && ns.CellEl.getClickableCells().length) {
			btnGrd.classList.remove("hidden");
		}
		else {
			if(btnGrd.matches(`:focus-within`)) {
				document.getElementById("spnStatus").focus();
			}
			btnGrd.classList.add("hidden");
		}
	}
	function updatePassBtn() {
		const btnPass = document.getElementById("btnPass");
		const ppc = document.getElementById("olbPpc").Value;
		if(ppc === ns.Data.ToMove && !ns.CellEl.getClickableCells().length) {
			btnPass.classList.remove("hidden");
		}
		else {
			if(btnPass.matches(`:focus-within`)){
				document.getElementById("spnStatus").focus();
			}
			btnPass.classList.add("hidden");
		}
	}
	async function updatePushBtn() {
		const btnPush = document.getElementById("btnPush");
		const ppc = document.getElementById("olbPpc").Value;

		const onlineGame = localStorage.getItem("online-game");
		if(!onlineGame) {
			return;
		}

		const gameDocData = await GW.Firebase.getDoc(GW.Firebase.doc(
			GW.Firebase.Firestore,
			"reversi_games", onlineGame
		));
		if(!gameDocData.exists()) {
			return;
		}

		const userId =  GW.Firebase.Auth.currentUser?.uid;
		const isUsersMove = ppc === ns.Data.ToMove
		const isReset = gameDocData.get("IsGameOver") && (ns.Data.ToMove !== "");
		const lastMoveExists = !!gameDocData.get("LastMove") && !isReset;
		const lastMoveWasUser = gameDocData.get("LastMove") === userId

		if((!isUsersMove && lastMoveExists && !lastMoveWasUser && !gameDocData.get("IsGameOver"))
			|| (!isUsersMove && !lastMoveExists && (ppc === ns.Colors.Black))
		) {
			btnPush.removeAttribute("disabled");
		}
		else {
			if(btnPush.matches(`:focus-within`)) {
				document.getElementById("spnStatus").focus();
			}
			btnPush.setAttribute("disabled", "true");
		}
	}

	/**
	 * Renders the game whole-cloth from ns.Data
	 * Not used for incremental updates
	 */
	ns.renderGame = function renderGame() {
		localStorage.removeItem("data");

		ns.Data = new Proxy(ns.Data, {
			set(target, property, value, _receiver) {
				const isChange = target[property] !== value
				const returnVal = Reflect.set(...arguments);
				if(property === "ToMove" && isChange) {
					this.toggle();
				}
				return returnVal;
			},
			toggle: ns.onToggleToMove,
		});
		ns.onToggleToMove();

		ns.CellEl.RenderBatcher.addListener("onRender", onRender);

		const tblBoard = document.getElementById("tblBoard");
		tblBoard.setAttribute("tabindex", "0");
		tblBoard.innerHTML = `
		<tbody>${[1, 2, 3, 4, 5, 6, 7, 8].reduce((bodyAccu, rowIdx) => {
			return bodyAccu += 
			`<tr>${[1, 2, 3, 4, 5, 6, 7, 8].reduce((rowAccu, colIdx) => {
				return rowAccu += 
				`<td aria-labelledby="spnCell">
					<gw-cell data-row="${rowIdx}" data-col="${colIdx}"></gw-cell>
				</td>`;
			}, "")}
			</tr>`;
		}, "")}
		</tbody>`;
	}

	/**
	 * Reverts the most recent move
	 * @returns Promise<void>
	 */
	ns.undo = async () => {
		const lastDataObj = Last.pop();
		if(!lastDataObj) {
			return;
		}

		const targetCell = document.querySelector(`gw-cell:has([tabindex="0"])`);

		ns.Data = lastDataObj;
		ns.renderGame();
		setTimeout(() => GW.Controls.Toaster.showToast("Action undone", {invisible: true}), 0);

		await ns.CellEl.RenderBatcher.BatchPromise;
		document.getElementById("tblBoard").removeAttribute("tabindex");
		if(targetCell) {
			document.querySelector(
				`gw-cell[data-row="${targetCell.RowIdx}"][data-col="${targetCell.ColIdx}"]`
			).focus();
		}
		else {
			document.getElementById("tblBoard").setAttribute("tabindex", 0);
		}
	};

	/**
	 * Passes back priority without moving
	 */
	ns.passTurn = () => {
		ns.Data.ToMove = ns.getOppositeColor(ns.Data.ToMove);
		ns.Data.LastMovePassed = true;
		ns.CellEl.RenderBatcher.run();
	};

	/**
	 * Listener for when the CellEls complete a render cycle
	 */
	const onRender = async () => {
		await ns.CellEl.RenderBatcher.BatchPromise;

		const cntBlank = document.querySelectorAll(`gw-cell:not([data-color])`).length;
		if(!ns.CellEl.getClickableCells().length) {
			if(ns.Data.LastMovePassed || cntBlank === 0) {
				onGameOver();
			}
		}
		else {
			ns.Data.LastMovePassed = false;
		}

		const cntBlack = document.querySelectorAll(`gw-cell[data-color="${ns.Colors.Black}"]`).length;
		document.getElementById("tdBlackCount").innerText = cntBlack;

		const cntWhite = document.querySelectorAll(`gw-cell[data-color="${ns.Colors.White}"]`).length;
		document.getElementById("tdWhiteCount").innerText = cntWhite;

		document.getElementById("tdBlankCount").innerText = cntBlank;

		document.body.setAttribute("data-initial", cntBlank === 60);
		document.body.setAttribute("data-winning", (cntBlack > cntWhite)
			? ns.Colors.Black
			: ns.Colors.White
		);

		updateInfoButtons();
		
		document.getElementById("cbxShowPrev").checked = false;

		Last.push(JSON.parse(localStorage.getItem("data")));
		localStorage.setItem("data", JSON.stringify(ns.Data));
	};

	function onGameOver() {
		ns.Data.ToMove = "";
		console.log("-- GAME OVER --")
	}

	/**
	 * Main board keyboard navigation
	 * @param {Event} event Keyboard event
	 */
	ns.gameKbdNav = (event) => {
		const targetCell = document.querySelector(`gw-cell:focus-within`);
		let targetRow = targetCell.RowIdx;
		let targetCol = targetCell.ColIdx;
		switch(event.key) {
			case "ArrowRight":
				targetCol += 1;
				break;
			case "ArrowLeft":
				targetCol -= 1;
				break;
			case "ArrowUp":
				targetRow -= 1;
				break;
			case "ArrowDown":
				targetRow += 1;
				break;
		}
		targetRow = Math.max(Math.min(targetRow, 8), 0);
		targetCol = Math.max(Math.min(targetCol, 8), 0);
		document.querySelector(`gw-cell[data-row="${targetRow}"][data-col="${targetCol}"]`)?.focus();
	};

	/**
	 * Jumps between move buttons in the board based on keyboard input
	 * @param {Event} event Keyboard event
	 */
	ns.gameBtnJump = (event) => {
		const cellAry = Object.values(ns.CellEl.InstanceMap);

		let firstBtnCell = null;
		let prevBtnCell = null;
		let nextBtnCell = null;
		let lastBtnCell = null;
		let hasSeenUs = false;
		for(cellEl of cellAry) {
			if(cellEl.matches(`:focus-within`)) {
				hasSeenUs = true;
			}
			else if(cellEl.hasAttribute("data-clickable")) {
				if(!firstBtnCell) {
					firstBtnCell = cellEl;
				}
				lastBtnCell = cellEl;

				if(!hasSeenUs) {
					prevBtnCell = cellEl;
				}
				else if (!nextBtnCell) {
					nextBtnCell = cellEl;
				}
			}
		}

		switch(event.key) {
			case "PageUp":
				(prevBtnCell || lastBtnCell)?.focus();
				break;
			case "PageDown":
				(nextBtnCell || firstBtnCell)?.focus();
				break;
		}
	};

	/**
	 * Performs a greedy-algorithm optimal move
	 */
	ns.moveGreedily = () => {
		if(document.body.hasAttribute("data-connected")) {
			GW.Controls.Toaster.showToast("Cannot move greedily while connected online");
			return;
		}

		const targetCell = [...document.querySelectorAll(`gw-cell[data-clickable]`)].sort(
			(a, b) => b.Value - a.Value
		)[0];

		targetCell.querySelector(`button`)?.click();

		setTimeout(() => GW.Controls.Toaster.showToast("Move performed", {invisible: true}), 0);
	};

	/**
	 * Handler for when the "Host" new game button is clicked
	 */
	ns.onHostClicked = () => {
		document.getElementById("diaNew").close();
		if(!GW.Firebase?.Auth?.currentUser) {
			document.querySelector(`gw-account`).focus();
			GW.Controls.Toaster.showToast("Please log in first");
			return;
		}

		ns.onNewGame();

		document.getElementById("diaHost").showModal();
	};

	/**
	 * Handler for when the hosting form is submitted
	 * @param {Event} event Form submit
	 */
	ns.onHostSubmit = async (event) => {
		event.preventDefault();

		event.target.querySelectorAll(`button`).forEach(btnEl => btnEl.setAttribute("disabled", "true"));

		const formData = new FormData(event.target);

		const extantDocData = await GW.Firebase.getDoc(GW.Firebase.doc(
			GW.Firebase.Firestore,
			"reversi_games",
			formData.get("gameName")
		));
		if(extantDocData.exists()) {
			event.target.querySelector(`output`).innerHTML = `Game name is in use`;
			event.target.querySelectorAll(`button`).forEach(btnEl => btnEl.removeAttribute("disabled"));
			event.target.querySelector(`output`)?.focus();
			return;
		}
		event.target.querySelector(`output`).innerHTML = "";

		const gameDoc = GW.Firebase.doc(
			GW.Firebase.Firestore,
			"reversi_games", formData.get("gameName")
		);
		GW.Firebase.setDoc(gameDoc, {
			Creator: GW.Firebase.Auth.currentUser.uid,
			CreatorColor: formData.get("ppc"),
			Data: JSON.stringify(ns.Data)
		});
		const authDoc = GW.Firebase.doc(
			GW.Firebase.Firestore,
			"reversi_auth", formData.get("gameName")
		);
		GW.Firebase.setDoc(authDoc, {
			PassKey: formData.get("gamePass"),
			Player: GW.Firebase.Auth.currentUser.uid,
		});

		ns.connectToGame(formData.get("gameName"));
		event.target.querySelectorAll(`button`).forEach(btnEl => btnEl.removeAttribute("disabled"));
		document.getElementById("diaHost").close();
		document.getElementById("outConnected").focus();
	};

	/**
	 * Handler for when the "Connect" new game button is clicked
	 */
	ns.onConnectClicked = () => {
		document.getElementById("diaNew").close();
		if(!GW.Firebase?.Auth?.currentUser) {
			document.querySelector(`gw-account`).focus();
			GW.Controls.Toaster.showToast("Please log in first");
			return;
		}

		document.getElementById("diaConnect").showModal();
	};

	/**
	 * Handler for when the connecting form is submitted
	 * @param {Event} event Form submit
	 */
	ns.onConnectSubmit = async (event) => {
		event.preventDefault();

		event.target.querySelectorAll(`button`).forEach(btnEl => btnEl.setAttribute("disabled", "true"));

		const formData = new FormData(event.target);

		const extantDocData = await GW.Firebase.getDoc(GW.Firebase.doc(
			GW.Firebase.Firestore,
			"reversi_games", formData.get("gameName")
		));
		if(!extantDocData.exists()) {
			event.target.querySelector(`output`).innerHTML = `Game does not exist`;
			event.target.querySelectorAll(`button`).forEach(btnEl => btnEl.removeAttribute("disabled"));
			event.target.querySelector(`output`)?.focus();
			return;
		}
		event.target.querySelector(`output`).innerHTML = "";

		if(extantDocData.get("Creator") === GW.Firebase.Auth.currentUser.uid) {
			ns.connectToGame(formData.get("gameName"))
			event.target.querySelectorAll(`button`).forEach(btnEl => btnEl.removeAttribute("disabled"));
			document.getElementById("diaConnect").close();
			return;
		}

		const authDoc = GW.Firebase.doc(
			GW.Firebase.Firestore,
			"reversi_auth", formData.get("gameName")
		);
		GW.Firebase.setDoc(authDoc, {
			PassKey: formData.get("gamePass"),
			Player: GW.Firebase.Auth.currentUser.uid,
		}).then(() => {
			ns.connectToGame(formData.get("gameName"))
			event.target.querySelector(`output`).innerHTML = "";
			event.target.querySelectorAll(`button`).forEach(btnEl => btnEl.removeAttribute("disabled"));
			document.getElementById("diaConnect").close();
		}).catch((error) => {
			event.target.querySelectorAll(`button`).forEach(btnEl => btnEl.removeAttribute("disabled"));
			event.target.querySelector(`[autofocus]`)?.focus();
			event.target.querySelector(`output`).innerHTML = `Connect failed<br>${error.message}`;
			event.target.querySelector(`output`).focus();
		});
	};

	/**
	 * Tries to connect to the last game saved in local storage
	 * @returns Whether the connection was successful
	 */
	ns.tryConnectToLastGame = function tryConnectToLastGame() {
		const userId = GW.Firebase?.Auth?.currentUser?.uid;
		const lastUser = localStorage.getItem("online-user");
		const lastGame = localStorage.getItem("online-game");

		if(!userId || userId !== lastUser) {
			return false;
		}
		else {
			ns.connectToGame(lastGame);
			return true;
		}
	}

	/**
	 * Connects to the specified online game
	 * @param {string} gameName Game identifier
	 */
	ns.connectToGame = async function connectToGame(gameName) {
		if(!gameName || !GW.Firebase?.Auth?.currentUser?.uid) {
			return;
		}

		document.body.setAttribute("data-connected", "true");

		document.getElementById("outConnected").innerText = `Connected to: ${gameName}`;

		localStorage.setItem("online-game", gameName);
		localStorage.setItem("online-user", GW.Firebase.Auth.currentUser.uid)

		const gameDoc = GW.Firebase.doc(
			GW.Firebase.Firestore,
			"reversi_games", gameName
		);
		const gameData = await GW.Firebase.getDoc(gameDoc);
		ns.Data = JSON.parse(gameData.get("Data"));
		ns.SnapshotUnsubscribe = GW.Firebase.onSnapshot(gameDoc, onSnapshotUpdated);

		const creatorColor = gameData.get("CreatorColor");
		const areCreator = gameData.get("Creator") === GW.Firebase.Auth.currentUser.uid;

		if(creatorColor === "b") {
			document.getElementById(areCreator ? "radPpcB" : "radPpcW").click();
		}
		else {
			document.getElementById(areCreator ? "radPpcW" : "radPpcB").click();
		}

		ns.renderGame();
	}

	/**
	 * Handler when the logged in user changes
	 */
	ns.onAuthStateChanged = () => {
		const isLoggedIn = !!GW.Firebase?.Auth?.currentUser;
		document.getElementById("artOnline").setAttribute("data-loggedIn", isLoggedIn);

		if(isLoggedIn) {
			ns.tryConnectToLastGame();
		}
		else {
			disconnectOnline();
		}
	};


	/**
	 * Handler when the connected game's firebase data is updated
	 * @param {Firebase Document Object} gameDocData 
	 */
	const onSnapshotUpdated = (gameDocData) => {
		if(!gameDocData.get("LastMove") || gameDocData.get("LastMove") === GW.Firebase.Auth.currentUser.uid) {
			return;
		}

		ns.Data = JSON.parse(gameDocData.get("Data"));
		Last.clear();
		ns.renderGame();

		GW.Controls.Toaster.showToast(
			`${
				gameDocData.get("LastMoveEmail") || "Opponent"
			} moved<br>${
				new Date(gameDocData.get("Timestamp")).toLocaleString(undefined, {timeStyle: "medium"})
			}`,
			{persist: true}
		);
	};

	/**
	 * Pushes the current game state to firebase
	 */
	ns.pushChanges = () => {
		const gameName = localStorage.getItem("online-game");
		if(!gameName || !GW.Firebase?.Auth?.currentUser) {
			return;
		}

		const gameDoc = GW.Firebase.doc(
			GW.Firebase.Firestore,
			"reversi_games", gameName
		);
		GW.Firebase.updateDoc(gameDoc, {
			Data: JSON.stringify(ns.Data),
			LastMove: GW.Firebase.Auth.currentUser.uid,
			LastMoveEmail: GW.Firebase.Auth.currentUser.email,
			Timestamp: new Date().toISOString(),
			IsGameOver: ns.Data.ToMove === ''
		}).then(() => {
			Last.clear();
			document.querySelectorAll(`[id^="gwToast"]`).forEach(toastEl => toastEl.remove());
			GW.Controls.Toaster.showToast("Changes pushed!");
		}).catch((error) => {
			GW.Controls.Toaster.showToast(`Failed to push - ${error.message}`)
		});

		updatePushBtn();
	};

	/**
	 * Clears the board
	 */
	ns.reset = () => {
		ns.generateGameData();
		ns.renderGame();
	};
}) (window.GW.Reversi = window.GW.Reversi || {});