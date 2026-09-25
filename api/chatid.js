// Временный помощник: показывает chat_id чатов, где бот уже получал сообщения.
// Нужен один раз при подключении бота. После настройки файл можно удалить.
//
// Как пользоваться:
//   1. Добавить MAX_BOT_TOKEN в переменные окружения Vercel
//   2. Написать боту любое сообщение из нужного чата
//   3. Открыть /api/chatid и взять оттуда id

const MAX_API = 'https://platform-api2.max.ru';

export default async function handler(req, res) {
  const token = process.env.MAX_BOT_TOKEN;
  if (!token) {
    return res.status(501).json({
      ok: false,
      подсказка: 'Сначала добавьте MAX_BOT_TOKEN в Vercel → Settings → Environment Variables'
    });
  }

  try {
    const r = await fetch(MAX_API + '/updates?limit=50', {
      headers: { 'Authorization': token }
    });

    if (!r.ok) {
      return res.status(502).json({
        ok: false,
        статус: r.status,
        подсказка: 'MAX не принял токен. Проверьте, что скопировали его целиком'
      });
    }

    const data = await r.json();
    const list = data.updates || data.result || [];
    const чаты = new Map();

    for (const u of list) {
      const m = u.message || u;
      const id = m.recipient?.chat_id ?? m.chat_id ?? m.chat?.chat_id;
      if (id == null) continue;
      if (!чаты.has(id)) {
        чаты.set(id, {
          chat_id: id,
          тип: m.recipient?.chat_type || m.chat?.type || 'неизвестно',
          от: m.sender?.name || m.from?.name || ''
        });
      }
    }

    if (!чаты.size) {
      return res.status(200).json({
        ok: true,
        чаты: [],
        подсказка: 'Пока ни одного сообщения. Напишите боту из нужного чата и обновите страницу'
      });
    }

    return res.status(200).json({
      ok: true,
      чаты: [...чаты.values()],
      дальше: 'Скопируйте нужный chat_id в переменную MAX_CHAT_ID в Vercel'
    });
  } catch (e) {
    return res.status(502).json({ ok: false, ошибка: 'Не достучались до MAX' });
  }
}
