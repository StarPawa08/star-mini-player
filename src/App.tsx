import "./App.css";
import { useCallback, useState, useEffect } from "react";
import {MiniPlayerHtml} from "./components/MiniPlayer.tsx";

function App() {
    const [isYouTubeMusic, setIsYouTubeMusic] = useState(false);
    const [currentTab, setCurrentTab] = useState<chrome.tabs.Tab | null>(null);
    const [status, setStatus] = useState("Ready");

    useEffect(() => {
        const checkTab = async () => {
            if (typeof chrome !== 'undefined' && chrome.tabs) {
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                setCurrentTab(tab);

                if (tab.url?.includes("music.youtube.com")) {
                    setIsYouTubeMusic(true);
                } else {
                    setIsYouTubeMusic(false);
                    setStatus("Please navigate to YouTube Music");
                }
            }
        };

        checkTab();
    }, []);

    const startPiP = useCallback(async () => {
        if (!currentTab?.id || !isYouTubeMusic) return;

        try {
            setStatus("Opening mini player...");

            await chrome.scripting.executeScript({
                target: { tabId: currentTab.id },
                func: (html) => {
                    const event = new CustomEvent('request-pip-window', {
                        detail: { html }
                    });
                    document.dispatchEvent(event);
                },
                args: [MiniPlayerHtml]
            });

            setStatus("Mini player opened");
        } catch (error) {
            console.error("Error starting PiP:", error);
            setStatus("Error opening mini player");
        }
    }, [currentTab, isYouTubeMusic]);

    return (
        <div className="popup-container">
            <h1>Welcome to star's mini player! <img src={"/icons/icon16.png"} alt={""}/></h1>
            <p> This is a custom extension I made, because I thought it was really sad that youtube music didnt have a mini player like spotify, hope you like it!</p>
            <p> Feel free to report any bug or make any suggestion to my email! :D <a href="mailto:uriel_villanueva@live.com"> Click to send email </a></p>
            <p>Support me if you like my extension!</p>
            <a href="https://ko-fi.com/B0B81CSSXU" target="_blank" rel="noopener noreferrer" style={{marginBottom:2}}>
                <img
                    height="36"
                    style={{ border: 0, height: 36 }}
                    src="https://storage.ko-fi.com/cdn/kofi4.png?v=6"
                    alt="Buy Me a Coffee at ko-fi.com"
                />
            </a>
            <div className="status">
                {status}
            </div>

            <button
                onClick={startPiP}
                disabled={!isYouTubeMusic}
                className={`pip-button ${isYouTubeMusic ? 'active' : 'disabled'}`}
            >
                {isYouTubeMusic ? 'Open Mini Player' : '---'}
            </button>

            {!isYouTubeMusic && (
                <div className="info">
                    This extension only works on YouTube Music, please open youtube music to continue :D.
                    <button
                        onClick={() => {
                            if (typeof chrome !== 'undefined' && chrome.tabs) {
                                chrome.tabs.create({ url: 'https://music.youtube.com' });
                            }
                        }}
                        className="link-button"
                    >
                        Open YouTube Music
                    </button>
                </div>
            )}
        </div>
    );
}

export default App;