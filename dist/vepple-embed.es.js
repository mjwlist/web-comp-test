function noop$5() {
}
function is_promise(value) {
  return value && typeof value === "object" && typeof value.then === "function";
}
function run(fn) {
  return fn();
}
function blank_object() {
  return Object.create(null);
}
function run_all(fns) {
  fns.forEach(run);
}
function is_function(thing) {
  return typeof thing === "function";
}
function safe_not_equal(a, b) {
  return a != a ? b == b : a !== b || (a && typeof a === "object" || typeof a === "function");
}
let src_url_equal_anchor;
function src_url_equal(element_src, url) {
  if (!src_url_equal_anchor) {
    src_url_equal_anchor = document.createElement("a");
  }
  src_url_equal_anchor.href = url;
  return element_src === src_url_equal_anchor.href;
}
function is_empty(obj) {
  return Object.keys(obj).length === 0;
}
function append(target, node) {
  target.appendChild(node);
}
function insert(target, node, anchor) {
  target.insertBefore(node, anchor || null);
}
function detach(node) {
  node.parentNode.removeChild(node);
}
function element(name) {
  return document.createElement(name);
}
function text(data) {
  return document.createTextNode(data);
}
function space() {
  return text(" ");
}
function empty() {
  return text("");
}
function attr(node, attribute, value) {
  if (value == null)
    node.removeAttribute(attribute);
  else if (node.getAttribute(attribute) !== value)
    node.setAttribute(attribute, value);
}
function children(element2) {
  return Array.from(element2.childNodes);
}
function set_style(node, key, value, important) {
  if (value === null) {
    node.style.removeProperty(key);
  } else {
    node.style.setProperty(key, value, important ? "important" : "");
  }
}
function attribute_to_object(attributes) {
  const result = {};
  for (const attribute of attributes) {
    result[attribute.name] = attribute.value;
  }
  return result;
}
let current_component;
function set_current_component(component) {
  current_component = component;
}
function get_current_component() {
  if (!current_component)
    throw new Error("Function called outside component initialization");
  return current_component;
}
function onMount(fn) {
  get_current_component().$$.on_mount.push(fn);
}
const dirty_components = [];
const binding_callbacks = [];
const render_callbacks = [];
const flush_callbacks = [];
const resolved_promise = Promise.resolve();
let update_scheduled = false;
function schedule_update() {
  if (!update_scheduled) {
    update_scheduled = true;
    resolved_promise.then(flush);
  }
}
function add_render_callback(fn) {
  render_callbacks.push(fn);
}
const seen_callbacks = new Set();
let flushidx = 0;
function flush() {
  const saved_component = current_component;
  do {
    while (flushidx < dirty_components.length) {
      const component = dirty_components[flushidx];
      flushidx++;
      set_current_component(component);
      update(component.$$);
    }
    set_current_component(null);
    dirty_components.length = 0;
    flushidx = 0;
    while (binding_callbacks.length)
      binding_callbacks.pop()();
    for (let i2 = 0; i2 < render_callbacks.length; i2 += 1) {
      const callback = render_callbacks[i2];
      if (!seen_callbacks.has(callback)) {
        seen_callbacks.add(callback);
        callback();
      }
    }
    render_callbacks.length = 0;
  } while (dirty_components.length);
  while (flush_callbacks.length) {
    flush_callbacks.pop()();
  }
  update_scheduled = false;
  seen_callbacks.clear();
  set_current_component(saved_component);
}
function update($$) {
  if ($$.fragment !== null) {
    $$.update();
    run_all($$.before_update);
    const dirty = $$.dirty;
    $$.dirty = [-1];
    $$.fragment && $$.fragment.p($$.ctx, dirty);
    $$.after_update.forEach(add_render_callback);
  }
}
const outroing = new Set();
let outros;
function group_outros() {
  outros = {
    r: 0,
    c: [],
    p: outros
  };
}
function check_outros() {
  if (!outros.r) {
    run_all(outros.c);
  }
  outros = outros.p;
}
function transition_in(block, local) {
  if (block && block.i) {
    outroing.delete(block);
    block.i(local);
  }
}
function transition_out(block, local, detach2, callback) {
  if (block && block.o) {
    if (outroing.has(block))
      return;
    outroing.add(block);
    outros.c.push(() => {
      outroing.delete(block);
      if (callback) {
        if (detach2)
          block.d(1);
        callback();
      }
    });
    block.o(local);
  }
}
function handle_promise(promise, info) {
  const token = info.token = {};
  function update2(type2, index, key, value) {
    if (info.token !== token)
      return;
    info.resolved = value;
    let child_ctx = info.ctx;
    if (key !== void 0) {
      child_ctx = child_ctx.slice();
      child_ctx[key] = value;
    }
    const block = type2 && (info.current = type2)(child_ctx);
    let needs_flush = false;
    if (info.block) {
      if (info.blocks) {
        info.blocks.forEach((block2, i2) => {
          if (i2 !== index && block2) {
            group_outros();
            transition_out(block2, 1, 1, () => {
              if (info.blocks[i2] === block2) {
                info.blocks[i2] = null;
              }
            });
            check_outros();
          }
        });
      } else {
        info.block.d(1);
      }
      block.c();
      transition_in(block, 1);
      block.m(info.mount(), info.anchor);
      needs_flush = true;
    }
    info.block = block;
    if (info.blocks)
      info.blocks[index] = block;
    if (needs_flush) {
      flush();
    }
  }
  if (is_promise(promise)) {
    const current_component2 = get_current_component();
    promise.then((value) => {
      set_current_component(current_component2);
      update2(info.then, 1, info.value, value);
      set_current_component(null);
    }, (error) => {
      set_current_component(current_component2);
      update2(info.catch, 2, info.error, error);
      set_current_component(null);
      if (!info.hasCatch) {
        throw error;
      }
    });
    if (info.current !== info.pending) {
      update2(info.pending, 0);
      return true;
    }
  } else {
    if (info.current !== info.then) {
      update2(info.then, 1, info.value, promise);
      return true;
    }
    info.resolved = promise;
  }
}
function update_await_block_branch(info, ctx, dirty) {
  const child_ctx = ctx.slice();
  const { resolved } = info;
  if (info.current === info.then) {
    child_ctx[info.value] = resolved;
  }
  if (info.current === info.catch) {
    child_ctx[info.error] = resolved;
  }
  info.block.p(child_ctx, dirty);
}
function mount_component(component, target, anchor, customElement) {
  const { fragment, on_mount, on_destroy, after_update } = component.$$;
  fragment && fragment.m(target, anchor);
  if (!customElement) {
    add_render_callback(() => {
      const new_on_destroy = on_mount.map(run).filter(is_function);
      if (on_destroy) {
        on_destroy.push(...new_on_destroy);
      } else {
        run_all(new_on_destroy);
      }
      component.$$.on_mount = [];
    });
  }
  after_update.forEach(add_render_callback);
}
function destroy_component(component, detaching) {
  const $$ = component.$$;
  if ($$.fragment !== null) {
    run_all($$.on_destroy);
    $$.fragment && $$.fragment.d(detaching);
    $$.on_destroy = $$.fragment = null;
    $$.ctx = [];
  }
}
function make_dirty(component, i2) {
  if (component.$$.dirty[0] === -1) {
    dirty_components.push(component);
    schedule_update();
    component.$$.dirty.fill(0);
  }
  component.$$.dirty[i2 / 31 | 0] |= 1 << i2 % 31;
}
function init(component, options, instance2, create_fragment2, not_equal, props, append_styles, dirty = [-1]) {
  const parent_component = current_component;
  set_current_component(component);
  const $$ = component.$$ = {
    fragment: null,
    ctx: null,
    props,
    update: noop$5,
    not_equal,
    bound: blank_object(),
    on_mount: [],
    on_destroy: [],
    on_disconnect: [],
    before_update: [],
    after_update: [],
    context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
    callbacks: blank_object(),
    dirty,
    skip_bound: false,
    root: options.target || parent_component.$$.root
  };
  append_styles && append_styles($$.root);
  let ready = false;
  $$.ctx = instance2 ? instance2(component, options.props || {}, (i2, ret, ...rest) => {
    const value = rest.length ? rest[0] : ret;
    if ($$.ctx && not_equal($$.ctx[i2], $$.ctx[i2] = value)) {
      if (!$$.skip_bound && $$.bound[i2])
        $$.bound[i2](value);
      if (ready)
        make_dirty(component, i2);
    }
    return ret;
  }) : [];
  $$.update();
  ready = true;
  run_all($$.before_update);
  $$.fragment = create_fragment2 ? create_fragment2($$.ctx) : false;
  if (options.target) {
    if (options.hydrate) {
      const nodes = children(options.target);
      $$.fragment && $$.fragment.l(nodes);
      nodes.forEach(detach);
    } else {
      $$.fragment && $$.fragment.c();
    }
    if (options.intro)
      transition_in(component.$$.fragment);
    mount_component(component, options.target, options.anchor, options.customElement);
    flush();
  }
  set_current_component(parent_component);
}
let SvelteElement;
if (typeof HTMLElement === "function") {
  SvelteElement = class extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
    }
    connectedCallback() {
      const { on_mount } = this.$$;
      this.$$.on_disconnect = on_mount.map(run).filter(is_function);
      for (const key in this.$$.slotted) {
        this.appendChild(this.$$.slotted[key]);
      }
    }
    attributeChangedCallback(attr2, _oldValue, newValue) {
      this[attr2] = newValue;
    }
    disconnectedCallback() {
      run_all(this.$$.on_disconnect);
    }
    $destroy() {
      destroy_component(this, 1);
      this.$destroy = noop$5;
    }
    $on(type2, callback) {
      const callbacks = this.$$.callbacks[type2] || (this.$$.callbacks[type2] = []);
      callbacks.push(callback);
      return () => {
        const index = callbacks.indexOf(callback);
        if (index !== -1)
          callbacks.splice(index, 1);
      };
    }
    $set($$props) {
      if (this.$$set && !is_empty($$props)) {
        this.$$.skip_bound = true;
        this.$$set($$props);
        this.$$.skip_bound = false;
      }
    }
  };
}
var commonjsGlobal = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
function getAugmentedNamespace(n) {
  if (n.__esModule)
    return n;
  var a = Object.defineProperty({}, "__esModule", { value: true });
  Object.keys(n).forEach(function(k) {
    var d = Object.getOwnPropertyDescriptor(n, k);
    Object.defineProperty(a, k, d.get ? d : {
      enumerable: true,
      get: function() {
        return n[k];
      }
    });
  });
  return a;
}
function EventEmitter() {
}
EventEmitter.prototype.addEventListener = function(name, fn) {
  var eventMap = this.__events = this.__events || {};
  var handlerList = eventMap[name] = eventMap[name] || [];
  if (handlerList.indexOf(fn) < 0) {
    handlerList.push(fn);
  }
};
EventEmitter.prototype.removeEventListener = function(name, fn) {
  var eventMap = this.__events = this.__events || {};
  var handlerList = eventMap[name];
  if (handlerList) {
    var index = handlerList.indexOf(fn);
    if (index >= 0) {
      handlerList.splice(index, 1);
    }
  }
};
EventEmitter.prototype.emit = function(name, var_args) {
  var eventMap = this.__events = this.__events || {};
  var handlerList = eventMap[name];
  var args = Array.prototype.slice.call(arguments, 1);
  if (handlerList) {
    for (var i2 = 0; i2 < handlerList.length; i2++) {
      var fn = handlerList[i2];
      fn.apply(this, args);
    }
  }
};
function eventEmitter$n(ctor) {
  for (var prop in EventEmitter.prototype) {
    if (EventEmitter.prototype.hasOwnProperty(prop)) {
      ctor.prototype[prop] = EventEmitter.prototype[prop];
    }
  }
}
var minimalEventEmitter = eventEmitter$n;
function getNow() {
  if (typeof performance !== "undefined" && performance.now) {
    return function performanceNow() {
      return performance.now();
    };
  }
  return function dateNow() {
    return Date.now();
  };
}
var now$6 = getNow();
var now$5 = now$6;
function WorkTask(fn, cb) {
  this.fn = fn;
  this.cb = cb;
  this.cfn = null;
}
function WorkQueue$2(opts) {
  this._queue = [];
  this._delay = opts && opts.delay || 0;
  this._paused = opts && !!opts.paused || false;
  this._currentTask = null;
  this._lastFinished = null;
}
WorkQueue$2.prototype.length = function() {
  return this._queue.length;
};
WorkQueue$2.prototype.push = function(fn, cb) {
  var task = new WorkTask(fn, cb);
  var cancel = this._cancel.bind(this, task);
  this._queue.push(task);
  this._next();
  return cancel;
};
WorkQueue$2.prototype.pause = function() {
  if (!this._paused) {
    this._paused = true;
  }
};
WorkQueue$2.prototype.resume = function() {
  if (this._paused) {
    this._paused = false;
    this._next();
  }
};
WorkQueue$2.prototype._start = function(task) {
  if (this._currentTask) {
    throw new Error("WorkQueue: called start while running task");
  }
  this._currentTask = task;
  var finish = this._finish.bind(this, task);
  task.cfn = task.fn(finish);
  if (typeof task.cfn !== "function") {
    throw new Error("WorkQueue: function is not cancellable");
  }
};
WorkQueue$2.prototype._finish = function(task) {
  var args = Array.prototype.slice.call(arguments, 1);
  if (this._currentTask !== task) {
    throw new Error("WorkQueue: called finish on wrong task");
  }
  task.cb.apply(null, args);
  this._currentTask = null;
  this._lastFinished = now$5();
  this._next();
};
WorkQueue$2.prototype._cancel = function(task) {
  var args = Array.prototype.slice.call(arguments, 1);
  if (this._currentTask === task) {
    task.cfn.apply(null, args);
  } else {
    var pos = this._queue.indexOf(task);
    if (pos >= 0) {
      this._queue.splice(pos, 1);
      task.cb.apply(null, args);
    }
  }
};
WorkQueue$2.prototype._next = function() {
  if (this._paused) {
    return;
  }
  if (!this._queue.length) {
    return;
  }
  if (this._currentTask) {
    return;
  }
  if (this._lastFinished != null) {
    var elapsed = now$5() - this._lastFinished;
    var remaining = this._delay - elapsed;
    if (remaining > 0) {
      setTimeout(this._next.bind(this), remaining);
      return;
    }
  }
  var task = this._queue.shift();
  this._start(task);
};
var WorkQueue_1 = WorkQueue$2;
function calcRect$2(totalWidth, totalHeight, spec, result) {
  result = result || {};
  var width;
  if (spec != null && spec.absoluteWidth != null) {
    width = spec.absoluteWidth / totalWidth;
  } else if (spec != null && spec.relativeWidth != null) {
    width = spec.relativeWidth;
  } else {
    width = 1;
  }
  var height;
  if (spec && spec.absoluteHeight != null) {
    height = spec.absoluteHeight / totalHeight;
  } else if (spec != null && spec.relativeHeight != null) {
    height = spec.relativeHeight;
  } else {
    height = 1;
  }
  var x;
  if (spec != null && spec.absoluteX != null) {
    x = spec.absoluteX / totalWidth;
  } else if (spec != null && spec.relativeX != null) {
    x = spec.relativeX;
  } else {
    x = 0;
  }
  var y;
  if (spec != null && spec.absoluteY != null) {
    y = spec.absoluteY / totalHeight;
  } else if (spec != null && spec.relativeY != null) {
    y = spec.relativeY;
  } else {
    y = 0;
  }
  result.x = x;
  result.y = y;
  result.width = width;
  result.height = height;
  return result;
}
var calcRect_1 = calcRect$2;
function async$1(fn) {
  return function asynced(done) {
    var err, ret;
    try {
      ret = fn();
    } catch (e) {
      err = e;
    } finally {
      if (err) {
        done(err);
      } else {
        done(null, ret);
      }
    }
  };
}
var async_1 = async$1;
function once$2(fn) {
  var called = false;
  var value;
  return function onced() {
    if (!called) {
      called = true;
      value = fn.apply(null, arguments);
    }
    return value;
  };
}
var once_1 = once$2;
var once$1 = once_1;
function cancelize$1(fn) {
  return function cancelized() {
    if (!arguments.length) {
      throw new Error("cancelized: expected at least one argument");
    }
    var args = Array.prototype.slice.call(arguments, 0);
    var done = args[args.length - 1] = once$1(args[args.length - 1]);
    function cancel() {
      done.apply(null, arguments);
    }
    fn.apply(null, args);
    return cancel;
  };
}
var cancelize_1 = cancelize$1;
function clearOwnProperties$p(obj) {
  for (var prop in obj) {
    if (obj.hasOwnProperty(prop)) {
      obj[prop] = void 0;
    }
  }
}
var clearOwnProperties_1 = clearOwnProperties$p;
function RendererRegistry$1() {
  this._renderers = {};
}
RendererRegistry$1.prototype.set = function(geometryType, viewType, Renderer) {
  if (!this._renderers[geometryType]) {
    this._renderers[geometryType] = {};
  }
  this._renderers[geometryType][viewType] = Renderer;
};
RendererRegistry$1.prototype.get = function(geometryType, viewType) {
  var Renderer = this._renderers[geometryType] && this._renderers[geometryType][viewType];
  return Renderer || null;
};
var RendererRegistry_1 = RendererRegistry$1;
var eventEmitter$m = minimalEventEmitter;
var WorkQueue$1 = WorkQueue_1;
var calcRect$1 = calcRect_1;
var async = async_1;
var cancelize = cancelize_1;
var clearOwnProperties$o = clearOwnProperties_1;
var RendererRegistry = RendererRegistry_1;
function forwardTileCmp(t1, t2) {
  return t1.cmp(t2);
}
function reverseTileCmp(t1, t2) {
  return -t1.cmp(t2);
}
function Stage$1(opts) {
  this._progressive = !!(opts && opts.progressive);
  this._layers = [];
  this._renderers = [];
  this._tilesToLoad = [];
  this._tilesToRender = [];
  this._tmpVisible = [];
  this._tmpChildren = [];
  this._width = 0;
  this._height = 0;
  this._tmpRect = {};
  this._tmpSize = {};
  this._createTextureWorkQueue = new WorkQueue$1();
  this._emitRenderInvalid = this._emitRenderInvalid.bind(this);
  this._rendererRegistry = new RendererRegistry();
}
eventEmitter$m(Stage$1);
Stage$1.prototype.destroy = function() {
  this.removeAllLayers();
  clearOwnProperties$o(this);
};
Stage$1.prototype.registerRenderer = function(geometryType, viewType, Renderer) {
  return this._rendererRegistry.set(geometryType, viewType, Renderer);
};
Stage$1.prototype.domElement = function() {
  throw new Error("Stage implementation must override domElement");
};
Stage$1.prototype.width = function() {
  return this._width;
};
Stage$1.prototype.height = function() {
  return this._height;
};
Stage$1.prototype.size = function(size) {
  size = size || {};
  size.width = this._width;
  size.height = this._height;
  return size;
};
Stage$1.prototype.setSize = function(size) {
  this._width = size.width;
  this._height = size.height;
  this.setSizeForType();
  this.emit("resize");
  this._emitRenderInvalid();
};
Stage$1.prototype.setSizeForType = function(size) {
  throw new Error("Stage implementation must override setSizeForType");
};
Stage$1.prototype.loadImage = function() {
  throw new Error("Stage implementation must override loadImage");
};
Stage$1.prototype._emitRenderInvalid = function() {
  this.emit("renderInvalid");
};
Stage$1.prototype.validateLayer = function(layer) {
  throw new Error("Stage implementation must override validateLayer");
};
Stage$1.prototype.listLayers = function() {
  return [].concat(this._layers);
};
Stage$1.prototype.hasLayer = function(layer) {
  return this._layers.indexOf(layer) >= 0;
};
Stage$1.prototype.addLayer = function(layer, i2) {
  if (this._layers.indexOf(layer) >= 0) {
    throw new Error("Layer already in stage");
  }
  if (i2 == null) {
    i2 = this._layers.length;
  }
  if (i2 < 0 || i2 > this._layers.length) {
    throw new Error("Invalid layer position");
  }
  this.validateLayer(layer);
  var geometryType = layer.geometry().type;
  var viewType = layer.view().type;
  var rendererClass = this._rendererRegistry.get(geometryType, viewType);
  if (!rendererClass) {
    throw new Error("No " + this.type + " renderer avaiable for " + geometryType + " geometry and " + viewType + " view");
  }
  var renderer = this.createRenderer(rendererClass);
  this._layers.splice(i2, 0, layer);
  this._renderers.splice(i2, 0, renderer);
  layer.addEventListener("viewChange", this._emitRenderInvalid);
  layer.addEventListener("effectsChange", this._emitRenderInvalid);
  layer.addEventListener("fixedLevelChange", this._emitRenderInvalid);
  layer.addEventListener("textureStoreChange", this._emitRenderInvalid);
  this._emitRenderInvalid();
};
Stage$1.prototype.moveLayer = function(layer, i2) {
  var index = this._layers.indexOf(layer);
  if (index < 0) {
    throw new Error("No such layer in stage");
  }
  if (i2 < 0 || i2 >= this._layers.length) {
    throw new Error("Invalid layer position");
  }
  layer = this._layers.splice(index, 1)[0];
  var renderer = this._renderers.splice(index, 1)[0];
  this._layers.splice(i2, 0, layer);
  this._renderers.splice(i2, 0, renderer);
  this._emitRenderInvalid();
};
Stage$1.prototype.removeLayer = function(layer) {
  var index = this._layers.indexOf(layer);
  if (index < 0) {
    throw new Error("No such layer in stage");
  }
  var removedLayer = this._layers.splice(index, 1)[0];
  var renderer = this._renderers.splice(index, 1)[0];
  this.destroyRenderer(renderer);
  removedLayer.removeEventListener("viewChange", this._emitRenderInvalid);
  removedLayer.removeEventListener("effectsChange", this._emitRenderInvalid);
  removedLayer.removeEventListener("fixedLevelChange", this._emitRenderInvalid);
  removedLayer.removeEventListener("textureStoreChange", this._emitRenderInvalid);
  this._emitRenderInvalid();
};
Stage$1.prototype.removeAllLayers = function() {
  while (this._layers.length > 0) {
    this.removeLayer(this._layers[0]);
  }
};
Stage$1.prototype.startFrame = function() {
  throw new Error("Stage implementation must override startFrame");
};
Stage$1.prototype.endFrame = function() {
  throw new Error("Stage implementation must override endFrame");
};
Stage$1.prototype.render = function() {
  var i2, j;
  var tilesToLoad = this._tilesToLoad;
  var tilesToRender = this._tilesToRender;
  var stableStage = true;
  var stableLayer;
  var width = this._width;
  var height = this._height;
  var rect = this._tmpRect;
  var size = this._tmpSize;
  if (width <= 0 || height <= 0) {
    return;
  }
  this.startFrame();
  for (i2 = 0; i2 < this._layers.length; i2++) {
    this._layers[i2].textureStore().startFrame();
  }
  for (i2 = 0; i2 < this._layers.length; i2++) {
    var layer = this._layers[i2];
    var effects = layer.effects();
    var view = layer.view();
    var textureStore = layer.textureStore();
    var renderer = this._renderers[i2];
    var depth = this._layers.length - i2;
    var tile2, texture;
    calcRect$1(width, height, effects && effects.rect, rect);
    if (rect.width <= 0 || rect.height <= 0) {
      continue;
    }
    size.width = rect.width * this._width;
    size.height = rect.height * this._height;
    view.setSize(size);
    renderer.startLayer(layer, rect);
    stableLayer = this._collectTiles(layer, textureStore);
    for (j = 0; j < tilesToLoad.length; j++) {
      tile2 = tilesToLoad[j];
      textureStore.markTile(tile2);
    }
    for (j = 0; j < tilesToRender.length; j++) {
      tile2 = tilesToRender[j];
      texture = textureStore.texture(tile2);
      renderer.renderTile(tile2, texture, layer, depth);
    }
    layer.emit("renderComplete", stableLayer);
    if (!stableLayer) {
      stableStage = false;
    }
    renderer.endLayer(layer, rect);
  }
  for (i2 = 0; i2 < this._layers.length; i2++) {
    this._layers[i2].textureStore().endFrame();
  }
  this.endFrame();
  this.emit("renderComplete", stableStage);
};
Stage$1.prototype._collectTiles = function(layer, textureStore) {
  var tilesToLoad = this._tilesToLoad;
  var tilesToRender = this._tilesToRender;
  var tmpVisible = this._tmpVisible;
  tilesToLoad.length = 0;
  tilesToRender.length = 0;
  tmpVisible.length = 0;
  layer.visibleTiles(tmpVisible);
  var isStable = true;
  for (var i2 = 0; i2 < tmpVisible.length; i2++) {
    var tile2 = tmpVisible[i2];
    var needsFallback;
    this._collectTileToLoad(tile2);
    if (textureStore.texture(tile2)) {
      needsFallback = false;
      this._collectTileToRender(tile2);
    } else {
      needsFallback = this._collectChildren(tile2, textureStore);
      isStable = false;
    }
    this._collectParents(tile2, textureStore, needsFallback);
  }
  tilesToLoad.sort(forwardTileCmp);
  tilesToRender.sort(reverseTileCmp);
  return isStable;
};
Stage$1.prototype._collectChildren = function(tile2, textureStore) {
  var tmpChildren = this._tmpChildren;
  var needsFallback = true;
  do {
    tmpChildren.length = 0;
    if (!tile2.children(tmpChildren)) {
      break;
    }
    needsFallback = false;
    for (var i2 = 0; i2 < tmpChildren.length; i2++) {
      tile2 = tmpChildren[i2];
      if (textureStore.texture(tile2)) {
        this._collectTileToLoad(tile2);
        this._collectTileToRender(tile2);
      } else {
        needsFallback = true;
      }
    }
  } while (needsFallback && tmpChildren.length === 1);
  return needsFallback;
};
Stage$1.prototype._collectParents = function(tile2, textureStore, needsFallback) {
  var needsLoading = this._progressive;
  while ((needsLoading || needsFallback) && (tile2 = tile2.parent()) != null) {
    if (needsFallback) {
      if (textureStore.texture(tile2)) {
        this._collectTileToRender(tile2);
        needsFallback = false;
      } else if (!this._progressive) {
        continue;
      }
    }
    if (!this._collectTileToLoad(tile2)) {
      needsLoading = false;
    }
  }
  return needsFallback;
};
Stage$1.prototype._collectTileToLoad = function(tile2) {
  return this._collectTileIntoList(tile2, this._tilesToLoad);
};
Stage$1.prototype._collectTileToRender = function(tile2) {
  return this._collectTileIntoList(tile2, this._tilesToRender);
};
Stage$1.prototype._collectTileIntoList = function(tile2, tileList) {
  var found = false;
  for (var i2 = 0; i2 < tileList.length; i2++) {
    if (tile2.equals(tileList[i2])) {
      found = true;
      break;
    }
  }
  if (!found) {
    tileList.push(tile2);
  }
  return !found;
};
Stage$1.prototype.createTexture = function(tile2, asset, done) {
  var self2 = this;
  function makeTexture() {
    return new self2.TextureClass(self2, tile2, asset);
  }
  var fn = cancelize(async(makeTexture));
  return this._createTextureWorkQueue.push(fn, function(err, texture) {
    done(err, tile2, asset, texture);
  });
};
var Stage_1 = Stage$1;
var globalObject = function() {
  if (typeof window !== "undefined") {
    return window;
  }
  if (typeof self !== "undefined") {
    return self;
  }
  if (typeof commonjsGlobal !== "undefined") {
    return commonjsGlobal;
  }
  return null;
}();
var global$3 = globalObject;
var global$2 = global$3;
var eventEmitter$l = minimalEventEmitter;
var clearOwnProperties$n = clearOwnProperties_1;
var propertyMap = {
  HTMLImageElement: ["naturalWidth", "naturalHeight"],
  HTMLCanvasElement: ["width", "height"],
  ImageBitmap: ["width", "height"]
};
function StaticAsset$2(element2) {
  var supported = false;
  for (var type2 in propertyMap) {
    if (global$2[type2] && element2 instanceof global$2[type2]) {
      supported = true;
      this._widthProp = propertyMap[type2][0];
      this._heightProp = propertyMap[type2][1];
      break;
    }
  }
  if (!supported) {
    throw new Error("Unsupported pixel source");
  }
  this._element = element2;
}
eventEmitter$l(StaticAsset$2);
StaticAsset$2.prototype.destroy = function() {
  clearOwnProperties$n(this);
};
StaticAsset$2.prototype.element = function() {
  return this._element;
};
StaticAsset$2.prototype.width = function() {
  return this._element[this._widthProp];
};
StaticAsset$2.prototype.height = function() {
  return this._element[this._heightProp];
};
StaticAsset$2.prototype.timestamp = function() {
  return 0;
};
StaticAsset$2.prototype.isDynamic = function() {
  return false;
};
var Static = StaticAsset$2;
function inherits$9(ctor, superCtor) {
  ctor.super_ = superCtor;
  var TempCtor = function() {
  };
  TempCtor.prototype = superCtor.prototype;
  ctor.prototype = new TempCtor();
  ctor.prototype.constructor = ctor;
}
var inherits_1 = inherits$9;
var inherits$8 = inherits_1;
function NetworkError$2(message) {
  this.constructor.super_.apply(this, arguments);
  this.message = message;
}
inherits$8(NetworkError$2, Error);
var NetworkError_1 = NetworkError$2;
var bowser = { exports: {} };
/*!
 * Bowser - a browser detector
 * https://github.com/ded/bowser
 * MIT License | (c) Dustin Diaz 2015
 */
(function(module) {
  !function(root, name, definition) {
    if (module.exports)
      module.exports = definition();
    else
      root[name] = definition();
  }(commonjsGlobal, "bowser", function() {
    var t = true;
    function detect(ua) {
      function getFirstMatch(regex) {
        var match = ua.match(regex);
        return match && match.length > 1 && match[1] || "";
      }
      function getSecondMatch(regex) {
        var match = ua.match(regex);
        return match && match.length > 1 && match[2] || "";
      }
      var iosdevice = getFirstMatch(/(ipod|iphone|ipad)/i).toLowerCase(), likeAndroid = /like android/i.test(ua), android = !likeAndroid && /android/i.test(ua), nexusMobile = /nexus\s*[0-6]\s*/i.test(ua), nexusTablet = !nexusMobile && /nexus\s*[0-9]+/i.test(ua), chromeos = /CrOS/.test(ua), silk = /silk/i.test(ua), sailfish = /sailfish/i.test(ua), tizen = /tizen/i.test(ua), webos = /(web|hpw)(o|0)s/i.test(ua), windowsphone = /windows phone/i.test(ua);
      /SamsungBrowser/i.test(ua);
      var windows = !windowsphone && /windows/i.test(ua), mac = !iosdevice && !silk && /macintosh/i.test(ua), linux = !android && !sailfish && !tizen && !webos && /linux/i.test(ua), edgeVersion = getSecondMatch(/edg([ea]|ios)\/(\d+(\.\d+)?)/i), versionIdentifier = getFirstMatch(/version\/(\d+(\.\d+)?)/i), tablet = /tablet/i.test(ua) && !/tablet pc/i.test(ua), mobile = !tablet && /[^-]mobi/i.test(ua), xbox = /xbox/i.test(ua), result;
      if (/opera/i.test(ua)) {
        result = {
          name: "Opera",
          opera: t,
          version: versionIdentifier || getFirstMatch(/(?:opera|opr|opios)[\s\/](\d+(\.\d+)?)/i)
        };
      } else if (/opr\/|opios/i.test(ua)) {
        result = {
          name: "Opera",
          opera: t,
          version: getFirstMatch(/(?:opr|opios)[\s\/](\d+(\.\d+)?)/i) || versionIdentifier
        };
      } else if (/SamsungBrowser/i.test(ua)) {
        result = {
          name: "Samsung Internet for Android",
          samsungBrowser: t,
          version: versionIdentifier || getFirstMatch(/(?:SamsungBrowser)[\s\/](\d+(\.\d+)?)/i)
        };
      } else if (/Whale/i.test(ua)) {
        result = {
          name: "NAVER Whale browser",
          whale: t,
          version: getFirstMatch(/(?:whale)[\s\/](\d+(?:\.\d+)+)/i)
        };
      } else if (/MZBrowser/i.test(ua)) {
        result = {
          name: "MZ Browser",
          mzbrowser: t,
          version: getFirstMatch(/(?:MZBrowser)[\s\/](\d+(?:\.\d+)+)/i)
        };
      } else if (/coast/i.test(ua)) {
        result = {
          name: "Opera Coast",
          coast: t,
          version: versionIdentifier || getFirstMatch(/(?:coast)[\s\/](\d+(\.\d+)?)/i)
        };
      } else if (/focus/i.test(ua)) {
        result = {
          name: "Focus",
          focus: t,
          version: getFirstMatch(/(?:focus)[\s\/](\d+(?:\.\d+)+)/i)
        };
      } else if (/yabrowser/i.test(ua)) {
        result = {
          name: "Yandex Browser",
          yandexbrowser: t,
          version: versionIdentifier || getFirstMatch(/(?:yabrowser)[\s\/](\d+(\.\d+)?)/i)
        };
      } else if (/ucbrowser/i.test(ua)) {
        result = {
          name: "UC Browser",
          ucbrowser: t,
          version: getFirstMatch(/(?:ucbrowser)[\s\/](\d+(?:\.\d+)+)/i)
        };
      } else if (/mxios/i.test(ua)) {
        result = {
          name: "Maxthon",
          maxthon: t,
          version: getFirstMatch(/(?:mxios)[\s\/](\d+(?:\.\d+)+)/i)
        };
      } else if (/epiphany/i.test(ua)) {
        result = {
          name: "Epiphany",
          epiphany: t,
          version: getFirstMatch(/(?:epiphany)[\s\/](\d+(?:\.\d+)+)/i)
        };
      } else if (/puffin/i.test(ua)) {
        result = {
          name: "Puffin",
          puffin: t,
          version: getFirstMatch(/(?:puffin)[\s\/](\d+(?:\.\d+)?)/i)
        };
      } else if (/sleipnir/i.test(ua)) {
        result = {
          name: "Sleipnir",
          sleipnir: t,
          version: getFirstMatch(/(?:sleipnir)[\s\/](\d+(?:\.\d+)+)/i)
        };
      } else if (/k-meleon/i.test(ua)) {
        result = {
          name: "K-Meleon",
          kMeleon: t,
          version: getFirstMatch(/(?:k-meleon)[\s\/](\d+(?:\.\d+)+)/i)
        };
      } else if (windowsphone) {
        result = {
          name: "Windows Phone",
          osname: "Windows Phone",
          windowsphone: t
        };
        if (edgeVersion) {
          result.msedge = t;
          result.version = edgeVersion;
        } else {
          result.msie = t;
          result.version = getFirstMatch(/iemobile\/(\d+(\.\d+)?)/i);
        }
      } else if (/msie|trident/i.test(ua)) {
        result = {
          name: "Internet Explorer",
          msie: t,
          version: getFirstMatch(/(?:msie |rv:)(\d+(\.\d+)?)/i)
        };
      } else if (chromeos) {
        result = {
          name: "Chrome",
          osname: "Chrome OS",
          chromeos: t,
          chromeBook: t,
          chrome: t,
          version: getFirstMatch(/(?:chrome|crios|crmo)\/(\d+(\.\d+)?)/i)
        };
      } else if (/edg([ea]|ios)/i.test(ua)) {
        result = {
          name: "Microsoft Edge",
          msedge: t,
          version: edgeVersion
        };
      } else if (/vivaldi/i.test(ua)) {
        result = {
          name: "Vivaldi",
          vivaldi: t,
          version: getFirstMatch(/vivaldi\/(\d+(\.\d+)?)/i) || versionIdentifier
        };
      } else if (sailfish) {
        result = {
          name: "Sailfish",
          osname: "Sailfish OS",
          sailfish: t,
          version: getFirstMatch(/sailfish\s?browser\/(\d+(\.\d+)?)/i)
        };
      } else if (/seamonkey\//i.test(ua)) {
        result = {
          name: "SeaMonkey",
          seamonkey: t,
          version: getFirstMatch(/seamonkey\/(\d+(\.\d+)?)/i)
        };
      } else if (/firefox|iceweasel|fxios/i.test(ua)) {
        result = {
          name: "Firefox",
          firefox: t,
          version: getFirstMatch(/(?:firefox|iceweasel|fxios)[ \/](\d+(\.\d+)?)/i)
        };
        if (/\((mobile|tablet);[^\)]*rv:[\d\.]+\)/i.test(ua)) {
          result.firefoxos = t;
          result.osname = "Firefox OS";
        }
      } else if (silk) {
        result = {
          name: "Amazon Silk",
          silk: t,
          version: getFirstMatch(/silk\/(\d+(\.\d+)?)/i)
        };
      } else if (/phantom/i.test(ua)) {
        result = {
          name: "PhantomJS",
          phantom: t,
          version: getFirstMatch(/phantomjs\/(\d+(\.\d+)?)/i)
        };
      } else if (/slimerjs/i.test(ua)) {
        result = {
          name: "SlimerJS",
          slimer: t,
          version: getFirstMatch(/slimerjs\/(\d+(\.\d+)?)/i)
        };
      } else if (/blackberry|\bbb\d+/i.test(ua) || /rim\stablet/i.test(ua)) {
        result = {
          name: "BlackBerry",
          osname: "BlackBerry OS",
          blackberry: t,
          version: versionIdentifier || getFirstMatch(/blackberry[\d]+\/(\d+(\.\d+)?)/i)
        };
      } else if (webos) {
        result = {
          name: "WebOS",
          osname: "WebOS",
          webos: t,
          version: versionIdentifier || getFirstMatch(/w(?:eb)?osbrowser\/(\d+(\.\d+)?)/i)
        };
        /touchpad\//i.test(ua) && (result.touchpad = t);
      } else if (/bada/i.test(ua)) {
        result = {
          name: "Bada",
          osname: "Bada",
          bada: t,
          version: getFirstMatch(/dolfin\/(\d+(\.\d+)?)/i)
        };
      } else if (tizen) {
        result = {
          name: "Tizen",
          osname: "Tizen",
          tizen: t,
          version: getFirstMatch(/(?:tizen\s?)?browser\/(\d+(\.\d+)?)/i) || versionIdentifier
        };
      } else if (/qupzilla/i.test(ua)) {
        result = {
          name: "QupZilla",
          qupzilla: t,
          version: getFirstMatch(/(?:qupzilla)[\s\/](\d+(?:\.\d+)+)/i) || versionIdentifier
        };
      } else if (/chromium/i.test(ua)) {
        result = {
          name: "Chromium",
          chromium: t,
          version: getFirstMatch(/(?:chromium)[\s\/](\d+(?:\.\d+)?)/i) || versionIdentifier
        };
      } else if (/chrome|crios|crmo/i.test(ua)) {
        result = {
          name: "Chrome",
          chrome: t,
          version: getFirstMatch(/(?:chrome|crios|crmo)\/(\d+(\.\d+)?)/i)
        };
      } else if (android) {
        result = {
          name: "Android",
          version: versionIdentifier
        };
      } else if (/safari|applewebkit/i.test(ua)) {
        result = {
          name: "Safari",
          safari: t
        };
        if (versionIdentifier) {
          result.version = versionIdentifier;
        }
      } else if (iosdevice) {
        result = {
          name: iosdevice == "iphone" ? "iPhone" : iosdevice == "ipad" ? "iPad" : "iPod"
        };
        if (versionIdentifier) {
          result.version = versionIdentifier;
        }
      } else if (/googlebot/i.test(ua)) {
        result = {
          name: "Googlebot",
          googlebot: t,
          version: getFirstMatch(/googlebot\/(\d+(\.\d+))/i) || versionIdentifier
        };
      } else {
        result = {
          name: getFirstMatch(/^(.*)\/(.*) /),
          version: getSecondMatch(/^(.*)\/(.*) /)
        };
      }
      if (!result.msedge && /(apple)?webkit/i.test(ua)) {
        if (/(apple)?webkit\/537\.36/i.test(ua)) {
          result.name = result.name || "Blink";
          result.blink = t;
        } else {
          result.name = result.name || "Webkit";
          result.webkit = t;
        }
        if (!result.version && versionIdentifier) {
          result.version = versionIdentifier;
        }
      } else if (!result.opera && /gecko\//i.test(ua)) {
        result.name = result.name || "Gecko";
        result.gecko = t;
        result.version = result.version || getFirstMatch(/gecko\/(\d+(\.\d+)?)/i);
      }
      if (!result.windowsphone && (android || result.silk)) {
        result.android = t;
        result.osname = "Android";
      } else if (!result.windowsphone && iosdevice) {
        result[iosdevice] = t;
        result.ios = t;
        result.osname = "iOS";
      } else if (mac) {
        result.mac = t;
        result.osname = "macOS";
      } else if (xbox) {
        result.xbox = t;
        result.osname = "Xbox";
      } else if (windows) {
        result.windows = t;
        result.osname = "Windows";
      } else if (linux) {
        result.linux = t;
        result.osname = "Linux";
      }
      function getWindowsVersion(s) {
        switch (s) {
          case "NT":
            return "NT";
          case "XP":
            return "XP";
          case "NT 5.0":
            return "2000";
          case "NT 5.1":
            return "XP";
          case "NT 5.2":
            return "2003";
          case "NT 6.0":
            return "Vista";
          case "NT 6.1":
            return "7";
          case "NT 6.2":
            return "8";
          case "NT 6.3":
            return "8.1";
          case "NT 10.0":
            return "10";
          default:
            return void 0;
        }
      }
      var osVersion = "";
      if (result.windows) {
        osVersion = getWindowsVersion(getFirstMatch(/Windows ((NT|XP)( \d\d?.\d)?)/i));
      } else if (result.windowsphone) {
        osVersion = getFirstMatch(/windows phone (?:os)?\s?(\d+(\.\d+)*)/i);
      } else if (result.mac) {
        osVersion = getFirstMatch(/Mac OS X (\d+([_\.\s]\d+)*)/i);
        osVersion = osVersion.replace(/[_\s]/g, ".");
      } else if (iosdevice) {
        osVersion = getFirstMatch(/os (\d+([_\s]\d+)*) like mac os x/i);
        osVersion = osVersion.replace(/[_\s]/g, ".");
      } else if (android) {
        osVersion = getFirstMatch(/android[ \/-](\d+(\.\d+)*)/i);
      } else if (result.webos) {
        osVersion = getFirstMatch(/(?:web|hpw)os\/(\d+(\.\d+)*)/i);
      } else if (result.blackberry) {
        osVersion = getFirstMatch(/rim\stablet\sos\s(\d+(\.\d+)*)/i);
      } else if (result.bada) {
        osVersion = getFirstMatch(/bada\/(\d+(\.\d+)*)/i);
      } else if (result.tizen) {
        osVersion = getFirstMatch(/tizen[\/\s](\d+(\.\d+)*)/i);
      }
      if (osVersion) {
        result.osversion = osVersion;
      }
      var osMajorVersion = !result.windows && osVersion.split(".")[0];
      if (tablet || nexusTablet || iosdevice == "ipad" || android && (osMajorVersion == 3 || osMajorVersion >= 4 && !mobile) || result.silk) {
        result.tablet = t;
      } else if (mobile || iosdevice == "iphone" || iosdevice == "ipod" || android || nexusMobile || result.blackberry || result.webos || result.bada) {
        result.mobile = t;
      }
      if (result.msedge || result.msie && result.version >= 10 || result.yandexbrowser && result.version >= 15 || result.vivaldi && result.version >= 1 || result.chrome && result.version >= 20 || result.samsungBrowser && result.version >= 4 || result.whale && compareVersions([result.version, "1.0"]) === 1 || result.mzbrowser && compareVersions([result.version, "6.0"]) === 1 || result.focus && compareVersions([result.version, "1.0"]) === 1 || result.firefox && result.version >= 20 || result.safari && result.version >= 6 || result.opera && result.version >= 10 || result.ios && result.osversion && result.osversion.split(".")[0] >= 6 || result.blackberry && result.version >= 10.1 || result.chromium && result.version >= 20) {
        result.a = t;
      } else if (result.msie && result.version < 10 || result.chrome && result.version < 20 || result.firefox && result.version < 20 || result.safari && result.version < 6 || result.opera && result.version < 10 || result.ios && result.osversion && result.osversion.split(".")[0] < 6 || result.chromium && result.version < 20) {
        result.c = t;
      } else
        result.x = t;
      return result;
    }
    var bowser2 = detect(typeof navigator !== "undefined" ? navigator.userAgent || "" : "");
    bowser2.test = function(browserList) {
      for (var i2 = 0; i2 < browserList.length; ++i2) {
        var browserItem = browserList[i2];
        if (typeof browserItem === "string") {
          if (browserItem in bowser2) {
            return true;
          }
        }
      }
      return false;
    };
    function getVersionPrecision(version) {
      return version.split(".").length;
    }
    function map(arr, iterator) {
      var result = [], i2;
      if (Array.prototype.map) {
        return Array.prototype.map.call(arr, iterator);
      }
      for (i2 = 0; i2 < arr.length; i2++) {
        result.push(iterator(arr[i2]));
      }
      return result;
    }
    function compareVersions(versions) {
      var precision = Math.max(getVersionPrecision(versions[0]), getVersionPrecision(versions[1]));
      var chunks = map(versions, function(version) {
        var delta = precision - getVersionPrecision(version);
        version = version + new Array(delta + 1).join(".0");
        return map(version.split("."), function(chunk) {
          return new Array(20 - chunk.length).join("0") + chunk;
        }).reverse();
      });
      while (--precision >= 0) {
        if (chunks[0][precision] > chunks[1][precision]) {
          return 1;
        } else if (chunks[0][precision] === chunks[1][precision]) {
          if (precision === 0) {
            return 0;
          }
        } else {
          return -1;
        }
      }
    }
    function isUnsupportedBrowser(minVersions, strictMode, ua) {
      var _bowser = bowser2;
      if (typeof strictMode === "string") {
        ua = strictMode;
        strictMode = void 0;
      }
      if (strictMode === void 0) {
        strictMode = false;
      }
      if (ua) {
        _bowser = detect(ua);
      }
      var version = "" + _bowser.version;
      for (var browser2 in minVersions) {
        if (minVersions.hasOwnProperty(browser2)) {
          if (_bowser[browser2]) {
            if (typeof minVersions[browser2] !== "string") {
              throw new Error("Browser version in the minVersion map should be a string: " + browser2 + ": " + String(minVersions));
            }
            return compareVersions([version, minVersions[browser2]]) < 0;
          }
        }
      }
      return strictMode;
    }
    function check(minVersions, strictMode, ua) {
      return !isUnsupportedBrowser(minVersions, strictMode, ua);
    }
    bowser2.isUnsupportedBrowser = isUnsupportedBrowser;
    bowser2.compareVersions = compareVersions;
    bowser2.check = check;
    bowser2._detect = detect;
    bowser2.detect = detect;
    return bowser2;
  });
})(bowser);
var StaticAsset$1 = Static;
var NetworkError$1 = NetworkError_1;
var browser$1 = bowser.exports;
var global$1 = global$3;
var once = once_1;
var useCreateImageBitmap = !!global$1.createImageBitmap && !browser$1.firefox;
var createImageBitmapOpts = {
  imageOrientation: "flipY",
  premultiplyAlpha: "premultiply"
};
function HtmlImageLoader$1(stage) {
  this._stage = stage;
}
HtmlImageLoader$1.prototype.loadImage = function(url, rect, done) {
  var self2 = this;
  var img = new Image();
  img.crossOrigin = "anonymous";
  var x = rect && rect.x || 0;
  var y = rect && rect.y || 0;
  var width = rect && rect.width || 1;
  var height = rect && rect.height || 1;
  done = once(done);
  img.onload = function() {
    self2._handleLoad(img, x, y, width, height, done);
  };
  img.onerror = function() {
    self2._handleError(url, done);
  };
  img.src = url;
  function cancel() {
    img.onload = img.onerror = null;
    img.src = "";
    done.apply(null, arguments);
  }
  return cancel;
};
HtmlImageLoader$1.prototype._handleLoad = function(img, x, y, width, height, done) {
  if (x === 0 && y === 0 && width === 1 && height === 1) {
    done(null, new StaticAsset$1(img));
    return;
  }
  x *= img.naturalWidth;
  y *= img.naturalHeight;
  width *= img.naturalWidth;
  height *= img.naturalHeight;
  if (useCreateImageBitmap) {
    global$1.createImageBitmap(img, x, y, width, height, createImageBitmapOpts).then(function(bitmap) {
      done(null, new StaticAsset$1(bitmap));
    });
  } else {
    var canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    var context = canvas.getContext("2d");
    context.drawImage(img, x, y, width, height, 0, 0, width, height);
    done(null, new StaticAsset$1(canvas));
  }
};
HtmlImageLoader$1.prototype._handleError = function(url, done) {
  done(new NetworkError$1("Network error: " + url));
};
var HtmlImage = HtmlImageLoader$1;
var defaultPixelRatio = 1;
function pixelRatio$3() {
  if (typeof window !== "undefined") {
    if (window.devicePixelRatio) {
      return window.devicePixelRatio;
    } else {
      var screen = window.screen;
      if (screen && screen.deviceXDPI && screen.logicalXDPI) {
        return screen.deviceXDPI / screen.logicalXDPI;
      } else if (screen && screen.systemXDPI && screen.logicalXDPI) {
        return screen.systemXDPI / screen.logicalXDPI;
      }
    }
  }
  return defaultPixelRatio;
}
var pixelRatio_1 = pixelRatio$3;
function ispot$1(n) {
  return (n & n - 1) == 0;
}
var ispot_1 = ispot$1;
function prefixProperty(property) {
  var style = document.documentElement.style;
  var prefixList = ["Moz", "Webkit", "Khtml", "O", "ms"];
  for (var i2 = 0; i2 < prefixList.length; i2++) {
    var prefix = prefixList[i2];
    var capitalizedProperty = property[0].toUpperCase() + property.slice(1);
    var prefixedProperty = prefix + capitalizedProperty;
    if (prefixedProperty in style) {
      return prefixedProperty;
    }
  }
  return property;
}
function getWithVendorPrefix(property) {
  var prefixedProperty = prefixProperty(property);
  return function getPropertyWithVendorPrefix(element2) {
    return element2.style[prefixedProperty];
  };
}
function setWithVendorPrefix(property) {
  var prefixedProperty = prefixProperty(property);
  return function setPropertyWithVendorPrefix(element2, val) {
    return element2.style[prefixedProperty] = val;
  };
}
var setTransform$2 = setWithVendorPrefix("transform");
var setTransformOrigin = setWithVendorPrefix("transformOrigin");
function setNullTransform(element2) {
  setTransform$2(element2, "translateZ(0)");
}
function setNullTransformOrigin(element2) {
  setTransformOrigin(element2, "0 0 0");
}
function setAbsolute$3(element2) {
  element2.style.position = "absolute";
}
function setPixelPosition(element2, x, y) {
  element2.style.left = x + "px";
  element2.style.top = y + "px";
}
function setPixelSize$1(element2, width, height) {
  element2.style.width = width + "px";
  element2.style.height = height + "px";
}
function setNullSize$1(element2) {
  element2.style.width = element2.style.height = 0;
}
function setFullSize$2(element2) {
  element2.style.width = element2.style.height = "100%";
}
function setOverflowHidden$2(element2) {
  element2.style.overflow = "hidden";
}
function setOverflowVisible$1(element2) {
  element2.style.overflow = "visible";
}
function setNoPointerEvents(element2) {
  element2.style.pointerEvents = "none";
}
var dom = {
  prefixProperty,
  getWithVendorPrefix,
  setWithVendorPrefix,
  setTransform: setTransform$2,
  setTransformOrigin,
  setNullTransform,
  setNullTransformOrigin,
  setAbsolute: setAbsolute$3,
  setPixelPosition,
  setPixelSize: setPixelSize$1,
  setNullSize: setNullSize$1,
  setFullSize: setFullSize$2,
  setOverflowHidden: setOverflowHidden$2,
  setOverflowVisible: setOverflowVisible$1,
  setNoPointerEvents
};
var Stage = Stage_1;
var HtmlImageLoader = HtmlImage;
var browser = bowser.exports;
var inherits$7 = inherits_1;
var pixelRatio$2 = pixelRatio_1;
var ispot = ispot_1;
var setAbsolute$2 = dom.setAbsolute;
var setFullSize$1 = dom.setFullSize;
var clearOwnProperties$m = clearOwnProperties_1;
var browserQuirks = {
  videoUseTexImage2D: browser.chrome
};
function initWebGlContext(canvas, opts) {
  var options = {
    alpha: true,
    premultipliedAlpha: true,
    antialias: !!(opts && opts.antialias),
    preserveDrawingBuffer: !!(opts && opts.preserveDrawingBuffer)
  };
  var gl = canvas.getContext && (canvas.getContext("webgl", options) || canvas.getContext("experimental-webgl", options));
  if (!gl) {
    throw new Error("Could not get WebGL context");
  }
  if (opts.wrapContext) {
    gl = opts.wrapContext(gl);
  }
  return gl;
}
function WebGlStage$1(opts) {
  opts = opts || {};
  var self2 = this;
  this.constructor.super_.call(this, opts);
  this._generateMipmaps = opts.generateMipmaps != null ? opts.generateMipmaps : false;
  this._loader = new HtmlImageLoader(this);
  this._domElement = document.createElement("canvas");
  setAbsolute$2(this._domElement);
  setFullSize$1(this._domElement);
  this._gl = initWebGlContext(this._domElement, opts);
  this._handleContextLoss = function() {
    self2.emit("webglcontextlost");
    self2._gl = null;
  };
  this._domElement.addEventListener("webglcontextlost", this._handleContextLoss);
  this._rendererInstances = [];
}
inherits$7(WebGlStage$1, Stage);
WebGlStage$1.prototype.destroy = function() {
  this._domElement.removeEventListener("webglcontextlost", this._handleContextLoss);
  this.constructor.super_.prototype.destroy.call(this);
};
WebGlStage$1.prototype.domElement = function() {
  return this._domElement;
};
WebGlStage$1.prototype.webGlContext = function() {
  return this._gl;
};
WebGlStage$1.prototype.setSizeForType = function() {
  var ratio = pixelRatio$2();
  this._domElement.width = ratio * this._width;
  this._domElement.height = ratio * this._height;
};
WebGlStage$1.prototype.loadImage = function(url, rect, done) {
  return this._loader.loadImage(url, rect, done);
};
WebGlStage$1.prototype.maxTextureSize = function() {
  return this._gl.getParameter(this._gl.MAX_TEXTURE_SIZE);
};
WebGlStage$1.prototype.validateLayer = function(layer) {
  var tileSize = layer.geometry().maxTileSize();
  var maxTextureSize = this.maxTextureSize();
  if (tileSize > maxTextureSize) {
    throw new Error("Layer has level with tile size larger than maximum texture size (" + tileSize + " vs. " + maxTextureSize + ")");
  }
};
WebGlStage$1.prototype.createRenderer = function(Renderer) {
  var rendererInstances = this._rendererInstances;
  for (var i2 = 0; i2 < rendererInstances.length; i2++) {
    if (rendererInstances[i2] instanceof Renderer) {
      return rendererInstances[i2];
    }
  }
  var renderer = new Renderer(this._gl);
  rendererInstances.push(renderer);
  return renderer;
};
WebGlStage$1.prototype.destroyRenderer = function(renderer) {
  var rendererInstances = this._rendererInstances;
  if (this._renderers.indexOf(renderer) < 0) {
    renderer.destroy();
    var index = rendererInstances.indexOf(renderer);
    if (index >= 0) {
      rendererInstances.splice(index, 1);
    }
  }
};
WebGlStage$1.prototype.startFrame = function() {
  var gl = this._gl;
  if (!gl) {
    throw new Error("Bad WebGL context - maybe context was lost?");
  }
  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
};
WebGlStage$1.prototype.endFrame = function() {
};
WebGlStage$1.prototype.takeSnapshot = function(options) {
  if (typeof options !== "object" || options == null) {
    options = {};
  }
  var quality = options.quality;
  if (typeof quality == "undefined") {
    quality = 75;
  }
  if (typeof quality !== "number" || quality < 0 || quality > 100) {
    throw new Error("WebGLStage: Snapshot quality needs to be a number between 0 and 100");
  }
  this.render();
  return this._domElement.toDataURL("image/jpeg", quality / 100);
};
WebGlStage$1.type = WebGlStage$1.prototype.type = "webgl";
function WebGlTexture(stage, tile2, asset) {
  this._stage = stage;
  this._gl = stage._gl;
  this._texture = null;
  this._timestamp = null;
  this._width = this._height = null;
  this.refresh(tile2, asset);
}
WebGlTexture.prototype.refresh = function(tile2, asset) {
  var gl = this._gl;
  var stage = this._stage;
  var texture;
  var timestamp = asset.timestamp();
  if (timestamp === this._timestamp) {
    return;
  }
  var element2 = asset.element();
  var width = asset.width();
  var height = asset.height();
  if (width !== this._width || height !== this._height) {
    var maxSize = stage.maxTextureSize();
    if (width > maxSize) {
      throw new Error("Texture width larger than max size (" + width + " vs. " + maxSize + ")");
    }
    if (height > maxSize) {
      throw new Error("Texture height larger than max size (" + height + " vs. " + maxSize + ")");
    }
    if (this._texture) {
      gl.deleteTexture(texture);
    }
    texture = this._texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, element2);
  } else {
    texture = this._texture;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    if (element2 instanceof HTMLVideoElement && browserQuirks.videoUseTexImage2D) {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, element2);
    } else {
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, element2);
    }
  }
  if (stage._generateMipmaps && ispot(width) && ispot(height)) {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.generateMipmap(gl.TEXTURE_2D);
  } else {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  }
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.bindTexture(gl.TEXTURE_2D, null);
  this._timestamp = timestamp;
  this._width = width;
  this._height = height;
};
WebGlTexture.prototype.destroy = function() {
  if (this._texture) {
    this._gl.deleteTexture(this._texture);
  }
  clearOwnProperties$m(this);
};
WebGlStage$1.TextureClass = WebGlStage$1.prototype.TextureClass = WebGlTexture;
var WebGl = WebGlStage$1;
var EPSILON = 1e-6;
var ARRAY_TYPE = typeof Float32Array !== "undefined" ? Float32Array : Array;
var RANDOM = Math.random;
function setMatrixArrayType(type2) {
  ARRAY_TYPE = type2;
}
var degree = Math.PI / 180;
function toRadian(a) {
  return a * degree;
}
function equals$9(a, b) {
  return Math.abs(a - b) <= EPSILON * Math.max(1, Math.abs(a), Math.abs(b));
}
if (!Math.hypot)
  Math.hypot = function() {
    var y = 0, i2 = arguments.length;
    while (i2--) {
      y += arguments[i2] * arguments[i2];
    }
    return Math.sqrt(y);
  };
var common$2 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  EPSILON,
  get ARRAY_TYPE() {
    return ARRAY_TYPE;
  },
  RANDOM,
  setMatrixArrayType,
  toRadian,
  equals: equals$9
});
function create$8() {
  var out = new ARRAY_TYPE(4);
  if (ARRAY_TYPE != Float32Array) {
    out[1] = 0;
    out[2] = 0;
  }
  out[0] = 1;
  out[3] = 1;
  return out;
}
function clone$8(a) {
  var out = new ARRAY_TYPE(4);
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[3];
  return out;
}
function copy$8(out, a) {
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[3];
  return out;
}
function identity$6(out) {
  out[0] = 1;
  out[1] = 0;
  out[2] = 0;
  out[3] = 1;
  return out;
}
function fromValues$8(m00, m01, m10, m11) {
  var out = new ARRAY_TYPE(4);
  out[0] = m00;
  out[1] = m01;
  out[2] = m10;
  out[3] = m11;
  return out;
}
function set$8(out, m00, m01, m10, m11) {
  out[0] = m00;
  out[1] = m01;
  out[2] = m10;
  out[3] = m11;
  return out;
}
function transpose$2(out, a) {
  if (out === a) {
    var a1 = a[1];
    out[1] = a[2];
    out[2] = a1;
  } else {
    out[0] = a[0];
    out[1] = a[2];
    out[2] = a[1];
    out[3] = a[3];
  }
  return out;
}
function invert$5(out, a) {
  var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3];
  var det = a0 * a3 - a2 * a1;
  if (!det) {
    return null;
  }
  det = 1 / det;
  out[0] = a3 * det;
  out[1] = -a1 * det;
  out[2] = -a2 * det;
  out[3] = a0 * det;
  return out;
}
function adjoint$2(out, a) {
  var a0 = a[0];
  out[0] = a[3];
  out[1] = -a[1];
  out[2] = -a[2];
  out[3] = a0;
  return out;
}
function determinant$3(a) {
  return a[0] * a[3] - a[2] * a[1];
}
function multiply$8(out, a, b) {
  var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3];
  var b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
  out[0] = a0 * b0 + a2 * b1;
  out[1] = a1 * b0 + a3 * b1;
  out[2] = a0 * b2 + a2 * b3;
  out[3] = a1 * b2 + a3 * b3;
  return out;
}
function rotate$4(out, a, rad) {
  var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3];
  var s = Math.sin(rad);
  var c = Math.cos(rad);
  out[0] = a0 * c + a2 * s;
  out[1] = a1 * c + a3 * s;
  out[2] = a0 * -s + a2 * c;
  out[3] = a1 * -s + a3 * c;
  return out;
}
function scale$8(out, a, v2) {
  var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3];
  var v0 = v2[0], v1 = v2[1];
  out[0] = a0 * v0;
  out[1] = a1 * v0;
  out[2] = a2 * v1;
  out[3] = a3 * v1;
  return out;
}
function fromRotation$4(out, rad) {
  var s = Math.sin(rad);
  var c = Math.cos(rad);
  out[0] = c;
  out[1] = s;
  out[2] = -s;
  out[3] = c;
  return out;
}
function fromScaling$3(out, v2) {
  out[0] = v2[0];
  out[1] = 0;
  out[2] = 0;
  out[3] = v2[1];
  return out;
}
function str$8(a) {
  return "mat2(" + a[0] + ", " + a[1] + ", " + a[2] + ", " + a[3] + ")";
}
function frob$3(a) {
  return Math.hypot(a[0], a[1], a[2], a[3]);
}
function LDU(L, D, U, a) {
  L[2] = a[2] / a[0];
  U[0] = a[0];
  U[1] = a[1];
  U[3] = a[3] - L[2] * U[1];
  return [L, D, U];
}
function add$8(out, a, b) {
  out[0] = a[0] + b[0];
  out[1] = a[1] + b[1];
  out[2] = a[2] + b[2];
  out[3] = a[3] + b[3];
  return out;
}
function subtract$6(out, a, b) {
  out[0] = a[0] - b[0];
  out[1] = a[1] - b[1];
  out[2] = a[2] - b[2];
  out[3] = a[3] - b[3];
  return out;
}
function exactEquals$8(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
}
function equals$8(a, b) {
  var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3];
  var b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
  return Math.abs(a0 - b0) <= EPSILON * Math.max(1, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= EPSILON * Math.max(1, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= EPSILON * Math.max(1, Math.abs(a2), Math.abs(b2)) && Math.abs(a3 - b3) <= EPSILON * Math.max(1, Math.abs(a3), Math.abs(b3));
}
function multiplyScalar$3(out, a, b) {
  out[0] = a[0] * b;
  out[1] = a[1] * b;
  out[2] = a[2] * b;
  out[3] = a[3] * b;
  return out;
}
function multiplyScalarAndAdd$3(out, a, b, scale2) {
  out[0] = a[0] + b[0] * scale2;
  out[1] = a[1] + b[1] * scale2;
  out[2] = a[2] + b[2] * scale2;
  out[3] = a[3] + b[3] * scale2;
  return out;
}
var mul$8 = multiply$8;
var sub$6 = subtract$6;
var mat2 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  create: create$8,
  clone: clone$8,
  copy: copy$8,
  identity: identity$6,
  fromValues: fromValues$8,
  set: set$8,
  transpose: transpose$2,
  invert: invert$5,
  adjoint: adjoint$2,
  determinant: determinant$3,
  multiply: multiply$8,
  rotate: rotate$4,
  scale: scale$8,
  fromRotation: fromRotation$4,
  fromScaling: fromScaling$3,
  str: str$8,
  frob: frob$3,
  LDU,
  add: add$8,
  subtract: subtract$6,
  exactEquals: exactEquals$8,
  equals: equals$8,
  multiplyScalar: multiplyScalar$3,
  multiplyScalarAndAdd: multiplyScalarAndAdd$3,
  mul: mul$8,
  sub: sub$6
});
function create$7() {
  var out = new ARRAY_TYPE(6);
  if (ARRAY_TYPE != Float32Array) {
    out[1] = 0;
    out[2] = 0;
    out[4] = 0;
    out[5] = 0;
  }
  out[0] = 1;
  out[3] = 1;
  return out;
}
function clone$7(a) {
  var out = new ARRAY_TYPE(6);
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[3];
  out[4] = a[4];
  out[5] = a[5];
  return out;
}
function copy$7(out, a) {
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[3];
  out[4] = a[4];
  out[5] = a[5];
  return out;
}
function identity$5(out) {
  out[0] = 1;
  out[1] = 0;
  out[2] = 0;
  out[3] = 1;
  out[4] = 0;
  out[5] = 0;
  return out;
}
function fromValues$7(a, b, c, d, tx, ty) {
  var out = new ARRAY_TYPE(6);
  out[0] = a;
  out[1] = b;
  out[2] = c;
  out[3] = d;
  out[4] = tx;
  out[5] = ty;
  return out;
}
function set$7(out, a, b, c, d, tx, ty) {
  out[0] = a;
  out[1] = b;
  out[2] = c;
  out[3] = d;
  out[4] = tx;
  out[5] = ty;
  return out;
}
function invert$4(out, a) {
  var aa = a[0], ab = a[1], ac = a[2], ad = a[3];
  var atx = a[4], aty = a[5];
  var det = aa * ad - ab * ac;
  if (!det) {
    return null;
  }
  det = 1 / det;
  out[0] = ad * det;
  out[1] = -ab * det;
  out[2] = -ac * det;
  out[3] = aa * det;
  out[4] = (ac * aty - ad * atx) * det;
  out[5] = (ab * atx - aa * aty) * det;
  return out;
}
function determinant$2(a) {
  return a[0] * a[3] - a[1] * a[2];
}
function multiply$7(out, a, b) {
  var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3], a4 = a[4], a5 = a[5];
  var b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3], b4 = b[4], b5 = b[5];
  out[0] = a0 * b0 + a2 * b1;
  out[1] = a1 * b0 + a3 * b1;
  out[2] = a0 * b2 + a2 * b3;
  out[3] = a1 * b2 + a3 * b3;
  out[4] = a0 * b4 + a2 * b5 + a4;
  out[5] = a1 * b4 + a3 * b5 + a5;
  return out;
}
function rotate$3(out, a, rad) {
  var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3], a4 = a[4], a5 = a[5];
  var s = Math.sin(rad);
  var c = Math.cos(rad);
  out[0] = a0 * c + a2 * s;
  out[1] = a1 * c + a3 * s;
  out[2] = a0 * -s + a2 * c;
  out[3] = a1 * -s + a3 * c;
  out[4] = a4;
  out[5] = a5;
  return out;
}
function scale$7(out, a, v2) {
  var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3], a4 = a[4], a5 = a[5];
  var v0 = v2[0], v1 = v2[1];
  out[0] = a0 * v0;
  out[1] = a1 * v0;
  out[2] = a2 * v1;
  out[3] = a3 * v1;
  out[4] = a4;
  out[5] = a5;
  return out;
}
function translate$3(out, a, v2) {
  var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3], a4 = a[4], a5 = a[5];
  var v0 = v2[0], v1 = v2[1];
  out[0] = a0;
  out[1] = a1;
  out[2] = a2;
  out[3] = a3;
  out[4] = a0 * v0 + a2 * v1 + a4;
  out[5] = a1 * v0 + a3 * v1 + a5;
  return out;
}
function fromRotation$3(out, rad) {
  var s = Math.sin(rad), c = Math.cos(rad);
  out[0] = c;
  out[1] = s;
  out[2] = -s;
  out[3] = c;
  out[4] = 0;
  out[5] = 0;
  return out;
}
function fromScaling$2(out, v2) {
  out[0] = v2[0];
  out[1] = 0;
  out[2] = 0;
  out[3] = v2[1];
  out[4] = 0;
  out[5] = 0;
  return out;
}
function fromTranslation$3(out, v2) {
  out[0] = 1;
  out[1] = 0;
  out[2] = 0;
  out[3] = 1;
  out[4] = v2[0];
  out[5] = v2[1];
  return out;
}
function str$7(a) {
  return "mat2d(" + a[0] + ", " + a[1] + ", " + a[2] + ", " + a[3] + ", " + a[4] + ", " + a[5] + ")";
}
function frob$2(a) {
  return Math.hypot(a[0], a[1], a[2], a[3], a[4], a[5], 1);
}
function add$7(out, a, b) {
  out[0] = a[0] + b[0];
  out[1] = a[1] + b[1];
  out[2] = a[2] + b[2];
  out[3] = a[3] + b[3];
  out[4] = a[4] + b[4];
  out[5] = a[5] + b[5];
  return out;
}
function subtract$5(out, a, b) {
  out[0] = a[0] - b[0];
  out[1] = a[1] - b[1];
  out[2] = a[2] - b[2];
  out[3] = a[3] - b[3];
  out[4] = a[4] - b[4];
  out[5] = a[5] - b[5];
  return out;
}
function multiplyScalar$2(out, a, b) {
  out[0] = a[0] * b;
  out[1] = a[1] * b;
  out[2] = a[2] * b;
  out[3] = a[3] * b;
  out[4] = a[4] * b;
  out[5] = a[5] * b;
  return out;
}
function multiplyScalarAndAdd$2(out, a, b, scale2) {
  out[0] = a[0] + b[0] * scale2;
  out[1] = a[1] + b[1] * scale2;
  out[2] = a[2] + b[2] * scale2;
  out[3] = a[3] + b[3] * scale2;
  out[4] = a[4] + b[4] * scale2;
  out[5] = a[5] + b[5] * scale2;
  return out;
}
function exactEquals$7(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3] && a[4] === b[4] && a[5] === b[5];
}
function equals$7(a, b) {
  var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3], a4 = a[4], a5 = a[5];
  var b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3], b4 = b[4], b5 = b[5];
  return Math.abs(a0 - b0) <= EPSILON * Math.max(1, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= EPSILON * Math.max(1, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= EPSILON * Math.max(1, Math.abs(a2), Math.abs(b2)) && Math.abs(a3 - b3) <= EPSILON * Math.max(1, Math.abs(a3), Math.abs(b3)) && Math.abs(a4 - b4) <= EPSILON * Math.max(1, Math.abs(a4), Math.abs(b4)) && Math.abs(a5 - b5) <= EPSILON * Math.max(1, Math.abs(a5), Math.abs(b5));
}
var mul$7 = multiply$7;
var sub$5 = subtract$5;
var mat2d = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  create: create$7,
  clone: clone$7,
  copy: copy$7,
  identity: identity$5,
  fromValues: fromValues$7,
  set: set$7,
  invert: invert$4,
  determinant: determinant$2,
  multiply: multiply$7,
  rotate: rotate$3,
  scale: scale$7,
  translate: translate$3,
  fromRotation: fromRotation$3,
  fromScaling: fromScaling$2,
  fromTranslation: fromTranslation$3,
  str: str$7,
  frob: frob$2,
  add: add$7,
  subtract: subtract$5,
  multiplyScalar: multiplyScalar$2,
  multiplyScalarAndAdd: multiplyScalarAndAdd$2,
  exactEquals: exactEquals$7,
  equals: equals$7,
  mul: mul$7,
  sub: sub$5
});
function create$6() {
  var out = new ARRAY_TYPE(9);
  if (ARRAY_TYPE != Float32Array) {
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[5] = 0;
    out[6] = 0;
    out[7] = 0;
  }
  out[0] = 1;
  out[4] = 1;
  out[8] = 1;
  return out;
}
function fromMat4$1(out, a) {
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[4];
  out[4] = a[5];
  out[5] = a[6];
  out[6] = a[8];
  out[7] = a[9];
  out[8] = a[10];
  return out;
}
function clone$6(a) {
  var out = new ARRAY_TYPE(9);
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[3];
  out[4] = a[4];
  out[5] = a[5];
  out[6] = a[6];
  out[7] = a[7];
  out[8] = a[8];
  return out;
}
function copy$6(out, a) {
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[3];
  out[4] = a[4];
  out[5] = a[5];
  out[6] = a[6];
  out[7] = a[7];
  out[8] = a[8];
  return out;
}
function fromValues$6(m00, m01, m02, m10, m11, m12, m20, m21, m22) {
  var out = new ARRAY_TYPE(9);
  out[0] = m00;
  out[1] = m01;
  out[2] = m02;
  out[3] = m10;
  out[4] = m11;
  out[5] = m12;
  out[6] = m20;
  out[7] = m21;
  out[8] = m22;
  return out;
}
function set$6(out, m00, m01, m02, m10, m11, m12, m20, m21, m22) {
  out[0] = m00;
  out[1] = m01;
  out[2] = m02;
  out[3] = m10;
  out[4] = m11;
  out[5] = m12;
  out[6] = m20;
  out[7] = m21;
  out[8] = m22;
  return out;
}
function identity$4(out) {
  out[0] = 1;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 1;
  out[5] = 0;
  out[6] = 0;
  out[7] = 0;
  out[8] = 1;
  return out;
}
function transpose$1(out, a) {
  if (out === a) {
    var a01 = a[1], a02 = a[2], a12 = a[5];
    out[1] = a[3];
    out[2] = a[6];
    out[3] = a01;
    out[5] = a[7];
    out[6] = a02;
    out[7] = a12;
  } else {
    out[0] = a[0];
    out[1] = a[3];
    out[2] = a[6];
    out[3] = a[1];
    out[4] = a[4];
    out[5] = a[7];
    out[6] = a[2];
    out[7] = a[5];
    out[8] = a[8];
  }
  return out;
}
function invert$3(out, a) {
  var a00 = a[0], a01 = a[1], a02 = a[2];
  var a10 = a[3], a11 = a[4], a12 = a[5];
  var a20 = a[6], a21 = a[7], a22 = a[8];
  var b01 = a22 * a11 - a12 * a21;
  var b11 = -a22 * a10 + a12 * a20;
  var b21 = a21 * a10 - a11 * a20;
  var det = a00 * b01 + a01 * b11 + a02 * b21;
  if (!det) {
    return null;
  }
  det = 1 / det;
  out[0] = b01 * det;
  out[1] = (-a22 * a01 + a02 * a21) * det;
  out[2] = (a12 * a01 - a02 * a11) * det;
  out[3] = b11 * det;
  out[4] = (a22 * a00 - a02 * a20) * det;
  out[5] = (-a12 * a00 + a02 * a10) * det;
  out[6] = b21 * det;
  out[7] = (-a21 * a00 + a01 * a20) * det;
  out[8] = (a11 * a00 - a01 * a10) * det;
  return out;
}
function adjoint$1(out, a) {
  var a00 = a[0], a01 = a[1], a02 = a[2];
  var a10 = a[3], a11 = a[4], a12 = a[5];
  var a20 = a[6], a21 = a[7], a22 = a[8];
  out[0] = a11 * a22 - a12 * a21;
  out[1] = a02 * a21 - a01 * a22;
  out[2] = a01 * a12 - a02 * a11;
  out[3] = a12 * a20 - a10 * a22;
  out[4] = a00 * a22 - a02 * a20;
  out[5] = a02 * a10 - a00 * a12;
  out[6] = a10 * a21 - a11 * a20;
  out[7] = a01 * a20 - a00 * a21;
  out[8] = a00 * a11 - a01 * a10;
  return out;
}
function determinant$1(a) {
  var a00 = a[0], a01 = a[1], a02 = a[2];
  var a10 = a[3], a11 = a[4], a12 = a[5];
  var a20 = a[6], a21 = a[7], a22 = a[8];
  return a00 * (a22 * a11 - a12 * a21) + a01 * (-a22 * a10 + a12 * a20) + a02 * (a21 * a10 - a11 * a20);
}
function multiply$6(out, a, b) {
  var a00 = a[0], a01 = a[1], a02 = a[2];
  var a10 = a[3], a11 = a[4], a12 = a[5];
  var a20 = a[6], a21 = a[7], a22 = a[8];
  var b00 = b[0], b01 = b[1], b02 = b[2];
  var b10 = b[3], b11 = b[4], b12 = b[5];
  var b20 = b[6], b21 = b[7], b22 = b[8];
  out[0] = b00 * a00 + b01 * a10 + b02 * a20;
  out[1] = b00 * a01 + b01 * a11 + b02 * a21;
  out[2] = b00 * a02 + b01 * a12 + b02 * a22;
  out[3] = b10 * a00 + b11 * a10 + b12 * a20;
  out[4] = b10 * a01 + b11 * a11 + b12 * a21;
  out[5] = b10 * a02 + b11 * a12 + b12 * a22;
  out[6] = b20 * a00 + b21 * a10 + b22 * a20;
  out[7] = b20 * a01 + b21 * a11 + b22 * a21;
  out[8] = b20 * a02 + b21 * a12 + b22 * a22;
  return out;
}
function translate$2(out, a, v2) {
  var a00 = a[0], a01 = a[1], a02 = a[2], a10 = a[3], a11 = a[4], a12 = a[5], a20 = a[6], a21 = a[7], a22 = a[8], x = v2[0], y = v2[1];
  out[0] = a00;
  out[1] = a01;
  out[2] = a02;
  out[3] = a10;
  out[4] = a11;
  out[5] = a12;
  out[6] = x * a00 + y * a10 + a20;
  out[7] = x * a01 + y * a11 + a21;
  out[8] = x * a02 + y * a12 + a22;
  return out;
}
function rotate$2(out, a, rad) {
  var a00 = a[0], a01 = a[1], a02 = a[2], a10 = a[3], a11 = a[4], a12 = a[5], a20 = a[6], a21 = a[7], a22 = a[8], s = Math.sin(rad), c = Math.cos(rad);
  out[0] = c * a00 + s * a10;
  out[1] = c * a01 + s * a11;
  out[2] = c * a02 + s * a12;
  out[3] = c * a10 - s * a00;
  out[4] = c * a11 - s * a01;
  out[5] = c * a12 - s * a02;
  out[6] = a20;
  out[7] = a21;
  out[8] = a22;
  return out;
}
function scale$6(out, a, v2) {
  var x = v2[0], y = v2[1];
  out[0] = x * a[0];
  out[1] = x * a[1];
  out[2] = x * a[2];
  out[3] = y * a[3];
  out[4] = y * a[4];
  out[5] = y * a[5];
  out[6] = a[6];
  out[7] = a[7];
  out[8] = a[8];
  return out;
}
function fromTranslation$2(out, v2) {
  out[0] = 1;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 1;
  out[5] = 0;
  out[6] = v2[0];
  out[7] = v2[1];
  out[8] = 1;
  return out;
}
function fromRotation$2(out, rad) {
  var s = Math.sin(rad), c = Math.cos(rad);
  out[0] = c;
  out[1] = s;
  out[2] = 0;
  out[3] = -s;
  out[4] = c;
  out[5] = 0;
  out[6] = 0;
  out[7] = 0;
  out[8] = 1;
  return out;
}
function fromScaling$1(out, v2) {
  out[0] = v2[0];
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = v2[1];
  out[5] = 0;
  out[6] = 0;
  out[7] = 0;
  out[8] = 1;
  return out;
}
function fromMat2d(out, a) {
  out[0] = a[0];
  out[1] = a[1];
  out[2] = 0;
  out[3] = a[2];
  out[4] = a[3];
  out[5] = 0;
  out[6] = a[4];
  out[7] = a[5];
  out[8] = 1;
  return out;
}
function fromQuat$1(out, q) {
  var x = q[0], y = q[1], z = q[2], w = q[3];
  var x2 = x + x;
  var y2 = y + y;
  var z2 = z + z;
  var xx = x * x2;
  var yx = y * x2;
  var yy = y * y2;
  var zx = z * x2;
  var zy = z * y2;
  var zz = z * z2;
  var wx = w * x2;
  var wy = w * y2;
  var wz = w * z2;
  out[0] = 1 - yy - zz;
  out[3] = yx - wz;
  out[6] = zx + wy;
  out[1] = yx + wz;
  out[4] = 1 - xx - zz;
  out[7] = zy - wx;
  out[2] = zx - wy;
  out[5] = zy + wx;
  out[8] = 1 - xx - yy;
  return out;
}
function normalFromMat4(out, a) {
  var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
  var a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
  var a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
  var a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
  var b00 = a00 * a11 - a01 * a10;
  var b01 = a00 * a12 - a02 * a10;
  var b02 = a00 * a13 - a03 * a10;
  var b03 = a01 * a12 - a02 * a11;
  var b04 = a01 * a13 - a03 * a11;
  var b05 = a02 * a13 - a03 * a12;
  var b06 = a20 * a31 - a21 * a30;
  var b07 = a20 * a32 - a22 * a30;
  var b08 = a20 * a33 - a23 * a30;
  var b09 = a21 * a32 - a22 * a31;
  var b10 = a21 * a33 - a23 * a31;
  var b11 = a22 * a33 - a23 * a32;
  var det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
  if (!det) {
    return null;
  }
  det = 1 / det;
  out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
  out[1] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
  out[2] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
  out[3] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
  out[4] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
  out[5] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
  out[6] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
  out[7] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
  out[8] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
  return out;
}
function projection(out, width, height) {
  out[0] = 2 / width;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = -2 / height;
  out[5] = 0;
  out[6] = -1;
  out[7] = 1;
  out[8] = 1;
  return out;
}
function str$6(a) {
  return "mat3(" + a[0] + ", " + a[1] + ", " + a[2] + ", " + a[3] + ", " + a[4] + ", " + a[5] + ", " + a[6] + ", " + a[7] + ", " + a[8] + ")";
}
function frob$1(a) {
  return Math.hypot(a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7], a[8]);
}
function add$6(out, a, b) {
  out[0] = a[0] + b[0];
  out[1] = a[1] + b[1];
  out[2] = a[2] + b[2];
  out[3] = a[3] + b[3];
  out[4] = a[4] + b[4];
  out[5] = a[5] + b[5];
  out[6] = a[6] + b[6];
  out[7] = a[7] + b[7];
  out[8] = a[8] + b[8];
  return out;
}
function subtract$4(out, a, b) {
  out[0] = a[0] - b[0];
  out[1] = a[1] - b[1];
  out[2] = a[2] - b[2];
  out[3] = a[3] - b[3];
  out[4] = a[4] - b[4];
  out[5] = a[5] - b[5];
  out[6] = a[6] - b[6];
  out[7] = a[7] - b[7];
  out[8] = a[8] - b[8];
  return out;
}
function multiplyScalar$1(out, a, b) {
  out[0] = a[0] * b;
  out[1] = a[1] * b;
  out[2] = a[2] * b;
  out[3] = a[3] * b;
  out[4] = a[4] * b;
  out[5] = a[5] * b;
  out[6] = a[6] * b;
  out[7] = a[7] * b;
  out[8] = a[8] * b;
  return out;
}
function multiplyScalarAndAdd$1(out, a, b, scale2) {
  out[0] = a[0] + b[0] * scale2;
  out[1] = a[1] + b[1] * scale2;
  out[2] = a[2] + b[2] * scale2;
  out[3] = a[3] + b[3] * scale2;
  out[4] = a[4] + b[4] * scale2;
  out[5] = a[5] + b[5] * scale2;
  out[6] = a[6] + b[6] * scale2;
  out[7] = a[7] + b[7] * scale2;
  out[8] = a[8] + b[8] * scale2;
  return out;
}
function exactEquals$6(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3] && a[4] === b[4] && a[5] === b[5] && a[6] === b[6] && a[7] === b[7] && a[8] === b[8];
}
function equals$6(a, b) {
  var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3], a4 = a[4], a5 = a[5], a6 = a[6], a7 = a[7], a8 = a[8];
  var b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3], b4 = b[4], b5 = b[5], b6 = b[6], b7 = b[7], b8 = b[8];
  return Math.abs(a0 - b0) <= EPSILON * Math.max(1, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= EPSILON * Math.max(1, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= EPSILON * Math.max(1, Math.abs(a2), Math.abs(b2)) && Math.abs(a3 - b3) <= EPSILON * Math.max(1, Math.abs(a3), Math.abs(b3)) && Math.abs(a4 - b4) <= EPSILON * Math.max(1, Math.abs(a4), Math.abs(b4)) && Math.abs(a5 - b5) <= EPSILON * Math.max(1, Math.abs(a5), Math.abs(b5)) && Math.abs(a6 - b6) <= EPSILON * Math.max(1, Math.abs(a6), Math.abs(b6)) && Math.abs(a7 - b7) <= EPSILON * Math.max(1, Math.abs(a7), Math.abs(b7)) && Math.abs(a8 - b8) <= EPSILON * Math.max(1, Math.abs(a8), Math.abs(b8));
}
var mul$6 = multiply$6;
var sub$4 = subtract$4;
var mat3 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  create: create$6,
  fromMat4: fromMat4$1,
  clone: clone$6,
  copy: copy$6,
  fromValues: fromValues$6,
  set: set$6,
  identity: identity$4,
  transpose: transpose$1,
  invert: invert$3,
  adjoint: adjoint$1,
  determinant: determinant$1,
  multiply: multiply$6,
  translate: translate$2,
  rotate: rotate$2,
  scale: scale$6,
  fromTranslation: fromTranslation$2,
  fromRotation: fromRotation$2,
  fromScaling: fromScaling$1,
  fromMat2d,
  fromQuat: fromQuat$1,
  normalFromMat4,
  projection,
  str: str$6,
  frob: frob$1,
  add: add$6,
  subtract: subtract$4,
  multiplyScalar: multiplyScalar$1,
  multiplyScalarAndAdd: multiplyScalarAndAdd$1,
  exactEquals: exactEquals$6,
  equals: equals$6,
  mul: mul$6,
  sub: sub$4
});
function create$5() {
  var out = new ARRAY_TYPE(16);
  if (ARRAY_TYPE != Float32Array) {
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
  }
  out[0] = 1;
  out[5] = 1;
  out[10] = 1;
  out[15] = 1;
  return out;
}
function clone$5(a) {
  var out = new ARRAY_TYPE(16);
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[3];
  out[4] = a[4];
  out[5] = a[5];
  out[6] = a[6];
  out[7] = a[7];
  out[8] = a[8];
  out[9] = a[9];
  out[10] = a[10];
  out[11] = a[11];
  out[12] = a[12];
  out[13] = a[13];
  out[14] = a[14];
  out[15] = a[15];
  return out;
}
function copy$5(out, a) {
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[3];
  out[4] = a[4];
  out[5] = a[5];
  out[6] = a[6];
  out[7] = a[7];
  out[8] = a[8];
  out[9] = a[9];
  out[10] = a[10];
  out[11] = a[11];
  out[12] = a[12];
  out[13] = a[13];
  out[14] = a[14];
  out[15] = a[15];
  return out;
}
function fromValues$5(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33) {
  var out = new ARRAY_TYPE(16);
  out[0] = m00;
  out[1] = m01;
  out[2] = m02;
  out[3] = m03;
  out[4] = m10;
  out[5] = m11;
  out[6] = m12;
  out[7] = m13;
  out[8] = m20;
  out[9] = m21;
  out[10] = m22;
  out[11] = m23;
  out[12] = m30;
  out[13] = m31;
  out[14] = m32;
  out[15] = m33;
  return out;
}
function set$5(out, m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33) {
  out[0] = m00;
  out[1] = m01;
  out[2] = m02;
  out[3] = m03;
  out[4] = m10;
  out[5] = m11;
  out[6] = m12;
  out[7] = m13;
  out[8] = m20;
  out[9] = m21;
  out[10] = m22;
  out[11] = m23;
  out[12] = m30;
  out[13] = m31;
  out[14] = m32;
  out[15] = m33;
  return out;
}
function identity$3(out) {
  out[0] = 1;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = 1;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = 1;
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}
function transpose(out, a) {
  if (out === a) {
    var a01 = a[1], a02 = a[2], a03 = a[3];
    var a12 = a[6], a13 = a[7];
    var a23 = a[11];
    out[1] = a[4];
    out[2] = a[8];
    out[3] = a[12];
    out[4] = a01;
    out[6] = a[9];
    out[7] = a[13];
    out[8] = a02;
    out[9] = a12;
    out[11] = a[14];
    out[12] = a03;
    out[13] = a13;
    out[14] = a23;
  } else {
    out[0] = a[0];
    out[1] = a[4];
    out[2] = a[8];
    out[3] = a[12];
    out[4] = a[1];
    out[5] = a[5];
    out[6] = a[9];
    out[7] = a[13];
    out[8] = a[2];
    out[9] = a[6];
    out[10] = a[10];
    out[11] = a[14];
    out[12] = a[3];
    out[13] = a[7];
    out[14] = a[11];
    out[15] = a[15];
  }
  return out;
}
function invert$2(out, a) {
  var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
  var a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
  var a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
  var a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
  var b00 = a00 * a11 - a01 * a10;
  var b01 = a00 * a12 - a02 * a10;
  var b02 = a00 * a13 - a03 * a10;
  var b03 = a01 * a12 - a02 * a11;
  var b04 = a01 * a13 - a03 * a11;
  var b05 = a02 * a13 - a03 * a12;
  var b06 = a20 * a31 - a21 * a30;
  var b07 = a20 * a32 - a22 * a30;
  var b08 = a20 * a33 - a23 * a30;
  var b09 = a21 * a32 - a22 * a31;
  var b10 = a21 * a33 - a23 * a31;
  var b11 = a22 * a33 - a23 * a32;
  var det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
  if (!det) {
    return null;
  }
  det = 1 / det;
  out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
  out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
  out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
  out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
  out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
  out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
  out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
  out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
  out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
  out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
  out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
  out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
  out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
  out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
  out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
  out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
  return out;
}
function adjoint(out, a) {
  var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
  var a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
  var a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
  var a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
  out[0] = a11 * (a22 * a33 - a23 * a32) - a21 * (a12 * a33 - a13 * a32) + a31 * (a12 * a23 - a13 * a22);
  out[1] = -(a01 * (a22 * a33 - a23 * a32) - a21 * (a02 * a33 - a03 * a32) + a31 * (a02 * a23 - a03 * a22));
  out[2] = a01 * (a12 * a33 - a13 * a32) - a11 * (a02 * a33 - a03 * a32) + a31 * (a02 * a13 - a03 * a12);
  out[3] = -(a01 * (a12 * a23 - a13 * a22) - a11 * (a02 * a23 - a03 * a22) + a21 * (a02 * a13 - a03 * a12));
  out[4] = -(a10 * (a22 * a33 - a23 * a32) - a20 * (a12 * a33 - a13 * a32) + a30 * (a12 * a23 - a13 * a22));
  out[5] = a00 * (a22 * a33 - a23 * a32) - a20 * (a02 * a33 - a03 * a32) + a30 * (a02 * a23 - a03 * a22);
  out[6] = -(a00 * (a12 * a33 - a13 * a32) - a10 * (a02 * a33 - a03 * a32) + a30 * (a02 * a13 - a03 * a12));
  out[7] = a00 * (a12 * a23 - a13 * a22) - a10 * (a02 * a23 - a03 * a22) + a20 * (a02 * a13 - a03 * a12);
  out[8] = a10 * (a21 * a33 - a23 * a31) - a20 * (a11 * a33 - a13 * a31) + a30 * (a11 * a23 - a13 * a21);
  out[9] = -(a00 * (a21 * a33 - a23 * a31) - a20 * (a01 * a33 - a03 * a31) + a30 * (a01 * a23 - a03 * a21));
  out[10] = a00 * (a11 * a33 - a13 * a31) - a10 * (a01 * a33 - a03 * a31) + a30 * (a01 * a13 - a03 * a11);
  out[11] = -(a00 * (a11 * a23 - a13 * a21) - a10 * (a01 * a23 - a03 * a21) + a20 * (a01 * a13 - a03 * a11));
  out[12] = -(a10 * (a21 * a32 - a22 * a31) - a20 * (a11 * a32 - a12 * a31) + a30 * (a11 * a22 - a12 * a21));
  out[13] = a00 * (a21 * a32 - a22 * a31) - a20 * (a01 * a32 - a02 * a31) + a30 * (a01 * a22 - a02 * a21);
  out[14] = -(a00 * (a11 * a32 - a12 * a31) - a10 * (a01 * a32 - a02 * a31) + a30 * (a01 * a12 - a02 * a11));
  out[15] = a00 * (a11 * a22 - a12 * a21) - a10 * (a01 * a22 - a02 * a21) + a20 * (a01 * a12 - a02 * a11);
  return out;
}
function determinant(a) {
  var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
  var a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
  var a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
  var a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
  var b00 = a00 * a11 - a01 * a10;
  var b01 = a00 * a12 - a02 * a10;
  var b02 = a00 * a13 - a03 * a10;
  var b03 = a01 * a12 - a02 * a11;
  var b04 = a01 * a13 - a03 * a11;
  var b05 = a02 * a13 - a03 * a12;
  var b06 = a20 * a31 - a21 * a30;
  var b07 = a20 * a32 - a22 * a30;
  var b08 = a20 * a33 - a23 * a30;
  var b09 = a21 * a32 - a22 * a31;
  var b10 = a21 * a33 - a23 * a31;
  var b11 = a22 * a33 - a23 * a32;
  return b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
}
function multiply$5(out, a, b) {
  var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
  var a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
  var a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
  var a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
  var b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
  out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
  b0 = b[4];
  b1 = b[5];
  b2 = b[6];
  b3 = b[7];
  out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
  b0 = b[8];
  b1 = b[9];
  b2 = b[10];
  b3 = b[11];
  out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
  b0 = b[12];
  b1 = b[13];
  b2 = b[14];
  b3 = b[15];
  out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
  return out;
}
function translate$1(out, a, v2) {
  var x = v2[0], y = v2[1], z = v2[2];
  var a00, a01, a02, a03;
  var a10, a11, a12, a13;
  var a20, a21, a22, a23;
  if (a === out) {
    out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
    out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
    out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
    out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
  } else {
    a00 = a[0];
    a01 = a[1];
    a02 = a[2];
    a03 = a[3];
    a10 = a[4];
    a11 = a[5];
    a12 = a[6];
    a13 = a[7];
    a20 = a[8];
    a21 = a[9];
    a22 = a[10];
    a23 = a[11];
    out[0] = a00;
    out[1] = a01;
    out[2] = a02;
    out[3] = a03;
    out[4] = a10;
    out[5] = a11;
    out[6] = a12;
    out[7] = a13;
    out[8] = a20;
    out[9] = a21;
    out[10] = a22;
    out[11] = a23;
    out[12] = a00 * x + a10 * y + a20 * z + a[12];
    out[13] = a01 * x + a11 * y + a21 * z + a[13];
    out[14] = a02 * x + a12 * y + a22 * z + a[14];
    out[15] = a03 * x + a13 * y + a23 * z + a[15];
  }
  return out;
}
function scale$5(out, a, v2) {
  var x = v2[0], y = v2[1], z = v2[2];
  out[0] = a[0] * x;
  out[1] = a[1] * x;
  out[2] = a[2] * x;
  out[3] = a[3] * x;
  out[4] = a[4] * y;
  out[5] = a[5] * y;
  out[6] = a[6] * y;
  out[7] = a[7] * y;
  out[8] = a[8] * z;
  out[9] = a[9] * z;
  out[10] = a[10] * z;
  out[11] = a[11] * z;
  out[12] = a[12];
  out[13] = a[13];
  out[14] = a[14];
  out[15] = a[15];
  return out;
}
function rotate$1(out, a, rad, axis) {
  var x = axis[0], y = axis[1], z = axis[2];
  var len2 = Math.hypot(x, y, z);
  var s, c, t;
  var a00, a01, a02, a03;
  var a10, a11, a12, a13;
  var a20, a21, a22, a23;
  var b00, b01, b02;
  var b10, b11, b12;
  var b20, b21, b22;
  if (len2 < EPSILON) {
    return null;
  }
  len2 = 1 / len2;
  x *= len2;
  y *= len2;
  z *= len2;
  s = Math.sin(rad);
  c = Math.cos(rad);
  t = 1 - c;
  a00 = a[0];
  a01 = a[1];
  a02 = a[2];
  a03 = a[3];
  a10 = a[4];
  a11 = a[5];
  a12 = a[6];
  a13 = a[7];
  a20 = a[8];
  a21 = a[9];
  a22 = a[10];
  a23 = a[11];
  b00 = x * x * t + c;
  b01 = y * x * t + z * s;
  b02 = z * x * t - y * s;
  b10 = x * y * t - z * s;
  b11 = y * y * t + c;
  b12 = z * y * t + x * s;
  b20 = x * z * t + y * s;
  b21 = y * z * t - x * s;
  b22 = z * z * t + c;
  out[0] = a00 * b00 + a10 * b01 + a20 * b02;
  out[1] = a01 * b00 + a11 * b01 + a21 * b02;
  out[2] = a02 * b00 + a12 * b01 + a22 * b02;
  out[3] = a03 * b00 + a13 * b01 + a23 * b02;
  out[4] = a00 * b10 + a10 * b11 + a20 * b12;
  out[5] = a01 * b10 + a11 * b11 + a21 * b12;
  out[6] = a02 * b10 + a12 * b11 + a22 * b12;
  out[7] = a03 * b10 + a13 * b11 + a23 * b12;
  out[8] = a00 * b20 + a10 * b21 + a20 * b22;
  out[9] = a01 * b20 + a11 * b21 + a21 * b22;
  out[10] = a02 * b20 + a12 * b21 + a22 * b22;
  out[11] = a03 * b20 + a13 * b21 + a23 * b22;
  if (a !== out) {
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
  }
  return out;
}
function rotateX$3(out, a, rad) {
  var s = Math.sin(rad);
  var c = Math.cos(rad);
  var a10 = a[4];
  var a11 = a[5];
  var a12 = a[6];
  var a13 = a[7];
  var a20 = a[8];
  var a21 = a[9];
  var a22 = a[10];
  var a23 = a[11];
  if (a !== out) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
  }
  out[4] = a10 * c + a20 * s;
  out[5] = a11 * c + a21 * s;
  out[6] = a12 * c + a22 * s;
  out[7] = a13 * c + a23 * s;
  out[8] = a20 * c - a10 * s;
  out[9] = a21 * c - a11 * s;
  out[10] = a22 * c - a12 * s;
  out[11] = a23 * c - a13 * s;
  return out;
}
function rotateY$3(out, a, rad) {
  var s = Math.sin(rad);
  var c = Math.cos(rad);
  var a00 = a[0];
  var a01 = a[1];
  var a02 = a[2];
  var a03 = a[3];
  var a20 = a[8];
  var a21 = a[9];
  var a22 = a[10];
  var a23 = a[11];
  if (a !== out) {
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
  }
  out[0] = a00 * c - a20 * s;
  out[1] = a01 * c - a21 * s;
  out[2] = a02 * c - a22 * s;
  out[3] = a03 * c - a23 * s;
  out[8] = a00 * s + a20 * c;
  out[9] = a01 * s + a21 * c;
  out[10] = a02 * s + a22 * c;
  out[11] = a03 * s + a23 * c;
  return out;
}
function rotateZ$3(out, a, rad) {
  var s = Math.sin(rad);
  var c = Math.cos(rad);
  var a00 = a[0];
  var a01 = a[1];
  var a02 = a[2];
  var a03 = a[3];
  var a10 = a[4];
  var a11 = a[5];
  var a12 = a[6];
  var a13 = a[7];
  if (a !== out) {
    out[8] = a[8];
    out[9] = a[9];
    out[10] = a[10];
    out[11] = a[11];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
  }
  out[0] = a00 * c + a10 * s;
  out[1] = a01 * c + a11 * s;
  out[2] = a02 * c + a12 * s;
  out[3] = a03 * c + a13 * s;
  out[4] = a10 * c - a00 * s;
  out[5] = a11 * c - a01 * s;
  out[6] = a12 * c - a02 * s;
  out[7] = a13 * c - a03 * s;
  return out;
}
function fromTranslation$1(out, v2) {
  out[0] = 1;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = 1;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = 1;
  out[11] = 0;
  out[12] = v2[0];
  out[13] = v2[1];
  out[14] = v2[2];
  out[15] = 1;
  return out;
}
function fromScaling(out, v2) {
  out[0] = v2[0];
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = v2[1];
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = v2[2];
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}
function fromRotation$1(out, rad, axis) {
  var x = axis[0], y = axis[1], z = axis[2];
  var len2 = Math.hypot(x, y, z);
  var s, c, t;
  if (len2 < EPSILON) {
    return null;
  }
  len2 = 1 / len2;
  x *= len2;
  y *= len2;
  z *= len2;
  s = Math.sin(rad);
  c = Math.cos(rad);
  t = 1 - c;
  out[0] = x * x * t + c;
  out[1] = y * x * t + z * s;
  out[2] = z * x * t - y * s;
  out[3] = 0;
  out[4] = x * y * t - z * s;
  out[5] = y * y * t + c;
  out[6] = z * y * t + x * s;
  out[7] = 0;
  out[8] = x * z * t + y * s;
  out[9] = y * z * t - x * s;
  out[10] = z * z * t + c;
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}
function fromXRotation(out, rad) {
  var s = Math.sin(rad);
  var c = Math.cos(rad);
  out[0] = 1;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = c;
  out[6] = s;
  out[7] = 0;
  out[8] = 0;
  out[9] = -s;
  out[10] = c;
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}
function fromYRotation(out, rad) {
  var s = Math.sin(rad);
  var c = Math.cos(rad);
  out[0] = c;
  out[1] = 0;
  out[2] = -s;
  out[3] = 0;
  out[4] = 0;
  out[5] = 1;
  out[6] = 0;
  out[7] = 0;
  out[8] = s;
  out[9] = 0;
  out[10] = c;
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}
function fromZRotation(out, rad) {
  var s = Math.sin(rad);
  var c = Math.cos(rad);
  out[0] = c;
  out[1] = s;
  out[2] = 0;
  out[3] = 0;
  out[4] = -s;
  out[5] = c;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = 1;
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}
function fromRotationTranslation$1(out, q, v2) {
  var x = q[0], y = q[1], z = q[2], w = q[3];
  var x2 = x + x;
  var y2 = y + y;
  var z2 = z + z;
  var xx = x * x2;
  var xy = x * y2;
  var xz = x * z2;
  var yy = y * y2;
  var yz = y * z2;
  var zz = z * z2;
  var wx = w * x2;
  var wy = w * y2;
  var wz = w * z2;
  out[0] = 1 - (yy + zz);
  out[1] = xy + wz;
  out[2] = xz - wy;
  out[3] = 0;
  out[4] = xy - wz;
  out[5] = 1 - (xx + zz);
  out[6] = yz + wx;
  out[7] = 0;
  out[8] = xz + wy;
  out[9] = yz - wx;
  out[10] = 1 - (xx + yy);
  out[11] = 0;
  out[12] = v2[0];
  out[13] = v2[1];
  out[14] = v2[2];
  out[15] = 1;
  return out;
}
function fromQuat2(out, a) {
  var translation = new ARRAY_TYPE(3);
  var bx = -a[0], by = -a[1], bz = -a[2], bw = a[3], ax = a[4], ay = a[5], az = a[6], aw = a[7];
  var magnitude = bx * bx + by * by + bz * bz + bw * bw;
  if (magnitude > 0) {
    translation[0] = (ax * bw + aw * bx + ay * bz - az * by) * 2 / magnitude;
    translation[1] = (ay * bw + aw * by + az * bx - ax * bz) * 2 / magnitude;
    translation[2] = (az * bw + aw * bz + ax * by - ay * bx) * 2 / magnitude;
  } else {
    translation[0] = (ax * bw + aw * bx + ay * bz - az * by) * 2;
    translation[1] = (ay * bw + aw * by + az * bx - ax * bz) * 2;
    translation[2] = (az * bw + aw * bz + ax * by - ay * bx) * 2;
  }
  fromRotationTranslation$1(out, a, translation);
  return out;
}
function getTranslation$1(out, mat) {
  out[0] = mat[12];
  out[1] = mat[13];
  out[2] = mat[14];
  return out;
}
function getScaling(out, mat) {
  var m11 = mat[0];
  var m12 = mat[1];
  var m13 = mat[2];
  var m21 = mat[4];
  var m22 = mat[5];
  var m23 = mat[6];
  var m31 = mat[8];
  var m32 = mat[9];
  var m33 = mat[10];
  out[0] = Math.hypot(m11, m12, m13);
  out[1] = Math.hypot(m21, m22, m23);
  out[2] = Math.hypot(m31, m32, m33);
  return out;
}
function getRotation(out, mat) {
  var scaling = new ARRAY_TYPE(3);
  getScaling(scaling, mat);
  var is1 = 1 / scaling[0];
  var is2 = 1 / scaling[1];
  var is3 = 1 / scaling[2];
  var sm11 = mat[0] * is1;
  var sm12 = mat[1] * is2;
  var sm13 = mat[2] * is3;
  var sm21 = mat[4] * is1;
  var sm22 = mat[5] * is2;
  var sm23 = mat[6] * is3;
  var sm31 = mat[8] * is1;
  var sm32 = mat[9] * is2;
  var sm33 = mat[10] * is3;
  var trace = sm11 + sm22 + sm33;
  var S = 0;
  if (trace > 0) {
    S = Math.sqrt(trace + 1) * 2;
    out[3] = 0.25 * S;
    out[0] = (sm23 - sm32) / S;
    out[1] = (sm31 - sm13) / S;
    out[2] = (sm12 - sm21) / S;
  } else if (sm11 > sm22 && sm11 > sm33) {
    S = Math.sqrt(1 + sm11 - sm22 - sm33) * 2;
    out[3] = (sm23 - sm32) / S;
    out[0] = 0.25 * S;
    out[1] = (sm12 + sm21) / S;
    out[2] = (sm31 + sm13) / S;
  } else if (sm22 > sm33) {
    S = Math.sqrt(1 + sm22 - sm11 - sm33) * 2;
    out[3] = (sm31 - sm13) / S;
    out[0] = (sm12 + sm21) / S;
    out[1] = 0.25 * S;
    out[2] = (sm23 + sm32) / S;
  } else {
    S = Math.sqrt(1 + sm33 - sm11 - sm22) * 2;
    out[3] = (sm12 - sm21) / S;
    out[0] = (sm31 + sm13) / S;
    out[1] = (sm23 + sm32) / S;
    out[2] = 0.25 * S;
  }
  return out;
}
function fromRotationTranslationScale(out, q, v2, s) {
  var x = q[0], y = q[1], z = q[2], w = q[3];
  var x2 = x + x;
  var y2 = y + y;
  var z2 = z + z;
  var xx = x * x2;
  var xy = x * y2;
  var xz = x * z2;
  var yy = y * y2;
  var yz = y * z2;
  var zz = z * z2;
  var wx = w * x2;
  var wy = w * y2;
  var wz = w * z2;
  var sx = s[0];
  var sy = s[1];
  var sz = s[2];
  out[0] = (1 - (yy + zz)) * sx;
  out[1] = (xy + wz) * sx;
  out[2] = (xz - wy) * sx;
  out[3] = 0;
  out[4] = (xy - wz) * sy;
  out[5] = (1 - (xx + zz)) * sy;
  out[6] = (yz + wx) * sy;
  out[7] = 0;
  out[8] = (xz + wy) * sz;
  out[9] = (yz - wx) * sz;
  out[10] = (1 - (xx + yy)) * sz;
  out[11] = 0;
  out[12] = v2[0];
  out[13] = v2[1];
  out[14] = v2[2];
  out[15] = 1;
  return out;
}
function fromRotationTranslationScaleOrigin(out, q, v2, s, o) {
  var x = q[0], y = q[1], z = q[2], w = q[3];
  var x2 = x + x;
  var y2 = y + y;
  var z2 = z + z;
  var xx = x * x2;
  var xy = x * y2;
  var xz = x * z2;
  var yy = y * y2;
  var yz = y * z2;
  var zz = z * z2;
  var wx = w * x2;
  var wy = w * y2;
  var wz = w * z2;
  var sx = s[0];
  var sy = s[1];
  var sz = s[2];
  var ox = o[0];
  var oy = o[1];
  var oz = o[2];
  var out0 = (1 - (yy + zz)) * sx;
  var out1 = (xy + wz) * sx;
  var out2 = (xz - wy) * sx;
  var out4 = (xy - wz) * sy;
  var out5 = (1 - (xx + zz)) * sy;
  var out6 = (yz + wx) * sy;
  var out8 = (xz + wy) * sz;
  var out9 = (yz - wx) * sz;
  var out10 = (1 - (xx + yy)) * sz;
  out[0] = out0;
  out[1] = out1;
  out[2] = out2;
  out[3] = 0;
  out[4] = out4;
  out[5] = out5;
  out[6] = out6;
  out[7] = 0;
  out[8] = out8;
  out[9] = out9;
  out[10] = out10;
  out[11] = 0;
  out[12] = v2[0] + ox - (out0 * ox + out4 * oy + out8 * oz);
  out[13] = v2[1] + oy - (out1 * ox + out5 * oy + out9 * oz);
  out[14] = v2[2] + oz - (out2 * ox + out6 * oy + out10 * oz);
  out[15] = 1;
  return out;
}
function fromQuat(out, q) {
  var x = q[0], y = q[1], z = q[2], w = q[3];
  var x2 = x + x;
  var y2 = y + y;
  var z2 = z + z;
  var xx = x * x2;
  var yx = y * x2;
  var yy = y * y2;
  var zx = z * x2;
  var zy = z * y2;
  var zz = z * z2;
  var wx = w * x2;
  var wy = w * y2;
  var wz = w * z2;
  out[0] = 1 - yy - zz;
  out[1] = yx + wz;
  out[2] = zx - wy;
  out[3] = 0;
  out[4] = yx - wz;
  out[5] = 1 - xx - zz;
  out[6] = zy + wx;
  out[7] = 0;
  out[8] = zx + wy;
  out[9] = zy - wx;
  out[10] = 1 - xx - yy;
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}
function frustum(out, left, right, bottom, top, near, far) {
  var rl = 1 / (right - left);
  var tb = 1 / (top - bottom);
  var nf = 1 / (near - far);
  out[0] = near * 2 * rl;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = near * 2 * tb;
  out[6] = 0;
  out[7] = 0;
  out[8] = (right + left) * rl;
  out[9] = (top + bottom) * tb;
  out[10] = (far + near) * nf;
  out[11] = -1;
  out[12] = 0;
  out[13] = 0;
  out[14] = far * near * 2 * nf;
  out[15] = 0;
  return out;
}
function perspective(out, fovy, aspect, near, far) {
  var f = 1 / Math.tan(fovy / 2), nf;
  out[0] = f / aspect;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = f;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[11] = -1;
  out[12] = 0;
  out[13] = 0;
  out[15] = 0;
  if (far != null && far !== Infinity) {
    nf = 1 / (near - far);
    out[10] = (far + near) * nf;
    out[14] = 2 * far * near * nf;
  } else {
    out[10] = -1;
    out[14] = -2 * near;
  }
  return out;
}
function perspectiveFromFieldOfView(out, fov, near, far) {
  var upTan = Math.tan(fov.upDegrees * Math.PI / 180);
  var downTan = Math.tan(fov.downDegrees * Math.PI / 180);
  var leftTan = Math.tan(fov.leftDegrees * Math.PI / 180);
  var rightTan = Math.tan(fov.rightDegrees * Math.PI / 180);
  var xScale = 2 / (leftTan + rightTan);
  var yScale = 2 / (upTan + downTan);
  out[0] = xScale;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = yScale;
  out[6] = 0;
  out[7] = 0;
  out[8] = -((leftTan - rightTan) * xScale * 0.5);
  out[9] = (upTan - downTan) * yScale * 0.5;
  out[10] = far / (near - far);
  out[11] = -1;
  out[12] = 0;
  out[13] = 0;
  out[14] = far * near / (near - far);
  out[15] = 0;
  return out;
}
function ortho(out, left, right, bottom, top, near, far) {
  var lr = 1 / (left - right);
  var bt = 1 / (bottom - top);
  var nf = 1 / (near - far);
  out[0] = -2 * lr;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = -2 * bt;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = 2 * nf;
  out[11] = 0;
  out[12] = (left + right) * lr;
  out[13] = (top + bottom) * bt;
  out[14] = (far + near) * nf;
  out[15] = 1;
  return out;
}
function lookAt(out, eye, center, up) {
  var x0, x1, x2, y0, y1, y2, z0, z1, z2, len2;
  var eyex = eye[0];
  var eyey = eye[1];
  var eyez = eye[2];
  var upx = up[0];
  var upy = up[1];
  var upz = up[2];
  var centerx = center[0];
  var centery = center[1];
  var centerz = center[2];
  if (Math.abs(eyex - centerx) < EPSILON && Math.abs(eyey - centery) < EPSILON && Math.abs(eyez - centerz) < EPSILON) {
    return identity$3(out);
  }
  z0 = eyex - centerx;
  z1 = eyey - centery;
  z2 = eyez - centerz;
  len2 = 1 / Math.hypot(z0, z1, z2);
  z0 *= len2;
  z1 *= len2;
  z2 *= len2;
  x0 = upy * z2 - upz * z1;
  x1 = upz * z0 - upx * z2;
  x2 = upx * z1 - upy * z0;
  len2 = Math.hypot(x0, x1, x2);
  if (!len2) {
    x0 = 0;
    x1 = 0;
    x2 = 0;
  } else {
    len2 = 1 / len2;
    x0 *= len2;
    x1 *= len2;
    x2 *= len2;
  }
  y0 = z1 * x2 - z2 * x1;
  y1 = z2 * x0 - z0 * x2;
  y2 = z0 * x1 - z1 * x0;
  len2 = Math.hypot(y0, y1, y2);
  if (!len2) {
    y0 = 0;
    y1 = 0;
    y2 = 0;
  } else {
    len2 = 1 / len2;
    y0 *= len2;
    y1 *= len2;
    y2 *= len2;
  }
  out[0] = x0;
  out[1] = y0;
  out[2] = z0;
  out[3] = 0;
  out[4] = x1;
  out[5] = y1;
  out[6] = z1;
  out[7] = 0;
  out[8] = x2;
  out[9] = y2;
  out[10] = z2;
  out[11] = 0;
  out[12] = -(x0 * eyex + x1 * eyey + x2 * eyez);
  out[13] = -(y0 * eyex + y1 * eyey + y2 * eyez);
  out[14] = -(z0 * eyex + z1 * eyey + z2 * eyez);
  out[15] = 1;
  return out;
}
function targetTo(out, eye, target, up) {
  var eyex = eye[0], eyey = eye[1], eyez = eye[2], upx = up[0], upy = up[1], upz = up[2];
  var z0 = eyex - target[0], z1 = eyey - target[1], z2 = eyez - target[2];
  var len2 = z0 * z0 + z1 * z1 + z2 * z2;
  if (len2 > 0) {
    len2 = 1 / Math.sqrt(len2);
    z0 *= len2;
    z1 *= len2;
    z2 *= len2;
  }
  var x0 = upy * z2 - upz * z1, x1 = upz * z0 - upx * z2, x2 = upx * z1 - upy * z0;
  len2 = x0 * x0 + x1 * x1 + x2 * x2;
  if (len2 > 0) {
    len2 = 1 / Math.sqrt(len2);
    x0 *= len2;
    x1 *= len2;
    x2 *= len2;
  }
  out[0] = x0;
  out[1] = x1;
  out[2] = x2;
  out[3] = 0;
  out[4] = z1 * x2 - z2 * x1;
  out[5] = z2 * x0 - z0 * x2;
  out[6] = z0 * x1 - z1 * x0;
  out[7] = 0;
  out[8] = z0;
  out[9] = z1;
  out[10] = z2;
  out[11] = 0;
  out[12] = eyex;
  out[13] = eyey;
  out[14] = eyez;
  out[15] = 1;
  return out;
}
function str$5(a) {
  return "mat4(" + a[0] + ", " + a[1] + ", " + a[2] + ", " + a[3] + ", " + a[4] + ", " + a[5] + ", " + a[6] + ", " + a[7] + ", " + a[8] + ", " + a[9] + ", " + a[10] + ", " + a[11] + ", " + a[12] + ", " + a[13] + ", " + a[14] + ", " + a[15] + ")";
}
function frob(a) {
  return Math.hypot(a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7], a[8], a[9], a[10], a[11], a[12], a[13], a[14], a[15]);
}
function add$5(out, a, b) {
  out[0] = a[0] + b[0];
  out[1] = a[1] + b[1];
  out[2] = a[2] + b[2];
  out[3] = a[3] + b[3];
  out[4] = a[4] + b[4];
  out[5] = a[5] + b[5];
  out[6] = a[6] + b[6];
  out[7] = a[7] + b[7];
  out[8] = a[8] + b[8];
  out[9] = a[9] + b[9];
  out[10] = a[10] + b[10];
  out[11] = a[11] + b[11];
  out[12] = a[12] + b[12];
  out[13] = a[13] + b[13];
  out[14] = a[14] + b[14];
  out[15] = a[15] + b[15];
  return out;
}
function subtract$3(out, a, b) {
  out[0] = a[0] - b[0];
  out[1] = a[1] - b[1];
  out[2] = a[2] - b[2];
  out[3] = a[3] - b[3];
  out[4] = a[4] - b[4];
  out[5] = a[5] - b[5];
  out[6] = a[6] - b[6];
  out[7] = a[7] - b[7];
  out[8] = a[8] - b[8];
  out[9] = a[9] - b[9];
  out[10] = a[10] - b[10];
  out[11] = a[11] - b[11];
  out[12] = a[12] - b[12];
  out[13] = a[13] - b[13];
  out[14] = a[14] - b[14];
  out[15] = a[15] - b[15];
  return out;
}
function multiplyScalar(out, a, b) {
  out[0] = a[0] * b;
  out[1] = a[1] * b;
  out[2] = a[2] * b;
  out[3] = a[3] * b;
  out[4] = a[4] * b;
  out[5] = a[5] * b;
  out[6] = a[6] * b;
  out[7] = a[7] * b;
  out[8] = a[8] * b;
  out[9] = a[9] * b;
  out[10] = a[10] * b;
  out[11] = a[11] * b;
  out[12] = a[12] * b;
  out[13] = a[13] * b;
  out[14] = a[14] * b;
  out[15] = a[15] * b;
  return out;
}
function multiplyScalarAndAdd(out, a, b, scale2) {
  out[0] = a[0] + b[0] * scale2;
  out[1] = a[1] + b[1] * scale2;
  out[2] = a[2] + b[2] * scale2;
  out[3] = a[3] + b[3] * scale2;
  out[4] = a[4] + b[4] * scale2;
  out[5] = a[5] + b[5] * scale2;
  out[6] = a[6] + b[6] * scale2;
  out[7] = a[7] + b[7] * scale2;
  out[8] = a[8] + b[8] * scale2;
  out[9] = a[9] + b[9] * scale2;
  out[10] = a[10] + b[10] * scale2;
  out[11] = a[11] + b[11] * scale2;
  out[12] = a[12] + b[12] * scale2;
  out[13] = a[13] + b[13] * scale2;
  out[14] = a[14] + b[14] * scale2;
  out[15] = a[15] + b[15] * scale2;
  return out;
}
function exactEquals$5(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3] && a[4] === b[4] && a[5] === b[5] && a[6] === b[6] && a[7] === b[7] && a[8] === b[8] && a[9] === b[9] && a[10] === b[10] && a[11] === b[11] && a[12] === b[12] && a[13] === b[13] && a[14] === b[14] && a[15] === b[15];
}
function equals$5(a, b) {
  var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3];
  var a4 = a[4], a5 = a[5], a6 = a[6], a7 = a[7];
  var a8 = a[8], a9 = a[9], a10 = a[10], a11 = a[11];
  var a12 = a[12], a13 = a[13], a14 = a[14], a15 = a[15];
  var b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
  var b4 = b[4], b5 = b[5], b6 = b[6], b7 = b[7];
  var b8 = b[8], b9 = b[9], b10 = b[10], b11 = b[11];
  var b12 = b[12], b13 = b[13], b14 = b[14], b15 = b[15];
  return Math.abs(a0 - b0) <= EPSILON * Math.max(1, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= EPSILON * Math.max(1, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= EPSILON * Math.max(1, Math.abs(a2), Math.abs(b2)) && Math.abs(a3 - b3) <= EPSILON * Math.max(1, Math.abs(a3), Math.abs(b3)) && Math.abs(a4 - b4) <= EPSILON * Math.max(1, Math.abs(a4), Math.abs(b4)) && Math.abs(a5 - b5) <= EPSILON * Math.max(1, Math.abs(a5), Math.abs(b5)) && Math.abs(a6 - b6) <= EPSILON * Math.max(1, Math.abs(a6), Math.abs(b6)) && Math.abs(a7 - b7) <= EPSILON * Math.max(1, Math.abs(a7), Math.abs(b7)) && Math.abs(a8 - b8) <= EPSILON * Math.max(1, Math.abs(a8), Math.abs(b8)) && Math.abs(a9 - b9) <= EPSILON * Math.max(1, Math.abs(a9), Math.abs(b9)) && Math.abs(a10 - b10) <= EPSILON * Math.max(1, Math.abs(a10), Math.abs(b10)) && Math.abs(a11 - b11) <= EPSILON * Math.max(1, Math.abs(a11), Math.abs(b11)) && Math.abs(a12 - b12) <= EPSILON * Math.max(1, Math.abs(a12), Math.abs(b12)) && Math.abs(a13 - b13) <= EPSILON * Math.max(1, Math.abs(a13), Math.abs(b13)) && Math.abs(a14 - b14) <= EPSILON * Math.max(1, Math.abs(a14), Math.abs(b14)) && Math.abs(a15 - b15) <= EPSILON * Math.max(1, Math.abs(a15), Math.abs(b15));
}
var mul$5 = multiply$5;
var sub$3 = subtract$3;
var mat4$6 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  create: create$5,
  clone: clone$5,
  copy: copy$5,
  fromValues: fromValues$5,
  set: set$5,
  identity: identity$3,
  transpose,
  invert: invert$2,
  adjoint,
  determinant,
  multiply: multiply$5,
  translate: translate$1,
  scale: scale$5,
  rotate: rotate$1,
  rotateX: rotateX$3,
  rotateY: rotateY$3,
  rotateZ: rotateZ$3,
  fromTranslation: fromTranslation$1,
  fromScaling,
  fromRotation: fromRotation$1,
  fromXRotation,
  fromYRotation,
  fromZRotation,
  fromRotationTranslation: fromRotationTranslation$1,
  fromQuat2,
  getTranslation: getTranslation$1,
  getScaling,
  getRotation,
  fromRotationTranslationScale,
  fromRotationTranslationScaleOrigin,
  fromQuat,
  frustum,
  perspective,
  perspectiveFromFieldOfView,
  ortho,
  lookAt,
  targetTo,
  str: str$5,
  frob,
  add: add$5,
  subtract: subtract$3,
  multiplyScalar,
  multiplyScalarAndAdd,
  exactEquals: exactEquals$5,
  equals: equals$5,
  mul: mul$5,
  sub: sub$3
});
function create$4() {
  var out = new ARRAY_TYPE(3);
  if (ARRAY_TYPE != Float32Array) {
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
  }
  return out;
}
function clone$4(a) {
  var out = new ARRAY_TYPE(3);
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  return out;
}
function length$4(a) {
  var x = a[0];
  var y = a[1];
  var z = a[2];
  return Math.hypot(x, y, z);
}
function fromValues$4(x, y, z) {
  var out = new ARRAY_TYPE(3);
  out[0] = x;
  out[1] = y;
  out[2] = z;
  return out;
}
function copy$4(out, a) {
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  return out;
}
function set$4(out, x, y, z) {
  out[0] = x;
  out[1] = y;
  out[2] = z;
  return out;
}
function add$4(out, a, b) {
  out[0] = a[0] + b[0];
  out[1] = a[1] + b[1];
  out[2] = a[2] + b[2];
  return out;
}
function subtract$2(out, a, b) {
  out[0] = a[0] - b[0];
  out[1] = a[1] - b[1];
  out[2] = a[2] - b[2];
  return out;
}
function multiply$4(out, a, b) {
  out[0] = a[0] * b[0];
  out[1] = a[1] * b[1];
  out[2] = a[2] * b[2];
  return out;
}
function divide$2(out, a, b) {
  out[0] = a[0] / b[0];
  out[1] = a[1] / b[1];
  out[2] = a[2] / b[2];
  return out;
}
function ceil$2(out, a) {
  out[0] = Math.ceil(a[0]);
  out[1] = Math.ceil(a[1]);
  out[2] = Math.ceil(a[2]);
  return out;
}
function floor$2(out, a) {
  out[0] = Math.floor(a[0]);
  out[1] = Math.floor(a[1]);
  out[2] = Math.floor(a[2]);
  return out;
}
function min$2(out, a, b) {
  out[0] = Math.min(a[0], b[0]);
  out[1] = Math.min(a[1], b[1]);
  out[2] = Math.min(a[2], b[2]);
  return out;
}
function max$2(out, a, b) {
  out[0] = Math.max(a[0], b[0]);
  out[1] = Math.max(a[1], b[1]);
  out[2] = Math.max(a[2], b[2]);
  return out;
}
function round$2(out, a) {
  out[0] = Math.round(a[0]);
  out[1] = Math.round(a[1]);
  out[2] = Math.round(a[2]);
  return out;
}
function scale$4(out, a, b) {
  out[0] = a[0] * b;
  out[1] = a[1] * b;
  out[2] = a[2] * b;
  return out;
}
function scaleAndAdd$2(out, a, b, scale2) {
  out[0] = a[0] + b[0] * scale2;
  out[1] = a[1] + b[1] * scale2;
  out[2] = a[2] + b[2] * scale2;
  return out;
}
function distance$2(a, b) {
  var x = b[0] - a[0];
  var y = b[1] - a[1];
  var z = b[2] - a[2];
  return Math.hypot(x, y, z);
}
function squaredDistance$2(a, b) {
  var x = b[0] - a[0];
  var y = b[1] - a[1];
  var z = b[2] - a[2];
  return x * x + y * y + z * z;
}
function squaredLength$4(a) {
  var x = a[0];
  var y = a[1];
  var z = a[2];
  return x * x + y * y + z * z;
}
function negate$2(out, a) {
  out[0] = -a[0];
  out[1] = -a[1];
  out[2] = -a[2];
  return out;
}
function inverse$2(out, a) {
  out[0] = 1 / a[0];
  out[1] = 1 / a[1];
  out[2] = 1 / a[2];
  return out;
}
function normalize$4(out, a) {
  var x = a[0];
  var y = a[1];
  var z = a[2];
  var len2 = x * x + y * y + z * z;
  if (len2 > 0) {
    len2 = 1 / Math.sqrt(len2);
  }
  out[0] = a[0] * len2;
  out[1] = a[1] * len2;
  out[2] = a[2] * len2;
  return out;
}
function dot$4(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}
function cross$2(out, a, b) {
  var ax = a[0], ay = a[1], az = a[2];
  var bx = b[0], by = b[1], bz = b[2];
  out[0] = ay * bz - az * by;
  out[1] = az * bx - ax * bz;
  out[2] = ax * by - ay * bx;
  return out;
}
function lerp$4(out, a, b, t) {
  var ax = a[0];
  var ay = a[1];
  var az = a[2];
  out[0] = ax + t * (b[0] - ax);
  out[1] = ay + t * (b[1] - ay);
  out[2] = az + t * (b[2] - az);
  return out;
}
function hermite(out, a, b, c, d, t) {
  var factorTimes2 = t * t;
  var factor1 = factorTimes2 * (2 * t - 3) + 1;
  var factor2 = factorTimes2 * (t - 2) + t;
  var factor3 = factorTimes2 * (t - 1);
  var factor4 = factorTimes2 * (3 - 2 * t);
  out[0] = a[0] * factor1 + b[0] * factor2 + c[0] * factor3 + d[0] * factor4;
  out[1] = a[1] * factor1 + b[1] * factor2 + c[1] * factor3 + d[1] * factor4;
  out[2] = a[2] * factor1 + b[2] * factor2 + c[2] * factor3 + d[2] * factor4;
  return out;
}
function bezier(out, a, b, c, d, t) {
  var inverseFactor = 1 - t;
  var inverseFactorTimesTwo = inverseFactor * inverseFactor;
  var factorTimes2 = t * t;
  var factor1 = inverseFactorTimesTwo * inverseFactor;
  var factor2 = 3 * t * inverseFactorTimesTwo;
  var factor3 = 3 * factorTimes2 * inverseFactor;
  var factor4 = factorTimes2 * t;
  out[0] = a[0] * factor1 + b[0] * factor2 + c[0] * factor3 + d[0] * factor4;
  out[1] = a[1] * factor1 + b[1] * factor2 + c[1] * factor3 + d[1] * factor4;
  out[2] = a[2] * factor1 + b[2] * factor2 + c[2] * factor3 + d[2] * factor4;
  return out;
}
function random$3(out, scale2) {
  scale2 = scale2 || 1;
  var r = RANDOM() * 2 * Math.PI;
  var z = RANDOM() * 2 - 1;
  var zScale = Math.sqrt(1 - z * z) * scale2;
  out[0] = Math.cos(r) * zScale;
  out[1] = Math.sin(r) * zScale;
  out[2] = z * scale2;
  return out;
}
function transformMat4$2(out, a, m) {
  var x = a[0], y = a[1], z = a[2];
  var w = m[3] * x + m[7] * y + m[11] * z + m[15];
  w = w || 1;
  out[0] = (m[0] * x + m[4] * y + m[8] * z + m[12]) / w;
  out[1] = (m[1] * x + m[5] * y + m[9] * z + m[13]) / w;
  out[2] = (m[2] * x + m[6] * y + m[10] * z + m[14]) / w;
  return out;
}
function transformMat3$1(out, a, m) {
  var x = a[0], y = a[1], z = a[2];
  out[0] = x * m[0] + y * m[3] + z * m[6];
  out[1] = x * m[1] + y * m[4] + z * m[7];
  out[2] = x * m[2] + y * m[5] + z * m[8];
  return out;
}
function transformQuat$1(out, a, q) {
  var qx = q[0], qy = q[1], qz = q[2], qw = q[3];
  var x = a[0], y = a[1], z = a[2];
  var uvx = qy * z - qz * y, uvy = qz * x - qx * z, uvz = qx * y - qy * x;
  var uuvx = qy * uvz - qz * uvy, uuvy = qz * uvx - qx * uvz, uuvz = qx * uvy - qy * uvx;
  var w2 = qw * 2;
  uvx *= w2;
  uvy *= w2;
  uvz *= w2;
  uuvx *= 2;
  uuvy *= 2;
  uuvz *= 2;
  out[0] = x + uvx + uuvx;
  out[1] = y + uvy + uuvy;
  out[2] = z + uvz + uuvz;
  return out;
}
function rotateX$2(out, a, b, rad) {
  var p = [], r = [];
  p[0] = a[0] - b[0];
  p[1] = a[1] - b[1];
  p[2] = a[2] - b[2];
  r[0] = p[0];
  r[1] = p[1] * Math.cos(rad) - p[2] * Math.sin(rad);
  r[2] = p[1] * Math.sin(rad) + p[2] * Math.cos(rad);
  out[0] = r[0] + b[0];
  out[1] = r[1] + b[1];
  out[2] = r[2] + b[2];
  return out;
}
function rotateY$2(out, a, b, rad) {
  var p = [], r = [];
  p[0] = a[0] - b[0];
  p[1] = a[1] - b[1];
  p[2] = a[2] - b[2];
  r[0] = p[2] * Math.sin(rad) + p[0] * Math.cos(rad);
  r[1] = p[1];
  r[2] = p[2] * Math.cos(rad) - p[0] * Math.sin(rad);
  out[0] = r[0] + b[0];
  out[1] = r[1] + b[1];
  out[2] = r[2] + b[2];
  return out;
}
function rotateZ$2(out, a, b, rad) {
  var p = [], r = [];
  p[0] = a[0] - b[0];
  p[1] = a[1] - b[1];
  p[2] = a[2] - b[2];
  r[0] = p[0] * Math.cos(rad) - p[1] * Math.sin(rad);
  r[1] = p[0] * Math.sin(rad) + p[1] * Math.cos(rad);
  r[2] = p[2];
  out[0] = r[0] + b[0];
  out[1] = r[1] + b[1];
  out[2] = r[2] + b[2];
  return out;
}
function angle$1(a, b) {
  var ax = a[0], ay = a[1], az = a[2], bx = b[0], by = b[1], bz = b[2], mag1 = Math.sqrt(ax * ax + ay * ay + az * az), mag2 = Math.sqrt(bx * bx + by * by + bz * bz), mag = mag1 * mag2, cosine = mag && dot$4(a, b) / mag;
  return Math.acos(Math.min(Math.max(cosine, -1), 1));
}
function zero$2(out) {
  out[0] = 0;
  out[1] = 0;
  out[2] = 0;
  return out;
}
function str$4(a) {
  return "vec3(" + a[0] + ", " + a[1] + ", " + a[2] + ")";
}
function exactEquals$4(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}
function equals$4(a, b) {
  var a0 = a[0], a1 = a[1], a2 = a[2];
  var b0 = b[0], b1 = b[1], b2 = b[2];
  return Math.abs(a0 - b0) <= EPSILON * Math.max(1, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= EPSILON * Math.max(1, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= EPSILON * Math.max(1, Math.abs(a2), Math.abs(b2));
}
var sub$2 = subtract$2;
var mul$4 = multiply$4;
var div$2 = divide$2;
var dist$2 = distance$2;
var sqrDist$2 = squaredDistance$2;
var len$4 = length$4;
var sqrLen$4 = squaredLength$4;
var forEach$2 = function() {
  var vec = create$4();
  return function(a, stride, offset, count, fn, arg) {
    var i2, l;
    if (!stride) {
      stride = 3;
    }
    if (!offset) {
      offset = 0;
    }
    if (count) {
      l = Math.min(count * stride + offset, a.length);
    } else {
      l = a.length;
    }
    for (i2 = offset; i2 < l; i2 += stride) {
      vec[0] = a[i2];
      vec[1] = a[i2 + 1];
      vec[2] = a[i2 + 2];
      fn(vec, vec, arg);
      a[i2] = vec[0];
      a[i2 + 1] = vec[1];
      a[i2 + 2] = vec[2];
    }
    return a;
  };
}();
var vec3$3 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  create: create$4,
  clone: clone$4,
  length: length$4,
  fromValues: fromValues$4,
  copy: copy$4,
  set: set$4,
  add: add$4,
  subtract: subtract$2,
  multiply: multiply$4,
  divide: divide$2,
  ceil: ceil$2,
  floor: floor$2,
  min: min$2,
  max: max$2,
  round: round$2,
  scale: scale$4,
  scaleAndAdd: scaleAndAdd$2,
  distance: distance$2,
  squaredDistance: squaredDistance$2,
  squaredLength: squaredLength$4,
  negate: negate$2,
  inverse: inverse$2,
  normalize: normalize$4,
  dot: dot$4,
  cross: cross$2,
  lerp: lerp$4,
  hermite,
  bezier,
  random: random$3,
  transformMat4: transformMat4$2,
  transformMat3: transformMat3$1,
  transformQuat: transformQuat$1,
  rotateX: rotateX$2,
  rotateY: rotateY$2,
  rotateZ: rotateZ$2,
  angle: angle$1,
  zero: zero$2,
  str: str$4,
  exactEquals: exactEquals$4,
  equals: equals$4,
  sub: sub$2,
  mul: mul$4,
  div: div$2,
  dist: dist$2,
  sqrDist: sqrDist$2,
  len: len$4,
  sqrLen: sqrLen$4,
  forEach: forEach$2
});
function create$3() {
  var out = new ARRAY_TYPE(4);
  if (ARRAY_TYPE != Float32Array) {
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
  }
  return out;
}
function clone$3(a) {
  var out = new ARRAY_TYPE(4);
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[3];
  return out;
}
function fromValues$3(x, y, z, w) {
  var out = new ARRAY_TYPE(4);
  out[0] = x;
  out[1] = y;
  out[2] = z;
  out[3] = w;
  return out;
}
function copy$3(out, a) {
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[3];
  return out;
}
function set$3(out, x, y, z, w) {
  out[0] = x;
  out[1] = y;
  out[2] = z;
  out[3] = w;
  return out;
}
function add$3(out, a, b) {
  out[0] = a[0] + b[0];
  out[1] = a[1] + b[1];
  out[2] = a[2] + b[2];
  out[3] = a[3] + b[3];
  return out;
}
function subtract$1(out, a, b) {
  out[0] = a[0] - b[0];
  out[1] = a[1] - b[1];
  out[2] = a[2] - b[2];
  out[3] = a[3] - b[3];
  return out;
}
function multiply$3(out, a, b) {
  out[0] = a[0] * b[0];
  out[1] = a[1] * b[1];
  out[2] = a[2] * b[2];
  out[3] = a[3] * b[3];
  return out;
}
function divide$1(out, a, b) {
  out[0] = a[0] / b[0];
  out[1] = a[1] / b[1];
  out[2] = a[2] / b[2];
  out[3] = a[3] / b[3];
  return out;
}
function ceil$1(out, a) {
  out[0] = Math.ceil(a[0]);
  out[1] = Math.ceil(a[1]);
  out[2] = Math.ceil(a[2]);
  out[3] = Math.ceil(a[3]);
  return out;
}
function floor$1(out, a) {
  out[0] = Math.floor(a[0]);
  out[1] = Math.floor(a[1]);
  out[2] = Math.floor(a[2]);
  out[3] = Math.floor(a[3]);
  return out;
}
function min$1(out, a, b) {
  out[0] = Math.min(a[0], b[0]);
  out[1] = Math.min(a[1], b[1]);
  out[2] = Math.min(a[2], b[2]);
  out[3] = Math.min(a[3], b[3]);
  return out;
}
function max$1(out, a, b) {
  out[0] = Math.max(a[0], b[0]);
  out[1] = Math.max(a[1], b[1]);
  out[2] = Math.max(a[2], b[2]);
  out[3] = Math.max(a[3], b[3]);
  return out;
}
function round$1(out, a) {
  out[0] = Math.round(a[0]);
  out[1] = Math.round(a[1]);
  out[2] = Math.round(a[2]);
  out[3] = Math.round(a[3]);
  return out;
}
function scale$3(out, a, b) {
  out[0] = a[0] * b;
  out[1] = a[1] * b;
  out[2] = a[2] * b;
  out[3] = a[3] * b;
  return out;
}
function scaleAndAdd$1(out, a, b, scale2) {
  out[0] = a[0] + b[0] * scale2;
  out[1] = a[1] + b[1] * scale2;
  out[2] = a[2] + b[2] * scale2;
  out[3] = a[3] + b[3] * scale2;
  return out;
}
function distance$1(a, b) {
  var x = b[0] - a[0];
  var y = b[1] - a[1];
  var z = b[2] - a[2];
  var w = b[3] - a[3];
  return Math.hypot(x, y, z, w);
}
function squaredDistance$1(a, b) {
  var x = b[0] - a[0];
  var y = b[1] - a[1];
  var z = b[2] - a[2];
  var w = b[3] - a[3];
  return x * x + y * y + z * z + w * w;
}
function length$3(a) {
  var x = a[0];
  var y = a[1];
  var z = a[2];
  var w = a[3];
  return Math.hypot(x, y, z, w);
}
function squaredLength$3(a) {
  var x = a[0];
  var y = a[1];
  var z = a[2];
  var w = a[3];
  return x * x + y * y + z * z + w * w;
}
function negate$1(out, a) {
  out[0] = -a[0];
  out[1] = -a[1];
  out[2] = -a[2];
  out[3] = -a[3];
  return out;
}
function inverse$1(out, a) {
  out[0] = 1 / a[0];
  out[1] = 1 / a[1];
  out[2] = 1 / a[2];
  out[3] = 1 / a[3];
  return out;
}
function normalize$3(out, a) {
  var x = a[0];
  var y = a[1];
  var z = a[2];
  var w = a[3];
  var len2 = x * x + y * y + z * z + w * w;
  if (len2 > 0) {
    len2 = 1 / Math.sqrt(len2);
  }
  out[0] = x * len2;
  out[1] = y * len2;
  out[2] = z * len2;
  out[3] = w * len2;
  return out;
}
function dot$3(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
}
function cross$1(out, u, v2, w) {
  var A = v2[0] * w[1] - v2[1] * w[0], B = v2[0] * w[2] - v2[2] * w[0], C = v2[0] * w[3] - v2[3] * w[0], D = v2[1] * w[2] - v2[2] * w[1], E = v2[1] * w[3] - v2[3] * w[1], F = v2[2] * w[3] - v2[3] * w[2];
  var G = u[0];
  var H = u[1];
  var I = u[2];
  var J = u[3];
  out[0] = H * F - I * E + J * D;
  out[1] = -(G * F) + I * C - J * B;
  out[2] = G * E - H * C + J * A;
  out[3] = -(G * D) + H * B - I * A;
  return out;
}
function lerp$3(out, a, b, t) {
  var ax = a[0];
  var ay = a[1];
  var az = a[2];
  var aw = a[3];
  out[0] = ax + t * (b[0] - ax);
  out[1] = ay + t * (b[1] - ay);
  out[2] = az + t * (b[2] - az);
  out[3] = aw + t * (b[3] - aw);
  return out;
}
function random$2(out, scale2) {
  scale2 = scale2 || 1;
  var v1, v2, v3, v4;
  var s1, s2;
  do {
    v1 = RANDOM() * 2 - 1;
    v2 = RANDOM() * 2 - 1;
    s1 = v1 * v1 + v2 * v2;
  } while (s1 >= 1);
  do {
    v3 = RANDOM() * 2 - 1;
    v4 = RANDOM() * 2 - 1;
    s2 = v3 * v3 + v4 * v4;
  } while (s2 >= 1);
  var d = Math.sqrt((1 - s1) / s2);
  out[0] = scale2 * v1;
  out[1] = scale2 * v2;
  out[2] = scale2 * v3 * d;
  out[3] = scale2 * v4 * d;
  return out;
}
function transformMat4$1(out, a, m) {
  var x = a[0], y = a[1], z = a[2], w = a[3];
  out[0] = m[0] * x + m[4] * y + m[8] * z + m[12] * w;
  out[1] = m[1] * x + m[5] * y + m[9] * z + m[13] * w;
  out[2] = m[2] * x + m[6] * y + m[10] * z + m[14] * w;
  out[3] = m[3] * x + m[7] * y + m[11] * z + m[15] * w;
  return out;
}
function transformQuat(out, a, q) {
  var x = a[0], y = a[1], z = a[2];
  var qx = q[0], qy = q[1], qz = q[2], qw = q[3];
  var ix = qw * x + qy * z - qz * y;
  var iy = qw * y + qz * x - qx * z;
  var iz = qw * z + qx * y - qy * x;
  var iw = -qx * x - qy * y - qz * z;
  out[0] = ix * qw + iw * -qx + iy * -qz - iz * -qy;
  out[1] = iy * qw + iw * -qy + iz * -qx - ix * -qz;
  out[2] = iz * qw + iw * -qz + ix * -qy - iy * -qx;
  out[3] = a[3];
  return out;
}
function zero$1(out) {
  out[0] = 0;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  return out;
}
function str$3(a) {
  return "vec4(" + a[0] + ", " + a[1] + ", " + a[2] + ", " + a[3] + ")";
}
function exactEquals$3(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
}
function equals$3(a, b) {
  var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3];
  var b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
  return Math.abs(a0 - b0) <= EPSILON * Math.max(1, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= EPSILON * Math.max(1, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= EPSILON * Math.max(1, Math.abs(a2), Math.abs(b2)) && Math.abs(a3 - b3) <= EPSILON * Math.max(1, Math.abs(a3), Math.abs(b3));
}
var sub$1 = subtract$1;
var mul$3 = multiply$3;
var div$1 = divide$1;
var dist$1 = distance$1;
var sqrDist$1 = squaredDistance$1;
var len$3 = length$3;
var sqrLen$3 = squaredLength$3;
var forEach$1 = function() {
  var vec = create$3();
  return function(a, stride, offset, count, fn, arg) {
    var i2, l;
    if (!stride) {
      stride = 4;
    }
    if (!offset) {
      offset = 0;
    }
    if (count) {
      l = Math.min(count * stride + offset, a.length);
    } else {
      l = a.length;
    }
    for (i2 = offset; i2 < l; i2 += stride) {
      vec[0] = a[i2];
      vec[1] = a[i2 + 1];
      vec[2] = a[i2 + 2];
      vec[3] = a[i2 + 3];
      fn(vec, vec, arg);
      a[i2] = vec[0];
      a[i2 + 1] = vec[1];
      a[i2 + 2] = vec[2];
      a[i2 + 3] = vec[3];
    }
    return a;
  };
}();
var vec4$6 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  create: create$3,
  clone: clone$3,
  fromValues: fromValues$3,
  copy: copy$3,
  set: set$3,
  add: add$3,
  subtract: subtract$1,
  multiply: multiply$3,
  divide: divide$1,
  ceil: ceil$1,
  floor: floor$1,
  min: min$1,
  max: max$1,
  round: round$1,
  scale: scale$3,
  scaleAndAdd: scaleAndAdd$1,
  distance: distance$1,
  squaredDistance: squaredDistance$1,
  length: length$3,
  squaredLength: squaredLength$3,
  negate: negate$1,
  inverse: inverse$1,
  normalize: normalize$3,
  dot: dot$3,
  cross: cross$1,
  lerp: lerp$3,
  random: random$2,
  transformMat4: transformMat4$1,
  transformQuat,
  zero: zero$1,
  str: str$3,
  exactEquals: exactEquals$3,
  equals: equals$3,
  sub: sub$1,
  mul: mul$3,
  div: div$1,
  dist: dist$1,
  sqrDist: sqrDist$1,
  len: len$3,
  sqrLen: sqrLen$3,
  forEach: forEach$1
});
function create$2() {
  var out = new ARRAY_TYPE(4);
  if (ARRAY_TYPE != Float32Array) {
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
  }
  out[3] = 1;
  return out;
}
function identity$2(out) {
  out[0] = 0;
  out[1] = 0;
  out[2] = 0;
  out[3] = 1;
  return out;
}
function setAxisAngle(out, axis, rad) {
  rad = rad * 0.5;
  var s = Math.sin(rad);
  out[0] = s * axis[0];
  out[1] = s * axis[1];
  out[2] = s * axis[2];
  out[3] = Math.cos(rad);
  return out;
}
function getAxisAngle(out_axis, q) {
  var rad = Math.acos(q[3]) * 2;
  var s = Math.sin(rad / 2);
  if (s > EPSILON) {
    out_axis[0] = q[0] / s;
    out_axis[1] = q[1] / s;
    out_axis[2] = q[2] / s;
  } else {
    out_axis[0] = 1;
    out_axis[1] = 0;
    out_axis[2] = 0;
  }
  return rad;
}
function getAngle(a, b) {
  var dotproduct = dot$2(a, b);
  return Math.acos(2 * dotproduct * dotproduct - 1);
}
function multiply$2(out, a, b) {
  var ax = a[0], ay = a[1], az = a[2], aw = a[3];
  var bx = b[0], by = b[1], bz = b[2], bw = b[3];
  out[0] = ax * bw + aw * bx + ay * bz - az * by;
  out[1] = ay * bw + aw * by + az * bx - ax * bz;
  out[2] = az * bw + aw * bz + ax * by - ay * bx;
  out[3] = aw * bw - ax * bx - ay * by - az * bz;
  return out;
}
function rotateX$1(out, a, rad) {
  rad *= 0.5;
  var ax = a[0], ay = a[1], az = a[2], aw = a[3];
  var bx = Math.sin(rad), bw = Math.cos(rad);
  out[0] = ax * bw + aw * bx;
  out[1] = ay * bw + az * bx;
  out[2] = az * bw - ay * bx;
  out[3] = aw * bw - ax * bx;
  return out;
}
function rotateY$1(out, a, rad) {
  rad *= 0.5;
  var ax = a[0], ay = a[1], az = a[2], aw = a[3];
  var by = Math.sin(rad), bw = Math.cos(rad);
  out[0] = ax * bw - az * by;
  out[1] = ay * bw + aw * by;
  out[2] = az * bw + ax * by;
  out[3] = aw * bw - ay * by;
  return out;
}
function rotateZ$1(out, a, rad) {
  rad *= 0.5;
  var ax = a[0], ay = a[1], az = a[2], aw = a[3];
  var bz = Math.sin(rad), bw = Math.cos(rad);
  out[0] = ax * bw + ay * bz;
  out[1] = ay * bw - ax * bz;
  out[2] = az * bw + aw * bz;
  out[3] = aw * bw - az * bz;
  return out;
}
function calculateW(out, a) {
  var x = a[0], y = a[1], z = a[2];
  out[0] = x;
  out[1] = y;
  out[2] = z;
  out[3] = Math.sqrt(Math.abs(1 - x * x - y * y - z * z));
  return out;
}
function exp(out, a) {
  var x = a[0], y = a[1], z = a[2], w = a[3];
  var r = Math.sqrt(x * x + y * y + z * z);
  var et = Math.exp(w);
  var s = r > 0 ? et * Math.sin(r) / r : 0;
  out[0] = x * s;
  out[1] = y * s;
  out[2] = z * s;
  out[3] = et * Math.cos(r);
  return out;
}
function ln(out, a) {
  var x = a[0], y = a[1], z = a[2], w = a[3];
  var r = Math.sqrt(x * x + y * y + z * z);
  var t = r > 0 ? Math.atan2(r, w) / r : 0;
  out[0] = x * t;
  out[1] = y * t;
  out[2] = z * t;
  out[3] = 0.5 * Math.log(x * x + y * y + z * z + w * w);
  return out;
}
function pow(out, a, b) {
  ln(out, a);
  scale$2(out, out, b);
  exp(out, out);
  return out;
}
function slerp(out, a, b, t) {
  var ax = a[0], ay = a[1], az = a[2], aw = a[3];
  var bx = b[0], by = b[1], bz = b[2], bw = b[3];
  var omega, cosom, sinom, scale0, scale1;
  cosom = ax * bx + ay * by + az * bz + aw * bw;
  if (cosom < 0) {
    cosom = -cosom;
    bx = -bx;
    by = -by;
    bz = -bz;
    bw = -bw;
  }
  if (1 - cosom > EPSILON) {
    omega = Math.acos(cosom);
    sinom = Math.sin(omega);
    scale0 = Math.sin((1 - t) * omega) / sinom;
    scale1 = Math.sin(t * omega) / sinom;
  } else {
    scale0 = 1 - t;
    scale1 = t;
  }
  out[0] = scale0 * ax + scale1 * bx;
  out[1] = scale0 * ay + scale1 * by;
  out[2] = scale0 * az + scale1 * bz;
  out[3] = scale0 * aw + scale1 * bw;
  return out;
}
function random$1(out) {
  var u1 = RANDOM();
  var u2 = RANDOM();
  var u3 = RANDOM();
  var sqrt1MinusU1 = Math.sqrt(1 - u1);
  var sqrtU1 = Math.sqrt(u1);
  out[0] = sqrt1MinusU1 * Math.sin(2 * Math.PI * u2);
  out[1] = sqrt1MinusU1 * Math.cos(2 * Math.PI * u2);
  out[2] = sqrtU1 * Math.sin(2 * Math.PI * u3);
  out[3] = sqrtU1 * Math.cos(2 * Math.PI * u3);
  return out;
}
function invert$1(out, a) {
  var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3];
  var dot2 = a0 * a0 + a1 * a1 + a2 * a2 + a3 * a3;
  var invDot = dot2 ? 1 / dot2 : 0;
  out[0] = -a0 * invDot;
  out[1] = -a1 * invDot;
  out[2] = -a2 * invDot;
  out[3] = a3 * invDot;
  return out;
}
function conjugate$1(out, a) {
  out[0] = -a[0];
  out[1] = -a[1];
  out[2] = -a[2];
  out[3] = a[3];
  return out;
}
function fromMat3(out, m) {
  var fTrace = m[0] + m[4] + m[8];
  var fRoot;
  if (fTrace > 0) {
    fRoot = Math.sqrt(fTrace + 1);
    out[3] = 0.5 * fRoot;
    fRoot = 0.5 / fRoot;
    out[0] = (m[5] - m[7]) * fRoot;
    out[1] = (m[6] - m[2]) * fRoot;
    out[2] = (m[1] - m[3]) * fRoot;
  } else {
    var i2 = 0;
    if (m[4] > m[0])
      i2 = 1;
    if (m[8] > m[i2 * 3 + i2])
      i2 = 2;
    var j = (i2 + 1) % 3;
    var k = (i2 + 2) % 3;
    fRoot = Math.sqrt(m[i2 * 3 + i2] - m[j * 3 + j] - m[k * 3 + k] + 1);
    out[i2] = 0.5 * fRoot;
    fRoot = 0.5 / fRoot;
    out[3] = (m[j * 3 + k] - m[k * 3 + j]) * fRoot;
    out[j] = (m[j * 3 + i2] + m[i2 * 3 + j]) * fRoot;
    out[k] = (m[k * 3 + i2] + m[i2 * 3 + k]) * fRoot;
  }
  return out;
}
function fromEuler(out, x, y, z) {
  var halfToRad = 0.5 * Math.PI / 180;
  x *= halfToRad;
  y *= halfToRad;
  z *= halfToRad;
  var sx = Math.sin(x);
  var cx = Math.cos(x);
  var sy = Math.sin(y);
  var cy = Math.cos(y);
  var sz = Math.sin(z);
  var cz = Math.cos(z);
  out[0] = sx * cy * cz - cx * sy * sz;
  out[1] = cx * sy * cz + sx * cy * sz;
  out[2] = cx * cy * sz - sx * sy * cz;
  out[3] = cx * cy * cz + sx * sy * sz;
  return out;
}
function str$2(a) {
  return "quat(" + a[0] + ", " + a[1] + ", " + a[2] + ", " + a[3] + ")";
}
var clone$2 = clone$3;
var fromValues$2 = fromValues$3;
var copy$2 = copy$3;
var set$2 = set$3;
var add$2 = add$3;
var mul$2 = multiply$2;
var scale$2 = scale$3;
var dot$2 = dot$3;
var lerp$2 = lerp$3;
var length$2 = length$3;
var len$2 = length$2;
var squaredLength$2 = squaredLength$3;
var sqrLen$2 = squaredLength$2;
var normalize$2 = normalize$3;
var exactEquals$2 = exactEquals$3;
var equals$2 = equals$3;
var rotationTo = function() {
  var tmpvec3 = create$4();
  var xUnitVec3 = fromValues$4(1, 0, 0);
  var yUnitVec3 = fromValues$4(0, 1, 0);
  return function(out, a, b) {
    var dot2 = dot$4(a, b);
    if (dot2 < -0.999999) {
      cross$2(tmpvec3, xUnitVec3, a);
      if (len$4(tmpvec3) < 1e-6)
        cross$2(tmpvec3, yUnitVec3, a);
      normalize$4(tmpvec3, tmpvec3);
      setAxisAngle(out, tmpvec3, Math.PI);
      return out;
    } else if (dot2 > 0.999999) {
      out[0] = 0;
      out[1] = 0;
      out[2] = 0;
      out[3] = 1;
      return out;
    } else {
      cross$2(tmpvec3, a, b);
      out[0] = tmpvec3[0];
      out[1] = tmpvec3[1];
      out[2] = tmpvec3[2];
      out[3] = 1 + dot2;
      return normalize$2(out, out);
    }
  };
}();
var sqlerp = function() {
  var temp1 = create$2();
  var temp2 = create$2();
  return function(out, a, b, c, d, t) {
    slerp(temp1, a, d, t);
    slerp(temp2, b, c, t);
    slerp(out, temp1, temp2, 2 * t * (1 - t));
    return out;
  };
}();
var setAxes = function() {
  var matr = create$6();
  return function(out, view, right, up) {
    matr[0] = right[0];
    matr[3] = right[1];
    matr[6] = right[2];
    matr[1] = up[0];
    matr[4] = up[1];
    matr[7] = up[2];
    matr[2] = -view[0];
    matr[5] = -view[1];
    matr[8] = -view[2];
    return normalize$2(out, fromMat3(out, matr));
  };
}();
var quat = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  create: create$2,
  identity: identity$2,
  setAxisAngle,
  getAxisAngle,
  getAngle,
  multiply: multiply$2,
  rotateX: rotateX$1,
  rotateY: rotateY$1,
  rotateZ: rotateZ$1,
  calculateW,
  exp,
  ln,
  pow,
  slerp,
  random: random$1,
  invert: invert$1,
  conjugate: conjugate$1,
  fromMat3,
  fromEuler,
  str: str$2,
  clone: clone$2,
  fromValues: fromValues$2,
  copy: copy$2,
  set: set$2,
  add: add$2,
  mul: mul$2,
  scale: scale$2,
  dot: dot$2,
  lerp: lerp$2,
  length: length$2,
  len: len$2,
  squaredLength: squaredLength$2,
  sqrLen: sqrLen$2,
  normalize: normalize$2,
  exactEquals: exactEquals$2,
  equals: equals$2,
  rotationTo,
  sqlerp,
  setAxes
});
function create$1() {
  var dq = new ARRAY_TYPE(8);
  if (ARRAY_TYPE != Float32Array) {
    dq[0] = 0;
    dq[1] = 0;
    dq[2] = 0;
    dq[4] = 0;
    dq[5] = 0;
    dq[6] = 0;
    dq[7] = 0;
  }
  dq[3] = 1;
  return dq;
}
function clone$1(a) {
  var dq = new ARRAY_TYPE(8);
  dq[0] = a[0];
  dq[1] = a[1];
  dq[2] = a[2];
  dq[3] = a[3];
  dq[4] = a[4];
  dq[5] = a[5];
  dq[6] = a[6];
  dq[7] = a[7];
  return dq;
}
function fromValues$1(x1, y1, z1, w1, x2, y2, z2, w2) {
  var dq = new ARRAY_TYPE(8);
  dq[0] = x1;
  dq[1] = y1;
  dq[2] = z1;
  dq[3] = w1;
  dq[4] = x2;
  dq[5] = y2;
  dq[6] = z2;
  dq[7] = w2;
  return dq;
}
function fromRotationTranslationValues(x1, y1, z1, w1, x2, y2, z2) {
  var dq = new ARRAY_TYPE(8);
  dq[0] = x1;
  dq[1] = y1;
  dq[2] = z1;
  dq[3] = w1;
  var ax = x2 * 0.5, ay = y2 * 0.5, az = z2 * 0.5;
  dq[4] = ax * w1 + ay * z1 - az * y1;
  dq[5] = ay * w1 + az * x1 - ax * z1;
  dq[6] = az * w1 + ax * y1 - ay * x1;
  dq[7] = -ax * x1 - ay * y1 - az * z1;
  return dq;
}
function fromRotationTranslation(out, q, t) {
  var ax = t[0] * 0.5, ay = t[1] * 0.5, az = t[2] * 0.5, bx = q[0], by = q[1], bz = q[2], bw = q[3];
  out[0] = bx;
  out[1] = by;
  out[2] = bz;
  out[3] = bw;
  out[4] = ax * bw + ay * bz - az * by;
  out[5] = ay * bw + az * bx - ax * bz;
  out[6] = az * bw + ax * by - ay * bx;
  out[7] = -ax * bx - ay * by - az * bz;
  return out;
}
function fromTranslation(out, t) {
  out[0] = 0;
  out[1] = 0;
  out[2] = 0;
  out[3] = 1;
  out[4] = t[0] * 0.5;
  out[5] = t[1] * 0.5;
  out[6] = t[2] * 0.5;
  out[7] = 0;
  return out;
}
function fromRotation(out, q) {
  out[0] = q[0];
  out[1] = q[1];
  out[2] = q[2];
  out[3] = q[3];
  out[4] = 0;
  out[5] = 0;
  out[6] = 0;
  out[7] = 0;
  return out;
}
function fromMat4(out, a) {
  var outer = create$2();
  getRotation(outer, a);
  var t = new ARRAY_TYPE(3);
  getTranslation$1(t, a);
  fromRotationTranslation(out, outer, t);
  return out;
}
function copy$1(out, a) {
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[3];
  out[4] = a[4];
  out[5] = a[5];
  out[6] = a[6];
  out[7] = a[7];
  return out;
}
function identity$1(out) {
  out[0] = 0;
  out[1] = 0;
  out[2] = 0;
  out[3] = 1;
  out[4] = 0;
  out[5] = 0;
  out[6] = 0;
  out[7] = 0;
  return out;
}
function set$1(out, x1, y1, z1, w1, x2, y2, z2, w2) {
  out[0] = x1;
  out[1] = y1;
  out[2] = z1;
  out[3] = w1;
  out[4] = x2;
  out[5] = y2;
  out[6] = z2;
  out[7] = w2;
  return out;
}
var getReal = copy$2;
function getDual(out, a) {
  out[0] = a[4];
  out[1] = a[5];
  out[2] = a[6];
  out[3] = a[7];
  return out;
}
var setReal = copy$2;
function setDual(out, q) {
  out[4] = q[0];
  out[5] = q[1];
  out[6] = q[2];
  out[7] = q[3];
  return out;
}
function getTranslation(out, a) {
  var ax = a[4], ay = a[5], az = a[6], aw = a[7], bx = -a[0], by = -a[1], bz = -a[2], bw = a[3];
  out[0] = (ax * bw + aw * bx + ay * bz - az * by) * 2;
  out[1] = (ay * bw + aw * by + az * bx - ax * bz) * 2;
  out[2] = (az * bw + aw * bz + ax * by - ay * bx) * 2;
  return out;
}
function translate(out, a, v2) {
  var ax1 = a[0], ay1 = a[1], az1 = a[2], aw1 = a[3], bx1 = v2[0] * 0.5, by1 = v2[1] * 0.5, bz1 = v2[2] * 0.5, ax2 = a[4], ay2 = a[5], az2 = a[6], aw2 = a[7];
  out[0] = ax1;
  out[1] = ay1;
  out[2] = az1;
  out[3] = aw1;
  out[4] = aw1 * bx1 + ay1 * bz1 - az1 * by1 + ax2;
  out[5] = aw1 * by1 + az1 * bx1 - ax1 * bz1 + ay2;
  out[6] = aw1 * bz1 + ax1 * by1 - ay1 * bx1 + az2;
  out[7] = -ax1 * bx1 - ay1 * by1 - az1 * bz1 + aw2;
  return out;
}
function rotateX(out, a, rad) {
  var bx = -a[0], by = -a[1], bz = -a[2], bw = a[3], ax = a[4], ay = a[5], az = a[6], aw = a[7], ax1 = ax * bw + aw * bx + ay * bz - az * by, ay1 = ay * bw + aw * by + az * bx - ax * bz, az1 = az * bw + aw * bz + ax * by - ay * bx, aw1 = aw * bw - ax * bx - ay * by - az * bz;
  rotateX$1(out, a, rad);
  bx = out[0];
  by = out[1];
  bz = out[2];
  bw = out[3];
  out[4] = ax1 * bw + aw1 * bx + ay1 * bz - az1 * by;
  out[5] = ay1 * bw + aw1 * by + az1 * bx - ax1 * bz;
  out[6] = az1 * bw + aw1 * bz + ax1 * by - ay1 * bx;
  out[7] = aw1 * bw - ax1 * bx - ay1 * by - az1 * bz;
  return out;
}
function rotateY(out, a, rad) {
  var bx = -a[0], by = -a[1], bz = -a[2], bw = a[3], ax = a[4], ay = a[5], az = a[6], aw = a[7], ax1 = ax * bw + aw * bx + ay * bz - az * by, ay1 = ay * bw + aw * by + az * bx - ax * bz, az1 = az * bw + aw * bz + ax * by - ay * bx, aw1 = aw * bw - ax * bx - ay * by - az * bz;
  rotateY$1(out, a, rad);
  bx = out[0];
  by = out[1];
  bz = out[2];
  bw = out[3];
  out[4] = ax1 * bw + aw1 * bx + ay1 * bz - az1 * by;
  out[5] = ay1 * bw + aw1 * by + az1 * bx - ax1 * bz;
  out[6] = az1 * bw + aw1 * bz + ax1 * by - ay1 * bx;
  out[7] = aw1 * bw - ax1 * bx - ay1 * by - az1 * bz;
  return out;
}
function rotateZ(out, a, rad) {
  var bx = -a[0], by = -a[1], bz = -a[2], bw = a[3], ax = a[4], ay = a[5], az = a[6], aw = a[7], ax1 = ax * bw + aw * bx + ay * bz - az * by, ay1 = ay * bw + aw * by + az * bx - ax * bz, az1 = az * bw + aw * bz + ax * by - ay * bx, aw1 = aw * bw - ax * bx - ay * by - az * bz;
  rotateZ$1(out, a, rad);
  bx = out[0];
  by = out[1];
  bz = out[2];
  bw = out[3];
  out[4] = ax1 * bw + aw1 * bx + ay1 * bz - az1 * by;
  out[5] = ay1 * bw + aw1 * by + az1 * bx - ax1 * bz;
  out[6] = az1 * bw + aw1 * bz + ax1 * by - ay1 * bx;
  out[7] = aw1 * bw - ax1 * bx - ay1 * by - az1 * bz;
  return out;
}
function rotateByQuatAppend(out, a, q) {
  var qx = q[0], qy = q[1], qz = q[2], qw = q[3], ax = a[0], ay = a[1], az = a[2], aw = a[3];
  out[0] = ax * qw + aw * qx + ay * qz - az * qy;
  out[1] = ay * qw + aw * qy + az * qx - ax * qz;
  out[2] = az * qw + aw * qz + ax * qy - ay * qx;
  out[3] = aw * qw - ax * qx - ay * qy - az * qz;
  ax = a[4];
  ay = a[5];
  az = a[6];
  aw = a[7];
  out[4] = ax * qw + aw * qx + ay * qz - az * qy;
  out[5] = ay * qw + aw * qy + az * qx - ax * qz;
  out[6] = az * qw + aw * qz + ax * qy - ay * qx;
  out[7] = aw * qw - ax * qx - ay * qy - az * qz;
  return out;
}
function rotateByQuatPrepend(out, q, a) {
  var qx = q[0], qy = q[1], qz = q[2], qw = q[3], bx = a[0], by = a[1], bz = a[2], bw = a[3];
  out[0] = qx * bw + qw * bx + qy * bz - qz * by;
  out[1] = qy * bw + qw * by + qz * bx - qx * bz;
  out[2] = qz * bw + qw * bz + qx * by - qy * bx;
  out[3] = qw * bw - qx * bx - qy * by - qz * bz;
  bx = a[4];
  by = a[5];
  bz = a[6];
  bw = a[7];
  out[4] = qx * bw + qw * bx + qy * bz - qz * by;
  out[5] = qy * bw + qw * by + qz * bx - qx * bz;
  out[6] = qz * bw + qw * bz + qx * by - qy * bx;
  out[7] = qw * bw - qx * bx - qy * by - qz * bz;
  return out;
}
function rotateAroundAxis(out, a, axis, rad) {
  if (Math.abs(rad) < EPSILON) {
    return copy$1(out, a);
  }
  var axisLength = Math.hypot(axis[0], axis[1], axis[2]);
  rad = rad * 0.5;
  var s = Math.sin(rad);
  var bx = s * axis[0] / axisLength;
  var by = s * axis[1] / axisLength;
  var bz = s * axis[2] / axisLength;
  var bw = Math.cos(rad);
  var ax1 = a[0], ay1 = a[1], az1 = a[2], aw1 = a[3];
  out[0] = ax1 * bw + aw1 * bx + ay1 * bz - az1 * by;
  out[1] = ay1 * bw + aw1 * by + az1 * bx - ax1 * bz;
  out[2] = az1 * bw + aw1 * bz + ax1 * by - ay1 * bx;
  out[3] = aw1 * bw - ax1 * bx - ay1 * by - az1 * bz;
  var ax = a[4], ay = a[5], az = a[6], aw = a[7];
  out[4] = ax * bw + aw * bx + ay * bz - az * by;
  out[5] = ay * bw + aw * by + az * bx - ax * bz;
  out[6] = az * bw + aw * bz + ax * by - ay * bx;
  out[7] = aw * bw - ax * bx - ay * by - az * bz;
  return out;
}
function add$1(out, a, b) {
  out[0] = a[0] + b[0];
  out[1] = a[1] + b[1];
  out[2] = a[2] + b[2];
  out[3] = a[3] + b[3];
  out[4] = a[4] + b[4];
  out[5] = a[5] + b[5];
  out[6] = a[6] + b[6];
  out[7] = a[7] + b[7];
  return out;
}
function multiply$1(out, a, b) {
  var ax0 = a[0], ay0 = a[1], az0 = a[2], aw0 = a[3], bx1 = b[4], by1 = b[5], bz1 = b[6], bw1 = b[7], ax1 = a[4], ay1 = a[5], az1 = a[6], aw1 = a[7], bx0 = b[0], by0 = b[1], bz0 = b[2], bw0 = b[3];
  out[0] = ax0 * bw0 + aw0 * bx0 + ay0 * bz0 - az0 * by0;
  out[1] = ay0 * bw0 + aw0 * by0 + az0 * bx0 - ax0 * bz0;
  out[2] = az0 * bw0 + aw0 * bz0 + ax0 * by0 - ay0 * bx0;
  out[3] = aw0 * bw0 - ax0 * bx0 - ay0 * by0 - az0 * bz0;
  out[4] = ax0 * bw1 + aw0 * bx1 + ay0 * bz1 - az0 * by1 + ax1 * bw0 + aw1 * bx0 + ay1 * bz0 - az1 * by0;
  out[5] = ay0 * bw1 + aw0 * by1 + az0 * bx1 - ax0 * bz1 + ay1 * bw0 + aw1 * by0 + az1 * bx0 - ax1 * bz0;
  out[6] = az0 * bw1 + aw0 * bz1 + ax0 * by1 - ay0 * bx1 + az1 * bw0 + aw1 * bz0 + ax1 * by0 - ay1 * bx0;
  out[7] = aw0 * bw1 - ax0 * bx1 - ay0 * by1 - az0 * bz1 + aw1 * bw0 - ax1 * bx0 - ay1 * by0 - az1 * bz0;
  return out;
}
var mul$1 = multiply$1;
function scale$1(out, a, b) {
  out[0] = a[0] * b;
  out[1] = a[1] * b;
  out[2] = a[2] * b;
  out[3] = a[3] * b;
  out[4] = a[4] * b;
  out[5] = a[5] * b;
  out[6] = a[6] * b;
  out[7] = a[7] * b;
  return out;
}
var dot$1 = dot$2;
function lerp$1(out, a, b, t) {
  var mt = 1 - t;
  if (dot$1(a, b) < 0)
    t = -t;
  out[0] = a[0] * mt + b[0] * t;
  out[1] = a[1] * mt + b[1] * t;
  out[2] = a[2] * mt + b[2] * t;
  out[3] = a[3] * mt + b[3] * t;
  out[4] = a[4] * mt + b[4] * t;
  out[5] = a[5] * mt + b[5] * t;
  out[6] = a[6] * mt + b[6] * t;
  out[7] = a[7] * mt + b[7] * t;
  return out;
}
function invert(out, a) {
  var sqlen = squaredLength$1(a);
  out[0] = -a[0] / sqlen;
  out[1] = -a[1] / sqlen;
  out[2] = -a[2] / sqlen;
  out[3] = a[3] / sqlen;
  out[4] = -a[4] / sqlen;
  out[5] = -a[5] / sqlen;
  out[6] = -a[6] / sqlen;
  out[7] = a[7] / sqlen;
  return out;
}
function conjugate(out, a) {
  out[0] = -a[0];
  out[1] = -a[1];
  out[2] = -a[2];
  out[3] = a[3];
  out[4] = -a[4];
  out[5] = -a[5];
  out[6] = -a[6];
  out[7] = a[7];
  return out;
}
var length$1 = length$2;
var len$1 = length$1;
var squaredLength$1 = squaredLength$2;
var sqrLen$1 = squaredLength$1;
function normalize$1(out, a) {
  var magnitude = squaredLength$1(a);
  if (magnitude > 0) {
    magnitude = Math.sqrt(magnitude);
    var a0 = a[0] / magnitude;
    var a1 = a[1] / magnitude;
    var a2 = a[2] / magnitude;
    var a3 = a[3] / magnitude;
    var b0 = a[4];
    var b1 = a[5];
    var b2 = a[6];
    var b3 = a[7];
    var a_dot_b = a0 * b0 + a1 * b1 + a2 * b2 + a3 * b3;
    out[0] = a0;
    out[1] = a1;
    out[2] = a2;
    out[3] = a3;
    out[4] = (b0 - a0 * a_dot_b) / magnitude;
    out[5] = (b1 - a1 * a_dot_b) / magnitude;
    out[6] = (b2 - a2 * a_dot_b) / magnitude;
    out[7] = (b3 - a3 * a_dot_b) / magnitude;
  }
  return out;
}
function str$1(a) {
  return "quat2(" + a[0] + ", " + a[1] + ", " + a[2] + ", " + a[3] + ", " + a[4] + ", " + a[5] + ", " + a[6] + ", " + a[7] + ")";
}
function exactEquals$1(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3] && a[4] === b[4] && a[5] === b[5] && a[6] === b[6] && a[7] === b[7];
}
function equals$1(a, b) {
  var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3], a4 = a[4], a5 = a[5], a6 = a[6], a7 = a[7];
  var b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3], b4 = b[4], b5 = b[5], b6 = b[6], b7 = b[7];
  return Math.abs(a0 - b0) <= EPSILON * Math.max(1, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= EPSILON * Math.max(1, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= EPSILON * Math.max(1, Math.abs(a2), Math.abs(b2)) && Math.abs(a3 - b3) <= EPSILON * Math.max(1, Math.abs(a3), Math.abs(b3)) && Math.abs(a4 - b4) <= EPSILON * Math.max(1, Math.abs(a4), Math.abs(b4)) && Math.abs(a5 - b5) <= EPSILON * Math.max(1, Math.abs(a5), Math.abs(b5)) && Math.abs(a6 - b6) <= EPSILON * Math.max(1, Math.abs(a6), Math.abs(b6)) && Math.abs(a7 - b7) <= EPSILON * Math.max(1, Math.abs(a7), Math.abs(b7));
}
var quat2 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  create: create$1,
  clone: clone$1,
  fromValues: fromValues$1,
  fromRotationTranslationValues,
  fromRotationTranslation,
  fromTranslation,
  fromRotation,
  fromMat4,
  copy: copy$1,
  identity: identity$1,
  set: set$1,
  getReal,
  getDual,
  setReal,
  setDual,
  getTranslation,
  translate,
  rotateX,
  rotateY,
  rotateZ,
  rotateByQuatAppend,
  rotateByQuatPrepend,
  rotateAroundAxis,
  add: add$1,
  multiply: multiply$1,
  mul: mul$1,
  scale: scale$1,
  dot: dot$1,
  lerp: lerp$1,
  invert,
  conjugate,
  length: length$1,
  len: len$1,
  squaredLength: squaredLength$1,
  sqrLen: sqrLen$1,
  normalize: normalize$1,
  str: str$1,
  exactEquals: exactEquals$1,
  equals: equals$1
});
function create() {
  var out = new ARRAY_TYPE(2);
  if (ARRAY_TYPE != Float32Array) {
    out[0] = 0;
    out[1] = 0;
  }
  return out;
}
function clone(a) {
  var out = new ARRAY_TYPE(2);
  out[0] = a[0];
  out[1] = a[1];
  return out;
}
function fromValues(x, y) {
  var out = new ARRAY_TYPE(2);
  out[0] = x;
  out[1] = y;
  return out;
}
function copy(out, a) {
  out[0] = a[0];
  out[1] = a[1];
  return out;
}
function set(out, x, y) {
  out[0] = x;
  out[1] = y;
  return out;
}
function add(out, a, b) {
  out[0] = a[0] + b[0];
  out[1] = a[1] + b[1];
  return out;
}
function subtract(out, a, b) {
  out[0] = a[0] - b[0];
  out[1] = a[1] - b[1];
  return out;
}
function multiply(out, a, b) {
  out[0] = a[0] * b[0];
  out[1] = a[1] * b[1];
  return out;
}
function divide(out, a, b) {
  out[0] = a[0] / b[0];
  out[1] = a[1] / b[1];
  return out;
}
function ceil(out, a) {
  out[0] = Math.ceil(a[0]);
  out[1] = Math.ceil(a[1]);
  return out;
}
function floor(out, a) {
  out[0] = Math.floor(a[0]);
  out[1] = Math.floor(a[1]);
  return out;
}
function min(out, a, b) {
  out[0] = Math.min(a[0], b[0]);
  out[1] = Math.min(a[1], b[1]);
  return out;
}
function max(out, a, b) {
  out[0] = Math.max(a[0], b[0]);
  out[1] = Math.max(a[1], b[1]);
  return out;
}
function round(out, a) {
  out[0] = Math.round(a[0]);
  out[1] = Math.round(a[1]);
  return out;
}
function scale(out, a, b) {
  out[0] = a[0] * b;
  out[1] = a[1] * b;
  return out;
}
function scaleAndAdd(out, a, b, scale2) {
  out[0] = a[0] + b[0] * scale2;
  out[1] = a[1] + b[1] * scale2;
  return out;
}
function distance(a, b) {
  var x = b[0] - a[0], y = b[1] - a[1];
  return Math.hypot(x, y);
}
function squaredDistance(a, b) {
  var x = b[0] - a[0], y = b[1] - a[1];
  return x * x + y * y;
}
function length(a) {
  var x = a[0], y = a[1];
  return Math.hypot(x, y);
}
function squaredLength(a) {
  var x = a[0], y = a[1];
  return x * x + y * y;
}
function negate(out, a) {
  out[0] = -a[0];
  out[1] = -a[1];
  return out;
}
function inverse(out, a) {
  out[0] = 1 / a[0];
  out[1] = 1 / a[1];
  return out;
}
function normalize(out, a) {
  var x = a[0], y = a[1];
  var len2 = x * x + y * y;
  if (len2 > 0) {
    len2 = 1 / Math.sqrt(len2);
  }
  out[0] = a[0] * len2;
  out[1] = a[1] * len2;
  return out;
}
function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1];
}
function cross(out, a, b) {
  var z = a[0] * b[1] - a[1] * b[0];
  out[0] = out[1] = 0;
  out[2] = z;
  return out;
}
function lerp(out, a, b, t) {
  var ax = a[0], ay = a[1];
  out[0] = ax + t * (b[0] - ax);
  out[1] = ay + t * (b[1] - ay);
  return out;
}
function random(out, scale2) {
  scale2 = scale2 || 1;
  var r = RANDOM() * 2 * Math.PI;
  out[0] = Math.cos(r) * scale2;
  out[1] = Math.sin(r) * scale2;
  return out;
}
function transformMat2(out, a, m) {
  var x = a[0], y = a[1];
  out[0] = m[0] * x + m[2] * y;
  out[1] = m[1] * x + m[3] * y;
  return out;
}
function transformMat2d(out, a, m) {
  var x = a[0], y = a[1];
  out[0] = m[0] * x + m[2] * y + m[4];
  out[1] = m[1] * x + m[3] * y + m[5];
  return out;
}
function transformMat3(out, a, m) {
  var x = a[0], y = a[1];
  out[0] = m[0] * x + m[3] * y + m[6];
  out[1] = m[1] * x + m[4] * y + m[7];
  return out;
}
function transformMat4(out, a, m) {
  var x = a[0];
  var y = a[1];
  out[0] = m[0] * x + m[4] * y + m[12];
  out[1] = m[1] * x + m[5] * y + m[13];
  return out;
}
function rotate(out, a, b, rad) {
  var p0 = a[0] - b[0], p1 = a[1] - b[1], sinC = Math.sin(rad), cosC = Math.cos(rad);
  out[0] = p0 * cosC - p1 * sinC + b[0];
  out[1] = p0 * sinC + p1 * cosC + b[1];
  return out;
}
function angle(a, b) {
  var x1 = a[0], y1 = a[1], x2 = b[0], y2 = b[1], mag = Math.sqrt(x1 * x1 + y1 * y1) * Math.sqrt(x2 * x2 + y2 * y2), cosine = mag && (x1 * x2 + y1 * y2) / mag;
  return Math.acos(Math.min(Math.max(cosine, -1), 1));
}
function zero(out) {
  out[0] = 0;
  out[1] = 0;
  return out;
}
function str(a) {
  return "vec2(" + a[0] + ", " + a[1] + ")";
}
function exactEquals(a, b) {
  return a[0] === b[0] && a[1] === b[1];
}
function equals(a, b) {
  var a0 = a[0], a1 = a[1];
  var b0 = b[0], b1 = b[1];
  return Math.abs(a0 - b0) <= EPSILON * Math.max(1, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= EPSILON * Math.max(1, Math.abs(a1), Math.abs(b1));
}
var len = length;
var sub = subtract;
var mul = multiply;
var div = divide;
var dist = distance;
var sqrDist = squaredDistance;
var sqrLen = squaredLength;
var forEach = function() {
  var vec = create();
  return function(a, stride, offset, count, fn, arg) {
    var i2, l;
    if (!stride) {
      stride = 2;
    }
    if (!offset) {
      offset = 0;
    }
    if (count) {
      l = Math.min(count * stride + offset, a.length);
    } else {
      l = a.length;
    }
    for (i2 = offset; i2 < l; i2 += stride) {
      vec[0] = a[i2];
      vec[1] = a[i2 + 1];
      fn(vec, vec, arg);
      a[i2] = vec[0];
      a[i2 + 1] = vec[1];
    }
    return a;
  };
}();
var vec2$1 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  create,
  clone,
  fromValues,
  copy,
  set,
  add,
  subtract,
  multiply,
  divide,
  ceil,
  floor,
  min,
  max,
  round,
  scale,
  scaleAndAdd,
  distance,
  squaredDistance,
  length,
  squaredLength,
  negate,
  inverse,
  normalize,
  dot,
  cross,
  lerp,
  random,
  transformMat2,
  transformMat2d,
  transformMat3,
  transformMat4,
  rotate,
  angle,
  zero,
  str,
  exactEquals,
  equals,
  len,
  sub,
  mul,
  div,
  dist,
  sqrDist,
  sqrLen,
  forEach
});
var esm = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  glMatrix: common$2,
  mat2,
  mat2d,
  mat3,
  mat4: mat4$6,
  quat,
  quat2,
  vec2: vec2$1,
  vec3: vec3$3,
  vec4: vec4$6
});
var require$$61 = /* @__PURE__ */ getAugmentedNamespace(esm);
function clamp$5(value, min2, max2) {
  return Math.min(Math.max(value, min2), max2);
}
var clamp_1 = clamp$5;
var MAX_LAYERS = 256;
var MAX_LEVELS = 256;
var clamp$4 = clamp_1;
var vec4$5 = require$$61.vec4;
var vec3$2 = require$$61.vec3;
var mat4$5 = require$$61.mat4;
function createShader(gl, type2, src2) {
  var shader = gl.createShader(type2);
  gl.shaderSource(shader, src2);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw gl.getShaderInfoLog(shader);
  }
  return shader;
}
function createShaderProgram$2(gl, vertexSrc2, fragmentSrc2, attribList2, uniformList2) {
  var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSrc2);
  var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSrc2);
  var shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    throw gl.getProgramInfoLog(shaderProgram);
  }
  for (var i2 = 0; i2 < attribList2.length; i2++) {
    var attrib = attribList2[i2];
    shaderProgram[attrib] = gl.getAttribLocation(shaderProgram, attrib);
    if (shaderProgram[attrib] === -1) {
      throw new Error("Shader program has no " + attrib + " attribute");
    }
  }
  for (var j = 0; j < uniformList2.length; j++) {
    var uniform = uniformList2[j];
    shaderProgram[uniform] = gl.getUniformLocation(shaderProgram, uniform);
    if (shaderProgram[uniform] === -1) {
      throw new Error("Shader program has no " + uniform + " uniform");
    }
  }
  return shaderProgram;
}
function destroyShaderProgram$2(gl, shaderProgram) {
  var shaderList = gl.getAttachedShaders(shaderProgram);
  for (var i2 = 0; i2 < shaderList.length; i2++) {
    var shader = shaderList[i2];
    gl.detachShader(shaderProgram, shader);
    gl.deleteShader(shader);
  }
  gl.deleteProgram(shaderProgram);
}
function createConstantBuffer(gl, target, usage, value) {
  var buffer = gl.createBuffer();
  gl.bindBuffer(target, buffer);
  gl.bufferData(target, value, usage);
  return buffer;
}
function createConstantBuffers$2(gl, vertexIndices2, vertexPositions2, textureCoords2) {
  return {
    vertexIndices: createConstantBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, gl.STATIC_DRAW, new Uint16Array(vertexIndices2)),
    vertexPositions: createConstantBuffer(gl, gl.ARRAY_BUFFER, gl.STATIC_DRAW, new Float32Array(vertexPositions2)),
    textureCoords: createConstantBuffer(gl, gl.ARRAY_BUFFER, gl.STATIC_DRAW, new Float32Array(textureCoords2))
  };
}
function destroyConstantBuffers$2(gl, constantBuffers) {
  gl.deleteBuffer(constantBuffers.vertexIndices);
  gl.deleteBuffer(constantBuffers.vertexPositions);
  gl.deleteBuffer(constantBuffers.textureCoords);
}
function enableAttributes$2(gl, shaderProgram) {
  var numAttrs = gl.getProgramParameter(shaderProgram, gl.ACTIVE_ATTRIBUTES);
  for (var i2 = 0; i2 < numAttrs; i2++) {
    gl.enableVertexAttribArray(i2);
  }
}
function disableAttributes$2(gl, shaderProgram) {
  var numAttrs = gl.getProgramParameter(shaderProgram, gl.ACTIVE_ATTRIBUTES);
  for (var i2 = 0; i2 < numAttrs; i2++) {
    gl.disableVertexAttribArray(i2);
  }
}
function setTexture$2(gl, shaderProgram, texture) {
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture._texture);
  gl.uniform1i(shaderProgram.uSampler, 0);
}
function setDepth$2(gl, shaderProgram, layerZ, tileZ) {
  var depth = ((layerZ + 1) * MAX_LEVELS - tileZ) / (MAX_LEVELS * MAX_LAYERS);
  gl.uniform1f(shaderProgram.uDepth, depth);
}
var defaultOpacity = 1;
var defaultColorOffset = vec4$5.create();
var defaultColorMatrix = mat4$5.create();
mat4$5.identity(defaultColorMatrix);
function setupPixelEffectUniforms$2(gl, effects, uniforms) {
  var opacity = defaultOpacity;
  if (effects && effects.opacity != null) {
    opacity = effects.opacity;
  }
  gl.uniform1f(uniforms.opacity, opacity);
  var colorOffset = defaultColorOffset;
  if (effects && effects.colorOffset) {
    colorOffset = effects.colorOffset;
  }
  gl.uniform4fv(uniforms.colorOffset, colorOffset);
  var colorMatrix = defaultColorMatrix;
  if (effects && effects.colorMatrix) {
    colorMatrix = effects.colorMatrix;
  }
  gl.uniformMatrix4fv(uniforms.colorMatrix, false, colorMatrix);
}
var translateVector = vec3$2.create();
var scaleVector = vec3$2.create();
function setViewport$2(gl, layer, rect, viewportMatrix) {
  if (rect.x === 0 && rect.width === 1 && rect.y === 0 && rect.height === 1) {
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    mat4$5.identity(viewportMatrix);
    return;
  }
  var offsetX = rect.x;
  var clampedOffsetX = clamp$4(offsetX, 0, 1);
  var leftExcess = clampedOffsetX - offsetX;
  var maxClampedWidth = 1 - clampedOffsetX;
  var clampedWidth = clamp$4(rect.width - leftExcess, 0, maxClampedWidth);
  var rightExcess = rect.width - clampedWidth;
  var offsetY = 1 - rect.height - rect.y;
  var clampedOffsetY = clamp$4(offsetY, 0, 1);
  var bottomExcess = clampedOffsetY - offsetY;
  var maxClampedHeight = 1 - clampedOffsetY;
  var clampedHeight = clamp$4(rect.height - bottomExcess, 0, maxClampedHeight);
  var topExcess = rect.height - clampedHeight;
  vec3$2.set(scaleVector, rect.width / clampedWidth, rect.height / clampedHeight, 1);
  vec3$2.set(translateVector, (rightExcess - leftExcess) / clampedWidth, (topExcess - bottomExcess) / clampedHeight, 0);
  mat4$5.identity(viewportMatrix);
  mat4$5.translate(viewportMatrix, viewportMatrix, translateVector);
  mat4$5.scale(viewportMatrix, viewportMatrix, scaleVector);
  gl.viewport(gl.drawingBufferWidth * clampedOffsetX, gl.drawingBufferHeight * clampedOffsetY, gl.drawingBufferWidth * clampedWidth, gl.drawingBufferHeight * clampedHeight);
}
var WebGlCommon$2 = {
  createShaderProgram: createShaderProgram$2,
  destroyShaderProgram: destroyShaderProgram$2,
  createConstantBuffers: createConstantBuffers$2,
  destroyConstantBuffers: destroyConstantBuffers$2,
  enableAttributes: enableAttributes$2,
  disableAttributes: disableAttributes$2,
  setTexture: setTexture$2,
  setDepth: setDepth$2,
  setViewport: setViewport$2,
  setupPixelEffectUniforms: setupPixelEffectUniforms$2
};
var vertexNormal = [
  "attribute vec3 aVertexPosition;",
  "attribute vec2 aTextureCoord;",
  "uniform float uDepth;",
  "uniform mat4 uViewportMatrix;",
  "uniform mat4 uProjMatrix;",
  "varying vec2 vTextureCoord;",
  "void main(void) {",
  "  gl_Position = uViewportMatrix * uProjMatrix * vec4(aVertexPosition.xy, 0.0, 1.0);",
  "  gl_Position.z = uDepth * gl_Position.w;",
  "  vTextureCoord = aTextureCoord;",
  "}"
].join("\n");
var fragmentNormal = [
  "#ifdef GL_FRAGMENT_PRECISION_HIGH",
  "precision highp float;",
  "#else",
  "precision mediump float;",
  "#endif",
  "uniform sampler2D uSampler;",
  "uniform float uOpacity;",
  "uniform vec4 uColorOffset;",
  "uniform mat4 uColorMatrix;",
  "varying vec2 vTextureCoord;",
  "void main(void) {",
  "  vec4 color = texture2D(uSampler, vTextureCoord) * uColorMatrix + uColorOffset;",
  "  gl_FragColor = vec4(color.rgba * uOpacity);",
  "}"
].join("\n");
var mat4$4 = require$$61.mat4;
var vec3$1 = require$$61.vec3;
var clearOwnProperties$l = clearOwnProperties_1;
var WebGlCommon$1 = WebGlCommon$2;
var createConstantBuffers$1 = WebGlCommon$1.createConstantBuffers;
var destroyConstantBuffers$1 = WebGlCommon$1.destroyConstantBuffers;
var createShaderProgram$1 = WebGlCommon$1.createShaderProgram;
var destroyShaderProgram$1 = WebGlCommon$1.destroyShaderProgram;
var enableAttributes$1 = WebGlCommon$1.enableAttributes;
var disableAttributes$1 = WebGlCommon$1.disableAttributes;
var setViewport$1 = WebGlCommon$1.setViewport;
var setupPixelEffectUniforms$1 = WebGlCommon$1.setupPixelEffectUniforms;
var setDepth$1 = WebGlCommon$1.setDepth;
var setTexture$1 = WebGlCommon$1.setTexture;
var vertexSrc$1 = vertexNormal;
var fragmentSrc$1 = fragmentNormal;
var vertexIndices$1 = [0, 1, 2, 0, 2, 3];
var vertexPositions$1 = [-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0];
var textureCoords$1 = [0, 0, 1, 0, 1, 1, 0, 1];
var attribList$1 = ["aVertexPosition", "aTextureCoord"];
var uniformList$1 = [
  "uDepth",
  "uOpacity",
  "uSampler",
  "uProjMatrix",
  "uViewportMatrix",
  "uColorOffset",
  "uColorMatrix"
];
function WebGlBaseRenderer$2(gl) {
  this.gl = gl;
  this.projMatrix = mat4$4.create();
  this.viewportMatrix = mat4$4.create();
  this.translateVector = vec3$1.create();
  this.scaleVector = vec3$1.create();
  this.constantBuffers = createConstantBuffers$1(gl, vertexIndices$1, vertexPositions$1, textureCoords$1);
  this.shaderProgram = createShaderProgram$1(gl, vertexSrc$1, fragmentSrc$1, attribList$1, uniformList$1);
}
WebGlBaseRenderer$2.prototype.destroy = function() {
  destroyConstantBuffers$1(this.gl, this.constantBuffers);
  destroyShaderProgram$1(this.gl, this.shaderProgram);
  clearOwnProperties$l(this);
};
WebGlBaseRenderer$2.prototype.startLayer = function(layer, rect) {
  var gl = this.gl;
  var shaderProgram = this.shaderProgram;
  var constantBuffers = this.constantBuffers;
  var viewportMatrix = this.viewportMatrix;
  gl.useProgram(shaderProgram);
  enableAttributes$1(gl, shaderProgram);
  setViewport$1(gl, layer, rect, viewportMatrix);
  gl.uniformMatrix4fv(shaderProgram.uViewportMatrix, false, viewportMatrix);
  gl.bindBuffer(gl.ARRAY_BUFFER, constantBuffers.vertexPositions);
  gl.vertexAttribPointer(shaderProgram.aVertexPosition, 3, gl.FLOAT, gl.FALSE, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, constantBuffers.textureCoords);
  gl.vertexAttribPointer(shaderProgram.aTextureCoord, 2, gl.FLOAT, gl.FALSE, 0, 0);
  setupPixelEffectUniforms$1(gl, layer.effects(), {
    opacity: shaderProgram.uOpacity,
    colorOffset: shaderProgram.uColorOffset,
    colorMatrix: shaderProgram.uColorMatrix
  });
};
WebGlBaseRenderer$2.prototype.endLayer = function(layer, rect) {
  var gl = this.gl;
  var shaderProgram = this.shaderProgram;
  disableAttributes$1(gl, shaderProgram);
};
WebGlBaseRenderer$2.prototype.renderTile = function(tile2, texture, layer, layerZ) {
  var gl = this.gl;
  var shaderProgram = this.shaderProgram;
  var constantBuffers = this.constantBuffers;
  var projMatrix = this.projMatrix;
  var translateVector2 = this.translateVector;
  var scaleVector2 = this.scaleVector;
  translateVector2[0] = tile2.centerX();
  translateVector2[1] = tile2.centerY();
  translateVector2[2] = -0.5;
  scaleVector2[0] = tile2.scaleX();
  scaleVector2[1] = tile2.scaleY();
  scaleVector2[2] = 1;
  mat4$4.copy(projMatrix, layer.view().projection());
  mat4$4.rotateX(projMatrix, projMatrix, tile2.rotX());
  mat4$4.rotateY(projMatrix, projMatrix, tile2.rotY());
  mat4$4.translate(projMatrix, projMatrix, translateVector2);
  mat4$4.scale(projMatrix, projMatrix, scaleVector2);
  gl.uniformMatrix4fv(shaderProgram.uProjMatrix, false, projMatrix);
  setDepth$1(gl, shaderProgram, layerZ, tile2.z);
  setTexture$1(gl, shaderProgram, texture);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, constantBuffers.vertexIndices);
  gl.drawElements(gl.TRIANGLES, vertexIndices$1.length, gl.UNSIGNED_SHORT, 0);
};
var WebGlBase = WebGlBaseRenderer$2;
var WebGlBaseRenderer$1 = WebGlBase;
var inherits$6 = inherits_1;
function WebGlCubeRenderer() {
  this.constructor.super_.apply(this, arguments);
}
inherits$6(WebGlCubeRenderer, WebGlBaseRenderer$1);
var WebGlCube$1 = WebGlCubeRenderer;
var WebGlBaseRenderer = WebGlBase;
var inherits$5 = inherits_1;
function WebGlFlatRenderer() {
  this.constructor.super_.apply(this, arguments);
}
inherits$5(WebGlFlatRenderer, WebGlBaseRenderer);
var WebGlFlat$1 = WebGlFlatRenderer;
var vertexEquirect = [
  "attribute vec3 aVertexPosition;",
  "uniform float uDepth;",
  "uniform mat4 uViewportMatrix;",
  "uniform mat4 uInvProjMatrix;",
  "varying vec4 vRay;",
  "void main(void) {",
  "  vRay = uInvProjMatrix * vec4(aVertexPosition.xy, 1.0, 1.0);",
  "  gl_Position = uViewportMatrix * vec4(aVertexPosition.xy, uDepth, 1.0);",
  "}"
].join("\n");
var fragmentEquirect = [
  "#ifdef GL_FRAGMENT_PRECISION_HIGH",
  "precision highp float;",
  "#else",
  "precision mediump float",
  "#endif",
  "uniform sampler2D uSampler;",
  "uniform float uOpacity;",
  "uniform float uTextureX;",
  "uniform float uTextureY;",
  "uniform float uTextureWidth;",
  "uniform float uTextureHeight;",
  "uniform vec4 uColorOffset;",
  "uniform mat4 uColorMatrix;",
  "varying vec4 vRay;",
  "const float PI = 3.14159265358979323846264;",
  "void main(void) {",
  "  float r = inversesqrt(vRay.x * vRay.x + vRay.y * vRay.y + vRay.z * vRay.z);",
  "  float phi  = acos(vRay.y * r);",
  "  float theta = atan(vRay.x, -1.0*vRay.z);",
  "  float s = 0.5 + 0.5 * theta / PI;",
  "  float t = 1.0 - phi / PI;",
  "  s = s * uTextureWidth + uTextureX;",
  "  t = t * uTextureHeight + uTextureY;",
  "  vec4 color = texture2D(uSampler, vec2(s, t)) * uColorMatrix + uColorOffset;",
  "  gl_FragColor = vec4(color.rgba * uOpacity);",
  "}"
].join("\n");
var mat4$3 = require$$61.mat4;
var clearOwnProperties$k = clearOwnProperties_1;
var WebGlCommon = WebGlCommon$2;
var createConstantBuffers = WebGlCommon.createConstantBuffers;
var destroyConstantBuffers = WebGlCommon.destroyConstantBuffers;
var createShaderProgram = WebGlCommon.createShaderProgram;
var destroyShaderProgram = WebGlCommon.destroyShaderProgram;
var enableAttributes = WebGlCommon.enableAttributes;
var disableAttributes = WebGlCommon.disableAttributes;
var setViewport = WebGlCommon.setViewport;
var setupPixelEffectUniforms = WebGlCommon.setupPixelEffectUniforms;
var setDepth = WebGlCommon.setDepth;
var setTexture = WebGlCommon.setTexture;
var vertexSrc = vertexEquirect;
var fragmentSrc = fragmentEquirect;
var vertexIndices = [0, 1, 2, 0, 2, 3];
var vertexPositions = [-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0];
var textureCoords = [0, 0, 1, 0, 1, 1, 0, 1];
var attribList = ["aVertexPosition"];
var uniformList = [
  "uDepth",
  "uOpacity",
  "uSampler",
  "uInvProjMatrix",
  "uViewportMatrix",
  "uColorOffset",
  "uColorMatrix",
  "uTextureX",
  "uTextureY",
  "uTextureWidth",
  "uTextureHeight"
];
function WebGlEquirectRenderer(gl) {
  this.gl = gl;
  this.invProjMatrix = mat4$3.create();
  this.viewportMatrix = mat4$3.create();
  this.constantBuffers = createConstantBuffers(gl, vertexIndices, vertexPositions, textureCoords);
  this.shaderProgram = createShaderProgram(gl, vertexSrc, fragmentSrc, attribList, uniformList);
}
WebGlEquirectRenderer.prototype.destroy = function() {
  destroyConstantBuffers(this.gl, this.constantBuffers);
  destroyShaderProgram(this.gl, this.shaderProgram);
  clearOwnProperties$k(this);
};
WebGlEquirectRenderer.prototype.startLayer = function(layer, rect) {
  var gl = this.gl;
  var shaderProgram = this.shaderProgram;
  var constantBuffers = this.constantBuffers;
  var invProjMatrix = this.invProjMatrix;
  var viewportMatrix = this.viewportMatrix;
  gl.useProgram(shaderProgram);
  enableAttributes(gl, shaderProgram);
  setViewport(gl, layer, rect, viewportMatrix);
  gl.uniformMatrix4fv(shaderProgram.uViewportMatrix, false, viewportMatrix);
  gl.bindBuffer(gl.ARRAY_BUFFER, constantBuffers.vertexPositions);
  gl.vertexAttribPointer(shaderProgram.aVertexPosition, 3, gl.FLOAT, gl.FALSE, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, constantBuffers.textureCoords);
  mat4$3.copy(invProjMatrix, layer.view().projection());
  mat4$3.invert(invProjMatrix, invProjMatrix);
  gl.uniformMatrix4fv(shaderProgram.uInvProjMatrix, false, invProjMatrix);
  var textureCrop = layer.effects().textureCrop || {};
  var textureX = textureCrop.x != null ? textureCrop.x : 0;
  var textureY = textureCrop.y != null ? textureCrop.y : 0;
  var textureWidth = textureCrop.width != null ? textureCrop.width : 1;
  var textureHeight = textureCrop.height != null ? textureCrop.height : 1;
  gl.uniform1f(shaderProgram.uTextureX, textureX);
  gl.uniform1f(shaderProgram.uTextureY, textureY);
  gl.uniform1f(shaderProgram.uTextureWidth, textureWidth);
  gl.uniform1f(shaderProgram.uTextureHeight, textureHeight);
  setupPixelEffectUniforms(gl, layer.effects(), {
    opacity: shaderProgram.uOpacity,
    colorOffset: shaderProgram.uColorOffset,
    colorMatrix: shaderProgram.uColorMatrix
  });
};
WebGlEquirectRenderer.prototype.endLayer = function(layer, rect) {
  var gl = this.gl;
  var shaderProgram = this.shaderProgram;
  disableAttributes(gl, shaderProgram);
};
WebGlEquirectRenderer.prototype.renderTile = function(tile2, texture, layer, layerZ) {
  var gl = this.gl;
  var shaderProgram = this.shaderProgram;
  var constantBuffers = this.constantBuffers;
  setDepth(gl, shaderProgram, layerZ, tile2.z);
  setTexture(gl, shaderProgram, texture);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, constantBuffers.vertexIndices);
  gl.drawElements(gl.TRIANGLES, vertexIndices.length, gl.UNSIGNED_SHORT, 0);
};
var WebGlEquirect$1 = WebGlEquirectRenderer;
var WebGlCube = WebGlCube$1;
var WebGlFlat = WebGlFlat$1;
var WebGlEquirect = WebGlEquirect$1;
function registerDefaultRenderers$1(stage) {
  switch (stage.type) {
    case "webgl":
      stage.registerRenderer("flat", "flat", WebGlFlat);
      stage.registerRenderer("cube", "rectilinear", WebGlCube);
      stage.registerRenderer("equirect", "rectilinear", WebGlEquirect);
      break;
    default:
      throw new Error("Unknown stage type: " + stage.type);
  }
}
var registerDefaultRenderers_1 = registerDefaultRenderers$1;
function hash$3() {
  var h = 0;
  for (var i2 = 0; i2 < arguments.length; i2++) {
    var k = arguments[i2];
    h += k;
    h += k << 10;
    h ^= k >> 6;
  }
  h += h << 3;
  h ^= h >> 11;
  h += h << 15;
  return h >= 0 ? h : -h;
}
var hash_1 = hash$3;
function mod$7(a, b) {
  return (+a % (b = +b) + b) % b;
}
var mod_1 = mod$7;
var mod$6 = mod_1;
var defaultCapacity$1 = 64;
function Set$3(capacity) {
  if (capacity != null && (!isFinite(capacity) || Math.floor(capacity) !== capacity || capacity < 1)) {
    throw new Error("Set: invalid capacity");
  }
  this._capacity = this._capacity || defaultCapacity$1;
  this._buckets = [];
  for (var i2 = 0; i2 < this._capacity; i2++) {
    this._buckets.push([]);
  }
  this._size = 0;
}
Set$3.prototype.add = function(element2) {
  var h = mod$6(element2.hash(), this._capacity);
  var bucket = this._buckets[h];
  for (var i2 = 0; i2 < bucket.length; i2++) {
    var existingElement = bucket[i2];
    if (element2.equals(existingElement)) {
      bucket[i2] = element2;
      return existingElement;
    }
  }
  bucket.push(element2);
  this._size++;
  return null;
};
Set$3.prototype.remove = function(element2) {
  var h = mod$6(element2.hash(), this._capacity);
  var bucket = this._buckets[h];
  for (var i2 = 0; i2 < bucket.length; i2++) {
    var existingElement = bucket[i2];
    if (element2.equals(existingElement)) {
      for (var j = i2; j < bucket.length - 1; j++) {
        bucket[j] = bucket[j + 1];
      }
      bucket.length = bucket.length - 1;
      this._size--;
      return existingElement;
    }
  }
  return null;
};
Set$3.prototype.has = function(element2) {
  var h = mod$6(element2.hash(), this._capacity);
  var bucket = this._buckets[h];
  for (var i2 = 0; i2 < bucket.length; i2++) {
    var existingElement = bucket[i2];
    if (element2.equals(existingElement)) {
      return true;
    }
  }
  return false;
};
Set$3.prototype.size = function() {
  return this._size;
};
Set$3.prototype.clear = function() {
  for (var i2 = 0; i2 < this._capacity; i2++) {
    this._buckets[i2].length = 0;
  }
  this._size = 0;
};
Set$3.prototype.forEach = function(fn) {
  var count = 0;
  for (var i2 = 0; i2 < this._capacity; i2++) {
    var bucket = this._buckets[i2];
    for (var j = 0; j < bucket.length; j++) {
      fn(bucket[j]);
      count += 1;
    }
  }
  return count;
};
var _Set = Set$3;
var Set$2 = _Set;
function TileSearcher$2() {
  this._stack = [];
  this._visited = new Set$2();
  this._vertices = null;
}
TileSearcher$2.prototype.search = function(view, startingTile, result) {
  var stack = this._stack;
  var visited = this._visited;
  var vertices = this._vertices;
  var count = 0;
  this._clear();
  stack.push(startingTile);
  while (stack.length > 0) {
    var tile2 = stack.pop();
    if (visited.has(tile2)) {
      continue;
    }
    if (!view.intersects(tile2.vertices(vertices))) {
      continue;
    }
    visited.add(tile2);
    var neighbors = tile2.neighbors();
    for (var i2 = 0; i2 < neighbors.length; i2++) {
      stack.push(neighbors[i2]);
    }
    result.push(tile2);
    count++;
  }
  this._vertices = vertices;
  this._clear();
  return count;
};
TileSearcher$2.prototype._clear = function() {
  this._stack.length = 0;
  this._visited.clear();
};
var TileSearcher_1 = TileSearcher$2;
var mod$5 = mod_1;
function LruMap$2(capacity) {
  if (!isFinite(capacity) || Math.floor(capacity) !== capacity || capacity < 0) {
    throw new Error("LruMap: invalid capacity");
  }
  this._capacity = capacity;
  this._keys = new Array(this._capacity);
  this._values = new Array(this._capacity);
  this._start = 0;
  this._size = 0;
}
LruMap$2.prototype._index = function(i2) {
  return mod$5(this._start + i2, this._capacity);
};
LruMap$2.prototype.get = function(key) {
  for (var i2 = 0; i2 < this._size; i2++) {
    var existingKey = this._keys[this._index(i2)];
    if (key.equals(existingKey)) {
      return this._values[this._index(i2)];
    }
  }
  return null;
};
LruMap$2.prototype.set = function(key, value) {
  if (this._capacity === 0) {
    return key;
  }
  this.del(key);
  var evictedKey = this._size === this._capacity ? this._keys[this._index(0)] : null;
  this._keys[this._index(this._size)] = key;
  this._values[this._index(this._size)] = value;
  if (this._size < this._capacity) {
    this._size++;
  } else {
    this._start = this._index(1);
  }
  return evictedKey;
};
LruMap$2.prototype.del = function(key) {
  for (var i2 = 0; i2 < this._size; i2++) {
    if (key.equals(this._keys[this._index(i2)])) {
      var existingValue = this._values[this._index(i2)];
      for (var j = i2; j < this._size - 1; j++) {
        this._keys[this._index(j)] = this._keys[this._index(j + 1)];
        this._values[this._index(j)] = this._values[this._index(j + 1)];
      }
      this._size--;
      return existingValue;
    }
  }
  return null;
};
LruMap$2.prototype.has = function(key) {
  for (var i2 = 0; i2 < this._size; i2++) {
    if (key.equals(this._keys[this._index(i2)])) {
      return true;
    }
  }
  return false;
};
LruMap$2.prototype.size = function() {
  return this._size;
};
LruMap$2.prototype.clear = function() {
  this._keys.length = 0;
  this._values.length = 0;
  this._start = 0;
  this._size = 0;
};
LruMap$2.prototype.forEach = function(fn) {
  var count = 0;
  for (var i2 = 0; i2 < this._size; i2++) {
    fn(this._keys[this._index(i2)], this._values[this._index(i2)]);
    count += 1;
  }
  return count;
};
var LruMap_1 = LruMap$2;
function Level$3(levelProperties) {
  this._fallbackOnly = !!levelProperties.fallbackOnly;
}
Level$3.prototype.numHorizontalTiles = function() {
  return Math.ceil(this.width() / this.tileWidth());
};
Level$3.prototype.numVerticalTiles = function() {
  return Math.ceil(this.height() / this.tileHeight());
};
Level$3.prototype.fallbackOnly = function() {
  return this._fallbackOnly;
};
var Level_1 = Level$3;
function cmp$4(x, y) {
  if (x < y) {
    return -1;
  }
  if (x > y) {
    return 1;
  }
  return 0;
}
var cmp_1 = cmp$4;
var cmp$3 = cmp_1;
function makeLevelList$2(levelPropertiesList, LevelClass) {
  var list = [];
  for (var i2 = 0; i2 < levelPropertiesList.length; i2++) {
    list.push(new LevelClass(levelPropertiesList[i2]));
  }
  list.sort(function(level1, level2) {
    return cmp$3(level1.width(), level2.width());
  });
  return list;
}
function makeSelectableLevelList$2(levelList) {
  var list = [];
  for (var i2 = 0; i2 < levelList.length; i2++) {
    if (!levelList[i2]._fallbackOnly) {
      list.push(levelList[i2]);
    }
  }
  if (!list.length) {
    throw new Error("No selectable levels in list");
  }
  return list;
}
var common$1 = {
  makeLevelList: makeLevelList$2,
  makeSelectableLevelList: makeSelectableLevelList$2
};
function type$4(x) {
  var typ = typeof x;
  if (typ === "object") {
    if (x === null) {
      return "null";
    }
    if (Object.prototype.toString.call(x) === "[object Array]") {
      return "array";
    }
    if (Object.prototype.toString.call(x) === "[object RegExp]") {
      return "regexp";
    }
  }
  return typ;
}
var type_1 = type$4;
var inherits$4 = inherits_1;
var hash$2 = hash_1;
var TileSearcher$1 = TileSearcher_1;
var LruMap$1 = LruMap_1;
var Level$2 = Level_1;
var makeLevelList$1 = common$1.makeLevelList;
var makeSelectableLevelList$1 = common$1.makeSelectableLevelList;
var clamp$3 = clamp_1;
var cmp$2 = cmp_1;
var type$3 = type_1;
var vec3 = require$$61.vec3;
var vec4$4 = require$$61.vec4;
var neighborsCacheSize$1 = 64;
var faceList = "fudlrb";
var faceRotation = {
  f: { x: 0, y: 0 },
  b: { x: 0, y: Math.PI },
  l: { x: 0, y: Math.PI / 2 },
  r: { x: 0, y: -Math.PI / 2 },
  u: { x: Math.PI / 2, y: 0 },
  d: { x: -Math.PI / 2, y: 0 }
};
var origin = vec3.create();
function rotateVector(vec, z, x, y) {
  if (z) {
    vec3.rotateZ(vec, vec, origin, z);
  }
  if (x) {
    vec3.rotateX(vec, vec, origin, x);
  }
  if (y) {
    vec3.rotateY(vec, vec, origin, y);
  }
}
var faceVectors = {};
for (var i = 0; i < faceList.length; i++) {
  var face = faceList[i];
  var rotation = faceRotation[face];
  var v = vec3.fromValues(0, 0, -1);
  rotateVector(v, 0, rotation.x, rotation.y);
  faceVectors[face] = v;
}
var adjacentFace = {
  f: ["l", "r", "u", "d"],
  b: ["r", "l", "u", "d"],
  l: ["b", "f", "u", "d"],
  r: ["f", "b", "u", "d"],
  u: ["l", "r", "b", "f"],
  d: ["l", "r", "f", "b"]
};
var neighborOffsets$1 = [
  [0, 1],
  [1, 0],
  [0, -1],
  [-1, 0]
];
function CubeTile(face2, x, y, z, geometry) {
  this.face = face2;
  this.x = x;
  this.y = y;
  this.z = z;
  this._geometry = geometry;
  this._level = geometry.levelList[z];
}
CubeTile.prototype.rotX = function() {
  return faceRotation[this.face].x;
};
CubeTile.prototype.rotY = function() {
  return faceRotation[this.face].y;
};
CubeTile.prototype.centerX = function() {
  return (this.x + 0.5) / this._level.numHorizontalTiles() - 0.5;
};
CubeTile.prototype.centerY = function() {
  return 0.5 - (this.y + 0.5) / this._level.numVerticalTiles();
};
CubeTile.prototype.scaleX = function() {
  return 1 / this._level.numHorizontalTiles();
};
CubeTile.prototype.scaleY = function() {
  return 1 / this._level.numVerticalTiles();
};
CubeTile.prototype.vertices = function(result) {
  if (!result) {
    result = [vec3.create(), vec3.create(), vec3.create(), vec3.create()];
  }
  var rot = faceRotation[this.face];
  function makeVertex(vec, x, y) {
    vec3.set(vec, x, y, -0.5);
    rotateVector(vec, 0, rot.x, rot.y);
  }
  var left = this.centerX() - this.scaleX() / 2;
  var right = this.centerX() + this.scaleX() / 2;
  var bottom = this.centerY() - this.scaleY() / 2;
  var top = this.centerY() + this.scaleY() / 2;
  makeVertex(result[0], left, top);
  makeVertex(result[1], right, top);
  makeVertex(result[2], right, bottom);
  makeVertex(result[3], left, bottom);
  return result;
};
CubeTile.prototype.parent = function() {
  if (this.z === 0) {
    return null;
  }
  var face2 = this.face;
  var z = this.z;
  var x = this.x;
  var y = this.y;
  var geometry = this._geometry;
  var level = geometry.levelList[z];
  var parentLevel = geometry.levelList[z - 1];
  var tileX = Math.floor(x / level.numHorizontalTiles() * parentLevel.numHorizontalTiles());
  var tileY = Math.floor(y / level.numVerticalTiles() * parentLevel.numVerticalTiles());
  var tileZ = z - 1;
  return new CubeTile(face2, tileX, tileY, tileZ, geometry);
};
CubeTile.prototype.children = function(result) {
  if (this.z === this._geometry.levelList.length - 1) {
    return null;
  }
  var face2 = this.face;
  var z = this.z;
  var x = this.x;
  var y = this.y;
  var geometry = this._geometry;
  var level = geometry.levelList[z];
  var childLevel = geometry.levelList[z + 1];
  var nHoriz = childLevel.numHorizontalTiles() / level.numHorizontalTiles();
  var nVert = childLevel.numVerticalTiles() / level.numVerticalTiles();
  result = result || [];
  for (var h = 0; h < nHoriz; h++) {
    for (var v2 = 0; v2 < nVert; v2++) {
      var tileX = nHoriz * x + h;
      var tileY = nVert * y + v2;
      var tileZ = z + 1;
      result.push(new CubeTile(face2, tileX, tileY, tileZ, geometry));
    }
  }
  return result;
};
CubeTile.prototype.neighbors = function() {
  var geometry = this._geometry;
  var cache = geometry._neighborsCache;
  var cachedResult = cache.get(this);
  if (cachedResult) {
    return cachedResult;
  }
  var vec = geometry._vec;
  var face2 = this.face;
  var x = this.x;
  var y = this.y;
  var z = this.z;
  var level = this._level;
  var numX = level.numHorizontalTiles();
  var numY = level.numVerticalTiles();
  var result = [];
  for (var i2 = 0; i2 < neighborOffsets$1.length; i2++) {
    var xOffset = neighborOffsets$1[i2][0];
    var yOffset = neighborOffsets$1[i2][1];
    var newX = x + xOffset;
    var newY = y + yOffset;
    var newZ = z;
    var newFace = face2;
    if (newX < 0 || newX >= numX || newY < 0 || newY >= numY) {
      var xCoord = this.centerX();
      var yCoord = this.centerY();
      if (newX < 0) {
        vec3.set(vec, -0.5, yCoord, -0.5);
        newFace = adjacentFace[face2][0];
      } else if (newX >= numX) {
        vec3.set(vec, 0.5, yCoord, -0.5);
        newFace = adjacentFace[face2][1];
      } else if (newY < 0) {
        vec3.set(vec, xCoord, 0.5, -0.5);
        newFace = adjacentFace[face2][2];
      } else if (newY >= numY) {
        vec3.set(vec, xCoord, -0.5, -0.5);
        newFace = adjacentFace[face2][3];
      }
      var rot;
      rot = faceRotation[face2];
      rotateVector(vec, 0, rot.x, rot.y);
      rot = faceRotation[newFace];
      rotateVector(vec, 0, -rot.x, -rot.y);
      newX = clamp$3(Math.floor((0.5 + vec[0]) * numX), 0, numX - 1);
      newY = clamp$3(Math.floor((0.5 - vec[1]) * numY), 0, numY - 1);
    }
    result.push(new CubeTile(newFace, newX, newY, newZ, geometry));
  }
  cache.set(this, result);
  return result;
};
CubeTile.prototype.hash = function() {
  return hash$2(faceList.indexOf(this.face), this.z, this.y, this.x);
};
CubeTile.prototype.equals = function(that) {
  return this._geometry === that._geometry && this.face === that.face && this.z === that.z && this.y === that.y && this.x === that.x;
};
CubeTile.prototype.cmp = function(that) {
  return cmp$2(this.z, that.z) || cmp$2(faceList.indexOf(this.face), faceList.indexOf(that.face)) || cmp$2(this.y, that.y) || cmp$2(this.x, that.x);
};
CubeTile.prototype.str = function() {
  return "CubeTile(" + tile.face + ", " + tile.x + ", " + tile.y + ", " + tile.z + ")";
};
function CubeLevel(levelProperties) {
  this.constructor.super_.call(this, levelProperties);
  this._size = levelProperties.size;
  this._tileSize = levelProperties.tileSize;
  if (this._size % this._tileSize !== 0) {
    throw new Error("Level size is not multiple of tile size: " + this._size + " " + this._tileSize);
  }
}
inherits$4(CubeLevel, Level$2);
CubeLevel.prototype.width = function() {
  return this._size;
};
CubeLevel.prototype.height = function() {
  return this._size;
};
CubeLevel.prototype.tileWidth = function() {
  return this._tileSize;
};
CubeLevel.prototype.tileHeight = function() {
  return this._tileSize;
};
CubeLevel.prototype._validateWithParentLevel = function(parentLevel) {
  var width = this.width();
  var height = this.height();
  var tileWidth = this.tileWidth();
  var tileHeight = this.tileHeight();
  var numHorizontal = this.numHorizontalTiles();
  var numVertical = this.numVerticalTiles();
  var parentWidth = parentLevel.width();
  var parentHeight = parentLevel.height();
  var parentTileWidth = parentLevel.tileWidth();
  var parentTileHeight = parentLevel.tileHeight();
  var parentNumHorizontal = parentLevel.numHorizontalTiles();
  var parentNumVertical = parentLevel.numVerticalTiles();
  if (width % parentWidth !== 0) {
    throw new Error("Level width must be multiple of parent level: " + width + " vs. " + parentWidth);
  }
  if (height % parentHeight !== 0) {
    throw new Error("Level height must be multiple of parent level: " + height + " vs. " + parentHeight);
  }
  if (numHorizontal % parentNumHorizontal !== 0) {
    throw new Error("Number of horizontal tiles must be multiple of parent level: " + numHorizontal + " (" + width + "/" + tileWidth + ") vs. " + parentNumHorizontal + " (" + parentWidth + "/" + parentTileWidth + ")");
  }
  if (numVertical % parentNumVertical !== 0) {
    throw new Error("Number of vertical tiles must be multiple of parent level: " + numVertical + " (" + height + "/" + tileHeight + ") vs. " + parentNumVertical + " (" + parentHeight + "/" + parentTileHeight + ")");
  }
};
function CubeGeometry(levelPropertiesList) {
  if (type$3(levelPropertiesList) !== "array") {
    throw new Error("Level list must be an array");
  }
  this.levelList = makeLevelList$1(levelPropertiesList, CubeLevel);
  this.selectableLevelList = makeSelectableLevelList$1(this.levelList);
  for (var i2 = 1; i2 < this.levelList.length; i2++) {
    this.levelList[i2]._validateWithParentLevel(this.levelList[i2 - 1]);
  }
  this._tileSearcher = new TileSearcher$1(this);
  this._neighborsCache = new LruMap$1(neighborsCacheSize$1);
  this._vec = vec4$4.create();
  this._viewSize = {};
}
CubeGeometry.prototype.maxTileSize = function() {
  var maxTileSize = 0;
  for (var i2 = 0; i2 < this.levelList.length; i2++) {
    var level = this.levelList[i2];
    maxTileSize = Math.max(maxTileSize, level.tileWidth, level.tileHeight);
  }
  return maxTileSize;
};
CubeGeometry.prototype.levelTiles = function(level, result) {
  var levelIndex = this.levelList.indexOf(level);
  var maxX = level.numHorizontalTiles() - 1;
  var maxY = level.numVerticalTiles() - 1;
  result = result || [];
  for (var f = 0; f < faceList.length; f++) {
    var face2 = faceList[f];
    for (var x = 0; x <= maxX; x++) {
      for (var y = 0; y <= maxY; y++) {
        result.push(new CubeTile(face2, x, y, levelIndex, this));
      }
    }
  }
  return result;
};
CubeGeometry.prototype._closestTile = function(view, level) {
  var ray = this._vec;
  vec4$4.set(ray, 0, 0, 1, 1);
  vec4$4.transformMat4(ray, ray, view.inverseProjection());
  var minAngle = Infinity;
  var closestFace = null;
  for (var face2 in faceVectors) {
    var vector = faceVectors[face2];
    var angle2 = 1 - vec3.dot(vector, ray);
    if (angle2 < minAngle) {
      minAngle = angle2;
      closestFace = face2;
    }
  }
  var max2 = Math.max(Math.abs(ray[0]), Math.abs(ray[1]), Math.abs(ray[2])) / 0.5;
  for (var i2 = 0; i2 < 3; i2++) {
    ray[i2] = ray[i2] / max2;
  }
  var rot = faceRotation[closestFace];
  rotateVector(ray, 0, -rot.x, -rot.y);
  var tileZ = this.levelList.indexOf(level);
  var numX = level.numHorizontalTiles();
  var numY = level.numVerticalTiles();
  var tileX = clamp$3(Math.floor((0.5 + ray[0]) * numX), 0, numX - 1);
  var tileY = clamp$3(Math.floor((0.5 - ray[1]) * numY), 0, numY - 1);
  return new CubeTile(closestFace, tileX, tileY, tileZ, this);
};
CubeGeometry.prototype.visibleTiles = function(view, level, result) {
  var viewSize = this._viewSize;
  var tileSearcher = this._tileSearcher;
  result = result || [];
  view.size(viewSize);
  if (viewSize.width === 0 || viewSize.height === 0) {
    return result;
  }
  var startingTile = this._closestTile(view, level);
  var count = tileSearcher.search(view, startingTile, result);
  if (!count) {
    throw new Error("Starting tile is not visible");
  }
  return result;
};
CubeGeometry.Tile = CubeGeometry.prototype.Tile = CubeTile;
CubeGeometry.type = CubeGeometry.prototype.type = "cube";
CubeTile.type = CubeTile.prototype.type = "cube";
var Cube = CubeGeometry;
var inherits$3 = inherits_1;
var hash$1 = hash_1;
var TileSearcher = TileSearcher_1;
var LruMap = LruMap_1;
var Level$1 = Level_1;
var makeLevelList = common$1.makeLevelList;
var makeSelectableLevelList = common$1.makeSelectableLevelList;
var clamp$2 = clamp_1;
var mod$4 = mod_1;
var cmp$1 = cmp_1;
var type$2 = type_1;
var vec2 = require$$61.vec2;
var vec4$3 = require$$61.vec4;
var neighborsCacheSize = 64;
var neighborOffsets = [
  [0, 1],
  [1, 0],
  [0, -1],
  [-1, 0]
];
function FlatTile(x, y, z, geometry) {
  this.x = x;
  this.y = y;
  this.z = z;
  this._geometry = geometry;
  this._level = geometry.levelList[z];
}
FlatTile.prototype.rotX = function() {
  return 0;
};
FlatTile.prototype.rotY = function() {
  return 0;
};
FlatTile.prototype.centerX = function() {
  var levelWidth = this._level.width();
  var tileWidth = this._level.tileWidth();
  return (this.x * tileWidth + 0.5 * this.width()) / levelWidth - 0.5;
};
FlatTile.prototype.centerY = function() {
  var levelHeight = this._level.height();
  var tileHeight = this._level.tileHeight();
  return 0.5 - (this.y * tileHeight + 0.5 * this.height()) / levelHeight;
};
FlatTile.prototype.scaleX = function() {
  var levelWidth = this._level.width();
  return this.width() / levelWidth;
};
FlatTile.prototype.scaleY = function() {
  var levelHeight = this._level.height();
  return this.height() / levelHeight;
};
FlatTile.prototype.width = function() {
  var levelWidth = this._level.width();
  var tileWidth = this._level.tileWidth();
  if (this.x === this._level.numHorizontalTiles() - 1) {
    var widthRemainder = mod$4(levelWidth, tileWidth);
    return widthRemainder || tileWidth;
  } else {
    return tileWidth;
  }
};
FlatTile.prototype.height = function() {
  var levelHeight = this._level.height();
  var tileHeight = this._level.tileHeight();
  if (this.y === this._level.numVerticalTiles() - 1) {
    var heightRemainder = mod$4(levelHeight, tileHeight);
    return heightRemainder || tileHeight;
  } else {
    return tileHeight;
  }
};
FlatTile.prototype.levelWidth = function() {
  return this._level.width();
};
FlatTile.prototype.levelHeight = function() {
  return this._level.height();
};
FlatTile.prototype.vertices = function(result) {
  if (!result) {
    result = [vec2.create(), vec2.create(), vec2.create(), vec2.create()];
  }
  var left = this.centerX() - this.scaleX() / 2;
  var right = this.centerX() + this.scaleX() / 2;
  var bottom = this.centerY() - this.scaleY() / 2;
  var top = this.centerY() + this.scaleY() / 2;
  vec2.set(result[0], left, top);
  vec2.set(result[1], right, top);
  vec2.set(result[2], right, bottom);
  vec2.set(result[3], left, bottom);
  return result;
};
FlatTile.prototype.parent = function() {
  if (this.z === 0) {
    return null;
  }
  var geometry = this._geometry;
  var z = this.z - 1;
  var x = Math.floor(this.x / 2);
  var y = Math.floor(this.y / 2);
  return new FlatTile(x, y, z, geometry);
};
FlatTile.prototype.children = function(result) {
  if (this.z === this._geometry.levelList.length - 1) {
    return null;
  }
  var geometry = this._geometry;
  var z = this.z + 1;
  result = result || [];
  result.push(new FlatTile(2 * this.x, 2 * this.y, z, geometry));
  result.push(new FlatTile(2 * this.x, 2 * this.y + 1, z, geometry));
  result.push(new FlatTile(2 * this.x + 1, 2 * this.y, z, geometry));
  result.push(new FlatTile(2 * this.x + 1, 2 * this.y + 1, z, geometry));
  return result;
};
FlatTile.prototype.neighbors = function() {
  var geometry = this._geometry;
  var cache = geometry._neighborsCache;
  var cachedResult = cache.get(this);
  if (cachedResult) {
    return cachedResult;
  }
  var x = this.x;
  var y = this.y;
  var z = this.z;
  var level = this._level;
  var numX = level.numHorizontalTiles() - 1;
  var numY = level.numVerticalTiles() - 1;
  var result = [];
  for (var i2 = 0; i2 < neighborOffsets.length; i2++) {
    var xOffset = neighborOffsets[i2][0];
    var yOffset = neighborOffsets[i2][1];
    var newX = x + xOffset;
    var newY = y + yOffset;
    var newZ = z;
    if (0 <= newX && newX <= numX && 0 <= newY && newY <= numY) {
      result.push(new FlatTile(newX, newY, newZ, geometry));
    }
  }
  cache.set(this, result);
  return result;
};
FlatTile.prototype.hash = function() {
  return hash$1(this.z, this.y, this.x);
};
FlatTile.prototype.equals = function(that) {
  return this._geometry === that._geometry && this.z === that.z && this.y === that.y && this.x === that.x;
};
FlatTile.prototype.cmp = function(that) {
  return cmp$1(this.z, that.z) || cmp$1(this.y, that.y) || cmp$1(this.x, that.x);
};
FlatTile.prototype.str = function() {
  return "FlatTile(" + tile.x + ", " + tile.y + ", " + tile.z + ")";
};
function FlatLevel(levelProperties) {
  this.constructor.super_.call(this, levelProperties);
  this._width = levelProperties.width;
  this._height = levelProperties.height;
  this._tileWidth = levelProperties.tileWidth;
  this._tileHeight = levelProperties.tileHeight;
}
inherits$3(FlatLevel, Level$1);
FlatLevel.prototype.width = function() {
  return this._width;
};
FlatLevel.prototype.height = function() {
  return this._height;
};
FlatLevel.prototype.tileWidth = function() {
  return this._tileWidth;
};
FlatLevel.prototype.tileHeight = function() {
  return this._tileHeight;
};
FlatLevel.prototype._validateWithParentLevel = function(parentLevel) {
  var width = this.width();
  var height = this.height();
  var tileWidth = this.tileWidth();
  var tileHeight = this.tileHeight();
  var parentWidth = parentLevel.width();
  var parentHeight = parentLevel.height();
  var parentTileWidth = parentLevel.tileWidth();
  var parentTileHeight = parentLevel.tileHeight();
  if (width % parentWidth !== 0) {
    return new Error("Level width must be multiple of parent level: " + width + " vs. " + parentWidth);
  }
  if (height % parentHeight !== 0) {
    return new Error("Level height must be multiple of parent level: " + height + " vs. " + parentHeight);
  }
  if (tileWidth % parentTileWidth !== 0) {
    return new Error("Level tile width must be multiple of parent level: " + tileWidth + " vs. " + parentTileWidth);
  }
  if (tileHeight % parentTileHeight !== 0) {
    return new Error("Level tile height must be multiple of parent level: " + tileHeight + " vs. " + parentTileHeight);
  }
};
function FlatGeometry(levelPropertiesList) {
  if (type$2(levelPropertiesList) !== "array") {
    throw new Error("Level list must be an array");
  }
  this.levelList = makeLevelList(levelPropertiesList, FlatLevel);
  this.selectableLevelList = makeSelectableLevelList(this.levelList);
  for (var i2 = 1; i2 < this.levelList.length; i2++) {
    this.levelList[i2]._validateWithParentLevel(this.levelList[i2 - 1]);
  }
  this._tileSearcher = new TileSearcher(this);
  this._neighborsCache = new LruMap(neighborsCacheSize);
  this._vec = vec4$3.create();
  this._viewSize = {};
}
FlatGeometry.prototype.maxTileSize = function() {
  var maxTileSize = 0;
  for (var i2 = 0; i2 < this.levelList.length; i2++) {
    var level = this.levelList[i2];
    maxTileSize = Math.max(maxTileSize, level.tileWidth, level.tileHeight);
  }
  return maxTileSize;
};
FlatGeometry.prototype.levelTiles = function(level, result) {
  var levelIndex = this.levelList.indexOf(level);
  var maxX = level.numHorizontalTiles() - 1;
  var maxY = level.numVerticalTiles() - 1;
  if (!result) {
    result = [];
  }
  for (var x = 0; x <= maxX; x++) {
    for (var y = 0; y <= maxY; y++) {
      result.push(new FlatTile(x, y, levelIndex, this));
    }
  }
  return result;
};
FlatGeometry.prototype._closestTile = function(view, level) {
  var ray = this._vec;
  vec4$3.set(ray, 0, 0, 1, 1);
  vec4$3.transformMat4(ray, ray, view.inverseProjection());
  var x = 0.5 + ray[0];
  var y = 0.5 - ray[1];
  var tileZ = this.levelList.indexOf(level);
  var levelWidth = level.width();
  var levelHeight = level.height();
  var tileWidth = level.tileWidth();
  var tileHeight = level.tileHeight();
  var numX = level.numHorizontalTiles();
  var numY = level.numVerticalTiles();
  var tileX = clamp$2(Math.floor(x * levelWidth / tileWidth), 0, numX - 1);
  var tileY = clamp$2(Math.floor(y * levelHeight / tileHeight), 0, numY - 1);
  return new FlatTile(tileX, tileY, tileZ, this);
};
FlatGeometry.prototype.visibleTiles = function(view, level, result) {
  var viewSize = this._viewSize;
  var tileSearcher = this._tileSearcher;
  result = result || [];
  view.size(viewSize);
  if (viewSize.width === 0 || viewSize.height === 0) {
    return result;
  }
  var startingTile = this._closestTile(view, level);
  var count = tileSearcher.search(view, startingTile, result);
  if (!count) {
    throw new Error("Starting tile is not visible");
  }
  return result;
};
FlatGeometry.Tile = FlatGeometry.prototype.Tile = FlatTile;
FlatGeometry.type = FlatGeometry.prototype.type = "flat";
FlatTile.type = FlatTile.prototype.type = "flat";
var Flat$1 = FlatGeometry;
var inherits$2 = inherits_1;
var hash = hash_1;
var cmp = cmp_1;
var common = common$1;
var Level = Level_1;
var type$1 = type_1;
function EquirectTile(z, geometry) {
  this.z = z;
  this._geometry = geometry;
  this._level = geometry.levelList[z];
}
EquirectTile.prototype.rotX = function() {
  return 0;
};
EquirectTile.prototype.rotY = function() {
  return 0;
};
EquirectTile.prototype.centerX = function() {
  return 0.5;
};
EquirectTile.prototype.centerY = function() {
  return 0.5;
};
EquirectTile.prototype.scaleX = function() {
  return 1;
};
EquirectTile.prototype.scaleY = function() {
  return 1;
};
EquirectTile.prototype.parent = function() {
  if (this.z === 0) {
    return null;
  }
  return new EquirectTile(this.z - 1, this._geometry);
};
EquirectTile.prototype.children = function(result) {
  if (this.z === this._geometry.levelList.length - 1) {
    return null;
  }
  result = result || [];
  result.push(new EquirectTile(this.z + 1, this._geometry));
  return result;
};
EquirectTile.prototype.neighbors = function() {
  return [];
};
EquirectTile.prototype.hash = function() {
  return hash(this.z);
};
EquirectTile.prototype.equals = function(that) {
  return this._geometry === that._geometry && this.z === that.z;
};
EquirectTile.prototype.cmp = function(that) {
  return cmp(this.z, that.z);
};
EquirectTile.prototype.str = function() {
  return "EquirectTile(" + tile.z + ")";
};
function EquirectLevel(levelProperties) {
  this.constructor.super_.call(this, levelProperties);
  this._width = levelProperties.width;
}
inherits$2(EquirectLevel, Level);
EquirectLevel.prototype.width = function() {
  return this._width;
};
EquirectLevel.prototype.height = function() {
  return this._width / 2;
};
EquirectLevel.prototype.tileWidth = function() {
  return this._width;
};
EquirectLevel.prototype.tileHeight = function() {
  return this._width / 2;
};
function EquirectGeometry(levelPropertiesList) {
  if (type$1(levelPropertiesList) !== "array") {
    throw new Error("Level list must be an array");
  }
  this.levelList = common.makeLevelList(levelPropertiesList, EquirectLevel);
  this.selectableLevelList = common.makeSelectableLevelList(this.levelList);
}
EquirectGeometry.prototype.maxTileSize = function() {
  var maxTileSize = 0;
  for (var i2 = 0; i2 < this.levelList.length; i2++) {
    var level = this.levelList[i2];
    maxTileSize = Math.max(maxTileSize, level.tileWidth, level.tileHeight);
  }
  return maxTileSize;
};
EquirectGeometry.prototype.levelTiles = function(level, result) {
  var levelIndex = this.levelList.indexOf(level);
  result = result || [];
  result.push(new EquirectTile(levelIndex, this));
  return result;
};
EquirectGeometry.prototype.visibleTiles = function(view, level, result) {
  var tile2 = new EquirectTile(this.levelList.indexOf(level), this);
  result = result || [];
  result.length = 0;
  result.push(tile2);
};
EquirectGeometry.Tile = EquirectGeometry.prototype.Tile = EquirectTile;
EquirectGeometry.type = EquirectGeometry.prototype.type = "equirect";
EquirectTile.type = EquirectTile.prototype.type = "equirect";
var Equirect = EquirectGeometry;
function convert(fov, fromDimension, toDimension) {
  return 2 * Math.atan(toDimension * Math.tan(fov / 2) / fromDimension);
}
function htov(fov, width, height) {
  return convert(fov, width, height);
}
function htod(fov, width, height) {
  return convert(fov, width, Math.sqrt(width * width + height * height));
}
function vtoh(fov, width, height) {
  return convert(fov, height, width);
}
function vtod(fov, width, height) {
  return convert(fov, height, Math.sqrt(width * width + height * height));
}
function dtoh(fov, width, height) {
  return convert(fov, Math.sqrt(width * width + height * height), width);
}
function dtov(fov, width, height) {
  return convert(fov, Math.sqrt(width * width + height * height), height);
}
var convertFov$1 = {
  convert,
  htov,
  htod,
  vtoh,
  vtod,
  dtoh,
  dtov
};
function real$2(x) {
  return typeof x === "number" && isFinite(x);
}
var real_1 = real$2;
function decimal$2(x) {
  return x.toPrecision(15);
}
var decimal_1 = decimal$2;
function compose$1() {
  var fnList = arguments;
  return function composed(initialArg) {
    var ret = initialArg;
    for (var i2 = 0; i2 < fnList.length; i2++) {
      var fn = fnList[i2];
      ret = fn.call(null, ret);
    }
    return ret;
  };
}
var compose_1 = compose$1;
var eventEmitter$k = minimalEventEmitter;
var mat4$2 = require$$61.mat4;
var vec4$2 = require$$61.vec4;
var pixelRatio$1 = pixelRatio_1;
var convertFov = convertFov$1;
var mod$3 = mod_1;
var real$1 = real_1;
var clamp$1 = clamp_1;
var decimal$1 = decimal_1;
var compose = compose_1;
var clearOwnProperties$j = clearOwnProperties_1;
var defaultWidth$1 = 0;
var defaultHeight$1 = 0;
var defaultYaw = 0;
var defaultPitch = 0;
var defaultRoll = 0;
var defaultFov = Math.PI / 4;
var defaultProjectionCenterX = 0;
var defaultProjectionCenterY = 0;
var fovLimitEpsilon = 1e-6;
function RectilinearView(params, limiter) {
  this._yaw = params && params.yaw != null ? params.yaw : defaultYaw;
  this._pitch = params && params.pitch != null ? params.pitch : defaultPitch;
  this._roll = params && params.roll != null ? params.roll : defaultRoll;
  this._fov = params && params.fov != null ? params.fov : defaultFov;
  this._width = params && params.width != null ? params.width : defaultWidth$1;
  this._height = params && params.height != null ? params.height : defaultHeight$1;
  this._projectionCenterX = params && params.projectionCenterX != null ? params.projectionCenterX : defaultProjectionCenterX;
  this._projectionCenterY = params && params.projectionCenterY != null ? params.projectionCenterY : defaultProjectionCenterY;
  this._limiter = limiter || null;
  this._projMatrix = mat4$2.create();
  this._invProjMatrix = mat4$2.create();
  this._frustum = [
    vec4$2.create(),
    vec4$2.create(),
    vec4$2.create(),
    vec4$2.create(),
    vec4$2.create()
  ];
  this._projectionChanged = true;
  this._params = {};
  this._fovs = {};
  this._tmpVec = vec4$2.create();
  this._update();
}
eventEmitter$k(RectilinearView);
RectilinearView.prototype.destroy = function() {
  clearOwnProperties$j(this);
};
RectilinearView.prototype.yaw = function() {
  return this._yaw;
};
RectilinearView.prototype.pitch = function() {
  return this._pitch;
};
RectilinearView.prototype.roll = function() {
  return this._roll;
};
RectilinearView.prototype.projectionCenterX = function() {
  return this._projectionCenterX;
};
RectilinearView.prototype.projectionCenterY = function() {
  return this._projectionCenterY;
};
RectilinearView.prototype.fov = function() {
  return this._fov;
};
RectilinearView.prototype.width = function() {
  return this._width;
};
RectilinearView.prototype.height = function() {
  return this._height;
};
RectilinearView.prototype.size = function(size) {
  size = size || {};
  size.width = this._width;
  size.height = this._height;
  return size;
};
RectilinearView.prototype.parameters = function(params) {
  params = params || {};
  params.yaw = this._yaw;
  params.pitch = this._pitch;
  params.roll = this._roll;
  params.fov = this._fov;
  return params;
};
RectilinearView.prototype.limiter = function() {
  return this._limiter;
};
RectilinearView.prototype.setYaw = function(yaw) {
  this._resetParams();
  this._params.yaw = yaw;
  this._update(this._params);
};
RectilinearView.prototype.setPitch = function(pitch) {
  this._resetParams();
  this._params.pitch = pitch;
  this._update(this._params);
};
RectilinearView.prototype.setRoll = function(roll) {
  this._resetParams();
  this._params.roll = roll;
  this._update(this._params);
};
RectilinearView.prototype.setFov = function(fov) {
  this._resetParams();
  this._params.fov = fov;
  this._update(this._params);
};
RectilinearView.prototype.setProjectionCenterX = function(projectionCenterX) {
  this._resetParams();
  this._params.projectionCenterX = projectionCenterX;
  this._update(this._params);
};
RectilinearView.prototype.setProjectionCenterY = function(projectionCenterY) {
  this._resetParams();
  this._params.projectionCenterY = projectionCenterY;
  this._update(this._params);
};
RectilinearView.prototype.offsetYaw = function(yawOffset) {
  this.setYaw(this._yaw + yawOffset);
};
RectilinearView.prototype.offsetPitch = function(pitchOffset) {
  this.setPitch(this._pitch + pitchOffset);
};
RectilinearView.prototype.offsetRoll = function(rollOffset) {
  this.setRoll(this._roll + rollOffset);
};
RectilinearView.prototype.offsetFov = function(fovOffset) {
  this.setFov(this._fov + fovOffset);
};
RectilinearView.prototype.setSize = function(size) {
  this._resetParams();
  this._params.width = size.width;
  this._params.height = size.height;
  this._update(this._params);
};
RectilinearView.prototype.setParameters = function(params) {
  this._resetParams();
  this._params.yaw = params.yaw;
  this._params.pitch = params.pitch;
  this._params.roll = params.roll;
  this._params.fov = params.fov;
  this._params.projectionCenterX = params.projectionCenterX;
  this._params.projectionCenterY = params.projectionCenterY;
  this._update(this._params);
};
RectilinearView.prototype.setLimiter = function(limiter) {
  this._limiter = limiter || null;
  this._update();
};
RectilinearView.prototype._resetParams = function() {
  var params = this._params;
  params.yaw = null;
  params.pitch = null;
  params.roll = null;
  params.fov = null;
  params.width = null;
  params.height = null;
};
RectilinearView.prototype._update = function(params) {
  if (params == null) {
    this._resetParams();
    params = this._params;
  }
  var oldYaw = this._yaw;
  var oldPitch = this._pitch;
  var oldRoll = this._roll;
  var oldFov = this._fov;
  var oldProjectionCenterX = this._projectionCenterX;
  var oldProjectionCenterY = this._projectionCenterY;
  var oldWidth = this._width;
  var oldHeight = this._height;
  params.yaw = params.yaw != null ? params.yaw : oldYaw;
  params.pitch = params.pitch != null ? params.pitch : oldPitch;
  params.roll = params.roll != null ? params.roll : oldRoll;
  params.fov = params.fov != null ? params.fov : oldFov;
  params.width = params.width != null ? params.width : oldWidth;
  params.height = params.height != null ? params.height : oldHeight;
  params.projectionCenterX = params.projectionCenterX != null ? params.projectionCenterX : oldProjectionCenterX;
  params.projectionCenterY = params.projectionCenterY != null ? params.projectionCenterY : oldProjectionCenterY;
  if (this._limiter) {
    params = this._limiter(params);
    if (!params) {
      throw new Error("Bad view limiter");
    }
  }
  params = this._normalize(params);
  var newYaw = params.yaw;
  var newPitch = params.pitch;
  var newRoll = params.roll;
  var newFov = params.fov;
  var newWidth = params.width;
  var newHeight = params.height;
  var newProjectionCenterX = params.projectionCenterX;
  var newProjectionCenterY = params.projectionCenterY;
  if (!real$1(newYaw) || !real$1(newPitch) || !real$1(newRoll) || !real$1(newFov) || !real$1(newWidth) || !real$1(newHeight) || !real$1(newProjectionCenterX) || !real$1(newProjectionCenterY)) {
    throw new Error("Bad view - suspect a broken limiter");
  }
  this._yaw = newYaw;
  this._pitch = newPitch;
  this._roll = newRoll;
  this._fov = newFov;
  this._width = newWidth;
  this._height = newHeight;
  this._projectionCenterX = newProjectionCenterX;
  this._projectionCenterY = newProjectionCenterY;
  if (newYaw !== oldYaw || newPitch !== oldPitch || newRoll !== oldRoll || newFov !== oldFov || newWidth !== oldWidth || newHeight !== oldHeight || newProjectionCenterX !== oldProjectionCenterX || newProjectionCenterY !== oldProjectionCenterY) {
    this._projectionChanged = true;
    this.emit("change");
  }
  if (newWidth !== oldWidth || newHeight !== oldHeight) {
    this.emit("resize");
  }
};
RectilinearView.prototype._normalize = function(params) {
  this._normalizeCoordinates(params);
  var hfovPi = convertFov.htov(Math.PI, params.width, params.height);
  var maxFov = isNaN(hfovPi) ? Math.PI : Math.min(Math.PI, hfovPi);
  params.fov = clamp$1(params.fov, fovLimitEpsilon, maxFov - fovLimitEpsilon);
  return params;
};
RectilinearView.prototype._normalizeCoordinates = function(params) {
  if ("yaw" in params) {
    params.yaw = mod$3(params.yaw - Math.PI, -2 * Math.PI) + Math.PI;
  }
  if ("pitch" in params) {
    params.pitch = mod$3(params.pitch - Math.PI, -2 * Math.PI) + Math.PI;
  }
  if ("roll" in params) {
    params.roll = mod$3(params.roll - Math.PI, -2 * Math.PI) + Math.PI;
  }
  return params;
};
RectilinearView.prototype.normalizeToClosest = function(coords, result) {
  var viewYaw = this._yaw;
  var viewPitch = this._pitch;
  var coordYaw = coords.yaw;
  var coordPitch = coords.pitch;
  var prevYaw = coordYaw - 2 * Math.PI;
  var nextYaw = coordYaw + 2 * Math.PI;
  if (Math.abs(prevYaw - viewYaw) < Math.abs(coordYaw - viewYaw)) {
    coordYaw = prevYaw;
  } else if (Math.abs(nextYaw - viewYaw) < Math.abs(coordYaw - viewYaw)) {
    coordYaw = nextYaw;
  }
  var prevPitch = coordPitch - 2 * Math.PI;
  var nextPitch = coordPitch + 2 * Math.PI;
  if (Math.abs(prevPitch - viewPitch) < Math.abs(coordPitch - viewPitch)) {
    coordPitch = prevPitch;
  } else if (Math.abs(prevPitch - viewPitch) < Math.abs(coordPitch - viewPitch)) {
    coordPitch = nextPitch;
  }
  result = result || {};
  result.yaw = coordYaw;
  result.pitch = coordPitch;
  return result;
};
RectilinearView.prototype.updateWithControlParameters = function(parameters) {
  var vfov = this._fov;
  var hfov = convertFov.vtoh(vfov, this._width, this._height);
  if (isNaN(hfov)) {
    hfov = vfov;
  }
  this.offsetYaw(parameters.axisScaledX * hfov + parameters.x * 2 * hfov + parameters.yaw);
  this.offsetPitch(parameters.axisScaledY * vfov + parameters.y * 2 * hfov + parameters.pitch);
  this.offsetRoll(-parameters.roll);
  this.offsetFov(parameters.zoom * vfov);
};
RectilinearView.prototype._updateProjection = function() {
  var projMatrix = this._projMatrix;
  var invProjMatrix = this._invProjMatrix;
  var frustum2 = this._frustum;
  if (this._projectionChanged) {
    var width = this._width;
    var height = this._height;
    var vfov = this._fov;
    var hfov = convertFov.vtoh(vfov, width, height);
    var aspect = width / height;
    var projectionCenterX = this._projectionCenterX;
    var projectionCenterY = this._projectionCenterY;
    if (projectionCenterX !== 0 || projectionCenterY !== 0) {
      var offsetAngleX = Math.atan(projectionCenterX * 2 * Math.tan(hfov / 2));
      var offsetAngleY = Math.atan(projectionCenterY * 2 * Math.tan(vfov / 2));
      var fovs = this._fovs;
      fovs.leftDegrees = (hfov / 2 + offsetAngleX) * 180 / Math.PI;
      fovs.rightDegrees = (hfov / 2 - offsetAngleX) * 180 / Math.PI;
      fovs.upDegrees = (vfov / 2 + offsetAngleY) * 180 / Math.PI;
      fovs.downDegrees = (vfov / 2 - offsetAngleY) * 180 / Math.PI;
      mat4$2.perspectiveFromFieldOfView(projMatrix, fovs, -1, 1);
    } else {
      mat4$2.perspective(projMatrix, vfov, aspect, -1, 1);
    }
    mat4$2.rotateZ(projMatrix, projMatrix, this._roll);
    mat4$2.rotateX(projMatrix, projMatrix, this._pitch);
    mat4$2.rotateY(projMatrix, projMatrix, this._yaw);
    mat4$2.invert(invProjMatrix, projMatrix);
    this._matrixToFrustum(projMatrix, frustum2);
    this._projectionChanged = false;
  }
};
RectilinearView.prototype._matrixToFrustum = function(p, f) {
  vec4$2.set(f[0], p[3] + p[0], p[7] + p[4], p[11] + p[8], 0);
  vec4$2.set(f[1], p[3] - p[0], p[7] - p[4], p[11] - p[8], 0);
  vec4$2.set(f[2], p[3] + p[1], p[7] + p[5], p[11] + p[9], 0);
  vec4$2.set(f[3], p[3] - p[1], p[7] - p[5], p[11] - p[9], 0);
  vec4$2.set(f[4], p[3] + p[2], p[7] + p[6], p[11] + p[10], 0);
};
RectilinearView.prototype.projection = function() {
  this._updateProjection();
  return this._projMatrix;
};
RectilinearView.prototype.inverseProjection = function() {
  this._updateProjection();
  return this._invProjMatrix;
};
RectilinearView.prototype.intersects = function(rectangle) {
  this._updateProjection();
  var frustum2 = this._frustum;
  var vertex = this._tmpVec;
  for (var i2 = 0; i2 < frustum2.length; i2++) {
    var plane = frustum2[i2];
    var inside = false;
    for (var j = 0; j < rectangle.length; j++) {
      var corner = rectangle[j];
      vec4$2.set(vertex, corner[0], corner[1], corner[2], 0);
      if (vec4$2.dot(plane, vertex) >= 0) {
        inside = true;
      }
    }
    if (!inside) {
      return false;
    }
  }
  return true;
};
RectilinearView.prototype.selectLevel = function(levelList) {
  var requiredPixels = pixelRatio$1() * this._height;
  var coverFactor = Math.tan(0.5 * this._fov);
  for (var i2 = 0; i2 < levelList.length; i2++) {
    var level = levelList[i2];
    if (coverFactor * level.height() >= requiredPixels) {
      return level;
    }
  }
  return levelList[levelList.length - 1];
};
RectilinearView.prototype.coordinatesToScreen = function(coords, result) {
  var ray = this._tmpVec;
  if (!result) {
    result = {};
  }
  var width = this._width;
  var height = this._height;
  if (width <= 0 || height <= 0) {
    result.x = null;
    result.y = null;
    return null;
  }
  var yaw = coords.yaw;
  var pitch = coords.pitch;
  var x = Math.sin(yaw) * Math.cos(pitch);
  var y = -Math.sin(pitch);
  var z = -Math.cos(yaw) * Math.cos(pitch);
  vec4$2.set(ray, x, y, z, 1);
  vec4$2.transformMat4(ray, ray, this.projection());
  if (ray[3] >= 0) {
    result.x = width * (ray[0] / ray[3] + 1) / 2;
    result.y = height * (1 - ray[1] / ray[3]) / 2;
  } else {
    result.x = null;
    result.y = null;
    return null;
  }
  return result;
};
RectilinearView.prototype.screenToCoordinates = function(coords, result) {
  var ray = this._tmpVec;
  if (!result) {
    result = {};
  }
  var width = this._width;
  var height = this._height;
  var vecx = 2 * coords.x / width - 1;
  var vecy = 1 - 2 * coords.y / height;
  vec4$2.set(ray, vecx, vecy, 1, 1);
  vec4$2.transformMat4(ray, ray, this.inverseProjection());
  var r = Math.sqrt(ray[0] * ray[0] + ray[1] * ray[1] + ray[2] * ray[2]);
  result.yaw = Math.atan2(ray[0], -ray[2]);
  result.pitch = Math.acos(ray[1] / r) - Math.PI / 2;
  this._normalizeCoordinates(result);
  return result;
};
RectilinearView.prototype.coordinatesToPerspectiveTransform = function(coords, radius, extraTransforms) {
  extraTransforms = extraTransforms || "";
  var height = this._height;
  var width = this._width;
  var fov = this._fov;
  var perspective2 = 0.5 * height / Math.tan(fov / 2);
  var transform = "";
  transform += "translateX(" + decimal$1(width / 2) + "px) ";
  transform += "translateY(" + decimal$1(height / 2) + "px) ";
  transform += "translateX(-50%) translateY(-50%) ";
  transform += "perspective(" + decimal$1(perspective2) + "px) ";
  transform += "translateZ(" + decimal$1(perspective2) + "px) ";
  transform += "rotateZ(" + decimal$1(-this._roll) + "rad) ";
  transform += "rotateX(" + decimal$1(-this._pitch) + "rad) ";
  transform += "rotateY(" + decimal$1(this._yaw) + "rad) ";
  transform += "rotateY(" + decimal$1(-coords.yaw) + "rad) ";
  transform += "rotateX(" + decimal$1(coords.pitch) + "rad) ";
  transform += "translateZ(" + decimal$1(-radius) + "px) ";
  transform += extraTransforms + " ";
  return transform;
};
RectilinearView.limit = {
  yaw: function(min2, max2) {
    return function limitYaw(params) {
      params.yaw = clamp$1(params.yaw, min2, max2);
      return params;
    };
  },
  pitch: function(min2, max2) {
    return function limitPitch(params) {
      params.pitch = clamp$1(params.pitch, min2, max2);
      return params;
    };
  },
  roll: function(min2, max2) {
    return function limitRoll(params) {
      params.roll = clamp$1(params.roll, min2, max2);
      return params;
    };
  },
  hfov: function(min2, max2) {
    return function limitHfov(params) {
      var width = params.width;
      var height = params.height;
      if (width > 0 && height > 0) {
        var vmin = convertFov.htov(min2, width, height);
        var vmax = convertFov.htov(max2, width, height);
        params.fov = clamp$1(params.fov, vmin, vmax);
      }
      return params;
    };
  },
  vfov: function(min2, max2) {
    return function limitVfov(params) {
      params.fov = clamp$1(params.fov, min2, max2);
      return params;
    };
  },
  resolution: function(size) {
    return function limitResolution(params) {
      var height = params.height;
      if (height) {
        var requiredPixels = pixelRatio$1() * height;
        var minFov = 2 * Math.atan(requiredPixels / size);
        params.fov = clamp$1(params.fov, minFov, Infinity);
      }
      return params;
    };
  },
  traditional: function(maxResolution, maxVFov, maxHFov) {
    maxHFov = maxHFov != null ? maxHFov : maxVFov;
    return compose(RectilinearView.limit.resolution(maxResolution), RectilinearView.limit.vfov(0, maxVFov), RectilinearView.limit.hfov(0, maxHFov), RectilinearView.limit.pitch(-Math.PI / 2, Math.PI / 2));
  }
};
RectilinearView.type = RectilinearView.prototype.type = "rectilinear";
var Rectilinear = RectilinearView;
var eventEmitter$j = minimalEventEmitter;
var mat4$1 = require$$61.mat4;
var vec4$1 = require$$61.vec4;
var pixelRatio = pixelRatio_1;
var real = real_1;
var clamp = clamp_1;
var clearOwnProperties$i = clearOwnProperties_1;
var defaultWidth = 0;
var defaultHeight = 0;
var defaultX = 0.5;
var defaultY = 0.5;
var defaultZoom = 1;
var planeAxes = [
  1,
  0,
  1,
  0
];
var planeCmp = [
  -1,
  -1,
  1,
  1
];
var zoomLimitEpsilon = 1e-6;
function FlatView(params, limiter) {
  if (!(params && params.mediaAspectRatio != null)) {
    throw new Error("mediaAspectRatio must be defined");
  }
  this._x = params && params.x != null ? params.x : defaultX;
  this._y = params && params.y != null ? params.y : defaultY;
  this._zoom = params && params.zoom != null ? params.zoom : defaultZoom;
  this._mediaAspectRatio = params.mediaAspectRatio;
  this._width = params && params.width != null ? params.width : defaultWidth;
  this._height = params && params.height != null ? params.height : defaultHeight;
  this._limiter = limiter || null;
  this._projMatrix = mat4$1.create();
  this._invProjMatrix = mat4$1.create();
  this._frustum = [
    0,
    0,
    0,
    0
  ];
  this._projectionChanged = true;
  this._params = {};
  this._vec = vec4$1.create();
  this._update();
}
eventEmitter$j(FlatView);
FlatView.prototype.destroy = function() {
  clearOwnProperties$i(this);
};
FlatView.prototype.x = function() {
  return this._x;
};
FlatView.prototype.y = function() {
  return this._y;
};
FlatView.prototype.zoom = function() {
  return this._zoom;
};
FlatView.prototype.mediaAspectRatio = function() {
  return this._mediaAspectRatio;
};
FlatView.prototype.width = function() {
  return this._width;
};
FlatView.prototype.height = function() {
  return this._height;
};
FlatView.prototype.size = function(size) {
  size = size || {};
  size.width = this._width;
  size.height = this._height;
  return size;
};
FlatView.prototype.parameters = function(params) {
  params = params || {};
  params.x = this._x;
  params.y = this._y;
  params.zoom = this._zoom;
  params.mediaAspectRatio = this._mediaAspectRatio;
  return params;
};
FlatView.prototype.limiter = function() {
  return this._limiter;
};
FlatView.prototype.setX = function(x) {
  this._resetParams();
  this._params.x = x;
  this._update(this._params);
};
FlatView.prototype.setY = function(y) {
  this._resetParams();
  this._params.y = y;
  this._update(this._params);
};
FlatView.prototype.setZoom = function(zoom) {
  this._resetParams();
  this._params.zoom = zoom;
  this._update(this._params);
};
FlatView.prototype.offsetX = function(xOffset) {
  this.setX(this._x + xOffset);
};
FlatView.prototype.offsetY = function(yOffset) {
  this.setY(this._y + yOffset);
};
FlatView.prototype.offsetZoom = function(zoomOffset) {
  this.setZoom(this._zoom + zoomOffset);
};
FlatView.prototype.setMediaAspectRatio = function(mediaAspectRatio) {
  this._resetParams();
  this._params.mediaAspectRatio = mediaAspectRatio;
  this._update(this._params);
};
FlatView.prototype.setSize = function(size) {
  this._resetParams();
  this._params.width = size.width;
  this._params.height = size.height;
  this._update(this._params);
};
FlatView.prototype.setParameters = function(params) {
  this._resetParams();
  this._params.x = params.x;
  this._params.y = params.y;
  this._params.zoom = params.zoom;
  this._params.mediaAspectRatio = params.mediaAspectRatio;
  this._update(this._params);
};
FlatView.prototype.setLimiter = function(limiter) {
  this._limiter = limiter || null;
  this._update();
};
FlatView.prototype._resetParams = function() {
  var params = this._params;
  params.x = null;
  params.y = null;
  params.zoom = null;
  params.mediaAspectRatio = null;
  params.width = null;
  params.height = null;
};
FlatView.prototype._update = function(params) {
  if (params == null) {
    this._resetParams();
    params = this._params;
  }
  var oldX = this._x;
  var oldY = this._y;
  var oldZoom = this._zoom;
  var oldMediaAspectRatio = this._mediaAspectRatio;
  var oldWidth = this._width;
  var oldHeight = this._height;
  params.x = params.x != null ? params.x : oldX;
  params.y = params.y != null ? params.y : oldY;
  params.zoom = params.zoom != null ? params.zoom : oldZoom;
  params.mediaAspectRatio = params.mediaAspectRatio != null ? params.mediaAspectRatio : oldMediaAspectRatio;
  params.width = params.width != null ? params.width : oldWidth;
  params.height = params.height != null ? params.height : oldHeight;
  if (this._limiter) {
    params = this._limiter(params);
    if (!params) {
      throw new Error("Bad view limiter");
    }
  }
  var newX = params.x;
  var newY = params.y;
  var newZoom = params.zoom;
  var newMediaAspectRatio = params.mediaAspectRatio;
  var newWidth = params.width;
  var newHeight = params.height;
  if (!real(newX) || !real(newY) || !real(newZoom) || !real(newMediaAspectRatio) || !real(newWidth) || !real(newHeight)) {
    throw new Error("Bad view - suspect a broken limiter");
  }
  newZoom = clamp(newZoom, zoomLimitEpsilon, Infinity);
  this._x = newX;
  this._y = newY;
  this._zoom = newZoom;
  this._mediaAspectRatio = newMediaAspectRatio;
  this._width = newWidth;
  this._height = newHeight;
  if (newX !== oldX || newY !== oldY || newZoom !== oldZoom || newMediaAspectRatio !== oldMediaAspectRatio || newWidth !== oldWidth || newHeight !== oldHeight) {
    this._projectionChanged = true;
    this.emit("change");
  }
  if (newWidth !== oldWidth || newHeight !== oldHeight) {
    this.emit("resize");
  }
};
FlatView.prototype._zoomX = function() {
  return this._zoom;
};
FlatView.prototype._zoomY = function() {
  var mediaAspectRatio = this._mediaAspectRatio;
  var aspect = this._width / this._height;
  var zoomX = this._zoom;
  var zoomY = zoomX * mediaAspectRatio / aspect;
  if (isNaN(zoomY)) {
    zoomY = zoomX;
  }
  return zoomY;
};
FlatView.prototype.updateWithControlParameters = function(parameters) {
  var scale2 = this.zoom();
  var zoomX = this._zoomX();
  var zoomY = this._zoomY();
  this.offsetX(parameters.axisScaledX * zoomX + parameters.x * scale2);
  this.offsetY(parameters.axisScaledY * zoomY + parameters.y * scale2);
  this.offsetZoom(parameters.zoom * scale2);
};
FlatView.prototype._updateProjection = function() {
  var projMatrix = this._projMatrix;
  var invProjMatrix = this._invProjMatrix;
  var frustum2 = this._frustum;
  if (this._projectionChanged) {
    var x = this._x;
    var y = this._y;
    var zoomX = this._zoomX();
    var zoomY = this._zoomY();
    var top = frustum2[0] = 0.5 - y + 0.5 * zoomY;
    var right = frustum2[1] = x - 0.5 + 0.5 * zoomX;
    var bottom = frustum2[2] = 0.5 - y - 0.5 * zoomY;
    var left = frustum2[3] = x - 0.5 - 0.5 * zoomX;
    mat4$1.ortho(projMatrix, left, right, bottom, top, -1, 1);
    mat4$1.invert(invProjMatrix, projMatrix);
    this._projectionChanged = false;
  }
};
FlatView.prototype.projection = function() {
  this._updateProjection();
  return this._projMatrix;
};
FlatView.prototype.inverseProjection = function() {
  this._updateProjection();
  return this._invProjMatrix;
};
FlatView.prototype.intersects = function(rectangle) {
  this._updateProjection();
  var frustum2 = this._frustum;
  for (var i2 = 0; i2 < frustum2.length; i2++) {
    var limit = frustum2[i2];
    var axis = planeAxes[i2];
    var cmp2 = planeCmp[i2];
    var inside = false;
    for (var j = 0; j < rectangle.length; j++) {
      var vertex = rectangle[j];
      if (cmp2 < 0 && vertex[axis] < limit || cmp2 > 0 && vertex[axis] > limit) {
        inside = true;
        break;
      }
    }
    if (!inside) {
      return false;
    }
  }
  return true;
};
FlatView.prototype.selectLevel = function(levels) {
  var requiredPixels = pixelRatio() * this.width();
  var zoomFactor = this._zoom;
  for (var i2 = 0; i2 < levels.length; i2++) {
    var level = levels[i2];
    if (zoomFactor * level.width() >= requiredPixels) {
      return level;
    }
  }
  return levels[levels.length - 1];
};
FlatView.prototype.coordinatesToScreen = function(coords, result) {
  var ray = this._vec;
  if (!result) {
    result = {};
  }
  var width = this._width;
  var height = this._height;
  if (width <= 0 || height <= 0) {
    result.x = null;
    result.y = null;
    return null;
  }
  var x = coords && coords.x != null ? coords.x : defaultX;
  var y = coords && coords.y != null ? coords.y : defaultY;
  vec4$1.set(ray, x - 0.5, 0.5 - y, -1, 1);
  vec4$1.transformMat4(ray, ray, this.projection());
  for (var i2 = 0; i2 < 3; i2++) {
    ray[i2] /= ray[3];
  }
  result.x = width * (ray[0] + 1) / 2;
  result.y = height * (1 - ray[1]) / 2;
  return result;
};
FlatView.prototype.screenToCoordinates = function(coords, result) {
  var ray = this._vec;
  if (!result) {
    result = {};
  }
  var width = this._width;
  var height = this._height;
  var vecx = 2 * coords.x / width - 1;
  var vecy = 1 - 2 * coords.y / height;
  vec4$1.set(ray, vecx, vecy, 1, 1);
  vec4$1.transformMat4(ray, ray, this.inverseProjection());
  result.x = 0.5 + ray[0];
  result.y = 0.5 - ray[1];
  return result;
};
FlatView.limit = {
  x: function(min2, max2) {
    return function limitX(params) {
      params.x = clamp(params.x, min2, max2);
      return params;
    };
  },
  y: function(min2, max2) {
    return function limitY(params) {
      params.y = clamp(params.y, min2, max2);
      return params;
    };
  },
  zoom: function(min2, max2) {
    return function limitZoom(params) {
      params.zoom = clamp(params.zoom, min2, max2);
      return params;
    };
  },
  resolution: function(size) {
    return function limitResolution(params) {
      if (params.width <= 0 || params.height <= 0) {
        return params;
      }
      var width = params.width;
      var minZoom = pixelRatio() * width / size;
      params.zoom = clamp(params.zoom, minZoom, Infinity);
      return params;
    };
  },
  visibleX: function(min2, max2) {
    return function limitVisibleX(params) {
      var maxZoom = max2 - min2;
      if (params.zoom > maxZoom) {
        params.zoom = maxZoom;
      }
      var minX = min2 + 0.5 * params.zoom;
      var maxX = max2 - 0.5 * params.zoom;
      params.x = clamp(params.x, minX, maxX);
      return params;
    };
  },
  visibleY: function(min2, max2) {
    return function limitVisibleY(params) {
      if (params.width <= 0 || params.height <= 0) {
        return params;
      }
      var viewportAspectRatio = params.width / params.height;
      var factor = viewportAspectRatio / params.mediaAspectRatio;
      var maxZoom = (max2 - min2) * factor;
      if (params.zoom > maxZoom) {
        params.zoom = maxZoom;
      }
      var minY = min2 + 0.5 * params.zoom / factor;
      var maxY = max2 - 0.5 * params.zoom / factor;
      params.y = clamp(params.y, minY, maxY);
      return params;
    };
  },
  letterbox: function() {
    return function limitLetterbox(params) {
      if (params.width <= 0 || params.height <= 0) {
        return params;
      }
      var viewportAspectRatio = params.width / params.height;
      var fullWidthZoom = 1;
      var fullHeightZoom = viewportAspectRatio / params.mediaAspectRatio;
      if (params.mediaAspectRatio >= viewportAspectRatio) {
        params.zoom = Math.min(params.zoom, fullWidthZoom);
      }
      if (params.mediaAspectRatio <= viewportAspectRatio) {
        params.zoom = Math.min(params.zoom, fullHeightZoom);
      }
      var minX, maxX;
      if (params.zoom > fullWidthZoom) {
        minX = maxX = 0.5;
      } else {
        minX = 0 + 0.5 * params.zoom / fullWidthZoom;
        maxX = 1 - 0.5 * params.zoom / fullWidthZoom;
      }
      var minY, maxY;
      if (params.zoom > fullHeightZoom) {
        minY = maxY = 0.5;
      } else {
        minY = 0 + 0.5 * params.zoom / fullHeightZoom;
        maxY = 1 - 0.5 * params.zoom / fullHeightZoom;
      }
      params.x = clamp(params.x, minX, maxX);
      params.y = clamp(params.y, minY, maxY);
      return params;
    };
  }
};
FlatView.type = FlatView.prototype.type = "flat";
var Flat = FlatView;
var WorkQueue = WorkQueue_1;
var mod$2 = mod_1;
function WorkPool$1(opts) {
  this._concurrency = opts && opts.concurrency || 1;
  this._paused = opts && !!opts.paused || false;
  this._pool = [];
  for (var i2 = 0; i2 < this._concurrency; i2++) {
    this._pool.push(new WorkQueue(opts));
  }
  this._next = 0;
}
WorkPool$1.prototype.length = function() {
  var len2 = 0;
  for (var i2 = 0; i2 < this._pool.length; i2++) {
    len2 += this._pool[i2].length();
  }
  return len2;
};
WorkPool$1.prototype.push = function(fn, cb) {
  var i2 = this._next;
  var cancel = this._pool[i2].push(fn, cb);
  this._next = mod$2(this._next + 1, this._concurrency);
  return cancel;
};
WorkPool$1.prototype.pause = function() {
  if (!this._paused) {
    this._paused = true;
    for (var i2 = 0; i2 < this._concurrency; i2++) {
      this._pool[i2].pause();
    }
  }
};
WorkPool$1.prototype.resume = function() {
  if (this._paused) {
    this._paused = false;
    for (var i2 = 0; i2 < this._concurrency; i2++) {
      this._pool[i2].resume();
    }
  }
};
var WorkPool_1 = WorkPool$1;
function noop$4() {
}
var noop_1 = noop$4;
var noop$3 = noop_1;
function chain$2() {
  var argList = Array.prototype.slice.call(arguments, 0);
  return function chained() {
    var fnList = argList.slice(0);
    var fn = null;
    var cfn = null;
    var args = arguments.length ? Array.prototype.slice.call(arguments, 0, arguments.length - 1) : [];
    var done = arguments.length ? arguments[arguments.length - 1] : noop$3;
    function exec() {
      var err = arguments[0];
      if (err) {
        fn = cfn = null;
        done.apply(null, arguments);
        return;
      }
      if (!fnList.length) {
        fn = cfn = null;
        done.apply(null, arguments);
        return;
      }
      fn = fnList.shift();
      var _fn = fn;
      var ret = Array.prototype.slice.call(arguments, 1);
      ret.push(exec);
      var _cfn = fn.apply(null, ret);
      if (_fn !== fn) {
        return;
      }
      if (typeof _cfn !== "function") {
        throw new Error("chain: chaining on non-cancellable function");
      } else {
        cfn = _cfn;
      }
    }
    function cancel() {
      if (cfn) {
        cfn.apply(null, arguments);
      }
    }
    args.unshift(null);
    exec.apply(null, args);
    return cancel;
  };
}
var chain_1 = chain$2;
function delay$1(ms, done) {
  var timer = null;
  function finish() {
    if (timer != null) {
      timer = null;
      done(null);
    }
  }
  function cancel() {
    if (timer != null) {
      clearTimeout(timer);
      timer = null;
      done.apply(null, arguments);
    }
  }
  timer = setTimeout(finish, ms);
  return cancel;
}
var delay_1 = delay$1;
var eventEmitter$i = minimalEventEmitter;
var NetworkError = NetworkError_1;
var WorkPool = WorkPool_1;
var chain$1 = chain_1;
var delay = delay_1;
var now$4 = now$6;
var templateProperties = {
  x: "x",
  y: "y",
  z: "z",
  f: "face"
};
var defaultCubeMapFaceOrder = "bdflru";
var defaultConcurrency = 4;
var defaultRetryDelay = 1e4;
function ImageUrlSource(sourceFromTile, opts) {
  opts = opts ? opts : {};
  this._loadPool = new WorkPool({
    concurrency: opts.concurrency || defaultConcurrency
  });
  this._retryDelay = opts.retryDelay || defaultRetryDelay;
  this._retryMap = {};
  this._sourceFromTile = sourceFromTile;
}
eventEmitter$i(ImageUrlSource);
ImageUrlSource.prototype.loadAsset = function(stage, tile2, done) {
  var self2 = this;
  var retryDelay = this._retryDelay;
  var retryMap = this._retryMap;
  var tileSource = this._sourceFromTile(tile2);
  var url = tileSource.url;
  var rect = tileSource.rect;
  var loadImage = stage.loadImage.bind(stage, url, rect);
  var loadFn = function(done2) {
    return self2._loadPool.push(loadImage, function(err, asset) {
      if (err) {
        if (err instanceof NetworkError) {
          retryMap[url] = now$4();
          self2.emit("networkError", err, tile2);
        }
        done2(err, tile2);
      } else {
        delete retryMap[url];
        done2(null, tile2, asset);
      }
    });
  };
  var delayAmount;
  var lastTime = retryMap[url];
  if (lastTime != null) {
    var currentTime = now$4();
    var elapsed = currentTime - lastTime;
    if (elapsed < retryDelay) {
      delayAmount = retryDelay - elapsed;
    } else {
      delayAmount = 0;
      delete retryMap[url];
    }
  }
  var delayFn = delay.bind(null, delayAmount);
  return chain$1(delayFn, loadFn)(done);
};
ImageUrlSource.fromString = function(url, opts) {
  opts = opts || {};
  var faceOrder = opts && opts.cubeMapPreviewFaceOrder || defaultCubeMapFaceOrder;
  var urlFn = opts.cubeMapPreviewUrl ? withPreview : withoutPreview;
  return new ImageUrlSource(urlFn, opts);
  function withoutPreview(tile2) {
    var tileUrl = url;
    for (var property in templateProperties) {
      var templateProperty = templateProperties[property];
      var regExp = propertyRegExp(property);
      var valueFromTile = tile2.hasOwnProperty(templateProperty) ? tile2[templateProperty] : "";
      tileUrl = tileUrl.replace(regExp, valueFromTile);
    }
    return { url: tileUrl };
  }
  function withPreview(tile2) {
    if (tile2.z === 0) {
      return cubeMapUrl(tile2);
    } else {
      return withoutPreview(tile2);
    }
  }
  function cubeMapUrl(tile2) {
    var y = faceOrder.indexOf(tile2.face) / 6;
    return {
      url: opts.cubeMapPreviewUrl,
      rect: { x: 0, y, width: 1, height: 1 / 6 }
    };
  }
};
function propertyRegExp(property) {
  var regExpStr = "\\{(" + property + ")\\}";
  return new RegExp(regExpStr, "g");
}
var ImageUrl = ImageUrlSource;
function SingleAssetSource(asset) {
  this._asset = asset;
}
SingleAssetSource.prototype.asset = function() {
  return this._asset;
};
SingleAssetSource.prototype.loadAsset = function(stage, tile2, done) {
  var self2 = this;
  var timeout = setTimeout(function() {
    done(null, tile2, self2._asset);
  }, 0);
  function cancel() {
    clearTimeout(timeout);
    done.apply(null, arguments);
  }
  return cancel;
};
var SingleAsset = SingleAssetSource;
var StaticAsset = Static;
var inherits$1 = inherits_1;
var eventEmitter$h = minimalEventEmitter;
var clearOwnProperties$h = clearOwnProperties_1;
function DynamicAsset(element2) {
  this.constructor.super_.call(this, element2);
  this._timestamp = 0;
}
inherits$1(DynamicAsset, StaticAsset);
eventEmitter$h(DynamicAsset);
DynamicAsset.prototype.destroy = function() {
  clearOwnProperties$h(this);
};
DynamicAsset.prototype.timestamp = function() {
  return this._timestamp;
};
DynamicAsset.prototype.isDynamic = function() {
  return true;
};
DynamicAsset.prototype.markDirty = function() {
  this._timestamp++;
  this.emit("change");
};
var Dynamic = DynamicAsset;
var mod$1 = mod_1;
var defaultCapacity = 64;
function Map$2(capacity) {
  if (capacity != null && (!isFinite(capacity) || Math.floor(capacity) !== capacity || capacity < 1)) {
    throw new Error("Map: invalid capacity");
  }
  this._capacity = capacity || defaultCapacity;
  this._keyBuckets = [];
  this._valBuckets = [];
  for (var i2 = 0; i2 < this._capacity; i2++) {
    this._keyBuckets.push([]);
    this._valBuckets.push([]);
  }
  this._size = 0;
}
Map$2.prototype.get = function(key) {
  var h = mod$1(key.hash(), this._capacity);
  var keyBucket = this._keyBuckets[h];
  for (var i2 = 0; i2 < keyBucket.length; i2++) {
    var existingKey = keyBucket[i2];
    if (key.equals(existingKey)) {
      var valBucket = this._valBuckets[h];
      var existingValue = valBucket[i2];
      return existingValue;
    }
  }
  return null;
};
Map$2.prototype.set = function(key, val) {
  var h = mod$1(key.hash(), this._capacity);
  var keyBucket = this._keyBuckets[h];
  var valBucket = this._valBuckets[h];
  for (var i2 = 0; i2 < keyBucket.length; i2++) {
    var existingKey = keyBucket[i2];
    if (key.equals(existingKey)) {
      var existingValue = valBucket[i2];
      keyBucket[i2] = key;
      valBucket[i2] = val;
      return existingValue;
    }
  }
  keyBucket.push(key);
  valBucket.push(val);
  this._size++;
  return null;
};
Map$2.prototype.del = function(key) {
  var h = mod$1(key.hash(), this._capacity);
  var keyBucket = this._keyBuckets[h];
  var valBucket = this._valBuckets[h];
  for (var i2 = 0; i2 < keyBucket.length; i2++) {
    var existingKey = keyBucket[i2];
    if (key.equals(existingKey)) {
      var existingValue = valBucket[i2];
      for (var j = i2; j < keyBucket.length - 1; j++) {
        keyBucket[j] = keyBucket[j + 1];
        valBucket[j] = valBucket[j + 1];
      }
      keyBucket.length = keyBucket.length - 1;
      valBucket.length = valBucket.length - 1;
      this._size--;
      return existingValue;
    }
  }
  return null;
};
Map$2.prototype.has = function(key) {
  var h = mod$1(key.hash(), this._capacity);
  var keyBucket = this._keyBuckets[h];
  for (var i2 = 0; i2 < keyBucket.length; i2++) {
    var existingKey = keyBucket[i2];
    if (key.equals(existingKey)) {
      return true;
    }
  }
  return false;
};
Map$2.prototype.size = function() {
  return this._size;
};
Map$2.prototype.clear = function() {
  for (var i2 = 0; i2 < this._capacity; i2++) {
    this._keyBuckets[i2].length = 0;
    this._valBuckets[i2].length = 0;
  }
  this._size = 0;
};
Map$2.prototype.forEach = function(fn) {
  var count = 0;
  for (var i2 = 0; i2 < this._capacity; i2++) {
    var keyBucket = this._keyBuckets[i2];
    var valBucket = this._valBuckets[i2];
    for (var j = 0; j < keyBucket.length; j++) {
      fn(keyBucket[j], valBucket[j]);
      count += 1;
    }
  }
  return count;
};
var _Map = Map$2;
var mod = mod_1;
function LruSet$1(capacity) {
  if (!isFinite(capacity) || Math.floor(capacity) !== capacity || capacity < 0) {
    throw new Error("LruSet: invalid capacity");
  }
  this._capacity = capacity;
  this._elements = new Array(this._capacity);
  this._start = 0;
  this._size = 0;
}
LruSet$1.prototype._index = function(i2) {
  return mod(this._start + i2, this._capacity);
};
LruSet$1.prototype.add = function(element2) {
  if (this._capacity === 0) {
    return element2;
  }
  this.remove(element2);
  var evictedElement = this._size === this._capacity ? this._elements[this._index(0)] : null;
  this._elements[this._index(this._size)] = element2;
  if (this._size < this._capacity) {
    this._size++;
  } else {
    this._start = this._index(1);
  }
  return evictedElement;
};
LruSet$1.prototype.remove = function(element2) {
  for (var i2 = 0; i2 < this._size; i2++) {
    var existingElement = this._elements[this._index(i2)];
    if (element2.equals(existingElement)) {
      for (var j = i2; j < this._size - 1; j++) {
        this._elements[this._index(j)] = this._elements[this._index(j + 1)];
      }
      this._size--;
      return existingElement;
    }
  }
  return null;
};
LruSet$1.prototype.has = function(element2) {
  for (var i2 = 0; i2 < this._size; i2++) {
    if (element2.equals(this._elements[this._index(i2)])) {
      return true;
    }
  }
  return false;
};
LruSet$1.prototype.size = function() {
  return this._size;
};
LruSet$1.prototype.clear = function() {
  this._elements.length = 0;
  this._start = 0;
  this._size = 0;
};
LruSet$1.prototype.forEach = function(fn) {
  var count = 0;
  for (var i2 = 0; i2 < this._size; i2++) {
    fn(this._elements[this._index(i2)]);
    count += 1;
  }
  return count;
};
var LruSet_1 = LruSet$1;
function defaults$9(obj, defaultsObj) {
  for (var key in defaultsObj) {
    if (!(key in obj)) {
      obj[key] = defaultsObj[key];
    }
  }
  return obj;
}
var defaults_1 = defaults$9;
var noop$2 = noop_1;
function retry$1(fn) {
  return function retried() {
    var args = arguments.length ? Array.prototype.slice.call(arguments, 0, arguments.length - 1) : [];
    var done = arguments.length ? arguments[arguments.length - 1] : noop$2;
    var cfn = null;
    var canceled = false;
    function exec() {
      var err = arguments[0];
      if (!err || canceled) {
        done.apply(null, arguments);
      } else {
        cfn = fn.apply(null, args);
      }
    }
    args.push(exec);
    exec(true);
    return function cancel() {
      canceled = true;
      cfn.apply(null, arguments);
    };
  };
}
var retry_1 = retry$1;
var Map$1 = _Map;
var Set$1 = _Set;
var LruSet = LruSet_1;
var eventEmitter$g = minimalEventEmitter;
var defaults$8 = defaults_1;
var retry = retry_1;
var chain = chain_1;
var inherits = inherits_1;
var clearOwnProperties$g = clearOwnProperties_1;
var debug$2 = typeof MARZIPANODEBUG !== "undefined" && MARZIPANODEBUG.textureStore;
var State = {
  IDLE: 0,
  START: 1,
  MARK: 2,
  END: 3
};
var defaultOptions$6 = {
  previouslyVisibleCacheSize: 512
};
var nextId$1 = 0;
function CancelError() {
}
inherits(CancelError, Error);
function TextureStoreItem(store, tile2) {
  var self2 = this;
  var id = nextId$1++;
  self2._id = id;
  self2._store = store;
  self2._tile = tile2;
  self2._asset = null;
  self2._texture = null;
  self2._changeHandler = function() {
    store.emit("textureInvalid", tile2);
  };
  var source = store.source();
  var stage = store.stage();
  var loadAsset = source.loadAsset.bind(source);
  var createTexture = stage.createTexture.bind(stage);
  var fn = chain(retry(loadAsset), createTexture);
  store.emit("textureStartLoad", tile2);
  if (debug$2) {
    console.log("loading", id, tile2);
  }
  self2._cancel = fn(stage, tile2, function(err, _tile, asset, texture) {
    self2._cancel = null;
    if (err) {
      if (asset) {
        asset.destroy();
      }
      if (texture) {
        texture.destroy();
      }
      if (err instanceof CancelError) {
        store.emit("textureCancel", tile2);
        if (debug$2) {
          console.log("cancel", id, tile2);
        }
      } else {
        store.emit("textureError", tile2, err);
        if (debug$2) {
          console.log("error", id, tile2);
        }
      }
      return;
    }
    self2._texture = texture;
    if (asset.isDynamic()) {
      self2._asset = asset;
      asset.addEventListener("change", self2._changeHandler);
    } else {
      asset.destroy();
    }
    store.emit("textureLoad", tile2);
    if (debug$2) {
      console.log("load", id, tile2);
    }
  });
}
TextureStoreItem.prototype.asset = function() {
  return this._asset;
};
TextureStoreItem.prototype.texture = function() {
  return this._texture;
};
TextureStoreItem.prototype.destroy = function() {
  var id = this._id;
  var store = this._store;
  var tile2 = this._tile;
  var asset = this._asset;
  var texture = this._texture;
  var cancel = this._cancel;
  if (cancel) {
    cancel(new CancelError("Texture load cancelled"));
    return;
  }
  if (asset) {
    asset.removeEventListener("change", this._changeHandler);
    asset.destroy();
  }
  if (texture) {
    texture.destroy();
  }
  store.emit("textureUnload", tile2);
  if (debug$2) {
    console.log("unload", id, tile2);
  }
  clearOwnProperties$g(this);
};
eventEmitter$g(TextureStoreItem);
function TextureStore$1(source, stage, opts) {
  opts = defaults$8(opts || {}, defaultOptions$6);
  this._source = source;
  this._stage = stage;
  this._state = State.IDLE;
  this._delimCount = 0;
  this._itemMap = new Map$1();
  this._visible = new Set$1();
  this._previouslyVisible = new LruSet(opts.previouslyVisibleCacheSize);
  this._pinMap = new Map$1();
  this._newVisible = new Set$1();
  this._noLongerVisible = [];
  this._visibleAgain = [];
  this._evicted = [];
}
eventEmitter$g(TextureStore$1);
TextureStore$1.prototype.destroy = function() {
  this.clear();
  clearOwnProperties$g(this);
};
TextureStore$1.prototype.stage = function() {
  return this._stage;
};
TextureStore$1.prototype.source = function() {
  return this._source;
};
TextureStore$1.prototype.clear = function() {
  var self2 = this;
  self2._evicted.length = 0;
  self2._itemMap.forEach(function(tile2) {
    self2._evicted.push(tile2);
  });
  self2._evicted.forEach(function(tile2) {
    self2._unloadTile(tile2);
  });
  self2._itemMap.clear();
  self2._visible.clear();
  self2._previouslyVisible.clear();
  self2._pinMap.clear();
  self2._newVisible.clear();
  self2._noLongerVisible.length = 0;
  self2._visibleAgain.length = 0;
  self2._evicted.length = 0;
};
TextureStore$1.prototype.clearNotPinned = function() {
  var self2 = this;
  self2._evicted.length = 0;
  self2._itemMap.forEach(function(tile2) {
    if (!self2._pinMap.has(tile2)) {
      self2._evicted.push(tile2);
    }
  });
  self2._evicted.forEach(function(tile2) {
    self2._unloadTile(tile2);
  });
  self2._visible.clear();
  self2._previouslyVisible.clear();
  self2._evicted.length = 0;
};
TextureStore$1.prototype.startFrame = function() {
  if (this._state !== State.IDLE && this._state !== State.START) {
    throw new Error("TextureStore: startFrame called out of sequence");
  }
  this._state = State.START;
  this._delimCount++;
};
TextureStore$1.prototype.markTile = function(tile2) {
  if (this._state !== State.START && this._state !== State.MARK) {
    throw new Error("TextureStore: markTile called out of sequence");
  }
  this._state = State.MARK;
  var item = this._itemMap.get(tile2);
  var texture = item && item.texture();
  var asset = item && item.asset();
  if (texture && asset) {
    texture.refresh(tile2, asset);
  }
  this._newVisible.add(tile2);
};
TextureStore$1.prototype.endFrame = function() {
  if (this._state !== State.START && this._state !== State.MARK && this._state !== State.END) {
    throw new Error("TextureStore: endFrame called out of sequence");
  }
  this._state = State.END;
  this._delimCount--;
  if (!this._delimCount) {
    this._update();
    this._state = State.IDLE;
  }
};
TextureStore$1.prototype._update = function() {
  var self2 = this;
  self2._noLongerVisible.length = 0;
  self2._visible.forEach(function(tile2) {
    if (!self2._newVisible.has(tile2)) {
      self2._noLongerVisible.push(tile2);
    }
  });
  self2._visibleAgain.length = 0;
  self2._newVisible.forEach(function(tile2) {
    if (self2._previouslyVisible.has(tile2)) {
      self2._visibleAgain.push(tile2);
    }
  });
  self2._visibleAgain.forEach(function(tile2) {
    self2._previouslyVisible.remove(tile2);
  });
  self2._evicted.length = 0;
  self2._noLongerVisible.forEach(function(tile2) {
    var item = self2._itemMap.get(tile2);
    var texture = item && item.texture();
    if (texture) {
      var otherTile = self2._previouslyVisible.add(tile2);
      if (otherTile != null) {
        self2._evicted.push(otherTile);
      }
    } else if (item) {
      self2._unloadTile(tile2);
    }
  });
  self2._evicted.forEach(function(tile2) {
    if (!self2._pinMap.has(tile2)) {
      self2._unloadTile(tile2);
    }
  });
  self2._newVisible.forEach(function(tile2) {
    var item = self2._itemMap.get(tile2);
    if (!item) {
      self2._loadTile(tile2);
    }
  });
  var tmp = self2._visible;
  self2._visible = self2._newVisible;
  self2._newVisible = tmp;
  self2._newVisible.clear();
  self2._noLongerVisible.length = 0;
  self2._visibleAgain.length = 0;
  self2._evicted.length = 0;
};
TextureStore$1.prototype._loadTile = function(tile2) {
  if (this._itemMap.has(tile2)) {
    throw new Error("TextureStore: loading texture already in cache");
  }
  var item = new TextureStoreItem(this, tile2);
  this._itemMap.set(tile2, item);
};
TextureStore$1.prototype._unloadTile = function(tile2) {
  var item = this._itemMap.del(tile2);
  if (!item) {
    throw new Error("TextureStore: unloading texture not in cache");
  }
  item.destroy();
};
TextureStore$1.prototype.asset = function(tile2) {
  var item = this._itemMap.get(tile2);
  if (item) {
    return item.asset();
  }
  return null;
};
TextureStore$1.prototype.texture = function(tile2) {
  var item = this._itemMap.get(tile2);
  if (item) {
    return item.texture();
  }
  return null;
};
TextureStore$1.prototype.pin = function(tile2) {
  var count = (this._pinMap.get(tile2) || 0) + 1;
  this._pinMap.set(tile2, count);
  if (!this._itemMap.has(tile2)) {
    this._loadTile(tile2);
  }
  return count;
};
TextureStore$1.prototype.unpin = function(tile2) {
  var count = this._pinMap.get(tile2);
  if (!count) {
    throw new Error("TextureStore: unpin when not pinned");
  } else {
    count--;
    if (count > 0) {
      this._pinMap.set(tile2, count);
    } else {
      this._pinMap.del(tile2);
      if (!this._visible.has(tile2) && !this._previouslyVisible.has(tile2)) {
        this._unloadTile(tile2);
      }
    }
  }
  return count;
};
TextureStore$1.prototype.query = function(tile2) {
  var item = this._itemMap.get(tile2);
  var pinCount = this._pinMap.get(tile2) || 0;
  return {
    visible: this._visible.has(tile2),
    previouslyVisible: this._previouslyVisible.has(tile2),
    hasAsset: item != null && item.asset() != null,
    hasTexture: item != null && item.texture() != null,
    pinned: pinCount !== 0,
    pinCount
  };
};
var TextureStore_1 = TextureStore$1;
function extend$1(obj, sourceObj) {
  for (var key in sourceObj) {
    obj[key] = sourceObj[key];
  }
  return obj;
}
var extend_1 = extend$1;
var eventEmitter$f = minimalEventEmitter;
var extend = extend_1;
var clearOwnProperties$f = clearOwnProperties_1;
function Layer$1(source, geometry, view, textureStore, opts) {
  opts = opts || {};
  var self2 = this;
  this._source = source;
  this._geometry = geometry;
  this._view = view;
  this._textureStore = textureStore;
  this._effects = opts.effects || {};
  this._fixedLevelIndex = null;
  this._viewChangeHandler = function() {
    self2.emit("viewChange", self2.view());
  };
  this._view.addEventListener("change", this._viewChangeHandler);
  this._textureStoreChangeHandler = function() {
    self2.emit("textureStoreChange", self2.textureStore());
  };
  this._textureStore.addEventListener("textureLoad", this._textureStoreChangeHandler);
  this._textureStore.addEventListener("textureError", this._textureStoreChangeHandler);
  this._textureStore.addEventListener("textureInvalid", this._textureStoreChangeHandler);
}
eventEmitter$f(Layer$1);
Layer$1.prototype.destroy = function() {
  this._view.removeEventListener("change", this._viewChangeHandler);
  this._textureStore.removeEventListener("textureLoad", this._textureStoreChangeHandler);
  this._textureStore.removeEventListener("textureError", this._textureStoreChangeHandler);
  this._textureStore.removeEventListener("textureInvalid", this._textureStoreChangeHandler);
  clearOwnProperties$f(this);
};
Layer$1.prototype.source = function() {
  return this._source;
};
Layer$1.prototype.geometry = function() {
  return this._geometry;
};
Layer$1.prototype.view = function() {
  return this._view;
};
Layer$1.prototype.textureStore = function() {
  return this._textureStore;
};
Layer$1.prototype.effects = function() {
  return this._effects;
};
Layer$1.prototype.setEffects = function(effects) {
  this._effects = effects;
  this.emit("effectsChange", this._effects);
};
Layer$1.prototype.mergeEffects = function(effects) {
  extend(this._effects, effects);
  this.emit("effectsChange", this._effects);
};
Layer$1.prototype.fixedLevel = function() {
  return this._fixedLevelIndex;
};
Layer$1.prototype.setFixedLevel = function(levelIndex) {
  if (levelIndex !== this._fixedLevelIndex) {
    if (levelIndex != null && (levelIndex >= this._geometry.levelList.length || levelIndex < 0)) {
      throw new Error("Level index out of range: " + levelIndex);
    }
    this._fixedLevelIndex = levelIndex;
    this.emit("fixedLevelChange", this._fixedLevelIndex);
  }
};
Layer$1.prototype._selectLevel = function() {
  var level;
  if (this._fixedLevelIndex != null) {
    level = this._geometry.levelList[this._fixedLevelIndex];
  } else {
    level = this._view.selectLevel(this._geometry.selectableLevelList);
  }
  return level;
};
Layer$1.prototype.visibleTiles = function(result) {
  var level = this._selectLevel();
  return this._geometry.visibleTiles(this._view, level, result);
};
Layer$1.prototype.pinLevel = function(levelIndex) {
  var level = this._geometry.levelList[levelIndex];
  var tiles = this._geometry.levelTiles(level);
  for (var i2 = 0; i2 < tiles.length; i2++) {
    this._textureStore.pin(tiles[i2]);
  }
};
Layer$1.prototype.unpinLevel = function(levelIndex) {
  var level = this._geometry.levelList[levelIndex];
  var tiles = this._geometry.levelTiles(level);
  for (var i2 = 0; i2 < tiles.length; i2++) {
    this._textureStore.unpin(tiles[i2]);
  }
};
Layer$1.prototype.pinFirstLevel = function() {
  return this.pinLevel(0);
};
Layer$1.prototype.unpinFirstLevel = function() {
  return this.unpinLevel(0);
};
var Layer_1 = Layer$1;
var eventEmitter$e = minimalEventEmitter;
var clearOwnProperties$e = clearOwnProperties_1;
function RenderLoop$1(stage) {
  var self2 = this;
  this._stage = stage;
  this._running = false;
  this._rendering = false;
  this._requestHandle = null;
  this._boundLoop = this._loop.bind(this);
  this._renderInvalidHandler = function() {
    if (!self2._rendering) {
      self2.renderOnNextFrame();
    }
  };
  this._stage.addEventListener("renderInvalid", this._renderInvalidHandler);
}
eventEmitter$e(RenderLoop$1);
RenderLoop$1.prototype.destroy = function() {
  this.stop();
  this._stage.removeEventListener("renderInvalid", this._renderInvalidHandler);
  clearOwnProperties$e(this);
};
RenderLoop$1.prototype.stage = function() {
  return this._stage;
};
RenderLoop$1.prototype.start = function() {
  this._running = true;
  this.renderOnNextFrame();
};
RenderLoop$1.prototype.stop = function() {
  if (this._requestHandle) {
    window.cancelAnimationFrame(this._requestHandle);
    this._requestHandle = null;
  }
  this._running = false;
};
RenderLoop$1.prototype.renderOnNextFrame = function() {
  if (this._running && !this._requestHandle) {
    this._requestHandle = window.requestAnimationFrame(this._boundLoop);
  }
};
RenderLoop$1.prototype._loop = function() {
  if (!this._running) {
    throw new Error("Render loop running while in stopped state");
  }
  this._requestHandle = null;
  this._rendering = true;
  this.emit("beforeRender");
  this._rendering = false;
  this._stage.render();
  this.emit("afterRender");
};
var RenderLoop_1 = RenderLoop$1;
function Dynamics$8() {
  this.velocity = null;
  this.friction = null;
  this.offset = null;
}
Dynamics$8.equals = function(d1, d2) {
  return d1.velocity === d2.velocity && d1.friction === d2.friction && d1.offset === d2.offset;
};
Dynamics$8.prototype.equals = function(other) {
  return Dynamics$8.equals(this, other);
};
Dynamics$8.prototype.update = function(other, elapsed) {
  if (other.offset) {
    this.offset = this.offset || 0;
    this.offset += other.offset;
  }
  var offsetFromVelocity = this.offsetFromVelocity(elapsed);
  if (offsetFromVelocity) {
    this.offset = this.offset || 0;
    this.offset += offsetFromVelocity;
  }
  this.velocity = other.velocity;
  this.friction = other.friction;
};
Dynamics$8.prototype.reset = function() {
  this.velocity = null;
  this.friction = null;
  this.offset = null;
};
Dynamics$8.prototype.velocityAfter = function(elapsed) {
  if (!this.velocity) {
    return null;
  }
  if (this.friction) {
    return decreaseAbs(this.velocity, this.friction * elapsed);
  }
  return this.velocity;
};
Dynamics$8.prototype.offsetFromVelocity = function(elapsed) {
  elapsed = Math.min(elapsed, this.nullVelocityTime());
  var velocityEnd = this.velocityAfter(elapsed);
  var averageVelocity = (this.velocity + velocityEnd) / 2;
  return averageVelocity * elapsed;
};
Dynamics$8.prototype.nullVelocityTime = function() {
  if (this.velocity == null) {
    return 0;
  }
  if (this.velocity && !this.friction) {
    return Infinity;
  }
  return Math.abs(this.velocity / this.friction);
};
function decreaseAbs(num, dec) {
  if (num < 0) {
    return Math.min(0, num + dec);
  }
  if (num > 0) {
    return Math.max(0, num - dec);
  }
  return 0;
}
var Dynamics_1 = Dynamics$8;
var eventEmitter$d = minimalEventEmitter;
var Dynamics$7 = Dynamics_1;
var clearOwnProperties$d = clearOwnProperties_1;
function KeyControlMethod$1(keyCode, parameter, velocity, friction, element2) {
  if (!keyCode) {
    throw new Error("KeyControlMethod: keyCode must be defined");
  }
  if (!parameter) {
    throw new Error("KeyControlMethod: parameter must be defined");
  }
  if (!velocity) {
    throw new Error("KeyControlMethod: velocity must be defined");
  }
  if (!friction) {
    throw new Error("KeyControlMethod: friction must be defined");
  }
  element2 = element2 || document;
  this._keyCode = keyCode;
  this._parameter = parameter;
  this._velocity = velocity;
  this._friction = friction;
  this._element = element2;
  this._keydownHandler = this._handlePress.bind(this);
  this._keyupHandler = this._handleRelease.bind(this);
  this._blurHandler = this._handleBlur.bind(this);
  this._element.addEventListener("keydown", this._keydownHandler);
  this._element.addEventListener("keyup", this._keyupHandler);
  window.addEventListener("blur", this._blurHandler);
  this._dynamics = new Dynamics$7();
  this._pressing = false;
}
eventEmitter$d(KeyControlMethod$1);
KeyControlMethod$1.prototype.destroy = function() {
  this._element.removeEventListener("keydown", this._keydownHandler);
  this._element.removeEventListener("keyup", this._keyupHandler);
  window.removeEventListener("blur", this._blurHandler);
  clearOwnProperties$d(this);
};
KeyControlMethod$1.prototype._handlePress = function(e) {
  if (e.keyCode !== this._keyCode) {
    return;
  }
  this._pressing = true;
  this._dynamics.velocity = this._velocity;
  this._dynamics.friction = 0;
  this.emit("parameterDynamics", this._parameter, this._dynamics);
  this.emit("active");
};
KeyControlMethod$1.prototype._handleRelease = function(e) {
  if (e.keyCode !== this._keyCode) {
    return;
  }
  if (this._pressing) {
    this._dynamics.friction = this._friction;
    this.emit("parameterDynamics", this._parameter, this._dynamics);
    this.emit("inactive");
  }
  this._pressing = false;
};
KeyControlMethod$1.prototype._handleBlur = function() {
  this._dynamics.velocity = 0;
  this.emit("parameterDynamics", this._parameter, this._dynamics);
  this.emit("inactive");
  this._pressing = false;
};
var Key = KeyControlMethod$1;
var hammer = { exports: {} };
/*! Hammer.JS - v2.0.4 - 2014-09-28
 * http://hammerjs.github.io/
 *
 * Copyright (c) 2014 Jorik Tangelder;
 * Licensed under the MIT license */
(function(module) {
  (function(window2, document2, exportName, undefined$1) {
    var VENDOR_PREFIXES = ["", "webkit", "moz", "MS", "ms", "o"];
    var TEST_ELEMENT = document2.createElement("div");
    var TYPE_FUNCTION = "function";
    var round2 = Math.round;
    var abs = Math.abs;
    var now2 = Date.now;
    function setTimeoutContext(fn, timeout, context) {
      return setTimeout(bindFn(fn, context), timeout);
    }
    function invokeArrayArg(arg, fn, context) {
      if (Array.isArray(arg)) {
        each(arg, context[fn], context);
        return true;
      }
      return false;
    }
    function each(obj, iterator, context) {
      var i2;
      if (!obj) {
        return;
      }
      if (obj.forEach) {
        obj.forEach(iterator, context);
      } else if (obj.length !== undefined$1) {
        i2 = 0;
        while (i2 < obj.length) {
          iterator.call(context, obj[i2], i2, obj);
          i2++;
        }
      } else {
        for (i2 in obj) {
          obj.hasOwnProperty(i2) && iterator.call(context, obj[i2], i2, obj);
        }
      }
    }
    function extend2(dest, src2, merge2) {
      var keys = Object.keys(src2);
      var i2 = 0;
      while (i2 < keys.length) {
        if (!merge2 || merge2 && dest[keys[i2]] === undefined$1) {
          dest[keys[i2]] = src2[keys[i2]];
        }
        i2++;
      }
      return dest;
    }
    function merge(dest, src2) {
      return extend2(dest, src2, true);
    }
    function inherit(child, base, properties) {
      var baseP = base.prototype, childP;
      childP = child.prototype = Object.create(baseP);
      childP.constructor = child;
      childP._super = baseP;
      if (properties) {
        extend2(childP, properties);
      }
    }
    function bindFn(fn, context) {
      return function boundFn() {
        return fn.apply(context, arguments);
      };
    }
    function boolOrFn(val, args) {
      if (typeof val == TYPE_FUNCTION) {
        return val.apply(args ? args[0] || undefined$1 : undefined$1, args);
      }
      return val;
    }
    function ifUndefined(val1, val2) {
      return val1 === undefined$1 ? val2 : val1;
    }
    function addEventListeners(target, types, handler) {
      each(splitStr(types), function(type2) {
        target.addEventListener(type2, handler, false);
      });
    }
    function removeEventListeners(target, types, handler) {
      each(splitStr(types), function(type2) {
        target.removeEventListener(type2, handler, false);
      });
    }
    function hasParent(node, parent) {
      while (node) {
        if (node == parent) {
          return true;
        }
        node = node.parentNode;
      }
      return false;
    }
    function inStr(str2, find) {
      return str2.indexOf(find) > -1;
    }
    function splitStr(str2) {
      return str2.trim().split(/\s+/g);
    }
    function inArray(src2, find, findByKey) {
      if (src2.indexOf && !findByKey) {
        return src2.indexOf(find);
      } else {
        var i2 = 0;
        while (i2 < src2.length) {
          if (findByKey && src2[i2][findByKey] == find || !findByKey && src2[i2] === find) {
            return i2;
          }
          i2++;
        }
        return -1;
      }
    }
    function toArray(obj) {
      return Array.prototype.slice.call(obj, 0);
    }
    function uniqueArray(src2, key, sort) {
      var results = [];
      var values = [];
      var i2 = 0;
      while (i2 < src2.length) {
        var val = key ? src2[i2][key] : src2[i2];
        if (inArray(values, val) < 0) {
          results.push(src2[i2]);
        }
        values[i2] = val;
        i2++;
      }
      if (sort) {
        if (!key) {
          results = results.sort();
        } else {
          results = results.sort(function sortUniqueArray(a, b) {
            return a[key] > b[key];
          });
        }
      }
      return results;
    }
    function prefixed(obj, property) {
      var prefix, prop;
      var camelProp = property[0].toUpperCase() + property.slice(1);
      var i2 = 0;
      while (i2 < VENDOR_PREFIXES.length) {
        prefix = VENDOR_PREFIXES[i2];
        prop = prefix ? prefix + camelProp : property;
        if (prop in obj) {
          return prop;
        }
        i2++;
      }
      return undefined$1;
    }
    var _uniqueId = 1;
    function uniqueId() {
      return _uniqueId++;
    }
    function getWindowForElement(element2) {
      var doc = element2.ownerDocument;
      return doc.defaultView || doc.parentWindow;
    }
    var MOBILE_REGEX = /mobile|tablet|ip(ad|hone|od)|android/i;
    var SUPPORT_TOUCH = "ontouchstart" in window2;
    var SUPPORT_POINTER_EVENTS = prefixed(window2, "PointerEvent") !== undefined$1;
    var SUPPORT_ONLY_TOUCH = SUPPORT_TOUCH && MOBILE_REGEX.test(navigator.userAgent);
    var INPUT_TYPE_TOUCH = "touch";
    var INPUT_TYPE_PEN = "pen";
    var INPUT_TYPE_MOUSE = "mouse";
    var INPUT_TYPE_KINECT = "kinect";
    var COMPUTE_INTERVAL = 25;
    var INPUT_START = 1;
    var INPUT_MOVE = 2;
    var INPUT_END = 4;
    var INPUT_CANCEL = 8;
    var DIRECTION_NONE = 1;
    var DIRECTION_LEFT = 2;
    var DIRECTION_RIGHT = 4;
    var DIRECTION_UP = 8;
    var DIRECTION_DOWN = 16;
    var DIRECTION_HORIZONTAL = DIRECTION_LEFT | DIRECTION_RIGHT;
    var DIRECTION_VERTICAL = DIRECTION_UP | DIRECTION_DOWN;
    var DIRECTION_ALL = DIRECTION_HORIZONTAL | DIRECTION_VERTICAL;
    var PROPS_XY = ["x", "y"];
    var PROPS_CLIENT_XY = ["clientX", "clientY"];
    function Input(manager, callback) {
      var self2 = this;
      this.manager = manager;
      this.callback = callback;
      this.element = manager.element;
      this.target = manager.options.inputTarget;
      this.domHandler = function(ev) {
        if (boolOrFn(manager.options.enable, [manager])) {
          self2.handler(ev);
        }
      };
      this.init();
    }
    Input.prototype = {
      handler: function() {
      },
      init: function() {
        this.evEl && addEventListeners(this.element, this.evEl, this.domHandler);
        this.evTarget && addEventListeners(this.target, this.evTarget, this.domHandler);
        this.evWin && addEventListeners(getWindowForElement(this.element), this.evWin, this.domHandler);
      },
      destroy: function() {
        this.evEl && removeEventListeners(this.element, this.evEl, this.domHandler);
        this.evTarget && removeEventListeners(this.target, this.evTarget, this.domHandler);
        this.evWin && removeEventListeners(getWindowForElement(this.element), this.evWin, this.domHandler);
      }
    };
    function createInputInstance(manager) {
      var Type;
      var inputClass = manager.options.inputClass;
      if (inputClass) {
        Type = inputClass;
      } else if (SUPPORT_POINTER_EVENTS) {
        Type = PointerEventInput;
      } else if (SUPPORT_ONLY_TOUCH) {
        Type = TouchInput;
      } else if (!SUPPORT_TOUCH) {
        Type = MouseInput;
      } else {
        Type = TouchMouseInput;
      }
      return new Type(manager, inputHandler);
    }
    function inputHandler(manager, eventType, input) {
      var pointersLen = input.pointers.length;
      var changedPointersLen = input.changedPointers.length;
      var isFirst = eventType & INPUT_START && pointersLen - changedPointersLen === 0;
      var isFinal = eventType & (INPUT_END | INPUT_CANCEL) && pointersLen - changedPointersLen === 0;
      input.isFirst = !!isFirst;
      input.isFinal = !!isFinal;
      if (isFirst) {
        manager.session = {};
      }
      input.eventType = eventType;
      computeInputData(manager, input);
      manager.emit("hammer.input", input);
      manager.recognize(input);
      manager.session.prevInput = input;
    }
    function computeInputData(manager, input) {
      var session = manager.session;
      var pointers = input.pointers;
      var pointersLength = pointers.length;
      if (!session.firstInput) {
        session.firstInput = simpleCloneInputData(input);
      }
      if (pointersLength > 1 && !session.firstMultiple) {
        session.firstMultiple = simpleCloneInputData(input);
      } else if (pointersLength === 1) {
        session.firstMultiple = false;
      }
      var firstInput = session.firstInput;
      var firstMultiple = session.firstMultiple;
      var offsetCenter = firstMultiple ? firstMultiple.center : firstInput.center;
      var center = input.center = getCenter(pointers);
      input.timeStamp = now2();
      input.deltaTime = input.timeStamp - firstInput.timeStamp;
      input.angle = getAngle2(offsetCenter, center);
      input.distance = getDistance(offsetCenter, center);
      computeDeltaXY(session, input);
      input.offsetDirection = getDirection(input.deltaX, input.deltaY);
      input.scale = firstMultiple ? getScale(firstMultiple.pointers, pointers) : 1;
      input.rotation = firstMultiple ? getRotation2(firstMultiple.pointers, pointers) : 0;
      computeIntervalInputData(session, input);
      var target = manager.element;
      if (hasParent(input.srcEvent.target, target)) {
        target = input.srcEvent.target;
      }
      input.target = target;
    }
    function computeDeltaXY(session, input) {
      var center = input.center;
      var offset = session.offsetDelta || {};
      var prevDelta = session.prevDelta || {};
      var prevInput = session.prevInput || {};
      if (input.eventType === INPUT_START || prevInput.eventType === INPUT_END) {
        prevDelta = session.prevDelta = {
          x: prevInput.deltaX || 0,
          y: prevInput.deltaY || 0
        };
        offset = session.offsetDelta = {
          x: center.x,
          y: center.y
        };
      }
      input.deltaX = prevDelta.x + (center.x - offset.x);
      input.deltaY = prevDelta.y + (center.y - offset.y);
    }
    function computeIntervalInputData(session, input) {
      var last = session.lastInterval || input, deltaTime = input.timeStamp - last.timeStamp, velocity, velocityX, velocityY, direction;
      if (input.eventType != INPUT_CANCEL && (deltaTime > COMPUTE_INTERVAL || last.velocity === undefined$1)) {
        var deltaX = last.deltaX - input.deltaX;
        var deltaY = last.deltaY - input.deltaY;
        var v2 = getVelocity(deltaTime, deltaX, deltaY);
        velocityX = v2.x;
        velocityY = v2.y;
        velocity = abs(v2.x) > abs(v2.y) ? v2.x : v2.y;
        direction = getDirection(deltaX, deltaY);
        session.lastInterval = input;
      } else {
        velocity = last.velocity;
        velocityX = last.velocityX;
        velocityY = last.velocityY;
        direction = last.direction;
      }
      input.velocity = velocity;
      input.velocityX = velocityX;
      input.velocityY = velocityY;
      input.direction = direction;
    }
    function simpleCloneInputData(input) {
      var pointers = [];
      var i2 = 0;
      while (i2 < input.pointers.length) {
        pointers[i2] = {
          clientX: round2(input.pointers[i2].clientX),
          clientY: round2(input.pointers[i2].clientY)
        };
        i2++;
      }
      return {
        timeStamp: now2(),
        pointers,
        center: getCenter(pointers),
        deltaX: input.deltaX,
        deltaY: input.deltaY
      };
    }
    function getCenter(pointers) {
      var pointersLength = pointers.length;
      if (pointersLength === 1) {
        return {
          x: round2(pointers[0].clientX),
          y: round2(pointers[0].clientY)
        };
      }
      var x = 0, y = 0, i2 = 0;
      while (i2 < pointersLength) {
        x += pointers[i2].clientX;
        y += pointers[i2].clientY;
        i2++;
      }
      return {
        x: round2(x / pointersLength),
        y: round2(y / pointersLength)
      };
    }
    function getVelocity(deltaTime, x, y) {
      return {
        x: x / deltaTime || 0,
        y: y / deltaTime || 0
      };
    }
    function getDirection(x, y) {
      if (x === y) {
        return DIRECTION_NONE;
      }
      if (abs(x) >= abs(y)) {
        return x > 0 ? DIRECTION_LEFT : DIRECTION_RIGHT;
      }
      return y > 0 ? DIRECTION_UP : DIRECTION_DOWN;
    }
    function getDistance(p1, p2, props) {
      if (!props) {
        props = PROPS_XY;
      }
      var x = p2[props[0]] - p1[props[0]], y = p2[props[1]] - p1[props[1]];
      return Math.sqrt(x * x + y * y);
    }
    function getAngle2(p1, p2, props) {
      if (!props) {
        props = PROPS_XY;
      }
      var x = p2[props[0]] - p1[props[0]], y = p2[props[1]] - p1[props[1]];
      return Math.atan2(y, x) * 180 / Math.PI;
    }
    function getRotation2(start, end) {
      return getAngle2(end[1], end[0], PROPS_CLIENT_XY) - getAngle2(start[1], start[0], PROPS_CLIENT_XY);
    }
    function getScale(start, end) {
      return getDistance(end[0], end[1], PROPS_CLIENT_XY) / getDistance(start[0], start[1], PROPS_CLIENT_XY);
    }
    var MOUSE_INPUT_MAP = {
      mousedown: INPUT_START,
      mousemove: INPUT_MOVE,
      mouseup: INPUT_END
    };
    var MOUSE_ELEMENT_EVENTS = "mousedown";
    var MOUSE_WINDOW_EVENTS = "mousemove mouseup";
    function MouseInput() {
      this.evEl = MOUSE_ELEMENT_EVENTS;
      this.evWin = MOUSE_WINDOW_EVENTS;
      this.allow = true;
      this.pressed = false;
      Input.apply(this, arguments);
    }
    inherit(MouseInput, Input, {
      handler: function MEhandler(ev) {
        var eventType = MOUSE_INPUT_MAP[ev.type];
        if (eventType & INPUT_START && ev.button === 0) {
          this.pressed = true;
        }
        if (eventType & INPUT_MOVE && ev.which !== 1) {
          eventType = INPUT_END;
        }
        if (!this.pressed || !this.allow) {
          return;
        }
        if (eventType & INPUT_END) {
          this.pressed = false;
        }
        this.callback(this.manager, eventType, {
          pointers: [ev],
          changedPointers: [ev],
          pointerType: INPUT_TYPE_MOUSE,
          srcEvent: ev
        });
      }
    });
    var POINTER_INPUT_MAP = {
      pointerdown: INPUT_START,
      pointermove: INPUT_MOVE,
      pointerup: INPUT_END,
      pointercancel: INPUT_CANCEL,
      pointerout: INPUT_CANCEL
    };
    var IE10_POINTER_TYPE_ENUM = {
      2: INPUT_TYPE_TOUCH,
      3: INPUT_TYPE_PEN,
      4: INPUT_TYPE_MOUSE,
      5: INPUT_TYPE_KINECT
    };
    var POINTER_ELEMENT_EVENTS = "pointerdown";
    var POINTER_WINDOW_EVENTS = "pointermove pointerup pointercancel";
    if (window2.MSPointerEvent) {
      POINTER_ELEMENT_EVENTS = "MSPointerDown";
      POINTER_WINDOW_EVENTS = "MSPointerMove MSPointerUp MSPointerCancel";
    }
    function PointerEventInput() {
      this.evEl = POINTER_ELEMENT_EVENTS;
      this.evWin = POINTER_WINDOW_EVENTS;
      Input.apply(this, arguments);
      this.store = this.manager.session.pointerEvents = [];
    }
    inherit(PointerEventInput, Input, {
      handler: function PEhandler(ev) {
        var store = this.store;
        var removePointer = false;
        var eventTypeNormalized = ev.type.toLowerCase().replace("ms", "");
        var eventType = POINTER_INPUT_MAP[eventTypeNormalized];
        var pointerType = IE10_POINTER_TYPE_ENUM[ev.pointerType] || ev.pointerType;
        var isTouch = pointerType == INPUT_TYPE_TOUCH;
        var storeIndex = inArray(store, ev.pointerId, "pointerId");
        if (eventType & INPUT_START && (ev.button === 0 || isTouch)) {
          if (storeIndex < 0) {
            store.push(ev);
            storeIndex = store.length - 1;
          }
        } else if (eventType & (INPUT_END | INPUT_CANCEL)) {
          removePointer = true;
        }
        if (storeIndex < 0) {
          return;
        }
        store[storeIndex] = ev;
        this.callback(this.manager, eventType, {
          pointers: store,
          changedPointers: [ev],
          pointerType,
          srcEvent: ev
        });
        if (removePointer) {
          store.splice(storeIndex, 1);
        }
      }
    });
    var SINGLE_TOUCH_INPUT_MAP = {
      touchstart: INPUT_START,
      touchmove: INPUT_MOVE,
      touchend: INPUT_END,
      touchcancel: INPUT_CANCEL
    };
    var SINGLE_TOUCH_TARGET_EVENTS = "touchstart";
    var SINGLE_TOUCH_WINDOW_EVENTS = "touchstart touchmove touchend touchcancel";
    function SingleTouchInput() {
      this.evTarget = SINGLE_TOUCH_TARGET_EVENTS;
      this.evWin = SINGLE_TOUCH_WINDOW_EVENTS;
      this.started = false;
      Input.apply(this, arguments);
    }
    inherit(SingleTouchInput, Input, {
      handler: function TEhandler(ev) {
        var type2 = SINGLE_TOUCH_INPUT_MAP[ev.type];
        if (type2 === INPUT_START) {
          this.started = true;
        }
        if (!this.started) {
          return;
        }
        var touches = normalizeSingleTouches.call(this, ev, type2);
        if (type2 & (INPUT_END | INPUT_CANCEL) && touches[0].length - touches[1].length === 0) {
          this.started = false;
        }
        this.callback(this.manager, type2, {
          pointers: touches[0],
          changedPointers: touches[1],
          pointerType: INPUT_TYPE_TOUCH,
          srcEvent: ev
        });
      }
    });
    function normalizeSingleTouches(ev, type2) {
      var all = toArray(ev.touches);
      var changed = toArray(ev.changedTouches);
      if (type2 & (INPUT_END | INPUT_CANCEL)) {
        all = uniqueArray(all.concat(changed), "identifier", true);
      }
      return [all, changed];
    }
    var TOUCH_INPUT_MAP = {
      touchstart: INPUT_START,
      touchmove: INPUT_MOVE,
      touchend: INPUT_END,
      touchcancel: INPUT_CANCEL
    };
    var TOUCH_TARGET_EVENTS = "touchstart touchmove touchend touchcancel";
    function TouchInput() {
      this.evTarget = TOUCH_TARGET_EVENTS;
      this.targetIds = {};
      Input.apply(this, arguments);
    }
    inherit(TouchInput, Input, {
      handler: function MTEhandler(ev) {
        var type2 = TOUCH_INPUT_MAP[ev.type];
        var touches = getTouches.call(this, ev, type2);
        if (!touches) {
          return;
        }
        this.callback(this.manager, type2, {
          pointers: touches[0],
          changedPointers: touches[1],
          pointerType: INPUT_TYPE_TOUCH,
          srcEvent: ev
        });
      }
    });
    function getTouches(ev, type2) {
      var allTouches = toArray(ev.touches);
      var targetIds = this.targetIds;
      if (type2 & (INPUT_START | INPUT_MOVE) && allTouches.length === 1) {
        targetIds[allTouches[0].identifier] = true;
        return [allTouches, allTouches];
      }
      var i2, targetTouches, changedTouches = toArray(ev.changedTouches), changedTargetTouches = [], target = this.target;
      targetTouches = allTouches.filter(function(touch) {
        return hasParent(touch.target, target);
      });
      if (type2 === INPUT_START) {
        i2 = 0;
        while (i2 < targetTouches.length) {
          targetIds[targetTouches[i2].identifier] = true;
          i2++;
        }
      }
      i2 = 0;
      while (i2 < changedTouches.length) {
        if (targetIds[changedTouches[i2].identifier]) {
          changedTargetTouches.push(changedTouches[i2]);
        }
        if (type2 & (INPUT_END | INPUT_CANCEL)) {
          delete targetIds[changedTouches[i2].identifier];
        }
        i2++;
      }
      if (!changedTargetTouches.length) {
        return;
      }
      return [
        uniqueArray(targetTouches.concat(changedTargetTouches), "identifier", true),
        changedTargetTouches
      ];
    }
    function TouchMouseInput() {
      Input.apply(this, arguments);
      var handler = bindFn(this.handler, this);
      this.touch = new TouchInput(this.manager, handler);
      this.mouse = new MouseInput(this.manager, handler);
    }
    inherit(TouchMouseInput, Input, {
      handler: function TMEhandler(manager, inputEvent, inputData) {
        var isTouch = inputData.pointerType == INPUT_TYPE_TOUCH, isMouse = inputData.pointerType == INPUT_TYPE_MOUSE;
        if (isTouch) {
          this.mouse.allow = false;
        } else if (isMouse && !this.mouse.allow) {
          return;
        }
        if (inputEvent & (INPUT_END | INPUT_CANCEL)) {
          this.mouse.allow = true;
        }
        this.callback(manager, inputEvent, inputData);
      },
      destroy: function destroy() {
        this.touch.destroy();
        this.mouse.destroy();
      }
    });
    var PREFIXED_TOUCH_ACTION = prefixed(TEST_ELEMENT.style, "touchAction");
    var NATIVE_TOUCH_ACTION = PREFIXED_TOUCH_ACTION !== undefined$1;
    var TOUCH_ACTION_COMPUTE = "compute";
    var TOUCH_ACTION_AUTO = "auto";
    var TOUCH_ACTION_MANIPULATION = "manipulation";
    var TOUCH_ACTION_NONE = "none";
    var TOUCH_ACTION_PAN_X = "pan-x";
    var TOUCH_ACTION_PAN_Y = "pan-y";
    function TouchAction(manager, value) {
      this.manager = manager;
      this.set(value);
    }
    TouchAction.prototype = {
      set: function(value) {
        if (value == TOUCH_ACTION_COMPUTE) {
          value = this.compute();
        }
        if (NATIVE_TOUCH_ACTION) {
          this.manager.element.style[PREFIXED_TOUCH_ACTION] = value;
        }
        this.actions = value.toLowerCase().trim();
      },
      update: function() {
        this.set(this.manager.options.touchAction);
      },
      compute: function() {
        var actions = [];
        each(this.manager.recognizers, function(recognizer) {
          if (boolOrFn(recognizer.options.enable, [recognizer])) {
            actions = actions.concat(recognizer.getTouchAction());
          }
        });
        return cleanTouchActions(actions.join(" "));
      },
      preventDefaults: function(input) {
        if (NATIVE_TOUCH_ACTION) {
          return;
        }
        var srcEvent = input.srcEvent;
        var direction = input.offsetDirection;
        if (this.manager.session.prevented) {
          srcEvent.preventDefault();
          return;
        }
        var actions = this.actions;
        var hasNone = inStr(actions, TOUCH_ACTION_NONE);
        var hasPanY = inStr(actions, TOUCH_ACTION_PAN_Y);
        var hasPanX = inStr(actions, TOUCH_ACTION_PAN_X);
        if (hasNone || hasPanY && direction & DIRECTION_HORIZONTAL || hasPanX && direction & DIRECTION_VERTICAL) {
          return this.preventSrc(srcEvent);
        }
      },
      preventSrc: function(srcEvent) {
        this.manager.session.prevented = true;
        srcEvent.preventDefault();
      }
    };
    function cleanTouchActions(actions) {
      if (inStr(actions, TOUCH_ACTION_NONE)) {
        return TOUCH_ACTION_NONE;
      }
      var hasPanX = inStr(actions, TOUCH_ACTION_PAN_X);
      var hasPanY = inStr(actions, TOUCH_ACTION_PAN_Y);
      if (hasPanX && hasPanY) {
        return TOUCH_ACTION_PAN_X + " " + TOUCH_ACTION_PAN_Y;
      }
      if (hasPanX || hasPanY) {
        return hasPanX ? TOUCH_ACTION_PAN_X : TOUCH_ACTION_PAN_Y;
      }
      if (inStr(actions, TOUCH_ACTION_MANIPULATION)) {
        return TOUCH_ACTION_MANIPULATION;
      }
      return TOUCH_ACTION_AUTO;
    }
    var STATE_POSSIBLE = 1;
    var STATE_BEGAN = 2;
    var STATE_CHANGED = 4;
    var STATE_ENDED = 8;
    var STATE_RECOGNIZED = STATE_ENDED;
    var STATE_CANCELLED = 16;
    var STATE_FAILED = 32;
    function Recognizer(options) {
      this.id = uniqueId();
      this.manager = null;
      this.options = merge(options || {}, this.defaults);
      this.options.enable = ifUndefined(this.options.enable, true);
      this.state = STATE_POSSIBLE;
      this.simultaneous = {};
      this.requireFail = [];
    }
    Recognizer.prototype = {
      defaults: {},
      set: function(options) {
        extend2(this.options, options);
        this.manager && this.manager.touchAction.update();
        return this;
      },
      recognizeWith: function(otherRecognizer) {
        if (invokeArrayArg(otherRecognizer, "recognizeWith", this)) {
          return this;
        }
        var simultaneous = this.simultaneous;
        otherRecognizer = getRecognizerByNameIfManager(otherRecognizer, this);
        if (!simultaneous[otherRecognizer.id]) {
          simultaneous[otherRecognizer.id] = otherRecognizer;
          otherRecognizer.recognizeWith(this);
        }
        return this;
      },
      dropRecognizeWith: function(otherRecognizer) {
        if (invokeArrayArg(otherRecognizer, "dropRecognizeWith", this)) {
          return this;
        }
        otherRecognizer = getRecognizerByNameIfManager(otherRecognizer, this);
        delete this.simultaneous[otherRecognizer.id];
        return this;
      },
      requireFailure: function(otherRecognizer) {
        if (invokeArrayArg(otherRecognizer, "requireFailure", this)) {
          return this;
        }
        var requireFail = this.requireFail;
        otherRecognizer = getRecognizerByNameIfManager(otherRecognizer, this);
        if (inArray(requireFail, otherRecognizer) === -1) {
          requireFail.push(otherRecognizer);
          otherRecognizer.requireFailure(this);
        }
        return this;
      },
      dropRequireFailure: function(otherRecognizer) {
        if (invokeArrayArg(otherRecognizer, "dropRequireFailure", this)) {
          return this;
        }
        otherRecognizer = getRecognizerByNameIfManager(otherRecognizer, this);
        var index = inArray(this.requireFail, otherRecognizer);
        if (index > -1) {
          this.requireFail.splice(index, 1);
        }
        return this;
      },
      hasRequireFailures: function() {
        return this.requireFail.length > 0;
      },
      canRecognizeWith: function(otherRecognizer) {
        return !!this.simultaneous[otherRecognizer.id];
      },
      emit: function(input) {
        var self2 = this;
        var state = this.state;
        function emit(withState) {
          self2.manager.emit(self2.options.event + (withState ? stateStr(state) : ""), input);
        }
        if (state < STATE_ENDED) {
          emit(true);
        }
        emit();
        if (state >= STATE_ENDED) {
          emit(true);
        }
      },
      tryEmit: function(input) {
        if (this.canEmit()) {
          return this.emit(input);
        }
        this.state = STATE_FAILED;
      },
      canEmit: function() {
        var i2 = 0;
        while (i2 < this.requireFail.length) {
          if (!(this.requireFail[i2].state & (STATE_FAILED | STATE_POSSIBLE))) {
            return false;
          }
          i2++;
        }
        return true;
      },
      recognize: function(inputData) {
        var inputDataClone = extend2({}, inputData);
        if (!boolOrFn(this.options.enable, [this, inputDataClone])) {
          this.reset();
          this.state = STATE_FAILED;
          return;
        }
        if (this.state & (STATE_RECOGNIZED | STATE_CANCELLED | STATE_FAILED)) {
          this.state = STATE_POSSIBLE;
        }
        this.state = this.process(inputDataClone);
        if (this.state & (STATE_BEGAN | STATE_CHANGED | STATE_ENDED | STATE_CANCELLED)) {
          this.tryEmit(inputDataClone);
        }
      },
      process: function(inputData) {
      },
      getTouchAction: function() {
      },
      reset: function() {
      }
    };
    function stateStr(state) {
      if (state & STATE_CANCELLED) {
        return "cancel";
      } else if (state & STATE_ENDED) {
        return "end";
      } else if (state & STATE_CHANGED) {
        return "move";
      } else if (state & STATE_BEGAN) {
        return "start";
      }
      return "";
    }
    function directionStr(direction) {
      if (direction == DIRECTION_DOWN) {
        return "down";
      } else if (direction == DIRECTION_UP) {
        return "up";
      } else if (direction == DIRECTION_LEFT) {
        return "left";
      } else if (direction == DIRECTION_RIGHT) {
        return "right";
      }
      return "";
    }
    function getRecognizerByNameIfManager(otherRecognizer, recognizer) {
      var manager = recognizer.manager;
      if (manager) {
        return manager.get(otherRecognizer);
      }
      return otherRecognizer;
    }
    function AttrRecognizer() {
      Recognizer.apply(this, arguments);
    }
    inherit(AttrRecognizer, Recognizer, {
      defaults: {
        pointers: 1
      },
      attrTest: function(input) {
        var optionPointers = this.options.pointers;
        return optionPointers === 0 || input.pointers.length === optionPointers;
      },
      process: function(input) {
        var state = this.state;
        var eventType = input.eventType;
        var isRecognized = state & (STATE_BEGAN | STATE_CHANGED);
        var isValid = this.attrTest(input);
        if (isRecognized && (eventType & INPUT_CANCEL || !isValid)) {
          return state | STATE_CANCELLED;
        } else if (isRecognized || isValid) {
          if (eventType & INPUT_END) {
            return state | STATE_ENDED;
          } else if (!(state & STATE_BEGAN)) {
            return STATE_BEGAN;
          }
          return state | STATE_CHANGED;
        }
        return STATE_FAILED;
      }
    });
    function PanRecognizer() {
      AttrRecognizer.apply(this, arguments);
      this.pX = null;
      this.pY = null;
    }
    inherit(PanRecognizer, AttrRecognizer, {
      defaults: {
        event: "pan",
        threshold: 10,
        pointers: 1,
        direction: DIRECTION_ALL
      },
      getTouchAction: function() {
        var direction = this.options.direction;
        var actions = [];
        if (direction & DIRECTION_HORIZONTAL) {
          actions.push(TOUCH_ACTION_PAN_Y);
        }
        if (direction & DIRECTION_VERTICAL) {
          actions.push(TOUCH_ACTION_PAN_X);
        }
        return actions;
      },
      directionTest: function(input) {
        var options = this.options;
        var hasMoved = true;
        var distance2 = input.distance;
        var direction = input.direction;
        var x = input.deltaX;
        var y = input.deltaY;
        if (!(direction & options.direction)) {
          if (options.direction & DIRECTION_HORIZONTAL) {
            direction = x === 0 ? DIRECTION_NONE : x < 0 ? DIRECTION_LEFT : DIRECTION_RIGHT;
            hasMoved = x != this.pX;
            distance2 = Math.abs(input.deltaX);
          } else {
            direction = y === 0 ? DIRECTION_NONE : y < 0 ? DIRECTION_UP : DIRECTION_DOWN;
            hasMoved = y != this.pY;
            distance2 = Math.abs(input.deltaY);
          }
        }
        input.direction = direction;
        return hasMoved && distance2 > options.threshold && direction & options.direction;
      },
      attrTest: function(input) {
        return AttrRecognizer.prototype.attrTest.call(this, input) && (this.state & STATE_BEGAN || !(this.state & STATE_BEGAN) && this.directionTest(input));
      },
      emit: function(input) {
        this.pX = input.deltaX;
        this.pY = input.deltaY;
        var direction = directionStr(input.direction);
        if (direction) {
          this.manager.emit(this.options.event + direction, input);
        }
        this._super.emit.call(this, input);
      }
    });
    function PinchRecognizer() {
      AttrRecognizer.apply(this, arguments);
    }
    inherit(PinchRecognizer, AttrRecognizer, {
      defaults: {
        event: "pinch",
        threshold: 0,
        pointers: 2
      },
      getTouchAction: function() {
        return [TOUCH_ACTION_NONE];
      },
      attrTest: function(input) {
        return this._super.attrTest.call(this, input) && (Math.abs(input.scale - 1) > this.options.threshold || this.state & STATE_BEGAN);
      },
      emit: function(input) {
        this._super.emit.call(this, input);
        if (input.scale !== 1) {
          var inOut = input.scale < 1 ? "in" : "out";
          this.manager.emit(this.options.event + inOut, input);
        }
      }
    });
    function PressRecognizer() {
      Recognizer.apply(this, arguments);
      this._timer = null;
      this._input = null;
    }
    inherit(PressRecognizer, Recognizer, {
      defaults: {
        event: "press",
        pointers: 1,
        time: 500,
        threshold: 5
      },
      getTouchAction: function() {
        return [TOUCH_ACTION_AUTO];
      },
      process: function(input) {
        var options = this.options;
        var validPointers = input.pointers.length === options.pointers;
        var validMovement = input.distance < options.threshold;
        var validTime = input.deltaTime > options.time;
        this._input = input;
        if (!validMovement || !validPointers || input.eventType & (INPUT_END | INPUT_CANCEL) && !validTime) {
          this.reset();
        } else if (input.eventType & INPUT_START) {
          this.reset();
          this._timer = setTimeoutContext(function() {
            this.state = STATE_RECOGNIZED;
            this.tryEmit();
          }, options.time, this);
        } else if (input.eventType & INPUT_END) {
          return STATE_RECOGNIZED;
        }
        return STATE_FAILED;
      },
      reset: function() {
        clearTimeout(this._timer);
      },
      emit: function(input) {
        if (this.state !== STATE_RECOGNIZED) {
          return;
        }
        if (input && input.eventType & INPUT_END) {
          this.manager.emit(this.options.event + "up", input);
        } else {
          this._input.timeStamp = now2();
          this.manager.emit(this.options.event, this._input);
        }
      }
    });
    function RotateRecognizer() {
      AttrRecognizer.apply(this, arguments);
    }
    inherit(RotateRecognizer, AttrRecognizer, {
      defaults: {
        event: "rotate",
        threshold: 0,
        pointers: 2
      },
      getTouchAction: function() {
        return [TOUCH_ACTION_NONE];
      },
      attrTest: function(input) {
        return this._super.attrTest.call(this, input) && (Math.abs(input.rotation) > this.options.threshold || this.state & STATE_BEGAN);
      }
    });
    function SwipeRecognizer() {
      AttrRecognizer.apply(this, arguments);
    }
    inherit(SwipeRecognizer, AttrRecognizer, {
      defaults: {
        event: "swipe",
        threshold: 10,
        velocity: 0.65,
        direction: DIRECTION_HORIZONTAL | DIRECTION_VERTICAL,
        pointers: 1
      },
      getTouchAction: function() {
        return PanRecognizer.prototype.getTouchAction.call(this);
      },
      attrTest: function(input) {
        var direction = this.options.direction;
        var velocity;
        if (direction & (DIRECTION_HORIZONTAL | DIRECTION_VERTICAL)) {
          velocity = input.velocity;
        } else if (direction & DIRECTION_HORIZONTAL) {
          velocity = input.velocityX;
        } else if (direction & DIRECTION_VERTICAL) {
          velocity = input.velocityY;
        }
        return this._super.attrTest.call(this, input) && direction & input.direction && input.distance > this.options.threshold && abs(velocity) > this.options.velocity && input.eventType & INPUT_END;
      },
      emit: function(input) {
        var direction = directionStr(input.direction);
        if (direction) {
          this.manager.emit(this.options.event + direction, input);
        }
        this.manager.emit(this.options.event, input);
      }
    });
    function TapRecognizer() {
      Recognizer.apply(this, arguments);
      this.pTime = false;
      this.pCenter = false;
      this._timer = null;
      this._input = null;
      this.count = 0;
    }
    inherit(TapRecognizer, Recognizer, {
      defaults: {
        event: "tap",
        pointers: 1,
        taps: 1,
        interval: 300,
        time: 250,
        threshold: 2,
        posThreshold: 10
      },
      getTouchAction: function() {
        return [TOUCH_ACTION_MANIPULATION];
      },
      process: function(input) {
        var options = this.options;
        var validPointers = input.pointers.length === options.pointers;
        var validMovement = input.distance < options.threshold;
        var validTouchTime = input.deltaTime < options.time;
        this.reset();
        if (input.eventType & INPUT_START && this.count === 0) {
          return this.failTimeout();
        }
        if (validMovement && validTouchTime && validPointers) {
          if (input.eventType != INPUT_END) {
            return this.failTimeout();
          }
          var validInterval = this.pTime ? input.timeStamp - this.pTime < options.interval : true;
          var validMultiTap = !this.pCenter || getDistance(this.pCenter, input.center) < options.posThreshold;
          this.pTime = input.timeStamp;
          this.pCenter = input.center;
          if (!validMultiTap || !validInterval) {
            this.count = 1;
          } else {
            this.count += 1;
          }
          this._input = input;
          var tapCount = this.count % options.taps;
          if (tapCount === 0) {
            if (!this.hasRequireFailures()) {
              return STATE_RECOGNIZED;
            } else {
              this._timer = setTimeoutContext(function() {
                this.state = STATE_RECOGNIZED;
                this.tryEmit();
              }, options.interval, this);
              return STATE_BEGAN;
            }
          }
        }
        return STATE_FAILED;
      },
      failTimeout: function() {
        this._timer = setTimeoutContext(function() {
          this.state = STATE_FAILED;
        }, this.options.interval, this);
        return STATE_FAILED;
      },
      reset: function() {
        clearTimeout(this._timer);
      },
      emit: function() {
        if (this.state == STATE_RECOGNIZED) {
          this._input.tapCount = this.count;
          this.manager.emit(this.options.event, this._input);
        }
      }
    });
    function Hammer2(element2, options) {
      options = options || {};
      options.recognizers = ifUndefined(options.recognizers, Hammer2.defaults.preset);
      return new Manager(element2, options);
    }
    Hammer2.VERSION = "2.0.4";
    Hammer2.defaults = {
      domEvents: false,
      touchAction: TOUCH_ACTION_COMPUTE,
      enable: true,
      inputTarget: null,
      inputClass: null,
      preset: [
        [RotateRecognizer, { enable: false }],
        [PinchRecognizer, { enable: false }, ["rotate"]],
        [SwipeRecognizer, { direction: DIRECTION_HORIZONTAL }],
        [PanRecognizer, { direction: DIRECTION_HORIZONTAL }, ["swipe"]],
        [TapRecognizer],
        [TapRecognizer, { event: "doubletap", taps: 2 }, ["tap"]],
        [PressRecognizer]
      ],
      cssProps: {
        userSelect: "none",
        touchSelect: "none",
        touchCallout: "none",
        contentZooming: "none",
        userDrag: "none",
        tapHighlightColor: "rgba(0,0,0,0)"
      }
    };
    var STOP = 1;
    var FORCED_STOP = 2;
    function Manager(element2, options) {
      options = options || {};
      this.options = merge(options, Hammer2.defaults);
      this.options.inputTarget = this.options.inputTarget || element2;
      this.handlers = {};
      this.session = {};
      this.recognizers = [];
      this.element = element2;
      this.input = createInputInstance(this);
      this.touchAction = new TouchAction(this, this.options.touchAction);
      toggleCssProps(this, true);
      each(options.recognizers, function(item) {
        var recognizer = this.add(new item[0](item[1]));
        item[2] && recognizer.recognizeWith(item[2]);
        item[3] && recognizer.requireFailure(item[3]);
      }, this);
    }
    Manager.prototype = {
      set: function(options) {
        extend2(this.options, options);
        if (options.touchAction) {
          this.touchAction.update();
        }
        if (options.inputTarget) {
          this.input.destroy();
          this.input.target = options.inputTarget;
          this.input.init();
        }
        return this;
      },
      stop: function(force) {
        this.session.stopped = force ? FORCED_STOP : STOP;
      },
      recognize: function(inputData) {
        var session = this.session;
        if (session.stopped) {
          return;
        }
        this.touchAction.preventDefaults(inputData);
        var recognizer;
        var recognizers = this.recognizers;
        var curRecognizer = session.curRecognizer;
        if (!curRecognizer || curRecognizer && curRecognizer.state & STATE_RECOGNIZED) {
          curRecognizer = session.curRecognizer = null;
        }
        var i2 = 0;
        while (i2 < recognizers.length) {
          recognizer = recognizers[i2];
          if (session.stopped !== FORCED_STOP && (!curRecognizer || recognizer == curRecognizer || recognizer.canRecognizeWith(curRecognizer))) {
            recognizer.recognize(inputData);
          } else {
            recognizer.reset();
          }
          if (!curRecognizer && recognizer.state & (STATE_BEGAN | STATE_CHANGED | STATE_ENDED)) {
            curRecognizer = session.curRecognizer = recognizer;
          }
          i2++;
        }
      },
      get: function(recognizer) {
        if (recognizer instanceof Recognizer) {
          return recognizer;
        }
        var recognizers = this.recognizers;
        for (var i2 = 0; i2 < recognizers.length; i2++) {
          if (recognizers[i2].options.event == recognizer) {
            return recognizers[i2];
          }
        }
        return null;
      },
      add: function(recognizer) {
        if (invokeArrayArg(recognizer, "add", this)) {
          return this;
        }
        var existing = this.get(recognizer.options.event);
        if (existing) {
          this.remove(existing);
        }
        this.recognizers.push(recognizer);
        recognizer.manager = this;
        this.touchAction.update();
        return recognizer;
      },
      remove: function(recognizer) {
        if (invokeArrayArg(recognizer, "remove", this)) {
          return this;
        }
        var recognizers = this.recognizers;
        recognizer = this.get(recognizer);
        recognizers.splice(inArray(recognizers, recognizer), 1);
        this.touchAction.update();
        return this;
      },
      on: function(events, handler) {
        var handlers = this.handlers;
        each(splitStr(events), function(event2) {
          handlers[event2] = handlers[event2] || [];
          handlers[event2].push(handler);
        });
        return this;
      },
      off: function(events, handler) {
        var handlers = this.handlers;
        each(splitStr(events), function(event2) {
          if (!handler) {
            delete handlers[event2];
          } else {
            handlers[event2].splice(inArray(handlers[event2], handler), 1);
          }
        });
        return this;
      },
      emit: function(event2, data) {
        if (this.options.domEvents) {
          triggerDomEvent(event2, data);
        }
        var handlers = this.handlers[event2] && this.handlers[event2].slice();
        if (!handlers || !handlers.length) {
          return;
        }
        data.type = event2;
        data.preventDefault = function() {
          data.srcEvent.preventDefault();
        };
        var i2 = 0;
        while (i2 < handlers.length) {
          handlers[i2](data);
          i2++;
        }
      },
      destroy: function() {
        this.element && toggleCssProps(this, false);
        this.handlers = {};
        this.session = {};
        this.input.destroy();
        this.element = null;
      }
    };
    function toggleCssProps(manager, add2) {
      var element2 = manager.element;
      each(manager.options.cssProps, function(value, name) {
        element2.style[prefixed(element2.style, name)] = add2 ? value : "";
      });
    }
    function triggerDomEvent(event2, data) {
      var gestureEvent = document2.createEvent("Event");
      gestureEvent.initEvent(event2, true, true);
      gestureEvent.gesture = data;
      data.target.dispatchEvent(gestureEvent);
    }
    extend2(Hammer2, {
      INPUT_START,
      INPUT_MOVE,
      INPUT_END,
      INPUT_CANCEL,
      STATE_POSSIBLE,
      STATE_BEGAN,
      STATE_CHANGED,
      STATE_ENDED,
      STATE_RECOGNIZED,
      STATE_CANCELLED,
      STATE_FAILED,
      DIRECTION_NONE,
      DIRECTION_LEFT,
      DIRECTION_RIGHT,
      DIRECTION_UP,
      DIRECTION_DOWN,
      DIRECTION_HORIZONTAL,
      DIRECTION_VERTICAL,
      DIRECTION_ALL,
      Manager,
      Input,
      TouchAction,
      TouchInput,
      MouseInput,
      PointerEventInput,
      TouchMouseInput,
      SingleTouchInput,
      Recognizer,
      AttrRecognizer,
      Tap: TapRecognizer,
      Pan: PanRecognizer,
      Swipe: SwipeRecognizer,
      Pinch: PinchRecognizer,
      Rotate: RotateRecognizer,
      Press: PressRecognizer,
      on: addEventListeners,
      off: removeEventListeners,
      each,
      merge,
      extend: extend2,
      inherit,
      bindFn,
      prefixed
    });
    if (typeof undefined$1 == TYPE_FUNCTION && undefined$1.amd) {
      undefined$1(function() {
        return Hammer2;
      });
    } else if (module.exports) {
      module.exports = Hammer2;
    } else {
      window2[exportName] = Hammer2;
    }
  })(window, document, "Hammer");
})(hammer);
var Hammer = hammer.exports;
var nextId = 1;
var idProperty = "MarzipanoHammerElementId";
function getKeyForElementAndType(element2, type2) {
  if (!element2[idProperty]) {
    element2[idProperty] = nextId++;
  }
  return type2 + element2[idProperty];
}
function HammerGestures$4() {
  this._managers = {};
  this._refCount = {};
}
HammerGestures$4.prototype.get = function(element2, type2) {
  var key = getKeyForElementAndType(element2, type2);
  if (!this._managers[key]) {
    this._managers[key] = this._createManager(element2, type2);
    this._refCount[key] = 0;
  }
  this._refCount[key]++;
  return new HammerGesturesHandle(this, this._managers[key], element2, type2);
};
HammerGestures$4.prototype._createManager = function(element2, type2) {
  var manager = new Hammer.Manager(element2);
  if (type2 === "mouse") {
    manager.add(new Hammer.Pan({ direction: Hammer.DIRECTION_ALL, threshold: 0 }));
  } else if (type2 === "touch" || type2 === "pen" || type2 === "kinect") {
    manager.add(new Hammer.Pan({ direction: Hammer.DIRECTION_ALL, threshold: 20, pointers: 1 }));
    manager.add(new Hammer.Pinch());
  }
  return manager;
};
HammerGestures$4.prototype._releaseHandle = function(element2, type2) {
  var key = getKeyForElementAndType(element2, type2);
  if (this._refCount[key]) {
    this._refCount[key]--;
    if (!this._refCount[key]) {
      this._managers[key].destroy();
      delete this._managers[key];
      delete this._refCount[key];
    }
  }
};
function HammerGesturesHandle(hammerGestures, manager, element2, type2) {
  this._manager = manager;
  this._element = element2;
  this._type = type2;
  this._hammerGestures = hammerGestures;
  this._eventHandlers = [];
}
HammerGesturesHandle.prototype.on = function(events, handler) {
  var type2 = this._type;
  var handlerFilteredEvents = function(e) {
    if (type2 === e.pointerType) {
      handler(e);
    }
  };
  this._eventHandlers.push({ events, handler: handlerFilteredEvents });
  this._manager.on(events, handlerFilteredEvents);
};
HammerGesturesHandle.prototype.release = function() {
  for (var i2 = 0; i2 < this._eventHandlers.length; i2++) {
    var eventHandler = this._eventHandlers[i2];
    this._manager.off(eventHandler.events, eventHandler.handler);
  }
  this._hammerGestures._releaseHandle(this._element, this._type);
  this._manager = null;
  this._element = null;
  this._type = null;
  this._hammerGestures = null;
};
HammerGesturesHandle.prototype.manager = function() {
  return this._manager;
};
var HammerGestures_1 = new HammerGestures$4();
function maxFriction$2(friction, velocityX, velocityY, maxFrictionTime, result) {
  var velocity = Math.sqrt(Math.pow(velocityX, 2) + Math.pow(velocityY, 2));
  friction = Math.max(friction, velocity / maxFrictionTime);
  changeVectorNorm(velocityX, velocityY, friction, result);
  result[0] = Math.abs(result[0]);
  result[1] = Math.abs(result[1]);
}
function changeVectorNorm(x, y, n, result) {
  var theta = Math.atan(y / x);
  result[0] = n * Math.cos(theta);
  result[1] = n * Math.sin(theta);
}
var util = {
  maxFriction: maxFriction$2,
  changeVectorNorm
};
var eventEmitter$c = minimalEventEmitter;
var Dynamics$6 = Dynamics_1;
var HammerGestures$3 = HammerGestures_1;
var defaults$7 = defaults_1;
var maxFriction$1 = util.maxFriction;
var clearOwnProperties$c = clearOwnProperties_1;
var defaultOptions$5 = {
  friction: 6,
  maxFrictionTime: 0.3,
  hammerEvent: "pan"
};
var debug$1 = typeof MARZIPANODEBUG !== "undefined" && MARZIPANODEBUG.controls;
function DragControlMethod$1(element2, pointerType, opts) {
  this._element = element2;
  this._opts = defaults$7(opts || {}, defaultOptions$5);
  this._startEvent = null;
  this._lastEvent = null;
  this._active = false;
  this._dynamics = {
    x: new Dynamics$6(),
    y: new Dynamics$6()
  };
  this._hammer = HammerGestures$3.get(element2, pointerType);
  this._hammer.on("hammer.input", this._handleHammerEvent.bind(this));
  if (this._opts.hammerEvent != "pan" && this._opts.hammerEvent != "pinch") {
    throw new Error(this._opts.hammerEvent + " is not a hammerEvent managed in DragControlMethod");
  }
  this._hammer.on(this._opts.hammerEvent + "start", this._handleStart.bind(this));
  this._hammer.on(this._opts.hammerEvent + "move", this._handleMove.bind(this));
  this._hammer.on(this._opts.hammerEvent + "end", this._handleEnd.bind(this));
  this._hammer.on(this._opts.hammerEvent + "cancel", this._handleEnd.bind(this));
}
eventEmitter$c(DragControlMethod$1);
DragControlMethod$1.prototype.destroy = function() {
  this._hammer.release();
  clearOwnProperties$c(this);
};
DragControlMethod$1.prototype._handleHammerEvent = function(e) {
  if (e.isFirst) {
    if (debug$1 && this._active) {
      throw new Error("DragControlMethod active detected when already active");
    }
    this._active = true;
    this.emit("active");
  }
  if (e.isFinal) {
    if (debug$1 && !this._active) {
      throw new Error("DragControlMethod inactive detected when already inactive");
    }
    this._active = false;
    this.emit("inactive");
  }
};
DragControlMethod$1.prototype._handleStart = function(e) {
  e.preventDefault();
  this._startEvent = e;
};
DragControlMethod$1.prototype._handleMove = function(e) {
  e.preventDefault();
  if (this._startEvent) {
    this._updateDynamicsMove(e);
    this.emit("parameterDynamics", "axisScaledX", this._dynamics.x);
    this.emit("parameterDynamics", "axisScaledY", this._dynamics.y);
  }
};
DragControlMethod$1.prototype._handleEnd = function(e) {
  e.preventDefault();
  if (this._startEvent) {
    this._updateDynamicsRelease(e);
    this.emit("parameterDynamics", "axisScaledX", this._dynamics.x);
    this.emit("parameterDynamics", "axisScaledY", this._dynamics.y);
  }
  this._startEvent = false;
  this._lastEvent = false;
};
DragControlMethod$1.prototype._updateDynamicsMove = function(e) {
  var x = e.deltaX;
  var y = e.deltaY;
  var eventToSubtract = this._lastEvent || this._startEvent;
  if (eventToSubtract) {
    x -= eventToSubtract.deltaX;
    y -= eventToSubtract.deltaY;
  }
  var elementRect = this._element.getBoundingClientRect();
  var width = elementRect.right - elementRect.left;
  var height = elementRect.bottom - elementRect.top;
  x /= width;
  y /= height;
  this._dynamics.x.reset();
  this._dynamics.y.reset();
  this._dynamics.x.offset = -x;
  this._dynamics.y.offset = -y;
  this._lastEvent = e;
};
var tmpReleaseFriction$1 = [null, null];
DragControlMethod$1.prototype._updateDynamicsRelease = function(e) {
  var elementRect = this._element.getBoundingClientRect();
  var width = elementRect.right - elementRect.left;
  var height = elementRect.bottom - elementRect.top;
  var x = 1e3 * e.velocityX / width;
  var y = 1e3 * e.velocityY / height;
  this._dynamics.x.reset();
  this._dynamics.y.reset();
  this._dynamics.x.velocity = x;
  this._dynamics.y.velocity = y;
  maxFriction$1(this._opts.friction, this._dynamics.x.velocity, this._dynamics.y.velocity, this._opts.maxFrictionTime, tmpReleaseFriction$1);
  this._dynamics.x.friction = tmpReleaseFriction$1[0];
  this._dynamics.y.friction = tmpReleaseFriction$1[1];
};
var Drag = DragControlMethod$1;
var eventEmitter$b = minimalEventEmitter;
var Dynamics$5 = Dynamics_1;
var HammerGestures$2 = HammerGestures_1;
var defaults$6 = defaults_1;
var maxFriction = util.maxFriction;
var clearOwnProperties$b = clearOwnProperties_1;
var defaultOptions$4 = {
  speed: 8,
  friction: 6,
  maxFrictionTime: 0.3
};
function QtvrControlMethod$1(element2, pointerType, opts) {
  this._element = element2;
  this._opts = defaults$6(opts || {}, defaultOptions$4);
  this._active = false;
  this._hammer = HammerGestures$2.get(element2, pointerType);
  this._dynamics = {
    x: new Dynamics$5(),
    y: new Dynamics$5()
  };
  this._hammer.on("panstart", this._handleStart.bind(this));
  this._hammer.on("panmove", this._handleMove.bind(this));
  this._hammer.on("panend", this._handleRelease.bind(this));
  this._hammer.on("pancancel", this._handleRelease.bind(this));
}
eventEmitter$b(QtvrControlMethod$1);
QtvrControlMethod$1.prototype.destroy = function() {
  this._hammer.release();
  clearOwnProperties$b(this);
};
QtvrControlMethod$1.prototype._handleStart = function(e) {
  e.preventDefault();
  if (!this._active) {
    this._active = true;
    this.emit("active");
  }
};
QtvrControlMethod$1.prototype._handleMove = function(e) {
  e.preventDefault();
  this._updateDynamics(e, false);
};
QtvrControlMethod$1.prototype._handleRelease = function(e) {
  e.preventDefault();
  this._updateDynamics(e, true);
  if (this._active) {
    this._active = false;
    this.emit("inactive");
  }
};
var tmpReleaseFriction = [null, null];
QtvrControlMethod$1.prototype._updateDynamics = function(e, release) {
  var elementRect = this._element.getBoundingClientRect();
  var width = elementRect.right - elementRect.left;
  var height = elementRect.bottom - elementRect.top;
  var maxDim = Math.max(width, height);
  var x = e.deltaX / maxDim * this._opts.speed;
  var y = e.deltaY / maxDim * this._opts.speed;
  this._dynamics.x.reset();
  this._dynamics.y.reset();
  this._dynamics.x.velocity = x;
  this._dynamics.y.velocity = y;
  if (release) {
    maxFriction(this._opts.friction, this._dynamics.x.velocity, this._dynamics.y.velocity, this._opts.maxFrictionTime, tmpReleaseFriction);
    this._dynamics.x.friction = tmpReleaseFriction[0];
    this._dynamics.y.friction = tmpReleaseFriction[1];
  }
  this.emit("parameterDynamics", "x", this._dynamics.x);
  this.emit("parameterDynamics", "y", this._dynamics.y);
};
var Qtvr = QtvrControlMethod$1;
var eventEmitter$a = minimalEventEmitter;
var Dynamics$4 = Dynamics_1;
var defaults$5 = defaults_1;
var clearOwnProperties$a = clearOwnProperties_1;
var defaultOptions$3 = {
  frictionTime: 0.2,
  zoomDelta: 1e-3
};
function ScrollZoomControlMethod$1(element2, opts) {
  this._element = element2;
  this._opts = defaults$5(opts || {}, defaultOptions$3);
  this._dynamics = new Dynamics$4();
  this._eventList = [];
  var fn = this._opts.frictionTime ? this.withSmoothing : this.withoutSmoothing;
  this._wheelListener = fn.bind(this);
  element2.addEventListener("wheel", this._wheelListener);
}
eventEmitter$a(ScrollZoomControlMethod$1);
ScrollZoomControlMethod$1.prototype.destroy = function() {
  this._element.removeEventListener("wheel", this._wheelListener);
  clearOwnProperties$a(this);
};
ScrollZoomControlMethod$1.prototype.withoutSmoothing = function(e) {
  this._dynamics.offset = wheelEventDelta(e) * this._opts.zoomDelta;
  this.emit("parameterDynamics", "zoom", this._dynamics);
  e.preventDefault();
  this.emit("active");
  this.emit("inactive");
};
ScrollZoomControlMethod$1.prototype.withSmoothing = function(e) {
  var currentTime = e.timeStamp;
  this._eventList.push(e);
  while (this._eventList[0].timeStamp < currentTime - this._opts.frictionTime * 1e3) {
    this._eventList.shift(0);
  }
  var velocity = 0;
  for (var i2 = 0; i2 < this._eventList.length; i2++) {
    var zoomChangeFromEvent = wheelEventDelta(this._eventList[i2]) * this._opts.zoomDelta;
    velocity += zoomChangeFromEvent / this._opts.frictionTime;
  }
  this._dynamics.velocity = velocity;
  this._dynamics.friction = Math.abs(velocity) / this._opts.frictionTime;
  this.emit("parameterDynamics", "zoom", this._dynamics);
  e.preventDefault();
  this.emit("active");
  this.emit("inactive");
};
function wheelEventDelta(e) {
  var multiplier = e.deltaMode == 1 ? 20 : 1;
  return e.deltaY * multiplier;
}
var ScrollZoom = ScrollZoomControlMethod$1;
var eventEmitter$9 = minimalEventEmitter;
var Dynamics$3 = Dynamics_1;
var HammerGestures$1 = HammerGestures_1;
var clearOwnProperties$9 = clearOwnProperties_1;
function PinchZoomControlMethod$1(element2, pointerType, opts) {
  this._hammer = HammerGestures$1.get(element2, pointerType);
  this._lastEvent = null;
  this._active = false;
  this._dynamics = new Dynamics$3();
  this._hammer.on("pinchstart", this._handleStart.bind(this));
  this._hammer.on("pinch", this._handleEvent.bind(this));
  this._hammer.on("pinchend", this._handleEnd.bind(this));
  this._hammer.on("pinchcancel", this._handleEnd.bind(this));
}
eventEmitter$9(PinchZoomControlMethod$1);
PinchZoomControlMethod$1.prototype.destroy = function() {
  this._hammer.release();
  clearOwnProperties$9(this);
};
PinchZoomControlMethod$1.prototype._handleStart = function() {
  if (!this._active) {
    this._active = true;
    this.emit("active");
  }
};
PinchZoomControlMethod$1.prototype._handleEnd = function() {
  this._lastEvent = null;
  if (this._active) {
    this._active = false;
    this.emit("inactive");
  }
};
PinchZoomControlMethod$1.prototype._handleEvent = function(e) {
  var scale2 = e.scale;
  if (this._lastEvent) {
    scale2 /= this._lastEvent.scale;
  }
  this._dynamics.offset = (scale2 - 1) * -1;
  this.emit("parameterDynamics", "zoom", this._dynamics);
  this._lastEvent = e;
};
var PinchZoom = PinchZoomControlMethod$1;
var eventEmitter$8 = minimalEventEmitter;
var Dynamics$2 = Dynamics_1;
var clearOwnProperties$8 = clearOwnProperties_1;
function VelocityControlMethod(parameter) {
  if (!parameter) {
    throw new Error("VelocityControlMethod: parameter must be defined");
  }
  this._parameter = parameter;
  this._dynamics = new Dynamics$2();
}
eventEmitter$8(VelocityControlMethod);
VelocityControlMethod.prototype.destroy = function() {
  clearOwnProperties$8(this);
};
VelocityControlMethod.prototype.setVelocity = function(velocity) {
  this._dynamics.velocity = velocity;
  this.emit("parameterDynamics", this._parameter, this._dynamics);
};
VelocityControlMethod.prototype.setFriction = function(friction) {
  this._dynamics.friction = friction;
  this.emit("parameterDynamics", this._parameter, this._dynamics);
};
var Velocity = VelocityControlMethod;
var eventEmitter$7 = minimalEventEmitter;
var Dynamics$1 = Dynamics_1;
var clearOwnProperties$7 = clearOwnProperties_1;
function ElementPressControlMethod(element2, parameter, velocity, friction) {
  if (!element2) {
    throw new Error("ElementPressControlMethod: element must be defined");
  }
  if (!parameter) {
    throw new Error("ElementPressControlMethod: parameter must be defined");
  }
  if (!velocity) {
    throw new Error("ElementPressControlMethod: velocity must be defined");
  }
  if (!friction) {
    throw new Error("ElementPressControlMethod: friction must be defined");
  }
  this._element = element2;
  this._pressHandler = this._handlePress.bind(this);
  this._releaseHandler = this._handleRelease.bind(this);
  element2.addEventListener("mousedown", this._pressHandler);
  element2.addEventListener("mouseup", this._releaseHandler);
  element2.addEventListener("mouseleave", this._releaseHandler);
  element2.addEventListener("touchstart", this._pressHandler);
  element2.addEventListener("touchmove", this._releaseHandler);
  element2.addEventListener("touchend", this._releaseHandler);
  this._parameter = parameter;
  this._velocity = velocity;
  this._friction = friction;
  this._dynamics = new Dynamics$1();
  this._pressing = false;
}
eventEmitter$7(ElementPressControlMethod);
ElementPressControlMethod.prototype.destroy = function() {
  this._element.removeEventListener("mousedown", this._pressHandler);
  this._element.removeEventListener("mouseup", this._releaseHandler);
  this._element.removeEventListener("mouseleave", this._releaseHandler);
  this._element.removeEventListener("touchstart", this._pressHandler);
  this._element.removeEventListener("touchmove", this._releaseHandler);
  this._element.removeEventListener("touchend", this._releaseHandler);
  clearOwnProperties$7(this);
};
ElementPressControlMethod.prototype._handlePress = function() {
  this._pressing = true;
  this._dynamics.velocity = this._velocity;
  this._dynamics.friction = 0;
  this.emit("parameterDynamics", this._parameter, this._dynamics);
  this.emit("active");
};
ElementPressControlMethod.prototype._handleRelease = function() {
  if (this._pressing) {
    this._dynamics.friction = this._friction;
    this.emit("parameterDynamics", this._parameter, this._dynamics);
    this.emit("inactive");
  }
  this._pressing = false;
};
var ElementPress = ElementPressControlMethod;
var eventEmitter$6 = minimalEventEmitter;
var Dynamics = Dynamics_1;
var now$3 = now$6;
var clearOwnProperties$6 = clearOwnProperties_1;
function ControlComposer(opts) {
  opts = opts || {};
  this._methods = [];
  this._parameters = ["x", "y", "axisScaledX", "axisScaledY", "zoom", "yaw", "pitch", "roll"];
  this._now = opts.nowForTesting || now$3;
  this._composedOffsets = {};
  this._composeReturn = { offsets: this._composedOffsets, changing: null };
}
eventEmitter$6(ControlComposer);
ControlComposer.prototype.add = function(instance2) {
  if (this.has(instance2)) {
    return;
  }
  var dynamics = {};
  this._parameters.forEach(function(parameter) {
    dynamics[parameter] = {
      dynamics: new Dynamics(),
      time: null
    };
  });
  var parameterDynamicsHandler = this._updateDynamics.bind(this, dynamics);
  var method = {
    instance: instance2,
    dynamics,
    parameterDynamicsHandler
  };
  instance2.addEventListener("parameterDynamics", parameterDynamicsHandler);
  this._methods.push(method);
};
ControlComposer.prototype.remove = function(instance2) {
  var index = this._indexOfInstance(instance2);
  if (index >= 0) {
    var method = this._methods.splice(index, 1)[0];
    method.instance.removeEventListener("parameterDynamics", method.parameterDynamicsHandler);
  }
};
ControlComposer.prototype.has = function(instance2) {
  return this._indexOfInstance(instance2) >= 0;
};
ControlComposer.prototype._indexOfInstance = function(instance2) {
  for (var i2 = 0; i2 < this._methods.length; i2++) {
    if (this._methods[i2].instance === instance2) {
      return i2;
    }
  }
  return -1;
};
ControlComposer.prototype.list = function() {
  var instances = [];
  for (var i2 = 0; i2 < this._methods.length; i2++) {
    instances.push(this._methods[i2].instance);
  }
  return instances;
};
ControlComposer.prototype._updateDynamics = function(storedDynamics, parameter, dynamics) {
  var parameterDynamics = storedDynamics[parameter];
  if (!parameterDynamics) {
    throw new Error("Unknown control parameter " + parameter);
  }
  var newTime = this._now();
  parameterDynamics.dynamics.update(dynamics, (newTime - parameterDynamics.time) / 1e3);
  parameterDynamics.time = newTime;
  this.emit("change");
};
ControlComposer.prototype._resetComposedOffsets = function() {
  for (var i2 = 0; i2 < this._parameters.length; i2++) {
    this._composedOffsets[this._parameters[i2]] = 0;
  }
};
ControlComposer.prototype.offsets = function() {
  var parameter;
  var changing = false;
  var currentTime = this._now();
  this._resetComposedOffsets();
  for (var i2 = 0; i2 < this._methods.length; i2++) {
    var methodDynamics = this._methods[i2].dynamics;
    for (var p = 0; p < this._parameters.length; p++) {
      parameter = this._parameters[p];
      var parameterDynamics = methodDynamics[parameter];
      var dynamics = parameterDynamics.dynamics;
      if (dynamics.offset != null) {
        this._composedOffsets[parameter] += dynamics.offset;
        dynamics.offset = null;
      }
      var elapsed = (currentTime - parameterDynamics.time) / 1e3;
      var offsetFromVelocity = dynamics.offsetFromVelocity(elapsed);
      if (offsetFromVelocity) {
        this._composedOffsets[parameter] += offsetFromVelocity;
      }
      var currentVelocity = dynamics.velocityAfter(elapsed);
      dynamics.velocity = currentVelocity;
      if (currentVelocity) {
        changing = true;
      }
      parameterDynamics.time = currentTime;
    }
  }
  this._composeReturn.changing = changing;
  return this._composeReturn;
};
ControlComposer.prototype.destroy = function() {
  var instances = this.list();
  for (var i2 = 0; i2 < instances.length; i2++) {
    this.remove(instances[i2]);
  }
  clearOwnProperties$6(this);
};
var Composer$1 = ControlComposer;
var eventEmitter$5 = minimalEventEmitter;
var Composer = Composer$1;
var clearOwnProperties$5 = clearOwnProperties_1;
var debug = typeof MARZIPANODEBUG !== "undefined" && MARZIPANODEBUG.controls;
function Controls$1(opts) {
  opts = opts || {};
  this._methods = {};
  this._methodGroups = {};
  this._composer = new Composer();
  this._enabled = opts && opts.enabled ? !!opts.enabled : true;
  this._activeCount = 0;
  this.updatedViews_ = [];
  this._attachedRenderLoop = null;
}
eventEmitter$5(Controls$1);
Controls$1.prototype.destroy = function() {
  this.detach();
  this._composer.destroy();
  clearOwnProperties$5(this);
};
Controls$1.prototype.methods = function() {
  var obj = {};
  for (var id in this._methods) {
    obj[id] = this._methods[id];
  }
  return obj;
};
Controls$1.prototype.method = function(id) {
  return this._methods[id];
};
Controls$1.prototype.registerMethod = function(id, instance2, enable) {
  if (this._methods[id]) {
    throw new Error("Control method already registered with id " + id);
  }
  this._methods[id] = {
    instance: instance2,
    enabled: false,
    active: false,
    activeHandler: this._handleActive.bind(this, id),
    inactiveHandler: this._handleInactive.bind(this, id)
  };
  if (enable) {
    this.enableMethod(id, instance2);
  }
};
Controls$1.prototype.unregisterMethod = function(id) {
  var method = this._methods[id];
  if (!method) {
    throw new Error("No control method registered with id " + id);
  }
  if (method.enabled) {
    this.disableMethod(id);
  }
  delete this._methods[id];
};
Controls$1.prototype.enableMethod = function(id) {
  var method = this._methods[id];
  if (!method) {
    throw new Error("No control method registered with id " + id);
  }
  if (method.enabled) {
    return;
  }
  method.enabled = true;
  if (method.active) {
    this._incrementActiveCount();
  }
  this._listen(id);
  this._updateComposer();
  this.emit("methodEnabled", id);
};
Controls$1.prototype.disableMethod = function(id) {
  var method = this._methods[id];
  if (!method) {
    throw new Error("No control method registered with id " + id);
  }
  if (!method.enabled) {
    return;
  }
  method.enabled = false;
  if (method.active) {
    this._decrementActiveCount();
  }
  this._unlisten(id);
  this._updateComposer();
  this.emit("methodDisabled", id);
};
Controls$1.prototype.addMethodGroup = function(groupId, methodIds) {
  this._methodGroups[groupId] = methodIds;
};
Controls$1.prototype.removeMethodGroup = function(id) {
  delete this._methodGroups[id];
};
Controls$1.prototype.methodGroups = function() {
  var obj = {};
  for (var id in this._methodGroups) {
    obj[id] = this._methodGroups[id];
  }
  return obj;
};
Controls$1.prototype.enableMethodGroup = function(id) {
  var self2 = this;
  self2._methodGroups[id].forEach(function(methodId) {
    self2.enableMethod(methodId);
  });
};
Controls$1.prototype.disableMethodGroup = function(id) {
  var self2 = this;
  self2._methodGroups[id].forEach(function(methodId) {
    self2.disableMethod(methodId);
  });
};
Controls$1.prototype.enabled = function() {
  return this._enabled;
};
Controls$1.prototype.enable = function() {
  if (this._enabled) {
    return;
  }
  this._enabled = true;
  if (this._activeCount > 0) {
    this.emit("active");
  }
  this.emit("enabled");
  this._updateComposer();
};
Controls$1.prototype.disable = function() {
  if (!this._enabled) {
    return;
  }
  this._enabled = false;
  if (this._activeCount > 0) {
    this.emit("inactive");
  }
  this.emit("disabled");
  this._updateComposer();
};
Controls$1.prototype.attach = function(renderLoop) {
  if (this._attachedRenderLoop) {
    this.detach();
  }
  this._attachedRenderLoop = renderLoop;
  this._beforeRenderHandler = this._updateViewsWithControls.bind(this);
  this._changeHandler = renderLoop.renderOnNextFrame.bind(renderLoop);
  this._attachedRenderLoop.addEventListener("beforeRender", this._beforeRenderHandler);
  this._composer.addEventListener("change", this._changeHandler);
};
Controls$1.prototype.detach = function() {
  if (!this._attachedRenderLoop) {
    return;
  }
  this._attachedRenderLoop.removeEventListener("beforeRender", this._beforeRenderHandler);
  this._composer.removeEventListener("change", this._changeHandler);
  this._beforeRenderHandler = null;
  this._changeHandler = null;
  this._attachedRenderLoop = null;
};
Controls$1.prototype.attached = function() {
  return this._attachedRenderLoop != null;
};
Controls$1.prototype._listen = function(id) {
  var method = this._methods[id];
  if (!method) {
    throw new Error("Bad method id");
  }
  method.instance.addEventListener("active", method.activeHandler);
  method.instance.addEventListener("inactive", method.inactiveHandler);
};
Controls$1.prototype._unlisten = function(id) {
  var method = this._methods[id];
  if (!method) {
    throw new Error("Bad method id");
  }
  method.instance.removeEventListener("active", method.activeHandler);
  method.instance.removeEventListener("inactive", method.inactiveHandler);
};
Controls$1.prototype._handleActive = function(id) {
  var method = this._methods[id];
  if (!method) {
    throw new Error("Bad method id");
  }
  if (!method.enabled) {
    throw new Error("Should not receive event from disabled control method");
  }
  if (!method.active) {
    method.active = true;
    this._incrementActiveCount();
  }
};
Controls$1.prototype._handleInactive = function(id) {
  var method = this._methods[id];
  if (!method) {
    throw new Error("Bad method id");
  }
  if (!method.enabled) {
    throw new Error("Should not receive event from disabled control method");
  }
  if (method.active) {
    method.active = false;
    this._decrementActiveCount();
  }
};
Controls$1.prototype._incrementActiveCount = function() {
  this._activeCount++;
  if (debug) {
    this._checkActiveCount();
  }
  if (this._enabled && this._activeCount === 1) {
    this.emit("active");
  }
};
Controls$1.prototype._decrementActiveCount = function() {
  this._activeCount--;
  if (debug) {
    this._checkActiveCount();
  }
  if (this._enabled && this._activeCount === 0) {
    this.emit("inactive");
  }
};
Controls$1.prototype._checkActiveCount = function() {
  var count = 0;
  for (var id in this._methods) {
    var method = this._methods[id];
    if (method.enabled && method.active) {
      count++;
    }
  }
  if (count != this._activeCount) {
    throw new Error("Bad control state");
  }
};
Controls$1.prototype._updateComposer = function() {
  var composer = this._composer;
  for (var id in this._methods) {
    var method = this._methods[id];
    var enabled = this._enabled && method.enabled;
    if (enabled && !composer.has(method.instance)) {
      composer.add(method.instance);
    }
    if (!enabled && composer.has(method.instance)) {
      composer.remove(method.instance);
    }
  }
};
Controls$1.prototype._updateViewsWithControls = function() {
  var controlData = this._composer.offsets();
  if (controlData.changing) {
    this._attachedRenderLoop.renderOnNextFrame();
  }
  this.updatedViews_.length = 0;
  var layers = this._attachedRenderLoop.stage().listLayers();
  for (var i2 = 0; i2 < layers.length; i2++) {
    var view = layers[i2].view();
    if (this.updatedViews_.indexOf(view) < 0) {
      layers[i2].view().updateWithControlParameters(controlData.offsets);
      this.updatedViews_.push(view);
    }
  }
};
var Controls_1 = Controls$1;
var setTransform$1 = dom.setTransform;
var decimal = decimal_1;
function positionAbsolutely$2(element2, x, y, extraTransforms) {
  extraTransforms = extraTransforms || "";
  var transform = "translateX(" + decimal(x) + "px) translateY(" + decimal(y) + "px) translateZ(0) " + extraTransforms;
  setTransform$1(element2, transform);
}
var positionAbsolutely_1 = positionAbsolutely$2;
var eventEmitter$4 = minimalEventEmitter;
var positionAbsolutely$1 = positionAbsolutely_1;
var setTransform = dom.setTransform;
var clearOwnProperties$4 = clearOwnProperties_1;
function Hotspot$1(domElement, parentDomElement, view, coords, opts) {
  opts = opts || {};
  opts.perspective = opts.perspective || {};
  opts.perspective.extraTransforms = opts.perspective.extraTransforms != null ? opts.perspective.extraTransforms : "";
  this._domElement = domElement;
  this._parentDomElement = parentDomElement;
  this._view = view;
  this._coords = {};
  this._perspective = {};
  this.setPosition(coords);
  this._parentDomElement.appendChild(this._domElement);
  this.setPerspective(opts.perspective);
  this._visible = true;
  this._position = { x: 0, y: 0 };
}
eventEmitter$4(Hotspot$1);
Hotspot$1.prototype.destroy = function() {
  this._parentDomElement.removeChild(this._domElement);
  clearOwnProperties$4(this);
};
Hotspot$1.prototype.domElement = function() {
  return this._domElement;
};
Hotspot$1.prototype.position = function() {
  return this._coords;
};
Hotspot$1.prototype.setPosition = function(coords) {
  for (var key in coords) {
    this._coords[key] = coords[key];
  }
  this._update();
};
Hotspot$1.prototype.perspective = function() {
  return this._perspective;
};
Hotspot$1.prototype.setPerspective = function(perspective2) {
  for (var key in perspective2) {
    this._perspective[key] = perspective2[key];
  }
  this._update();
};
Hotspot$1.prototype.show = function() {
  if (!this._visible) {
    this._visible = true;
    this._update();
  }
};
Hotspot$1.prototype.hide = function() {
  if (this._visible) {
    this._visible = false;
    this._update();
  }
};
Hotspot$1.prototype._update = function() {
  var element2 = this._domElement;
  var params = this._coords;
  var position = this._position;
  var x, y;
  var isVisible = false;
  if (this._visible) {
    var view = this._view;
    if (this._perspective.radius) {
      isVisible = true;
      this._setEmbeddedPosition(view, params);
    } else {
      view.coordinatesToScreen(params, position);
      x = position.x;
      y = position.y;
      if (x != null && y != null) {
        isVisible = true;
        this._setPosition(x, y);
      }
    }
  }
  if (isVisible) {
    element2.style.display = "block";
    element2.style.position = "absolute";
  } else {
    element2.style.display = "none";
    element2.style.position = "";
  }
};
Hotspot$1.prototype._setEmbeddedPosition = function(view, params) {
  var transform = view.coordinatesToPerspectiveTransform(params, this._perspective.radius, this._perspective.extraTransforms);
  setTransform(this._domElement, transform);
};
Hotspot$1.prototype._setPosition = function(x, y) {
  positionAbsolutely$1(this._domElement, x, y, this._perspective.extraTransforms);
};
var Hotspot_1 = Hotspot$1;
var eventEmitter$3 = minimalEventEmitter;
var Hotspot = Hotspot_1;
var calcRect = calcRect_1;
var positionAbsolutely = positionAbsolutely_1;
var setAbsolute$1 = dom.setAbsolute;
var setOverflowHidden$1 = dom.setOverflowHidden;
var setOverflowVisible = dom.setOverflowVisible;
var setNullSize = dom.setNullSize;
var setPixelSize = dom.setPixelSize;
var setPointerEvents = dom.setWithVendorPrefix("pointer-events");
var clearOwnProperties$3 = clearOwnProperties_1;
function HotspotContainer$1(parentDomElement, stage, view, renderLoop, opts) {
  opts = opts || {};
  this._parentDomElement = parentDomElement;
  this._stage = stage;
  this._view = view;
  this._renderLoop = renderLoop;
  this._hotspots = [];
  this._visible = true;
  this._rect = opts.rect;
  this._visibilityOrRectChanged = true;
  this._stageWidth = null;
  this._stageHeight = null;
  this._tmpRect = {};
  this._hotspotContainerWrapper = document.createElement("div");
  setAbsolute$1(this._hotspotContainerWrapper);
  setPointerEvents(this._hotspotContainerWrapper, "none");
  this._parentDomElement.appendChild(this._hotspotContainerWrapper);
  this._hotspotContainer = document.createElement("div");
  setAbsolute$1(this._hotspotContainer);
  setPointerEvents(this._hotspotContainer, "all");
  this._hotspotContainerWrapper.appendChild(this._hotspotContainer);
  this._updateHandler = this._update.bind(this);
  this._renderLoop.addEventListener("afterRender", this._updateHandler);
}
eventEmitter$3(HotspotContainer$1);
HotspotContainer$1.prototype.destroy = function() {
  while (this._hotspots.length) {
    this.destroyHotspot(this._hotspots[0]);
  }
  this._parentDomElement.removeChild(this._hotspotContainerWrapper);
  this._renderLoop.removeEventListener("afterRender", this._updateHandler);
  clearOwnProperties$3(this);
};
HotspotContainer$1.prototype.domElement = function() {
  return this._hotspotContainer;
};
HotspotContainer$1.prototype.setRect = function(rect) {
  this._rect = rect;
  this._visibilityOrRectChanged = true;
};
HotspotContainer$1.prototype.rect = function() {
  return this._rect;
};
HotspotContainer$1.prototype.createHotspot = function(domElement, coords, opts) {
  coords = coords || {};
  var hotspot = new Hotspot(domElement, this._hotspotContainer, this._view, coords, opts);
  this._hotspots.push(hotspot);
  hotspot._update();
  this.emit("hotspotsChange");
  return hotspot;
};
HotspotContainer$1.prototype.hasHotspot = function(hotspot) {
  return this._hotspots.indexOf(hotspot) >= 0;
};
HotspotContainer$1.prototype.listHotspots = function() {
  return [].concat(this._hotspots);
};
HotspotContainer$1.prototype.destroyHotspot = function(hotspot) {
  var i2 = this._hotspots.indexOf(hotspot);
  if (i2 < 0) {
    throw new Error("No such hotspot");
  }
  this._hotspots.splice(i2, 1);
  hotspot.destroy();
  this.emit("hotspotsChange");
};
HotspotContainer$1.prototype.hide = function() {
  if (this._visible) {
    this._visible = false;
    this._visibilityOrRectChanged = true;
    this._update();
  }
};
HotspotContainer$1.prototype.show = function() {
  if (!this._visible) {
    this._visible = true;
    this._visibilityOrRectChanged = true;
    this._update();
  }
};
HotspotContainer$1.prototype._update = function() {
  var wrapper = this._hotspotContainerWrapper;
  var width = this._stage.width();
  var height = this._stage.height();
  var tmpRect = this._tmpRect;
  if (this._visibilityOrRectChanged || this._rect && (width !== this._stageWidth || height !== this._stageHeight)) {
    var visible = this._visible;
    wrapper.style.display = visible ? "block" : "none";
    if (visible) {
      if (this._rect) {
        calcRect(width, height, this._rect, tmpRect);
        positionAbsolutely(wrapper, width * tmpRect.x, height * tmpRect.y);
        setPixelSize(wrapper, width * tmpRect.width, height * tmpRect.height);
        setOverflowHidden$1(wrapper);
      } else {
        positionAbsolutely(wrapper, 0, 0);
        setNullSize(wrapper);
        setOverflowVisible(wrapper);
      }
    }
    this._stageWidth = width;
    this._stageHeight = height;
    this._visibilityOrRectChanged = false;
  }
  for (var i2 = 0; i2 < this._hotspots.length; i2++) {
    this._hotspots[i2]._update();
  }
};
var HotspotContainer_1 = HotspotContainer$1;
var Layer = Layer_1;
var TextureStore = TextureStore_1;
var HotspotContainer = HotspotContainer_1;
var eventEmitter$2 = minimalEventEmitter;
var now$2 = now$6;
var noop$1 = noop_1;
var type = type_1;
var defaults$4 = defaults_1;
var clearOwnProperties$2 = clearOwnProperties_1;
function Scene$1(viewer, view) {
  this._viewer = viewer;
  this._view = view;
  this._layers = [];
  this._hotspotContainer = new HotspotContainer(viewer._controlContainer, viewer.stage(), this._view, viewer.renderLoop());
  this._movement = null;
  this._movementStartTime = null;
  this._movementStep = null;
  this._movementParams = null;
  this._movementCallback = null;
  this._updateMovementHandler = this._updateMovement.bind(this);
  this._updateHotspotContainerHandler = this._updateHotspotContainer.bind(this);
  this._viewer.addEventListener("sceneChange", this._updateHotspotContainerHandler);
  this._viewChangeHandler = this.emit.bind(this, "viewChange");
  this._view.addEventListener("change", this._viewChangeHandler);
  this._updateHotspotContainer();
}
eventEmitter$2(Scene$1);
Scene$1.prototype.destroy = function() {
  this._view.removeEventListener("change", this._viewChangeHandler);
  this._viewer.removeEventListener("sceneChange", this._updateHotspotContainerHandler);
  if (this._movement) {
    this.stopMovement();
  }
  this._hotspotContainer.destroy();
  this.destroyAllLayers();
  clearOwnProperties$2(this);
};
Scene$1.prototype.hotspotContainer = function() {
  return this._hotspotContainer;
};
Scene$1.prototype.layer = function() {
  return this._layers[0];
};
Scene$1.prototype.listLayers = function() {
  return [].concat(this._layers);
};
Scene$1.prototype.view = function() {
  return this._view;
};
Scene$1.prototype.viewer = function() {
  return this._viewer;
};
Scene$1.prototype.visible = function() {
  return this._viewer.scene() === this;
};
Scene$1.prototype.createLayer = function(opts) {
  opts = opts || {};
  var textureStoreOpts = opts.textureStoreOpts || {};
  var layerOpts = opts.layerOpts || {};
  var source = opts.source;
  var geometry = opts.geometry;
  var view = this._view;
  var stage = this._viewer.stage();
  var textureStore = new TextureStore(source, stage, textureStoreOpts);
  var layer = new Layer(source, geometry, view, textureStore, layerOpts);
  this._layers.push(layer);
  if (opts.pinFirstLevel) {
    layer.pinFirstLevel();
  }
  this.emit("layerChange");
  return layer;
};
Scene$1.prototype.destroyLayer = function(layer) {
  var i2 = this._layers.indexOf(layer);
  if (i2 < 0) {
    throw new Error("No such layer in scene");
  }
  this._layers.splice(i2, 1);
  this.emit("layerChange");
  layer.textureStore().destroy();
  layer.destroy();
};
Scene$1.prototype.destroyAllLayers = function() {
  while (this._layers.length > 0) {
    this.destroyLayer(this._layers[0]);
  }
};
Scene$1.prototype.switchTo = function(opts, done) {
  return this._viewer.switchScene(this, opts, done);
};
Scene$1.prototype.lookTo = function(params, opts, done) {
  var self2 = this;
  opts = opts || {};
  done = done || noop$1;
  if (type(params) !== "object") {
    throw new Error("Target view parameters must be an object");
  }
  var easeInOutQuad = function(k) {
    if ((k *= 2) < 1) {
      return 0.5 * k * k;
    }
    return -0.5 * (--k * (k - 2) - 1);
  };
  var ease = opts.ease != null ? opts.ease : easeInOutQuad;
  var controlsInterrupt = opts.controlsInterrupt != null ? opts.controlsInterrupt : false;
  var duration = opts.transitionDuration != null ? opts.transitionDuration : 1e3;
  var shortest = opts.shortest != null ? opts.shortest : true;
  var view = this._view;
  var initialParams = view.parameters();
  var finalParams = {};
  defaults$4(finalParams, params);
  defaults$4(finalParams, initialParams);
  if (shortest && view.normalizeToClosest) {
    view.normalizeToClosest(finalParams, finalParams);
  }
  var movement = function() {
    var finalUpdate = false;
    return function(params2, elapsed) {
      if (elapsed >= duration && finalUpdate) {
        return null;
      }
      var delta = Math.min(elapsed / duration, 1);
      for (var param in params2) {
        var start = initialParams[param];
        var end = finalParams[param];
        params2[param] = start + ease(delta) * (end - start);
      }
      finalUpdate = elapsed >= duration;
      return params2;
    };
  };
  var reenableControls = this._viewer.controls().enabled();
  if (!controlsInterrupt) {
    this._viewer.controls().disable();
  }
  this.startMovement(movement, function() {
    if (reenableControls) {
      self2._viewer.controls().enable();
    }
    done();
  });
};
Scene$1.prototype.startMovement = function(fn, done) {
  var renderLoop = this._viewer.renderLoop();
  if (this._movement) {
    this.stopMovement();
  }
  var step = fn();
  if (typeof step !== "function") {
    throw new Error("Bad movement");
  }
  this._movement = fn;
  this._movementStep = step;
  this._movementStartTime = now$2();
  this._movementParams = {};
  this._movementCallback = done;
  renderLoop.addEventListener("beforeRender", this._updateMovementHandler);
  renderLoop.renderOnNextFrame();
};
Scene$1.prototype.stopMovement = function() {
  var done = this._movementCallback;
  var renderLoop = this._viewer.renderLoop();
  if (!this._movement) {
    return;
  }
  this._movement = null;
  this._movementStep = null;
  this._movementStartTime = null;
  this._movementParams = null;
  this._movementCallback = null;
  renderLoop.removeEventListener("beforeRender", this._updateMovementHandler);
  if (done) {
    done();
  }
};
Scene$1.prototype.movement = function() {
  return this._movement;
};
Scene$1.prototype._updateMovement = function() {
  if (!this._movement) {
    throw new Error("Should not call update");
  }
  var renderLoop = this._viewer.renderLoop();
  var view = this._view;
  var elapsed = now$2() - this._movementStartTime;
  var step = this._movementStep;
  var params = this._movementParams;
  params = view.parameters(params);
  params = step(params, elapsed);
  if (params == null) {
    this.stopMovement();
  } else {
    view.setParameters(params);
    renderLoop.renderOnNextFrame();
  }
};
Scene$1.prototype._updateHotspotContainer = function() {
  if (this.visible()) {
    this._hotspotContainer.show();
  } else {
    this._hotspotContainer.hide();
  }
};
var Scene_1 = Scene$1;
var eventEmitter$1 = minimalEventEmitter;
var defaults$3 = defaults_1;
var now$1 = now$6;
var defaultOptions$2 = {
  duration: Infinity
};
function Timer$1(opts) {
  opts = defaults$3(opts || {}, defaultOptions$2);
  this._duration = opts.duration;
  this._startTime = null;
  this._handle = null;
  this._check = this._check.bind(this);
}
eventEmitter$1(Timer$1);
Timer$1.prototype.start = function() {
  this._startTime = now$1();
  if (this._handle == null && this._duration < Infinity) {
    this._setup(this._duration);
  }
};
Timer$1.prototype.started = function() {
  return this._startTime != null;
};
Timer$1.prototype.stop = function() {
  this._startTime = null;
  if (this._handle != null) {
    clearTimeout(this._handle);
    this._handle = null;
  }
};
Timer$1.prototype._setup = function(interval) {
  this._handle = setTimeout(this._check, interval);
};
Timer$1.prototype._teardown = function() {
  clearTimeout(this._handle);
  this._handle = null;
};
Timer$1.prototype._check = function() {
  var currentTime = now$1();
  var elapsed = currentTime - this._startTime;
  var remaining = this._duration - elapsed;
  this._teardown();
  if (remaining <= 0) {
    this.emit("timeout");
    this._startTime = null;
  } else if (remaining < Infinity) {
    this._setup(remaining);
  }
};
Timer$1.prototype.duration = function() {
  return this._duration;
};
Timer$1.prototype.setDuration = function(duration) {
  this._duration = duration;
  if (this._startTime != null) {
    this._check();
  }
};
var Timer_1 = Timer$1;
var defaults$2 = defaults_1;
var clearOwnProperties$1 = clearOwnProperties_1;
var defaultOpts = {
  active: "move",
  inactive: "default",
  disabled: "default"
};
function ControlCursor$1(controls, id, element2, opts) {
  opts = defaults$2(opts || {}, defaultOpts);
  this._element = element2;
  this._controls = controls;
  this._id = id;
  this._attached = false;
  this._setActiveCursor = this._setCursor.bind(this, opts.active);
  this._setInactiveCursor = this._setCursor.bind(this, opts.inactive);
  this._setDisabledCursor = this._setCursor.bind(this, opts.disabled);
  this._setOriginalCursor = this._setCursor.bind(this, this._element.style.cursor);
  this._updateAttachmentHandler = this._updateAttachment.bind(this);
  controls.addEventListener("methodEnabled", this._updateAttachmentHandler);
  controls.addEventListener("methodDisabled", this._updateAttachmentHandler);
  controls.addEventListener("enabled", this._updateAttachmentHandler);
  controls.addEventListener("disabled", this._updateAttachmentHandler);
  this._updateAttachment();
}
ControlCursor$1.prototype.destroy = function() {
  this._detachFromControlMethod(this._controls.method(this._id));
  this._setOriginalCursor();
  this._controls.removeEventListener("methodEnabled", this._updateAttachmentHandler);
  this._controls.removeEventListener("methodDisabled", this._updateAttachmentHandler);
  this._controls.removeEventListener("enabled", this._updateAttachmentHandler);
  this._controls.removeEventListener("disabled", this._updateAttachmentHandler);
  clearOwnProperties$1(this);
};
ControlCursor$1.prototype._updateAttachment = function() {
  var controls = this._controls;
  var id = this._id;
  if (controls.enabled() && controls.method(id).enabled) {
    this._attachToControlMethod(controls.method(id));
  } else {
    this._detachFromControlMethod(controls.method(id));
  }
};
ControlCursor$1.prototype._attachToControlMethod = function(controlMethod) {
  if (!this._attached) {
    controlMethod.instance.addEventListener("active", this._setActiveCursor);
    controlMethod.instance.addEventListener("inactive", this._setInactiveCursor);
    if (controlMethod.active) {
      this._setActiveCursor();
    } else {
      this._setInactiveCursor();
    }
    this._attached = true;
  }
};
ControlCursor$1.prototype._detachFromControlMethod = function(controlMethod) {
  if (this._attached) {
    controlMethod.instance.removeEventListener("active", this._setActiveCursor);
    controlMethod.instance.removeEventListener("inactive", this._setInactiveCursor);
    this._setDisabledCursor();
    this._attached = false;
  }
};
ControlCursor$1.prototype._setCursor = function(cursor) {
  this._element.style.cursor = cursor;
};
var ControlCursor_1 = ControlCursor$1;
var defaults$1 = defaults_1;
var DragControlMethod = Drag;
var QtvrControlMethod = Qtvr;
var ScrollZoomControlMethod = ScrollZoom;
var PinchZoomControlMethod = PinchZoom;
var KeyControlMethod = Key;
var defaultOptions$1 = {
  mouseViewMode: "drag",
  dragMode: "pan"
};
function registerDefaultControls$1(controls, element2, opts) {
  opts = defaults$1(opts || {}, defaultOptions$1);
  var controlMethods = {
    mouseViewDrag: new DragControlMethod(element2, "mouse"),
    mouseViewQtvr: new QtvrControlMethod(element2, "mouse"),
    leftArrowKey: new KeyControlMethod(37, "x", -0.7, 3),
    rightArrowKey: new KeyControlMethod(39, "x", 0.7, 3),
    upArrowKey: new KeyControlMethod(38, "y", -0.7, 3),
    downArrowKey: new KeyControlMethod(40, "y", 0.7, 3),
    plusKey: new KeyControlMethod(107, "zoom", -0.7, 3),
    minusKey: new KeyControlMethod(109, "zoom", 0.7, 3),
    wKey: new KeyControlMethod(87, "y", -0.7, 3),
    aKey: new KeyControlMethod(65, "x", -0.7, 3),
    sKey: new KeyControlMethod(83, "y", 0.7, 3),
    dKey: new KeyControlMethod(68, "x", 0.7, 3),
    qKey: new KeyControlMethod(81, "roll", 0.7, 3),
    eKey: new KeyControlMethod(69, "roll", -0.7, 3)
  };
  var enabledControls = ["scrollZoom", "touchView", "pinch"];
  if (opts.scrollZoom !== false) {
    controlMethods.scrollZoom = new ScrollZoomControlMethod(element2);
  }
  var controlMethodGroups = {
    arrowKeys: ["leftArrowKey", "rightArrowKey", "upArrowKey", "downArrowKey"],
    plusMinusKeys: ["plusKey", "minusKey"],
    wasdKeys: ["wKey", "aKey", "sKey", "dKey"],
    qeKeys: ["qKey", "eKey"]
  };
  switch (opts.dragMode) {
    case "pinch":
      controlMethods.pinch = new DragControlMethod(element2, "touch", { hammerEvent: "pinch" });
      break;
    case "pan":
      controlMethods.touchView = new DragControlMethod(element2, "touch");
      controlMethods.pinch = new PinchZoomControlMethod(element2, "touch");
      break;
    default:
      throw new Error("Unknown drag mode: " + opts.dragMode);
  }
  switch (opts.mouseViewMode) {
    case "drag":
      enabledControls.push("mouseViewDrag");
      break;
    case "qtvr":
      enabledControls.push("mouseViewQtvr");
      break;
    default:
      throw new Error("Unknown mouse view mode: " + opts.mouseViewMode);
  }
  for (var id in controlMethods) {
    var method = controlMethods[id];
    controls.registerMethod(id, method);
    if (enabledControls.indexOf(id) >= 0) {
      controls.enableMethod(id);
    }
  }
  for (var groupId in controlMethodGroups) {
    var methodGroup = controlMethodGroups[groupId];
    controls.addMethodGroup(groupId, methodGroup);
  }
  return controlMethods;
}
var registerDefaultControls_1 = registerDefaultControls$1;
var now = now$6;
function tween$1(duration, update2, done) {
  var cancelled = false;
  var startTime = now();
  function runUpdate() {
    if (cancelled) {
      return;
    }
    var tweenVal = (now() - startTime) / duration;
    if (tweenVal < 1) {
      update2(tweenVal);
      requestAnimationFrame(runUpdate);
    } else {
      update2(1);
      done();
    }
  }
  update2(0);
  requestAnimationFrame(runUpdate);
  return function cancel() {
    cancelled = true;
    done.apply(null, arguments);
  };
}
var tween_1 = tween$1;
var eventEmitter = minimalEventEmitter;
var RenderLoop = RenderLoop_1;
var Controls = Controls_1;
var Scene = Scene_1;
var Timer = Timer_1;
var WebGlStage = WebGl;
var ControlCursor = ControlCursor_1;
var HammerGestures = HammerGestures_1;
var registerDefaultControls = registerDefaultControls_1;
var registerDefaultRenderers = registerDefaultRenderers_1;
var setOverflowHidden = dom.setOverflowHidden;
var setAbsolute = dom.setAbsolute;
var setFullSize = dom.setFullSize;
var tween = tween_1;
var noop = noop_1;
var clearOwnProperties = clearOwnProperties_1;
function Viewer(domElement, opts) {
  opts = opts || {};
  this._domElement = domElement;
  setOverflowHidden(domElement);
  this._stage = new WebGlStage(opts.stage);
  registerDefaultRenderers(this._stage);
  this._domElement.appendChild(this._stage.domElement());
  this._controlContainer = document.createElement("div");
  setAbsolute(this._controlContainer);
  setFullSize(this._controlContainer);
  domElement.appendChild(this._controlContainer);
  this._size = {};
  this.updateSize();
  this._updateSizeListener = this.updateSize.bind(this);
  window.addEventListener("resize", this._updateSizeListener);
  this._renderLoop = new RenderLoop(this._stage);
  this._controls = new Controls();
  this._controlMethods = registerDefaultControls(this._controls, this._controlContainer, opts.controls);
  this._controls.attach(this._renderLoop);
  this._hammerManagerTouch = HammerGestures.get(this._controlContainer, "touch");
  this._hammerManagerMouse = HammerGestures.get(this._controlContainer, "mouse");
  this._dragCursor = new ControlCursor(this._controls, "mouseViewDrag", domElement, opts.cursors && opts.cursors.drag || {});
  this._renderLoop.start();
  this._scenes = [];
  this._currentScene = null;
  this._replacedScene = null;
  this._cancelCurrentTween = null;
  this._layerChangeHandler = this._updateSceneLayers.bind(this);
  this._viewChangeHandler = this.emit.bind(this, "viewChange");
  this._idleTimer = new Timer();
  this._idleTimer.start();
  this._resetIdleTimerHandler = this._resetIdleTimer.bind(this);
  this.addEventListener("viewChange", this._resetIdleTimerHandler);
  this._triggerIdleTimerHandler = this._triggerIdleTimer.bind(this);
  this._idleTimer.addEventListener("timeout", this._triggerIdleTimerHandler);
  this._stopMovementHandler = this.stopMovement.bind(this);
  this._controls.addEventListener("active", this._stopMovementHandler);
  this.addEventListener("sceneChange", this._stopMovementHandler);
  this._idleMovement = null;
}
eventEmitter(Viewer);
Viewer.prototype.destroy = function() {
  window.removeEventListener("resize", this._updateSizeListener);
  if (this._currentScene) {
    this._removeSceneEventListeners(this._currentScene);
  }
  if (this._replacedScene) {
    this._removeSceneEventListeners(this._replacedScene);
  }
  this._dragCursor.destroy();
  for (var methodName in this._controlMethods) {
    this._controlMethods[methodName].destroy();
  }
  while (this._scenes.length) {
    this.destroyScene(this._scenes[0]);
  }
  this._domElement.removeChild(this._stage.domElement());
  this._stage.destroy();
  this._renderLoop.destroy();
  this._controls.destroy();
  this._controls = null;
  if (this._cancelCurrentTween) {
    this._cancelCurrentTween();
  }
  clearOwnProperties(this);
};
Viewer.prototype.updateSize = function() {
  var size = this._size;
  size.width = this._domElement.clientWidth;
  size.height = this._domElement.clientHeight;
  this._stage.setSize(size);
};
Viewer.prototype.stage = function() {
  return this._stage;
};
Viewer.prototype.renderLoop = function() {
  return this._renderLoop;
};
Viewer.prototype.controls = function() {
  return this._controls;
};
Viewer.prototype.domElement = function() {
  return this._domElement;
};
Viewer.prototype.createScene = function(opts) {
  opts = opts || {};
  var scene = this.createEmptyScene({ view: opts.view });
  scene.createLayer({
    source: opts.source,
    geometry: opts.geometry,
    pinFirstLevel: opts.pinFirstLevel,
    textureStoreOpts: opts.textureStoreOpts,
    layerOpts: opts.layerOpts
  });
  return scene;
};
Viewer.prototype.createEmptyScene = function(opts) {
  opts = opts || {};
  var scene = new Scene(this, opts.view);
  this._scenes.push(scene);
  return scene;
};
Viewer.prototype._updateSceneLayers = function() {
  var i2;
  var layer;
  var stage = this._stage;
  var currentScene = this._currentScene;
  var replacedScene = this._replacedScene;
  var oldLayers = stage.listLayers();
  var newLayers = [];
  if (replacedScene) {
    newLayers = newLayers.concat(replacedScene.listLayers());
  }
  if (currentScene) {
    newLayers = newLayers.concat(currentScene.listLayers());
  }
  if (Math.abs(oldLayers.length - newLayers.length) !== 1) {
    throw new Error("Stage and scene out of sync");
  }
  if (newLayers.length < oldLayers.length) {
    for (i2 = 0; i2 < oldLayers.length; i2++) {
      layer = oldLayers[i2];
      if (newLayers.indexOf(layer) < 0) {
        this._removeLayerFromStage(layer);
        break;
      }
    }
  }
  if (newLayers.length > oldLayers.length) {
    for (i2 = 0; i2 < newLayers.length; i2++) {
      layer = newLayers[i2];
      if (oldLayers.indexOf(layer) < 0) {
        this._addLayerToStage(layer, i2);
      }
    }
  }
};
Viewer.prototype._addLayerToStage = function(layer, i2) {
  layer.pinFirstLevel();
  this._stage.addLayer(layer, i2);
};
Viewer.prototype._removeLayerFromStage = function(layer) {
  this._stage.removeLayer(layer);
  layer.unpinFirstLevel();
  layer.textureStore().clearNotPinned();
};
Viewer.prototype._addSceneEventListeners = function(scene) {
  scene.addEventListener("layerChange", this._layerChangeHandler);
  scene.addEventListener("viewChange", this._viewChangeHandler);
};
Viewer.prototype._removeSceneEventListeners = function(scene) {
  scene.removeEventListener("layerChange", this._layerChangeHandler);
  scene.removeEventListener("viewChange", this._viewChangeHandler);
};
Viewer.prototype.destroyScene = function(scene) {
  var i2 = this._scenes.indexOf(scene);
  if (i2 < 0) {
    throw new Error("No such scene in viewer");
  }
  var j;
  var layers;
  if (this._currentScene === scene) {
    this._removeSceneEventListeners(scene);
    layers = scene.listLayers();
    for (j = 0; j < layers.length; j++) {
      this._removeLayerFromStage(layers[j]);
    }
    if (this._cancelCurrentTween) {
      this._cancelCurrentTween();
      this._cancelCurrentTween = null;
    }
    this._currentScene = null;
    this.emit("sceneChange");
  }
  if (this._replacedScene === scene) {
    this._removeSceneEventListeners(scene);
    layers = scene.listLayers();
    for (j = 0; j < layers.length; j++) {
      this._removeLayerFromStage(layers[j]);
    }
    this._replacedScene = null;
  }
  this._scenes.splice(i2, 1);
  scene.destroy();
};
Viewer.prototype.destroyAllScenes = function() {
  while (this._scenes.length > 0) {
    this.destroyScene(this._scenes[0]);
  }
};
Viewer.prototype.hasScene = function(scene) {
  return this._scenes.indexOf(scene) >= 0;
};
Viewer.prototype.listScenes = function() {
  return [].concat(this._scenes);
};
Viewer.prototype.scene = function() {
  return this._currentScene;
};
Viewer.prototype.view = function() {
  var scene = this._currentScene;
  if (scene) {
    return scene.view();
  }
  return null;
};
Viewer.prototype.lookTo = function(params, opts, done) {
  var scene = this._currentScene;
  if (scene) {
    scene.lookTo(params, opts, done);
  }
};
Viewer.prototype.startMovement = function(fn, done) {
  var scene = this._currentScene;
  if (!scene) {
    return;
  }
  scene.startMovement(fn, done);
};
Viewer.prototype.stopMovement = function() {
  var scene = this._currentScene;
  if (!scene) {
    return;
  }
  scene.stopMovement();
};
Viewer.prototype.movement = function() {
  var scene = this._currentScene;
  if (!scene) {
    return;
  }
  return scene.movement();
};
Viewer.prototype.setIdleMovement = function(timeout, movement) {
  this._idleTimer.setDuration(timeout);
  this._idleMovement = movement;
};
Viewer.prototype.breakIdleMovement = function() {
  this.stopMovement();
  this._resetIdleTimer();
};
Viewer.prototype._resetIdleTimer = function() {
  this._idleTimer.start();
};
Viewer.prototype._triggerIdleTimer = function() {
  var idleMovement = this._idleMovement;
  if (!idleMovement) {
    return;
  }
  this.startMovement(idleMovement);
};
var defaultSwitchDuration = 1e3;
function defaultTransitionUpdate(val, newScene, oldScene) {
  var layers = newScene.listLayers();
  layers.forEach(function(layer) {
    layer.mergeEffects({ opacity: val });
  });
  newScene._hotspotContainer.domElement().style.opacity = val;
}
Viewer.prototype.switchScene = function(newScene, opts, done) {
  var self2 = this;
  opts = opts || {};
  done = done || noop;
  var stage = this._stage;
  var oldScene = this._currentScene;
  if (oldScene === newScene) {
    done();
    return;
  }
  if (this._scenes.indexOf(newScene) < 0) {
    throw new Error("No such scene in viewer");
  }
  if (this._cancelCurrentTween) {
    this._cancelCurrentTween();
    this._cancelCurrentTween = null;
  }
  var oldSceneLayers = oldScene ? oldScene.listLayers() : [];
  var newSceneLayers = newScene.listLayers();
  var stageLayers = stage.listLayers();
  if (oldScene && (stageLayers.length !== oldSceneLayers.length || stageLayers.length > 1 && stageLayers[0] != oldSceneLayers[0])) {
    throw new Error("Stage not in sync with viewer");
  }
  var duration = opts.transitionDuration != null ? opts.transitionDuration : defaultSwitchDuration;
  var update2 = opts.transitionUpdate != null ? opts.transitionUpdate : defaultTransitionUpdate;
  for (var i2 = 0; i2 < newSceneLayers.length; i2++) {
    this._addLayerToStage(newSceneLayers[i2]);
  }
  function tweenUpdate(val) {
    update2(val, newScene, oldScene);
  }
  function tweenDone() {
    if (self2._replacedScene) {
      self2._removeSceneEventListeners(self2._replacedScene);
      oldSceneLayers = self2._replacedScene.listLayers();
      for (var i3 = 0; i3 < oldSceneLayers.length; i3++) {
        self2._removeLayerFromStage(oldSceneLayers[i3]);
      }
      self2._replacedScene = null;
    }
    self2._cancelCurrentTween = null;
    done();
  }
  this._cancelCurrentTween = tween(duration, tweenUpdate, tweenDone);
  this._currentScene = newScene;
  this._replacedScene = oldScene;
  this.emit("sceneChange");
  this.emit("viewChange");
  this._addSceneEventListeners(newScene);
};
var Viewer_1 = Viewer;
var vec4 = require$$61.vec4;
var mat4 = require$$61.mat4;
function identity(resultArg) {
  var result = resultArg || {};
  result.colorOffset = result.colorOffset || vec4.create();
  result.colorMatrix = result.colorMatrix || mat4.create();
  return result;
}
function applyToPixel(pixel, effect, result) {
  vec4TransformMat4Transposed(result, pixel, effect.colorMatrix);
  vec4.add(result, result, effect.colorOffset);
}
function vec4TransformMat4Transposed(out, a, m) {
  var x = a[0], y = a[1], z = a[2], w = a[3];
  out[0] = m[0] * x + m[1] * y + m[2] * z + m[3] * w;
  out[1] = m[4] * x + m[5] * y + m[6] * z + m[7] * w;
  out[2] = m[8] * x + m[9] * y + m[10] * z + m[11] * w;
  out[3] = m[12] * x + m[13] * y + m[14] * z + m[15] * w;
  return out;
}
var tmpPixel = vec4.create();
function applyToImageData(imageData, effect) {
  var width = imageData.width;
  var height = imageData.height;
  var data = imageData.data;
  for (var i2 = 0; i2 < width * height; i2++) {
    vec4.set(tmpPixel, data[i2 * 4 + 0] / 255, data[i2 * 4 + 1] / 255, data[i2 * 4 + 2] / 255, data[i2 * 4 + 3] / 255);
    applyToPixel(tmpPixel, effect, tmpPixel);
    data[i2 * 4 + 0] = tmpPixel[0] * 255;
    data[i2 * 4 + 1] = tmpPixel[1] * 255;
    data[i2 * 4 + 2] = tmpPixel[2] * 255;
    data[i2 * 4 + 3] = tmpPixel[3] * 255;
  }
}
var colorEffects = {
  identity,
  applyToPixel,
  applyToImageData
};
var defaults = defaults_1;
var defaultSpeed = 0.1;
var defaultAccel = 0.01;
var defaultOptions = {
  yawSpeed: defaultSpeed,
  pitchSpeed: defaultSpeed,
  fovSpeed: defaultSpeed,
  yawAccel: defaultAccel,
  pitchAccel: defaultAccel,
  fovAccel: defaultAccel,
  targetPitch: 0,
  targetFov: null
};
function autorotate(opts) {
  opts = defaults(opts || {}, defaultOptions);
  var yawSpeed = opts.yawSpeed;
  var pitchSpeed = opts.pitchSpeed;
  var fovSpeed = opts.fovSpeed;
  var yawAccel = opts.yawAccel;
  var pitchAccel = opts.pitchAccel;
  var fovAccel = opts.fovAccel;
  var targetPitch = opts.targetPitch;
  var targetFov = opts.targetFov;
  return function start() {
    var lastTime = 0;
    var lastYawSpeed = 0;
    var lastPitchSpeed = 0;
    var lastFovSpeed = 0;
    var currentYawSpeed = 0;
    var currentPitchSpeed = 0;
    var currentFovSpeed = 0;
    var timeDelta;
    var yawDelta;
    var pitchDelta;
    var fovDelta;
    return function step(params, currentTime) {
      timeDelta = (currentTime - lastTime) / 1e3;
      currentYawSpeed = Math.min(lastYawSpeed + timeDelta * yawAccel, yawSpeed);
      yawDelta = currentYawSpeed * timeDelta;
      params.yaw = params.yaw + yawDelta;
      if (targetPitch != null && params.pitch !== targetPitch) {
        var pitchThresh = 0.5 * lastPitchSpeed * lastPitchSpeed / pitchAccel;
        if (Math.abs(targetPitch - params.pitch) > pitchThresh) {
          currentPitchSpeed = Math.min(lastPitchSpeed + timeDelta * pitchAccel, pitchSpeed);
        } else {
          currentPitchSpeed = Math.max(lastPitchSpeed - timeDelta * pitchAccel, 0);
        }
        pitchDelta = currentPitchSpeed * timeDelta;
        if (targetPitch < params.pitch) {
          params.pitch = Math.max(targetPitch, params.pitch - pitchDelta);
        }
        if (targetPitch > params.pitch) {
          params.pitch = Math.min(targetPitch, params.pitch + pitchDelta);
        }
      }
      if (targetFov != null && params.fov !== targetPitch) {
        var fovThresh = 0.5 * lastFovSpeed * lastFovSpeed / fovAccel;
        if (Math.abs(targetFov - params.fov) > fovThresh) {
          currentFovSpeed = Math.min(lastFovSpeed + timeDelta * fovAccel, fovSpeed);
        } else {
          currentFovSpeed = Math.max(lastFovSpeed - timeDelta * fovAccel, 0);
        }
        fovDelta = currentFovSpeed * timeDelta;
        if (targetFov < params.fov) {
          params.fov = Math.max(targetFov, params.fov - fovDelta);
        }
        if (targetFov > params.fov) {
          params.fov = Math.min(targetFov, params.fov + fovDelta);
        }
      }
      lastTime = currentTime;
      lastYawSpeed = currentYawSpeed;
      lastPitchSpeed = currentPitchSpeed;
      lastFovSpeed = currentFovSpeed;
      return params;
    };
  };
}
var autorotate_1 = autorotate;
function defer(fn, args) {
  function deferred() {
    if (args && args.length > 0) {
      fn.apply(null, args);
    } else {
      fn();
    }
  }
  setTimeout(deferred, 0);
}
var defer_1 = defer;
function degToRad(deg) {
  return deg * Math.PI / 180;
}
var degToRad_1 = degToRad;
function radToDeg(rad) {
  return rad * 180 / Math.PI;
}
var radToDeg_1 = radToDeg;
var src = {
  WebGlStage: WebGl,
  WebGlCubeRenderer: WebGlCube$1,
  WebGlFlatRenderer: WebGlFlat$1,
  WebGlEquirectRenderer: WebGlEquirect$1,
  registerDefaultRenderers: registerDefaultRenderers_1,
  CubeGeometry: Cube,
  FlatGeometry: Flat$1,
  EquirectGeometry: Equirect,
  RectilinearView: Rectilinear,
  FlatView: Flat,
  ImageUrlSource: ImageUrl,
  SingleAssetSource: SingleAsset,
  StaticAsset: Static,
  DynamicAsset: Dynamic,
  TextureStore: TextureStore_1,
  Layer: Layer_1,
  RenderLoop: RenderLoop_1,
  KeyControlMethod: Key,
  DragControlMethod: Drag,
  QtvrControlMethod: Qtvr,
  ScrollZoomControlMethod: ScrollZoom,
  PinchZoomControlMethod: PinchZoom,
  VelocityControlMethod: Velocity,
  ElementPressControlMethod: ElementPress,
  Controls: Controls_1,
  Dynamics: Dynamics_1,
  Viewer: Viewer_1,
  Scene: Scene_1,
  Hotspot: Hotspot_1,
  HotspotContainer: HotspotContainer_1,
  colorEffects,
  registerDefaultControls: registerDefaultControls_1,
  autorotate: autorotate_1,
  util: {
    async: async_1,
    cancelize: cancelize_1,
    chain: chain_1,
    clamp: clamp_1,
    clearOwnProperties: clearOwnProperties_1,
    cmp: cmp_1,
    compose: compose_1,
    convertFov: convertFov$1,
    decimal: decimal_1,
    defaults: defaults_1,
    defer: defer_1,
    degToRad: degToRad_1,
    delay: delay_1,
    dom,
    extend: extend_1,
    hash: hash_1,
    inherits: inherits_1,
    mod: mod_1,
    noop: noop_1,
    now: now$6,
    once: once_1,
    pixelRatio: pixelRatio_1,
    radToDeg: radToDeg_1,
    real: real_1,
    retry: retry_1,
    tween: tween_1,
    type: type_1
  },
  dependencies: {
    bowser: bowser.exports,
    glMatrix: require$$61,
    eventEmitter: minimalEventEmitter,
    hammerjs: hammer.exports
  }
};
function create_fragment$2(ctx) {
  let div1;
  let div0;
  return {
    c() {
      div1 = element("div");
      div0 = element("div");
      this.c = noop$5;
      attr(div0, "class", "pano");
      attr(div1, "class", "wrap");
    },
    m(target, anchor) {
      insert(target, div1, anchor);
      append(div1, div0);
      ctx[2](div0);
    },
    p: noop$5,
    i: noop$5,
    o: noop$5,
    d(detaching) {
      if (detaching)
        detach(div1);
      ctx[2](null);
    }
  };
}
function instance$2($$self, $$props, $$invalidate) {
  let { gql = {} } = $$props;
  let pano;
  onMount(() => {
    const viewerOpts = { controls: { mouseViewMode: "drag" } };
    const viewer = new src.Viewer(pano, viewerOpts);
    const source = src.ImageUrlSource.fromString(gql.panorama.mediaItemUrl);
    viewer.controls().enableMethodGroup("arrowKeys");
    const geometry = new src.EquirectGeometry([{ width: 4e3 }]);
    const limiter = src.RectilinearView.limit.traditional(1024, 100 * Math.PI / 180);
    const view = new src.RectilinearView({ yaw: Math.PI }, limiter);
    const scene = viewer.createScene({
      source,
      geometry,
      view,
      pinFirstLevel: true
    });
    scene.switchTo();
  });
  function div0_binding($$value) {
    binding_callbacks[$$value ? "unshift" : "push"](() => {
      pano = $$value;
      $$invalidate(0, pano);
    });
  }
  $$self.$$set = ($$props2) => {
    if ("gql" in $$props2)
      $$invalidate(1, gql = $$props2.gql);
  };
  return [pano, gql, div0_binding];
}
class Panorama extends SvelteElement {
  constructor(options) {
    super();
    this.shadowRoot.innerHTML = `<style>*,*:before,*:after{box-sizing:border-box}.wrap{position:relative;padding-bottom:56.25%;height:0;overflow:hidden}.pano{position:absolute;top:0;left:0;width:100%;height:100%}</style>`;
    init(this, {
      target: this.shadowRoot,
      props: attribute_to_object(this.attributes),
      customElement: true
    }, instance$2, create_fragment$2, safe_not_equal, { gql: 1 }, null);
    if (options) {
      if (options.target) {
        insert(options.target, this, options.anchor);
      }
      if (options.props) {
        this.$set(options.props);
        flush();
      }
    }
  }
  static get observedAttributes() {
    return ["gql"];
  }
  get gql() {
    return this.$$.ctx[1];
  }
  set gql(gql) {
    this.$$set({ gql });
    flush();
  }
}
customElements.define("vepple-panorama", Panorama);
window.pannellum = function(window2, document2, undefined$1) {
  function Viewer2(container, initialConfig) {
    var _this = this;
    var config, renderer, preview, draggingHotSpot, isUserInteracting = false, latestInteraction = Date.now(), onPointerDownPointerX = 0, onPointerDownPointerY = 0, onPointerDownPointerDist = -1, onPointerDownYaw = 0, onPointerDownPitch = 0, keysDown = new Array(10), fullscreenActive = false, loaded, error = false, listenersAdded = false, panoImage, prevTime, speed = { "yaw": 0, "pitch": 0, "hfov": 0 }, animating = false, orientation = false, orientationYawOffset = 0, autoRotateStart, autoRotateSpeed = 0, origHfov, origPitch, animatedMove = {}, externalEventListeners = {}, specifiedPhotoSphereExcludes = [], update2 = false, eps = 1e-6, resizeObserver, hotspotsCreated = false, destroyed = false;
    var defaultConfig = {
      hfov: 100,
      minHfov: 50,
      multiResMinHfov: false,
      maxHfov: 120,
      pitch: 0,
      minPitch: undefined$1,
      maxPitch: undefined$1,
      yaw: 0,
      minYaw: -180,
      maxYaw: 180,
      roll: 0,
      haov: 360,
      vaov: 180,
      vOffset: 0,
      autoRotate: false,
      autoRotateInactivityDelay: -1,
      autoRotateStopDelay: undefined$1,
      type: "equirectangular",
      northOffset: 0,
      showFullscreenCtrl: true,
      dynamic: false,
      dynamicUpdate: false,
      doubleClickZoom: true,
      keyboardZoom: true,
      mouseZoom: true,
      showZoomCtrl: true,
      autoLoad: false,
      showControls: true,
      orientationOnByDefault: false,
      hotSpotDebug: false,
      backgroundColor: [0, 0, 0],
      avoidShowingBackground: false,
      animationTimingFunction: timingFunction,
      draggable: true,
      dragConfirm: false,
      disableKeyboardCtrl: false,
      crossOrigin: "anonymous",
      targetBlank: false,
      touchPanSpeedCoeffFactor: 1,
      capturedKeyNumbers: [16, 17, 27, 37, 38, 39, 40, 61, 65, 68, 83, 87, 107, 109, 173, 187, 189],
      friction: 0.15
    };
    defaultConfig.strings = {
      loadButtonLabel: "Click to<br>Load<br>Panorama",
      loadingLabel: "Loading...",
      bylineLabel: "by %s",
      noPanoramaError: "No panorama image was specified.",
      fileAccessError: "The file %s could not be accessed.",
      malformedURLError: "There is something wrong with the panorama URL.",
      iOS8WebGLError: "Due to iOS 8's broken WebGL implementation, only progressive encoded JPEGs work for your device (this panorama uses standard encoding).",
      genericWebGLError: "Your browser does not have the necessary WebGL support to display this panorama.",
      textureSizeError: "This panorama is too big for your device! It's %spx wide, but your device only supports images up to %spx wide. Try another device. (If you're the author, try scaling down the image.)",
      unknownError: "Unknown error. Check developer console.",
      twoTouchActivate: "Use two fingers together to pan the panorama.",
      twoTouchXActivate: "Use two fingers together to pan the panorama horizontally.",
      twoTouchYActivate: "Use two fingers together to pan the panorama vertically.",
      ctrlZoomActivate: "Use %s + scroll to zoom the panorama."
    };
    container = typeof container === "string" ? document2.getElementById(container) : container;
    container.classList.add("pnlm-container");
    container.tabIndex = 0;
    var uiContainer = document2.createElement("div");
    uiContainer.className = "pnlm-ui";
    container.appendChild(uiContainer);
    var renderContainer = document2.createElement("div");
    renderContainer.className = "pnlm-render-container";
    container.appendChild(renderContainer);
    var dragFix = document2.createElement("div");
    dragFix.className = "pnlm-dragfix";
    uiContainer.appendChild(dragFix);
    var aboutMsg = document2.createElement("span");
    aboutMsg.className = "pnlm-about-msg";
    var aboutMsgLink = document2.createElement("a");
    aboutMsgLink.href = "https://pannellum.org/";
    aboutMsgLink.textContent = "Pannellum";
    aboutMsg.appendChild(aboutMsgLink);
    var aboutMsgVersion = document2.createElement("span");
    aboutMsg.appendChild(aboutMsgVersion);
    uiContainer.appendChild(aboutMsg);
    dragFix.addEventListener("contextmenu", aboutMessage);
    var infoDisplay = {};
    var hotSpotDebugIndicator = document2.createElement("div");
    hotSpotDebugIndicator.className = "pnlm-sprite pnlm-hot-spot-debug-indicator";
    uiContainer.appendChild(hotSpotDebugIndicator);
    infoDisplay.container = document2.createElement("div");
    infoDisplay.container.className = "pnlm-panorama-info";
    infoDisplay.title = document2.createElement("div");
    infoDisplay.title.className = "pnlm-title-box";
    infoDisplay.container.appendChild(infoDisplay.title);
    infoDisplay.author = document2.createElement("div");
    infoDisplay.author.className = "pnlm-author-box";
    infoDisplay.container.appendChild(infoDisplay.author);
    uiContainer.appendChild(infoDisplay.container);
    infoDisplay.load = {};
    infoDisplay.load.box = document2.createElement("div");
    infoDisplay.load.box.className = "pnlm-load-box";
    infoDisplay.load.boxp = document2.createElement("p");
    infoDisplay.load.box.appendChild(infoDisplay.load.boxp);
    infoDisplay.load.lbox = document2.createElement("div");
    infoDisplay.load.lbox.className = "pnlm-lbox";
    infoDisplay.load.lbox.innerHTML = '<div class="pnlm-loading"></div>';
    infoDisplay.load.box.appendChild(infoDisplay.load.lbox);
    infoDisplay.load.lbar = document2.createElement("div");
    infoDisplay.load.lbar.className = "pnlm-lbar";
    infoDisplay.load.lbarFill = document2.createElement("div");
    infoDisplay.load.lbarFill.className = "pnlm-lbar-fill";
    infoDisplay.load.lbar.appendChild(infoDisplay.load.lbarFill);
    infoDisplay.load.box.appendChild(infoDisplay.load.lbar);
    infoDisplay.load.msg = document2.createElement("p");
    infoDisplay.load.msg.className = "pnlm-lmsg";
    infoDisplay.load.box.appendChild(infoDisplay.load.msg);
    uiContainer.appendChild(infoDisplay.load.box);
    infoDisplay.errorMsg = document2.createElement("div");
    infoDisplay.errorMsg.className = "pnlm-error-msg pnlm-info-box";
    uiContainer.appendChild(infoDisplay.errorMsg);
    infoDisplay.interactionMsg = document2.createElement("div");
    infoDisplay.interactionMsg.className = "pnlm-interaction-msg pnlm-info-box";
    uiContainer.appendChild(infoDisplay.interactionMsg);
    var controls = {};
    controls.container = document2.createElement("div");
    controls.container.className = "pnlm-controls-container";
    uiContainer.appendChild(controls.container);
    controls.load = document2.createElement("button");
    controls.load.className = "pnlm-load-button";
    controls.load.addEventListener("click", function() {
      processOptions();
      load();
    });
    uiContainer.appendChild(controls.load);
    controls.zoom = document2.createElement("div");
    controls.zoom.className = "pnlm-zoom-controls pnlm-controls";
    controls.zoomIn = document2.createElement("div");
    controls.zoomIn.className = "pnlm-zoom-in pnlm-sprite pnlm-control";
    controls.zoomIn.addEventListener("click", zoomIn);
    controls.zoom.appendChild(controls.zoomIn);
    controls.zoomOut = document2.createElement("div");
    controls.zoomOut.className = "pnlm-zoom-out pnlm-sprite pnlm-control";
    controls.zoomOut.addEventListener("click", zoomOut);
    controls.zoom.appendChild(controls.zoomOut);
    controls.container.appendChild(controls.zoom);
    controls.fullscreen = document2.createElement("div");
    controls.fullscreen.addEventListener("click", toggleFullscreen);
    controls.fullscreen.className = "pnlm-fullscreen-toggle-button pnlm-sprite pnlm-fullscreen-toggle-button-inactive pnlm-controls pnlm-control";
    if (document2.fullscreenEnabled || document2.mozFullScreenEnabled || document2.webkitFullscreenEnabled || document2.msFullscreenEnabled)
      controls.container.appendChild(controls.fullscreen);
    controls.orientation = document2.createElement("div");
    controls.orientation.addEventListener("click", function(e) {
      if (orientation)
        stopOrientation();
      else
        startOrientation();
    });
    controls.orientation.addEventListener("mousedown", function(e) {
      e.stopPropagation();
    });
    controls.orientation.addEventListener("touchstart", function(e) {
      e.stopPropagation();
    });
    controls.orientation.addEventListener("pointerdown", function(e) {
      e.stopPropagation();
    });
    controls.orientation.className = "pnlm-orientation-button pnlm-orientation-button-inactive pnlm-sprite pnlm-controls pnlm-control";
    var orientationSupport = false;
    if (window2.DeviceOrientationEvent && location.protocol == "https:" && navigator.userAgent.toLowerCase().indexOf("mobi") >= 0) {
      controls.container.appendChild(controls.orientation);
      orientationSupport = true;
    }
    var compass = document2.createElement("div");
    compass.className = "pnlm-compass pnlm-controls pnlm-control";
    uiContainer.appendChild(compass);
    if (initialConfig.firstScene) {
      mergeConfig(initialConfig.firstScene);
    } else if (initialConfig.default && initialConfig.default.firstScene) {
      mergeConfig(initialConfig.default.firstScene);
    } else {
      mergeConfig(null);
    }
    processOptions(true);
    function init2() {
      var div2 = document2.createElement("div");
      div2.innerHTML = "<!--[if lte IE 9]><i></i><![endif]-->";
      if (div2.getElementsByTagName("i").length == 1) {
        anError();
        return;
      }
      origHfov = config.hfov;
      origPitch = config.pitch;
      var i2, p;
      if (config.type == "cubemap") {
        panoImage = [];
        for (i2 = 0; i2 < 6; i2++) {
          panoImage.push(new Image());
          panoImage[i2].crossOrigin = config.crossOrigin;
        }
        infoDisplay.load.lbox.style.display = "block";
        infoDisplay.load.lbar.style.display = "none";
      } else if (config.type == "multires") {
        var c = JSON.parse(JSON.stringify(config.multiRes));
        if (config.basePath && config.multiRes.basePath && !/^(?:[a-z]+:)?\/\//i.test(config.multiRes.basePath)) {
          c.basePath = config.basePath + config.multiRes.basePath;
        } else if (config.multiRes.basePath) {
          c.basePath = config.multiRes.basePath;
        } else if (config.basePath) {
          c.basePath = config.basePath;
        }
        panoImage = c;
      } else {
        if (config.dynamic === true) {
          panoImage = config.panorama;
        } else {
          if (config.panorama === undefined$1) {
            anError(config.strings.noPanoramaError);
            return;
          }
          panoImage = new Image();
        }
      }
      if (config.type == "cubemap") {
        var itemsToLoad = 6;
        var onLoad = function() {
          itemsToLoad--;
          if (itemsToLoad === 0) {
            onImageLoad();
          }
        };
        var onError = function(e) {
          var a = document2.createElement("a");
          a.href = e.target.src;
          a.textContent = a.href;
          anError(config.strings.fileAccessError.replace("%s", a.outerHTML));
        };
        for (i2 = 0; i2 < panoImage.length; i2++) {
          p = config.cubeMap[i2];
          if (p == "null") {
            console.log("Will use background instead of missing cubemap face " + i2);
            onLoad();
          } else {
            if (config.basePath && !absoluteURL(p)) {
              p = config.basePath + p;
            }
            panoImage[i2].onload = onLoad;
            panoImage[i2].onerror = onError;
            panoImage[i2].src = sanitizeURL(p);
          }
        }
      } else if (config.type == "multires") {
        onImageLoad();
      } else {
        p = "";
        if (config.basePath) {
          p = config.basePath;
        }
        if (config.dynamic !== true) {
          if (config.panorama instanceof Image || config.panorama instanceof ImageData || window2.ImageBitmap && config.panorama instanceof ImageBitmap) {
            panoImage = config.panorama;
            onImageLoad();
            return;
          }
          p = absoluteURL(config.panorama) ? config.panorama : p + config.panorama;
          panoImage.onload = function() {
            window2.URL.revokeObjectURL(this.src);
            onImageLoad();
          };
          var xhr = new XMLHttpRequest();
          xhr.onloadend = function() {
            if (xhr.status != 200) {
              var a = document2.createElement("a");
              a.href = p;
              a.textContent = a.href;
              anError(config.strings.fileAccessError.replace("%s", a.outerHTML));
            }
            var img = this.response;
            parseGPanoXMP(img, p);
            infoDisplay.load.msg.innerHTML = "";
          };
          xhr.onprogress = function(e) {
            if (e.lengthComputable) {
              var percent = e.loaded / e.total * 100;
              infoDisplay.load.lbarFill.style.width = percent + "%";
              var unit, numerator, denominator;
              if (e.total > 1e6) {
                unit = "MB";
                numerator = (e.loaded / 1e6).toFixed(2);
                denominator = (e.total / 1e6).toFixed(2);
              } else if (e.total > 1e3) {
                unit = "kB";
                numerator = (e.loaded / 1e3).toFixed(1);
                denominator = (e.total / 1e3).toFixed(1);
              } else {
                unit = "B";
                numerator = e.loaded;
                denominator = e.total;
              }
              infoDisplay.load.msg.innerHTML = numerator + " / " + denominator + " " + unit;
            } else {
              infoDisplay.load.lbox.style.display = "block";
              infoDisplay.load.lbar.style.display = "none";
            }
          };
          try {
            xhr.open("GET", p, true);
          } catch (e) {
            anError(config.strings.malformedURLError);
          }
          xhr.responseType = "blob";
          xhr.setRequestHeader("Accept", "image/*,*/*;q=0.9");
          xhr.withCredentials = config.crossOrigin === "use-credentials";
          xhr.send();
        }
      }
      if (config.draggable)
        uiContainer.classList.add("pnlm-grab");
      uiContainer.classList.remove("pnlm-grabbing");
      update2 = config.dynamicUpdate === true;
      if (config.dynamic && update2) {
        panoImage = config.panorama;
        onImageLoad();
      }
    }
    function absoluteURL(url) {
      return new RegExp("^(?:[a-z]+:)?//", "i").test(url) || url[0] == "/" || url.slice(0, 5) == "blob:";
    }
    function onImageLoad() {
      if (!renderer)
        renderer = new libpannellum.renderer(renderContainer);
      if (!listenersAdded) {
        listenersAdded = true;
        dragFix.addEventListener("mousedown", onDocumentMouseDown, false);
        document2.addEventListener("mousemove", onDocumentMouseMove, false);
        document2.addEventListener("mouseup", onDocumentMouseUp, false);
        if (config.mouseZoom) {
          uiContainer.addEventListener("mousewheel", onDocumentMouseWheel, false);
          uiContainer.addEventListener("DOMMouseScroll", onDocumentMouseWheel, false);
        }
        if (config.doubleClickZoom) {
          dragFix.addEventListener("dblclick", onDocumentDoubleClick, false);
        }
        container.addEventListener("mozfullscreenchange", onFullScreenChange, false);
        container.addEventListener("webkitfullscreenchange", onFullScreenChange, false);
        container.addEventListener("msfullscreenchange", onFullScreenChange, false);
        container.addEventListener("fullscreenchange", onFullScreenChange, false);
        if (typeof ResizeObserver === "function") {
          resizeObserver = new ResizeObserver(onDocumentResize);
          resizeObserver.observe(container);
        } else {
          window2.addEventListener("resize", onDocumentResize, false);
          window2.addEventListener("orientationchange", onDocumentResize, false);
        }
        if (!config.disableKeyboardCtrl) {
          container.addEventListener("keydown", onDocumentKeyPress, false);
          container.addEventListener("keyup", onDocumentKeyUp, false);
          container.addEventListener("blur", clearKeys, false);
        }
        document2.addEventListener("mouseleave", onDocumentMouseUp, false);
        if (document2.documentElement.style.pointerAction === "" && document2.documentElement.style.touchAction === "") {
          dragFix.addEventListener("pointerdown", onDocumentPointerDown, false);
          dragFix.addEventListener("pointermove", onDocumentPointerMove, false);
          dragFix.addEventListener("pointerup", onDocumentPointerUp, false);
          dragFix.addEventListener("pointerleave", onDocumentPointerUp, false);
        } else {
          dragFix.addEventListener("touchstart", onDocumentTouchStart, false);
          dragFix.addEventListener("touchmove", onDocumentTouchMove, false);
          dragFix.addEventListener("touchend", onDocumentTouchEnd, false);
        }
        if (window2.navigator.pointerEnabled)
          container.style.touchAction = "none";
      }
      renderInit();
      setHfov(config.hfov);
      setTimeout(function() {
      }, 500);
    }
    function parseGPanoXMP(image, url) {
      var reader = new FileReader();
      reader.addEventListener("loadend", function() {
        var img = reader.result;
        if (navigator.userAgent.toLowerCase().match(/(iphone|ipod|ipad).* os 8_/)) {
          var flagIndex = img.indexOf("\xFF\xC2");
          if (flagIndex < 0 || flagIndex > 65536)
            anError(config.strings.iOS8WebGLError);
        }
        var start = img.indexOf("<x:xmpmeta");
        if (start > -1 && config.ignoreGPanoXMP !== true) {
          var xmpData = img.substring(start, img.indexOf("</x:xmpmeta>") + 12);
          var getTag = function(tag) {
            var result;
            if (xmpData.indexOf(tag + '="') >= 0) {
              result = xmpData.substring(xmpData.indexOf(tag + '="') + tag.length + 2);
              result = result.substring(0, result.indexOf('"'));
            } else if (xmpData.indexOf(tag + ">") >= 0) {
              result = xmpData.substring(xmpData.indexOf(tag + ">") + tag.length + 1);
              result = result.substring(0, result.indexOf("<"));
            }
            if (result !== undefined$1) {
              return Number(result);
            }
            return null;
          };
          var xmp = {
            fullWidth: getTag("GPano:FullPanoWidthPixels"),
            croppedWidth: getTag("GPano:CroppedAreaImageWidthPixels"),
            fullHeight: getTag("GPano:FullPanoHeightPixels"),
            croppedHeight: getTag("GPano:CroppedAreaImageHeightPixels"),
            topPixels: getTag("GPano:CroppedAreaTopPixels"),
            heading: getTag("GPano:PoseHeadingDegrees"),
            horizonPitch: getTag("GPano:PosePitchDegrees"),
            horizonRoll: getTag("GPano:PoseRollDegrees"),
            pitch: getTag("GPano:InitialViewPitchDegrees"),
            yaw: getTag("GPano:InitialViewHeadingDegrees"),
            hfov: getTag("GPano:InitialHorizontalFOVDegrees")
          };
          if (xmp.fullWidth !== null && xmp.croppedWidth !== null && xmp.fullHeight !== null && xmp.croppedHeight !== null && xmp.topPixels !== null) {
            if (specifiedPhotoSphereExcludes.indexOf("haov") < 0)
              config.haov = xmp.croppedWidth / xmp.fullWidth * 360;
            if (specifiedPhotoSphereExcludes.indexOf("vaov") < 0)
              config.vaov = xmp.croppedHeight / xmp.fullHeight * 180;
            if (specifiedPhotoSphereExcludes.indexOf("vOffset") < 0)
              config.vOffset = ((xmp.topPixels + xmp.croppedHeight / 2) / xmp.fullHeight - 0.5) * -180;
            if (xmp.heading !== null && specifiedPhotoSphereExcludes.indexOf("northOffset") < 0) {
              config.northOffset = xmp.heading;
              if (config.compass !== false) {
                config.compass = true;
              }
            }
            if (xmp.horizonPitch !== null && xmp.horizonRoll !== null) {
              if (specifiedPhotoSphereExcludes.indexOf("horizonPitch") < 0)
                config.horizonPitch = xmp.horizonPitch;
              if (specifiedPhotoSphereExcludes.indexOf("horizonRoll") < 0)
                config.horizonRoll = xmp.horizonRoll;
            }
            if (xmp.pitch != null && specifiedPhotoSphereExcludes.indexOf("pitch") < 0)
              config.pitch = xmp.pitch;
            if (xmp.yaw != null && specifiedPhotoSphereExcludes.indexOf("yaw") < 0)
              config.yaw = xmp.yaw;
            if (xmp.hfov != null && specifiedPhotoSphereExcludes.indexOf("hfov") < 0)
              config.hfov = xmp.hfov;
          }
        }
        panoImage.src = window2.URL.createObjectURL(image);
        panoImage.onerror = function() {
          function getCspHeaders() {
            if (!window2.fetch)
              return null;
            return window2.fetch(document2.location.href).then(function(resp) {
              return resp.headers.get("Content-Security-Policy");
            });
          }
          getCspHeaders().then(function(cspHeaders) {
            if (cspHeaders) {
              var invalidImgSource = cspHeaders.split(";").find(function(p) {
                var matchstring = p.match(/img-src(.*)/);
                if (matchstring) {
                  return !matchstring[1].includes("blob");
                }
              });
              if (invalidImgSource) {
                console.log("CSP blocks blobs; reverting to URL.");
                panoImage.crossOrigin = config.crossOrigin;
                panoImage.src = url;
              }
            }
          });
        };
      });
      if (reader.readAsBinaryString !== undefined$1)
        reader.readAsBinaryString(image);
      else
        reader.readAsText(image);
    }
    function anError(errorMsg) {
      if (errorMsg === undefined$1)
        errorMsg = config.strings.genericWebGLError;
      infoDisplay.errorMsg.innerHTML = "<p>" + errorMsg + "</p>";
      controls.load.style.display = "none";
      infoDisplay.load.box.style.display = "none";
      infoDisplay.errorMsg.style.display = "table";
      error = true;
      loaded = undefined$1;
      renderContainer.style.display = "none";
      fireEvent("error", errorMsg);
    }
    function clearError() {
      if (error) {
        infoDisplay.load.box.style.display = "none";
        infoDisplay.errorMsg.style.display = "none";
        error = false;
        renderContainer.style.display = "block";
        fireEvent("errorcleared");
      }
    }
    function showInteractionMessage(interactionMsg) {
      infoDisplay.interactionMsg.style.opacity = 1;
      infoDisplay.interactionMsg.innerHTML = "<p>" + interactionMsg + "</p>";
      infoDisplay.interactionMsg.style.display = "table";
      fireEvent("messageshown");
      clearTimeout(infoDisplay.interactionMsg.timeout);
      infoDisplay.interactionMsg.removeEventListener("transitionend", clearInteractionMessage);
      infoDisplay.interactionMsg.timeout = setTimeout(function() {
        infoDisplay.interactionMsg.style.opacity = 0;
        infoDisplay.interactionMsg.addEventListener("transitionend", clearInteractionMessage);
      }, 2e3);
    }
    function clearInteractionMessage() {
      infoDisplay.interactionMsg.style.opacity = 0;
      infoDisplay.interactionMsg.style.display = "none";
      fireEvent("messagecleared");
    }
    function aboutMessage(event2) {
      var pos = mousePosition(event2);
      aboutMsg.style.left = pos.x + "px";
      aboutMsg.style.top = pos.y + "px";
      clearTimeout(aboutMessage.t1);
      clearTimeout(aboutMessage.t2);
      aboutMsg.style.display = "block";
      aboutMsg.style.opacity = 1;
      aboutMessage.t1 = setTimeout(function() {
        aboutMsg.style.opacity = 0;
      }, 2e3);
      aboutMessage.t2 = setTimeout(function() {
        aboutMsg.style.display = "none";
      }, 2500);
      event2.preventDefault();
    }
    function mousePosition(event2) {
      var bounds = container.getBoundingClientRect();
      var pos = {};
      pos.x = (event2.clientX || event2.pageX) - bounds.left;
      pos.y = (event2.clientY || event2.pageY) - bounds.top;
      return pos;
    }
    function onDocumentMouseDown(event2) {
      event2.preventDefault();
      container.focus();
      if (!loaded || !config.draggable || config.draggingHotSpot) {
        return;
      }
      var pos = mousePosition(event2);
      if (config.hotSpotDebug) {
        var coords = mouseEventToCoords(event2);
        console.log("Pitch: " + coords[0] + ", Yaw: " + coords[1] + ", Center Pitch: " + config.pitch + ", Center Yaw: " + config.yaw + ", HFOV: " + config.hfov);
      }
      stopAnimation();
      stopOrientation();
      config.roll = 0;
      speed.hfov = 0;
      isUserInteracting = true;
      latestInteraction = Date.now();
      onPointerDownPointerX = pos.x;
      onPointerDownPointerY = pos.y;
      onPointerDownYaw = config.yaw;
      onPointerDownPitch = config.pitch;
      uiContainer.classList.add("pnlm-grabbing");
      uiContainer.classList.remove("pnlm-grab");
      fireEvent("mousedown", event2);
      animateInit();
    }
    function onDocumentDoubleClick(event2) {
      if (config.minHfov === config.hfov) {
        _this.setHfov(origHfov, 1e3);
      } else {
        var coords = mouseEventToCoords(event2);
        _this.lookAt(coords[0], coords[1], config.minHfov, 1e3);
      }
    }
    function mouseEventToCoords(event2) {
      var pos = mousePosition(event2);
      var canvas = renderer.getCanvas();
      var canvasWidth = canvas.clientWidth, canvasHeight = canvas.clientHeight;
      var x = pos.x / canvasWidth * 2 - 1;
      var y = (1 - pos.y / canvasHeight * 2) * canvasHeight / canvasWidth;
      var focal = 1 / Math.tan(config.hfov * Math.PI / 360);
      var s = Math.sin(config.pitch * Math.PI / 180);
      var c = Math.cos(config.pitch * Math.PI / 180);
      var a = focal * c - y * s;
      var root = Math.sqrt(x * x + a * a);
      var pitch = Math.atan((y * c + focal * s) / root) * 180 / Math.PI;
      var yaw = Math.atan2(x / root, a / root) * 180 / Math.PI + config.yaw;
      if (yaw < -180)
        yaw += 360;
      if (yaw > 180)
        yaw -= 360;
      return [pitch, yaw];
    }
    function onDocumentMouseMove(event2) {
      if (draggingHotSpot) {
        moveHotSpot(draggingHotSpot, event2);
      } else if (isUserInteracting && loaded) {
        latestInteraction = Date.now();
        var canvas = renderer.getCanvas();
        var canvasWidth = canvas.clientWidth, canvasHeight = canvas.clientHeight;
        var pos = mousePosition(event2);
        var yaw = (Math.atan(onPointerDownPointerX / canvasWidth * 2 - 1) - Math.atan(pos.x / canvasWidth * 2 - 1)) * 180 / Math.PI * config.hfov / 90 + onPointerDownYaw;
        speed.yaw = (yaw - config.yaw) % 360 * 0.2;
        config.yaw = yaw;
        var vfov = 2 * Math.atan(Math.tan(config.hfov / 360 * Math.PI) * canvasHeight / canvasWidth) * 180 / Math.PI;
        var pitch = (Math.atan(pos.y / canvasHeight * 2 - 1) - Math.atan(onPointerDownPointerY / canvasHeight * 2 - 1)) * 180 / Math.PI * vfov / 90 + onPointerDownPitch;
        speed.pitch = (pitch - config.pitch) * 0.2;
        config.pitch = pitch;
      }
    }
    function onDocumentMouseUp(event2) {
      if (draggingHotSpot && draggingHotSpot.dragHandlerFunc)
        draggingHotSpot.dragHandlerFunc(event2, draggingHotSpot.dragHandlerArgs);
      draggingHotSpot = null;
      if (!isUserInteracting) {
        return;
      }
      isUserInteracting = false;
      if (Date.now() - latestInteraction > 15) {
        speed.pitch = speed.yaw = 0;
      }
      uiContainer.classList.add("pnlm-grab");
      uiContainer.classList.remove("pnlm-grabbing");
      latestInteraction = Date.now();
      fireEvent("mouseup", event2);
    }
    function onDocumentTouchStart(event2) {
      if (!loaded || !config.draggable || draggingHotSpot) {
        return;
      }
      stopAnimation();
      stopOrientation();
      config.roll = 0;
      speed.hfov = 0;
      var pos0 = mousePosition(event2.targetTouches[0]);
      onPointerDownPointerX = pos0.x;
      onPointerDownPointerY = pos0.y;
      if (event2.targetTouches.length == 2) {
        var pos1 = mousePosition(event2.targetTouches[1]);
        onPointerDownPointerX += (pos1.x - pos0.x) * 0.5;
        onPointerDownPointerY += (pos1.y - pos0.y) * 0.5;
        onPointerDownPointerDist = Math.sqrt((pos0.x - pos1.x) * (pos0.x - pos1.x) + (pos0.y - pos1.y) * (pos0.y - pos1.y));
      }
      isUserInteracting = true;
      latestInteraction = Date.now();
      onPointerDownYaw = config.yaw;
      onPointerDownPitch = config.pitch;
      fireEvent("touchstart", event2);
      animateInit();
    }
    function onDocumentTouchMove(event2) {
      if (!config.draggable) {
        return;
      }
      if (!config.dragConfirm)
        event2.preventDefault();
      if (loaded) {
        latestInteraction = Date.now();
      }
      if (isUserInteracting && loaded) {
        var pos0 = mousePosition(event2.targetTouches[0]);
        var clientX = pos0.x;
        var clientY = pos0.y;
        if (event2.targetTouches.length == 2 && onPointerDownPointerDist != -1) {
          var pos1 = mousePosition(event2.targetTouches[1]);
          clientX += (pos1.x - pos0.x) * 0.5;
          clientY += (pos1.y - pos0.y) * 0.5;
          var clientDist = Math.sqrt((pos0.x - pos1.x) * (pos0.x - pos1.x) + (pos0.y - pos1.y) * (pos0.y - pos1.y));
          setHfov(config.hfov + (onPointerDownPointerDist - clientDist) * 0.1);
          onPointerDownPointerDist = clientDist;
        }
        var touchmovePanSpeedCoeff = config.hfov / 360 * config.touchPanSpeedCoeffFactor;
        if (!fullscreenActive && (config.dragConfirm == "both" || config.dragConfirm == "yaw") && event2.targetTouches.length != 2) {
          if (onPointerDownPointerX != clientX) {
            if (config.dragConfirm == "yaw")
              showInteractionMessage(config.strings.twoTouchXActivate);
            else
              showInteractionMessage(config.strings.twoTouchActivate);
          }
        } else {
          var yaw = (onPointerDownPointerX - clientX) * touchmovePanSpeedCoeff + onPointerDownYaw;
          speed.yaw = (yaw - config.yaw) % 360 * 0.2;
          config.yaw = yaw;
        }
        if (!fullscreenActive && (config.dragConfirm == "both" || config.dragConfirm == "pitch") && event2.targetTouches.length != 2) {
          if (onPointerDownPointerY != clientY) {
            if (config.dragConfirm == "pitch")
              showInteractionMessage(config.strings.twoTouchYActivate);
            else
              showInteractionMessage(config.strings.twoTouchActivate);
          }
        } else {
          var pitch = (clientY - onPointerDownPointerY) * touchmovePanSpeedCoeff + onPointerDownPitch;
          speed.pitch = (pitch - config.pitch) * 0.2;
          config.pitch = pitch;
        }
        if ((config.dragConfirm == "yaw" || config.dragConfirm == "pitch" || config.dragConfirm == "both") && event2.targetTouches.length == 2) {
          clearInteractionMessage();
          event2.preventDefault();
        }
      }
    }
    function onDocumentTouchEnd() {
      draggingHotSpot = null;
      isUserInteracting = false;
      if (Date.now() - latestInteraction > 150) {
        speed.pitch = speed.yaw = 0;
      }
      onPointerDownPointerDist = -1;
      latestInteraction = Date.now();
      fireEvent("touchend", event);
    }
    var pointerIDs = [], pointerCoordinates = [];
    function onDocumentPointerDown(event2) {
      if (event2.pointerType == "touch") {
        if (!loaded || !config.draggable)
          return;
        pointerIDs.push(event2.pointerId);
        pointerCoordinates.push({ clientX: event2.clientX, clientY: event2.clientY });
        event2.targetTouches = pointerCoordinates;
        onDocumentTouchStart(event2);
        event2.preventDefault();
      }
    }
    function onDocumentPointerMove(event2) {
      if (event2.pointerType == "touch") {
        if (draggingHotSpot) {
          moveHotSpot(draggingHotSpot, event2);
          return;
        }
        if (!config.draggable)
          return;
        for (var i2 = 0; i2 < pointerIDs.length; i2++) {
          if (event2.pointerId == pointerIDs[i2]) {
            pointerCoordinates[i2].clientX = event2.clientX;
            pointerCoordinates[i2].clientY = event2.clientY;
            event2.targetTouches = pointerCoordinates;
            onDocumentTouchMove(event2);
            event2.preventDefault();
            return;
          }
        }
      }
    }
    function onDocumentPointerUp(event2) {
      if (draggingHotSpot && draggingHotSpot.dragHandlerFunc)
        draggingHotSpot.dragHandlerFunc(event2, draggingHotSpot.dragHandlerArgs);
      draggingHotSpot = null;
      if (event2.pointerType == "touch") {
        var defined = false;
        for (var i2 = 0; i2 < pointerIDs.length; i2++) {
          if (event2.pointerId == pointerIDs[i2])
            pointerIDs[i2] = undefined$1;
          if (pointerIDs[i2])
            defined = true;
        }
        if (!defined) {
          pointerIDs = [];
          pointerCoordinates = [];
          onDocumentTouchEnd();
        }
        event2.preventDefault();
      }
    }
    function onDocumentMouseWheel(event2) {
      if (!loaded || config.mouseZoom == "fullscreenonly" && !fullscreenActive) {
        return;
      }
      if (!fullscreenActive && config.mouseZoom == "ctrl" && !event2.ctrlKey) {
        var keyname = navigator.platform.indexOf("Mac") != -1 ? "control" : "ctrl";
        showInteractionMessage(config.strings.ctrlZoomActivate.replace("%s", '<kbd class="pnlm-outline">' + keyname + "</kbd>"));
        return;
      }
      clearInteractionMessage();
      event2.preventDefault();
      stopAnimation();
      latestInteraction = Date.now();
      if (event2.wheelDeltaY) {
        setHfov(config.hfov - event2.wheelDeltaY * 0.05);
        speed.hfov = event2.wheelDelta < 0 ? 1 : -1;
      } else if (event2.wheelDelta) {
        setHfov(config.hfov - event2.wheelDelta * 0.05);
        speed.hfov = event2.wheelDelta < 0 ? 1 : -1;
      } else if (event2.detail) {
        setHfov(config.hfov + event2.detail * 1.5);
        speed.hfov = event2.detail > 0 ? 1 : -1;
      }
      animateInit();
    }
    function onDocumentKeyPress(event2) {
      stopAnimation();
      latestInteraction = Date.now();
      stopOrientation();
      config.roll = 0;
      var keynumber = event2.which || event2.keycode;
      if (config.capturedKeyNumbers.indexOf(keynumber) < 0)
        return;
      if (!fullscreenActive && (keynumber == 16 || keynumber == 17) && config.mouseZoom == "ctrl")
        return;
      event2.preventDefault();
      if (keynumber == 27) {
        if (fullscreenActive) {
          toggleFullscreen();
        }
      } else {
        changeKey(keynumber, true);
      }
    }
    function clearKeys() {
      for (var i2 = 0; i2 < 10; i2++) {
        keysDown[i2] = false;
      }
    }
    function onDocumentKeyUp(event2) {
      var keynumber = event2.which || event2.keycode;
      if (config.capturedKeyNumbers.indexOf(keynumber) < 0)
        return;
      event2.preventDefault();
      changeKey(keynumber, false);
    }
    function changeKey(keynumber, value) {
      var keyChanged = false;
      switch (keynumber) {
        case 109:
        case 189:
        case 17:
        case 173:
          if (keysDown[0] != value) {
            keyChanged = true;
          }
          keysDown[0] = value;
          break;
        case 107:
        case 187:
        case 16:
        case 61:
          if (keysDown[1] != value) {
            keyChanged = true;
          }
          keysDown[1] = value;
          break;
        case 38:
          if (keysDown[2] != value) {
            keyChanged = true;
          }
          keysDown[2] = value;
          break;
        case 87:
          if (keysDown[6] != value) {
            keyChanged = true;
          }
          keysDown[6] = value;
          break;
        case 40:
          if (keysDown[3] != value) {
            keyChanged = true;
          }
          keysDown[3] = value;
          break;
        case 83:
          if (keysDown[7] != value) {
            keyChanged = true;
          }
          keysDown[7] = value;
          break;
        case 37:
          if (keysDown[4] != value) {
            keyChanged = true;
          }
          keysDown[4] = value;
          break;
        case 65:
          if (keysDown[8] != value) {
            keyChanged = true;
          }
          keysDown[8] = value;
          break;
        case 39:
          if (keysDown[5] != value) {
            keyChanged = true;
          }
          keysDown[5] = value;
          break;
        case 68:
          if (keysDown[9] != value) {
            keyChanged = true;
          }
          keysDown[9] = value;
      }
      if (keyChanged && value) {
        if (typeof performance !== "undefined" && performance.now()) {
          prevTime = performance.now();
        } else {
          prevTime = Date.now();
        }
        animateInit();
      }
    }
    function keyRepeat() {
      if (!loaded) {
        return;
      }
      var isKeyDown = false;
      var prevPitch = config.pitch;
      var prevYaw = config.yaw;
      var prevZoom = config.hfov;
      var newTime;
      if (typeof performance !== "undefined" && performance.now()) {
        newTime = performance.now();
      } else {
        newTime = Date.now();
      }
      if (prevTime === undefined$1) {
        prevTime = newTime;
      }
      var diff = (newTime - prevTime) * config.hfov / 1200;
      diff = Math.min(diff, 10);
      if (keysDown[0] && config.keyboardZoom === true) {
        setHfov(config.hfov + (speed.hfov * 0.8 + 0.4) * diff);
        isKeyDown = true;
      }
      if (keysDown[1] && config.keyboardZoom === true) {
        setHfov(config.hfov + (speed.hfov * 0.8 - 0.2) * diff);
        isKeyDown = true;
      }
      if (keysDown[2] || keysDown[6]) {
        config.pitch += (speed.pitch * 0.8 + 0.2) * diff;
        isKeyDown = true;
      }
      if (keysDown[3] || keysDown[7]) {
        config.pitch += (speed.pitch * 0.8 - 0.2) * diff;
        isKeyDown = true;
      }
      if (keysDown[4] || keysDown[8]) {
        config.yaw += (speed.yaw * 0.8 - 0.2) * diff;
        isKeyDown = true;
      }
      if (keysDown[5] || keysDown[9]) {
        config.yaw += (speed.yaw * 0.8 + 0.2) * diff;
        isKeyDown = true;
      }
      if (isKeyDown)
        latestInteraction = Date.now();
      if (config.autoRotate) {
        if (newTime - prevTime > 1e-3) {
          var timeDiff = (newTime - prevTime) / 1e3;
          var yawDiff = (speed.yaw / timeDiff * diff - config.autoRotate * 0.2) * timeDiff;
          yawDiff = (-config.autoRotate > 0 ? 1 : -1) * Math.min(Math.abs(config.autoRotate * timeDiff), Math.abs(yawDiff));
          config.yaw += yawDiff;
        }
        if (config.autoRotateStopDelay) {
          config.autoRotateStopDelay -= newTime - prevTime;
          if (config.autoRotateStopDelay <= 0) {
            config.autoRotateStopDelay = false;
            autoRotateSpeed = config.autoRotate;
            config.autoRotate = 0;
          }
        }
      }
      if (animatedMove.pitch) {
        animateMove("pitch");
        prevPitch = config.pitch;
      }
      if (animatedMove.yaw) {
        animateMove("yaw");
        prevYaw = config.yaw;
      }
      if (animatedMove.hfov) {
        animateMove("hfov");
        prevZoom = config.hfov;
      }
      if (diff > 0 && !config.autoRotate) {
        var slowDownFactor = 1 - config.friction;
        if (!keysDown[4] && !keysDown[5] && !keysDown[8] && !keysDown[9] && !animatedMove.yaw) {
          config.yaw += speed.yaw * diff * slowDownFactor;
        }
        if (!keysDown[2] && !keysDown[3] && !keysDown[6] && !keysDown[7] && !animatedMove.pitch) {
          config.pitch += speed.pitch * diff * slowDownFactor;
        }
        if (!keysDown[0] && !keysDown[1] && !animatedMove.hfov) {
          if (config.hfov > 90) {
            slowDownFactor *= 1 - (config.hfov - 90) / 90;
          }
          setHfov(config.hfov + speed.hfov * diff * slowDownFactor);
        }
      }
      prevTime = newTime;
      if (diff > 0) {
        speed.yaw = speed.yaw * 0.8 + (config.yaw - prevYaw) / diff * 0.2;
        speed.pitch = speed.pitch * 0.8 + (config.pitch - prevPitch) / diff * 0.2;
        speed.hfov = speed.hfov * 0.8 + (config.hfov - prevZoom) / diff * 0.2;
        var maxSpeed = config.autoRotate ? Math.abs(config.autoRotate) : 5;
        speed.yaw = Math.min(maxSpeed, Math.max(speed.yaw, -maxSpeed));
        speed.pitch = Math.min(maxSpeed, Math.max(speed.pitch, -maxSpeed));
        speed.hfov = Math.min(maxSpeed, Math.max(speed.hfov, -maxSpeed));
      }
      if (keysDown[0] && keysDown[1]) {
        speed.hfov = 0;
      }
      if ((keysDown[2] || keysDown[6]) && (keysDown[3] || keysDown[7])) {
        speed.pitch = 0;
      }
      if ((keysDown[4] || keysDown[8]) && (keysDown[5] || keysDown[9])) {
        speed.yaw = 0;
      }
    }
    function animateMove(axis) {
      var t = animatedMove[axis];
      var normTime = Math.min(1, Math.max((Date.now() - t.startTime) / 1e3 / (t.duration / 1e3), 0));
      var result = t.startPosition + config.animationTimingFunction(normTime) * (t.endPosition - t.startPosition);
      if (t.endPosition > t.startPosition && result >= t.endPosition || t.endPosition < t.startPosition && result <= t.endPosition || t.endPosition === t.startPosition) {
        result = t.endPosition;
        speed[axis] = 0;
        delete animatedMove[axis];
      }
      config[axis] = result;
    }
    function timingFunction(t) {
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }
    function onDocumentResize() {
      onFullScreenChange("resize");
    }
    function animateInit() {
      if (animating) {
        return;
      }
      animating = true;
      animate();
    }
    function animate() {
      if (destroyed) {
        return;
      }
      render();
      if (autoRotateStart)
        clearTimeout(autoRotateStart);
      if (isUserInteracting || orientation === true) {
        requestAnimationFrame(animate);
      } else if (keysDown[0] || keysDown[1] || keysDown[2] || keysDown[3] || keysDown[4] || keysDown[5] || keysDown[6] || keysDown[7] || keysDown[8] || keysDown[9] || config.autoRotate || animatedMove.pitch || animatedMove.yaw || animatedMove.hfov || Math.abs(speed.yaw) > 0.01 || Math.abs(speed.pitch) > 0.01 || Math.abs(speed.hfov) > 0.01) {
        keyRepeat();
        if (config.autoRotateInactivityDelay >= 0 && autoRotateSpeed && Date.now() - latestInteraction > config.autoRotateInactivityDelay && !config.autoRotate) {
          config.autoRotate = autoRotateSpeed;
          _this.lookAt(origPitch, undefined$1, origHfov, 3e3);
        }
        requestAnimationFrame(animate);
      } else if (renderer && (renderer.isLoading() || config.dynamic === true && update2)) {
        requestAnimationFrame(animate);
      } else {
        if (_this.getPitch && _this.getYaw && _this.getHfov)
          fireEvent("animatefinished", { pitch: _this.getPitch(), yaw: _this.getYaw(), hfov: _this.getHfov() });
        animating = false;
        prevTime = undefined$1;
        var autoRotateStartTime = config.autoRotateInactivityDelay - (Date.now() - latestInteraction);
        if (autoRotateStartTime > 0) {
          autoRotateStart = setTimeout(function() {
            config.autoRotate = autoRotateSpeed;
            _this.lookAt(origPitch, undefined$1, origHfov, 3e3);
            animateInit();
          }, autoRotateStartTime);
        } else if (config.autoRotateInactivityDelay >= 0 && autoRotateSpeed) {
          config.autoRotate = autoRotateSpeed;
          _this.lookAt(origPitch, undefined$1, origHfov, 3e3);
          animateInit();
        }
      }
    }
    function render() {
      var tmpyaw;
      if (loaded) {
        var canvas = renderer.getCanvas();
        if (config.autoRotate !== false) {
          if (config.yaw > 360) {
            config.yaw -= 360;
          } else if (config.yaw < -360) {
            config.yaw += 360;
          }
        }
        tmpyaw = config.yaw;
        var hoffcut = 0;
        if (config.avoidShowingBackground) {
          var hfov2 = config.hfov / 2, vfov2 = Math.atan2(Math.tan(hfov2 / 180 * Math.PI), canvas.width / canvas.height) * 180 / Math.PI, transposed = config.vaov > config.haov;
          if (transposed) {
            vfov2 * (1 - Math.min(Math.cos((config.pitch - hfov2) / 180 * Math.PI), Math.cos((config.pitch + hfov2) / 180 * Math.PI)));
          } else {
            hoffcut = hfov2 * (1 - Math.min(Math.cos((config.pitch - vfov2) / 180 * Math.PI), Math.cos((config.pitch + vfov2) / 180 * Math.PI)));
          }
        }
        var yawRange = config.maxYaw - config.minYaw, minYaw = -180, maxYaw = 180;
        if (yawRange < 360) {
          minYaw = config.minYaw + config.hfov / 2 + hoffcut;
          maxYaw = config.maxYaw - config.hfov / 2 - hoffcut;
          if (yawRange < config.hfov) {
            minYaw = maxYaw = (minYaw + maxYaw) / 2;
          }
          config.yaw = Math.max(minYaw, Math.min(maxYaw, config.yaw));
        }
        if (!(config.autoRotate !== false)) {
          if (config.yaw > 360) {
            config.yaw -= 360;
          } else if (config.yaw < -360) {
            config.yaw += 360;
          }
        }
        if (config.autoRotate !== false && tmpyaw != config.yaw && prevTime !== undefined$1) {
          config.autoRotate *= -1;
        }
        var vfov = 2 * Math.atan(Math.tan(config.hfov / 180 * Math.PI * 0.5) / (canvas.width / canvas.height)) / Math.PI * 180;
        var minPitch = config.minPitch + vfov / 2, maxPitch = config.maxPitch - vfov / 2;
        var pitchRange = config.maxPitch - config.minPitch;
        if (pitchRange < vfov) {
          minPitch = maxPitch = (minPitch + maxPitch) / 2;
        }
        if (isNaN(minPitch))
          minPitch = -90;
        if (isNaN(maxPitch))
          maxPitch = 90;
        config.pitch = Math.max(minPitch, Math.min(maxPitch, config.pitch));
        renderer.render(config.pitch * Math.PI / 180, config.yaw * Math.PI / 180, config.hfov * Math.PI / 180, { roll: config.roll * Math.PI / 180 });
        renderHotSpots();
        if (config.compass) {
          compass.style.transform = "rotate(" + (-config.yaw - config.northOffset) + "deg)";
          compass.style.webkitTransform = "rotate(" + (-config.yaw - config.northOffset) + "deg)";
        }
      }
    }
    function Quaternion(w, x, y, z) {
      this.w = w;
      this.x = x;
      this.y = y;
      this.z = z;
    }
    Quaternion.prototype.multiply = function(q) {
      return new Quaternion(this.w * q.w - this.x * q.x - this.y * q.y - this.z * q.z, this.x * q.w + this.w * q.x + this.y * q.z - this.z * q.y, this.y * q.w + this.w * q.y + this.z * q.x - this.x * q.z, this.z * q.w + this.w * q.z + this.x * q.y - this.y * q.x);
    };
    Quaternion.prototype.toEulerAngles = function() {
      var phi = Math.atan2(2 * (this.w * this.x + this.y * this.z), 1 - 2 * (this.x * this.x + this.y * this.y)), theta = Math.asin(2 * (this.w * this.y - this.z * this.x)), psi = Math.atan2(2 * (this.w * this.z + this.x * this.y), 1 - 2 * (this.y * this.y + this.z * this.z));
      return [phi, theta, psi];
    };
    function taitBryanToQuaternion(alpha, beta, gamma) {
      var r = [
        beta ? beta * Math.PI / 180 / 2 : 0,
        gamma ? gamma * Math.PI / 180 / 2 : 0,
        alpha ? alpha * Math.PI / 180 / 2 : 0
      ];
      var c = [Math.cos(r[0]), Math.cos(r[1]), Math.cos(r[2])], s = [Math.sin(r[0]), Math.sin(r[1]), Math.sin(r[2])];
      return new Quaternion(c[0] * c[1] * c[2] - s[0] * s[1] * s[2], s[0] * c[1] * c[2] - c[0] * s[1] * s[2], c[0] * s[1] * c[2] + s[0] * c[1] * s[2], c[0] * c[1] * s[2] + s[0] * s[1] * c[2]);
    }
    function computeQuaternion(alpha, beta, gamma) {
      var quaternion = taitBryanToQuaternion(alpha, beta, gamma);
      quaternion = quaternion.multiply(new Quaternion(Math.sqrt(0.5), -Math.sqrt(0.5), 0, 0));
      var angle2 = window2.orientation ? -window2.orientation * Math.PI / 180 / 2 : 0;
      return quaternion.multiply(new Quaternion(Math.cos(angle2), 0, -Math.sin(angle2), 0));
    }
    function orientationListener(e) {
      var q = computeQuaternion(e.alpha, e.beta, e.gamma).toEulerAngles();
      if (typeof orientation == "number" && orientation < 10) {
        orientation += 1;
      } else if (orientation === 10) {
        orientationYawOffset = q[2] / Math.PI * 180 + config.yaw;
        orientation = true;
        requestAnimationFrame(animate);
      } else {
        config.pitch = q[0] / Math.PI * 180;
        config.roll = -q[1] / Math.PI * 180;
        config.yaw = -q[2] / Math.PI * 180 + orientationYawOffset;
      }
    }
    function renderInit() {
      try {
        var params = {};
        if (config.horizonPitch !== undefined$1)
          params.horizonPitch = config.horizonPitch * Math.PI / 180;
        if (config.horizonRoll !== undefined$1)
          params.horizonRoll = config.horizonRoll * Math.PI / 180;
        if (config.backgroundColor !== undefined$1)
          params.backgroundColor = config.backgroundColor;
        renderer.init(panoImage, config.type, config.dynamic, config.haov * Math.PI / 180, config.vaov * Math.PI / 180, config.vOffset * Math.PI / 180, renderInitCallback, params);
        if (config.dynamic !== true) {
          panoImage = undefined$1;
        }
      } catch (event2) {
        if (event2.type == "webgl error" || event2.type == "no webgl") {
          anError();
        } else if (event2.type == "webgl size error") {
          anError(config.strings.textureSizeError.replace("%s", event2.width).replace("%s", event2.maxWidth));
        } else {
          anError(config.strings.unknownError);
          throw event2;
        }
      }
    }
    function renderInitCallback() {
      if (config.sceneFadeDuration && renderer.fadeImg !== undefined$1) {
        renderer.fadeImg.style.opacity = 0;
        var fadeImg = renderer.fadeImg;
        delete renderer.fadeImg;
        setTimeout(function() {
          renderContainer.removeChild(fadeImg);
          fireEvent("scenechangefadedone");
        }, config.sceneFadeDuration);
      }
      if (config.compass) {
        compass.style.display = "inline";
      } else {
        compass.style.display = "none";
      }
      createHotSpots();
      infoDisplay.load.box.style.display = "none";
      if (preview !== undefined$1) {
        renderContainer.removeChild(preview);
        preview = undefined$1;
      }
      loaded = true;
      animateInit();
      fireEvent("load");
    }
    function createHotSpot(hs) {
      hs.pitch = Number(hs.pitch) || 0;
      hs.yaw = Number(hs.yaw) || 0;
      var div2 = document2.createElement("div");
      div2.className = "pnlm-hotspot-base";
      if (hs.cssClass)
        div2.className += " " + hs.cssClass;
      else
        div2.className += " pnlm-hotspot pnlm-sprite pnlm-" + escapeHTML(hs.type);
      var span = document2.createElement("span");
      if (hs.text)
        span.innerHTML = escapeHTML(hs.text);
      var a;
      if (hs.video) {
        var video = document2.createElement("video"), vidp = hs.video;
        if (config.basePath && !absoluteURL(vidp))
          vidp = config.basePath + vidp;
        video.src = sanitizeURL(vidp);
        video.controls = true;
        video.style.width = hs.width + "px";
        uiContainer.appendChild(div2);
        span.appendChild(video);
      } else if (hs.image) {
        var imgp = hs.image;
        if (config.basePath && !absoluteURL(imgp))
          imgp = config.basePath + imgp;
        a = document2.createElement("a");
        a.href = sanitizeURL(hs.URL ? hs.URL : imgp, true);
        if (config.targetBlank) {
          a.target = "_blank";
          a.rel = "noopener";
        }
        span.appendChild(a);
        var image = document2.createElement("img");
        image.src = sanitizeURL(imgp);
        image.style.width = hs.width + "px";
        image.style.paddingTop = "5px";
        uiContainer.appendChild(div2);
        a.appendChild(image);
        span.style.maxWidth = "initial";
      } else if (hs.URL) {
        a = document2.createElement("a");
        a.href = sanitizeURL(hs.URL, true);
        if (hs.attributes) {
          for (var key in hs.attributes) {
            a.setAttribute(key, hs.attributes[key]);
          }
        } else if (config.targetBlank) {
          a.target = "_blank";
          a.rel = "noopener";
        }
        uiContainer.appendChild(a);
        div2.className += " pnlm-pointer";
        span.className += " pnlm-pointer";
        a.appendChild(div2);
      } else {
        if (hs.sceneId) {
          div2.onclick = div2.ontouchend = function() {
            if (!div2.clicked) {
              div2.clicked = true;
              loadScene(hs.sceneId, hs.targetPitch, hs.targetYaw, hs.targetHfov);
            }
            return false;
          };
          div2.className += " pnlm-pointer";
          span.className += " pnlm-pointer";
        }
        uiContainer.appendChild(div2);
      }
      if (hs.createTooltipFunc) {
        hs.createTooltipFunc(div2, hs.createTooltipArgs);
      } else if (hs.text || hs.video || hs.image) {
        div2.classList.add("pnlm-tooltip");
        div2.appendChild(span);
        span.style.width = span.scrollWidth - 20 + "px";
        span.style.marginLeft = -(span.scrollWidth - div2.offsetWidth) / 2 + "px";
        span.style.marginTop = -span.scrollHeight - 12 + "px";
      }
      if (hs.clickHandlerFunc) {
        div2.addEventListener("click", function(e) {
          hs.clickHandlerFunc(e, hs.clickHandlerArgs);
        }, "false");
        if (document2.documentElement.style.pointerAction === "" && document2.documentElement.style.touchAction === "") {
          div2.addEventListener("pointerup", function(e) {
            hs.clickHandlerFunc(e, hs.clickHandlerArgs);
          }, false);
        } else {
          div2.addEventListener("touchend", function(e) {
            hs.clickHandlerFunc(e, hs.clickHandlerArgs);
          }, false);
        }
        div2.className += " pnlm-pointer";
        span.className += " pnlm-pointer";
      }
      if (hs.draggable) {
        div2.addEventListener("mousedown", function(e) {
          if (hs.dragHandlerFunc)
            hs.dragHandlerFunc(e, hs.dragHandlerArgs);
          draggingHotSpot = hs;
        });
        if (document2.documentElement.style.pointerAction === "" && document2.documentElement.style.touchAction === "") {
          div2.addEventListener("pointerdown", function(e) {
            if (hs.dragHandlerFunc)
              hs.dragHandlerFunc(e, hs.dragHandlerArgs);
            draggingHotSpot = hs;
          });
        }
        div2.addEventListener("touchmove", function(e) {
          moveHotSpot(hs, e.targetTouches[0]);
        });
        div2.addEventListener("touchend", function(e) {
          if (hs.dragHandlerFunc)
            hs.dragHandlerFunc(e, hs.dragHandlerArgs);
          draggingHotSpot = null;
        });
      }
      hs.div = div2;
    }
    function moveHotSpot(hs, event2) {
      var coords = mouseEventToCoords(event2);
      hs.pitch = coords[0];
      hs.yaw = coords[1];
      renderHotSpot(hs);
    }
    function createHotSpots() {
      if (hotspotsCreated)
        return;
      if (!config.hotSpots) {
        config.hotSpots = [];
      } else {
        config.hotSpots = config.hotSpots.sort(function(a, b) {
          return a.pitch < b.pitch;
        });
        config.hotSpots.forEach(createHotSpot);
      }
      hotspotsCreated = true;
      renderHotSpots();
    }
    function destroyHotSpots() {
      var hs = config.hotSpots;
      hotspotsCreated = false;
      delete config.hotSpots;
      if (hs) {
        for (var i2 = 0; i2 < hs.length; i2++) {
          var current = hs[i2].div;
          if (current) {
            while (current.parentNode && current.parentNode != uiContainer) {
              current = current.parentNode;
            }
            uiContainer.removeChild(current);
          }
          delete hs[i2].div;
        }
      }
    }
    function renderHotSpot(hs) {
      var hsPitchSin = Math.sin(hs.pitch * Math.PI / 180), hsPitchCos = Math.cos(hs.pitch * Math.PI / 180), configPitchSin = Math.sin(config.pitch * Math.PI / 180), configPitchCos = Math.cos(config.pitch * Math.PI / 180), yawCos = Math.cos((-hs.yaw + config.yaw) * Math.PI / 180);
      var z = hsPitchSin * configPitchSin + hsPitchCos * yawCos * configPitchCos;
      if (hs.yaw <= 90 && hs.yaw > -90 && z <= 0 || (hs.yaw > 90 || hs.yaw <= -90) && z <= 0) {
        hs.div.style.visibility = "hidden";
      } else {
        var yawSin = Math.sin((-hs.yaw + config.yaw) * Math.PI / 180), hfovTan = Math.tan(config.hfov * Math.PI / 360);
        hs.div.style.visibility = "visible";
        var canvas = renderer.getCanvas(), canvasWidth = canvas.clientWidth, canvasHeight = canvas.clientHeight;
        var coord = [
          -canvasWidth / hfovTan * yawSin * hsPitchCos / z / 2,
          -canvasWidth / hfovTan * (hsPitchSin * configPitchCos - hsPitchCos * yawCos * configPitchSin) / z / 2
        ];
        var rollSin = Math.sin(config.roll * Math.PI / 180), rollCos = Math.cos(config.roll * Math.PI / 180);
        coord = [
          coord[0] * rollCos - coord[1] * rollSin,
          coord[0] * rollSin + coord[1] * rollCos
        ];
        coord[0] += (canvasWidth - hs.div.offsetWidth) / 2;
        coord[1] += (canvasHeight - hs.div.offsetHeight) / 2;
        var transform = "translate(" + coord[0] + "px, " + coord[1] + "px) translateZ(9999px) rotate(" + config.roll + "deg)";
        if (hs.scale) {
          transform += " scale(" + origHfov / config.hfov / z + ")";
        }
        hs.div.style.webkitTransform = transform;
        hs.div.style.MozTransform = transform;
        hs.div.style.transform = transform;
      }
    }
    function renderHotSpots() {
      config.hotSpots.forEach(renderHotSpot);
    }
    function mergeConfig(sceneId) {
      config = {};
      var k, s;
      var photoSphereExcludes = ["haov", "vaov", "vOffset", "northOffset", "horizonPitch", "horizonRoll"];
      specifiedPhotoSphereExcludes = [];
      for (k in defaultConfig) {
        if (defaultConfig.hasOwnProperty(k)) {
          config[k] = defaultConfig[k];
        }
      }
      for (k in initialConfig.default) {
        if (initialConfig.default.hasOwnProperty(k)) {
          if (k == "strings") {
            for (s in initialConfig.default.strings) {
              if (initialConfig.default.strings.hasOwnProperty(s)) {
                config.strings[s] = escapeHTML(initialConfig.default.strings[s]);
              }
            }
          } else {
            config[k] = initialConfig.default[k];
            if (photoSphereExcludes.indexOf(k) >= 0) {
              specifiedPhotoSphereExcludes.push(k);
            }
          }
        }
      }
      if (sceneId !== null && sceneId !== "" && initialConfig.scenes && initialConfig.scenes[sceneId]) {
        var scene = initialConfig.scenes[sceneId];
        for (k in scene) {
          if (scene.hasOwnProperty(k)) {
            if (k == "strings") {
              for (s in scene.strings) {
                if (scene.strings.hasOwnProperty(s)) {
                  config.strings[s] = escapeHTML(scene.strings[s]);
                }
              }
            } else {
              config[k] = scene[k];
              if (photoSphereExcludes.indexOf(k) >= 0) {
                specifiedPhotoSphereExcludes.push(k);
              }
            }
          }
        }
        config.scene = sceneId;
      }
      for (k in initialConfig) {
        if (initialConfig.hasOwnProperty(k)) {
          if (k == "strings") {
            for (s in initialConfig.strings) {
              if (initialConfig.strings.hasOwnProperty(s)) {
                config.strings[s] = escapeHTML(initialConfig.strings[s]);
              }
            }
          } else {
            config[k] = initialConfig[k];
            if (photoSphereExcludes.indexOf(k) >= 0) {
              specifiedPhotoSphereExcludes.push(k);
            }
          }
        }
      }
    }
    function processOptions(isPreview) {
      isPreview = isPreview ? isPreview : false;
      if (isPreview && "preview" in config) {
        var p = config.preview;
        if (config.basePath && !absoluteURL(p))
          p = config.basePath + p;
        preview = document2.createElement("div");
        preview.className = "pnlm-preview-img";
        preview.style.backgroundImage = "url('" + sanitizeURLForCss(p) + "')";
        renderContainer.appendChild(preview);
      }
      var title = config.title, author = config.author;
      if (isPreview) {
        if ("previewTitle" in config)
          config.title = config.previewTitle;
        if ("previewAuthor" in config)
          config.author = config.previewAuthor;
      }
      if (!config.hasOwnProperty("title"))
        infoDisplay.title.innerHTML = "";
      if (!config.hasOwnProperty("author"))
        infoDisplay.author.innerHTML = "";
      if (!config.hasOwnProperty("title") && !config.hasOwnProperty("author"))
        infoDisplay.container.style.display = "none";
      if (config.targetBlank) {
        aboutMsgLink.rel = "noopener";
        aboutMsgLink.target = "_blank";
      }
      controls.load.innerHTML = "<div><p>" + config.strings.loadButtonLabel + "</p></div>";
      infoDisplay.load.boxp.innerHTML = config.strings.loadingLabel;
      for (var key in config) {
        if (config.hasOwnProperty(key)) {
          switch (key) {
            case "title":
              infoDisplay.title.innerHTML = escapeHTML(config[key]);
              infoDisplay.container.style.display = "inline";
              break;
            case "author":
              var authorText = escapeHTML(config[key]);
              if (config.authorURL) {
                var authorLink = document2.createElement("a");
                authorLink.href = sanitizeURL(config["authorURL"], true);
                if (config.targetBlank) {
                  authorLink.target = "_blank";
                  authorLink.rel = "noopener";
                }
                authorLink.innerHTML = escapeHTML(config[key]);
                authorText = authorLink.outerHTML;
              }
              infoDisplay.author.innerHTML = config.strings.bylineLabel.replace("%s", authorText);
              infoDisplay.container.style.display = "inline";
              break;
            case "hfov":
              setHfov(Number(config[key]));
              break;
            case "autoLoad":
              if (config[key] === true && renderer === undefined$1) {
                infoDisplay.load.box.style.display = "inline";
                controls.load.style.display = "none";
                init2();
              }
              break;
            case "showZoomCtrl":
              if (config[key] && config.showControls != false) {
                controls.zoom.style.display = "block";
              } else {
                controls.zoom.style.display = "none";
              }
              break;
            case "showFullscreenCtrl":
              if (config[key] && config.showControls != false && ("fullscreen" in document2 || "mozFullScreen" in document2 || "webkitIsFullScreen" in document2 || "msFullscreenElement" in document2)) {
                controls.fullscreen.style.display = "block";
              } else {
                controls.fullscreen.style.display = "none";
              }
              break;
            case "hotSpotDebug":
              if (config[key])
                hotSpotDebugIndicator.style.display = "block";
              else
                hotSpotDebugIndicator.style.display = "none";
              break;
            case "showControls":
              if (!config[key]) {
                controls.orientation.style.display = "none";
                controls.zoom.style.display = "none";
                controls.fullscreen.style.display = "none";
              }
              break;
            case "orientationOnByDefault":
              if (config[key])
                startOrientation();
              break;
          }
        }
      }
      if (isPreview) {
        if (title)
          config.title = title;
        else
          delete config.title;
        if (author)
          config.author = author;
        else
          delete config.author;
      }
    }
    function toggleFullscreen() {
      if (loaded && !error) {
        if (!fullscreenActive) {
          try {
            if (container.requestFullscreen) {
              container.requestFullscreen();
            } else if (container.mozRequestFullScreen) {
              container.mozRequestFullScreen();
            } else if (container.msRequestFullscreen) {
              container.msRequestFullscreen();
            } else {
              container.webkitRequestFullScreen();
            }
          } catch (event2) {
          }
        } else {
          if (document2.exitFullscreen) {
            document2.exitFullscreen();
          } else if (document2.mozCancelFullScreen) {
            document2.mozCancelFullScreen();
          } else if (document2.webkitCancelFullScreen) {
            document2.webkitCancelFullScreen();
          } else if (document2.msExitFullscreen) {
            document2.msExitFullscreen();
          }
        }
      }
    }
    function onFullScreenChange(resize) {
      if (document2.fullscreenElement || document2.fullscreen || document2.mozFullScreen || document2.webkitIsFullScreen || document2.msFullscreenElement) {
        controls.fullscreen.classList.add("pnlm-fullscreen-toggle-button-active");
        fullscreenActive = true;
      } else {
        controls.fullscreen.classList.remove("pnlm-fullscreen-toggle-button-active");
        fullscreenActive = false;
      }
      if (resize !== "resize")
        fireEvent("fullscreenchange", fullscreenActive);
      renderer.resize();
      setHfov(config.hfov);
      animateInit();
    }
    function zoomIn() {
      if (loaded) {
        setHfov(config.hfov - 5);
        animateInit();
      }
    }
    function zoomOut() {
      if (loaded) {
        setHfov(config.hfov + 5);
        animateInit();
      }
    }
    function constrainHfov(hfov) {
      var minHfov = config.minHfov;
      if (config.type == "multires" && renderer && !config.multiResMinHfov) {
        minHfov = Math.min(minHfov, renderer.getCanvas().width / (config.multiRes.cubeResolution / 90 * 0.9));
      }
      if (minHfov > config.maxHfov) {
        console.log("HFOV bounds do not make sense (minHfov > maxHfov).");
        return config.hfov;
      }
      var newHfov = config.hfov;
      if (hfov < minHfov) {
        newHfov = minHfov;
      } else if (hfov > config.maxHfov) {
        newHfov = config.maxHfov;
      } else {
        newHfov = hfov;
      }
      if (config.avoidShowingBackground && renderer && !isNaN(config.maxPitch - config.minPitch)) {
        var canvas = renderer.getCanvas();
        newHfov = Math.min(newHfov, Math.atan(Math.tan((config.maxPitch - config.minPitch) / 360 * Math.PI) / canvas.height * canvas.width) * 360 / Math.PI);
      }
      return newHfov;
    }
    function setHfov(hfov) {
      config.hfov = constrainHfov(hfov);
      fireEvent("zoomchange", config.hfov);
    }
    function stopAnimation() {
      animatedMove = {};
      autoRotateSpeed = config.autoRotate ? config.autoRotate : autoRotateSpeed;
      config.autoRotate = false;
    }
    function load() {
      clearError();
      loaded = false;
      clearInteractionMessage();
      controls.load.style.display = "none";
      infoDisplay.load.box.style.display = "inline";
      init2();
    }
    function loadScene(sceneId, targetPitch, targetYaw, targetHfov, fadeDone) {
      if (!loaded)
        fadeDone = true;
      loaded = false;
      animatedMove = {};
      var fadeImg, workingPitch, workingYaw, workingHfov;
      if (config.sceneFadeDuration && !fadeDone) {
        var data = renderer.render(config.pitch * Math.PI / 180, config.yaw * Math.PI / 180, config.hfov * Math.PI / 180, { returnImage: "ImageBitmap" });
        if (data !== undefined$1) {
          if (data.then)
            fadeImg = document2.createElement("canvas");
          else
            fadeImg = new Image();
          fadeImg.className = "pnlm-fade-img";
          fadeImg.style.transition = "opacity " + config.sceneFadeDuration / 1e3 + "s";
          fadeImg.style.width = "100%";
          fadeImg.style.height = "100%";
          if (data.then) {
            data.then(function(img) {
              fadeImg.width = img.width;
              fadeImg.height = img.height;
              fadeImg.getContext("2d").drawImage(img, 0, 0);
              loadScene(sceneId, targetPitch, targetYaw, targetHfov, true);
            });
          } else {
            fadeImg.onload = function() {
              loadScene(sceneId, targetPitch, targetYaw, targetHfov, true);
            };
            fadeImg.src = data;
          }
          renderContainer.appendChild(fadeImg);
          renderer.fadeImg = fadeImg;
          return;
        }
      }
      if (targetPitch === "same") {
        workingPitch = config.pitch;
      } else {
        workingPitch = targetPitch;
      }
      if (targetYaw === "same") {
        workingYaw = config.yaw;
      } else if (targetYaw === "sameAzimuth") {
        workingYaw = config.yaw + (config.northOffset || 0) - (initialConfig.scenes[sceneId].northOffset || 0);
      } else {
        workingYaw = targetYaw;
      }
      if (targetHfov === "same") {
        workingHfov = config.hfov;
      } else {
        workingHfov = targetHfov;
      }
      destroyHotSpots();
      mergeConfig(sceneId);
      speed.yaw = speed.pitch = speed.hfov = 0;
      processOptions();
      if (workingPitch !== undefined$1) {
        config.pitch = workingPitch;
      }
      if (workingYaw !== undefined$1) {
        config.yaw = workingYaw;
      }
      if (workingHfov !== undefined$1) {
        config.hfov = workingHfov;
      }
      fireEvent("scenechange", sceneId);
      load();
    }
    function stopOrientation() {
      window2.removeEventListener("deviceorientation", orientationListener);
      controls.orientation.classList.remove("pnlm-orientation-button-active");
      orientation = false;
    }
    function startOrientation() {
      if (!orientationSupport)
        return;
      if (typeof DeviceMotionEvent !== "undefined" && typeof DeviceMotionEvent.requestPermission === "function") {
        DeviceOrientationEvent.requestPermission().then(function(response) {
          if (response == "granted") {
            orientation = 1;
            window2.addEventListener("deviceorientation", orientationListener);
            controls.orientation.classList.add("pnlm-orientation-button-active");
          }
        });
      } else {
        orientation = 1;
        window2.addEventListener("deviceorientation", orientationListener);
        controls.orientation.classList.add("pnlm-orientation-button-active");
      }
    }
    function escapeHTML(s) {
      if (!initialConfig.escapeHTML)
        return String(s).split("\n").join("<br>");
      return String(s).split(/&/g).join("&amp;").split('"').join("&quot;").split("'").join("&#39;").split("<").join("&lt;").split(">").join("&gt;").split("/").join("&#x2f;").split("\n").join("<br>");
    }
    function sanitizeURL(url, href) {
      try {
        var decoded_url = decodeURIComponent(unescape(url)).replace(/[^\w:]/g, "").toLowerCase();
      } catch (e) {
        return "about:blank";
      }
      if (decoded_url.indexOf("javascript:") === 0 || decoded_url.indexOf("vbscript:") === 0) {
        console.log("Script URL removed.");
        return "about:blank";
      }
      if (href && decoded_url.indexOf("data:") === 0) {
        console.log("Data URI removed from link.");
        return "about:blank";
      }
      return url;
    }
    function unescape(html) {
      return html.replace(/&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/ig, function(_, n) {
        n = n.toLowerCase();
        if (n === "colon")
          return ":";
        if (n.charAt(0) === "#") {
          return n.charAt(1) === "x" ? String.fromCharCode(parseInt(n.substring(2), 16)) : String.fromCharCode(+n.substring(1));
        }
        return "";
      });
    }
    function sanitizeURLForCss(url) {
      return sanitizeURL(url).replace(/"/g, "%22").replace(/'/g, "%27");
    }
    this.isLoaded = function() {
      return Boolean(loaded);
    };
    this.getPitch = function() {
      return config.pitch;
    };
    this.setPitch = function(pitch, animated, callback, callbackArgs) {
      latestInteraction = Date.now();
      if (Math.abs(pitch - config.pitch) <= eps) {
        if (typeof callback == "function")
          callback(callbackArgs);
        return this;
      }
      animated = animated == undefined$1 ? 1e3 : Number(animated);
      if (animated) {
        animatedMove.pitch = {
          "startTime": Date.now(),
          "startPosition": config.pitch,
          "endPosition": pitch,
          "duration": animated
        };
        if (typeof callback == "function")
          setTimeout(function() {
            callback(callbackArgs);
          }, animated);
      } else {
        config.pitch = pitch;
      }
      animateInit();
      return this;
    };
    this.getPitchBounds = function() {
      return [config.minPitch, config.maxPitch];
    };
    this.setPitchBounds = function(bounds) {
      config.minPitch = Math.max(-90, Math.min(bounds[0], 90));
      config.maxPitch = Math.max(-90, Math.min(bounds[1], 90));
      return this;
    };
    this.getYaw = function() {
      return (config.yaw + 540) % 360 - 180;
    };
    this.setYaw = function(yaw, animated, callback, callbackArgs) {
      latestInteraction = Date.now();
      if (Math.abs(yaw - config.yaw) <= eps) {
        if (typeof callback == "function")
          callback(callbackArgs);
        return this;
      }
      animated = animated == undefined$1 ? 1e3 : Number(animated);
      yaw = (yaw + 180) % 360 - 180;
      if (animated) {
        if (config.yaw - yaw > 180)
          yaw += 360;
        else if (yaw - config.yaw > 180)
          yaw -= 360;
        animatedMove.yaw = {
          "startTime": Date.now(),
          "startPosition": config.yaw,
          "endPosition": yaw,
          "duration": animated
        };
        if (typeof callback == "function")
          setTimeout(function() {
            callback(callbackArgs);
          }, animated);
      } else {
        config.yaw = yaw;
      }
      animateInit();
      return this;
    };
    this.getYawBounds = function() {
      return [config.minYaw, config.maxYaw];
    };
    this.setYawBounds = function(bounds) {
      config.minYaw = Math.max(-360, Math.min(bounds[0], 360));
      config.maxYaw = Math.max(-360, Math.min(bounds[1], 360));
      return this;
    };
    this.getHfov = function() {
      return config.hfov;
    };
    this.setHfov = function(hfov, animated, callback, callbackArgs) {
      latestInteraction = Date.now();
      if (Math.abs(hfov - config.hfov) <= eps) {
        if (typeof callback == "function")
          callback(callbackArgs);
        return this;
      }
      animated = animated == undefined$1 ? 1e3 : Number(animated);
      if (animated) {
        animatedMove.hfov = {
          "startTime": Date.now(),
          "startPosition": config.hfov,
          "endPosition": constrainHfov(hfov),
          "duration": animated
        };
        if (typeof callback == "function")
          setTimeout(function() {
            callback(callbackArgs);
          }, animated);
      } else {
        setHfov(hfov);
      }
      animateInit();
      return this;
    };
    this.getHfovBounds = function() {
      return [config.minHfov, config.maxHfov];
    };
    this.setHfovBounds = function(bounds) {
      config.minHfov = Math.max(0, bounds[0]);
      config.maxHfov = Math.max(0, bounds[1]);
      return this;
    };
    this.lookAt = function(pitch, yaw, hfov, animated, callback, callbackArgs) {
      animated = animated == undefined$1 ? 1e3 : Number(animated);
      if (pitch !== undefined$1 && Math.abs(pitch - config.pitch) > eps) {
        this.setPitch(pitch, animated, callback, callbackArgs);
        callback = undefined$1;
      }
      if (yaw !== undefined$1 && Math.abs(yaw - config.yaw) > eps) {
        this.setYaw(yaw, animated, callback, callbackArgs);
        callback = undefined$1;
      }
      if (hfov !== undefined$1 && Math.abs(hfov - config.hfov) > eps) {
        this.setHfov(hfov, animated, callback, callbackArgs);
        callback = undefined$1;
      }
      if (typeof callback == "function")
        callback(callbackArgs);
      return this;
    };
    this.getNorthOffset = function() {
      return config.northOffset;
    };
    this.setNorthOffset = function(heading) {
      config.northOffset = Math.min(360, Math.max(0, heading));
      animateInit();
      return this;
    };
    this.getHorizonRoll = function() {
      return config.horizonRoll;
    };
    this.setHorizonRoll = function(roll) {
      config.horizonRoll = Math.min(90, Math.max(-90, roll));
      renderer.setPose(config.horizonPitch * Math.PI / 180, config.horizonRoll * Math.PI / 180);
      animateInit();
      return this;
    };
    this.getHorizonPitch = function() {
      return config.horizonPitch;
    };
    this.setHorizonPitch = function(pitch) {
      config.horizonPitch = Math.min(90, Math.max(-90, pitch));
      renderer.setPose(config.horizonPitch * Math.PI / 180, config.horizonRoll * Math.PI / 180);
      animateInit();
      return this;
    };
    this.startAutoRotate = function(speed2, pitch, hfov, inactivityDelay) {
      speed2 = speed2 || autoRotateSpeed || 1;
      pitch = pitch === undefined$1 ? origPitch : pitch;
      hfov = hfov === undefined$1 ? origHfov : hfov;
      config.autoRotate = speed2;
      if (inactivityDelay !== undefined$1)
        config.autoRotateInactivityDelay = inactivityDelay;
      _this.lookAt(pitch, undefined$1, hfov, 3e3);
      animateInit();
      return this;
    };
    this.stopAutoRotate = function() {
      autoRotateSpeed = config.autoRotate ? config.autoRotate : autoRotateSpeed;
      config.autoRotate = false;
      config.autoRotateInactivityDelay = -1;
      return this;
    };
    this.stopMovement = function() {
      stopAnimation();
      speed = { "yaw": 0, "pitch": 0, "hfov": 0 };
    };
    this.getRenderer = function() {
      return renderer;
    };
    this.setUpdate = function(bool) {
      update2 = bool === true;
      if (renderer === undefined$1)
        onImageLoad();
      else
        animateInit();
      return this;
    };
    this.mouseEventToCoords = function(event2) {
      return mouseEventToCoords(event2);
    };
    this.loadScene = function(sceneId, pitch, yaw, hfov) {
      if (loaded !== false)
        loadScene(sceneId, pitch, yaw, hfov);
      return this;
    };
    this.getScene = function() {
      return config.scene;
    };
    this.addScene = function(sceneId, config2) {
      initialConfig.scenes[sceneId] = config2;
      return this;
    };
    this.removeScene = function(sceneId) {
      if (config.scene === sceneId || !initialConfig.scenes.hasOwnProperty(sceneId))
        return false;
      delete initialConfig.scenes[sceneId];
      return true;
    };
    this.toggleFullscreen = function() {
      toggleFullscreen();
      return this;
    };
    this.getConfig = function() {
      return config;
    };
    this.getContainer = function() {
      return container;
    };
    this.addHotSpot = function(hs, sceneId) {
      if (sceneId === undefined$1 && config.scene === undefined$1) {
        config.hotSpots.push(hs);
      } else {
        var id = sceneId !== undefined$1 ? sceneId : config.scene;
        if (initialConfig.scenes.hasOwnProperty(id)) {
          if (!initialConfig.scenes[id].hasOwnProperty("hotSpots")) {
            initialConfig.scenes[id].hotSpots = [];
            if (id == config.scene)
              config.hotSpots = initialConfig.scenes[id].hotSpots;
          }
          initialConfig.scenes[id].hotSpots.push(hs);
        } else {
          throw "Invalid scene ID!";
        }
      }
      if (sceneId === undefined$1 || config.scene == sceneId) {
        createHotSpot(hs);
        if (loaded)
          renderHotSpot(hs);
      }
      return this;
    };
    this.removeHotSpot = function(hotSpotId, sceneId) {
      if (sceneId === undefined$1 || config.scene == sceneId) {
        if (!config.hotSpots)
          return false;
        for (var i2 = 0; i2 < config.hotSpots.length; i2++) {
          if (config.hotSpots[i2].hasOwnProperty("id") && config.hotSpots[i2].id === hotSpotId) {
            var current = config.hotSpots[i2].div;
            while (current.parentNode != uiContainer)
              current = current.parentNode;
            uiContainer.removeChild(current);
            delete config.hotSpots[i2].div;
            config.hotSpots.splice(i2, 1);
            return true;
          }
        }
      } else {
        if (initialConfig.scenes.hasOwnProperty(sceneId)) {
          if (!initialConfig.scenes[sceneId].hasOwnProperty("hotSpots"))
            return false;
          for (var j = 0; j < initialConfig.scenes[sceneId].hotSpots.length; j++) {
            if (initialConfig.scenes[sceneId].hotSpots[j].hasOwnProperty("id") && initialConfig.scenes[sceneId].hotSpots[j].id === hotSpotId) {
              initialConfig.scenes[sceneId].hotSpots.splice(j, 1);
              return true;
            }
          }
        } else {
          return false;
        }
      }
    };
    this.resize = function() {
      if (renderer)
        onDocumentResize();
    };
    this.isOrientationSupported = function() {
      return orientationSupport || false;
    };
    this.stopOrientation = function() {
      stopOrientation();
    };
    this.startOrientation = function() {
      startOrientation();
    };
    this.isOrientationActive = function() {
      return Boolean(orientation);
    };
    this.on = function(type2, listener) {
      externalEventListeners[type2] = externalEventListeners[type2] || [];
      externalEventListeners[type2].push(listener);
      return this;
    };
    this.off = function(type2, listener) {
      if (!type2) {
        externalEventListeners = {};
        return this;
      }
      if (listener) {
        var i2 = externalEventListeners[type2].indexOf(listener);
        if (i2 >= 0) {
          externalEventListeners[type2].splice(i2, 1);
        }
        if (externalEventListeners[type2].length == 0) {
          delete externalEventListeners[type2];
        }
      } else {
        delete externalEventListeners[type2];
      }
      return this;
    };
    function fireEvent(type2) {
      if (type2 in externalEventListeners) {
        for (var i2 = externalEventListeners[type2].length; i2 > 0; i2--) {
          externalEventListeners[type2][externalEventListeners[type2].length - i2].apply(null, [].slice.call(arguments, 1));
        }
      }
    }
    this.destroy = function() {
      destroyed = true;
      clearTimeout(autoRotateStart);
      if (renderer)
        renderer.destroy();
      if (listenersAdded) {
        document2.removeEventListener("mousemove", onDocumentMouseMove, false);
        document2.removeEventListener("mouseup", onDocumentMouseUp, false);
        container.removeEventListener("mozfullscreenchange", onFullScreenChange, false);
        container.removeEventListener("webkitfullscreenchange", onFullScreenChange, false);
        container.removeEventListener("msfullscreenchange", onFullScreenChange, false);
        container.removeEventListener("fullscreenchange", onFullScreenChange, false);
        if (resizeObserver) {
          resizeObserver.disconnect();
        } else {
          window2.removeEventListener("resize", onDocumentResize, false);
          window2.removeEventListener("orientationchange", onDocumentResize, false);
        }
        container.removeEventListener("keydown", onDocumentKeyPress, false);
        container.removeEventListener("keyup", onDocumentKeyUp, false);
        container.removeEventListener("blur", clearKeys, false);
        document2.removeEventListener("mouseleave", onDocumentMouseUp, false);
      }
      container.innerHTML = "";
      container.classList.remove("pnlm-container");
    };
  }
  return {
    viewer: function(container, config) {
      return new Viewer2(container, config);
    }
  };
}(window, document);
window.libpannellum = function(window2, document2, undefined$1) {
  function Renderer(container, context) {
    var canvas;
    if (container) {
      canvas = document2.createElement("canvas");
      canvas.style.width = canvas.style.height = "100%";
      container.appendChild(canvas);
    }
    var program, gl, vs, fs;
    var previewProgram, previewVs, previewFs;
    var fallbackImgSize;
    var world;
    var vtmps;
    var pose;
    var image, imageType, dynamic;
    var texCoordBuffer, cubeVertBuf, cubeVertTexCoordBuf, cubeVertIndBuf;
    var globalParams;
    var sides = ["f", "b", "u", "d", "l", "r"];
    var fallbackSides = ["f", "r", "b", "l", "u", "d"];
    if (context)
      gl = context;
    this.init = function(_image, _imageType, _dynamic, haov, vaov, voffset, callback, params) {
      if (_imageType === undefined$1)
        _imageType = "equirectangular";
      if (_imageType != "equirectangular" && _imageType != "cubemap" && _imageType != "multires") {
        console.log("Error: invalid image type specified!");
        throw { type: "config error" };
      }
      imageType = _imageType;
      image = _image;
      dynamic = _dynamic;
      globalParams = params || {};
      if (program) {
        if (vs) {
          gl.detachShader(program, vs);
          gl.deleteShader(vs);
        }
        if (fs) {
          gl.detachShader(program, fs);
          gl.deleteShader(fs);
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        if (program.texture)
          gl.deleteTexture(program.texture);
        if (program.nodeCache)
          for (var i2 = 0; i2 < program.nodeCache.length; i2++)
            gl.deleteTexture(program.nodeCache[i2].texture);
        if (program.textureLoads) {
          pendingTextureRequests = [];
          while (program.textureLoads.length > 0)
            program.textureLoads.shift()(false);
        }
        gl.deleteProgram(program);
        program = undefined$1;
      }
      if (previewProgram) {
        if (previewVs) {
          gl.detachShader(previewProgram, previewVs);
          gl.deleteShader(previewVs);
        }
        if (previewFs) {
          gl.detachShader(previewProgram, previewFs);
          gl.deleteShader(previewFs);
        }
        gl.deleteProgram(previewProgram);
        previewProgram = undefined$1;
      }
      pose = undefined$1;
      var s;
      var faceMissing = false;
      var cubeImgWidth;
      if (imageType == "cubemap") {
        for (s = 0; s < 6; s++) {
          if (image[s].width > 0) {
            if (cubeImgWidth === undefined$1)
              cubeImgWidth = image[s].width;
            if (cubeImgWidth != image[s].width)
              console.log("Cube faces have inconsistent widths: " + cubeImgWidth + " vs. " + image[s].width);
          } else
            faceMissing = true;
        }
      }
      function fillMissingFaces(imgSize) {
        if (faceMissing) {
          var nbytes = imgSize * imgSize * 4;
          var imageArray = new Uint8ClampedArray(nbytes);
          var rgb = params.backgroundColor ? params.backgroundColor : [0, 0, 0];
          rgb[0] *= 255;
          rgb[1] *= 255;
          rgb[2] *= 255;
          for (var i3 = 0; i3 < nbytes; i3++) {
            imageArray[i3++] = rgb[0];
            imageArray[i3++] = rgb[1];
            imageArray[i3++] = rgb[2];
          }
          var backgroundSquare = new ImageData(imageArray, imgSize, imgSize);
          for (s = 0; s < 6; s++) {
            if (image[s].width == 0)
              image[s] = backgroundSquare;
          }
        }
      }
      if (!(imageType == "cubemap" && (cubeImgWidth & cubeImgWidth - 1) !== 0 && (navigator.userAgent.toLowerCase().match(/(iphone|ipod|ipad).* os 8_/) || navigator.userAgent.toLowerCase().match(/(iphone|ipod|ipad).* os 9_/) || navigator.userAgent.toLowerCase().match(/(iphone|ipod|ipad).* os 10_/) || navigator.userAgent.match(/Trident.*rv[ :]*11\./)))) {
        if (!gl)
          gl = canvas.getContext("experimental-webgl", { alpha: false, depth: false });
        if (gl && gl.getError() == 1286)
          handleWebGLError1286();
      }
      if (!gl && (imageType == "multires" && image.hasOwnProperty("fallbackPath") || imageType == "cubemap") && ("WebkitAppearance" in document2.documentElement.style || navigator.userAgent.match(/Trident.*rv[ :]*11\./) || navigator.appVersion.indexOf("MSIE 10") !== -1)) {
        if (world) {
          container.removeChild(world);
        }
        world = document2.createElement("div");
        world.className = "pnlm-world";
        var path;
        if (image.basePath) {
          path = image.basePath + image.fallbackPath;
        } else {
          path = image.fallbackPath;
        }
        var loaded = 0;
        var onLoad = function() {
          var faceCanvas = document2.createElement("canvas");
          faceCanvas.className = "pnlm-face pnlm-" + fallbackSides[this.side] + "face";
          world.appendChild(faceCanvas);
          var faceContext = faceCanvas.getContext("2d");
          faceCanvas.style.width = this.width + 4 + "px";
          faceCanvas.style.height = this.height + 4 + "px";
          faceCanvas.width = this.width + 4;
          faceCanvas.height = this.height + 4;
          faceContext.drawImage(this, 2, 2);
          var imgData = faceContext.getImageData(0, 0, faceCanvas.width, faceCanvas.height);
          var data = imgData.data;
          var i3;
          var j;
          for (i3 = 2; i3 < faceCanvas.width - 2; i3++) {
            for (j = 0; j < 4; j++) {
              data[(i3 + faceCanvas.width) * 4 + j] = data[(i3 + faceCanvas.width * 2) * 4 + j];
              data[(i3 + faceCanvas.width * (faceCanvas.height - 2)) * 4 + j] = data[(i3 + faceCanvas.width * (faceCanvas.height - 3)) * 4 + j];
            }
          }
          for (i3 = 2; i3 < faceCanvas.height - 2; i3++) {
            for (j = 0; j < 4; j++) {
              data[(i3 * faceCanvas.width + 1) * 4 + j] = data[(i3 * faceCanvas.width + 2) * 4 + j];
              data[((i3 + 1) * faceCanvas.width - 2) * 4 + j] = data[((i3 + 1) * faceCanvas.width - 3) * 4 + j];
            }
          }
          for (j = 0; j < 4; j++) {
            data[(faceCanvas.width + 1) * 4 + j] = data[(faceCanvas.width * 2 + 2) * 4 + j];
            data[(faceCanvas.width * 2 - 2) * 4 + j] = data[(faceCanvas.width * 3 - 3) * 4 + j];
            data[(faceCanvas.width * (faceCanvas.height - 2) + 1) * 4 + j] = data[(faceCanvas.width * (faceCanvas.height - 3) + 2) * 4 + j];
            data[(faceCanvas.width * (faceCanvas.height - 1) - 2) * 4 + j] = data[(faceCanvas.width * (faceCanvas.height - 2) - 3) * 4 + j];
          }
          for (i3 = 1; i3 < faceCanvas.width - 1; i3++) {
            for (j = 0; j < 4; j++) {
              data[i3 * 4 + j] = data[(i3 + faceCanvas.width) * 4 + j];
              data[(i3 + faceCanvas.width * (faceCanvas.height - 1)) * 4 + j] = data[(i3 + faceCanvas.width * (faceCanvas.height - 2)) * 4 + j];
            }
          }
          for (i3 = 1; i3 < faceCanvas.height - 1; i3++) {
            for (j = 0; j < 4; j++) {
              data[i3 * faceCanvas.width * 4 + j] = data[(i3 * faceCanvas.width + 1) * 4 + j];
              data[((i3 + 1) * faceCanvas.width - 1) * 4 + j] = data[((i3 + 1) * faceCanvas.width - 2) * 4 + j];
            }
          }
          for (j = 0; j < 4; j++) {
            data[j] = data[(faceCanvas.width + 1) * 4 + j];
            data[(faceCanvas.width - 1) * 4 + j] = data[(faceCanvas.width * 2 - 2) * 4 + j];
            data[faceCanvas.width * (faceCanvas.height - 1) * 4 + j] = data[(faceCanvas.width * (faceCanvas.height - 2) + 1) * 4 + j];
            data[(faceCanvas.width * faceCanvas.height - 1) * 4 + j] = data[(faceCanvas.width * (faceCanvas.height - 1) - 2) * 4 + j];
          }
          faceContext.putImageData(imgData, 0, 0);
          incLoaded.call(this);
        };
        var incLoaded = function() {
          if (this.width > 0) {
            if (fallbackImgSize === undefined$1)
              fallbackImgSize = this.width;
            if (fallbackImgSize != this.width)
              console.log("Fallback faces have inconsistent widths: " + fallbackImgSize + " vs. " + this.width);
          } else
            faceMissing = true;
          loaded++;
          if (loaded == 6) {
            fallbackImgSize = this.width;
            container.appendChild(world);
            callback();
          }
        };
        faceMissing = false;
        for (s = 0; s < 6; s++) {
          var faceImg = new Image();
          faceImg.crossOrigin = globalParams.crossOrigin ? globalParams.crossOrigin : "anonymous";
          faceImg.side = s;
          faceImg.onload = onLoad;
          faceImg.onerror = incLoaded;
          if (imageType == "multires") {
            faceImg.src = path.replace("%s", fallbackSides[s]) + (image.extension ? "." + image.extension : "");
          } else {
            faceImg.src = image[s].src;
          }
        }
        fillMissingFaces(fallbackImgSize);
        return;
      } else if (!gl) {
        console.log("Error: no WebGL support detected!");
        throw { type: "no webgl" };
      }
      if (imageType == "cubemap")
        fillMissingFaces(cubeImgWidth);
      if (image.basePath) {
        image.fullpath = image.basePath + image.path;
      } else {
        image.fullpath = image.path;
      }
      image.invTileResolution = 1 / image.tileResolution;
      var vertices = createCube();
      vtmps = [];
      for (s = 0; s < 6; s++) {
        vtmps[s] = vertices.slice(s * 12, s * 12 + 12);
        vertices = createCube();
      }
      var maxWidth = 0;
      if (imageType == "equirectangular") {
        maxWidth = gl.getParameter(gl.MAX_TEXTURE_SIZE);
        if (Math.max(image.width / 2, image.height) > maxWidth) {
          console.log("Error: The image is too big; it's " + image.width + "px wide, but this device's maximum supported size is " + maxWidth * 2 + "px.");
          throw { type: "webgl size error", width: image.width, maxWidth: maxWidth * 2 };
        }
      } else if (imageType == "cubemap") {
        if (cubeImgWidth > gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE)) {
          console.log("Error: The image is too big; it's " + cubeImgWidth + "px wide, but this device's maximum supported size is " + maxWidth + "px.");
          throw { type: "webgl size error", width: cubeImgWidth, maxWidth };
        }
      }
      if (params !== undefined$1) {
        var horizonPitch = isNaN(params.horizonPitch) ? 0 : Number(params.horizonPitch), horizonRoll = isNaN(params.horizonRoll) ? 0 : Number(params.horizonRoll);
        if (horizonPitch != 0 || horizonRoll != 0)
          pose = [horizonPitch, horizonRoll];
      }
      var glBindType = gl.TEXTURE_2D;
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      if (gl.getShaderPrecisionFormat) {
        var precision = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
        if (precision && precision.precision < 1) {
          fragEquiCubeBase = fragEquiCubeBase.replace("highp", "mediump");
        }
      }
      vs = gl.createShader(gl.VERTEX_SHADER);
      var vertexSrc2 = v2;
      if (imageType == "multires") {
        vertexSrc2 = vMulti;
      }
      gl.shaderSource(vs, vertexSrc2);
      gl.compileShader(vs);
      fs = gl.createShader(gl.FRAGMENT_SHADER);
      var fragmentSrc2 = fragEquirectangular;
      if (imageType == "cubemap") {
        glBindType = gl.TEXTURE_CUBE_MAP;
        fragmentSrc2 = fragCube;
      } else if (imageType == "multires") {
        fragmentSrc2 = fragMulti;
      }
      gl.shaderSource(fs, fragmentSrc2);
      gl.compileShader(fs);
      program = gl.createProgram();
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);
      if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS))
        console.log(gl.getShaderInfoLog(vs));
      if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS))
        console.log(gl.getShaderInfoLog(fs));
      if (!gl.getProgramParameter(program, gl.LINK_STATUS))
        console.log(gl.getProgramInfoLog(program));
      gl.useProgram(program);
      program.drawInProgress = false;
      if (params.backgroundColor !== null) {
        var color = params.backgroundColor ? params.backgroundColor : [0, 0, 0];
        gl.clearColor(color[0], color[1], color[2], 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
      }
      program.texCoordLocation = gl.getAttribLocation(program, "a_texCoord");
      gl.enableVertexAttribArray(program.texCoordLocation);
      if (imageType != "multires") {
        if (!texCoordBuffer)
          texCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, 1, 1, 1, 1, -1, -1, 1, 1, -1, -1, -1]), gl.STATIC_DRAW);
        gl.vertexAttribPointer(program.texCoordLocation, 2, gl.FLOAT, false, 0, 0);
        program.aspectRatio = gl.getUniformLocation(program, "u_aspectRatio");
        gl.uniform1f(program.aspectRatio, gl.drawingBufferWidth / gl.drawingBufferHeight);
        program.psi = gl.getUniformLocation(program, "u_psi");
        program.theta = gl.getUniformLocation(program, "u_theta");
        program.f = gl.getUniformLocation(program, "u_f");
        program.h = gl.getUniformLocation(program, "u_h");
        program.v = gl.getUniformLocation(program, "u_v");
        program.vo = gl.getUniformLocation(program, "u_vo");
        program.rot = gl.getUniformLocation(program, "u_rot");
        gl.uniform1f(program.h, haov / (Math.PI * 2));
        gl.uniform1f(program.v, vaov / Math.PI);
        gl.uniform1f(program.vo, voffset / Math.PI * 2);
        if (imageType == "equirectangular") {
          program.backgroundColor = gl.getUniformLocation(program, "u_backgroundColor");
          gl.uniform4fv(program.backgroundColor, color.concat([1]));
        }
        program.texture = gl.createTexture();
        gl.bindTexture(glBindType, program.texture);
        if (imageType == "cubemap") {
          gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image[1]);
          gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image[3]);
          gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image[4]);
          gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image[5]);
          gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image[0]);
          gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image[2]);
        } else {
          if (image.width <= maxWidth) {
            gl.uniform1i(gl.getUniformLocation(program, "u_splitImage"), 0);
            gl.texImage2D(glBindType, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
          } else {
            gl.uniform1i(gl.getUniformLocation(program, "u_splitImage"), 1);
            var cropCanvas = document2.createElement("canvas");
            cropCanvas.width = image.width / 2;
            cropCanvas.height = image.height;
            var cropContext = cropCanvas.getContext("2d");
            cropContext.drawImage(image, 0, 0);
            var cropImage = cropContext.getImageData(0, 0, image.width / 2, image.height);
            gl.texImage2D(glBindType, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, cropImage);
            program.texture2 = gl.createTexture();
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(glBindType, program.texture2);
            gl.uniform1i(gl.getUniformLocation(program, "u_image1"), 1);
            cropContext.drawImage(image, -image.width / 2, 0);
            cropImage = cropContext.getImageData(0, 0, image.width / 2, image.height);
            gl.texImage2D(glBindType, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, cropImage);
            gl.texParameteri(glBindType, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(glBindType, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(glBindType, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(glBindType, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.activeTexture(gl.TEXTURE0);
          }
        }
        if (imageType != "cubemap" && image.width <= maxWidth && haov == 2 * Math.PI && (image.width & image.width - 1) == 0)
          gl.texParameteri(glBindType, gl.TEXTURE_WRAP_S, gl.REPEAT);
        else
          gl.texParameteri(glBindType, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(glBindType, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(glBindType, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(glBindType, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      } else {
        program.vertPosLocation = gl.getAttribLocation(program, "a_vertCoord");
        gl.enableVertexAttribArray(program.vertPosLocation);
        if (!cubeVertBuf)
          cubeVertBuf = gl.createBuffer();
        if (!cubeVertTexCoordBuf)
          cubeVertTexCoordBuf = gl.createBuffer();
        if (!cubeVertIndBuf)
          cubeVertIndBuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertTexCoordBuf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]), gl.STATIC_DRAW);
        gl.vertexAttribPointer(program.texCoordLocation, 2, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertIndBuf);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertBuf);
        gl.vertexAttribPointer(program.vertPosLocation, 3, gl.FLOAT, false, 0, 0);
        program.perspUniform = gl.getUniformLocation(program, "u_perspMatrix");
        program.cubeUniform = gl.getUniformLocation(program, "u_cubeMatrix");
        program.level = -1;
        program.currentNodes = [];
        program.nodeCache = [];
        program.nodeCacheTimestamp = 0;
        program.textureLoads = [];
        if (image.shtHash || image.equirectangularThumbnail) {
          previewVs = gl.createShader(gl.VERTEX_SHADER);
          gl.shaderSource(previewVs, v2);
          gl.compileShader(previewVs);
          previewFs = gl.createShader(gl.FRAGMENT_SHADER);
          gl.shaderSource(previewFs, fragEquirectangular);
          gl.compileShader(previewFs);
          previewProgram = gl.createProgram();
          gl.attachShader(previewProgram, previewVs);
          gl.attachShader(previewProgram, previewFs);
          gl.linkProgram(previewProgram);
          if (!gl.getShaderParameter(previewVs, gl.COMPILE_STATUS))
            console.log(gl.getShaderInfoLog(previewVs));
          if (!gl.getShaderParameter(previewFs, gl.COMPILE_STATUS))
            console.log(gl.getShaderInfoLog(previewFs));
          if (!gl.getProgramParameter(previewProgram, gl.LINK_STATUS))
            console.log(gl.getProgramInfoLog(previewProgram));
          gl.useProgram(previewProgram);
          previewProgram.texCoordLocation = gl.getAttribLocation(previewProgram, "a_texCoord");
          gl.enableVertexAttribArray(previewProgram.texCoordLocation);
          if (!texCoordBuffer)
            texCoordBuffer = gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, 1, 1, 1, 1, -1, -1, 1, 1, -1, -1, -1]), gl.STATIC_DRAW);
          gl.vertexAttribPointer(previewProgram.texCoordLocation, 2, gl.FLOAT, false, 0, 0);
          previewProgram.aspectRatio = gl.getUniformLocation(previewProgram, "u_aspectRatio");
          gl.uniform1f(previewProgram.aspectRatio, gl.drawingBufferWidth / gl.drawingBufferHeight);
          previewProgram.psi = gl.getUniformLocation(previewProgram, "u_psi");
          previewProgram.theta = gl.getUniformLocation(previewProgram, "u_theta");
          previewProgram.f = gl.getUniformLocation(previewProgram, "u_f");
          previewProgram.h = gl.getUniformLocation(previewProgram, "u_h");
          previewProgram.v = gl.getUniformLocation(previewProgram, "u_v");
          previewProgram.vo = gl.getUniformLocation(previewProgram, "u_vo");
          previewProgram.rot = gl.getUniformLocation(previewProgram, "u_rot");
          gl.uniform1f(previewProgram.h, 1);
          previewProgram.texture = gl.createTexture();
          gl.bindTexture(glBindType, previewProgram.texture);
          var previewImage, vext, voff;
          var uploadPreview = function() {
            gl.useProgram(previewProgram);
            gl.uniform1i(gl.getUniformLocation(previewProgram, "u_splitImage"), 0);
            gl.texImage2D(glBindType, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, previewImage);
            gl.texParameteri(glBindType, gl.TEXTURE_WRAP_S, gl.REPEAT);
            gl.texParameteri(glBindType, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(glBindType, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(glBindType, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.uniform1f(previewProgram.v, vext);
            gl.uniform1f(previewProgram.vo, voff);
            gl.useProgram(program);
          };
          if (image.shtHash) {
            previewImage = shtDecodeImage(image.shtHash);
            vext = (2 + 1 / 31) / 2;
            voff = 1 - (2 + 1 / 31) / 2;
            uploadPreview();
          }
          if (image.equirectangularThumbnail) {
            if (typeof image.equirectangularThumbnail === "string") {
              if (image.equirectangularThumbnail.slice(0, 5) == "data:") {
                previewImage = new Image();
                previewImage.onload = function() {
                  vext = 1;
                  voff = 0;
                  uploadPreview();
                };
                previewImage.src = image.equirectangularThumbnail;
              } else {
                console.log("Error: thumbnail string is not a data URI!");
                throw { type: "config error" };
              }
            } else {
              previewImage = image.equirectangularThumbnail;
              vext = 1;
              voff = 0;
              uploadPreview();
            }
          }
          gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertBuf);
          gl.vertexAttribPointer(program.vertPosLocation, 3, gl.FLOAT, false, 0, 0);
          gl.useProgram(program);
        }
      }
      var err = gl.getError();
      if (err !== 0) {
        console.log("Error: Something went wrong with WebGL!", err);
        throw { type: "webgl error" };
      }
      callback();
    };
    this.destroy = function() {
      if (container !== undefined$1) {
        if (canvas !== undefined$1 && container.contains(canvas)) {
          container.removeChild(canvas);
        }
        if (world !== undefined$1 && container.contains(world)) {
          container.removeChild(world);
        }
      }
      if (gl) {
        var extension = gl.getExtension("WEBGL_lose_context");
        if (extension)
          extension.loseContext();
      }
    };
    this.resize = function() {
      var pixelRatio2 = window2.devicePixelRatio || 1;
      canvas.width = canvas.clientWidth * pixelRatio2;
      canvas.height = canvas.clientHeight * pixelRatio2;
      if (gl) {
        if (gl.getError() == 1286)
          handleWebGLError1286();
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        if (imageType != "multires") {
          gl.uniform1f(program.aspectRatio, canvas.clientWidth / canvas.clientHeight);
        } else if (image.shtHash) {
          gl.useProgram(previewProgram);
          gl.uniform1f(previewProgram.aspectRatio, canvas.clientWidth / canvas.clientHeight);
          gl.useProgram(program);
        }
      }
    };
    if (canvas)
      this.resize();
    this.setPose = function(horizonPitch, horizonRoll) {
      horizonPitch = isNaN(horizonPitch) ? 0 : Number(horizonPitch);
      horizonRoll = isNaN(horizonRoll) ? 0 : Number(horizonRoll);
      if (horizonPitch == 0 && horizonRoll == 0)
        pose = undefined$1;
      else
        pose = [horizonPitch, horizonRoll];
    };
    this.render = function(pitch, yaw, hfov, params) {
      var focal, i2, s, roll = 0;
      if (params === undefined$1)
        params = {};
      if (params.roll)
        roll = params.roll;
      if (pose !== undefined$1) {
        var horizonPitch = pose[0], horizonRoll = pose[1];
        var orig_pitch = pitch, orig_yaw = yaw, x = Math.cos(horizonRoll) * Math.sin(pitch) * Math.sin(horizonPitch) + Math.cos(pitch) * (Math.cos(horizonPitch) * Math.cos(yaw) + Math.sin(horizonRoll) * Math.sin(horizonPitch) * Math.sin(yaw)), y = -Math.sin(pitch) * Math.sin(horizonRoll) + Math.cos(pitch) * Math.cos(horizonRoll) * Math.sin(yaw), z = Math.cos(horizonRoll) * Math.cos(horizonPitch) * Math.sin(pitch) + Math.cos(pitch) * (-Math.cos(yaw) * Math.sin(horizonPitch) + Math.cos(horizonPitch) * Math.sin(horizonRoll) * Math.sin(yaw));
        pitch = Math.asin(Math.max(Math.min(z, 1), -1));
        yaw = Math.atan2(y, x);
        var v3 = [
          Math.cos(orig_pitch) * (Math.sin(horizonRoll) * Math.sin(horizonPitch) * Math.cos(orig_yaw) - Math.cos(horizonPitch) * Math.sin(orig_yaw)),
          Math.cos(orig_pitch) * Math.cos(horizonRoll) * Math.cos(orig_yaw),
          Math.cos(orig_pitch) * (Math.cos(horizonPitch) * Math.sin(horizonRoll) * Math.cos(orig_yaw) + Math.sin(orig_yaw) * Math.sin(horizonPitch))
        ], w = [-Math.cos(pitch) * Math.sin(yaw), Math.cos(pitch) * Math.cos(yaw)];
        var roll_adj = Math.acos(Math.max(Math.min((v3[0] * w[0] + v3[1] * w[1]) / (Math.sqrt(v3[0] * v3[0] + v3[1] * v3[1] + v3[2] * v3[2]) * Math.sqrt(w[0] * w[0] + w[1] * w[1])), 1), -1));
        if (v3[2] < 0)
          roll_adj = 2 * Math.PI - roll_adj;
        roll += roll_adj;
      }
      if (!gl && (imageType == "multires" || imageType == "cubemap")) {
        s = fallbackImgSize / 2;
        var transforms = {
          f: "translate3d(-" + (s + 2) + "px, -" + (s + 2) + "px, -" + s + "px)",
          b: "translate3d(" + (s + 2) + "px, -" + (s + 2) + "px, " + s + "px) rotateX(180deg) rotateZ(180deg)",
          u: "translate3d(-" + (s + 2) + "px, -" + s + "px, " + (s + 2) + "px) rotateX(270deg)",
          d: "translate3d(-" + (s + 2) + "px, " + s + "px, -" + (s + 2) + "px) rotateX(90deg)",
          l: "translate3d(-" + s + "px, -" + (s + 2) + "px, " + (s + 2) + "px) rotateX(180deg) rotateY(90deg) rotateZ(180deg)",
          r: "translate3d(" + s + "px, -" + (s + 2) + "px, -" + (s + 2) + "px) rotateY(270deg)"
        };
        focal = 1 / Math.tan(hfov / 2);
        var zoom = focal * canvas.clientWidth / 2 + "px";
        var transform = "perspective(" + zoom + ") translateZ(" + zoom + ") rotateX(" + pitch + "rad) rotateY(" + yaw + "rad) ";
        var faces = Object.keys(transforms);
        for (i2 = 0; i2 < 6; i2++) {
          var face2 = world.querySelector(".pnlm-" + faces[i2] + "face");
          if (!face2)
            continue;
          face2.style.webkitTransform = transform + transforms[faces[i2]];
          face2.style.transform = transform + transforms[faces[i2]];
        }
        return;
      }
      if (imageType != "multires") {
        var vfov = 2 * Math.atan(Math.tan(hfov * 0.5) / (gl.drawingBufferWidth / gl.drawingBufferHeight));
        focal = 1 / Math.tan(vfov * 0.5);
        gl.uniform1f(program.psi, yaw);
        gl.uniform1f(program.theta, pitch);
        gl.uniform1f(program.rot, roll);
        gl.uniform1f(program.f, focal);
        if (dynamic === true) {
          if (imageType == "equirectangular") {
            gl.bindTexture(gl.TEXTURE_2D, program.texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
          }
        }
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      } else {
        var isPreview = typeof image.shtHash !== "undefined" || typeof image.equirectangularThumbnail !== "undefined";
        var drawPreview = isPreview;
        if (isPreview && program.currentNodes.length >= 6) {
          drawPreview = false;
          for (var i2 = 0; i2 < 6; i2++) {
            if (!program.currentNodes[i2].textureLoaded) {
              drawPreview = true;
              break;
            }
          }
        }
        if (drawPreview) {
          gl.useProgram(previewProgram);
          gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
          gl.vertexAttribPointer(previewProgram.texCoordLocation, 2, gl.FLOAT, false, 0, 0);
          gl.bindTexture(gl.TEXTURE_2D, previewProgram.texture);
          var vfov = 2 * Math.atan(Math.tan(hfov * 0.5) / (gl.drawingBufferWidth / gl.drawingBufferHeight));
          focal = 1 / Math.tan(vfov * 0.5);
          gl.uniform1f(previewProgram.psi, yaw);
          gl.uniform1f(previewProgram.theta, pitch);
          gl.uniform1f(previewProgram.rot, roll);
          gl.uniform1f(previewProgram.f, focal);
          gl.drawArrays(gl.TRIANGLES, 0, 6);
          gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertBuf);
          gl.vertexAttribPointer(program.vertPosLocation, 3, gl.FLOAT, false, 0, 0);
          gl.useProgram(program);
        }
        var perspMatrix = makePersp(hfov, gl.drawingBufferWidth / gl.drawingBufferHeight, 0.1, 100);
        checkZoom(hfov);
        var matrix = identityMatrix3();
        matrix = rotateMatrix(matrix, -roll, "z");
        matrix = rotateMatrix(matrix, -pitch, "x");
        matrix = rotateMatrix(matrix, yaw, "y");
        matrix = makeMatrix4(matrix);
        gl.uniformMatrix4fv(program.perspUniform, false, transposeMatrix4(perspMatrix));
        gl.uniformMatrix4fv(program.cubeUniform, false, transposeMatrix4(matrix));
        var rotPersp = rotatePersp(perspMatrix, matrix);
        program.nodeCache.sort(multiresNodeSort);
        if (program.nodeCache.length > 200 && program.nodeCache.length > program.currentNodes.length + 50) {
          var removed = program.nodeCache.splice(200, program.nodeCache.length - 200);
          for (var j = 0; j < removed.length; j++) {
            gl.deleteTexture(removed[j].texture);
          }
        }
        program.currentNodes = [];
        for (s = 0; s < 6; s++) {
          var ntmp = new MultiresNode(vtmps[s], sides[s], 1, 0, 0, image.fullpath, null);
          testMultiresNode(rotPersp, ntmp, pitch, yaw);
        }
        program.currentNodes.sort(multiresNodeRenderSort);
        for (i2 = pendingTextureRequests.length - 1; i2 >= 0; i2--) {
          if (program.currentNodes.indexOf(pendingTextureRequests[i2].node) === -1) {
            pendingTextureRequests[i2].node.textureLoad = false;
            pendingTextureRequests.splice(i2, 1);
          }
        }
        if (pendingTextureRequests.length === 0) {
          for (i2 = 0; i2 < program.currentNodes.length; i2++) {
            var node = program.currentNodes[i2];
            if (!node.texture && !node.textureLoad) {
              node.textureLoad = true;
              setTimeout(processNextTile, 0, node);
              break;
            }
          }
        }
        if (program.textureLoads.length > 0)
          program.textureLoads.shift()(true);
        multiresDraw(!isPreview);
      }
      if (params.returnImage !== undefined$1) {
        if (window2.createImageBitmap && params.returnImage == "ImageBitmap") {
          return createImageBitmap(canvas);
        } else {
          if (params.returnImage.toString().indexOf("image/") == 0)
            return canvas.toDataURL(params.returnImage);
          else
            return canvas.toDataURL("image/png");
        }
      }
    };
    this.isLoading = function() {
      if (gl && imageType == "multires") {
        for (var i2 = 0; i2 < program.currentNodes.length; i2++) {
          if (!program.currentNodes[i2].textureLoaded) {
            return true;
          }
        }
      }
      return false;
    };
    this.isBaseLoaded = function() {
      if (program.currentNodes.length >= 6) {
        for (var i2 = 0; i2 < 6; i2++) {
          if (!program.currentNodes[i2].textureLoaded) {
            return false;
          }
        }
        return true;
      }
      return false;
    };
    this.getCanvas = function() {
      return canvas;
    };
    function multiresNodeSort(a, b) {
      if (a.level == 1 && b.level != 1) {
        return -1;
      }
      if (b.level == 1 && a.level != 1) {
        return 1;
      }
      return b.timestamp - a.timestamp;
    }
    function multiresNodeRenderSort(a, b) {
      if (a.level != b.level) {
        return a.level - b.level;
      }
      return a.diff - b.diff;
    }
    function multiresDraw(clear) {
      if (!program.drawInProgress) {
        program.drawInProgress = true;
        if (clear)
          gl.clear(gl.COLOR_BUFFER_BIT);
        var node_paths = {};
        for (var i2 = 0; i2 < program.currentNodes.length; i2++)
          node_paths[program.currentNodes[i2].parentPath] |= !(program.currentNodes[i2].textureLoaded > 1);
        for (var i2 = 0; i2 < program.currentNodes.length; i2++) {
          if (program.currentNodes[i2].textureLoaded > 1 && node_paths[program.currentNodes[i2].path] != 0) {
            gl.bufferData(gl.ARRAY_BUFFER, program.currentNodes[i2].vertices, gl.STATIC_DRAW);
            gl.bindTexture(gl.TEXTURE_2D, program.currentNodes[i2].texture);
            gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
          }
        }
        program.drawInProgress = false;
      }
    }
    function MultiresNode(vertices, side, level, x, y, path, parentPath) {
      this.vertices = vertices;
      this.side = side;
      this.level = level;
      this.x = x;
      this.y = y;
      this.path = path.replace("%s", side).replace("%l0", level - 1).replace("%l", level).replace("%x", x).replace("%y", y);
      this.parentPath = parentPath;
    }
    function testMultiresNode(rotPersp, node, pitch, yaw, hfov) {
      if (checkSquareInView(rotPersp, node.vertices)) {
        var v3 = node.vertices;
        var x = v3[0] + v3[3] + v3[6] + v3[9];
        var y = v3[1] + v3[4] + v3[7] + v3[10];
        var z = v3[2] + v3[5] + v3[8] + v3[11];
        var r = Math.sqrt(x * x + y * y + z * z);
        var theta = Math.asin(z / r);
        var phi = Math.atan2(y, x);
        var ydiff = phi - yaw;
        ydiff += ydiff > Math.PI ? -2 * Math.PI : ydiff < -Math.PI ? 2 * Math.PI : 0;
        ydiff = Math.abs(ydiff);
        node.diff = Math.acos(Math.sin(pitch) * Math.sin(theta) + Math.cos(pitch) * Math.cos(theta) * Math.cos(ydiff));
        var inCurrent = false;
        for (var k = 0; k < program.nodeCache.length; k++) {
          if (program.nodeCache[k].path == node.path) {
            inCurrent = true;
            program.nodeCache[k].timestamp = program.nodeCacheTimestamp++;
            program.nodeCache[k].diff = node.diff;
            program.currentNodes.push(program.nodeCache[k]);
            break;
          }
        }
        if (!inCurrent) {
          node.timestamp = program.nodeCacheTimestamp++;
          program.currentNodes.push(node);
          program.nodeCache.push(node);
        }
        if (node.level < program.level) {
          var cubeSize = image.cubeResolution * Math.pow(2, node.level - image.maxLevel);
          var numTiles = Math.ceil(cubeSize * image.invTileResolution) - 1;
          var doubleTileSize = cubeSize % image.tileResolution * 2;
          var lastTileSize = cubeSize * 2 % image.tileResolution;
          if (lastTileSize === 0) {
            lastTileSize = image.tileResolution;
          }
          if (doubleTileSize === 0) {
            doubleTileSize = image.tileResolution * 2;
          }
          var f = 0.5;
          if (node.x == numTiles || node.y == numTiles) {
            f = 1 - image.tileResolution / (image.tileResolution + lastTileSize);
          }
          var i2 = 1 - f;
          var children2 = [];
          var vtmp, ntmp;
          var f1 = f, f2 = f, f3 = f, i1 = i2, i22 = i2, i3 = i2;
          if (lastTileSize < image.tileResolution) {
            if (node.x == numTiles && node.y != numTiles) {
              f2 = 0.5;
              i22 = 0.5;
              if (node.side == "d" || node.side == "u") {
                f3 = 0.5;
                i3 = 0.5;
              }
            } else if (node.x != numTiles && node.y == numTiles) {
              f1 = 0.5;
              i1 = 0.5;
              if (node.side == "l" || node.side == "r") {
                f3 = 0.5;
                i3 = 0.5;
              }
            }
          }
          if (doubleTileSize <= image.tileResolution) {
            if (node.x == numTiles) {
              f1 = 0;
              i1 = 1;
              if (node.side == "l" || node.side == "r") {
                f3 = 0;
                i3 = 1;
              }
            }
            if (node.y == numTiles) {
              f2 = 0;
              i22 = 1;
              if (node.side == "d" || node.side == "u") {
                f3 = 0;
                i3 = 1;
              }
            }
          }
          vtmp = new Float32Array([
            v3[0],
            v3[1],
            v3[2],
            v3[0] * f1 + v3[3] * i1,
            v3[1] * f + v3[4] * i2,
            v3[2] * f3 + v3[5] * i3,
            v3[0] * f1 + v3[6] * i1,
            v3[1] * f2 + v3[7] * i22,
            v3[2] * f3 + v3[8] * i3,
            v3[0] * f + v3[9] * i2,
            v3[1] * f2 + v3[10] * i22,
            v3[2] * f3 + v3[11] * i3
          ]);
          ntmp = new MultiresNode(vtmp, node.side, node.level + 1, node.x * 2, node.y * 2, image.fullpath, node.path);
          children2.push(ntmp);
          if (!(node.x == numTiles && doubleTileSize <= image.tileResolution)) {
            vtmp = new Float32Array([
              v3[0] * f1 + v3[3] * i1,
              v3[1] * f + v3[4] * i2,
              v3[2] * f3 + v3[5] * i3,
              v3[3],
              v3[4],
              v3[5],
              v3[3] * f + v3[6] * i2,
              v3[4] * f2 + v3[7] * i22,
              v3[5] * f3 + v3[8] * i3,
              v3[0] * f1 + v3[6] * i1,
              v3[1] * f2 + v3[7] * i22,
              v3[2] * f3 + v3[8] * i3
            ]);
            ntmp = new MultiresNode(vtmp, node.side, node.level + 1, node.x * 2 + 1, node.y * 2, image.fullpath, node.path);
            children2.push(ntmp);
          }
          if (!(node.x == numTiles && doubleTileSize <= image.tileResolution) && !(node.y == numTiles && doubleTileSize <= image.tileResolution)) {
            vtmp = new Float32Array([
              v3[0] * f1 + v3[6] * i1,
              v3[1] * f2 + v3[7] * i22,
              v3[2] * f3 + v3[8] * i3,
              v3[3] * f + v3[6] * i2,
              v3[4] * f2 + v3[7] * i22,
              v3[5] * f3 + v3[8] * i3,
              v3[6],
              v3[7],
              v3[8],
              v3[9] * f1 + v3[6] * i1,
              v3[10] * f + v3[7] * i2,
              v3[11] * f3 + v3[8] * i3
            ]);
            ntmp = new MultiresNode(vtmp, node.side, node.level + 1, node.x * 2 + 1, node.y * 2 + 1, image.fullpath, node.path);
            children2.push(ntmp);
          }
          if (!(node.y == numTiles && doubleTileSize <= image.tileResolution)) {
            vtmp = new Float32Array([
              v3[0] * f + v3[9] * i2,
              v3[1] * f2 + v3[10] * i22,
              v3[2] * f3 + v3[11] * i3,
              v3[0] * f1 + v3[6] * i1,
              v3[1] * f2 + v3[7] * i22,
              v3[2] * f3 + v3[8] * i3,
              v3[9] * f1 + v3[6] * i1,
              v3[10] * f + v3[7] * i2,
              v3[11] * f3 + v3[8] * i3,
              v3[9],
              v3[10],
              v3[11]
            ]);
            ntmp = new MultiresNode(vtmp, node.side, node.level + 1, node.x * 2, node.y * 2 + 1, image.fullpath, node.path);
            children2.push(ntmp);
          }
          for (var j = 0; j < children2.length; j++) {
            testMultiresNode(rotPersp, children2[j], pitch, yaw);
          }
        }
      }
    }
    function createCube() {
      return new Float32Array([
        -1,
        1,
        -1,
        1,
        1,
        -1,
        1,
        -1,
        -1,
        -1,
        -1,
        -1,
        1,
        1,
        1,
        -1,
        1,
        1,
        -1,
        -1,
        1,
        1,
        -1,
        1,
        -1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        -1,
        -1,
        1,
        -1,
        -1,
        -1,
        -1,
        1,
        -1,
        -1,
        1,
        -1,
        1,
        -1,
        -1,
        1,
        -1,
        1,
        1,
        -1,
        1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        1,
        1,
        1,
        -1,
        1,
        1,
        1,
        1,
        -1,
        1,
        1,
        -1,
        -1
      ]);
    }
    function identityMatrix3() {
      return new Float32Array([
        1,
        0,
        0,
        0,
        1,
        0,
        0,
        0,
        1
      ]);
    }
    function rotateMatrix(m, angle2, axis) {
      var s = Math.sin(angle2);
      var c = Math.cos(angle2);
      if (axis == "x") {
        return new Float32Array([
          m[0],
          c * m[1] + s * m[2],
          c * m[2] - s * m[1],
          m[3],
          c * m[4] + s * m[5],
          c * m[5] - s * m[4],
          m[6],
          c * m[7] + s * m[8],
          c * m[8] - s * m[7]
        ]);
      }
      if (axis == "y") {
        return new Float32Array([
          c * m[0] - s * m[2],
          m[1],
          c * m[2] + s * m[0],
          c * m[3] - s * m[5],
          m[4],
          c * m[5] + s * m[3],
          c * m[6] - s * m[8],
          m[7],
          c * m[8] + s * m[6]
        ]);
      }
      if (axis == "z") {
        return new Float32Array([
          c * m[0] + s * m[1],
          c * m[1] - s * m[0],
          m[2],
          c * m[3] + s * m[4],
          c * m[4] - s * m[3],
          m[5],
          c * m[6] + s * m[7],
          c * m[7] - s * m[6],
          m[8]
        ]);
      }
    }
    function makeMatrix4(m) {
      return new Float32Array([
        m[0],
        m[1],
        m[2],
        0,
        m[3],
        m[4],
        m[5],
        0,
        m[6],
        m[7],
        m[8],
        0,
        0,
        0,
        0,
        1
      ]);
    }
    function transposeMatrix4(m) {
      return new Float32Array([
        m[0],
        m[4],
        m[8],
        m[12],
        m[1],
        m[5],
        m[9],
        m[13],
        m[2],
        m[6],
        m[10],
        m[14],
        m[3],
        m[7],
        m[11],
        m[15]
      ]);
    }
    function makePersp(hfov, aspect, znear, zfar) {
      var fovy = 2 * Math.atan(Math.tan(hfov / 2) * gl.drawingBufferHeight / gl.drawingBufferWidth);
      var f = 1 / Math.tan(fovy / 2);
      return new Float32Array([
        f / aspect,
        0,
        0,
        0,
        0,
        f,
        0,
        0,
        0,
        0,
        (zfar + znear) / (znear - zfar),
        2 * zfar * znear / (znear - zfar),
        0,
        0,
        -1,
        0
      ]);
    }
    function processLoadedTexture(img, tex) {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindTexture(gl.TEXTURE_2D, null);
    }
    var pendingTextureRequests = [];
    var loadTexture = function() {
      var cacheTop = 4;
      var textureImageCache = {};
      var crossOrigin;
      function TextureImageLoader() {
        var self2 = this;
        this.texture = this.callback = null;
        this.image = new Image();
        this.image.crossOrigin = crossOrigin ? crossOrigin : "anonymous";
        var loadFn = function() {
          program.textureLoads.push(function(execute) {
            if (execute) {
              if (self2.image.width > 0 && self2.image.height > 0) {
                processLoadedTexture(self2.image, self2.texture);
                self2.callback(self2.texture, true);
              } else {
                self2.callback(self2.texture, false);
              }
            }
            releaseTextureImageLoader(self2);
          });
        };
        this.image.addEventListener("load", loadFn);
        this.image.addEventListener("error", loadFn);
      }
      TextureImageLoader.prototype.loadTexture = function(src2, texture, callback) {
        this.texture = texture;
        this.callback = callback;
        this.image.src = src2;
      };
      function PendingTextureRequest(node, src2, texture, callback) {
        this.node = node;
        this.src = src2;
        this.texture = texture;
        this.callback = callback;
      }
      function releaseTextureImageLoader(til) {
        if (pendingTextureRequests.length) {
          var req = pendingTextureRequests.shift();
          til.loadTexture(req.src, req.texture, req.callback);
        } else
          textureImageCache[cacheTop++] = til;
      }
      for (var i2 = 0; i2 < cacheTop; i2++)
        textureImageCache[i2] = new TextureImageLoader();
      return function(node, src2, callback, _crossOrigin) {
        crossOrigin = _crossOrigin;
        var texture = gl.createTexture();
        if (cacheTop)
          textureImageCache[--cacheTop].loadTexture(src2, texture, callback);
        else
          pendingTextureRequests.push(new PendingTextureRequest(node, src2, texture, callback));
        return texture;
      };
    }();
    function processNextTileFallback(node) {
      loadTexture(node, node.path + (image.extension ? "." + image.extension : ""), function(texture, loaded) {
        node.texture = texture;
        node.textureLoaded = loaded ? 2 : 1;
      }, globalParams.crossOrigin);
    }
    var processNextTile;
    if (window2.Worker && window2.createImageBitmap) {
      let workerFunc2 = function() {
        self.onmessage = function(e) {
          var path = e.data[0], crossOrigin = e.data[1];
          fetch(path, {
            mode: "cors",
            credentials: crossOrigin == "use-credentials" ? "include" : "same-origin"
          }).then(function(response) {
            return response.blob();
          }).then(function(blob) {
            return createImageBitmap(blob);
          }).then(function(bitmap) {
            postMessage([path, true, bitmap], [bitmap]);
          }).catch(function() {
            postMessage([path, false]);
          });
        };
      };
      var workerFunc = workerFunc2;
      var workerFuncBlob = new Blob(["(" + workerFunc2.toString() + ")()"], { type: "application/javascript" }), worker = new Worker(URL.createObjectURL(workerFuncBlob)), texturesLoading = {};
      worker.onmessage = function(e) {
        var path = e.data[0], success = e.data[1], bitmap = e.data[2];
        program.textureLoads.push(function(execute) {
          var texture, loaded = false;
          if (success && execute) {
            texture = gl.createTexture();
            processLoadedTexture(bitmap, texture);
            loaded = true;
          }
          var node = texturesLoading[path];
          delete texturesLoading[path];
          if (node !== undefined$1) {
            node.texture = texture;
            node.textureLoaded = loaded ? 2 : 1;
          }
        });
      };
      processNextTile = function(node) {
        var path = new URL(node.path + (image.extension ? "." + image.extension : ""), window2.location).href;
        texturesLoading[path] = node;
        worker.postMessage([path, globalParams.crossOrigin]);
      };
    } else {
      processNextTile = processNextTileFallback;
    }
    function checkZoom(hfov) {
      var newLevel = 1;
      while (newLevel < image.maxLevel && gl.drawingBufferWidth > image.tileResolution * Math.pow(2, newLevel - 1) * Math.tan(hfov / 2) * 0.707) {
        newLevel++;
      }
      program.level = newLevel;
    }
    function rotatePersp(p, r) {
      return new Float32Array([
        p[0] * r[0],
        p[0] * r[1],
        p[0] * r[2],
        0,
        p[5] * r[4],
        p[5] * r[5],
        p[5] * r[6],
        0,
        p[10] * r[8],
        p[10] * r[9],
        p[10] * r[10],
        p[11],
        -r[8],
        -r[9],
        -r[10],
        0
      ]);
    }
    function applyRotPerspToVec(m, v3) {
      return new Float32Array([
        m[0] * v3[0] + m[1] * v3[1] + m[2] * v3[2],
        m[4] * v3[0] + m[5] * v3[1] + m[6] * v3[2],
        m[11] + m[8] * v3[0] + m[9] * v3[1] + m[10] * v3[2],
        1 / (m[12] * v3[0] + m[13] * v3[1] + m[14] * v3[2])
      ]);
    }
    function checkInView(m, v3) {
      var vpp = applyRotPerspToVec(m, v3);
      var winX = vpp[0] * vpp[3];
      var winY = vpp[1] * vpp[3];
      var winZ = vpp[2] * vpp[3];
      var ret = [0, 0, 0];
      if (winX < -1)
        ret[0] = -1;
      if (winX > 1)
        ret[0] = 1;
      if (winY < -1)
        ret[1] = -1;
      if (winY > 1)
        ret[1] = 1;
      if (winZ < -1 || winZ > 1)
        ret[2] = 1;
      return ret;
    }
    function checkSquareInView(m, v3) {
      var check1 = checkInView(m, v3.slice(0, 3));
      var check2 = checkInView(m, v3.slice(3, 6));
      var check3 = checkInView(m, v3.slice(6, 9));
      var check4 = checkInView(m, v3.slice(9, 12));
      var testX = check1[0] + check2[0] + check3[0] + check4[0];
      if (testX == -4 || testX == 4)
        return false;
      var testY = check1[1] + check2[1] + check3[1] + check4[1];
      if (testY == -4 || testY == 4)
        return false;
      var testZ = check1[2] + check2[2] + check3[2] + check4[2];
      return testZ != 4;
    }
    function handleWebGLError1286() {
      console.log("Reducing canvas size due to error 1286!");
      canvas.width = Math.round(canvas.width / 2);
      canvas.height = Math.round(canvas.height / 2);
    }
    var shtB83chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz#$%*+,-.:;=?@[]^_{|}~", shtYlmStr = "Bf[ff4fff|ffff0fffffBo@Ri5xag{Jmdf2+WiefCs@Ll7+Vi]Btag6[NmdgCv=Ho9;Qk;7zWiF_GsahDy:ErE?Mn$5+SkS_AyWiD#-CuJ[Iqp6;Nnx?7*SlE$*BxR@FtPA?Jq+%7:NnF*zAzn?CwIG@Ft-Y9?IrG+vA%w:AzGR?Cx*IF@EuI,nA+$*9%Gu:A#xCR?ByJ-VB-*wA+J**9*ZBv:9%L.QD.*aB.O.v9-MF+$8,O:MG:*OD;a:UB:IO:n9:Q:KJ;#IG=u-KE=Hs:MC?T:IO=wEL?#%FJ@K**FI@Y;HV=pDU?*sCS@S.uCR[m;Hp=VDq?*SCs@s.QCt[r:Iw=OEz?#IF$@#*HF%@u:K$;KI+=uEK-=*sCM:?w:M+:HO.;aCU;:%OCn?:z.Q..Ha;.ODv?-yFG$@,$-V;-Hw=+JH*?*lBP:?%%,n=+J*?%GQ:=#NCt?;y++v=%O:=zGt?:xHI,@-u,*z=zX?:wI+@,tEY??%r-$*;xt@,tP=?$qG%[:xn.#-:u$[%qp];xnN?[*sl.y:-r-?yn$^+sks_=yoi:v=*o?;uk;[zoi,_+skh:s@zl[+pi];tkg][xmhg;o@ti^xkg{$mhf|+oigf;f[ff_fff|ffff~fffff", shtMaxYlm = 3.317, shtYlm = [];
    function shtDecodeFloat(i2, maxVal) {
      return Math.pow((Math.abs(i2) - maxVal) / maxVal, 2) * (i2 - maxVal > 0 ? 1 : -1);
    }
    function shtDecodeCoeff(val, maxVal) {
      var quantR = Math.floor(val / (19 * 19)), quantG = Math.floor(val / 19) % 19, quantB = val % 19;
      var r = shtDecodeFloat(quantR, 9) * maxVal, g = shtDecodeFloat(quantG, 9) * maxVal, b = shtDecodeFloat(quantB, 9) * maxVal;
      return [r, g, b];
    }
    function shtB83decode(b83str, length2) {
      var cnt = Math.floor(b83str.length / length2), vals = [];
      for (var i2 = 0; i2 < cnt; i2++) {
        var val = 0;
        for (var j = 0; j < length2; j++) {
          val = val * 83 + shtB83chars.indexOf(b83str[i2 * length2 + j]);
        }
        vals.push(val);
      }
      return vals;
    }
    function shtFlm2pixel(flm, Ylm, lon) {
      var lmax = Math.floor(Math.sqrt(flm.length)) - 1;
      var cosm = Array(lmax + 1), sinm = Array(lmax + 1);
      sinm[0] = 0;
      cosm[0] = 1;
      sinm[1] = Math.sin(lon);
      cosm[1] = Math.cos(lon);
      for (var m = 2; m <= lmax; m++) {
        sinm[m] = 2 * sinm[m - 1] * cosm[1] - sinm[m - 2];
        cosm[m] = 2 * cosm[m - 1] * cosm[1] - cosm[m - 2];
      }
      var expand = 0, cosidx = 0;
      for (var i2 = 1; i2 <= lmax + 1; i2++)
        cosidx += i2;
      for (var l = lmax; l >= 0; l--) {
        var idx = Math.floor((l + 1) * l / 2);
        expand += idx != 0 ? flm[idx] * Ylm[idx - 1] : flm[idx];
        for (var m = 1; m <= l; m++)
          expand += (flm[++idx] * cosm[m] + flm[idx + cosidx - l - 1] * sinm[m]) * Ylm[idx - 1];
      }
      return Math.round(expand);
    }
    function shtDecodeImage(shtHash) {
      if (shtYlm.length < 1) {
        var ylmLen = shtYlmStr.length / 32;
        for (var i2 = 0; i2 < 32; i2++) {
          shtYlm.push([]);
          for (var j = 0; j < ylmLen; j++)
            shtYlm[i2].push(shtDecodeFloat(shtB83decode(shtYlmStr[i2 * ylmLen + j], 1), 41) * shtMaxYlm);
        }
      }
      shtB83decode(shtHash[0], 1)[0];
      var maxVal = (shtDecodeFloat(shtB83decode(shtHash[1], 1), 41) + 1) * 255 / 2, vals = shtB83decode(shtHash.slice(2), 2), rVals = [], gVals = [], bVals = [];
      for (var i2 = 0; i2 < vals.length; i2++) {
        var v3 = shtDecodeCoeff(vals[i2], maxVal);
        rVals.push(v3[0]);
        gVals.push(v3[1]);
        bVals.push(v3[2]);
      }
      var lonStep = 0.03125 * Math.PI;
      var img = [];
      for (var i2 = 31; i2 >= 0; i2--) {
        for (var j = 0; j < 64; j++) {
          img.push(shtFlm2pixel(rVals, shtYlm[i2], (j + 0.5) * lonStep));
          img.push(shtFlm2pixel(gVals, shtYlm[i2], (j + 0.5) * lonStep));
          img.push(shtFlm2pixel(bVals, shtYlm[i2], (j + 0.5) * lonStep));
          img.push(255);
        }
      }
      return new ImageData(new Uint8ClampedArray(img), 64, 32);
    }
  }
  var v2 = [
    "attribute vec2 a_texCoord;",
    "varying vec2 v_texCoord;",
    "void main() {",
    "gl_Position = vec4(a_texCoord, 0.0, 1.0);",
    "v_texCoord = a_texCoord;",
    "}"
  ].join("");
  var vMulti = [
    "attribute vec3 a_vertCoord;",
    "attribute vec2 a_texCoord;",
    "uniform mat4 u_cubeMatrix;",
    "uniform mat4 u_perspMatrix;",
    "varying mediump vec2 v_texCoord;",
    "void main(void) {",
    "gl_Position = u_perspMatrix * u_cubeMatrix * vec4(a_vertCoord, 1.0);",
    "v_texCoord = a_texCoord;",
    "}"
  ].join("");
  var fragEquiCubeBase = [
    "precision highp float;",
    "uniform float u_aspectRatio;",
    "uniform float u_psi;",
    "uniform float u_theta;",
    "uniform float u_f;",
    "uniform float u_h;",
    "uniform float u_v;",
    "uniform float u_vo;",
    "uniform float u_rot;",
    "const float PI = 3.14159265358979323846264;",
    "uniform sampler2D u_image0;",
    "uniform sampler2D u_image1;",
    "uniform bool u_splitImage;",
    "uniform samplerCube u_imageCube;",
    "varying vec2 v_texCoord;",
    "uniform vec4 u_backgroundColor;",
    "void main() {",
    "float x = v_texCoord.x * u_aspectRatio;",
    "float y = v_texCoord.y;",
    "float sinrot = sin(u_rot);",
    "float cosrot = cos(u_rot);",
    "float rot_x = x * cosrot - y * sinrot;",
    "float rot_y = x * sinrot + y * cosrot;",
    "float sintheta = sin(u_theta);",
    "float costheta = cos(u_theta);",
    "float a = u_f * costheta - rot_y * sintheta;",
    "float root = sqrt(rot_x * rot_x + a * a);",
    "float lambda = atan(rot_x / root, a / root) + u_psi;",
    "float phi = atan((rot_y * costheta + u_f * sintheta) / root);"
  ].join("\n");
  var fragCube = fragEquiCubeBase + [
    "float cosphi = cos(phi);",
    "gl_FragColor = textureCube(u_imageCube, vec3(cosphi*sin(lambda), sin(phi), cosphi*cos(lambda)));",
    "}"
  ].join("\n");
  var fragEquirectangular = fragEquiCubeBase + [
    "lambda = mod(lambda + PI, PI * 2.0) - PI;",
    "vec2 coord = vec2(lambda / PI, phi / (PI / 2.0));",
    "if(coord.x < -u_h || coord.x > u_h || coord.y < -u_v + u_vo || coord.y > u_v + u_vo)",
    "gl_FragColor = u_backgroundColor;",
    "else {",
    "if(u_splitImage) {",
    "if(coord.x < 0.0)",
    "gl_FragColor = texture2D(u_image0, vec2((coord.x + u_h) / u_h, (-coord.y + u_v + u_vo) / (u_v * 2.0)));",
    "else",
    "gl_FragColor = texture2D(u_image1, vec2((coord.x + u_h) / u_h - 1.0, (-coord.y + u_v + u_vo) / (u_v * 2.0)));",
    "} else {",
    "gl_FragColor = texture2D(u_image0, vec2((coord.x + u_h) / (u_h * 2.0), (-coord.y + u_v + u_vo) / (u_v * 2.0)));",
    "}",
    "}",
    "}"
  ].join("\n");
  var fragMulti = [
    "varying mediump vec2 v_texCoord;",
    "uniform sampler2D u_sampler;",
    "void main(void) {",
    "gl_FragColor = texture2D(u_sampler, v_texCoord);",
    "}"
  ].join("");
  return {
    renderer: function(container, image, imagetype, dynamic) {
      return new Renderer(container, image, imagetype, dynamic);
    }
  };
}(window, document);
var pannellum$1 = "";
function create_fragment$1(ctx) {
  let div2;
  let t0;
  let p;
  return {
    c() {
      div2 = element("div");
      t0 = space();
      p = element("p");
      p.textContent = "Hello";
      this.c = noop$5;
    },
    m(target, anchor) {
      insert(target, div2, anchor);
      ctx[2](div2);
      insert(target, t0, anchor);
      insert(target, p, anchor);
    },
    p: noop$5,
    i: noop$5,
    o: noop$5,
    d(detaching) {
      if (detaching)
        detach(div2);
      ctx[2](null);
      if (detaching)
        detach(t0);
      if (detaching)
        detach(p);
    }
  };
}
function instance$1($$self, $$props, $$invalidate) {
  let { gql = {} } = $$props;
  let pano;
  onMount(() => {
    console.log("mounted");
    pannellum.viewer(pano, {
      type: "equirectangular",
      panorama: gql.panorama.mediaItemUrl,
      preview: gql.panorama.sourceUrl
    });
  });
  function div_binding($$value) {
    binding_callbacks[$$value ? "unshift" : "push"](() => {
      pano = $$value;
      $$invalidate(0, pano);
    });
  }
  $$self.$$set = ($$props2) => {
    if ("gql" in $$props2)
      $$invalidate(1, gql = $$props2.gql);
  };
  return [pano, gql, div_binding];
}
class Pannellum extends SvelteElement {
  constructor(options) {
    super();
    init(this, {
      target: this.shadowRoot,
      props: attribute_to_object(this.attributes),
      customElement: true
    }, instance$1, create_fragment$1, safe_not_equal, { gql: 1 }, null);
    if (options) {
      if (options.target) {
        insert(options.target, this, options.anchor);
      }
      if (options.props) {
        this.$set(options.props);
        flush();
      }
    }
  }
  static get observedAttributes() {
    return ["gql"];
  }
  get gql() {
    return this.$$.ctx[1];
  }
  set gql(gql) {
    this.$$set({ gql });
    flush();
  }
}
customElements.define("vepple-pannellum", Pannellum);
function create_catch_block_1(ctx) {
  let p;
  let t_value = ctx[6].message + "";
  let t;
  return {
    c() {
      p = element("p");
      t = text(t_value);
      set_style(p, "color", "red");
    },
    m(target, anchor) {
      insert(target, p, anchor);
      append(p, t);
    },
    p: noop$5,
    d(detaching) {
      if (detaching)
        detach(p);
    }
  };
}
function create_then_block_1(ctx) {
  let div2;
  let iframe;
  let iframe_src_value;
  return {
    c() {
      div2 = element("div");
      iframe = element("iframe");
      iframe.allowFullscreen = true;
      set_style(iframe, "border-style", "none");
      attr(iframe, "part", "iframe");
      if (!src_url_equal(iframe.src, iframe_src_value = `pannellum.htm#panorama=${ctx[0].panorama.mediaItemUrl}&preview=${ctx[0].panorama.sourceUrl}`))
        attr(iframe, "src", iframe_src_value);
      attr(div2, "class", "wrap");
      attr(div2, "part", "wrap");
    },
    m(target, anchor) {
      insert(target, div2, anchor);
      append(div2, iframe);
    },
    p: noop$5,
    d(detaching) {
      if (detaching)
        detach(div2);
    }
  };
}
function create_pending_block_1(ctx) {
  let p;
  return {
    c() {
      p = element("p");
      p.textContent = "...waiting";
    },
    m(target, anchor) {
      insert(target, p, anchor);
    },
    p: noop$5,
    d(detaching) {
      if (detaching)
        detach(p);
    }
  };
}
function create_catch_block(ctx) {
  let p;
  let t_value = ctx[6].message + "";
  let t;
  return {
    c() {
      p = element("p");
      t = text(t_value);
      set_style(p, "color", "red");
    },
    m(target, anchor) {
      insert(target, p, anchor);
      append(p, t);
    },
    p: noop$5,
    d(detaching) {
      if (detaching)
        detach(p);
    }
  };
}
function create_then_block(ctx) {
  let div2;
  let a;
  let t_value = ctx[1].ctaText + "";
  let t;
  return {
    c() {
      div2 = element("div");
      a = element("a");
      t = text(t_value);
      attr(a, "part", "link");
      attr(a, "href", ctx[1].ctaUrl);
      attr(div2, "part", "content");
    },
    m(target, anchor) {
      insert(target, div2, anchor);
      append(div2, a);
      append(a, t);
    },
    p: noop$5,
    d(detaching) {
      if (detaching)
        detach(div2);
    }
  };
}
function create_pending_block(ctx) {
  return { c: noop$5, m: noop$5, p: noop$5, d: noop$5 };
}
function create_fragment(ctx) {
  let t;
  let await_block1_anchor;
  let info = {
    ctx,
    current: null,
    token: null,
    hasCatch: true,
    pending: create_pending_block_1,
    then: create_then_block_1,
    catch: create_catch_block_1,
    value: 0,
    error: 6
  };
  handle_promise(ctx[0], info);
  let info_1 = {
    ctx,
    current: null,
    token: null,
    hasCatch: true,
    pending: create_pending_block,
    then: create_then_block,
    catch: create_catch_block,
    value: 1,
    error: 6
  };
  handle_promise(ctx[1], info_1);
  return {
    c() {
      info.block.c();
      t = space();
      await_block1_anchor = empty();
      info_1.block.c();
      this.c = noop$5;
    },
    m(target, anchor) {
      info.block.m(target, info.anchor = anchor);
      info.mount = () => t.parentNode;
      info.anchor = t;
      insert(target, t, anchor);
      insert(target, await_block1_anchor, anchor);
      info_1.block.m(target, info_1.anchor = anchor);
      info_1.mount = () => await_block1_anchor.parentNode;
      info_1.anchor = await_block1_anchor;
    },
    p(new_ctx, [dirty]) {
      ctx = new_ctx;
      update_await_block_branch(info, ctx, dirty);
      update_await_block_branch(info_1, ctx, dirty);
    },
    i: noop$5,
    o: noop$5,
    d(detaching) {
      info.block.d(detaching);
      info.token = null;
      info = null;
      if (detaching)
        detach(t);
      if (detaching)
        detach(await_block1_anchor);
      info_1.block.d(detaching);
      info_1.token = null;
      info_1 = null;
    }
  };
}
function instance($$self, $$props, $$invalidate) {
  let { post } = $$props;
  let { api } = $$props;
  async function getData() {
    const res = await fetch(`${api}/wp-json/rv/v1/settings`);
    const data2 = await res.json();
    if (res.ok) {
      return data2.ctas[0];
    } else {
      throw new Error(data2);
    }
  }
  async function getGql() {
    const res = await fetch(`${api}/graphql`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `
            query MyQuery($name: String!) {
              posts(where: {name: $name}) {
                  nodes {
                    slug
                    postContent {
                      panorama {
                        title(format: RAW)
                        mediaItemUrl
                        sourceUrl(size: MEDIUM_LARGE)
                      }
                      position {
                        horizontal
                        vertical
                      }
                    }
                  }
                }
            }
      `,
        variables: { name: post }
      })
    });
    const data2 = await res.json();
    console.log(data2);
    if (res.ok) {
      return data2.data.posts.nodes[0].postContent;
    } else {
      throw new Error(data2);
    }
  }
  const gql = getGql();
  const data = getData();
  $$self.$$set = ($$props2) => {
    if ("post" in $$props2)
      $$invalidate(2, post = $$props2.post);
    if ("api" in $$props2)
      $$invalidate(3, api = $$props2.api);
  };
  return [gql, data, post, api];
}
class VeppleEmbed extends SvelteElement {
  constructor(options) {
    super();
    this.shadowRoot.innerHTML = `<style>*,*:before,*:after{box-sizing:border-box}.wrap{position:relative;padding-bottom:56.25%;height:0;overflow:hidden}iframe{position:absolute;top:0;left:0;width:100%;height:100%}</style>`;
    init(this, {
      target: this.shadowRoot,
      props: attribute_to_object(this.attributes),
      customElement: true
    }, instance, create_fragment, safe_not_equal, { post: 2, api: 3 }, null);
    if (options) {
      if (options.target) {
        insert(options.target, this, options.anchor);
      }
      if (options.props) {
        this.$set(options.props);
        flush();
      }
    }
  }
  static get observedAttributes() {
    return ["post", "api"];
  }
  get post() {
    return this.$$.ctx[2];
  }
  set post(post) {
    this.$$set({ post });
    flush();
  }
  get api() {
    return this.$$.ctx[3];
  }
  set api(api) {
    this.$$set({ api });
    flush();
  }
}
customElements.define("vepple-embed", VeppleEmbed);
