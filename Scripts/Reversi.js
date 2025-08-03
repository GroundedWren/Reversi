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

		const secGame = document.getElementById("secGame");
		secGame.innerHTML = ``;
	}

	const onRender = () => {
		Last.Data = JSON.parse(localStorage.getItem("data"));
		localStorage.setItem("data", JSON.stringify(ns.Data));
	};
}) (window.GW.Reversi = window.GW.Reversi || {});