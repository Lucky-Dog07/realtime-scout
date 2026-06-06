import { Router } from 'express';
import { auth } from '../middleware/auth';
import { getBalance, topup, getTransactions } from '../controllers/wallet.controller';

const router = Router();

router.get('/balance', auth, getBalance);
router.post('/topup', auth, topup);
router.get('/transactions', auth, getTransactions);

export default router;
