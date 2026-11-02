// Sends the Bewerbungs- and Kontaktformular to the Supabase Edge Function "send-form",
// which mails the team and sends a confirmation to the sender (via Resend).
// The anon key is public by design; the function itself validates every field.
(function () {
  const FUNCTION_URL = 'https://iaqcjnphaiuhiatrigzu.supabase.co/functions/v1/send-form';
  const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhcWNqbnBoYWl1aGlhdHJpZ3p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg1MzA4OTIsImV4cCI6MjEwNDEwNjg5Mn0.aR83KXrza78TTue6oNV9mcl6ojk3LEcKOQr1uCB2Css';

  function lang() { return document.documentElement.lang === 'en' ? 'en' : 'de'; }

  // type: 'bewerbung' | 'kontakt'; thanks = { de, en }
  window.submitGlpForm = async function (e, type, thanks) {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('button[type="submit"]');
    const en = lang() === 'en';

    const body = { type: type, lang: lang() };
    new FormData(form).forEach(function (value, key) { body[key] = value; });

    if (btn) btn.disabled = true;
    try {
      const res = await fetch(FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: ANON_KEY, Authorization: 'Bearer ' + ANON_KEY },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        alert(en ? thanks.en : thanks.de);
        form.reset();
      } else if (res.status === 429) {
        alert(en ? 'Too many submissions in a short time. Please try again in a few minutes.' : 'Zu viele Einsendungen in kurzer Zeit. Bitte versuche es in ein paar Minuten erneut.');
      } else {
        throw new Error('status ' + res.status);
      }
    } catch (err) {
      alert(en ? 'Error sending. Please try again.' : 'Fehler beim Senden. Bitte versuche es erneut.');
    } finally {
      if (btn) btn.disabled = false;
    }
  };
})();
