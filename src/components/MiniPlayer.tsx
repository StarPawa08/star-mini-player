import ReactDomServer from "react-dom/server";

// language=CSS
const css = `
:root{
    --default-back-color : #EADDFF;
    --default-text-color : #4F378A;
    --default-text-secondary-color: #625B71;
}

#mini-player-root {
    width: 100%;
    height: 100%;
    background-color: var(--default-back-color);
    color: var(--default-text-color);
    font-family: Arial, sans-serif;
    display: flex;
    flex-direction: column;
    border-radius: 10px;
    transition: all 0.2s ease-in-out;
    overflow: hidden;
}

body{
    background-color: var(--default-back-color);
    margin: 5px;
    overflow: hidden;
    box-sizing: border-box;
}

* {
    box-sizing: inherit;
}

.volume-icon {
    color: var(--default-text-color);
    cursor: pointer;
}

/* Horizontal slider (default view) */
.volume-slider {
    flex-grow: 1;
    height: 4px;
    -webkit-appearance: none;
    background-color: #333;
    outline: none;
    border-radius: 2px;
    transition: opacity 0.3s;
}

/* Removed redundant volume-btn styling */

/* Volume slider container */
.volume-container {
    position: relative;
    color: var(--default-text-color);
    background: none;
    border: none;
    border-radius: 10px;
    font-size: 18px;
    cursor: pointer;
    transition: all 0.2s ease-in-out;
    display: flex;
    align-items: center;
    justify-content: center;
}

.volume-container:hover {
    color: #58428d;
    background-color: #c4bad3;
}

.volume-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
}

.volume-popup {
    position: absolute;
    display: flex;
    flex-direction: row;
    align-items: center;
    width: 80px;
    left: 24px; /* Position to the right of the volume icon */
    top: 50%;
    transform: translateY(-50%);
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.3s ease, visibility 0.3s ease;
    z-index: 10;
    background-color: var(--default-back-color);
    border-radius: 4px;
    padding: 4px;
}

.volume-container:hover .volume-popup {
    opacity: 1;
    visibility: visible;
}

/* Volume slider styling */
.volume-slider-popup {
    -webkit-appearance: none;
    width: 100%;
    height: 4px;
    background-color: #333;
    outline: none;
    border-radius: 2px;
}

.volume-slider::-webkit-slider-thumb,
.volume-slider-popup::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background-color: #2e50ff;
    cursor: pointer;
}

.volume-slider::-moz-range-thumb,
.volume-slider-popup::-moz-range-thumb {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background-color: #2e50ff;
    cursor: pointer;
    border: none;
}

.player-header {
    text-align: left;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    display: flex;
    flex-direction: column;
    margin-bottom: 5px;
    width: 100%;
}

.song-title {
    flex-shrink: 1;
    font-weight: bold;
    font-size: 12px;
    max-width: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-top: 1px;
    padding: 0;
    margin-bottom: 4px;
}

.song-artist {
    flex-shrink: 1;
    font-size: 10px;
    max-width: 100%;
    color: var(--default-text-secondary-color);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-top: 0;
    margin-bottom: 2px;
}

.player-body {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: nowrap;
    gap: 8px;
    padding: 0 5px;
    max-height: 100%;
}

.cover {
    width: 40px;
    height: 40px;
    min-width: 40px;
    overflow: hidden;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--default-text-color);
    position: relative;
    cursor: pointer;
}

.cover .add-to-playlist-btn {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s ease-in-out;
    border-radius: 8px;
}

.cover:hover .add-to-playlist-btn {
    opacity: 1;
}

.cover img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.cover-placeholder {
    width: 40px;
    height: 40px;
    background-color: var(--default-text-color);
    border-radius: 8px;
}

.controls {
    display: flex;
    align-items: center;
    justify-content: space-evenly;
    gap: 8px;
    flex-wrap: nowrap;
    flex-grow: 1;
}

.control-btn {
    color: var(--default-text-color);
    background: none;
    border: none;
    border-radius: 10px;
    font-size: 18px;
    cursor: pointer;
    transition: all 0.2s ease-in-out;
}

.control-btn > svg{
    vertical-align: middle;
    horiz-align: center;
}

.hide{
    display: none;
}

.control-btn:hover {
    color: #58428d;
    background-color: #c4bad3;
}

.control-btn.active {
    color: #2e50ff;
}

.d-flex{
    display: flex;
}

.pause{
    margin-left: 1px;
    margin-right: 1px;
}

.progress-container {
    width: 100%;
    height: 4px;
    background-color: #333;
    margin-top: 5px;
    border-radius: 2px;
    overflow: hidden;
}

.progress-bar-fill {
    height: 100%;
    background-color: #2e50ff;
    width: 0;
    transition: width 0.5s;
    border-radius: 2px;
}

/* Responsive design improvements */
@media (max-width: 320px) {
    .volume-popup {
        width: 60px;
    }

    .controls {
        gap: 4px;
    }
}

@media (max-width: 280px) {
    .repeat-btn {
        display: none;
    }
}

@media (max-width: 240px) {
    .shuffle {
        display: none;
    }

    .volume-popup {
        width: 50px;
    }
}

@media (max-height: 90px) {
    .song-artist {
        display: none;
    }
}

@media (max-height: 80px) {
    .song-title {
        display: none;
    }
    .player-header{
        margin: 0;
    }
}

@media (max-height: 60px) {
    .progress-container {
        display: none;
    }
}

`

const MiniPlayer = () => {
    return (
        <div id="mini-player-root">
            <style>{css}</style>
            <div className="player-header">
                <p id="title" className="song-title">Nothing is playing</p>
                <p id="artist" className="song-artist">play a song to activate me!</p>
            </div>
            <div className="player-body">
                <div className="cover">
                    <img id="cover" src="" alt="imagen" className="hide"/>
                    <div id="noCover" className="cover-placeholder"></div>
                    <div className="add-to-playlist-btn" id="add-to-playlist">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" 
                             stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                    </div>
                </div>

                <div className="controls">
                    <div className="volume-container">
                        <div className="volume-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" 
                                 stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                                <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                            </svg>
                        </div>
                        <div className="volume-popup">
                            <input 
                                id="volume-slider-popup" 
                                type="range" 
                                min="0" 
                                max="100" 
                                defaultValue="100" 
                                className="volume-slider-popup" 
                            />
                        </div>
                    </div>
                    <button className="control-btn shuffle">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                             stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="16 3 21 3 21 8"></polyline>
                            <line x1="4" y1="20" x2="21" y2="3"></line>
                            <polyline points="21 16 21 21 16 21"></polyline>
                            <line x1="15" y1="15" x2="21" y2="21"></line>
                            <line x1="4" y1="4" x2="9" y2="9"></line>
                        </svg>
                    </button>
                    <button className="control-btn prev">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                             stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polygon points="19 20 9 12 19 4 19 20"></polygon>
                            <line x1="5" y1="19" x2="5" y2="5"></line>
                        </svg>
                    </button>
                    <button id="playPause" className="control-btn play-pause">
                        <svg id="play" className="" xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                             viewBox="0 0 24 24" fill="currentColor">
                            <polygon points="6 3 20 12 6 21 6 3"></polygon>
                        </svg>
                        <svg id="pause" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
                             fill="currentColor" className="hide pause">
                            <rect x="6" y="4" width="4" height="16"></rect>
                            <rect x="14" y="4" width="4" height="16"></rect>
                        </svg>
                    </button>
                    <button className="control-btn next">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                             stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polygon points="5 4 15 12 5 20 5 4"></polygon>
                            <line x1="19" y1="5" x2="19" y2="19"></line>
                        </svg>
                    </button>
                    <button className="control-btn repeat-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                             stroke="currentColor" stroke-width="2" stroke-linecap="round" className="repeat" stroke-linejoin="round">
                            <path d="M17 2l4 4-4 4"></path>
                            <path d="M3 11v-1a4 4 0 0 1 4-4h14"></path>
                            <path d="M7 22l-4-4 4-4"></path>
                            <path d="M21 13v1a4 4 0 0 1-4 4H3"></path>
                        </svg>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" className="hide repeatOnce" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M17 2l4 4-4 4"></path>
                            <path d="M3 11v-1a4 4 0 0 1 4-4h14"></path>
                            <path d="M7 22l-4-4 4-4"></path>
                            <path d="M21 13v1a4 4 0 0 1-4 4H3"></path>
                            <text x="12" y="14" font-size="6" text-anchor="middle" fill="currentColor" font-weight="normal" font-family="Arial, sans-serif">1</text>
                        </svg>
                    </button>
                </div>
            </div>
            <div className="progress-container">
                <div id="track" className="progress-bar-fill"></div>
            </div>
        </div>
    );
};

export const MiniPlayerHtml = ReactDomServer.renderToString(
    <MiniPlayer/>
);
