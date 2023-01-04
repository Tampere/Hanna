import { css } from '@emotion/react';
import { Paper } from '@mui/material';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { useEffect, useMemo } from 'react';

import { MapWrapper } from '@frontend/components/Map/MapWrapper';
import { addFeaturesFromGeoJson } from '@frontend/components/Map/mapInteractions';
import { clusterStyle, projectAreaStyle } from '@frontend/components/Map/styles';
import { getProjectSearchParamSetters } from '@frontend/stores/search/project';

import { ProjectSearchResult } from '@shared/schema/project';

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
  return new VectorLayer({
    source,
    style: clusterStyle,
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
    style: projectAreaStyle,
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
