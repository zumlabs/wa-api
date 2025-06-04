const express = require('express');
const { Router } = require('express');
const morgan = require('morgan');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || '0.0.0.0';
const router = Router();

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
})
router.get('/status', require('./status'));
router.post('/send-message', express.json({ limit: '10mb' }), require('./send-message'));
router.post('/logout', require('./logout'));

app.use(morgan('dev'));
app.use(router)

app.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT}`);
    console.log(`🌐 Public URL: https://wa-api-production-6843.up.railway.app`);
});