/**
 * @file Control for a listbox of optionboxes
 * @author Vera Konigin vera@groundedwren.com
 */
 
window.GW = window.GW || {};
window.GW.Controls = window.GW.Controls || {};
(function OptionListbox(ns) {
	ns.OptionListboxEl = class OptionListboxEl extends HTMLElement {
		static InstanceCount = 0;
		static ResetMs = 500;

		InstanceId;
		IsInitialized;
		IdIter = 0;
		KeyMap = {};
		CurKeySequence = [];
		LastKeyTimestamp = new Date(-8640000000000000); //Earliest representable date

		#clickTimeout;

		constructor() {
			super();
			this.InstanceId = OptionListboxEl.InstanceCount++;

			if(this.InstanceId === 0) {
				document.head.insertAdjacentHTML("beforeend", `
				<style>
					gw-option-listbox {
						fieldset {
							border-color: var(--link-color, #0000EE);
							background-color: var(--button-face-color, #C8C8C8);

							legend {
								background-color: var(--button-face-color, #C8C8C8);
								border-radius: 20px;
								display: flex;
								align-items: center;
								gap: 2px;

								> svg {
									width: 1em;
									height: 1em;
								}
							}
						}	
					}
				</style>`);
			}
		}

		getId(key) {
			return `gw-option-listbox-${this.InstanceId}-${key}`;
		}
		getRef(key) {
			return this.querySelector(`#${CSS.escape(this.getId(key))}`);
		}

		get FieldsetEl() {
			return this.querySelector("fieldset");
		}

		get LegendEl() {
			return this.querySelector("legend");
		}

		get LabelElAry() {
			return [...this.querySelectorAll("label")];
		}

		get ActiveDescendant() {
			return this.FieldsetEl.getAttribute("aria-activedescendant");
		}
		set ActiveDescendant(value) {
			if(value) {
				this.FieldsetEl.setAttribute("aria-activedescendant", value);
			}
			else {
				this.FieldsetEl.removeAttribute("aria-activedescendant");
			}
		}

		get Value() {
			const checkedInput = this.querySelector(`[role="option"][aria-selected="true"] input`);
			if(checkedInput) {
				return checkedInput.value;
			}
			else {
				return null;
			}
		}

		connectedCallback() {
			if(!this.IsInitialized) {
				if(document.readyState === "loading") {
					document.addEventListener("DOMContentLoaded", () => {
						if(!this.IsInitialized) {
							this.renderContent();
						}
					});
				}
				else {
					this.renderContent();
				}
			}
		}

		/**
		 * Sets up the state and interactivity of the listbox.
		 */
		renderContent() {
			Object.entries({
				"role": "listbox",
				"aria-multiselectable": "false",
			}).forEach(
				([attribute, value]) => this.FieldsetEl.setAttribute(attribute, value)
			);
			this.ActiveDescendant = null;
			this.KeyMap = {};

			if(!this.LegendEl.hasAttribute("data-optionlistbox-has-icon")) {
				this.LegendEl.insertAdjacentHTML(
					"beforeend",
					`<svg viewBox="0 0 576 512" class="gw-icon" aria-hidden="true"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) Copyright 2023 Fonticons, Inc. --><title>Use arrow keys or type an option to navigate.</title><path d="M64 64C28.7 64 0 92.7 0 128V384c0 35.3 28.7 64 64 64H512c35.3 0 64-28.7 64-64V128c0-35.3-28.7-64-64-64H64zm16 64h32c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H80c-8.8 0-16-7.2-16-16V144c0-8.8 7.2-16 16-16zM64 240c0-8.8 7.2-16 16-16h32c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H80c-8.8 0-16-7.2-16-16V240zm16 80h32c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H80c-8.8 0-16-7.2-16-16V336c0-8.8 7.2-16 16-16zm80-176c0-8.8 7.2-16 16-16h32c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H176c-8.8 0-16-7.2-16-16V144zm16 80h32c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H176c-8.8 0-16-7.2-16-16V240c0-8.8 7.2-16 16-16zM160 336c0-8.8 7.2-16 16-16H400c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H176c-8.8 0-16-7.2-16-16V336zM272 128h32c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H272c-8.8 0-16-7.2-16-16V144c0-8.8 7.2-16 16-16zM256 240c0-8.8 7.2-16 16-16h32c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H272c-8.8 0-16-7.2-16-16V240zM368 128h32c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H368c-8.8 0-16-7.2-16-16V144c0-8.8 7.2-16 16-16zM352 240c0-8.8 7.2-16 16-16h32c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H368c-8.8 0-16-7.2-16-16V240zM464 128h32c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H464c-8.8 0-16-7.2-16-16V144c0-8.8 7.2-16 16-16zM448 240c0-8.8 7.2-16 16-16h32c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H464c-8.8 0-16-7.2-16-16V240zm16 80h32c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H464c-8.8 0-16-7.2-16-16V336c0-8.8 7.2-16 16-16z"></path></svg>`
				);
				this.LegendEl.setAttribute("data-optionlistbox-has-icon", "true");
			}
			
			let hasChecked = false;
			this.LabelElAry.forEach(labelEl => {
				if(!labelEl.hasAttribute("data-optionlistbox-listening")) {
					labelEl.addEventListener("click", (event) => this.clickOption(event.target));
					labelEl.addEventListener("keydown", this.onOptionKeydown);
					labelEl.addEventListener("keyup", this.onOptionKeyup);
					labelEl.setAttribute("data-optionlistbox-listening", "true");
				}
				const inputEl = labelEl.querySelector("input");
				Object.entries({
					"aria-hidden": "true",
					"tab-index": "-1",
					"inert": "true"
				}).forEach(
					([attribute, value]) => inputEl.setAttribute(attribute, value)
				);

				this.#overwriteInputChecked(inputEl);
				this.#overwriteInputClick(inputEl);

				Object.entries({
					"id": labelEl.id || this.getId(this.IdIter++),
					"role": "option",
					"tabindex": "-1",
					"aria-selected": inputEl.checked
				}).forEach(
					([attribute, value]) => labelEl.setAttribute(attribute, value)
				);

				this.addToKeyMap(labelEl.innerText.trim().toLowerCase(), labelEl);

				if(!this.ActiveDescendant || (!hasChecked && inputEl.checked)) {
					if(inputEl.checked) {
						hasChecked = true;
					}
					this.setActiveOption(labelEl);
				}
			});

			if(!this.IsInitialized) {
				new MutationObserver(() => this.renderContent()).observe(
					this,
					{childList: true, subtree: true}
				);
			}
			this.IsInitialized = true;
		}

		/**
		 * Enables an option for type-ahead functionality
		 * @param {string} text Option's text
		 * @param {HTMLElement} optionEl Option element
		 */
		addToKeyMap(text, optionEl) {
			let currentLevel = this.KeyMap;
			text.split("").forEach(character => {
				currentLevel[character] = currentLevel[character] || {};
				currentLevel = currentLevel[character];
				(currentLevel.OptionElAry = currentLevel.OptionElAry || []).push(optionEl);
			});
		}

		onOptionKeydown = (event) => {
			let newOptionEl = null;

			switch(event.key) {
				case "ArrowRight":
				case "ArrowDown":
					newOptionEl = this.getAdjacentOption(event.target, "nextElementSibling");
					break;
				case "ArrowLeft":
				case "ArrowUp":
					newOptionEl = this.getAdjacentOption(event.target, "previousElementSibling");
					break;
				case "Home":
					newOptionEl = this.querySelector(`[role="option"]:first-of-type`);
					break;
				case "End":
					newOptionEl = this.querySelector(`[role="option"]:last-of-type`);
					break;
				case "Enter":
					newOptionEl = event.target;
					return;
				case " ":
					event.preventDefault();
					return;
				default:
					newOptionEl = this.getFirstMatch(event.key.toLowerCase());
					if(newOptionEl && newOptionEl.id === this.ActiveDescendant) {
						event.preventDefault();
						return;
					}
					break;
			}
			if(newOptionEl) {
				event.preventDefault();
				this.clickOption(newOptionEl);
			}
		};

		/**
		 * Finds the next adjacent option using the specified access attribute
		 * @param {HTMLElement} optionEl The current option to search from
		 * @param {string} accessAttrName "nextElementSibling" or "previousElementSibling"
		 * @returns The next adjacent option, if it exists
		 */
		getAdjacentOption(optionEl, accessAttrName) {
			let curEl = optionEl;
			do {
				curEl = curEl[accessAttrName];
			} while(curEl && !curEl.matches(`[role="option"]`));
			
			return curEl;
		}

		onOptionKeyup = (event) => {
			switch(event.key) {
				case " ":
					this.clickOption(event.target);
					event.preventDefault();
					break;
			}
		};

		/**
		 * Finds a type-ahead match
		 * @param {string} key Latest typed character
		 * @returns {HTMLElement | null} Option element match
		 */
		getFirstMatch(key) {
			const keyTimestamp = new Date();
			if(keyTimestamp - this.LastKeyTimestamp > OptionListboxEl.ResetMs) {
				this.CurKeySequence = [];
			}
			this.LastKeyTimestamp = keyTimestamp;

			this.CurKeySequence.push(key);

			let sequenceObj = this.KeyMap;
			this.CurKeySequence.forEach(key => sequenceObj = sequenceObj[key] || {});

			if(!sequenceObj.OptionElAry) {
				if(this.KeyMap[key]?.OptionElAry) {
					this.CurKeySequence = [key];
					sequenceObj = this.KeyMap[key];
				}
				else {
					this.CurKeySequence = [];
					return null;
				}
			}

			return sequenceObj.OptionElAry[0];
		}

		/**
		 * Updates what the active option is
		 * @param {HTMLElement} optionEl The newly active option
		 */
		setActiveOption(optionEl) {
			if(this.ActiveDescendant) {
				this.querySelector(`#${this.ActiveDescendant}`).setAttribute("tabindex", "-1");
			}
			optionEl.setAttribute("tabindex", "0");
			if(this.IsInitialized && this.matches(`:focus-within`)) {
				optionEl.focus();
			}
			this.ActiveDescendant = optionEl.id;
		}

		clickOption(optionEl) {
			if(!optionEl.matches(`[role="option"]`)) {
				return;
			}

			if(this.#clickTimeout) {
				clearTimeout(this.#clickTimeout);
			}
			this.#clickTimeout = setTimeout(() => this.#performClick(optionEl), 0);
		}

		#performClick(optionEl) {
			this.#clickTimeout = null;

			this.setActiveOption(optionEl);

			const isNowSelected = this.hasAttribute("data-single")
				? true
				: optionEl.getAttribute("aria-selected") !== "true";
			optionEl.querySelector("input").checked = isNowSelected;
			optionEl.setAttribute("aria-selected", isNowSelected);

			if(isNowSelected) {
				this.LabelElAry.forEach(labelEl => {
					if(labelEl !== optionEl) {
						labelEl.setAttribute("aria-selected", "false");
					}
				});
			}
			this.dispatchEvent(new Event("option-click"));
		}

		#overwriteInputChecked(inputEl) {
			const checkedDescriptor = Object.getOwnPropertyDescriptor(
				Object.getPrototypeOf(inputEl),
				"checked"
			);
			const originalSet = checkedDescriptor.set;
			checkedDescriptor.set = this.#createDelegate(
				inputEl,
				function(checkedDescriptor, originalSet, customHandler, value) {
					const oldValue = this.Value;

					const newSet = checkedDescriptor.set;
					checkedDescriptor.set = originalSet;
					Object.defineProperty(this, "checked", checkedDescriptor);

					this.checked = value;

					checkedDescriptor.set = newSet;
					Object.defineProperty(this, "checked", checkedDescriptor);
					
					customHandler(oldValue);
				},
				[checkedDescriptor, originalSet, this.#customInputChecked]
			);
			Object.defineProperty(inputEl, "checked", checkedDescriptor);
		}
		#customInputChecked = (oldValue) => {
			this.IsInitialized = false;
			this.LabelElAry.forEach(labelEl => {
				const inputEl = labelEl.querySelector("input");
				labelEl.setAttribute("aria-selected", inputEl.checked);
				if(inputEl.checked) {
					this.setActiveOption(labelEl);
				}
			});
			this.IsInitialized = true;

			if(this.Value !== oldValue) {
				this.dispatchEvent(new Event("selection-change"))
			}
		}

		#overwriteInputClick(inputEl) {
			const clickDescriptor = Object.getOwnPropertyDescriptor(
				Object.getPrototypeOf(Object.getPrototypeOf(inputEl)),
				"click"
			);

			const originalClick = clickDescriptor.value;
			clickDescriptor.value = this.#createDelegate(
				inputEl,
				function(clickDescriptor, customHandler, originalClick) {
					const oldValue = this.Value;

					const newClick = clickDescriptor.value;
					clickDescriptor.value = originalClick;
					Object.defineProperty(this, "click", clickDescriptor);

					this.click();

					clickDescriptor.value = newClick;
					Object.defineProperty(this, "click", clickDescriptor);

					customHandler();
				},
				[clickDescriptor, this.#customInputClick, originalClick]
			);
			Object.defineProperty(inputEl, "click", clickDescriptor);
		}
		#customInputClick = (oldValue) => {
			this.#customInputChecked();
		};

		#createDelegate = function(context, method, args) {
			return function generatedFunction() {
				return method.apply(context, (args || []).concat(...arguments));
			}
		}
	}
	customElements.define("gw-option-listbox", ns.OptionListboxEl);
}) (window.GW.Controls.OptionListbox = window.GW.Controls.OptionListbox || {});
GW?.Controls?.Veil?.clearDefer("GW.Controls.OptionListbox");