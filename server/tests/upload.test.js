const express = require('express');
const multer = require('multer');
const request = require('supertest');
const errorHandler = require('../middleware/errorHandler');
const { createUploaders, IMAGE_MAX_BYTES, VIDEO_MAX_BYTES } = require('../middleware/upload');

const { upload, uploadVideo } = createUploaders(multer.memoryStorage());
const app = express();
app.post('/images', upload.array('images', 5), (req, res) => {
  res.status(201).json({ count: req.files.length, sizes: req.files.map((file) => file.size) });
});
app.post('/video', uploadVideo.single('video'), (req, res) => {
  res.status(201).json({ size: req.file.size });
});
app.get('/internal-error', (req, res, next) => next(new Error('private database details')));
app.use(errorHandler);

describe('product upload middleware', () => {
  test('accepts supported JPEG images up to the existing 2 MB limit', async () => {
    const response = await request(app)
      .post('/images')
      .attach('images', Buffer.alloc(IMAGE_MAX_BYTES, 1), { filename: 'front.jpg', contentType: 'image/jpeg' });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ count: 1, sizes: [IMAGE_MAX_BYTES] });
  });

  test('rejects image files larger than 2 MB', async () => {
    const response = await request(app)
      .post('/images')
      .attach('images', Buffer.alloc(IMAGE_MAX_BYTES + 1, 1), { filename: 'large.jpg', contentType: 'image/jpeg' });

    expect(response.status).toBe(413);
    expect(response.body.message).toMatch(/size limit/i);
  });

  test('rejects unsupported image extensions and mismatched MIME types', async () => {
    const extension = await request(app)
      .post('/images')
      .attach('images', Buffer.from('not an image'), { filename: 'image.svg', contentType: 'image/svg+xml' });
    const mime = await request(app)
      .post('/images')
      .attach('images', Buffer.from('not a jpeg'), { filename: 'image.jpg', contentType: 'text/plain' });

    expect(extension.status).toBe(400);
    expect(mime.status).toBe(400);
    expect(extension.body.message).toBe('Unsupported image file type.');
  });

  test('rejects more than five image files in one request', async () => {
    let uploadRequest = request(app).post('/images');
    for (let index = 0; index < 6; index += 1) {
      uploadRequest = uploadRequest.attach('images', Buffer.from(`image-${index}`), {
        filename: `image-${index}.png`,
        contentType: 'image/png',
      });
    }

    const response = await uploadRequest;
    expect(response.status).toBe(400);
  });

  test('accepts supported MP4 video up to the existing 25 MB limit', async () => {
    const response = await request(app)
      .post('/video')
      .attach('video', Buffer.alloc(VIDEO_MAX_BYTES, 1), { filename: 'demo.mp4', contentType: 'video/mp4' });

    expect(response.status).toBe(201);
    expect(response.body.size).toBe(VIDEO_MAX_BYTES);
  });

  test('rejects video files larger than 25 MB and unsupported video types', async () => {
    const large = await request(app)
      .post('/video')
      .attach('video', Buffer.alloc(VIDEO_MAX_BYTES + 1, 1), { filename: 'large.mp4', contentType: 'video/mp4' });
    const unsupported = await request(app)
      .post('/video')
      .attach('video', Buffer.from('not a video'), { filename: 'demo.avi', contentType: 'video/x-msvideo' });

    expect(large.status).toBe(413);
    expect(unsupported.status).toBe(400);
  });

  test('hides internal errors in production responses', async () => {
    const previousNodeEnv = process.env.NODE_ENV;
    const log = jest.spyOn(console, 'error').mockImplementation(() => {});
    process.env.NODE_ENV = 'production';
    try {
      const response = await request(app).get('/internal-error');
      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Internal server error.');
      expect(response.body.message).not.toContain('private database details');
      expect(response.body.requestId).toBeTruthy();
    } finally {
      process.env.NODE_ENV = previousNodeEnv;
      log.mockRestore();
    }
  });
});
