# Backoffice för personalen

Sidan `admin.html` låter personalen ändra **allergener**, **frukostmenyn** och **hockeykvällarna** samt ändra **lunchtider**, **brunch** och **stängda dagar** (röda dagar) och markera rätter som **slutsålda** direkt från en iPad eller telefon,
utan GitHub-konto. De skriver bara in en kod. Ändringen syns på TV:n inom ca 2 minuter.

Adress: `https://DITT-ANVÄNDARNAMN.github.io/lunch-tv/admin.html`
Lägg den som bokmärke eller som ikon på hemskärmen (Dela → Lägg till på hemskärmen).

## Hur det hänger ihop

```
Personalen  →  admin.html  →  Cloudflare-funktionen (kollar koden)  →  GitHub (sparar filen)  →  TV-sidan uppdateras
```

GitHub Pages kan bara visa sidor, inte ta emot ändringar. Därför finns en liten gratis funktion hos Cloudflare (`worker/worker.js`)
som kontrollerar koden och sparar ändringen i ert repo. GitHub-nyckeln ligger bara i Cloudflare, aldrig på sidan eller hos personalen.
Funktionen får bara ändra sju filer (`allergener.json`, `frukost.json`, `brunch.json`, `lunch.json`, `hockey.json`, `oppettider.json`, `slutsald.json`) och nekar ändringar som skulle göra TV:n trasig.

## Engångsinställning (ca 20 minuter, görs av en person)

### 1. Ladda upp de nya filerna till GitHub
Dra in `admin.html`, `BACKOFFICE.md`, `slutsald.json`, `brunch.json`, `lunch.json`, `oppettider.json` och uppdaterade `index.html`, `README.md`, `hockey.json`, `frukost.json`.
Skapa mappen `worker` genom *Add file → Create new file*, skriv `worker/worker.js` som filnamn och klistra in innehållet från filen.
Uppdatera även schemat: öppna `.github/workflows/uppdatera-lunchmeny.yml`, tryck på pennan och ersätt innehållet med den nya versionen.
(Det nya schemat hanterar att personalen och menyhämtningen sparar samtidigt.)

### 2. Skapa en nyckel på GitHub
1. github.com → din profilbild → *Settings* → längst ner *Developer settings* → *Personal access tokens* → *Fine-grained tokens* → *Generate new token*.
2. Namn: `lunch-tv-backoffice`. Giltighet: längsta möjliga (1 år). Lägg en påminnelse i kalendern att göra en ny då.
3. *Repository access* → *Only select repositories* → välj `lunch-tv`.
4. *Permissions* → *Repository permissions* → *Contents* → **Read and write**. Inget annat.
5. *Generate token* och **kopiera den** (visas bara en gång).

### 3. Skapa funktionen på Cloudflare
1. Skapa ett gratis konto på [dash.cloudflare.com](https://dash.cloudflare.com).
2. *Workers & Pages* → *Create* → *Create Worker*. Namn: `lunch-tv`. Tryck *Deploy*.
3. Tryck *Edit code*, radera allt som står där, klistra in hela innehållet i `worker/worker.js` och tryck *Deploy*.
4. Gå till funktionens *Settings* → *Variables and Secrets* → *Add* och lägg in:

| Namn | Typ | Värde |
|---|---|---|
| `GITHUB_TOKEN` | Secret | nyckeln från steg 2 |
| `PIN` | Secret | koden personalen ska använda. Välj minst 8 tecken, gärna ett kort lösenord |
| `REPO` | Text | `DITT-ANVÄNDARNAMN/lunch-tv` |
| `BRANCH` | Text | `main` |
| `ALLOWED_ORIGIN` | Text | `https://DITT-ANVÄNDARNAMN.github.io` (utan snedstreck sist) |

5. Tryck *Deploy*. Funktionens adress står överst, ungefär `https://lunch-tv.NAMN.workers.dev`. Kopiera den.

### 4. Koppla ihop sidan med funktionen
Öppna `admin.html` på GitHub, tryck på pennan, hitta raden `api: "",` överst i skriptdelen och skriv adressen mellan citattecknen:
`api: "https://lunch-tv.NAMN.workers.dev",`. Tryck *Commit changes*.

### 5. Testa
Öppna `admin.html` på sidan, skriv koden, ändra något litet (till exempel lägg till ett hockeydatum), tryck *Spara* och kontrollera att ändringen syns på TV-sidan efter ett par minuter.

## Så använder personalen det

- **Slutsålt:** Fliken *Slutsålt* visar dagens lunch, veckans vegetariska, frukostraderna och hockeyraderna. Tryck *Markera slutsåld* på en rätt och sedan *Spara*.
  På TV:n blir rätten överstruken med en röd SLUTSÅLD-skylt inom ca 2 minuter. Allt nollställs automatiskt nästa dag, och *Finns igen* tar bort markeringen direkt.
- **Allergener:** Varje vecka hämtas nya rätter automatiskt. Öppna fliken *Allergener*, tryck på de allergener som varje rätt innehåller och tryck *Spara*.
  "Inga allergener" betyder att rätten inte innehåller något av de 14. En rätt som inte rörts visar "fråga personalen" på TV:n, aldrig "inga".
  Allergenerna är köksets ansvar och måste stämma med recepten.
- **Lunch:** Här ändrar ni lunchens tider och vilka dagar lunch serveras. Är rutan *Använd egna lunchtider* ikryssad gäller era tider, annars ICA:s.
- **Brunch:** Samma som frukost, för lördagsbrunchen (nu 07:00–15:00, 79:-, inkl gröt, ägg, bacon och våfflor). Priset är en egen siffra, så ändrar ni frukostpriset måste ni ändra det här också.
- **Stängt:** TV:n stänger automatiskt på svenska röda dagar och visar då "Stängt idag" med orsak och när ni öppnar igen (dagen före står "Stängt imorgon" längst ner). Under *Kommande röda dagar* trycker ni *Ha öppet* för att ha öppet en röd dag (och *Stäng igen* för att ångra).
  Under *Stäng andra dagar* lägger ni in egna stängda dagar, även flera dagar i rad, med valfri orsak. Dagar som passerat städas bort automatiskt. Julafton, Midsommarafton och Nyårsafton är inte röda dagar och måste läggas in som egna stängda dagar.
- **Frukost:** Ändra rader, priser, beskrivningar, tider och dagar (frukostskylten visar inga allergener). Använd pilarna för att ändra ordning.
- **Hockey:** Lägg till eller ta bort matchdatum, ändra matchstart, uppladdningstid, texter och priser.

Sidan varnar om något är osparat. Byter ni flik med osparade ändringar får ni en fråga först.

## Uppdatera funktionen när något nytt tillkommit

Har du redan satt upp backofficet och får en ny version av `worker/worker.js` (som när *Slutsålt*, *Lunch*, *Brunch* och *Stängt* tillkom) måste den även bytas på Cloudflare, annars nekas sparandet av de nya flikarna:
*Workers & Pages* → din funktion `lunch-tv` → *Edit code* → radera allt, klistra in hela nya `worker.js` → *Deploy*. Variablerna och koden ligger kvar.

## Säkerhet

- Koden (`PIN`) är det enda som skyddar. Välj en kod som inte är lätt att gissa och byt den vid behov under *Variables and Secrets*. Funktionen bromsar felaktiga försök.
- Den som har koden kan ändra allergener, frukost och hockey, men ingenting annat i repot.
- Nyckeln kan när som helst tas bort på GitHub (*Developer settings*), då slutar sparandet fungera.

## Om något blir fel

| Meddelande | Orsak |
|---|---|
| "Backoffice är inte kopplat…" | `api:` i `admin.html` är tom (steg 4) |
| "Fel kod" | Koden stämmer inte med `PIN` i Cloudflare |
| "Otillåten avsändare" | `ALLOWED_ORIGIN` är fel. Ska vara `https://DITT-ANVÄNDARNAMN.github.io` |
| "GitHub svarade 401/403/404" | Nyckeln har gått ut eller saknar behörighet, eller `REPO` är fel (steg 2 och 3) |
| "Någon annan sparade samtidigt" | Tryck *Spara* igen |
| "Ändringen sparades inte: …" | Något värde är ogiltigt, t.ex. en tid som inte är HH:MM. Texten säger vad |

Lunchrätter och lunchpriser hämtas fortfarande automatiskt från ICA:s sida och ändras inte i backofficet.
