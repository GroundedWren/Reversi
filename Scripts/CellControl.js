/**
 * @file REversi square control
 * @author Vera Konigin vera@groundedwren.com
 */
 
window.GW = window.GW || {};
(function Reversi(ns) {
	ns.CellEl = class CellEl extends HTMLElement {
		static InstanceCount = 0; // Global count of instances created
		static InstanceMap = {}; // Dynamic map of IDs to instances of the element currently attached
		static ActionBatcher = new GW.Gizmos.ActionBatcher("CellEl");

		//Element name
		static Name = "gw-cell";
		// Element CSS rules
		static Style = `${CellEl.Name} {
		}`;

		InstanceId; // Identifier for this instance of the element
		IsInitialized; // Whether the element has rendered its content

		/** Creates an instance */
		constructor() {
			super();
			if(!this.getId) {
				// We're not initialized correctly. Attempting to fix:
				Object.setPrototypeOf(this, customElements.get(CellEl.Name).prototype);
			}
			this.InstanceId = CellEl.InstanceCount++;
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
			return `${CellEl.Name}-${this.InstanceId}-${key}`;
		}
		/**
		 * Finds an element within the custom element created with an ID from getId
		 * @param {String} key Unique key within the custom element
		 * @returns The element associated with the key
		 */
		getRef(key) {
			return this.querySelector(`#${CSS.escape(this.getId(key))}`);
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
			delete CellEl.InstanceMap[this.InstanceId];
		}

		/** Performs setup when the element has been sited */
		onAttached() {
			if(!this.Root.querySelector(`style.${CellEl.Name}`)) {
				this.Head.insertAdjacentHTML(
					"beforeend",
					`<style class=${CellEl.Name}>${CellEl.Style}</style>`
				);
			}

			CellEl.InstanceMap[this.InstanceId] = this;
			if(!this.IsInitialized) {
				if(document.readyState === "loading") {
					document.addEventListener("DOMContentLoaded", () => {
						if(!this.IsInitialized) {
							this.initialize();
							this.renderContent();
						}
					});
				}
				else {
					this.initialize();
					this.renderContent();
				}
			}
		}

		/** First-time setup */
		initialize() {
			this.setUpDataProxy();
			this.IsInitialized = true;
		}

		/**
		 * Fetches this cell's data
		 */
		getData() {
			return ns.Data[this.Row][this.Col];
		}

		/**
		 * Sets up a listener for our data
		 */
		setUpDataProxy() {
			ns.Data[this.Row][this.Col] = new Proxy(ns.Data[this.Row][this.Col], {
				set(_target, _property, _value, _receiver) {
					const returnVal = Reflect.set(...arguments);
					this.Cell.renderContent();
					return returnVal;
				},
				Cell: this,
			});
		}

		/** Invoked when the element is ready to render */
		renderContent() {
			CellEl.ActionBatcher.run(`cell-${this.InstanceId}`, this.#doRender)
		}

		#doRender = () => {
			const data = this.getData();
			this.innerHTML = `
				
			`;
		};
	}
	if(!customElements.get(ns.CellEl.Name)) {
		customElements.define(ns.CellEl.Name, ns.CellEl);
	}
}) (window.GW.Reversi = window.GW.Reversi || {});