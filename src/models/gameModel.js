// src/models/gameModel.js

// Este archivo centraliza todas las consultas SQL para la tabla 'juegos'.

// Pasamos la conexión a la base de datos como un parámetro para que el modelo
// no sea responsable de crear la conexión, solo de usarla.
module.exports = (connection) => {
    return {
        // Obtener todos los juegos (para el panel de admin)
        getAll: (callback) => {
            const query = 'SELECT * FROM juegos ORDER BY id';
            connection.query(query, callback);
        },

        // Obtener solo los juegos disponibles (para el cliente)
        getAvailable: (callback) => {
            const query = 'SELECT * FROM juegos WHERE disponible = TRUE';
            connection.query(query, callback);
        },

        // Obtener los detalles de un solo juego por su ID
        getById: (id, callback) => {
            const query = 'SELECT * FROM juegos WHERE id = ?';
            connection.query(query, [id], callback);
        },

        // Añadir un nuevo juego
        add: (gameData, callback) => {
            const query = 'INSERT INTO juegos (nombre_juego, descripcion) VALUES (?, ?)';
            connection.query(query, [gameData.nombre_juego, gameData.descripcion], callback);
        },

        // Actualizar un juego existente
        update: (gameData, callback) => {
            const query = 'UPDATE juegos SET nombre_juego = ?, descripcion = ? WHERE id = ?';
            connection.query(query, [gameData.nombre_juego, gameData.descripcion, gameData.id], callback);
        },

        // Cambiar el estado de disponibilidad de un juego
        toggleAvailability: (data, callback) => {
            const query = 'UPDATE juegos SET disponible = ? WHERE id = ?';
            connection.query(query, [data.disponible, data.id], callback);
        }
    };
};
