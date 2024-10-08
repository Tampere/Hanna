import { FeatureLike } from 'ol/Feature';
import CircleStyle, { Options } from 'ol/style/Circle';
import Fill from 'ol/style/Fill';
import IconStyle from 'ol/style/Icon';
import RegularShape from 'ol/style/RegularShape';
import Stroke from 'ol/style/Stroke';
import Style, { StyleFunction } from 'ol/style/Style';
import Text from 'ol/style/Text';

import { theme } from '@frontend/Layout';
import detailplanClusterPoint from '@frontend/assets/detailplanClusterPoint.svg';
import detailplanClusterPointHovered from '@frontend/assets/detailplanClusterPointHover.svg';
import investmentClusterPoint from '@frontend/assets/investmentClusterPoint.svg';
import investmentClusterPointHovered from '@frontend/assets/investmentClusterPointHover.svg';
import maintenanceClusterPoint from '@frontend/assets/maintenanceClusterPoint.svg';
import maintenanceClusterPointHovered from '@frontend/assets/maintenanceClusterPointHover.svg';
import projectClusterPoint from '@frontend/assets/projectClusterPoint.svg';
import projectClusterPointHovered from '@frontend/assets/projectClusterPointHover.svg';
import projectClusterPointSelected from '@frontend/assets/projectClusterPointSelected.svg';
import projectObjectClusterPoint from '@frontend/assets/projectObjectClusterPoint.svg';
import projectObjectClusterPointHovered from '@frontend/assets/projectObjectClusterPointHover.svg';
import projectObjectClusterPointSelected from '@frontend/assets/projectObjectClusterPointSelected.svg';
import projectObjectPoint from '@frontend/assets/projectObjectPoint.svg';
import { SelectedProjectColorCode, VectorItemLayerKey } from '@frontend/stores/map';

import { ProjectType } from '@shared/schema/project/type';

const _PROJECT_FILL = 'rgb(0, 168, 0, 0.3)';
const _PROJECT_STROKE = 'rgb(0, 168, 0)';
const _PROJECT_STROKE_WIDTH = 3;

const _INVESTMENT_STROKE = 'rgba(40, 87, 20, 1)';
const _INVESTMENT_FILL = 'rgba(40, 87, 20, 0.3)';
const _MAINTENANCE_STROKE = 'rgba(38, 162, 145, 1)';
const _MAINTENANCE_FILL = 'rgba(38, 162, 145, 0.3)';
const _DETAILPLAN_STROKE = 'rgba(154, 154, 0, 1)';
const _DETAILPLAN_FILL = 'rgba(154, 154, 0, 0.3)';

export interface ProjectColorCodes {
  investmentProject: { stroke: string; fill: string };
  maintenanceProject: { stroke: string; fill: string };
  detailplanProject: { stroke: string; fill: string };
}

export const projectColorCodes: ProjectColorCodes = {
  investmentProject: { stroke: _INVESTMENT_STROKE, fill: _INVESTMENT_FILL },
  maintenanceProject: { stroke: _MAINTENANCE_STROKE, fill: _MAINTENANCE_FILL },
  detailplanProject: { stroke: _DETAILPLAN_STROKE, fill: _DETAILPLAN_FILL },
};

const projectAreaIndicators = {
  investmentProject: 'I',
  maintenanceProject: 'KP',
  detailplanProject: 'A',
  project: 'H',
  projectObject: 'K',
};

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

export function makePointDrawStyle() {
  return new Style({
    image: new IconStyle({
      opacity: 1,
      src: projectObjectPoint.toString(),
      scale: 0.8,
    }),
  });
}

const _DEFAULT_FILL = 'rgb(255, 0, 0, 0.4)';
const _DEFAULT_STROKE = 'rgb(255, 0, 0)';
const _DEFAULT_HIGHLIGHT_STROKE = '#fff';
export const DEFAULT_DRAW_STYLE = makeDrawStyle(_DEFAULT_FILL, _DEFAULT_STROKE);
export const DEFAULT_POINT_STYLE = makePointDrawStyle();
const SELECTION_COLOR = 'rgba(255, 255, 0, 0.9)';

const CLUSTER_RADIUS = 24;
const CLUSTER_STROKE = '#fff';
const CLUSTER_STROKE_WIDTH = 2;
const CLUSTER_FILL = {
  project: 'rgb(0, 168, 0)',
  projectObject: theme.palette.primary.main,
  investmentProject: _INVESTMENT_STROKE,
  maintenanceProject: _MAINTENANCE_STROKE,
  detailplanProject: _DETAILPLAN_STROKE,
};
const CLUSTER_FONT = 'bold 18px sans-serif';
const HOVERED_CLUSTER_FILL = {
  project: '#B7DAA8',
  projectObject: '#A9B5C9',
  investmentProject: '#A9BCA1',
  maintenanceProject: '#A8DAD3',
  detailplanProject: '#D7D799',
};

const iconBackgroundStyle = new Style({
  // To make every part of the icon clickable
  image: new CircleStyle({
    radius: 20.5, // Half of the icon width
    fill: new Fill({
      color: 'transparent',
    }),
  }),
});

const iconSources = {
  project: projectClusterPoint.toString(),
  selectedProject: projectClusterPointSelected.toString(),
  projectObject: projectObjectClusterPoint.toString(),
  selectedProjectObject: projectObjectClusterPointSelected.toString(),
  investmentProject: investmentClusterPoint.toString(),
  maintenanceProject: maintenanceClusterPoint.toString(),
  detailplanProject: detailplanClusterPoint.toString(),
};

const hoveredIconSources = {
  project: projectClusterPointHovered.toString(),
  selectedProject: projectClusterPointSelected.toString(),
  projectObject: projectObjectClusterPointHovered.toString(),
  selectedProjectObject: projectObjectClusterPointSelected.toString(),
  investmentProject: investmentClusterPointHovered.toString(),
  maintenanceProject: maintenanceClusterPointHovered.toString(),
  detailplanProject: detailplanClusterPointHovered.toString(),
};

const clusterIconStylesCache: Record<keyof typeof iconSources, Style[]> = {} as Record<
  keyof typeof iconSources,
  Style[]
>;

const hoveredIconStylesCache: Record<keyof typeof iconSources, Style[]> = {} as Record<
  keyof typeof iconSources,
  Style[]
>;

function getClusterIconStyle(styleKey: keyof typeof iconSources, isHovered: boolean = false) {
  if (isHovered ? !hoveredIconStylesCache[styleKey] : !clusterIconStylesCache[styleKey]) {
    (isHovered ? hoveredIconStylesCache : clusterIconStylesCache)[styleKey] = [
      new Style({
        image: new IconStyle({
          opacity: 1,
          src: isHovered ? hoveredIconSources[styleKey] : iconSources[styleKey],
        }),
      }),
      iconBackgroundStyle,
    ];
  }
  return isHovered ? hoveredIconStylesCache[styleKey] : clusterIconStylesCache[styleKey];
}

interface DonutOptions {
  color: string;
  sectorPrecentage: number;
}

const defaultDonutOptions = [{ color: CLUSTER_FILL.project, sectorPrecentage: 1 }];

class DonutStyle extends RegularShape {
  donutOptions: DonutOptions[];
  constructor(options: Options & { donutOptions: DonutOptions[] }) {
    super({ ...options, points: Infinity });
    this.donutOptions = options.donutOptions;
  }

  getImage(pixelRatio: number) {
    const canvas = super.getImage(pixelRatio);
    const context = canvas.getContext('2d');

    if (context) this.drawDonut(context, this.donutOptions);
    return canvas;
  }

  private drawSlice(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    strokeColor: string,
    fillColor: string,
  ) {
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = strokeColor;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, endAngle, false);
    ctx.arc(centerX, centerY, radius - 5, endAngle, startAngle, true);
    ctx.fill();
    ctx.stroke();
    ctx.closePath();
  }

  private drawCircle(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    radius: number,
    fillColor: string,
  ) {
    ctx.fillStyle = fillColor;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.closePath();
  }

  private drawDonut(ctx: CanvasRenderingContext2D, options: DonutOptions[]) {
    const c = 0;

    let previousEndAngle = -0.5 * Math.PI;
    if (options.length > 1) {
      options.forEach((option) => {
        if (option.sectorPrecentage === 0) return;
        const anglePerSector = option.sectorPrecentage * (2 * Math.PI);
        if (option.sectorPrecentage === 1) {
          this.drawCircle(ctx, c, c, this.radius, '#fff');
          this.drawCircle(ctx, c, c, this.radius - 1, option.color);
          this.drawCircle(ctx, c, c, this.radius - 4, '#fff');
          return;
        }

        this.drawSlice(
          ctx,
          c,
          c,
          this.radius,
          previousEndAngle,
          previousEndAngle + anglePerSector,
          '#fff',
          option.color,
        );
        previousEndAngle += anglePerSector;
      });
    }

    this.drawCircle(
      ctx,
      c,
      c,
      this.radius - 5,
      (this.getFill()?.getColor() ?? CLUSTER_FILL.project) as string,
    );
  }
}

export function clusterStyle(
  feature: FeatureLike,
  itemType: 'project' | 'projectObject',
  projectColorCodes?: ProjectColorCodes | null,
) {
  const clusterCount = feature.get('clusterCount');
  const projectDistribution = feature.get('projectDistribution');
  const clusterZindex = feature.get('clusterIndex') ?? 0;
  const isHovered = Boolean(feature.get('isHovered'));

  const projectTypesWithValues = (projectColorCodes &&
    projectDistribution &&
    Object.keys(projectDistribution).filter((key) => projectDistribution[key] > 0)) as
    | ProjectType[]
    | undefined;

  if (clusterCount === 1) {
    const styleKey = projectTypesWithValues?.[0] ?? itemType;
    return getClusterIconStyle(styleKey, isHovered);
  }

  const donutOptions = projectColorCodes
    ? Object.entries(projectColorCodes).map(([projectType, colors]) => ({
        color: colors.stroke,
        sectorPrecentage: feature.get('projectDistribution')[projectType] / clusterCount,
      }))
    : defaultDonutOptions;

  return [
    new Style({
      image:
        itemType === 'project' && (projectTypesWithValues?.length ?? 0) > 1
          ? new DonutStyle({
              donutOptions,
              radius: CLUSTER_RADIUS,
              stroke: new Stroke({
                color: CLUSTER_STROKE,
                width: CLUSTER_STROKE_WIDTH,
              }),
              fill: new Fill({
                color: isHovered ? HOVERED_CLUSTER_FILL[itemType] : CLUSTER_FILL[itemType],
              }),
            })
          : new CircleStyle({
              radius: CLUSTER_RADIUS,
              stroke: new Stroke({
                color: CLUSTER_STROKE,
                width: CLUSTER_STROKE_WIDTH,
              }),
              fill: new Fill({
                color: isHovered
                  ? HOVERED_CLUSTER_FILL[projectTypesWithValues?.[0] ?? itemType]
                  : CLUSTER_FILL[projectTypesWithValues?.[0] ?? itemType],
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
      zIndex: clusterZindex,
    }),
  ];
}

function getSelectedClusterItemType(feature: FeatureLike) {
  if (Object.keys(feature.getProperties()).includes('clusterProjectObjectIds')) {
    return 'selectedProjectObject';
  }
  return 'selectedProject';
}

export function selectionLayerStyle(feature: FeatureLike) {
  const clusterCount = feature.get('clusterCount');
  if (clusterCount === 1) {
    const itemType = getSelectedClusterItemType(feature);
    return getClusterIconStyle(itemType);
  }
  return new Style({
    fill: new Fill({
      color: SELECTION_COLOR,
    }),
    stroke: new Stroke({
      color: SELECTION_COLOR,
      width: 6,
    }),

    image: new CircleStyle({
      radius: clusterCount ? CLUSTER_RADIUS : 6,
      fill: new Fill({
        color: SELECTION_COLOR,
      }),
      stroke: new Stroke({ color: '#000', width: clusterCount ? CLUSTER_STROKE_WIDTH : 2 }),
    }),
    ...(clusterCount && {
      text: new Text({
        font: CLUSTER_FONT,
        textAlign: 'center',
        text: clusterCount?.toString() ?? '',
        fill: new Fill({ color: '#000' }),
      }),
    }),
  });
}

export function getProjectAreaStyle(
  feature?: FeatureLike,
  projectColorCodes?: SelectedProjectColorCode['projectColorCodes'],
  withLabels = true,
) {
  const projectType = feature?.get('projectType') as ProjectType;

  return [
    new Style({
      fill: new Fill({
        color: projectColorCodes?.[projectType]?.fill ?? _PROJECT_FILL,
      }),
      stroke: new Stroke({
        color: projectColorCodes?.[projectType]?.stroke ?? _PROJECT_STROKE,
        width: _PROJECT_STROKE_WIDTH,
      }),
      ...(withLabels && {
        text: new Text({
          text: projectColorCodes
            ? projectAreaIndicators?.[projectType] ?? ''
            : projectAreaIndicators.project,
          textAlign: 'center',
          font: '700 12px roboto',
          stroke: new Stroke({ color: '#fff', width: 2 }),
          overflow: false,
          fill: new Fill({
            color: projectColorCodes?.[projectType]?.stroke ?? _PROJECT_STROKE,
          }),
        }),
      }),
      zIndex: 1,
    }),
    new Style({
      stroke: new Stroke({
        color: _DEFAULT_HIGHLIGHT_STROKE,
        width: _PROJECT_STROKE_WIDTH + 4,
      }),
      zIndex: 0,
    }),
  ];
}

export const WHOLE_MUNICIPALITY_PROJECT_AREA_STYLE = [
  new Style({
    stroke: new Stroke({
      color: _PROJECT_STROKE,
      width: _PROJECT_STROKE_WIDTH,
    }),
    zIndex: 1,
  }),
  new Style({
    stroke: new Stroke({
      color: _DEFAULT_HIGHLIGHT_STROKE,
      width: _PROJECT_STROKE_WIDTH + 4,
    }),
    zIndex: 0,
  }),
];

const _PROJ_OBJ_FILL = 'rgb(34, 67, 123, 0.3)';
const _PROJ_OBJ_STROKE = 'rgb(34, 67, 123)';
const _PROJ_OBJ_STROKE_WIDTH = 2;

export const PROJECT_OBJECT_STYLE = [
  new Style({
    fill: new Fill({
      color: _PROJ_OBJ_FILL,
    }),
    stroke: new Stroke({
      color: _PROJ_OBJ_STROKE,
      width: _PROJ_OBJ_STROKE_WIDTH,
    }),
    text: new Text({
      text: projectAreaIndicators.projectObject,
      textAlign: 'center',
      font: '700 12px roboto',
      stroke: new Stroke({ color: '#fff', width: 2 }),
      overflow: false,
      fill: new Fill({
        color: _PROJ_OBJ_STROKE,
      }),
    }),
    zIndex: 1,
  }),
  new Style({
    stroke: new Stroke({
      color: _DEFAULT_HIGHLIGHT_STROKE,
      width: _PROJECT_STROKE_WIDTH + 4,
    }),

    zIndex: 0,
  }),
];

const _PROJ_OBJ_DRAW_FILL = 'rgb(34, 67, 123, 0.4)';
const _PROJ_OBJ_DRAW_STROKE = 'rgb(255, 100, 0)';
const _PROJ_OBJ_DRAW_STROKE_WIDTH = 2;

function getObjectIconScale(zoom: number) {
  return Math.max(0.5, Math.min(0.8, 1 / zoom));
}

export const PROJ_OBJ_DRAW_STYLE = new Style({
  fill: new Fill({
    color: _PROJ_OBJ_DRAW_FILL,
  }),
  stroke: new Stroke({
    color: _PROJ_OBJ_DRAW_STROKE,
    width: _PROJ_OBJ_DRAW_STROKE_WIDTH,
    lineDash: [4],
  }),
});

export function getStyleWithPointIcon(style: Style | Style[]): StyleFunction {
  return function (feature: FeatureLike, resolution: number) {
    let styles = Array.isArray(style) ? style : [style];
    const featureType = feature.getGeometry()?.getType();
    // Remove text from point features
    if (featureType === 'MultiPoint' || featureType === 'Point') {
      styles = styles.map((style) => style.clone());
      styles.forEach((style) => style.getText()?.setText(undefined));
    }

    return [
      ...styles,
      new Style({
        image: new IconStyle({
          opacity: 1,
          src: projectObjectPoint.toString(),
          scale: getObjectIconScale(resolution),
        }),
      }),
      new Style({
        // To make every part of the icon clickable
        image: new CircleStyle({
          radius: 20.5, // Half of the icon width
          scale: getObjectIconScale(resolution),
          fill: new Fill({
            color: 'transparent',
          }),
        }),
      }),
    ];
  };
}

const highlightBaseStyle = [
  new Style({
    stroke: new Stroke({
      color: _DEFAULT_HIGHLIGHT_STROKE,
      width: 2,
    }),
    zIndex: 9,
  }),

  new Style({
    stroke: new Stroke({
      color: 'rgba(255,255,255,0.01)',
      width: 10,
    }),
    zIndex: 10,
  }),
];

export function getFeatureHighlightStyle(layerId: VectorItemLayerKey, layerStyle: Style | Style[]) {
  switch (layerId) {
    case 'projects':
    case 'projectObjects':
      return Array.isArray(layerStyle)
        ? layerStyle.concat(highlightBaseStyle)
        : [layerStyle, ...highlightBaseStyle];

    default:
      return undefined;
  }
}

export const colorPalette = {
  projectFill: _PROJECT_FILL,
  projectClusterFill: CLUSTER_FILL.project,
  projectObjectFill: _PROJ_OBJ_FILL,
  projectObjectClusterFill: CLUSTER_FILL.projectObject,
};
