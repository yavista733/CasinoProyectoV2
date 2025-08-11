// src/models/promocionModel.js

// Este archivo centraliza todas las consultas SQL para las promociones.

module.exports = (connection) => {
    return {
        // Obtener todas las promociones (para el panel de admin)
        getAll: (callback) => {
            const query = 'SELECT * FROM promociones ORDER BY id';
            connection.query(query, callback);
        },

        // Añadir una nueva promoción
        add: (promoData, callback) => {
            const query = 'INSERT INTO promociones (nombre_promocion, descripcion, fecha_inicio, fecha_fin) VALUES (?, ?, ?, ?)';
            const values = [promoData.nombre_promocion, promoData.descripcion, promoData.fecha_inicio, promoData.fecha_fin];
            connection.query(query, values, callback);
        },

        // Actualizar una promoción existente
        update: (promoData, callback) => {
            const query = 'UPDATE promociones SET nombre_promocion = ?, descripcion = ?, fecha_inicio = ?, fecha_fin = ? WHERE id = ?';
            const values = [promoData.nombre_promocion, promoData.descripcion, promoData.fecha_inicio, promoData.fecha_fin, promoData.id];
            connection.query(query, values, callback);
        },

        // Cambiar el estado de una promoción (activa/inactiva)
        toggleActive: (data, callback) => {
            const query = 'UPDATE promociones SET activa = ? WHERE id = ?';
            connection.query(query, [data.activa, data.id], callback);
        },

        // Asignar una promoción a un cliente
        assignToClient: (data, callback) => {
            const query = 'INSERT INTO cliente_promocion (cliente_id, promocion_id, fecha_asignacion) VALUES (?, ?, ?)';
            // Obtenemos la fecha actual en un formato simple
            const fechaHoy = new Date().toLocaleDateString('es-PE'); 
            connection.query(query, [data.clienteId, data.promocionId, fechaHoy], callback);
        }
    };
};
