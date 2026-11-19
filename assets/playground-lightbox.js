(() => {
    const gallery = document.querySelector('.playground-montage');
    const lightbox = document.querySelector('.playground-lightbox');
    if (!gallery || !lightbox || typeof lightbox.showModal !== 'function') return;

    const enlargedImage = lightbox.querySelector('img');
    const closeButton = lightbox.querySelector('.playground-lightbox-close');
    let opener = null;
    let previousOverflow = '';

    function closeLightbox() {
        if (lightbox.open) lightbox.close();
    }

    gallery.addEventListener('click', (event) => {
        const button = event.target.closest('.montage-open');
        if (!button || !gallery.contains(button)) return;

        const thumbnail = button.querySelector('img');
        if (!thumbnail) return;

        opener = button;
        enlargedImage.src = thumbnail.currentSrc || thumbnail.src;
        enlargedImage.alt = thumbnail.alt;
        previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        lightbox.showModal();
        closeButton.focus();
    });

    lightbox.addEventListener('click', (event) => {
        if (event.target === lightbox) closeLightbox();
    });
    closeButton.addEventListener('click', closeLightbox);

    lightbox.addEventListener('close', () => {
        document.body.style.overflow = previousOverflow;
        enlargedImage.removeAttribute('src');
        enlargedImage.alt = '';
        opener?.focus({ preventScroll: true });
        opener = null;
    });
})();
