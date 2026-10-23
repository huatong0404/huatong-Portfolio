(() => {
    const menuButton = document.querySelector('.pf2-site-nav .nav-toggle');
    const menuLinks = document.querySelector('.pf2-site-nav .nav-links');

    if (menuButton && menuLinks) {
        const closeMenu = () => {
            menuButton.setAttribute('aria-expanded', 'false');
            menuLinks.classList.remove('open');
        };

        menuButton.addEventListener('click', () => {
            const open = menuButton.getAttribute('aria-expanded') !== 'true';
            menuButton.setAttribute('aria-expanded', String(open));
            menuLinks.classList.toggle('open', open);
        });
        menuLinks.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
        document.addEventListener('keydown', event => {
            if (event.key === 'Escape' && menuLinks.classList.contains('open')) {
                closeMenu();
                menuButton.focus();
            }
        });
    }

    const chapterLinks = [...document.querySelectorAll('.pf2-index a[href^="#"]')];
    const chapters = chapterLinks
        .map(link => document.getElementById(link.hash.slice(1)))
        .filter(Boolean);
    let chapterUpdateQueued = false;

    function updateActiveChapter() {
        chapterUpdateQueued = false;
        const readingLine = window.scrollY + window.innerHeight * 0.32;
        let current = chapters[0];
        for (const chapter of chapters) {
            if (chapter.getBoundingClientRect().top + window.scrollY <= readingLine) {
                current = chapter;
            } else {
                break;
            }
        }
        if (!current) return;
        chapterLinks.forEach(link => {
            const active = link.hash === `#${current.id}`;
            link.classList.toggle('is-active', active);
            if (active) link.setAttribute('aria-current', 'location');
            else link.removeAttribute('aria-current');
        });
        document.body.classList.toggle('pf2-on-dark', current.id === 'gaps');
    }

    function queueChapterUpdate() {
        if (chapterUpdateQueued) return;
        chapterUpdateQueued = true;
        window.requestAnimationFrame(updateActiveChapter);
    }

    if (chapters.length) {
        window.addEventListener('scroll', queueChapterUpdate, { passive: true });
        window.addEventListener('resize', queueChapterUpdate);
        window.addEventListener('load', queueChapterUpdate);
        updateActiveChapter();
    }

    function wireTabs(buttons, select) {
        buttons.forEach((button, index) => {
            button.addEventListener('click', () => select(index));
            button.addEventListener('keydown', event => {
                const direction = {
                    ArrowLeft: -1,
                    ArrowUp: -1,
                    ArrowRight: 1,
                    ArrowDown: 1
                }[event.key];
                if (direction === undefined && event.key !== 'Home' && event.key !== 'End') return;
                event.preventDefault();
                const next = event.key === 'Home' ? 0
                    : event.key === 'End' ? buttons.length - 1
                        : (index + direction + buttons.length) % buttons.length;
                select(next, true);
            });
        });
    }

    const jointRows = [
        { name: 'A', viewBox: '95 338 1360 560', caption: 'Five triangular pieces become a pentagonal half.' },
        { name: 'AA', viewBox: '95 894 1360 560', caption: 'The AA connector, shown in plan and axonometric view.' },
        { name: 'B', viewBox: '95 1450 1360 560', caption: 'The B connector, shown in plan and axonometric view.' },
        { name: 'BB', viewBox: '95 2006 1360 560', caption: 'The BB connector, shown in plan and axonometric view.' },
        { name: 'AB', viewBox: '95 2562 1360 560', caption: 'The AB connector, shown in plan and axonometric view.' }
    ];
    const jointTabs = [...document.querySelectorAll('.pf2-joint-tabs [role="tab"]')];
    const jointPanel = document.getElementById('pf2-joint-panel');
    const jointCrop = document.getElementById('pf2-joint-crop');
    const jointCaption = document.getElementById('pf2-joint-caption');

    function selectJoint(index, focus = false) {
        const row = jointRows[index];
        if (!row || !jointCrop || !jointPanel || !jointCaption) return;
        jointTabs.forEach((button, buttonIndex) => {
            const active = buttonIndex === index;
            button.setAttribute('aria-selected', String(active));
            button.tabIndex = active ? 0 : -1;
        });
        jointPanel.setAttribute('aria-labelledby', jointTabs[index].id);
        jointCrop.setAttribute('viewBox', row.viewBox);
        jointCrop.setAttribute('aria-label', `Connector ${row.name} plan and axonometric drawing`);
        jointCaption.textContent = row.caption;
        if (focus) jointTabs[index].focus();
    }

    wireTabs(jointTabs, selectJoint);

    const viewTabs = [...document.querySelectorAll('.pf2-view-tabs [role="tab"]')];
    const viewPanel = document.getElementById('pf2-view-panel');
    const viewImage = document.getElementById('pf2-view-image');
    const viewCounter = document.getElementById('pf2-view-counter');
    const viewEnlarge = document.getElementById('pf2-view-enlarge');
    const viewDescriptions = [
        'Pollen Farm plan showing the directions of its planting openings',
        'Front elevation of Pollen Farm showing the changing height of its rooms',
        'Left elevation of Pollen Farm showing the leaning plywood structure',
        'Right elevation of Pollen Farm showing the leaning plywood structure'
    ];
    let currentView = 0;

    function selectView(index, focus = false) {
        const button = viewTabs[index];
        const thumbnail = button?.querySelector('img');
        if (!button || !thumbnail || !viewImage || !viewPanel || !viewCounter || !viewEnlarge) return;
        currentView = index;
        viewTabs.forEach((tab, tabIndex) => {
            const active = tabIndex === index;
            tab.setAttribute('aria-selected', String(active));
            tab.tabIndex = active ? 0 : -1;
        });
        viewPanel.setAttribute('aria-labelledby', button.id);
        viewImage.src = thumbnail.getAttribute('src');
        viewImage.alt = viewDescriptions[index];
        viewCounter.textContent = `${String(index + 1).padStart(2, '0')} / ${String(viewTabs.length).padStart(2, '0')}`;
        viewEnlarge.setAttribute('aria-label', `Enlarge ${button.textContent.trim().replace(/^\d+\s*/, '')} drawing`);
        if (focus) button.focus();
    }

    wireTabs(viewTabs, selectView);

    const lightbox = document.getElementById('pf2-lightbox');
    const lightboxImage = lightbox?.querySelector('img');
    const lightboxCaption = lightbox?.querySelector('p');
    const lightboxClose = lightbox?.querySelector('.pf2-lightbox-close');
    let lightboxOpener = null;
    let previousBodyOverflow = '';

    function openLightbox(src, alt, caption, opener, sheet = false) {
        if (!lightbox || !lightboxImage || !lightboxCaption || !lightboxClose) return;
        lightboxOpener = opener;
        lightboxImage.src = new URL(src, document.baseURI).href;
        lightboxImage.alt = alt;
        lightboxCaption.textContent = caption;
        lightbox.classList.toggle('is-sheet', sheet);
        lightbox.classList.add('is-open');
        lightbox.setAttribute('aria-hidden', 'false');
        previousBodyOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        lightboxClose.focus();
    }

    function closeLightbox() {
        if (!lightbox?.classList.contains('is-open')) return;
        lightbox.classList.remove('is-open', 'is-sheet');
        lightbox.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = previousBodyOverflow;
        if (lightboxImage) lightboxImage.removeAttribute('src');
        if (lightboxOpener?.isConnected) lightboxOpener.focus();
        lightboxOpener = null;
    }

    document.querySelectorAll('[data-zoom]').forEach(figure => {
        const source = figure.querySelector('img');
        if (!source) return;
        figure.tabIndex = 0;
        figure.setAttribute('role', 'button');
        figure.setAttribute('aria-label', `Enlarge image: ${source.alt}`);
        const show = () => openLightbox(
            source.getAttribute('src'),
            source.alt,
            figure.querySelector('figcaption')?.textContent.trim() || source.alt,
            figure
        );
        figure.addEventListener('click', show);
        figure.addEventListener('keydown', event => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            show();
        });
    });

    viewEnlarge?.addEventListener('click', () => {
        const label = viewTabs[currentView]?.textContent.trim().replace(/^\d+\s*/, '') || 'Architectural view';
        openLightbox(viewImage.getAttribute('src'), viewImage.alt, label, viewEnlarge);
    });

    const jointSheetButton = document.getElementById('pf2-joint-sheet');
    jointSheetButton?.addEventListener('click', () => {
        openLightbox(
            '../assets/projects/vertical-garden/joints-diagram.png',
            'Complete diagram showing connector types A, AA, B, BB, and AB',
            'Connector types A, AA, B, BB, and AB. Scroll the sheet to inspect each row.',
            jointSheetButton,
            true
        );
    });

    lightboxClose?.addEventListener('click', closeLightbox);
    lightbox?.addEventListener('click', event => {
        if (event.target === lightbox) closeLightbox();
    });
    document.addEventListener('keydown', event => {
        if (!lightbox?.classList.contains('is-open')) return;
        if (event.key === 'Escape') {
            event.preventDefault();
            closeLightbox();
        } else if (event.key === 'Tab') {
            event.preventDefault();
            lightboxClose?.focus();
        }
    });
})();
