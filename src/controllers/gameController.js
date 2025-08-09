// src/controllers/gameController.js

// Este archivo es el "controlador" para todo lo relacionado con los juegos.
// Recibe los eventos de la vista (renderer) y le pide al modelo que interactúe
// con la base de datos.

module.exports = (ipcMain, gameModel) => {
    // Escuchador para obtener TODOS los juegos (para el panel de admin)
    ipcMain.on('get-all-games-admin', (event) => {
        gameModel.getAll((err, results) => {
            if (err) {
                console.error('Error en gameController al obtener todos los juegos:', err);
                return;
            }
            event.reply('all-games-admin-response', results);
        });
    });

    // Escuchador para obtener los juegos disponibles (para el cliente)
    ipcMain.on('get-available-games', (event) => {
        gameModel.getAvailable((err, results) => {
            if (err) {
                console.error('Error en gameController al obtener juegos disponibles:', err);
                return;
            }
            event.reply('available-games-response', results);
        });
    });

    // Escuchador para obtener los detalles de UN solo juego
    ipcMain.on('get-game-details', (event, gameId) => {
        gameModel.getById(gameId, (err, results) => {
            if (err || results.length === 0) {
                console.error('Error en gameController al obtener detalles del juego:', err);
                return;
            }
            event.reply('game-details-response', results[0]);
        });
    });

    // Escuchador para AÑADIR un nuevo juego
    ipcMain.on('add-game', (event, gameData) => {
        gameModel.add(gameData, (err, result) => {
            if (err) {
                console.error('Error en gameController al añadir juego:', err);
                return;
            }
            event.reply('game-updated'); // Avisa a la vista que se actualizó la lista
        });
    });

    // Escuchador para ACTUALIZAR un juego existente
    ipcMain.on('update-game', (event, gameData) => {
        gameModel.update(gameData, (err, result) => {
            if (err) {
                console.error('Error en gameController al actualizar juego:', err);
                return;
            }
            event.reply('game-updated');
        });
    });

    // Escuchador para CAMBIAR la disponibilidad de un juego
    ipcMain.on('toggle-game-availability', (event, data) => {
        gameModel.toggleAvailability(data, (err, result) => {
            if (err) {
                console.error('Error en gameController al cambiar disponibilidad:', err);
                return;
            }
            event.reply('game-updated');
        });
    });
};
