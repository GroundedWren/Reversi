/**
 * @file REversi square control
 * @author Vera Konigin vera@groundedwren.com
 */
 
window.GW = window.GW || {};
(function Reversi(ns) {
	const SURROUNDING_DELTAS = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];

	ns.CellEl = class CellEl extends HTMLElement {
		static InstanceCount = 0; // Global count of instances created
		static InstanceMap = {}; // Dynamic map of IDs to instances of the element currently attached
		static RenderBatcher = new GW.Gizmos.ActionBatcher("CellEl");

		static updateClickableCells = () => {
			Object.values(CellEl.InstanceMap).forEach(cellEl => cellEl.#updateClickableState());
		};

		static getClickableCells() {
			return Object.values(CellEl.InstanceMap).filter(cellEl => cellEl.hasAttribute("data-clickable"));
		}

		static {
			CellEl.RenderBatcher.addListener("updateClickableCells", CellEl.updateClickableCells);
		}

		static getPieceLabel(color) {
			switch(color) {
				case ns.Colors.White:
					return "spnWhitePiece";
				case ns.Colors.Black:
					return "spnBlackPiece";
			}
			return "";
		}

		//Element name
		static Name = "gw-cell";
		// Element CSS rules
		static Style = `${CellEl.Name} {
			display: grid;
			grid-template-columns: 1fr;
			grid-template-rows: 1fr;

			&:not([data-clickable]) {
				button {
					display: none;
				}
			}
			
			button {
				background: var(--board-bkg-gradient);
				box-shadow: 2px 2px 4px 0px rgba(0,0,0,0.75);
				position: relative;

				&:is(:hover, :focus-within) {
					transition: 0.3s;
					opacity: 1;
				}
				&:not(:is(:hover, :focus-within)) {
					transition: 0.1s;
					opacity: var(--btn-start-opacity, 0);
				}
				&:focus-within {
					transition: none;
				}

				&::after {
					content: "+";
				}

				&:active {
					outline: none !important;
					outline-width: 0 !important;

					box-shadow: none;

					&::before {
						content: "";
						position: absolute;
						top: 0px;
						left: 0;
						width: 100%;
						height: 100%;

						background-color: rgba(0, 0, 0, 0.25);
					}
				}
			}
			
			.empty {
				display: grid;
				grid-template-columns: 1fr;
				grid-template-rows: 1fr;

				margin: 10%;
			}

			.piece {
				position: relative;
				margin: 10%;
				border-radius: 50%;

				transform: rotate(-25deg);

				&[aria-labelledby="spnWhitePiece"] {
					--piece-bkg: linear-gradient(180deg, var(--white-piece-start-color) 0%, var(--white-piece-end-color) 100%);
					--piece-letter: "W";
					--piece-color: var(--white-piece-text-color);
				}
				&[aria-labelledby="spnBlackPiece"] {
					--piece-bkg: linear-gradient(180deg, var(--black-piece-start-color) 0%, var(--black-piece-end-color) 100%);
					--piece-letter: "B";
					--piece-color: var(--black-piece-text-color);
				}

				&::before {
					z-index: 2;
					position: absolute;
					top: -2px;
					left: 0;
					width: 100%;
					height: 100%;
					border-radius: 50%;
					
					display: flex;
					justify-content: center;
					align-items: center;
					color: var(--piece-color);
					content: var(--piece-letter);

					box-shadow: 0px 3px 0px 0px rgba(255, 255, 255, 0.25) inset;
					background: var(--piece-bkg);
				}

				&::after {
					z-index: 1;
					content: "";
					position: absolute;
					top: 2px;
					left: 0px;
					width: 100%;
					height: 100%;
					border-radius: 50%;

					background-color: var(--piece-shadow);
				}
			}
		}`;

		InstanceId; // Identifier for this instance of the element
		IsInitialized; // Whether the element has rendered its content
		RowIdx;
		ColIdx;
		Value;

		/** Creates an instance */
		constructor() {
			super();
			if(!this.getId) {
				// We're not initialized correctly. Attempting to fix:
				Object.setPrototypeOf(this, customElements.get(CellEl.Name).prototype);
			}
			this.InstanceId = CellEl.InstanceCount++;
			this.RowIdx = parseInt(this.getAttribute("data-row"));
			this.ColIdx = parseInt(this.getAttribute("data-col"));
			this.Value = 0;
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
			this.addEventListener("focusout", this.onFocusout);
			this.IsInitialized = true;
		}

		/**
		 * Fetches this cell's data
		 */
		getData() {
			return ns.Data[this.RowIdx][this.ColIdx];
		}

		/**
		 * Sets up a listener for our data
		 */
		setUpDataProxy() {
			ns.Data[this.RowIdx][this.ColIdx] = new Proxy(ns.Data[this.RowIdx][this.ColIdx], {
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
			CellEl.RenderBatcher.run(`cell-${this.InstanceId}`, this.#doRender)
		}

		focus() {
			Object.values(CellEl.InstanceMap).forEach((cellEl) => cellEl.#clearTabstops());

			const tidxZeroTarget = this.#getTidxZeroTarget();
			tidxZeroTarget.setAttribute("tabindex", 0);
			tidxZeroTarget.focus();
		}

		updateTabindex() {
			if(!this.querySelector(`[tabindex="0"]`)) {
				return;
			}

			this.#getTidxZeroTarget().setAttribute("tabindex", 0);
		}

		#getTidxZeroTarget() {
			const btn = this.getRef("btn");
			if(btn && btn.checkVisibility()) {
				return btn;
			}
			else {
				return this.firstElementChild;
			}
		}

		#clearTabstops = () => {
			this.querySelectorAll(`[tabindex="0"]`).forEach(focEl => focEl.setAttribute("tabindex", "-1"));
		};

		#doRender = () => {
			const hadFocus = this.matches(`:focus-within`);

			this.setAttribute("tabindex", "-1");

			const data = this.getData();
			if(data.Color) {
				this.setAttribute("data-color", data.Color);
			}
			else {
				this.removeAttribute("data-color");
			}

			this.innerHTML = `${data.Color
				? `
					<div tabindex="-1" role="figure" class="piece" aria-labelledby="${CellEl.getPieceLabel(data.Color)}">
					</div>` 
				: `
					<div tabindex="-1" role="figure" class="empty" aria-labelledby="spnEmpty">
						<button id="${this.getId("btn")}" tabindex="-1" aria-labelledby="spnPlacePiece"></button>
					</div>`
			}`;
			this.getRef("btn")?.addEventListener("click", this.#onBtnClick);

			if(hadFocus) {
				this.focus();
			}
		};

		#onBtnClick = () => {
			const data = this.getData();
			data.Color = ns.Data.ToMove;
			ns.Data.ToMove = ns.getOppositeColor(ns.Data.ToMove);

			const branches = SURROUNDING_DELTAS.map((delta) => { return {
				RowIdx: this.RowIdx, 
				ColIdx: this.ColIdx,
				Delta: delta,
				Cells: [],
			};});
			while(branches.length) {
				const branch = branches.pop();
				branch.RowIdx = branch.RowIdx + branch.Delta[0];
				branch.ColIdx = branch.ColIdx + branch.Delta[1];

				const adjCell = (ns.Data[branch.RowIdx] || {})[branch.ColIdx];
				if(adjCell && adjCell.Color) {
					if(adjCell.Color === data.Color) {
						branch.Cells.forEach(cell => cell.Color = data.Color);
					}
					else {
						branch.Cells.push(adjCell);
						branches.push(branch);
					}
				}
			}
		};

		#updateClickableState() {
			const data = this.getData();
			if(data.Color) {
				this.removeAttribute("data-clickable");
				this.Value = 0;
				return;
			}

			const branches = SURROUNDING_DELTAS.map((delta) => { return {
				RowIdx: this.RowIdx, 
				ColIdx: this.ColIdx,
				Delta: delta,
				OtherColorCount: 0,
			};});

			let value = 0;
			while(branches.length) {
				const branch = branches.pop();
				branch.RowIdx = branch.RowIdx + branch.Delta[0];
				branch.ColIdx = branch.ColIdx + branch.Delta[1];
				
				const adjCell = (ns.Data[branch.RowIdx] || {})[branch.ColIdx];
				if(adjCell && adjCell.Color) {
					if(adjCell.Color === ns.Data.ToMove) {
						if(branch.OtherColorCount > 0) {
							value += branch.OtherColorCount;
						}
					}
					else{
						branch.OtherColorCount++;
						branches.push(branch);
					}
				}
			}
			if(value > 0) {
				this.setAttribute("data-clickable", "true");
				this.Value = value;
			}
			else {
				this.removeAttribute("data-clickable");
				this.Value = 0;
			}
		}
	}
	if(!customElements.get(ns.CellEl.Name)) {
		customElements.define(ns.CellEl.Name, ns.CellEl);
	}
}) (window.GW.Reversi = window.GW.Reversi || {});