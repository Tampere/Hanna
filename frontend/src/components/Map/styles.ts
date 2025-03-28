import { FeatureLike } from 'ol/Feature';
import { createCanvasContext2D } from 'ol/dom';
import { MultiPolygon, Polygon } from 'ol/geom';
import CircleStyle, { Options } from 'ol/style/Circle';
import Fill from 'ol/style/Fill';
import IconStyle from 'ol/style/Icon';
import RegularShape from 'ol/style/RegularShape';
import Stroke from 'ol/style/Stroke';
import Style, { StyleFunction, StyleLike } from 'ol/style/Style';
import Text from 'ol/style/Text';

import { theme } from '@frontend/Layout';
import detailplanClusterPointHover from '@frontend/assets/map/detailPlanClusterPointHover.png';
import detailplanClusterPoint from '@frontend/assets/map/detailplanClusterPoint.png';
import investmentClusterPoint from '@frontend/assets/map/investmentClusterPoint.png';
import investmentClusterPointHover from '@frontend/assets/map/investmentClusterPointHover.png';
import maintenanceClusterPoint from '@frontend/assets/map/maintenanceClusterPoint.png';
import maintenanceClusterPointHover from '@frontend/assets/map/maintenanceClusterPointHover.png';
import projectClusterPoint from '@frontend/assets/map/projectClusterPoint.png';
import projectClusterPointHover from '@frontend/assets/map/projectClusterPointHover.png';
import projectClusterPointSelected from '@frontend/assets/map/projectClusterPointSelected.png';
import projectObjectClusterPoint from '@frontend/assets/map/projectObjectClusterPoint.png';
import projectObjectClusterPointHover from '@frontend/assets/map/projectObjectClusterPointHover.png';
import projectObjectClusterPointSelected from '@frontend/assets/map/projectObjectClusterPointSelected.png';
import projectObjectPointSmall from '@frontend/assets/map/projectObjectPointSmall.png';
import { SelectedProjectColorCode } from '@frontend/stores/map';

import { ProjectType } from '@shared/schema/project/type';

const _PROJECT_FILL = 'rgba(75, 162, 38, 0.15)';
const _PROJECT_STROKE = 'rgb(0, 168, 0)';
const _PROJECT_STROKE_WIDTH = 3;

const _INVESTMENT_STROKE = 'rgba(40, 87, 20, 1)';
const _INVESTMENT_FILL = 'rgba(40, 87, 20, 0.3)';
const _MAINTENANCE_STROKE = 'rgba(38, 162, 145, 1)';
const _MAINTENANCE_FILL = 'rgba(38, 162, 145, 0.3)';
const _DETAILPLAN_STROKE = 'rgba(154, 154, 0, 1)';
const _DETAILPLAN_FILL = 'rgba(154, 154, 0, 0.3)';

export const VECTOR_LAYER_DEFAULT_Z_INDEX = 1;
export const PROJECT_LAYER_Z_INDEX = 1;
export const PROJECT_OBJECT_LAYER_Z_INDEX = 2;
export const DRAW_LAYER_Z_INDEX = 3;
export const WFS_LAYER_DEFAULT_Z_INDEX = 4;
export const CLUSTER_LAYER_Z_INDEX = 5;
export const GEOMETRY_ICON_LAYER_Z_INDEX = 6;
export const SELECTION_LAYER_Z_INDEX = 7;

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

function getStyleFromStyleLike(styleLike: StyleLike, feature: FeatureLike, resolution: number) {
  return typeof styleLike === 'function' ? styleLike(feature, resolution) : styleLike;
}

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
    image: new CircleStyle({
      radius: 6,
      fill: new Fill({
        color: _PROJECT_STROKE,
      }),
      stroke: new Stroke({
        color: '#fff',
        width: 2,
      }),
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

const iconSources = {
  project: projectClusterPoint,
  selectedProject: projectClusterPointSelected,
  projectObject: projectObjectClusterPoint,
  selectedProjectObject: projectObjectClusterPointSelected,
  investmentProject: investmentClusterPoint,
  maintenanceProject: maintenanceClusterPoint,
  detailplanProject: detailplanClusterPoint,
};

const hoveredIconSources = {
  project: projectClusterPointHover,
  selectedProject: projectClusterPointSelected,
  projectObject: projectObjectClusterPointHover,
  selectedProjectObject: projectObjectClusterPointSelected,
  investmentProject: investmentClusterPointHover,
  maintenanceProject: maintenanceClusterPointHover,
  detailplanProject: detailplanClusterPointHover,
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
          anchor: [0.5, 1],
        }),
      }),
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
  fill?: Fill;
  points: number;
  constructor(options: Options & { donutOptions: DonutOptions[] }) {
    super({
      ...options,
      points: Infinity,
    });
    this.points = Infinity;
    this.fill = options.fill;
    this.donutOptions = options.donutOptions;
  }

  private initializeDraw(
    renderOptions: Record<string, any>,
    context: CanvasRenderingContext2D,
    pixelRatio: number,
  ) {
    context.scale(pixelRatio, pixelRatio);
    // set origin to canvas center
    context.translate(renderOptions.size / 2, renderOptions.size / 2);
  }

  getImage(pixelRatio: number) {
    // Otherwise as in RegularShape but skip caching. Caching doesn't work with dynamic donutOptions and results in all features having the same cached style.
    const renderOptions = this.createRenderOptions();
    const size = Math.ceil(renderOptions.size * pixelRatio);
    const context = createCanvasContext2D(size, size);
    this.initializeDraw(renderOptions, context, pixelRatio);

    const image = context.canvas;

    const imageContext = image.getContext('2d');

    if (imageContext) this.drawDonut(context, this.donutOptions);
    return image;
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
    ctx.lineWidth = 2;
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
  const geom = feature.getGeometry();
  const clusterCount = feature.get('clusterCount');

  if ((geom?.getType() === 'Point' || geom?.getType() === 'MultiPoint') && !clusterCount) {
    return new Style({
      image: new IconStyle({
        opacity: 1,
        src: projectObjectClusterPointSelected.toString(),
        anchor: [0.5, 1],
      }),
    });
  }

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

function getGeometryCenterIconStyle(itemType: 'project' | 'projectObject', feature?: FeatureLike) {
  const geom = feature?.getGeometry();
  const iconStyle = getClusterIconStyle(itemType, false).map((style) => style.clone());
  iconStyle[0].setZIndex(10);

  switch (geom?.getType()) {
    case 'Polygon':
      iconStyle[0].setGeometry((geom as Polygon).getInteriorPoint());
      return iconStyle;
    case 'MultiPolygon':
      iconStyle[0].setGeometry((geom as MultiPolygon).getInteriorPoints());
      return iconStyle;
    default:
      return;
  }
}

function getGeometryHighlightStyleWithIcon(
  itemType: 'project' | 'projectObject',
  feature?: FeatureLike,
) {
  const iconStyle = getGeometryCenterIconStyle(itemType, feature);

  return [...highlightBaseStyle, ...(iconStyle ? iconStyle : [])];
}

export function projectAreaStyle(
  feature?: FeatureLike,
  projectColorCodes?: SelectedProjectColorCode['projectColorCodes'],
  withLabels = true,
  isActive?: boolean,
) {
  const projectType = feature?.get('projectType') as ProjectType;
  const isHovered = Boolean(feature && feature.get('isHovered'));

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
    ...(isHovered
      ? isActive
        ? getGeometryHighlightStyleWithIcon('project', feature)
        : highlightBaseStyle
      : []),
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

const _PROJ_OBJ_FILL = 'rgba(41, 69, 120, 0.4)';
const _PROJ_OBJ_STROKE = 'rgba(41, 69, 120, 1)';
const _PROJ_OBJ_INACTIVE_FILL = 'rgba(41, 69, 120, 0.15)';
const _PROJ_OBJ_INACTIVE_STROKE = 'rgba(126, 151, 197, 1)';
const _PROJ_OBJ_STROKE_WIDTH = 2;

export const projectObjectAreaStyle = (feature?: FeatureLike, isFaded?: boolean) => {
  const isHovered = Boolean(feature && feature.get('isHovered'));

  return [
    new Style({
      fill: new Fill({
        color: isFaded ? _PROJ_OBJ_INACTIVE_FILL : _PROJ_OBJ_FILL,
      }),
      stroke: new Stroke({
        color: isFaded ? _PROJ_OBJ_INACTIVE_STROKE : _PROJ_OBJ_STROKE,
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
    ...(!isFaded
      ? [
          new Style({
            stroke: new Stroke({
              color: _DEFAULT_HIGHLIGHT_STROKE,
              width: _PROJECT_STROKE_WIDTH + 4,
            }),

            zIndex: 0,
          }),
        ]
      : []),
    ...(isHovered ? highlightBaseStyle : []),
  ];
};

const _PROJ_OBJ_DRAW_FILL = _PROJ_OBJ_FILL;
const _PROJ_OBJ_DRAW_STROKE = _PROJ_OBJ_STROKE;
const _PROJ_OBJ_DRAW_STROKE_WIDTH = 2;

export const PROJ_OBJ_DRAW_STYLE = [
  new Style({
    fill: new Fill({
      color: _PROJ_OBJ_DRAW_FILL,
    }),
    stroke: new Stroke({
      color: _PROJ_OBJ_DRAW_STROKE,
      width: _PROJ_OBJ_DRAW_STROKE_WIDTH,
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

export function getStyleWithPointIcon(styleLike: StyleLike, isFaded: boolean): StyleFunction {
  return function (feature: FeatureLike, resolution: number) {
    const style = getStyleFromStyleLike(styleLike, feature, resolution);
    if (!style) return;

    const isHovered = feature.get('isHovered');
    let styles = Array.isArray(style) ? style : [style];
    const featureType = feature.getGeometry()?.getType();
    // Remove text from point features
    if (featureType === 'MultiPoint' || featureType === 'Point') {
      styles = styles.map((style) => style.clone());
      styles.forEach((style) => style.getText()?.setText(undefined));
    }

    return [
      ...styles,
      // Point geometries available only for projectObjects for now
      new Style({
        zIndex: 10,
        image: new IconStyle({
          opacity: 1,
          src: isHovered
            ? projectObjectClusterPointHover.toString()
            : isFaded
              ? projectObjectPointSmall.toString()
              : projectObjectClusterPoint.toString(),
          anchor: [0.5, 1],
        }),
      }),
    ];
  };
}

export function getDrawViewGeometryCenterIconStyle(
  itemType: 'project' | 'projectObject',
): StyleFunction {
  return function (feature: FeatureLike) {
    const editing = feature.get('editing');
    if (!editing) {
      return getGeometryCenterIconStyle(itemType, feature);
    }
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

export const colorPalette = {
  projectFill: _PROJECT_FILL,
  projectClusterFill: CLUSTER_FILL.project,
  projectObjectFill: _PROJ_OBJ_FILL,
  projectObjectClusterFill: CLUSTER_FILL.projectObject,
};
