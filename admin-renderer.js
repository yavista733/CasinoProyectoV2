// admin-renderer.js
const { ipcRenderer } = require('electron');

// Cuando la ventana del panel se carga, pedimos la lista de clientes.
window.addEventListener('DOMContentLoaded', () => {
    console.log('Admin Renderer: Ventana cargada. Pidiendo lista de clientes...');
    ipcRenderer.send('get-all-clients');
});

// Escuchamos la respuesta del proceso principal que contiene la lista de clientes.
ipcRenderer.on('all-clients-response', (event, clientes) => {
    console.log('Admin Renderer: ¡Respuesta recibida! Clientes:', clientes);
    const tableBody = document.getElementById('clientes-table-body');
    tableBody.innerHTML = ''; // Limpiamos la tabla antes de llenarla.

    if (!clientes || clientes.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center py-4">No hay clientes registrados.</td></tr>';
        return;
    }

    // Por cada cliente en la lista, creamos una fila en la tabla.
    clientes.forEach(cliente => {
        const row = document.createElement('tr');
        row.className = 'border-b border-gray-700 hover:bg-gray-600';
        
        row.innerHTML = `
            <td class="py-2 px-4">${cliente.id}</td>
            <td class="py-2 px-4">${cliente.nombre}</td>
            <td class="py-2 px-4">${cliente.dni}</td>
            <td class="py-2 px-4">${cliente.usuario}</td>
            <td class="py-2 px-4">${cliente.fecha_nacimiento || 'No especificado'}</td>
            <td class="py-2 px-4">${cliente.telefono || 'No especificado'}</td>
            <td class="py-2 px-4">${cliente.correo_electronico || 'No especificado'}</td>
        `;
        tableBody.appendChild(row);
    });
});
