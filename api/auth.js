const axios = require('axios');

module.exports = async (req, res) => {
  const { code, state } = req.query;

  if (!code) {
    // Redirect zu Zoho OAuth
    const authUrl = `https://accounts.zoho.${process.env.ZOHO_REGION}/oauth/v2/auth`;
    const params = new URLSearchParams({
      client_id: process.env.ZOHO_CLIENT_ID,
      redirect_uri: process.env.ZOHO_REDIRECT_URI,
      response_type: 'code',
      scope: 'ZohoMail.messages.READ,ZohoMail.messages.CREATE',
      access_type: 'offline',
      prompt: 'consent'
    });
    
    return res.redirect(`${authUrl}?${params}`);
  }

  try {
    // Token austauschen
    const tokenUrl = `https://accounts.zoho.${process.env.ZOHO_REGION}/oauth/v2/token`;
    const response = await axios.post(tokenUrl, null, {
      params: {
        code,
        client_id: process.env.ZOHO_CLIENT_ID,
        client_secret: process.env.ZOHO_CLIENT_SECRET,
        redirect_uri: process.env.ZOHO_REDIRECT_URI,
        grant_type: 'authorization_code'
      }
    });

    const { access_token, refresh_token } = response.data;

    // Speichere Tokens (in Produktion: Datenbank)
    console.log('Access Token:', access_token);
    console.log('Refresh Token:', refresh_token);

    res.send(`
      <html>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h2>✅ Authentifizierung erfolgreich!</h2>
          <p>Du kannst dieses Fenster jetzt schließen.</p>
          <p style="font-size: 12px; color: #666;">
            Tokens wurden generiert. Siehe Server-Logs.
          </p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('OAuth Error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Authentifizierung fehlgeschlagen',
      details: error.response?.data 
    });
  }
};