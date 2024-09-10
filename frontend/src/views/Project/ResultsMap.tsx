import { css } from '@emotion/react';
import { Paper } from '@mui/material';
import { useAtomValue, useSetAtom } from 'jotai';
import { Feature } from 'ol';
import { Geometry } from 'ol/geom';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { useEffect, useMemo } from 'react';

import { MapWrapper } from '@frontend/components/Map/MapWrapper';
import { getProjectObjectGeoJSON } from '@frontend/components/Map/mapFunctions';
import {
  addFeaturesFromGeoJson,
  featuresFromGeoJSON,
} from '@frontend/components/Map/mapInteractions';
import { ProjectColorCodes, clusterStyle } from '@frontend/components/Map/styles';
import {
  getProjectObjectsLayer,
  getProjectsLayer,
  selectedFeatureColorCodeAtom,
} from '@frontend/stores/map';
import { mapAtom } from '@frontend/stores/search/project';
import { useMapInfoBox } from '@frontend/stores/useMapInfoBox';

import { ProjectSearchResult } from '@shared/schema/project';
import { ProjectObjectSearchResult } from '@shared/schema/projectObject/search';

const resultMapContainerStyle = css`
  min-height: 320px;
  position: relative;
  overflow: hidden;
`;

interface Props {
  results?: ProjectSearchResult & { projectObjects?: ProjectObjectSearchResult['projectObjects'] };
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
        clusterProjectIds: cluster.clusterProjectIds,
        projectDistribution: cluster.projectDistribution,
      },
    })),
  };
}

function getClusterLayer(source: VectorSource, projectColorCodes?: ProjectColorCodes) {
  return new VectorLayer({
    source,
    style: (feature, resolution) => clusterStyle(feature, resolution, 'project', projectColorCodes),
    properties: {
      id: 'projectClusterResults',
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
          projectType: p.projectType,
        },
      };
    }),
  };
}

export function ResultsMap(props: Props) {
  const setMap = useSetAtom(mapAtom);
  const { updateInfoBoxWithIntersectingFeatures, isVisible } = useMapInfoBox();
  const clusterSource = useMemo(() => new VectorSource({}), []);
  const projectSource = useMemo(() => new VectorSource({}), []);
  const projectObjectSource = useMemo(() => new VectorSource({}), []);
  const selectedFeatureColorCode = useAtomValue(selectedFeatureColorCodeAtom);

  const clusterLayer = useMemo(
    () => getClusterLayer(clusterSource, selectedFeatureColorCode.projectColorCodes ?? undefined),
    [clusterSource, selectedFeatureColorCode],
  );
  const projectLayer = useMemo(
    () => getProjectsLayer(projectSource, selectedFeatureColorCode.projectColorCodes),
    [projectSource, selectedFeatureColorCode],
  );
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
      projectObjectSource.clear();
      const geoJson = clusterGeoJSON(props.results.clusters);
      addFeaturesFromGeoJson(clusterSource, geoJson);
    } else {
      clusterSource.clear();
      const geoJson = getProjectsGeoJSON(props.results?.projects);
      addFeaturesFromGeoJson(projectSource, geoJson);
    }
  }, [props.results]);

  useEffect(() => {
    if (props.loading) {
      return;
    }
    if (!props.results?.projectObjects || props.results?.clusters?.length > 0) {
      projectObjectSource.clear();
      return;
    } else {
      const geoJson = getProjectObjectGeoJSON(props.results.projectObjects);
      addFeaturesFromGeoJson(projectObjectSource, geoJson);
    }
  }, [props.results?.projectObjects]);

  useEffect(() => {
    if (props.loading || !isVisible || !props.results) return;

    let features: Feature<Geometry>[] = [];

    if (props.results.clusters?.length > 0) {
      const clusterGeojson = clusterGeoJSON(props.results.clusters);
      features = clusterGeojson ? featuresFromGeoJSON(clusterGeojson) : [];
    } else {
      const objectGeojson = getProjectObjectGeoJSON(props.results?.projectObjects);
      const projectGeojson = getProjectsGeoJSON(props.results?.projects);
      features = [
        ...(objectGeojson ? featuresFromGeoJSON(objectGeojson) : []),
        ...(projectGeojson ? featuresFromGeoJSON(projectGeojson) : []),
      ];
    }

    updateInfoBoxWithIntersectingFeatures(features);
  }, [props.results]);

  return (
    <Paper css={resultMapContainerStyle} elevation={1}>
      <MapWrapper
        loading={props.loading}
        vectorLayers={[projectLayer, projectObjectLayer, clusterLayer]}
        onMoveEnd={(zoom, extent) => {
          setMap({ zoom: Math.floor(zoom), extent });
        }}
        projects={props.results?.projects ?? []}
        projectObjects={props.results?.projectObjects ?? []}
        withColorPatternSelect
      />
    </Paper>
  );
}
