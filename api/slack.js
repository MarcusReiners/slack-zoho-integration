const axios = require('axios');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { command, text, user_id, response_url } = req.body;

    if (command === '/send-email') {
      // E-Mail über Zoho API senden
      const [recipient, ...messageParts] = text.split(' ');
      const message = messageParts.join(' ');

      // Sofortige Antwort an Slack
      res.json({
        response_type: 'ephemeral',
        text: `E-Mail wird an ${recipient} gesendet...`
      });

      // E-Mail senden (async)
      const emailData = {
        fromAddress: 'deine@email.com',
        toAddress: recipient,
        subject: 'Nachricht von Slack',
        content: message
      };

      await axios.post(
        `https://mail.zoho.${process.env.ZOHO_REGION}/api/accounts/YOUR_ACCOUNT_ID/messages`,
        emailData,
        {
          headers: {
            'Authorization': `Bearer ${process.env.ZOHO_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Erfolgsbestätigung senden
      await axios.post(response_url, {
        text: `✅ E-Mail erfolgreich an ${recipient} gesendet!`
      });
    }
  } catch (error) {
    console.error('Slack Command Error:', error);
    res.status(500).json({ error: 'Fehler beim Senden' });
  }
};