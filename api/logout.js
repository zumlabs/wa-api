const { logoutClient } = require('../lib/whatsapp-client');

module.exports = async (req, res) => {
    try {
        const success = await logoutClient();
        res.json({ success });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};