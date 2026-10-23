const jointRows = [
    { name: 'A', viewBox: '95 338 1360 560' },
    { name: 'AA', viewBox: '95 894 1360 560' },
    { name: 'B', viewBox: '95 1450 1360 560' },
    { name: 'BB', viewBox: '95 2006 1360 560' },
    { name: 'AB', viewBox: '95 2562 1360 560' }
];
const jointButtons = [...document.querySelectorAll('[data-joint]')];
const jointCrop = document.getElementById('joint-crop');
function selectJoint(index, focus = false) {
    const row = jointRows[index];
    jointButtons.forEach((button, buttonIndex) => {
        const active = buttonIndex === index;
        button.classList.toggle('active', active);
        button.setAttribute('aria-pressed', String(active));
    });
    jointCrop.setAttribute('viewBox', row.viewBox);
    jointCrop.setAttribute('aria-label', `Close view of connector ${row.name} from the final drawing`);
    if (focus) jointButtons[index].focus();
}
jointButtons.forEach((button, index) => {
    button.addEventListener('click', () => selectJoint(index));
    button.addEventListener('keydown', event => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? jointButtons.length - 1 :
            (index + (event.key === 'ArrowLeft' ? -1 : 1) + jointButtons.length) % jointButtons.length;
        selectJoint(next, true);
    });
});
const jointFullButton = document.getElementById('joint-full-button');
jointFullButton.addEventListener('click', () => {
    openLightboxImage(
        new URL('../assets/projects/vertical-garden/joints-diagram.png', document.baseURI).href,
        'Complete diagram showing connector types A, AA, B, BB, and AB',
        'Connector types A, AA, B, BB, and AB. Scroll the sheet to inspect each row.',
        jointFullButton
    );
    document.getElementById('image-lightbox').classList.add('tall-diagram');
});
