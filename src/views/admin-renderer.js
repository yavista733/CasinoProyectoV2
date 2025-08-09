// src/views/admin-renderer.js
const { ipcRenderer } = require('electron');

// --- ELEMENTOS DEL DOM ---
const logoutButton = document.getElementById('logout-btn');
const clientesTableBody = document.getElementById('clientes-table-body');
const juegosTableBody = document.getElementById('juegos-table-body');
const addGameBtn = document.getElementById('add-game-btn');

// Modal de Juegos
const gameModal = document.getElementById('game-modal');
const gameModalTitle = document.getElementById('game-modal-title');
const gameForm = document.getElementById('game-form');
const cancelGameBtn = document.getElementById('cancel-game-btn');
const gameIdInput = document.getElementById('game-id-input');
const nombreJuegoInput = document.getElementById('nombre_juego');
const descripcionInput = document.getElementById('descripcion');


// --- FUNCIONES DE RENDERIZADO ---
function renderClientes(clientes) {
    clientesTableBody.innerHTML = '';
    if (!clientes || clientes.length === 0) return;
    clientes.forEach(cliente => {
        const row = document.createElement('tr');
        row.className = 'border-b border-gray-700';
        row.innerHTML = `
            <td class="py-2 px-4">${cliente.id}</td>
            <td class="py-2 px-4">${cliente.nombre}</td>
            <td class="py-2 px-4">${cliente.dni}</td>
            <td class="py-2 px-4">${cliente.usuario}</td>
            <td class="py-2 px-4">${cliente.correo_electronico || 'No especificado'}</td>
        `;
        clientesTableBody.appendChild(row);
    });
}

function renderJuegos(juegos) {
    juegosTableBody.innerHTML = '';
    if (!juegos || juegos.length === 0) return;
    juegos.forEach(juego => {
        const row = document.createElement('tr');
        row.className = 'border-b border-gray-700';
        const disponibleText = juego.disponible ? 'Sí' : 'No';
        const toggleButtonText = juego.disponible ? 'Desactivar' : 'Activar';
        const toggleButtonClass = juego.disponible ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700';

        row.innerHTML = `
            <td class="py-2 px-4">${juego.id}</td>
            <td class="py-2 px-4">${juego.nombre_juego}</td>
            <td class="py-2 px-4">${juego.descripcion}</td>
            <td class="py-2 px-4">${disponibleText}</td>
            <td class="py-2 px-4">
                <button data-id="${juego.id}" class="edit-game-btn bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded-lg mr-2">Editar</button>
                <button data-id="${juego.id}" data-disponible="${juego.disponible}" class="toggle-game-btn ${toggleButtonClass} text-white font-bold py-1 px-3 rounded-lg">${toggleButtonText}</button>
            </td>
        `;
        juegosTableBody.appendChild(row);
    });
}


// --- PETICIONES INICIALES DE DATOS ---
window.addEventListener('DOMContentLoaded', () => {
    ipcRenderer.send('get-all-clients');
    ipcRenderer.send('get-all-games-admin');
});


// --- RECEPCIÓN DE DATOS ---
ipcRenderer.on('all-clients-response', (event, clientes) => renderClientes(clientes));
ipcRenderer.on('all-games-admin-response', (event, juegos) => renderJuegos(juegos));
// Cuando un juego se actualiza, pedimos la lista de nuevo para refrescar la tabla
ipcRenderer.on('game-updated', () => ipcRenderer.send('get-all-games-admin'));


// --- MANEJO DE EVENTOS DE LA INTERFAZ ---
logoutButton.addEventListener('click', () => ipcRenderer.send('logout-request'));

// Abrir modal para añadir juego nuevo
addGameBtn.addEventListener('click', () => {
    gameModalTitle.textContent = 'Añadir Nuevo Juego';
    gameForm.reset();
    gameIdInput.value = ''; // Asegurarse que no haya ID
    gameModal.style.display = 'block';
});

// Abrir modal para editar o cambiar disponibilidad
juegosTableBody.addEventListener('click', e => {
    const target = e.target;
    const gameId = target.getAttribute('data-id');

    if (target.classList.contains('edit-game-btn')) {
        // Pedimos los detalles del juego específico
        ipcRenderer.once('game-details-response', (event, juego) => {
            gameModalTitle.textContent = 'Editar Juego';
            gameIdInput.value = juego.id;
            nombreJuegoInput.value = juego.nombre_juego;
            descripcionInput.value = juego.descripcion;
            gameModal.style.display = 'block';
        });
        ipcRenderer.send('get-game-details', gameId);
    }
    
    if (target.classList.contains('toggle-game-btn')) {
        // El valor 'disponible' viene como string '0' o '1', lo convertimos a booleano
        const disponible = target.getAttribute('data-disponible') === '1';
        ipcRenderer.send('toggle-game-availability', { id: gameId, disponible: !disponible });
    }
});

// Cerrar modal
cancelGameBtn.addEventListener('click', () => gameModal.style.display = 'none');

// Enviar formulario del modal (para añadir o editar)
gameForm.addEventListener('submit', e => {
    e.preventDefault();
    const gameData = {
        id: gameIdInput.value, // Estará vacío si es nuevo
        nombre_juego: nombreJuegoInput.value,
        descripcion: descripcionInput.value
    };

    if (gameData.id) { // Si hay ID, es una actualización
        ipcRenderer.send('update-game', gameData);
    } else { // Si no, es un juego nuevo
        ipcRenderer.send('add-game', gameData);
    }
    gameModal.style.display = 'none';
});
