const express = require('express');
const cors = require('cors');
const path = require('path');
const WhatsAppClient = require('../lib/whatsapp-client');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Initialize WhatsApp client
const whatsappClient = new WhatsAppClient();

// API Routes
app.get('/api/status', async (req, res) => {
  try {
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
    uptime: process.uptime()
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
  await whatsappClient.destroy();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await whatsappClient.destroy();
  process.exit(0);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`WhatsApp API Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Web interface: http://localhost:${PORT}`);
});

module.exports = app;