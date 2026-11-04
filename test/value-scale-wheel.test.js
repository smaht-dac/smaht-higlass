// @ts-nocheck
import { describe, expect, vi } from 'vitest';

import { getTrackRenderer } from '../app/scripts/utils';

import { createHiGlassTestApi } from './utils/create-element-and-api';

const viewConfig = {
  views: [
    {
      uid: 'v',
      initialXDomain: [0, 1e6],
      tracks: {
        top: [{ uid: 't', type: 'top-axis', height: 100 }],
      },
    },
  ],
};

const it = createHiGlassTestApi(viewConfig);

/**
 * Dispatch a wheel event on the view's event overlay, centered on a track,
 * the way a user's wheel event arrives.
 */
function wheelOverTrack(api, trackUid, init) {
  const trackRenderer = getTrackRenderer(api.getComponent(), 'v');
  const track = trackRenderer.getTrackObject(trackUid);
  const canvasRect = api.getComponent().canvasElement.getBoundingClientRect();
  const event = new WheelEvent('wheel', {
    bubbles: true,
    cancelable: true,
    view: window,
    clientX: canvasRect.left + track.position[0] + track.dimensions[0] / 2,
    clientY: canvasRect.top + track.position[1] + track.dimensions[1] / 2,
    ...init,
  });
  trackRenderer.eventTracker.dispatchEvent(event);
  return { trackRenderer, track };
}

describe('Shift + wheel over a 1D track (value scale zoom)', () => {
  it('calls zoomedY for a wheel with only deltaX (macOS)', ({ api }) => {
    const trackRenderer = getTrackRenderer(api.getComponent(), 'v');
    const track = trackRenderer.getTrackObject('t');
    const zoomedY = vi.spyOn(track, 'zoomedY');
    const xDomain = api.getLocation('v').xDomain;

    wheelOverTrack(api, 't', { deltaX: 100, deltaY: 0, shiftKey: true });

    expect(zoomedY).toHaveBeenCalledTimes(1);
    expect(zoomedY.mock.calls[0][1]).toBeCloseTo(2 ** (100 / 500));
    expect(api.getLocation('v').xDomain).toEqual(xDomain);
  });

  it('calls zoomedY for a wheel with deltaY', ({ api }) => {
    const trackRenderer = getTrackRenderer(api.getComponent(), 'v');
    const track = trackRenderer.getTrackObject('t');
    const zoomedY = vi.spyOn(track, 'zoomedY');
    const xDomain = api.getLocation('v').xDomain;

    wheelOverTrack(api, 't', { deltaX: 0, deltaY: 100, shiftKey: true });

    expect(zoomedY).toHaveBeenCalledTimes(1);
    expect(zoomedY.mock.calls[0][1]).toBeCloseTo(2 ** (100 / 500));
    expect(api.getLocation('v').xDomain).toEqual(xDomain);
  });

  it('ignores a wheel with only deltaX without shift', ({ api }) => {
    const trackRenderer = getTrackRenderer(api.getComponent(), 'v');
    const track = trackRenderer.getTrackObject('t');
    const zoomedY = vi.spyOn(track, 'zoomedY');
    const xDomain = api.getLocation('v').xDomain;

    wheelOverTrack(api, 't', { deltaX: 100, deltaY: 0 });

    expect(zoomedY).not.toHaveBeenCalled();
    expect(api.getLocation('v').xDomain).toEqual(xDomain);
  });
});
