/**
 * @file Reversi scripts
 * @author Vera Konigin vera@groundedwren.com
 */
 
window.GW = window.GW || {};
(function Reversi(ns) {
	ns.Data;
	ns.Colors = {
		Black: "b",
		White: "w",
	};

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
	
	ns.onNewGame = (event) => {
		event.preventDefault();

		ns.generateGameData();
		Last.clear();
		ns.renderGame();
	};

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

	ns.onToggleToMove = () => {
		const mainEl = document.getElementById("main");
		if(ns.Data.ToMove) {
			mainEl.setAttribute("data-ToMove", ns.Data.ToMove);
			document.getElementById("btnGrd").removeAttribute("disabled");
		}
		else {
			mainEl.removeAttribute("data-ToMove");
			const btnGrd = document.getElementById("btnGrd");
			if(btnGrd.matches(`:focus-within`)) {
				document.getElementById("spnStatus").focus();
			}
			btnGrd.setAttribute("disabled", "true");
		}
		if(!mainEl.hasAttribute("data-ppcLocked")) {
			if(ns.Data.ToMove === ns.Colors.White) {
				document.getElementById("radPpcW").click();
			}
			else {
				document.getElementById("radPpcB").click();
			}
		}
	}

	ns.renderGame = function renderGame() {
		localStorage.removeItem("data");

		ns.Data = new Proxy(ns.Data, {
			set(_target, property, _value, _receiver) {
				const returnVal = Reflect.set(...arguments);
				if(property === "ToMove") {
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

	const onRender = async () => {
		await ns.CellEl.RenderBatcher.BatchPromise;
		if(!ns.CellEl.getClickableCells().length) {
			ns.Data.ToMove = ns.getOppositeColor(ns.Data.ToMove);
			ns.CellEl.updateClickableCells();
			if(!ns.CellEl.getClickableCells().length) {
				onGameOver();
			}
		}

		const cntBlack = document.querySelectorAll(`gw-cell[data-color="${ns.Colors.Black}"]`).length;
		document.getElementById("tdBlackCount").innerText = cntBlack;

		const cntWhite = document.querySelectorAll(`gw-cell[data-color="${ns.Colors.White}"]`).length;
		document.getElementById("tdWhiteCount").innerText = cntWhite;

		document.getElementById("tdBlankCount").innerText = document.querySelectorAll(
			`gw-cell:not([data-color])`
		).length;

		document.getElementById("main").setAttribute("data-winning", (cntBlack > cntWhite)
			? ns.Colors.Black
			: ns.Colors.White
		);

		Last.push(JSON.parse(localStorage.getItem("data")));
		localStorage.setItem("data", JSON.stringify(ns.Data));
	};

	function onGameOver() {
		ns.Data.ToMove = "";
		console.log("-- GAME OVER --")
	}

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

	ns.onPpcChange = () => {
		document.querySelectorAll(`gw-cell[data-clickable]`).forEach(cellEl => cellEl.updateTabindex());
	};

	ns.moveGreedily = () => {
		const targetCell = [...document.querySelectorAll(`gw-cell[data-clickable]`)].sort(
			(a, b) => b.Value - a.Value
		)[0];

		targetCell.querySelector(`button`)?.click();

		setTimeout(() => GW.Controls.Toaster.showToast("Move performed", {invisible: true}), 0);
	};
}) (window.GW.Reversi = window.GW.Reversi || {});