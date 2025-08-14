// src/controllers/requerimientoController.js

// Este controlador maneja la lógica de negocio para los requerimientos (quejas, etc.).

module.exports = (ipcMain, requerimientoModel) => {
    // Escuchador para cuando un cliente envía un nuevo requerimiento
    ipcMain.on('submit-requerimiento', (event, data) => {
        requerimientoModel.add(data, (err, result) => {
            if (err) {
                console.error('Error en requerimientoController al añadir requerimiento:', err);
                event.reply('requerimiento-response', { success: false, message: 'Error al enviar el requerimiento.' });
                return;
            }
            event.reply('requerimiento-response', { success: true, message: '¡Requerimiento enviado con éxito!' });
        });
    });

    // Escuchador para cuando el administrador solicita ver todos los requerimientos
    ipcMain.on('get-all-requerimientos', (event) => {
        requerimientoModel.getAll((err, results) => {
            if (err) {
                console.error('Error en requerimientoController al obtener todos los requerimientos:', err);
                return;
            }
            event.reply('all-requerimientos-response', results);
        });
    });
};
