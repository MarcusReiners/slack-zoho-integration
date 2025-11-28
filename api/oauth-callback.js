import { getTokens } from "../../utils/zoho";

export default async function handler(req, res) {
  const code = req.query.code;
  if (!code) return res.status(400).send("Kein Code übergeben.");

  try {
    const tokens = await getTokens(code); // ruft Zoho API auf
    console.log("Tokens:", tokens);

    // Tokens speichern, z.B. in Datenbank oder ENV (für Test reicht console)
    res.send("OAuth erfolgreich! Du kannst dieses Fenster schließen.");
  } catch (err) {
    console.error(err);
    res.status(500).send("Fehler beim Token-Austausch");
  }
}
