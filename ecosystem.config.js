module.exports = {
    apps: [
        {
            name: "node_emailing_service",
            script: "./index.js",
            watch: true,

            env_production: {
                GOOGLE_APPLICATION_CREDENTIALS: "/var/www/node_emailing_service/config/portfolio-1737941968535-64bfb8ff049b.json" 
            }
        }
    ]
}