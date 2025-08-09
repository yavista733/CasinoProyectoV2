// login-renderer.js
const { ipcRenderer } = require('electron');

const form = document.getElementById('login-form');
const mensajeDiv = document.getElementById('mensaje');

form.addEventListener('submit', (e) => {
    e.preventDefault();
    const credenciales = {
        usuario: form.usuario.value,
        contrasena: form.contrasena.value,
    };
    // Enviamos las credenciales al proceso principal para ser validadas
    ipcRenderer.send('login-request', credenciales);
});

// Escuchamos la respuesta del proceso principal
ipcRenderer.on('login-response', (event, args) => {
    if (!args.success) {
        mensajeDiv.textContent = args.message;
    }
    // Si el login es exitoso, main.js se encargará de abrir la nueva ventana
});