// src/views/admin-renderer.js
const { ipcRenderer } = require('electron');

// --- DATOS DEL MENÚ (Copiado de dashboard-renderer para interpretar los pedidos) ---
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
const promocionesTableBody = document.getElementById('promociones-table-body');

// Botones
const addGameBtn = document.getElementById('add-game-btn');
const addPromocionBtn = document.getElementById('add-promocion-btn');

// Modales y Formularios
const gameModal = document.getElementById('game-modal');
const categoryModal = document.getElementById('category-modal');
const promocionModal = document.getElementById('promocion-modal');
const assignPromocionModal = document.getElementById('assign-promocion-modal');

const gameForm = document.getElementById('game-form');
const categoryForm = document.getElementById('category-form');
const promocionForm = document.getElementById('promocion-form');
const assignPromocionForm = document.getElementById('assign-promocion-form');

const clientIdInput = document.getElementById('client-id-input');
const clientNameModal = document.getElementById('client-name-modal');
const categorySelect = document.getElementById('category-select');
const cancelCategoryBtn = document.getElementById('cancel-category-btn');

const gameIdInput = document.getElementById('game-id-input');
const gameModalTitle = document.getElementById('game-modal-title');
const nombreJuegoInput = document.getElementById('nombre_juego');
const descripcionInput = document.getElementById('descripcion');
const cancelGameBtn = document.getElementById('cancel-game-btn');

const promocionIdInput = document.getElementById('promocion-id-input');
const promocionModalTitle = document.getElementById('promocion-modal-title');
const nombrePromocionInput = document.getElementById('nombre_promocion');
const descripcionPromocionInput = document.getElementById('descripcion_promocion');
const fechaInicioInput = document.getElementById('fecha_inicio');
const fechaFinInput = document.getElementById('fecha_fin');
const cancelPromocionBtn = document.getElementById('cancel-promocion-btn');

const assignClientIdInput = document.getElementById('assign-client-id-input');
const assignClientNameModal = document.getElementById('assign-client-name-modal');
const assignPromocionSelect = document.getElementById('assign-promocion-select');
const cancelAssignPromocionBtn = document.getElementById('cancel-assign-promocion-btn');
const assignModalMensaje = document.getElementById('assign-modal-mensaje');

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
            <td class="py-2 px-4 font-semibold">${cliente.nombre_categoria || 'Normal'}</td>
            <td class="py-2 px-4">
                <button data-id="${cliente.id}" data-nombre="${cliente.nombre}" class="change-category-btn bg-purple-600 hover:bg-purple-700 text-white font-bold py-1 px-3 rounded-lg mr-2">Categoría</button>
                <button data-id="${cliente.id}" data-nombre="${cliente.nombre}" class="assign-promocion-btn bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded-lg">Asignar Promo</button>
            </td>
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

function renderPromociones(promociones) {
    promocionesTableBody.innerHTML = '';
    if (!promociones || promociones.length === 0) return;
    promociones.forEach(promo => {
        const row = document.createElement('tr');
        row.className = 'border-b border-gray-700';
        const activaText = promo.activa ? 'Sí' : 'No';
        const toggleButtonText = promo.activa ? 'Desactivar' : 'Activar';
        const toggleButtonClass = promo.activa ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700';

        row.innerHTML = `
            <td class="py-2 px-4">${promo.id}</td>
            <td class="py-2 px-4">${promo.nombre_promocion}</td>
            <td class="py-2 px-4">${promo.descripcion}</td>
            <td class="py-2 px-4">${promo.fecha_inicio} - ${promo.fecha_fin}</td>
            <td class="py-2 px-4">${activaText}</td>
            <td class="py-2 px-4">
                <button data-id="${promo.id}" class="edit-promocion-btn bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded-lg mr-2">Editar</button>
                <button data-id="${promo.id}" data-activa="${promo.activa}" class="toggle-promocion-btn ${toggleButtonClass} text-white font-bold py-1 px-3 rounded-lg">${toggleButtonText}</button>
            </td>
        `;
        promocionesTableBody.appendChild(row);
    });
}


// --- LÓGICA DE PESTAÑAS ---
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
    ipcRenderer.send('get-all-promociones');
    switchTab('clientes');
});


// --- RECEPCIÓN DE DATOS ---
ipcRenderer.on('all-clients-response', (event, clientes) => renderClientes(clientes));
ipcRenderer.on('all-reservas-admin-response', (event, reservas) => renderAllReservas(reservas));
ipcRenderer.on('all-games-admin-response', (event, juegos) => renderJuegos(juegos));
ipcRenderer.on('all-promociones-response', (event, promociones) => renderPromociones(promociones));
ipcRenderer.on('game-updated', () => ipcRenderer.send('get-all-games-admin'));
ipcRenderer.on('client-updated', () => ipcRenderer.send('get-all-clients'));
ipcRenderer.on('promocion-updated', () => ipcRenderer.send('get-all-promociones'));
ipcRenderer.on('promocion-assigned-successfully', () => {
    assignModalMensaje.style.color = 'lightgreen';
    assignModalMensaje.textContent = '¡Promoción asignada con éxito!';
    setTimeout(() => assignPromocionModal.style.display = 'none', 1500);
});
ipcRenderer.on('assign-promocion-error', (event, message) => {
    assignModalMensaje.style.color = 'red';
    assignModalMensaje.textContent = message;
});


// --- MANEJO DE EVENTOS ---
logoutButton.addEventListener('click', () => ipcRenderer.send('logout-request'));

// Eventos de Clientes
clientesTableBody.addEventListener('click', e => {
    const target = e.target;
    const clientId = target.getAttribute('data-id');
    const clientName = target.getAttribute('data-nombre');

    if (target.classList.contains('change-category-btn')) {
        clientIdInput.value = clientId;
        clientNameModal.textContent = clientName;
        ipcRenderer.send('get-all-categories');
    }
    
    if (target.classList.contains('assign-promocion-btn')) {
        assignClientIdInput.value = clientId;
        assignClientNameModal.textContent = clientName;
        assignModalMensaje.textContent = '';
        ipcRenderer.once('all-promociones-response', (event, promociones) => {
            assignPromocionSelect.innerHTML = '';
            promociones.forEach(promo => {
                if(promo.activa) {
                    const option = document.createElement('option');
                    option.value = promo.id;
                    option.textContent = promo.nombre_promocion;
                    assignPromocionSelect.appendChild(option);
                }
            });
            assignPromocionModal.style.display = 'block';
        });
        ipcRenderer.send('get-all-promociones');
    }
});

ipcRenderer.on('all-categories-response', (event, categorias) => {
    categorySelect.innerHTML = '';
    categorias.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = cat.nombre_categoria;
        categorySelect.appendChild(option);
    });
    categoryModal.style.display = 'block';
});

categoryForm.addEventListener('submit', e => {
    e.preventDefault();
    ipcRenderer.send('update-client-category', {
        clienteId: clientIdInput.value,
        categoriaId: categorySelect.value
    });
    categoryModal.style.display = 'none';
});

cancelCategoryBtn.addEventListener('click', () => {
    categoryModal.style.display = 'none';
});

// Eventos de Juegos
addGameBtn.addEventListener('click', () => {
    gameModalTitle.textContent = 'Añadir Juego';
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

// Eventos de Promociones
addPromocionBtn.addEventListener('click', () => {
    promocionModalTitle.textContent = 'Añadir Promoción';
    promocionForm.reset();
    promocionIdInput.value = '';
    promocionModal.style.display = 'block';
});

cancelPromocionBtn.addEventListener('click', () => promocionModal.style.display = 'none');

promocionForm.addEventListener('submit', e => {
    e.preventDefault();
    const promoData = {
        id: promocionIdInput.value,
        nombre_promocion: nombrePromocionInput.value,
        descripcion: descripcionPromocionInput.value,
        fecha_inicio: fechaInicioInput.value,
        fecha_fin: fechaFinInput.value
    };
    if (promoData.id) {
        ipcRenderer.send('update-promocion', promoData);
    } else {
        ipcRenderer.send('add-promocion', promoData);
    }
    promocionModal.style.display = 'none';
});

promocionesTableBody.addEventListener('click', e => {
    const target = e.target;
    const promoId = target.getAttribute('data-id');

    if (target.classList.contains('toggle-promocion-btn')) {
        const activa = target.getAttribute('data-activa') === '1';
        ipcRenderer.send('toggle-promocion-active', { id: promoId, activa: !activa });
    }
    // Lógica para editar (similar a juegos)
});

cancelAssignPromocionBtn.addEventListener('click', () => assignPromocionModal.style.display = 'none');

assignPromocionForm.addEventListener('submit', e => {
    e.preventDefault();
    ipcRenderer.send('assign-promocion-to-client', {
        clienteId: assignClientIdInput.value,
        promocionId: assignPromocionSelect.value
    });
});
