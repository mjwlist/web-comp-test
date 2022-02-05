function noop() {
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
function safe_not_equal(a2, b2) {
  return a2 != a2 ? b2 == b2 : a2 !== b2 || (a2 && typeof a2 === "object" || typeof a2 === "function");
}
function is_empty(obj) {
  return Object.keys(obj).length === 0;
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
function attr(node, attribute, value) {
  if (value == null)
    node.removeAttribute(attribute);
  else if (node.getAttribute(attribute) !== value)
    node.setAttribute(attribute, value);
}
function children(element2) {
  return Array.from(element2.childNodes);
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
function transition_in(block, local) {
  if (block && block.i) {
    outroing.delete(block);
    block.i(local);
  }
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
    update: noop,
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
      this.$destroy = noop;
    }
    $on(type, callback) {
      const callbacks = this.$$.callbacks[type] || (this.$$.callbacks[type] = []);
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
function t() {
}
function e(t2) {
  return t2();
}
function i() {
  return Object.create(null);
}
function s(t2) {
  t2.forEach(e);
}
function r(t2) {
  return typeof t2 == "function";
}
function n(t2, e2) {
  return t2 != t2 ? e2 == e2 : t2 !== e2 || t2 && typeof t2 == "object" || typeof t2 == "function";
}
function a(t2, e2) {
  t2.appendChild(e2);
}
function h(t2, e2, i2) {
  t2.insertBefore(e2, i2 || null);
}
function o(t2) {
  t2.parentNode.removeChild(t2);
}
function l(t2) {
  return document.createElement(t2);
}
function u(t2, e2, i2, s2) {
  return t2.addEventListener(e2, i2, s2), () => t2.removeEventListener(e2, i2, s2);
}
function c(t2, e2, i2) {
  i2 == null ? t2.removeAttribute(e2) : t2.getAttribute(e2) !== i2 && t2.setAttribute(e2, i2);
}
let d, p;
function g() {
  if (d === void 0) {
    d = false;
    try {
      typeof window != "undefined" && window.parent && window.parent.document;
    } catch (t2) {
      d = true;
    }
  }
  return d;
}
function m(t2) {
  const e2 = {};
  for (const i2 of t2)
    e2[i2.name] = i2.value;
  return e2;
}
function f(t2) {
  p = t2;
}
function x(t2) {
  (function() {
    if (!p)
      throw new Error("Function called outside component initialization");
    return p;
  })().$$.on_mount.push(t2);
}
const M = [], b = [], w = [], E = [], v = Promise.resolve();
let A = false;
function y(t2) {
  w.push(t2);
}
let _ = false;
const F = new Set();
function T() {
  if (!_) {
    _ = true;
    do {
      for (let t2 = 0; t2 < M.length; t2 += 1) {
        const e2 = M[t2];
        f(e2), S(e2.$$);
      }
      for (f(null), M.length = 0; b.length; )
        b.pop()();
      for (let t2 = 0; t2 < w.length; t2 += 1) {
        const e2 = w[t2];
        F.has(e2) || (F.add(e2), e2());
      }
      w.length = 0;
    } while (M.length);
    for (; E.length; )
      E.pop()();
    A = false, _ = false, F.clear();
  }
}
function S(t2) {
  if (t2.fragment !== null) {
    t2.update(), s(t2.before_update);
    const e2 = t2.dirty;
    t2.dirty = [-1], t2.fragment && t2.fragment.p(t2.ctx, e2), t2.after_update.forEach(y);
  }
}
const L = new Set();
function R(t2, e2) {
  t2.$$.dirty[0] === -1 && (M.push(t2), A || (A = true, v.then(T)), t2.$$.dirty.fill(0)), t2.$$.dirty[e2 / 31 | 0] |= 1 << e2 % 31;
}
function C(n2, a2, h2, l2, u2, c2, d2 = [-1]) {
  const g2 = p;
  f(n2);
  const m2 = n2.$$ = { fragment: null, ctx: null, props: c2, update: t, not_equal: u2, bound: i(), on_mount: [], on_destroy: [], on_disconnect: [], before_update: [], after_update: [], context: new Map(g2 ? g2.$$.context : a2.context || []), callbacks: i(), dirty: d2, skip_bound: false };
  let x2 = false;
  if (m2.ctx = h2 ? h2(n2, a2.props || {}, (t2, e2, ...i2) => {
    const s2 = i2.length ? i2[0] : e2;
    return m2.ctx && u2(m2.ctx[t2], m2.ctx[t2] = s2) && (!m2.skip_bound && m2.bound[t2] && m2.bound[t2](s2), x2 && R(n2, t2)), e2;
  }) : [], m2.update(), x2 = true, s(m2.before_update), m2.fragment = !!l2 && l2(m2.ctx), a2.target) {
    if (a2.hydrate) {
      const t2 = function(t3) {
        return Array.from(t3.childNodes);
      }(a2.target);
      m2.fragment && m2.fragment.l(t2), t2.forEach(o);
    } else
      m2.fragment && m2.fragment.c();
    a2.intro && ((M2 = n2.$$.fragment) && M2.i && (L.delete(M2), M2.i(b2))), function(t2, i2, n3, a3) {
      const { fragment: h3, on_mount: o2, on_destroy: l3, after_update: u3 } = t2.$$;
      h3 && h3.m(i2, n3), a3 || y(() => {
        const i3 = o2.map(e).filter(r);
        l3 ? l3.push(...i3) : s(i3), t2.$$.on_mount = [];
      }), u3.forEach(y);
    }(n2, a2.target, a2.anchor, a2.customElement), T();
  }
  var M2, b2;
  f(g2);
}
let I;
typeof HTMLElement == "function" && (I = class extends HTMLElement {
  constructor() {
    super(), this.attachShadow({ mode: "open" });
  }
  connectedCallback() {
    const { on_mount: t2 } = this.$$;
    this.$$.on_disconnect = t2.map(e).filter(r);
    for (const t3 in this.$$.slotted)
      this.appendChild(this.$$.slotted[t3]);
  }
  attributeChangedCallback(t2, e2, i2) {
    this[t2] = i2;
  }
  disconnectedCallback() {
    s(this.$$.on_disconnect);
  }
  $destroy() {
    !function(t2, e2) {
      const i2 = t2.$$;
      i2.fragment !== null && (s(i2.on_destroy), i2.fragment && i2.fragment.d(e2), i2.on_destroy = i2.fragment = null, i2.ctx = []);
    }(this, 1), this.$destroy = t;
  }
  $on(t2, e2) {
    const i2 = this.$$.callbacks[t2] || (this.$$.callbacks[t2] = []);
    return i2.push(e2), () => {
      const t3 = i2.indexOf(e2);
      t3 !== -1 && i2.splice(t3, 1);
    };
  }
  $set(t2) {
    var e2;
    this.$$set && (e2 = t2, Object.keys(e2).length !== 0) && (this.$$.skip_bound = true, this.$$set(t2), this.$$.skip_bound = false);
  }
});
function P(t2) {
  let e2 = t2[0], i2 = t2[1], s2 = t2[2];
  return Math.sqrt(e2 * e2 + i2 * i2 + s2 * s2);
}
function O(t2, e2) {
  return t2[0] = e2[0], t2[1] = e2[1], t2[2] = e2[2], t2;
}
function B(t2, e2, i2) {
  return t2[0] = e2[0] + i2[0], t2[1] = e2[1] + i2[1], t2[2] = e2[2] + i2[2], t2;
}
function U(t2, e2, i2) {
  return t2[0] = e2[0] - i2[0], t2[1] = e2[1] - i2[1], t2[2] = e2[2] - i2[2], t2;
}
function $(t2, e2, i2) {
  return t2[0] = e2[0] * i2, t2[1] = e2[1] * i2, t2[2] = e2[2] * i2, t2;
}
function N(t2) {
  let e2 = t2[0], i2 = t2[1], s2 = t2[2];
  return e2 * e2 + i2 * i2 + s2 * s2;
}
function D(t2, e2) {
  let i2 = e2[0], s2 = e2[1], r2 = e2[2], n2 = i2 * i2 + s2 * s2 + r2 * r2;
  return n2 > 0 && (n2 = 1 / Math.sqrt(n2)), t2[0] = e2[0] * n2, t2[1] = e2[1] * n2, t2[2] = e2[2] * n2, t2;
}
function X(t2, e2) {
  return t2[0] * e2[0] + t2[1] * e2[1] + t2[2] * e2[2];
}
function z(t2, e2, i2) {
  let s2 = e2[0], r2 = e2[1], n2 = e2[2], a2 = i2[0], h2 = i2[1], o2 = i2[2];
  return t2[0] = r2 * o2 - n2 * h2, t2[1] = n2 * a2 - s2 * o2, t2[2] = s2 * h2 - r2 * a2, t2;
}
const G = function() {
  const t2 = [0, 0, 0], e2 = [0, 0, 0];
  return function(i2, s2) {
    O(t2, i2), O(e2, s2), D(t2, t2), D(e2, e2);
    let r2 = X(t2, e2);
    return r2 > 1 ? 0 : r2 < -1 ? Math.PI : Math.acos(r2);
  };
}();
class Y extends Array {
  constructor(t2 = 0, e2 = t2, i2 = t2) {
    return super(t2, e2, i2), this;
  }
  get x() {
    return this[0];
  }
  get y() {
    return this[1];
  }
  get z() {
    return this[2];
  }
  set x(t2) {
    this[0] = t2;
  }
  set y(t2) {
    this[1] = t2;
  }
  set z(t2) {
    this[2] = t2;
  }
  set(t2, e2 = t2, i2 = t2) {
    return t2.length ? this.copy(t2) : (function(t3, e3, i3, s2) {
      t3[0] = e3, t3[1] = i3, t3[2] = s2;
    }(this, t2, e2, i2), this);
  }
  copy(t2) {
    return O(this, t2), this;
  }
  add(t2, e2) {
    return e2 ? B(this, t2, e2) : B(this, this, t2), this;
  }
  sub(t2, e2) {
    return e2 ? U(this, t2, e2) : U(this, this, t2), this;
  }
  multiply(t2) {
    var e2, i2, s2;
    return t2.length ? (i2 = this, s2 = t2, (e2 = this)[0] = i2[0] * s2[0], e2[1] = i2[1] * s2[1], e2[2] = i2[2] * s2[2]) : $(this, this, t2), this;
  }
  divide(t2) {
    var e2, i2, s2;
    return t2.length ? (i2 = this, s2 = t2, (e2 = this)[0] = i2[0] / s2[0], e2[1] = i2[1] / s2[1], e2[2] = i2[2] / s2[2]) : $(this, this, 1 / t2), this;
  }
  inverse(t2 = this) {
    var e2, i2;
    return i2 = t2, (e2 = this)[0] = 1 / i2[0], e2[1] = 1 / i2[1], e2[2] = 1 / i2[2], this;
  }
  len() {
    return P(this);
  }
  distance(t2) {
    return t2 ? function(t3, e2) {
      let i2 = e2[0] - t3[0], s2 = e2[1] - t3[1], r2 = e2[2] - t3[2];
      return Math.sqrt(i2 * i2 + s2 * s2 + r2 * r2);
    }(this, t2) : P(this);
  }
  squaredLen() {
    return N(this);
  }
  squaredDistance(t2) {
    return t2 ? function(t3, e2) {
      let i2 = e2[0] - t3[0], s2 = e2[1] - t3[1], r2 = e2[2] - t3[2];
      return i2 * i2 + s2 * s2 + r2 * r2;
    }(this, t2) : N(this);
  }
  negate(t2 = this) {
    var e2, i2;
    return i2 = t2, (e2 = this)[0] = -i2[0], e2[1] = -i2[1], e2[2] = -i2[2], this;
  }
  cross(t2, e2) {
    return e2 ? z(this, t2, e2) : z(this, this, t2), this;
  }
  scale(t2) {
    return $(this, this, t2), this;
  }
  normalize() {
    return D(this, this), this;
  }
  dot(t2) {
    return X(this, t2);
  }
  equals(t2) {
    return i2 = t2, (e2 = this)[0] === i2[0] && e2[1] === i2[1] && e2[2] === i2[2];
    var e2, i2;
  }
  applyMatrix4(t2) {
    return function(t3, e2, i2) {
      let s2 = e2[0], r2 = e2[1], n2 = e2[2], a2 = i2[3] * s2 + i2[7] * r2 + i2[11] * n2 + i2[15];
      a2 = a2 || 1, t3[0] = (i2[0] * s2 + i2[4] * r2 + i2[8] * n2 + i2[12]) / a2, t3[1] = (i2[1] * s2 + i2[5] * r2 + i2[9] * n2 + i2[13]) / a2, t3[2] = (i2[2] * s2 + i2[6] * r2 + i2[10] * n2 + i2[14]) / a2;
    }(this, this, t2), this;
  }
  scaleRotateMatrix4(t2) {
    return function(t3, e2, i2) {
      let s2 = e2[0], r2 = e2[1], n2 = e2[2], a2 = i2[3] * s2 + i2[7] * r2 + i2[11] * n2 + i2[15];
      a2 = a2 || 1, t3[0] = (i2[0] * s2 + i2[4] * r2 + i2[8] * n2) / a2, t3[1] = (i2[1] * s2 + i2[5] * r2 + i2[9] * n2) / a2, t3[2] = (i2[2] * s2 + i2[6] * r2 + i2[10] * n2) / a2;
    }(this, this, t2), this;
  }
  applyQuaternion(t2) {
    return function(t3, e2, i2) {
      let s2 = e2[0], r2 = e2[1], n2 = e2[2], a2 = i2[0], h2 = i2[1], o2 = i2[2], l2 = h2 * n2 - o2 * r2, u2 = o2 * s2 - a2 * n2, c2 = a2 * r2 - h2 * s2, d2 = h2 * c2 - o2 * u2, p2 = o2 * l2 - a2 * c2, g2 = a2 * u2 - h2 * l2, m2 = 2 * i2[3];
      l2 *= m2, u2 *= m2, c2 *= m2, d2 *= 2, p2 *= 2, g2 *= 2, t3[0] = s2 + l2 + d2, t3[1] = r2 + u2 + p2, t3[2] = n2 + c2 + g2;
    }(this, this, t2), this;
  }
  angle(t2) {
    return G(this, t2);
  }
  lerp(t2, e2) {
    return function(t3, e3, i2, s2) {
      let r2 = e3[0], n2 = e3[1], a2 = e3[2];
      t3[0] = r2 + s2 * (i2[0] - r2), t3[1] = n2 + s2 * (i2[1] - n2), t3[2] = a2 + s2 * (i2[2] - a2);
    }(this, this, t2, e2), this;
  }
  clone() {
    return new Y(this[0], this[1], this[2]);
  }
  fromArray(t2, e2 = 0) {
    return this[0] = t2[e2], this[1] = t2[e2 + 1], this[2] = t2[e2 + 2], this;
  }
  toArray(t2 = [], e2 = 0) {
    return t2[e2] = this[0], t2[e2 + 1] = this[1], t2[e2 + 2] = this[2], t2;
  }
  transformDirection(t2) {
    const e2 = this[0], i2 = this[1], s2 = this[2];
    return this[0] = t2[0] * e2 + t2[4] * i2 + t2[8] * s2, this[1] = t2[1] * e2 + t2[5] * i2 + t2[9] * s2, this[2] = t2[2] * e2 + t2[6] * i2 + t2[10] * s2, this.normalize();
  }
}
const k = new Y();
let q = 1, V = 1, W = false;
let j = 1;
const H = {};
class Z {
  constructor(t2, { vertex: e2, fragment: i2, uniforms: s2 = {}, transparent: r2 = false, cullFace: n2 = t2.BACK, frontFace: a2 = t2.CCW, depthTest: h2 = true, depthWrite: o2 = true, depthFunc: l2 = t2.LESS } = {}) {
    t2.canvas || console.error("gl not passed as fist argument to Program"), this.gl = t2, this.uniforms = s2, this.id = j++, e2 || console.warn("vertex shader not supplied"), i2 || console.warn("fragment shader not supplied"), this.transparent = r2, this.cullFace = n2, this.frontFace = a2, this.depthTest = h2, this.depthWrite = o2, this.depthFunc = l2, this.blendFunc = {}, this.blendEquation = {}, this.transparent && !this.blendFunc.src && (this.gl.renderer.premultipliedAlpha ? this.setBlendFunc(this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA) : this.setBlendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA));
    const u2 = t2.createShader(t2.VERTEX_SHADER);
    t2.shaderSource(u2, e2), t2.compileShader(u2), t2.getShaderInfoLog(u2) !== "" && console.warn(`${t2.getShaderInfoLog(u2)}
Vertex Shader
${Q(e2)}`);
    const c2 = t2.createShader(t2.FRAGMENT_SHADER);
    if (t2.shaderSource(c2, i2), t2.compileShader(c2), t2.getShaderInfoLog(c2) !== "" && console.warn(`${t2.getShaderInfoLog(c2)}
Fragment Shader
${Q(i2)}`), this.program = t2.createProgram(), t2.attachShader(this.program, u2), t2.attachShader(this.program, c2), t2.linkProgram(this.program), !t2.getProgramParameter(this.program, t2.LINK_STATUS))
      return console.warn(t2.getProgramInfoLog(this.program));
    t2.deleteShader(u2), t2.deleteShader(c2), this.uniformLocations = new Map();
    let d2 = t2.getProgramParameter(this.program, t2.ACTIVE_UNIFORMS);
    for (let e3 = 0; e3 < d2; e3++) {
      let i3 = t2.getActiveUniform(this.program, e3);
      this.uniformLocations.set(i3, t2.getUniformLocation(this.program, i3.name));
      const s3 = i3.name.match(/(\w+)/g);
      i3.uniformName = s3[0], s3.length === 3 ? (i3.isStructArray = true, i3.structIndex = Number(s3[1]), i3.structProperty = s3[2]) : s3.length === 2 && isNaN(Number(s3[1])) && (i3.isStruct = true, i3.structProperty = s3[1]);
    }
    this.attributeLocations = new Map();
    const p2 = [], g2 = t2.getProgramParameter(this.program, t2.ACTIVE_ATTRIBUTES);
    for (let e3 = 0; e3 < g2; e3++) {
      const i3 = t2.getActiveAttrib(this.program, e3), s3 = t2.getAttribLocation(this.program, i3.name);
      p2[s3] = i3.name, this.attributeLocations.set(i3, s3);
    }
    this.attributeOrder = p2.join("");
  }
  setBlendFunc(t2, e2, i2, s2) {
    this.blendFunc.src = t2, this.blendFunc.dst = e2, this.blendFunc.srcAlpha = i2, this.blendFunc.dstAlpha = s2, t2 && (this.transparent = true);
  }
  setBlendEquation(t2, e2) {
    this.blendEquation.modeRGB = t2, this.blendEquation.modeAlpha = e2;
  }
  applyState() {
    this.depthTest ? this.gl.renderer.enable(this.gl.DEPTH_TEST) : this.gl.renderer.disable(this.gl.DEPTH_TEST), this.cullFace ? this.gl.renderer.enable(this.gl.CULL_FACE) : this.gl.renderer.disable(this.gl.CULL_FACE), this.blendFunc.src ? this.gl.renderer.enable(this.gl.BLEND) : this.gl.renderer.disable(this.gl.BLEND), this.cullFace && this.gl.renderer.setCullFace(this.cullFace), this.gl.renderer.setFrontFace(this.frontFace), this.gl.renderer.setDepthMask(this.depthWrite), this.gl.renderer.setDepthFunc(this.depthFunc), this.blendFunc.src && this.gl.renderer.setBlendFunc(this.blendFunc.src, this.blendFunc.dst, this.blendFunc.srcAlpha, this.blendFunc.dstAlpha), this.gl.renderer.setBlendEquation(this.blendEquation.modeRGB, this.blendEquation.modeAlpha);
  }
  use({ flipFaces: t2 = false } = {}) {
    let e2 = -1;
    this.gl.renderer.currentProgram === this.id || (this.gl.useProgram(this.program), this.gl.renderer.currentProgram = this.id), this.uniformLocations.forEach((t3, i2) => {
      let s2 = i2.uniformName, r2 = this.uniforms[s2];
      if (i2.isStruct && (r2 = r2[i2.structProperty], s2 += `.${i2.structProperty}`), i2.isStructArray && (r2 = r2[i2.structIndex][i2.structProperty], s2 += `[${i2.structIndex}].${i2.structProperty}`), !r2)
        return tt(`Active uniform ${s2} has not been supplied`);
      if (r2 && r2.value === void 0)
        return tt(`${s2} uniform is missing a value parameter`);
      if (r2.value.texture)
        return e2 += 1, r2.value.update(e2), K(this.gl, i2.type, t3, e2);
      if (r2.value.length && r2.value[0].texture) {
        const s3 = [];
        return r2.value.forEach((t4) => {
          e2 += 1, t4.update(e2), s3.push(e2);
        }), K(this.gl, i2.type, t3, s3);
      }
      K(this.gl, i2.type, t3, r2.value);
    }), this.applyState(), t2 && this.gl.renderer.setFrontFace(this.frontFace === this.gl.CCW ? this.gl.CW : this.gl.CCW);
  }
  remove() {
    this.gl.deleteProgram(this.program);
  }
}
function K(t2, e2, i2, s2) {
  s2 = s2.length ? function(t3) {
    const e3 = t3.length, i3 = t3[0].length;
    if (i3 === void 0)
      return t3;
    const s3 = e3 * i3;
    let r3 = H[s3];
    r3 || (H[s3] = r3 = new Float32Array(s3));
    for (let s4 = 0; s4 < e3; s4++)
      r3.set(t3[s4], s4 * i3);
    return r3;
  }(s2) : s2;
  const r2 = t2.renderer.state.uniformLocations.get(i2);
  if (s2.length)
    if (r2 === void 0 || r2.length !== s2.length)
      t2.renderer.state.uniformLocations.set(i2, s2.slice(0));
    else {
      if (function(t3, e3) {
        if (t3.length !== e3.length)
          return false;
        for (let i3 = 0, s3 = t3.length; i3 < s3; i3++)
          if (t3[i3] !== e3[i3])
            return false;
        return true;
      }(r2, s2))
        return;
      r2.set ? r2.set(s2) : function(t3, e3) {
        for (let i3 = 0, s3 = t3.length; i3 < s3; i3++)
          t3[i3] = e3[i3];
      }(r2, s2), t2.renderer.state.uniformLocations.set(i2, r2);
    }
  else {
    if (r2 === s2)
      return;
    t2.renderer.state.uniformLocations.set(i2, s2);
  }
  switch (e2) {
    case 5126:
      return s2.length ? t2.uniform1fv(i2, s2) : t2.uniform1f(i2, s2);
    case 35664:
      return t2.uniform2fv(i2, s2);
    case 35665:
      return t2.uniform3fv(i2, s2);
    case 35666:
      return t2.uniform4fv(i2, s2);
    case 35670:
    case 5124:
    case 35678:
    case 35680:
      return s2.length ? t2.uniform1iv(i2, s2) : t2.uniform1i(i2, s2);
    case 35671:
    case 35667:
      return t2.uniform2iv(i2, s2);
    case 35672:
    case 35668:
      return t2.uniform3iv(i2, s2);
    case 35673:
    case 35669:
      return t2.uniform4iv(i2, s2);
    case 35674:
      return t2.uniformMatrix2fv(i2, false, s2);
    case 35675:
      return t2.uniformMatrix3fv(i2, false, s2);
    case 35676:
      return t2.uniformMatrix4fv(i2, false, s2);
  }
}
function Q(t2) {
  let e2 = t2.split("\n");
  for (let t3 = 0; t3 < e2.length; t3++)
    e2[t3] = t3 + 1 + ": " + e2[t3];
  return e2.join("\n");
}
let J = 0;
function tt(t2) {
  J > 100 || (console.warn(t2), J++, J > 100 && console.warn("More than 100 program warnings - stopping logs."));
}
const et = new Y();
let it = 1;
class st {
  constructor({ canvas: t2 = document.createElement("canvas"), width: e2 = 300, height: i2 = 150, dpr: s2 = 1, alpha: r2 = false, depth: n2 = true, stencil: a2 = false, antialias: h2 = false, premultipliedAlpha: o2 = false, preserveDrawingBuffer: l2 = false, powerPreference: u2 = "default", autoClear: c2 = true, webgl: d2 = 2 } = {}) {
    const p2 = { alpha: r2, depth: n2, stencil: a2, antialias: h2, premultipliedAlpha: o2, preserveDrawingBuffer: l2, powerPreference: u2 };
    this.dpr = s2, this.alpha = r2, this.color = true, this.depth = n2, this.stencil = a2, this.premultipliedAlpha = o2, this.autoClear = c2, this.id = it++, d2 === 2 && (this.gl = t2.getContext("webgl2", p2)), this.isWebgl2 = !!this.gl, this.gl || (this.gl = t2.getContext("webgl", p2) || t2.getContext("experimental-webgl", p2)), this.gl || console.error("unable to create webgl context"), this.gl.renderer = this, this.setSize(e2, i2), this.state = {}, this.state.blendFunc = { src: this.gl.ONE, dst: this.gl.ZERO }, this.state.blendEquation = { modeRGB: this.gl.FUNC_ADD }, this.state.cullFace = null, this.state.frontFace = this.gl.CCW, this.state.depthMask = true, this.state.depthFunc = this.gl.LESS, this.state.premultiplyAlpha = false, this.state.flipY = false, this.state.unpackAlignment = 4, this.state.framebuffer = null, this.state.viewport = { width: null, height: null }, this.state.textureUnits = [], this.state.activeTextureUnit = 0, this.state.boundBuffer = null, this.state.uniformLocations = new Map(), this.extensions = {}, this.isWebgl2 ? (this.getExtension("EXT_color_buffer_float"), this.getExtension("OES_texture_float_linear")) : (this.getExtension("OES_texture_float"), this.getExtension("OES_texture_float_linear"), this.getExtension("OES_texture_half_float"), this.getExtension("OES_texture_half_float_linear"), this.getExtension("OES_element_index_uint"), this.getExtension("OES_standard_derivatives"), this.getExtension("EXT_sRGB"), this.getExtension("WEBGL_depth_texture"), this.getExtension("WEBGL_draw_buffers")), this.vertexAttribDivisor = this.getExtension("ANGLE_instanced_arrays", "vertexAttribDivisor", "vertexAttribDivisorANGLE"), this.drawArraysInstanced = this.getExtension("ANGLE_instanced_arrays", "drawArraysInstanced", "drawArraysInstancedANGLE"), this.drawElementsInstanced = this.getExtension("ANGLE_instanced_arrays", "drawElementsInstanced", "drawElementsInstancedANGLE"), this.createVertexArray = this.getExtension("OES_vertex_array_object", "createVertexArray", "createVertexArrayOES"), this.bindVertexArray = this.getExtension("OES_vertex_array_object", "bindVertexArray", "bindVertexArrayOES"), this.deleteVertexArray = this.getExtension("OES_vertex_array_object", "deleteVertexArray", "deleteVertexArrayOES"), this.drawBuffers = this.getExtension("WEBGL_draw_buffers", "drawBuffers", "drawBuffersWEBGL"), this.parameters = {}, this.parameters.maxTextureUnits = this.gl.getParameter(this.gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS), this.parameters.maxAnisotropy = this.getExtension("EXT_texture_filter_anisotropic") ? this.gl.getParameter(this.getExtension("EXT_texture_filter_anisotropic").MAX_TEXTURE_MAX_ANISOTROPY_EXT) : 0;
  }
  setSize(t2, e2) {
    this.width = t2, this.height = e2, this.gl.canvas.width = t2 * this.dpr, this.gl.canvas.height = e2 * this.dpr, Object.assign(this.gl.canvas.style, { width: t2 + "px", height: e2 + "px" });
  }
  setViewport(t2, e2) {
    this.state.viewport.width === t2 && this.state.viewport.height === e2 || (this.state.viewport.width = t2, this.state.viewport.height = e2, this.gl.viewport(0, 0, t2, e2));
  }
  enable(t2) {
    this.state[t2] !== true && (this.gl.enable(t2), this.state[t2] = true);
  }
  disable(t2) {
    this.state[t2] !== false && (this.gl.disable(t2), this.state[t2] = false);
  }
  setBlendFunc(t2, e2, i2, s2) {
    this.state.blendFunc.src === t2 && this.state.blendFunc.dst === e2 && this.state.blendFunc.srcAlpha === i2 && this.state.blendFunc.dstAlpha === s2 || (this.state.blendFunc.src = t2, this.state.blendFunc.dst = e2, this.state.blendFunc.srcAlpha = i2, this.state.blendFunc.dstAlpha = s2, i2 !== void 0 ? this.gl.blendFuncSeparate(t2, e2, i2, s2) : this.gl.blendFunc(t2, e2));
  }
  setBlendEquation(t2, e2) {
    t2 = t2 || this.gl.FUNC_ADD, this.state.blendEquation.modeRGB === t2 && this.state.blendEquation.modeAlpha === e2 || (this.state.blendEquation.modeRGB = t2, this.state.blendEquation.modeAlpha = e2, e2 !== void 0 ? this.gl.blendEquationSeparate(t2, e2) : this.gl.blendEquation(t2));
  }
  setCullFace(t2) {
    this.state.cullFace !== t2 && (this.state.cullFace = t2, this.gl.cullFace(t2));
  }
  setFrontFace(t2) {
    this.state.frontFace !== t2 && (this.state.frontFace = t2, this.gl.frontFace(t2));
  }
  setDepthMask(t2) {
    this.state.depthMask !== t2 && (this.state.depthMask = t2, this.gl.depthMask(t2));
  }
  setDepthFunc(t2) {
    this.state.depthFunc !== t2 && (this.state.depthFunc = t2, this.gl.depthFunc(t2));
  }
  activeTexture(t2) {
    this.state.activeTextureUnit !== t2 && (this.state.activeTextureUnit = t2, this.gl.activeTexture(this.gl.TEXTURE0 + t2));
  }
  bindFramebuffer({ target: t2 = this.gl.FRAMEBUFFER, buffer: e2 = null } = {}) {
    this.state.framebuffer !== e2 && (this.state.framebuffer = e2, this.gl.bindFramebuffer(t2, e2));
  }
  getExtension(t2, e2, i2) {
    return e2 && this.gl[e2] ? this.gl[e2].bind(this.gl) : (this.extensions[t2] || (this.extensions[t2] = this.gl.getExtension(t2)), e2 ? this.extensions[t2] ? this.extensions[t2][i2].bind(this.extensions[t2]) : null : this.extensions[t2]);
  }
  sortOpaque(t2, e2) {
    return t2.renderOrder !== e2.renderOrder ? t2.renderOrder - e2.renderOrder : t2.program.id !== e2.program.id ? t2.program.id - e2.program.id : t2.zDepth !== e2.zDepth ? t2.zDepth - e2.zDepth : e2.id - t2.id;
  }
  sortTransparent(t2, e2) {
    return t2.renderOrder !== e2.renderOrder ? t2.renderOrder - e2.renderOrder : t2.zDepth !== e2.zDepth ? e2.zDepth - t2.zDepth : e2.id - t2.id;
  }
  sortUI(t2, e2) {
    return t2.renderOrder !== e2.renderOrder ? t2.renderOrder - e2.renderOrder : t2.program.id !== e2.program.id ? t2.program.id - e2.program.id : e2.id - t2.id;
  }
  getRenderList({ scene: t2, camera: e2, frustumCull: i2, sort: s2 }) {
    let r2 = [];
    if (e2 && i2 && e2.updateFrustum(), t2.traverse((t3) => {
      if (!t3.visible)
        return true;
      t3.draw && (i2 && t3.frustumCulled && e2 && !e2.frustumIntersectsMesh(t3) || r2.push(t3));
    }), s2) {
      const t3 = [], i3 = [], s3 = [];
      r2.forEach((r3) => {
        r3.program.transparent ? r3.program.depthTest ? i3.push(r3) : s3.push(r3) : t3.push(r3), r3.zDepth = 0, r3.renderOrder === 0 && r3.program.depthTest && e2 && (r3.worldMatrix.getTranslation(et), et.applyMatrix4(e2.projectionViewMatrix), r3.zDepth = et.z);
      }), t3.sort(this.sortOpaque), i3.sort(this.sortTransparent), s3.sort(this.sortUI), r2 = t3.concat(i3, s3);
    }
    return r2;
  }
  render({ scene: t2, camera: e2, target: i2 = null, update: s2 = true, sort: r2 = true, frustumCull: n2 = true, clear: a2 }) {
    i2 === null ? (this.bindFramebuffer(), this.setViewport(this.width * this.dpr, this.height * this.dpr)) : (this.bindFramebuffer(i2), this.setViewport(i2.width, i2.height)), (a2 || this.autoClear && a2 !== false) && (!this.depth || i2 && !i2.depth || (this.enable(this.gl.DEPTH_TEST), this.setDepthMask(true)), this.gl.clear((this.color ? this.gl.COLOR_BUFFER_BIT : 0) | (this.depth ? this.gl.DEPTH_BUFFER_BIT : 0) | (this.stencil ? this.gl.STENCIL_BUFFER_BIT : 0))), s2 && t2.updateMatrixWorld(), e2 && e2.updateMatrixWorld();
    this.getRenderList({ scene: t2, camera: e2, frustumCull: n2, sort: r2 }).forEach((t3) => {
      t3.draw({ camera: e2 });
    });
  }
}
function rt(t2, e2, i2) {
  let s2 = e2[0], r2 = e2[1], n2 = e2[2], a2 = e2[3], h2 = i2[0], o2 = i2[1], l2 = i2[2], u2 = i2[3];
  return t2[0] = s2 * u2 + a2 * h2 + r2 * l2 - n2 * o2, t2[1] = r2 * u2 + a2 * o2 + n2 * h2 - s2 * l2, t2[2] = n2 * u2 + a2 * l2 + s2 * o2 - r2 * h2, t2[3] = a2 * u2 - s2 * h2 - r2 * o2 - n2 * l2, t2;
}
const nt = function(t2, e2) {
  return t2[0] = e2[0], t2[1] = e2[1], t2[2] = e2[2], t2[3] = e2[3], t2;
}, at = function(t2, e2, i2, s2, r2) {
  return t2[0] = e2, t2[1] = i2, t2[2] = s2, t2[3] = r2, t2;
}, ht = function(t2, e2) {
  return t2[0] * e2[0] + t2[1] * e2[1] + t2[2] * e2[2] + t2[3] * e2[3];
}, ot = function(t2, e2) {
  let i2 = e2[0], s2 = e2[1], r2 = e2[2], n2 = e2[3], a2 = i2 * i2 + s2 * s2 + r2 * r2 + n2 * n2;
  return a2 > 0 && (a2 = 1 / Math.sqrt(a2)), t2[0] = i2 * a2, t2[1] = s2 * a2, t2[2] = r2 * a2, t2[3] = n2 * a2, t2;
};
class lt extends Array {
  constructor(t2 = 0, e2 = 0, i2 = 0, s2 = 1) {
    return super(t2, e2, i2, s2), this.onChange = () => {
    }, this;
  }
  get x() {
    return this[0];
  }
  get y() {
    return this[1];
  }
  get z() {
    return this[2];
  }
  get w() {
    return this[3];
  }
  set x(t2) {
    this[0] = t2, this.onChange();
  }
  set y(t2) {
    this[1] = t2, this.onChange();
  }
  set z(t2) {
    this[2] = t2, this.onChange();
  }
  set w(t2) {
    this[3] = t2, this.onChange();
  }
  identity() {
    var t2;
    return (t2 = this)[0] = 0, t2[1] = 0, t2[2] = 0, t2[3] = 1, this.onChange(), this;
  }
  set(t2, e2, i2, s2) {
    return t2.length ? this.copy(t2) : (at(this, t2, e2, i2, s2), this.onChange(), this);
  }
  rotateX(t2) {
    return function(t3, e2, i2) {
      i2 *= 0.5;
      let s2 = e2[0], r2 = e2[1], n2 = e2[2], a2 = e2[3], h2 = Math.sin(i2), o2 = Math.cos(i2);
      t3[0] = s2 * o2 + a2 * h2, t3[1] = r2 * o2 + n2 * h2, t3[2] = n2 * o2 - r2 * h2, t3[3] = a2 * o2 - s2 * h2;
    }(this, this, t2), this.onChange(), this;
  }
  rotateY(t2) {
    return function(t3, e2, i2) {
      i2 *= 0.5;
      let s2 = e2[0], r2 = e2[1], n2 = e2[2], a2 = e2[3], h2 = Math.sin(i2), o2 = Math.cos(i2);
      t3[0] = s2 * o2 - n2 * h2, t3[1] = r2 * o2 + a2 * h2, t3[2] = n2 * o2 + s2 * h2, t3[3] = a2 * o2 - r2 * h2;
    }(this, this, t2), this.onChange(), this;
  }
  rotateZ(t2) {
    return function(t3, e2, i2) {
      i2 *= 0.5;
      let s2 = e2[0], r2 = e2[1], n2 = e2[2], a2 = e2[3], h2 = Math.sin(i2), o2 = Math.cos(i2);
      t3[0] = s2 * o2 + r2 * h2, t3[1] = r2 * o2 - s2 * h2, t3[2] = n2 * o2 + a2 * h2, t3[3] = a2 * o2 - n2 * h2;
    }(this, this, t2), this.onChange(), this;
  }
  inverse(t2 = this) {
    return function(t3, e2) {
      let i2 = e2[0], s2 = e2[1], r2 = e2[2], n2 = e2[3], a2 = i2 * i2 + s2 * s2 + r2 * r2 + n2 * n2, h2 = a2 ? 1 / a2 : 0;
      t3[0] = -i2 * h2, t3[1] = -s2 * h2, t3[2] = -r2 * h2, t3[3] = n2 * h2;
    }(this, t2), this.onChange(), this;
  }
  conjugate(t2 = this) {
    var e2, i2;
    return i2 = t2, (e2 = this)[0] = -i2[0], e2[1] = -i2[1], e2[2] = -i2[2], e2[3] = i2[3], this.onChange(), this;
  }
  copy(t2) {
    return nt(this, t2), this.onChange(), this;
  }
  normalize(t2 = this) {
    return ot(this, t2), this.onChange(), this;
  }
  multiply(t2, e2) {
    return e2 ? rt(this, t2, e2) : rt(this, this, t2), this.onChange(), this;
  }
  dot(t2) {
    return ht(this, t2);
  }
  fromMatrix3(t2) {
    return function(t3, e2) {
      let i2, s2 = e2[0] + e2[4] + e2[8];
      if (s2 > 0)
        i2 = Math.sqrt(s2 + 1), t3[3] = 0.5 * i2, i2 = 0.5 / i2, t3[0] = (e2[5] - e2[7]) * i2, t3[1] = (e2[6] - e2[2]) * i2, t3[2] = (e2[1] - e2[3]) * i2;
      else {
        let s3 = 0;
        e2[4] > e2[0] && (s3 = 1), e2[8] > e2[3 * s3 + s3] && (s3 = 2);
        let r2 = (s3 + 1) % 3, n2 = (s3 + 2) % 3;
        i2 = Math.sqrt(e2[3 * s3 + s3] - e2[3 * r2 + r2] - e2[3 * n2 + n2] + 1), t3[s3] = 0.5 * i2, i2 = 0.5 / i2, t3[3] = (e2[3 * r2 + n2] - e2[3 * n2 + r2]) * i2, t3[r2] = (e2[3 * r2 + s3] + e2[3 * s3 + r2]) * i2, t3[n2] = (e2[3 * n2 + s3] + e2[3 * s3 + n2]) * i2;
      }
    }(this, t2), this.onChange(), this;
  }
  fromEuler(t2) {
    return function(t3, e2, i2 = "YXZ") {
      let s2 = Math.sin(0.5 * e2[0]), r2 = Math.cos(0.5 * e2[0]), n2 = Math.sin(0.5 * e2[1]), a2 = Math.cos(0.5 * e2[1]), h2 = Math.sin(0.5 * e2[2]), o2 = Math.cos(0.5 * e2[2]);
      i2 === "XYZ" ? (t3[0] = s2 * a2 * o2 + r2 * n2 * h2, t3[1] = r2 * n2 * o2 - s2 * a2 * h2, t3[2] = r2 * a2 * h2 + s2 * n2 * o2, t3[3] = r2 * a2 * o2 - s2 * n2 * h2) : i2 === "YXZ" ? (t3[0] = s2 * a2 * o2 + r2 * n2 * h2, t3[1] = r2 * n2 * o2 - s2 * a2 * h2, t3[2] = r2 * a2 * h2 - s2 * n2 * o2, t3[3] = r2 * a2 * o2 + s2 * n2 * h2) : i2 === "ZXY" ? (t3[0] = s2 * a2 * o2 - r2 * n2 * h2, t3[1] = r2 * n2 * o2 + s2 * a2 * h2, t3[2] = r2 * a2 * h2 + s2 * n2 * o2, t3[3] = r2 * a2 * o2 - s2 * n2 * h2) : i2 === "ZYX" ? (t3[0] = s2 * a2 * o2 - r2 * n2 * h2, t3[1] = r2 * n2 * o2 + s2 * a2 * h2, t3[2] = r2 * a2 * h2 - s2 * n2 * o2, t3[3] = r2 * a2 * o2 + s2 * n2 * h2) : i2 === "YZX" ? (t3[0] = s2 * a2 * o2 + r2 * n2 * h2, t3[1] = r2 * n2 * o2 + s2 * a2 * h2, t3[2] = r2 * a2 * h2 - s2 * n2 * o2, t3[3] = r2 * a2 * o2 - s2 * n2 * h2) : i2 === "XZY" && (t3[0] = s2 * a2 * o2 - r2 * n2 * h2, t3[1] = r2 * n2 * o2 - s2 * a2 * h2, t3[2] = r2 * a2 * h2 + s2 * n2 * o2, t3[3] = r2 * a2 * o2 + s2 * n2 * h2);
    }(this, t2, t2.order), this;
  }
  fromAxisAngle(t2, e2) {
    return function(t3, e3, i2) {
      i2 *= 0.5;
      let s2 = Math.sin(i2);
      t3[0] = s2 * e3[0], t3[1] = s2 * e3[1], t3[2] = s2 * e3[2], t3[3] = Math.cos(i2);
    }(this, t2, e2), this;
  }
  slerp(t2, e2) {
    return function(t3, e3, i2, s2) {
      let r2, n2, a2, h2, o2, l2 = e3[0], u2 = e3[1], c2 = e3[2], d2 = e3[3], p2 = i2[0], g2 = i2[1], m2 = i2[2], f2 = i2[3];
      n2 = l2 * p2 + u2 * g2 + c2 * m2 + d2 * f2, n2 < 0 && (n2 = -n2, p2 = -p2, g2 = -g2, m2 = -m2, f2 = -f2), 1 - n2 > 1e-6 ? (r2 = Math.acos(n2), a2 = Math.sin(r2), h2 = Math.sin((1 - s2) * r2) / a2, o2 = Math.sin(s2 * r2) / a2) : (h2 = 1 - s2, o2 = s2), t3[0] = h2 * l2 + o2 * p2, t3[1] = h2 * u2 + o2 * g2, t3[2] = h2 * c2 + o2 * m2, t3[3] = h2 * d2 + o2 * f2;
    }(this, this, t2, e2), this;
  }
  fromArray(t2, e2 = 0) {
    return this[0] = t2[e2], this[1] = t2[e2 + 1], this[2] = t2[e2 + 2], this[3] = t2[e2 + 3], this;
  }
  toArray(t2 = [], e2 = 0) {
    return t2[e2] = this[0], t2[e2 + 1] = this[1], t2[e2 + 2] = this[2], t2[e2 + 3] = this[3], t2;
  }
}
function ut(t2, e2, i2) {
  let s2 = e2[0], r2 = e2[1], n2 = e2[2], a2 = e2[3], h2 = e2[4], o2 = e2[5], l2 = e2[6], u2 = e2[7], c2 = e2[8], d2 = e2[9], p2 = e2[10], g2 = e2[11], m2 = e2[12], f2 = e2[13], x2 = e2[14], M2 = e2[15], b2 = i2[0], w2 = i2[1], E2 = i2[2], v2 = i2[3];
  return t2[0] = b2 * s2 + w2 * h2 + E2 * c2 + v2 * m2, t2[1] = b2 * r2 + w2 * o2 + E2 * d2 + v2 * f2, t2[2] = b2 * n2 + w2 * l2 + E2 * p2 + v2 * x2, t2[3] = b2 * a2 + w2 * u2 + E2 * g2 + v2 * M2, b2 = i2[4], w2 = i2[5], E2 = i2[6], v2 = i2[7], t2[4] = b2 * s2 + w2 * h2 + E2 * c2 + v2 * m2, t2[5] = b2 * r2 + w2 * o2 + E2 * d2 + v2 * f2, t2[6] = b2 * n2 + w2 * l2 + E2 * p2 + v2 * x2, t2[7] = b2 * a2 + w2 * u2 + E2 * g2 + v2 * M2, b2 = i2[8], w2 = i2[9], E2 = i2[10], v2 = i2[11], t2[8] = b2 * s2 + w2 * h2 + E2 * c2 + v2 * m2, t2[9] = b2 * r2 + w2 * o2 + E2 * d2 + v2 * f2, t2[10] = b2 * n2 + w2 * l2 + E2 * p2 + v2 * x2, t2[11] = b2 * a2 + w2 * u2 + E2 * g2 + v2 * M2, b2 = i2[12], w2 = i2[13], E2 = i2[14], v2 = i2[15], t2[12] = b2 * s2 + w2 * h2 + E2 * c2 + v2 * m2, t2[13] = b2 * r2 + w2 * o2 + E2 * d2 + v2 * f2, t2[14] = b2 * n2 + w2 * l2 + E2 * p2 + v2 * x2, t2[15] = b2 * a2 + w2 * u2 + E2 * g2 + v2 * M2, t2;
}
function ct(t2, e2) {
  let i2 = e2[0], s2 = e2[1], r2 = e2[2], n2 = e2[4], a2 = e2[5], h2 = e2[6], o2 = e2[8], l2 = e2[9], u2 = e2[10];
  return t2[0] = Math.hypot(i2, s2, r2), t2[1] = Math.hypot(n2, a2, h2), t2[2] = Math.hypot(o2, l2, u2), t2;
}
const dt = function() {
  const t2 = [0, 0, 0];
  return function(e2, i2) {
    let s2 = t2;
    ct(s2, i2);
    let r2 = 1 / s2[0], n2 = 1 / s2[1], a2 = 1 / s2[2], h2 = i2[0] * r2, o2 = i2[1] * n2, l2 = i2[2] * a2, u2 = i2[4] * r2, c2 = i2[5] * n2, d2 = i2[6] * a2, p2 = i2[8] * r2, g2 = i2[9] * n2, m2 = i2[10] * a2, f2 = h2 + c2 + m2, x2 = 0;
    return f2 > 0 ? (x2 = 2 * Math.sqrt(f2 + 1), e2[3] = 0.25 * x2, e2[0] = (d2 - g2) / x2, e2[1] = (p2 - l2) / x2, e2[2] = (o2 - u2) / x2) : h2 > c2 && h2 > m2 ? (x2 = 2 * Math.sqrt(1 + h2 - c2 - m2), e2[3] = (d2 - g2) / x2, e2[0] = 0.25 * x2, e2[1] = (o2 + u2) / x2, e2[2] = (p2 + l2) / x2) : c2 > m2 ? (x2 = 2 * Math.sqrt(1 + c2 - h2 - m2), e2[3] = (p2 - l2) / x2, e2[0] = (o2 + u2) / x2, e2[1] = 0.25 * x2, e2[2] = (d2 + g2) / x2) : (x2 = 2 * Math.sqrt(1 + m2 - h2 - c2), e2[3] = (o2 - u2) / x2, e2[0] = (p2 + l2) / x2, e2[1] = (d2 + g2) / x2, e2[2] = 0.25 * x2), e2;
  };
}();
class pt extends Array {
  constructor(t2 = 1, e2 = 0, i2 = 0, s2 = 0, r2 = 0, n2 = 1, a2 = 0, h2 = 0, o2 = 0, l2 = 0, u2 = 1, c2 = 0, d2 = 0, p2 = 0, g2 = 0, m2 = 1) {
    return super(t2, e2, i2, s2, r2, n2, a2, h2, o2, l2, u2, c2, d2, p2, g2, m2), this;
  }
  get x() {
    return this[12];
  }
  get y() {
    return this[13];
  }
  get z() {
    return this[14];
  }
  get w() {
    return this[15];
  }
  set x(t2) {
    this[12] = t2;
  }
  set y(t2) {
    this[13] = t2;
  }
  set z(t2) {
    this[14] = t2;
  }
  set w(t2) {
    this[15] = t2;
  }
  set(t2, e2, i2, s2, r2, n2, a2, h2, o2, l2, u2, c2, d2, p2, g2, m2) {
    return t2.length ? this.copy(t2) : (function(t3, e3, i3, s3, r3, n3, a3, h3, o3, l3, u3, c3, d3, p3, g3, m3, f2) {
      t3[0] = e3, t3[1] = i3, t3[2] = s3, t3[3] = r3, t3[4] = n3, t3[5] = a3, t3[6] = h3, t3[7] = o3, t3[8] = l3, t3[9] = u3, t3[10] = c3, t3[11] = d3, t3[12] = p3, t3[13] = g3, t3[14] = m3, t3[15] = f2;
    }(this, t2, e2, i2, s2, r2, n2, a2, h2, o2, l2, u2, c2, d2, p2, g2, m2), this);
  }
  translate(t2, e2 = this) {
    return function(t3, e3, i2) {
      let s2, r2, n2, a2, h2, o2, l2, u2, c2, d2, p2, g2, m2 = i2[0], f2 = i2[1], x2 = i2[2];
      e3 === t3 ? (t3[12] = e3[0] * m2 + e3[4] * f2 + e3[8] * x2 + e3[12], t3[13] = e3[1] * m2 + e3[5] * f2 + e3[9] * x2 + e3[13], t3[14] = e3[2] * m2 + e3[6] * f2 + e3[10] * x2 + e3[14], t3[15] = e3[3] * m2 + e3[7] * f2 + e3[11] * x2 + e3[15]) : (s2 = e3[0], r2 = e3[1], n2 = e3[2], a2 = e3[3], h2 = e3[4], o2 = e3[5], l2 = e3[6], u2 = e3[7], c2 = e3[8], d2 = e3[9], p2 = e3[10], g2 = e3[11], t3[0] = s2, t3[1] = r2, t3[2] = n2, t3[3] = a2, t3[4] = h2, t3[5] = o2, t3[6] = l2, t3[7] = u2, t3[8] = c2, t3[9] = d2, t3[10] = p2, t3[11] = g2, t3[12] = s2 * m2 + h2 * f2 + c2 * x2 + e3[12], t3[13] = r2 * m2 + o2 * f2 + d2 * x2 + e3[13], t3[14] = n2 * m2 + l2 * f2 + p2 * x2 + e3[14], t3[15] = a2 * m2 + u2 * f2 + g2 * x2 + e3[15]);
    }(this, e2, t2), this;
  }
  rotate(t2, e2, i2 = this) {
    return function(t3, e3, i3, s2) {
      let r2, n2, a2, h2, o2, l2, u2, c2, d2, p2, g2, m2, f2, x2, M2, b2, w2, E2, v2, A2, y2, _2, F2, T2, S2 = s2[0], L2 = s2[1], R2 = s2[2], C2 = Math.hypot(S2, L2, R2);
      Math.abs(C2) < 1e-6 || (C2 = 1 / C2, S2 *= C2, L2 *= C2, R2 *= C2, r2 = Math.sin(i3), n2 = Math.cos(i3), a2 = 1 - n2, h2 = e3[0], o2 = e3[1], l2 = e3[2], u2 = e3[3], c2 = e3[4], d2 = e3[5], p2 = e3[6], g2 = e3[7], m2 = e3[8], f2 = e3[9], x2 = e3[10], M2 = e3[11], b2 = S2 * S2 * a2 + n2, w2 = L2 * S2 * a2 + R2 * r2, E2 = R2 * S2 * a2 - L2 * r2, v2 = S2 * L2 * a2 - R2 * r2, A2 = L2 * L2 * a2 + n2, y2 = R2 * L2 * a2 + S2 * r2, _2 = S2 * R2 * a2 + L2 * r2, F2 = L2 * R2 * a2 - S2 * r2, T2 = R2 * R2 * a2 + n2, t3[0] = h2 * b2 + c2 * w2 + m2 * E2, t3[1] = o2 * b2 + d2 * w2 + f2 * E2, t3[2] = l2 * b2 + p2 * w2 + x2 * E2, t3[3] = u2 * b2 + g2 * w2 + M2 * E2, t3[4] = h2 * v2 + c2 * A2 + m2 * y2, t3[5] = o2 * v2 + d2 * A2 + f2 * y2, t3[6] = l2 * v2 + p2 * A2 + x2 * y2, t3[7] = u2 * v2 + g2 * A2 + M2 * y2, t3[8] = h2 * _2 + c2 * F2 + m2 * T2, t3[9] = o2 * _2 + d2 * F2 + f2 * T2, t3[10] = l2 * _2 + p2 * F2 + x2 * T2, t3[11] = u2 * _2 + g2 * F2 + M2 * T2, e3 !== t3 && (t3[12] = e3[12], t3[13] = e3[13], t3[14] = e3[14], t3[15] = e3[15]));
    }(this, i2, t2, e2), this;
  }
  scale(t2, e2 = this) {
    return function(t3, e3, i2) {
      let s2 = i2[0], r2 = i2[1], n2 = i2[2];
      t3[0] = e3[0] * s2, t3[1] = e3[1] * s2, t3[2] = e3[2] * s2, t3[3] = e3[3] * s2, t3[4] = e3[4] * r2, t3[5] = e3[5] * r2, t3[6] = e3[6] * r2, t3[7] = e3[7] * r2, t3[8] = e3[8] * n2, t3[9] = e3[9] * n2, t3[10] = e3[10] * n2, t3[11] = e3[11] * n2, t3[12] = e3[12], t3[13] = e3[13], t3[14] = e3[14], t3[15] = e3[15];
    }(this, e2, typeof t2 == "number" ? [t2, t2, t2] : t2), this;
  }
  multiply(t2, e2) {
    return e2 ? ut(this, t2, e2) : ut(this, this, t2), this;
  }
  identity() {
    var t2;
    return (t2 = this)[0] = 1, t2[1] = 0, t2[2] = 0, t2[3] = 0, t2[4] = 0, t2[5] = 1, t2[6] = 0, t2[7] = 0, t2[8] = 0, t2[9] = 0, t2[10] = 1, t2[11] = 0, t2[12] = 0, t2[13] = 0, t2[14] = 0, t2[15] = 1, this;
  }
  copy(t2) {
    var e2, i2;
    return i2 = t2, (e2 = this)[0] = i2[0], e2[1] = i2[1], e2[2] = i2[2], e2[3] = i2[3], e2[4] = i2[4], e2[5] = i2[5], e2[6] = i2[6], e2[7] = i2[7], e2[8] = i2[8], e2[9] = i2[9], e2[10] = i2[10], e2[11] = i2[11], e2[12] = i2[12], e2[13] = i2[13], e2[14] = i2[14], e2[15] = i2[15], this;
  }
  fromPerspective({ fov: t2, aspect: e2, near: i2, far: s2 } = {}) {
    return function(t3, e3, i3, s3, r2) {
      let n2 = 1 / Math.tan(e3 / 2), a2 = 1 / (s3 - r2);
      t3[0] = n2 / i3, t3[1] = 0, t3[2] = 0, t3[3] = 0, t3[4] = 0, t3[5] = n2, t3[6] = 0, t3[7] = 0, t3[8] = 0, t3[9] = 0, t3[10] = (r2 + s3) * a2, t3[11] = -1, t3[12] = 0, t3[13] = 0, t3[14] = 2 * r2 * s3 * a2, t3[15] = 0;
    }(this, t2, e2, i2, s2), this;
  }
  fromOrthogonal({ left: t2, right: e2, bottom: i2, top: s2, near: r2, far: n2 }) {
    return function(t3, e3, i3, s3, r3, n3, a2) {
      let h2 = 1 / (e3 - i3), o2 = 1 / (s3 - r3), l2 = 1 / (n3 - a2);
      t3[0] = -2 * h2, t3[1] = 0, t3[2] = 0, t3[3] = 0, t3[4] = 0, t3[5] = -2 * o2, t3[6] = 0, t3[7] = 0, t3[8] = 0, t3[9] = 0, t3[10] = 2 * l2, t3[11] = 0, t3[12] = (e3 + i3) * h2, t3[13] = (r3 + s3) * o2, t3[14] = (a2 + n3) * l2, t3[15] = 1;
    }(this, t2, e2, i2, s2, r2, n2), this;
  }
  fromQuaternion(t2) {
    return function(t3, e2) {
      let i2 = e2[0], s2 = e2[1], r2 = e2[2], n2 = e2[3], a2 = i2 + i2, h2 = s2 + s2, o2 = r2 + r2, l2 = i2 * a2, u2 = s2 * a2, c2 = s2 * h2, d2 = r2 * a2, p2 = r2 * h2, g2 = r2 * o2, m2 = n2 * a2, f2 = n2 * h2, x2 = n2 * o2;
      t3[0] = 1 - c2 - g2, t3[1] = u2 + x2, t3[2] = d2 - f2, t3[3] = 0, t3[4] = u2 - x2, t3[5] = 1 - l2 - g2, t3[6] = p2 + m2, t3[7] = 0, t3[8] = d2 + f2, t3[9] = p2 - m2, t3[10] = 1 - l2 - c2, t3[11] = 0, t3[12] = 0, t3[13] = 0, t3[14] = 0, t3[15] = 1;
    }(this, t2), this;
  }
  setPosition(t2) {
    return this.x = t2[0], this.y = t2[1], this.z = t2[2], this;
  }
  inverse(t2 = this) {
    return function(t3, e2) {
      let i2 = e2[0], s2 = e2[1], r2 = e2[2], n2 = e2[3], a2 = e2[4], h2 = e2[5], o2 = e2[6], l2 = e2[7], u2 = e2[8], c2 = e2[9], d2 = e2[10], p2 = e2[11], g2 = e2[12], m2 = e2[13], f2 = e2[14], x2 = e2[15], M2 = i2 * h2 - s2 * a2, b2 = i2 * o2 - r2 * a2, w2 = i2 * l2 - n2 * a2, E2 = s2 * o2 - r2 * h2, v2 = s2 * l2 - n2 * h2, A2 = r2 * l2 - n2 * o2, y2 = u2 * m2 - c2 * g2, _2 = u2 * f2 - d2 * g2, F2 = u2 * x2 - p2 * g2, T2 = c2 * f2 - d2 * m2, S2 = c2 * x2 - p2 * m2, L2 = d2 * x2 - p2 * f2, R2 = M2 * L2 - b2 * S2 + w2 * T2 + E2 * F2 - v2 * _2 + A2 * y2;
      R2 && (R2 = 1 / R2, t3[0] = (h2 * L2 - o2 * S2 + l2 * T2) * R2, t3[1] = (r2 * S2 - s2 * L2 - n2 * T2) * R2, t3[2] = (m2 * A2 - f2 * v2 + x2 * E2) * R2, t3[3] = (d2 * v2 - c2 * A2 - p2 * E2) * R2, t3[4] = (o2 * F2 - a2 * L2 - l2 * _2) * R2, t3[5] = (i2 * L2 - r2 * F2 + n2 * _2) * R2, t3[6] = (f2 * w2 - g2 * A2 - x2 * b2) * R2, t3[7] = (u2 * A2 - d2 * w2 + p2 * b2) * R2, t3[8] = (a2 * S2 - h2 * F2 + l2 * y2) * R2, t3[9] = (s2 * F2 - i2 * S2 - n2 * y2) * R2, t3[10] = (g2 * v2 - m2 * w2 + x2 * M2) * R2, t3[11] = (c2 * w2 - u2 * v2 - p2 * M2) * R2, t3[12] = (h2 * _2 - a2 * T2 - o2 * y2) * R2, t3[13] = (i2 * T2 - s2 * _2 + r2 * y2) * R2, t3[14] = (m2 * b2 - g2 * E2 - f2 * M2) * R2, t3[15] = (u2 * E2 - c2 * b2 + d2 * M2) * R2);
    }(this, t2), this;
  }
  compose(t2, e2, i2) {
    return function(t3, e3, i3, s2) {
      let r2 = e3[0], n2 = e3[1], a2 = e3[2], h2 = e3[3], o2 = r2 + r2, l2 = n2 + n2, u2 = a2 + a2, c2 = r2 * o2, d2 = r2 * l2, p2 = r2 * u2, g2 = n2 * l2, m2 = n2 * u2, f2 = a2 * u2, x2 = h2 * o2, M2 = h2 * l2, b2 = h2 * u2, w2 = s2[0], E2 = s2[1], v2 = s2[2];
      t3[0] = (1 - (g2 + f2)) * w2, t3[1] = (d2 + b2) * w2, t3[2] = (p2 - M2) * w2, t3[3] = 0, t3[4] = (d2 - b2) * E2, t3[5] = (1 - (c2 + f2)) * E2, t3[6] = (m2 + x2) * E2, t3[7] = 0, t3[8] = (p2 + M2) * v2, t3[9] = (m2 - x2) * v2, t3[10] = (1 - (c2 + g2)) * v2, t3[11] = 0, t3[12] = i3[0], t3[13] = i3[1], t3[14] = i3[2], t3[15] = 1;
    }(this, t2, e2, i2), this;
  }
  getRotation(t2) {
    return dt(t2, this), this;
  }
  getTranslation(t2) {
    var e2, i2;
    return i2 = this, (e2 = t2)[0] = i2[12], e2[1] = i2[13], e2[2] = i2[14], this;
  }
  getScaling(t2) {
    return ct(t2, this), this;
  }
  getMaxScaleOnAxis() {
    return function(t2) {
      let e2 = t2[0], i2 = t2[1], s2 = t2[2], r2 = t2[4], n2 = t2[5], a2 = t2[6], h2 = t2[8], o2 = t2[9], l2 = t2[10];
      const u2 = e2 * e2 + i2 * i2 + s2 * s2, c2 = r2 * r2 + n2 * n2 + a2 * a2, d2 = h2 * h2 + o2 * o2 + l2 * l2;
      return Math.sqrt(Math.max(u2, c2, d2));
    }(this);
  }
  lookAt(t2, e2, i2) {
    return function(t3, e3, i3, s2) {
      let r2 = e3[0], n2 = e3[1], a2 = e3[2], h2 = s2[0], o2 = s2[1], l2 = s2[2], u2 = r2 - i3[0], c2 = n2 - i3[1], d2 = a2 - i3[2], p2 = u2 * u2 + c2 * c2 + d2 * d2;
      p2 === 0 ? d2 = 1 : (p2 = 1 / Math.sqrt(p2), u2 *= p2, c2 *= p2, d2 *= p2);
      let g2 = o2 * d2 - l2 * c2, m2 = l2 * u2 - h2 * d2, f2 = h2 * c2 - o2 * u2;
      p2 = g2 * g2 + m2 * m2 + f2 * f2, p2 === 0 && (l2 ? h2 += 1e-6 : o2 ? l2 += 1e-6 : o2 += 1e-6, g2 = o2 * d2 - l2 * c2, m2 = l2 * u2 - h2 * d2, f2 = h2 * c2 - o2 * u2, p2 = g2 * g2 + m2 * m2 + f2 * f2), p2 = 1 / Math.sqrt(p2), g2 *= p2, m2 *= p2, f2 *= p2, t3[0] = g2, t3[1] = m2, t3[2] = f2, t3[3] = 0, t3[4] = c2 * f2 - d2 * m2, t3[5] = d2 * g2 - u2 * f2, t3[6] = u2 * m2 - c2 * g2, t3[7] = 0, t3[8] = u2, t3[9] = c2, t3[10] = d2, t3[11] = 0, t3[12] = r2, t3[13] = n2, t3[14] = a2, t3[15] = 1;
    }(this, t2, e2, i2), this;
  }
  determinant() {
    return function(t2) {
      let e2 = t2[0], i2 = t2[1], s2 = t2[2], r2 = t2[3], n2 = t2[4], a2 = t2[5], h2 = t2[6], o2 = t2[7], l2 = t2[8], u2 = t2[9], c2 = t2[10], d2 = t2[11], p2 = t2[12], g2 = t2[13], m2 = t2[14], f2 = t2[15];
      return (e2 * a2 - i2 * n2) * (c2 * f2 - d2 * m2) - (e2 * h2 - s2 * n2) * (u2 * f2 - d2 * g2) + (e2 * o2 - r2 * n2) * (u2 * m2 - c2 * g2) + (i2 * h2 - s2 * a2) * (l2 * f2 - d2 * p2) - (i2 * o2 - r2 * a2) * (l2 * m2 - c2 * p2) + (s2 * o2 - r2 * h2) * (l2 * g2 - u2 * p2);
    }(this);
  }
  fromArray(t2, e2 = 0) {
    return this[0] = t2[e2], this[1] = t2[e2 + 1], this[2] = t2[e2 + 2], this[3] = t2[e2 + 3], this[4] = t2[e2 + 4], this[5] = t2[e2 + 5], this[6] = t2[e2 + 6], this[7] = t2[e2 + 7], this[8] = t2[e2 + 8], this[9] = t2[e2 + 9], this[10] = t2[e2 + 10], this[11] = t2[e2 + 11], this[12] = t2[e2 + 12], this[13] = t2[e2 + 13], this[14] = t2[e2 + 14], this[15] = t2[e2 + 15], this;
  }
  toArray(t2 = [], e2 = 0) {
    return t2[e2] = this[0], t2[e2 + 1] = this[1], t2[e2 + 2] = this[2], t2[e2 + 3] = this[3], t2[e2 + 4] = this[4], t2[e2 + 5] = this[5], t2[e2 + 6] = this[6], t2[e2 + 7] = this[7], t2[e2 + 8] = this[8], t2[e2 + 9] = this[9], t2[e2 + 10] = this[10], t2[e2 + 11] = this[11], t2[e2 + 12] = this[12], t2[e2 + 13] = this[13], t2[e2 + 14] = this[14], t2[e2 + 15] = this[15], t2;
  }
}
const gt = new pt();
class mt extends Array {
  constructor(t2 = 0, e2 = t2, i2 = t2, s2 = "YXZ") {
    return super(t2, e2, i2), this.order = s2, this.onChange = () => {
    }, this;
  }
  get x() {
    return this[0];
  }
  get y() {
    return this[1];
  }
  get z() {
    return this[2];
  }
  set x(t2) {
    this[0] = t2, this.onChange();
  }
  set y(t2) {
    this[1] = t2, this.onChange();
  }
  set z(t2) {
    this[2] = t2, this.onChange();
  }
  set(t2, e2 = t2, i2 = t2) {
    return t2.length ? this.copy(t2) : (this[0] = t2, this[1] = e2, this[2] = i2, this.onChange(), this);
  }
  copy(t2) {
    return this[0] = t2[0], this[1] = t2[1], this[2] = t2[2], this.onChange(), this;
  }
  reorder(t2) {
    return this.order = t2, this.onChange(), this;
  }
  fromRotationMatrix(t2, e2 = this.order) {
    return function(t3, e3, i2 = "YXZ") {
      i2 === "XYZ" ? (t3[1] = Math.asin(Math.min(Math.max(e3[8], -1), 1)), Math.abs(e3[8]) < 0.99999 ? (t3[0] = Math.atan2(-e3[9], e3[10]), t3[2] = Math.atan2(-e3[4], e3[0])) : (t3[0] = Math.atan2(e3[6], e3[5]), t3[2] = 0)) : i2 === "YXZ" ? (t3[0] = Math.asin(-Math.min(Math.max(e3[9], -1), 1)), Math.abs(e3[9]) < 0.99999 ? (t3[1] = Math.atan2(e3[8], e3[10]), t3[2] = Math.atan2(e3[1], e3[5])) : (t3[1] = Math.atan2(-e3[2], e3[0]), t3[2] = 0)) : i2 === "ZXY" ? (t3[0] = Math.asin(Math.min(Math.max(e3[6], -1), 1)), Math.abs(e3[6]) < 0.99999 ? (t3[1] = Math.atan2(-e3[2], e3[10]), t3[2] = Math.atan2(-e3[4], e3[5])) : (t3[1] = 0, t3[2] = Math.atan2(e3[1], e3[0]))) : i2 === "ZYX" ? (t3[1] = Math.asin(-Math.min(Math.max(e3[2], -1), 1)), Math.abs(e3[2]) < 0.99999 ? (t3[0] = Math.atan2(e3[6], e3[10]), t3[2] = Math.atan2(e3[1], e3[0])) : (t3[0] = 0, t3[2] = Math.atan2(-e3[4], e3[5]))) : i2 === "YZX" ? (t3[2] = Math.asin(Math.min(Math.max(e3[1], -1), 1)), Math.abs(e3[1]) < 0.99999 ? (t3[0] = Math.atan2(-e3[9], e3[5]), t3[1] = Math.atan2(-e3[2], e3[0])) : (t3[0] = 0, t3[1] = Math.atan2(e3[8], e3[10]))) : i2 === "XZY" && (t3[2] = Math.asin(-Math.min(Math.max(e3[4], -1), 1)), Math.abs(e3[4]) < 0.99999 ? (t3[0] = Math.atan2(e3[6], e3[5]), t3[1] = Math.atan2(e3[8], e3[0])) : (t3[0] = Math.atan2(-e3[9], e3[10]), t3[1] = 0));
    }(this, t2, e2), this;
  }
  fromQuaternion(t2, e2 = this.order) {
    return gt.fromQuaternion(t2), this.fromRotationMatrix(gt, e2);
  }
  toArray(t2 = [], e2 = 0) {
    return t2[e2] = this[0], t2[e2 + 1] = this[1], t2[e2 + 2] = this[2], t2;
  }
}
class ft {
  constructor() {
    this.parent = null, this.children = [], this.visible = true, this.matrix = new pt(), this.worldMatrix = new pt(), this.matrixAutoUpdate = true, this.position = new Y(), this.quaternion = new lt(), this.scale = new Y(1), this.rotation = new mt(), this.up = new Y(0, 1, 0), this.rotation.onChange = () => this.quaternion.fromEuler(this.rotation), this.quaternion.onChange = () => this.rotation.fromQuaternion(this.quaternion);
  }
  setParent(t2, e2 = true) {
    this.parent && t2 !== this.parent && this.parent.removeChild(this, false), this.parent = t2, e2 && t2 && t2.addChild(this, false);
  }
  addChild(t2, e2 = true) {
    ~this.children.indexOf(t2) || this.children.push(t2), e2 && t2.setParent(this, false);
  }
  removeChild(t2, e2 = true) {
    ~this.children.indexOf(t2) && this.children.splice(this.children.indexOf(t2), 1), e2 && t2.setParent(null, false);
  }
  updateMatrixWorld(t2) {
    this.matrixAutoUpdate && this.updateMatrix(), (this.worldMatrixNeedsUpdate || t2) && (this.parent === null ? this.worldMatrix.copy(this.matrix) : this.worldMatrix.multiply(this.parent.worldMatrix, this.matrix), this.worldMatrixNeedsUpdate = false, t2 = true);
    for (let e2 = 0, i2 = this.children.length; e2 < i2; e2++)
      this.children[e2].updateMatrixWorld(t2);
  }
  updateMatrix() {
    this.matrix.compose(this.quaternion, this.position, this.scale), this.worldMatrixNeedsUpdate = true;
  }
  traverse(t2) {
    if (!t2(this))
      for (let e2 = 0, i2 = this.children.length; e2 < i2; e2++)
        this.children[e2].traverse(t2);
  }
  decompose() {
    this.matrix.getTranslation(this.position), this.matrix.getRotation(this.quaternion), this.matrix.getScaling(this.scale), this.rotation.fromQuaternion(this.quaternion);
  }
  lookAt(t2, e2 = false) {
    e2 ? this.matrix.lookAt(this.position, t2, this.up) : this.matrix.lookAt(t2, this.position, this.up), this.matrix.getRotation(this.quaternion), this.rotation.fromQuaternion(this.quaternion);
  }
}
const xt = new pt(), Mt = new Y(), bt = new Y();
class wt extends ft {
  constructor(t2, { near: e2 = 0.1, far: i2 = 100, fov: s2 = 45, aspect: r2 = 1, left: n2, right: a2, bottom: h2, top: o2, zoom: l2 = 1 } = {}) {
    super(), Object.assign(this, { near: e2, far: i2, fov: s2, aspect: r2, left: n2, right: a2, bottom: h2, top: o2, zoom: l2 }), this.projectionMatrix = new pt(), this.viewMatrix = new pt(), this.projectionViewMatrix = new pt(), this.worldPosition = new Y(), this.type = n2 || a2 ? "orthographic" : "perspective", this.type === "orthographic" ? this.orthographic() : this.perspective();
  }
  perspective({ near: t2 = this.near, far: e2 = this.far, fov: i2 = this.fov, aspect: s2 = this.aspect } = {}) {
    return Object.assign(this, { near: t2, far: e2, fov: i2, aspect: s2 }), this.projectionMatrix.fromPerspective({ fov: i2 * (Math.PI / 180), aspect: s2, near: t2, far: e2 }), this.type = "perspective", this;
  }
  orthographic({ near: t2 = this.near, far: e2 = this.far, left: i2 = this.left, right: s2 = this.right, bottom: r2 = this.bottom, top: n2 = this.top, zoom: a2 = this.zoom } = {}) {
    return Object.assign(this, { near: t2, far: e2, left: i2, right: s2, bottom: r2, top: n2, zoom: a2 }), i2 /= a2, s2 /= a2, r2 /= a2, n2 /= a2, this.projectionMatrix.fromOrthogonal({ left: i2, right: s2, bottom: r2, top: n2, near: t2, far: e2 }), this.type = "orthographic", this;
  }
  updateMatrixWorld() {
    return super.updateMatrixWorld(), this.viewMatrix.inverse(this.worldMatrix), this.worldMatrix.getTranslation(this.worldPosition), this.projectionViewMatrix.multiply(this.projectionMatrix, this.viewMatrix), this;
  }
  lookAt(t2) {
    return super.lookAt(t2, true), this;
  }
  project(t2) {
    return t2.applyMatrix4(this.viewMatrix), t2.applyMatrix4(this.projectionMatrix), this;
  }
  unproject(t2) {
    return t2.applyMatrix4(xt.inverse(this.projectionMatrix)), t2.applyMatrix4(this.worldMatrix), this;
  }
  updateFrustum() {
    this.frustum || (this.frustum = [new Y(), new Y(), new Y(), new Y(), new Y(), new Y()]);
    const t2 = this.projectionViewMatrix;
    this.frustum[0].set(t2[3] - t2[0], t2[7] - t2[4], t2[11] - t2[8]).constant = t2[15] - t2[12], this.frustum[1].set(t2[3] + t2[0], t2[7] + t2[4], t2[11] + t2[8]).constant = t2[15] + t2[12], this.frustum[2].set(t2[3] + t2[1], t2[7] + t2[5], t2[11] + t2[9]).constant = t2[15] + t2[13], this.frustum[3].set(t2[3] - t2[1], t2[7] - t2[5], t2[11] - t2[9]).constant = t2[15] - t2[13], this.frustum[4].set(t2[3] - t2[2], t2[7] - t2[6], t2[11] - t2[10]).constant = t2[15] - t2[14], this.frustum[5].set(t2[3] + t2[2], t2[7] + t2[6], t2[11] + t2[10]).constant = t2[15] + t2[14];
    for (let t3 = 0; t3 < 6; t3++) {
      const e2 = 1 / this.frustum[t3].distance();
      this.frustum[t3].multiply(e2), this.frustum[t3].constant *= e2;
    }
  }
  frustumIntersectsMesh(t2) {
    if (!t2.geometry.attributes.position)
      return true;
    if (t2.geometry.bounds && t2.geometry.bounds.radius !== 1 / 0 || t2.geometry.computeBoundingSphere(), !t2.geometry.bounds)
      return true;
    const e2 = Mt;
    e2.copy(t2.geometry.bounds.center), e2.applyMatrix4(t2.worldMatrix);
    const i2 = t2.geometry.bounds.radius * t2.worldMatrix.getMaxScaleOnAxis();
    return this.frustumIntersectsSphere(e2, i2);
  }
  frustumIntersectsSphere(t2, e2) {
    const i2 = bt;
    for (let s2 = 0; s2 < 6; s2++) {
      const r2 = this.frustum[s2];
      if (i2.copy(r2).dot(t2) + r2.constant < -e2)
        return false;
    }
    return true;
  }
}
function Et(t2, e2, i2) {
  let s2 = e2[0], r2 = e2[1], n2 = e2[2], a2 = e2[3], h2 = e2[4], o2 = e2[5], l2 = e2[6], u2 = e2[7], c2 = e2[8], d2 = i2[0], p2 = i2[1], g2 = i2[2], m2 = i2[3], f2 = i2[4], x2 = i2[5], M2 = i2[6], b2 = i2[7], w2 = i2[8];
  return t2[0] = d2 * s2 + p2 * a2 + g2 * l2, t2[1] = d2 * r2 + p2 * h2 + g2 * u2, t2[2] = d2 * n2 + p2 * o2 + g2 * c2, t2[3] = m2 * s2 + f2 * a2 + x2 * l2, t2[4] = m2 * r2 + f2 * h2 + x2 * u2, t2[5] = m2 * n2 + f2 * o2 + x2 * c2, t2[6] = M2 * s2 + b2 * a2 + w2 * l2, t2[7] = M2 * r2 + b2 * h2 + w2 * u2, t2[8] = M2 * n2 + b2 * o2 + w2 * c2, t2;
}
class vt extends Array {
  constructor(t2 = 1, e2 = 0, i2 = 0, s2 = 0, r2 = 1, n2 = 0, a2 = 0, h2 = 0, o2 = 1) {
    return super(t2, e2, i2, s2, r2, n2, a2, h2, o2), this;
  }
  set(t2, e2, i2, s2, r2, n2, a2, h2, o2) {
    return t2.length ? this.copy(t2) : (function(t3, e3, i3, s3, r3, n3, a3, h3, o3, l2) {
      t3[0] = e3, t3[1] = i3, t3[2] = s3, t3[3] = r3, t3[4] = n3, t3[5] = a3, t3[6] = h3, t3[7] = o3, t3[8] = l2;
    }(this, t2, e2, i2, s2, r2, n2, a2, h2, o2), this);
  }
  translate(t2, e2 = this) {
    return function(t3, e3, i2) {
      let s2 = e3[0], r2 = e3[1], n2 = e3[2], a2 = e3[3], h2 = e3[4], o2 = e3[5], l2 = e3[6], u2 = e3[7], c2 = e3[8], d2 = i2[0], p2 = i2[1];
      t3[0] = s2, t3[1] = r2, t3[2] = n2, t3[3] = a2, t3[4] = h2, t3[5] = o2, t3[6] = d2 * s2 + p2 * a2 + l2, t3[7] = d2 * r2 + p2 * h2 + u2, t3[8] = d2 * n2 + p2 * o2 + c2;
    }(this, e2, t2), this;
  }
  rotate(t2, e2 = this) {
    return function(t3, e3, i2) {
      let s2 = e3[0], r2 = e3[1], n2 = e3[2], a2 = e3[3], h2 = e3[4], o2 = e3[5], l2 = e3[6], u2 = e3[7], c2 = e3[8], d2 = Math.sin(i2), p2 = Math.cos(i2);
      t3[0] = p2 * s2 + d2 * a2, t3[1] = p2 * r2 + d2 * h2, t3[2] = p2 * n2 + d2 * o2, t3[3] = p2 * a2 - d2 * s2, t3[4] = p2 * h2 - d2 * r2, t3[5] = p2 * o2 - d2 * n2, t3[6] = l2, t3[7] = u2, t3[8] = c2;
    }(this, e2, t2), this;
  }
  scale(t2, e2 = this) {
    return function(t3, e3, i2) {
      let s2 = i2[0], r2 = i2[1];
      t3[0] = s2 * e3[0], t3[1] = s2 * e3[1], t3[2] = s2 * e3[2], t3[3] = r2 * e3[3], t3[4] = r2 * e3[4], t3[5] = r2 * e3[5], t3[6] = e3[6], t3[7] = e3[7], t3[8] = e3[8];
    }(this, e2, t2), this;
  }
  multiply(t2, e2) {
    return e2 ? Et(this, t2, e2) : Et(this, this, t2), this;
  }
  identity() {
    var t2;
    return (t2 = this)[0] = 1, t2[1] = 0, t2[2] = 0, t2[3] = 0, t2[4] = 1, t2[5] = 0, t2[6] = 0, t2[7] = 0, t2[8] = 1, this;
  }
  copy(t2) {
    var e2, i2;
    return i2 = t2, (e2 = this)[0] = i2[0], e2[1] = i2[1], e2[2] = i2[2], e2[3] = i2[3], e2[4] = i2[4], e2[5] = i2[5], e2[6] = i2[6], e2[7] = i2[7], e2[8] = i2[8], this;
  }
  fromMatrix4(t2) {
    var e2, i2;
    return i2 = t2, (e2 = this)[0] = i2[0], e2[1] = i2[1], e2[2] = i2[2], e2[3] = i2[4], e2[4] = i2[5], e2[5] = i2[6], e2[6] = i2[8], e2[7] = i2[9], e2[8] = i2[10], this;
  }
  fromQuaternion(t2) {
    return function(t3, e2) {
      let i2 = e2[0], s2 = e2[1], r2 = e2[2], n2 = e2[3], a2 = i2 + i2, h2 = s2 + s2, o2 = r2 + r2, l2 = i2 * a2, u2 = s2 * a2, c2 = s2 * h2, d2 = r2 * a2, p2 = r2 * h2, g2 = r2 * o2, m2 = n2 * a2, f2 = n2 * h2, x2 = n2 * o2;
      t3[0] = 1 - c2 - g2, t3[3] = u2 - x2, t3[6] = d2 + f2, t3[1] = u2 + x2, t3[4] = 1 - l2 - g2, t3[7] = p2 - m2, t3[2] = d2 - f2, t3[5] = p2 + m2, t3[8] = 1 - l2 - c2;
    }(this, t2), this;
  }
  fromBasis(t2, e2, i2) {
    return this.set(t2[0], t2[1], t2[2], e2[0], e2[1], e2[2], i2[0], i2[1], i2[2]), this;
  }
  inverse(t2 = this) {
    return function(t3, e2) {
      let i2 = e2[0], s2 = e2[1], r2 = e2[2], n2 = e2[3], a2 = e2[4], h2 = e2[5], o2 = e2[6], l2 = e2[7], u2 = e2[8], c2 = u2 * a2 - h2 * l2, d2 = -u2 * n2 + h2 * o2, p2 = l2 * n2 - a2 * o2, g2 = i2 * c2 + s2 * d2 + r2 * p2;
      g2 && (g2 = 1 / g2, t3[0] = c2 * g2, t3[1] = (-u2 * s2 + r2 * l2) * g2, t3[2] = (h2 * s2 - r2 * a2) * g2, t3[3] = d2 * g2, t3[4] = (u2 * i2 - r2 * o2) * g2, t3[5] = (-h2 * i2 + r2 * n2) * g2, t3[6] = p2 * g2, t3[7] = (-l2 * i2 + s2 * o2) * g2, t3[8] = (a2 * i2 - s2 * n2) * g2);
    }(this, t2), this;
  }
  getNormalMatrix(t2) {
    return function(t3, e2) {
      let i2 = e2[0], s2 = e2[1], r2 = e2[2], n2 = e2[3], a2 = e2[4], h2 = e2[5], o2 = e2[6], l2 = e2[7], u2 = e2[8], c2 = e2[9], d2 = e2[10], p2 = e2[11], g2 = e2[12], m2 = e2[13], f2 = e2[14], x2 = e2[15], M2 = i2 * h2 - s2 * a2, b2 = i2 * o2 - r2 * a2, w2 = i2 * l2 - n2 * a2, E2 = s2 * o2 - r2 * h2, v2 = s2 * l2 - n2 * h2, A2 = r2 * l2 - n2 * o2, y2 = u2 * m2 - c2 * g2, _2 = u2 * f2 - d2 * g2, F2 = u2 * x2 - p2 * g2, T2 = c2 * f2 - d2 * m2, S2 = c2 * x2 - p2 * m2, L2 = d2 * x2 - p2 * f2, R2 = M2 * L2 - b2 * S2 + w2 * T2 + E2 * F2 - v2 * _2 + A2 * y2;
      R2 && (R2 = 1 / R2, t3[0] = (h2 * L2 - o2 * S2 + l2 * T2) * R2, t3[1] = (o2 * F2 - a2 * L2 - l2 * _2) * R2, t3[2] = (a2 * S2 - h2 * F2 + l2 * y2) * R2, t3[3] = (r2 * S2 - s2 * L2 - n2 * T2) * R2, t3[4] = (i2 * L2 - r2 * F2 + n2 * _2) * R2, t3[5] = (s2 * F2 - i2 * S2 - n2 * y2) * R2, t3[6] = (m2 * A2 - f2 * v2 + x2 * E2) * R2, t3[7] = (f2 * w2 - g2 * A2 - x2 * b2) * R2, t3[8] = (g2 * v2 - m2 * w2 + x2 * M2) * R2);
    }(this, t2), this;
  }
}
let At = 0;
class yt extends ft {
  constructor(t2, { geometry: e2, program: i2, mode: s2 = t2.TRIANGLES, frustumCulled: r2 = true, renderOrder: n2 = 0 } = {}) {
    super(), t2.canvas || console.error("gl not passed as first argument to Mesh"), this.gl = t2, this.id = At++, this.geometry = e2, this.program = i2, this.mode = s2, this.frustumCulled = r2, this.renderOrder = n2, this.modelViewMatrix = new pt(), this.normalMatrix = new vt(), this.beforeRenderCallbacks = [], this.afterRenderCallbacks = [];
  }
  onBeforeRender(t2) {
    return this.beforeRenderCallbacks.push(t2), this;
  }
  onAfterRender(t2) {
    return this.afterRenderCallbacks.push(t2), this;
  }
  draw({ camera: t2 } = {}) {
    this.beforeRenderCallbacks.forEach((e3) => e3 && e3({ mesh: this, camera: t2 })), t2 && (this.program.uniforms.modelMatrix || Object.assign(this.program.uniforms, { modelMatrix: { value: null }, viewMatrix: { value: null }, modelViewMatrix: { value: null }, normalMatrix: { value: null }, projectionMatrix: { value: null }, cameraPosition: { value: null } }), this.program.uniforms.projectionMatrix.value = t2.projectionMatrix, this.program.uniforms.cameraPosition.value = t2.worldPosition, this.program.uniforms.viewMatrix.value = t2.viewMatrix, this.modelViewMatrix.multiply(t2.viewMatrix, this.worldMatrix), this.normalMatrix.getNormalMatrix(this.modelViewMatrix), this.program.uniforms.modelMatrix.value = this.worldMatrix, this.program.uniforms.modelViewMatrix.value = this.modelViewMatrix, this.program.uniforms.normalMatrix.value = this.normalMatrix);
    let e2 = this.program.cullFace && this.worldMatrix.determinant() < 0;
    this.program.use({ flipFaces: e2 }), this.geometry.draw({ mode: this.mode, program: this.program }), this.afterRenderCallbacks.forEach((e3) => e3 && e3({ mesh: this, camera: t2 }));
  }
}
const _t = new Uint8Array(4);
function Ft(t2) {
  return (t2 & t2 - 1) == 0;
}
let Tt = 1;
class St {
  constructor(t2, { image: e2, target: i2 = t2.TEXTURE_2D, type: s2 = t2.UNSIGNED_BYTE, format: r2 = t2.RGBA, internalFormat: n2 = r2, wrapS: a2 = t2.CLAMP_TO_EDGE, wrapT: h2 = t2.CLAMP_TO_EDGE, generateMipmaps: o2 = true, minFilter: l2 = o2 ? t2.NEAREST_MIPMAP_LINEAR : t2.LINEAR, magFilter: u2 = t2.LINEAR, premultiplyAlpha: c2 = false, unpackAlignment: d2 = 4, flipY: p2 = i2 == t2.TEXTURE_2D, anisotropy: g2 = 0, level: m2 = 0, width: f2, height: x2 = f2 } = {}) {
    this.gl = t2, this.id = Tt++, this.image = e2, this.target = i2, this.type = s2, this.format = r2, this.internalFormat = n2, this.minFilter = l2, this.magFilter = u2, this.wrapS = a2, this.wrapT = h2, this.generateMipmaps = o2, this.premultiplyAlpha = c2, this.unpackAlignment = d2, this.flipY = p2, this.anisotropy = Math.min(g2, this.gl.renderer.parameters.maxAnisotropy), this.level = m2, this.width = f2, this.height = x2, this.texture = this.gl.createTexture(), this.store = { image: null }, this.glState = this.gl.renderer.state, this.state = {}, this.state.minFilter = this.gl.NEAREST_MIPMAP_LINEAR, this.state.magFilter = this.gl.LINEAR, this.state.wrapS = this.gl.REPEAT, this.state.wrapT = this.gl.REPEAT, this.state.anisotropy = 0;
  }
  bind() {
    this.glState.textureUnits[this.glState.activeTextureUnit] !== this.id && (this.gl.bindTexture(this.target, this.texture), this.glState.textureUnits[this.glState.activeTextureUnit] = this.id);
  }
  update(t2 = 0) {
    const e2 = !(this.image === this.store.image && !this.needsUpdate);
    if ((e2 || this.glState.textureUnits[t2] !== this.id) && (this.gl.renderer.activeTexture(t2), this.bind()), e2) {
      if (this.needsUpdate = false, this.flipY !== this.glState.flipY && (this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, this.flipY), this.glState.flipY = this.flipY), this.premultiplyAlpha !== this.glState.premultiplyAlpha && (this.gl.pixelStorei(this.gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, this.premultiplyAlpha), this.glState.premultiplyAlpha = this.premultiplyAlpha), this.unpackAlignment !== this.glState.unpackAlignment && (this.gl.pixelStorei(this.gl.UNPACK_ALIGNMENT, this.unpackAlignment), this.glState.unpackAlignment = this.unpackAlignment), this.minFilter !== this.state.minFilter && (this.gl.texParameteri(this.target, this.gl.TEXTURE_MIN_FILTER, this.minFilter), this.state.minFilter = this.minFilter), this.magFilter !== this.state.magFilter && (this.gl.texParameteri(this.target, this.gl.TEXTURE_MAG_FILTER, this.magFilter), this.state.magFilter = this.magFilter), this.wrapS !== this.state.wrapS && (this.gl.texParameteri(this.target, this.gl.TEXTURE_WRAP_S, this.wrapS), this.state.wrapS = this.wrapS), this.wrapT !== this.state.wrapT && (this.gl.texParameteri(this.target, this.gl.TEXTURE_WRAP_T, this.wrapT), this.state.wrapT = this.wrapT), this.anisotropy && this.anisotropy !== this.state.anisotropy && (this.gl.texParameterf(this.target, this.gl.renderer.getExtension("EXT_texture_filter_anisotropic").TEXTURE_MAX_ANISOTROPY_EXT, this.anisotropy), this.state.anisotropy = this.anisotropy), this.image) {
        if (this.image.width && (this.width = this.image.width, this.height = this.image.height), this.target === this.gl.TEXTURE_CUBE_MAP)
          for (let t3 = 0; t3 < 6; t3++)
            this.gl.texImage2D(this.gl.TEXTURE_CUBE_MAP_POSITIVE_X + t3, this.level, this.internalFormat, this.format, this.type, this.image[t3]);
        else if (ArrayBuffer.isView(this.image))
          this.gl.texImage2D(this.target, this.level, this.internalFormat, this.width, this.height, 0, this.format, this.type, this.image);
        else if (this.image.isCompressedTexture)
          for (let t3 = 0; t3 < this.image.length; t3++)
            this.gl.compressedTexImage2D(this.target, t3, this.internalFormat, this.image[t3].width, this.image[t3].height, 0, this.image[t3].data);
        else
          this.gl.texImage2D(this.target, this.level, this.internalFormat, this.format, this.type, this.image);
        this.generateMipmaps && (this.gl.renderer.isWebgl2 || Ft(this.image.width) && Ft(this.image.height) ? this.gl.generateMipmap(this.target) : (this.generateMipmaps = false, this.wrapS = this.wrapT = this.gl.CLAMP_TO_EDGE, this.minFilter = this.gl.LINEAR)), this.onUpdate && this.onUpdate();
      } else if (this.target === this.gl.TEXTURE_CUBE_MAP)
        for (let t3 = 0; t3 < 6; t3++)
          this.gl.texImage2D(this.gl.TEXTURE_CUBE_MAP_POSITIVE_X + t3, 0, this.gl.RGBA, 1, 1, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, _t);
      else
        this.width ? this.gl.texImage2D(this.target, this.level, this.internalFormat, this.width, this.height, 0, this.format, this.type, null) : this.gl.texImage2D(this.target, 0, this.gl.RGBA, 1, 1, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, _t);
      this.store.image = this.image;
    }
  }
}
function Lt(t2, e2, i2) {
  return t2[0] = e2[0] + i2[0], t2[1] = e2[1] + i2[1], t2;
}
function Rt(t2, e2, i2) {
  return t2[0] = e2[0] - i2[0], t2[1] = e2[1] - i2[1], t2;
}
function Ct(t2, e2, i2) {
  return t2[0] = e2[0] * i2, t2[1] = e2[1] * i2, t2;
}
function It(t2) {
  var e2 = t2[0], i2 = t2[1];
  return Math.sqrt(e2 * e2 + i2 * i2);
}
function Pt(t2, e2) {
  return t2[0] * e2[1] - t2[1] * e2[0];
}
class Ot extends Array {
  constructor(t2 = 0, e2 = t2) {
    return super(t2, e2), this;
  }
  get x() {
    return this[0];
  }
  get y() {
    return this[1];
  }
  set x(t2) {
    this[0] = t2;
  }
  set y(t2) {
    this[1] = t2;
  }
  set(t2, e2 = t2) {
    return t2.length ? this.copy(t2) : (function(t3, e3, i2) {
      t3[0] = e3, t3[1] = i2;
    }(this, t2, e2), this);
  }
  copy(t2) {
    var e2, i2;
    return i2 = t2, (e2 = this)[0] = i2[0], e2[1] = i2[1], this;
  }
  add(t2, e2) {
    return e2 ? Lt(this, t2, e2) : Lt(this, this, t2), this;
  }
  sub(t2, e2) {
    return e2 ? Rt(this, t2, e2) : Rt(this, this, t2), this;
  }
  multiply(t2) {
    var e2, i2, s2;
    return t2.length ? (i2 = this, s2 = t2, (e2 = this)[0] = i2[0] * s2[0], e2[1] = i2[1] * s2[1]) : Ct(this, this, t2), this;
  }
  divide(t2) {
    var e2, i2, s2;
    return t2.length ? (i2 = this, s2 = t2, (e2 = this)[0] = i2[0] / s2[0], e2[1] = i2[1] / s2[1]) : Ct(this, this, 1 / t2), this;
  }
  inverse(t2 = this) {
    var e2, i2;
    return i2 = t2, (e2 = this)[0] = 1 / i2[0], e2[1] = 1 / i2[1], this;
  }
  len() {
    return It(this);
  }
  distance(t2) {
    return t2 ? (e2 = this, s2 = (i2 = t2)[0] - e2[0], r2 = i2[1] - e2[1], Math.sqrt(s2 * s2 + r2 * r2)) : It(this);
    var e2, i2, s2, r2;
  }
  squaredLen() {
    return this.squaredDistance();
  }
  squaredDistance(t2) {
    return t2 ? (e2 = this, s2 = (i2 = t2)[0] - e2[0], r2 = i2[1] - e2[1], s2 * s2 + r2 * r2) : function(t3) {
      var e3 = t3[0], i3 = t3[1];
      return e3 * e3 + i3 * i3;
    }(this);
    var e2, i2, s2, r2;
  }
  negate(t2 = this) {
    var e2, i2;
    return i2 = t2, (e2 = this)[0] = -i2[0], e2[1] = -i2[1], this;
  }
  cross(t2, e2) {
    return e2 ? Pt(t2, e2) : Pt(this, t2);
  }
  scale(t2) {
    return Ct(this, this, t2), this;
  }
  normalize() {
    var t2, e2, i2, s2, r2;
    return t2 = this, i2 = (e2 = this)[0], s2 = e2[1], (r2 = i2 * i2 + s2 * s2) > 0 && (r2 = 1 / Math.sqrt(r2)), t2[0] = e2[0] * r2, t2[1] = e2[1] * r2, this;
  }
  dot(t2) {
    return i2 = t2, (e2 = this)[0] * i2[0] + e2[1] * i2[1];
    var e2, i2;
  }
  equals(t2) {
    return i2 = t2, (e2 = this)[0] === i2[0] && e2[1] === i2[1];
    var e2, i2;
  }
  applyMatrix3(t2) {
    var e2, i2, s2, r2, n2;
    return e2 = this, s2 = t2, r2 = (i2 = this)[0], n2 = i2[1], e2[0] = s2[0] * r2 + s2[3] * n2 + s2[6], e2[1] = s2[1] * r2 + s2[4] * n2 + s2[7], this;
  }
  applyMatrix4(t2) {
    return function(t3, e2, i2) {
      let s2 = e2[0], r2 = e2[1];
      t3[0] = i2[0] * s2 + i2[4] * r2 + i2[12], t3[1] = i2[1] * s2 + i2[5] * r2 + i2[13];
    }(this, this, t2), this;
  }
  lerp(t2, e2) {
    !function(t3, e3, i2, s2) {
      var r2 = e3[0], n2 = e3[1];
      t3[0] = r2 + s2 * (i2[0] - r2), t3[1] = n2 + s2 * (i2[1] - n2);
    }(this, this, t2, e2);
  }
  clone() {
    return new Ot(this[0], this[1]);
  }
  fromArray(t2, e2 = 0) {
    return this[0] = t2[e2], this[1] = t2[e2 + 1], this;
  }
  toArray(t2 = [], e2 = 0) {
    return t2[e2] = this[0], t2[e2 + 1] = this[1], t2;
  }
}
class Bt extends class {
  constructor(t2, e2 = {}) {
    t2.canvas || console.error("gl not passed as first argument to Geometry"), this.gl = t2, this.attributes = e2, this.id = q++, this.VAOs = {}, this.drawRange = { start: 0, count: 0 }, this.instancedCount = 0, this.gl.renderer.bindVertexArray(null), this.gl.renderer.currentGeometry = null, this.glState = this.gl.renderer.state;
    for (let t3 in e2)
      this.addAttribute(t3, e2[t3]);
  }
  addAttribute(t2, e2) {
    if (this.attributes[t2] = e2, e2.id = V++, e2.size = e2.size || 1, e2.type = e2.type || (e2.data.constructor === Float32Array ? this.gl.FLOAT : e2.data.constructor === Uint16Array ? this.gl.UNSIGNED_SHORT : this.gl.UNSIGNED_INT), e2.target = t2 === "index" ? this.gl.ELEMENT_ARRAY_BUFFER : this.gl.ARRAY_BUFFER, e2.normalized = e2.normalized || false, e2.stride = e2.stride || 0, e2.offset = e2.offset || 0, e2.count = e2.count || (e2.stride ? e2.data.byteLength / e2.stride : e2.data.length / e2.size), e2.divisor = e2.instanced || 0, e2.needsUpdate = false, e2.buffer || (e2.buffer = this.gl.createBuffer(), this.updateAttribute(e2)), e2.divisor) {
      if (this.isInstanced = true, this.instancedCount && this.instancedCount !== e2.count * e2.divisor)
        return console.warn("geometry has multiple instanced buffers of different length"), this.instancedCount = Math.min(this.instancedCount, e2.count * e2.divisor);
      this.instancedCount = e2.count * e2.divisor;
    } else
      t2 === "index" ? this.drawRange.count = e2.count : this.attributes.index || (this.drawRange.count = Math.max(this.drawRange.count, e2.count));
  }
  updateAttribute(t2) {
    this.glState.boundBuffer !== t2.buffer && (this.gl.bindBuffer(t2.target, t2.buffer), this.glState.boundBuffer = t2.buffer), this.gl.bufferData(t2.target, t2.data, this.gl.STATIC_DRAW), t2.needsUpdate = false;
  }
  setIndex(t2) {
    this.addAttribute("index", t2);
  }
  setDrawRange(t2, e2) {
    this.drawRange.start = t2, this.drawRange.count = e2;
  }
  setInstancedCount(t2) {
    this.instancedCount = t2;
  }
  createVAO(t2) {
    this.VAOs[t2.attributeOrder] = this.gl.renderer.createVertexArray(), this.gl.renderer.bindVertexArray(this.VAOs[t2.attributeOrder]), this.bindAttributes(t2);
  }
  bindAttributes(t2) {
    t2.attributeLocations.forEach((t3, { name: e2, type: i2 }) => {
      if (!this.attributes[e2])
        return void console.warn(`active attribute ${e2} not being supplied`);
      const s2 = this.attributes[e2];
      this.gl.bindBuffer(s2.target, s2.buffer), this.glState.boundBuffer = s2.buffer;
      let r2 = 1;
      i2 === 35674 && (r2 = 2), i2 === 35675 && (r2 = 3), i2 === 35676 && (r2 = 4);
      const n2 = s2.size / r2, a2 = r2 === 1 ? 0 : r2 * r2 * r2, h2 = r2 === 1 ? 0 : r2 * r2;
      for (let e3 = 0; e3 < r2; e3++)
        this.gl.vertexAttribPointer(t3 + e3, n2, s2.type, s2.normalized, s2.stride + a2, s2.offset + e3 * h2), this.gl.enableVertexAttribArray(t3 + e3), this.gl.renderer.vertexAttribDivisor(t3 + e3, s2.divisor);
    }), this.attributes.index && this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.attributes.index.buffer);
  }
  draw({ program: t2, mode: e2 = this.gl.TRIANGLES }) {
    this.gl.renderer.currentGeometry !== `${this.id}_${t2.attributeOrder}` && (this.VAOs[t2.attributeOrder] || this.createVAO(t2), this.gl.renderer.bindVertexArray(this.VAOs[t2.attributeOrder]), this.gl.renderer.currentGeometry = `${this.id}_${t2.attributeOrder}`), t2.attributeLocations.forEach((t3, { name: e3 }) => {
      const i2 = this.attributes[e3];
      i2.needsUpdate && this.updateAttribute(i2);
    }), this.isInstanced ? this.attributes.index ? this.gl.renderer.drawElementsInstanced(e2, this.drawRange.count, this.attributes.index.type, this.attributes.index.offset + 2 * this.drawRange.start, this.instancedCount) : this.gl.renderer.drawArraysInstanced(e2, this.drawRange.start, this.drawRange.count, this.instancedCount) : this.attributes.index ? this.gl.drawElements(e2, this.drawRange.count, this.attributes.index.type, this.attributes.index.offset + 2 * this.drawRange.start) : this.gl.drawArrays(e2, this.drawRange.start, this.drawRange.count);
  }
  getPosition() {
    const t2 = this.attributes.position;
    return t2.data ? t2 : W ? void 0 : (console.warn("No position buffer data found to compute bounds"), W = true);
  }
  computeBoundingBox(t2) {
    t2 || (t2 = this.getPosition());
    const e2 = t2.data, i2 = t2.offset || 0, s2 = t2.stride || t2.size;
    this.bounds || (this.bounds = { min: new Y(), max: new Y(), center: new Y(), scale: new Y(), radius: 1 / 0 });
    const r2 = this.bounds.min, n2 = this.bounds.max, a2 = this.bounds.center, h2 = this.bounds.scale;
    r2.set(1 / 0), n2.set(-1 / 0);
    for (let t3 = i2, a3 = e2.length; t3 < a3; t3 += s2) {
      const i3 = e2[t3], s3 = e2[t3 + 1], a4 = e2[t3 + 2];
      r2.x = Math.min(i3, r2.x), r2.y = Math.min(s3, r2.y), r2.z = Math.min(a4, r2.z), n2.x = Math.max(i3, n2.x), n2.y = Math.max(s3, n2.y), n2.z = Math.max(a4, n2.z);
    }
    h2.sub(n2, r2), a2.add(r2, n2).divide(2);
  }
  computeBoundingSphere(t2) {
    t2 || (t2 = this.getPosition());
    const e2 = t2.data, i2 = t2.offset || 0, s2 = t2.stride || t2.size;
    this.bounds || this.computeBoundingBox(t2);
    let r2 = 0;
    for (let t3 = i2, n2 = e2.length; t3 < n2; t3 += s2)
      k.fromArray(e2, t3), r2 = Math.max(r2, this.bounds.center.squaredDistance(k));
    this.bounds.radius = Math.sqrt(r2);
  }
  remove() {
    for (let t2 in this.VAOs)
      this.gl.renderer.deleteVertexArray(this.VAOs[t2]), delete this.VAOs[t2];
    for (let t2 in this.attributes)
      this.gl.deleteBuffer(this.attributes[t2].buffer), delete this.attributes[t2];
  }
} {
  constructor(t2, { radius: e2 = 0.5, widthSegments: i2 = 16, heightSegments: s2 = Math.ceil(0.5 * i2), phiStart: r2 = 0, phiLength: n2 = 2 * Math.PI, thetaStart: a2 = 0, thetaLength: h2 = Math.PI, attributes: o2 = {} } = {}) {
    const l2 = i2, u2 = s2, c2 = r2, d2 = n2, p2 = a2, g2 = h2, m2 = (l2 + 1) * (u2 + 1), f2 = l2 * u2 * 6, x2 = new Float32Array(3 * m2), M2 = new Float32Array(3 * m2), b2 = new Float32Array(2 * m2), w2 = m2 > 65536 ? new Uint32Array(f2) : new Uint16Array(f2);
    let E2 = 0, v2 = 0, A2 = 0, y2 = p2 + g2;
    const _2 = [];
    let F2 = new Y();
    for (let t3 = 0; t3 <= u2; t3++) {
      let i3 = [], s3 = t3 / u2;
      for (let t4 = 0; t4 <= l2; t4++, E2++) {
        let r3 = t4 / l2, n3 = -e2 * Math.cos(c2 + r3 * d2) * Math.sin(p2 + s3 * g2), a3 = e2 * Math.cos(p2 + s3 * g2), h3 = e2 * Math.sin(c2 + r3 * d2) * Math.sin(p2 + s3 * g2);
        x2[3 * E2] = n3, x2[3 * E2 + 1] = a3, x2[3 * E2 + 2] = h3, F2.set(n3, a3, h3).normalize(), M2[3 * E2] = F2.x, M2[3 * E2 + 1] = F2.y, M2[3 * E2 + 2] = F2.z, b2[2 * E2] = r3, b2[2 * E2 + 1] = 1 - s3, i3.push(v2++);
      }
      _2.push(i3);
    }
    for (let t3 = 0; t3 < u2; t3++)
      for (let e3 = 0; e3 < l2; e3++) {
        let i3 = _2[t3][e3 + 1], s3 = _2[t3][e3], r3 = _2[t3 + 1][e3], n3 = _2[t3 + 1][e3 + 1];
        (t3 !== 0 || p2 > 0) && (w2[3 * A2] = i3, w2[3 * A2 + 1] = s3, w2[3 * A2 + 2] = n3, A2++), (t3 !== u2 - 1 || y2 < Math.PI) && (w2[3 * A2] = s3, w2[3 * A2 + 1] = r3, w2[3 * A2 + 2] = n3, A2++);
      }
    Object.assign(o2, { position: { size: 3, data: x2 }, normal: { size: 3, data: M2 }, uv: { size: 2, data: b2 }, index: { data: w2 } }), super(t2, o2);
  }
}
const Ut = -1, $t = 0, Nt = 1, Dt = 2, Xt = 3, zt = new Y(), Gt = new Ot(), Yt = new Ot();
function kt(t2, { element: e2 = document, enabled: i2 = true, target: s2 = new Y(), ease: r2 = 0.25, inertia: n2 = 0.85, enableRotate: a2 = true, rotateSpeed: h2 = 0.1, autoRotate: o2 = false, autoRotateSpeed: l2 = 1, enableZoom: u2 = true, zoomSpeed: c2 = 1, enablePan: d2 = true, panSpeed: p2 = 0.1, minPolarAngle: g2 = 0, maxPolarAngle: m2 = Math.PI, minAzimuthAngle: f2 = -1 / 0, maxAzimuthAngle: x2 = 1 / 0, minDistance: M2 = 0, maxDistance: b2 = 1 / 0 } = {}) {
  this.enabled = i2, this.target = s2, r2 = r2 || 1, n2 = n2 || 0, this.minDistance = M2, this.maxDistance = b2;
  const w2 = { radius: 1, phi: 0, theta: 0 }, E2 = { radius: 1, phi: 0, theta: 0 }, v2 = { radius: 1, phi: 0, theta: 0 }, A2 = new Y(), y2 = new Y();
  y2.copy(t2.position).sub(this.target), v2.radius = E2.radius = y2.distance(), v2.theta = E2.theta = Math.atan2(y2.x, y2.z), v2.phi = E2.phi = Math.acos(Math.min(Math.max(y2.y / E2.radius, -1), 1)), this.offset = y2, this.update = () => {
    o2 && function() {
      const t3 = 2 * Math.PI / 60 / 60 * l2;
      w2.theta -= t3;
    }(), E2.radius *= w2.radius, E2.theta += w2.theta, E2.phi += w2.phi, E2.theta = Math.max(f2, Math.min(x2, E2.theta)), E2.phi = Math.max(g2, Math.min(m2, E2.phi)), E2.radius = Math.max(this.minDistance, Math.min(this.maxDistance, E2.radius)), v2.phi += (E2.phi - v2.phi) * r2, v2.theta += (E2.theta - v2.theta) * r2, v2.radius += (E2.radius - v2.radius) * r2, this.target.add(A2);
    let e3 = v2.radius * Math.sin(Math.max(1e-6, v2.phi));
    y2.x = e3 * Math.sin(v2.theta), y2.y = v2.radius * Math.cos(v2.phi), y2.z = e3 * Math.cos(v2.theta), t2.position.copy(this.target).add(y2), t2.lookAt(this.target), w2.theta *= n2, w2.phi *= n2, A2.multiply(n2), w2.radius = 1;
  }, this.forcePosition = () => {
    y2.copy(t2.position).sub(this.target), v2.radius = E2.radius = y2.distance(), v2.theta = E2.theta = Math.atan2(y2.x, y2.z), v2.phi = E2.phi = Math.acos(Math.min(Math.max(y2.y / E2.radius, -1), 1)), t2.lookAt(this.target);
  };
  const _2 = new Ot(), F2 = new Ot(), T2 = new Ot();
  let S2 = Ut;
  function L2() {
    return Math.pow(0.95, c2);
  }
  this.mouseButtons = { ORBIT: 0, ZOOM: 1, PAN: 2 };
  const R2 = (i3, s3) => {
    let r3 = e2 === document ? document.body : e2;
    zt.copy(t2.position).sub(this.target);
    let n3 = zt.distance();
    n3 *= Math.tan((t2.fov || 45) / 2 * Math.PI / 180), function(t3, e3) {
      zt.set(e3[0], e3[1], e3[2]), zt.multiply(-t3), A2.add(zt);
    }(2 * i3 * n3 / r3.clientHeight, t2.matrix), function(t3, e3) {
      zt.set(e3[4], e3[5], e3[6]), zt.multiply(t3), A2.add(zt);
    }(2 * s3 * n3 / r3.clientHeight, t2.matrix);
  };
  function C2(t3) {
    w2.radius /= t3;
  }
  function I2(t3, i3) {
    Gt.set(t3, i3), Yt.sub(Gt, _2).multiply(h2);
    let s3 = e2 === document ? document.body : e2;
    w2.theta -= 2 * Math.PI * Yt.x / s3.clientHeight, w2.phi -= 2 * Math.PI * Yt.y / s3.clientHeight, _2.copy(Gt);
  }
  function P2(t3, e3) {
    Gt.set(t3, e3), Yt.sub(Gt, F2).multiply(p2), R2(Yt.x, Yt.y), F2.copy(Gt);
  }
  const O2 = (t3) => {
    if (this.enabled) {
      switch (t3.button) {
        case this.mouseButtons.ORBIT:
          if (a2 === false)
            return;
          _2.set(t3.clientX, t3.clientY), S2 = $t;
          break;
        case this.mouseButtons.ZOOM:
          if (u2 === false)
            return;
          T2.set(t3.clientX, t3.clientY), S2 = Nt;
          break;
        case this.mouseButtons.PAN:
          if (d2 === false)
            return;
          F2.set(t3.clientX, t3.clientY), S2 = Dt;
      }
      S2 !== Ut && (window.addEventListener("mousemove", B2, false), window.addEventListener("mouseup", U2, false));
    }
  }, B2 = (t3) => {
    if (this.enabled)
      switch (S2) {
        case $t:
          if (a2 === false)
            return;
          I2(t3.clientX, t3.clientY);
          break;
        case Nt:
          if (u2 === false)
            return;
          !function(t4) {
            Gt.set(t4.clientX, t4.clientY), Yt.sub(Gt, T2), Yt.y > 0 ? C2(L2()) : Yt.y < 0 && C2(1 / L2()), T2.copy(Gt);
          }(t3);
          break;
        case Dt:
          if (d2 === false)
            return;
          P2(t3.clientX, t3.clientY);
      }
  }, U2 = () => {
    window.removeEventListener("mousemove", B2, false), window.removeEventListener("mouseup", U2, false), S2 = Ut;
  }, $2 = (t3) => {
    this.enabled && u2 && (S2 === Ut || S2 === $t) && (t3.stopPropagation(), t3.preventDefault(), t3.deltaY < 0 ? C2(1 / L2()) : t3.deltaY > 0 && C2(L2()));
  }, N2 = (t3) => {
    if (this.enabled)
      switch (t3.preventDefault(), t3.touches.length) {
        case 1:
          if (a2 === false)
            return;
          _2.set(t3.touches[0].pageX, t3.touches[0].pageY), S2 = $t;
          break;
        case 2:
          if (u2 === false && d2 === false)
            return;
          !function(t4) {
            if (u2) {
              let e3 = t4.touches[0].pageX - t4.touches[1].pageX, i3 = t4.touches[0].pageY - t4.touches[1].pageY, s3 = Math.sqrt(e3 * e3 + i3 * i3);
              T2.set(0, s3);
            }
            if (d2) {
              let e3 = 0.5 * (t4.touches[0].pageX + t4.touches[1].pageX), i3 = 0.5 * (t4.touches[0].pageY + t4.touches[1].pageY);
              F2.set(e3, i3);
            }
          }(t3), S2 = Xt;
          break;
        default:
          S2 = Ut;
      }
  }, D2 = (t3) => {
    if (this.enabled)
      switch (t3.preventDefault(), t3.stopPropagation(), t3.touches.length) {
        case 1:
          if (a2 === false)
            return;
          I2(t3.touches[0].pageX, t3.touches[0].pageY);
          break;
        case 2:
          if (u2 === false && d2 === false)
            return;
          !function(t4) {
            if (u2) {
              let e3 = t4.touches[0].pageX - t4.touches[1].pageX, i3 = t4.touches[0].pageY - t4.touches[1].pageY, s3 = Math.sqrt(e3 * e3 + i3 * i3);
              Gt.set(0, s3), Yt.set(0, Math.pow(Gt.y / T2.y, c2)), C2(Yt.y), T2.copy(Gt);
            }
            d2 && P2(0.5 * (t4.touches[0].pageX + t4.touches[1].pageX), 0.5 * (t4.touches[0].pageY + t4.touches[1].pageY));
          }(t3);
          break;
        default:
          S2 = Ut;
      }
  }, X2 = () => {
    this.enabled && (S2 = Ut);
  }, z2 = (t3) => {
    this.enabled && t3.preventDefault();
  };
  this.remove = function() {
    e2.removeEventListener("contextmenu", z2), e2.removeEventListener("mousedown", O2), e2.removeEventListener("wheel", $2), e2.removeEventListener("touchstart", N2), e2.removeEventListener("touchend", X2), e2.removeEventListener("touchmove", D2), window.removeEventListener("mousemove", B2), window.removeEventListener("mouseup", U2);
  }, e2.addEventListener("contextmenu", z2, false), e2.addEventListener("mousedown", O2, false), e2.addEventListener("wheel", $2, { passive: false }), e2.addEventListener("touchstart", N2, { passive: false }), e2.addEventListener("touchend", X2, false), e2.addEventListener("touchmove", D2, { passive: false });
}
class qt extends St {
  constructor(t2, { buffer: e2, wrapS: i2 = t2.CLAMP_TO_EDGE, wrapT: s2 = t2.CLAMP_TO_EDGE, anisotropy: r2 = 0, minFilter: n2, magFilter: a2 } = {}) {
    if (super(t2, { generateMipmaps: false, wrapS: i2, wrapT: s2, anisotropy: r2, minFilter: n2, magFilter: a2 }), e2)
      return this.parseBuffer(e2);
  }
  parseBuffer(t2) {
    const e2 = new Vt(t2);
    e2.mipmaps.isCompressedTexture = true, this.image = e2.mipmaps, this.internalFormat = e2.glInternalFormat, e2.numberOfMipmapLevels > 1 ? this.minFilter === this.gl.LINEAR && (this.minFilter = this.gl.NEAREST_MIPMAP_LINEAR) : this.minFilter === this.gl.NEAREST_MIPMAP_LINEAR && (this.minFilter = this.gl.LINEAR);
  }
}
function Vt(t2) {
  const e2 = [171, 75, 84, 88, 32, 49, 49, 187, 13, 10, 26, 10], i2 = new Uint8Array(t2, 0, 12);
  for (let t3 = 0; t3 < i2.length; t3++)
    if (i2[t3] !== e2[t3])
      return console.error("File missing KTX identifier");
  const s2 = Uint32Array.BYTES_PER_ELEMENT, r2 = new DataView(t2, 12, 13 * s2), n2 = r2.getUint32(0, true) === 67305985;
  if (r2.getUint32(1 * s2, n2) !== 0)
    return console.warn("only compressed formats currently supported");
  this.glInternalFormat = r2.getUint32(4 * s2, n2);
  let a2 = r2.getUint32(6 * s2, n2), h2 = r2.getUint32(7 * s2, n2);
  this.numberOfFaces = r2.getUint32(10 * s2, n2), this.numberOfMipmapLevels = Math.max(1, r2.getUint32(11 * s2, n2));
  const o2 = r2.getUint32(12 * s2, n2);
  this.mipmaps = [];
  let l2 = 64 + o2;
  for (let e3 = 0; e3 < this.numberOfMipmapLevels; e3++) {
    const e4 = new Int32Array(t2, l2, 1)[0];
    l2 += 4;
    for (let i3 = 0; i3 < this.numberOfFaces; i3++) {
      const i4 = new Uint8Array(t2, l2, e4);
      this.mipmaps.push({ data: i4, width: a2, height: h2 }), l2 += e4, l2 += 3 - (e4 + 3) % 4;
    }
    a2 >>= 1, h2 >>= 1;
  }
}
let Wt = {};
const jt = [];
class Ht {
  static load(t2, { src: e2, wrapS: i2 = t2.CLAMP_TO_EDGE, wrapT: s2 = t2.CLAMP_TO_EDGE, anisotropy: r2 = 0, format: n2 = t2.RGBA, internalFormat: a2 = n2, generateMipmaps: h2 = true, minFilter: o2 = h2 ? t2.NEAREST_MIPMAP_LINEAR : t2.LINEAR, magFilter: l2 = t2.LINEAR, premultiplyAlpha: u2 = false, unpackAlignment: c2 = 4, flipY: d2 = true } = {}) {
    const p2 = this.getSupportedExtensions(t2);
    let g2 = "none";
    if (typeof e2 == "string" && (g2 = e2.split(".").pop().split("?")[0].toLowerCase()), typeof e2 == "object") {
      for (const t3 in e2)
        if (p2.includes(t3.toLowerCase())) {
          g2 = t3.toLowerCase(), e2 = e2[t3];
          break;
        }
    }
    const m2 = e2 + i2 + s2 + r2 + n2 + a2 + h2 + o2 + l2 + u2 + c2 + d2 + t2.renderer.id;
    if (Wt[m2])
      return Wt[m2];
    let f2;
    switch (g2) {
      case "ktx":
      case "pvrtc":
      case "s3tc":
      case "etc":
      case "etc1":
      case "astc":
        f2 = new qt(t2, { src: e2, wrapS: i2, wrapT: s2, anisotropy: r2, minFilter: o2, magFilter: l2 }), f2.loaded = this.loadKTX(e2, f2);
        break;
      case "webp":
      case "jpg":
      case "jpeg":
      case "png":
        f2 = new St(t2, { wrapS: i2, wrapT: s2, anisotropy: r2, format: n2, internalFormat: a2, generateMipmaps: h2, minFilter: o2, magFilter: l2, premultiplyAlpha: u2, unpackAlignment: c2, flipY: d2 }), f2.loaded = this.loadImage(t2, e2, f2);
        break;
      default:
        console.warn("No supported format supplied"), f2 = new St(t2);
    }
    return f2.ext = g2, Wt[m2] = f2, f2;
  }
  static getSupportedExtensions(t2) {
    if (jt.length)
      return jt;
    const e2 = { pvrtc: t2.renderer.getExtension("WEBGL_compressed_texture_pvrtc") || t2.renderer.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc"), s3tc: t2.renderer.getExtension("WEBGL_compressed_texture_s3tc") || t2.renderer.getExtension("MOZ_WEBGL_compressed_texture_s3tc") || t2.renderer.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc"), etc: t2.renderer.getExtension("WEBGL_compressed_texture_etc"), etc1: t2.renderer.getExtension("WEBGL_compressed_texture_etc1"), astc: t2.renderer.getExtension("WEBGL_compressed_texture_astc") };
    for (const t3 in e2)
      e2[t3] && jt.push(t3);
    return Zt && jt.push("webp"), jt.push("png", "jpg"), jt;
  }
  static loadKTX(t2, e2) {
    return fetch(t2).then((t3) => t3.arrayBuffer()).then((t3) => e2.parseBuffer(t3));
  }
  static loadImage(t2, e2, i2) {
    return function(t3) {
      return new Promise((e3) => {
        const i3 = new Image();
        i3.crossOrigin = "", i3.src = t3;
        const s2 = navigator.userAgent.toLowerCase().includes("chrome");
        window.createImageBitmap && s2 ? i3.onload = () => {
          createImageBitmap(i3, { imageOrientation: "flipY", premultiplyAlpha: "none" }).then((t4) => {
            e3(t4);
          });
        } : i3.onload = () => e3(i3);
      });
    }(e2).then((e3) => (Kt(e3.width) && Kt(e3.height) || (i2.generateMipmaps && (i2.generateMipmaps = false), i2.minFilter === t2.NEAREST_MIPMAP_LINEAR && (i2.minFilter = t2.LINEAR), i2.wrapS === t2.REPEAT && (i2.wrapS = i2.wrapT = t2.CLAMP_TO_EDGE)), i2.image = e3, i2.onUpdate = () => {
      e3.close && e3.close(), i2.onUpdate = null;
    }, e3));
  }
  static clearCache() {
    Wt = {};
  }
}
function Zt() {
  return document.createElement("canvas").toDataURL("image/webp").indexOf("data:image/webp") == 0;
}
function Kt(t2) {
  return Math.log2(t2) % 1 == 0;
}
function Qt(e2) {
  let i2, s2, r2;
  return { c() {
    i2 = l("div"), s2 = l("canvas"), this.c = t, c(i2, "aria-label", e2[1]), c(i2, "class", e2[0]), y(() => e2[13].call(i2));
  }, m(t2, n2) {
    h(t2, i2, n2), a(i2, s2), e2[12](s2), r2 = function(t3, e3) {
      getComputedStyle(t3).position === "static" && (t3.style.position = "relative");
      const i3 = l("iframe");
      i3.setAttribute("style", "display: block; position: absolute; top: 0; left: 0; width: 100%; height: 100%; overflow: hidden; border: 0; opacity: 0; pointer-events: none; z-index: -1;"), i3.setAttribute("aria-hidden", "true"), i3.tabIndex = -1;
      const s3 = g();
      let r3;
      return s3 ? (i3.src = "data:text/html,<script>onresize=function(){parent.postMessage(0,'*')}<\/script>", r3 = u(window, "message", (t4) => {
        t4.source === i3.contentWindow && e3();
      })) : (i3.src = "about:blank", i3.onload = () => {
        r3 = u(i3.contentWindow, "resize", e3);
      }), a(t3, i3), () => {
        (s3 || r3 && i3.contentWindow) && r3(), o(i3);
      };
    }(i2, e2[13].bind(i2)), e2[14](i2);
  }, p(t2, [e3]) {
    2 & e3 && c(i2, "aria-label", t2[1]), 1 & e3 && c(i2, "class", t2[0]);
  }, i: t, o: t, d(t2) {
    t2 && o(i2), e2[12](null), r2(), e2[14](null);
  } };
}
function Jt(t2, e2, i2) {
  let s2, r2, n2, a2, h2, o2, l2, u2, c2, d2, p2, { class: g2 = "" } = e2, { alt: m2 = "Panoramic View" } = e2, { fov: f2 = 30 } = e2, { src: M2 } = e2;
  function w2() {
    n2.update(), c2.render({ scene: a2, camera: r2 }), d2 = requestAnimationFrame(w2);
  }
  return x(() => (i2(8, c2 = new st({ canvas: u2, width: l2.clientWidth, height: l2.clientHeight })), i2(9, p2 = c2.gl), p2.clearColor(1, 1, 1, 1), d2 = requestAnimationFrame(w2), () => cancelAnimationFrame(d2))), t2.$$set = (t3) => {
    "class" in t3 && i2(0, g2 = t3.class), "alt" in t3 && i2(1, m2 = t3.alt), "fov" in t3 && i2(6, f2 = t3.fov), "src" in t3 && i2(7, M2 = t3.src);
  }, t2.$$.update = () => {
    12 & t2.$$.dirty && i2(10, s2 = o2 / h2), 528 & t2.$$.dirty && i2(11, r2 = p2 && l2 && function() {
      const t3 = new wt(p2, { fov: f2, aspect: l2.clientWidth / l2.clientHeight });
      return t3.position.set(0, 0, 1), t3;
    }()), 2080 & t2.$$.dirty && (n2 = r2 && u2 && new kt(r2, { enablePan: false, enableZoom: true, element: u2, maxDistance: 1, minDistance: 0 })), 640 & t2.$$.dirty && (a2 = M2 && p2 && new yt(p2, { geometry: new Bt(p2, { radius: 2, widthSegments: 64 }), program: new Z(p2, { cullFace: p2.FRONT, uniforms: { tMap: { value: Ht.load(p2, { src: M2 }) } }, vertex: "#define GLSLIFY 1\nattribute vec2 uv;attribute vec3 position;attribute vec3 normal;uniform mat4 modelViewMatrix;uniform mat4 projectionMatrix;varying vec2 vUv;void main(){vUv=vec2(1.0-uv.s,uv.t);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}", fragment: "#ifdef GL_FRAGMENT_PRECISION_HIGH\nprecision highp float;precision highp int;\n#else\nprecision mediump float;precision mediump int;\n#define GLSLIFY 1\n#endif\nuniform sampler2D tMap;varying vec2 vUv;void main(){vec3 tex=texture2D(tMap,vUv).rgb;gl_FragColor.rgb=tex;gl_FragColor.a=1.0;}" }) })), 1292 & t2.$$.dirty && c2 && s2 && c2.setSize(o2, h2), 3072 & t2.$$.dirty && r2 && s2 && r2.perspective({ aspect: s2 });
  }, [g2, m2, h2, o2, l2, u2, f2, M2, c2, p2, s2, r2, function(t3) {
    b[t3 ? "unshift" : "push"](() => {
      u2 = t3, i2(5, u2);
    });
  }, function() {
    h2 = this.clientHeight, o2 = this.clientWidth, i2(2, h2), i2(3, o2);
  }, function(t3) {
    b[t3 ? "unshift" : "push"](() => {
      l2 = t3, i2(4, l2);
    });
  }];
}
class te extends I {
  constructor(t2) {
    super(), this.shadowRoot.innerHTML = "<style>div{width:100%;height:100%}</style>", C(this, { target: this.shadowRoot, props: m(this.attributes), customElement: true }, Jt, Qt, n, { class: 0, alt: 1, fov: 6, src: 7 }), t2 && (t2.target && h(t2.target, this, t2.anchor), t2.props && (this.$set(t2.props), T()));
  }
  static get observedAttributes() {
    return ["class", "alt", "fov", "src"];
  }
  get class() {
    return this.$$.ctx[0];
  }
  set class(t2) {
    this.$set({ class: t2 }), T();
  }
  get alt() {
    return this.$$.ctx[1];
  }
  set alt(t2) {
    this.$set({ alt: t2 }), T();
  }
  get fov() {
    return this.$$.ctx[6];
  }
  set fov(t2) {
    this.$set({ fov: t2 }), T();
  }
  get src() {
    return this.$$.ctx[7];
  }
  set src(t2) {
    this.$set({ src: t2 }), T();
  }
}
customElements.define("svelte-panorama", te);
function create_fragment(ctx) {
  let div;
  return {
    c() {
      div = element("div");
      div.innerHTML = `<svelte-panorama src="https://api.staging.rvhosted.com/wp-content/uploads/2021/03/students-in-boots-library-1920x1018.jpg" alt="Pretty Sky"></svelte-panorama>`;
      this.c = noop;
      attr(div, "class", "wrapper");
    },
    m(target, anchor) {
      insert(target, div, anchor);
    },
    p: noop,
    i: noop,
    o: noop,
    d(detaching) {
      if (detaching)
        detach(div);
    }
  };
}
function instance($$self) {
  onMount(() => {
  });
  return [];
}
class Counter extends SvelteElement {
  constructor(options) {
    super();
    this.shadowRoot.innerHTML = `<style>.wrapper{height:300px}</style>`;
    init(this, {
      target: this.shadowRoot,
      props: attribute_to_object(this.attributes),
      customElement: true
    }, instance, create_fragment, safe_not_equal, {}, null);
    if (options) {
      if (options.target) {
        insert(options.target, this, options.anchor);
      }
    }
  }
}
customElements.define("my-counter", Counter);
