// renderer.js
const { ipcRenderer } = require('electron');

const form = document.getElementById('registro-form');
const mensajeDiv = document.getElementById('mensaje');

form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Creamos el objeto incluyendo los nuevos campos
    const nuevoCliente = {
        nombre: form.nombre.value,
        dni: form.dni.value,
        usuario: form.usuario.value,
        contrasena: form.contrasena.value,
        fecha_nacimiento: form.fecha_nacimiento.value,
        telefono: form.telefono.value,
        correo_electronico: form.correo.value
    };

    ipcRenderer.send('registrar-cliente', nuevoCliente);
});

ipcRenderer.on('registro-respuesta', (event, args) => {
    mensajeDiv.textContent = args.message;
    
    if (args.success) {
        mensajeDiv.style.color = '#34D399'; // Verde
        form.reset();
    } else {
        mensajeDiv.style.color = '#F87171'; // Rojo
    }
});
