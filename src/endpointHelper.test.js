const { asyncHandler, StatusCodeError } = require('./endpointHelper.js');

describe('StatusCodeError', () => {
  it('should create error with status code', () => {
    const error = new StatusCodeError('test error', 404);
    expect(error.message).toBe('test error');
    expect(error.statusCode).toBe(404);
    expect(error instanceof Error).toBe(true);
  });
});

describe('asyncHandler', () => {
  it('should handle successful async operations', async () => {
    const mockReq = {};
    const mockRes = {
      json: jest.fn()
    };
    const mockNext = jest.fn();

    const handler = asyncHandler(async (req, res) => {
      res.json({ success: true });
    });

    await handler(mockReq, mockRes, mockNext);

    expect(mockRes.json).toHaveBeenCalledWith({ success: true });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should handle errors in async operations', async () => {
    const mockReq = {};
    const mockRes = {};
    const mockNext = jest.fn();
    const testError = new Error('test error');

    const handler = asyncHandler(async () => {
      throw testError;
    });

    await handler(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith(testError);
  });

  it('should handle StatusCodeError', async () => {
    const mockReq = {};
    const mockRes = {};
    const mockNext = jest.fn();
    const statusError = new StatusCodeError('not found', 404);

    const handler = asyncHandler(async () => {
      throw statusError;
    });

    await handler(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith(statusError);
  });

  it('should work with non-async handlers', async () => {
    const mockReq = {};
    const mockRes = {
      json: jest.fn()
    };
    const mockNext = jest.fn();

    const handler = asyncHandler((req, res) => {
      res.json({ success: true });
    });

    await handler(mockReq, mockRes, mockNext);

    expect(mockRes.json).toHaveBeenCalledWith({ success: true });
    expect(mockNext).not.toHaveBeenCalled();
  });
});
