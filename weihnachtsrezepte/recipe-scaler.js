// Rezept-Skalierer: Passt Zutatenmengen basierend auf der Portionenanzahl an

(function() {
	// Warte bis das DOM geladen ist
	document.addEventListener('DOMContentLoaded', function() {
		// Finde den Portionen-Text
		const portionenParagraph = Array.from(document.querySelectorAll('p')).find(p => 
			p.textContent.includes('Portionen:')
		);
		
		if (!portionenParagraph) return;
		
		// Extrahiere die ursprüngliche Portionenanzahl
		const portionenMatch = portionenParagraph.textContent.match(/(\d+)(?:-(\d+))?\s*Portionen?/);
		if (!portionenMatch) return;
		
		// Verwende die erste Zahl als Basis (bei "4-6 Portionen" wird 4 verwendet)
		const basePortions = parseInt(portionenMatch[1]);
		
		// Finde die Zutatenliste
		const zutatenHeading = Array.from(document.querySelectorAll('h3')).find(h => 
			h.textContent.trim() === 'Zutaten:'
		);
		
		if (!zutatenHeading) return;
		
		const zutatenList = zutatenHeading.nextElementSibling;
		if (!zutatenList || zutatenList.tagName !== 'UL') return;
		
		// Speichere die ursprünglichen Zutaten
		const originalIngredients = Array.from(zutatenList.querySelectorAll('li')).map(li => ({
			text: li.textContent.trim(),
			element: li
		}));
		
		// Funktion zum Parsen einer Zutatenzeile
		function parseIngredient(text) {
			// Muster: Zahl (optional Dezimal) + Einheit + Rest
			const match = text.match(/^(\d+(?:[.,]\d+)?)\s*(g|kg|ml|l|TL|EL|Päckchen|Stück|Stk|St\.?|Tasse|Tassen|Prise|Prisen|zum Bestäuben|nach Bedarf)/i);
			
			if (match) {
				const amount = parseFloat(match[1].replace(',', '.'));
				const unit = match[2];
				const rest = text.substring(match[0].length).trim();
				return { amount, unit, rest, hasAmount: true };
			}
			
			// Keine Menge gefunden (z.B. "Kakaopulver zum Bestäuben")
			return { amount: null, unit: null, rest: text, hasAmount: false };
		}
		
		// Funktion zum Formatieren einer Zahl
		function formatNumber(num) {
			// Wenn es eine ganze Zahl ist, ohne Dezimalstellen anzeigen
			if (Math.abs(num % 1) < 0.001) {
				return Math.round(num).toString();
			}
			// Für Bruchteile wie 0.5, 0.25, 0.75 als Bruch darstellen
			if (Math.abs(num - 0.5) < 0.01) return '1/2';
			if (Math.abs(num - 0.25) < 0.01) return '1/4';
			if (Math.abs(num - 0.75) < 0.01) return '3/4';
			if (Math.abs(num - 0.33) < 0.01) return '1/3';
			if (Math.abs(num - 0.67) < 0.01) return '2/3';
			// Sonst mit maximal 2 Dezimalstellen
			const rounded = Math.round(num * 100) / 100;
			return rounded.toString().replace('.', ',');
		}
		
		// Funktion zum Aktualisieren der Zutaten
		function updateIngredients(portions) {
			const factor = portions / basePortions;
			
			originalIngredients.forEach((ingredient, index) => {
				const parsed = parseIngredient(ingredient.text);
				
				if (parsed.hasAmount) {
					const newAmount = parsed.amount * factor;
					const formattedAmount = formatNumber(newAmount);
					
					// Spezielle Behandlung für Päckchen, Stück, etc.
					if (parsed.unit.toLowerCase().includes('päckchen') || 
					    parsed.unit.toLowerCase().includes('stück') || 
					    parsed.unit.toLowerCase().includes('stk') ||
					    parsed.unit.toLowerCase().includes('st.')) {
						if (newAmount < 0.5) {
							ingredient.element.textContent = `1/2 ${parsed.unit}${parsed.rest ? ' ' + parsed.rest : ''}`;
						} else if (newAmount < 1) {
							ingredient.element.textContent = `1 ${parsed.unit}${parsed.rest ? ' ' + parsed.rest : ''}`;
						} else {
							ingredient.element.textContent = `${Math.round(newAmount)} ${parsed.unit}${parsed.rest ? ' ' + parsed.rest : ''}`;
						}
					} else {
						ingredient.element.textContent = `${formattedAmount} ${parsed.unit}${parsed.rest ? ' ' + parsed.rest : ''}`;
					}
				} else {
					// Keine Menge - unverändert lassen
					ingredient.element.textContent = ingredient.text;
				}
			});
		}
		
		// Erstelle den Portionen-Controller
		const controllerDiv = document.createElement('div');
		controllerDiv.style.cssText = 'margin: 15px 0; padding: 15px; background-color: #f2eddf; border-radius: 8px; border: 2px solid #062B1E;';
		
		const label = document.createElement('label');
		label.style.cssText = 'display: block; margin-bottom: 10px; font-weight: bold; color: #5A0A18;';
		label.textContent = 'Anzahl der Portionen:';
		
		const inputContainer = document.createElement('div');
		inputContainer.style.cssText = 'display: flex; align-items: center; gap: 15px; justify-content: center;';
		
		// Verstecktes Input-Feld (für interne Verwendung)
		const input = document.createElement('input');
		input.type = 'number';
		input.min = '1';
		input.max = '20';
		input.value = basePortions;
		input.style.cssText = 'display: none;';
		
		// Minus-Button
		const minusButton = document.createElement('button');
		minusButton.textContent = '−';
		minusButton.style.cssText = 'width: 40px; height: 40px; font-size: 1.5rem; font-weight: bold; border: 2px solid #062B1E; border-radius: 4px; background-color: #F8F6EF; color: #5A0A18; cursor: pointer; display: flex; align-items: center; justify-content: center;';
		minusButton.addEventListener('mouseenter', function() {
			this.style.backgroundColor = '#f2eddf';
		});
		minusButton.addEventListener('mouseleave', function() {
			this.style.backgroundColor = '#F8F6EF';
		});
		
		// Anzeige der Portionenanzahl
		const display = document.createElement('span');
		display.style.cssText = 'font-weight: bold; color: #5A0A18; font-size: 1.1rem; min-width: 120px; text-align: center;';
		display.textContent = `${basePortions} Portionen`;
		
		// Plus-Button
		const plusButton = document.createElement('button');
		plusButton.textContent = '+';
		plusButton.style.cssText = 'width: 40px; height: 40px; font-size: 1.5rem; font-weight: bold; border: 2px solid #062B1E; border-radius: 4px; background-color: #F8F6EF; color: #5A0A18; cursor: pointer; display: flex; align-items: center; justify-content: center;';
		plusButton.addEventListener('mouseenter', function() {
			this.style.backgroundColor = '#f2eddf';
		});
		plusButton.addEventListener('mouseleave', function() {
			this.style.backgroundColor = '#F8F6EF';
		});
		
		// Funktion zum Aktualisieren der Anzeige
		function updateDisplay(portions) {
			input.value = portions;
			updateIngredients(portions);
			display.textContent = portions === 1 ? '1 Portion' : `${portions} Portionen`;
			
			// Buttons aktivieren/deaktivieren basierend auf Grenzen
			minusButton.disabled = portions <= 1;
			plusButton.disabled = portions >= 20;
			
			if (portions <= 1) {
				minusButton.style.opacity = '0.5';
				minusButton.style.cursor = 'not-allowed';
			} else {
				minusButton.style.opacity = '1';
				minusButton.style.cursor = 'pointer';
			}
			
			if (portions >= 20) {
				plusButton.style.opacity = '0.5';
				plusButton.style.cursor = 'not-allowed';
			} else {
				plusButton.style.opacity = '1';
				plusButton.style.cursor = 'pointer';
			}
		}
		
		// Event-Handler für Buttons
		minusButton.addEventListener('click', function() {
			const currentPortions = parseInt(input.value) || basePortions;
			if (currentPortions > 1) {
				updateDisplay(currentPortions - 1);
			}
		});
		
		plusButton.addEventListener('click', function() {
			const currentPortions = parseInt(input.value) || basePortions;
			if (currentPortions < 20) {
				updateDisplay(currentPortions + 1);
			}
		});
		
		// Initialisiere die Anzeige
		updateDisplay(basePortions);
		
		inputContainer.appendChild(minusButton);
		inputContainer.appendChild(display);
		inputContainer.appendChild(plusButton);
		
		controllerDiv.appendChild(label);
		controllerDiv.appendChild(inputContainer);
		controllerDiv.appendChild(input); // Verstecktes Input für interne Verwendung
		
		// Ersetze den ursprünglichen Portionen-Paragraph durch den Controller
		portionenParagraph.parentNode.replaceChild(controllerDiv, portionenParagraph);
	});
})();

