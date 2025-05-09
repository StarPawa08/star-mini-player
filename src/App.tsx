import "./App.css";
import { useCallback, useState, useEffect } from "react";
import {MiniPlayerHtml} from "./components/MiniPlayer.tsx";

function App() {
    const [isYouTubeMusic, setIsYouTubeMusic] = useState(false);
    const [currentTab, setCurrentTab] = useState<chrome.tabs.Tab | null>(null);
    const [status, setStatus] = useState("Ready");

    // Función para añadir a playlist desde la pestaña de YTM
    const addToPlaylist = useCallback(async () => {
        try {
            // Buscar pestañas de YouTube Music
            const tabs = await chrome.tabs.query({ url: "*://music.youtube.com/*" });
            
            if (tabs.length === 0) {
                console.warn("Pestaña de YouTube Music no encontrada.");
                alert("Para añadir a una playlist, por favor, abre YouTube Music primero.");
                return false;
            }
            
            const ytmTab = tabs[0]; // Usar la primera pestaña de YTM encontrada
            
            // Ejecutar la función de clics en la pestaña de YTM
            const injectionResults = await chrome.scripting.executeScript({
                target: { tabId: ytmTab.id! },
                func: function addToPlaylistInYTM() {
                    // Esta función se ejecuta en el contexto de la pestaña de YouTube Music
                    function clickAddToPlaylist() {
                        // Intenta acceder al botón "Añadir a playlist"
                        let botonesNavegacion = document.querySelectorAll<HTMLElement>("#navigation-endpoint");
                        const botonAnadirAPlaylistDirecto = botonesNavegacion.length > 1 ? botonesNavegacion[1] : null;

                        // Verifica si el botón ya está visible
                        if (botonAnadirAPlaylistDirecto && botonAnadirAPlaylistDirecto.offsetParent !== null) {
                            botonAnadirAPlaylistDirecto.click();
                            return true; // Éxito
                        } else {
                            // Si no, intenta abrir el menú de opciones primero
                            const rootElement = document.getElementsByClassName("middle-controls-buttons style-scope ytmusic-player-bar")[0];
                            if (!rootElement) {
                                console.error("YTMusic Helper: No se encontró el elemento raíz de los controles.");
                                return false; // Fallo
                            }

                            const botonMenu = rootElement.querySelector<HTMLElement>(".menu button"); // Botón de tres puntos
                            if (!botonMenu) {
                                console.error("YTMusic Helper: No se encontró el botón de menú.");
                                return false; // Fallo
                            }

                            botonMenu.click(); // Abre el menú.
                            botonMenu.click(); // Doble click para asegurar apertura

                            // Devuelve una Promesa porque hay un setTimeout involucrado
                            return new Promise((resolve) => {
                                setTimeout(() => {
                                    // Reintentamos encontrar el botón "Añadir a playlist" después de abrir el menú
                                    botonesNavegacion = document.querySelectorAll("#navigation-endpoint");
                                    const botonAnadirEnMenu = botonesNavegacion.length > 1 ? botonesNavegacion[1] : null;

                                    if (botonAnadirEnMenu) {
                                        botonAnadirEnMenu.click();
                                        resolve(true); // Éxito
                                    } else {
                                        console.error("YTMusic Helper: No se encontró el botón 'Añadir a playlist' en el menú tras el retraso.");
                                        resolve(false); // Fallo
                                    }
                                }, 500); // Retraso de 500ms para que aparezca el menú
                            });
                        }
                    }

                    return clickAddToPlaylist();
                }
            });

            // Verificar el resultado de la inyección
            if (injectionResults && injectionResults[0] && injectionResults[0].result) {
                // Si los clics fueron exitosos, enfocar la pestaña y su ventana
                await chrome.tabs.update({openerTabId: ytmTab.id!, active: true }); // Activa la pestaña
                await chrome.windows.update(ytmTab.windowId, { focused: true }); // Trae la ventana al frente
                console.log("Acción 'Añadir a playlist' iniciada en YouTube Music. La pestaña ha sido enfocada.");
                return true;
            } else {
                console.error("No se pudo completar la acción 'Añadir a playlist' en YouTube Music.");
                return false;
            }
        } catch (error) {
            console.error("Error general al intentar añadir a playlist:", error);
            return false;
        }
    }, []);

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

        // Configurar el listener de mensajes para comunicarse con el content script
        const messageListener = (message: unknown, _sender: chrome.runtime.MessageSender, sendResponse: (response?: unknown) => void) => {
            if ((message as { action: string }).action === "addToPlaylist") {
                addToPlaylist().then(success => {
                    sendResponse({ success });
                });
                return true; // Indica que la respuesta se enviará asincrónicamente
            }
        };
        
        chrome.runtime.onMessage.addListener(messageListener);
        
        // Limpieza al desmontar
        return () => {
            chrome.runtime.onMessage.removeListener(messageListener);
        };
    }, [addToPlaylist]);

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