// dashboard-renderer.js
try {
    const { ipcRenderer } = require('electron');
    console.log('Dashboard Renderer: Script cargado. Intentando adjuntar evento...');

    // Seleccionamos el botón de logout
    const logoutButton = document.getElementById('logout-btn');

    // Verificamos si el botón fue encontrado en el HTML
    if (logoutButton) {
        console.log('Dashboard Renderer: Botón de logout encontrado correctamente.');
        
        // Cuando se hace clic, enviamos una señal al proceso principal
        logoutButton.addEventListener('click', () => {
            console.log('Dashboard Renderer: ¡Botón de logout presionado! Enviando petición a main.js...');
            ipcRenderer.send('logout-request');
        });

    } else {
        // Si el botón no se encuentra, mostramos un error claro.
        console.error('Dashboard Renderer: ¡ERROR! No se pudo encontrar el botón con id="logout-btn". Verifica el archivo dashboard.html.');
    }

} catch (e) {
    // Capturamos cualquier otro error inesperado que pueda ocurrir.
    console.error('Dashboard Renderer: ¡Ocurrió un error catastrófico!', e);
}