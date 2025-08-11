// src/controllers/promocionController.js

// Este controlador maneja toda la lógica de negocio para las promociones.

module.exports = (ipcMain, promocionModel) => {
    // Escuchador para obtener TODAS las promociones
    ipcMain.on('get-all-promociones', (event) => {
        promocionModel.getAll((err, results) => {
            if (err) {
                console.error('Error en promocionController al obtener promociones:', err);
                return;
            }
            event.reply('all-promociones-response', results);
        });
    });

    // Escuchador para AÑADIR una nueva promoción
    ipcMain.on('add-promocion', (event, promoData) => {
        promocionModel.add(promoData, (err, result) => {
            if (err) {
                console.error('Error en promocionController al añadir promoción:', err);
                return;
            }
            event.reply('promocion-updated'); // Avisa a la vista que se actualizó la lista
        });
    });

    // Escuchador para ACTUALIZAR una promoción existente
    ipcMain.on('update-promocion', (event, promoData) => {
        promocionModel.update(promoData, (err, result) => {
            if (err) {
                console.error('Error en promocionController al actualizar promoción:', err);
                return;
            }
            event.reply('promocion-updated');
        });
    });

    // Escuchador para CAMBIAR el estado (activo/inactivo) de una promoción
    ipcMain.on('toggle-promocion-active', (event, data) => {
        promocionModel.toggleActive(data, (err, result) => {
            if (err) {
                console.error('Error en promocionController al cambiar estado:', err);
                return;
            }
            event.reply('promocion-updated');
        });
    });

    // Escuchador para ASIGNAR una promoción a un cliente
    ipcMain.on('assign-promocion-to-client', (event, data) => {
        promocionModel.assignToClient(data, (err, result) => {
            if (err) {
                // Manejar error de duplicado (cliente ya tiene la promo)
                if (err.code === 'ER_DUP_ENTRY') {
                    console.log('El cliente ya tiene esta promoción asignada.');
                    event.reply('assign-promocion-error', 'El cliente ya tiene esta promoción.');
                } else {
                    console.error('Error en promocionController al asignar promoción:', err);
                }
                return;
            }
            event.reply('promocion-assigned-successfully');
        });
    });
};
