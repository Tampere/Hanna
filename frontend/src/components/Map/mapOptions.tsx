const geodataBaseUrl = 'https://geodata.tampere.fi/geoserver';

const createWfsParams = (typeName: string, projectionCode: string) => {
  return new URLSearchParams({
    service: 'WFS',
    request: 'GetFeature',
    typeName: typeName,
    srsname: projectionCode,
    exceptions: 'application/json',
    outputFormat: 'application/json',
  });
};

export interface WFSLayer {
  id: string;
  title: string;
  name: string;
  visible: boolean;
  type: 'wfs';
  url: string;
  style: {
    strokeColor: string;
    fillColor: string;
    fillOpacity: number;
  };
  attributions?: string[];
}

/**
 * Options used to initialize (OpenLayers) Map -component
 */
export const mapOptions = {
  tre: {
    defaultZoom: 8,
    minZoom: 8,
    maxZoom: 17,
    center: [327000, 6822500],
    extent: [313753, 6812223, 351129, 6861143],
  },
  projection: {
    code: 'EPSG:3067',
    extent: [
      50199.4813825220335275, 5698259.8706227578222752, 2147351.4813825218006968,
      7795411.8706227578222752,
    ],
    units: 'm' as const,
    proj4String: '+proj=utm +zone=35 +ellps=GRS80 +units=m +no_defs',
  },
  baseMaps: [
    {
      id: 'virastokartta',
      title: 'Virastokartta',
      name: 'Virastokartta',
      visible: true,
      type: 'base',
      options: {
        protocol: 'wmts',
        url: 'https://georaster.tampere.fi/geoserver/gwc/service/wmts?service=WMTS',
        layer: 'georaster:virastokartta_vari_EPSG_3067',
        matrixSet: 'JHS',
        projection: 'EPSG:3067',
        format: 'image/png',
        tileGridID: 'JHS',
        tileSize: 256,
        zoomLevels: 16,
        zoomFactor: 2,
      },
      opacity: 1.0,
      attributions: [],
    },
    {
      id: 'opaskartta',
      title: 'Opaskartta',
      name: 'Opaskartta',
      visible: true,
      type: 'base',
      options: {
        protocol: 'wmts',
        url: 'https://georaster.tampere.fi/geoserver/gwc/service/wmts?service=WMTS',
        layer: 'georaster:opaskartta_EPSG_3067',
        matrixSet: 'JHS',
        projection: 'EPSG:3067',
        format: 'image/png',
        tileGridID: 'JHS',
        tileSize: 256,
        zoomLevels: 16,
        zoomFactor: 2,
      },
      opacity: 1.0,
      attributions: [],
    },
    {
      id: 'kantakartta',
      title: 'Kantakartta',
      name: 'Kantakartta',
      visible: true,
      type: 'base',
      options: {
        protocol: 'wmts',
        url: 'https://georaster.tampere.fi/geoserver/gwc/service/wmts?service=WMTS',
        layer: 'georaster:kantakartta_mml_harmaa_EPSG_3067',
        matrixSet: 'JHS',
        projection: 'EPSG:3067',
        format: 'image/png',
        tileGridID: 'JHS',
        tileSize: 256,
        zoomLevels: 16,
        zoomFactor: 2,
      },
      opacity: 1.0,
      attributions: [],
    },
    {
      id: 'ilmakuva',
      title: 'Ilmakuva',
      name: 'Ilmakuva',
      visible: true,
      type: 'base',
      options: {
        protocol: 'wmts',
        url: 'https://georaster.tampere.fi/geoserver/gwc/service/wmts?service=WMTS',
        layer: 'georaster:2011v_tre_EPSG_3067',
        matrixSet: 'JHS',
        projection: 'EPSG:3067',
        format: 'image/png',
        tileGridID: 'JHS',
        tileSize: 256,
        zoomLevels: 16,
        zoomFactor: 2,
      },
      opacity: 1.0,
      attributions: [],
    },
    {
      id: 'asemakaava',
      title: 'Asemakaava',
      name: 'Asemakaava',
      visible: true,
      type: 'base',
      options: {
        protocol: 'wmts',
        url: 'https://georaster.tampere.fi/geoserver/gwc/service/wmts?service=WMTS',
        layer: 'georaster:ajantasa_asemakaava_EPSG_3067',
        matrixSet: 'JHS',
        projection: 'EPSG:3067',
        format: 'image/png',
        tileGridID: 'JHS',
        tileSize: 256,
        zoomLevels: 16,
        zoomFactor: 2,
      },
      opacity: 1.0,
      attributions: [],
    },
  ],
  wfsLayers: [
    {
      id: 'kiinteistot',
      title: 'Kiinteistöt',
      name: 'Kiinteistöt',
      visible: true,
      type: 'wfs',
      url: `${geodataBaseUrl}/kiinteistot/wfs?${createWfsParams(
        'kiinteistot:KIINTEISTOT_ALUE_GSVIEW',
        'EPSG:3067'
      )}`,
      style: {
        strokeColor: '#ff0000',
        fillColor: 'rgba(255, 0, 0, 0.1)',
      },
      attributions: [],
    },
    {
      id: 'rakennukset',
      title: 'Rakennukset',
      name: 'Rakennukset',
      visible: true,
      type: 'wfs',
      url: `${geodataBaseUrl}/rakennukset/wfs?${createWfsParams(
        'rakennukset:RAKENN_ST_FA_GSVIEW',
        'EPSG:3067'
      )}`,
      style: {
        strokeColor: '#000000',
        fillColor: '#999999',
      },
    },
    {
      id: 'kadut',
      title: 'Kadut',
      name: 'Kadut',
      visible: true,
      type: 'wfs',
      url: `${geodataBaseUrl}/locus/wfs?${createWfsParams(
        'locus:Katualueen_osa_katu_RpaStreetPart_Polygon_gsview',
        'EPSG:3067'
      )}`,
      style: {
        strokeColor: '#0000ff',
        fillColor: '#ffffff',
      },
    },
  ] as WFSLayer[],
};
