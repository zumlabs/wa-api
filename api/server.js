const express = require('express');
const path = require('path');

// Initialize express first
const app = express();
const PORT = process.env.PORT || 3000;

// Basic middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Initialize cors if available
try {
  const cors = require('cors');
  app.use(cors());
} catch (error) {
  console.warn('CORS not available, proceeding without it');
}

// Initialize WhatsApp client with error handling
let whatsappClient = null;
let WhatsAppClient = null;

try {
  WhatsAppClient = require('../lib/whatsapp-client');
  whatsappClient = new WhatsAppClient();
  console.log('WhatsApp client initialized successfully');
} catch (error) {
  console.error('Failed to initialize WhatsApp client:', error.message);
  console.log('Server will start without WhatsApp functionality');
}

// API Routes with error handling
app.get('/api/status', async (req, res) => {
  try {
    if (!whatsappClient) {
      return res.status(503).json({ 
        success: false, 
        error: 'WhatsApp client not available',
        status: 'unavailable'
      });
    }
    
    const status = await whatsappClient.getStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message,
      status: 'error'
    });
  }
});

app.post('/api/send-message', async (req, res) => {
  try {
    if (!whatsappClient) {
      return res.status(503).json({
        success: false,
        error: 'WhatsApp client not available'
      });
    }

    const { number, message } = req.body;
    
    if (!number || !message) {
      return res.status(400).json({
        success: false,
        error: 'Number and message are required'
      });
    }

    const result = await whatsappClient.sendMessage(number, message);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/api/logout', async (req, res) => {
  try {
    if (!whatsappClient) {
      return res.status(503).json({
        success: false,
        error: 'WhatsApp client not available'
      });
    }

    const result = await whatsappClient.logout();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/qr', async (req, res) => {
  try {
    if (!whatsappClient) {
      return res.status(503).json({
        success: false,
        error: 'WhatsApp client not available'
      });
    }

    const qr = await whatsappClient.getQR();
    res.json(qr);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    whatsappAvailable: !!whatsappClient
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  if (whatsappClient && typeof whatsappClient.destroy === 'function') {
    await whatsappClient.destroy();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  if (whatsappClient && typeof whatsappClient.destroy === 'function') {
    await whatsappClient.destroy();
  }
  process.exit(0);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`WhatsApp API Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Web interface: http://localhost:${PORT}`);
  console.log(`WhatsApp client: ${whatsappClient ? 'Available' : 'Not available'}`);
});

module.exports = app;