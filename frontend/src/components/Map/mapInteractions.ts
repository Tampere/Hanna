import { Feature, Map as OLMap } from 'ol';
import { click, primaryAction } from 'ol/events/condition';
import OLGeoJSON, { GeoJSONFeature } from 'ol/format/GeoJSON';
import { Geometry } from 'ol/geom';
import { Draw, Modify, Select, Snap } from 'ol/interaction';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Circle from 'ol/style/Circle';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Style from 'ol/style/Style';

/**
 * Drawing tool
 */

const drawStyle = {
  fill: {
    color: 'rgb(173, 255, 47, 0.3)',
  },
  stroke: {
    color: 'rgb(0, 168, 0)',
    width: 3,
  },
};

const unfinishedDrawingStyle = new Style({
  fill: new Fill({
    color: drawStyle.fill.color,
  }),
  stroke: new Stroke({
    color: drawStyle.stroke.color,
    width: drawStyle.stroke.width,
  }),
});

const completedDrawingStyle = new Style({
  fill: new Fill({
    color: drawStyle.fill.color,
  }),
  stroke: new Stroke({
    color: drawStyle.stroke.color,
    width: drawStyle.stroke.width,
    lineDash: [3, 10],
  }),
  image: new Circle({
    radius: 5,
    fill: new Fill({ color: drawStyle.stroke.color }),
  }),
});

interface DrawOptions {
  source: VectorSource<Geometry>;
  trace: boolean;
  traceSource: VectorSource<Geometry> | null;
  onDrawEnd?: () => void;
}

export function createDrawLayer(source: VectorSource<Geometry>) {
  return new VectorLayer({
    source,
    zIndex: 101,
    properties: { id: 'drawLayer' },
    style: unfinishedDrawingStyle,
  });
}

export function createDrawInteraction(opts: DrawOptions) {
  return function registerInteraction(map: OLMap) {
    const draw = new Draw({
      source: opts.source,
      type: 'Polygon',
      condition: primaryAction,
      style: completedDrawingStyle,
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
      //snap.set('type', 'customInteraction');
      map.addInteraction(snap);
    }
  };
}

/**
 * Selection tool
 */

export function createSelectionLayer(source: VectorSource<Geometry>) {
  return new VectorLayer({
    source: source,
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

export function featuresFromGeoJSON(geojson: string) {
  const geoJson = new OLGeoJSON();
  const features = geoJson.readFeatures(geojson, {});
  return features;
}

export function deleteSelectedFeatures(
  targetSource: VectorSource<Geometry>,
  selectionSource: VectorSource<Geometry>
) {
  for (const feature of selectionSource.getFeatures()) {
    targetSource.removeFeature(feature);
    selectionSource.removeFeature(feature);
  }
  selectionSource.clear();
}

export function addFeaturesFromGeoJson(
  targetSource: VectorSource<Geometry>,
  geoJson?: string | null
) {
  targetSource.clear();

  const features = geoJson ? featuresFromGeoJSON(geoJson) : [];
  for (const feature of features) {
    targetSource.addFeature(feature);
  }
}
