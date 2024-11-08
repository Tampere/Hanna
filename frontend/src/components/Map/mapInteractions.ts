import { Collection, Feature, Map as OLMap, getUid } from 'ol';
import { FeatureLike } from 'ol/Feature';
import { unByKey } from 'ol/Observable';
import { EventsKey } from 'ol/events';
import { click, primaryAction } from 'ol/events/condition';
import OLGeoJSON, { GeoJSONFeature } from 'ol/format/GeoJSON';
import { Geometry } from 'ol/geom';
import { Draw, Modify, Select, Snap } from 'ol/interaction';
import PointerInteraction from 'ol/interaction/Pointer';
import { SelectEvent } from 'ol/interaction/Select';
import Layer from 'ol/layer/Layer';
import VectorLayer from 'ol/layer/Vector';
import RenderFeature, { toFeature } from 'ol/render/Feature';
import VectorSource from 'ol/source/Vector';
import CircleStyle from 'ol/style/Circle';
import Fill from 'ol/style/Fill';
import Style, { StyleLike } from 'ol/style/Style';

import {
  DEFAULT_DRAW_STYLE,
  DEFAULT_POINT_STYLE,
  DRAW_LAYER_Z_INDEX,
  GEOMETRY_ICON_LAYER_Z_INDEX,
  PROJECT_LAYER_Z_INDEX,
  SELECTION_LAYER_Z_INDEX,
  getDrawViewGeometryCenterIconStyle,
  getStyleWithPointIcon,
  selectionLayerStyle,
} from '@frontend/components/Map/styles';

interface DrawOptions {
  source: VectorSource<Feature<Geometry>>;
  trace: boolean;
  traceSource: VectorSource<Feature<Geometry>> | null;
  drawStyle?: Style | Style[];
  onDrawEnd?: () => void;
  drawType: 'Polygon' | 'Point';
}

let pointerEventKeys: EventsKey[] = [];

const defaultStyles = { Polygon: DEFAULT_DRAW_STYLE, Point: DEFAULT_POINT_STYLE };

function setCrosshairCursor(map: OLMap) {
  unByKey(pointerEventKeys);
  pointerEventKeys = pointerEventKeys.filter((key) => Object.keys(key).length !== 0);

  map.getViewport().style.cursor = 'crosshair';
}

export function getDrawLayer(
  source: VectorSource<Feature<Geometry>>,
  style: Style | Style[],
  itemType: 'project' | 'projectObject',
) {
  const itemTypeZIndex = {
    project: PROJECT_LAYER_Z_INDEX,
    projectObject: DRAW_LAYER_Z_INDEX,
  };
  return new VectorLayer({
    source,
    zIndex: itemTypeZIndex[itemType],
    properties: { id: 'drawLayer' },
    style: getStyleWithPointIcon(style, false),
  });
}

export function getGeometryIconLayer(
  source: VectorSource<Feature<Geometry>>,
  itemType: 'project' | 'projectObject',
) {
  return new VectorLayer({
    source,
    properties: { id: 'geometryIconLayer', type: 'vector' },
    zIndex: GEOMETRY_ICON_LAYER_Z_INDEX,
    style: getDrawViewGeometryCenterIconStyle(itemType),
  });
}

export function createDrawInteraction(opts: DrawOptions) {
  return function registerInteraction(map: OLMap) {
    let drawStyle: StyleLike = opts.drawStyle || defaultStyles[opts.drawType];

    setCrosshairCursor(map);
    if (Array.isArray(drawStyle)) {
      drawStyle = drawStyle.map((styleObject) => styleObject.clone());
      if (opts.drawType === 'Polygon') {
        drawStyle[0].setImage(
          new CircleStyle({
            radius: 5,
            fill: new Fill({ color: drawStyle[0].getStroke()?.getColor() }),
          }),
        );
        drawStyle[0].getStroke()?.setLineDash([3, 10]);
      }
    } else {
      drawStyle = drawStyle.clone();
      if (opts.drawType === 'Polygon') {
        drawStyle.setImage(
          new CircleStyle({
            radius: 5,
            fill: new Fill({ color: drawStyle.getStroke()?.getColor() }),
          }),
        );
        drawStyle.getStroke()?.setLineDash([3, 10]);
      }
    }
    if (opts.drawType === 'Point') {
      drawStyle = getStyleWithPointIcon(drawStyle, false);
    }

    const draw = new Draw({
      source: opts.source,
      type: opts.drawType,
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

    draw.on('drawend', (event) => {
      // To apply correct styles
      event.feature.setProperties({ editing: true });
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

export function getSelectionLayer(source: VectorSource<Feature<Geometry>>) {
  return new VectorLayer({
    source,
    properties: { id: 'selectionLayer' },
    zIndex: SELECTION_LAYER_Z_INDEX,
    style: selectionLayerStyle,
  });
}

interface SelectOptions {
  source: VectorSource<Feature<Geometry>>;
  onSelectionChanged?: (features: Feature<Geometry>[], event: SelectEvent) => void;
  multi?: boolean;
  delegateFeatureAdding?: boolean;
  filterLayers?: (layer: Layer) => boolean;
  drawLayerHooverDisabled: boolean;
}

export function createSelectInteraction(opts: SelectOptions) {
  return function registerInteraction(map: OLMap) {
    const select = new Select({
      condition: click,
      style: null,
      multi: opts?.multi ?? false,
      layers: opts.filterLayers,
    });

    pointerEventKeys.push(
      map.on('pointerdrag', () => {
        map.getViewport().style.cursor = 'grabbing';
      }),
    );
    pointerEventKeys.push(
      map.on('moveend', () => {
        map.getViewport().style.cursor = '';
      }),
    );

    const pointer = getPointerHoverInteraction(map, opts.drawLayerHooverDisabled);

    pointer.set('type', 'customInteraction');
    select.set('type', 'customInteraction');
    select.on('select', (e) => {
      const selectedFeatures = e.target.getFeatures().getArray();

      selectedFeatures.forEach((f: Feature<Geometry>) => {
        f.setProperties({ layer: select.getLayer(f).getProperties().id }, true);
      });

      opts.source.clear();
      if (!opts.delegateFeatureAdding) {
        opts.source.addFeatures(selectedFeatures);
      }
      opts.onSelectionChanged?.(selectedFeatures, e);
    });
    map.addInteraction(pointer);
    map.addInteraction(select);
  };
}

/**
 * Modify tool
 */

interface ModifyOptions {
  source: VectorSource<Feature<Geometry>>;
  onModifyEnd?: () => void;
}

export function createModifyInteraction(opts: ModifyOptions) {
  return function registerInteraction(map: OLMap) {
    setCrosshairCursor(map);
    const modify = new Modify({
      features: new Collection(getSelectedDrawLayerFeatures(opts.source.getFeatures())),
    });
    modify.set('type', 'customInteraction');
    modify.on('modifyend', () => {
      opts.onModifyEnd?.();
    });
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
  if (Array.isArray(geojson)) {
    return geojson.flatMap((f) => geoJson.readFeature(f, {}));
  }
  const features = geoJson.readFeatures(geojson, {});
  return features;
}

export function deleteSelectedFeatures(
  targetSource: VectorSource<Feature<Geometry>>,
  selectionSource: VectorSource<Feature<Geometry>>,
) {
  for (const feature of getSelectedDrawLayerFeatures(selectionSource.getFeatures())) {
    targetSource.removeFeature(feature);
    selectionSource.removeFeature(feature);
  }
  return selectionSource.getFeatures();
}

export function getSelectedDrawLayerFeatures(features: Feature<Geometry>[]) {
  return features.filter((f) => f.getProperties().layer === 'drawLayer');
}

export function addFeaturesFromGeoJson(
  targetSource: VectorSource<Feature<Geometry>>,
  geoJson?: string | object | null,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  featureProperties?: Record<string, any>,
) {
  targetSource.clear();
  const features = geoJson ? featuresFromGeoJSON(geoJson) : [];
  for (const feature of features) {
    feature.setProperties(featureProperties ?? {});
    targetSource.addFeature(feature);
  }
}

export function highlightHoveredFeature(
  featureLike: FeatureLike,
  hoveredFeature: Feature<Geometry> | null,
) {
  const feature = featureLike instanceof RenderFeature ? toFeature(featureLike) : featureLike;
  if (hoveredFeature && getUid(hoveredFeature) === getUid(feature)) {
    return hoveredFeature;
  }
  hoveredFeature?.setProperties({ isHovered: false });
  feature.setProperties({ isHovered: true });

  return feature;
}
let hoveredFeature: Feature<Geometry> | null = null;

function getPointerHoverInteraction(olMap: OLMap, drawLayerDisabled: boolean) {
  const pointer = new PointerInteraction({
    handleMoveEvent: (event) => {
      const result = olMap.forEachFeatureAtPixel(
        event.pixel,
        (featureLike) => {
          hoveredFeature = highlightHoveredFeature(featureLike, hoveredFeature);
          return true;
        },
        {
          layerFilter: (layer) =>
            Boolean(layer.getProperties().id) && drawLayerDisabled
              ? !['drawLayer', 'municipality'].includes(layer.getProperties().id)
              : true,
        },
      );

      if (result) {
        olMap.getViewport().style.cursor = 'pointer';
      } else {
        olMap.getViewport().style.cursor = '';
        hoveredFeature?.setProperties({ isHovered: false });
        hoveredFeature = null;
      }
    },
    handleDownEvent: () => {
      hoveredFeature?.setProperties({ isHovered: false });
      return false;
    },
  });
  return pointer;
}
