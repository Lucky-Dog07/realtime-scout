import { Router } from 'express';
import { auth } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

router.post('/', auth, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ code: 40000, data: null, message: '请选择文件' });
  }
  const url = `/uploads/${req.file.filename}`;
  res.json({ code: 0, data: { url }, message: 'ok' });
});

export default router;
