/* Backoffice-funktion för Lunch-TV (Cloudflare Worker).
   Tar emot ändringar från admin.html och sparar dem som en commit i GitHub-repot.
   Inställningar (Settings → Variables and Secrets i Cloudflare):
     GITHUB_TOKEN  (Secret)  token med behörighet Contents: Read and write på just det här repot
     PIN           (Secret)  koden personalen skriver in i admin.html
     REPO          (Text)    t.ex. "anvandarnamn/lunch-tv"
     BRANCH        (Text)    t.ex. "main"  (valfri, standard main)
     ALLOWED_ORIGIN (Text)   adressen där TV-sidan ligger, t.ex. "https://anvandarnamn.github.io" (utan snedstreck sist)
*/

const FILER = ["allergener.json", "frukost.json", "hockey.json", "slutsald.json"];   // enda filerna som får ändras
const MAX_BYTES = 40000;
const ALLERGENER = ["gluten", "laktos", "nötter", "ägg", "fisk", "skaldjur", "blötdjur", "selleri", "senap", "soja", "sesam", "jordnötter", "lupin", "sulfit"];
const DAGAR = ["måndag", "tisdag", "onsdag", "torsdag", "fredag"];
const TID = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATUM = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

const json = (obj, status, cors) => new Response(JSON.stringify(obj), { status: status || 200, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...cors } });
const kort = (s, n = 200) => typeof s === "string" && s.length <= n;

function lika(a, b){                       // jämför PIN utan att läcka hur många tecken som stämde
  const A = new TextEncoder().encode(String(a)), B = new TextEncoder().encode(String(b));
  let d = A.length ^ B.length;
  for(let i = 0; i < Math.max(A.length, B.length); i++) d |= (A[i] || 0) ^ (B[i] || 0);
  return d === 0;
}

/* ---- Validering: nekar allt som skulle få TV-sidan att sluta fungera ---- */
function allergLista(v, fel, var_){
  if(v === null) return;
  if(!Array.isArray(v)) return fel.push(var_ + ": måste vara en lista eller null");
  v.forEach(x => { if(!ALLERGENER.includes(x)) fel.push(var_ + ": okänd allergen " + JSON.stringify(x)); });
}
function validera(fil, d){
  const fel = [];
  if(typeof d !== "object" || d === null || Array.isArray(d)) return ["Filen måste vara ett objekt"];
  if(fil === "allergener.json"){
    if(!Number.isInteger(d.vecka)) fel.push("vecka saknas");
    if(typeof d.dagar !== "object" || d.dagar === null) fel.push("dagar saknas");
    else for(const [dag, rätter] of Object.entries(d.dagar)){
      if(!DAGAR.includes(dag)) fel.push("okänd dag " + dag);
      else if(typeof rätter !== "object" || rätter === null) fel.push(dag + ": fel format");
      else for(const [namn, lista] of Object.entries(rätter)){ if(!kort(namn, 300)) fel.push("för långt rättnamn"); allergLista(lista, fel, dag + " / " + namn); }
    }
    allergLista(d.vegetariskt === undefined ? null : d.vegetariskt, fel, "vegetariskt");
  }
  if(fil === "frukost.json"){
    if(!d.tid || !TID.test(d.tid.start || "") || !TID.test(d.tid.slut || "")) fel.push("frukosttid måste vara HH:MM");
    if(!Array.isArray(d.dagar) || d.dagar.some(x => ![...DAGAR, "lördag", "söndag"].includes(x))) fel.push("dagar är felaktiga");
    if(!kort(d.rubrik || "", 60)) fel.push("rubrik för lång");
    if(!Array.isArray(d.rader) || d.rader.length > 12) fel.push("rader saknas eller för många");
    else d.rader.forEach((r, i) => {
      if(!r || !kort(r.namn || "", 80) || !r.namn) fel.push("rad " + (i + 1) + ": namn saknas");
      if(!kort(r.pris || "", 20)) fel.push("rad " + (i + 1) + ": pris");
      if(r.beskrivning !== undefined && !kort(r.beskrivning, 200)) fel.push("rad " + (i + 1) + ": beskrivning för lång");
      if(r.allergener !== undefined) allergLista(r.allergener, fel, "rad " + (i + 1));
    });
  }
  if(fil === "slutsald.json"){
    if(!DATUM.test(d.datum || "")) fel.push("datum måste vara ÅÅÅÅ-MM-DD");
    if(!Array.isArray(d.rätter) || d.rätter.length > 60 || d.rätter.some(x => !kort(x, 300))) fel.push("rätter är felaktiga");
  }
  if(fil === "hockey.json"){
    if(!d.tid || !TID.test(d.tid.start || "")) fel.push("uppladdningens starttid måste vara HH:MM");
    if(!TID.test(d.matchstart || "")) fel.push("matchstart måste vara HH:MM");
    if(!Array.isArray(d.datum) || d.datum.length > 120 || d.datum.some(x => !DATUM.test(x))) fel.push("datum måste vara ÅÅÅÅ-MM-DD");
    if(!kort(d.rubrik || "", 80) || !kort(d.underrubrik || "", 200) || !kort(d.banner || "", 80)) fel.push("för lång text");
    if(!Array.isArray(d.rader) || d.rader.length > 10) fel.push("rader saknas eller för många");
    else d.rader.forEach((r, i) => { if(!r || !r.namn || !kort(r.namn, 60) || !kort(r.pris || "", 20) || !kort(r.not || "", 60)) fel.push("hockeyrad " + (i + 1)); });
    if(d.paket && (!kort(d.paket.namn || "", 60) || !kort(d.paket.pris || "", 20))) fel.push("paketpris");
  }
  return fel;
}

/* ---- GitHub ---- */
const b64 = s => { const b = new TextEncoder().encode(s); let t = ""; b.forEach(c => t += String.fromCharCode(c)); return btoa(t); };
const unb64 = s => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/\n/g, "")), c => c.charCodeAt(0)));
function gh(env, path, init){
  return fetch(`https://api.github.com/repos/${env.REPO}/contents/${path}`, { ...init, headers: { authorization: "Bearer " + env.GITHUB_TOKEN, accept: "application/vnd.github+json", "user-agent": "lunch-tv-backoffice", "x-github-api-version": "2022-11-28", ...(init && init.headers) } });
}

export default {
  async fetch(req, env){
    const origin = req.headers.get("origin") || "";
    const ok = !env.ALLOWED_ORIGIN || origin === env.ALLOWED_ORIGIN;
    const cors = ok && origin ? { "access-control-allow-origin": origin, "vary": "origin", "access-control-allow-headers": "content-type, x-pin", "access-control-allow-methods": "GET, POST, OPTIONS" } : { "vary": "origin" };
    if(req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if(!ok) return json({ fel: "Otillåten avsändare" }, 403, cors);
    if(!env.GITHUB_TOKEN || !env.PIN || !env.REPO) return json({ fel: "Funktionen är inte färdiginställd (GITHUB_TOKEN, PIN, REPO)" }, 500, cors);

    if(!lika(req.headers.get("x-pin") || "", env.PIN)){
      await new Promise(r => setTimeout(r, 800));                    // bromsar gissning av koden
      return json({ fel: "Fel kod" }, 401, cors);
    }
    const url = new URL(req.url), gren = env.BRANCH || "main";

    try {
      if(req.method === "GET" && url.pathname === "/api/ping") return json({ ok: true }, 200, cors);

      if(req.method === "GET" && url.pathname === "/api/get"){
        const fil = url.searchParams.get("fil");
        if(!FILER.includes(fil)) return json({ fel: "Okänd fil" }, 400, cors);
        const r = await gh(env, fil + "?ref=" + encodeURIComponent(gren));
        if(r.status === 404) return json({ data: null }, 200, cors);
        if(!r.ok) return json({ fel: "GitHub svarade " + r.status }, 502, cors);
        const j = await r.json();
        return json({ data: JSON.parse(unb64(j.content)) }, 200, cors);
      }

      if(req.method === "POST" && url.pathname === "/api/save"){
        const txt = await req.text();
        if(txt.length > MAX_BYTES) return json({ fel: "För stor fil" }, 413, cors);
        const { fil, data } = JSON.parse(txt);
        if(!FILER.includes(fil)) return json({ fel: "Okänd fil" }, 400, cors);
        const fel = validera(fil, data);
        if(fel.length) return json({ fel: "Ändringen sparades inte: " + fel.slice(0, 5).join("; ") }, 422, cors);
        const innehåll = JSON.stringify(data, null, 2) + "\n";
        for(let försök = 0; försök < 3; försök++){                    // nytt försök om någon annan hunnit committa
          const cur = await gh(env, fil + "?ref=" + encodeURIComponent(gren));
          const sha = cur.ok ? (await cur.json()).sha : undefined;
          const put = await gh(env, fil, { method: "PUT", body: JSON.stringify({ message: "Backoffice: uppdatera " + fil, content: b64(innehåll), branch: gren, ...(sha ? { sha } : {}) }) });
          if(put.ok) return json({ ok: true }, 200, cors);
          if(put.status !== 409 && put.status !== 422) return json({ fel: "GitHub svarade " + put.status }, 502, cors);
        }
        return json({ fel: "Någon annan sparade samtidigt. Försök igen." }, 409, cors);
      }
      return json({ fel: "Hittades inte" }, 404, cors);
    } catch(e){
      return json({ fel: "Något gick fel: " + e.message }, 500, cors);
    }
  }
};
