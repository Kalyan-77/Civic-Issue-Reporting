const https = require('https');
const dotenv = require('dotenv');
const path = require('path');

// Load .env
dotenv.config({ path: path.join(__dirname, '.env') });

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error('Error: GEMINI_API_KEY not found in .env');
    process.exit(1);
}

const options = {
    hostname: 'generativelanguage.googleapis.com',
    port: 443,
    path: `/v1beta/models?key=${apiKey.trim()}`,
    method: 'GET'
};

const req = https.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        if (res.statusCode === 200) {
            try {
                const response = JSON.parse(body);
                console.log('--- AVAILABLE MODELS ---');
                response.models.map(m => m.name.replace('models/', '')).forEach(name => console.log(name));
                console.log('------------------------');
            } catch (e) {
                console.error('Error parsing response:', e.message);
                console.log('Response body:', body);
            }
        } else {
            console.error(`API Error: ${res.statusCode}`);
            console.log('Response body:', body);
        }
    });
});

req.on('error', (error) => {
    console.error('Network Error:', error.message);
});

req.end();
