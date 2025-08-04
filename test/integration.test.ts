import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const TEST_PORT = 3001;
const TEST_STORE_PATH = '.test-store';
const BASE_URL = `http://localhost:${TEST_PORT}`;

let server: any;

beforeAll(async () => {
  // Clean up test store if it exists
  if (existsSync(TEST_STORE_PATH)) {
    rmSync(TEST_STORE_PATH, { recursive: true });
  }

  // Start server with test configuration
  process.env.VERCEL_STORE_PATH = TEST_STORE_PATH;
  server = Bun.spawn(['bun', 'src/server.ts'], {
    env: {
      ...process.env,
      PORT: String(TEST_PORT),
      VERCEL_STORE_PATH: TEST_STORE_PATH,
    },
  });

  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 1000));
});

afterAll(() => {
  // Kill server
  server.kill();
  
  // Clean up test store
  if (existsSync(TEST_STORE_PATH)) {
    rmSync(TEST_STORE_PATH, { recursive: true });
  }
});

describe('Vercel Blob Server Integration Tests', () => {
  test('PUT - should upload a file', async () => {
    const content = 'Hello, World!';
    const blob = new Blob([content], { type: 'text/plain' });
    
    const response = await fetch(`${BASE_URL}/test-file.txt`, {
      method: 'PUT',
      body: blob,
      headers: {
        'X-Content-Type': 'text/plain',
        'Content-Disposition': 'attachment; filename="test-file.txt"',
      },
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.pathname).toBe('/test-file.txt');
    expect(data.contentType).toBe('text/plain;charset=utf-8');
  });

  test('GET - should retrieve an uploaded file', async () => {
    // First upload a file
    const content = 'Test content for GET';
    const blob = new Blob([content], { type: 'text/plain' });
    
    await fetch(`${BASE_URL}/get-test.txt`, {
      method: 'PUT',
      body: blob,
    });

    // Now GET the file
    const response = await fetch(`${BASE_URL}/get-test.txt`);
    
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/plain;charset=utf-8');
    const text = await response.text();
    expect(text).toBe(content);
  });

  test('GET with download=1 - should include Content-Disposition header', async () => {
    // First upload a file
    const content = 'Download test';
    const blob = new Blob([content], { type: 'text/plain' });
    
    await fetch(`${BASE_URL}/download-test.txt`, {
      method: 'PUT',
      body: blob,
      headers: {
        'Content-Disposition': 'attachment; filename="download-test.txt"',
      },
    });

    // GET with download parameter
    const response = await fetch(`${BASE_URL}/download-test.txt?download=1`);
    
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Disposition')).toBeTruthy();
  });

  test('HEAD - should return file metadata', async () => {
    // First upload a file
    const content = 'HEAD test content';
    const blob = new Blob([content], { type: 'text/plain' });
    
    await fetch(`${BASE_URL}/head-test.txt`, {
      method: 'PUT',
      body: blob,
    });

    // HEAD request using the API format
    const response = await fetch(`${BASE_URL}/?url=/head-test.txt`);
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.pathname).toBe('/head-test.txt');
    expect(data.size).toBe(content.length);
  });

  test('COPY - should copy a file to a new location', async () => {
    // First upload a file
    const content = 'File to be copied';
    const blob = new Blob([content], { type: 'text/plain' });
    
    await fetch(`${BASE_URL}/original.txt`, {
      method: 'PUT',
      body: blob,
    });

    // Copy the file
    const response = await fetch(`${BASE_URL}/copied.txt?fromUrl=/original.txt`, {
      method: 'PUT',
    });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.pathname).toBe('/copied.txt');

    // Verify the copied file exists
    const getResponse = await fetch(`${BASE_URL}/copied.txt`);
    expect(getResponse.status).toBe(200);
    const copiedContent = await getResponse.text();
    expect(copiedContent).toBe(content);
  });

  test('DELETE - should delete a file', async () => {
    // First upload a file
    const content = 'File to be deleted';
    const blob = new Blob([content], { type: 'text/plain' });
    
    await fetch(`${BASE_URL}/delete-me.txt`, {
      method: 'PUT',
      body: blob,
    });

    // Verify file exists
    let response = await fetch(`${BASE_URL}/delete-me.txt`);
    expect(response.status).toBe(200);

    // Delete the file using the API format
    response = await fetch(`${BASE_URL}/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        urls: [`${BASE_URL}/delete-me.txt`]
      }),
    });
    expect(response.status).toBe(200);

    // Verify file is deleted
    response = await fetch(`${BASE_URL}/delete-me.txt`);
    expect(response.status).toBe(404);
  });

  test('GET - should return 404 for non-existent file', async () => {
    const response = await fetch(`${BASE_URL}/non-existent.txt`);
    expect(response.status).toBe(404);
  });

  test('COPY - should return 404 when source file does not exist', async () => {
    const response = await fetch(`${BASE_URL}/destination.txt?fromUrl=/non-existent-source.txt`, {
      method: 'PUT',
    });
    expect(response.status).toBe(404);
  });

  test('PUT - should handle cache control headers', async () => {
    const content = 'Cache control test';
    const blob = new Blob([content], { type: 'text/plain' });
    
    const response = await fetch(`${BASE_URL}/cache-test.txt`, {
      method: 'PUT',
      body: blob,
      headers: {
        'x-cache-control-max-age': '3600',
      },
    });

    expect(response.status).toBe(200);

    // Verify cache control is set
    const getResponse = await fetch(`${BASE_URL}/cache-test.txt`);
    expect(getResponse.headers.get('Cache-Control')).toBe('max-age=3600');
  });

  test('PUT - should create nested directories', async () => {
    const content = 'Nested directory test';
    const blob = new Blob([content], { type: 'text/plain' });
    
    const response = await fetch(`${BASE_URL}/nested/dir/test.txt`, {
      method: 'PUT',
      body: blob,
    });

    expect(response.status).toBe(200);

    // Verify file exists in nested directory
    const getResponse = await fetch(`${BASE_URL}/nested/dir/test.txt`);
    expect(getResponse.status).toBe(200);
    const text = await getResponse.text();
    expect(text).toBe(content);
  });
});