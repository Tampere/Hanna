<font size="10">Käyttöohjeet</font>

<font size="6">Sisällysluettelo</font>

- [Yleistä](#yleistä)
- [Järjestelmän tuki](#järjestelmän-tuki)
- [Testi- ja tuotantojärjestelmä](#testi--ja-tuotantojärjestelmä)
- [Integraatiot muihin järjestelmiin](#integraatiot-muihin-järjestelmiin)
  - [SAP](#sap)
  - [Geoserver](#geoserver)
  - [Hankkeen perustamisen ja ostotilauksen pyyntölomake (nk. e-lomake)](#hankkeen-perustamisen-ja-ostotilauksen-pyyntölomake-nk-e-lomake)
- [Karttasivu](#karttasivu)
  - [Uuden hankkeen perustaminen](#uuden-hankkeen-perustaminen)
  - [Hakujen tekeminen](#hakujen-tekeminen)
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
  - [Investointihanke](#investointihanke)
    - [Yleistä investointihankkeesta](#yleistä-investointihankkeesta)
    - [Investointihankkeen tietosisältö](#investointihankkeen-tietosisältö)
    - [Investointikohteet](#investointikohteet)
      - [Investointikohteen tietosisältö](#investointikohteen-tietosisältö)
      - [Investointikohteen toimijat](#investointikohteen-toimijat)
      - [Vaiheet](#vaiheet)
    - [Taloussuunnittelu ja -seuranta investointihankkeella](#taloussuunnittelu-ja--seuranta-investointihankkeella)
  - [Kunnossapitohanke](#kunnossapitohanke)
    - [Yleistä kunnossapitohankkeesta](#yleistä-kunnossapitohankkeesta)
    - [Kunnossapitohankkeen tietosisältö](#kunnossapitohankkeen-tietosisältö)
    - [Kunnossapitokohteet](#kunnossapitokohteet)
      - [Kunnossapitokohteen tietosisältö](#kunnossapitokohteen-tietosisältö)
      - [Kunnossapitokohteen toimijat](#kunnossapitokohteen-toimijat)
    - [Taloussuunnittelu ja -seuranta kunnossapitohankkeella](#taloussuunnittelu-ja--seuranta-kunnossapitohankkeella)
- [Investointiohjelmointi-näkymä](#investointiohjelmointi-näkymä)
- [Investointien taloussuunnittelu-näkymä](#investointien-taloussuunnittelu-näkymä)
- [SAP-raportit näkymä](#sap-raportit-näkymä)
  - [Yleistä SAP-raporteista](#yleistä-sap-raporteista)
  - [Ympäristökoodit](#ympäristökoodit)
  - [Puitesopimukset](#puitesopimukset)
- [Yrityksien ja heidän yhteyshenkilöiden hallinta](#yrityksien-ja-heidän-yhteyshenkilöiden-hallinta)

# Yleistä
Hanna on Tampereen kaupungin maankäytön suunnittelun ja toteuttamisen hanketietojärjestelmä. Se tarjoaa mahdollisuuden perustaa investointien ja kunnossapidon hankkeita, suunnitella niiden taloutta ja seurata niiden taloustoteumaa. Hannan rooli korostuu erityisesti hankesuunnittelussa: Millaisia hankkeita ja millaisella budjetilla toteutetaan vuoden, kolmen tai esimerkiksi viidentoista vuoden päästä.

Hannan käyttöä laajennetaan käyttäjäryhmä kerrallaan. Kehitys on aloitettu vuonna 2022. Kehittäjänä ja ylläpitäjänä toimii Ubigu Oy.

# Järjestelmän tuki
Lähitukea tarjoaa Patrick Hanska ([patrick.hanska@tampere.fi](mailto:patrick.hanska@tampere.fi)). Patrick vastaa myös käyttäjien luvittamisesta sovelluksen käyttöön. Hannalla on myös oma Teams -ryhmä, jossa järjestelmän käytöstä ja kehityksestä voi keskustella muiden käyttäjien ja kehittäjien kesken.

Virhetilanteista ja bugeista viestitään Patrick Hanskalle, joka on yhteydessä Hannan kehittäjään bugien korjaamiseksi.

# Testi- ja tuotantojärjestelmä
Hannasta on olemassa kaksi eri järjestelmää. Testijärjestelmä toimii osoitteessa [tre-hanna-test.azurewebsites.net](https://tre-hanna-test.azurewebsites.net/). Siellä käyttäjät voivat kokeilla Hannan toiminnallisuuksia ilman huolta järjestelmän rikkoutumisesta tai tuotantokäytön häiriintymisestä. Varsinainen käyttö tapahtuu tuotantojärjestelmässä osoitteessa [hanna.tampere.fi](https://hanna.tampere.fi).

Huomioi, että testijärjestelmään luodut tiedot voivat aikanaan poistua, ja se on tarkoitettu yksinomaan testaamiseen. Varsinainen hanketieto tulee kirjata tuotantojärjestelmään, missä sen säilymisestä, eheydestä ja varmuuskopioinnista huolehditaan. Järjestelmiin luvittaminen tapahtuu erikseen, eli esimerkiksi tuotantojärjestelmään pääsevä käyttäjä ei automaattisesti pääse myös testijärjestelmään.

# Integraatiot muihin järjestelmiin
Tässä kappaleessa on listattu kaupungin muut tietojärjestelmät, joiden kanssa Hanna omaa jonkinasteisen integraation.

## SAP
Hanna lukee SAP:sta projektien tietoja sekä niiden tositteita. Toistaiseksi tietojen luku tapahtuu yksisuuntaisesti, eli SAP ei vastavuoroisesti hae tietoa Hannasta tai ota kantaa Hannan hankkeisiin. Hannasta käsin ei myöskään toistaiseksi ole mahdollista päivittää tietoja suoraan SAP:iin. Hanna hakee kaikki SAP:n projektit ja niiden tositteet kerran vuorokaudessa yöaikaan ja tallentaa ne omaan tietokantaansa, josta ne esitetään käyttöliittymässä. SAP:iin toteutetut muutokset ilmenevät näin ollen Hannassa yleensä päivän viiveellä.

## Geoserver
Paikkatietojen osalta Hanna hyödyntää kaupungin olemassaolevia aineistoja ja rajapintoja. Geoserveriltä haetaan erilaisia taustakartta-aineistoja (opaskartta, asemakaava, virastokartta...), rekisterikohteita (kiinteistöt, kadut...) sekä aluerajauksia (tilastoalueet). Saatavilla olevia aineistoja on mahdollista lisätä tarpeen mukaan.

## Hankkeen perustamisen ja ostotilauksen pyyntölomake ( -lomake)
Hannan navigointipalkin oikeasta laidasta löytyy painike, joka ohjaa käyttäjän e-lomakkeelle, jota kautta voi pyytää SAP-projektin perustamista ja ostotilauksen tekemistä talousyksiköltä.

# Karttasivu
![Hannan karttasivu](/images/karttasivu.png)<br/>

Kartta on Hannan laskeutumissivu. Siellä käyttäjä voi tarkastella hankkeita, tai vaihtoehtoisesti niiden kohteita kartalla, tehdä hakuja, tarkastella niiden perustietoja sekä perustaa uusia hankkeita tai kohteita. Alla on kuvattu yllä näkyvään kuvaan numeroidut toiminnot tarkemmin.

1. Valitse tarkasteltavaksi joko hanke- tai kohdekartta.
2. Käyttäjä voi luoda itselleen joukon pikasuodattimia vaihdellakseen nopeasti eri hanke-kohde-joukkojen välillä. Hanke- ja kohdevälilehdillä on omat pikasuodattimensa.
3. Eri haut mahdollistavat suodattimet sijaitsevat tässä. Niiden joukko vaihtuu sen mukaan, onko valittuna hanke- vai kohdekartta.
4. Hakutulokset näkyvät tässä. Klikkaamalla hakutulosta siirryt hanke- tai kohdesivulle. Kohdekartan puolella haun palauttamat kohteet on ryhmitelty hankkeittain ja niiden omaisuusluokat sekä laji (suunnittelu/rakentaminen) on tuotu ilmi ikonein.
5. Hankkeet tai kohteet voi viedä Excel-taulukkotiedostoon painikkeesta "lataa raportti". Tiedostoon tulevat viedyksi vain aktiivisen haun mukaiset hankkeet/kohteet. Jos hanketyyppejä on valittuna useita, viedään ne tiedostossa omille välilehdilleen.
6. Hankkeiden visualisointityyliä voi vaihtaa karttaikkunan vasemmasta yläkulmasta löytyvästä alasvetovalikosta.
7. Karttaikkuna, jolla näytetään joko hankkeita tai kohteita riippuen valinnasta kohdassa yksi. Piirtotapa on riippuvainen siitä, kuinka etäältä karttaa katsotaan. Kuvassa hankkeiden sijainnit ovat esitetty kootusti kuvanmukaisilla numeroiduilla pallosymboleilla, jotka tarkentuvat lähentäessä karttaan. Myös karttaikkuna toimii hakusuodattimena.
8. Perusta uusi hanke (tai kohde, jos kohdekartta valittuna).
9. Oikeassa yläkulmassa on erikseen esitetty hankkeet, jotka koskevat koko kunnan aluetta. Ikonia klikkaamalla pääset selaamaan koko kunnan hankkeita ja halutessasi siirtymään niiden hankesivulle.
10. Käyttäjä voi valita eri kartta-aineistoja näkyville ja pois näkyvistä. Valittavana on joukko taustakarttoja, rekisterikohteita ja aluejakoja.
11. Karttaselite.

Käyttäjä voi klikata kartalla näkyviä hanke- ja kohdealueita, jolloin niille näytetään ponnahdusikkunassa perustiedot, ja josta käsin on mahdollista siirtyä hanke- tai kohdesivulle. Jos klikkaus kohdistuu useampaan hankkeeseen tai kohteeseen, niiden välillä voi selata nuolinäppäimillä. Karttavalinta korostetaan keltaisella. Toistaiseksi kaupungin rajapinnoilta haettavien aineistojen ominaisuustietoja ei pysty lukemaan Hannasta käsin.

![karttavalinta](/images/karttavalinta.png)

Kattavimmat tiedot ja muokkausmahdollisuus löytyvät hankkeiden ja kohteiden omilta sivuilta.

## Uuden hankkeen perustaminen
Uusi hanke perustetaan etusivulta löytyvästä _Luo uusi hanke_ -painikkeesta. Painaessaan sitä käyttäjä valitsee ensin, minkä hanketyypin mukaisen hankkeen hän haluaa perustaa. Vain ne hanketyypit, joiden perustamiseen käyttäjällä on oikeus, listataan (lue lisää [käyttöoikeuksista](#käyttöoikeudet)). Valinta on olennainen, sillä hanketyypeillä on erilaiset tietosisällöt ja rakenne. Tämän jälkeen käyttäjä ohjataan tyhjälle hankesivulle, jossa hankkeen tiedot pääsee täyttämään.

Uusia kohteita voi perustaa karttasivun kohteet-välilehdeltä, hankesivuilta ja investointiohjelmoinnin näkymästä käsin.

## Hakujen tekeminen
Hankkeita voi hakea seuraavilla ehdoilla.

- Vapaa tekstihaku, joka kohdistuu nimeen, kuvaukseen
- Hakuaikaväli (tarkistaa, leikkaako asetettu aikaväli hankkeen alku- ja loppupäivämäärän väliä)
- Elinkaaren tila
- Hanketyyppi
- Omistaja

Kohteita voi hakea seuraavilla ehdoilla.

- Vapaa haku, joka kohdistuu kohteen nimeen ja kuvaukseen
- Hakuaikaväli (tarkistaa, leikkaako asetettu aikaväli kohteen alku- ja loppupäivämäärän väliä)
- Kohteen laji
- Kohteen tyyppi
- Omaisuusluokka
- Käyttötarkoitus
- Elinkaaren tila
- Rakennuttaja
- Suunnitteluttaja

Jos hakuehtoja on useampia, niiden kaikkien pitää toteutua, jotta hanke tai kohde ilmestyy hakutuloksiin. Hankkeita hakiessa, jos käyttäjä yksittäisen hanketyypin, ilmestyy hakusuodattimien yhteyteen valinta _Näytä hanketyyppikohtaiset suodattimet_. Sen takaa avautuvasta osiosta käyttäjä voi vielä tarkentaa hakua hanketyypille ominaisilla tiedoilla.

Myös itse karttaikkuna toimii suodattimena. Hakutuloksiin ilmestyvät oletuksena myös hankkeet tai kohteet, joilta puuttuu aluerajaus. Käyttäjä voi painaa, riippuen valitusta välilehdestä, painiketta _vain sijaintitiedon sisältävät hankkeet_ tai painiketta _vain sijaintitiedon sisältävät kohteet_ jättääkseen hakutuloksista pois geometriattomat hankkeet tai kohteet. Lisäksi tarjolla on painike, jolla hakutuloksiin saa nopeasti tuotua vain koko kunnan aluetta koskevat hankkeet. Kohteiden puolelta löytyy vielä painike, jolla saat valituksi vain omat kohteet. Oma kohde tarkoittaa kohdetta, jossa käyttäjälle on osoitettu kohteella jokin toimijarooli (esim. rakennuttaja, suunnitteluttaja tai valvoja).

Käyttäjillä on myös mahdollisuus luoda omia pikasuodattimia. Pikasuodattimien lukumäärää ei ole rajattu. Ne sallivat käyttäjän vaihdella nopeasti eri hakujen välillä. Toisistaan erilliset pikasuodattimet löytyvät hankekartalta, kohdekartalta sekä investointiohjelmoinnin näkymästä. Jokaiselle pikasuodattimelle tulee antaa nimi, eikä kaksi pikasuodatinta saa omata samaa nimeä samalla sivulla.

# Käyttöoikeudet

## Käyttäjätyypit
Hannaan luvitetut käyttäjät jakautuvat perus- ja pääkäyttäjiin. Hanna tunnistaa automaattisesti kirjautumisen yhteydessä, kumpaan ryhmään käyttäjä kuuluu. Pääkäyttäjillä on Hannan käyttöön laajimmat mahdolliset oikeudet, ja he pystyvät muokkaamaan kaikkia hankkeita, poistamaan niitä ja vaihtamaan niiden omistajia. Peruskäyttäjien käyttöoikeudet on kuvattu tarkemmin alla.

Jos sinulla on tarve vaihtaa toiseen käyttäjätyyppiin, ole yhteydessä Patrick Hanskaan (patrick.hanska@tampere.fi).

## Pääkäyttäjän luvitusnäkymä
Pääkäyttäjille on luotu oma näkymänsä, joka ei ole tarjolla peruskäyttäjille. Näkymästä käsin pääkäyttäjät voivat muokata seuraavia peruskäyttäjien oikeuksia:

- Oikeus perustaa investointihanke
- Oikeus perustaa kunnossapitohanke
- Oikeus muokata investointihankkeen talousarvioita ja käyttösuunnitelman muutosta
- Oikeus muokata kunnossapitohankkeen talousarvioita ja käyttösuunnitelman muutosta
- Oikeus muokata PALM-ryhmittely kentän tietoja

Pääkäyttäjä ei voi poistaa toisen pääkäyttäjän oikeuksia, vaan ne luetaan aina Tampereen Microsoftin EntraID:stä. Lisätessään tai poistaessaan oikeuksia kohdekäyttäjien istunto päivitetään, ja muuttuneet käyttöoikeudet tulevat voimaan heti.

![Pääkäyttäjän luvitusnäkymä](/images/paakayttajan_luvitusnakyma.png)<br/>
_Pääkäyttäjän luvitusnäkymä näyttää tältä. Peruskäyttäjiltä kyseinen sivu puuttuu kokonaan. Muut pääkäyttäjät ilmenevät harmaina, eikä heidän oikeuksiaan pääse muokkaamaan._

## Lukuoikeus
Jokaisella Hannaan pääsevällä käyttäjällä on oikeus lukea koko hankejoukkoa, joka Hannaan on avattu. Tämä koskee myös SAP:n rajapinnan yli haettuja talous- ja projektitietoja (huomioi erityisesti [SAP-raportit -näkymä](#sap-raportit-näkymä)). Toistaiseksi Hanna-sovelluksen käyttöön on kuitenkin luvitettu vain Tampereen kaupunkiorganisaatioon kuuluvia henkilöitä.

## Hankkeen perustamisoikeus
Pääkäyttäjät sekä heidän yksilöimänsä käyttäjät voivat perustaa Hannassa uusia hankkeita. Pääkäyttäjä yksilöi perustamisoikeuden hanketyypin tarkkuudella. Näin esimerkiksi voidaan sallia käyttäjälle perustaa kunnossapitohankkeita, mutta estää investointihankkeiden perustaminen joko vahingossa tai epätarkoituksenmukaisesti. Jos peruskäyttäjä ei omaa oikeutta perustaa mitään hankkeita, esitetään karttanäkymän oikeassa ylälaidassa näkyvä `Luo uusi hanke` -painike harmaana.

## Oikeus muokata hankkeen tietoja
Hankkeiden muokkausoikeus on hankkeen omistajalla, hänen osoittamillaan muilla peruskäyttäjillä sekä Hannan pääkäyttäjillä. Hankkeen muokkausoikeudet eivät oikeuta muokkaamaan hankkeen käyttöoikeuksia, vaan niiden muokkaaminen on rajattu yksinään hankkeen omistajalle (sekä pääkäyttäjille). Muokkausoikeudet periytyvät myös hankkeen kohteille, ja se koskettaa myös niiden luontia ja poistamista. Talousarvioiden ja käyttösuunnitelman muutoksen muokkaamiseen tarvitaan kuitenkin lisäksi erillinen oikeus pääkäyttäjältä. Omistaja hallinnoi hankkeen muokkausoikeutta hankesivulta löytyvältä luvitusvälilehdeltä.

## Oikeus poistaa hanke
Vain hankkeen omistaja ja pääkäyttäjä voivat poistaa hankkeen. Huomioi, että hankkeen poistaminen tarkoittaa myös sen kohteiden poistamista.

## Hankkeen omistajan vaihtaminen
Hankkeen omistaja voi luopua omistajuudestaan ja osoittaa sen toiselle käyttäjälle niin halutessaan. Ennen vaihtoa Hanna kysyy häneltä varmistuksen vaihtopäätöksestä ja sen, halutaanko vanhalle omistajalle jättää vielä muokkausoikeus hankkeeseen. Ongelmatilanteiden ilmetessä pääkäyttäjä voi aina vaihtaa hankkeen omistajaa.

## Oikeus muokata talousarvioita ja käyttösuunnitelman muutoksia
Muokatakseen investointi- ja/tai kunnossapitohankkeiden talousarvioita tai käyttösuunnitelman muutosta (KSM), peruskäyttäjä tarvitsee siihen erikseen luvan pääkäyttäjältä. Tämä oikeus on universaali, eli se tulee annetuksi kerralla koko Hannan investointi- ja/tai kunnossapitohankejoukolle sekä niiden kohteille. Käyttäjä, joka on luvitettu muokkaamaan talousarvioita ja KSM:ää, ei tarvitse erikseen hankkeen omistajalta muokkausoikeutta hankkeeseen muokatakseen kyseisiä arvoja. Hän tarvitsee ne kuitenkin muokatakseen mitään hankkeen muista tiedoista.

# Hankesivu
Hankesivu on hankkeen koko tietosisällön yhteenkokoava paikka.

## Hankkeen tietojen syöttö ja muokkaaminen
Perustaakseen uuden hankkeen käyttäjän on täytettävä sen tietoihin vähintään pakolliset kentät. Pakolliset tietokentät on merkitty käyttöliittymässä tähtikuviolla ("\*"). Investointihankkeen tarkempi tietosisältö ja sen merkitys on kuvattu [täällä](#investointihankkeen-tietosisältö) ja kunnossapitohankkeen [täällä](#kunnossapitohanke).

Hankkeen perustamisen jälkeen sen tietoja voi edelleen muokata valitsemalla muokkaa-painikkeen sivun oikeassa yläkulmassa. Muokattujenkin tietojen tulee sisältää aina vähintään pakolliset tietosisällöt, jotta muokkausten tallentaminen on mahdollista. Jokainen muokkaus luo Hannan tietokantaan uuden version hankkeesta. Sen osana tallentuu tieto siitä, kuka muokkauksen on tehnyt, milloin se on toteutunut ja mitä tarkalleen on muokattu. Käyttäjät eivät toistaiseksi pysty palauttamaan käyttöliittymästä käsin hankkeen aiempia versioita, mutta Hannan kehittäjät pystyvät siihen tarvittaessa. Toistaiseksi hankkeen historia- ja versiotietoja ei esitetä käyttöliittymässä. Muokkauksen ajaksi välilehdet menevät piiloon. Halutessasi muokata esimerkiksi hankkeen taloutta mene suoraan kyseiselle välilehdelle ja valitse haluttu kenttä.

Käyttäjän perustettua hankkeen se saa uniikin tunnisteen. Tämä tunniste on nähtävissä internetselaimen osoitekentässä käyttäjän avatessa hankkeen sivun. Hankkeen jakaminen toiselle Hannaan luvitellu käyttäjälle on mahdollista kopioimalla selaimen osoitekentän sisältö ja jakamalla se esimerkiksi sähköpostitse.

Hankesivulta löytyy lisäksi joitakin toimintoja, jotka eroavat hanketyyppikohtaisesti. Investointi- ja kunnossapitohankkeilla tämä käsittää seuraavat:

- Kohteiden perustaminen (lue lisää investointihankkeen kohteista [täällä](#investointikohteet) ja kunnossapitohankkeen kohteista [täällä](#kunnossapitokohteet))
- Talouden hallinta (Lue lisää investointihankkeiden osalta [täältä](#taloussuunnittelu-ja--seuranta-investointihankkeella) ja kunnossapitohankkeiden osalta [täältä](#taloussuunnittelu-ja--seuranta-kunnossapitohankkeella))
- Sidoshankkeiden osoittaminen ([lue lisää](#hankkeiden-liittyminen-toisiinsa))

Lisäksi investointihankkeelle löytyy toiminnallisuus, jolla sen aloitusvuotta voi aikaistaa tai myöhentää. Toiminnallisuus on toteutettu silmällä pitäen sellaisia hankkeita, joilla on jo joukko kohteita ja talouslukuja. Toiminnallisuus löytyy muokkaa-painikkeen yhteydessä sijaisevasta alasvetovalikosta.

## Hankkeen poistaminen

Hankkeen poistaminen on mahdollista vain sen omistajan ja pääkäyttäjän toimesta (lisää käyttöoikeuksista [täällä](#käyttöoikeudet)).

Perustetun hankkeen voi poistaa hankesivulta käsin valitsemalla Poista hanke tietolomakkeen alaosasta. Ennen poistamista Hanna vielä kysyy varmistuksen käyttäjältä. Poistamisen jälkeen hanketta ei enää pysty palauttamaan käyttöliittymästä käsin. Hankkeen tiedot kuitenkin tosiasiallisesti arkistoituvat Hannan tietokantaan, josta käsin Hannan kehittäjät voivat tarpeen mukaan palauttaa hankkeen.

Hankkeiden poistamisen osalta on tärkeää huomioida se, että samalla poistuvat hankkeelle mahdollisesti kirjatut kohteet ja tehtävät.

## Aluerajauksen piirto

Investoinnin ja kunnossapidon hankkeille ja kohteille voi halutessaan piirtää aluerajauksen. Aluerajauksen saa piirrettyä karttaikkunan vasemmasta laidasta löytyviä toimintoja hyödyntämällä. Toiminnot ja niiden merkitykset ovat listattu alle. Painikkeet ilmestyvät näkyviin vasta, kun olet laittanut muokkaustilan päälle oikeasta yläkulmasta.

1. **Luo alue:** Jokainen hiiren vasemman painallus luo aluerajaukseen yhden solmupisteen. Käyttäjän tulee luoda vähintään kolme solmupistettä. Voit viimeistellä piirtämäsi alueen luomalla viimeisen solmupisteen kaksoispainalluksella, jolloin alue ilmestyy kartalle. Muista tallentaa muutoksesi lopuksi. Kohteille voi osoittaa myös pistemuotoisen geometrian.
2. **Valitse alue tai piste:** Painikkeen avulla voit valita yhden tai useamman piirtämäsi alueen, pisteen tai rajapinnalta haetun Tampereen paikkatietokohteen. Valinta korostetaan keltaisella. Pitämällä vaihtopainiketta (shift) pohjassa, voit valita samalla useamman alueen tai pisteen.
3. **Käytä kohdealueena:** Voit valita aiemmin luoduista hanke-, kohde- tai kaupungin rajapinnan geometrioista haluamasi ja kopioida niiden geometrian hankkeelle tai kohteelle.
4. **Jäljitä valittuja alueita:** Jos käyttäjällä on aktiivinen valinta päällä, voi hän tämän toiminnon valitsemalla piirtää pitkin valitsemansa kohteen ulkorajaa. Toiminnon tarkoitus on helpottaa aluerajauksen piirtoa tilanteessa, jossa hankkeen tai kohteen aluerajaus vastaa kokonaan tai osittain esimerkiksi kiinteistöä. Valittuasi toiminnon vie hiiren kursori valitun kohteen ulkoreunan lähelle, jolloin se kiinnittyy siihen. Painamalla ensimmäisen kerran tulee luoduksi ensimmäinen solmupiste, jonka jälkeen voit seurata hiirellä kohteen ulkoreunaa, kunnes pääset haluttuun kohtaan tai kierrettyä koko kohteen. Lopeta jäljitys painamalla uusi solmupiste, jonka jälkeen voit joko tallentaa alueen tai jatkaa piirtoa jäljitetyn alueen ulkopuolella.
5. **Muokkaa valittuja alueita:** Tällä painikkeella käyttäjä voi muokata valitun alueen solmupisteitä. Tarttumalla hiirellä halutusta kohtaa valitun alueen ulkoreunaa ja päästämällä irti halutussa kohtaa alueen muotoa voi muokata. Toistaiseksi ei ole mahdollista poistaa jo olemassaolevia solmupisteitä, vaan ainoastaan luoda uusia.
6. **Tyhjennä valinta:** Tyhjentää käyttäjän valintatyökalulla valitsemat alueet.
7. **Poista valitut alueet:** Painamalla tätä painiketta käyttäjän valitsema alue poistetaan. Muista tallentaa lopuksi muutokset toisesta painikkeesta.
8. **Poista kaikki alueet:** Painamalla tätä painiketta kaikki käyttäjän luomat alueet poistetaan. Muista tallentaa lopuksi muutokset toisesta painikkeesta.
9. **Hanke koskee koko kunnan aluetta:** Tarkemman hankealueen piirtämisen sijasta voit valita hankealueeksi suoraan koko kunnan alueen.
10. **Karttatasovalikko:** Piirtämisen tukena voi hyödyntää karttatasovalikosta valittavissa olevia kaupungin rajapinta-aineistoja.
11. **Tallenna- ja Hylkää-painike:** Jos käyttäjällä on tallentamattomia muutoksia, ilmestyy tallennus- ja hylkäyspainikkeet oikeaan alakulmaan.

![Hankkeen karttanäkymä ja sieltä löytyvät piirtotoiminnot](/images/kartan_piirtotoiminnot.png)<br/>
_Hankesivulta löytyvä karttanäkymä. Vasemmassa laidassa näkyvissä yllä kuvatut toiminnot. Huomioi, että kohteen karttatoiminnot saattava erota pienesti._

## Hankkeiden liittyminen toisiinsa

Hankkeet ovat harvoin täysin itsenäisiä kokonaisuuksia, vaan ovat pikemminkin osa ketjua. Tällainen ketju muodostuu esimerkiksi silloin, kun pitkän aikavälin maankäytön suunnittelusta (PALM) siirrytään kaavoittamaan, sen jälkeen rakentamaan investointeja ja lopuksi ylläpitämään rakennettua infrastruktuuria. Myöhemmin esimerkiksi asemakaavaan saatetaan kohdistaa muutoksia tai kertaalleen rakennettua infraa saneerata tai parantaa sen toimivuutta muuuten. Tämän ketjun hahmottamiseksi hankkeiden välille voi osoittaa linkin kolmella tavalla:

- alisteisesti (alahanke)
- ylisteisesti (ylähanke)
- rinnakkaisesti (rinnakkaishanke)

Voit osoittaa Hannan hankkeelle sidoshankkeen välilehdeltä "sidoshankkeet". Vaihtoehtoina ovat Hannassa perustetut hankkeet.

![sidoshankkeet hankesivulla](/images/sidoshankkeet.png)<br/>
_Kuvassa hankkeelle on osoitettu yksi alahanke._

# Hanketyypit

Hannan hankkeet jakautuvat kahteen eri tyyppiin, jotka ovat investointihanke ja kunnossapitohanke. Niiden tarkempi tietosisältö ja piirteet on kuvattu alla.

## Investointihanke

### Yleistä investointihankkeesta

Investointihanke on hanke, jolla kasvatetaan Tampereen kaupungin omaisuuden arvoa. Siihen käytetty raha on investointirahaa (vrt. käyttötalous), ja käytettävissä olevan rahan määrää ohjaavat eri lautakuntien vuosisuunnitelmat. Investointihankkeita on monenlaisia, minkä myötä tämän hanketyypin on tarkoitus olla yleiskäyttöinen. Investointihanke sisältää joukon investointikohteita. Myös kehitysohjelmat hyödyntävät investointihanketta (ks. sitovuuskenttä).

Investointihankkeita voivat olla esimerkiksi:
- Kaukajärven pohjoisrannan kaava-alueen rakentaminen
- XXVI (Jokipohja) alueen saneeraukset
- Liikennevalojen saneerausinvestoinnit ja uudelleenohjelmoinnit
- Näsikallion eritasoliittymä

### Investointihankkeen tietosisältö

| Tietokenttä      | Kuvaus                                                                                                                                                                                                                                                                                                                   | Pakollinen tieto |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------- |
| Hankkeen nimi    | Hankkeen vapaamuotoinen nimi.                                                                                                                                                                                                                                                                                            | Kyllä            |
| Kuvaus           | Vapaamuotoinen sanallinen kuvaus hankkeesta.                                                                                                                                                                                                                                                                             | Kyllä            |
| Alkuajankohta    | Ajankohta jolloin hankkeen toteutus alkaa.                                                                                                                                                                                                                                                                               | Kyllä            |
| Loppuajankohta   | Ajankohta jolloin hanke päättyy. Loppuajankohdan täytyy sijaita alkuajankohdan jälkeen.                                                                                                                                                                                                                                  | Kyllä            |
| Omistaja         | Hankkeen omistajalla viitataan Hannan käyttäjään, joka omistaa hankkeen. Omistaja on oletuksena hankkeen perustanut käyttäjä. Sitä voi kuitenkin vaihtaa valitsemalla arvoksi toisen käyttäjän. Omistajalla on oikeus poistaa hanke ja osoittaa siihen muokkausoikeus                                                    | Kyllä            |
| Elinkaaren tila  | Arvo valitaan seuraavista joukosta: Aloittamatta, Käynnissä, Valmis, Odottaa. Hanke saa perustamisen hetkellä elinkaaritilakseen automaattisesti arvon 'Aloittamatta'.                                                                                                                                                   | Kyllä            |
| Lautakunta       | Hankkeelle voi valita yhden tai useamman seuraavista lautakunnista: Yhdyskuntalautakunta, Elinvoima- ja osaamislautakunta, Asunto- ja kiinteistölautakunta, Joukkoliikennelautakunta. Hankkeen taloutta hallitaan ja seurataan lautakunnittain.                                                                          | Kyllä            |
| Sitovuus         | Hankkeelle voi valita yhden seuraavista sitovuuksista: peruskaupunki, viiden tähden keskusta ja hiedanranta. Kaksi viimeisintä ovat kehitysohjelmia. Oletusarvo on peruskaupunki.                                                                                                                                        | Kyllä            |
| SAP-projektin ID | Mikäli hanke löytyy SAP:sta, voi sen SAP-projektin ID:n kertoa Hannan hankkeelle taloustoteuman seuraamiseksi. Ole tarkkana, että annat arvoksi juuri SAP-projektin tunnisteen, etkä esimerkiksi rakenneosan tunnusta. Hanna validoi annetun tunnisteen ja viestii käyttäjälle sen onnistumisesta tai epäonnistumisesta. | Ei               |
| PALM-koritus | Maankäytön toteuttamisen ja investointien pitkän aikavälin suunnittelua varten luotu tietokenttä. Muokkausoikeus tähän kenttään on vain rajatulla käyttäjäjoukolla, jota pääkäyttäjät hallitsevat. | Ei               |

### Investointikohteet

Kohde on investointihankkeen sisäinen olemassa oleva tai suunnitteilla oleva kohde, jolla on tunnistettu käyttötarkoitus. Investointihanke voi esimerkiksi viitata kokonaisen kaava-alueen suunnitteluun ja rakentamiseen, kun taas sen kohdetaso tarkentaa kaava-alueen toimet yksittäisiin katuihin, puistoihin, taitorakenteisiin ja viemäreihin. Kohteiden pääasiallinen tarkoitus on tarkentaa hankkeen toimenpiteiden, rahan, aikataulun, vastuiden ja tavoitteiden kohdistumista sekä keskinäistä priorisointia.

Kohteiden kirjaaminen ei ole pakollista, eikä niiden lukumäärää ole rajoitettu. Hankkeen sisältämät kohteet on listattu "kohteet" -välilehdelle. Sieltä käsin käyttäjä voi kirjata hankkeelle myös uusia kohteita valitsemalla _Luo uusi kohde_ -painikkeen. Valitsemalla kohteen käyttäjä siirtyy kohdesivulle, joka muistuttaa hankesivua, mutta kuvaa hankkeen sijasta sen kohteen.

Tällä hetkellä toimintatapana on, että suunnittelulle ja rakentamiselle avataan omat kohteensa. Kiinnitä siis huomiota erityisesti tietokenttään "kohteen laji".

Kohteen toteutusväli ei saa sijaita hankkeen toteutusvälin ulkopuolella. Jos käyttäjä yrittää avata, tai muokata olemassaolevaa kohdetta niin, että näin on käymässä, Hanna pyytää muokkaamaan toteutusväliä, ja vaihtoehtoisesti tarjoaa mahdollisuutta laventaa hankkeen toteutusväliä. Vastavuoroisesti käyttäjän ei anneta kaventaa hankkeen toteutusväliä, jos se tarkoittaisi sitä, että jokin sen kohteista jäisi sen toteutusvälin ulkopuolelle.

Kohteelle on lisäksi toteutettu toiminnallisuus, jossa sen voi siirtää toiselle hankkeelle. Toiminnallisuus löytyy muokkaa-painikkeen yhteydessä sijaitsevasta alasvetovalikosta. Kohteen voi siirtää vain toiselle investointihankkeelle, jonka toteutusväli ja lautakuntavalinnat ovat sille soveltuvat. Siirrettävän kohteen mahdollisesti sisältämä SAP-rakenneosan tunniste poistetaan siirron yhteydessä, ja se pitää täyttää tarvittaessa uudestaan käsin.

#### Investointikohteen tietosisältö

| Tietokenttä                    | Kuvaus                                                                                                                                                                                                                                                                                                                | Pakollinen tieto |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| Nimi                           | Kohteelle annettu nimi. Nimi ei saa olla sama hankkeen kanssa.                                                                                                                                                                                                                                                        | Kyllä            |
| Kuvaus                         | Vapaamuotoinen sanallinen kuvaus kohteesta.                                                                                                                                                                                                                                                                           | Kyllä            |
| Kohteen laji                   | Yksilöi, onko kohteessa kyse suunnitelusta vai rakentamisesta. Arvo valitaan alasvetovalikosta.                                                                                                                                                                                                                       | Kyllä            |
| Alkuajankohta                  | Ajankohta jolloin kohteen toteutus alkaa.                                                                                                                                                                                                                                                                             | Kyllä            |
| Loppuajankohta                 | Ajankohta jolloin kohteen toteutus päättyy.                                                                                                                                                                                                                                                                           | Kyllä            |
| Lautakunta                     | Kohteelle valitaan lautakunta niistä lautakunnista, jotka on valittu sen hankkeelle. Jos kohteen hankkeelle on osoitettu vain yksi lautakunta, saa kohde saman lautakunnan. Lautakuntavalinta pitää tällöinkin kuitenkin tehdä käsin.                                                                                 | Kyllä            |
| Elinkaaritila                  | Arvon voi valita seuraavista: Ehdotettu, Aloittamatta, Käynnissä, Valmis tai Tunnistettu tarve. Kohde saa perustamisen hetkellä elinkaaritilakseen automaattisesti 'Aloittamatta'. Hankkeen ja sen kohteiden elinkaaritilojen hallinta perustuu toistaiseksi manuaaliseen kirjaamiseen, eikä niiden keskinäistä logiikka ole rajoitettu. | Kyllä            |
| Kohteen tyyppi                 | Kohteen tyyppi kertoo, onko kyse uudesta rakentamisesta vai olemassaolevan kohteen muokkaamisesta. Kohteelle valitaan yksi tyyppi arvojoukosta: Uudisrakentaminen, Peruskorjaaminen, Toimivuuden parantaminen tai Maaomaisuuden kehittäminen.                                                                                                        | Kyllä            |
| Omaisuusluokka                 | Omaisuusluokka määrittelee poistoajan, jonka mukaan käytetty investointi poistuu taseesta. Arvo valitaan alasvetovalikosta valmiista koodistosta.                                                                                                                                                                     | Kyllä            |
| Toiminnallinen käyttötarkoitus | Toiminnallinen käyttötarkoitus viittaa kohteen käyttötarkoitukseen valmistuessaan. Arvo valitaan alasvetovalikosta valmiista koodistosta.                                                                                                                                                                             | Kyllä            |
| SAP-rakenneosa                 | Jos kohteelle löytyy sitä vastaava rakenneosa SAP:n projektista, voi käyttäjä osoittaa sen valitsemalla valikosta sopivan arvon. Tämän ehtona on se, että hankkeelle on osoitettu SAP-projektin ID. Tämä mahdollistaa kohteen taloustoteuman seurannan.                                                               | Ei               |
| PALM-koritus | Maankäytön toteuttamisen ja investointien pitkän aikavälin suunnittelua varten luotu tietokenttä. Muokkausoikeus tähän kenttään on vain rajatulla käyttäjäjoukolla, jota pääkäyttäjät hallitsevat. | Ei               |

#### Investointikohteen toimijat

Kohteelle voi lisäksi osoittaa toimijoita. Toimija koostuu henkilön ja roolin yhdistelmästä (esimerkiksi Iiro Iironen - urakoitsijan edustaja). Toistaiseksi tarjolla on seuraavat roolit. Roolilistaa täydennetään tarpeen mukaan. Rooleista "suunnitteluttaja" ja "rakennuttaja" ovat aina esillä ja tarjolla, mutta niiden kirjaaminen ei ole pakollista.

- Suunnitteluttaja
- Rakennuttaja
- Turvallisuuskoordinaattori
- Vastaava työnjohtaja
- Valvoja
- Suunnittelun edustaja
- Urakoitsijan edustaja

Toimijoiden yksilöiminen kohteelle ei ole pakollista. Yhteen rooliin on mahdollista osoittaa useita henkilöitä. Henkilöt voivat olla sisäisiä tai ulkoisia henkilöitä, kuten esimerkiksi konsultteja. Sisäisten henkilöiden lista johdetaan Hannan tuntemista käyttäjistä, eli käyttäjistä, jotka ovat luvitettu Hannaan ja kirjautuneet sinne ainakin kerran. Ulkoisia henkilöitä voi hallita ja lisätä [hallintapaneelista](#yrityksien-ja-heidän-yhteyshenkilöiden-hallinta) käsin kuka tahansa.

![Toimijat_kohteella](/images/toimijat_kohteella.png)

_Yllä olevassa kuvassa on esitetty kohteelle valitut toimijat. Valvojaksi on valittu useampi henkilö._

#### Vaiheet
Vaihe on kohteeseen kohdistuva työvaihe, josta syntyy jokin konkreettinen tulos ja samalla kustannus. Vaiheet haetaan SAP:sta olettaen, että Hannan kohteelle on kirjattu soveltuva SAP-rakenneosan tunniste. Vaiheella ei ole sijaintia. Vaiheen tuloksena voi olla esimerkiksi uusi tai korjattu rakennus tai muu rakennelma, asiakirja, mittaustulos tai ylläpitotoimi. Alla olevassa taulukossa on kuvattu vaiheen tietosisältö. Vaiheille listataan tiedoksi niiden nelinumeroinen tyyppikoodi, sen sanallinen selite sekä toteuma. Jos selitettä ei ole tarjolla, esitetään vain tyyppikoodi. Toteuman suhteen on tärkeää huomioida se, että SAP:n tositteen voi osoittaa myös suoraan rakenneosalle, mikä tarkoittaa sitä, että Hannan kohteella näytettävä toteuma ei aina vastaa sen vaiheiden yhteenlaskettua toteumaa.

### Taloussuunnittelu ja -seuranta investointihankkeella
Hankkeen ja sen kohteiden Talous-välilehdillä on mahdollista tarkastella ja kirjata niille vuosikohtainen kustannusarvio, talousarvio, sopimushinta, ennuste ja käyttösuunnitelman muutos. Lisäksi samaan näkymään luetaan SAP:sta toteuma, jos sellainen on tarjolla. Toteuman esittämisen ehtona on, että hankkeelle on asetettu SAP-projektin ID sekä kohteelle SAP-rakenneosa. Hankkeen Talous-välilehdellä esitetään ensisijaisena tietona kohteilta summattu toteuma ja toisisijaisena SAP-projektin toteuma, joka avautuu kun käyttäjä vie hiiren Toteuma-sarakkeessa näkyvän sinisen "palkin" päälle (ks. alla oleva kuva). Talous-välilehdelle näkyvien vuosikohtaisten rivien lukumäärä johdetaan automaattisesti kohteelle annetusta toteutusvälistä (alku- ja loppuajankohta). Luvut esittävät aina euroja, ja ne esitetään kahden desimaalin tarkkuudella. **Kaikki talousluvut kirjataan kohdetasolla, joista käsin ne koostetaan tiedoksi hankkeelle.**

![monilautakuntaisen_investointihankkeen_talousvälilehti](/images/monilautakuntainen_talousvalilehti.png)

_Yllä olevassa kuvassa on esitetty talousvälilehti investointihankkeelle, jonka kohteista osa on asetettu yhdyskuntalautakunnalle (YLA) ja osa asunto- ja kiinteistölautakunnalle (AKILA). Inveistointihankkeen kohteista osa kuuluu Kohteen laji-tiedoltaan Rakentaminen-luokkaan ja osa Suunnittelu-luokkaan. Käyttäjä voi suodattaa kohteita klikkaamalla taulukon yläpuolella olevia suodattimia (lautakunta, kohteen laji, aikaväli). Valitun aikavälin kaikki luvut on summattu alhaalla._

Alla on annettu tarkemmat kuvaukset, jokaisesta talousmuuttujasta.
- **Kustannusarvio:** Kustannusarvio on kohteelle arvioitu kustannus, joka on ehdolla talousarvioon.
- **Talousarvio:** Talousarvio on päättäjille esitettävä kustannus kohteen toteuttamisesta. Talousarvio voi erota kustannusarviosta esimerkiksi niin, että kohteen toteutukseen ei myönnetä käyttäjän siihen arvioimaa summaa. Huomioi, että talousarvion muokkaaminen vaatii lisäoikeuksia.
- **Sopimushinta:** Sopimushinta on summa, joka on sovittu kohteen urakkasopimuksessa rakentajan, suunnittelijan tai muun vastaavan kanssa.
- **Toteuma:** Hankkeen ensisijaisena toteuma-tietona esitetään kohteilta summattu toteuma ja toisisijaisena SAP-projektin toteuma. Nämä kaksi toteumaa voivat erota toisistaan. Hankkeille ja sen osille, joille on ilmoitettu sopiva SAP-tunniste esitetään toteuma, joka on sen kustannuksien ja tulojen summa. Toteuman näkeminen mahdollistaa hankkeiden taloudellisen seurannan sekä reagoinnin mahdollisiin poikkeamiin, kuten budjetin ylityksiin. Toteumaa ei voi muokata Hannasta käsin. Toteuma haetaan suoraan SAP:iin kirjatuista tositteista summaamalla niiden luvut vuosikohtaisesti.Tositteista ei huomioida käyttöomaisuuskirjauksia (tositelaji: AA), eikä niitä, joiden tositelaji on tyhjä.
- **Ennuste**: Ennusteella viitataan kohteen tuntevan käyttäjän arvioon siitä, miten talousarvio kestää tarkastelun toteumaa vasten. Ennusteen kirjaaminen on tapa viestiä budjetin (talousarvion) alittumisesta tai ylittymisestä. Budjetin ylitys kirjataan positiivisena, eli esimerkiksi sadan tuhannen euron ylitys kirjataan arvona 100 000. Budjetin alitus kirjataan taas negatiivisena numerona, esimerkiksi -100 000. Hannan käyttöliittymä värittää budjetin ylitykset punaisella värillä ja alitukset sinisellä värillä.
- **Käyttösuunnitelman muutos:** Mikäli kohteen todellinen toteuma uhkaa kasvaa merkittävästi ennakoidusta, voi sille osoittaa lisää varoja käyttösuunnitelman muutoksen (KSM) muodossa. Huomioi, että KSM:n muokkaaminen vaatii lisäoikeuksia.

Kuluseurannan välilehdeltä käyttäjät voivat tarkastella hankkeen toteumaa pylväsdiagrammina. Huomaa, että hankkeen Kuluseurvanta-välilehdellä esitetty toteuma haetaan suoraan SAP-projektin tunnisteen perusteella eikä summata hankkeelle asetetuilta kohteilta. Toteuma on eritelty kuukausittain. Kuluseurannan välilehti ei ole valittavissa, mikäli hanke ei ole vielä alkanut ja/tai sille ei ole osoitettu soveltuvaa SAP-projektin tunnistetta. Vastaava välilehti on saatavilla myös hankkeen kohteille olettaen, että niille on osoitettu vielä SAP-rakenneosan tunniste. Toteumaa verrataan talousarviota ja sopimushintaa vasten, jos käyttäjä on sellaiset kirjannut.

![Kuluseurannan välilehti](/images/kuluseuranta.png)

_Yllä olevassa kuvassa on nähtävissä kuluseurannan välilehti kohteella, ja siinä toteumaa kahdelle vuodelle. Molemmille vuosille on kirjattu sekä talousarvio että sopimushinta, minkä pohjalta Hanna esittää niiden suhteen toteumaa vasten vaakapalkkeina oikeassa ylälaidassa. Oranssi väri viittaa siihen, että toteumassa on tapahtunut ylitys._

## Kunnossapitohanke

### Yleistä kunnossapitohankkeesta

Kunnossapitohanke ylläpitää Tampereen omaisuutta ja vastaa Tampereen infastruktuuriin kohdistuvien lakisääteisten velvotteiden sekä palvelulupauksien toteutumisesta. Siihen käytetty raha on käyttötaloutta. Kunnossapitoon kohdistuu vastaava talouden vuosikello ja raamit kuin investoinneillekin, mutta muutokset niissä vuosien välillä ovat olennaisesti pienempiä. Kunnossapitohankkeen rakenne vastaa pitkälti investointihankkeen rakennetta, ja tarkoitus onkin tarkastella säännöllisesti mahdollisuutta yhdistää nämä hanketyypit yhdeksi niin, että sen sisällä olisi mahdollista valita investoimisen ja kunnossapidon, ja vastaavasti investointirahan ja käyttötalouden välillä.

Kunnossapitohankkeet kohdistuvat usein yhteen tai useampaan omaisuuserään koko kunnan alueella. Näin ollen hankealueeksi valikoituu usein koko kunnan alue.

Kunnossapitohankkeita ovat esimerkiksi:

- Lielahden alueurakka
- Ulkovalaistuksen valaisinvaihdot 2024
- Smartcity IoT-alusta

#### Kunnossapitohankkeen tietosisältö

| Tietokenttä      | Kuvaus                                                                                                                                                                                                                                                                                                                   | Pakollinen tieto |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------- |
| Hankkeen nimi    | Hankkeen vapaamuotoinen nimi.                                                                                                                                                                                                                                                                                            | Kyllä            |
| Kuvaus           | Vapaamuotoinen sanallinen kuvaus hankkeesta.                                                                                                                                                                                                                                                                             | Kyllä            |
| Alkuajankohta    | Ajankohta jolloin hankkeen toteutus alkaa.                                                                                                                                                                                                                                                                               | Kyllä            |
| Loppuajankohta   | Ajankohta jolloin hanke päättyy. Loppuajankohdan täytyy sijaita alkuajankohdan jälkeen. Kunnossapitohankkeella on myös mahdollista valita hankkeen olevan käynnissä toistaiseksi.                                                                                                                                        | Kyllä            |
| Omistaja         | Hankkeen omistajalla viitataan Hannan käyttäjään, joka omistaa hankkeen. Omistaja on oletuksena hankkeen perustanut käyttäjä. Sitä voi kuitenkin vaihtaa valitsemalla arvoksi toisen käyttäjän. Omistajalla on oikeus poistaa hanke ja osoittaa siihen muokkausoikeus                                                    | Kyllä            |
| Elinkaaren tila  | Arvo valitaan seuraavista joukosta: Aloittamatta, Käynnissä, Valmis, Odottaa. Hanke saa perustamisen hetkellä elinkaaritilakseen automaattisesti arvon 'Aloittamatta'.                                                                                                                                                   | Kyllä            |
| Lautakunta       | Hankkeelle voi valita yhden seuraavista lautakunnista: Yhdyskuntalautakunta, Elinvoima- ja osaamislautakunta, Asunto- ja kiinteistölautakunta, Joukkoliikennelautakunta. Hankkeen talouden katsotaan kohdistuvan valittuun lautakuntaan.                                                                                 | Kyllä            |
| Sopimus          | Hankkeeseen kohdistuva sopimus. Toistaiseksi kenttä on tekstimuotoinen ja täytetään käsin.                                                                                                                                                                                                                               | Ei               |
| Päätös           | Hankkeeseen kohdistuva päätös. Toistaiseksi kenttä on tekstimuotoinen ja täytetään käsin.                                                                                                                                                                                                                                | Ei               |
| Ostotilausnumero | Hankkeeseen kohdistuva ostotilausnumero. Toistaiseksi kenttä on tekstimuotoinen ja täytetään käsin.                                                                                                                                                                                                                      | Ei               |
| SAP-projektin ID | Mikäli hanke löytyy SAP:sta, voi sen SAP-projektin ID:n kertoa Hannan hankkeelle taloustoteuman seuraamiseksi. Ole tarkkana, että annat arvoksi juuri SAP-projektin tunnisteen, etkä esimerkiksi rakenneosan tunnusta. Hanna validoi annetun tunnisteen ja viestii käyttäjälle sen onnistumisesta tai epäonnistumisesta. | Ei               |

### Kunnossapitokohteet

Kunnossapitokohteet ovat pitkälti samanlaisia kuin investointihankkeen vastaavat. Kunnossapitokohteet ovat hankkeen sisäisiä fyysisiä rakennelmia, kuten esimerkiksi huollettavia valaisimia, penkkejä tai väyliä. Kohteiden pääasiallinen tarkoitus on tässäkin tarkentaa hankkeen toimenpiteiden, rahan, aikataulun, vastuiden ja tavoitteiden kohdistumista sekä keskinäistä priorisointia. Kunnossapitohanke voi esimerkiksi kohdistua koko kaupungin valaisiverkkoon, ja kohdetasolla tarkennetaan yksittäisiin valaisimiin tai valaisinpiireihin.

#### Kunnossapitokohteen tietosisältö

| Tietokenttä                    | Kuvaus                                                                                                                                                                                                                                                                                                                | Pakollinen tieto |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| Nimi                           | Kohteelle annettu nimi. Nimi ei saa olla sama hankkeen kanssa.                                                                                                                                                                                                                                                        | Kyllä            |
| Kuvaus                         | Vapaamuotoinen sanallinen kuvaus kohteesta.                                                                                                                                                                                                                                                                           | Kyllä            |
| Elinkaaritila                  | Arvon voi valita seuraavista: Ehdotettu, Aloittamatta, Käynnissä tai Valmis. Kohde saa perustamisen hetkellä elinkaaritilakseen automaattisesti 'Aloittamatta'. Hankkeen ja sen kohteiden elinkaaritilojen hallinta perustuu toistaiseksi manuaaliseen kirjaamiseen, eikä niiden keskinäistä logiikka ole rajoitettu. | Kyllä            |
| Omaisuusluokka                 | Omaisuusluokka määrittelee poistoajan, jonka mukaan käytetty investointi poistuu taseesta. Arvo valitaan alasvetovalikosta valmiista koodistosta.                                                                                                                                                                     | Kyllä            |
| Toiminnallinen käyttötarkoitus | Toiminnallinen käyttötarkoitus viittaa kohteen käyttötarkoitukseen valmistuessaan. Arvo valitaan alasvetovalikosta valmiista koodistosta.                                                                                                                                                                             | Kyllä            |
| Alkupäivämäärä                 | Ajankohta jolloin kohteen toteutus alkaa.                                                                                                                                                                                                                                                                             | Kyllä            |
| Loppupäivämäärä                | Ajankohta jolloin kohteen toteutus päättyy.                                                                                                                                                                                                                                                                           | Kyllä            |
| Sopimus                        | Kohteeseen kohdistuva sopimus. Toistaiseksi kenttä on tekstimuotoinen ja täytetään käsin.                                                                                                                                                                                                                            | Ei               |
| Ostotilausnumero                   | Kohteeseen kohdistuva ostotilausnumero. Toistaiseksi kenttä on tekstimuotoinen ja täytetään käsin.                                                                                                                                                                                                                             | Ei               |
| Toteutustapa               | Kohteen toteutustapa valitaan alasvetovalikosta arvoista: 'Puitesopimus','Kilpailutus' ja 'Suorahankinta'.                                                                                                                                                                                                            | Ei               |
| SAP-rakenneosa                 | Jos kohteelle löytyy sitä vastaava rakenneosa SAP:n projektista, voi käyttäjä osoittaa sen valitsemalla valikosta sopivan arvon. Tämän ehtona on se, että hankkeelle on osoitettu SAP-projektin ID. Tämä mahdollistaa kohteen taloustoteuman seurannan.                                                               | Ei               |

#### Kunnossapitokohteen toimijat

Toimijoita voi osoittaa kunnossapitokohteelle vastaavalla tavalla kuin [investointikohteella](#investointikohteen-toimijat).

### Taloussuunnittelu ja -seuranta kunnossapitohankkeella

Kunnossapitohankkeen taloussuunnittelun toiminnallisuudet ovat vastaavia kuin investointihankkeella. Huomaa kuitenkin, että kunnossapitohankkeelle kirjatut summat katsotaan käyttötaloudeksi investointien sijasta ja, että tietosisällöissä on eroja (esim. kunnossapitokohteella ei ole Kohteen laji-tietoa).

# Investointiohjelmointi-näkymä

![Investointiohjelmointi](/images/investointiohjelmointi.png)


Investointiohjelmointi-näkymä on tarkoitettu vuosikohtaisen investointiohjelman rakentamiseen, sen seuraamiseen ja hallinnointiin. Kyseinen näkymä muodostuu taulukosta, joka listaa **investointihankkeiden kohteita**. Näkymään voi siirtyä päänavigointipalkista käsin. Näkymä helpottaa suuren kohdejoukon hallinnoimista kerralla ja kokonaiskuvan muodostumista.

Taulukossa jokaiselle kohteelle on kerrottu seuraavat tiedot.

- Hanke, johon kohde kuuluu
- Kohteen nimi
- (Elinkaari-)Tila
- Toteutusväli
- (Kohteen)Laji
- Tyyppi
- Omaisuusluokka
- Käyttötarkoitus
- Lautakunta
- Rakennuttaja ja suunnitteluttaja
- Talousarvio
- Toteuma
- Ennuste
- Käyttösuunnitelman muutos

Alla on kuvattu näkymään liittyvät toiminnallisuudet yllä olevan kuvan numeroinnin mukaan.

1. Ohjelmointi päänavigointipalkissa.
2. Taulukko kohdistuu ensisijaisesti yhteen kalenterivuoteen. Sivun yläosassa on vuosivalinta, josta käsin käyttäjä pystyy valitsemaan häntä kiinnostavan vuoden. Vuosivalinta vaikuttaa siihen, miltä vuodelta kohderiveille haetaan talousluvut. Valinta voi kohdistua kerrallaan vain yhteen vuoteen. Huomioi, että kohde katsotaan mukaan aina, kun se _leikkaa_ valittua vuotta. Näin ollen kohde, jonka toteutusväli on 31.12.2023-31.12.2026, valikoituisi mukaan vuosivalinnan ollessa `2023`, ja sille näytettävät talousluvut johdettaisiin yksinään päivältä 31.12.2023. Käyttäjä voi valita vuosivalitsimesta myös valinnan `Koko aikaväli`, jolloin talousluvut johdetaan kohderiveille niiden koko elinkaaren ajalta. Tällöin talouslukuja ei pysty kuitenkaan muokkaamaan taulukossa.
3. Painikkeesta _näytä vain omat kohteet_ taulukkoon tuodaan vain kohteet, joissa kirjautunut käyttäjä on merkitty niissä yhteen tai useampaan rooliin (esim. rakennuttaja tai valvoja).
4. Käyttäjän itselleen tallentamat pikasuodattimet.
5. Taulukon aktiivisen suodatuksen mukaiset kohderivit on mahdollista viedä Excel-taulukkoon valitsemalla painikkeen _lataa raportti_. Tarjolla on viisi eri raporttipohjaa: tulosteraportti, perusraportti, kustannusraportti, toimijaraportti ja investointiraportti.
6. Käyttäjä voi lisätä uuden kohteen myös investointiohjelmoinnista käsin. Valitsemalla painikkeen `uusi kohde` painikkeen käyttäjä päätyy suoraan kohdesivulle, jossa hän samalla pääsee yksilöimään sen, mihin hankkeeseen kohde avataan. Hankevalinnan alasvetovalikko sisältää vain hankkeet, joissa käyttäjällä on muokkausoikeus. Mikäli käyttäjällä ei ole mihinkään hankkeeseen muokkausoikeutta, ei painike ole ollenkaan valittavissa. Kohteen tallentamisen jälkeen käyttäjä palaa takaisin investointiohjelmointinäkymään ja perustettu kohde korostetaan siinä hetkeksi.
7. Vuosivalinnan lisäksi käyttäjän tarjolla on joukko muita suodattimia, joilla vaikuttaa taulukossa esitettävien kohderivien joukkoon. Suodattimia voi valita yhden tai useamman. Jos käytössä on useampi suodatin, on niiden välinen looginen operaattori `JA`. Näin ollen, jos käyttäjä on valinnut esimerkiksi vuodeksi `2024`, elinkaaritilaksi `aloittamatta` ja käyttötarkoitukseksi `ajoradat`, tulee taulukkoon ajoradat, jotka ovat aloittamatta ja joiden toteutus sijoittuu kokonaan tai osittain vuodelle 2024. Voit piilottaa yläosan suodattimet klikkaamalla hakasta oikeassa laidassa.
8. Summariviin lasketaan taulukossa kullakin hetkellä esitettävien kohderivien talousarvioiden, toteumien, ennusteiden ja käyttösuunnitelman muutosten summa.
9. Taulukko, jonka solujen tietoja pystyy muokkaamaan olettaen, että käyttäjällä on muokkausoikeus kyseiseen kohteeseen. Mikäli käyttäjällä ei ole oikeutta muokata, on tekstin väri vaaleanharmaa. Muokkaustilaan siirrytään hiiren kaksoisklikkauksella. Kaikki solut eivät kuitenkaan ole muokattavissa (toteuma, hankkeen nimi). Painamalla hiirellä kohteen tai hankkeen nimen yhteydessä olevaa ikonia pääset hyppäämään kyseiselle hanke- tai kohdesivulle. Sivu aukeaa uuteen välilehteen. Kohderivit on järjestetty hankkeittain. Hankkeen nimi on korostettu vihreällä värillä. Hankkeen nimi on kirjattu vain ensimmäiselle kohteelle ja seuraavilla, samaan hankkeeseen kuuluvilla kohderiveillä hankkeen nimen tilalla on hakanen.
10. Ponnahdusikkuna, joka aukeaa käyttäjän muokatessa solua. Ponnahdusikkunan tarkka sisältö riippuu muokattavasta sarakkeesta.
11. Jos käyttäjällä on tallentamattomia muutoksia, ilmestyy taulukon päälle sen vasempaan alanurkkaan tallennuspalkki. Sieltä käsin on tallentamisen ohessa mahdollisuus perua kaikki muutokset ja siirtyä muokkauksissa yhden eteen- tai taaksepäin.
12. Taulukon oikeassa alanurkassa on mahdollista vaikuttaa siihen, kuinka paljon rivejä näytetään. Oletus on 1000 kappaletta. Jos rivejä on enemmän kuin valittu luku, voi käyttäjä siirtyä seuraavalle tulossivulle.

# Investointien taloussuunnittelu-näkymä

![Investointien taloussuunnittelu](/images/investointien_taloussuunnittelu_nakyma.png)

Investointien taloussuunnittelu-näkymä on tarkoitettu pidemmän aikavälin investointien suunnitteluun sekä investointien seuraamiseen ja hallinnointiin. Näkymä muodostuu taulukosta, joka listaa **investointihankkeet sekä -kohteet**.  Näkymä mahdollistaa eri vuosien kustannuskertymien seurannan sekä talousarvion lukujen muokkaamisen usealle vuodelle samassa näkymässä. Näkymä on luotu erityisesti PALM:n ja kehitysohjelmien pitkän aikavälin suunnittelua varten. Oletusnäkymässä näytetään 15 vuoden aikajakso kuluvasta vuoden alkaen.

Taulukko rakentuu seuraavalla tavalla:

- Investointihankkeiden nimet vihreällä värillä. Investointihankkeille kuuluvat kohteet mustalla värillä.
- Taulukko sisältää sekä toteuma-, että talousarvio-sarakkeita vuosittain jaoteltuna. Toteuma on saatavilla vain kuluvalle vuodelle sekä menneille vuosille. Hankeriveillä esitetyt luvat on summattu kohteilta, eikä niitä tästä syystä voi muokata.
- Taulukossa voi muokata talousarvion lukuja, mikäli käyttäjällä on tarvittavat oikeudet siihen eikä talousarvion lukuja ole lukittu pääkäyttäjän toimesta. Muokattavissa olevat talousarvio-solut ovat väriltään valkoisia ja lukitut solut ovat harmaita.

Taulukkoon liittyvät toiminnallisuudet, kuten rivien suodatus, toimivat vastaavalla tavalla kuin Investointiohjelmointi-sivulla (ks. yllä oleva ohje).

# SAP-raportit näkymä

## Yleistä SAP-raporteista

SAP-raportit sisältää kaksi taulukkoa, joista toinen tarjoaa tietoa ympäristökoodeista (ympäristöinvestoinnit) ja toinen puitesopimuksista. Näkymään voi navigoida valitsemalla sen päänavigointipalkista. Tiedot haetaan suoraan SAP:sta, mutta Hanna kyselee ne kaikki kerralla yöaikaan. Näin ollen tiedoissa on maksimissaan päivän viive. Kulunut aika edellisestä hausta on kerrottu sivun oikeassa ylälaidassa. Taulukkoon valikoituvia rivejä voi rajata valitsemalla yhdestä tai useammasta tarjolla olevasta suodattimesta arvon. Jos arvoja useampi suodatin on valittu, pitää rivin täyttää kaikki ehdot. Taulukossa näkyvät tiedot on mahdollista viedä excel-tiedostoon valitsemalla painike _lataa raportti_.

SAP:a mukaillen on menot esitetty positiivisina lukuina ja tulot negatiivisina. Toteuma on näiden summa. Taulukon yläpuolella on summarivi, johon johdetut luvut muodostuvat taulukossa näkyvistä riveistä.

Haettavista tositteista on rajattu pois seuraavat:

- Käyttöomaisuuskirjaukset (laji: AA)
- Lajiltaan tyhjät tositteet

![SAP-raportit](/images/sap_raportit.png)
_SAP-raportit sivu. Sivun löytää Hannan päänavigointipalkista. Sivulta käsin käyttäjä voi vaihtaa eri taulukkojen välillä, joita on tällä hetkellä kaksi: ympäristökoodit ja puitesopimukset._

## Ympäristökoodit

Tässä taulukossa käyttäjä voi koostaa haluamansa tiedot kaupungin ympäristöinvestoinneista tarkentaen halutessaan yksittäiseen investointikohteeseen, toisin sanoen ympäristökoodiin (esim. ilmastonmuutoksen hillintä tai vesiensuojelu). Ota kuitenkin huomioon, että taulukkoon tulee luetuksi _kaikki_ SAP:n rakenneosat, eikä ennakoivaa rajoittamista vain ympäristökoodin yksilöiviin rakenneosiin ole tehty. Näin ollen käyttäjän on tärkeää huomioida mukaan ainakin ympäristökoodin valinta. Toisaalta on olemassa rakenneosia, joilta epätarkoituksenmukaisesti puuttuu ympäristökoodi, ja siksi on hyvä pystyä hakemaan myös rakenneosia ilman koodia.

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

Rakenneosan tietoja on myös tarkennettu kumppaneilla. Jokaisen rivin voi avata hakasesta `kumppanit` -sarakkeessa, jossa on esitetty kumppanien lukumäärä. Avaamisen jälkeen talousluvut esitetään kumppaneittain. Kumppani luetaan tositteelta. Kaikki tositteet, joilta ei löydy kumppanitietoa, on summattu yhteen Ei määriteltyä kumppanikoodia-arvoon.

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

Hannan oikeasta ylälaidasta löytyvän hallintanäkymän kautta käyttäjät voivat luoda, muokata ja poistaa hankkeisiin liittyviä yrityksiä ja heidän yhteyshenkilöitään. Molemmille on oma välilehtensä.

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

Yrityksen yhteyshenkilön voi osoittaa investointi- ja kunnossapidon kohteella valitsemalla uuden toimijan.

![yritysten_yhteyshenkilöt](/images/yritysten_yhteyshenkilot.png)<br/>
_Yritysten yhteyshenkilöt hallintapaneelissa. Huomioi myös Yritykset välilehti, jolta käsin voi muokata yritystietoja._
