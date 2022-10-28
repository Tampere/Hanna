import { Projection } from 'ol/proj';
import { register } from 'ol/proj/proj4.js';
import proj4 from 'proj4';

/** Default map projection is EPSG:3857 Web Mercator. Uncommon projections,
 * e.g. EPSG:3067 used in Finland, have to be separately registered to OpenLayers via
 * proj4 -library. proj4 definitions can be found here @see https://epsg.io/3067 under
 * 'Export', 'Proj4js'.
 *
 * General info about projections:
 * @see https://openlayers.org/en/latest/doc/faq.html
 *
 * @public
 * @param   {Object}      projection  # Parameters to create the projection from
 * @return  {Projection}              # ol/Projection from the proj4 library
 */

proj4.defs('EPSG:3067', '+proj=utm +zone=35 +ellps=GRS80 +units=m +no_defs');
register(proj4);
console.log('hep');

export const EPSG3067 = new Projection({
  code: 'EPSG:3067',
  extent: [
    50199.4813825220335275, 5698259.8706227578222752, 2147351.4813825218006968,
    7795411.8706227578222752,
  ],
  units: 'm',
});
