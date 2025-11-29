const axios = require('axios');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const notification = req.body;
    console.log('Webhook empfangen:', JSON.stringify(notification, null, 2));

    // Prüfe ob es eine eingehende E-Mail ist (nicht gesendet)
    if (notification.eventType === 'mail.sent' || notification.type === 'sent') {
      console.log('Gesendete E-Mail ignoriert');
      return res.status(200).json({ message: 'Sent email ignored' });
    }

    // Extrahiere E-Mail Details
    const from = notification.fromAddress || notification.from || 'Unbekannt';
    const subject = notification.subject || 'Kein Betreff';
    const body = notification.content || notification.body || notification.summary || '';
    const messageId = notification.messageId || notification.mailId;
    
    // Kürze Body wenn zu lang
    const shortBody = body.length > 300 ? body.substring(0, 300) + '...' : body;

    // Nachricht an Slack senden
    const slackMessage = {
      channel: process.env.SLACK_CHANNEL_ID,
      text: `📧 Neue E-Mail von ${from}`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '📧 Neue E-Mail empfangen',
            emoji: true
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Von:*\n${from}`
            },
            {
              type: 'mrkdwn',
              text: `*Betreff:*\n${subject}`
            }
          ]
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Nachricht:*\n${shortBody || '_Keine Vorschau verfügbar_'}`
          }
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `Message ID: ${messageId || 'N/A'}`
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
