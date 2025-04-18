import Feature from 'ol/Feature';
import { Extent, getTopLeft, getWidth } from 'ol/extent';
import GeoJSON from 'ol/format/GeoJSON';
import { Geometry } from 'ol/geom';
import TileLayer from 'ol/layer/Tile';
import VectorImageLayer from 'ol/layer/VectorImage';
import { bbox } from 'ol/loadingstrategy';
import { Projection, get as getProjection } from 'ol/proj';
import { Units } from 'ol/proj/Units';
import { register } from 'ol/proj/proj4.js';
import VectorSource from 'ol/source/Vector';
import WMTS from 'ol/source/WMTS';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Style from 'ol/style/Style';
import Text from 'ol/style/Text';
import WMTSTileGrid from 'ol/tilegrid/WMTS';
import proj4 from 'proj4';

/**
 * Create OpenLayers Vector Layer
 * @public
 * @return {VectorLayer}                        # ol/WMS -protocol Tiled layer
 * @see https://openlayers.org/en/latest/apidoc/module-ol_source_WMTS-WMTS.html
 */
import { WFSLayer } from '@frontend/components/Map/mapOptions';
import { VectorLayerKey } from '@frontend/stores/map';
import { AtLeast } from '@frontend/stores/misc';

import { WFS_LAYER_DEFAULT_Z_INDEX } from './styles';

/**
 * Default map projection is EPSG:3857 Web Mercator. Uncommon projections,
 * e.g. EPSG:3067 used in Finland, have to be separately added to OpenLayers via
 * proj4 -library. proj4 defs can be found here @see https://epsg.io/3067 under
 * 'Export', 'Proj4js'.
 *
 * @param projectionCode
 * @param extent
 * @param proj4String
 * @returns
 */
export function registerProjection(projectionCode: string, extent: number[], proj4String: string) {
  proj4.defs(projectionCode, proj4String);
  register(proj4);
  getProjection(projectionCode)?.setExtent(extent);
}

/**
 * Get map projection
 * @param code
 * @param extent
 * @param units
 * @returns Projection
 *
 * General info about projections:
 * @see https://openlayers.org/en/latest/doc/faq.html
 *
 */
export function getMapProjection(code = 'EPSG:3857', extent: number[], units: Units) {
  /** Web Mercator is already registered to proj4 projections: just return it */
  if (['EPSG:3857', 'EPSG:4326'].includes(code)) {
    return getProjection(code);
  }

  return new Projection({
    code,
    extent,
    units,
  });
}

/**
 * Create map tile layer with WMTS source
 * @see https://openlayers.org/en/latest/apidoc/module-ol_source_WMTS-WMTS.html
 * @see https://openlayers.org/en/latest/apidoc/module-ol_layer_Tile-TileLayer.html
 *
 * @param  options               # Layer's specifications, id, url, etc.
 * @param  options.url           # URL specifying the address of the tile images
 * @param  options.layers        # Name of the queried layer(s)
 * @param  options.format        # Format of the raster images
 * @param  options.matrixSet     # Matrix set for the layer
 * @param  options.tileSize      # Size of the tile image in pixels
 * @param  options.zoomFactor    # Factor by which the tile grid is scaled when zoomed
 * @param  options.zoomLevels    # Count of different zoom levels allowed for the map
 * @param  options.crossOrigin   # CORS setting for the layer
 * @param  options.style         # Layer style
 * @param  projection            # Projection of the map
 * @return # OpenLayers Tile -layer
 */
export function createWMTSLayer(
  options: {
    url: string;
    matrixSet: string;
    layer: string;
    format: string;
    tileSize: number;
    zoomFactor: number;
    zoomLevels: number;
    crossOrigin?: string;
    style?: string;
  },
  projection: Projection,
  setError: () => void,
) {
  const {
    url,
    matrixSet,
    layer,
    format,
    tileSize,
    zoomFactor,
    zoomLevels,
    crossOrigin = 'anonymous',
    style = '',
  } = options;

  const tileGrid = new WMTSTileGrid({
    tileSize: [tileSize, tileSize],
    origin: getTopLeft(projection.getExtent()),
    resolutions: createTileResolutions(tileSize, zoomFactor, zoomLevels, projection),
    matrixIds: createTileMatrixIDS(zoomLevels, matrixSet),
  });

  const wmtsSource = new WMTS({
    url,
    layer,
    matrixSet,
    format,
    projection,
    tileGrid,
    style,
    crossOrigin,
    ...(url.includes('geoserver') && { serverType: 'geoserver' }),
  });

  wmtsSource.addEventListener('tileloaderror', () => {
    setError();
  });

  return new TileLayer({
    source: wmtsSource,
    properties: { type: 'basemap' },
  });
}

/**
 * Create matrix id's the map tile set
 * @param zoomLevels
 * @param matrixSet
 * @returns
 */
function createTileMatrixIDS(zoomLevels: number, matrixSet: string) {
  /** Initializes an array of [0, 1, 2, ..., zoomLevels] */
  const baseMatrix = Array.from(Array(zoomLevels).keys());

  return baseMatrix.map((i) => `${matrixSet}:${i}`);
}

/**
 * Creates a vector source used with vector layers
 */

export function createVectorSource(
  url: string,
  setError: (isError: boolean) => void,
  setLoading: (isLoading: boolean) => void,
) {
  const vectorSource = new VectorSource({
    url: (extent: number[]) => {
      return `${url}&bbox=${extent.join(',')},EPSG:3067`;
    },
    strategy: bbox,
    format: new GeoJSON(),
  });
  vectorSource.addEventListener('featuresloadstart', () => setLoading(true));
  vectorSource.addEventListener('featuresloadend', () => setLoading(false));
  vectorSource.addEventListener('featuresloaderror', () => setError(true));
  return vectorSource;
}

export function createWFSLayer(
  layer: WFSLayer & { id: VectorLayerKey },
  handleWfsLayerFetchError: (layerId: VectorLayerKey, isError: boolean) => void,
  handleWfsLayerFetchLoading: (layerId: VectorLayerKey, isLoading: boolean) => void,
) {
  return new VectorImageLayer({
    source: createVectorSource(
      layer.url,
      (isError: boolean) => handleWfsLayerFetchError(layer.id, isError),
      (isLoading: boolean) => handleWfsLayerFetchLoading(layer.id, isLoading),
    ),
    zIndex: WFS_LAYER_DEFAULT_Z_INDEX,
    style: (feature) =>
      new Style({
        fill: new Fill({
          color: layer.style.fillColor,
        }),
        stroke: new Stroke({
          color: layer.style.strokeColor,
          width: layer.style.strokeWidth ?? 1.2,
        }),
        text: new Text({
          text: layer.style.label?.(feature),
          font: layer.style.font,
        }),
      }),
    properties: {
      id: layer.id,
      type: 'wfs',
    },
  });
}

/**
 * Create resolutions array for the map tile set
 * @param tileSize
 * @param zoomFactor
 * @param zoomLevels
 * @returns
 */
function createTileResolutions(
  tileSize: number,
  zoomFactor: number,
  zoomLevels: number,
  projection: Projection,
) {
  const projectionExtent = getProjection(projection)?.getExtent();
  const size = getWidth(projectionExtent as Extent) / tileSize;

  /** Initializes an array of [0, 1, 2, ..., zoomLevels] */
  const baseMatrix = Array.from(Array(zoomLevels).keys());

  /** Calculate base resolutions */
  return baseMatrix.map((index) => size / Math.pow(zoomFactor, index));
}

/**
 * Get project or project object id from a feature, if the feature is a cluster, return the first project or project object id
 * @param feature
 * @returns
 */
export function getFeatureItemId(feature: Feature<Geometry>) {
  return (
    feature.getProperties()?.clusterProjectIds?.[0] ??
    feature.getProperties()?.clusterProjectObjectIds?.[0] ??
    feature.getId()?.toString()
  );
}

/**
 * Get project or project object ids from features
 * @param features
 * @returns
 */
export function getFeatureItemIds(features: Feature<Geometry>[]) {
  return features
    .map(
      (feature) =>
        feature.getProperties()?.clusterProjectIds ??
        feature.getProperties()?.clusterProjectObjectIds ??
        feature.getId()?.toString(),
    )
    .flat(1)
    .filter(Boolean);
}

export function getProjectObjectGeoJSON<T extends Record<string, any>>(
  projectObjects?: AtLeast<T, 'geom' | 'projectObjectId' | 'objectName'>[],
) {
  if (!projectObjects || projectObjects.length === 0) {
    return null;
  }

  return {
    type: 'FeatureCollection',
    features: projectObjects
      .map((p) => {
        const geom = p.geom && typeof p.geom === 'string' ? JSON.parse(p.geom) : null;
        if (!geom) {
          return null;
        }
        return {
          type: 'Feature',
          id: p.projectObjectId,
          geometry: geom,
          properties: {
            name: p.objectName,
          },
        };
      })
      .filter(Boolean),
  };
}
