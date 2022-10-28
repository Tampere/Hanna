import { getTopLeft, getWidth } from 'ol/extent';
import TileLayer from 'ol/layer/Tile';
import { get as getProjection } from 'ol/proj';
import WMTS from 'ol/source/WMTS';
import WMTSTileGrid from 'ol/tilegrid/WMTS';

import { mapOptions } from './mapOptions';

/**
 * Create OpenLayers WMTS protocol Layer
 * @public
 * @return {TileLayer}                    # ol/WMS -protocol Tiled layer
 * @see https://openlayers.org/en/latest/apidoc/module-ol_source_WMTS-WMTS.html
 */
export function createWMTSLayer(layer: any) {
  return new TileLayer({
    source: createWMTSSource(layer.options),
  });
}

/**
 * Creates WMTS source used for creating TileLayers
 * @public
 * @param {Object}     options            # Layer's specifications, id, url, etc.
 * @param {String}     options.url        # URL specifying the address of the tile images
 * @param {String}     options.layers      # Name of the queryed layer(s)
 * @param {String}     options.format     # Format of the raster images
 * @param {String}     options.matrixSet  # Matrix set for the layer
 * @param {String}     options.projection # SRS identifier string
 * @param {Number}     options.tileSize   # Size of the tile image in pixels
 * @param {Number}     options.zoomFactor # Factor by which the tile grid is scaled when zoomed
 * @param {Number}     options.zoomLevels # Count of different zoom levels allowed for the map
 * @return {WMTS}                          # ol/WMTS source
 */
export function createWMTSSource(options: any) {
  const {
    url,
    matrixSet,
    layer,
    format,
    projection,
    tileSize,
    zoomFactor,
    zoomLevels,
    crossOrigin = 'anonymous',
  } = options;

  const tileGrid = new WMTSTileGrid({
    tileSize: [tileSize, tileSize],
    origin: getTopLeft([
      50199.4813825220335275, 5698259.8706227578222752, 2147351.4813825218006968,
      7795411.8706227578222752,
    ]),
    resolutions: createTileResolutions(tileSize, zoomFactor, zoomLevels),
    matrixIds: createTileMatrixIDS(zoomLevels, matrixSet),
  });

  return new WMTS({
    url,
    layer,
    matrixSet,
    format,
    projection,
    tileGrid,
    crossOrigin,
    ...(url.includes('geoserver') && { serverType: 'geoserver' }),
  });
}

function createTileMatrixIDS(zoomLevels: number, matrixSet: string) {
  /** Initializes an array of [0, 1, 2, ..., zoomLevels] */
  const baseMatrix = Array.from(Array(zoomLevels).keys());

  return baseMatrix.map((i) => `${matrixSet}:${i}`);
}

function createTileResolutions(tileSize: number, zoomFactor: number, zoomLevels: number) {
  // const projectionExtent = getProjection(projection)?.getExtent();
  const projectionExtent = [
    50199.4813825220335275, 5698259.8706227578222752, 2147351.4813825218006968,
    7795411.8706227578222752,
  ];
  const size = getWidth(projectionExtent as any) / tileSize;

  /** Initializes an array of [0, 1, 2, ..., zoomLevels] */
  const baseMatrix = Array.from(Array(zoomLevels).keys());

  /** Calculate base resolutions */
  const baseResolutions = baseMatrix.map((index) => size / Math.pow(zoomFactor, index));

  return baseResolutions;
}
