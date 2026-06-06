export type TransactionType = 'topup' | 'freeze' | 'unfreeze' | 'pay_out' | 'earn' | 'withdraw';

export interface Transaction {
  id: number;
  user_id: number;
  type: TransactionType;
  amount: number;
  balance_after: number;
  related_task_id: number | null;
  description: string | null;
  created_at: string;
}
