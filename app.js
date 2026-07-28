const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const APP_VERSION = process.env.APP_VERSION || 'unknown';

app.get('/', (req, res) => {
    res.json({
        status: "success",
        message: "Hello World dari Sidang TA",
        timestamp: new Date(),
        environment: "production",
        version: APP_VERSION
    });
});

app.get('/health', (req, res) => {
    res.json({ status: "healthy", version: APP_VERSION });
});

app.listen(PORT, () => {
    console.log(`Aplikasi dummy versi ${APP_VERSION} berjalan di port ${PORT}`);
});
