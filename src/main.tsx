import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Función para manejar mensajes del content-script cuando el popup no está abierto
// Esto es importante porque los content-scripts pueden seguir enviando mensajes
// incluso cuando el popup está cerrado
if (typeof chrome !== 'undefined' && chrome.runtime) {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.action === "addToPlaylist") {
      // Cuando se recibe un mensaje para añadir a playlist y el popup está cerrado,
      // abrimos la pestaña de YouTube Music y enfocamos la ventana
      chrome.tabs.query({ url: "*://music.youtube.com/*" }, async (tabs) => {
        if (tabs.length === 0) {
          sendResponse({ success: false, reason: "No YouTube Music tab found" });
          return;
        }

        const ytmTab = tabs[0];

        try {
          // Primero enfocamos la pestaña
          await chrome.tabs.update( {openerTabId: ytmTab.id, active: true });
          await chrome.windows.update(ytmTab.windowId, { focused: true });

          // Luego ejecutamos el script para añadir a playlist
          chrome.scripting.executeScript({
            target: { tabId: ytmTab.id! },
            func: function() {
              // Función que se ejecuta en el contexto de YouTube Music
              function clickAddToPlaylist() {
                const botonesNavegacion = document.querySelectorAll<HTMLElement>("#navigation-endpoint");
                const botonAnadirAPlaylistDirecto = botonesNavegacion.length > 1 ?
                  botonesNavegacion[1] as HTMLElement : null;

                if (botonAnadirAPlaylistDirecto && botonAnadirAPlaylistDirecto.offsetParent !== null) {
                  botonAnadirAPlaylistDirecto.click();
                  return true;
                } else {
                  const rootElement = document.getElementsByClassName("middle-controls-buttons style-scope ytmusic-player-bar")[0] as HTMLElement | undefined;
                  if (!rootElement) return false;

                  const botonMenu = rootElement.querySelector<HTMLButtonElement>(".menu button");
                  if (!botonMenu) return false;

                  botonMenu.click();
                  botonMenu.click();

                  setTimeout(() => {
                    const navButtons = document.querySelectorAll<HTMLElement>("#navigation-endpoint");
                    const botonAnadirEnMenu = navButtons.length > 1 ?
                      navButtons[1] as HTMLElement : null;

                    if (botonAnadirEnMenu) {
                      botonAnadirEnMenu.click();
                    }
                  }, 500);

                  return true;
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
          if (error instanceof Error) {
            sendResponse({ success: false, error: error.message });
          } else {
            sendResponse({ success: false, error: String(error) });
          }
        }
      });
      
      return true; // Indica que sendResponse se llamará de forma asíncrona
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
