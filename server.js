const path = require('path');
const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const fs = require('fs');
const jwt = require('jsonwebtoken');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// ---------------------------------------------------------------------
// Configuration constants
// ---------------------------------------------------------------------

/** @var {string} Email address used as sender and receiver */
const EMAIL = process.env.EMAIL;

/** @var {string} Gmail App Password */
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;

/** @var {number} Port the server will listen on */
const PORT = process.env.PORT || 3000;

/** @var {string} Secret key for JWT verification */
const JWT_SECRET = process.env.JWT_SECRET;

// ---------------------------------------------------------------------
// Validate required environment variables
// ---------------------------------------------------------------------

if (!JWT_SECRET) {
    console.error('FATAL ERROR: JWT_SECRET is not defined in .env file');
    process.exit(1);
}

if (!EMAIL || !EMAIL_PASSWORD) {
    console.error('FATAL ERROR: EMAIL or EMAIL_PASSWORD is not defined in .env file');
    process.exit(1);
}

// ---------------------------------------------------------------------
// Express app initialization
// ---------------------------------------------------------------------

const app = express();

app.set('port', PORT);
app.use(express.json());
app.use(cors({ origin: process.env.CLIENT_URL }));

// ---------------------------------------------------------------------
// Nodemailer transporter setup
// ---------------------------------------------------------------------

/**
 * Nodemailer transporter configured for Gmail
 * 
 * @var {nodemailer.Transporter}
 */
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: EMAIL,
        pass: EMAIL_PASSWORD,
    }
});

/**
 * Writes a log entry to logs.txt with timestamp
 * 
 * @param {string} message The log message
 * @returns {void}
 */
function write_log(message) {
    const log_entry = `[${new Date().toISOString()}] ${message}\n`;
    fs.appendFile(path.join(__dirname, 'logs.txt'), log_entry, (err) => {
        if (err) console.error('Error writing log:', err);
    });
    console.log(log_entry.trim());
}

/**
 * Sends an email using the configured transporter
 * 
 * @param {string} to Recipient email address
 * @param {string} subject Email subject
 * @param {string} text Plain text body
 * @returns {Promise<object>} Nodemailer send result
 */
async function send_email(to, subject, text) {
    const mail_options = {
        from: EMAIL,
        to: to,
        subject: subject,
        text: text,
    };
    return await transporter.sendMail(mail_options);
}

/**
 * POST /request
 * 
 * Sends an email after validating a JWT token.
 * 
 * Expected headers:
 *   - Authorization: Bearer <jwt_token>
 * 
 * Expected JSON body:
 *   - full_name (string) : Sender's full name
 *   - email (string)     : Sender's email address (used as reply-to, but not as sender)
 *   - subject (string)   : Email subject
 *   - message (string)   : Email body content
 * 
 * The JWT must contain:
 *   - verified: true
 *   - type: 'email_verification' (optional, but recommended)
 * 
 * @route POST /request
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @returns {void} JSON response with success or error
 */
app.post("/request", async (req, res, next) => {
    const client_ip = req.ip;

    // --- 1. Extract JWT from Authorization header ---
    const auth_header = req.headers.authorization;
    if (!auth_header || !auth_header.startsWith('Bearer ')) {
        write_log(`Unauthorized attempt - IP: ${client_ip} - Missing or invalid Authorization header`);
        return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    const token = auth_header.split(' ')[1];

    // --- 2. Verify JWT ---
    let decoded;
    try {
        decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
        write_log(`JWT verification failed - IP: ${client_ip} - Error: ${error.message}`);
        return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // --- 3. Check token payload ---
    if (!decoded.verified || decoded.verified !== true) {
        write_log(`Invalid JWT payload - IP: ${client_ip} - verified claim is not true`);
        return res.status(403).json({ error: 'Token does not grant email sending permission' });
    }

    // Optional: check token type
    if (decoded.type && decoded.type !== 'email_verification') {
        write_log(`Invalid token type - IP: ${client_ip} - expected 'email_verification', got '${decoded.type}'`);
        return res.status(403).json({ error: 'Invalid token type' });
    }

    // --- 4. Extract email data from body ---
    const { full_name, email: client_email, subject, message } = req.body;

    if (!full_name || !client_email || !subject || !message) {
        return res.status(400).json({ error: 'Missing required fields: full_name, email, subject, message' });
    }

    // --- 5. Build email content ---
    const body_text = `Client: ${full_name}\nEmail: ${client_email}\nMessage: ${message}`;
    const email_subject = `Email from cesarobedfl.pro: ${subject}`;

    // --- 6. Send email ---
    try {
        const info = await send_email(EMAIL, email_subject, body_text);
        write_log(`Email sent successfully - IP: ${client_ip} - To: ${EMAIL} - MessageId: ${info.messageId}`);
        res.json({ success: 'Email sent successfully' });
    } catch (error) {
        write_log(`Email sending error - IP: ${client_ip} - Error: ${error.message}`);
        res.status(500).json({ error: 'Failed to send email' });
    }
});

/**
 * GET /config
 * 
 * Returns public configuration of the service.
 * 
 * @route GET /config
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @returns {void} JSON with configuration
 */
app.get("/config", (req, res) => {
    res.json({
        port: app.get('port'),
        sending_email: EMAIL,
        cors_url: process.env.URL,
    });
});


app.listen(app.get('port'), '127.0.0.1', () => {
    console.log(`🚀 Email microservice running on port ${app.get('port')}`);
    console.log(`🔗 CORS allowed: ${process.env.URL}`);
});