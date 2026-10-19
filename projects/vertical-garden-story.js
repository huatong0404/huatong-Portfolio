const gardenAsset = name => `../assets/projects/vertical-garden/${name}`;

const ruleSteps = [
    {
        image: 'matrix-forms.png',
        alt: 'Matrix comparing triangular, quadrilateral, pentagonal, and hexagonal base families',
        caption: 'Four base families sit side by side; the pentagonal studies are the third column.',
        index: '01 / 03 — the comparison',
        title: 'Four ways to begin.',
        copy: 'We compared triangular, quadrilateral, pentagonal, and hexagonal bases. The matrix kept the alternatives visible while we looked for a unit that could meet another one.',
        takeaway: 'The choice of a starting unit would shape every later connection.'
    },
    {
        image: 'diagram-system.png',
        alt: 'Growth diagram: one module is mirrored along an edge and folded to make another connection',
        caption: 'The colored faces mark the edge that lets the next module turn.',
        index: '02 / 03 — the move',
        title: 'Mirror, then fold.',
        copy: 'The diagram begins with one module. We mirror it along an edge and fold it over that edge, making a connection that can be repeated.',
        takeaway: 'A simple local move can produce a changing overall silhouette.'
    },
    {
        image: 'spatial-matrix.png',
        alt: 'Matrix of potential arrangements formed by repeating and turning the selected module',
        caption: 'The same module can extend upward or branch sideways in different configurations.',
        index: '03 / 03 — the possibilities',
        title: 'One rule, several paths.',
        copy: 'When the move repeats, the cluster can turn upward or spread sideways. This matrix records possible configurations, not a single fixed final shape.',
        takeaway: 'The rule gives the form room to respond to a place.'
    }
];

const ruleTabs = [...document.querySelectorAll('[data-rule]')];
const rulePanel = document.getElementById('rule-panel');
const ruleImage = document.getElementById('rule-image');
function showRule(index, focus = false) {
    const step = ruleSteps[index];
    ruleTabs.forEach((tab, tabIndex) => {
        const selected = tabIndex === index;
        tab.setAttribute('aria-selected', String(selected));
        tab.tabIndex = selected ? 0 : -1;
    });
    rulePanel.setAttribute('aria-labelledby', `rule-tab-${index}`);
    ruleImage.src = gardenAsset(step.image);
    ruleImage.alt = step.alt;
    document.getElementById('rule-caption').textContent = step.caption;
    document.getElementById('rule-index').textContent = step.index;
    document.getElementById('rule-title').textContent = step.title;
    document.getElementById('rule-copy').textContent = step.copy;
    document.getElementById('rule-takeaway').textContent = step.takeaway;
    ruleImage.closest('figure').querySelector('.zoom-image-button')?.setAttribute('aria-label', `Enlarge ${step.alt}`);
    if (focus) ruleTabs[index].focus();
}
ruleTabs.forEach((tab, index) => {
    tab.addEventListener('click', () => showRule(index));
    tab.addEventListener('keydown', event => {
        const key = event.key;
        if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(key)) return;
        event.preventDefault();
        const next = key === 'Home' ? 0 : key === 'End' ? ruleTabs.length - 1 :
            (index + (key === 'ArrowLeft' || key === 'ArrowUp' ? -1 : 1) + ruleTabs.length) % ruleTabs.length;
        showRule(next, true);
    });
});

const joints = [
    { code: 'A', viewBox: '95 338 1360 560', color: '#F3A98C', title: 'Five triangles become one face.', copy: 'This small clip brings five triangular pieces together around a pentagonal center.', takeaway: 'If a unit is assembled from triangles, the seams must remain repeatable too.' },
    { code: 'AA', viewBox: '95 894 1360 560', color: '#78CDA9', title: 'A face reaches the next module.', copy: 'An extra arm extends from one face toward another, joining two modules rather than only closing one.', takeaway: 'The connection crosses the boundary between units.' },
    { code: 'B', viewBox: '95 1450 1360 560', color: '#EE8DC6', title: 'Two halves become a volume.', copy: 'This curved clip joins the two halves of a bipyramid at their seam.', takeaway: 'Making one volume stable is a different task from linking volumes together.' },
    { code: 'BB', viewBox: '95 2006 1360 560', color: '#A8BDE7', title: 'The seam becomes a branch.', copy: 'This connector extends from the seam between two halves, giving that meeting another point of connection.', takeaway: 'A seam can also become the place where the structure continues.' },
    { code: 'AB', viewBox: '95 2562 1360 560', color: '#C6A6DA', title: 'Two conditions meet at once.', copy: 'This combined connector joins the A and B conditions at a more complex seam.', takeaway: 'The final assembly needs a small vocabulary of joints, not one universal clip.' }
];
const jointButtons = [...document.querySelectorAll('[data-joint]')];
const jointCrop = document.getElementById('joint-crop');
const jointDetail = document.querySelector('.joint-detail');
function showJoint(index, focus = false) {
    const joint = joints[index];
    jointButtons.forEach((button, buttonIndex) => {
        const active = buttonIndex === index;
        button.classList.toggle('active', active);
        button.setAttribute('aria-pressed', String(active));
    });
    jointCrop.setAttribute('viewBox', joint.viewBox);
    jointCrop.setAttribute('aria-label', `Close view of connector ${joint.code}: plan and axonometric drawings`);
    jointDetail.style.setProperty('--joint-color', joint.color);
    document.getElementById('joint-index').textContent = `${String(index + 1).padStart(2, '0')} / 05 — connector type`;
    document.getElementById('joint-letter').textContent = joint.code;
    document.getElementById('joint-title').textContent = joint.title;
    document.getElementById('joint-copy').textContent = joint.copy;
    document.getElementById('joint-takeaway').textContent = joint.takeaway;
    if (focus) jointButtons[index].focus();
}
jointButtons.forEach((button, index) => {
    button.addEventListener('click', () => showJoint(index));
    button.addEventListener('keydown', event => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? jointButtons.length - 1 :
            (index + (event.key === 'ArrowLeft' ? -1 : 1) + jointButtons.length) % jointButtons.length;
        showJoint(next, true);
    });
});
const jointFullButton = document.getElementById('joint-full-button');
jointFullButton.addEventListener('click', () => {
    openLightboxImage(
        new URL(gardenAsset('joints-diagram.png'), document.baseURI).href,
        'Complete Pollen Farm diagram showing five connector types and their locations',
        'Connector types A, AA, B, BB, and AB in the final system. Scroll the sheet to inspect each row.',
        jointFullButton
    );
    document.getElementById('image-lightbox').classList.add('tall-diagram');
});

const outcomeViews = {
    built: {
        image: 'campus-install-web.jpg',
        alt: 'The built plywood structure standing beside a campus lawn without plants',
        stamp: 'Built / unplanted',
        caption: 'A photograph of the actual structure placed on campus.',
        index: '01 / 02 — what we tested',
        title: 'The rule stood at full scale.',
        copy: 'The plywood parts were assembled into one configuration and placed beside the lawn. Here we could inspect its turning profile and visible joints at the scale of a person.',
        inset: 'actual-model-web.jpg',
        insetAlt: 'Close view of the unplanted plywood model and its exposed connectors',
        insetCopy: 'Look closer: the slots and small connectors remain visible.'
    },
    proposal: {
        image: 'render-context-2-web.jpg',
        alt: 'Composite proposal showing several planted Pollen Farm structures near a greenhouse with people and pollinators',
        stamp: 'Illustrated proposal',
        caption: 'A composite scene imagines planted modules near a greenhouse; it is not a photograph of a planted installation.',
        index: '02 / 02 — what we imagined',
        title: 'Could the pockets host life?',
        copy: 'In the proposal, modules spread across a lawn and hold flowering plants. People and pollinators enter the scene. The image expresses a hope for the system, not an ecological result we measured.',
        inset: 'final-front.png',
        insetAlt: 'Proposed front elevation with flowers, pollinators, and a person for scale',
        insetCopy: 'The front elevation places flowers in the open pockets and a person beside the form for scale.'
    }
};
const outcomeButtons = [...document.querySelectorAll('[data-outcome]')];
function showOutcome(key, focus = false) {
    const view = outcomeViews[key];
    outcomeButtons.forEach(button => {
        const active = button.dataset.outcome === key;
        button.classList.toggle('active', active);
        button.setAttribute('aria-pressed', String(active));
    });
    const image = document.getElementById('outcome-image');
    image.src = gardenAsset(view.image);
    image.alt = view.alt;
    image.closest('figure').querySelector('.zoom-image-button')?.setAttribute('aria-label', `Enlarge ${view.alt}`);
    document.getElementById('outcome-stamp').textContent = view.stamp;
    document.getElementById('outcome-caption').textContent = view.caption;
    document.getElementById('outcome-index').textContent = view.index;
    document.getElementById('outcome-title').textContent = view.title;
    document.getElementById('outcome-copy').textContent = view.copy;
    const inset = document.getElementById('outcome-inset-image');
    inset.src = gardenAsset(view.inset);
    inset.alt = view.insetAlt;
    document.getElementById('outcome-inset-zoom').setAttribute('aria-label', `Enlarge ${view.insetAlt}`);
    document.getElementById('outcome-inset-copy').textContent = view.insetCopy;
    if (focus) outcomeButtons.find(button => button.dataset.outcome === key).focus();
}
outcomeButtons.forEach((button, index) => {
    button.addEventListener('click', () => showOutcome(button.dataset.outcome));
    button.addEventListener('keydown', event => {
        if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
        event.preventDefault();
        const next = outcomeButtons[(index + 1) % outcomeButtons.length];
        showOutcome(next.dataset.outcome, true);
    });
});
const outcomeInsetZoom = document.getElementById('outcome-inset-zoom');
outcomeInsetZoom.addEventListener('click', () => {
    const image = document.getElementById('outcome-inset-image');
    openLightboxImage(image.src, image.alt, document.getElementById('outcome-inset-copy').textContent, outcomeInsetZoom);
});
