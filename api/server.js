const express = require('express');
const { Router } = require('express');
const morgan = require('morgan');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;
const router = Router();

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
})
router.get('/status', require('./status'));
router.post('/send-message', express.json({ limit: '10mb' }), require('./send-message'));
router.post('/logout', require('./logout'));

app.use(morgan('dev'));
app.use(router)

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});