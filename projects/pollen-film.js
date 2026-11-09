(() => {
    const player = document.querySelector('.pf-film-player');
    const video = player?.querySelector('video');
    const poster = player?.querySelector('.pf-film-poster');
    const controls = player?.querySelector('.pf-video-controls');
    if (!player || !video || !controls) return;

    const playButton = controls.querySelector('.pf-video-toggle');
    const muteButton = controls.querySelector('.pf-video-mute');
    const fullscreenButton = controls.querySelector('.pf-video-fullscreen');
    const seek = controls.querySelector('.pf-video-seek');
    const current = controls.querySelector('.pf-video-current');
    const duration = controls.querySelector('.pf-video-duration');
    const formatTime = seconds => {
        if (!Number.isFinite(seconds)) return '0:00';
        const whole = Math.floor(seconds);
        return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
    };
    let seeking = false;

    const updateTime = () => {
        const total = Number.isFinite(video.duration) ? video.duration : 0;
        duration.textContent = formatTime(total);
        if (seeking) return;
        current.textContent = formatTime(video.currentTime);
        seek.value = total ? String(Math.round(video.currentTime / total * 1000)) : '0';
        seek.style.setProperty('--pf-video-progress', `${Number(seek.value) / 10}%`);
        seek.setAttribute('aria-valuetext', formatTime(video.currentTime));
    };
    const updatePlay = () => {
        const playing = !video.paused && !video.ended;
        if (playing && poster) poster.hidden = true;
        playButton.dataset.playing = String(playing);
        playButton.setAttribute('aria-label', playing ? 'Pause video' : 'Play video');
        playButton.setAttribute('aria-pressed', String(playing));
    };
    const togglePlay = () => {
        if (video.paused || video.ended) video.play().catch(() => {});
        else video.pause();
    };

    playButton.addEventListener('click', togglePlay);
    video.addEventListener('click', togglePlay);
    muteButton.addEventListener('click', () => { video.muted = !video.muted; });
    video.addEventListener('volumechange', () => {
        muteButton.dataset.muted = String(video.muted);
        muteButton.setAttribute('aria-label', video.muted ? 'Unmute video' : 'Mute video');
        muteButton.setAttribute('aria-pressed', String(video.muted));
    });
    seek.addEventListener('input', () => {
        seeking = true;
        const time = Number(seek.value) / 1000 * (Number.isFinite(video.duration) ? video.duration : 0);
        current.textContent = formatTime(time);
        seek.style.setProperty('--pf-video-progress', `${Number(seek.value) / 10}%`);
        seek.setAttribute('aria-valuetext', formatTime(time));
    });
    seek.addEventListener('change', () => {
        if (poster) poster.hidden = true;
        if (Number.isFinite(video.duration)) video.currentTime = Number(seek.value) / 1000 * video.duration;
        seeking = false;
        updateTime();
    });
    const seekToPointer = event => {
        if (!Number.isFinite(video.duration)) return;
        if (poster) poster.hidden = true;
        const bounds = seek.getBoundingClientRect();
        const fraction = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
        seek.value = String(Math.round(fraction * 1000));
        video.currentTime = fraction * video.duration;
        seeking = false;
        updateTime();
    };
    seek.addEventListener('pointerdown', event => {
        seek.setPointerCapture(event.pointerId);
        seekToPointer(event);
    });
    seek.addEventListener('pointermove', event => {
        if (seek.hasPointerCapture(event.pointerId)) seekToPointer(event);
    });
    fullscreenButton.addEventListener('click', () => {
        if (document.fullscreenElement === player) document.exitFullscreen();
        else if (player.requestFullscreen) player.requestFullscreen();
        else if (video.webkitEnterFullscreen) video.webkitEnterFullscreen();
    });
    document.addEventListener('fullscreenchange', () => {
        fullscreenButton.setAttribute('aria-label', document.fullscreenElement === player ? 'Exit fullscreen' : 'Enter fullscreen');
    });
    video.addEventListener('loadedmetadata', updateTime);
    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('play', updatePlay);
    video.addEventListener('pause', updatePlay);
    video.addEventListener('ended', updatePlay);

    video.controls = false;
    controls.hidden = false;
    updateTime();
    updatePlay();
})();
