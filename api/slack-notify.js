export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, userName, details } = req.body;

  // Basic validation
  if (!action || !userName) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const webhookUrl = import.meta.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    console.error('SLACK_WEBHOOK_URL is not set in environment variables');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const message = {
    text: `*${userName}* just *${action}*\n${details || ''}\n→ ${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })} WAT`,
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error(`Slack responded with ${response.status}`);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Failed to send Slack notification:', error);
    return res.status(500).json({ error: 'Failed to send notification' });
  }
}