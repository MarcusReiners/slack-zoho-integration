const axios = require('axios');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const notification = req.body;
    console.log('Webhook empfangen:', notification);

    // Nachricht an Slack senden
    const slackMessage = {
      channel: process.env.SLACK_CHANNEL_ID,
      text: '📧 Neue E-Mail empfangen',
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '📧 Neue E-Mail',
            emoji: true
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Von:*\n${notification.from || 'Unbekannt'}`
            },
            {
              type: 'mrkdwn',
              text: `*Betreff:*\n${notification.subject || 'Kein Betreff'}`
            }
          ]
        }
      ]
    };

    await axios.post('https://slack.com/api/chat.postMessage', slackMessage, {
      headers: {
        'Authorization': `Bearer ${process.env.SLACK_BOT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(500).json({ error: 'Fehler beim Verarbeiten' });
  }
};