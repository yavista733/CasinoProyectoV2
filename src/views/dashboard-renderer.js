// src/views/dashboard-renderer.js
const { ipcRenderer } = require('electron');

// --- DATOS DEL MENÚ ---
const MENU = {
    bebidas: [
        { id: 'b1', nombre: 'Pisco Sour', precio: 25.00 }, { id: 'b2', nombre: 'Chilcano de Pisco', precio: 22.00 },
        { id: 'b3', nombre: 'Cerveza Cusqueña', precio: 15.00 }, { id: 'b4', nombre: 'Copa de Vino', precio: 20.00 },
        { id: 'b5', nombre: 'Whisky Johnnie Walker E.N.', precio: 35.00 }, { id: 'b6', nombre: 'Gaseosa (Inca/Coca)', precio: 8.00 }
    ],
    platos: [
        { id: 'p1', nombre: 'Lomo Saltado', precio: 45.00 }, { id: 'p2', nombre: 'Ceviche Clásico', precio: 48.00 },
        { id: 'p3', nombre: 'Ají de Gallina', precio: 40.00 }, { id: 'p4', nombre: 'Causa Rellena', precio: 35.00 },
        { id: 'p5', nombre: 'Anticuchos de Corazón', precio: 38.00 }
    ]
};

// --- ESTADO DE LA APLICACIÓN ---
let currentClient = {}; // Guardará toda la info del cliente: id, nombre, telefono, etc.
let carrito = {};

// --- ELEMENTOS DEL DOM ---
const welcomeMessage = document.getElementById('welcome-message');
const juegosContainer = document.getElementById('juegos-disponibles');
const reservasTableBody = document.getElementById('reservas-table-body');
const menuBebidasContainer = document.getElementById('menu-bebidas');
const menuPlatosContainer = document.getElementById('menu-platos');
const logoutButton = document.getElementById('logout-btn');
const reservaModal = document.getElementById('reserva-modal');
const reservaForm = document.getElementById('reserva-form');
const cancelReservaBtn = document.getElementById('cancel-reserva-btn');
const juegoIdInput = document.getElementById('juego-id-input');
const modalMensaje = document.getElementById('modal-mensaje');

// Elementos del modal de requerimientos
const supportBtn = document.getElementById('support-btn');
const requerimientoModal = document.getElementById('requerimiento-modal');
const requerimientoForm = document.getElementById('requerimiento-form');
const cancelRequerimientoBtn = document.getElementById('cancel-requerimiento-btn');
const requerimientoModalMensaje = document.getElementById('requerimiento-modal-mensaje');


// --- FUNCIONES DE RENDERIZADO ---
function renderJuegos(juegos) {
    juegosContainer.innerHTML = '';
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
            <button data-id="${juego.id}" class="reservar-btn mt-4 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-2 px-4 rounded-lg">Reservar</button>
        `;
        juegosContainer.appendChild(juegoCard);
    });
}

function renderReservas(reservas) {
    reservasTableBody.innerHTML = '';
    if (!reservas || reservas.length === 0) {
        reservasTableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4">Aún no tienes reservas.</td></tr>';
        return;
    }
    reservas.forEach(reserva => {
        const row = document.createElement('tr');
        row.className = 'border-b border-gray-700';
        let accionesHtml = '';
        if (reserva.estado === 'activa') {
            accionesHtml = `<button data-id="${reserva.id}" class="cancel-reservation-btn bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded-lg">Cancelar</button>`;
        }
        row.innerHTML = `
            <td class="py-2 px-4">${reserva.nombre_juego}</td>
            <td class="py-2 px-4">${reserva.fecha_reserva}</td>
            <td class="py-2 px-4">${reserva.hora_reserva}</td>
            <td class="py-2 px-4 capitalize">${reserva.estado}</td>
            <td class="py-2 px-4">${accionesHtml}</td>
        `;
        reservasTableBody.appendChild(row);
    });
}

function renderizarMenu(items, container) {
    container.innerHTML = '';
    items.forEach(item => {
        const cantidad = carrito[item.id] || 0;
        const itemHtml = `
            <div class="flex justify-between items-center border-b border-gray-700 pb-2">
                <div>
                    <p class="font-semibold">${item.nombre}</p>
                    <p class="text-sm text-gray-400">S/ ${item.precio.toFixed(2)}</p>
                </div>
                <div class="flex items-center gap-3">
                    <button data-id="${item.id}" class="op-btn remove-item-btn bg-red-600 w-8 h-8 rounded-full font-bold text-lg">-</button>
                    <span id="qty-${item.id}" class="font-bold w-5 text-center text-lg">${cantidad}</span>
                    <button data-id="${item.id}" class="op-btn add-item-btn bg-green-600 w-8 h-8 rounded-full font-bold text-lg">+</button>
                </div>
            </div>
        `;
        container.innerHTML += itemHtml;
    });
}

function renderizarCarrito() {
    const pedidoItemsContainer = document.getElementById('pedido-items');
    pedidoItemsContainer.innerHTML = '';
    if (Object.keys(carrito).length === 0) {
        pedidoItemsContainer.innerHTML = '<p class="text-gray-400">No has añadido items al pedido.</p>';
        return;
    }
    for (const itemId in carrito) {
        const todosLosItems = [...MENU.bebidas, ...MENU.platos];
        const item = todosLosItems.find(i => i.id === itemId);
        if (item) {
            pedidoItemsContainer.innerHTML += `<p>${carrito[itemId]}x ${item.nombre}</p>`;
        }
    }
}


// --- LÓGICA DE COMUNICACIÓN (IPC) ---
ipcRenderer.on('client-data', (event, client) => {
    currentClient = client; // Guardamos toda la info del cliente
    welcomeMessage.textContent = `¡Bienvenido, ${currentClient.nombre}!`;
    ipcRenderer.send('get-available-games');
    ipcRenderer.send('get-my-reservas', currentClient.id);
    renderizarMenu(MENU.bebidas, menuBebidasContainer);
    renderizarMenu(MENU.platos, menuPlatosContainer);
});

ipcRenderer.on('available-games-response', (event, juegos) => renderJuegos(juegos));
ipcRenderer.on('my-reservas-response', (event, reservas) => renderReservas(reservas));
ipcRenderer.on('reservation-cancelled', () => ipcRenderer.send('get-my-reservas', currentClient.id));

ipcRenderer.on('reservation-response', (event, response) => {
    modalMensaje.textContent = response.message;
    if (response.success) {
        modalMensaje.style.color = '#34D399';
        carrito = {};
        renderizarMenu(MENU.bebidas, menuBebidasContainer);
        renderizarMenu(MENU.platos, menuPlatosContainer);
        ipcRenderer.send('get-my-reservas', currentClient.id);
        setTimeout(() => { reservaModal.style.display = 'none'; }, 2000);
    } else {
        modalMensaje.style.color = '#F87171';
    }
});

ipcRenderer.on('requerimiento-response', (event, response) => {
    const tipoSeleccionado = document.getElementById('req-tipo').value;
    requerimientoModalMensaje.textContent = `${tipoSeleccionado} enviado. Se adjuntó copia al correo del cliente.`;
    requerimientoModalMensaje.style.color = '#34D399';
    
    setTimeout(() => {
        requerimientoModal.style.display = 'none';
    }, 2500);
});


// --- MANEJO DE EVENTOS ---
logoutButton.addEventListener('click', () => ipcRenderer.send('logout-request'));

juegosContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('reservar-btn')) {
        juegoIdInput.value = e.target.getAttribute('data-id');
        renderizarCarrito();
        reservaForm.reset();
        modalMensaje.textContent = '';
        reservaModal.style.display = 'block';
    }
});

function handleMenuClick(event) {
    const target = event.target;
    if (!target.classList.contains('op-btn')) return;

    const itemId = target.getAttribute('data-id');
    let cantidadActual = carrito[itemId] || 0;

    if (target.classList.contains('add-item-btn')) {
        cantidadActual++;
    } else if (target.classList.contains('remove-item-btn')) {
        cantidadActual = Math.max(0, cantidadActual - 1);
    }

    if (cantidadActual > 0) {
        carrito[itemId] = cantidadActual;
    } else {
        delete carrito[itemId];
    }

    document.getElementById(`qty-${itemId}`).textContent = cantidadActual;
}

menuBebidasContainer.addEventListener('click', handleMenuClick);
menuPlatosContainer.addEventListener('click', handleMenuClick);

cancelReservaBtn.addEventListener('click', () => { reservaModal.style.display = 'none'; });

reservaForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const pedidoBebidas = {};
    const pedidoComidas = {};
    for(const itemId in carrito) {
        if(itemId.startsWith('b')) {
            pedidoBebidas[itemId] = carrito[itemId];
        } else if (itemId.startsWith('p')) {
            pedidoComidas[itemId] = carrito[itemId];
        }
    }

    const nuevaReserva = {
        cliente_id: currentClient.id,
        juego_id: juegoIdInput.value,
        fecha_reserva: document.getElementById('fecha-reserva').value,
        hora_reserva: document.getElementById('hora-reserva').value,
        pedido_comidas: JSON.stringify(pedidoComidas),
        pedido_bebidas: JSON.stringify(pedidoBebidas)
    };
    ipcRenderer.send('create-reservation', nuevaReserva);
});

reservasTableBody.addEventListener('click', (e) => {
    if (e.target.classList.contains('cancel-reservation-btn')) {
        ipcRenderer.send('cancel-reservation', e.target.getAttribute('data-id'));
    }
});

// Manejo de eventos para el modal de requerimientos
supportBtn.addEventListener('click', () => {
    // Rellenar el formulario con los datos del cliente
    document.getElementById('req-nombre').value = currentClient.nombre || '';
    document.getElementById('req-correo').value = currentClient.correo_electronico || 'No especificado';
    document.getElementById('req-telefono').value = currentClient.telefono || 'No especificado';
    
    // Limpiar campos y mensajes
    requerimientoForm.reset(); // Esto limpia el mensaje y el tipo, pero los campos de arriba se vuelven a llenar
    document.getElementById('req-mensaje').value = ''; // Asegurarse que el textarea esté vacío
    requerimientoModalMensaje.textContent = '';

    // Mostrar el modal
    requerimientoModal.style.display = 'block';
});

cancelRequerimientoBtn.addEventListener('click', () => {
    requerimientoModal.style.display = 'none';
});

requerimientoForm.addEventListener('submit', e => {
    e.preventDefault();
    const data = {
        cliente_id: currentClient.id,
        tipo: document.getElementById('req-tipo').value,
        mensaje: document.getElementById('req-mensaje').value
    };
    ipcRenderer.send('submit-requerimiento', data);
});
