<font size="8">Hannan käyttöohjeet</font>

<font size="6">Sisällysluettelo</font>

- [Yleistä](#yleistä)
- [Järjestelmän tuki](#järjestelmän-tuki)
- [Testi- ja tuotantojärjestelmä](#testi--ja-tuotantojärjestelmä)
- [Integraatiot muihin järjestelmiin](#integraatiot-muihin-järjestelmiin)
  - [SAP](#sap)
  - [Kaupungin paikkatietoaineistot](#kaupungin-paikkatietoaineistot)
  - [Hankkeen perustamisen ja ostotilauksen pyyntölomake](#hankkeen-perustamisen-ja-ostotilauksen-pyyntölomake)
- [Hankkeet -sivu ja karttanäkymä](#hankkeet--sivu-ja-karttanäkymä)
  - [Hankkeiden hakeminen](#hankkeiden-hakeminen)
  - [Hankkeiden esittäminen kartalla](#hankkeiden-esittäminen-kartalla)
  - [Kartan toiminnot](#kartan-toiminnot)
  - [Taustakartat](#taustakartat)
  - [Vektoriaineistot](#vektoriaineistot) 
- [Uuden hankkeen perustaminen](#uuden-hankkeen-perustaminen)
- [Hankesivu](#hankesivu)
  - [Hankkeen tietojen syöttö ja muokkaaminen](#hankkeen-tietojen-syöttö-ja-muokkaaminen)
  - [Hankkeen poistaminen](#hankkeen-poistaminen)
  - [Aluerajauksen piirto](#aluerajauksen-piirto)
  - [Hankkeiden liittyminen toisiinsa](#hankkeiden-liittyminen-toisiinsa)
- [Käyttöoikeudet](#käyttöoikeudet)
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
      - [Vaiheet](#vaiheet)
        - [Vaiheen tietosisältö](#vaiheen-tietosisältö)
    - [Investointihankkeen talous](#investointihankkeen-talous)
      - [Talousarvio](#talousarvio)
      - [Toteuma](#toteuma)
      - [Ennuste](#ennuste)
      - [Käyttösuunnitelman muutos (KSM)](#käyttösuunnitelman-muutos-ksm)
- [Hankkeiden vienti taulukkotiedostoon](#hankkeiden-vienti-taulukkotiedostoon)
- [Yrityksien ja heidän yhteyshenkilöiden hallinta](#yrityksien-ja-heidän-yhteyshenkilöiden-hallinta)

# Yleistä
Hanna on Tampereen kaupungin maankäytön suunnittelun ja toteuttamisen hanketietojärjestelmä. Se tarjoaa mahdollisuuden seuraavaan:
- Vuosikohtaisen investointiohjelmoinnin laatiminen
- Investointihankkeiden taloustoteuman seurannan
- Asemakaavahankkeen perustaminen, kaavanumeron osoittaminen ja viestintä uudesta kaavahankkeesta talousyksikölle 

# Järjestelmän tuki
Tukipyynnöt voi lähettää osoitteeseen [tuki@ubigu.fi](mailto:tuki@ubigu.fi). Hannalla on myös oma Teams -ryhmä, jossa järjestelmän käytöstä ja kehityksestä voi keskustella muiden käyttäjien ja kehittäjien kesken.

Hannan käyttöoikeuksista vastaa Ulla Lautaoja ([ulla.lautaoja@tampere.fi](mailto:ulla.lautaoja@tampere.fi)).

# Testi- ja tuotantojärjestelmä
Hannasta on olemassa kaksi eri järjestelmää. Testijärjestelmä toimii osoitteessa [tre-hanna-test.azurewebsites.net](https://tre-hanna-test.azurewebsites.net/). Siellä käyttäjät voivat kokeilla Hannan toiminnallisuuksia ilman huolta järjestelmän rikkoutumisesta tai tuotantokäytön häiriintymisestä. Varsinainen käyttö tapahtuu tuotantojärjestelmässä osoitteessa [hanna.tampere.fi](https://hanna.tampere.fi).

Huomioi, että testijärjestelmään luodut tiedot voivat aikanaan poistua, ja se on tarkoitettu ainoastaan testikäyttöön. Varsinainen, säilytettävä, ja myös varmuuskopioitava, hanketieto tulee kirjata tuotantojärjestelmään. Järjestelmiin luvittaminen tapahtuu erikseen: tuotantojärjestelmään pääsevä käyttäjä ei automaattisesti ole luvitettu myös testijärjestelmään.

# Integraatiot muihin järjestelmiin

Tässä kappaleessa on listattu kaupungin muut tietojärjestelmät, joiden kanssa Hanna omaa jonkinasteisen integraation. 

## SAP
Hanna lukee SAP:sta projektien tietoja ja niiden tositteita. Toistaiseksi tietojen luku tapahtuu yksisuuntaisesti, eli SAP ei vastavuoroisesti hae tietoa Hannasta tai ota kantaa Hannan hankkeisiin. Hannasta käsin ei myöskään toistaiseksi ole mahdollista päivittää tietoja suoraan SAP:iin. Hanna hakee kaikki SAP:n projektit ja niiden tositteet kerran vuorokaudessa yöaikaan ja tallentaa omaan tietokantaansa. SAP:iin toteutetut muutokset ilmenevät näin olen Hannassa viiveellä.  

## Kaupungin paikkatietoaineistot
Paikkatietojen osalta Hanna hyödyntää lähtökohtaisesti Tampereen jo olemassaolevia aineistoja ja rajapintoja. Toistaiseksi integraatio on toteutettu Tampereen geoserverien kautta jaossa oleviin aineistoihin. Ohjaava ajatus on, että Hanna hyödyntää mahdollisimman kattavasti olemassaolevia paikkatietorekistereitä.

## Hankkeen perustamisen ja ostotilauksen pyyntölomake
Hannan navigointipalkin oikeasta laidasta löytyy painike, joka ohjaa käyttäjän kaupungin e-lomakkeelle. E-lomakkeen kautta tieto uudesta hankkeesta kulkee toimialan talousyksikölle, joka perustaa vastaavan hankkeen SAP-järjestelmään.  

# Hankkeet -sivu ja karttanäkymä
Hannan sivulla `hankkeet` käyttäjä voi tarkastella hankkeita kartalla sekä tehdä hakuja tarkentaakseen tiettyyn hankkeiden osajoukkoon. 

Valittujen hakuehtojen pitää kaikkien toteutua, jotta hanke valikoituu hakutuloksiin. Hakutulokset ilmestyvät kartan vasemmalle puolelle. Hakutuloksissa hankkeelle kerrottaan sen nimi, sen tyyppi ja toteutusväli. Lisäksi asemakaavatyyppisille hankkeille kerrotaan suluissa niiden kaavanumero. Kattavimmin hankkeen tiedot löytyvät kuitenkin hankesivulta (lue lisää [täältä](#hankesivu)). Hankesivu on lisäksi paikka, missä uuden hankkeen tietojen kirjaus, tietojen muokkaus ja hankkeen poistaminen tapahtuvat. Hankesivulle pääsee valitsemalla hiirellä hakutuloksista haluamansa hankkeen. 

Toistaiseksi kartalla esitetään vain hankkeita. Hakusuodattimet vastaavasti kohdistuvat yksinomaan hankkeisiin. 

## Hankkeiden hakeminen
Hankkeita voi hakea seuraavilla ehdoilla:
- (vapaa) haku
- hakuaikaväli (tarkistaa, leikkaako asetettu aikaväli hankkeen alku- ja loppupäivämäärän väliä)
- Elinkaaren tila
- Hanketyyppi (asemakaava- vai investointihanke)
- Omistaja

Ensimmäinen hakukenttä `haku` etsii käyttäjän kirjoittamaa hakusanaa seuraavista tietosisällöistä:
- Hankkeen nimi
- Hankkeen kuvaus
- Asemakaavahankkeen kaavanumero

Lisäksi, jos käyttäjä valitsee haussa jommankumman hanketyypeistä, ilmestyy hakuosuuden yhteyteen valinta "näytä lisää hakuehtoja". Sen takaa avautuvasta osiosta käyttäjä voi vielä tarkentaa hakua hanketyypille ominaisilla tiedoilla.  

Käyttäjän on hyvä lisäksi huomata, että itse karttaikkuna toimii vastaavasti suodattimena. Hakutuloksiin tulevat listatuksi vain hankkeet, joiden alue on näkyvillä karttaikkunassa kokonaan tai osittain. Tämän osalta on tärkeää huomata, että aluerajauksen antaminen hankkeelle on vapaaehtoista. Tällöin hanke ei sisälly hakutuloksiin ollenkaan, ellei käyttäjä tee valintaa "sisällytä hankkeet ilman alueita". Hankkeen aluerajaus on aina aluemuotoinen (multipolygon).

## Hankkeiden esittäminen kartalla
Katsoessa karttaa kaukaa esitetään hankkeiden sijainti pyöreänä koontisymbolina, joka ilmoittaa kuinka monta hanketta alueella sijaitsee. Käyttäjän lähentäessä karttaa, muuttuu piirtotapa pallosta hankkeiden varsinaisiin aluerajauksiin. Huominoarvoista on, että toistaiseksi käyttäjä ei voi siirtyä hankkeen sivulle klikkaamalla hankkeen aluerajausta kartalla.

![etusivun_karttanakyma](/images/etusivun_karttanakyma.png)<br/>
_Etusivun karttanäkymä näyttää tältä. Kun hankkeita on paljon ja käyttäjä katsoo kartta tarpeeksi etäältä, esitetään hankkeiden sijainnit kootusti kuvanmukaisilla numeroiduilla pallosymboleilla. Karttatasovalikko löytyy vasemmasta alakulmasta._

## Kartan toiminnot
Karttanäkymää voi liikuttaa raahamalla sitä hiirellä. Hiiren rullaa voi hyödyntää lähentämiseen ja loitontamiseen. Vastaavat painikkeet löytyvät karttaikkunan vasemmasta yläkulmasta. Sieltä löytyy myös painike Palauta zoomaus, joka asettaa karttanäkymän sen oletusrajaukseen.

## Taustakartat
Karttanäkymään on valittavissa seuraavat taustakartat vasemmasta alakulmasta löytyvästä painikkeesta.
- Virastokartta
- Opaskartta
- Kantakartta
- Ilmakuva
- Ajantasa-asemakaava

## Vektoriaineistot
Lisäksi samaisesta valikosta on valittavissa seuraavat vektorimuotoiset paikkatietotasot. Kyseiset tasot tietoineen haetaan Tampereen paikkatietorajapinnoilta. 
- Kiinteistöt
- Rakennukset
- Kadut
- Kevyen liikenteen väylät
- Kaupunginosat

Toistaiseksi käyttäjät eivät pysty muokkaamaan tasojen esitystyyliä. 

# Uuden hankkeen perustaminen
Hannan pääkäyttäjät sekä heidän yksilöimänsä käyttäjät voivat perustaa Hannassa uusia hankkeita (käyttöoikeuksista lisää [täällä](#käyttöoikeudet)).

Uusi hanke perustetaan etusivulta löytyvästä Luo uusi hanke -painikkeesta. Painaessaan sitä käyttäjä valitsee ensin, minkä hanketyypin mukaisen hankkeen hän haluaa perustaa. Valinta on olennainen, sillä eri hanketyypeillä on oma tietosisältönsä. Tämän jälkeen käyttäjä ohjataan tyhjälle hankesivulle, jossa hankkeen tiedot pääsee täyttämään. 

# Hankesivu

## Hankkeen tietojen syöttö ja muokkaaminen
Perustaakseen uuden hankkeen käyttäjän on täytettävä sen tietoihin vähintään pakolliset kentät. Pakolliset tietokentät on merkitty käyttöliittymässä tähtikuviolla ("*"). Investointihankkeen tarkempi tietosisältö ja sen merkitys on kuvattu [täällä](#investointihankkeen-tietosisältö) ja asemakaavahankkeen tietosisälltö [täällä](#asemakaavahanke). 

Hankkeen perustamisen jälkeen sen tietoja voi muokata valitsemalla hankkeen sivulla painamalla Muokkaa-painiketta tietolomakkeen oikeassa yläkulmassa. Muokattujenkin tietojen tulee sisältää aina vähintään pakolliset tietosisällöt, jotta muokkausten tallentuminen on mahdollista. Jokainen muokkaus luo Hannan tietokantaan uuden version hankkeesta. Samalla tallentuu tieto siitä, kuka muokkauksen on tehnyt, milloin se on toteutunut ja mitä tarkalleen on muokattu. Käyttäjät eivät toistaiseksi pysty palauttamaan käyttöliittymästä käsin hankkeen aiempia versioita, mutta Hannan kehittäjät pystyvät siihen tarvittaessa. Toistaiseksi hankkeen historia- ja versiotietoja ei esitetä käyttöliittymässä. 

Perusettuasi hankkeen se saa uniikin tunnisteen. Tämä tunniste on nähtävissä internetselaimen osoitekentässä käyttäjän avatessa hankkeen sivun. Tietyn hankkeen jakaminen toiselle Hannaan luvitellu käyttäjälle on mahdollista kopioimalla selaimen osoitekentän linkki ja lähettämällä se toiselle käyttäjälle valitsemallaan tavalla.

Hankesivulta löytyy lisäksi hankekohtaiset toiminnot. Investointihankkeiden osalta tämä käsittää seuraavat:
- Kohteiden perustamisen ja niiden tietojen selaamisen (lue lisää kohteista [täällä](#kohteet))
- Hankkeen talouden hallinnan (lue hankkeen taloudesta lisää [täältä](#talous))
- Sidoshankkeiden hallinnoinnin (lue lisää sidoshankkeista [täältä](#hankkeiden-liittyminen-toisiinsa))
- Aluerajauksen piirto

Asemakaavahankkeiden osalta hankesivulta löytyvät seuraavat toiminnot:
- Talousyksikön tiedottaminen uudesta hankkeesta tai muutoksista hankkeen tiedoissa (lue lisää [täältä](#asemakaavahankkeesta-tiedottaminen))
- Sidoshankkeiden osoittaminen (lue lisää sidoshankkeista [täältä](#hankkeiden-liittyminen-toisiinsa))

## Hankkeen poistaminen
Hankkeen poistaminen on mahdollista vain sen omistajan ja pääkäyttäjän toimesta (lisää käyttöoikeuksista [täällä](#käyttöoikeudet)). 

Perustetun hankkeen voi poistaa hankesivulta käsin valitsemalla Poista hanke tietolomakkeen alaosasta. Ennen poistamista Hanna vielä kysyy varmistuksen käyttäjältä. Poistamisen jälkeen hanketta ei enää pysty palauttamaan käyttöliittymästä käsin. Hankkeen tiedot kuitenkin tosiasiallisesti arkistoituvat Hannan tietokantaan, josta käsin Hannan kehittäjät voivat tarpeen mukaan palauttaa hankkeen.

Investointihankkeiden poistamisen osalta on tärkeää huomioida se, että samalla poistuvat hankkeelle mahdollisesti kirjatut kohteet ja tehtävät.

## Aluerajauksen piirto
Hankkeelle voi halutessaan piirtää aluerajauksen. Aluerajauksen saa piirrettyä karttanäkymän oikeasta laidasta löytyviä toimintoja hyödyntämällä. Toiminnot ja niiden kuvaukset on listattu alle.

- Luo alue: Valitsemalla painikkeen ja viemällä kursorin kartalle pääset aloittamaan alueen piirron. Jokainen hiiren vasemman painallus luo aluerajaukseen yhden solmupisteen. Jotta piirretty alue olisi eheä, täytyy käyttäjän luoda vähintään kolme solmupistettä. Voit viimeistellä piirtämäsi alueen luomalla viimeisen solmupisteen kaksoispainalluksella, jolloin alue ilmestyy kartalle. Huomioi kuitenkin, että piirretty alue ei tallennu automaattisesti.
- Valitse alue: Painikkeen avulla voit valita yhden tai useamman piirtämäsi alueen tai rekisterikohteen. Valinta korostetaan vaaleanvihreällä sävyllä. Pitämällä vaihtopainiketta (shift) pohjassa, voit valita samalla useamman alueen/kohteen.
- Jäljitä valittuja alueita: Jos käyttäjällä on aktiivinen valinta päällä (ks. yllä), voi hän tämän toiminnon valitsemalla piirtää pitkin valitsemansa kohteen ulkorajaa. Toiminnon tarkoitus on helpottaa aluerajauksen piirtoa tilanteessa, jossa hankkeen tai kohteen aluerajaus vastaa kokonaan tai osittain esimerkiksi kiinteistöä. Valittuasi toiminnon vie hiiren kursori valitun kohteen ulkoreunan lähelle, jolloin se kiinnittyy siihen. Painamalla ensimmäisen kerran tulee luoduksi ensimmäinen solmupiste, jonka jälkeen voit seurata hiirellä kohteen ulkoreunaa, kunnes pääset haluttuun kohtaan tai kierrettyä koko kohteen. Lopeta jäljitys painamalla uusi solmupiste, jonka jälkeen voit joko tallentaa alueen tai jatkaa piirto jäljitetyn alueen ulkopuolella. Toistaiseksi jäljityksen jatkaminen suoraan jäljitetyltä alueelta toiselle, ei ole mahdollista.
- Muokkaa valittuja alueita: Tällä painikkeella käyttäjä voi muokata valitun alueen solmupisteitä. Tarttumalla hiirellä halutusta kohtaa valitun alueen ulkoreunaa ja päästämällä irti halutussa kohtaa alueen muotoa voi muokata. Toistaiseksi ei ole mahdollista poistaa jo olemassaolevia solmupisteitä, vaan ainoastaan luoda uusia.
- Poista valitut alueet: Painamalla tätä painiketta käyttäjän valitsema alue poistetaan. Muista tallentaa lopuksi muutokset toisesta painikkeesta.
- Peruuta muutokset: Tällä painikkeella käyttäjä voi peruuttaa tallentamattomat muutoksensa.
- Tallenna muutokset: Painiketta painamalla käyttäjän tekemät muutokset tallennetaan.

Piirtämisen tukena voi hyödyntää seuraavia kaupungin itse tuottamia paikkatietoaineistoja:
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

# Käyttöoikeudet
Toistaiseksi Hannaan luvitetut käyttäjät pääsevät lukemaan, muokkaamaan ja poistamaan kaikkia hankkeita. Hankekohtaiset käyttöoikeudet ja käyttäjien erittely perus- ja pääkäyttäjiin on tulossa pian. 

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
| Vastuuhenkilö | Hankkeen vastuuhenkilö edustaa käyttäjää, joka on vastuussa hankkeen edistämisestä. Hän voi olla esimerkiksi siinä projektipäällikkönä tai vastaavassa roolissa. | Ei |
| Elinkaaren tila  | Arvo valitaan seuraavista joukosta: Aloittamatta, Käynnissä, Valmis, Odottaa. Hanke saa perustamisen hetkellä elinkaaritilakseen automaattisesti Aloittamatta. | Kyllä |
| Lautakunta | Hankkeelle voi valita yhden seuraavista lautakunnista: Yhdyskuntalautakunta, Elinvoima- ja osaamislautakunta, Asunto- ja kiinteistölautakunta, Joukkoliikennelautakunta. Valitsemalla lautakunta osoitetaan hankkeelle se, kenen vuosisuunnitelmasta hankkeen toteutus saa varansa. | Kyllä |
| SAP-projektin ID | Mikäli investointihanke on perustettu myös SAP-tietojärjestelmään, voi sen SAP-projektin ID:n kertoa Hannan hankkeelle taloustoteuman seuraamiseksi. Ole tarkkana, että annat arvoksi SAP:n projektin tunnisteen, etkä esimerkiksi rakenneosan tunnusta. Hanna validoi annetun tunnisteen ja kertoo käyttäjälle sen onnistumisesta. | Ei |

### Investointikohteet
Kohde on investointihankkeen sisäinen olemassa oleva tai suunnitteilla oleva fyysinen rakennelma, jolla on tunnistettu käyttötarkoitus. Kyseessä on usein rekisterikohde, ja kohde voikin olla esimerkiksi väylä, rakennus, aukio, viheralue tai taitorakenne. Hankkeelle osoitetut resurssit, kuten raha, aika, alue ja toimijat eivät yleensä kohdistu koko hankkeelle tasan, ja kohteiden pääasiallinen tarkoitus onkin tarkentaa hankkeen sisältämien toimenpiteiden ja tavoitteiden kohdistumista. Investointihanke voi esimerkiksi viitata kokonaisen kaava-alueen rakentamiseen. 

Kohteita voi kirjata vain investointihankkeelle. Niiden kirjaaminen ei ole pakollista, eikä niiden lukumäärää hankkeella ole rajoitettu.

Hankkeen sisältämät kohteet on kirjattu hankesivun kohteet -välilehdelle. Sieltä käsin käyttäjä voi kirjata hankkeelle myös uusia kohteita valitsemalla `Luo uusi kohde` -painikkeen. Valitsemalla kohteen käyttäjä siirtyy kohdesivulle, joka muistuttaa hankesivua, mutta kuvaa hankkeen sijasta sen kohteen. 

Tällä hetkellä toimintapana on, että suunnittelulle ja rakentamiselle avataan omat kohteensa. 

#### Investointikohteen tietosisältö

| Tietokenttä | Kuvaus | Pakollinen tieto |
| --- | --- | --- | 
| Nimi | Kohteelle annettu nimi. Nimi ei saa olla sama hankkeen kanssa. | Kyllä | 
| Kuvaus | Vapaamuotoinen sanallinen kuvaus kohteesta. | Kyllä | 
| Suunnitteluttaja | Kohteen suunnitteluttamisesta vastaava henkilö. Arvo valitaan alasvetovalikosta Hannan tuntemista käyttäjistä. | Ei | 
| Rakennuttaja | Kohteen rakennuttamisesta vastaava henkilö. Arvo valitaan alasvetovalikosta Hannan tuntemista käyttäjistä. | Ei | 
| Kohteen laji | Yksilöi, onko kohteessa kyse suunnitelusta vai rakentamisesta. Arvo valitaan alasvetovalikosta. | Kyllä | 
| Alkuajankohta | Ajankohta jolloin kohteen toteutus alkaa. | Kyllä |
| Loppuajankohta | Ajankohta jolloin kohteen toteutus päättyy. | Kyllä | 
| Elinkaaritila | Kohteella on arvona kerrallaan aina vain yksi seuraavista elinkaaritiloista: Aloittamatta, Käynnissä, Valmis, Odottaa. Kohde saa perustamisen hetkellä elinkaaritilakseen automaattisesti Aloittamatta. Hankkeen ja sen kohteiden elinkaaritilojen hallinta perustuu toistaiseksi manuaaliseen kirjaamiseen. | Kyllä |
| Kohteen tyyppi | Kohteen tyyppi kertoo, onko kyse uudesta rakentamisesta vai olemassaolevan kohteen muokkaamisesta. Kohteelle valitaan yksi tyyppi arvojoukosta: Uudisrakentaminen, Peruskorjaaminen, Toimivuuden parantaminen. | Kyllä | 
| Omaisuusluokka | Omaisuusluokka määrittelee poistoajan, jonka mukaan käytetty investointi poistuu taseesta. Arvo valitaan alasvetovalikosta valmiista koodistosta. | Kyllä | 
| Toiminnallinen käyttötarkoitus | Toiminnallinen käyttötarkoitus viittaa kohteen käyttötarkoitukseen valmistuessaan. Arvo valitaan alasvetovalikosta valmiista koodistosta. | Kyllä | 
| Vastuuhenkilö | Kohteen vastuuhenkilö edustaa käyttäjää, joka on vastuussa kohteen edistämisestä. Hän voi olla esimerkiksi kohteella projektipäällikkönä tai vastaavassa roolissa. Vastuuhenkilön voi valita omistajan tavoin Hannan tuntemista käyttäjistä. Hanna tuntee käyttäjän, jos hänellä on lupa käyttää Hannaa ja hän on kirjautunut järjestelmään ainakin kerran. Kohde saa vastuuhenkilöksi automaattisesti koko hankkeen vastuuhenkilön, mutta arvoa vaihtaa. Hankkeella ja hankkeen kohteilla saa olla eri vastuuhenkilöt. | Kyllä |
| Maanomistus | Maanomistus kohteen alueella. Käyttäjä voi valita yhden tai useamman arvoista Valtio, Kaupunki, Yksityinen. | Ei| 
| Suhde peruskiinteistöön | Kohteen suhde peruskiinteistöön valitaan seuraavista arvoista: Maanpinnalla, Yläpuoleinen, Alapuoleinen.| Ei |
| Korkeus | Kohteelle voi vapaahtoisesti kirjata korkeuden metreinä merenpinnasta. | Ei | 
| SAP-rakenneosa | Jos kohteelle löytyy sitä vastaava rakenneosa SAP:n projektista, voi käyttäjä osoittaa sen valitsemalla valikosta sopivan arvon. Tämän ehtona on se, että hankkeelle on osoitettu SAP-projektin ID. Tämä mahdollistaa kohteen taloustoteuman seurannan. | Ei |

#### Vaiheet
Vaihe on kohteeseen kohdistuva työvaihe, josta syntyy jokin konkreettinen tulos ja samalla kustannus. Vaiheella ei ole hankkeesta ja kohteesta poiketen omaa sijaintia. Vaiheen tuloksena voi olla esimerkiksi uusi tai korjattu rakennus tai muu rakennelma, asiakirja, mittaustulos tai ylläpidon toimi. Vaiheen määrityksessä auttaa pitkä koodisto, jonka arvot vastaavat SAP-järjestelmän vastaavaa koodistoa. 

Vaiheelle voi lisäksi osoittaa urakoitsijan yhteyshenkilön tiedot.

##### Vaiheiden tietosisältö

| Tietokenttä  | Kuvaus  | Pakollinen tieto |
| --- | --- | --- |
| Nimi | Vaiheelle annettu nimi. Nimen täytyy olla uniikki. Nimi ei saa olla sama hankkeen tai kohteen kanssa. | Kyllä |
| Kuvaus | Vapaamuotoinen sanallinen kuvaus vaiheesta. | Kyllä |
| Urakoitsija | Vaiheen suorittamisesta vastaava urakoitsija. Valinnalla viitataan yrityksen yhteyshenkilöön, johon voi olla yhteydessä. | Kyllä |
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

#### Käyttösuunnitelman muutos (KSM)
Mikäli hankkeeseen suunnitellun talousarvion käyttö muuttuu merkittävästi vuoden aikana, voi hankkeen taloustietoihin kirjata käyttösuunnitelman muutoksen. Tämä voi mahdollistaa esimerkiksi lisärahan osoittamisen hankkeelle tai siitä käyttämättä jäävien rahojen ohjaamisen osaksi toisen hankkeen talousarviota. Käyttösuunnitelman muutos on aina positiivinen luku.

KSM kirjataan hankkeen kohteille. Hankesivun talousvälilehdellä on vain luettavissa sen kohteilta summatut KSM-luvut vuosittain. 

# Hankkeiden vienti taulukkotiedostoon
Hankkeet -välilehdeltä käsin on mahdollista viedä aktiivisen haun palauttamien hankkeiden tiedot Excel -taulukkotiedostoon. Eri hanketyypit viedään taulukkotiedostoissa omille välilehdilleen. Investointihankkeista viedään taulukkotiedostoon hankkeet ja kohteet. Tiedot on rivitetty kohteiden mukaan. Esimerkiksi hanke, jolle on kirjattu kahdeksan kohdetta, ilmenee taulukkotiedostossa kahdeksalla rivillä. Toistaiseksi asemakaavahankkeista viedään taulukkotiedostoon vain osa tietokentistä perustuen mallina käytettyyn asemakaavaluetteloon.

# Investointiohjelmoinnin näkymä
Investointiohjelmoinnin näkymä löytyy sivun päänavigointipalkista. Sen takaa löytyy taulukko, joka listaa riveilleen investointihankkeiden **kohteita** seuraavilla tiedoilla:
- Nimi
- (elinkaari-)Tila
- Hanke, johon kohde kuuluu
- Toteutusväli tarkkuudella kk/vvvv
- Tyyppi
- Omaisuusluokka
- (Toiminnallinen) Käyttötarkoitus
- Rakennuttaja ja suunnitteluttaja
- Talousarvio
- Toteuma
- Ennuste
- Käyttösuunnitelman muutos (KSM)

Käyttäjä pääsee kohteen ja hankkeen nimen kautta siirtymään kyseisen kohteen tai hankkeen omalle sivulle. Taulukon yläpuolelta löytyvälle summariville koostetaan aktiivisen haun mukaiset koontiluvut taloudesta. 

Käyttäjä voi vierittää taulukkoa hiiren rullalla. Siirtyessä taulukossa alaspäin katoavat hakusuodattimet pois näkyvistä, jotta esitettäville riveille jäisi enemmän tilaa näytöllä. Käyttäjä voi painaa sivun vasempaan alakulmaan ilmestyvää painiketta palatakseen nopeasti sivun alkuun. Summarivi ja taulukon otsikkorivi pysyvät kuitenkin näkyvissä koko ajan. 

Investointiohjelmoinnin taulukkoon ilmestyvien kohteiden joukkoa voi rajata sivulta löytyvin hakusuodattimin. Niistä olennaisin on vuosivalitsin sivun yläosassa. Se kohdistuu kohteiden toteutusväliin. Jokainen kohde, joka leikkaa valittua vuotta päivänkin verran tulee mukaan hakutuloksiin. Vuosivalinta vaikuttaa myös siihen, minkä vuoden talousluvut (talousarvio, toteuma, ennuste, KSM) näytetään. Oletuksena valintana on kuluva vuosi. Jos käyttäjä ei valitse vuotta, kohteen talousluvut koostetaan niiden koko elinkaarelta. 

Halutessaan käyttäjä voi lisätä uusia kohteita suoraan investointiohjelmoinnin näkymästä käsin valitsemalla painikkeen `uusi kohde`. Sen käyttö vaatii sitä, että hanke, johon kohde halutaan sisällyttää on jo avattu. Tallentamisen jälkeen käyttäjä hyppää automaattisesti kohdesivulta takaisin investointiohjelmoinnin näkymään. Taulukkoon lisätty rivi korostetaan hetkeksi. 

Käyttäjä voi muokata taulukossa näkyviä tietoja kaksoisklikkaamalla hiiren vasemmalla painikkeella haluttuun taulukon soluun. Kaikki solut eivät kuitenkaan ole muokattavissa. Esimerkiksi toteuma luetaan suoraan SAP:n rajapinnalta, eikä ole muokattavissa. Myöskään hankkeen nimeä ei voi muokata investointiohjelmoinnin kautta. 

Kun muokkaat mitä tahansa solua, ilmestyy taulukon vasempaan alakulmaan joukko painikkeita. Tallenna -painikkeesta tallennat kaikki muutokset, jotka olet tehnyt. Niitä voi siis olla kertynyt useampiakin. Peru kaikki muutokset -painike peruuttaa kaikki muutokset, joita olet tehnyt kyseisellä muokkauskerralla. Nuolipainike taaksepäin kumoaa edellisen muokkauksen. Nuolipainike eteenpäin vie muokkaushistoriassa yhden eteenpäin. Tallentaessasi sovellus ilmoittaa ponnahdusikkunalla tietojen tallentamisen tapahtuneen onnistuneesti. 

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