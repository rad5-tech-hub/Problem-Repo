// api/slack-notify.js
export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, userName, details = '' } = req.body || {};

    if (!action || !userName) {
      return res.status(400).json({ error: 'Missing action or userName' });
    }

    const webhookUrl = process.env.SLACK_WEBHOOK_URL;

    if (!webhookUrl) {
      console.error('Missing SLACK_WEBHOOK_URL');
      return res.status(500).json({ error: 'Missing webhook configuration' });
    }

    const message = {
      text: `*${userName}* tested manual notification\n${details || 'No details'}\n→ ${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })} WAT`
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Slack error:', response.status, errorText);
      return res.status(500).json({ error: `Slack failed: ${response.status}` });
    }

    return res.status(200).json({ success: true, message: 'Test sent' });
  } catch (error) {
    console.error('Handler error:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}