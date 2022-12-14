import { css } from '@emotion/react';
import { Paper } from '@mui/material';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import CircleStyle from 'ol/style/Circle';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Style from 'ol/style/Style';
import Text from 'ol/style/Text';
import { useEffect, useMemo } from 'react';
import { ProjectSearchResult } from 'tre-hanna-shared/src/schema/project';

import { MapWrapper } from '@frontend/components/Map/MapWrapper';
import { addFeaturesFromGeoJson, drawStyle } from '@frontend/components/Map/mapInteractions';
import { getProjectSearchParamSetters } from '@frontend/stores/search/project';

const resultMapContainerStyle = css`
  min-height: 600px;
`;

interface Props {
  results?: ProjectSearchResult;
  loading?: boolean;
}

function clusterGeoJSON(clusters?: ProjectSearchResult['clusters']) {
  if (!clusters || clusters.length === 0) {
    return null;
  }

  return {
    type: 'FeatureCollection',
    features: clusters.map((cluster) => ({
      type: 'Feature',
      geometry: JSON.parse(cluster.clusterLocation),
      properties: {
        id: cluster.clusterGeohash,
        clusterCount: cluster.clusterCount,
      },
    })),
  };
}

function getClusterLayer(source: VectorSource) {
  console.log('Creating cluster layer');
  return new VectorLayer({
    source,
    style: function style(feature) {
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
    },
    properties: {
      id: 'clusterResults',
      type: 'vector',
    },
  });
}

function getProjectsGeoJSON(projects?: ProjectSearchResult['projects']) {
  if (!projects || projects.length === 0) {
    return null;
  }

  return {
    type: 'FeatureCollection',
    features: projects.map((p) => {
      const geom = p.geom ? JSON.parse(p.geom) : null;
      return {
        type: 'Feature',
        id: p.id,
        geometry: geom,
        properties: {
          name: p.projectName,
        },
      };
    }),
  };
}

function getProjectsLayer(source: VectorSource) {
  return new VectorLayer({
    source,
    style: new Style({
      fill: new Fill({
        color: drawStyle.fill.color,
      }),
      stroke: new Stroke({
        color: drawStyle.stroke.color,
        width: drawStyle.stroke.width,
      }),
    }),
    properties: {
      id: 'projectResults',
      type: 'vector',
    },
  });
}

export function ResultsMap(props: Props) {
  const setSearchParams = getProjectSearchParamSetters();
  const clusterSource = useMemo(() => new VectorSource({}), []);
  const projectSource = useMemo(() => new VectorSource({}), []);
  const clusterLayer = useMemo(() => getClusterLayer(clusterSource), [clusterSource]);
  const projectLayer = useMemo(() => getProjectsLayer(projectSource), [projectSource]);

  useEffect(() => {
    if (props.loading) {
      return;
    }
    if (!props.results) {
      clusterSource.clear();
      projectSource.clear();
      return;
    } else if (props.results?.clusters?.length > 0) {
      projectSource.clear();
      const geoJson = clusterGeoJSON(props.results.clusters);
      addFeaturesFromGeoJson(clusterSource, geoJson);
    } else {
      clusterSource.clear();
      const geoJson = getProjectsGeoJSON(props.results?.projects);
      addFeaturesFromGeoJson(projectSource, geoJson);
    }
  }, [props.results]);

  return (
    <Paper css={resultMapContainerStyle} elevation={1}>
      <MapWrapper
        loading={props.loading}
        editable={false}
        vectorLayers={[projectLayer, clusterLayer]}
        onMoveEnd={(zoom, extent) => {
          setSearchParams.map({ zoom: Math.floor(zoom), extent });
        }}
      />
    </Paper>
  );
}
