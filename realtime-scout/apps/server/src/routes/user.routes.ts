import { Router } from 'express';
import { auth } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { getProfile, updateProfile, uploadAvatar } from '../controllers/user.controller';

const router = Router();

router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);
router.post('/avatar', auth, upload.single('avatar'), uploadAvatar);

export default router;
