// Enzyme-based test helpers. Only for tests: never import this file from
// library code, or Enzyme and its dependencies end up in the bundle.
import React from 'react';

import { mount } from 'enzyme';

import HiGlassComponent from '../HiGlassComponent';
import { waitForJsonComplete, waitForTilesLoaded } from './wait-helpers';

/**
 * Mount a new HiGlassComponent and unmount the previously visible one.
 *
 * @param {HTMLDivElement | null} prevDiv - A div element to detach and recreate for the component
 * @param {import("enzyme").ReactWrapper<{}, {}, HiGlassComponent> | null} prevHgc
 * @param {Record<string, unknown>} viewConf
 * @param {(value?: unknown) => void} done - The callback to call when the component is fully loaded
 * @param {{ style?: string, bounded?: boolean, extendedDelay?: boolean }} [options]
 */
export const mountHGComponent = (
  prevDiv,
  prevHgc,
  viewConf,
  done,
  options = {},
) => {
  const {
    style = 'width:800px; background-color: lightgreen;',
    bounded = false,
    extendedDelay = false,
  } = options;

  if (prevHgc) {
    prevHgc.unmount();
    prevHgc.detach();
  }

  if (prevDiv) {
    global.document.body.removeChild(prevDiv);
  }

  // console.log('check:', options && options.style)
  // console.log('style:', style, "options:", options, "style", options.style);

  const div = global.document.createElement('div');
  global.document.body.appendChild(div);

  div.setAttribute('style', style);
  div.setAttribute('id', 'simple-hg-component');

  /** @type {import("enzyme").ReactWrapper<{}, {}, HiGlassComponent>} */
  const hgc = mount(
    <HiGlassComponent options={{ bounded }} viewConfig={viewConf} />,
    { attachTo: div },
  );

  hgc.update();

  waitForJsonComplete(() => {
    if (extendedDelay) {
      // Waiting for tiles to be loaded does not always mean
      // that the compoment is mounted (especially if we load the tiles
      // from the filesystem, which is quick). Wait 1000ms to make sure
      // we are really done
      const doneWithDelay = () =>
        setTimeout(() => {
          done();
        }, 1000);

      waitForTilesLoaded(hgc.instance(), doneWithDelay);
    } else {
      waitForTilesLoaded(hgc.instance(), done);
    }
  });

  return /** @type {const} */ ([div, hgc]);
};

// ideally the "await-ers" avoid would be promises (rather than polling)
// and that way `mountHGComponent` would be async by default.
/**
 * @param {HTMLDivElement | null} prevDiv
 * @param {import("enzyme").ReactWrapper<{}, {}, HiGlassComponent> | null} prevHgc
 * @param {Record<string, unknown>} viewConf
 * @param {{ style?: string, bounded?: boolean, extendedDelay?: boolean }} [options]
 * @returns {Promise<[HTMLDivElement, { instance: () => HiGlassComponent }]>}
 */
export async function mountHGComponentAsync(
  prevDiv,
  prevHgc,
  viewConf,
  options,
) {
  /** @type {ReturnType<typeof mountHGComponent>}*/
  let res;
  await new Promise((resolve) => {
    res = mountHGComponent(prevDiv, prevHgc, viewConf, resolve, options);
  });
  // @ts-expect-error We know it's been resolved
  return res;
}
