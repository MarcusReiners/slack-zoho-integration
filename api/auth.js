const axios = require('axios');

module.exports = async (req, res) => {
  const { code, state } = req.query;

  // Umgebungsvariablen prüfen
  const region = process.env.ZOHO_REGION || 'eu';
  const clientId = process.env.ZOHO_CLIENT_ID;
  const clientSecret = process.env.ZOHO_CLIENT_SECRET;
  const redirectUri = process.env.ZOHO_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return res.status(500).json({
      error: 'Fehlende Konfiguration',
      message: 'ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET und ZOHO_REDIRECT_URI müssen gesetzt sein'
    });
  }

  if (!code) {
    // Redirect zu Zoho OAuth
    const authUrl = `https://accounts.zoho.${region}/oauth/v2/auth`;
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'ZohoMail.messages.READ,ZohoMail.messages.CREATE,ZohoMail.accounts.READ',
      access_type: 'offline',
      prompt: 'consent'
    });
    
    return res.redirect(`${authUrl}?${params}`);
  }

  try {
    // Token austauschen
    const tokenUrl = `https://accounts.zoho.${region}/oauth/v2/token`;
    const response = await axios.post(tokenUrl, null, {
      params: {
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      }
    });

    const { access_token, refresh_token, expires_in } = response.data;

    // WICHTIG: Speichere diese Tokens!
    console.log('='.repeat(60));
    console.log('WICHTIG: Kopiere diese Tokens in deine Umgebungsvariablen!');
    console.log('='.repeat(60));
    console.log('Access Token:', access_token);
    console.log('Refresh Token:', refresh_token);
    console.log('Expires in:', expires_in, 'seconds');
    console.log('='.repeat(60));

    res.send(`
      <html>
        <head>
          <style>
            body { font-family: Arial; padding: 50px; background: #f5f5f5; }
            .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            h2 { color: #22c55e; }
            .token-box { background: #f9fafb; padding: 15px; border-radius: 5px; margin: 10px 0; font-family: monospace; font-size: 12px; word-break: break-all; border-left: 4px solid #3b82f6; }
            .warning { background: #fef3c7; padding: 15px; border-radius: 5px; border-left: 4px solid #f59e0b; margin-top: 20px; }
            .label { font-weight: bold; color: #6b7280; margin-bottom: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>✅ Authentifizierung erfolgreich!</h2>
            <p>Deine Tokens wurden generiert. Kopiere sie und füge sie in Vercel als Umgebungsvariablen hinzu.</p>
            
            <div class="label">Access Token (gültig für ~1 Stunde):</div>
            <div class="token-box">${access_token}</div>
            
            <div class="label">Refresh Token (permanent):</div>
            <div class="token-box">${refresh_token}</div>
            
            <div class="warning">
              <strong>⚠️ Nächste Schritte:</strong><br>
              1. Gehe zu Vercel Dashboard → Dein Projekt → Settings → Environment Variables<br>
              2. Füge hinzu: <code>ZOHO_ACCESS_TOKEN</code> = (Access Token von oben)<br>
              3. Füge hinzu: <code>ZOHO_REFRESH_TOKEN</code> = (Refresh Token von oben)<br>
              4. Redeploy dein Projekt<br>
              <br>
              <strong>Hinweis:</strong> Der Access Token läuft nach 1 Stunde ab. Du musst dann einen Token-Refresh implementieren!
            </div>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('OAuth Error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Authentifizierung fehlgeschlagen',
      details: error.response?.data,
      region: region
    });
  }
};
