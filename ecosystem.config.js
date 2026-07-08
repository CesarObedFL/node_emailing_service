module.exports = {
    apps: [
        {
            name: 'node_emailing_service',
            script: './index.js',
            watch: true,
            env: {
                NODE_ENV: 'production',
                PORT:"3000",
                EMAIL:"cesarobedfl@gmail.com",
                EMAIL_PASSWORD:"knyylbpgfmbdwcoa",
                URL:"https://cesarobedfl.pro",
                PROJECT_ID:"portfolio-1737941968535",
                RECAPTCHA_KEY:"6LdbU8QqAAAAAPs_wi4YwxISP5TjY1mkBOqEbC29",
                GOOGLE_APPLICATION_CREDENTIALS:"/var/www/node_emailing_service/config/portfolio-1737941968535-d4f770d735ce.json",
            }
        }
    ]
};