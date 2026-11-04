Plugin Track Development
########################

Plugin tracks are tracks which have an external code base but otherwise work
just like normal track. We strongly recommend to develop new types of tracks
as plugin tracks and only add very generic track so the HiGlass core library.

Basic skeleton
==============

A plugin track consist of two nested classes defining a wrapper, which loads
HiGlass specific libraries and the actual track class that is similar to any
other track. In the follow you can see a bare minimum example of this structure.

.. code-block:: javascript

    import { registerTrack } from 'higlass-register';

    const MyPluginTrack = function MyPluginTrack(HGC, ...args) {
      if (!new.target) {
        throw new Error(
          'Uncaught TypeError: Class constructor cannot be invoked without "new"'
        );
      }

      // A tracks you want to extend with your plugin track. You should at the
      // very least extend PixiTrack.
      const { BarTrack } = HGC.tracks;

      // Other libraries, utils, etc. that are provided by HiGlass (HGC)
      const { ... } = HGC.libraries;
      const { ... } = HGC.utils;
      const { ... } = HGC.factories;
      const { ... } = HGC.services;
      const { ... } = HGC.utils;
      const { ... } = HGC.configs;
      const { ... } = HGC.dataFetchers;

      // The version of HiGlass. Can be used to check for compatibility.
      const hgVersion = HGC.VERSION;

      class RangeTrackClass extends HGC.tracks.BarTrack {
        constructor(context, options) {
          super(context, options);

          ...
        }
      }
    }

    const icon = '<svg ...>...</svg>';

    MyPluginTrack.config = {
      type: 'my-track',
      orientation: '1d-horizontal',
      thumbnail: new DOMParser().parseFromString(icon, 'text/xml').documentElement,
      availableOptions: [ myNewOption ],
      defaultOptions: {
        myNewOption: 'default-value'
      },
      optionsInfo: {
        myNewOption: {
          name: "My track specific option",
          value: "option-value"
        }
      }
    };

    // It's important that you register your plugin track
    // with HiGlass otherwise HiGlass will not know about it
    registerTrack({
      name: 'MyPluginTrack',
      track: MyPluginTrack,
      config: MyPluginTrack.config
    });

    export default MyPluginTrack;

The best way to get start implementing a plugin tracks is to take a look at
existing plugin tracks and their code. You can find a list of all officially
supported plugin tracks can be found at
`higlass.io/plugins <http://higlass.io/plugins>`_

In order to make the track display anything interesting you need to extend
the existing rendering methods. To find out how HiGlass renders data please
take a look at some core tracks like ``BarTrack.js``.


Available tracks, libraries, and utils
======================================

Plugin tracks have access to many core tracks, libraries, and internal
utilities.

Please visit the `"available to plugins" page <available_to_plugins.html>`_
for an overview of all available imports that plugin tracks and data fetchers may access.


Handling drags and the mouse wheel
==================================

By default, dragging on a track pans the view and the mouse wheel zooms it.
A track can react to these interactions by implementing the following
optional methods. All coordinates are in track pixels, i.e. relative to the
top-left corner of the track.

``zoomedY(trackY, kMultiplier)``
  Called for a mouse wheel event with the shift key held over a 1D track
  (vertical zoom of the value scale). ``kMultiplier`` is ``2 ** (delta / 500)``,
  where ``delta`` is the event's ``deltaY``, or its ``deltaX`` if ``deltaY``
  is zero (macOS turns shift + wheel into horizontal scrolling). The view is
  not zoomed.

``movedY(dY)``
  Called with the vertical movement when the user drags vertically on a
  horizontal 1D track (or horizontally on a vertical one).

``capturesPointer(trackX, trackY, event)``
  Called for ``mousedown``, ``touchstart`` and ``dblclick`` events. Return
  ``true`` if the track handles the event itself (e.g. a scrollbar that is
  dragged, or a button), so that HiGlass doesn't start panning or zooming the
  view. The track then gets the event and the following ones through PIXI
  interaction, as before.

``wheeled(trackX, trackY, event)``
  Called for wheel events, e.g. to let the track scroll its content. Return
  ``true`` if the track handled the event, so that HiGlass doesn't zoom the
  view (or call ``zoomedY``). The page doesn't scroll either way.

If several tracks are at the event's position (e.g. overlaid tracks), they
are asked in order until one returns ``true``. A horizontal track that is
placed on the left or right side of a view passes these calls on to the
track with ``trackX`` and ``trackY`` swapped, so that they are in the
track's own (unrotated) coordinates.

.. code-block:: javascript

    capturesPointer(trackX, trackY, event) {
      // a scrollbar along the right edge of the track
      return trackX >= this.dimensions[0] - SCROLLBAR_WIDTH;
    }

    wheeled(trackX, trackY, event) {
      if (!event.altKey) return false;
      this.scrollBy(event.deltaY);
      return true;
    }


Displaying custom data modals
=============================

Plugin tracks can implement `getMouseOverHtml` to display data in a tooltip when hovering 
over interesting regions in the track. However, when interaction with this data is desirable 
(e.g. clicking on a link) or a lot of information needs to be displayed, it is more convenient
to show the data in a separate modal. Modals with custom data can be displayed by implementing the method 
`clickDialog` (typically in combination with the `click` method). In a plugin track it could be used the following way:
```
click(relTrackX, relTrackY, evt){
  this.clickedPosition = {
    relX: relTrackX,
    relY: relTrackY
  }
}

clickDialog(){

  if(!this.shouldModalOpen(this.clickedPosition)){
    return null;
  }

  return {
    bodyComponent: MyReactComponent, // this is a React component defined in the plugin track
    bodyProps: propsForMyReactComponent // dict; props that MyReactComponent expects, probably depends on this.clickedPosition
    title: "My Modal title"
  };

}
```
In this example a modal appears when an interesting region in the track has been clicked (determined by the `this.shouldModalOpen` function). The content of the modal
is determined by `MyReactComponent` and its associated props.