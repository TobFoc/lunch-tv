# Lunch-TV

Visar dagens lunch på en skärm. Menyn hämtas automatiskt från
[ICA Focus lunchsida](https://www.ica.se/butiker/kvantum/goteborg/ica-focus-1004247/tjanster/lunch/)
varje vardagsmorgon och publiceras på en webbadress som TV:n (UniFi Cast / SmartSign) kan visa.

## Filer

| Fil | Vad den gör |
|---|---|
| `index.html` | Själva TV-sidan, utformad som lunchskylten: betong mot vitt kakel. Visar rätt dags rätter under lunchtid. |
| `assets/ica-focus-logo.png` | Den kvadratiska ICA Focus-logotypen nere till höger. Byt ut filen (samma namn) för att byta logotyp. |
| `hamta_meny.py` | Läser menyn från ICA:s sida och skriver `menu.json`. |
| `menu.json` | Veckans meny. Skrivs över automatiskt. |
| `admin.html` | Backoffice för personalen: allergener, frukost och hockey utan GitHub-konto. Se `BACKOFFICE.md`. |
| `worker/worker.js` | Sparfunktionen som backofficet använder (körs på Cloudflare). Se `BACKOFFICE.md`. |
| `lunch.json` | Egna lunchtider och lunchdagar (går före ICA:s tider). Ändras i backofficet. |
| `brunch.json` | Brunchen (lördagar 07:00–15:00): tider, dagar, priser. |
| `oppettider.json` | Röda dagar och andra stängda/öppna dagar. Ändras i backofficet. |
| `slutsald.json` | Vilka rätter som är slutsålda idag. Sätts i backofficet och nollställs av sig själv nästa dag. |
| `hockey.json` | Frölundas hemmamatcher (datum) och hockeymenyn med priser. Lägg till/ta bort datum här. |
| `frukost.json` | Frukostmenyn: tider, dagar, priser och texter. Ändra här när något ändras. |
| `allergener.json` | Allergener per rätt. **Fylls i av köket varje vecka**, se avsnittet Allergener nedan. |
| `.github/workflows/uppdatera-lunchmeny.yml` | Schemat som kör allt automatiskt på GitHub. |

## Sätta upp (ca 15 minuter)

1. **Skapa konto** på [github.com](https://github.com) (gratis).
2. **Skapa ett repository:** plusset uppe till höger → *New repository*.
   Namn: `lunch-tv`. Välj **Public** (gratis Pages kräver det; menyn är ändå publik på ICA:s sida). Klicka *Create repository*.
3. **Ladda upp filerna:** *Add file → Upload files*. Dra in `index.html`, `hamta_meny.py`, `menu.json`, `allergener.json`, `frukost.json`, `brunch.json`, `lunch.json`, `oppettider.json`, `hockey.json`, `slutsald.json`, `README.md` och mappen `assets`. Klicka *Commit changes*.
4. **Lägg till schemat.** Mappen `.github` är dold på Mac/Windows och följer ibland inte med vid uppladdning, så gör så här:
   *Add file → Create new file*, skriv i namnfältet exakt
   `.github/workflows/uppdatera-lunchmeny.yml`
   (skriver du snedstreck skapas mapparna automatiskt), klistra in innehållet från filen med samma namn och tryck *Commit changes*.
5. **Slå på Pages:** *Settings → Pages → Build and deployment → Source: GitHub Actions*.
6. **Starta första körningen:** fliken *Actions* → *Uppdatera lunchmeny* → *Run workflow*. Efter någon minut visas en grön bock.
7. **Din adress** blir `https://DITT-ANVÄNDARNAMN.github.io/lunch-tv/`. Öppna den i en webbläsare och kontrollera att dagens lunch visas.
8. **Peka TV:n mot adressen** (UniFi Connect eller SmartSign: lägg in adressen som webbsida/URL-innehåll).

Vill personalen ändra allergener, frukost och hockey utan GitHub: se `BACKOFFICE.md`.

Därefter sköter det sig självt. Menyn uppdateras varje vardag och sparas som en ny version i repot när något ändrats.

## Om något blir fel

- **Röd kryss i Actions:** klicka på körningen och på det röda steget, så ser du felmeddelandet.
- **TV:n visar "Veckans meny är inte publicerad ännu":** ICA har inte lagt upp den nya veckan. Sidan visar då hellre ingenting än förra veckans rätter. Den rättar sig själv när menyn finns på ICA:s sida.
- **ICA har ändrat utseendet på sin sida:** skriptet hittar då ingen meny och behåller den gamla. Då behöver `hamta_meny.py` justeras.
- **Ändra lunchtider eller utseende:** redigera `index.html` (inställningar överst i skriptdelen, `CONFIG`) direkt på GitHub med pennikonen. Ändringen publiceras automatiskt.

## Vad som visas när

Sidan väljer själv vy efter klockan (`visa: "auto"` i `CONFIG`):

| Tid | Vy |
|---|---|
| Frölundas hemmamatchdagar 16:30 till matchstart | **Hockeykväll**: mörk skylt med priser och paketpris (datum och priser i `hockey.json`) |
| Röd dag eller annan stängd dag (hela dagen) | **Stängt idag**: orsak och när ni öppnar igen. Dagen före står "Stängt imorgon" i fotraden |
| Lördagar 07:00–15:00 | **Brunch**: buffé med pris från `brunch.json` |
| Vardagar 07:00–10:00 | **Frukost**: numrerad prislista från `frukost.json` |
| Lunchtid (från `lunch.json`, annars ICA:s tider, vanligen 11:00–14:30) | **Dagens lunch**: dagens rätter med beskrivning och allergener |
| Resten av tiden, även helger | **Veckans lunch**: hela veckans meny, dagens rad markerad i rött tills lunchen är slut |

Lunchtiderna läses från ICA:s sida. Frukosttiderna och vilka dagar frukost visas står i `frukost.json`.
Lördagar visas veckomenyn hela dagen, eftersom ICA:s sida anger att det är stängt.

**Frukostmenyn** ändrar du genom att öppna `frukost.json` på github.com och trycka på pennikonen. Priser och texter
står i listan `rader`. Lägg till en rad genom att kopiera en av de andra, och glöm inte kommatecken mellan raderna.
Frukostskylten visar inga allergenrader.

## Hockeykvällar

På dagar som står i `datum` i `hockey.json` gäller detta:
- **Hela dagen fram till matchstart** visas en liten banner under rubriken, oavsett om skylten visar frukost, lunch eller veckan: "Hockeykväll i restaurangen! Uppladdning 16:30 till matchstart 19:00 ikväll".
- **16:30 till matchstart** byter skylten till hockeyvyn med priser och paketpris.
- **Efter matchstart** visas inget om hockey, och skylten går tillbaka till vanliga vyn.

Matchstarten står i `matchstart` (nu `"19:00"`), uppladdningens start i `tid.start`. Datumen skrivs `"ÅÅÅÅ-MM-DD"` med kommatecken emellan.
Schemat är hämtat från goteborg.com och omfattar vardagsmatcher; lördagsmatcher (15:15) är inte med. Klubben kan flytta matcher, så kontrollera ibland.
Test: `?hockey=hockey.json&visa=hockey` visar hockeyskylten direkt.

## Allergener

Under varje rätt visas **Allergener:** med en symbol och ett ord per allergen. Menyn på ICA:s sida innehåller ingen
allergeninformation, och den **gissas aldrig**. Uppgifterna kommer från `allergener.json`, som köket fyller i.

**Varje vecka (tar någon minut):**
1. När den nya menyn har hämtats (vardagsmorgon) skapas en ny `allergener.json` med alla veckans rätter och `null` bakom varje.
2. Öppna filen på github.com, tryck på pennikonen och byt `null` mot en lista, till exempel
   `"Slottsstek": ["gluten", "laktos"]`.
3. Tryck *Commit changes*. Sidan uppdateras inom ett par minuter.

**Vad som visas på TV:n**

| I filen | På TV:n |
|---|---|
| `["gluten", "laktos"]` | Symbol och ord för varje allergen |
| `[]` | "Allergener: inga" (rätten innehåller inget av de 14) |
| `null`, rätten saknas, eller filen är från en annan vecka | "Allergener: fråga personalen" |
| Ett ord som inte känns igen | Visas med ett utropstecken, så att uppgiften inte försvinner |

Giltiga ord (de 14 allergenerna enligt EU): `gluten`, `laktos` (eller `mjölk`), `nötter`, `ägg`, `fisk`, `skaldjur`,
`blötdjur`, `selleri`, `senap`, `soja`, `sesam`, `jordnötter`, `lupin`, `sulfit`.
Rättens namn måste stå exakt som på TV:n, så ändra inte namnen i filen.
Du kan även skriva flera allergener som en text: `"gluten, laktos"`.

Allergenuppgifterna är köksets ansvar och måste stämma med recepten. Kontrollera dem varje vecka.

## Anpassa utseendet

Överst i skriptdelen av `index.html` finns `CONFIG`:

- `visa: "auto"` väljer vy efter klockan (se ovan). `"vecka"` visar alltid hela veckan, `"dag"` alltid dagens lunch och `"frukost"` alltid frukostmenyn.
- `underrubrik` är texten under rubriken (nu "Bröd, salladsbuffé & kaffe ingår"). Kontrollera att den stämmer.
- `notis` är texten längst ner (nu "Fråga gärna personalen om var köttet och fisken kommer från").
- `visaAllergener: false` döljer allergenraderna helt.
- `pris` låter dig skriva priset själv, till exempel `"99:-"`. Lämnas det som `null` hämtas "Dagens lunch" från ICA:s sida (just nu 129:-).

Test utan att vänta på lunchtid genom att lägga till detta efter adressen:
`?dag=torsdag&tid=12:00` visar torsdag klockan 12:00, `?dag=onsdag&tid=08:00` visar frukost, och `?visa=vecka` visar veckovyn.
Allergener visas i dagsvyn, men inte i veckovyn eller på frukostskylten, som bara visar rätternas namn under varje dag.

Typsnittet (Barlow Condensed) laddas från Google Fonts och TV:n måste därför ha internet. Utan det används ett reservtypsnitt, och layouten anpassar sig själv så att allt ryms.

## Lär dig GitHub: de viktigaste begreppen

- **Repository (repo):** en mapp med dina filer på GitHub, tillsammans med hela historiken över ändringar.
- **Commit:** ett sparat ögonblick. Varje gång du ändrar något och trycker *Commit changes* sparas en version med datum, vem och vad som ändrades. Du kan alltid gå tillbaka.
- **Branch:** en parallell version av projektet. Huvudgrenen heter `main`. Du behöver inga fler grenar för det här projektet.
- **Actions / workflow:** GitHubs sätt att köra uppgifter åt dig, här hämta menyn varje morgon. Beskrivs i en `.yml`-fil under `.github/workflows`.
- **Pages:** gratis webbhotell för statiska sidor direkt från ett repo.
- **Pull request:** förslag på ändring som andra kan granska innan den slås ihop. Används i team, inte nödvändigt här.
- **Issues:** en att-göra-lista i repot, bra för felrapporter och idéer.

Bra ställen att lära sig mer:
- [GitHub Skills](https://skills.github.com/), korta interaktiva kurser
- [GitHub Docs: Hello World](https://docs.github.com/en/get-started/start-your-journey/hello-world)
- [GitHub Docs: Actions](https://docs.github.com/en/actions)
- [GitHub Docs: Pages](https://docs.github.com/en/pages)

## Bra att veta

- Schemalagda jobb i publika repon stängs av av GitHub efter 60 dagar utan aktivitet. Här skapas en ny commit varje gång menyn ändras, alltså varje vecka, så det håller sig vid liv. Skulle det ändå stängas av kan du slå på det igen under fliken *Actions*.
- Tiderna i schemat anges i UTC. Svensk tid är UTC+1 på vintern och UTC+2 på sommaren, så körningen flyttar en timme vid tidsomställningen.
- Menytexten tillhör ICA Focus. Använd den bara för att visa er egen lunch.
