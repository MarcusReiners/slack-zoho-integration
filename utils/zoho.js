import fetch from "node-fetch";

export async function getTokens(code) {
  const params = new URLSearchParams({
    code,
    client_id: process.env.ZOHO_CLIENT_ID,
    client_secret: process.env.ZOHO_CLIENT_SECRET,
    redirect_uri: process.env.ZOHO_REDIRECT_URI,
    grant_type: "authorization_code",
  });

  const response = await fetch("https://accounts.zoho.com/oauth/v2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params
  });

  const data = await response.json();
  return data; // enthält access_token + refresh_token
}

export async function refreshAccessToken(refresh_token) {
  const params = new URLSearchParams({
    refresh_token,
    client_id: process.env.ZOHO_CLIENT_ID,
    client_secret: process.env.ZOHO_CLIENT_SECRET,
    grant_type: "refresh_token",
  });

  const response = await fetch("https://accounts.zoho.com/oauth/v2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params
  });

  return await response.json(); // neuer access_token
}

export async function fetchEmails(access_token, account_id) {
  const response = await fetch(`https://mail.zoho.com/api/accounts/${account_id}/messages`, {
    headers: { "Authorization": `Zoho-oauthtoken ${access_token}` }
  });

  return await response.json();
}

export async function getAccounts(access_token) {
  const response = await fetch("https://mail.zoho.com/api/accounts", {
    headers: { "Authorization": `Zoho-oauthtoken ${access_token}` }
  });
  return await response.json();
}
