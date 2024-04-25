import { FeatureLike } from 'ol/Feature';
import CircleStyle from 'ol/style/Circle';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Style from 'ol/style/Style';
import Text from 'ol/style/Text';

const _PROJECT_FILL = 'rgb(173, 255, 47, 0.3)';
const _PROJECT_STROKE = 'rgb(0, 168, 0)';
const _PROJECT_STROKE_WIDTH = 3;

export function makeDrawStyle(fillColor: string, strokeColor: string) {
  return new Style({
    fill: new Fill({
      color: fillColor,
    }),
    stroke: new Stroke({
      color: strokeColor,
      width: _PROJECT_STROKE_WIDTH,
    }),
  });
}

const _DEFAULT_FILL = 'rgb(255, 0, 0, 0.4)';
const _DEFAULT_STROKE = 'rgb(255, 0, 0)';
export const DEFAULT_DRAW_STYLE = makeDrawStyle(_DEFAULT_FILL, _DEFAULT_STROKE);
const SELECTION_COLOR = 'rgba(255, 255, 0, 0.9)';

const CLUSTER_RADIUS = 16;
const CLUSTER_STROKE = '#fff';
const CLUSTER_STROKE_WIDTH = 2;
const CLUSTER_FILL = 'rgb(0, 168, 0)';
const CLUSTER_FONT = 'bold 14px sans-serif';

export function clusterStyle(feature: FeatureLike) {
  const clusterCount = feature.get('clusterCount');
  return new Style({
    image: new CircleStyle({
      radius: CLUSTER_RADIUS,
      stroke: new Stroke({
        color: CLUSTER_STROKE,
        width: CLUSTER_STROKE_WIDTH,
      }),
      fill: new Fill({
        color: CLUSTER_FILL,
      }),
    }),
    text: new Text({
      font: CLUSTER_FONT,
      textAlign: 'center',
      text: clusterCount.toString(),
      fill: new Fill({
        color: CLUSTER_STROKE,
      }),
    }),
  });
}

export function selectionLayerStyle(feature: FeatureLike) {
  const clusterCount = feature.get('clusterCount');
  return new Style({
    fill: new Fill({
      color: SELECTION_COLOR,
    }),
    image: new CircleStyle({
      radius: CLUSTER_RADIUS,
      fill: new Fill({
        color: SELECTION_COLOR,
      }),
      stroke: new Stroke({ color: '#000', width: CLUSTER_STROKE_WIDTH }),
    }),
    text: new Text({
      font: CLUSTER_FONT,
      textAlign: 'center',
      text: clusterCount?.toString() ?? '',
      fill: new Fill({ color: '#000' }),
    }),
  });
}

export const PROJECT_AREA_STYLE = new Style({
  fill: new Fill({
    color: _PROJECT_FILL,
  }),
  stroke: new Stroke({
    color: _PROJECT_STROKE,
    width: _PROJECT_STROKE_WIDTH,
  }),
});

const _PROJ_OBJ_FILL = 'rgb(0, 0, 255, 0.4)';
const _PROJ_OBJ_STROKE = 'rgb(0, 0, 255)';
const _PROJ_OBJ_STROKE_WIDTH = 2;

export const PROJ_OBJ_STYLE = new Style({
  fill: new Fill({
    color: _PROJ_OBJ_FILL,
  }),
  stroke: new Stroke({
    color: _PROJ_OBJ_STROKE,
    width: _PROJ_OBJ_STROKE_WIDTH,
  }),
});
