<font size="8">Hanna - Hankehallinnon tietojärjestelmä</font>

<font size="6">Sisällysluettelo</font>

- [Asemakaavahanke](#asemakaavahanke)
  - [Yleistä](#yleistä-1)
  - [Tietosisältö](#tietosisältö)
  - [Asemakaavahankkeesta tiedottaminen](#asemakaavahankkeesta-tiedottaminen)
- [Investoinhanke](#investoinhanke)
  - [Yleistä](#yleistä-2)
  - [Investointihankkeen tietosisältö](#investointihankkeen-tietosisältö)
  - [Kohteet](#kohteet)
    - [Kohteen tietosisältö](#kohteen-tietosisältö)
  - [Tehtävät](#tehtävät)
    - [Tehtävän tietosisältö](#tehtävän-tietosisältö)
    - [Valittavissa olevat tehtävätyypit](#valittavissa-olevat-tehtävätyypit)
- [Yleistä Hannan ja SAP -järjestelmästä](#yleistä-hannan-ja-sap--järjestelmästä)
- [Kustannusarvio](#kustannusarvio)
- [Toteuma](#toteuma)

# Yleistä

Hanna on Tampereen kaupungin hankehallinnon tietojärjestelmä, joka toimii kaupungin tarjoten erityisesti mahdollisuuden seuraavaan:

- Hankesuunnittelu
- Asemakaavahankkeen perustaminen SAP-järjestelmään
- Hankeraportointi

# Järjestelmän tuki

Tukipyynnöt voi ohjata osoitteeseen tuki@ubigu.fi. Hannalla on myös oma Teams -ryhmänsä, jossa järjestelmän käytöstä ja kehityksestä voi keskustella muiden asianomaisten ja kehittäjien kesken.

Hannan käyttöoikeuksista vastaa Ulla Lautaoja (ulla.lautaoja@tampere.fi).

# Testi- ja tuotantojärjestelmä

Hannasta on olemassa kaksi eri järjestelmää. Testijärjestelmä toimii osoitteessa [tre-hanna-test.azurewebsites.net](https://tre-hanna-test.azurewebsites.net/). Siellä käyttäjät voivat kokeilla Hannan toiminnallisuuksia ilman huolta järjestelmän rikkoutumisesta tai tuotantokäytön häiriintymisestä. Varsinainen tuotantokäyttö tapahtuu tuotantojärjestelmässä osoitteessa [hanna.tampere.fi](https://hanna.tampere.fi).

Huomioi, että testijärjestelmään luodut tiedot voivat aikanaan poistua, ja se on tarkoitettu ainoastaan testikäyttöön. Varsinainen, säilytettävä, ja myös varmuuskopioitava, hanketieto tulee kirjata tuotantojärjestelmään.

# Hankehaku

Hannan etusivulla käyttäjä voi suodattaa näkyville haluamansa joukon hankkeita listaan ikkunan vasempaan laitaan. Käyttäjä voi hyödyntää haluamaansa joukkoa hakusuodattimia, joihin valittujen ehtojen pitää kaikkien toteutua hankkeen tiedoissa, jotta hanke valikoituu hakutuloksiin.

Ensimmäinen hakukenttä kohdistuu seuraaviin tietosisältöihin:

- Hankkeen nimi
- Hankkeen kuvaus
- Asemakaavahankkeen kaavanumero

Hannassa on useita eri hanketyyppejä. Hanketyypeille on vain niitä koskevia tietosisältöjä. Lähtökohtaisesti kaikki hanketyypit ovat mukana haussa. Käyttäjän valitessa hanketyyppivalikosta tietyn hanketyypin tai -tyypit, ilmestyy hakunäkymän alaosuuteen osiot, joista käsin hakua voi tarkentaa hanketyyppikohtaisilla tiedoilla.

Etusivulla voi toistaiseksi hakea vain hankkeita, eikä esimerkiksi investointihankkeen alaisia kohteita.

# Karttanäkymä

Jos Hannassa perustetuille hankkeille on annettu aluerajaus, voi niiden sijainteja tarkastella paikkatietona kartalla. Hankkeella voi olla vain aluemuotoinen sijainti.

Sivulta löytyvää karttaikkunaa voi hyödyntää dynaamisena hakusuodattimena. Hakutuloksiin hakeutuvat aina ne hankkeet, jotka sijaitsevat karttanäkymän alueella. Koska paikkatiedon antaminen hankkeelle on vapaaehtoista, on hakuvalitsimissa mukana painike `Sisällytä hankkeet ilman alueita`, jotta hankkeet ilman aluerajausta on mahdollista saada mukaan hakutuloksiin.

Katsoessa karttaa kaukaa, symboloidaan hankkeiden sijainti palloina, jotka ilmoittavat kuinka monta hanketta pallon alueella sijaitsee. Käyttäjän lähentäessä karttaa, muuttuu piirtotapa pallosta hankkeiden varsinaisiin aluerajauksiin. Toistaiseksi käyttäjä ei voi siirtyä hankkeen sivulle klikkaamalla hankkeen aluerajausta kartalla.

Karttanäkymää voi liikuttaa raahamalla sitä hiirellä. Hiiren rullaa voi hyödyntää lähentämiseen ja loitontamiseen. Vastaavat painikkeet löytyvät karttaikkunan vasemmasta yläkulmasta. Sieltä löytyy myös painike `Palauta zoomaus`, joka asettaa karttanäkymän sen oletusrajaukseen.

Karttanäkymään on valittavissa seuraavat taustakartat vasemmasta alakulmasta löytyvästä painikkeesta.

- Virastokartta
- Opaskartta
- Kantakartta
- Ilmakuva
- Ajantasa-asemakaava

Lisäksi samaisesta valikosta on valittavissa seuraavat vektorimuotoiset rekisterikohdetasot.

- Kiinteistöt
- Rakennukset
- Kadut

![etusivun_karttanakyma](/images/etusivun_karttanakyma.png)<br/>
_Etusivun karttanäkymä näyttää tältä. Kun hankkeita on paljon ja käyttäjä kats0oo kartta tarpeeksi etäältä, esitetään hankkeiden sijainnit kootusti kuvanmukaisilla numeroiduilla pallosymboleilla. Karttatasovalikko löytyy vasemmasta alakulmasta._

# Uuden hankkeen perustaminen

Uusi hanke perustetaan etusivulta löytyvästä `Luo uusi hanke` -painikkeesta. Painaessaan sitä käyttäjä joutuu ensin valitsemaan, minkä hanketyypin mukaisen hankkeen hän haluaa perustaa. Tämä johtuu siitä, että eri hanketyypeille on erilainen tietosisältö.

Jokaisella hanketyypillä on tietty tietosisältö, jonka kirjaaminen on pakollista. Hanna ei salli hankkeen tallentamista ilman kyseisten tietojen täyttöä. Voit perehtyä kunkin hanketyypin tietosisältöön ja niiden pakollisuuteen alla olevista taulukoista.

Perusettuasi hankkeen se saa uniikin tunnisteen. Tämä tunniste on nähtävissä internetselaimen osoitekentässä käyttäjän avatessa hankkeen sivun. Tietyn hankkeen jakaminen toiselle Hannaan luvitellu käyttäjälle on mahdollista kopioimalla selaimen osoitekentän linkki ja lähettämällä se toiselle käyttäjäle esimerkiksi Teams -sovelluksessa.

Toistaiseksi kaikki Hannaan luvitetut käyttäjät omaavat oikeuden perustaa hankkeita.

# Hankkeen poistaminen

Perustetun hankkeen voi poistaa navigoimalla hankkeen omalle sivulla ja valitsemalla `Poista hanke`. Ennen poistamista Hanna vielä kysyy varmistuksen käyttäjältä. Poistamisen jälkeen hanketta ei enää pysty palauttamaan käyttöliittymästä käsin. Hankkeen tiedot kuitenkin tosiasiallisesti arkistoituvat Hannan tietokantaan, josta käsin Hannan kehittäjät voivat tarpeen mukaan palauttaa hankkeen.

Investointihankkeiden poistamisen osalta on tärkeää huomioida se, että samalla poistuvat hankkeelle mahdollisesti kirjatut kohteet ja tehtävät.

# Hankkeen tietojen muokkaaminen

Hankkeen perustamisen jälkeen sen tietoja voi muokata valitsemalla hankkeen sivulla painamalla `Muokkaa` painiketta tietolomakkeen oikeassa yläkulmassa. Muokattujenkin tietojen tulee sisältää vähintään pakolliset tietosisällöt, jotta muokkausten tallentuminen on mahdollista. Jokainen muokkaus luo Hannan tietokantaan uuden version hankkeesta. Samalla tallentuu tieto siitä, kuka muokkauksen on tehnyt, milloin ja mitä tarkalleen on muokattu. Käyttäjät eivät toistaiseksi pysty palauttamaan käyttöliittymästä käsin hankkeen tietoja aiempaan versioon, mutta Hannan kehittäjät pystyvät siihen tarvittaessa. Toistaiseksi hankkeen historia- ja versiotietoja ei esitetä käyttöliittymässä.

# Hannan hanketyypit

Hannassa on tällä hetkellä kaksi eri hanketyyppiä: `Investointihanke` ja `Asemakaavahanke`. Niiden tarkempi tietosisältö ja piirteet ovat kuvattuina alla.

## Asemakaavahanke

### Yleistä

Uudet asemakaavahankkeet perustetaan nykyisin Hannassa, joka osoittaa asemakaavalle automaattisesti sille kuuluvan kaavanumeron. Asemakaavahankkeet voivat olla tyypiltään uusia asemakaavoja, asemakaavamuutoksia tai yleissuunnitelmia. Niistä kaikki saavat aina oman kaavanumeronsa. Asemakaavahankkeet ovat myös samalla investointihankkeita, mutta johtuen niiden poikkeavasta tietosisällöstä, ne on irrotettu Hannassa omaksi hanketyypikseen.

### Tietosisältö

| Tietokenttä            | Kuvaus                                                                                                                                                                                                                                                                                                                                                                    | Pakollinen tieto | Tiedon tyyppi              |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | -------------------------- |
| Hankkeen nimi          | Asemakaavahankkeen annettava nimi.                                                                                                                                                                                                                                                                                                                                        | Kyllä            | Teksti                     |
| Kuvaus                 | Vapaamuotoinen sanallinen kuvaus hankkeesta.                                                                                                                                                                                                                                                                                                                              | Kyllä            | Teksti                     |
| Alkuajankohta          | Ajankohta jolloin hankkeen toteutus alkaa.                                                                                                                                                                                                                                                                                                                                | Kyllä            | Päivämäärä                 |
| Loppuajankohta         | Ajankohta jolloin hanke päättyy. Loppuajankohdan täytyy sijaita alkuajankohdan jälkeen.                                                                                                                                                                                                                                                                                   | Kyllä            | Päivämäärä                 |
| Omistaja               | Hankkeen omistajalla viitataan käyttäjään, joka omistaa hankkeen. Omistaja on lähtökohtaisesti hankkeen perustanut käyttäjä. Sitä voi kuitenkin vaihtaa valitsemalla arvoksi toisen käyttäjän.                                                                                                                                                                            | Kyllä            | Valinta Hannan käyttäjistä |
| Valmistelija           | Asemakaavahankkeen valmistelusta vastaava henkilö.                                                                                                                                                                                                                                                                                                                        | Kyllä            | Valinta Hannan käyttäjistä |
| Elinkaaren tila        | Hankkeella on arvona kerrallaan aina vain yksi seuraavista elinkaaritiloista: `Aloittamatta`, `Käynnissä`, `Valmis`, `Odottaa`. Hanke saa perustamisen hetkellä elinkaaritilakseen automaattisesti `Aloittamatta`. Elinkaaritilojen ja esimerkiksi hankkeelle annettujen alku- ja loppuajankohtien välillä ei ole automaatiota, vaan ne toimivat toisistaan irrallisesti. | Kyllä            | Arvo koodistosta           |
| Alue/kaupunginosa      | Alue tai kaupunginosa, jota asemakaavahanke koskee.                                                                                                                                                                                                                                                                                                                       | Kyllä            | Teksti                     |
| Kortteli/tontti        | Kortteli tai tontti, jota asemakaavahanke koskee.                                                                                                                                                                                                                                                                                                                         | Kyllä            | Teksti                     |
| Osoitteet              | Osoite tai osoitteet, missä asemakaavahanke sijaitsee                                                                                                                                                                                                                                                                                                                     | Kyllä            | Teksti                     |
| Diaarinumero           | Asemakaavahankkeelle annettu diaarinumero Selma -sovelluksessa.                                                                                                                                                                                                                                                                                                           | Kyllä            | Teksti                     |
| Diaaripäivämäärä       | Päivämäärä, jona kirjaamo on avannut asemakaavahankkeelle diaarin Selma-tietojärjestelmässä.                                                                                                                                                                                                                                                                              | Ei               | Päivämäärä                 |
| Kaavanumero            | Kaikki Hannassa perustetut asemakaavahankkeet saavat automaattisesti Hannan generoimana kaavanumeron. Käyttäjä ei voi muokata itse kaavanumeroa. Kaavanumero lukittuu hankkeen tallennushetkellä.                                                                                                                                                                         | Kyllä            | Kokonaisluku               |
| SAP-projektin ID       | Mikäli asemakaavahanke on perustettu myös SAP-tietojärjestelmään, voi sen SAP-projektin ID:n kertoa Hannan hankkeelle taloustoteuman seuraamiseksi. Ole tarkkana, että annat arvoksi SAP:n projektin tunnisteen, etkä esimerkiksi rakenneosan tunnusta. Hanna validoi annetun tunnisteen ja kertoo käyttäjälle sen onnistumisesta.                                        | Ei               | Teksti                     |
| Kaavahanketyyppi       | Arvo valitaan joukosta `Asemakaava`, `Asemakaavamuutos` ja `Yleissuunnitelma`. Kaikki kolme saavat perustamisen yhteydessä oman uniikin kaavanumeron.                                                                                                                                                                                                                     | Ei               | Arvo koodistosta           |
| Suunnittelualue        | Asemakaavahankkeet yksilöidään yhdelle neljästä eri suunnittelualueesta, jotka ovat `Keskusta`, `Länsi`, `Itä` ja `Etelä`.                                                                                                                                                                                                                                                | Ei               | Arvo koodistosta           |
| Tekninen suunnittelija | Asemakaavahankkeelle osoitettu teknisestä avusta vastaava henkilö.                                                                                                                                                                                                                                                                                                        | Ei               | Valinta Hannan käyttäjistä |
| Aloitepäivämäärä       | Asemakaavan aloitteeseen kirjattu päivämäärä.                                                                                                                                                                                                                                                                                                                             | Ei               | Päivämäärä                 |
| Hakijan nimi           | Kaavaa hakevan tahon nimi.                                                                                                                                                                                                                                                                                                                                                | Ei               | Teksti                     |
| Hakijan osoite         | Kaavaa hakevan tahon osoite.                                                                                                                                                                                                                                                                                                                                              | Ei               | Teksti                     |
| Hakijan tavoitteet     | Kaavaa hakevan tahon tavoitteet vapaamuotoisesti kuvattuna.                                                                                                                                                                                                                                                                                                               | Ei               | Teksti                     |
| Lisätiedot             | Kaavahakemukseen tai -hakijaan liittyvät lisätiedot                                                                                                                                                                                                                                                                                                                       | Ei               | Teksti                     |

### Asemakaavahankkeesta tiedottaminen

Asemakaavahankkeen perustamisen jälkeen käyttäjä voi lähettää siitä tiedotteen haluamiinsa sähköpostiosoitteisiin valitsemalla `Tiedotus`-välilehden. Toiminnallisuus tähtää asemakaavahankkeen perustamiseen SAP:ssa, joten seuraavia sähköpostiosoitteita tarjotaan oletusarvoisesti. Käyttäjä voi kuitenkin ottaa ne pois lähetettävien listalta niin halutessaan.

- `kapa_talous@tampere.fi`
- `kapakaava@tampere.fi`

Tiedotteen, eli sähköpostiviestin, sisältö johdetaan automaattisesti asemakaavahankkeelle syötetyistä tietokentistä, jotka ovat lueteltu alle. Käyttäjä ei voi käsin muokata viestin sisältöä.

- `Hankkeen nimi`
- `Valmistelija`
- `Alue/Kaupunginosa`
- `Kortteli/Tontti`
- `Osoitteet`

Välilehdellä näytetään myös asemakaavahankkeen tiedotushistoria. Siitä selviää, kuinka monta kertaa hankkeelta on lähetetty tiedote, kenen toimesta, milloin ja kenelle.

Käyttäjällä on valittavanaan kaksi eri viestipohjaa: `Hankkeen perustaminen` ja `Hankkeen tietojen muutos`.

Myös Hannan testijärjestelmästä käsin voi lähettää tiedotteita. Tällöin lähtevään sähköpostiviestiin lisätään sekä otsikkoon että sisältöön maininta toiminnallisuuden testaamisesta.

## Investoinhanke

### Yleistä

Investointihanke on hanke, jolla kasvatetaan Tampereen kaupungin omaisuuden arvoa. Siihen käytetty raha on investointirahaa (vrt. käyttötalous) ja käytettävissä olevan rahan määrää ohjaavat eri lautakuntien vuosisuunnitelmat vuositasolla. Investointihankkeita on monenlaisia, minkä myötä tämän hanketyypin on tarkoitus olla yleiskäyttöinen. Huomioi, että myös asemakaavahankkeet ovat investointihankkeita, vaikka ne onkin erotettu omaksi hanketyypikseen.

Hannassa investointihankkeella on asemakaavahankkeesta poiketen laajempi tietomalli, joka pitää sisällään myös mahdollisuuden kirjata kohteita ja niiden alle tehtäviä. Alla on kuvattu näiden kaikkien kolmen tietosisältö.

### Investointihankkeen tietosisältö

| Tietokenttä      | Kuvaus                                                                                                                                                                                                                                                                                                                                                                    | Pakollinen tieto | Tiedon tyyppi              |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | -------------------------- |
| Hankkeen nimi    | Investointihankkeelle annettu vapaamuotoinen nimi.                                                                                                                                                                                                                                                                                                                        | Kyllä            | Teksti                     |
| Kuvaus           | Vapaamuotoinen sanallinen kuvaus hankkeesta.                                                                                                                                                                                                                                                                                                                              | Kyllä            | Teksti                     |
| Alkuajankohta    | Ajankohta jolloin hankkeen toteutus alkaa.                                                                                                                                                                                                                                                                                                                                | Kyllä            | Päivämäärä                 |
| Loppuajankohta   | Ajankohta jolloin hanke päättyy. Loppuajankohdan täytyy sijaita alkuajankohdan jälkeen.                                                                                                                                                                                                                                                                                   | Kyllä            | Päivämäärä                 |
| Omistaja         | Hankkeen omistajalla viitataan käyttäjään, joka omistaa hankkeen. Omistaja on lähtökohtaisesti hankkeen perustanut käyttäjä. Sitä voi kuitenkin vaihtaa valitsemalla arvoksi toisen käyttäjän.                                                                                                                                                                            | Kyllä            | Valinta Hannan käyttäjistä |
| Vastuuhenkilö    | Hankkeen vastuuhenkilö edustaa käyttäjää, joka on vastuussa hankkeen edistämisestä. Hän voi olla esimerkiksi siinä projektipäällikkönä tai vastaavassa roolissa.                                                                                                                                                                                                          | Kyllä            | Valinta Hannan käyttäjistä |
| Elinkaaren tila  | Hankkeella on arvona kerrallaan aina vain yksi seuraavista elinkaaritiloista: `Aloittamatta`, `Käynnissä`, `Valmis`, `Odottaa`. Hanke saa perustamisen hetkellä elinkaaritilakseen automaattisesti `Aloittamatta`. Elinkaaritilojen ja esimerkiksi hankkeelle annettujen alku- ja loppuajankohtien välillä ei ole automaatiota, vaan ne toimivat toisistaan irrallisesti. | Kyllä            | Arvo koodistosta           |
| Lautakunta       | Hankkeelle voi valita yhden seuraavista lautakunnista: `Yhdyskuntalautakunta`, `Elinvoima- ja osaamislautakunta`, `Asunto- ja kiinteistölautakunta`, `Joukkoliikennelautakunta`. Valitsemalla lautakunta osoitetaan hankkeelle se, kenen vuosisuunnitelmasta hankkeen toteutus saa varansa.                                                                               | Kyllä            | Arvo koodistosta           |
| SAP-projektin ID | Mikäli investointihanke on perustettu myös SAP-tietojärjestelmään, voi sen SAP-projektin ID:n kertoa Hannan hankkeelle taloustoteuman seuraamiseksi. Ole tarkkana, että annat arvoksi SAP:n projektin tunnisteen, etkä esimerkiksi rakenneosan tunnusta. Hanna validoi annetun tunnisteen ja kertoo käyttäjälle sen onnistumisesta.                                       | Ei               | Teksti                     |

### Kohteet

Kohde on hankkeen sisäinen olemassa oleva tai suunnitteilla oleva fyysinen rakennelma, jolla on tunnistettu käyttötarkoitus. Kyseessä on usein rekisterikohde, ja kohde voikin olla esimerkiksi väylä, rakennus, aukio, viheralue tai taitorakenne. Hankkeelle osoitetut resurssit, kuten raha, aika, alue ja toimijat eivät yleensä kohdistu koko hankkeelle tasan, ja kohteiden pääasiallinen tarkoitus onkin tarkentaa hankkeen sisältämien toimenpiteiden ja tavoitteiden kohdistumista. Investointihanke voi esimerkiksi viitata kokonaisen kaava-alueen rakentamiseen, jolloin konkreettisia rakennuskohteita on tarve yksilöidä ja osoittaa tarkemmin.

Kohteita voi kirjata vain investointihankkeelle. Niiden kirjaaminen ei ole pakollista. Kohteiden luku määrää hankkeella ei ole rajoitettu.

#### Kohteen tietosisältö

| Tietokenttä                    | Kuvaus                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Pakollinen tieto | Tiedon tyyppi    |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | ---------------- |
| Nimi                           | Kohteelle annettu nimi. Nimi ei saa olla sama hankkeen kanssa.                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Kyllä            | Teksti           |
| Kuvaus                         | Vapaamuotoinen sanallinen kuvaus kohteesta.                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Kyllä            | Teksti           |
| Alkuajankohta                  | Ajankohta jolloin kohteen toteutus alkaa.                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Kyllä            | Päivämäärä       |
| Loppuajankohta                 | Ajankohta jolloin kohteen toteutus päättyy.                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Kyllä            | Päivämäärä       |
| Elinkaaritila                  | Kohteella on arvona kerrallaan aina vain yksi seuraavista elinkaaritiloista: `Aloittamatta`, `Käynnissä`, `Valmis`, `Odottaa`. Kohde saa perustamisen hetkellä elinkaaritilakseen automaattisesti `Aloittamatta`. Hankkeen ja sen kohteiden elinkaaritilojen hallinta perustuu toistaiseksi manuaaliseen kirjaamiseen.                                                                                                                                                                                                  | Kyllä            | Arvo koodistosta |
| Kohteen tyyppi                 | Kohteen tyyppi kertoo, onko kyse uudesta rakentamisesta vai olemassaolevan kohteen muokkaamisesta. Kohteelle valitaan yksi tyyppi arvojoukosta: `Uudisrakentaminen`, `Peruskorjaaminen`, `Toimivuuden parantaminen`.                                                                                                                                                                                                                                                                                                    | Kyllä            | Arvo koodistosta |
| Omaisuusluokka                 | Käyttäjä voi kirjata omaisuusluokaksi yhden arvon seuraavasta joukosta: `Tiet, kadut, väylät, torit ja aukiot`, `Viheralueet`, `Tekniset järjestelmät`, `Leikkikentät`, `Taitorakenteet`, `Ympäristörakenteet`, `Satama`. Valittu omaisuusluokka määrittelee poistoajan, jonka mukaan käytetty investointi poistuu taseesta.                                                                                                                                                                                            | Kyllä            | Arvo koodistosta |
| Toiminnallinen käyttötarkoitus | Toiminnallinen käyttötarkoitus viittaa kohteen käyttötarkoitukseen valmistuessaan. Se valitaan seuraavista arvoista: `Ajoradat`, `Pyörätiet`, `Jalkakäytävät`, `Puistot`, `Raitit`, `Alueet ja kentät`, `Leikkipaikka`, `Hulevesien käsittelyalueet`, `Maisemarakenteet`, `Taide`, `Satama`, `Terminaali`, `Pysäköintialue`, `Toiminnallinen alue`, `Uimaranta`.                                                                                                                                                        | Kyllä            | Arvo koodistosta |
| Vastuuhenkilö                  | Kohteen vastuuhenkilö edustaa käyttäjää, joka on vastuussa kohteen edistämisestä. Hän voi olla esimerkiksi kohteella projektipäällikkönä tai vastaavassa roolissa. Vastuuhenkilön voi valita omistajan tavoin Hannan tuntemista käyttäjistä. Hanna tuntee käyttäjän, jos hänellä on lupa käyttää Hannaa ja hän on kirjautunut järjestelmään ainakin kerran. Kohde saa vastuuhenkilöksi automaattisesti koko hankkeen vastuuhenkilön, mutta arvoa vaihtaa. Hankkeella ja hankkeen kohteilla saa olla eri vastuuhenkilöt. | Kyllä            |
| Maanomistus                    | Maanomistus kohteen alueella. Käyttäjä voi valita yhden tai useamman arvoista `Valtio`, `Kaupunki`, `Yksityinen`.                                                                                                                                                                                                                                                                                                                                                                                                       | Ei               | Arvo koodistosta |
| Suhde peruskiinteistöön        | Kohteen suhde peruskiinteistöön valitaan seuraavista arvoista: `Maanpinnalla`, `Yläpuoleinen`, `Alapuoleinen`.                                                                                                                                                                                                                                                                                                                                                                                                          | Ei               | Arvo koodistosta |
| Korkeus                        | Kohteelle voi vapaahtoisesti kirjata korkeuden metreinä merenpinnasta.                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Ei               | Kokonaisluku     |
| SAP ID                         | Jos kohteelle löytyy sitä vastaava rakenneosa SAP:n projektista, voi käyttäjä osoittaa sen valitsemalla valikosta sopivan arvon. Tämän ehtona on se, että hankkeelle on osoitettu SAP-projektin ID. Tämä mahdollistaa kohteen taloustoteuman seurannan.                                                                                                                                                                                                                                                                 | Ei               |

### Tehtävät

Tehtävä on kohteeseen kohdistuva toimenpide, josta syntyy jokin konkreettinen mitattavissa oleva tulos ja samalla kustannus. Tehtävällä ei ole hankkeesta ja kohteesta poiketen omaa sijaintia. Tehtävän tuloksena voi olla esimerkiksi uusi tai korjattu rakennus tai muu rakennelma, asiakirja, mittaustulos tai ylläpidon toimi. Tutustu myöhemmästä taulukosta löytyvään koodistoon, josta selviää kaikki mahdolliset tehtävätyypit.

Tehtävälle voi lisäksi osoittaa urakoitsijan yhteyshenkilön tiedot.

#### Tehtävän tietosisältö

| Tietokenttä     | Kuvaus                                                                                                                                                                                                                                                                                                                                                                                                        | Pakollinen tieto | Tiedon tyyppi                        |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | ------------------------------------ |
| Nimi            | Tehtävälle annettu nimi. Nimen täytyy olla uniikki. Nimi ei saa olla sama hankkeen tai kohteen kanssa.                                                                                                                                                                                                                                                                                                        | Kyllä            | Teksti                               |
| Kuvaus          | Vapaamuotoinen sanallinen kuvaus tehtävästä.                                                                                                                                                                                                                                                                                                                                                                  | Kyllä            | Teksti                               |
| Urakoitsija     | Tehtävän suorittamisesta vastaava urakoitsija. Valinnalla viitataan yrityksen yhteyshenkilöön, johon voi olla yhteydessä.                                                                                                                                                                                                                                                                                     | Kyllä            | Valinta yrityksen yhteyshenkilöistä. |
| Elinkaaren tila | Tehtävällä on arvona kerrallaan aina vain yksi seuraavista elinkaaritiloista: `Aloittamatta`, `Käynnissä`, `Valmis`, `Odottaa`. Tehtävä saa perustamisen hetkellä elinkaaritilakseen automaattisesti `Aloittamatta`. Hankkeen, kohteiden ja tehtävien välinen elinkaaritilojen hallinta perustuu toistaiseksi manuaaliseen kirjaamiseen.                                                                      | Kyllä            | Arvo koodistosta                     |
| Vaihe           | Tehtävälle (vaihe-)koodi osoittaa tarkemmin, millaisesta toimennpiteestä on kyse. Se osoitetaan laajasta koodistosta, josta löytyy suunnitteluun (2-alkuiset), rakentamiseen (3-alkuiset) ja ylläpitoon (4-alkuiset) liittyviä toimenpiteitä. Toistaiseksi Hannassa ei ole rajoitettu tehtävän tyyppivalintaa hankkeen tai kohteen tyypin mukaan. Vaihekoodit vastaavat SAP -järjestelmästä löytyviä koodeja. | Kyllä            | Arvo koodistosta                     |
| Alkuajankohta   | Ajankohta jolloin tehtävän toteutus alkaa.                                                                                                                                                                                                                                                                                                                                                                    | Kyllä            | Päivämäärä                           |
| Loppuajankohta  | Ajankohta jolloin tehtävän toteutus päättyy.                                                                                                                                                                                                                                                                                                                                                                  | Kyllä            | Päivämäärä                           |

#### Valittavissa olevat tehtävätyypit

| Koodi | Selite                                            |
| ----- | ------------------------------------------------- |
| 2110  | Pohjatutkimus ja -mittaus                         |
| 2120  | Liikennetutkimus ja -mittaus                      |
| 2130  | Pima pohjatutkimus ja -mittaus                    |
| 2201  | Liikennesuunnittelu                               |
| 2202  | Katu- ja katurakennesuunnittelu                   |
| 2203  | Torien ja aukioiden suunnittelu                   |
| 2204  | Valaistussuunnittelu                              |
| 2205  | Liikennetelematiikan suunnittelu                  |
| 2206  | Vesihuollon suunnittelu                           |
| 2207  | Viher- ja ympäristösuunnittelu                    |
| 2208  | Siltasuunnittelu                                  |
| 2209  | Satamasuunnittelu                                 |
| 2210  | Geosuunnittelu                                    |
| 2211  | Muu suunnittelu                                   |
| 2212  | Hakemussuunnittelu                                |
| 2213  | Hulevesisuunnittelu                               |
| 2214  | Arkkitehtisuunnittelu                             |
| 2215  | Tietomallinnus                                    |
| 2216  | Asiantuntija- ja kehityspalvelu                   |
| 2217  | Työmaapalvelu                                     |
| 3110  | Rakennuttamispalvelu                              |
| 3120  | Mittaus - ja tutkimuspalvelu                      |
| 3210  | Ajoradan rakentaminen                             |
| 3220  | Ajoradan ja kevyen liikenteen väylän rakentaminen |
| 3230  | Kevyen liikenteen väylän rakentaminen             |
| 3240  | Torin ja yleisen alueen rakentaminen              |
| 3250  | Katuviheralueen rakentaminen                      |
| 3260  | Liikenteenohjaus                                  |
| 3270  | Pilaantuneen maan siivoaminen                     |
| 3280  | Muu väylärakentaminen                             |
| 3290  | Työnaikainen järjestely                           |
| 3310  | Valaistuksen rakentaminen                         |
| 3320  | Telematiikan rakentaminen                         |
| 3330  | Sulatusjärjestelmän rakentaminen                  |
| 3340  | Jätevesiviemärin rakentaminen                     |
| 3350  | Hulevesiviemärin rakentaminen                     |
| 3360  | Vesijohdon rakentaminen                           |
| 3370  | Hulevesialtaan rakentaminen                       |
| 3380  | Teletekniikan rakentaminen                        |
| 3390  | Jätteen imukeräys                                 |
| 3410  | Puiston rakentaminen                              |
| 3420  | Leikkipaikan rakentaminen                         |
| 3430  | Kentän rakentaminen                               |
| 3440  | Muu puistorakentaminen                            |
| 3510  | Sillan rakentaminen                               |
| 3610  | Sataman rakentaminen                              |
| 3710  | Tukimuurin rakentaminen                           |
| 3720  | Portaiden rakentaminen                            |
| 3730  | Melusuojauksen rakentaminen                       |
| 3740  | Muu erikoisrakentaminen                           |
| 4110  | Liikenneväylän talvihoito                         |
| 4120  | Liikenneväylän kesähoito                          |
| 4130  | Liikenneväylän kunnossapito                       |
| 4140  | Liikenneväylän päällystäminen                     |
| 4150  | Radan kunnossapito                                |
| 4160  | Liikenneväylän muu lisätyö                        |
| 4170  | Liikenneväylän ilkivaltavahingon hoito            |
| 4180  | Liikenneväylän ylläpidon kustannussuunnittelu     |
| 4190  | Satamien kunnossapitosuunnittelu                  |
| 4210  | Viheralueen nurmikoiden hoito                     |
| 4220  | Puiden pensaiden ja muun kasvillisuuden hoito     |
| 4230  | Viheralueen kukkakasvien hoito                    |
| 4240  | Leikki- ja liikuntapaikkojen kunnossapito         |
| 4260  | Viheralueen kalusteiden kunnossapito              |
| 4270  | Viheralueen muu kunnossapito                      |
| 4290  | Viheralueen muu lisätyö                           |
| 4310  | Liikenteenohjauslaitteen ylläpito                 |
| 4320  | Kuivatusjärjestelmän ylläpito                     |
| 4330  | Sulatusjärjestelmän ylläpito                      |
| 4340  | Sillan ja rakenteen kunnossapito                  |
| 4350  | Kalusteen kunnossapito                            |
| 4360  | Varusteiden, laitteiden ja rakenteiden energia    |
| 4410  | Liikennetelematiikan energia                      |
| 4420  | Liikennetelematiikan kunnossapito                 |
| 4430  | Liikennetelematiikan tietoliikenne                |
| 4510  | Ulkovalaistuksen energia                          |
| 4520  | Ulkovalaistuksen kunnossapito                     |
| 4530  | Ulkovalaistuksen ohjaus                           |
| 4540  | Ulkovalaistuksen dokumentointi                    |
| 4550  | Ulkovalaistuksen käyttötehtävä                    |
| 4560  | Ulkovalaistuksen takuutarkastus                   |
| 4610  | Katujen ja alueiden puhtaanapito                  |
| 4620  | Viheralueiden puhtaanapito                        |
| 4630  | Puhdistustyö                                      |
| 4810  | Syöksykaivon tyhjennys                            |
| 4820  | Sulatus                                           |
| 4830  | Ojanperkaus                                       |
| 4840  | Hulevesipäivystys                                 |
| 4850  | Huleveden asiakaspalvelu                          |
| 4860  | Huleveden asiantuntijapalvelu                     |

# Talous

## Yleistä Hannan ja SAP -järjestelmästä

Toistaiseksi Hannan ja SAP:n välinen integraatio on yksisuuntainen. Tämä tarkoittaa sitä, että Hanna hakee tietoa SAP-projekteista, mutta SAP ei vastavuoroisesti hae tietoa Hannasta tai ota kantaa Hannan hankkeisiin. Hannasta käsin ei ole mahdollista päivittää SAP-projektin tai sen osan tietoja.

## Kustannusarvio

Hankkeelle on mahdollista kirjata vuosikohtainen kustannusarvio. Kustannusarviolomakkeelle valikoituvat vuodet johdetaan automaattisesti objektille annetusta toteutusvälistä (alku- ja loppuajankohta). Kustannusarvio annetaan aina euroina. Kirjauskentät mahdollistavat kahden desimaalin tarkkuuden.

Investointihankkeella kustannusarvio on mahdollista antaa vastaavalla tavalla myös kohteelle ja tehtävälle. Ne ovat kuitenkin irrallisia hankkeen kustannusarviosta ja toisistaan.

Kustannusarviolla ei ole yhteyttä SAP -tietojärjestelmään.

## Toteuma

Hankkeille, ja myös investointihankkeiden kohteille, joille on ilmoitettu niille luotu SAP-projekti (tai kohteen tapauksessa rakenneosa), ilmoitetaan kustannusarvion rinnalla niiden toteuma. Toteuma ilmoitetaan vuositasolla, kuten kustannusarviokin.

![talousvalilehti](/images/talousvalilehti.png)<br/>
_Talousvälilehti esimerkkihankkeella. Hankkeelle on kirjattu toteutusväliksi kenttiin `Alkuajankohta` ja `Loppuajankohta` 2016-2024, josta käsin johdetaan sopiva määrä rivejä. Käyttäjä on kirjannut vuosikohtaiset kustannusarviot. Toteuma on haettu SAP-järjestelmästä niille vuosille, joille sellainen löytyy._

# Hankkeiden vienti taulukkotiedostoon

Etusivun hankenäkymästä käsin on mahdollista viedä hakusuodattimien mukaiset hankkeet Excel -taulukkotiedostoon. Eri hanketyypit viedään taulukkotiedostoissa omille välilehdilleen.

Investointihankkeista viedään taulukkotiedostoon hankkeet ja kohteet. Tiedot on rivitetty kohteiden mukaan. Esimerkiksi hanke, jolle on kirjattu kahdeksan kohdetta, ilmenee taulukkotiedostossa kahdeksalla rivillä.

Toistaiseksi asemakaavahankkeista viedään taulukkotiedostoon vain osa tietokentistä perustuen mallina käytettyyn asemakaavaluetteloon.

# Yrityksien ja heidän yhteyshenkilöiden hallinta

Hannan oikeasta ylälaidasta löytyvän `Hallinta` -näkymän kautta käyttäjät voivat luoda, muokata ja poistaa hankkeisiin liittyvien yrityksien ja heidän yhteyshenkilöiden tietoja. Yrityksille ja heidän yhteyshenkilöille on omat välilehtensä.

![hallinta_paneelin_sijainti](/images/hallintapaneelin_sijainti.png)<br/>
_Hallintapaneeliin pääsee käyttöliittymän sinisen yläpalkin oikeasta reunasta käsin._

Yrityksille voi antaa seuraavat tiedot:

- Nimi
- Y-tunnus

Yhteyshenkilölle voi antaa seuraavat tiedot:

- Nimi
- Puhelin
- Sähköposti
- Yrityksen nimi

Yllä olevan listan `Yrityksen nimi` -arvo valitaan alasvetovalikosta niistä yrityksistä, jotka Hannaan on luotu.

Yrityksen yhteyshenkilön voi toistaiseksi antaa vain investointihankkeella tehtävän `urakoitsija` -kenttään.

![yritysten_yhteyshenkilöt](/images/yritysten_yhteyshenkilot.png)<br/>
_Yritysten yhteyshenkilöt hallintapaneelissa. Huomioi myös `Yritykset` välilehti, jolta käsin voi muokata yritystietoja._

# Aluerajauksen piirto hankkeelle tai kohteelle

Hankkeelle, sekä investointihankkeen kohteille, voi piirtää aluerajauksen. Aluerajauksen saa piirrettyä karttanäkymän oikeasta laidasta löytyviä toimintoja hyödyntämällä. Toiminnot ja niiden kuvaukset on listattu alle.

- `Luo alue`: Valitsemalla painikkeen ja viemällä kursorin kartalle pääset aloittamaan alueen piirron. Jokainen hiiren vasemman painallus luo aluerajaukseen yhden solmupisteen. Jotta piirretty alue olisi eheä, täytyy käyttäjän luoda vähintään kolme solmupistettä. Voit viimeistellä piirtämäsi alueen luomalla viimeisen solmupisteen kaksoispainalluksella, jolloin alue ilmestyy kartalle. Huomioi kuitenkin, että piirretty alue ei tallennu automaattisesti.
- `Valitse alue`: Painikkeen avulla voit valita yhden tai useamman piirtämäsi alueen tai rekisterikohteen. Valinta korostetaan vaaleanvihreällä sävyllä. Pitämällä vaihtopainiketta (shift) pohjassa, voit valita samalla useamman alueen/kohteen.
- `Jäljitä valittuja alueita`: Jos käyttäjällä on aktiivinen valinta päällä (ks. yllä), voi hän tämän toiminnon valitsemalla piirtää pitkin valitsemansa kohteen ulkorajaa. Toiminnon tarkoitus on helpottaa aluerajauksen piirtoa tilanteessa, jossa hankkeen tai kohteen aluerajaus vastaa kokonaan tai osittain esimerkiksi kiinteistöä. Valittuasi toiminnon vie hiiren kursori valitun kohteen ulkoreunan lähelle, jolloin se kiinnittyy siihen. Painamalla ensimmäisen kerran tulee luoduksi ensimmäinen solmupiste, jonka jälkeen voit seurata hiirellä kohteen ulkoreunaa, kunnes pääset haluttuun kohtaan tai kierrettyä koko kohteen. Lopeta jäljitys painamalla uusi solmupiste, jonka jälkeen voit joko tallentaa alueen tai jatkaa piirto jäljitetyn alueen ulkopuolella. Toistaiseksi jäljityksen jatkaminen suoraan jäljitetyltä alueelta toiselle, ei ole mahdollista.
- `Muokkaa valittuja alueita`: Tällä painikkeella käyttäjä voi muokata valitun alueen solmupisteitä. Tarttumalla hiirellä halutusta kohtaa valitun alueen ulkoreunaa ja päästämällä irti halutussa kohtaa alueen muotoa voi muokata. Toistaiseksi ei ole mahdollista poistaa jo olemassaolevia solmupisteitä, vaan ainoastaan luoda uusia.
- `Poista valitut alueet`: Painamalla tätä painiketta käyttäjän valitsema alue poistetaan. Muista tallentaa lopuksi muutokset toisesta painikkeesta.
- `Peruuta muutokset`: Tällä painikkeella käyttäjä voi peruuttaa tallentamattomat muutoksensa.
- `Tallenna muutokset`: Painiketta painamalla käyttäjän tekemät muutokset tallennetaan.

Piirtämisen tukena voi hyödyntää seuraavia kaupungin itse tuottamia paikkatietotasoja. Kyseisiä tasoja ei ole mahdollista muokata Hannan kautta. Muista tarpeen mukaan hyödyntää myös eri taustakarttoja.

- Kiinteistöt
- Kadut
- Rakennukset

Toistaiseksi Hannaan luotuja aluerajauksia ei tarjota rajapinnan yli toisille käyttäjille.

![Hankesivulta löytyvä karttanäkymä](/images/hankesivun_karttanakyma_toiminnot_nimetty.png)<br/>
_Hankesivulta löytyvä karttanäkymä. Oikealla laidassa näkyvissä yllä kuvatut toiminnot._

# Hankkeiden liittyminen toisiinsa

Hankkeet ovat harvoin täysin itsenäisiä kokonaisuuksia, vaan ovat pikemminkin osa hankkeiden ketjua. Tällainen ketju muodostuu esimerkiksi silloin, kun hankekehityksestä tai pitkän aikavälin maankäytön suunnittelusta (PALM) siirrytään kaavoittamaan, sen jälkeen rakentamaan investointeja ja lopuksi ylläpitämään rakennettua infrastruktuuria. Myöhemmin esimerkiksi asemakaavaan saatetaan kohdistaa muutoksia tai kertaalleen rakennettua infraa saneerata tai parantaa sen toimivuutta muuuten. Koko ketjun hahmottamiseksi hankkeet voivat Hannassa liittyä toisiinsa hankkeisiin kolmella tavalla:

- alisteisesti (alahanke)
- ylisteisesti (ylähanke)
- rinnakkaisesti (rinnakkaishanke)

Hankkeet, jotka linkittyvät toisiinsa millä tahansa tavalla ovat keskenään sidoshankkeita. Myöhemmin Hannaan on tarkoitus toteuttaa raportointitoiminnallisuuksia, jotka perustuvat hankeketjuun.

Voit osoittaa Hannan hankkeelle sidoshankkeen omasta valikostaan. Vaihtoehtoina ovat Hannassa perustetut hankkeet.

![sidoshankkeet hankesivulla](/images/sidoshankkeet.png)<br/>
_Kuvassa hankkeelle on osoitettu yksi alahanke._
