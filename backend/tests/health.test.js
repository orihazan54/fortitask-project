// Basic health check testing for server availability and response validation
// Ensures the health endpoint is accessible and returns proper status information

const request = require('supertest');
const app = require('../server');

// Server health monitoring test suite
describe('Health Endpoint', () => {
  // Validate server health endpoint returns successful status
  it('returns status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });
}); 