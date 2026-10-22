# Lunch-TV

Visar dagens lunch på en skärm. Menyn hämtas automatiskt från
[ICA Focus lunchsida](https://www.ica.se/butiker/kvantum/goteborg/ica-focus-1004247/tjanster/lunch/)
varje vardagsmorgon och publiceras på en webbadress som TV:n (UniFi Cast / SmartSign) kan visa.

## Filer

| Fil | Vad den gör |
|---|---|
| `index.html` | Själva TV-sidan. Visar rätt dags rätter under lunchtid. |
| `hamta_meny.py` | Läser menyn från ICA:s sida och skriver `menu.json`. |
| `menu.json` | Veckans meny. Skrivs över automatiskt. |
| `.github/workflows/uppdatera-lunchmeny.yml` | Schemat som kör allt automatiskt på GitHub. |

## Sätta upp (ca 15 minuter)

1. **Skapa konto** på [github.com](https://github.com) (gratis).
2. **Skapa ett repository:** plusset uppe till höger → *New repository*.
   Namn: `lunch-tv`. Välj **Public** (gratis Pages kräver det; menyn är ändå publik på ICA:s sida). Klicka *Create repository*.
3. **Ladda upp filerna:** *Add file → Upload files*. Dra in `index.html`, `hamta_meny.py`, `menu.json` och `README.md`. Klicka *Commit changes*.
4. **Lägg till schemat.** Mappen `.github` är dold på Mac/Windows och följer ibland inte med vid uppladdning, så gör så här:
   *Add file → Create new file*, skriv i namnfältet exakt
   `.github/workflows/uppdatera-lunchmeny.yml`
   (skriver du snedstreck skapas mapparna automatiskt), klistra in innehållet från filen med samma namn och tryck *Commit changes*.
5. **Slå på Pages:** *Settings → Pages → Build and deployment → Source: GitHub Actions*.
6. **Starta första körningen:** fliken *Actions* → *Uppdatera lunchmeny* → *Run workflow*. Efter någon minut visas en grön bock.
7. **Din adress** blir `https://DITT-ANVÄNDARNAMN.github.io/lunch-tv/`. Öppna den i en webbläsare och kontrollera att dagens lunch visas.
8. **Peka TV:n mot adressen** (UniFi Connect eller SmartSign: lägg in adressen som webbsida/URL-innehåll).

Därefter sköter det sig självt. Menyn uppdateras varje vardag och sparas som en ny version i repot när något ändrats.

## Om något blir fel

- **Röd kryss i Actions:** klicka på körningen och på det röda steget, så ser du felmeddelandet.
- **TV:n visar "Veckans meny är inte publicerad ännu":** ICA har inte lagt upp den nya veckan. Sidan visar då hellre ingenting än förra veckans rätter. Den rättar sig själv när menyn finns på ICA:s sida.
- **ICA har ändrat utseendet på sin sida:** skriptet hittar då ingen meny och behåller den gamla. Då behöver `hamta_meny.py` justeras.
- **Ändra lunchtider eller utseende:** redigera `index.html` (inställningar överst i skriptdelen, `CONFIG`) direkt på GitHub med pennikonen. Ändringen publiceras automatiskt.

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
