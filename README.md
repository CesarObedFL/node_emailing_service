# Gmail Email Microservice

A lightweight, secure microservice for sending emails via Gmail SMTP. It uses JWT-based authentication to prevent spam and unauthorized access, ensuring that only verified requests can trigger email delivery.

## Features

- Single responsibility – only sends emails.
- JWT authentication – validates a token passed in the Authorization header.
- Spam protection – rejects requests without a valid JWT or with invalid payload.
- Logging – records all failed attempts (IP, reason) to logs.txt.
- CORS – restricts access to trusted origins.
- Docker-ready – easy containerization.
- Lightweight – minimal dependencies.

## Installation

```
git clone https://github.com/CesarObedFL/node_gmail_emailing_microservice.git
cd node_gmail_emailing_microservice
npm install
```

## Configuration
Create a .env file in the project root based on the example below:

```
# Server
PORT=<port>

# Gmail credentials
EMAIL=<your_email@gmail.com>
EMAIL_PASSWORD=<your_gmail_app_password>

# CORS
URL=<http://localhost:5173>

# JWT Secret (must match the one used in recaptcha microservice)
JWT_SECRET=<your_super_secret_key_here>
```

| Variable | Description |
| ----- | ----- |
| PORT | Port where the service will run (default: 3000) |
| EMAIL | Your Gmail address (sender and recipient) |
| EMAIL_PASSWORD | App password (not your Gmail login password) – generate one from Google Account settings |
| CLIENT_URL | Allowed CORS origin (e.g., your Vue.js frontend) |
| JWT_SECRET | Secret key used to verify incoming JWT tokens (must match the secret used by your reCAPTCHA microservice) |

⚠️ Never commit the .env file – add it to .gitignore.

### Authentication (JWT)
All POST /request calls must include a valid JSON Web Token (JWT) in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

The token must contain the following claims:

```
json
{
  "verified": true,
  "type": "email_verification"
}
```

If the token is missing, invalid, expired, or does not contain verified: true, the request will be rejected with a 401 or 403 status and logged.

## Endpoints

- GET : /config : Returns basic configuration information (publicly accessible).

Response example:

json
{
  "port": 3000,
  "sending_email": "cesarobedfl@gmail.com",
  "cors_url": "http://cesarobedfl.pro"
}

- POST : /request : Sends an email after successful JWT validation.

Headers:

Authorization: Bearer <jwt_token> (required)

Body (JSON):

json
{
  "full_name": "Cesar Obed FL",
  "email": "cesarobedfl@gmail.com",
  "subject": "Hello from my portfolio",
  "message": "I would like to work with you."
}

| Field | Type | Required | Description |
| ----- | ----- | ----- | ----- |
| full_name | string | ✅ | Sender's full name |
| email | string | ✅ | Sender's email address |
| subject | string | ✅ | Subject of the email |
| message | string | ✅ | Body content of the email |

Successful response (200):

json
{
  "success": "Email sent successfully"
}

Error responses:

- 400 – Missing required fields.
- 401 – Missing or malformed Authorization header.
- 403 – Invalid JWT (e.g., verified is not true or token expired).
- 500 – SMTP delivery error (will also be logged).

# Logging

All failed attempts (invalid JWT, token expiration, SMTP errors) are logged in the logs.txt file with a timestamp, client IP, and the reason.

Example entry:

text
[2025-03-25T14:23:10.456Z] Failed attempt - IP: ::1 - Name: John Doe - Email: john@example.com - Reason: Invalid JWT token
🧪 Testing with curl
First, get a valid JWT from your reCAPTCHA microservice (which should generate it after a successful CAPTCHA verification).

Send an email request:

```
curl -X POST http://localhost:3000/request \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{"full_name":"Jane","email":"jane@test.com","subject":"Test","message":"Hello"}'
```

### Docker (Optional)
Build the image:

```
docker build -t node-gmail-emailing .
```

Run the container:

```
docker run -p 3000:3000 --env-file .env node-gmail-emailing
```

### Development
Run in development mode with auto-restart:

```
npm run dev
```

Production start:

```
npm start
```

## Integration with other microservices

This service works as part of a larger ecosystem:
Frontend sends a request to the reCAPTCHA microservice to verify the user.
Upon successful verification, the reCAPTCHA service issues a JWT with verified: true and type: "email_verification".
The frontend then forwards that JWT to this email microservice.
This service only checks the JWT and delivers the email – it does not know anything about reCAPTCHA.
This separation of concerns keeps each microservice simple and focused.

## ☕ Support the Project

If you find this project useful, you can buy me a coffee to keep it going!

[![Buy Me A Coffee](https://cdn.buymeacoffee.com/buttons/lato-orange.png)](https://buymeacoffee.com/cesarobedfl)

<b>Follow me! </b> <br>
<p align="left">
    <a href="https://github.com/CesarObedFL">
        <img src="https://img.shields.io/badge/github-%23121011.svg?style=for-the-badge&logo=github&logoColor=white" alt="GitHub"/>
    </a>
    <a href="https://www.linkedin.com/in/cesarobedfigueroaluna/">
        <img src="https://img.shields.io/badge/linkedin-%230077B5.svg?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn"/>
    </a>
</p>


## Contributing

Issues and pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.


## License

This project is licensed under the MIT License – see the LICENSE file for details.

