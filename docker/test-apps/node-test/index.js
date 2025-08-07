const http = require('http');

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(`Hello from Node.js! Time: ${new Date().toISOString()}\n`);
});

server.listen(3000, '0.0.0.0', () => {
    console.log('Node.js server running on port 3000');
});
