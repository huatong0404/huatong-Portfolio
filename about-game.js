(() => {
    const stage = document.getElementById('about-coloring-stage');
    const progress = document.getElementById('coloring-progress');
    const notesList = document.getElementById('coloring-notes-list');
    const notesEmpty = document.getElementById('coloring-notes-empty');
    const notesPanel = notesList?.closest('.coloring-notes');
    const fullImage = stage?.querySelector('.coloring-full');

    if (!stage || !progress || !notesList || !notesEmpty || !notesPanel || !fullImage) return;

    const explanations = {
        1: {
            title: 'Ctrl + S',
            body: 'Always remember to save your work. This art piece has been lost once due to a failure to save.'
        },
        2: {
            title: 'Board & Card Games',
            body: "I'm a TRPG enthusiast and an RWS tarot reader. The three RWS tarot cards are: The Magician, Page of Cups, and Eight of Pentacles."
        },
        3: {
            title: 'Bird Feeder',
            body: "I'm a birder. Though I've never owned a feeder of my own, I love bird watching and bird taxonomy. The four birds are (from left to right) house wren, red-winged blackbird (male), azure-winged magpie, and blue jay. The azure-winged magpie is a common bird in Nanjing, my hometown."
        },
        4: {
            title: 'Identity',
            body: "Everybody has multiple facets, but I'm an especially good fit for this description. I am interested in all kinds of activities, whether creative or research-based. I also believe in the ability to create and comprehend a world through one's own hands. This enthusiasm eventually brought me here."
        },
        5: {
            title: 'Drawing',
            body: "I'm an experienced painter and freelance artist. I have 3k followers on Xiaohongshu. I also draw in very different media, like watercolor, conté crayon, and digital art."
        },
        6: {
            title: 'The Double Diamond',
            body: 'The famous model of the HCI design process. I put it in reverse due to the arrangement of left-side and right-side elements in this drawing.'
        },
        7: {
            title: 'Blender',
            body: "Blender's famous default cube. The first thing every Blender user learns to do is delete the cube."
        },
        8: {
            title: 'Unity',
            body: 'Is this a scene or is this a game?'
        },
        9: {
            title: 'Rhinoceros',
            body: "Rhino's signature command, Sweep2. It fits a surface through a series of profile curves that define the surface shape and two rail curves that define the surface edges. My favorite command ever."
        },
        10: {
            title: 'Treefern',
            body: 'Tree ferns, especially <em>Cyathea</em>, are my favorite plant, fern, and tree. And yes, a tree fern is simultaneously a plant, a fern, but not a tree. The trunk forms from an upright stem wrapped in a dense mass of fibrous roots and old fronds. There are bunches of them in Phipps. Definitely check them out.'
        },
        11: {
            title: 'Raspberry Pi 4',
            body: 'The lowest barrier to entry with the highest return for physical computing. However, this makes it feel a lot more like digital programming. Two of the three physical computing projects on this website use Raspberry Pi instead of Arduino Uno.'
        },
        12: {
            title: "Phipps Conservatory's Plan",
            body: 'My favorite building — Victorian and green. Also, I needed something to represent my architectural background in this drawing.'
        }
    };

    const masks = window.ABOUT_COLORING_MASKS || {};
    const piecesLayer = stage.querySelector('.coloring-pieces');
    const pieces = [...stage.querySelectorAll('.coloring-piece')]
        .map((element) => {
            const number = Number(element.dataset.piece);
            const mask = masks[number];
            const piece = {
                element,
                number,
                x: Number(element.dataset.x),
                y: Number(element.dataset.y),
                width: Number(element.dataset.width),
                height: Number(element.dataset.height),
                maskWidth: mask?.width || 0,
                maskHeight: mask?.height || 0,
                bits: mask ? Uint8Array.from(atob(mask.bits), (character) => character.charCodeAt(0)) : null
            };

            element.style.left = `${(piece.x / 2388) * 100}%`;
            element.style.top = `${(piece.y / 1668) * 100}%`;
            element.style.width = `${(piece.width / 2388) * 100}%`;
            element.style.height = `${(piece.height / 1668) * 100}%`;
            element.style.zIndex = String(((13 - number) * 2) + 1);

            const bwElement = document.createElement('img');
            bwElement.className = 'coloring-piece coloring-piece-bw';
            bwElement.src = `assets/about/about%20me%20folder/pieces-bw/${number}.png`;
            bwElement.alt = '';
            bwElement.draggable = false;
            bwElement.decoding = 'async';
            bwElement.style.left = element.style.left;
            bwElement.style.top = element.style.top;
            bwElement.style.width = element.style.width;
            bwElement.style.height = element.style.height;
            bwElement.style.zIndex = String((13 - number) * 2);
            piecesLayer.appendChild(bwElement);
            piece.bwElement = bwElement;

            return piece;
        })
        .sort((a, b) => a.number - b.number);

    const sourceWidth = 2388;
    const sourceHeight = 1668;
    const maskScale = 4;
    const selected = new Set();
    let hoveredPiece = null;
    let keyboardIndex = -1;
    let ready = false;

    function updateProgress() {
        if (selected.size === pieces.length) {
            progress.textContent = 'Complete — refresh to color again';
            stage.classList.remove('is-over-piece');
            stage.setAttribute('aria-label', 'Completed full-color About Me illustration. Refresh the page to play again.');
            hoveredPiece = null;
            pieces.forEach(({ element }) => element.classList.remove('is-hovered'));

            const revealFullImage = () => stage.classList.add('is-complete');
            if (fullImage.complete && fullImage.naturalWidth) {
                revealFullImage();
            } else {
                fullImage.addEventListener('load', revealFullImage, { once: true });
                loadFullImage();
            }
            return;
        }

        progress.textContent = `${selected.size} / ${pieces.length} colored`;
    }

    function setHovered(piece) {
        if (stage.classList.contains('is-complete') || hoveredPiece === piece) return;

        if (hoveredPiece) {
            hoveredPiece.element.classList.remove('is-hovered');
            hoveredPiece.bwElement.classList.remove('is-hovered-bw');
        }
        hoveredPiece = piece;

        if (hoveredPiece) {
            hoveredPiece.element.classList.add('is-hovered');
            hoveredPiece.bwElement.classList.add('is-hovered-bw');
            keyboardIndex = pieces.indexOf(hoveredPiece);
        }

        stage.classList.toggle('is-over-piece', Boolean(hoveredPiece));
    }

    function selectPiece(piece) {
        if (!piece || selected.has(piece.number) || stage.classList.contains('is-complete')) return;

        selected.add(piece.number);
        piece.element.classList.add('is-selected');
        addExplanation(piece.number);
        setHovered(null);
        loadFullImage();
        updateProgress();
    }

    function addExplanation(number) {
        const explanation = explanations[number];
        if (!explanation) return;

        const note = document.createElement('article');
        note.className = 'coloring-note';
        note.dataset.piece = String(number);

        const title = document.createElement('h3');
        title.className = 'coloring-note-title';
        title.textContent = explanation.title;

        const body = document.createElement('p');
        body.innerHTML = explanation.body;

        note.append(title, body);
        notesList.appendChild(note);
        notesEmpty.hidden = true;

        requestAnimationFrame(() => {
            if (notesPanel.scrollHeight > notesPanel.clientHeight) {
                notesPanel.scrollTo({
                    top: notesPanel.scrollHeight,
                    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
                });
            }
        });
    }

    function loadFullImage() {
        if (!fullImage.src) fullImage.src = fullImage.dataset.src;
    }

    function pieceAt(clientX, clientY) {
        if (!ready) return null;

        const rect = stage.getBoundingClientRect();
        const x = ((clientX - rect.left) / rect.width) * sourceWidth;
        const y = ((clientY - rect.top) / rect.height) * sourceHeight;

        if (x < 0 || y < 0 || x >= sourceWidth || y >= sourceHeight) return null;

        // The smallest number is visually highest, so it also wins in overlaps.
        return pieces.find((piece) => {
            if (selected.has(piece.number)) return false;

            if (x < piece.x || y < piece.y || x >= piece.x + piece.width || y >= piece.y + piece.height) {
                return false;
            }

            const maskX = Math.min(piece.maskWidth - 1, Math.floor((x - piece.x) / maskScale));
            const maskY = Math.min(piece.maskHeight - 1, Math.floor((y - piece.y) / maskScale));
            const maskIndex = (maskY * piece.maskWidth) + maskX;
            return Boolean(piece.bits[maskIndex >> 3] & (1 << (maskIndex & 7)));
        }) || null;
    }

    stage.addEventListener('pointermove', (event) => {
        if (event.pointerType === 'touch') return;
        setHovered(pieceAt(event.clientX, event.clientY));
    });

    stage.addEventListener('pointerleave', () => setHovered(null));

    stage.addEventListener('click', (event) => {
        const piece = event.detail === 0 ? hoveredPiece : pieceAt(event.clientX, event.clientY);
        selectPiece(piece);
    });

    stage.addEventListener('keydown', (event) => {
        if (stage.classList.contains('is-complete')) return;

        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
            event.preventDefault();
            keyboardIndex = (keyboardIndex + 1) % pieces.length;
            setHovered(pieces[keyboardIndex]);
        } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
            event.preventDefault();
            keyboardIndex = (keyboardIndex - 1 + pieces.length) % pieces.length;
            setHovered(pieces[keyboardIndex]);
        } else if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            selectPiece(hoveredPiece);
        } else if (event.key === 'Escape') {
            setHovered(null);
        }
    });

    if (pieces.every((piece) => piece.bits)) {
        ready = true;
        stage.classList.add('is-ready');
        stage.setAttribute('aria-busy', 'false');
        updateProgress();
    } else {
        stage.setAttribute('aria-busy', 'false');
        progress.textContent = 'Coloring game unavailable';
    }
})();
