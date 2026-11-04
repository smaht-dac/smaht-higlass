// @ts-nocheck
import React from 'react';
import { afterEach, beforeEach, describe, expect, inject, it } from 'vitest';

import * as hglib from '../app/scripts/hglib';

import classes from '../app/styles/DraggableDiv.module.scss';

const nextFrame = () => new Promise((resolve) => setTimeout(resolve, 20));

/**
 * Simulate a d3-drag gesture on a resize handle: mousedown on the handle,
 * a few mousemoves on the window (where d3-drag listens) and a mouseup.
 */
async function dragHandle(handle, dx, dy, steps = 3) {
  const rect = handle.getBoundingClientRect();
  const x0 = rect.left + rect.width / 2;
  const y0 = rect.top + rect.height / 2;
  const init = (i) => ({
    bubbles: true,
    cancelable: true,
    view: window,
    button: 0,
    clientX: x0 + (dx * i) / steps,
    clientY: y0 + (dy * i) / steps,
  });

  handle.dispatchEvent(new MouseEvent('mousedown', init(0)));
  await nextFrame();
  for (let i = 1; i <= steps; i++) {
    window.dispatchEvent(new MouseEvent('mousemove', init(i)));
    await nextFrame();
  }
  window.dispatchEvent(new MouseEvent('mouseup', init(steps)));
  await nextFrame();
}

/** The div of a MoveableTrack, which holds the track's rendered size */
const trackDivOf = (handle) => handle.parentElement.parentElement;

const getTrack = (api, uid) => {
  const { tracks } = api.getViewConfig().views[0];
  return Object.values(tracks)
    .flat()
    .find((track) => track.uid === uid);
};

const viewConfig = {
  editable: true,
  views: [
    {
      uid: 'v',
      layout: { w: 12, h: 6, x: 0, y: 0 },
      initialXDomain: [0, 1e6],
      tracks: {
        top: [
          { uid: 'a', type: 'horizontal-rule', height: 100, y: 0.5 },
          { uid: 'b', type: 'horizontal-rule', height: 100, y: 0.5 },
        ],
        left: [{ uid: 'l', type: 'vertical-rule', width: 100, x: 0.5 }],
        right: [{ uid: 'r', type: 'vertical-rule', width: 100, x: 0.5 }],
        bottom: [{ uid: 'btm', type: 'horizontal-rule', height: 100, y: 0.5 }],
        center: [],
        whole: [],
      },
    },
  ],
};

// This file also runs in the `react18` vitest project (see vite.config.mjs),
// where `viewer()` mounts with `createRoot` and React batches the `setState`
// calls made in d3-drag's native event handlers.
describe(`Track resizing with React ${React.version}`, () => {
  let div = null;
  let api = null;

  beforeEach(async () => {
    div = document.createElement('div');
    Object.assign(div.style, { width: '1000px', height: '800px' });
    document.body.append(div);
    api = await hglib.viewer(div, structuredClone(viewConfig), {
      bounded: true,
    });
    await nextFrame();
  });

  it('uses the React version of the test project', () => {
    expect(React.version.split('.')[0]).toBe(inject('reactMajor'));
  });

  afterEach(() => {
    api.destroy();
    div.remove();
  });

  it('resizes a top track with its bottom handle', async () => {
    const handles = div.querySelectorAll(
      `.${classes['bottom-draggable-handle']}`,
    );
    expect(handles.length).toBe(2);
    const handle = handles[1]; // track `b`

    await dragHandle(handle, 0, 50);

    expect(trackDivOf(handle).style.height).toBe('150px');
    expect(getTrack(api, 'b').height).toBe(150);
    expect(getTrack(api, 'a').height).toBe(100);
  });

  it('resizes a left track with its right handle', async () => {
    const handle = div.querySelector(`.${classes['right-draggable-handle']}`);

    await dragHandle(handle, 40, 0);

    expect(trackDivOf(handle).style.width).toBe('140px');
    expect(getTrack(api, 'l').width).toBe(140);
  });

  it('resizes a right track with its left handle', async () => {
    const handle = div.querySelector(`.${classes['left-draggable-handle']}`);

    await dragHandle(handle, -40, 0);

    expect(trackDivOf(handle).style.width).toBe('140px');
    expect(getTrack(api, 'r').width).toBe(140);
  });

  it('resizes a bottom track with its top handle', async () => {
    const handle = div.querySelector(`.${classes['top-draggable-handle']}`);

    await dragHandle(handle, 0, -30);

    expect(trackDivOf(handle).style.height).toBe('130px');
    expect(getTrack(api, 'btm').height).toBe(130);
  });
});
