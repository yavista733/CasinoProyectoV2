// dashboard-renderer.js
const { ipcRenderer } = require('electron');

// --- VARIABLES GLOBALES ---
let currentClientId = null;
const welcomeMessage = document.getElementById('welcome-message');
const juegosContainer = document.getElementById('juegos-disponibles');
const reservasTableBody = document.getElementById('reservas-table-body');
const logoutButton = document.getElementById('logout-btn');

// Modal y formulario de reserva
const reservaModal = document.getElementById('reserva-modal');
const reservaForm = document.getElementById('reserva-form');
const cancelReservaBtn = document.getElementById('cancel-reserva-btn');
const juegoIdInput = document.getElementById('juego-id-input');
const modalMensaje = document.getElementById('modal-mensaje');


// --- FUNCIONES PARA RENDERIZAR DATOS ---

// Función para mostrar los juegos disponibles en tarjetas
function renderJuegos(juegos) {
    juegosContainer.innerHTML = ''; // Limpiar contenedor
    if (!juegos || juegos.length === 0) {
        juegosContainer.innerHTML = '<p>No hay juegos disponibles en este momento.</p>';
        return;
    }
    juegos.forEach(juego => {
        const juegoCard = document.createElement('div');
        juegoCard.className = 'bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col';
        juegoCard.innerHTML = `
            <h3 class="text-xl font-bold text-yellow-400 mb-2">${juego.nombre_juego}</h3>
            <p class="text-gray-400 flex-grow">${juego.descripcion}</p>
            <button data-id="${juego.id}" class="reservar-btn mt-4 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-2 px-4 rounded-lg">
                Reservar
            </button>
        `;
        juegosContainer.appendChild(juegoCard);
    });
}

// Función para mostrar las reservas del usuario en una tabla
function renderReservas(reservas) {
    reservasTableBody.innerHTML = ''; // Limpiar tabla
    if (!reservas || reservas.length === 0) {
        reservasTableBody.innerHTML = '<tr><td colspan="4" class="text-center py-4">Aún no tienes reservas.</td></tr>';
        return;
    }
    reservas.forEach(reserva => {
        const row = document.createElement('tr');
        row.className = 'border-b border-gray-700';
        row.innerHTML = `
            <td class="py-2 px-4">${reserva.nombre_juego}</td>
            <td class="py-2 px-4">${reserva.fecha_reserva}</td>
            <td class="py-2 px-4">${reserva.hora_reserva}</td>
            <td class="py-2 px-4 capitalize">${reserva.estado}</td>
        `;
        reservasTableBody.appendChild(row);
    });
}


// --- LÓGICA DE COMUNICACIÓN CON MAIN.JS (IPC) ---

// 1. Al cargar la ventana, esperamos los datos del cliente que inició sesión.
ipcRenderer.on('client-data', (event, client) => {
    currentClientId = client.id;
    welcomeMessage.textContent = `¡Bienvenido, ${client.nombre}!`;

    // Una vez que tenemos el ID del cliente, pedimos sus datos.
    ipcRenderer.send('get-available-games');
    ipcRenderer.send('get-my-reservas', currentClientId);
});

// 2. Escuchamos las respuestas y llamamos a las funciones de renderizado.
ipcRenderer.on('available-games-response', (event, juegos) => {
    renderJuegos(juegos);
});

ipcRenderer.on('my-reservas-response', (event, reservas) => {
    renderReservas(reservas);
});

// 3. Escuchamos la respuesta de la creación de reserva.
ipcRenderer.on('reservation-response', (event, response) => {
    modalMensaje.textContent = response.message;
    if (response.success) {
        modalMensaje.style.color = '#34D399'; // Verde
        // Refrescamos la lista de reservas y cerramos el modal tras un momento
        ipcRenderer.send('get-my-reservas', currentClientId);
        setTimeout(() => {
            reservaModal.style.display = 'none';
        }, 1500);
    } else {
        modalMensaje.style.color = '#F87171'; // Rojo
    }
});


// --- MANEJO DE EVENTOS DE LA INTERFAZ ---

// Evento para el botón de cerrar sesión
logoutButton.addEventListener('click', () => {
    ipcRenderer.send('logout-request');
});

// Abrir el modal de reserva (usando delegación de eventos)
juegosContainer.addEventListener('click', (e) => {
    if (e.target && e.target.classList.contains('reservar-btn')) {
        const juegoId = e.target.getAttribute('data-id');
        juegoIdInput.value = juegoId; // Guardamos el ID del juego en el input oculto
        reservaForm.reset(); // Limpiamos el formulario
        modalMensaje.textContent = ''; // Limpiamos mensajes previos
        reservaModal.style.display = 'block';
    }
});

// Cerrar el modal
cancelReservaBtn.addEventListener('click', () => {
    reservaModal.style.display = 'none';
});

// Enviar el formulario de reserva
reservaForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const nuevaReserva = {
        cliente_id: currentClientId,
        juego_id: juegoIdInput.value,
        fecha_reserva: document.getElementById('fecha-reserva').value,
        hora_reserva: document.getElementById('hora-reserva').value,
    };
    ipcRenderer.send('create-reservation', nuevaReserva);
});
