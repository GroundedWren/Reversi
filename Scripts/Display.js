/**
 * @file Display scripts
 * @author Vera Konigin vera@groundedwren.com
 */
 
window.GW = window.GW || {};
window.GW.Reversi = window.GW.Reversi || {};
(function Display(ns) {
	ns.updatePrefs = function updatePrefs() {
		const cbxDarkMode = document.getElementById("cbxDarkMode");
		const theme = localStorage.getItem("theme");
		switch(theme) {
			case "light":
				cbxDarkMode.checked = false;
				break;
			case "dark":
				cbxDarkMode.checked = true;
				break;
			default:
				cbxDarkMode.checked = window.matchMedia("(prefers-color-scheme: dark)").matches;
				break;
		}
		document.documentElement.classList.toggle("theme-dark", cbxDarkMode.checked);

		const cbxRevealMoves = document.getElementById("cbxRevealMoves");
		const revealMoves = localStorage.getItem("reveal-moves") === "true";
		cbxRevealMoves.checked = revealMoves;
		document.documentElement.classList.toggle("reveal-moves", revealMoves);
	}
}) (window.GW.Reversi.Display = window.GW.Reversi.Display || {});