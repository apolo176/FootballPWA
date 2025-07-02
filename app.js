if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js")
    .then(() => console.log("Service Worker registrado"))
    .catch(error => console.error("Error al registrar SW:", error));
}

let db;
const request = indexedDB.open("temporadaDB", 1);

request.onerror = () => console.error("Error al abrir IndexedDB");
request.onsuccess = () => db = request.result;

request.onupgradeneeded = (event) => {
  db = event.target.result;
  const jugadoresStore = db.createObjectStore("jugadores", { keyPath: "id", autoIncrement: true });
  jugadoresStore.createIndex("nombre", "nombre", { unique: false });
};

// Función de ejemplo: añadir jugador
function registrarJugador() {
  const nombre = prompt("Nombre del jugador:");
  const tx = db.transaction("jugadores", "readwrite");
  const store = tx.objectStore("jugadores");
  store.add({ nombre });
}