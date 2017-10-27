// Copyright (c) 2015 - 2017 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

import Layer from './layer';
import log from '../utils/log';
import {flatten} from './utils/flatten';

export default class CompositeLayer extends Layer {
  constructor(props) {
    super(props);
  }

  get isComposite() {
    return true;
  }

  // initializeState is usually not needed for composite layers
  // Provide empty definition to disable check for missing definition
  initializeState() {
  }

  // called to augment the info object that is bubbled up from a sublayer
  // override Layer.getPickingInfo() because decoding / setting uniform do
  // not apply to a composite layer.
  // @return null to cancel event
  getPickingInfo({info}) {
    return info;
  }

  // Implement to generate sublayers
  renderLayers() {
    return null;
  }

  // Returns props that should be forwarded to children
  // TODO - implement autoforwarding?
  getBaseLayerProps() {
    const {
      opacity, pickable, visible,
      parameters, getPolygonOffset,
      highlightedObjectIndex, autoHighlight, highlightColor,
      coordinateSystem, coordinateOrigin, modelMatrix
    } = this.props;

    return {
      opacity, pickable, visible,
      parameters, getPolygonOffset,
      highlightedObjectIndex, autoHighlight, highlightColor,
      coordinateSystem, coordinateOrigin, modelMatrix
    };
  }

  // Called by layer manager to render sublayers
  _renderLayers({oldContext}) {
    let {subLayers} = this.internalState;

    const updateParams = this._getUpdateParams({oldContext});
    if (this.state.subLayers && !this.shouldUpdateState(updateParams)) {
      log.log(2, `Composite layer reused sublayers ${this}`, this.internalState.subLayers);
    } else {
      subLayers = this.renderLayers();

      // Flatten the returned array, removing any null, undefined or false
      // this allows layers to render sublayers conditionally
      // (see CompositeLayer.renderLayers docs)
      subLayers = flatten(subLayers, {filter: Boolean});

      this.internalState.subLayers = subLayers;
      log.log(2, `Composite layer rendered new sublayers ${this}`, this.internalState.subLayers);
    }

    // populate reference to parent layer (this layer)
    // NOTE: needs to be done even when reusing layers as the parent may have changed
    for (const layer of subLayers) {
      layer.parentLayer = this;
    }
  }

  _getSubLayers() {
    return this.internalState.subLayers;
  }
}
