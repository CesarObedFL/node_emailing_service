const app = require('./server');
const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`🚀 Email microservice running on port ${port}`);
    console.log(`🔗 CORS allowed: ${process.env.CLIENT_URL || 'undefined'}`);
});