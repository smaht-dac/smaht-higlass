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
        top: [
          // gets `capturesPointer` and `wheeled` below
          { uid: 'a', type: 'top-axis', height: 100 },
          // without the methods
          { uid: 'b', type: 'top-axis', height: 100 },
        ],
      },
    },
  ],
};

const it = createHiGlassTestApi(viewConfig);

const SCROLLBAR_WIDTH = 20;

/**
 * Give track `a` a "scrollbar" in its right 20 px that takes drags, and let it
 * take wheel events with the alt key.
 */
function addMethods(track) {
  track.capturesPointer = vi.fn(
    (trackX) => trackX >= track.dimensions[0] - SCROLLBAR_WIDTH,
  );
  track.wheeled = vi.fn((trackX, trackY, event) => event.altKey);
}

function setup(api) {
  const trackRenderer = getTrackRenderer(api.getComponent(), 'v');
  const canvasRect = api.getComponent().canvasElement.getBoundingClientRect();
  const trackA = trackRenderer.getTrackObject('a');
  addMethods(trackA);

  /** Client coordinates of a point in a track (in track pixels) */
  const clientPos = (track, trackX, trackY) => [
    canvasRect.left + track.position[0] + trackX,
    canvasRect.top + track.position[1] + trackY,
  ];

  return {
    trackRenderer,
    trackA,
    trackB: trackRenderer.getTrackObject('b'),
    clientPos,
    xDomain: () => api.getLocation('v').xDomain,
  };
}

/**
 * A drag the way a user's arrives: mousedown on the view's event overlay,
 * mousemove and mouseup on the window (where d3-zoom listens during a drag).
 */
function drag(trackRenderer, [x, y], dx) {
  const init = (clientX) => ({
    bubbles: true,
    cancelable: true,
    view: window,
    button: 0,
    clientX,
    clientY: y,
  });
  trackRenderer.eventTracker.dispatchEvent(
    new MouseEvent('mousedown', init(x)),
  );
  window.dispatchEvent(new MouseEvent('mousemove', init(x + dx / 2)));
  window.dispatchEvent(new MouseEvent('mousemove', init(x + dx)));
  window.dispatchEvent(new MouseEvent('mouseup', init(x + dx)));
}

function wheel(trackRenderer, [x, y], init) {
  const event = new WheelEvent('wheel', {
    bubbles: true,
    cancelable: true,
    view: window,
    clientX: x,
    clientY: y,
    deltaY: -100,
    ...init,
  });
  trackRenderer.eventTracker.dispatchEvent(event);
  return event;
}

describe('Tracks taking pointer and wheel events', () => {
  it("doesn't pan when the track captures the drag", ({ api }) => {
    const { trackRenderer, trackA, clientPos, xDomain } = setup(api);
    const before = xDomain();
    const width = trackA.dimensions[0];

    drag(trackRenderer, clientPos(trackA, width - 10, 50), -50);

    expect(xDomain()).toEqual(before);
    expect(trackA.capturesPointer).toHaveBeenCalledTimes(1);
    const [trackX, trackY, event] = trackA.capturesPointer.mock.calls[0];
    expect(trackX).toBeGreaterThanOrEqual(width - SCROLLBAR_WIDTH);
    expect(trackX).toBeLessThanOrEqual(width);
    expect(trackY).toBeCloseTo(50, 0);
    expect(event.type).toBe('mousedown');
  });

  it('pans when the track does not capture the drag', ({ api }) => {
    const { trackRenderer, trackA, clientPos, xDomain } = setup(api);
    const before = xDomain();

    drag(trackRenderer, clientPos(trackA, 100, 50), -50);

    expect(trackA.capturesPointer).toHaveBeenCalledTimes(1);
    expect(trackA.capturesPointer.mock.results[0].value).toBe(false);
    expect(xDomain()[0]).toBeGreaterThan(before[0]);
  });

  it("doesn't zoom when the track takes the wheel", ({ api }) => {
    const { trackRenderer, trackA, clientPos, xDomain } = setup(api);
    const before = xDomain();

    const event = wheel(trackRenderer, clientPos(trackA, 100, 30), {
      altKey: true,
    });

    expect(trackA.wheeled).toHaveBeenCalledTimes(1);
    const [trackX, trackY, wheelEvent] = trackA.wheeled.mock.calls[0];
    expect(trackX).toBeCloseTo(100, 0);
    expect(trackY).toBeCloseTo(30, 0);
    expect(wheelEvent.type).toBe('wheel');
    expect(wheelEvent.altKey).toBe(true);
    expect(xDomain()).toEqual(before);
    // the page still doesn't scroll
    expect(event.defaultPrevented).toBe(true);
  });

  it('zooms when the track does not take the wheel', ({ api }) => {
    const { trackRenderer, trackA, clientPos, xDomain } = setup(api);
    const before = xDomain();

    wheel(trackRenderer, clientPos(trackA, 100, 30));

    expect(trackA.wheeled).toHaveBeenCalledTimes(1);
    expect(trackA.wheeled.mock.results[0].value).toBe(false);
    expect(xDomain()[1] - xDomain()[0]).toBeLessThan(before[1] - before[0]);
  });

  it('pans and zooms as before over a track without the methods', ({ api }) => {
    const { trackRenderer, trackA, trackB, clientPos, xDomain } = setup(api);
    const width = trackB.dimensions[0];

    const beforeDrag = xDomain();
    drag(trackRenderer, clientPos(trackB, width - 10, 50), -50);
    expect(xDomain()[0]).toBeGreaterThan(beforeDrag[0]);

    const beforeWheel = xDomain();
    wheel(trackRenderer, clientPos(trackB, 100, 50), { altKey: true });
    expect(xDomain()[1] - xDomain()[0]).toBeLessThan(
      beforeWheel[1] - beforeWheel[0],
    );

    expect(trackA.capturesPointer).not.toHaveBeenCalled();
    expect(trackA.wheeled).not.toHaveBeenCalled();
  });
});

const leftViewConfig = {
  views: [
    {
      uid: 'v',
      initialXDomain: [0, 1e6],
      initialYDomain: [0, 1e6],
      tracks: {
        // a horizontal track on the left is wrapped in a LeftTrackModifier
        // (same tileset as in left-track-modifier.test.js)
        left: [
          {
            uid: 'l',
            type: 'horizontal-bar',
            server: '//higlass.io/api/v1',
            tilesetUid: 'aVKtyKdXRS-pexA2DVdQ1Q',
            width: 100,
          },
        ],
      },
    },
  ],
};

const itLeft = createHiGlassTestApi(leftViewConfig);

describe('Tracks taking events on the left', () => {
  itLeft('passes swapped coordinates to the original track', ({ api }) => {
    const trackRenderer = getTrackRenderer(api.getComponent(), 'v');
    const canvasRect = api.getComponent().canvasElement.getBoundingClientRect();
    const modifier = trackRenderer.getTrackObject('l');
    const { originalTrack } = modifier;
    expect(originalTrack).toBeDefined();
    originalTrack.wheeled = vi.fn(() => true);
    const yDomain = api.getLocation('v').yDomain;

    wheel(trackRenderer, [
      canvasRect.left + modifier.position[0] + 30,
      canvasRect.top + modifier.position[1] + 150,
    ]);

    expect(originalTrack.wheeled).toHaveBeenCalledTimes(1);
    const [trackX, trackY] = originalTrack.wheeled.mock.calls[0];
    expect(trackX).toBeCloseTo(150, 0);
    expect(trackY).toBeCloseTo(30, 0);
    expect(api.getLocation('v').yDomain).toEqual(yDomain);
  });
});
