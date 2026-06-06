import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error(err.stack);
  res.status(500).json({
    code: 50000,
    data: null,
    message: err.message || '服务器内部错误',
  });
}
