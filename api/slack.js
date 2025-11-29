const axios = require('axios');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { command, text, user_id, response_url } = req.body;

    if (command === '/send-email') {
      console.log('Command empfangen:', text);

      // Prüfe ob Access Token vorhanden ist
      if (!process.env.ZOHO_ACCESS_TOKEN) {
        return res.json({
          response_type: 'ephemeral',
          text: '❌ Fehler: ZOHO_ACCESS_TOKEN nicht konfiguriert. Bitte OAuth Flow durchführen!'
        });
      }

      // Parse: /send-email empfaenger@email.com | Betreff | Nachricht
      // ODER: /send-email empfaenger@email.com Betreff hier | Nachricht hier
      
      if (!text || text.trim().length === 0) {
        return res.json({
          response_type: 'ephemeral',
          text: `❌ *Format:*
\`/send-email empfaenger@email.com | Betreff | Nachricht\`

*Beispiel:*
\`/send-email test@example.com | Wichtige Info | Das ist der Text der E-Mail\``
        });
      }

      // Split by pipe
      const parts = text.split('|').map(p => p.trim());
      
      if (parts.length < 3) {
        return res.json({
          response_type: 'ephemeral',
          text: `❌ Fehler: Verwende Pipes (|) zum Trennen
*Format:* \`empfaenger@email.com | Betreff | Nachricht\`

*Beispiel:*
\`test@example.com | Hallo | Das ist meine Nachricht\``
        });
      }

      const recipient = parts[0].trim();
      const subject = parts[1].trim();
      const body = parts.slice(2).join('|').trim(); // Falls Nachricht | enthält

      // Validiere E-Mail
      if (!recipient.includes('@')) {
        return res.json({
          response_type: 'ephemeral',
          text: `❌ Ungültige E-Mail-Adresse: ${recipient}`
        });
      }

      // Sofortige Antwort
      res.json({
        response_type: 'ephemeral',
        text: `📤 E-Mail wird gesendet...
*An:* ${recipient}
*Betreff:* ${subject}`
      });

      try {
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
        const fromAddress = accountsResponse.data.data[0].primaryEmailAddress;

        // E-Mail senden
        const emailData = {
          fromAddress: fromAddress,
          toAddress: recipient,
          subject: subject,
          content: body,
          mailFormat: 'plaintext'
        };

        console.log('Sende E-Mail:', emailData);

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
          text: `✅ *E-Mail erfolgreich gesendet!*
*An:* ${recipient}
*Betreff:* ${subject}
*Von:* ${fromAddress}`
        });

      } catch (sendError) {
        console.error('Send Error Details:', sendError.response?.data || sendError.message);
        
        let errorMsg = '❌ Fehler beim Senden der E-Mail';
        
        if (sendError.response?.status === 401) {
          errorMsg = '❌ Authentifizierung fehlgeschlagen. Access Token ist abgelaufen oder ungültig. Bitte OAuth neu durchführen!';
        } else if (sendError.response?.data) {
          errorMsg = `❌ Fehler: ${JSON.stringify(sendError.response.data)}`;
        }

        await axios.post(response_url, { text: errorMsg });
      }
    }
  } catch (error) {
    console.error('Slack Command Error:', error.response?.data || error.message);
    
    // Fehler an User senden
    if (req.body?.response_url) {
      try {
        await axios.post(req.body.response_url, {
          text: `❌ Unerwarteter Fehler: ${error.message}`
        });
      } catch (e) {
        console.error('Fehler beim Senden der Fehlermeldung:', e);
      }
    }
    
    // Nur senden wenn res noch nicht gesendet wurde
    if (!res.headersSent) {
      res.status(200).json({ text: '❌ Fehler beim Verarbeiten' });
    }
  }
};
