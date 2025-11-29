const axios = require('axios');

// WICHTIG: Access Token muss aus OAuth Flow gespeichert werden
// Für den Anfang: Setze ihn manuell als Umgebungsvariable
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { command, text, user_id, response_url } = req.body;

    if (command === '/send-email') {
      // Parse: /send-email empfaenger@email.com Betreff | Nachricht
      const parts = text.split(' ');
      
      if (parts.length < 2) {
        return res.json({
          response_type: 'ephemeral',
          text: '❌ Format: `/send-email empfaenger@email.com Betreff | Nachricht`'
        });
      }

      const recipient = parts[0];
      const restText = parts.slice(1).join(' ');
      const [subject, ...bodyParts] = restText.split('|');
      const body = bodyParts.join('|').trim();

      // Sofortige Antwort
      res.json({
        response_type: 'ephemeral',
        text: `📤 E-Mail wird an ${recipient} gesendet...`
      });

      // Hole Account ID
      const accountsResponse = await axios.get(
        `https://mail.zoho.${process.env.ZOHO_REGION}/api/accounts`,
        {
          headers: {
            'Authorization': `Zoho-oauthtoken ${process.env.ZOHO_ACCESS_TOKEN}`
          }
        }
      );

      const accountId = accountsResponse.data.data[0].accountId;

      // E-Mail senden
      const emailData = {
        fromAddress: accountsResponse.data.data[0].primaryEmailAddress,
        toAddress: recipient,
        subject: subject.trim() || 'Nachricht von Slack',
        content: body || 'Keine Nachricht',
        mailFormat: 'plaintext'
      };

      await axios.post(
        `https://mail.zoho.${process.env.ZOHO_REGION}/api/accounts/${accountId}/messages`,
        emailData,
        {
          headers: {
            'Authorization': `Zoho-oauthtoken ${process.env.ZOHO_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Erfolgsbestätigung
      await axios.post(response_url, {
        response_type: 'in_channel',
        text: `✅ E-Mail erfolgreich an ${recipient} gesendet!\n*Betreff:* ${subject}`
      });
    }
  } catch (error) {
    console.error('Slack Command Error:', error.response?.data || error.message);
    
    // Fehler an User senden
    if (req.body.response_url) {
      await axios.post(req.body.response_url, {
        text: `❌ Fehler: ${error.response?.data?.message || error.message}`
      });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
};
