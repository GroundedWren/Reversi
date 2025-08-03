/**
 * @file Reversi scripts
 * @author Vera Konigin vera@groundedwren.com
 */
 
window.GW = window.GW || {};
(function Reversi(ns) {
	ns.Data;

	const Last = new Proxy({Data: []}, {
		set(_target, property, value, _receiver) {
			switch(property) {
				case "Data":
					const btnUndo = document.getElementById("btnUndo");
					if(value && value.length) {
						btnUndo.removeAttribute("disabled");
					}
					else {
						btnUndo.setAttribute("disabled", "true");
					}
					break;
			}
			return Reflect.set(...arguments);
		}
	});
	
	ns.onNewGame = (event) => {
		event.preventDefault();

		ns.generateGameData();
		ns.renderGame();
	};

	ns.generateGameData = () => {
		ns.Data = [];
	};

	ns.renderGame = function renderGame() {
		ns.CellEl.ActionBatcher.addListener("onRender", onRender);

		const tblBoard = document.getElementById("tblBoard");
		tblBoard.innerHTML = `
		<tbody>${[1, 2, 3, 4, 5, 6, 7, 8].reduce((bodyAccu, rowIdx) => {
			return bodyAccu += 
			`<tr>${[1, 2, 3, 4, 5, 6, 7, 8].reduce((rowAccu, colIdx) => {
				return rowAccu += 
				`<td></td>`;
			}, "")}
			</tr>`;
		}, "")}
		</tbody>`;
	}

	const onRender = () => {
		Last.Data = JSON.parse(localStorage.getItem("data"));
		localStorage.setItem("data", JSON.stringify(ns.Data));
	};
}) (window.GW.Reversi = window.GW.Reversi || {});