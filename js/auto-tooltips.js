(function(){
	function hasExistingTooltip(el){
		return el.classList.contains('tooltip') || el.querySelector?.('.tooltiptext') || el.getAttribute('title') || el.getAttribute('aria-label') || el.dataset.tooltip || el.dataset.noTooltip === 'true';
	}

	function deriveText(el){
		return el.getAttribute('data-tooltip') || el.getAttribute('aria-label') || el.getAttribute('title') || (el.textContent||'').trim();
	}

	function eligible(el){
		if(!el) return false;
		if (hasExistingTooltip(el)) return false;
		// Exclude export image dimension inputs from tooltips
		if (el.id && ['export-image-width-input', 'export-image-height-input'].includes(el.id)) return false;
		// Exclude blockchain toggles from Export NFTs tab
		if (el.id && ['ethereum', 'solana', 'bitcoin', 'cosmos', 'tezos', 'xrpl', 'polygon', 'immutablex', 'base', 'avalanche', 'flow', 'arbitrum'].includes(el.id)) return false;
		// Exclude metadata.rarity.rank toggle
		if (el.id && el.id === 'metadata.rarity.rank') return false;
		
		// Never add tooltips to cancel buttons
		const text = (el.textContent || '').trim().toLowerCase();
		const id = (el.id || '').toLowerCase();
		// Handle className - it can be a string or DOMTokenList
		const classNameStr = typeof el.className === 'string' 
			? el.className 
			: (el.classList ? Array.from(el.classList).join(' ') : '');
		const className = classNameStr.toLowerCase();
		if (text.includes('cancel') || 
		    id.includes('cancel') || 
		    className.includes('cancel') ||
		    className.includes('cancel-btn') ||
		    className.includes('scan-cancel-btn')) {
			return false;
		}
		
		// Never add tooltips to Apply, Save, Confirm, OK, Submit buttons
		const actionWords = ['apply', 'save', 'confirm', 'ok', 'submit'];
		if (actionWords.some(word => text.includes(word) || id.includes(word) || className.includes(word))) {
			return false;
		}
		
		// Interactive elements only
		const tag = el.tagName?.toLowerCase();
		if (['button','a','input','select','textarea'].includes(tag)) return true;
		// Elements that look like buttons
		const role = el.getAttribute('role');
		if (role === 'button' || role === 'link') return true;
		if (el.classList?.contains('btn') || el.classList?.contains('app-action-btn') || el.classList?.contains('action-btn')) return true;
		return false;
	}

	function wrapWithTooltip(el, text){
		if (!text) return;
		el.classList.add('tooltip');
		// keep native title for accessibility but we render our tooltip span
		if (!el.getAttribute('title')) el.setAttribute('title', text);
		const span = document.createElement('span');
		span.className = 'tooltiptext';
		span.textContent = text;
		el.appendChild(span);
	}

	function scan(root){
		const nodes = root.querySelectorAll?.('*') || [];
		nodes.forEach(el => {
			if (!eligible(el)) return;
			const text = deriveText(el);
			wrapWithTooltip(el, text);
		});
	}

	function onModalOpen(root){
		// Scan newly opened modals
		scan(root);
	}

	function init(){
		// Initial scan
		scan(document);
		// Observe DOM changes for dynamically added buttons
		const observer = new MutationObserver(mutations => {
			for (const m of mutations){
				m.addedNodes && m.addedNodes.forEach(node => {
					if(!(node instanceof HTMLElement)) return;
					scan(node);
				});
			}
		});
		observer.observe(document.documentElement, {childList: true, subtree: true});
		// Hook common modal containers by event
		document.addEventListener('modal:open', (e)=> onModalOpen(e.detail?.root || document));
		// Specific known modals
		['#trait-selection-modal','#saved-seeds-modal','#confirmation-modal'].forEach(sel=>{
			const el = document.querySelector(sel);
			if (el) scan(el);
		});
	}

	if (document.readyState === 'loading'){
		document.addEventListener('DOMContentLoaded', init);
	}else{
		init();
	}
})();


