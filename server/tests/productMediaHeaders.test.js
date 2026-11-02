const express = require('express');
const helmet = require('helmet');
const request = require('supertest');
const productMediaHeaders = require('../middleware/productMediaHeaders');

const app = express();
app.use(helmet());
app.use('/uploads', productMediaHeaders);
app.get('/uploads/products/:filename', (req, res) => res.sendStatus(404));
app.get('/api/health', (req, res) => res.json({ success: true }));

describe('product media resource policy', () => {
  test('allows cross-origin loading for product media only', async () => {
    const media = await request(app).get('/uploads/products/example.jpg');
    const api = await request(app).get('/api/health');

    expect(media.headers['cross-origin-resource-policy']).toBe('cross-origin');
    expect(api.headers['cross-origin-resource-policy']).toBe('same-origin');
  });
});
