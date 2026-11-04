// @ts-nocheck
import clsx from 'clsx';
import { drag } from 'd3-drag';
import { pointer, select } from 'd3-selection';
import PropTypes from 'prop-types';
import React from 'react';

import { THEME_DARK } from './configs';
import withTheme from './hocs/with-theme';

import classes from '../styles/DraggableDiv.module.scss';

class DraggableDiv extends React.Component {
  constructor(props) {
    super(props);

    this.dragTopRight = drag()
      .on('start', this.dragStart.bind(this))
      .on('drag', this.dragTopRightFunc.bind(this));
    this.dragTopLeft = drag()
      .on('start', this.dragStart.bind(this))
      .on('drag', this.dragTopLeftFunc.bind(this));
    this.dragBottomRight = drag()
      .on('start', this.dragStart.bind(this))
      .on('drag', this.dragBottomRightFunc.bind(this));
    this.dragBottomLeft = drag()
      .on('start', this.dragStart.bind(this))
      .on('drag', this.dragBottomLeftFunc.bind(this));

    this.dragBottom = drag()
      .on('start', this.dragStart.bind(this))
      .on('drag', this.dragBottomFunc.bind(this));
    this.dragTop = drag()
      .on('start', this.dragStart.bind(this))
      .on('drag', this.dragTopFunc.bind(this));
    this.dragLeft = drag()
      .on('start', this.dragStart.bind(this))
      .on('drag', this.dragLeftFunc.bind(this));
    this.dragRight = drag()
      .on('start', this.dragStart.bind(this))
      .on('drag', this.dragRightFunc.bind(this));

    this.minWidth = 10;
    this.minHeight = 10;
    this.bottomHandleWidth = 20;

    this.state = {
      uid: this.props.uid,
      width: this.props.width,
      height: this.props.height,
      top: this.props.top,
      left: this.props.left,
    };

    this.domBody = select('body').node();
  }

  /* -------------------------- Life Cycle Methods -------------------------- */

  componentDidMount() {
    select(this.bottomHandle).call(this.dragBottom);
    select(this.topHandle).call(this.dragTop);

    select(this.leftHandle).call(this.dragLeft);
    select(this.rightHandle).call(this.dragRight);
  }

  UNSAFE_componentWillReceiveProps(newProps) {
    // Only sync with props that actually changed, so that a re-render with
    // the old size (e.g. during a drag) doesn't reset the size being dragged.
    if (newProps.width !== this.props.width) {
      this.setState({ width: newProps.width });
    }

    if (newProps.height !== this.props.height) {
      this.setState({ height: newProps.height });
    }
  }

  /* ---------------------------- Custom Methods ---------------------------- */

  dragBottomFunc(event) {
    const ms = pointer(event, this.domBody);

    let newHeight = this.dragStartHeight + (ms[1] - this.dragStartMousePos[1]);
    newHeight = newHeight > this.minHeight ? newHeight : this.minHeight;

    const newState = { height: newHeight };

    this.setState(newState);

    event.sourceEvent.stopPropagation();
    this.sizeChanged(newState);
  }

  dragLeftFunc(event) {
    const ms = pointer(event, this.domBody);

    let newWidth = this.dragStartWidth - (ms[0] - this.dragStartMousePos[0]);
    newWidth = newWidth > this.minWidth ? newWidth : this.minWidth;

    let newLeft = this.dragStartLeft + ms[0] - this.dragStartMousePos[0];
    newLeft =
      newWidth > this.minWidth
        ? newLeft
        : this.dragStartLeft + this.dragStartWidth - this.minWidth;

    const newState = {
      left: newLeft,
      width: newWidth,
    };

    this.setState(newState);

    event.sourceEvent.stopPropagation();
    this.sizeChanged(newState);
  }

  dragTopFunc(event) {
    const ms = pointer(event, this.domBody);

    let newHeight = this.dragStartHeight - (ms[1] - this.dragStartMousePos[1]);
    newHeight = newHeight > this.minHeight ? newHeight : this.minHeight;

    let newTop = this.dragStartTop + ms[1] - this.dragStartMousePos[1];
    newTop =
      newHeight > this.minHeight
        ? newTop
        : this.dragStartTop + this.dragStartHeight - this.minHeight;

    const newState = {
      top: newTop,
      height: newHeight,
    };

    this.setState(newState);

    event.sourceEvent.stopPropagation();
    this.sizeChanged(newState);
  }

  dragRightFunc(event) {
    const ms = pointer(event, this.domBody);

    let newWidth = this.dragStartWidth + (ms[0] - this.dragStartMousePos[0]);
    newWidth = newWidth > this.minWidth ? newWidth : this.minWidth;

    const newState = {
      width: newWidth,
    };

    this.setState(newState);

    event.sourceEvent.stopPropagation();
    this.sizeChanged(newState);
  }

  dragBottomLeftFunc(event) {
    const ms = pointer(event, this.domBody);

    let newHeight = this.dragStartHeight + (ms[1] - this.dragStartMousePos[1]);
    newHeight = newHeight > this.minHeight ? newHeight : this.minHeight;

    let newWidth = this.dragStartWidth - (ms[0] - this.dragStartMousePos[0]);
    newWidth = newWidth > this.minWidth ? newWidth : this.minWidth;

    let newLeft = this.dragStartLeft + ms[0] - this.dragStartMousePos[0];
    newLeft =
      newWidth > this.minWidth
        ? newLeft
        : this.dragStartLeft + this.dragStartWidth - this.minWidth;

    const newState = {
      left: newLeft,
      width: newWidth,
      height: newHeight,
    };

    this.setState(newState);

    event.sourceEvent.stopPropagation();
    this.sizeChanged(newState);
  }

  dragBottomRightFunc(event) {
    const ms = pointer(event, this.domBody);

    let newWidth = this.dragStartWidth + (ms[0] - this.dragStartMousePos[0]);
    newWidth = newWidth > this.minWidth ? newWidth : this.minWidth;

    let newHeight = this.dragStartHeight + (ms[1] - this.dragStartMousePos[1]);
    newHeight = newHeight > this.minHeight ? newHeight : this.minHeight;

    const newState = {
      width: newWidth,
      height: newHeight,
    };

    this.setState(newState);

    event.sourceEvent.stopPropagation();
    this.sizeChanged(newState);
  }

  dragTopRightFunc(event) {
    const ms = pointer(event, this.domBody);

    let newHeight = this.dragStartHeight - (ms[1] - this.dragStartMousePos[1]);
    newHeight = newHeight > this.minHeight ? newHeight : this.minHeight;

    let newTop = this.dragStartTop + ms[1] - this.dragStartMousePos[1];
    newTop =
      newHeight > this.minHeight
        ? newTop
        : this.dragStartTop + this.dragStartHeight - this.minHeight;

    let newWidth = this.dragStartWidth + (ms[0] - this.dragStartMousePos[0]);
    newWidth = newWidth > this.minWidth ? newWidth : this.minWidth;

    const newState = {
      top: newTop,
      width: newWidth,
      height: newHeight,
    };

    this.setState(newState);

    event.sourceEvent.stopPropagation();
    this.sizeChanged(newState);
  }

  dragTopLeftFunc(event) {
    const ms = pointer(event, this.domBody);

    let newWidth = this.dragStartWidth - (ms[0] - this.dragStartMousePos[0]);
    newWidth = newWidth > this.minWidth ? newWidth : this.minWidth;

    let newLeft = this.dragStartLeft + ms[0] - this.dragStartMousePos[0];
    newLeft =
      newWidth > this.minWidth
        ? newLeft
        : this.dragStartLeft + this.dragStartWidth - this.minWidth;

    let newHeight = this.dragStartHeight - (ms[1] - this.dragStartMousePos[1]);
    newHeight = newHeight > this.minHeight ? newHeight : this.minHeight;

    let newTop = this.dragStartTop + ms[1] - this.dragStartMousePos[1];
    newTop =
      newHeight > this.minHeight
        ? newTop
        : this.dragStartTop + this.dragStartHeight - this.minHeight;

    const newState = {
      top: newTop,
      left: newLeft,
      width: newWidth,
      height: newHeight,
    };

    this.setState(newState);

    event.sourceEvent.stopPropagation();

    this.sizeChanged(newState);
  }

  dragStart(event) {
    this.dragStartMousePos = pointer(event, this.domBody);

    this.dragStartWidth = this.state.width;
    this.dragStartHeight = this.state.height;

    this.dragStartTop = this.state.top;
    this.dragStartLeft = this.state.left;

    event.sourceEvent.stopPropagation();
  }

  /**
   * Report the new size to the parent.
   *
   * `newState` is passed explicitly rather than read from `this.state`
   * because with React 18's `createRoot`, `setState` calls in native (d3-drag)
   * event handlers are batched, so `this.state` would still hold the old size.
   */
  sizeChanged(newState) {
    if (this.props.sizeChanged) {
      this.props.sizeChanged({ ...this.state, ...newState });
    }
  }

  rotateClicked() {
    this.props.trackRotated(this.state.uid);
  }

  closeClicked() {
    this.props.trackClosed(this.state.uid);
  }

  /* ------------------------------ Rendering ------------------------------- */

  render() {
    const dragColor = this.props.theme === THEME_DARK ? 'white' : 'black';

    const divStyle = {
      top: this.state.top,
      left: this.state.left,
      width: this.state.width,
      height: this.state.height,
      opacity: this.props.opacity,
    };

    const resizeWidth = 24;
    const resizeHeight = 24;

    const horizStyle = {
      left: this.state.width / 2 - resizeWidth / 2,
      width: resizeWidth,
    };

    const vertStyle = {
      top: this.state.height / 2 - resizeHeight / 2,
      height: resizeHeight,
    };

    const styles = {
      bottom: { ...horizStyle, bottom: 1 },
      top: { ...horizStyle, top: 1 },
      left: { ...vertStyle, left: 1 },
      right: { ...vertStyle, right: 1 },
    };

    const resizeHandles = [...this.props.resizeHandles].map((x) => (
      <div
        key={x}
        ref={(c) => {
          this[`${x}Handle`] = c;
        }}
        className={classes[`${x}-draggable-handle`]}
        style={styles[x]}
        title="Resize track"
      >
        <div
          className={classes[`${x}-draggable-handle-grabber`]}
          style={{ borderColor: dragColor }}
        />
      </div>
    ));

    return (
      <div
        ref={(c) => {
          this.divContainer = c;
        }}
        className={clsx(this.props.className, classes['draggable-div'])}
        style={divStyle}
      >
        {resizeHandles}
      </div>
    );
  }
}

DraggableDiv.propTypes = {
  className: PropTypes.string,
  height: PropTypes.number,
  left: PropTypes.number,
  opacity: PropTypes.number,
  resizeHandles: PropTypes.object,
  sizeChanged: PropTypes.func,
  top: PropTypes.number,
  trackClosed: PropTypes.func,
  trackRotated: PropTypes.func,
  uid: PropTypes.string,
  width: PropTypes.number,
  theme: PropTypes.symbol,
};

export default withTheme(DraggableDiv);
