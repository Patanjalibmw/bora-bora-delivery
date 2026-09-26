// Приём заказа с сайта и доставка его в чат ресторана через Bot API MAX.
// Токен и chat_id живут в переменных окружения Vercel и на страницу не попадают.
//
// Настроить в Vercel → Settings → Environment Variables:
//   MAX_BOT_TOKEN — токен бота (MAX → Чат-боты → ⋮ → Настройки)
//   MAX_CHAT_ID   — id чата, куда падают заказы

const MAX_API = 'https://botapi.max.ru/messages';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Только POST' });
  }

  const token  = process.env.MAX_BOT_TOKEN;
  const chatId = process.env.MAX_CHAT_ID;

  // Бот ещё не подключён — сайт сам откатится на отправку через мессенджер
  if (!token || !chatId) {
    return res.status(501).json({ ok: false, error: 'Бот не настроен' });
  }

  const text = (req.body && req.body.text || '').toString().trim();
  if (!text)            return res.status(400).json({ ok: false, error: 'Пустой заказ' });
  if (text.length > 4000) return res.status(400).json({ ok: false, error: 'Заказ слишком длинный' });

  try {
    const r = await fetch(MAX_API, {
      method: 'POST',
      headers: { 'Authorization': token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text })
    });

    if (!r.ok) {
      const detail = await r.text().catch(() => '');
      console.error('MAX API', r.status, detail.slice(0, 300));
      return res.status(502).json({ ok: false, error: 'MAX не принял сообщение' });
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('order handler', e);
    return res.status(502).json({ ok: false, error: 'Сеть недоступна' });
  }
}
