const { getClient, MessageMedia } = require('../lib/whatsapp-client');
const isBase64 = (str) => {
    try {
        return Buffer.from(str, 'base64').toString('base64') === str;
    } catch (err) {
        return false;
    }
};

module.exports = async (req, res) => {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { phone, message, image, mimeType = 'image/jpeg' } = req.body;

        if (!phone) return res.status(400).json({ error: 'Phone number is required' });
        if (!message && !image) return res.status(400).json({ error: 'Either message or image is required' });

        const formattedPhone = phone.replace(/\D/g, '') + '@c.us';
        const client = getClient();
        let result;

        if (image) {
            let mediaData, mediaMimeType;

            if (image.startsWith('data:')) {
                const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
                if (!matches) return res.status(400).json({ error: 'Invalid image data URI format' });
                mediaMimeType = matches[1];
                mediaData = matches[2];
            } else {
                if (!isBase64(image)) {
                    return res.status(400).json({ error: 'Invalid base64 image data' });
                }
                mediaMimeType = mimeType;
                mediaData = image;
            }

            const media = new MessageMedia(
                mediaMimeType,
                mediaData,
                `image.${mediaMimeType.split('/')[1] || 'jpg'}`
            );

            const sentMessage = await client.sendMessage(
                formattedPhone,
                media,
                message ? { caption: message } : undefined
            );

            result = {
                success: true,
                type: 'image',
                messageId: sentMessage.id._serialized,
                timestamp: sentMessage.timestamp
            };
        } else {
            const sentMessage = await client.sendMessage(formattedPhone, message);
            result = {
                success: true,
                type: 'text',
                messageId: sentMessage.id._serialized,
                timestamp: sentMessage.timestamp
            };
        }

        res.json(result);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            error: 'Failed to send message',
            details: error.message
        });
    }
};