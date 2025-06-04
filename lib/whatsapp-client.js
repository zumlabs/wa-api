const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');

let client;
let currentQrCode = null;
let isAuthenticated = false;

function initWhatsAppClient() {
    if (client) return client;

    client = new Client({
        authStrategy: new LocalAuth({ dataPath: '/tmp/.wwebjs_auth' }),
        puppeteer: {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process',
                '--disable-gpu'
            ]
        }
    });

    client.on('qr', (qr) => {
        currentQrCode = qr;
    });

    client.on('authenticated', () => {
        isAuthenticated = true;
        currentQrCode = null;
    });

    client.on('ready', () => {
        console.log('Client is ready!');
        isAuthenticated = true;
    });

    client.on('disconnected', () => {
        isAuthenticated = false;
        console.log('Client is disconnected!');
    });

    client.initialize();

    return client;
}

async function logoutClient() {
    if (!client) return false;
    try {
        await client.logout();
        await client.destroy();
        client = null;
        isAuthenticated = false;
        currentQrCode = null;
        initWhatsAppClient(); // Reinitialize client
        return true;
    } catch (error) {
        console.error('Logout failed:', error);
        return false;
    }
}

function getQrCode() {
    return currentQrCode;
}

function isClientAuthenticated() {
    return isAuthenticated;
}

// Initialize immediately when this module loads
initWhatsAppClient();

module.exports = {
    getClient: () => client,
    getQrCode,
    isClientAuthenticated,
    logoutClient,
    MessageMedia
};