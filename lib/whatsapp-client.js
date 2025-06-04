const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');

class WhatsAppClient {
  constructor() {
    this.client = null;
    this.isReady = false;
    this.qrCode = null;
    this.status = 'disconnected';
    this.initializeClient();
  }

  initializeClient() {
    try {
      this.client = new Client({
        authStrategy: new LocalAuth(),
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
        },
        webVersionCache: {
          type: 'remote',
          remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
        }
      });

      this.setupEventListeners();
      this.client.initialize();
      
    } catch (error) {
      console.error('Failed to initialize WhatsApp client:', error);
      this.status = 'error';
    }
  }

  setupEventListeners() {
    this.client.on('qr', (qr) => {
      console.log('QR Code generated');
      this.qrCode = qr;
      this.status = 'qr_code';
    });

    this.client.on('ready', () => {
      console.log('WhatsApp client is ready!');
      this.isReady = true;
      this.status = 'ready';
      this.qrCode = null;
    });

    this.client.on('authenticated', () => {
      console.log('WhatsApp client authenticated');
      this.status = 'authenticated';
    });

    this.client.on('auth_failure', (msg) => {
      console.error('Authentication failed:', msg);
      this.status = 'auth_failure';
      this.isReady = false;
    });

    this.client.on('disconnected', (reason) => {
      console.log('WhatsApp client disconnected:', reason);
      this.status = 'disconnected';
      this.isReady = false;
      this.qrCode = null;
    });

    this.client.on('message', (message) => {
      console.log('Message received:', message.from, message.body);
    });

    this.client.on('error', (error) => {
      console.error('WhatsApp client error:', error);
      this.status = 'error';
    });
  }

  async getStatus() {
    try {
      const info = this.client ? await this.client.info : null;
      
      return {
        success: true,
        status: this.status,
        isReady: this.isReady,
        hasQR: !!this.qrCode,
        clientInfo: info ? {
          wid: info.wid,
          platform: info.platform
        } : null,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        status: this.status,
        isReady: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async getQR() {
    if (this.qrCode) {
      return {
        success: true,
        qr: this.qrCode,
        status: this.status
      };
    }
    
    return {
      success: false,
      message: 'No QR code available',
      status: this.status
    };
  }

  async sendMessage(number, message) {
    if (!this.isReady) {
      throw new Error('WhatsApp client is not ready');
    }

    try {
      // Format number
      const formattedNumber = number.includes('@c.us') ? number : `${number}@c.us`;
      
      // Send message
      const sentMessage = await this.client.sendMessage(formattedNumber, message);
      
      return {
        success: true,
        messageId: sentMessage.id.id,
        timestamp: sentMessage.timestamp,
        to: formattedNumber,
        message: message
      };
    } catch (error) {
      throw new Error(`Failed to send message: ${error.message}`);
    }
  }

  async logout() {
    try {
      if (this.client) {
        await this.client.logout();
        this.isReady = false;
        this.status = 'logged_out';
        this.qrCode = null;
      }
      
      return {
        success: true,
        message: 'Logged out successfully'
      };
    } catch (error) {
      throw new Error(`Failed to logout: ${error.message}`);
    }
  }

  async destroy() {
    try {
      if (this.client) {
        await this.client.destroy();
        this.isReady = false;
        this.status = 'destroyed';
        this.qrCode = null;
      }
    } catch (error) {
      console.error('Error destroying client:', error);
    }
  }
}

module.exports = WhatsAppClient;