const { getQrCode, isClientAuthenticated } = require('../lib/whatsapp-client');

module.exports = async (req, res) => {
    try {
        const status = isClientAuthenticated() ? 'authenticated' :
            getQrCode() ? 'awaiting_qr_scan' : 'initializing';

        res.json({
            status,
            qrCode: getQrCode(),
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};