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

	const tblGame = document.getElementById("tblBoard");
	document.getElementById("tblBoard").addEventListener("focusin", () => {
		tblGame.removeAttribute("tabindex");
		(document.querySelector(`gw-cell:focus-within`) || document.querySelector(`gw-cell`)).focus();
	});

	document.getElementById("olbPpc").addEventListener("selection-change", GW.Reversi.onPpcChange);

	GW.Reversi.Data = JSON.parse(localStorage.getItem("data"));
	if(!GW.Reversi.Data) {
		GW.Reversi.generateGameData();
	}
	GW.Reversi.renderGame();
});