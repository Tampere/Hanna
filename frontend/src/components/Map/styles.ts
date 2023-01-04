import { FeatureLike } from 'ol/Feature';
import CircleStyle from 'ol/style/Circle';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Style from 'ol/style/Style';
import Text from 'ol/style/Text';

export const drawStyle = {
  fill: {
    color: 'rgb(173, 255, 47, 0.3)',
  },
  stroke: {
    color: 'rgb(0, 168, 0)',
    width: 3,
  },
};

export const unfinishedDrawingStyle = new Style({
  fill: new Fill({
    color: drawStyle.fill.color,
  }),
  stroke: new Stroke({
    color: drawStyle.stroke.color,
    width: drawStyle.stroke.width,
  }),
});

export const completedDrawingStyle = new Style({
  fill: new Fill({
    color: drawStyle.fill.color,
  }),
  stroke: new Stroke({
    color: drawStyle.stroke.color,
    width: drawStyle.stroke.width,
    lineDash: [3, 10],
  }),
  image: new CircleStyle({
    radius: 5,
    fill: new Fill({ color: drawStyle.stroke.color }),
  }),
});

export function clusterStyle(feature: FeatureLike) {
  const clusterCount = feature.get('clusterCount');
  return new Style({
    image: new CircleStyle({
      radius: 16,
      stroke: new Stroke({
        color: '#fff',
        width: 2,
      }),
      fill: new Fill({
        color: 'rgb(0, 168, 0)',
      }),
    }),
    text: new Text({
      font: 'bold 14px sans-serif',
      textAlign: 'center',
      text: clusterCount.toString(),
      fill: new Fill({
        color: '#fff',
      }),
    }),
  });
}

export const projectAreaStyle = new Style({
  fill: new Fill({
    color: drawStyle.fill.color,
  }),
  stroke: new Stroke({
    color: drawStyle.stroke.color,
    width: drawStyle.stroke.width,
  }),
});

export const projectBoundsStyle = new Style({
  stroke: new Stroke({
    color: drawStyle.stroke.color,
    width: drawStyle.stroke.width,
  }),
});

export const projectObjectStyle = new Style({
  fill: new Fill({
    color: 'rgb(0, 0, 255, 0.4)',
  }),
  stroke: new Stroke({
    color: 'rgb(0, 0, 255)',
    width: 2,
  }),
});
