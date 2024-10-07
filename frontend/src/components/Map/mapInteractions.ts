import { Collection, Feature, Map as OLMap } from 'ol';
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
import LayerRenderer from 'ol/renderer/Layer';
import VectorSource from 'ol/source/Vector';
import CircleStyle from 'ol/style/Circle';
import Fill from 'ol/style/Fill';
import Style, { StyleLike } from 'ol/style/Style';

import {
  DEFAULT_DRAW_STYLE,
  DEFAULT_POINT_STYLE,
  getFeatureHighlightStyle,
  getStyleWithPointIcon,
  selectionLayerStyle,
} from '@frontend/components/Map/styles';
import { VectorItemLayerKey } from '@frontend/stores/map';

interface DrawOptions {
  source: VectorSource<Feature<Geometry>>;
  trace: boolean;
  traceSource: VectorSource<Feature<Geometry>> | null;
  drawStyle?: Style | Style[];
  onDrawEnd?: () => void;
  drawType: 'Polygon' | 'Point';
}

let pointerEventKeys: EventsKey[] = [];

export const DRAW_LAYER_Z_INDEX = 101;

const defaultStyles = { Polygon: DEFAULT_DRAW_STYLE, Point: DEFAULT_POINT_STYLE };

function setCrosshairCursor(map: OLMap) {
  unByKey(pointerEventKeys);
  pointerEventKeys = pointerEventKeys.filter((key) => Object.keys(key).length !== 0);

  map.getViewport().style.cursor = 'crosshair';
}

export function createDrawLayer(source: VectorSource<Feature<Geometry>>, style?: Style | Style[]) {
  return new VectorLayer({
    source,
    zIndex: DRAW_LAYER_Z_INDEX,
    properties: { id: 'drawLayer' },
    style: style ? getStyleWithPointIcon(style) : DEFAULT_DRAW_STYLE,
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
      drawStyle = getStyleWithPointIcon(drawStyle);
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

export function createSelectionLayer(source: VectorSource<Feature<Geometry>>) {
  return new VectorLayer({
    source,
    properties: { id: 'selectionLayer' },
    zIndex: DRAW_LAYER_Z_INDEX + 1,
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
) {
  targetSource.clear();
  const features = geoJson ? featuresFromGeoJSON(geoJson) : [];
  for (const feature of features) {
    targetSource.addFeature(feature);
  }
}

export function highlightHoveredFeature(featureLike: FeatureLike, layer: Layer) {
  const feature = featureLike instanceof RenderFeature ? toFeature(featureLike) : featureLike;
  const vectorLayer = layer instanceof LayerRenderer ? layer.getLayer() : layer;
  const layerId: VectorItemLayerKey = layer.getProperties().id;

  const vectorStyleLike = vectorLayer.getStyle();
  const layerStyle =
    typeof vectorStyleLike === 'function' ? vectorStyleLike(feature) : vectorStyleLike;

  feature.setProperties({ isHovered: true });

  switch (layerId) {
    case 'projects':
      feature.setStyle(getFeatureHighlightStyle('projects', layerStyle));
      break;
    case 'projectObjects':
      if (
        feature.getGeometry()?.getType() === 'Point' ||
        feature.getGeometry()?.getType() === 'MultiPoint'
      ) {
        break;
      }
      feature.setStyle(getFeatureHighlightStyle('projectObjects', layerStyle));
      break;
    default:
      break;
  }
  return feature;
}

function getPointerHoverInteraction(olMap: OLMap, drawLayerDisabled: boolean) {
  let hoveredFeature: Feature<Geometry> | null = null;
  const pointer = new PointerInteraction({
    handleMoveEvent: (event) => {
      const result = olMap.forEachFeatureAtPixel(
        event.pixel,
        (featureLike, layer) => {
          hoveredFeature?.setStyle(undefined);
          hoveredFeature?.setProperties({ isHovered: false });
          hoveredFeature = highlightHoveredFeature(featureLike, layer);
          return true;
        },
        {
          layerFilter: (layer) =>
            Boolean(layer.getProperties().id) && drawLayerDisabled
              ? layer.getProperties().id !== 'drawLayer'
              : true,
        },
      );

      if (result) {
        olMap.getViewport().style.cursor = 'pointer';
      } else {
        olMap.getViewport().style.cursor = '';
        hoveredFeature?.setStyle(undefined);
        hoveredFeature?.setProperties({ isHovered: false });
        hoveredFeature = null;
      }
    },
    handleDownEvent: () => {
      hoveredFeature?.setStyle(undefined);
      hoveredFeature?.setProperties({ isHovered: false });
      return false;
    },
  });
  return pointer;
}
