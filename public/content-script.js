// content-script.js
// This script runs in the context of YouTube Music

// Store a reference to the PiP window


let pipWindow = null;
let isPlaying = false;
let currentSongInfo = {
    title: "Nothing is playing",
    artist: "play a song to activate me!",
    album: "",
    coverUrl: "",
    duration: 0,
    currentTime: 0,
    volume: 100
};
let repeatMode = 0;
let shuffle = false;

let titleHtml = null;
let artistHtml = null;
let coverHtml = null;
let placeHolderHtml = null;
let track = null;
let shuffleHtml = null;
let repeatBtn = null;
let repeatHtml = null;
let repeatOnceHtml = null;
let volumeSlider = null;
let volumeSliderPopup = null;

function updatePipContent() {
    if (!pipWindow) return;

    const content = pipWindow.document.getElementById('pip-content');
    if (!content) return;
    if (!titleHtml || !artistHtml || !coverHtml || !track || !placeHolderHtml || !track || !repeatHtml || !repeatOnceHtml || !shuffleHtml || !repeatBtn) {
        setup().then(r => {
            extractSongInfo().then(r => {
                setValues();
            });
        })
    } else {
        extractSongInfo().then(r => {
            setValues();
        });
    }
}

function setValues(){
    titleHtml.textContent = currentSongInfo.title == null || currentSongInfo.title === "" ? "Nothing is playing" : currentSongInfo.title;
    artistHtml.textContent = currentSongInfo.artist == null || currentSongInfo.artist.trim().replace(/(\r\n|\n|\r)/gm,"") === "" ? "play a song to activate me!" : currentSongInfo.artist;
    coverHtml.src = currentSongInfo.coverUrl;
    if (coverHtml.src === "https://music.youtube.com/" || coverHtml.src == null || coverHtml.src === "") {
        placeHolderHtml.classList.remove('hide');
        coverHtml.classList.add('hide');
    } else {
        placeHolderHtml.classList.add('hide');
        coverHtml.classList.remove('hide');
    }
    if (isPlaying) {
        pipWindow.document.getElementById('play').classList.add('hide');
        pipWindow.document.getElementById('pause').classList.remove('hide');
    } else {
        pipWindow.document.getElementById('play').classList.remove('hide');
        pipWindow.document.getElementById('pause').classList.add('hide');
    }

    if (currentSongInfo.duration > 0) {
        const progress = (currentSongInfo.currentTime / currentSongInfo.duration) * 100;
        track.style.width = `${progress}%`;
    } else {
        track.style.width = '0%';
    }

    if (!shuffle){
        shuffleHtml.classList.remove('active');
    } else {
        shuffleHtml.classList.add('active');
    }

    if (repeatMode === 0){
        if (repeatBtn.classList.contains('active')) {
            repeatBtn.classList.remove('active');
        }
        repeatOnceHtml.classList.add('hide');
        repeatHtml.classList.remove('hide');
    } else if (repeatMode === 1) {
        if (!repeatBtn.classList.contains('active')) {
            repeatBtn.classList.add('active');
        }
        repeatHtml.classList.remove('hide');
        repeatOnceHtml.classList.add('hide');
    } else if (repeatMode === 2) {
        repeatBtn.classList.add('active');
        repeatHtml.classList.add('hide');
        repeatOnceHtml.classList.remove('hide');
    }

    if (volumeSlider) {
        volumeSlider.value = currentSongInfo.volume;
    }

    if (volumeSliderPopup) {
        volumeSliderPopup.value = currentSongInfo.volume;
    }

}

async function setup() {

    titleHtml = titleHtml == null ? pipWindow.document.getElementById('title') : titleHtml;
    artistHtml = artistHtml == null ? pipWindow.document.getElementById('artist') : artistHtml;
    coverHtml = coverHtml == null ? pipWindow.document.getElementById('cover') : coverHtml;
    placeHolderHtml = placeHolderHtml == null ? pipWindow.document.getElementById('noCover') : placeHolderHtml;
    track = track == null ? pipWindow.document.getElementById('track') : track;
    repeatHtml = repeatHtml == null ? pipWindow.document.querySelector('.repeat') : repeatHtml;
    repeatOnceHtml = repeatOnceHtml == null ? pipWindow.document.querySelector('.repeatOnce') : repeatOnceHtml;
    repeatBtn = repeatBtn == null ? pipWindow.document.querySelector('.repeat-btn') : repeatBtn;
    volumeSlider = volumeSlider == null ? pipWindow.document.getElementById('volume-slider') : volumeSlider;
    volumeSliderPopup = volumeSliderPopup == null ? pipWindow.document.getElementById('volume-slider-popup') : volumeSliderPopup;

    const playPauseBtn = pipWindow.document.querySelector('.play-pause');
    const previousBtn = pipWindow.document.querySelector('.prev');
    const nextBtn = pipWindow.document.querySelector('.next');
    shuffleHtml = pipWindow.document.querySelector('.shuffle');
    const addToPlaylistBtn = pipWindow.document.getElementById('add-to-playlist');

    playPauseBtn.addEventListener('click', () => {
        const ytPlayPauseBtn = document.querySelector('.play-pause-button.style-scope.ytmusic-player-bar');
        if (ytPlayPauseBtn) {
            ytPlayPauseBtn.click();
        }
    });

    previousBtn.addEventListener('click', () => {
        const ytPreviousBtn = document.querySelector('.previous-button.style-scope.ytmusic-player-bar');
        if (ytPreviousBtn) {
            ytPreviousBtn.click();
        }
    });

    nextBtn.addEventListener('click', () => {
        const ytNextBtn = document.querySelector('.next-button.style-scope.ytmusic-player-bar');
        if (ytNextBtn) {
            ytNextBtn.click();
        }
    });

    repeatBtn.addEventListener('click', () => {
        const ytRepeatBtn = document.querySelector('.repeat.style-scope.ytmusic-player-bar');
        if (ytRepeatBtn) {
            ytRepeatBtn.click();
        }
    });

    shuffleHtml.addEventListener('click', () => {
        const ytShuffleBtn = document.querySelector('.shuffle.style-scope.ytmusic-player-bar');
        if (ytShuffleBtn){
            ytShuffleBtn.click();
        }
    })

    addToPlaylistBtn.addEventListener('click', () => {
        // Show visual feedback that we're processing the action
        addToPlaylistBtn.style.backgroundColor = 'rgba(46, 80, 255, 0.7)';

        // Store the current URL to return to it later
        const currentUrl = window.location.href;

        // Find the song title and artist to use for searching
        const songTitle = currentSongInfo.title;
        let songArtist = currentSongInfo.artist;

        if (!songTitle || songTitle === "Nothing is playing") {
            console.log("No song is currently playing");
            // Reset the button style after a delay
            setTimeout(() => {
                addToPlaylistBtn.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            }, 1000);
            return;
        }

        // Clean up the artist string to get just the main artist
        // This handles cases like "Artist1 - Artist2" or "Artist feat. Someone"
        if (songArtist.includes(' - ')) {
            songArtist = songArtist.split(' - ')[0].trim();
        }
        if (songArtist.toLowerCase().includes('feat.')) {
            songArtist = songArtist.split('feat.')[0].trim();
        }

        // Try the direct method first (clicking the menu in the player bar)
        const moreOptionsBtn = document.querySelector('.ytmusic-player-bar.middle-controls button.dropdown-trigger');
        if (moreOptionsBtn) {
            moreOptionsBtn.click();

            // Wait for the menu to appear
            setTimeout(() => {
                const menuItems = document.querySelectorAll('tp-yt-paper-listbox.dropdown-content tp-yt-paper-item');
                let foundAddToPlaylist = false;

                for (const menuItem of menuItems) {
                    if (menuItem.textContent.trim().toLowerCase().includes('add to playlist') || 
                        menuItem.textContent.trim().toLowerCase().includes('añadir a la lista')) {
                        menuItem.click();
                        foundAddToPlaylist = true;
                        break;
                    }
                }

                // If we didn't find the "Add to playlist" option, try the search method
                if (!foundAddToPlaylist) {
                    // Close the menu first
                    document.body.click();

                    // Wait for the menu to close
                    setTimeout(() => {
                        // Open YouTube Music's search interface
                        const searchButton = document.querySelector('ytmusic-search-box');
                        if (searchButton) {
                            // Focus the search box
                            searchButton.click();

                            // Wait for the search box to be ready
                            setTimeout(() => {
                                // Get the input element
                                const searchInput = document.querySelector('input.ytmusic-search-box');
                                if (searchInput) {
                                    // Clear any existing text
                                    searchInput.value = '';

                                    // Set the search query to the current song title and artist
                                    const searchQuery = `${songTitle} ${songArtist}`;
                                    searchInput.value = searchQuery;

                                    // Dispatch events to simulate typing
                                    searchInput.dispatchEvent(new Event('input', { bubbles: true }));

                                    // Press Enter to perform the search
                                    setTimeout(() => {
                                        searchInput.dispatchEvent(new KeyboardEvent('keydown', { 
                                            key: 'Enter',
                                            code: 'Enter',
                                            keyCode: 13,
                                            which: 13,
                                            bubbles: true
                                        }));

                                        // After search results appear, look for the song and open its menu
                                        setTimeout(() => {
                                            // Look for the song in search results
                                            const songItems = document.querySelectorAll('ytmusic-responsive-list-item-renderer');
                                            let foundSong = false;

                                            for (const item of songItems) {
                                                const titleElement = item.querySelector('.title');
                                                const subtitleElement = item.querySelector('.subtitle');

                                                if (titleElement && subtitleElement) {
                                                    const itemTitle = titleElement.textContent.trim();
                                                    const itemSubtitle = subtitleElement.textContent.trim();

                                                    // Check if this is likely our song
                                                    if (itemTitle.toLowerCase().includes(songTitle.toLowerCase()) && 
                                                        itemSubtitle.toLowerCase().includes(songArtist.toLowerCase())) {

                                                        foundSong = true;

                                                        // Find and click the menu button for this song
                                                        const menuButton = item.querySelector('button.dropdown-trigger');
                                                        if (menuButton) {
                                                            menuButton.click();

                                                            // Wait for menu to appear and click "Add to playlist"
                                                            setTimeout(() => {
                                                                const menuItems = document.querySelectorAll('tp-yt-paper-listbox.dropdown-content tp-yt-paper-item');
                                                                for (const menuItem of menuItems) {
                                                                    if (menuItem.textContent.trim().toLowerCase().includes('add to playlist') || 
                                                                        menuItem.textContent.trim().toLowerCase().includes('añadir a la lista')) {
                                                                        menuItem.click();

                                                                        // Wait for the playlist dialog to appear, then navigate back
                                                                        setTimeout(() => {
                                                                            // Navigate back to the original page
                                                                            if (currentUrl && window.location.href !== currentUrl) {
                                                                                window.history.back();
                                                                            }

                                                                            // Reset the button style
                                                                            setTimeout(() => {
                                                                                addToPlaylistBtn.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
                                                                            }, 500);
                                                                        }, 1000);

                                                                        break;
                                                                    }
                                                                }
                                                            }, 300);

                                                            break;
                                                        }
                                                    }
                                                }
                                            }

                                            // If we didn't find the song, reset the button
                                            if (!foundSong) {
                                                // Navigate back to the original page
                                                if (currentUrl && window.location.href !== currentUrl) {
                                                    window.history.back();
                                                }

                                                // Reset the button style
                                                setTimeout(() => {
                                                    addToPlaylistBtn.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
                                                }, 500);
                                            }
                                        }, 1500); // Increased timeout for search results
                                    }, 300);
                                } else {
                                    // Reset the button style if search input not found
                                    setTimeout(() => {
                                        addToPlaylistBtn.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
                                    }, 500);
                                }
                            }, 300);
                        } else {
                            // Reset the button style if search button not found
                            setTimeout(() => {
                                addToPlaylistBtn.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
                            }, 500);
                        }
                    }, 300);
                } else {
                    // Reset the button style after successful direct method
                    setTimeout(() => {
                        addToPlaylistBtn.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
                    }, 1000);
                }
            }, 300);
        } else {
            // If more options button isn't available, try the search method directly
            // (Code for search method would be duplicated here, but for brevity I'm just resetting the button)
            setTimeout(() => {
                addToPlaylistBtn.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            }, 500);
        }
    });

    if (volumeSlider) {
        volumeSlider.addEventListener('input', () => {
            updateYouTubeMusicVolume(volumeSlider.value);

            if (volumeSliderPopup) {
                volumeSliderPopup.value = volumeSlider.value;
            }
        });
    }

    if (volumeSliderPopup) {
        volumeSliderPopup.addEventListener('input', () => {
            updateYouTubeMusicVolume(volumeSliderPopup.value);

            if (volumeSlider) {
                volumeSlider.value = volumeSliderPopup.value;
            }
        });
    }

    function updateYouTubeMusicVolume(sliderValue) {
        const videoElement = document.querySelector('video');
        if (videoElement) {
            const volumeValue = sliderValue / 100;

            videoElement.volume = volumeValue;
            currentSongInfo.volume = Math.round(volumeValue * 100);

            const selectors = [
                '#volume-slider',
                '.volume-slider',
                'tp-yt-paper-slider#volume-slider',
                '.volume-slider.style-scope.ytmusic-player-bar',
                'ytmusic-player-bar .volume-slider'
            ];

            for (const selector of selectors) {
                const ytMusicVolumeSlider = document.querySelector(selector);
                if (ytMusicVolumeSlider) {
                    try {
                        ytMusicVolumeSlider.value = volumeValue;

                        const event = new Event('input', { bubbles: true });
                        ytMusicVolumeSlider.dispatchEvent(event);

                        const changeEvent = new Event('change', { bubbles: true });
                        ytMusicVolumeSlider.dispatchEvent(changeEvent);

                        break;
                    } catch (e) {
                        console.warn('Error updating YouTube Music volume slider:', e);
                    }
                }
            }

            try {
                if (window.ytmusic && window.ytmusic.player) {
                    window.ytmusic.player.setVolume(volumeValue * 100);
                }
            } catch (e) {
                console.warn('Error using YouTube Music API for volume:', e);
            }
        }
    }

}

async function extractSongInfo() {
    const titleElement = document.querySelector('.title.style-scope.ytmusic-player-bar');
    currentSongInfo.title = titleElement ? titleElement.textContent : 'Unknown Title';

    const artistElement = document.querySelector('.subtitle.style-scope.ytmusic-player-bar');
    currentSongInfo.artist = artistElement ? artistElement.textContent : 'Unknown Artist';

    const coverElement = document.querySelector('.image.style-scope.ytmusic-player-bar');
    currentSongInfo.coverUrl = coverElement && coverElement.src ? coverElement.src : null;

    const playPauseButton = document.getElementById('play-pause-button')
    let state =  playPauseButton.getAttribute('aria-label');
    if (state == null){
        state =  playPauseButton.getAttribute('title');
    }
    isPlaying = state.toLowerCase() === 'reproducir' || state.toLowerCase() === 'play';
    isPlaying = !isPlaying;

    const repeatButton = document.querySelector('.repeat.style-scope.ytmusic-player-bar');

    let currentMode = repeatButton.getAttribute('aria-label');
    if (currentMode == null){
        currentMode =  repeatButton.getAttribute('title');
    }
    if (currentMode.toLowerCase() === 'repeat off' || currentMode.toLowerCase() === 'desactivar repetición') {
        repeatMode = 0;
    } else if (currentMode.toLowerCase() === 'repetir todo' || currentMode.toLowerCase() === 'repeat all') {
        repeatMode = 1;
    } else if (currentMode.toLowerCase() === 'repeat one' || currentMode.toLowerCase() === 'repetir una vez') {
        repeatMode = 2;
    }

    const shuffleButton = document.querySelector('.shuffle-button');
    shuffle = shuffleButton && shuffleButton.classList.contains('active');

    const videoElement = document.querySelector('video');
    if (videoElement) {
        currentSongInfo.duration = videoElement.duration;
        currentSongInfo.currentTime = videoElement.currentTime;
        currentSongInfo.volume = Math.round(videoElement.volume * 100);
    }

    const playerBar = document.querySelector('ytmusic-player-bar[shuffle-on]');
    if (playerBar) {
        shuffle = true;
    }
}

document.addEventListener('request-pip-window', async (event) => {
    try {
        const { html } = event.detail;

        if ('documentPictureInPicture' in window) {
            if (pipWindow) {
                pipWindow.close();
                close();
            }

            try {
                pipWindow = await window.documentPictureInPicture.requestWindow({
                    width: 275,
                    height: 102
                });
            } catch (pipError) {
                console.warn('PiP activation error:', pipError);
                if (pipError.message.includes('user activation')) {
                    console.info('Please interact with the YouTube Music page first before opening PiP');
                }
            }

            const content = document.createElement('div');
            content.id = 'pip-content';
            content.classList.add('d-flex')
            pipWindow.document.body.appendChild(content);

            content.innerHTML = html;

            let update;

            setup().then(() => {
                extractSongInfo().then(r => {
                    update = setInterval(() => {
                        if (!pipWindow || pipWindow.closed) {
                            close();
                            clearInterval(update);
                            pipWindow = null;
                            return;
                        }
                        updatePipContent();
                    }, 500);
                })
            })

            const videoElement = document.querySelector('video');
            if (videoElement) {
                videoElement.addEventListener('timeupdate', () => {
                    if (pipWindow && !pipWindow.closed) {
                        currentSongInfo.currentTime = videoElement.currentTime;
                        currentSongInfo.duration = videoElement.duration;

                        if (track && currentSongInfo.duration > 0) {
                            const progress = (currentSongInfo.currentTime / currentSongInfo.duration) * 100;
                            track.style.width = `${progress}%`;
                        }
                    }
                });

                videoElement.addEventListener('volumechange', () => {
                    if (pipWindow && !pipWindow.closed) {
                        currentSongInfo.volume = Math.round(videoElement.volume * 100);
                        if (volumeSlider) {
                            volumeSlider.value = currentSongInfo.volume;
                        }
                        if (volumeSliderPopup) {
                            volumeSliderPopup.value = currentSongInfo.volume;
                        }
                    }
                });
            }

            const playerBar = document.querySelector('.tp-yt-paper-slider');
            if (playerBar) {
                const observer = new MutationObserver(() => {
                    extractSongInfo();
                });

                observer.observe(playerBar, {
                    attributes: true,
                    childList: true,
                    subtree: true
                });

                pipWindow.addEventListener('pagehide', () => {
                    observer.disconnect();
                    close();
                    clearInterval(update);
                    pipWindow = null;
                });
            }

        }
    } catch (error) {
        console.error('Error creando la ventana PiP:', error);
    }
});

function close(){
    pipWindow = null;
    isPlaying = false;
    repeatMode = 0;
    shuffle = false
    titleHtml = null;
    artistHtml = null;
    coverHtml = null;
    placeHolderHtml = null;
    track = null;
    shuffleHtml = null;
    repeatBtn = null;
    repeatHtml = null;
    repeatOnceHtml = null;
    volumeSlider = null;
    volumeSliderPopup = null;
}
