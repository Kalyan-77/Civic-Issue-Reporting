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

// User question
const userPrompt = "What is captial of India?";

const data = JSON.stringify({
    contents: [{
        parts: [{ text: userPrompt }]
    }]
});

// Using gemini-2.0-flash as it's listed
const options = {
    hostname: 'generativelanguage.googleapis.com',
    port: 443,
    path: `/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey.trim()}`,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
    }
};

console.log(`Asking Gemini (gemini-2.0-flash): "${userPrompt}"...\n`);

const req = https.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        if (res.statusCode === 200) {
            try {
                const response = JSON.parse(body);
                const text = response.candidates[0].content.parts[0].text;
                console.log('--- GEMINI RESPONSE ---');
                console.log(text.trim());
                console.log('\n-----------------------');
            } catch (e) {
                console.error('Error parsing response:', e.message);
                console.log('Raw body:', body);
            }
        } else {
            console.error(`API Error Status: ${res.statusCode}`);
            try {
                const errorResponse = JSON.parse(body);
                console.log('Error Details:', JSON.stringify(errorResponse, null, 2));
            } catch (e) {
                console.log('Raw Error Body:', body);
            }
        }
    });
});

req.on('error', (error) => {
    console.error('Network Error:', error.message);
});

req.write(data);
req.end();
