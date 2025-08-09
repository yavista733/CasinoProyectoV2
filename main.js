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
    password: '12345678', // Reemplaza con tu contraseña
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

function createDashboardWindow() {
    const dashboardWindow = new BrowserWindow({
        width: 1200, height: 800,
        webPreferences: { nodeIntegration: true, contextIsolation: false }
    });
    dashboardWindow.loadFile('dashboard.html');
}

function createAdminDashboardWindow() {
    const adminWindow = new BrowserWindow({
        width: 1200, height: 800,
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
            createDashboardWindow();
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
        if (err) {
            console.error('Error al obtener los clientes:', err);
            return;
        }
        event.reply('all-clients-response', results);
    });
});


// ESCUCHADOR PARA CERRAR SESIÓN (CORREGIDO Y CON MÁS DEPURACIÓN)
ipcMain.on('logout-request', (event) => {
    console.log('[MAIN PROCESS]: Petición "logout-request" recibida.');
    
    const windowToClose = BrowserWindow.fromWebContents(event.sender);
    
    if (windowToClose) {
        console.log('[MAIN PROCESS]: Ventana encontrada. Cerrando ventana actual...');
        windowToClose.close();
        console.log('[MAIN PROCESS]: Creando nueva ventana de login...');
        createLoginWindow();
    } else {
        console.error('[MAIN PROCESS]: No se pudo encontrar la ventana para cerrar.');
    }
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
