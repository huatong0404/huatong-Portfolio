(() => {
    'use strict';

    const TILES = window.TRACE_MAP || [];
    const TILE_BY_ID = new Map(TILES.map(tile => [tile.id, tile]));
    const CATEGORIES = {
        community: { label: 'Community', color: '#58c56e' },
        expression: { label: 'Expression', color: '#6774db' },
        justice: { label: 'Justice', color: '#ec0c91' },
        resources: { label: 'Resources', color: '#f6ae20' }
    };
    const ADDRESS_NAMES = [null, 'Allegheny Center', 'Allegheny Tower', 'Auto Repair by Lueliee', 'Birmingham Bookstore', 'Carlow University', 'Carnegie Mellon University', 'Carnegie Museum of Art', 'Downtown Cluster', 'House of Tilden', 'KNOW, Inc. Press', 'Martial Art Karate', 'Mattress Factory', 'Norreh', 'Mt Washington Park', 'Pittsburgh Feminist Network', 'Pennsylvania N.O.W.', 'Shawn’s', 'The Tender Trap', 'Presbyterian University Hospital', 'Wildsisters'];
    const ADDRESS_EFFECTS = [null, '+2 to your next roll.', 'Block one negative event.', 'Double your next roll.', 'Next round, return to the last event space you passed.', 'Turn an ordinary hex into a Justice event space.', 'Turn an ordinary hex into a Justice event space.', 'Teleport to any Expression event space.', 'Split your next roll into two moves.', 'Teleport to any Community event space.', 'Draw one additional Expression event.', 'Double your next roll.', 'Teleport to any Expression event space.', 'Turn an ordinary hex into a Resources event space.', 'Nothing happens. Keep exploring.', 'Teleport to any hex you have previously reached.', 'Draw one additional Justice event.', 'Turn an ordinary hex into a Justice event space.', 'Turn an ordinary hex into an Expression event space.', 'Block one negative event.', 'Draw one additional Expression event.'];
    const PERSON_NAMES = [null, 'Ann Begler', 'Brenda Strong Frazier', 'Doreen Boyce', 'Florance Dowling', 'Jo Ann Evansgardner', 'Kelly Christian', 'Le Vera Browne', 'Mary Donegan', 'Rosanna Lane', 'Sue Burdick', 'Sweet Honey in the Rock'];
    const PERSON_EFFECTS = [null, 'Once in the game, cancel a negative event.', 'When your die result is above 3, share some movement points with a teammate.', 'Three times, teleport to the nearest Resources event space.', 'Teleport to Birmingham Bookstore whenever you choose.', 'When you roll below 3, you may roll once more.', 'Once, draw an extra Expression event.', 'Travel between Community event spaces without drawing a card.', 'Teleport to Wildsisters whenever you choose.', 'Add 1 to rolls below 3.', 'With their agreement, cancel a teammate’s negative event up to three times.', 'Travel between Expression event spaces.'];
    const EVENTS = {
        community: [
            ['Charity', 'Divide 4 extra movement points among teammates for the next round. In solo play, this effect has no target.'],
            ['International', 'Give one teammate 2 extra movement points in the next round. In solo play, this effect has no target.'],
            ['Queer Activism', 'Let one teammate split their movement into two moves in the next round. In solo play, this effect has no target.'],
            ['Security Issue', 'You cannot move next round.']
        ],
        expression: [
            ['Club Night', 'Teleport to the nearest Expression event space around a teammate. In solo play, this effect has no target.'],
            ['Art Exhibition', 'Go to the last numbered place a teammate visited. With no teammate, go to the nearest numbered place.'],
            ['Reading Group', 'Split your next roll into two moves.'],
            ['Rejection', 'Your next movement is reduced by half.']
        ],
        justice: [
            ['Protest', 'Turn an ordinary hex into a Justice event space.'],
            ['New Law', 'Block the next negative event.'],
            ['Unjustice', 'A second die chooses your direction next round.'],
            ['Vote', 'Add 1 step to your next roll.']
        ],
        resources: [
            ['New Business', 'Roll twice for your next movement.'],
            ['Investment', 'Add 2 steps to your next roll. This card’s effect works only once per journey.'],
            ['Property Transition', 'Switch places with a teammate. In solo play, this has no target.'],
            ['Salary Decrease', 'The next special space you reach will not give you a card.']
        ]
    };
    const NEGATIVE_EVENTS = new Set(['community-4', 'expression-4', 'justice-3', 'resources-4']);
    const SVG_NS = 'http://www.w3.org/2000/svg';
    const DIE_FACES = ['·', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    const PLAYER_COLORS = ['#f6ae20', '#40c1ac', '#ec0c91', '#6774db'];
    const EL = id => document.getElementById(id);
    const dom = {
        boardWindow: EL('boardWindow'), boardTransform: EL('boardTransform'), boardGrid: EL('boardGrid'), boardInstruction: EL('boardInstruction'),
        controlIndex: EL('controlIndex'), controlTitle: EL('controlTitle'), controlHint: EL('controlHint'), roundLabel: EL('roundLabel'),
        rollButton: EL('rollButton'), die: EL('die'), dieFace: EL('dieFace'), dieBonus: EL('dieBonus'), movementChoice: EL('movementChoice'), firstLeg: EL('firstLeg'), firstLegOutput: EL('firstLegOutput'),
        addressCount: EL('addressCount'), peopleCount: EL('peopleCount'), eventCount: EL('eventCount'), archiveTotal: EL('archiveTotal'),
        effectCount: EL('effectCount'), effectList: EL('effectList'), cardCollection: EL('cardCollection'), archiveFilter: EL('archiveFilter'),
        modalBackdrop: EL('modalBackdrop'), modalContents: EL('modalContents'), modalClose: EL('modalClose'), modalCard: EL('modalCard'),
        toastStack: EL('toastStack'), choiceBar: EL('choiceBar'), choiceTitle: EL('choiceTitle'), choiceHint: EL('choiceHint'), choiceCancel: EL('choiceCancel')
    };

    const emptyNext = () => ({ bonus: 0, double: false, half: false, twoDice: false, split: false, skip: false, forcedDirection: false, returnToEvent: false });
    const newPlayer = () => ({ position: null, round: 0, visited: [], addresses: [], people: [], eventCounts: {}, cardOrder: [], next: emptyNext(), pendingGrants: [], shields: 0, shieldFromAnn: false, lastEventSpot: null, lastAddressSpot: null, ignoreNextSpecial: 0, investmentUsed: false, abilityUses: { 3: 3, 6: 1, 10: 3 } });
    const PLAYER_FIELDS = Object.keys(newPlayer());
    function newState() {
        const game = { playerCount: 0, activePlayer: 0, cycle: 1, players: [newPlayer()], claimedAddresses: [], drawnPeople: [], modified: {}, soundMuted: false };
        for (const field of PLAYER_FIELDS) Object.defineProperty(game, field, {
            get() { return game.players[game.activePlayer]?.[field]; },
            set(value) { if (game.players[game.activePlayer]) game.players[game.activePlayer][field] = value; }
        });
        return game;
    }
    let state = newState();
    let mode = 'setup';
    let pendingRoll = null;
    let rollingBonus = 0;
    let pendingChoice = null;
    let archiveFilter = 'all';
    let routePoints = [];
    let chainDepth = 0;
    let audioContext = null;
    let modalAction = null;
    let lastFocus = null;
    let view = { scale: 1, x: 0, y: 0, fitted: false };
    const polygons = new Map();
    const player = index => state.players[index];
    const teammateIndices = () => state.players.map((_, index) => index).filter(index => index !== state.activePlayer);
    const playerLabel = index => `Player ${index + 1}`;

    function randomInt(max) {
        if (window.crypto?.getRandomValues) { const numbers = new Uint32Array(1); crypto.getRandomValues(numbers); return numbers[0] % max; }
        return Math.floor(Math.random() * max);
    }
    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
    const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
    function pointyHex(tile, radius = 52) {
        const x = tile.x, y = tile.y, h = radius * .866;
        return `${x - radius / 2},${y - h} ${x + radius / 2},${y - h} ${x + radius},${y} ${x + radius / 2},${y + h} ${x - radius / 2},${y + h} ${x - radius},${y}`;
    }
    function svg(tag, attrs) { const element = document.createElementNS(SVG_NS, tag); for (const [key, value] of Object.entries(attrs)) element.setAttribute(key, value); return element; }
    function effectiveKind(tile) { return state.modified[tile.id] || tile.kind; }
    function adjacent(tile, dir) {
        const c = tile.c, r = tile.r;
        const offsets = c % 2 === 0 ? [[0,-1],[1,-1],[1,0],[0,1],[-1,0],[-1,-1]] : [[0,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0]];
        const [dc, dr] = offsets[dir];
        return TILE_BY_ID.get(`${c + dc}-${r + dr}`) || null;
    }
    function directionTo(from, to) { for (let i = 0; i < 6; i++) if (adjacent(from, i)?.id === to.id) return i; return -1; }
    function eventTile(tile) { return Object.hasOwn(CATEGORIES, effectiveKind(tile)); }
    function addressTile(number) { return TILES.find(tile => tile.address === number) || null; }
    function nearestTile(targets, from) {
        if (!targets.length) return null;
        const want = new Set(targets.map(tile => tile.id)), queue = [from], seen = new Set([from.id]);
        for (const current of queue) {
            if (want.has(current.id)) return current;
            for (let direction = 0; direction < 6; direction++) {
                const next = adjacent(current, direction);
                if (next && !seen.has(next.id)) { seen.add(next.id); queue.push(next); }
            }
        }
        return targets[0];
    }
    function setPosition(tile) {
        setPositionFor(state.activePlayer, tile);
    }
    function setPositionFor(index, tile) {
        const recipient = player(index);
        recipient.position = tile.id;
        if (!recipient.visited.includes(tile.id)) recipient.visited.push(tile.id);
        if (eventTile(tile)) recipient.lastEventSpot = tile.id;
        if (tile.address) recipient.lastAddressSpot = tile.id;
        renderMap();
    }

    function makeMap() {
        dom.boardGrid.innerHTML = '';
        for (const tile of TILES) {
            const polygon = svg('polygon', { points: pointyHex(tile), class: 'hex-hit', 'data-id': tile.id, tabindex: '0', role: 'button' });
            polygon.setAttribute('aria-label', tile.address ? `Address ${tile.address}: ${ADDRESS_NAMES[tile.address]}` : `${effectiveKind(tile)} hexagon`);
            polygon.addEventListener('click', event => { event.stopPropagation(); handleTileClick(tile); });
            polygon.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); handleTileClick(tile); } });
            dom.boardGrid.appendChild(polygon);
            polygons.set(tile.id, polygon);
        }
        renderMap();
    }
    function renderMap() {
        const activeColor = PLAYER_COLORS[state.activePlayer] || PLAYER_COLORS[0];
        dom.boardGrid.style.setProperty('--player-color', activeColor);
        dom.die.style.setProperty('--player-color', activeColor);
        const current = state.position ? TILE_BY_ID.get(state.position) : null;
        const moveTargets = new Set();
        if (mode === 'move' && current) for (let direction = 0; direction < 6; direction++) { const tile = adjacent(current, direction); if (tile) moveTargets.add(tile.id); }
        const choiceTargets = new Set(pendingChoice?.targets.map(tile => tile.id) || []);
        for (const tile of TILES) {
            const polygon = polygons.get(tile.id); if (!polygon) continue;
            polygon.classList.toggle('is-startable', mode === 'start');
            polygon.classList.toggle('is-target', moveTargets.has(tile.id));
            polygon.classList.toggle('is-choice', choiceTargets.has(tile.id));
            polygon.classList.toggle('is-current', state.position === tile.id);
            polygon.classList.toggle('is-collected', Boolean(tile.address && state.claimedAddresses.includes(tile.address)));
            polygon.classList.toggle('is-modified', Boolean(state.modified[tile.id]));
            polygon.setAttribute('aria-disabled', mode === 'start' || moveTargets.has(tile.id) || choiceTargets.has(tile.id) ? 'false' : 'true');
        }
        dom.boardGrid.querySelectorAll('.route-line,.player-marker,.modified-tint').forEach(element => element.remove());
        for (const [id, kind] of Object.entries(state.modified)) {
            const tile = TILE_BY_ID.get(id); if (!tile) continue;
            const tint = svg('polygon', { points: pointyHex(tile, 46), class: 'modified-tint', fill: CATEGORIES[kind]?.color || '#fff', opacity: '.40' });
            tint.style.pointerEvents = 'none'; dom.boardGrid.insertBefore(tint, dom.boardGrid.firstChild);
        }
        if (routePoints.length > 1) {
            const line = svg('polyline', { points: routePoints.map(tile => `${tile.x},${tile.y}`).join(' '), class: 'route-line', style: `--player-color:${activeColor}` });
            dom.boardGrid.appendChild(line);
        }
        state.players.forEach((entry, index) => {
            const tile = TILE_BY_ID.get(entry.position);
            if (!tile) return;
            const peers = state.players.map((other, peerIndex) => other.position === entry.position ? peerIndex : -1).filter(peerIndex => peerIndex >= 0);
            const offset = (peers.indexOf(index) - (peers.length - 1) / 2) * 25;
            const marker = svg('g', { class: `player-marker ${index === state.activePlayer ? 'is-active' : ''}`, transform: `translate(${tile.x + offset} ${tile.y})`, style: `--player-color:${PLAYER_COLORS[index]}` });
            marker.append(svg('circle', { class: 'pulse', r: '20' }), svg('circle', { class: 'outer', r: '20' }), svg('circle', { class: 'inner', r: '13' }), svg('text', { class: 'player-number', y: '1' }));
            marker.querySelector('.player-number').textContent = String(index + 1);
            dom.boardGrid.appendChild(marker);
        });
    }

    function renderControls() {
        dom.roundLabel.textContent = `ROUND ${String(state.playerCount ? state.cycle : 0).padStart(2, '0')}`;
        dom.rollButton.disabled = mode !== 'ready';
        const queuedBonus = state.pendingGrants.filter(grant => grant.kind === 'bonus' && grant.availableCycle <= state.cycle).reduce((total, grant) => total + grant.amount, 0);
        const bonus = mode === 'ready' ? state.next.bonus + queuedBonus : mode === 'rolling' ? rollingBonus : mode === 'move' ? pendingRoll?.bonus || 0 : 0;
        dom.dieBonus.hidden = bonus <= 0;
        dom.dieBonus.textContent = `+${bonus}`;
        dom.die.setAttribute('aria-label', bonus > 0 ? `Six-sided die with ${bonus} bonus ${bonus === 1 ? 'point' : 'points'}` : 'Six-sided die');
        dom.movementChoice.hidden = !(mode === 'move' && pendingRoll?.split && pendingRoll.leg === 1);
        if (!dom.movementChoice.hidden) {
            dom.firstLeg.max = String(Math.max(1, pendingRoll.remaining - 1));
            dom.firstLeg.value = String(Math.min(Number(dom.firstLeg.value), Number(dom.firstLeg.max)));
            dom.firstLegOutput.textContent = dom.firstLeg.value;
        }
        let index = `${playerLabel(state.activePlayer).toUpperCase()} / START`, title = `${playerLabel(state.activePlayer)}, choose a starting hexagon`, hint = 'Select any hexagon on the map.', instruction = `${playerLabel(state.activePlayer)}: choose any illuminated hexagon to begin.`;
        if (mode === 'setup') { index = 'TRACE / SETUP'; title = 'Choose the number of players'; hint = 'One to four people can explore together.'; instruction = 'Choose a player count to begin.'; }
        if (mode === 'ready') { index = `${playerLabel(state.activePlayer).toUpperCase()} / MOVE`; title = 'Roll into the city'; hint = 'Choose one direction after the die lands.'; instruction = `${playerLabel(state.activePlayer)}: roll the die, then choose a highlighted neighboring hexagon.`; }
        if (mode === 'rolling') { index = 'D6 / ROLLING'; title = 'The die is in motion'; hint = 'Your next route is about to appear.'; instruction = 'Rolling…'; }
        if (mode === 'move') { index = pendingRoll?.split ? `MOVE / ${pendingRoll.leg} OF 2` : 'MOVE / CHOOSE'; title = `${pendingRoll.remaining} ${pendingRoll.remaining === 1 ? 'step' : 'steps'} to travel`; hint = pendingRoll?.split && pendingRoll.leg === 1 ? 'Choose the first move length, then pick a highlighted direction.' : 'Choose one highlighted adjacent hexagon to set your direction.'; instruction = 'Select a highlighted neighbor. Your piece will follow that direction.'; }
        if (mode === 'choice') { index = 'CARD / EFFECT'; title = 'Choose a destination'; hint = 'Highlighted hexagons can receive this card’s effect.'; instruction = 'Choose one highlighted hexagon.'; }
        if (mode === 'busy') { index = 'TRACE / DISCOVERY'; title = 'Follow the trace'; hint = 'Read the card to see what changes.'; instruction = 'A new trace has entered the map.'; }
        dom.controlIndex.textContent = index; dom.controlTitle.textContent = title; dom.controlHint.textContent = hint; dom.boardInstruction.textContent = instruction;
        const strip = EL('playerStrip');
        if (strip) { strip.hidden = !state.playerCount; strip.innerHTML = state.playerCount ? state.players.map((entry, index) => `<span class="player-seat ${index === state.activePlayer ? 'is-active' : ''}" style="--player-color:${PLAYER_COLORS[index]}" aria-current="${index === state.activePlayer ? 'true' : 'false'}"><i class="player-seat-dot"></i><span class="player-seat-copy"><b class="player-seat-name">${playerLabel(index)}</b><small class="player-seat-state">${entry.position ? `${entry.addresses.length + entry.people.length} cards` : 'choose start'}</small></span></span>`).join('') : ''; }
        const archivePlayerLabel = EL('archivePlayerLabel');
        if (archivePlayerLabel) archivePlayerLabel.textContent = state.playerCount ? `${playerLabel(state.activePlayer).toUpperCase()} / FIELD NOTES` : 'YOUR FIELD NOTES';
    }
    function renderArchive() {
        const globalEvents = state.players.reduce((total, entry) => total + Object.values(entry.eventCounts).reduce((sum, count) => sum + count, 0), 0);
        const globalVisited = new Set(state.players.flatMap(entry => entry.visited)).size;
        EL('globalAddressCount').innerHTML = `${String(state.claimedAddresses.length).padStart(2, '0')}<span>/20</span>`;
        EL('globalPeopleCount').innerHTML = `${String(state.drawnPeople.length).padStart(2, '0')}<span>/11</span>`;
        EL('globalVisitedCount').textContent = String(globalVisited).padStart(2, '0');
        EL('globalEventCount').textContent = String(globalEvents).padStart(2, '0');
        EL('globalCardCount').textContent = String(state.claimedAddresses.length + state.drawnPeople.length + globalEvents).padStart(2, '0');
        const eventTotal = Object.values(state.eventCounts).reduce((sum, count) => sum + count, 0);
        dom.addressCount.innerHTML = `${String(state.addresses.length).padStart(2, '0')}<span>/20</span>`;
        dom.peopleCount.innerHTML = `${String(state.people.length).padStart(2, '0')}<span>/11</span>`;
        dom.eventCount.textContent = String(eventTotal).padStart(2, '0');
        dom.archiveTotal.textContent = String(state.addresses.length + state.people.length + eventTotal).padStart(2, '0');
        const effects = [];
        const next = state.next;
        if (next.bonus) effects.push([`NEXT ROLL +${next.bonus}`]);
        if (next.double) effects.push(['NEXT ROLL ×2']);
        if (next.half) effects.push(['NEXT ROLL ÷2']);
        if (next.twoDice) effects.push(['ROLL TWO DICE']);
        if (next.split) effects.push(['SPLIT NEXT MOVE']);
        if (next.skip) effects.push(['SKIP NEXT MOVE']);
        if (next.forcedDirection) effects.push(['DIE CHOOSES DIRECTION']);
        if (next.returnToEvent) effects.push(['RETURN TO LAST EVENT']);
        if (state.ignoreNextSpecial) effects.push(['NEXT SPECIAL: NO CARD']);
        if (state.shields) effects.push([`NEGATIVE EVENT SHIELD ×${state.shields}`]);
        for (const grant of state.pendingGrants) effects.push([`${grant.kind === 'bonus' ? `TEAM STEPS +${grant.amount}` : 'TEAM SPLIT MOVE'} / ROUND ${String(grant.availableCycle).padStart(2, '0')}`]);
        if (state.people.includes(3) && state.abilityUses[3] > 0) effects.push([`DOREEN: RESOURCE WARP ×${state.abilityUses[3]}`, 3]);
        if (state.people.includes(4)) effects.push(['FLORANCE: BOOKSTORE WARP', 4]);
        if (state.people.includes(6) && state.abilityUses[6] > 0) effects.push(['KELLY: EXTRA EXPRESSION', 6]);
        if (state.people.includes(7)) effects.push(['LE VERA: COMMUNITY TRAVEL', 7]);
        if (state.people.includes(8)) effects.push(['MARY: WILDSISTERS WARP', 8]);
        if (state.people.includes(11)) effects.push(['SWEET HONEY: EXPRESSION TRAVEL', 11]);
        if (state.people.includes(5)) effects.push(['JO ANN: REROLL LOW DICE']);
        if (state.people.includes(9)) effects.push(['ROSANNA: LOW ROLL +1']);
        if (state.people.includes(2)) effects.push(['BRENDA: SHARE HIGH ROLLS']);
        if (state.people.includes(10) && state.abilityUses[10] > 0) effects.push([`SUE: PROTECT TEAMMATE ×${state.abilityUses[10]}`]);
        dom.effectCount.textContent = String(effects.length);
        dom.effectList.innerHTML = effects.length ? effects.map(([label, ability]) => ability ? `<button class="effect-chip ability" type="button" data-ability="${ability}" title="Use this connection">${label} ↗</button>` : `<span class="effect-chip">${label}</span>`).join('') : '<p class="empty-note">The cards you meet will change what happens next.</p>';
        dom.effectList.querySelectorAll('[data-ability]').forEach(button => button.addEventListener('click', () => useAbility(Number(button.dataset.ability))));
        const unique = [...new Set(state.cardOrder)].reverse();
        const visible = unique.filter(key => archiveFilter === 'all' || key.startsWith(archiveFilter + ':'));
        dom.cardCollection.innerHTML = visible.length ? visible.map(key => {
            const card = cardFromKey(key), count = card.type === 'event' ? state.eventCounts[`${card.category}-${card.number}`] : 1;
            return `<button type="button" class="card-thumb ${card.type}" data-card="${key}" aria-label="View ${card.name}"><img src="${card.image}" loading="lazy" alt=""><span class="count">${count}</span></button>`;
        }).join('') : '<p class="empty-note">Your discoveries will gather here.</p>';
        dom.cardCollection.querySelectorAll('[data-card]').forEach(button => button.addEventListener('click', () => showCard(cardFromKey(button.dataset.card), true, () => {})));
    }
    function render() { renderMap(); renderControls(); renderArchive(); }

    function cardFromKey(key) {
        const [type, value] = key.split(':');
        if (type === 'address') { const number = Number(value); return { type, number, name: ADDRESS_NAMES[number], effect: ADDRESS_EFFECTS[number], image: `../assets/projects/trace/cards-png/locations/spot-${String(number).padStart(2, '0')}-front.png`, key }; }
        if (type === 'person') { const number = Number(value); return { type, number, name: PERSON_NAMES[number], effect: PERSON_EFFECTS[number], image: `../assets/projects/trace/cards-png/people/connection-${String(number).padStart(2, '0')}-front.png`, key }; }
        const [category, numberText] = value.split('-'), number = Number(numberText);
        return { type: 'event', category, number, name: EVENTS[category][number - 1][0], effect: EVENTS[category][number - 1][1], image: `../assets/projects/trace/cards-png/events/${category}-${String(number).padStart(2, '0')}-front.png`, key };
    }
    function recordCard(card) {
        if (card.type === 'address' && !state.addresses.includes(card.number)) { state.addresses.push(card.number); state.claimedAddresses.push(card.number); }
        if (card.type === 'person' && !state.people.includes(card.number)) { state.people.push(card.number); state.drawnPeople.push(card.number); }
        if (card.type === 'event') {
            const id = `${card.category}-${card.number}`;
            state.eventCounts[id] = (state.eventCounts[id] || 0) + 1;
        }
        state.cardOrder.push(card.key); render();
    }
    function toast(message, tone = '') {
        const item = document.createElement('div'); item.className = `toast ${tone}`; item.textContent = message;
        dom.toastStack.prepend(item);
        setTimeout(() => { item.style.opacity = '0'; item.style.transform = 'translateX(-12px)'; setTimeout(() => item.remove(), 220); }, 4200);
        if (dom.toastStack.children.length > 4) dom.toastStack.lastElementChild.remove();
    }
    function sound(frequency = 150, duration = .08) {
        if (state.soundMuted) return;
        try {
            audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator(), gain = audioContext.createGain(), now = audioContext.currentTime;
            oscillator.type = 'triangle'; oscillator.frequency.setValueAtTime(frequency, now); oscillator.frequency.exponentialRampToValueAtTime(Math.max(45, frequency * .45), now + duration);
            gain.gain.setValueAtTime(.0001, now); gain.gain.exponentialRampToValueAtTime(.045, now + .01); gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
            oscillator.connect(gain).connect(audioContext.destination); oscillator.start(now); oscillator.stop(now + duration + .01);
        } catch { /* Audio is optional. */ }
    }
    function hideModal() { dom.modalBackdrop.hidden = true; dom.modalClose.hidden = false; dom.modalCard.classList.remove('is-enlarged'); dom.modalContents.innerHTML = ''; modalAction = null; if (lastFocus?.isConnected) lastFocus.focus(); }
    function showCard(card, viewOnly, done) {
        lastFocus = document.activeElement;
        const typeLabel = card.type === 'event' ? `${CATEGORIES[card.category].label} event` : card.type === 'address' ? `Address ${String(card.number).padStart(2, '0')}` : 'Connection';
        dom.modalContents.innerHTML = `<div class="card-reveal"><div class="reveal-visual"><img src="${card.image}" alt="${card.name} card"><button class="expand-card" id="expandCard" type="button" aria-pressed="false">ENLARGE CARD ↗</button></div><div class="reveal-copy"><span class="reveal-type">${viewOnly ? 'FROM YOUR COLLECTION / ' : 'NEW TRACE / '}${typeLabel}</span><h2 id="modalTitle">${card.name}</h2><p>${card.type === 'address' ? 'A place in the city. The original card carries its history alongside an action you can take in the game.' : card.type === 'person' ? 'A person or collective enters your network. Their contribution can change how you travel.' : 'An event can redirect the journey, open a connection, or interrupt a plan.'}</p><div class="reveal-effect"><small>${viewOnly ? 'CARD EFFECT' : 'WHAT CHANGES'}</small><strong>${card.effect}</strong></div><button class="modal-action" id="modalActionButton" type="button">${viewOnly ? 'BACK TO THE MAP' : 'CONTINUE EXPLORING'}</button></div></div>`;
        dom.modalBackdrop.hidden = false; dom.modalCard.scrollTop = 0;
        modalAction = () => { hideModal(); if (viewOnly) done(); else applyCard(card, done); };
        EL('modalActionButton').addEventListener('click', () => modalAction?.());
        EL('expandCard').addEventListener('click', () => { const enlarged = dom.modalCard.classList.toggle('is-enlarged'); EL('expandCard').textContent = enlarged ? 'SHOW CARD DETAILS ↙' : 'ENLARGE CARD ↗'; EL('expandCard').setAttribute('aria-pressed', String(enlarged)); dom.modalCard.scrollTop = 0; });
        dom.modalClose.focus();
        sound(card.type === 'event' ? 330 : 440, .17);
    }
    function showDecision(title, body, options, onSelect) {
        lastFocus = document.activeElement;
        dom.modalContents.innerHTML = `<div class="plain-modal"><span class="reveal-type">TRACE / DECISION</span><h2 id="modalTitle">${title}</h2><p>${body}</p><div class="modal-actions">${options.map((option, index) => `<button type="button" class="${index ? 'secondary-action' : 'modal-action'}" data-decision="${index}">${option}</button>`).join('')}</div></div>`;
        dom.modalBackdrop.hidden = false;
        modalAction = () => { hideModal(); onSelect(options.length - 1); };
        dom.modalContents.querySelectorAll('[data-decision]').forEach(button => button.addEventListener('click', () => { const index = Number(button.dataset.decision); hideModal(); onSelect(index); }));
        dom.modalClose.focus();
    }
    function chooseTeammate(title, body, callback, eligible = teammateIndices(), required = true) {
        if (!eligible.length) { toast('There is no teammate for this card.'); callback(null); return; }
        if (eligible.length === 1) { callback(eligible[0]); return; }
        lastFocus = document.activeElement;
        dom.modalContents.innerHTML = `<div class="plain-modal"><span class="reveal-type">TRACE / TEAM CHOICE</span><h2 id="modalTitle">${title}</h2><p>${body}</p><div class="teammate-options">${eligible.map(index => `<button type="button" data-teammate="${index}" style="--player-color:${['#f6ae20','#40c1ac','#ec0c91','#6774db'][index]}">${playerLabel(index)}</button>`).join('')}</div>${required ? '' : '<button type="button" class="secondary-action" id="teamSkip">KEEP EXPLORING</button>'}</div>`;
        dom.modalBackdrop.hidden = false;
        dom.modalClose.hidden = required;
        modalAction = required ? () => dom.modalContents.querySelector('[data-teammate]')?.focus() : () => { hideModal(); callback(null); };
        dom.modalContents.querySelectorAll('[data-teammate]').forEach(button => button.addEventListener('click', () => { const index = Number(button.dataset.teammate); hideModal(); callback(index); }));
        if (!required) EL('teamSkip').addEventListener('click', () => { hideModal(); callback(null); });
        dom.modalContents.querySelector('[data-teammate]')?.focus();
    }
    function queueTeamGrant(index, kind, amount = 1) {
        player(index).pendingGrants.push({ kind, amount, availableCycle: state.cycle + 1 });
        render();
    }
    function allocateTeamSteps(done) {
        const teammates = teammateIndices();
        if (!teammates.length) { toast('Charity has no teammate to receive steps.'); done(); return; }
        if (teammates.length === 1) { queueTeamGrant(teammates[0], 'bonus', 4); toast(`${playerLabel(teammates[0])} receives 4 steps next round.`, 'positive'); done(); return; }
        lastFocus = document.activeElement;
        dom.modalContents.innerHTML = `<div class="plain-modal"><span class="reveal-type">COMMUNITY / CHARITY</span><h2 id="modalTitle">Share four steps</h2><p>Divide 4 extra steps among your teammates. The steps will be added to their next rolls.</p><div class="team-allocation">${teammates.map((index, order) => `<div class="allocation-row"><label for="teamSteps${index}">${playerLabel(index)}</label><input id="teamSteps${index}" type="number" min="0" max="4" step="1" value="${order ? 0 : 4}"></div>`).join('')}</div><p id="allocationFeedback" aria-live="polite">4 of 4 steps assigned.</p><button id="allocationConfirm" class="modal-action" type="button">SHARE STEPS</button></div>`;
        dom.modalBackdrop.hidden = false;
        dom.modalClose.hidden = true;
        modalAction = () => EL('allocationConfirm').focus();
        const inputs = teammates.map(index => EL(`teamSteps${index}`));
        function update() {
            const sum = inputs.reduce((total, input) => total + Number(input.value), 0);
            const valid = inputs.every(input => Number.isInteger(Number(input.value)) && Number(input.value) >= 0 && Number(input.value) <= 4) && sum === 4;
            EL('allocationFeedback').textContent = `${sum} of 4 steps assigned${valid ? '.' : ' — assign exactly 4 to continue.'}`;
            EL('allocationConfirm').disabled = !valid;
        }
        inputs.forEach(input => input.addEventListener('input', update));
        EL('allocationConfirm').addEventListener('click', () => {
            if (EL('allocationConfirm').disabled) return;
            teammates.forEach((index, order) => { const steps = Number(inputs[order].value); if (steps) queueTeamGrant(index, 'bonus', steps); });
            hideModal(); render(); toast('Four extra steps have been shared.', 'positive'); done();
        });
        update(); inputs[0].focus();
    }
    function offerBrendaShare(points) {
        return new Promise(resolve => {
            chooseTeammate('Share your roll', `Brenda lets you give part of this ${points}-step move to a teammate. They gain those steps on their next roll.`, index => {
                if (index === null) { resolve(points); return; }
                lastFocus = document.activeElement;
                dom.modalContents.innerHTML = `<div class="plain-modal"><span class="reveal-type">BRENDA / SHARED MOVEMENT</span><h2 id="modalTitle">Share with ${playerLabel(index)}</h2><p>Choose how many steps to give. You keep at least one step for this move.</p><div class="team-allocation"><div class="allocation-row"><label for="brendaSteps">Steps to share</label><input id="brendaSteps" type="number" min="1" max="${points - 1}" step="1" value="${Math.max(1, Math.floor(points / 2))}"></div></div><p id="brendaFeedback" aria-live="polite"></p><div class="modal-actions"><button id="brendaConfirm" class="modal-action" type="button">SHARE STEPS</button><button id="brendaKeep" class="secondary-action" type="button">KEEP THIS ROLL</button></div></div>`;
                dom.modalBackdrop.hidden = false;
                modalAction = () => { hideModal(); resolve(points); };
                const input = EL('brendaSteps');
                function update() {
                    const share = Number(input.value), valid = Number.isInteger(share) && share >= 1 && share < points;
                    EL('brendaFeedback').textContent = valid ? `You move ${points - share} steps; ${playerLabel(index)} gains ${share} next turn.` : `Choose 1 to ${points - 1} steps.`;
                    EL('brendaConfirm').disabled = !valid;
                }
                input.addEventListener('input', update);
                EL('brendaConfirm').addEventListener('click', () => {
                    if (EL('brendaConfirm').disabled) return;
                    const share = Number(input.value);
                    player(index).next.bonus += share;
                    hideModal(); render(); toast(`${playerLabel(index)} gains ${share} shared steps.`, 'positive'); resolve(points - share);
                });
                EL('brendaKeep').addEventListener('click', () => { hideModal(); resolve(points); });
                update(); dom.modalClose.focus();
            }, teammateIndices(), false);
        });
    }
    function chooseTargets(title, hint, targets, callback, canCancel = false) {
        if (!targets.length) { toast('There is no valid hexagon for this effect.'); callback(null); return; }
        pendingChoice = { targets, callback, canCancel };
        mode = 'choice'; dom.choiceTitle.textContent = title; dom.choiceHint.textContent = hint; dom.choiceBar.hidden = false; dom.choiceCancel.hidden = !canCancel;
        render();
    }
    function endChoice(tile) {
        if (!pendingChoice) return;
        const callback = pendingChoice.callback; pendingChoice = null; dom.choiceBar.hidden = true; mode = 'busy'; render(); callback(tile);
    }
    function handleTileClick(tile) {
        if (window.__traceSuppressClick) return;
        if (mode === 'start') {
            state.position = tile.id; state.visited = [tile.id]; routePoints = [];
            const starter = state.activePlayer;
            if (starter < state.playerCount - 1) { state.activePlayer++; mode = 'start'; toast(`${playerLabel(starter)} is ready. ${playerLabel(state.activePlayer)}, choose a starting hexagon.`, 'positive'); }
            else { state.activePlayer = 0; mode = 'ready'; toast('Everyone is on the map. Player 1 rolls first.', 'positive'); }
            sound(500, .18); render(); return;
        }
        if (mode === 'choice' && pendingChoice?.targets.some(target => target.id === tile.id)) { endChoice(tile); return; }
        if (mode === 'move') {
            const current = TILE_BY_ID.get(state.position), direction = directionTo(current, tile);
            if (direction >= 0) moveInDirection(direction);
        }
    }

    function finishAction(advance = true) {
        pendingRoll = null; rollingBonus = 0; routePoints = []; chainDepth = 0;
        if (advance && state.playerCount) {
            if (state.playerCount > 1) {
                state.activePlayer = (state.activePlayer + 1) % state.playerCount;
                toast(`${playerLabel(state.activePlayer)}, your turn.`, 'positive');
            }
            if (state.activePlayer === 0) state.cycle++;
        }
        mode = state.position ? 'ready' : 'start';
        render();
    }
    const finishAbility = () => finishAction(false);
    async function animateDie(value) {
        if (reducedMotion()) { dom.dieFace.textContent = DIE_FACES[value]; return; }
        dom.die.classList.remove('is-impact'); void dom.die.offsetWidth; dom.die.classList.add('is-rolling');
        const ticker = setInterval(() => { dom.dieFace.textContent = DIE_FACES[1 + randomInt(6)]; sound(105 + randomInt(65), .035); }, 80);
        await sleep(690); clearInterval(ticker); dom.die.classList.remove('is-rolling'); dom.dieFace.textContent = DIE_FACES[value]; dom.die.classList.add('is-impact'); sound(86, .19);
        await sleep(250); dom.die.classList.remove('is-impact');
    }
    async function rollDie() { const value = 1 + randomInt(6); await animateDie(value); return value; }
    function activateTeamGrants() {
        const due = state.pendingGrants.filter(grant => grant.availableCycle <= state.cycle);
        state.pendingGrants = state.pendingGrants.filter(grant => grant.availableCycle > state.cycle);
        for (const grant of due) {
            if (grant.kind === 'bonus') state.next.bonus += grant.amount;
            if (grant.kind === 'split') state.next.split = true;
        }
    }
    async function beginRoll() {
        if (mode !== 'ready') return;
        chainDepth = 0;
        activateTeamGrants();
        const next = { ...state.next };
        rollingBonus = next.bonus;
        state.round += 1;
        mode = 'rolling'; render();
        if (next.skip) { state.next.skip = false; render(); toast('Security issue: no movement this round.', 'negative'); await sleep(350); finishAction(); return; }
        if (next.returnToEvent && state.lastEventSpot) {
            state.next.returnToEvent = false; render();
            toast('Returning to the last event space you passed.');
            await teleportTo(TILE_BY_ID.get(state.lastEventSpot), true, 0, finishAction);
            return;
        }
        state.next = emptyNext(); render();
        let raw = await rollDie();
        if (state.people.includes(5) && raw < 3) {
            raw = await new Promise(resolve => showDecision('Roll again?', `Jo Ann Evansgardner lets you reroll a ${raw}. Keep this result or try once more.`, ['REROLL', 'KEEP THIS ROLL'], async index => resolve(index === 0 ? await rollDie() : raw)));
        }
        let second = 0;
        if (next.twoDice) { await sleep(180); second = await rollDie(); }
        let points = raw + second + next.bonus;
        let additiveBonus = next.bonus;
        if (state.people.includes(9) && raw < 3) { points += 1; additiveBonus++; toast('Rosanna Lane: a low roll gains 1 step.', 'positive'); }
        if (next.double) points *= 2;
        if (next.half) points = Math.max(1, Math.floor(points / 2));
        if (state.playerCount > 1 && state.people.includes(2) && raw > 3 && points > 1) points = await offerBrendaShare(points);
        toast(`${second ? `${raw} + ${second}` : raw}${next.bonus ? ` + ${next.bonus}` : ''}${next.double ? ' × 2' : ''}${next.half ? ' ÷ 2' : ''} → ${points} steps.`, 'positive');
        pendingRoll = { remaining: points, split: next.split && points > 1, leg: 1, bonus: additiveBonus };
        dom.firstLeg.value = String(Math.max(1, Math.floor(points / 2)));
        routePoints = [TILE_BY_ID.get(state.position)];
        if (next.forcedDirection) {
            toast('Unjustice: the die chooses a direction.', 'negative');
            const forced = await rollDie();
            toast(`Direction ${forced}: ${['up','upper right','lower right','down','lower left','upper left'][forced - 1]}.`);
            pendingRoll.split = false;
            await moveInDirection(forced - 1, true);
        } else { mode = 'move'; render(); }
    }
    async function moveInDirection(direction, forced = false) {
        if (mode !== 'move' && !forced) return;
        mode = 'busy'; render();
        const planned = pendingRoll.split && pendingRoll.leg === 1 ? Number(dom.firstLeg.value) : pendingRoll.remaining;
        let moved = 0;
        for (let step = 0; step < planned; step++) {
            const next = adjacent(TILE_BY_ID.get(state.position), direction);
            if (!next) break;
            routePoints.push(next); setPosition(next); moved++;
            sound(180 + step * 21, .055);
            if (!reducedMotion()) await sleep(135);
        }
        if (moved < planned) toast(moved ? 'The route ends here. Your piece stopped at the edge.' : 'That direction is blocked.', 'negative');
        if (pendingRoll.split && pendingRoll.leg === 1 && moved > 0 && pendingRoll.remaining - moved > 0) {
            pendingRoll.remaining -= moved; pendingRoll.leg = 2; mode = 'move'; render(); toast('First move complete. Choose a new direction.', 'positive'); return;
        }
        pendingRoll.remaining = 0;
        if (moved === 0) { if (routePoints.length > 1) resolveLanding(0, finishAction); else finishAction(); return; }
        resolveLanding(0, finishAction);
    }
    function resolveLanding(chain, done) {
        const tile = TILE_BY_ID.get(state.position), kind = effectiveKind(tile);
        if (chain > 8) { toast('The card chain pauses here. Continue with a new roll.'); done(); return; }
        if (kind === 'ordinary') { done(); return; }
        if (state.ignoreNextSpecial > 0) { state.ignoreNextSpecial--; render(); toast('Salary decrease: no card at this special space.', 'negative'); done(); return; }
        if (kind === 'address') {
            if (state.claimedAddresses.includes(tile.address)) { toast('This address has already been collected.'); done(); return; }
            const card = cardFromKey(`address:${tile.address}`); recordCard(card); showCard(card, false, done); return;
        }
        if (kind === 'person') {
            const available = Array.from({ length: 11 }, (_, i) => i + 1).filter(number => !state.drawnPeople.includes(number));
            if (!available.length) { toast('You have met every available connection.', 'positive'); done(); return; }
            const card = cardFromKey(`person:${available[randomInt(available.length)]}`); recordCard(card); showCard(card, false, done); return;
        }
        if (CATEGORIES[kind]) { drawEvent(kind, done); return; }
        done();
    }
    function drawEvent(category, done) {
        const number = 1 + randomInt(4), card = cardFromKey(`event:${category}-${number}`);
        recordCard(card); showCard(card, false, done);
    }
    async function teleportTo(tile, trigger, chain, done) {
        if (!tile) { toast('That destination is not available.'); done(); return; }
        const same = tile.id === state.position;
        routePoints = []; setPosition(tile); sound(580, .2);
        toast(`Travelled to ${tile.address ? ADDRESS_NAMES[tile.address] : CATEGORIES[effectiveKind(tile)]?.label || 'a new hexagon'}.`, 'positive');
        if (!reducedMotion()) await sleep(240);
        if (trigger && !same) {
            chainDepth++;
            if (chainDepth > 8) { toast('The chain of card effects pauses here.'); done(); }
            else resolveLanding(chain + 1, done);
        } else done();
    }
    function transformOrdinary(category, done) {
        const targets = TILES.filter(tile => effectiveKind(tile) === 'ordinary');
        chooseTargets(`Create a ${CATEGORIES[category].label} space`, 'Choose any ordinary hexagon to change.', targets, tile => {
            if (tile) { state.modified[tile.id] = category; render(); toast(`A new ${CATEGORIES[category].label} event space appears.`, 'positive'); }
            done();
        });
    }
    function teleportChoice(category, chain, done, noDraw = false) {
        const targets = TILES.filter(tile => effectiveKind(tile) === category && tile.id !== state.position);
        chooseTargets(`Travel to ${CATEGORIES[category].label}`, 'Choose a highlighted event space.', targets, tile => {
            if (tile) teleportTo(tile, !noDraw, chain, done); else done();
        });
    }

    function applyCard(card, done) {
        mode = 'busy';
        if (card.type === 'event' && NEGATIVE_EVENTS.has(`${card.category}-${card.number}`)) {
            if (state.shields > 0) { state.shields--; render(); toast(`${card.name} was blocked by a connection or safe place.`, 'positive'); done(); return; }
            const protector = state.players.findIndex((entry, index) => index !== state.activePlayer && entry.people.includes(10) && entry.abilityUses[10] > 0);
            if (protector >= 0) {
                showDecision('Protect a teammate?', `${playerLabel(protector)} can use Sue Burdick's connection to cancel ${card.name} for ${playerLabel(state.activePlayer)}.`, ['USE SUE', 'ACCEPT EVENT'], index => {
                    if (index === 0) { player(protector).abilityUses[10]--; render(); toast(`${playerLabel(protector)} blocked ${card.name}.`, 'positive'); done(); }
                    else applyEvent(card.category, card.number, done);
                });
                return;
            }
        }
        if (card.type === 'address') { applyAddress(card.number, done); return; }
        if (card.type === 'person') { applyPerson(card.number, done); return; }
        applyEvent(card.category, card.number, done);
    }
    function applyAddress(number, done) {
        if ([2, 19].includes(number)) { state.shields++; toast('A negative event shield is ready.', 'positive'); }
        else if ([1].includes(number)) state.next.bonus += 2;
        else if ([3, 11].includes(number)) state.next.double = true;
        else if (number === 4) state.next.returnToEvent = true;
        else if ([5, 6, 17].includes(number)) { transformOrdinary('justice', done); return; }
        else if ([7, 12].includes(number)) { teleportChoice('expression', 0, done); return; }
        else if (number === 8) state.next.split = true;
        else if (number === 9) { teleportChoice('community', 0, done); return; }
        else if ([10, 20].includes(number)) { render(); drawEvent('expression', done); return; }
        else if (number === 13) { transformOrdinary('resources', done); return; }
        else if (number === 15) {
            const targets = state.visited.map(id => TILE_BY_ID.get(id)).filter(tile => tile && tile.id !== state.position);
            chooseTargets('Return to a visited hex', 'Choose a place you have already reached.', targets, tile => { if (tile) teleportTo(tile, true, 0, done); else done(); }); return;
        }
        else if (number === 16) { render(); drawEvent('justice', done); return; }
        else if (number === 18) { transformOrdinary('expression', done); return; }
        else if (number === 14) toast('Nothing happens here. The city is still yours to explore.');
        render(); done();
    }
    function applyPerson(number, done) {
        if (number === 1 && !state.shieldFromAnn) { state.shields++; state.shieldFromAnn = true; toast('Ann Begler can block one negative event.', 'positive'); }
        if (number === 2) toast(state.playerCount > 1 ? 'Brenda can share high rolls with teammates.' : 'Brenda has no teammate to share a roll with.');
        if (number === 10) toast(state.playerCount > 1 ? 'Sue can block a teammate’s negative events up to three times, with their agreement.' : 'Sue has no teammate to protect.');
        if ([3, 4, 6, 7, 8, 11].includes(number)) toast('A new connection ability is available in your field notes.', 'positive');
        if (number === 5) toast('On future rolls below 3, Jo Ann offers a reroll.', 'positive');
        if (number === 9) toast('On future rolls below 3, Rosanna adds one step.', 'positive');
        render(); done();
    }
    function applyEvent(category, number, done) {
        const key = `${category}-${number}`;
        if (key === 'community-1') { allocateTeamSteps(done); return; }
        if (key === 'community-2') {
            chooseTeammate('Give two steps', 'Choose a teammate to receive 2 extra steps on their next roll.', index => {
                if (index !== null) { queueTeamGrant(index, 'bonus', 2); toast(`${playerLabel(index)} receives 2 extra steps next round.`, 'positive'); }
                done();
            }); return;
        }
        if (key === 'community-3') {
            chooseTeammate('Share a split move', 'Choose a teammate who may divide their next roll into two moves.', index => {
                if (index !== null) { queueTeamGrant(index, 'split'); toast(`${playerLabel(index)} can split a move next round.`, 'positive'); }
                done();
            }); return;
        }
        if (key === 'community-4') state.next.skip = true;
        if (key === 'expression-1') {
            chooseTeammate('Follow a teammate to Expression', 'Choose a teammate. You will teleport to the Expression space nearest to them.', index => {
                if (index !== null) {
                    const target = nearestTile(TILES.filter(tile => effectiveKind(tile) === 'expression'), TILE_BY_ID.get(player(index).position));
                    if (target) { teleportTo(target, true, 0, done); return; }
                }
                done();
            }); return;
        }
        if (key === 'expression-2') {
            const eligible = teammateIndices();
            if (eligible.length) {
                chooseTeammate('Follow a teammate’s address', 'Choose the teammate whose last numbered place you will visit.', index => {
                    if (index !== null) {
                        const target = player(index).lastAddressSpot ? TILE_BY_ID.get(player(index).lastAddressSpot) : nearestTile(TILES.filter(tile => tile.address), TILE_BY_ID.get(state.position));
                        teleportTo(target, true, 0, done);
                    }
                    else done();
                }, eligible); return;
            }
            const target = nearestTile(TILES.filter(tile => tile.address), TILE_BY_ID.get(state.position));
            teleportTo(target, true, 0, done); return;
        }
        if (key === 'expression-3') state.next.split = true;
        if (key === 'expression-4') state.next.half = true;
        if (key === 'justice-1') { transformOrdinary('justice', done); return; }
        if (key === 'justice-2') { state.shields++; toast('The next negative event will be blocked.', 'positive'); }
        if (key === 'justice-3') state.next.forcedDirection = true;
        if (key === 'justice-4') state.next.bonus += 1;
        if (key === 'resources-1') state.next.twoDice = true;
        if (key === 'resources-2') {
            if (!state.investmentUsed) { state.investmentUsed = true; state.next.bonus += 2; }
            else toast('Investment has already been used this journey.');
        }
        if (key === 'resources-3') {
            chooseTeammate('Switch places', 'Choose a teammate. You will exchange positions on the map.', index => {
                if (index !== null) {
                    const origin = TILE_BY_ID.get(state.position), destination = TILE_BY_ID.get(player(index).position);
                    setPositionFor(index, origin); setPosition(destination);
                    toast(`You switched places with ${playerLabel(index)}.`, 'positive'); render();
                }
                done();
            }); return;
        }
        if (key === 'resources-4') state.ignoreNextSpecial++;
        render(); done();
    }
    function useAbility(number) {
        if (mode !== 'ready') { toast('Finish the current move before using a connection.'); return; }
        chainDepth = 0;
        mode = 'busy'; render();
        if (number === 3) {
            if (state.abilityUses[3] <= 0) { finishAbility(); return; }
            state.abilityUses[3]--;
            const targets = TILES.filter(tile => effectiveKind(tile) === 'resources' && tile.id !== state.position);
            const target = nearestTile(targets, TILE_BY_ID.get(state.position)); render(); teleportTo(target, true, 0, finishAbility); return;
        }
        if (number === 4 || number === 8) { teleportTo(addressTile(number === 4 ? 4 : 20), true, 0, finishAbility); return; }
        if (number === 6) { state.abilityUses[6] = 0; render(); drawEvent('expression', finishAbility); return; }
        if (number === 7 || number === 11) {
            const category = number === 7 ? 'community' : 'expression';
            if (effectiveKind(TILE_BY_ID.get(state.position)) !== category) { toast(`Stand on a ${CATEGORIES[category].label} event hexagon to use this connection.`); finishAbility(); return; }
            teleportChoice(category, 0, finishAbility, number === 7); return;
        }
        finishAbility();
    }

    function fitBoard() {
        const rect = dom.boardWindow.getBoundingClientRect();
        view.scale = Math.min(rect.width, rect.height) / 1440;
        view.x = (rect.width - 1440 * view.scale) / 2;
        view.y = (rect.height - 1440 * view.scale) / 2;
        view.fitted = true; applyView();
    }
    function applyView() { dom.boardTransform.style.transform = `translate(${view.x}px, ${view.y}px) scale(${view.scale})`; }
    function zoom(factor, centerX, centerY) {
        const newScale = Math.min(2.4, Math.max(.26, view.scale * factor));
        view.x = centerX - (centerX - view.x) * newScale / view.scale;
        view.y = centerY - (centerY - view.y) * newScale / view.scale;
        view.scale = newScale; applyView();
    }
    function wireMapPan() {
        let dragging = null;
        dom.boardWindow.addEventListener('pointerdown', event => {
            if (event.button !== 0) return;
            dragging = { x: event.clientX, y: event.clientY, originX: view.x, originY: view.y, moved: false };
        });
        dom.boardWindow.addEventListener('pointermove', event => {
            if (!dragging) return;
            const dx = event.clientX - dragging.x, dy = event.clientY - dragging.y;
            if (Math.hypot(dx, dy) > 7) { dragging.moved = true; dom.boardWindow.classList.add('is-dragging'); view.x = dragging.originX + dx; view.y = dragging.originY + dy; applyView(); }
        });
        const finish = event => { if (dragging?.moved) { event.preventDefault(); window.__traceSuppressClick = true; setTimeout(() => { window.__traceSuppressClick = false; }, 60); } dragging = null; dom.boardWindow.classList.remove('is-dragging'); };
        dom.boardWindow.addEventListener('pointerup', finish);
        dom.boardWindow.addEventListener('pointercancel', finish);
        dom.boardWindow.addEventListener('wheel', event => { event.preventDefault(); const rect = dom.boardWindow.getBoundingClientRect(); zoom(event.deltaY < 0 ? 1.12 : .89, event.clientX - rect.left, event.clientY - rect.top); }, { passive: false });
        EL('zoomIn').addEventListener('click', () => zoom(1.25, dom.boardWindow.clientWidth / 2, dom.boardWindow.clientHeight / 2));
        EL('zoomOut').addEventListener('click', () => zoom(.8, dom.boardWindow.clientWidth / 2, dom.boardWindow.clientHeight / 2));
        EL('zoomReset').addEventListener('click', fitBoard);
        new ResizeObserver(fitBoard).observe(dom.boardWindow);
    }
    function showHelp() {
        lastFocus = document.activeElement;
        dom.modalContents.innerHTML = `<div class="plain-modal"><span class="reveal-type">TRACE / FIELD GUIDE</span><h2 id="modalTitle">Explore the network</h2><p>Choose one to four players. Each player selects a starting hexagon, then Player 1 begins. Take turns in number order. Roll a six-sided die, then choose one neighboring hexagon to set your direction. Your piece travels straight for the rolled number of steps, stopping at the edge of the map. A split-move card lets you turn once.</p><ul><li><strong>Colored hexagons:</strong> green Community, blue Expression, pink Justice, and yellow Resources. Landing on one draws a matching event card. Event cards can repeat.</li><li><strong>Brown symbols:</strong> meet a randomly selected connection. Each person or collective can be drawn only once across the group.</li><li><strong>Numbered blue hexagons:</strong> collect the corresponding address card once across the group. Its number disappears after collection.</li><li><strong>Card effects:</strong> each player's cards, abilities, and future-roll effects appear when it is their turn. Changes to the map are shared. Cards that affect a teammate let you choose who receives the effect.</li><li><strong>Solo play:</strong> teammate-only effects have no target. Any printed solo alternative still applies. Half steps round down to at least one; “roll twice” adds two dice. Cards trigger at the final landing space, and teleports can trigger another card.</li><li>Refreshing the page starts a new journey. You can also use “Start a new journey” without leaving the page.</li></ul><button class="modal-action" id="helpClose" type="button">BACK TO THE MAP</button></div>`;
        dom.modalBackdrop.hidden = false; modalAction = hideModal; EL('helpClose').addEventListener('click', hideModal); dom.modalClose.focus();
    }
    function resetGame() {
        showDecision('Begin again?', 'This clears every player’s cards, positions, and map changes.', ['START AGAIN', 'KEEP EXPLORING'], index => {
            if (index !== 0) return;
            state = newState(); mode = 'setup'; pendingRoll = null; rollingBonus = 0; pendingChoice = null; routePoints = [];
            archiveFilter = 'all'; dom.archiveFilter.textContent = 'ALL ▾';
            const setup = EL('setupOverlay'); if (setup) setup.hidden = false;
            syncSoundButton();
            render(); toast('Choose how many players will explore.', 'positive');
        });
    }

    function beginJourney(count) {
        state = newState();
        archiveFilter = 'all'; dom.archiveFilter.textContent = 'ALL ▾';
        state.playerCount = Math.max(1, Math.min(4, count));
        state.players = Array.from({ length: state.playerCount }, newPlayer);
        state.activePlayer = 0;
        mode = 'start'; pendingRoll = null; rollingBonus = 0; pendingChoice = null; routePoints = [];
        const setup = EL('setupOverlay'); if (setup) setup.hidden = true;
        syncSoundButton();
        render();
        toast(`${playerLabel(0)}, choose your starting hexagon.`, 'positive');
    }

    function syncSoundButton() {
        const button = EL('soundButton');
        button.textContent = state.soundMuted ? '◖×' : '◖))';
        button.setAttribute('aria-pressed', String(state.soundMuted));
        button.setAttribute('aria-label', state.soundMuted ? 'Unmute game sounds' : 'Mute game sounds');
    }

    function init() {
        if (!TILES.length) { dom.boardInstruction.textContent = 'The map could not load.'; return; }
        makeMap(); renderControls(); renderArchive(); wireMapPan(); fitBoard();
        dom.rollButton.addEventListener('click', beginRoll);
        dom.firstLeg.addEventListener('input', () => { dom.firstLegOutput.textContent = dom.firstLeg.value; });
        dom.modalClose.addEventListener('click', () => modalAction?.());
        dom.modalBackdrop.addEventListener('click', event => { if (event.target === dom.modalBackdrop) modalAction?.(); });
        document.addEventListener('keydown', event => { if (event.key === 'Escape' && !dom.modalBackdrop.hidden) modalAction?.(); });
        dom.choiceCancel.addEventListener('click', () => { if (pendingChoice?.canCancel) endChoice(null); });
        EL('helpButton').addEventListener('click', showHelp);
        EL('newGameButton').addEventListener('click', resetGame);
        const countOptions = EL('playerCountOptions');
        if (countOptions) countOptions.addEventListener('click', event => {
            const button = event.target.closest('[data-player-count]'); if (!button) return;
            countOptions.querySelectorAll('[data-player-count]').forEach(option => { option.setAttribute('aria-pressed', String(option === button)); option.classList.toggle('is-selected', option === button); });
        });
        const startButton = EL('startJourneyButton');
        if (startButton) startButton.addEventListener('click', () => beginJourney(Number(countOptions?.querySelector('[aria-pressed="true"]')?.dataset.playerCount || 1)));
        EL('soundButton').addEventListener('click', () => { state.soundMuted = !state.soundMuted; syncSoundButton(); });
        syncSoundButton();
        dom.archiveFilter.addEventListener('click', () => { const choices = ['all','address','person','event']; archiveFilter = choices[(choices.indexOf(archiveFilter) + 1) % choices.length]; dom.archiveFilter.textContent = `${archiveFilter.toUpperCase()} ▾`; renderArchive(); });
    }
    init();
})();
