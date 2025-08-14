// main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const mysql = require('mysql2');
const path = require('path');

// --- 1. IMPORTAR MODELOS Y CONTROLADORES ---
const createGameModel = require('./src/models/gameModel.js');
const setupGameController = require('./src/controllers/gameController.js');
const createPromocionModel = require('./src/models/promocionModel.js');
const setupPromocionController = require('./src/controllers/promocionController.js');

// --- CONEXIÓN A DB (SIN CAMBIOS) ---
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '12345678',
    database: 'casino_db'
});

connection.connect(err => {
    if (err) {
        console.error('Error al conectar a la base de datos:', err);
        return;
    }
    console.log('Conexión a la base de datos MySQL establecida.');
});

// --- INICIALIZAR MODELOS Y CONTROLADORES (SIN CAMBIOS) ---
const gameModel = createGameModel(connection);
setupGameController(ipcMain, gameModel);

const promocionModel = createPromocionModel(connection);
setupPromocionController(ipcMain, promocionModel);


// --- Creación de Ventanas (SIN CAMBIOS) ---
function createLoginWindow() {
    const loginWindow = new BrowserWindow({
        width: 500, height: 600,
        webPreferences: { nodeIntegration: true, contextIsolation: false }
    });
    loginWindow.loadFile(path.join(__dirname, 'src/views/login.html'));
}

function createDashboardWindow(clientData) {
    const dashboardWindow = new BrowserWindow({
        width: 1200, height: 800,
        webPreferences: { nodeIntegration: true, contextIsolation: false }
    });
    dashboardWindow.loadFile(path.join(__dirname, 'src/views/dashboard.html'));
    dashboardWindow.webContents.on('did-finish-load', () => {
        dashboardWindow.webContents.send('client-data', clientData);
    });
}

function createAdminDashboardWindow() {
    const adminWindow = new BrowserWindow({
        width: 1200, height: 800,
        webPreferences: { nodeIntegration: true, contextIsolation: false }
    });
    adminWindow.loadFile(path.join(__dirname, 'src/views/admin_dashboard.html'));
}


// --- Lógica de Comunicación IPC ---

// INICIO DE SESIÓN (ACTUALIZADO PARA USAR LA TABLA 'administradores')
ipcMain.on('login-request', (event, credenciales) => {
    const { usuario, contrasena } = credenciales;

    // 1. Primero, buscamos en la tabla de administradores
    const adminQuery = 'SELECT * FROM administradores WHERE usuario = ? AND contrasena = ?';
    connection.query(adminQuery, [usuario, contrasena], (err, adminResults) => {
        if (err) {
            console.error('Error en la consulta de admin:', err);
            event.reply('login-response', { success: false, message: 'Error del servidor.' });
            return;
        }

        if (adminResults.length > 0) {
            // Si es un administrador, abrimos su panel
            console.log('Login de administrador exitoso para:', usuario);
            createAdminDashboardWindow();
            BrowserWindow.fromWebContents(event.sender)?.close();
            return; // Importante: detenemos la ejecución aquí
        }

        // 2. Si no es admin, buscamos en la tabla de clientes
        const clientQuery = 'SELECT * FROM clientes WHERE usuario = ? AND contrasena = ?';
        connection.query(clientQuery, [usuario, contrasena], (err, clientResults) => {
            if (err) {
                console.error('Error en la consulta de cliente:', err);
                event.reply('login-response', { success: false, message: 'Error del servidor.' });
                return;
            }

            if (clientResults.length > 0) {
                // Si es un cliente, abrimos su panel
                console.log('Login de cliente exitoso para:', usuario);
                const clientData = { id: clientResults[0].id, nombre: clientResults[0].nombre };
                createDashboardWindow(clientData);
                BrowserWindow.fromWebContents(event.sender)?.close();
            } else {
                // Si no se encontró en ninguna tabla, las credenciales son incorrectas
                console.log('Intento de login fallido para:', usuario);
                event.reply('login-response', { success: false, message: 'Usuario o contraseña incorrectos.' });
            }
        });
    });
});


// ... (El resto de tu código de main.js: registrar-cliente, get-all-clients, etc., se queda igual)
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

// OBTENER TODOS LOS CLIENTES
ipcMain.on('get-all-clients', (event) => {
    const query = `
        SELECT 
            c.id, c.nombre, c.dni, c.usuario, c.correo_electronico,
            cat.nombre_categoria
        FROM clientes c
        LEFT JOIN categorias_cliente cat ON c.categoria_id = cat.id
        ORDER BY c.id;
    `;
    connection.query(query, (err, results) => {
        if (err) { 
            console.error('Error al obtener los clientes con categoría:', err); 
            return; 
        }
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

ipcMain.on('create-reservation', (event, reserva) => {
    const query = 'INSERT INTO reservas (cliente_id, juego_id, fecha_reserva, hora_reserva, pedido_comidas, pedido_bebidas) VALUES (?, ?, ?, ?, ?, ?)';
    const values = [
        reserva.cliente_id, reserva.juego_id, reserva.fecha_reserva, 
        reserva.hora_reserva, reserva.pedido_comidas, reserva.pedido_bebidas
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

ipcMain.on('cancel-reservation', (event, reservaId) => {
    const query = "UPDATE reservas SET estado = 'cancelada' WHERE id = ?";
    connection.query(query, [reservaId], (err, result) => {
        if (err) { console.error('Error al cancelar la reserva:', err); return; }
        event.reply('reservation-cancelled');
    });
});


// --- ESCUCHADORES PARA EL PANEL DE ADMIN ---
ipcMain.on('get-all-reservas-admin', (event) => {
    const query = `
        SELECT 
            r.id, r.fecha_reserva, r.hora_reserva, r.estado, r.pedido_comidas, r.pedido_bebidas,
            c.nombre as nombre_cliente, 
            j.nombre_juego 
        FROM reservas r
        JOIN clientes c ON r.cliente_id = c.id
        JOIN juegos j ON r.juego_id = j.id
        ORDER BY r.id DESC`;
    
    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener todas las reservas para el admin:', err);
            return;
        }
        event.reply('all-reservas-admin-response', results);
    });
});

ipcMain.on('get-all-categories', (event) => {
    const query = 'SELECT * FROM categorias_cliente ORDER BY id';
    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener las categorías:', err);
            return;
        }
        event.reply('all-categories-response', results);
    });
});

ipcMain.on('update-client-category', (event, data) => {
    const { clienteId, categoriaId } = data;
    const query = 'UPDATE clientes SET categoria_id = ? WHERE id = ?';
    connection.query(query, [categoriaId, clienteId], (err, result) => {
        if (err) {
            console.error('Error al actualizar la categoría del cliente:', err);
            return;
        }
        event.reply('client-updated');
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
