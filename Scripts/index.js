/**
 * @file Index page scripts
 * @author Vera Konigin vera@groundedwren.com
 */

window.addEventListener("load", () => {
	GW.Reversi.Display.updatePrefs();

	GW.Reversi.Data = JSON.parse(localStorage.getItem("data"));
	if(!GW.Reversi.Data) {
		GW.Reversi.generateGameData();
	}
	GW.Reversi.renderGame();
});