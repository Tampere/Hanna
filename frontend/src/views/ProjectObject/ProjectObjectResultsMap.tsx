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
import { mapAtom } from '@frontend/stores/search/projectObject';

import { ProjectObjectSearchResult } from '@shared/schema/projectObject';

const resultMapContainerStyle = css`
  min-height: 320px;
  flex: 1;
  position: relative;
`;

interface Props {
  projectObjectResults?: ProjectObjectSearchResult;
  projectObjectsLoading?: boolean;
}

function clusterGeoJSON(clusters?: ProjectObjectSearchResult['clusters']) {
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
        clusterProjectObjectIds: cluster.clusterProjectObjectIds,
      },
    })),
  };
}

function getClusterLayer(source: VectorSource) {
  return new VectorLayer({
    source,
    style: (feature) => clusterStyle(feature, 'projectObject'),
    properties: {
      id: 'projectObjectClusterResults',
      type: 'vector',
    },
  });
}

function getProjectsGeoJSON(projectObjects?: ProjectObjectSearchResult['projectObjects']) {
  if (!projectObjects || projectObjects.length === 0) {
    return null;
  }

  return {
    type: 'FeatureCollection',
    features: projectObjects.map((p) => {
      const geom = p.projectGeom ? JSON.parse(p.projectGeom) : null;
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

function getProjectObjectGeoJSON(projectObjects?: ProjectObjectSearchResult['projectObjects']) {
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

export function ProjectObjectResultsMap(props: Props) {
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
    if (props.projectObjectsLoading) {
      return;
    }

    if (!props.projectObjectResults) {
      clusterSource.clear();
      projectObjectSource.clear();
      projectSource.clear();
      return;
    } else if (props.projectObjectResults?.clusters?.length > 0) {
      projectObjectSource.clear();
      projectSource.clear();
      const geoJson = clusterGeoJSON(props.projectObjectResults.clusters);

      addFeaturesFromGeoJson(clusterSource, geoJson);
    } else {
      clusterSource.clear();
      const geoJson = getProjectObjectGeoJSON(props.projectObjectResults?.projectObjects);
      addFeaturesFromGeoJson(projectObjectSource, geoJson);

      const projectGeoJson = getProjectsGeoJSON(props.projectObjectResults?.projectObjects);
      addFeaturesFromGeoJson(projectSource, projectGeoJson);
    }
  }, [props.projectObjectResults]);

  return (
    <Paper css={resultMapContainerStyle} elevation={1}>
      <MapWrapper
        loading={props.projectObjectsLoading}
        editable={false}
        vectorLayers={[projectObjectLayer, projectLayer, clusterLayer]}
        onMoveEnd={(zoom, extent) => {
          setMap({ zoom: Math.floor(zoom), extent });
        }}
        projectObjects={props.projectObjectResults?.projectObjects ?? []}
        interactiveLayers={['projectObjects', 'projectObjectClusterResults']}
      />
    </Paper>
  );
}
