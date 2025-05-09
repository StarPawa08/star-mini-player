// background.js - Service Worker para la extensión
// Este script maneja eventos de forma persistente, incluso cuando el popup está cerrado

// Escuchar mensajes desde content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "addToPlaylist") {
        handleAddToPlaylist(sendResponse);
        return true; // Indica que sendResponse se llamará asincrónicamente
    }
});

// Función para manejar la acción de añadir a playlist
async function handleAddToPlaylist(sendResponse) {
    try {
        // Buscar pestañas de YouTube Music
        const tabs = await chrome.tabs.query({ url: "*://music.youtube.com/*" });

        if (tabs.length === 0) {
            console.warn("Pestaña de YouTube Music no encontrada.");
            sendResponse({ success: false, reason: "No YouTube Music tab found" });
            return;
        }

        const ytmTab = tabs[0]; // Usar la primera pestaña de YTM encontrada

        // Primero enfocamos la pestaña y su ventana
        await chrome.tabs.update(ytmTab.id, { active: true });
        await chrome.windows.update(ytmTab.windowId, { focused: true });

        // Ejecutar la función de clics en la pestaña de YTM
        chrome.scripting.executeScript({
            target: { tabId: ytmTab.id },
            func: function() {
                // Esta función se ejecuta en el contexto de la pestaña de YouTube Music
                function clickAddToPlaylist() {
                    // Intenta acceder al botón "Añadir a playlist"
                    const botonesNavegacion = document.querySelectorAll("#navigation-endpoint");
                    const botonAnadirAPlaylistDirecto = botonesNavegacion.length > 1 ?
                        botonesNavegacion[1] : null;

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

                        const botonMenu = rootElement.querySelector(".menu button"); // Botón de tres puntos
                        if (!botonMenu) {
                            console.error("YTMusic Helper: No se encontró el botón de menú.");
                            return false; // Fallo
                        }

                        botonMenu.click(); // Abre el menú.
                        botonMenu.click(); // Doble click para asegurar apertura

                        // Esperamos un poco para que se abra el menú y luego intentamos hacer clic
                        setTimeout(() => {
                            const navButtons = document.querySelectorAll("#navigation-endpoint");
                            const botonAnadirEnMenu = navButtons.length > 1 ? navButtons[1] : null;

                            if (botonAnadirEnMenu) {
                                botonAnadirEnMenu.click();
                            }
                        }, 500);

                        return true; // Asumimos éxito ya que el resultado real se verá después del timeout
                    }
                }

                return clickAddToPlaylist();
            }
        }, (results) => {
            if (results && results[0] && results[0].result) {
                sendResponse({ success: true });
            } else {
                sendResponse({ success: false, reason: "Failed to execute add to playlist action" });
            }
        });
    } catch (error) {
        console.error("Error al intentar añadir a playlist:", error);
        sendResponse({ success: false, error: error.message || "Error desconocido" });
    }
}
