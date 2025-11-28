import { fetchEmails, getAccounts, refreshAccessToken } from "../../utils/zoho";
import { sendToSlack } from "../../utils/slack";

export default async function handler(req, res) {
  let access_token = process.env.ZOHO_ACCESS_TOKEN;
  const refresh_token = process.env.ZOHO_REFRESH_TOKEN;

  // Optional: Access Token erneuern, falls abgelaufen
  // access_token = (await refreshAccessToken(refresh_token)).access_token;

  const accounts = await getAccounts(access_token);
  const account_id = accounts[0].accountId; // meist 1 Account

  const emails = await fetchEmails(access_token, account_id);

  for (const email of emails.data) {
    await sendToSlack(`Neue Email von ${email.from}:\nBetreff: ${email.subject}`);
  }

  res.send("Emails abgerufen und an Slack gesendet.");
}
