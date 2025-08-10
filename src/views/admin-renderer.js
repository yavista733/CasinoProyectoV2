// src/views/admin-renderer.js
const { ipcRenderer } = require('electron');

// --- DATOS DEL MENÚ ---
const MENU = {
    bebidas: [
        { id: 'b1', nombre: 'Pisco Sour' }, { id: 'b2', nombre: 'Chilcano' },
        { id: 'b3', nombre: 'Cerveza Cusqueña' }, { id: 'b4', nombre: 'Copa de Vino' },
        { id: 'b5', nombre: 'Whisky J.W. E.N.' }, { id: 'b6', nombre: 'Gaseosa' }
    ],
    platos: [
        { id: 'p1', nombre: 'Lomo Saltado' }, { id: 'p2', nombre: 'Ceviche' },
        { id: 'p3', nombre: 'Ají de Gallina' }, { id: 'p4', nombre: 'Causa Rellena' },
        { id: 'p5', nombre: 'Anticuchos' }
    ]
};

// --- ELEMENTOS DEL DOM ---
const logoutButton = document.getElementById('logout-btn');
const clientesTableBody = document.getElementById('clientes-table-body');
const juegosTableBody = document.getElementById('juegos-table-body');
const allReservasTableBody = document.getElementById('all-reservas-table-body');
const addGameBtn = document.getElementById('add-game-btn');

// Modal de Juegos
const gameModal = document.getElementById('game-modal');
const gameModalTitle = document.getElementById('game-modal-title');
const gameForm = document.getElementById('game-form');
const cancelGameBtn = document.getElementById('cancel-game-btn');
const gameIdInput = document.getElementById('game-id-input');
const nombreJuegoInput = document.getElementById('nombre_juego');
const descripcionInput = document.getElementById('descripcion');

// NUEVO: Modal de Categorías
const categoryModal = document.getElementById('category-modal');
const categoryForm = document.getElementById('category-form');
const clientIdInput = document.getElementById('client-id-input');
const clientNameModal = document.getElementById('client-name-modal');
const categorySelect = document.getElementById('category-select');
const cancelCategoryBtn = document.getElementById('cancel-category-btn');

// Pestañas
const tabs = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');


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
            <td class="py-2 px-4 font-semibold">${cliente.nombre_categoria || 'Normal'}</td>
            <td class="py-2 px-4">
                <button data-id="${cliente.id}" data-nombre="${cliente.nombre}" class="change-category-btn bg-purple-600 hover:bg-purple-700 text-white font-bold py-1 px-3 rounded-lg">
                    Cambiar
                </button>
            </td>
        `;
        clientesTableBody.appendChild(row);
    });
}

function renderJuegos(juegos) { /* ... (código sin cambios) ... */ }
function renderAllReservas(reservas) { /* ... (código sin cambios) ... */ }
// (Pega aquí tus funciones renderJuegos y renderAllReservas que ya funcionan)
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

function renderAllReservas(reservas) {
    allReservasTableBody.innerHTML = '';
    if (!reservas || reservas.length === 0) {
        allReservasTableBody.innerHTML = '<tr><td colspan="7" class="text-center py-4">No hay reservas en el sistema.</td></tr>';
        return;
    }

    reservas.forEach(reserva => {
        const row = document.createElement('tr');
        row.className = 'border-b border-gray-700';

        const formatPedido = (jsonString) => {
            if (!jsonString || jsonString === '{}') return '';
            try {
                const pedidoObj = JSON.parse(jsonString);
                const todosLosItems = [...MENU.bebidas, ...MENU.platos];
                return Object.entries(pedidoObj).map(([itemId, cantidad]) => {
                    const item = todosLosItems.find(i => i.id === itemId);
                    return `${cantidad}x ${item ? item.nombre : 'Desconocido'}`;
                }).join('<br>');
            } catch (e) { return 'Error en pedido'; }
        };

        const pedidoComidas = formatPedido(reserva.pedido_comidas);
        const pedidoBebidas = formatPedido(reserva.pedido_bebidas);
        let pedidoHtml = [pedidoComidas, pedidoBebidas].filter(Boolean).join('<br>');
        if (!pedidoHtml) pedidoHtml = 'Ninguno';

        row.innerHTML = `
            <td class="py-2 px-4">${reserva.id}</td>
            <td class="py-2 px-4">${reserva.nombre_cliente}</td>
            <td class="py-2 px-4">${reserva.nombre_juego}</td>
            <td class="py-2 px-4">${reserva.fecha_reserva}</td>
            <td class="py-2 px-4">${reserva.hora_reserva}</td>
            <td class="py-2 px-4 capitalize">${reserva.estado}</td>
            <td class="py-2 px-4 text-sm">${pedidoHtml}</td>
        `;
        allReservasTableBody.appendChild(row);
    });
}


// --- LÓGICA DE PESTAÑAS ---
function switchTab(targetId) { /* ... (código sin cambios) ... */ }
tabs.forEach(tab => { /* ... (código sin cambios) ... */ });
// (Pega aquí tu lógica de pestañas que ya funciona)
function switchTab(targetId) {
    tabContents.forEach(content => {
        content.style.display = 'none';
    });
    tabs.forEach(tab => {
        tab.classList.remove('active-tab');
    });

    document.getElementById(`content-${targetId}`).style.display = 'block';
    document.getElementById(`tab-${targetId}`).classList.add('active-tab');
}

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const targetId = tab.id.replace('tab-', '');
        switchTab(targetId);
    });
});


// --- PETICIONES INICIALES Y ESTADO INICIAL ---
window.addEventListener('DOMContentLoaded', () => {
    ipcRenderer.send('get-all-clients');
    ipcRenderer.send('get-all-reservas-admin');
    ipcRenderer.send('get-all-games-admin');
    switchTab('clientes');
});


// --- RECEPCIÓN DE DATOS ---
ipcRenderer.on('all-clients-response', (event, clientes) => renderClientes(clientes));
ipcRenderer.on('all-reservas-admin-response', (event, reservas) => renderAllReservas(reservas));
ipcRenderer.on('all-games-admin-response', (event, juegos) => renderJuegos(juegos));
ipcRenderer.on('game-updated', () => ipcRenderer.send('get-all-games-admin'));
ipcRenderer.on('client-updated', () => ipcRenderer.send('get-all-clients')); // Refrescar clientes


// --- MANEJO DE EVENTOS DE LA INTERFAZ ---
logoutButton.addEventListener('click', () => ipcRenderer.send('logout-request'));

// NUEVO: Abrir modal para cambiar categoría
clientesTableBody.addEventListener('click', e => {
    if (e.target && e.target.classList.contains('change-category-btn')) {
        const clientId = e.target.getAttribute('data-id');
        const clientName = e.target.getAttribute('data-nombre');

        // Llenar el modal con la info del cliente
        clientIdInput.value = clientId;
        clientNameModal.textContent = clientName;

        // Pedir la lista de categorías disponibles
        ipcRenderer.send('get-all-categories');
    }
});

// NUEVO: Llenar el select y mostrar el modal cuando lleguen las categorías
ipcRenderer.on('all-categories-response', (event, categorias) => {
    categorySelect.innerHTML = ''; // Limpiar opciones previas
    categorias.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = cat.nombre_categoria;
        categorySelect.appendChild(option);
    });
    categoryModal.style.display = 'block'; // Mostrar el modal
});

// NUEVO: Enviar formulario de cambio de categoría
categoryForm.addEventListener('submit', e => {
    e.preventDefault();
    const data = {
        clienteId: clientIdInput.value,
        categoriaId: categorySelect.value
    };
    ipcRenderer.send('update-client-category', data);
    categoryModal.style.display = 'none';
});

// NUEVO: Cerrar modal de categoría
cancelCategoryBtn.addEventListener('click', () => {
    categoryModal.style.display = 'none';
});


// ... (Pega aquí el resto de tu código de manejo de eventos para juegos)
addGameBtn.addEventListener('click', () => {
    gameModalTitle.textContent = 'Añadir Nuevo Juego';
    gameForm.reset();
    gameIdInput.value = '';
    gameModal.style.display = 'block';
});

juegosTableBody.addEventListener('click', e => {
    const target = e.target;
    const gameId = target.getAttribute('data-id');

    if (target.classList.contains('edit-game-btn')) {
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
        const disponible = target.getAttribute('data-disponible') === '1';
        ipcRenderer.send('toggle-game-availability', { id: gameId, disponible: !disponible });
    }
});

cancelGameBtn.addEventListener('click', () => gameModal.style.display = 'none');

gameForm.addEventListener('submit', e => {
    e.preventDefault();
    const gameData = {
        id: gameIdInput.value,
        nombre_juego: nombreJuegoInput.value,
        descripcion: descripcionInput.value
    };

    if (gameData.id) {
        ipcRenderer.send('update-game', gameData);
    } else {
        ipcRenderer.send('add-game', gameData);
    }
    gameModal.style.display = 'none';
});
