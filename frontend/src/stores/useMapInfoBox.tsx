import { useAtom, useAtomValue } from 'jotai';
import { RESET } from 'jotai/utils';
import { Feature } from 'ol';
import { Geometry } from 'ol/geom';
import { Pixel } from 'ol/pixel';

import { getFeatureItemId, getFeatureItemIds } from '@frontend/components/Map/mapFunctions';
import { activeItemIdAtom, featureSelectorAtom, selectionSourceAtom } from '@frontend/stores/map';

export function useMapInfoBox() {
  const selectionSource = useAtomValue(selectionSourceAtom);
  const [featureSelector, setFeatureSelector] = useAtom(featureSelectorAtom);
  const [activeItemId, setActiveItemId] = useAtom(activeItemIdAtom);

  return {
    /**
     * Uses provided features as source and sets the first item as active and displays it in the info box
     */
    setInfoBox(features: Feature<Geometry>[], position?: Pixel) {
      setActiveItemId(null);
      setFeatureSelector((prev) => ({
        pos: position ?? prev.pos,
        features: features,
      }));

      if (features.length > 0) {
        setActiveItemId(getFeatureItemId(features[0]));
        selectionSource.addFeature(features[0]);
      }
    },
    /**
     * Reset the info box to initial state
     */
    resetInfoBox(withActiveItem = true) {
      if (withActiveItem) setActiveItemId(null);
      setFeatureSelector(RESET);
      selectionSource.clear();
    },
    /**
     * Update the info box to use new features that intersect with previous ones. Optionally update also new infobox position.
     */
    updateInfoBoxWithIntersectingFeatures(newFeatures: Feature<Geometry>[], position?: Pixel) {
      setFeatureSelector((prev) => {
        const prevFeatureItemIds = getFeatureItemIds(prev.features);
        return {
          pos: position ?? prev.pos,
          features: newFeatures
            .filter((newFeature) => {
              const newFeatureItemIds = getFeatureItemIds([newFeature]);
              return newFeatureItemIds.some((newFeatureId) =>
                prevFeatureItemIds.includes(newFeatureId),
              );
            })
            .sort((a) => (getFeatureItemIds([a]).includes(activeItemId) ? -1 : 0)),
        };
      });
      selectionSource.clear();
      if (newFeatures.length > 0) {
        const activeFeature = newFeatures.find((f) =>
          getFeatureItemIds([f]).includes(activeItemId),
        );

        if (activeFeature) {
          selectionSource.addFeature(activeFeature);
        } else {
          setActiveItemId(null);
        }
      }
    },
    isVisible: Boolean(featureSelector?.features?.length > 0 && activeItemId),
  };
}
