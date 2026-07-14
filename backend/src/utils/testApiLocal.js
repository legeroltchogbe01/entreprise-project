const http = require('http');

http.get('http://localhost:5000/api/products', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const products = JSON.parse(data);
      console.log('✅ Local API Test successful! Number of products loaded:', products.length);
      console.log('Sample product:', products[0]);
    } catch (e) {
      console.error('❌ Failed to parse response:', data);
    }
  });
}).on('error', (err) => {
  console.error('❌ Request error:', err.message);
});
