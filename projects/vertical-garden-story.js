const jointRows = [
    { name: 'A', viewBox: '320 374 1100 510', description: 'joins five triangular panels into a pentagon' },
    { name: 'AA', viewBox: '320 929 1100 510', description: 'extends from one face to another to connect modules' },
    { name: 'B', viewBox: '320 1484 1100 510', description: 'joins the two halves of a pentagonal bipyramid' },
    { name: 'BB', viewBox: '320 2039 1100 510', description: 'extends from the seam between two halves' },
    { name: 'AB', viewBox: '320 2594 1100 510', description: 'combines the A and B connections at a seam' }
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
    jointCrop.setAttribute('aria-label', `Plan and axonometric drawings of connector ${row.name}, which ${row.description}`);
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
