const http = require('http');

const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  if (req.url === '/auth/token' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      console.log('Received login request with body:', body);
      
      // Send a mock token response
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        access_token: 'mock_token_12345',
        token_type: 'bearer',
        expires_in: 3600
      }));
    });
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ message: 'Not Found' }));
  }
});

const PORT = 8000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Mock backend API running on http://0.0.0.0:${PORT}`);
});
