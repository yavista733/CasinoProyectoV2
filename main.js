// main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const mysql = require('mysql2');
const path = require('path');

// --- CREDENCIALES DEL ADMINISTRADOR (Hardcodeado) ---
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'admin123';

// --- Configuración de la Conexión a MySQL ---
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '12345678', // Contraseña actualizada
    database: 'casino_db'
});

connection.connect(err => {
    if (err) {
        console.error('Error al conectar a la base de datos:', err);
        return;
    }
    console.log('Conexión a la base de datos MySQL establecida.');
});

// --- Creación de Ventanas ---
function createLoginWindow() {
    const loginWindow = new BrowserWindow({
        width: 500,
        height: 600,
        webPreferences: { nodeIntegration: true, contextIsolation: false }
    });
    loginWindow.loadFile('login.html');
}

function createDashboardWindow(clientData) {
    const dashboardWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: { nodeIntegration: true, contextIsolation: false }
    });
    dashboardWindow.loadFile('dashboard.html');
    
    dashboardWindow.webContents.on('did-finish-load', () => {
        dashboardWindow.webContents.send('client-data', clientData);
    });
}

function createAdminDashboardWindow() {
    const adminWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: { nodeIntegration: true, contextIsolation: false }
    });
    adminWindow.loadFile('admin_dashboard.html');
}


// --- Lógica de Comunicación IPC ---

// REGISTRO DE CLIENTE
ipcMain.on('registrar-cliente', (event, cliente) => {
    const query = 'INSERT INTO clientes (nombre, dni, usuario, contrasena, fecha_nacimiento, telefono, correo_electronico) VALUES (?, ?, ?, ?, ?, ?, ?)';
    const values = [
        cliente.nombre, cliente.dni, cliente.usuario, cliente.contrasena,
        cliente.fecha_nacimiento, cliente.telefono, cliente.correo_electronico
    ];
    connection.query(query, values, (err, result) => {
        if (err) {
            console.error('Error al registrar el cliente:', err);
            if (err.code === 'ER_DUP_ENTRY') {
                let campoDuplicado = err.message.includes('dni') ? 'El DNI' : 'El nombre de usuario';
                event.reply('registro-respuesta', { success: false, message: `${campoDuplicado} ya se encuentra registrado.` });
            } else {
                event.reply('registro-respuesta', { success: false, message: 'Error al registrar en la base de datos.' });
            }
            return;
        }
        event.reply('registro-respuesta', { success: true, message: '¡Cliente registrado con éxito!' });
    });
});

// INICIO DE SESIÓN
ipcMain.on('login-request', (event, credenciales) => {
    const { usuario, contrasena } = credenciales;
    if (usuario === ADMIN_USER && contrasena === ADMIN_PASS) {
        createAdminDashboardWindow();
        BrowserWindow.fromWebContents(event.sender)?.close();
        return;
    }
    const query = 'SELECT * FROM clientes WHERE usuario = ? AND contrasena = ?';
    connection.query(query, [usuario, contrasena], (err, results) => {
        if (err) {
            event.reply('login-response', { success: false, message: 'Error del servidor.' });
            return;
        }
        if (results.length > 0) {
            const clientData = { id: results[0].id, nombre: results[0].nombre };
            createDashboardWindow(clientData);
            BrowserWindow.fromWebContents(event.sender)?.close();
        } else {
            event.reply('login-response', { success: false, message: 'Usuario o contraseña incorrectos.' });
        }
    });
});

// OBTENER TODOS LOS CLIENTES
ipcMain.on('get-all-clients', (event) => {
    const query = 'SELECT id, nombre, dni, usuario, fecha_nacimiento, telefono, correo_electronico FROM clientes';
    connection.query(query, (err, results) => {
        if (err) { console.error('Error al obtener los clientes:', err); return; }
        event.reply('all-clients-response', results);
    });
});

// CERRAR SESIÓN
ipcMain.on('logout-request', (event) => {
    const windowToClose = BrowserWindow.fromWebContents(event.sender);
    if (windowToClose) {
        windowToClose.close();
        createLoginWindow();
    }
});


// --- ESCUCHADORES PARA LA VISTA DEL CLIENTE ---

// OBTENER JUEGOS DISPONIBLES
ipcMain.on('get-available-games', (event) => {
    const query = 'SELECT * FROM juegos WHERE disponible = TRUE';
    connection.query(query, (err, results) => {
        if (err) { console.error('Error al obtener juegos:', err); return; }
        event.reply('available-games-response', results);
    });
});

// OBTENER RESERVAS DE UN CLIENTE
ipcMain.on('get-my-reservas', (event, clienteId) => {
    const query = `
        SELECT r.id, r.fecha_reserva, r.hora_reserva, r.estado, j.nombre_juego 
        FROM reservas r 
        JOIN juegos j ON r.juego_id = j.id 
        WHERE r.cliente_id = ?
        ORDER BY r.id DESC`;
    connection.query(query, [clienteId], (err, results) => {
        if (err) { console.error('Error al obtener mis reservas:', err); return; }
        event.reply('my-reservas-response', results);
    });
});

// CREAR UNA NUEVA RESERVA (ACTUALIZADO PARA GUARDAR PEDIDOS)
ipcMain.on('create-reservation', (event, reserva) => {
    const query = 'INSERT INTO reservas (cliente_id, juego_id, fecha_reserva, hora_reserva, pedido_comidas, pedido_bebidas) VALUES (?, ?, ?, ?, ?, ?)';
    const values = [
        reserva.cliente_id, 
        reserva.juego_id, 
        reserva.fecha_reserva, 
        reserva.hora_reserva,
        reserva.pedido_comidas,
        reserva.pedido_bebidas
    ];
    connection.query(query, values, (err, result) => {
        if (err) {
            console.error('Error al crear la reserva:', err);
            event.reply('reservation-response', { success: false, message: 'Error al crear la reserva.' });
            return;
        }
        event.reply('reservation-response', { success: true, message: '¡Reserva creada con éxito!' });
    });
});

// CANCELAR RESERVA
ipcMain.on('cancel-reservation', (event, reservaId) => {
    const query = "UPDATE reservas SET estado = 'cancelada' WHERE id = ?";
    connection.query(query, [reservaId], (err, result) => {
        if (err) { console.error('Error al cancelar la reserva:', err); return; }
        event.reply('reservation-cancelled');
    });
});


// --- Ciclo de Vida de la Aplicación ---
app.whenReady().then(createLoginWindow);
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        connection.end();
        app.quit();
    }
});
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createLoginWindow();
    }
});
