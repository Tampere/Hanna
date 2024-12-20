import { css } from '@emotion/react';
import { Paper } from '@mui/material';
import { useSetAtom } from 'jotai';
import { Feature } from 'ol';
import { Geometry } from 'ol/geom';
import VectorSource from 'ol/source/Vector';
import { useEffect, useMemo } from 'react';

import { SearchResultsMap } from '@frontend/components/Map/SearchResultsMap';
import {
  addFeaturesFromGeoJson,
  featuresFromGeoJSON,
} from '@frontend/components/Map/mapInteractions';
import { getClusterLayer, getProjectObjectsLayer, getProjectsLayer } from '@frontend/stores/map';
import { mapAtom } from '@frontend/stores/search/projectObject';
import { useMapInfoBox } from '@frontend/stores/useMapInfoBox';

import { ProjectObjectSearchParentProject } from '@shared/schema/project';
import { ProjectObjectSearchResult } from '@shared/schema/projectObject/search';

const resultMapContainerStyle = css`
  min-height: 320px;
  flex: 1;
  position: relative;
  overflow: hidden;
`;

interface Props {
  projectObjectResults?: ProjectObjectSearchResult;
  projectObjectsLoading?: boolean;
  projects?: ProjectObjectSearchParentProject[];
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
        clusterIndex: cluster.clusterIndex,
      },
    })),
  };
}

function getProjectsGeoJSON(projectObjects?: ProjectObjectSearchResult['projectObjects']) {
  if (!projectObjects || projectObjects.length === 0) {
    return null;
  }

  return {
    type: 'FeatureCollection',
    features: projectObjects.map((p) => {
      const geom = p.project.geom ? JSON.parse(p.project.geom) : null;
      return {
        type: 'Feature',
        id: p.project.projectId,
        geometry: geom,
        properties: {
          name: p.project.projectName,
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
  const { isVisible, updateInfoBoxWithIntersectingFeatures } = useMapInfoBox();
  const clusterSource = useMemo(() => new VectorSource({}), []);
  const projectSource = useMemo(() => new VectorSource({}), []);
  const projectObjectSource = useMemo(() => new VectorSource({}), []);
  const clusterLayer = useMemo(
    () => getClusterLayer(clusterSource, 'projectObject'),
    [clusterSource],
  );
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

  useEffect(() => {
    if (props.projectObjectsLoading || !isVisible || !props.projectObjectResults) return;

    let features: Feature<Geometry>[] = [];

    if (props.projectObjectResults.clusters?.length > 0) {
      const clusterGeojson = clusterGeoJSON(props.projectObjectResults.clusters);
      features = clusterGeojson ? featuresFromGeoJSON(clusterGeojson) : [];
    } else {
      const objectGeojson = getProjectObjectGeoJSON(props.projectObjectResults?.projectObjects);
      const projectGeojson = getProjectsGeoJSON(props.projectObjectResults?.projectObjects);
      features = [
        ...(objectGeojson ? featuresFromGeoJSON(objectGeojson) : []),
        ...(projectGeojson ? featuresFromGeoJSON(projectGeojson) : []),
      ];
    }

    updateInfoBoxWithIntersectingFeatures(features);
  }, [props.projectObjectResults]);

  return (
    <Paper css={resultMapContainerStyle} elevation={1}>
      <SearchResultsMap
        vectorLayers={[projectLayer, projectObjectLayer, clusterLayer]}
        onMoveEnd={(zoom, extent) => {
          setMap({ zoom: Math.floor(zoom), extent });
        }}
        projectObjects={props.projectObjectResults?.projectObjects ?? []}
        projects={props.projects ?? []}
        interactiveLayers={['projectObjects', 'projectObjectClusterResults', 'projects']}
      />
    </Paper>
  );
}
