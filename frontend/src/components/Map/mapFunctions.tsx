import { asArray } from 'ol/color';
import { Extent, getTopLeft, getWidth } from 'ol/extent';
import GeoJSON from 'ol/format/GeoJSON';
import Layer from 'ol/layer/Layer';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import { bbox } from 'ol/loadingstrategy';
import { Projection, get as getProjection } from 'ol/proj';
import { Units } from 'ol/proj/Units';
import { register } from 'ol/proj/proj4.js';
import WebGLVectorLayerRenderer from 'ol/renderer/webgl/VectorLayer';
import { packColor } from 'ol/renderer/webgl/shaders';
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
    code: code,
    extent: extent,
    units: units,
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
  projection: Projection
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

export function createVectorSource(url: string) {
  return new VectorSource({
    url: (extent: number[]) => {
      return `${url}&bbox=${extent.join(',')},EPSG:3067`;
    },
    strategy: bbox,
    format: new GeoJSON(),
  });
}

/**
 * https://openlayers.org/en/latest/examples/webgl-vector-layer.html
 */

export class WebGLLayer extends Layer {
  createRenderer(): WebGLVectorLayerRenderer {
    const layer = this;
    return new WebGLVectorLayerRenderer(this, {
      fill: {
        attributes: {
          color: function () {
            const color = asArray(layer.get('fillColor'));
            return packColor(color);
          },
          opacity: function () {
            return layer.get('fillOpacity') || 1;
          },
        },
      },
      stroke: {
        attributes: {
          color: function () {
            const color = [...asArray(layer.get('strokeColor'))];
            return packColor(color);
          },
          width: function () {
            return 1.2;
          },
          opacity: function () {
            return 1;
          },
        },
      },
    });
  }
}

export function createWebGLWFSLayer(layer: WFSLayer) {
  return new WebGLLayer({
    source: createVectorSource(layer.url),
    properties: {
      id: layer.id,
      type: 'wfs',
      strokeColor: layer.style.strokeColor,
      fillColor: layer.style.fillColor,
      fillOpacity: layer.style.fillOpacity,
    },
  });
}

export function createWFSLayer(layer: WFSLayer) {
  return new VectorLayer({
    source: createVectorSource(layer.url),
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
  projection: Projection
) {
  const projectionExtent = getProjection(projection)?.getExtent();
  const size = getWidth(projectionExtent as Extent) / tileSize;

  /** Initializes an array of [0, 1, 2, ..., zoomLevels] */
  const baseMatrix = Array.from(Array(zoomLevels).keys());

  /** Calculate base resolutions */
  const resolutions = baseMatrix.map((index) => size / Math.pow(zoomFactor, index));
  return resolutions;
}
