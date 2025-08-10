/**
 * @file Firebase account control
 * @author Vera Konigin vera@groundedwren.com
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {
	getAuth,
	signInWithEmailAndPassword,
	createUserWithEmailAndPassword,
	signOut,
	onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {
	getFirestore,
	collection,
	query,
	doc,
	setDoc,
	getDoc,
	updateDoc,
	serverTimestamp,
	onSnapshot,
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

function Firebase(ns, appInfoObj) {
	ns.App = initializeApp(appInfoObj);

	ns.Auth = getAuth(ns.App);

	ns.Firestore = getFirestore(ns.App);

	const Listeners = new Map();
	ns.addListener = function addListener(event, identifier, listener) {
		if(!Listeners.has(event)) {
			Listeners.set(event, new Map());
		}
		Listeners.get(event).set(identifier, listener);
	};
	ns.removeListener = function removeListener(event, identifier) {
		Listeners.get(event)?.delete(identifier);
	}

	onAuthStateChanged(GW.Firebase.Auth, () => {
		Listeners.get("AuthStateChanged")?.values().forEach(listener => listener(...arguments));
	});

	ns.collection = collection
	ns.setDoc = setDoc;
	ns.doc = doc;
	ns.updateDoc = updateDoc;
	ns.getDoc = getDoc;
	ns.query = query;
	ns.serverTimestamp = serverTimestamp;
	ns.onSnapshot = onSnapshot;
	ns.onAuthStateChanged = onAuthStateChanged;
}

window.GW = window.GW || {};
(function Controls(ns) {
	ns.AccountEl = class AccountEl extends HTMLElement {
		static InstanceCount = 0; // Global count of instances created
		static InstanceMap = {}; // Dynamic map of IDs to instances of the element currently attached

		//Element name
		static Name = "gw-account";
		// Element CSS rules
		static Style = `${AccountEl.Name} {
			display: contents;

			> button:focus {
				outline-width: 4px !important;
				outline-color: var(--focus-color) !important;
				outline-style: solid !important;
				outline-offset: 1px !important;
				position: relative !important;
				z-index: 100 !important;
			}

			svg {
				width: 16px;
				height: 16px;
			}

			path {
				fill: var(--icon-color, #000000);
			}

			dialog {
				text-align: left;

				form {
					display: flex;
					flex-direction: column;
					gap: 5px;
					min-width: 300px;

					fieldset {
						display: flex;
						flex-direction: row;
						justify-content: space-evenly;
						align-items: center;
					}
				}
				
				footer {
					display: grid;
					grid-auto-flow: column;
					justify-content: stretch;
				}

				output {
					text-align: center;
					background-color: var(--invalid-text-background-color);

					&:empty {
						display: none;
					}
				}
			}
			
			.input-grid {
				display: grid;
				grid-template-columns: auto 1fr;
				row-gap: 5px;
				user-select: none;

				input:is([type="text"], [type="password"], [type="email"]) {
					min-height: 24px;
				}

				> label {
					text-align: end;
					display: contents;

					&:has(input[type="checkbox"]) {
						&:has(:focus) {
							&::before {
								background-color: var(--mark-color);
							}
						}
						&::before {
							content: "";

						}
						> span {
							&:has(input:checked) {
								background-color: var(--selected-color);
							}
						}
					}

					&:has(:focus-within) {
						> span {
							background-color: var(--mark-color);
						}
						input {
							outline-width: 2px !important;
							outline-color: var(--focus-color) !important;
							outline-style: solid !important;
							outline-offset: 1px !important;
							position: relative !important;
							z-index: 100 !important;
						}
					}
				}
			}
		}`;

		static FontAwesomeCitation = "<!--! Font Awesome Free 7.0.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) Copyright 2025 Fonticons, Inc. -->";
		static UserSlashViewbox = "0 0 576 512";
		static UserSlashPath = "M41-24.9c-9.4-9.4-24.6-9.4-33.9 0S-2.3-.3 7 9.1l528 528c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9L311.5 245.7c55-10.9 96.5-59.5 96.5-117.7 0-66.3-53.7-120-120-120-58.2 0-106.8 41.5-117.7 96.5L41-24.9zM235.6 305.4C147.9 316.6 80 391.5 80 482.3 80 498.7 93.3 512 109.7 512l332.5 0-206.6-206.6z";
		static UserViewbox = "0 0 448 512";
		static UserPath = "M224 248a120 120 0 1 0 0-240 120 120 0 1 0 0 240zm-29.7 56C95.8 304 16 383.8 16 482.3 16 498.7 29.3 512 45.7 512l356.6 0c16.4 0 29.7-13.3 29.7-29.7 0-98.5-79.8-178.3-178.3-178.3l-59.4 0z";

		InstanceId; // Identifier for this instance of the element
		IsInitialized; // Whether the element has rendered its content

		/** Creates an instance */
		constructor() {
			super();
			if(!this.getId) {
				// We're not initialized correctly. Attempting to fix:
				Object.setPrototypeOf(this, customElements.get(AccountEl.Name).prototype);
			}
			this.InstanceId = AccountEl.InstanceCount++;
		}

		/** Shortcut for the root node of the element */
		get Root() {
			return this.getRootNode();
		}
		/** Looks up the <head> element (or a fascimile thereof in the shadow DOM) for the element's root */
		get Head() {
			if(this.Root.head) {
				return this.Root.head;
			}
			if(this.Root.getElementById("gw-head")) {
				return this.Root.getElementById("gw-head");
			}
			const head = document.createElement("div");
			head.setAttribute("id", "gw-head");
			this.Root.prepend(head);
			return head;
		}

		/**
		 * Generates a globally unique ID for a key unique to the custom element instance
		 * @param {String} key Unique key within the custom element
		 * @returns A globally unique ID
		 */
		getId(key) {
			return `${AccountEl.Name}-${this.InstanceId}-${key}`;
		}
		/**
		 * Finds an element within the custom element created with an ID from getId
		 * @param {String} key Unique key within the custom element
		 * @returns The element associated with the key
		 */
		getRef(key) {
			return this.querySelector(`#${CSS.escape(this.getId(key))}`);
		}

		focus() {
			this.getRef("btn")?.focus();
		}

		/** Handler invoked when the element is attached to the page */
		connectedCallback() {
			this.onAttached();
		}
		/** Handler invoked when the element is moved to a new document via adoptNode() */
		adoptedCallback() {
			this.onAttached();
		}
		/** Handler invoked when the element is disconnected from the document */
		disconnectedCallback() {
			GW.Firebase.removeListener("AuthStateChanged", this.getId());
			delete AccountEl.InstanceMap[this.InstanceId];
		}

		/** Performs setup when the element has been sited */
		onAttached() {
			if(!this.Root.querySelector(`style.${AccountEl.Name}`)) {
				this.Head.insertAdjacentHTML(
					"beforeend",
					`<style class=${AccountEl.Name}>${AccountEl.Style}</style>`
				);
			}

			AccountEl.InstanceMap[this.InstanceId] = this;
			if(!this.IsInitialized) {
				if(document.readyState === "loading") {
					document.addEventListener("DOMContentLoaded", () => {
						if(!this.IsInitialized) {
							this.#initialize();
						}
					});
				}
				else {
					this.#initialize();
				}
			}
			else {
				GW.Firebase.addListener("AuthStateChanged", this.getId(), this.#onAuthStateChanged);
				this.renderContent();
			}
		}

		#initialize() {
			try {
				if(!GW.Firebase) {
					Firebase(GW.Firebase = {}, {
						//Project Settings / General
						apiKey: this.getAttribute("apiKey"),
						authDomain: this.getAttribute("authDomain"),
						projectId: this.getAttribute("projectId"),
						storageBucket: this.getAttribute("storageBucket"),
						messagingSenderId: this.getAttribute("messagingSenderId"),
						appId: this.getAttribute("appId")
					});
				}
				GW.Firebase.addListener("AuthStateChanged", this.getId(), this.#onAuthStateChanged);
				this.renderContent();
				this.IsInitialized = true;
				this.dispatchEvent(new CustomEvent("initialized"));
			} catch (e) {
				console.log("-- ACCOUNT CONTROL INIT FAILURE --");
				console.error(e);

				this.innerHTML = `
				<button disabled aria-label="Account" aria-describedby="${this.getId("svg")}">
					${this.#getBtnSvg()}
				</button>
				`;
			}
		}

		/** Invoked when the element is ready to render */
		renderContent() {
			let resetFocus = false;
			if(this.matches(`:focus-within`)) {
				resetFocus = true;
			}

			this.innerHTML = `
			<button id=${this.getId("btn")} aria-label="Account" aria-describedby="${this.getId("svg")}">
				${this.#getBtnSvg()}
			</button>
			<dialog>${
				this.User
				? `
				<article>
					<h2>User</h2>
					<span>Email: ${this.User.email}</span>
					<output></output>
					<footer>
						<button id="${this.getId("btnClose")}" autofocus>Close</button>
						<button id="${this.getId("btnLogOut")}">Log out</button>
					</footer>
				</article>`
				: `
				<form id="${this.getId("frmAuth")}">
					<h2>Authenticate</h2>
					<fieldset>
						<legend>Action</legend>
						<label><input
							type="radio"
							name="${this.getId("authStyle")}"
							value="SignUp"
							checked
							autofocus
						>Sign up</label>
						<label><input
							type="radio"
							name="${this.getId("authStyle")}"
							value="SignIn"
						>Sign in</label>
					</fieldset>
					<div class="input-grid">
						<label>
							<span>Email:</span>
							<input type="email" name="email" required>
						</label>
						<label>
							<span>Password:</span>
							<input type="password" name="password" required>
						</label>
					</div>
					<output></output>
					<footer>
						<button id="${this.getId("btnClose")}" type="button">Close</button>
						<button type="submit">Submit</button>
					</footer>
				</form>`
			}
			</dialog>
			`;

			this.getRef("btn").addEventListener("click", () => {
				this.querySelector(`dialog`).showModal();
			});

			this.getRef("btnClose")?.addEventListener("click", () => this.querySelector(`dialog`).close());
			this.getRef("btnLogOut")?.addEventListener("click", this.#logOut);

			this.getRef("frmAuth")?.addEventListener("submit", this.#onAuthFormSubmit);

			if(resetFocus) {
				this.getRef("btn").focus();
			}
		}

		#getBtnSvg() {
			return `
			<svg id=${this.getId("svg")}
				xmlns="http://www.w3.org/2000/svg"
				viewBox="${this.User ? AccountEl.UserViewbox : AccountEl.UserSlashViewbox}"
			>
				${AccountEl.FontAwesomeCitation}
				<title>${this.User
					? `Logged in as ${this.User.email}`
					: "Not logged in"}
				</title>
				<path d="${this.User ? AccountEl.UserPath : AccountEl.UserSlashPath}"/>
			</svg>
			`;
		}

		#onAuthStateChanged = () => {
			this.renderContent();
		};

		#onAuthFormSubmit = (event) => {
			event.preventDefault();
			const data = new FormData(event.target);
			this.querySelector(`output`).innerHTML = "";

			if(data.get(this.getId("authStyle")) === "SignIn") {
				signInWithEmailAndPassword(GW.Firebase.Auth, data.get("email"), data.get("password")).catch((error) => {
					this.querySelector(`output`).innerHTML = `Authentication failed<br>${error.message}`;
				});
			}
			else {
				createUserWithEmailAndPassword(GW.Firebase.Auth, data.get("email"), data.get("password")).catch((error) => {
					this.querySelector(`output`).innerHTML = `Signup failed<br>${error.message}`;
				});
			}
		};

		#logOut = () => {
			signOut(GW.Firebase?.Auth);
		};

		get User() {
			return GW.Firebase?.Auth?.currentUser;
		}
	}
	if(!customElements.get(ns.AccountEl.Name)) {
		customElements.define(ns.AccountEl.Name, ns.AccountEl);
	}
}) (window.GW.Controls = window.GW.Controls || {});
GW?.Controls?.Veil?.clearDefer("GW.Controls.AccountEl");