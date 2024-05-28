<font size="8">Käyttöohjeet</font>

<font size="6">Sisällysluettelo</font>

- [Yleistä](#yleistä)
- [Järjestelmän tuki](#järjestelmän-tuki)
- [Testi- ja tuotantojärjestelmä](#testi--ja-tuotantojärjestelmä)
- [Integraatiot muihin järjestelmiin](#integraatiot-muihin-järjestelmiin)
  - [SAP](#sap)
  - [Geoserver](#geoserver)
  - [Hankkeen perustamisen ja ostotilauksen pyyntölomake](#hankkeen-perustamisen-ja-ostotilauksen-pyyntölomake)
- [Karttasivu](#karttasivu)
  - [Uuden hankkeen perustaminen](#uuden-hankkeen-perustaminen)
  - [Hankkeiden hakeminen](#hankkeiden-hakeminen)
  - [Kohteiden hakeminen](#kohteiden-hakeminen)
  - [Kartan toiminnot](#kartan-toiminnot)
  - [Tietojen vienti taulukkotiedostoon](#tietojen-vienti-taulukkotiedostoon)
- [Käyttöoikeudet](#käyttöoikeudet)
  - [Käyttäjätyypit](#käyttäjätyypit)
  - [Pääkäyttäjän luvitusnäkymä](#pääkäyttäjän-luvitusnäkymä)
  - [Lukuoikeus](#lukuoikeus)
  - [Hankkeen perustamisoikeus](#hankkeen-perustamisoikeus)
  - [Oikeus muokata hankkeen tietoja](#oikeus-muokata-hankkeen-tietoja)
  - [Oikeus poistaa hanke](#oikeus-poistaa-hanke)
  - [Hankkeen omistajan vaihtaminen](#hankkeen-omistajan-vaihtaminen)
  - [Oikeus muokata talousarvioita ja käyttösuunnitelman muutoksia](#oikeus-muokata-talousarvioita-ja-käyttösuunnitelman-muutoksia)
- [Hankesivu](#hankesivu)
  - [Hankkeen tietojen syöttö ja muokkaaminen](#hankkeen-tietojen-syöttö-ja-muokkaaminen)
  - [Hankkeen poistaminen](#hankkeen-poistaminen)
  - [Aluerajauksen piirto](#aluerajauksen-piirto)
  - [Hankkeiden liittyminen toisiinsa](#hankkeiden-liittyminen-toisiinsa)
- [Hanketyypit](#hanketyypit)
  - [Asemakaavahanke](#asemakaavahanke)
    - [Yleistä](#yleistä-1)
    - [Asemakaavahankkeen tietosisältö](#asemakaavahankkeen-tietosisältö)
    - [Asemakaavahankkeesta tiedottaminen](#asemakaavahankkeesta-tiedottaminen)
  - [Investointihanke](#investointihanke)
    - [Yleistä](#yleistä-2)
    - [Investointihankkeen tietosisältö](#investointihankkeen-tietosisältö)
    - [Investointikohteet](#investointikohteet)
      - [Investointikohteen tietosisältö](#investointikohteen-tietosisältö)
      - [Kohteen toimijat](#kohteen-toimijat)
      - [Vaiheet](#vaiheet)
    - [Investointihankkeen talous](#investointihankkeen-talous)
      - [Talousarvio](#talousarvio)
      - [Toteuma](#toteuma)
      - [Ennuste](#ennuste)
      - [Käyttösuunnitelman muutos](#käyttösuunnitelman-muutos)
- [Investointiohjelmointinäkymä](#investointiohjelmointinäkymä)
  - [Tietosisältö ja tietojen muokkaaminen](#tietosisältö-ja-tietojen-muokkaaminen)
  - [Vuosivalinta, hakusuodattimet ja summarivi](#vuosivalinta-hakusuodattimet-ja-summarivi)
  - [Uuden kohteen lisääminen](#uuden-kohteen-lisääminen)
- [SAP-raportit näkymä](#sap-raportit-näkymä)
  - [Yleistä SAP-raporteista](#yleistä-sap-raporteista)
  - [Ympäristökoodit](#ympäristökoodit)
  - [Puitesopimukset](#puitesopimukset)
- [Yrityksien ja heidän yhteyshenkilöiden hallinta](#yrityksien-ja-heidän-yhteyshenkilöiden-hallinta)

# Yleistä
Hanna on Tampereen kaupungin maankäytön suunnittelun ja toteuttamisen hanketietojärjestelmä. Se tarjoaa mahdollisuuden seuraavaan:
- Investointiohjelman laadinta
- Hankkeiden taloustoteuman seuranta
- Asemakaavahankkeen perustaminen

Hannan käyttöä laajennetaan käyttäjäryhmä kerrallaan. Kehitys on aloitettu vuonna 2022. Kehittäjänä ja ylläpitäjänä toimii Ubigu Oy. 

# Järjestelmän tuki
Lähitukea tarjoaa Jaana Turunen ([jaana.turunen@tampere.fi](mailto:jaana.turunen@tampere.fi)). Jaana vastaa myös käyttäjien luvittamisesta sovelluksen käyttöön. Hannalla on myös oma Teams -ryhmä, jossa järjestelmän käytöstä ja kehityksestä voi keskustella muiden käyttäjien ja kehittäjien kesken.

Virhetilanteista ja bugeista viestiä voi lähettää myös suoraan kehittäjille osoitteeseen [tuki@ubigu.fi](mailto:tuki@ubigu.fi). 

# Testi- ja tuotantojärjestelmä
Hannasta on olemassa kaksi eri järjestelmää. Testijärjestelmä toimii osoitteessa [tre-hanna-test.azurewebsites.net](https://tre-hanna-test.azurewebsites.net/). Siellä käyttäjät voivat kokeilla Hannan toiminnallisuuksia ilman huolta järjestelmän rikkoutumisesta tai tuotantokäytön häiriintymisestä. Varsinainen käyttö tapahtuu tuotantojärjestelmässä osoitteessa [hanna.tampere.fi](https://hanna.tampere.fi).

Huomioi, että testijärjestelmään luodut tiedot voivat aikanaan poistua, ja se on tarkoitettu ainoastaan testikäyttöön. Varsinainen, säilytettävä, ja myös varmuuskopioitava, hanketieto tulee kirjata tuotantojärjestelmään. Järjestelmiin luvittaminen tapahtuu erikseen, eli esimerkiksi tuotantojärjestelmään pääsevä käyttäjä ei automaattisesti pääse myös testijärjestelmään.

# Integraatiot muihin järjestelmiin
Tässä kappaleessa on listattu kaupungin muut tietojärjestelmät, joiden kanssa Hanna omaa jonkinasteisen integraation. 

## SAP
Hanna lukee SAP:sta projektien tietoja sekä niiden tositteita. Toistaiseksi tietojen luku tapahtuu yksisuuntaisesti, eli SAP ei vastavuoroisesti hae tietoa Hannasta tai ota kantaa Hannan hankkeisiin. Hannasta käsin ei myöskään toistaiseksi ole mahdollista päivittää tietoja suoraan SAP:iin. Hanna hakee kaikki SAP:n projektit ja niiden tositteet kerran vuorokaudessa yöaikaan ja tallentaa ne omaan tietokantaansa, josta ne esitetään käyttöliittymässä. SAP:iin toteutetut muutokset ilmenevät näin olen Hannassa viiveellä. 

Projektien ja tositteiden haku SAP:sta on rajattu seuraaviin yrityksiin.
- 1110 (KAPA)
- 1350 (KITIA)
- 1540 (ELOSA)

## Geoserver
Paikkatietojen osalta Hanna hyödyntää kaupungin olemassaolevia aineistoja ja rajapintoja. Geoserveriltä haetaan erilaisia taustakartta-aineistoja (opaskartta, asemakaava, virastokartta...), rekisterikohteita (kiinteistöt, kadut...) sekä aluerajauksia (kaupunginosat). Saatavilla olevia aineistoja on mahdollista lisätä tarpeen mukaan. Toistaiseksi Hannassa piirretyt hanke- ja kohdealueet eivät ole tarjolla kaupungin Geoserverillä. 

## Hankkeen perustamisen ja ostotilauksen pyyntölomake
Hannan navigointipalkin oikeasta laidasta löytyy painike, joka ohjaa käyttäjän kaupungin e-lomakkeelle, jota kautta voi pyytää SAP-projektin perustamista ja ostotilauksen tekemistä talousyksiköltä. 

# Karttasivu

![karttasivu](/images/karttasivu.png)<br/>

Karttasivun on Hannan laskeutumissivu. Siellä käyttäjä voi tarkastella hankkeita kartalla, hakea niistä haluamaansa ja perustaa uusia.

Vasemmassa yläkulmassa voit valita tarkasteltavaksi joko hankkeet tai investointikohteet (6). Hakutoiminnot sijaitsevat sivun yläosassa (1), ja ne ovat hanke- tai kohdekohtaisia riippuen valitusta välilehdestä. Hakusuodattimilla voi vaikuttaa siihen, mitä hankkeita ja/tai kohteita esitetään kartalla (3) ja hakutuloksissa (2). Hankkeiden piirtotapa on riippuvainen siitä, kuinka etäältä karttaa katsotaan. Kuvassa hankkeiden sijainnit ovat esitetty kootusti kuvanmukaisilla numeroiduilla pallosymboleilla, jotka tarkentuvat lähentäessä karttaan. Käyttäjä voi valita eri kartta-aineistoja näkyville valitsemalla karttatasovalikon kartan vasemmasta alakulmasta (7). Hankkeet voi viedä taulukkotiedostoon painikkeesta "lataa raportti" (4). Uuden hankkeen voi perustaa valitsemalla oikeasta yläkulmasta "Luo uusi hanke" (5).

Hakutuloksissa hankkeille kerrotaan niiden nimi, tyyppi ja toteutusväli. Lisäksi asemakaavahankkeille kerrotaan suluissa niiden kaavanumero. Kattavimmin hankkeen tiedot löytyvät kuitenkin niiden omilta [hankesivuilta](#hankesivu). Kohteille taas esitetään nimi, niiden hankkeen nimi, toteutusväli sekä kohteen laji (suunnittelu/rakentaminen). Lisäksi kohteet on ryhmitelty hakutuloksiin hankkeittain. Kattavin tieto hankkeista ja niiden kohteista löytyy kuitenkin itse hankesivulta. Sieltä käsin tapahtuu tietojen kirjaus, muokkaus, poistaminen ja käyttöoikeuksien muutokset. Hankesivulta käsin käyttäjä pääsee navigoimaan myös kohteille.

Hankkeet esitetään kartalla vihreinä ja kohteet sinisinä. Toistaiseksi käyttäjä ei pääse vaikuttamaan symbologiaan. 

Käyttäjä voi klikata kartalla näkyviä hankkeita ja kohteita, jolloin niiden tiedot, ja mahdollisuus siirtyä hanke- tai kohdesivulle tulee tarjolle ponnahdusikkunaan. Jos klikkaus kohdistuu useampaan objektiin, niiden välillä voi selata nuolinäppäimillä. Karttavalinta korostetaan keltaisella. Huomioi, että valinta voi poistua, jos muokkaat hakusuodattimia. Toistaiseksi rajapinnoilta haettavien aineistojen (esim. rakennukset) tietoja ei pysty selaamaan kartalla.  

![karttavalinta](/images/karttavalinta.png)

## Uuden hankkeen perustaminen
Uusi hanke perustetaan etusivulta löytyvästä _Luo uusi hanke_ -painikkeesta. Painaessaan sitä käyttäjä valitsee ensin, minkä hanketyypin mukaisen hankkeen hän haluaa perustaa. Vain ne hanketyypit, joiden perustamiseen käyttäjällä on oikeus, listataan (lue lisää [käyttöoikeuksista](#käyttöoikeudet)).  Valinta on olennainen, sillä hanketyypeillä on erilaiset tietoskeemat. Tämän jälkeen käyttäjä ohjataan tyhjälle hankesivulle, jossa hankkeen tiedot pääsee täyttämään. 

Uusia kohteita voi perustaa karttasivun kohteet-välilehdeltä, hankesivuilta ja investointiohjemoinnin näkymästä käsin. 

## Hankkeiden hakeminen
Hankkeita voi hakea seuraavilla ehdoilla:
- Vapaa tekstihaku, joka nimeen, kuvaukseen sekä kaavanumeroon, jos kyseessä on asemakaavahanke
- Hakuaikaväli (tarkistaa, leikkaako asetettu aikaväli hankkeen alku- ja loppupäivämäärän väliä)
- Elinkaaren tila
- Hanketyyppi
- Omistaja

Jos hakuehtoja on useampia, niiden kaikkien pitää toteutua, jotta hanke ilmestyy hakutuloksiin (`JA`-operaattori).Lisäksi, jos käyttäjä valitsee haussa jommankumman hanketyypeistä, ilmestyy hakuosuuden yhteyteen valinta _näytä lisää hakuehtoja_. Sen takaa avautuvasta osiosta käyttäjä voi vielä tarkentaa hakua hanketyypille ominaisilla tiedoilla. Asemakaavahankkeita koskevaa hakua voi esimerkiksi tarkentaa valitsemalla sopivan `suunnittelualueen` tai `valmistelijan`.

Myös itse karttaikkuna toimii suodattimena. Hakutuloksiin tulevat oletuksena listatuksi myös hankkeet, joilta puuttuu aluerajaus, jonka osoittaminen on vapaavalintaista. Käyttäjä voi painaa painiketta _sisällytä vain hankkeet alueilla_, jolloin hakutuloslista poistuu alueettomat hankkeet. 

## Kohteiden hakeminen
Kohteita voi hakea seuraavilla ehdoilla:
- Vapaa haku, joka kohdistuu kohteen nimeen ja kuvaukseen
- Hakuaikaväli (tarkistaa, leikkaako asetettu aikaväli kohteen alku- ja loppupäivämäärän väliä)
- Kohteen laji (suunnittelu/rakentaminen)
- Kohteen tyyppi (peruskorjaaminen/uudisrakentaminen/toimivuuden parantaminen)
- Omaisuusluokka
- (Toiminnallinen) Käyttötarkoitus
- Elinkaaren tila (aloittamatta, käynnissä, valmis, odottaa)
- Rakennuttaja
- Suunnitteluttaja

Kuten hankkeitakin hakiessa, jos hakuehtoja on useampia, niiden kaikkien pitää toteutua, jotta kohde ilmestyy hakutuloksiin (`JA`-operaattori). 

Myös itse karttaikkuna toimii suodattimena. Hakutuloksiin tulevat oletuksena listatuksi myös kohteet, joilta puuttuu aluerajaus, jonka osoittaminen on vapaavalintaista. Käyttäjä voi painaa painiketta _sisällytä vain kohteet alueilla_, jolloin hakutuloslista poistuu alueettomat kohteet. 

## Kartan toiminnot
Karttanäkymää voi liikuttaa raahamalla sitä hiirellä. Hiiren rullaa voi hyödyntää lähentämiseen ja loitontamiseen. Vastaavat painikkeet löytyvät karttaikkunan vasemmasta yläkulmasta. Sieltä löytyy myös painike _Palauta zoomaus_, joka asettaa karttanäkymän sen oletusrajaukseen.

Karttanäkymään on valittavissa seuraavat taustakartat vasemmasta alakulmasta löytyvästä painikkeesta:
- Virastokartta
- Opaskartta
- Kantakartta
- Ilmakuva
- Ajantasa-asemakaava

Lisäksi samaisesta valikosta on valittavissa seuraavat vektorimuotoiset paikkatietotasot: 
- Kiinteistöt
- Rakennukset
- Kadut
- Kevyen liikenteen väylät
- Kaupunginosat

Toistaiseksi käyttäjät eivät pysty vaikuttamaan näiden tasojen esitystyyliin. 

## Tietojen vienti taulukkotiedostoon
Hankkeet ja/tai niiden kohteet on mahdollista viedä Excel -taulukkotiedostoon valitsemalla hakutulososion yhteydestä löytyvä _Lataa raportti_ -painike. Tiedostoon viedään sillä hetkellä aktiivisen haun palauttamat hankkeet/kohteet. Jos hanketyyppejä on useita, viedään ne tiedostossa omille välilehdilleen. Investointihankkeista viedään taulukkotiedostoon lisäksi niiden kohteet, ja tiedot on rivitetty kohteiden mukaan. Esimerkiksi hanke, jolle on kirjattu kahdeksan kohdetta, ilmenee taulukkotiedostossa kahdeksalla rivillä. 

Toistaiseksi asemakaavahankkeista viedään taulukkotiedostoon vain osa tietokentistä perustuen mallina käytettyyn asemakaavaluetteloon.

# Käyttöoikeudet

## Käyttäjätyypit
Hannaan luvitetut käyttäjät jakautuvat perus- ja pääkäyttäjiin. Hanna tunnistaa automaattisesti kirjautumisen yhteydessä, kumpaan ryhmään käyttäjä kuuluu. Pääkäyttäjillä on Hannan käyttöön laajimmat mahdolliset oikeudet, ja he pystyvät  muokkaamaan kaikkia hankkeita, poistamaan niitä ja vaihtamaan niiden omistajia. Peruskäyttäjien käyttöoikeudet on kuvattu tarkemmin alla. 

Jos sinulla on tarve vaihtaa toiseen käyttäjätyyppiin, ole yhteydessä Jaana Turuseen (jaana.turunen@tampere.fi). 

## Pääkäyttäjän luvitusnäkymä
Pääkäyttäjille on luotu oma näkymänsä, joka ei ole tarjolla peruskäyttäjille. Näkymästä käsin pääkäyttäjät voivat muokata seuraavia peruskäyttäjien oikeuksia:
- Oikeus perustaa investointihanke
- Oikeus perustaa asemakaavahanke
- Oikeus muokata investointihankkeen talousarvioita ja käyttösuunnitelman muutosta

Pääkäyttäjä ei voi poistaa toisen pääkäyttäjän oikeuksia, vaan ne luetaan aina Tampereen Microsoft Entra ID:stä. Lisätessään tai poistaessaan oikeuksia kyseisten käyttäjien istunto päivitetään, ja muuttuneet käyttöoikeudet tulevat voimaan heti. 

![Pääkäyttäjän luvitusnäkymä](/images/paakayttajan_luvitusnakyma.png)<br/>
_Pääkäyttäjän luvitusnäkymä näyttää tältä. Peruskäyttäjiltä kyseinen sivu puuttuu kokonaan. Muut pääkäyttäjät ilmenevät harmaina, eikä heidän oikeuksiaan pääse muokkaamaan._

## Lukuoikeus
Jokaisella Hannaan pääsevällä käyttäjällä on oikeus lukea koko hankejoukkoa, joka Hannaan on avattu. Tämä koskee myös SAP:n rajapinnan yli haettuja talous- ja projektitietoja (huomioi erityisesti [SAP-raportit -näkymä](#sap-raportit-näkymä)). Toistaiseksi Hanna-sovelluksen käyttöön on luvitettu vain Tampereen kaupunkiorganisaatioon kuuluvia henkilöitä. 

## Hankkeen perustamisoikeus
Pääkäyttäjät sekä heidän yksilöimänsä käyttäjät voivat perustaa Hannassa uusia hankkeita. Pääkäyttäjä yksilöi perustamisoikeuden hanketyypin tarkkuudella. Näin esimerkiksi voidaan sallia käyttäjälle perustaa asemakaavahankkeita, mutta estää investointihankkeiden perustaminen joko vahingossa tai epätarkoituksenmukaisesti. Jos peruskäyttäjä ei omaa oikeutta perustaa mitään hankkeita, esitetään karttanäkymän oikeassa ylälaidassa näkyvä `Luo uusi hanke` -painike harmaana. 

## Oikeus muokata hankkeen tietoja
Hankkeiden muokkausoikeus on hankkeen omistajalla, hänen osoittamillaan muilla peruskäyttäjillä sekä Hannan pääkäyttäjillä. Hankkeen muokkausoikeudet eivät oikeuta muokkaamaan hankkeen käyttöoikeuksia, vaan niiden muokkaaminen on rajattu yksinään hankkeen omistajalle (sekä  pääkäyttäjille). Muokkausoikeudet periytyvät myös hankkeen kohteille ja vaiheille, ja se koskettaa myös niiden luontia ja poistamista. Talousarvioiden ja käyttösuunnitelman muutoksen muokkaamiseen tarvitaan lisäksi erillinen oikeus pääkäyttäjältä. 

## Oikeus poistaa hanke
Vain hankkeen omistaja ja pääkäyttäjä voivat poistaa hankkeen. Huomioi, että hankkeen poistaminen tarkoittaa myös sen kohteiden ja vaiheiden poistamista. 

## Hankkeen omistajan vaihtaminen
Hankkeen omistaja voi luopua omistajuudestaan ja osoittaa sen toiselle käyttäjälle niin halutessaan. Ennen vaihtoa Hanna kysyy häneltä varmistuksen vaihtopäätöksestä ja sen, halutaanko vanhalle omistajalle jättää vielä muokkausoikeus hankkeeseen. Ongelmatilanteiden ilmetessä pääkäyttäjä voi aina vaihtaa hankkeen omistajaa. 

## Oikeus muokata talousarvioita ja käyttösuunnitelman muutoksia
Muokatakseen investointihankkeiden talousarvioita sekä sen kohteiden käyttösuunnitelman muutosta (KSM), peruskäyttäjä tarvitsee siihen erikseen luvan pääkäyttäjältä. Tämä oikeus on universaali, eli se tulee annetuksi kerralla koko Hannan hankejoukolle, niiden kohteille ja vaiheille. Käyttäjä, joka on luvitettu muokkaamaan talousarvioita ja KSM:ää, ei tarvitse erikseen hankkeen omistajalta muokkausoikeutta hankkeeseen muokatakseen kyseisiä arvoja. Hän tarvitsee ne kuitenkin muokatakseen hankkeen muita tietoja (myös ennuste). 

# Hankesivu
Hankesivu on hankkeen koko tietosisällön yhteenkokoava paikka. 

## Hankkeen tietojen syöttö ja muokkaaminen
Perustaakseen uuden hankkeen käyttäjän on täytettävä sen tietoihin vähintään pakolliset kentät. Pakolliset tietokentät on merkitty käyttöliittymässä tähtikuviolla ("*"). Investointihankkeen tarkempi tietosisältö ja sen merkitys on kuvattu [täällä](#investointihankkeen-tietosisältö) ja asemakaavahankkeen tietosisälltö [täällä](#asemakaavahanke). 

Hankkeen perustamisen jälkeen sen tietoja voi edelleen muokata valitsemalla hankkeen sivulla painamalla Muokkaa-painiketta tietolomakkeen oikeassa yläkulmassa. Muokattujenkin tietojen tulee sisältää aina vähintään pakolliset tietosisällöt, jotta muokkausten tallentaminen on mahdollista. Jokainen muokkaus luo Hannan tietokantaan uuden version hankkeesta. Sen osana tallentuu tieto siitä, kuka muokkauksen on tehnyt, milloin se on toteutunut ja mitä tarkalleen on muokattu. Käyttäjät eivät toistaiseksi pysty palauttamaan käyttöliittymästä käsin hankkeen aiempia versioita, mutta Hannan kehittäjät pystyvät siihen tarvittaessa. Toistaiseksi hankkeen historia- ja versiotietoja ei esitetä käyttöliittymässä. 

Käyttäjän perustettua hankkeen se saa uniikin tunnisteen. Tämä tunniste on nähtävissä internetselaimen osoitekentässä käyttäjän avatessa hankkeen sivun. Hankkeen jakaminen toiselle Hannaan luvitellu käyttäjälle on mahdollista kopioimalla selaimen osoitekentän linkki ja jakamalla se valitsemallaan tavalla.

Hankesivulta löytyy lisäksi hankekohtaiset toiminnot. Investointihankkeiden osalta tämä käsittää seuraavat:
- Kohteiden perustamisen ja niiden tietojen selaaminen (lue lisää kohteista [täällä](#kohteet))
- Hankkeen talouden hallinta ([lue lisää](#talous))
- Sidoshankkeiden hallinnointi ([lue lisää](#hankkeiden-liittyminen-toisiinsa))
- Aluerajauksen piirto

Asemakaavahankkeiden osalta hankesivulta löytyvät seuraavat toiminnot:
- Talousyksikön tiedottaminen uudesta hankkeesta tai muutoksista hankkeen tiedoissa [lue lisää](#asemakaavahankkeesta-tiedottaminen))
- Sidoshankkeiden osoittaminen ([lue lisää](#hankkeiden-liittyminen-toisiinsa))

## Hankkeen poistaminen
Hankkeen poistaminen on mahdollista vain sen omistajan ja pääkäyttäjän toimesta (lisää käyttöoikeuksista [täällä](#käyttöoikeudet)). 

Perustetun hankkeen voi poistaa hankesivulta käsin valitsemalla Poista hanke tietolomakkeen alaosasta. Ennen poistamista Hanna vielä kysyy varmistuksen käyttäjältä. Poistamisen jälkeen hanketta ei enää pysty palauttamaan käyttöliittymästä käsin. Hankkeen tiedot kuitenkin tosiasiallisesti arkistoituvat Hannan tietokantaan, josta käsin Hannan kehittäjät voivat tarpeen mukaan palauttaa hankkeen.

Investointihankkeiden poistamisen osalta on tärkeää huomioida se, että samalla poistuvat hankkeelle mahdollisesti kirjatut kohteet ja tehtävät.

## Aluerajauksen piirto
Investointihankkeelle voi halutessaan piirtää aluerajauksen. Aluerajauksen saa piirrettyä karttanäkymän oikeasta laidasta löytyviä toimintoja hyödyntämällä. Toiminnot ja niiden kuvaukset on listattu alle. Hankkeen aluerajaus on aina aluemuotoinen, ja se voi muodostua monesta erillisestä alueesta (multipolygon).

- **Luo alue:** Valitsemalla painikkeen ja viemällä kursorin kartalle pääset aloittamaan alueen piirron. Jokainen hiiren vasemman painallus luo aluerajaukseen yhden solmupisteen. Jotta piirretty alue olisi eheä, täytyy käyttäjän luoda vähintään kolme solmupistettä. Voit viimeistellä piirtämäsi alueen luomalla viimeisen solmupisteen kaksoispainalluksella, jolloin alue ilmestyy kartalle. Huomioi kuitenkin, että piirretty alue ei tallennu automaattisesti.
- **Valitse alue:** Painikkeen avulla voit valita yhden tai useamman piirtämäsi alueen tai rekisterikohteen. Valinta korostetaan vaaleanvihreällä sävyllä. Pitämällä vaihtopainiketta (shift) pohjassa, voit valita samalla useamman alueen/kohteen.
- **Jäljitä valittuja alueita:** Jos käyttäjällä on aktiivinen valinta päällä (ks. yllä), voi hän tämän toiminnon valitsemalla piirtää pitkin valitsemansa kohteen ulkorajaa. Toiminnon tarkoitus on helpottaa aluerajauksen piirtoa tilanteessa, jossa hankkeen tai kohteen aluerajaus vastaa kokonaan tai osittain esimerkiksi kiinteistöä. Valittuasi toiminnon vie hiiren kursori valitun kohteen ulkoreunan lähelle, jolloin se kiinnittyy siihen. Painamalla ensimmäisen kerran tulee luoduksi ensimmäinen solmupiste, jonka jälkeen voit seurata hiirellä kohteen ulkoreunaa, kunnes pääset haluttuun kohtaan tai kierrettyä koko kohteen. Lopeta jäljitys painamalla uusi solmupiste, jonka jälkeen voit joko tallentaa alueen tai jatkaa piirto jäljitetyn alueen ulkopuolella. Toistaiseksi jäljityksen jatkaminen suoraan jäljitetyltä alueelta toiselle, ei ole mahdollista.
- **Muokkaa valittuja alueita:** Tällä painikkeella käyttäjä voi muokata valitun alueen solmupisteitä. Tarttumalla hiirellä halutusta kohtaa valitun alueen ulkoreunaa ja päästämällä irti halutussa kohtaa alueen muotoa voi muokata. Toistaiseksi ei ole mahdollista poistaa jo olemassaolevia solmupisteitä, vaan ainoastaan luoda uusia.
- **Poista valitut alueet:** Painamalla tätä painiketta käyttäjän valitsema alue poistetaan. Muista tallentaa lopuksi muutokset toisesta painikkeesta.
- **Peruuta muutokset:** Tällä painikkeella käyttäjä voi peruuttaa tallentamattomat muutoksensa.
- **Tallenna muutokset:** Painiketta painamalla käyttäjän tekemät muutokset tallennetaan.

Piirtämisen tukena voi hyödyntää seuraavia kaupungin paikkatietoaineistoja:
- Kiinteistöt
- Rakennukset
- Kadut
- Kevyen liikenteen väylät
- Kaupunginosat

Toistaiseksi Hannaan luotuja aluerajauksia ei tarjota rajapinnan yli toisille käyttäjille.

Hankkeiden aluerajauksien karttaväri on vihreä. 

![Hankesivulta löytyvä karttanäkymä](/images/hankesivun_karttanakyma_toiminnot_nimetty.png)<br/>
_Hankesivulta löytyvä karttanäkymä. Oikealla laidassa näkyvissä yllä kuvatut toiminnot._

## Hankkeiden liittyminen toisiinsa
Hankkeet ovat harvoin täysin itsenäisiä kokonaisuuksia, vaan ovat pikemminkin osa ketjua. Tällainen ketju muodostuu esimerkiksi silloin, kun pitkän aikavälin maankäytön suunnittelusta (PALM) siirrytään kaavoittamaan, sen jälkeen rakentamaan investointeja ja lopuksi ylläpitämään rakennettua infrastruktuuria. Myöhemmin esimerkiksi asemakaavaan saatetaan kohdistaa muutoksia tai kertaalleen rakennettua infraa saneerata tai parantaa sen toimivuutta muuuten. Tämän ketjun hahmottamiseksi hankkeiden välille voi osoittaa linkin kolmella tavalla:

- alisteisesti (alahanke)
- ylisteisesti (ylähanke)
- rinnakkaisesti (rinnakkaishanke)

Voit osoittaa Hannan hankkeelle sidoshankkeen omasta valikostaan. Vaihtoehtoina ovat Hannassa perustetut hankkeet. 

![sidoshankkeet hankesivulla](/images/sidoshankkeet.png)<br/>
_Kuvassa hankkeelle on osoitettu yksi alahanke._

# Hanketyypit
Hannan hankkeet jakautuvat kahteen eri tyyppiin, jotka ovat investointihanke ja asemakaavahanke. Niiden tarkempi tietosisältö ja piirteet on kuvattu alla.

## Asemakaavahanke

### Yleistä
Uudet asemakaavahankkeet perustetaan Hannassa. Järjestelmä osoittaa asemakaavalle automaattisesti kaavanumeron. Asemakaavahankkeet voivat olla tyypiltään uusia asemakaavoja, asemakaavamuutoksia tai yleissuunnitelmia. Niistä kaikki saavat aina oman kaavanumeronsa. Asemakaavahankkeet ovat myös samalla investointihankkeita, mutta johtuen niiden poikkeavasta tietosisällöstä, ne on irroitettu omaksi hanketyypikseen.

### Asemakaavahankkeen tietosisältö

| Tietokenttä | Kuvaus | Pakollinen tieto |
| --- | --- | --- |
| Hankkeen nimi | Asemakaavahankkeen annettava nimi. | Kyllä |
| Kuvaus | Vapaamuotoinen sanallinen kuvaus hankkeesta. | Kyllä |
| Alkuajankohta | Ajankohta jolloin hankkeen toteutus alkaa. | Kyllä |
| Loppuajankohta | Ajankohta jolloin hanke päättyy. Loppuajankohdan täytyy sijaita alkuajankohdan jälkeen. | Kyllä |
| Omistaja | Hankkeen omistajalla viitataan käyttäjään, joka omistaa hankkeen. Omistaja on lähtökohtaisesti hankkeen perustanut käyttäjä. Sitä voi kuitenkin vaihtaa valitsemalla arvoksi toisen käyttäjän. | Kyllä |
| Valmistelija | Asemakaavahankkeen valmistelusta vastaava henkilö. | Kyllä |
| Elinkaaren tila | Hankkeella on arvona kerrallaan aina vain yksi seuraavista elinkaaritiloista: Aloittamatta, Käynnissä, Valmis, Odottaa. Hanke saa perustamisen hetkellä elinkaaritilakseen automaattisesti Aloittamatta. Elinkaaritilojen ja esimerkiksi hankkeelle annettujen alku- ja loppuajankohtien välillä ei ole automaatiota, vaan ne toimivat toisistaan irrallisesti. | Kyllä |
| Alue/kaupunginosa | Alue tai kaupunginosa, jota asemakaavahanke koskee. | Kyllä |
| Kortteli/tontti | Kortteli tai tontti, jota asemakaavahanke koskee. | Kyllä |
| Osoitteet | Osoite tai osoitteet, missä asemakaavahanke sijaitsee | Kyllä |
| Diaarinumero | Asemakaavahankkeelle annettu diaarinumero Selma -sovelluksessa. | Kyllä |
| Diaaripäivämäärä | Päivämäärä, jona kirjaamo on avannut asemakaavahankkeelle diaarin Selma-tietojärjestelmässä. | Ei |
| Kaavanumero | Kaikki Hannassa perustetut asemakaavahankkeet saavat automaattisesti Hannan generoimana kaavanumeron. Käyttäjä ei voi muokata itse kaavanumeroa. Kaavanumero lukittuu hankkeen tallennushetkellä. | Kyllä |
| SAP-projektin ID | Mikäli asemakaavahanke on perustettu myös SAP-tietojärjestelmään, voi sen SAP-projektin ID:n kertoa Hannan hankkeelle taloustoteuman seuraamiseksi. Ole tarkkana, että annat arvoksi SAP:n projektin tunnisteen, etkä esimerkiksi rakenneosan tunnusta. Hanna validoi annetun tunnisteen ja kertoo käyttäjälle sen onnistumisesta. | Ei |
| Kaavahanketyyppi | Arvo valitaan joukosta Asemakaava, Asemakaavamuutos ja Yleissuunnitelma. Kaikki kolme saavat perustamisen yhteydessä oman uniikin kaavanumeron. | Ei |
| Suunnittelualue | Asemakaavahankkeet yksilöidään yhdelle neljästä eri suunnittelualueesta, jotka ovat Keskusta, Länsi, Itä ja Etelä. | Ei |
| Tekninen suunnittelija | Asemakaavahankkeelle osoitettu teknisestä avusta vastaava henkilö. | Ei |
| Aloitepäivämäärä | Asemakaavan aloitteeseen kirjattu päivämäärä. | Ei |
| Hakijan nimi | Kaavaa hakevan tahon nimi. | Ei |
| Hakijan osoite | Kaavaa hakevan tahon osoite. | Ei |
| Hakijan tavoitteet | Kaavaa hakevan tahon tavoitteet vapaamuotoisesti kuvattuna. | Ei |
| Lisätiedot | Kaavahakemukseen tai -hakijaan liittyvät lisätiedot | Ei |

### Asemakaavahankkeesta tiedottaminen
Asemakaavahankkeen perustamisen jälkeen käyttäjä voi lähettää siitä tiedotteen haluamiinsa sähköpostiosoitteisiin  tiedotus- välilehdellä Toiminnallisuus tähtää asemakaavahankkeen perustamiseen SAP:ssa, joten seuraavia sähköpostiosoitteita tarjotaan oletusarvoisesti. Käyttäjä voi kuitenkin ottaa ne pois lähetettävien listalta niin halutessaan.
- kapa_talous@tampere.fi
- kapakaava@tampere.fi

Tiedotteen, eli sähköpostiviestin, sisältö johdetaan automaattisesti asemakaavahankkeelle syötetyistä tietokentistä, jotka ovat lueteltu alle. Käyttäjä ei voi käsin muokata viestin sisältöä.

- Hankkeen nimi
- Valmistelija
- Alue/Kaupunginosa
- Kortteli/Tontti
- Osoitteet

Välilehdellä näytetään myös asemakaavahankkeen tiedotushistoria. Siitä selviää, kuinka monta kertaa hankkeelta on lähetetty tiedote, kenen toimesta, milloin ja kenelle.

Käyttäjällä on valittavanaan kaksi eri viestipohjaa: Hankkeen perustaminen ja Hankkeen tietojen muutos.

Myös Hannan testijärjestelmästä käsin voi lähettää tiedotteita. Tällöin lähtevään sähköpostiviestiin lisätään sekä otsikkoon että sisältöön maininta siitä, että kyseessä on testi.

## Investointihanke

### Yleistä
Investointihanke on hanke, jolla kasvatetaan Tampereen kaupungin omaisuuden arvoa. Siihen käytetty raha on investointirahaa (vrt. käyttötalous) ja käytettävissä olevan rahan määrää ohjaavat eri lautakuntien vuosisuunnitelmat vuositasolla. Investointihankkeita on monenlaisia, minkä myötä tämän hanketyypin on tarkoitus olla yleiskäyttöinen. Asemakaavahankkeet ovat Hannassa oma hanketyyppinsä huolimatta siitä, että nekin ovat määritelmän mukaisesti yhtä lailla investointihankkeita. 

Hannassa investointihankkeella on asemakaavahankkeesta poiketen laajempi tietomalli, joka pitää sisällään myös mahdollisuuden kirjata kohteita ja kohteille (työ-)vaiheita. Alla on kuvattu näiden kolmen elementin tietosisältö.

### Investointihankkeen tietosisältö

| Tietokenttä  | Kuvaus | Pakollinen tieto |
| --- | --- | --- |
| Hankkeen nimi | Investointihankkeelle annettu vapaamuotoinen nimi. | Kyllä |
| Kuvaus | Vapaamuotoinen sanallinen kuvaus hankkeesta. | Kyllä |
| Alkuajankohta | Ajankohta jolloin hankkeen toteutus alkaa. | Kyllä |
| Loppuajankohta | Ajankohta jolloin hanke päättyy. Loppuajankohdan täytyy sijaita alkuajankohdan jälkeen. | Kyllä |
| Omistaja | Hankkeen omistajalla viitataan käyttäjään, joka omistaa hankkeen. Omistaja on lähtökohtaisesti hankkeen perustanut käyttäjä. Sitä voi kuitenkin vaihtaa valitsemalla arvoksi toisen käyttäjän. Omistajalla on oikeus poistaa hanke ja osoittaa siihen muokkausoikeus | Kyllä |
| Elinkaaren tila  | Arvo valitaan seuraavista joukosta: Aloittamatta, Käynnissä, Valmis, Odottaa. Hanke saa perustamisen hetkellä elinkaaritilakseen automaattisesti Aloittamatta. | Kyllä |
| Lautakunta | Hankkeelle voi valita yhden seuraavista lautakunnista: Yhdyskuntalautakunta, Elinvoima- ja osaamislautakunta, Asunto- ja kiinteistölautakunta, Joukkoliikennelautakunta. Valitsemalla lautakunta osoitetaan hankkeelle se, kenen vuosisuunnitelmasta hankkeen toteutus saa varansa. | Kyllä |
| SAP-projektin ID | Mikäli investointihanke on perustettu myös SAP-tietojärjestelmään, voi sen SAP-projektin ID:n kertoa Hannan hankkeelle taloustoteuman seuraamiseksi. Ole tarkkana, että annat arvoksi SAP:n projektin tunnisteen, etkä esimerkiksi rakenneosan tunnusta. Hanna validoi annetun tunnisteen ja kertoo käyttäjälle sen onnistumisesta. | Ei |

### Investointikohteet
Kohde on investointihankkeen sisäinen olemassa oleva tai suunnitteilla oleva fyysinen rakennelma, jolla on tunnistettu käyttötarkoitus. Kyseessä on usein rekisterikohde, ja kohde voikin olla esimerkiksi väylä, rakennus, aukio, viheralue tai taitorakenne. Hankkeelle osoitetut resurssit, kuten raha, aika, alue ja toimijat eivät yleensä kohdistu koko hankkeelle tasan, ja kohteiden pääasiallinen tarkoitus onkin tarkentaa hankkeen sisältämien toimenpiteiden ja tavoitteiden kohdistumista. Investointihanke voi esimerkiksi viitata kokonaisen kaava-alueen rakentamiseen. 

Kohteita voi kirjata vain investointihankkeelle. Niiden kirjaaminen ei ole pakollista, eikä niiden lukumäärää hankkeella ole rajoitettu.

Hankkeen sisältämät kohteet on kirjattu hankesivun kohteet -välilehdelle. Sieltä käsin käyttäjä voi kirjata hankkeelle myös uusia kohteita valitsemalla _Luo uusi kohde_ -painikkeen. Valitsemalla kohteen käyttäjä siirtyy kohdesivulle, joka muistuttaa hankesivua, mutta kuvaa hankkeen sijasta sen kohteen. 

Tällä hetkellä toimintatapana on, että suunnittelulle ja rakentamiselle avataan omat kohteensa. 

Kohteen toteutusväli ei saa sijaita hankkeen toteutusvälin ulkopuolella. Jos käyttäjä yrittää avata, tai muokata olemassaolevaa kohdetta niin, että näin on käymässä, Hanna pyytää muokkaamaan toteutusväliä, ja vaihtoehtoisesti tarjoaa mahdollisuutta laventaa hankkeen toteutusväliä. Vastavuoroisesti käyttäjän ei anneta kaventaa hankkeen toteutusväliä, jos se tarkoittaisi sitä, että jokin sen kohteista jäisi sen toteutusvälin ulkopuolelle. 

#### Investointikohteen tietosisältö

| Tietokenttä | Kuvaus | Pakollinen tieto |
| --- | --- | --- | 
| Nimi | Kohteelle annettu nimi. Nimi ei saa olla sama hankkeen kanssa. | Kyllä | 
| Kuvaus | Vapaamuotoinen sanallinen kuvaus kohteesta. | Kyllä | 
| Suunnitteluttaja | Kohteen pääsuunnittelija. Valinta kohdistuu Tampereen sisäisiin henkilöihin. | Ei | 
| Rakennuttaja | Kohteen päärakennuttaja. Valinta kohdistuu Tampereen sisäisiin henkilöihin. | Ei | 
| Kohteen laji | Yksilöi, onko kohteessa kyse suunnitelusta vai rakentamisesta. Arvo valitaan alasvetovalikosta. | Kyllä | 
| Alkuajankohta | Ajankohta jolloin kohteen toteutus alkaa. | Kyllä |
| Loppuajankohta | Ajankohta jolloin kohteen toteutus päättyy. | Kyllä | 
| Elinkaaritila | Kohteella on arvona kerrallaan aina vain yksi seuraavista elinkaaritiloista: Aloittamatta, Käynnissä, Valmis, Odottaa. Kohde saa perustamisen hetkellä elinkaaritilakseen automaattisesti Aloittamatta. Hankkeen ja sen kohteiden elinkaaritilojen hallinta perustuu toistaiseksi manuaaliseen kirjaamiseen. | Kyllä |
| Kohteen tyyppi | Kohteen tyyppi kertoo, onko kyse uudesta rakentamisesta vai olemassaolevan kohteen muokkaamisesta. Kohteelle valitaan yksi tyyppi arvojoukosta: Uudisrakentaminen, Peruskorjaaminen, Toimivuuden parantaminen. | Kyllä | 
| Omaisuusluokka | Omaisuusluokka määrittelee poistoajan, jonka mukaan käytetty investointi poistuu taseesta. Arvo valitaan alasvetovalikosta valmiista koodistosta. | Kyllä | 
| Toiminnallinen käyttötarkoitus | Toiminnallinen käyttötarkoitus viittaa kohteen käyttötarkoitukseen valmistuessaan. Arvo valitaan alasvetovalikosta valmiista koodistosta. | Kyllä | 
| SAP-rakenneosa | Jos kohteelle löytyy sitä vastaava rakenneosa SAP:n projektista, voi käyttäjä osoittaa sen valitsemalla valikosta sopivan arvon. Tämän ehtona on se, että hankkeelle on osoitettu SAP-projektin ID. Tämä mahdollistaa kohteen taloustoteuman seurannan. | Ei |

#### Kohteen toimijat
Kohteelle voi lisäksi osoittaa toimijoita. Toimija koostuu henkilön ja roolin yhdistelmästä (esimerkiksi Iiro Iironen - urakoitsijan edustaja). Toistaiseksi tarjolla on seuraavat roolit. Rooli listaa täydennetään tarpeen mukaan. 
- Turvallisuuskoordinaattori
- Vastaava työnjohtaja
- Valvoja
- Suunnittelun edustaja
- Urakoitsijan edustaja

Toimijoiden yksilöiminen kohteelle ei ole pakollista. Yhteen rooliin on mahdollista osoittaa useita henkilöitä. Henkilöt voivat olla sisäisiä henkilöitä, toisin sanoen kaupungin palveluksessa, tai ulkoisia henkilöitä, kuten esimerkiksi konsultteja. Sisäisten henkilöiden lista juontuu Hannan tuntemista käyttäjistä, eli käyttäjistä, jotka ovat luvitettu Hannaan ja kirjautuneet ainakin kerran. Ulkoisia henkilöitä voi hallita ja lisätä [hallintapaneelista](#yrityksien-ja-heidän-yhteyshenkilöiden-hallinta) käsin kuka tahansa. 

![Toimijat_kohteella](/images/toimijat_kohteella.png)

_Yllä olevassa kuvassa on esitetty kohteelle valitut toimijat. Valvojaksi on valittu useampi henkilö._

#### Vaiheet
Vaihe on kohteeseen kohdistuva työvaihe, josta syntyy jokin konkreettinen tulos ja samalla kustannus. Vaiheella ei ole hankkeesta ja kohteesta poiketen omaa sijaintia. Vaiheen tuloksena voi olla esimerkiksi uusi tai korjattu rakennus tai muu rakennelma, asiakirja, mittaustulos tai ylläpidon toimi. Vaiheen määrityksessä auttaa pitkä koodisto, jonka arvot vastaavat SAP-järjestelmän vastaavaa koodistoa. Alla olevassa taulukossa on kuvattu vaiheen tietosisältö.

| Tietokenttä  | Kuvaus  | Pakollinen tieto |
| --- | --- | --- |
| Nimi | Vaiheelle annettu nimi. Nimen täytyy olla uniikki. Nimi ei saa olla sama hankkeen tai kohteen kanssa. | Kyllä |
| Kuvaus | Vapaamuotoinen sanallinen kuvaus vaiheesta. | Kyllä |
| Elinkaaren tila | Vaiheella on arvona kerrallaan aina vain yksi seuraavista elinkaaritiloista: Aloittamatta, Käynnissä, Valmis, Odottaa. Tehtävä saa perustamisen hetkellä elinkaaritilakseen automaattisesti Aloittamatta. Hankkeen, kohteiden ja tehtävien välinen elinkaaritilojen hallinta perustuu toistaiseksi manuaaliseen kirjaamiseen. | Kyllä |
| Vaihe | Vaiheen koodi osoittaa tarkemmin, millaisesta toimennpiteestä on kyse. Se osoitetaan laajasta koodistosta, josta löytyy suunnitteluun (2-alkuiset), rakentamiseen (3-alkuiset) ja ylläpitoon (4-alkuiset) liittyviä toimenpiteitä. Toistaiseksi Hannassa ei ole rajoitettu vaiheen tyyppivalintaa hankkeen tai kohteen tyypin mukaan. Vaihekoodit vastaavat SAP -järjestelmästä löytyviä koodeja. | Kyllä |
| Alkuajankohta | Ajankohta jolloin vaiheen toteutus alkaa. | Kyllä |
| Loppuajankohta  | Ajankohta jolloin vaiheen toteutus päättyy. | Kyllä |

### Investointihankkeen talous
Hankesivun talousvälilehdeltä käsin hankkeelle on mahdollista kirjata vuosikohtainen talousarvio, ennuste ja käyttösuunnitelman muutos. Lisäksi samaan näkymään luetaan SAP:sta toteuma, jos sellainen on tarjolla. Talous-välilehdelle näkyvien vuosikohtaisten rivien lukumäärä johdetaan automaattisesti hankkeelle annetusta toteutusvälistä (alku- ja loppuajankohta). Luvut annetaan aina euroina. Kirjaaminen on mahdollista kahden desimaalin tarkkuudella. 

Huomioi, että vielä toistaiseksi hankkeelle, sen kohteille ja kohteen vaiheille kirjattavat talousluvut eivät ole toisistaan riippuvaisia, vaan keskenään irrallisia tietokenttiä. 

Talousosioon kirjattujen lukujen katsotaan kohdistuvan aina hankkeelle kirjattuun lautakuntaan. 

#### Talousarvio
Talousarvio on käyttäjän arvio ja päättäjille esitettävä kustannus hankkeen, kohteen tai vaiheen toteuttamisesta. Toistaiseksi Hannalle ei ole keinoa eritellä sitä, onko talousarvioksi kirjattu luku saanut hyväksynnän vaadittavilta tahoilta, vai yksinään käyttäjän arvio kustannuksesta. Talousarvion voi tällä hetkellä kirjata sekä hankkeille, sen kohteille sekä kohteiden vaiheille. Niille kirjattavat arvot ovat kuitenkin toisistaan irrallisia, eli toistaiseksi jää käyttäjän vastuulle jakaa raha loogisesti osana rakennetta. 

#### Toteuma
Hankkeille, ja myös investointihankkeiden kohteille, joille on ilmoitettu niille luotu SAP-projekti (tai kohteen tapauksessa rakenneosa), ilmoitetaan kustannusarvion rinnalla niiden toteuma. Toteuma ilmoitetaan vuositasolla, kuten kustannusarviokin. Toteuman näkeminen mahdollistaa hankkeiden taloudellisen seurannan sekä reagoinnin mahdollisiin poikkeamiin, kuten budjetin ylityksiin. Toteumaa ei voi muokata Hannasta käsin. Toteuma haetaan suoraan SAP:iin kirjatuista tositteista summaamalla niiden luvut vuosikohtaisesti. Toteuma haetaan hankkeelle, kohteille ja vaiheille. Hanna tuntee toteuman tositteen tarkkuudella. Yksittäisiä tositteita ei kuitenkaan eritellä käyttöliittymään. 

#### Ennuste
Ennusteella viitataan hankkeen läheisesti tuntevan tahon arvioon siitä, miten sille miten hankkeen talousarvio kestää tarkastelun toteumaa vasten. Ennusteen kirjaaminen on tapa viestiä budjetin (talousarvion) alittumisesta tai ylittymisestä. Budjetin ylitys kirjataan positiivisena, eli esimerkiksi sadan tuhannen euron ylitys kirjataan lukuna 100 000. Budjetin alitus kirjataan taas negatiivisena numerona, esimerkiksi -100 000. Hannan käyttöliittymä värittää budjetin ylitykset punaisella värillä ja alitukset sinisellä värillä. 

Ennusteet kirjataan hankkeen kohteille. Hankesivun talousvälilehdellä on vain luettavissa sen kohteilta summattut ennusteluvut vuosittain. 

#### Käyttösuunnitelman muutos
Mikäli hankkeeseen suunnitellun talousarvion käyttö muuttuu merkittävästi vuoden aikana, voi hankkeen taloustietoihin kirjata käyttösuunnitelman muutoksen. Tämä voi mahdollistaa esimerkiksi lisärahan osoittamisen hankkeelle tai siitä käyttämättä jäävien rahojen ohjaamisen osaksi toisen hankkeen talousarviota. Käyttösuunnitelman muutos on aina positiivinen luku.

KSM kirjataan hankkeen kohteille. Hankesivun talousvälilehdellä on vain luettavissa sen kohteilta summatut KSM-luvut vuosittain. 

# Investointiohjelmointinäkymä

![Investointiohjelmointi](/images/investointiohjelmointi_v2.png)

## Tietosisältö ja tietojen muokkaaminen
Investointiohjelmointinäkymä on nimensä mukaisesti tarkoitettu vuosikohtaisen investointiohjelmoinnin rakentamiseen, sen seuraamiseen ja hallinnointiin. Kyseinen näkymä muodostuu taulukosta, joka listaa investointihankkeiden **kohteita**. Näkymään voi siirtyä päänavigointipalkista käsin (1). 

Taulukossa (8) jokaiselle kohteelle on kerrottu seuraavat tiedot, mikäli ne ovat olemassa: 
- Hanke, johon kohde kuuluu
- Kohteen nimi
- (Elinkaari-)Tila
- Toteutusväli (johdettu alku- ja loppuajankohdasta)
- Tyyppi
- Omaisuusluokka
- Käyttötarkoitus
- Rakennuttaja ja suunnitteluttaja
- Talousarvio
- Toteuma
- Ennuste
- Käyttösuunnitelman muutos

Painamalla hiirellä kohteen tai hankkeen nimen yhteydessä olevaa ikonia pääset hyppäämään kyseiselle hanke- tai kohdesivulle. Sivu aukeaa uuteen välilehteen. 

Kohderivit on järjestetty hankkeittain. Hankkeen nimi on korostettu vihreällä värillä. Hankkeen nimi on kirjattu vain ensimmäiselle kohteelle ja seuraavilla, samaan hankkeeseen kuuluvilla kohderiveillä hankkeen nimen tilalla on hakanen. 

Taulukon solujen tietoja pystyy tiettyjä poikkeuksia lukuunottamatta muokkaamaan olettaen, että käyttäjällä on käyttöoikeudet kohteen hankkeeseen. Mikäli käyttäjällä ei ole oikeutta muokata hankkeen kohteita, on tekstin väri vaaleanharmaa. Käyttäjä voi muokata taulukossa näkyviä tietoja kaksoisklikkaamalla hiiren vasemmalla painikkeella haluttuun taulukon soluun, jolloin muokkausikkuna ponnahtaa esiin. Kaikki solut eivät kuitenkaan ole muokattavissa (toteuma, hankkeen nimi). 

![Ponnahdusikkuna muokatessa](/images/muokkaus_ponnahdus.png)

_Kuvassa käyttäjä on klikannut kohteen omaisuusluokkasolua, jolloin ponnahdusikkuna on auennut._

Kun muokkaat mitä tahansa solua, ilmestyy taulukon vasempaan alakulmaan joukko painikkeita. `Tallenna` -painikkeesta tallennat kaikki muutokset, jotka olet tehnyt. Niitä voi siis olla kertynyt useampiakin. `Peru kaikki muutokset` -painike peruuttaa kaikki muutokset, joita olet tehnyt kyseisellä muokkauskerralla. Nuolipainike taaksepäin kumoaa edellisen muokkauksen. Nuolipainike eteenpäin vie muokkaushistoriassa yhden eteenpäin. Tallentaessasi sovellus ilmoittaa ponnahdusikkunalla tietojen tallentamisen tapahtuneen onnistuneesti. 

![Tallennuspalkki](/images/tallenna_palkki.png)

_Käyttäjän muokattua tietoja ilmestyy taulukon päälle sen vasempaan alareunaan kuvanmukainen palkki._

Vierittämällä sivua alaspäin sivun yläosassa sijaitsevat hakusuodattimet (6) katoavat näkyvistä, jotta taulukko saisi enemmän tilaa käyttöönsä. Samalla taulukon vasempaan alakulmaan ilmestyy painike, jota painamalla käyttäjä pääsee takaisin ylös. Taulukon oikeassa alakulmassa käyttäjä voi vaihdella taulukon sivujen välillä, ja vaikuttaa siihen, kuinka monta riviä yhdellä sivulla näytetään. Oletus on tuhat riviä per sivu. 

![Palaa ylös painike](/images/palaa_ylos_painike.png)

_Kuvassa näkyvä painike ilmestyy vasempaan alakulmaan, kun käyttäjä on vierittänyt taulukon sisältöä alaspäin. Painamalla siitä pääsee palaamaan takaisin ylös._

## Vuosivalinta hakusuodattimet ja summarivi
Taulukko kohdistuu ensisijaisesti yhteen kalenterivuoteen. Sivun yläosassa on vuosivalinta, josta käsin käyttäjä pystyy valitsemaan häntä kiinnostavan vuoden (2). Vuosivalinta vaikuttaa siihen, miltä vuodelta kohderiveille katsotaan talousluvut, eli talousarvio, toteuma, ennuste ja käyttösuunnitelman muutos. Vuosivalinta vaikuttaa myös (talouden) summarivillä näytettäviin lukuihin. Valinta voi kohdistua kerrallaan vain yhteen vuoteen. 

Huomioi, että kohde katsotaan mukaan aina, kun se _leikkaa_ valittua vuotta. Näin ollen kohde, jonka toteutusväli on 31.12.2023-31.12.2024, valikoituisi mukaan vuosivalinnan ollessa `2023`, ja sille näytettävät talousluvut johdettaisiin päivältä yksinään päivältä 31.12.2023. 

Käyttäjä voi valita vuosivalitsimesta myös valinnan `koko elinkaari`, jolloin talousluvut johdetaan kohderiveille niiden koko elinkaaren ajalta. Tällöin talouslukuja ei pysty kuitenkaan muokkaamaan taulukossa. 

Summarivi (7) sijaitsee näkymässä suoraan taulukon päällä. Siihen on laskettu taulukossa kyseisellä hetkellä ilmenevien kohteiden talousarvioiden, toteumien, ennusteiden ja käyttösuunnitelman muutosten summa. Summarivi juontaa lukunsa aina taulukossa sillä hetkellä näkyvistä riveistä, joten myös muut hakusuodattimet tulevat huomioiduksi sen luvuissa. 

Vuosivalinnan (2) lisäksi käyttäjän tarjolla on joukko muita hakusuodattimia (6), joilla vaikuttaa taulukkoon tulevien kohderivien joukkoon: 
- Kohteen nimi
- Hankkeen nimi
- Kohteen laji (rakenuttaminen/suunnittelu)
- Kohteen Tyyppi (esim. uudisrakentaminen)
- Kohteen omaisuusluokka
- Kohteen käyttötarkoitus
- Elinkaaren tila

Taulukossa näkyvät kohderivit on mahdollista viedä Excel-taulukkoon valitsemalla painikkeen _lataa raportti_ (4). Tiedostoon viedään kohderivit, jotka sen hetkinen suodatus on palauttanut.

Hakusuodattimia voi käyttää yhdessä ja ne toimivat myös yhdessä vuosivalinnan kanssa. Jos käytössä on useampi hakusuodatin, on niiden välinen looginen operaattori `JA`. Näin ollen, jos käyttäjä on valinnut esimerkiksi vuodeksi `2024`, elinkaaritilaksi `aloittamatta` ja käyttötarkoitukseksi `ajoradat`, tulee taulukkoon ajoradat, jotka ovat aloittamatta ja joiden toteutus sijoittuu kokonaan tai osittain vuodelle 2024. 

Käyttäjä voi myös valita vuosivalinnan vierestä painikkeen _Näytä vain omat kohteet_ (3). Tällöin taulukkoon tuodaan vain kohteet, joissa kirjautunut käyttäjä on merkitty johonkin rooliin kohteella (esim. rakennuttaja, valvoja. Ei kuitenkaan hankkeen omistaja). 

## Uuden kohteen lisääminen
Käyttäjä voi lisätä uuden kohteen myös investointiohjelmoinnista käsin (5). Valitsemalla oikeasta yläkulmasta `uusi kohde` painikkeen käyttäjä päätyy suoraan kohdesivulle, jossa hän samalla pääsee yksilöimään sen, mihin hankkeeseen kohde avataan. Hankevalinnan alasvetovalikko sisältää vain hankkeet, joissa käyttäjällä on muokkausoikeus. Mikäli käyttäjällä ei ole mihinkään hankkeeseen muokkausoikeutta, näkyy painike harmaana. Kohteen tallentamisen jälkeen käyttäjä palaa takaisin investointiohjelmointinäkymään.

# SAP-raportit näkymä

## Yleistä SAP-raporteista
SAP-raportit sisältää kaksi taulukkoa, joista toinen tarjoaa tietoa ympäristökoodeista (ympäristöinvestoinnit) ja toinen puitesopimuksista. Näkymään voi navigoida valitsemalla sen päänavigointipalkista. Tiedot haetaan suoraan SAP:sta, mutta Hanna kyselee ne kaikki kerralla yöaikaan. Näin ollen tiedoissa on maksimissaan päivän viive. Kulunut aika edellisestä hausta on kerrottu sivun oikeassa ylälaidassa. Taulukkoon valikoituvia rivejä voi rajata valitsemalla yhdestä tai useammasta tarjolla olevasta hakusuodattimesta arvon. Jos arvoja useampi hakusuodatin on valittu, pitää rivin täyttää kaikki ehdot. Taulukossa näkyvät tiedot on mahdollista viedä excel-tiedostoon valitsemalla painike _lataa raportti_. 

SAP:a mukaillen on menot esitetty positiivisina lukuina ja tulot negatiivisina. Toteuma on näiden summa. Taulukon yläpuolella on summarivi, johon johdetut luvut muodostuvat taulukossa näkyvistä riveistä.  

Muista, että SAP:sta haettavat tiedot on rajattu yrityksiin:
- 1110 (KAPA)
- 1350 (KITIA)
- 1540 (ELOSA)

![SAP-raportit](/images/sap_raportit.png)
_SAP-raporttien sivu näyttää tältä. Sivun löytää Hannan päänavigointipalkista. Sivulta käsin käyttäjä voi vaihtaa eri taulukkojen välillä, joita on tällä hetkellä kaksi: ympäristökoodit ja puitesopimukset._

## Ympäristökoodit
Tässä taulukossa käyttäjä voi koostaa haluamansa tiedot kaupungin ympäristöinvestoinneista tarkentaen halutessaan yksittäiseen investointikohteeseen, toisin sanoen ympäristökoodiin (esim. ilmastonmuutoksen hillintä tai vesiensuojelu). Ota kuitenkin huomioon, että taulukkoon tulee luetuksi _kaikki_ SAP:n rakenneosat, eikä ennakoivaa rajoittamista vain ympäristökoodin yksilöiviin rakenneosiin ole tehty. Näin ollen käyttäjän on tärkeää huomioida mukaan ainakin ympäristökoodin valinta. Toisaalta on olemassa rakenneosia, joita epätarkoituksenmukaisesti puuttuu ympäristökoodi, ja siksi on hyvä pystyä hakemaan myös rakenneosia ilman koodia. 

Ympäristöinvestointien osalta taulukkoon listataan SAP:n rakenneosia, joille kerrotaan seuraavat tiedot:
- Projektin tunnus
- Rakenneosan tunnus
- Rakenneosan nimi
- Ympäristökoodi
- Ympäristösuojelun investoinnin syy
- Kumppanit
- Menot
- Tulot
- Toteuma

Rakenneosien joukkoa voi suodattaa seuraavilla tiedoilla:
- Vapaahaku (projektin ja rakenneosan tunniste, rakenneosan nimi)
- Ympäristökoodi (alasvetovalikko, jonka arvot johdettu datasta. Monivalinta)
- Vuosi (alasvetovalikko, jonka arvot johdettu datasta. Monivalinta)

Jos käyttäjä ei valitse vuotta, muodostetaan talousluvut (menot, tulot, toteuma) koko rakenneosan elinkaarelta. Jos käyttäjä valitsee yhden vuoden, kohdistuvat luvut kyseiseen vuoteen. Jos käyttäjä valitsee useamman vuoden, ovat luvut kyseisten vuosien summa. 

Rakenneosan tietoja on myös tarkennettu kumppaneilla. Jokaisen rivin voi avata hakasesta `kumppanit` -sarakkeessa, jossa on esitetty kumppanien lukumäärä. Avaamisen jälkeen talousluvut esitetään kumppaneittain. Kumppani luetaan tositteelta. Kaikki tositteet, joilta ei löydy kumppanitietoa, on summattu yhteen `Ei määriteltyä kumppanikoodia` -arvoon. 

Käyttäjän viedessä tiedot Excel-tiedostoon, eritellään taulukossa olleet riville ensimmäiselle välilehdelle rakenneosittain ja toiselle välilehdelle kumppaneittain. 

## Puitesopimukset
Puitesopimukset -välilehdellä käyttäjän on mahdollista tarkastella kaupungin eri puitesopimuksia ja niiden taloustoteumaa suhteessa sopimushintaan. Toisin kuin ympäristökoodien osalta, taulukossa on SAP:n verkkoja. Niistä kerrotaan seuraavat tiedot: 
- Projektin tunnus
- Verkon tunnus
- Verkon nimi
- Projektin vastuuhenkilö
- Konsulttiyritys
- Päättäjä
- Päätöspäivämäärä
- Puite- tai ostotilaus
- Sopimushinta
- Menot
- Tulot
- Toteuma

Verkkojen joukkoa voi suodattaa seuraavilla tiedoilla:
- Vapaahaku (projektin ja verkon tunniste, verkon nimi, projektin vastuuhenkilö)
- Konsulttiyritys (alasvetovalikko, jonka arvot johdettu datasta; monivalinta.)
- Puite- tai ostotilaus (alasvetovalikko, jonka arvot johdettu datasta; monivalinta)
- Vuosi (alasvetovalikko, jonka arvot johdettu datasta; monivalinta)

Jos käyttäjä ei valitse vuotta, muodostetaan talousluvut (menot, tulot, toteuma) koko rakenneosan elinkaarelta. Jos käyttäjä valitsee yhden vuoden, kohdistuvat luvut kyseiseen vuoteen. Jos käyttäjä valitsee useamman vuoden, ovat luvut kyseisten vuosien summa. 

# Yrityksien ja heidän yhteyshenkilöiden hallinta
Hannan oikeasta ylälaidasta löytyvän Hallinta -näkymän kautta käyttäjät voivat luoda, muokata ja poistaa hankkeisiin liittyvien yrityksien ja heidän yhteyshenkilöiden tietoja. Yrityksille ja heidän yhteyshenkilöille on omat välilehtensä.

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

Yllä olevan listan Yrityksen nimi -arvo valitaan alasvetovalikosta niistä yrityksistä, jotka Hannaan on luotu.

Yrityksen yhteyshenkilön voi toistaiseksi antaa vain investointihankkeella tehtävän urakoitsija -kenttään.

![yritysten_yhteyshenkilöt](/images/yritysten_yhteyshenkilot.png)<br/>
_Yritysten yhteyshenkilöt hallintapaneelissa. Huomioi myös Yritykset välilehti, jolta käsin voi muokata yritystietoja._