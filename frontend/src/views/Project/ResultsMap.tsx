import { css } from '@emotion/react';
import { Paper } from '@mui/material';
import { useSetAtom } from 'jotai';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { useEffect, useMemo } from 'react';

import { MapWrapper } from '@frontend/components/Map/MapWrapper';
import { addFeaturesFromGeoJson } from '@frontend/components/Map/mapInteractions';
import { clusterStyle } from '@frontend/components/Map/styles';
import { getProjectObjectsLayer, getProjectsLayer } from '@frontend/stores/map';
import { mapAtom } from '@frontend/stores/search/project';

import { ProjectSearchResult } from '@shared/schema/project';
import { ProjectObjectSearch } from '@shared/schema/projectObject';

const resultMapContainerStyle = css`
  min-height: 320px;
  flex: 1;
  position: relative;
`;

interface Props {
  results?: ProjectSearchResult;
  loading?: boolean;
  projectObjectResults?: readonly ProjectObjectSearch[] | null;
  projectObjectsLoading?: boolean;
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
        clusterProjectIds: cluster.clusterProjectIds,
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
        id: p.projectId,
        geometry: geom,
        properties: {
          name: p.projectName,
        },
      };
    }),
  };
}

function getProjectObjectGeoJSON(projectObjects?: readonly ProjectObjectSearch[]) {
  if (!projectObjects || projectObjects.length === 0) {
    return null;
  }

  return {
    type: 'FeatureCollection',
    features: projectObjects.map((p) => {
      const geom = p.geom ? JSON.parse(p.geom) : null;
      return {
        type: 'Feature',
        id: p.projectObjectId,
        geometry: geom,
        properties: {
          name: p.objectName,
        },
      };
    }),
  };
}

export function ResultsMap(props: Props) {
  const setMap = useSetAtom(mapAtom);
  const clusterSource = useMemo(() => new VectorSource({}), []);
  const projectSource = useMemo(() => new VectorSource({}), []);
  const projectObjectSource = useMemo(() => new VectorSource({}), []);
  const clusterLayer = useMemo(() => getClusterLayer(clusterSource), [clusterSource]);
  const projectLayer = useMemo(() => getProjectsLayer(projectSource), [projectSource]);
  const projectObjectLayer = useMemo(
    () => getProjectObjectsLayer(projectObjectSource),
    [projectObjectSource],
  );

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

  useEffect(() => {
    if (props.projectObjectsLoading) {
      return;
    }

    if (!props.projectObjectResults) {
      projectObjectSource.clear();
      return;
    } else {
      const geoJson = getProjectObjectGeoJSON(props.projectObjectResults);
      addFeaturesFromGeoJson(projectObjectSource, geoJson);
    }
  }, [props.projectObjectResults]);

  return (
    <Paper css={resultMapContainerStyle} elevation={1}>
      <MapWrapper
        loading={props.loading}
        editable={false}
        vectorLayers={[projectObjectLayer, projectLayer, clusterLayer]}
        onMoveEnd={(zoom, extent) => {
          setMap({ zoom: Math.floor(zoom), extent });
        }}
        projects={props.results?.projects ?? []}
        projectObjects={props.projectObjectResults ?? []}
      />
    </Paper>
  );
}
