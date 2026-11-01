(() => {
    const pointerMedia = window.matchMedia('(hover: hover) and (pointer: fine)');
    const setupOverlay = document.getElementById('setupOverlay');
    const style = document.createElement('style');
    style.textContent = `
        html.site-cursor-enabled,
        html.site-cursor-enabled *,
        html.site-cursor-enabled *::before,
        html.site-cursor-enabled *::after { cursor: none !important; }
        html.site-cursor-enabled .jump-drag-handle { cursor: grab !important; }
        html.site-cursor-enabled .jump-drag-handle:active { cursor: grabbing !important; }
        .site-cursor-icon {
            position: fixed;
            top: 0;
            left: 0;
            z-index: 2147483647;
            width: 22px;
            height: 22px;
            color: #42c5b5;
            pointer-events: none;
            visibility: hidden;
            will-change: transform;
        }
        .site-cursor-icon svg { display: none; width: 22px; height: 22px; }
        .site-cursor-icon .site-cursor-hand { height: 26px; }
        .site-cursor-icon[data-shape="arrow"] .site-cursor-arrow,
        .site-cursor-icon[data-shape="hand"] .site-cursor-hand,
        .site-cursor-icon[data-shape="lens"] .site-cursor-lens { display: block; }
    `;
    document.head.appendChild(style);

    const cursor = document.createElement('div');
    cursor.className = 'site-cursor-icon';
    cursor.dataset.shape = 'arrow';
    cursor.setAttribute('aria-hidden', 'true');
    cursor.innerHTML = `
        <svg class="site-cursor-arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" aria-hidden="true">
            <path d="M2 2v21l5.4-5.5 4.8 8.3 3.8-2.2-4.7-8.1H19Z" fill="currentColor" stroke="#0a0a0a" stroke-width="1.2" stroke-linejoin="miter"/>
        </svg>
        <svg class="site-cursor-hand" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 32" aria-hidden="true">
            <path d="M10.6 28.3 4.8 20.5c-1.4-1.9-1.3-3.3 0-4.3 1.2-.9 2.7-.5 3.9.9l1.5 1.8V5.2c0-2 1.1-3.2 2.8-3.2s2.8 1.2 2.8 3.2v9.6l7.3 1.4c2.6.5 3.7 2.1 3.7 4.3v3.7c0 2.7-1.2 4.7-3 5.4H12.8c-.9 0-1.6-.4-2.2-1.3Z" fill="currentColor" stroke="#0a0a0a" stroke-width="2.1" stroke-linejoin="round" stroke-linecap="round"/>
            <path d="M11.3 17.5v4.4" fill="none" stroke="#0a0a0a" stroke-width="2.1" stroke-linecap="round"/>
        </svg>
        <svg class="site-cursor-lens" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" aria-hidden="true">
            <path d="m17.7 17.7 7.2 7.2" fill="none" stroke="#0a0a0a" stroke-width="5" stroke-linecap="square"/>
            <path d="m17.7 17.7 7.2 7.2" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="square"/>
            <circle cx="11.5" cy="11.5" r="7.5" fill="none" stroke="#0a0a0a" stroke-width="4"/>
            <circle cx="11.5" cy="11.5" r="7.5" fill="none" stroke="currentColor" stroke-width="2"/>
        </svg>
    `;
    document.body.appendChild(cursor);

    let enabled = false;
    let lastPoint = null;
    let lastTarget;
    let lastDynamicStage = null;
    let lastShape = null;
    let lastColor = null;

    function isTeal(rgb) {
        return rgb[1] >= 105 && rgb[1] > rgb[0] * 1.22 &&
            rgb[2] >= rgb[1] * .65 && rgb[2] <= rgb[1] * 1.15 &&
            rgb[0] < rgb[2] * .8;
    }

    function surfaceAt(target) {
        for (let element = target; element; element = element.parentElement) {
            if (element.dataset?.cursorSurface === 'teal') return '#0a0a0a';
            const color = getComputedStyle(element).backgroundColor;
            const channels = color.match(/[\d.]+/g)?.map(Number);
            if (!channels || channels.length < 3 || (channels[3] ?? 1) < .75) continue;
            return isTeal(channels) ? '#0a0a0a' : '#42c5b5';
        }
        return '#42c5b5';
    }

    function shapeAt(target) {
        if (!target?.closest) return 'arrow';
        if (target.closest('#evidenceBoard, [data-cursor-shape="lens"], .zoomable-figure, .zoom-image-button, .trace-board-expand, .pf2-zoom, .sm-process-image-trigger, .sm-process-enlarge')) return 'lens';
        if (target.closest('.jump-drag-handle')) return 'native';
        if (target.closest('[data-cursor-shape="arrow"]')) return 'arrow';
        const coloringStage = target.closest('.coloring-stage');
        if (coloringStage) return coloringStage.matches('.is-ready.is-over-piece') ? 'hand' : 'arrow';
        const interactive = target.closest('a[href], button, summary, select, label, input:is([type="button"], [type="submit"], [type="reset"], [type="checkbox"], [type="radio"], [type="range"], [type="file"], [type="color"], [type="image"]), [role="button"], [role="link"], [role="tab"], [role="menuitem"], [role="switch"], [role="checkbox"], [role="radio"], [role="option"], [data-cursor-shape="hand"]');
        return interactive && !interactive.matches(':disabled, [aria-disabled="true"]') ? 'hand' : 'arrow';
    }

    function updateAt(x, y, target) {
        if (!enabled) return;
        const targetChanged = target !== lastTarget;
        if (targetChanged) {
            lastTarget = target;
            lastDynamicStage = target?.closest?.('.coloring-stage') || null;
            const color = surfaceAt(target);
            if (color !== lastColor) {
                cursor.style.color = color;
                lastColor = color;
            }
        }
        if (targetChanged || lastDynamicStage) {
            const shape = shapeAt(target);
            if (shape !== lastShape) {
                cursor.dataset.shape = shape;
                lastShape = shape;
            }
        }
        const offsetX = lastShape === 'arrow' ? 2 : lastShape === 'hand' ? 10 : 9;
        const offsetY = lastShape === 'lens' ? 9 : 2;
        cursor.style.transform = `translate3d(${x - offsetX}px, ${y - offsetY}px, 0)`;
        cursor.style.visibility = 'visible';
    }

    function refresh() {
        enabled = pointerMedia.matches && (!setupOverlay || !setupOverlay.hidden);
        lastTarget = undefined;
        lastDynamicStage = null;
        document.documentElement.classList.toggle('site-cursor-enabled', enabled);
        cursor.style.visibility = 'hidden';
        if (enabled && lastPoint) {
            updateAt(lastPoint.x, lastPoint.y, document.elementFromPoint(lastPoint.x, lastPoint.y));
        }
    }

    document.addEventListener('pointermove', event => {
        if (event.pointerType === 'touch') return;
        lastPoint = { x: event.clientX, y: event.clientY };
        updateAt(lastPoint.x, lastPoint.y, event.target);
    }, { passive: true });
    document.addEventListener('scroll', () => {
        if (enabled && lastPoint) updateAt(lastPoint.x, lastPoint.y, document.elementFromPoint(lastPoint.x, lastPoint.y));
    }, { capture: true, passive: true });
    document.addEventListener('click', () => {
        if (!enabled || !lastPoint) return;
        requestAnimationFrame(() => {
            lastTarget = undefined;
            updateAt(lastPoint.x, lastPoint.y, document.elementFromPoint(lastPoint.x, lastPoint.y));
        });
    }, { capture: true });
    document.addEventListener('pointerleave', () => {
        lastTarget = undefined;
        cursor.style.visibility = 'hidden';
    });
    window.addEventListener('blur', () => {
        lastTarget = undefined;
        cursor.style.visibility = 'hidden';
    });
    if (pointerMedia.addEventListener) pointerMedia.addEventListener('change', refresh);
    else pointerMedia.addListener(refresh);
    if (setupOverlay) new MutationObserver(refresh).observe(setupOverlay, { attributes: true, attributeFilter: ['hidden'] });
    refresh();
})();
