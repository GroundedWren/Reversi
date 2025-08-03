/**
 * @file Index page scripts
 * @author Vera Konigin vera@groundedwren.com
 */

window.addEventListener("load", () => {
	GW.Reversi.Display.updatePrefs();

	const shortsGame = document.getElementById("shortsGame");
	shortsGame.addEventListener("focusin", () => {
		document.getElementById("asiGame").style["visibility"] = "visible";
	});
	shortsGame.addEventListener("focusout", () => {
		document.getElementById("asiGame").style["visibility"] = "hidden";
	});

	GW.Reversi.Data = JSON.parse(localStorage.getItem("data"));
	if(!GW.Reversi.Data) {
		GW.Reversi.generateGameData();
	}
	GW.Reversi.renderGame();
});