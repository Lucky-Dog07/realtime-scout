import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';

const AI_API_URL = process.env.AI_API_URL || 'https://api.openai.com/v1/chat/completions';
const AI_API_KEY = process.env.AI_API_KEY || '';

export async function suggestPrice(req: AuthRequest, res: Response) {
  const { title, description, photo_count, deadline_minutes } = req.body;

  if (!title || !description) {
    return res.status(400).json({ code: 40000, data: null, message: '请先填写任务标题和描述' });
  }

  const prompt = `你是一个任务定价助手，用于"实时探路"平台。用户发布任务请人到现场拍照/查看情况，你需要根据任务内容建议合理的悬赏价格。

定价参考因素：
- 任务难度（简单看一眼 vs 需要详细拍摄记录）
- 需要拍照数量（越多越贵）
- 时间紧迫度（有效期越短越贵）
- 任务内容复杂度（单纯拍照 vs 需要问价/对比）

价格范围：1-15元，大部分任务在2-5元。

任务信息：
- 标题：${title}
- 描述：${description}
- 需要照片：${photo_count || 1}张
- 有效期：${deadline_minutes || 60}分钟

请直接返回JSON格式（不要markdown代码块）：
{"price": 数字, "reason": "一句话定价理由"}`;

  try {
    const response = await fetch(AI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      throw new Error('AI 返回为空');
    }

    // 解析 JSON
    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const result = JSON.parse(cleaned);

    res.json({
      code: 0,
      data: { price: result.price, reason: result.reason },
      message: 'ok',
    });
  } catch (err: any) {
    console.error('AI suggest price error:', err.message);
    // 降级：根据简单规则给出建议
    const basePrice = 2;
    const photoBonus = ((photo_count || 1) - 1) * 0.5;
    const urgencyBonus = (deadline_minutes || 60) <= 30 ? 1 : 0;
    const fallbackPrice = Math.min(10, basePrice + photoBonus + urgencyBonus);

    res.json({
      code: 0,
      data: { price: fallbackPrice, reason: '基于照片数量和时间紧迫度的建议价格' },
      message: 'ok',
    });
  }
}
