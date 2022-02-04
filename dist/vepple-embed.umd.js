(function(u){typeof define=="function"&&define.amd?define(u):u()})(function(){"use strict";function u(){}function p(t){return t()}function x(){return Object.create(null)}function d(t){t.forEach(p)}function w(t){return typeof t=="function"}function z(t,e){return t!=t?e==e:t!==e||t&&typeof t=="object"||typeof t=="function"}function A(t){return Object.keys(t).length===0}function E(t,e){t.appendChild(e)}function v(t,e,n){t.insertBefore(e,n||null)}function C(t){t.parentNode.removeChild(t)}function B(t){return document.createElement(t)}function j(t){return document.createTextNode(t)}function P(t,e,n,o){return t.addEventListener(e,n,o),()=>t.removeEventListener(e,n,o)}function V(t){return Array.from(t.childNodes)}function q(t,e){e=""+e,t.wholeText!==e&&(t.data=e)}function D(t){const e={};for(const n of t)e[n.name]=n.value;return e}let g;function h(t){g=t}const m=[],L=[],_=[],T=[],F=Promise.resolve();let $=!1;function G(){$||($=!0,F.then(M))}function y(t){_.push(t)}const k=new Set;let b=0;function M(){const t=g;do{for(;b<m.length;){const e=m[b];b++,h(e),I(e.$$)}for(h(null),m.length=0,b=0;L.length;)L.pop()();for(let e=0;e<_.length;e+=1){const n=_[e];k.has(n)||(k.add(n),n())}_.length=0}while(m.length);for(;T.length;)T.pop()();$=!1,k.clear(),h(t)}function I(t){if(t.fragment!==null){t.update(),d(t.before_update);const e=t.dirty;t.dirty=[-1],t.fragment&&t.fragment.p(t.ctx,e),t.after_update.forEach(y)}}const J=new Set;function K(t,e){t&&t.i&&(J.delete(t),t.i(e))}function Q(t,e,n,o){const{fragment:i,on_mount:a,on_destroy:c,after_update:l}=t.$$;i&&i.m(e,n),o||y(()=>{const f=a.map(p).filter(w);c?c.push(...f):d(f),t.$$.on_mount=[]}),l.forEach(y)}function U(t,e){const n=t.$$;n.fragment!==null&&(d(n.on_destroy),n.fragment&&n.fragment.d(e),n.on_destroy=n.fragment=null,n.ctx=[])}function W(t,e){t.$$.dirty[0]===-1&&(m.push(t),G(),t.$$.dirty.fill(0)),t.$$.dirty[e/31|0]|=1<<e%31}function X(t,e,n,o,i,a,c,l=[-1]){const f=g;h(t);const r=t.$$={fragment:null,ctx:null,props:a,update:u,not_equal:i,bound:x(),on_mount:[],on_destroy:[],on_disconnect:[],before_update:[],after_update:[],context:new Map(e.context||(f?f.$$.context:[])),callbacks:x(),dirty:l,skip_bound:!1,root:e.target||f.$$.root};c&&c(r.root);let H=!1;if(r.ctx=n?n(t,e.props||{},(s,N,...O)=>{const R=O.length?O[0]:N;return r.ctx&&i(r.ctx[s],r.ctx[s]=R)&&(!r.skip_bound&&r.bound[s]&&r.bound[s](R),H&&W(t,s)),N}):[],r.update(),H=!0,d(r.before_update),r.fragment=o?o(r.ctx):!1,e.target){if(e.hydrate){const s=V(e.target);r.fragment&&r.fragment.l(s),s.forEach(C)}else r.fragment&&r.fragment.c();e.intro&&K(t.$$.fragment),Q(t,e.target,e.anchor,e.customElement),M()}h(f)}let S;typeof HTMLElement=="function"&&(S=class extends HTMLElement{constructor(){super();this.attachShadow({mode:"open"})}connectedCallback(){const{on_mount:t}=this.$$;this.$$.on_disconnect=t.map(p).filter(w);for(const e in this.$$.slotted)this.appendChild(this.$$.slotted[e])}attributeChangedCallback(t,e,n){this[t]=n}disconnectedCallback(){d(this.$$.on_disconnect)}$destroy(){U(this,1),this.$destroy=u}$on(t,e){const n=this.$$.callbacks[t]||(this.$$.callbacks[t]=[]);return n.push(e),()=>{const o=n.indexOf(e);o!==-1&&n.splice(o,1)}}$set(t){this.$$set&&!A(t)&&(this.$$.skip_bound=!0,this.$$set(t),this.$$.skip_bound=!1)}});function Y(t){let e,n,o,i,a;return{c(){e=B("button"),n=j("Clicks: "),o=j(t[0]),this.c=u},m(c,l){v(c,e,l),E(e,n),E(e,o),i||(a=P(e,"click",t[1]),i=!0)},p(c,[l]){l&1&&q(o,c[0])},i:u,o:u,d(c){c&&C(e),i=!1,a()}}}function Z(t,e,n){let o=0;return[o,()=>{n(0,o+=1)}]}class tt extends S{constructor(e){super();this.shadowRoot.innerHTML="<style>button{font-family:inherit;font-size:inherit;padding:1em 2em;color:#ff3e00;background-color:rgba(255, 62, 0, 0.1);border-radius:2em;border:2px solid rgba(255, 62, 0, 0);outline:none;width:200px;font-variant-numeric:tabular-nums;cursor:pointer}button:focus{border:2px solid #ff3e00}button:active{background-color:rgba(255, 62, 0, 0.2)}</style>",X(this,{target:this.shadowRoot,props:D(this.attributes),customElement:!0},Z,Y,z,{},null),e&&e.target&&v(e.target,this,e.anchor)}}customElements.define("my-counter",tt)});
