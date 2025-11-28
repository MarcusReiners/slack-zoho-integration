export default async function handler(req, res) {
  const code = req.query.code;

  if (!code) {
    return res.status(400).send("Kein code übergeben.");
  }

  // Hier kannst du später den Token-Austausch einbauen
  console.log("OAuth-Code erhalten:", code);

  res.send("OAuth-Code erfolgreich empfangen! Du kannst dieses Fenster schließen.");
}
