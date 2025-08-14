// src/models/requerimientoModel.js

// Este archivo centraliza todas las consultas SQL para la tabla 'requerimientos'.

module.exports = (connection) => {
    return {
        // Crear un nuevo requerimiento (enviado por un cliente)
        add: (data, callback) => {
            const query = 'INSERT INTO requerimientos (cliente_id, tipo, mensaje, fecha_creacion) VALUES (?, ?, ?, ?)';
            const fechaHoy = new Date().toLocaleDateString('es-PE'); // Fecha actual
            const values = [data.cliente_id, data.tipo, data.mensaje, fechaHoy];
            connection.query(query, values, callback);
        },

        // Obtener todos los requerimientos (para el panel de admin)
        getAll: (callback) => {
            // Unimos la tabla requerimientos con clientes para obtener el nombre del cliente
            const query = `
                SELECT 
                    r.id, r.tipo, r.mensaje, r.fecha_creacion, r.estado,
                    c.nombre as nombre_cliente
                FROM requerimientos r
                JOIN clientes c ON r.cliente_id = c.id
                ORDER BY r.id DESC`;
            connection.query(query, callback);
        }
    };
};
