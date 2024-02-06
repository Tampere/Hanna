import { Feature, Map as OLMap } from 'ol';
import { click, primaryAction } from 'ol/events/condition';
import OLGeoJSON, { GeoJSONFeature } from 'ol/format/GeoJSON';
import { Geometry } from 'ol/geom';
import { Draw, Modify, Select, Snap } from 'ol/interaction';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import CircleStyle from 'ol/style/Circle';
import Fill from 'ol/style/Fill';
import Style from 'ol/style/Style';

import { DEFAULT_DRAW_STYLE } from '@frontend/components/Map/styles';

interface DrawOptions {
  source: VectorSource<Geometry>;
  trace: boolean;
  traceSource: VectorSource<Geometry> | null;
  drawStyle?: Style;
  onDrawEnd?: () => void;
}

export const DRAW_LAYER_Z_INDEX = 101;

export function createDrawLayer(source: VectorSource<Geometry>, style?: Style) {
  return new VectorLayer({
    source,
    zIndex: DRAW_LAYER_Z_INDEX,
    properties: { id: 'drawLayer' },
    style: style || DEFAULT_DRAW_STYLE,
  });
}

export function createDrawInteraction(opts: DrawOptions) {
  return function registerInteraction(map: OLMap) {
    const drawStyle = (opts.drawStyle || DEFAULT_DRAW_STYLE).clone();
    drawStyle.setImage(
      new CircleStyle({
        radius: 5,
        fill: new Fill({ color: drawStyle.getStroke()?.getColor() }),
      }),
    );
    drawStyle.getStroke()?.setLineDash([3, 10]);

    const draw = new Draw({
      source: opts.source,
      type: 'Polygon',
      condition: primaryAction,
      style: drawStyle,
      trace: opts.trace,
      ...(opts.trace && opts.traceSource && { traceSource: opts.traceSource }),
    });
    draw.set('type', 'customInteraction');

    const escKeyAbort = (e: KeyboardEvent) => e.code === 'Escape' && draw.abortDrawing();
    const mouseContextMenuAbort = () => (opts.trace ? draw.abortDrawing() : draw.removeLastPoint());

    draw.on('drawstart', () => {
      document.addEventListener('keydown', escKeyAbort);
      document.addEventListener('contextmenu', mouseContextMenuAbort);
    });

    draw.on('drawend', () => {
      // remove listeners
      document.removeEventListener('keydown', escKeyAbort);
      document.removeEventListener('contextmenu', mouseContextMenuAbort);
      opts.onDrawEnd?.();
    });

    map.addInteraction(draw);

    if (opts.trace && opts.traceSource) {
      const snap = new Snap({ source: opts.traceSource });
      map.addInteraction(snap);
    }
  };
}

/**
 * Selection tool
 */

export function createSelectionLayer(source: VectorSource<Geometry>) {
  return new VectorLayer({
    source,
    properties: { id: 'selectionLayer' },
    zIndex: 100,
    style: new Style({
      fill: new Fill({
        color: 'rgba(255, 255, 0, 0.9)',
      }),
    }),
  });
}

interface SelectOptions {
  source: VectorSource<Geometry>;
  onSelectionChanged?: (features: Feature<Geometry>[]) => void;
}

export function createSelectInteraction(opts: SelectOptions) {
  return function registerInteraction(map: OLMap) {
    const select = new Select({
      condition: click,
      style: null,
    });
    select.set('type', 'customInteraction');
    select.on('select', (e) => {
      const selectedFeatures = e.target.getFeatures().getArray();
      opts.source.clear();
      opts.source.addFeatures(selectedFeatures);
      opts.onSelectionChanged?.(selectedFeatures);
    });
    map.addInteraction(select);
  };
}

/**
 * Modify tool
 */

interface ModifyOptions {
  source: VectorSource<Geometry>;
  onModifyEnd?: () => void;
}

export function createModifyInteraction(opts: ModifyOptions) {
  return function registerInteraction(map: OLMap) {
    const modify = new Modify({
      source: opts.source,
    });
    opts.source.set('type', 'customInteraction');
    modify.on('modifyend', () => opts.onModifyEnd?.());
    map.addInteraction(modify);
  };
}

/**
 * Utilities
 */

type GeoJSONFeatureWithCRS = GeoJSONFeature & {
  geometry?: { crs?: { type: 'name'; properties: { name: string } } };
};

export function getGeoJSONFeaturesString(features: Feature<Geometry>[], projectionCode: string) {
  const geoJson = new OLGeoJSON();
  const feats = features.map((feat) => {
    let geoJSONFeature: GeoJSONFeatureWithCRS = geoJson.writeFeatureObject(feat);
    geoJSONFeature = {
      ...geoJSONFeature,
      geometry: {
        ...geoJSONFeature.geometry,
        crs: {
          type: 'name',
          properties: {
            name: projectionCode,
          },
        },
      },
    };
    return geoJSONFeature;
  });

  return JSON.stringify(feats);
}

export function featuresFromGeoJSON(geojson: string | object) {
  const geoJson = new OLGeoJSON();
  const features = geoJson.readFeatures(geojson, {});
  return features;
}

export function deleteSelectedFeatures(
  targetSource: VectorSource<Geometry>,
  selectionSource: VectorSource<Geometry>,
) {
  for (const feature of selectionSource.getFeatures()) {
    targetSource.removeFeature(feature);
    selectionSource.removeFeature(feature);
  }
  selectionSource.clear();
}

export function addFeaturesFromGeoJson(
  targetSource: VectorSource<Geometry>,
  geoJson?: string | object | null,
) {
  targetSource.clear();

  const features = geoJson ? featuresFromGeoJSON(geoJson) : [];
  for (const feature of features) {
    targetSource.addFeature(feature);
  }
}
