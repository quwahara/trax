(function (definition) {
  if (typeof exports === "object") {
    // CommonJS
    module.exports = definition();
  } else if (typeof define === "function" && define.amd) {
    // RequireJS
    define(definition);
  } else {
    // script
    Olbi = definition();
  }
})(function () {
  'use strict';
  return (function () {

    function getFunctionName(func) {

      if (!isFunction(func)) {
        return "";
      }

      if (isString(func.name)) {
        return func.name;
      }

      var r = (/(function\s+)([^(]+)/g).exec(func.toString());
      if (r && r.length >= 3) {
        return r[2];
      }

      return "";
    }

    function goUpParent(element, predicate) {
      if (element == null) {
        return null;
      }
      if (predicate(element)) {
        return element;
      }
      return goUpParent(element.parentElement, predicate);
    }

    function goUpParentByTagName(element, tagName) {
      return goUpParent(element.parentElement, function (elem) {
        return elem.tagName === tagName.toUpperCase();
      });
    }

    function hasConstructor(target, constructor) {
      if (target == null) return false;
      var proto = Object.getPrototypeOf(target);
      return proto && proto.constructor === constructor;
    }

    function isArray(v) {
      return Array.isArray(v);
    }

    function isFunction(fun) {
      return fun && {}.toString.call(fun) === '[object Function]';
    }

    function isInt(v) {
      return v === parseInt(v, 10);
    }

    function isObject(v) {
      return v && !Array.isArray(v) && (typeof v) === "object";
    }

    function isPlbi(target) {
      return hasConstructor(target, Plbi);
    }

    function isPrimitive(v) {
      if (v == null) return false;
      var t = typeof v;
      return t === "string" || t === "number" || t === "boolean";
    }

    function isString(v) {
      return typeof v === "string";
    }

    function isUndefined(v) {
      return typeof v === "undefined";
    }

    function clone(value) {

      if (isObject(value)) {
        return cloneObject(value);
      }

      if (isArray(value)) {
        return cloneArray(value);
      }

      return value;
    }

    function argumentsToArray(args) {
      return (args.length === 1 ? [args[0]] : Array.apply(null, args));
    }

    function superConstructorOf(instance) {
      return Object.getPrototypeOf(Object.getPrototypeOf(instance)).constructor;
    }

    function callSuperConstructorOf(instance, varArguments) {
      var args = argumentsToArray(arguments);
      args.shift();
      return superConstructorOf(instance).apply(instance, args);
    }


    function cloneArray(array) {
      return array.map(clone);
    }

    function cloneObject(object) {
      var theClone = {};
      for (var key in object) {
        if (!Object.prototype.hasOwnProperty.call(object, key)) {
          continue;
        }
        theClone[key] = clone(object[key]);
      }
      return theClone;
    }

    // Object.defineProperty alias
    var dp = Object.defineProperty.bind(Object);

    // Define read only property
    function dpReadOnly(object, name, value, enumerable) {
      dp(object, name, {
        enumerable: !!enumerable,
        get: (function (value) {
          return function () {
            return value;
          };
        })(value),
      });
    }

    function objectAssign(target, varArgs) {
      if (target == null) {
        throw new TypeError('Cannot convert undefined or null to object');
      }

      var to = Object(target);

      for (var i = 1; i < arguments.length; ++i) {
        var nextSource = arguments[i];

        if (nextSource != null) { // Skip over if undefined or null
          for (var nextKey in nextSource) {
            // Avoid bugs when hasOwnProperty is shadowed
            if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
              to[nextKey] = nextSource[nextKey];
            }
          }
        }
      }
      return to;
    }

    /**
     * 
     * @param {Object} target 
     * @param {Array} sources 
     * @see https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Object/assign#Polyfill
     * @see https://github.com/saikojosh/Object-Assign-Deep
     */
    function objectAssignDeep(target, sources) {
      if (target == null) {
        throw new TypeError('Cannot convert undefined or null to object');
      }

      var target2 = Object(target);

      for (var i = 1; i < arguments.length; ++i) {
        var source = arguments[i];

        if (source == null) {
          continue;
        }

        for (var key in source) {
          // Avoid bugs when hasOwnProperty is shadowed
          if (!Object.prototype.hasOwnProperty.call(source, key)) {
            continue;
          }

          var sVal = source[key];
          var tVal = target2[key];
          var sValClone;

          if (isObject(sVal)) {
            sValClone = cloneObject(sVal);
            if (isObject(tVal)) {
              target2[key] = objectAssignDeep(tVal, sValClone);
            } else {
              target2[key] = sValClone;
            }
            continue;
          }

          if (isArray(sVal)) {
            sValClone = cloneArray(sVal);
            if (isArray(tVal)) {
              target2[key] = tVal.concat(sValClone);
            } else {
              target2[key] = sValClone;
            }
            continue;
          }

          target2[key] = sVal;
        }

      }
      return target2;
    }

    function orPassthrough(func) {
      return isUndefined(func) ? passthrough : func;
    }

    function passthrough(v) {
      return v;
    }

    function removeChildAll(parent) {
      while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
      }
      return parent;
    }

    function stackTraceString(error) {
      var stack = error.stack;
      if (isString(stack)) {
        stack = stack.split("\n");
      } else {
        stack = "(No stack trace)";
      }
      return stack;
    }

    function valueReplace(template, re) {
      return function (value) {
        return template.replace(re, value);
      };
    }

    function toArray(elementList) {
      return Array.prototype.slice.call(elementList);
    }

    // 
    // Element collection
    // 
    var Ecol = function Ecol(arg) {

      dpReadOnly(this, "___r", {
        queried: false,
      }, false);

      dp(this, "queried", {
        enumerable: true,
        get: function () {
          return this.___r.queried;
        }
      });

      this.elems = [];
      this.clear();

      if (isString(arg)) {
        this.query(arg);
      }

    };

    Ecol.prototype = {

      addClass: function (className) {
        this.each(function (element) {
          element.classList.add(className);
        });
        return this;
      },

      clear: function () {
        this.___r.queried = false;
        this.lastSelector = "";
        this.elems.length = 0;
        return this;
      },

      clone: function () {
        var clone = new Ecol();
        if (!this.queried) {
          return clone;
        }
        clone.elems.length = 0;
        for (var i = 0; i < this.elems.length; ++i) {
          clone.elems.push(this.elems[i]);
        }
        clone.___r.queried = true;
        return clone;
      },

      each: function (callback, args) {
        args = args || [];
        for (var i = 0; i < this.elems.length; ++i) {
          if (false === callback.apply(null, ([this.elems[i], i]).concat(args))) {
            break;
          }
        }
        return this;
      },

      on: function (eventName, listener, opts) {
        this.each(function (element) {
          element.addEventListener(eventName, listener, opts);
        });
        return this;
      },

      query: function (selector) {

        this.lastSelector = selector;

        var sourceElems;
        if (this.___r.queried) {
          sourceElems = this.elems.splice(0);
        } else {
          sourceElems = [document];
        }

        for (var i = 0; i < sourceElems.length; ++i) {
          var selected = sourceElems[i].querySelectorAll(selector);
          for (var j = 0; j < selected.length; ++j) {
            this.elems.push(selected.item(j));
          }
        }

        this.___r.queried = true;

        return this;
      },

      removeClass: function (className) {

        this.each(function (element) {
          element.classList.remove(className);
        });

        return this;
      },

      set: function (element) {
        this.clear();
        this.elems.push(element);
        this.___r.queried = true;
        return this;
      },

      setAll: function (elements) {
        this.clear();
        Array.prototype.splice.apply(this.elems, [0, 0].concat(elements));
        this.___r.queried = true;
        return this;
      },

      toggleClassByFlag: function (className, flag) {
        if (flag) {
          this.addClass(className);
        } else {
          this.removeClass(className);
        }
        return this;
      },

    };


    var preferreds = {
      get CLASS() {
        return "CLASS";
      },
      get ID() {
        return "ID";
      },
      get NAME() {
        return "NAME";
      },
      get NTH_CHILD() {
        return "NTH_CHILD";
      },
      get DESCENDANT_CLASS() {
        return "DESCENDANT_CLASS";
      },
      get DESCENDANT_ID() {
        return "DESCENDANT_ID";
      },
      get DESCENDANT_NAME() {
        return "DESCENDANT_NAME";
      },
      get CHILD_UNIVERSAL_NTH_CHILD() {
        return "CHILD_UNIVERSAL_NTH_CHILD";
      },
    };


    //
    // Link bind
    //
    var Lbi = function Lbi(struct, name, index, parent) {

      // privates
      dpReadOnly(this, "___r", {
        self: this,
        chain: this,
        ecol: new Ecol(),
        struct: struct,
        name: name || "",
        index: isInt(index) ? index : null,
        parent: parent || null,
        data: null,
        simplexPreferred: preferreds.CLASS,
        duplexPreferred: preferreds.NAME,
        extentSelector: "",
        appending: "",
        receivers: [],
        predicates: [],
        traceLink: null,
        setDataRev: 0,
        getDataRev: 0,
      },
        /* enumerable */
        false);

      dpReadOnly(this, "___", this, false);

      dp(this, "collected", {
        enumerable: false,
        get: function () {
          return this.___r.ecol.queried;
        }
      });

      dp(this, "elemCollection", {
        enumerable: false,
        get: function () {
          return this.___r.ecol.elems;
        }
      });

    };

    Lbi.prototype = {

      getFullName: function () {
        var privates = this.___r;
        var fn = "";
        if (privates.parent) {
          fn = privates.parent.getFullName();
        }
        var me;

        var type = getFunctionName(Object.getPrototypeOf(this).constructor).substring(0, 1);
        if (isInt(privates.index)) {
          me = privates.index;
        } else if (privates.name && isString(privates.name)) {
          me = privates.name;
        } else {
          me = "(anon)";
        }
        fn += "/" + type + ":" + me;
        return fn;
      },

      setSimplexPreferred: function (preferred) {
        this.___r.simplexPreferred = preferred;
        return this;
      },

      getSimplexPreferred: function () {
        return this.___r.simplexPreferred;
      },

      setDuplexPreferred: function (preferred) {
        this.___r.duplexPreferred = preferred;
        return this;
      },

      getDuplexPreferred: function () {
        return this.___r.duplexPreferred;
      },

      addReceiver: function (receiver) {
        this.___r.receivers.push(receiver);
        return this;
      },

      /**
       * Extends selector string
       * 
       * Selector string is generated from property name automatically.
       * The argument, extentSeletor string appends to genereted
       * selector string.
       * For example, the generated selector string will be ".prop_name",
       * if the paroperty name is "prop_name".
       * The selector string will be ".prop_name.extent",
       * if the extentSeletor argument is ".extent";
       * The selector string will be ".prop_name .extent",
       * if the extentSeletor argument is " .extent";
       * You can put a space if you want to select lower tag.
       * 
       * @param {string} extentSelector It is a selector string that you want to extend 
       *                                for generated selector.
       */
      extent: function (extentSelector) {
        this.___r.extentSelector = extentSelector;
        return this;
      },

      preferredSelector: function (preferred) {

        var privates = this.___r;
        var p = (preferred || "").toString().toUpperCase();
        var ps = preferreds;
        var sel = "";

        var name = privates.name;

        if (p === ps.CLASS) {
          if (name) {
            sel = "." + name;
          }

        } else if (p === ps.ID) {
          if (name) {
            sel = "#" + name;
          }

        } else if (p === ps.NAME) {
          if (name) {
            sel = "[name='" + name + "']";
          }

        } else if (p === ps.NTH_CHILD) {
          if (isInt(privates.index) && privates.index >= 0) {
            sel = "nth-child(" + (privates.index + 1) + ")";
          }

        } else if (p === ps.DESCENDANT_CLASS) {
          if (name) {
            sel = " ." + name;
          }

        } else if (p === ps.DESCENDANT_ID) {
          if (name) {
            sel = " #" + name;
          }

        } else if (p === ps.DESCENDANT_NAME) {
          if (name) {
            sel = " [name='" + name + "']";
          }

        } else if (p === ps.CHILD_UNIVERSAL_NTH_CHILD) {
          if (isInt(privates.index) && privates.index >= 0) {
            sel = ">*:nth-child(" + (privates.index + 1) + ")";
          }

        } else {
          throw Error("Unsupported preferred");
        }

        return sel + privates.appending + privates.extentSelector;
      },

      append: function (appending) {
        this.___r.appending = appending;
        return this;
      },

      simplexSelector: function () {
        return this.preferredSelector(this.getSimplexPreferred());
      },

      duplexSelector: function () {
        return this.preferredSelector(this.getDuplexPreferred());
      },

      fullPreferredSelector: function (preferred) {

        var privates = this.___r;

        // collect all parents
        var parents = [];
        var parent = privates.parent;
        while (parent) {
          parents.splice(0, 0, parent);
          parent = parent.___r.parent;
        }

        var selector = "";

        for (var i = 0; i < parents.length; ++i) {

          parent = parents[i];

          selector += parent.simplexSelector();
        }

        selector += this.preferredSelector(preferred);

        return selector;
      },

      linkSelector: function (selector) {
        var privates = this.___r;
        privates.ecol.query(selector);

        if (Olbi.conf.traceLink) {
          privates.traceLink = [privates.ecol.clone().elems, privates.ecol.lastSelector, this.getFullName(), stackTraceString(Error())];
        }

        return this;
      },

      link: function (preferred) {
        var selector = this.fullPreferredSelector(preferred);
        return this.linkSelector(selector);
      },

      linkSimplex: function () {
        return this.link(this.getSimplexPreferred());
      },

      linkDuplex: function () {
        return this.link(this.getDuplexPreferred());
      },

      clearLinking: function () {
        var privates = this.___r;
        privates.ecol.clear();
        privates.appending = "";
        return this;
      },

      bindDataSetter: function (eventName, dataSetterCallback) {

        var privates = this.___r;

        var ecol = privates.ecol.clone();

        ecol.on(eventName, (function (self, dataSetterCallback) {
          return function (event) {
            dataSetterCallback.call(self, event);
          };
        })(this, dataSetterCallback));

        return this;
      },

      produceElementReceiver: function (elementDataCallback) {

        var ecol = this.___r.ecol.clone();

        var receiver = (function (self, ecol, elementDataCallback) {
          return function (data, src) {
            ecol.each(function (element) {
              if (src !== element) {
                elementDataCallback.call(self, element, data);
              }
            });
          };
        })(this, ecol, elementDataCallback);

        return receiver;
      },

      callWithThis: function (fun) {
        fun(this);
        return this.___r.chain;
      },

      on: function (eventName, listener, opts) {

        var privates = this.___r;

        if (!this.collected) {
          this.linkDuplex();
        }

        eventName = eventName || "change";

        privates.ecol.on(eventName, (function (self, listener) {
          return function (event) {
            listener.call(self, event);
          };
        })(this, listener), opts);

        if (privates.parent) {
          privates.parent.___r.traceLink = privates.traceLink;
        }

        this.clearLinking();

        return privates.chain;
      },

      to: function (elementDataCallback) {

        var privates = this.___r;

        if (!this.collected) {
          this.linkSimplex();
        }

        var receiver = this.produceElementReceiver(elementDataCallback);

        this.addReceiver(receiver);

        if (privates.parent) {
          privates.parent.___r.traceLink = privates.traceLink;
        }

        this.clearLinking();

        return privates.chain;
      },

      with: function (elementDataCallback, dataSetterCallback, eventName) {

        var privates = this.___r;

        if (!this.collected) {
          this.linkDuplex();
        }

        var receiver = this.produceElementReceiver(elementDataCallback);

        this.addReceiver(receiver);

        eventName = eventName || "change";

        this.bindDataSetter(eventName, dataSetterCallback);

        if (privates.parent) {
          privates.parent.___r.traceLink = privates.traceLink;
        }

        this.clearLinking();

        return privates.chain;
      },

      addPredicate: function (predicate) {
        this.___r.predicates.push(predicate);
        return this;
      },

      then: function (elementDataCallback) {
        var privates = this.___r;

        var predicates = privates.predicates;
        if (predicates.length === 0) {
          throw Error("The then method requires one predicate or more before but no predicates");
        }

        if (!this.collected) {
          this.linkSimplex();
        }

        var ecol = this.___r.ecol.clone();

        var receiver = (function (self, ecol, predicates, elementDataCallback) {
          return function (data, src) {

            var boolean = true;
            for (var i = 0; i < predicates.length; ++i) {
              boolean = boolean && predicates[i](data);
              if (!boolean) {
                break;
              }
            }

            ecol.each(function (element) {
              if (src !== element) {
                elementDataCallback.call(self, element, boolean);
              }
            });

          };
        })(this, ecol, predicates.splice(0), elementDataCallback);

        this.addReceiver(receiver);

        if (privates.parent) {
          privates.parent.___r.traceLink = privates.traceLink;
        }

        this.clearLinking();

        return privates.chain;
      },

      thenUntitoggle: function (clasName) {

        return this.then((function (clasName) {
          return function (element, data) {
            new Ecol().set(element).toggleClassByFlag(clasName, !data);
          };
        })(clasName));

      },

      /**
       * Set struct to data.
       * The struct is a parameter of constructor.
       */
      setStructAsData: function () {
        return this.setData(this.___r.struct);
      },

      traceLink: function () {
        if (!Olbi.conf.traceLink) {
          console.log("@traceLink", "Call 'Olbi.configure({ traceLink: true });' to activate traceLink()");
        } else {
          if (this.___r.traceLink === null) {
            console.log("@traceLink", "Trace was empty");
          } else {
            console.log("@traceLink", this.___r.traceLink);
          }
        }
        return this;
      },

    };

    Lbi.prototype.constructor = Lbi;



    //
    // Object link bind
    //
    var Olbi = function Olbi(struct, name, index, parent) {

      callSuperConstructorOf(this, struct, name, index, parent);

      if (!isObject(struct)) {
        throw Error("The struct must be an Object");
      }

      var privates = this.___r;

      var keys = [];

      var rawKeys = Object.keys(struct);
      var rawKey;
      for (var i = 0; i < rawKeys.length; ++i) {
        rawKey = rawKeys[i];

        // ignore "___", because of reserved word
        if (rawKey === "___") {
          continue;
        }

        if (!Object.prototype.hasOwnProperty.call(struct, rawKey)) {
          continue;
        }

        keys.push(rawKey);
      }

      objectAssign(
        privates, {
          data: {},
          keys: keys,
          firstCallOfEach: true,
        }
      );

      dp(this, "data", {
        enumerable: false,
        set: function (data) {
          this.setData(data);
        },
        get: function () {
          return this.getData();
        }
      });

      dp(this, "end", {
        enumerable: false,
        get: function () {
          var privates = this.___r;
          privates.extentSelector = "";
          return privates.parent;
        }
      });

      var n = privates.name;
      if (n) {
        dp(this, "end" + n.slice(0, 1).toUpperCase() + n.slice(1), {
          enumerable: false,
          get: function () {
            return this.end;
          }
        });
      }

      var xlbi;
      for (var propName in struct) {

        // ignore "___", because of reserved word
        if (propName === "___") {
          continue;
        }

        if (!Object.prototype.hasOwnProperty.call(struct, propName)) {
          continue;
        }

        var subStruct = struct[propName];

        if (isObject(subStruct)) {
          xlbi = new Olbi(subStruct, propName, /* index */ null, this);

        } else if (isArray(subStruct)) {
          xlbi = new Albi(subStruct, propName, /* index */ null, this);

        } else {
          xlbi = new Plbi(subStruct, propName, /* index */ null, this);

        }

        dpReadOnly(this, propName, xlbi, /* enumerable */ true);

        (function (data, propName, xlbi) {
          dp(data, propName, {
            enumerable: true,
            set: function (data) {
              xlbi.setData(data);
            },
            get: function () {
              return xlbi.getData();
            }
          });
        })(privates.data, propName, xlbi);

      }

    };

    Olbi.prototype = objectAssign(
      Object.create(Lbi.prototype), {
        set: function (data, src) {

          if (!isObject(data)) {
            throw Error("The data must be an Object");
          }

          var privates = this.___r;

          src = src || this;

          var struct = privates.struct;
          var self = privates.self;

          for (var propName in data) {

            // ignore "___", because of reserved word
            if (propName === "___") {
              continue;
            }

            if (!Object.prototype.hasOwnProperty.call(data, propName)) {
              continue;
            }

            if (!Object.prototype.hasOwnProperty.call(struct, propName)) {
              continue;
            }

            self[propName].setData(data[propName]);
          }

          privates.setDataRev += 1;

          var privateData = this.getData();

          for (var i = 0; i < privates.receivers.length; ++i) {
            privates.receivers[i](privateData, src);
          }

          return this;
        },

        setData: function (data, src) {

          if (!isObject(data)) {
            throw Error("The data must be an Object");
          }

          var privates = this.___r;

          src = src || this;

          var struct = privates.struct;
          var self = privates.self;

          for (var propName in data) {

            // ignore "___", because of reserved word
            if (propName === "___") {
              continue;
            }

            if (!Object.prototype.hasOwnProperty.call(data, propName)) {
              continue;
            }

            if (!Object.prototype.hasOwnProperty.call(struct, propName)) {
              continue;
            }

            self[propName].setData(data[propName]);
          }

          privates.setDataRev += 1;

          var privateData = this.getData();

          for (var i = 0; i < privates.receivers.length; ++i) {
            privates.receivers[i](privateData, src);
          }

          return this;
        },

        getData: function () {

          var privates = this.___r;
          if (privates.getDataRev === privates.setDataRev) {
            return privates.data;
          }

          var struct = privates.struct;

          for (var propName in struct) {

            // ignore "___", because of reserved word
            if (propName === "___") {
              continue;
            }

            if (!Object.prototype.hasOwnProperty.call(struct, propName)) {
              continue;
            }

            privates.data[propName] = this[propName].getData();
          }

          privates.getDataRev = privates.setDataRev;

          return privates.data;
        },

        each: function (callback) {

          var privates = this.___r;

          if (!this.collected) {
            this.linkSimplex();
          }

          var templateSets = [];

          // prepare template element
          privates.ecol.each(function (elem) {

            var firstElementChild = null;
            if (elem.firstElementChild) {
              firstElementChild = elem.firstElementChild.cloneNode(true);
            }

            removeChildAll(elem);
            var templateSet = {
              target: elem,
              template: firstElementChild,
            };
            templateSets.push(templateSet);

          });

          var i, j, keys, key, xlbi;

          keys = privates.keys;

          if (privates.firstCallOfEach) {

            for (i = 0; i < keys.length; ++i) {
              key = keys[i];
              xlbi = this[key];
              xlbi.___r.index = i;
              xlbi
                .setSimplexPreferred(preferreds.CHILD_UNIVERSAL_NTH_CHILD)
                .setDuplexPreferred(preferreds.CHILD_UNIVERSAL_NTH_CHILD);
            }

            privates.firstCallOfEach = false;
          }

          if (templateSets.length === 0) {

            for (i = 0; i < keys.length; ++i) {
              key = keys[i];
              callback.call(this[key], i, key, /* element */ null);
            }

          } else {

            var templateSet;

            for (i = 0; i < keys.length; ++i) {

              key = keys[i];
              xlbi = this[key];

              for (j = 0; j < templateSets.length; ++j) {

                templateSet = templateSets[j];

                var childElem = null;
                if (templateSet.template) {
                  childElem = templateSet.template.cloneNode(true);
                  templateSet.target.appendChild(childElem);
                }

                callback.call(xlbi, i, key, childElem);

              }
            }
          }

          this.clearLinking();

          return privates.chain;
        },

        /**
         * Write-to-binding that is all properties to attributes.
         */
        toAttrs: function () {

          var privates = this.___r;

          if (!this.collected) {
            this.linkSimplex();
          }

          for (var name in this) {
            if (!this.hasOwnProperty(name)) continue;
            var prop = this[name];
            if (isPlbi(prop)) {
              prop.___r.ecol.setAll(privates.ecol.elems);
              prop.toAttr(name);
            } else {
              throw Error("toAttrs() does not support property of Object.");
            }
          }

          if (privates.parent) {
            privates.parent.___r.traceLink = privates.traceLink;
          }

          this.clearLinking();

          return this.___r.parent;
        },

        toHref: function (arg) {
          var callback;
          if (isUndefined(arg)) {
            callback = passthrough;

          } else if (isString(arg)) {
            var template = arg;
            callback = (function (template) {
              return function (data) {
                var href = template;
                for (var name in data) {
                  var v = data[name];
                  if (v == null) {
                    v = "";
                  }
                  if (!isPrimitive(v)) {
                    continue;
                  }
                  href = href.replace(new RegExp(":" + name + "\\b", "g"), v);
                }
                return href;
              };
            })(template);

          } else if (isFunction(arg)) {
            callback = arg;

          } else {
            throw Error("Unsupported type of argument");
          }

          return this.to((function (dataCallback) {
            return function (element, data) {
              element.href = dataCallback(data);
            };
          })(callback));
        },

      });

    Olbi.prototype.constructor = Olbi;

    dpReadOnly(Olbi, "preferreds", preferreds, /* enumerable */ true);



    //
    // Primitive link bind
    //
    var Plbi = function Plbi(struct, name, index, parent) {

      callSuperConstructorOf(this, struct, name, index, parent);

      if (struct != null && !isPrimitive(struct)) {
        throw Error("The struct must be a primitive value or null");
      }

      var privates = this.___r;
      objectAssign(
        privates, {
          chain: parent,
          simplexPreferred: preferreds.DESCENDANT_CLASS,
          duplexPreferred: preferreds.DESCENDANT_NAME,
          simplex: new PlbiSimplex(this),
        }
      );

    };

    Plbi.prototype = objectAssign(
      Object.create(Lbi.prototype), {
        setData: function (data, src) {

          if (data != null && !isPrimitive(data)) {
            throw Error("The data must be a primitive value or null");
          }

          var privates = this.___r;
          privates.data = data;
          src = src || this;

          for (var i = 0; i < privates.receivers.length; ++i) {
            privates.receivers[i](data, src);
          }

          return this;
        },

        getData: function () {
          return this.___r.data;
        },

        addClassFromName: function () {

          var privates = this.___r;

          if (!this.collected) {
            this.linkSimplex();
          }

          privates.ecol.each(function (element) {
            element.classList.add(privates.name);
          });

          if (privates.parent) {
            privates.parent.___r.traceLink = privates.traceLink;
          }

          this.clearLinking();

          return privates.chain;
        },

        setAttr: function (attrName, value) {

          var privates = this.___r;

          if (!this.collected) {
            this.linkSimplex();
          }

          privates.ecol.each(function (element) {
            element.setAttribute(attrName, value);
          });

          if (privates.parent) {
            privates.parent.___r.traceLink = privates.traceLink;
          }

          this.clearLinking();

          return privates.chain;
        },

        setAttrFromName: function (attrName) {
          return this.setAttr(attrName, this.___r.name);
        },

        setText: function (value) {

          var privates = this.___r;

          if (!this.collected) {
            this.linkSimplex();
          }

          privates.ecol.each(function (element) {
            element.textContent = value;
          });

          if (privates.parent) {
            privates.parent.___r.traceLink = privates.traceLink;
          }

          this.clearLinking();

          return privates.chain;
        },

        setTextFromName: function () {
          return this.setText(this.___r.name);
        },

        antitogglesClass: function (className) {
          return this.to((function (className) {
            return function (element, data) {
              if (!data) {
                element.classList.add(className);
              } else {
                element.classList.remove(className);
              }
            };
          })(className));
        },

        toAttr: function (attrName, dataCallback) {
          return this.to((function (attrName, dataCallback) {
            return function (element, data) {
              element.setAttribute(attrName, dataCallback(data));
            };
          })(attrName, orPassthrough(dataCallback)));
        },

        toHref: function (arg) {

          var callback;

          if (isUndefined(arg)) {
            callback = passthrough;

          } else if (isString(arg)) {
            var template = arg;
            callback = valueReplace(template, new RegExp(":" + this.___r.name + "\\b", "g"));

          } else if (isFunction(arg)) {
            callback = arg;

          } else {
            throw Error("Unsupported type of argument");

          }

          return this.to((function (self, callback) {
            return function (element, data) {
              element.href = callback.call(self, data);
            };
          })(this, callback));

        },

        toText: function () {
          return this.to(function (element, data) {
            element.textContent = data;
          });
        },

        withValue: function (eventName) {
          return this.with(
            function (element, data) {
              element.value = data;
            },
            function (event) {
              var element = event.target;
              this.setData(element.value, element);
            },
            eventName
          );
        },

        eq: function (condition) {
          return this.addPredicate((function (condition) {
            return function (data) {
              return data === condition;
            };
          })(condition));
        },

        isFalsy: function () {
          return this.addPredicate(function (data) {
            return !data;
          });
        },

        isTruthy: function () {
          return this.addPredicate(function (data) {
            return !!data;
          });
        },

      }
    );

    dp(Plbi.prototype, "to_", {
      enumerable: false,
      get: function () {
        if (!this.collected) {
          this.linkSimplex();
        }
        return this.___r.simplex;
      },
    });


    Plbi.prototype.constructor = Plbi;



    //
    // Array link bind
    //
    var Albi = function Albi(struct, name, index, parent) {

      callSuperConstructorOf(this, struct, name, index, parent);

      if (!isArray(struct)) {
        throw Error("The struct must be an Array");
      }

      if (struct.length !== 1) {
        throw Error("The struct array must have only one item");
      }

      var privates = this.___r;
      objectAssign(privates, {
        itemStruct: struct[0],
        eachSets: [],
        eachReceivers: [],
        xlbis: [],
        data: [],
      });

    };

    Albi.prototype = objectAssign(
      Object.create(Lbi.prototype), {

        addEachReceiver: function (eachReceiver) {
          this.___r.eachReceivers.push(eachReceiver);
          return this;
        },

        each: function (callback) {

          /*
          The element that is linked on each method, must be the parent that is for automatically generated element.
          each で link される Element は、each メソッドによって自動で生成される element の親であることを前提にしている。
          For example, if there is a HTML as below,
          例えば、次のようなHTMLがあったとする。
          ```
          <tbody>
            <tr>
            </tr>
          </tbody>
          ```
          and you want to generate `<tr>` tag by each item in an array.
          この `<tr>` タグを、配列の要素ごとに自動で生成したいとする。
          Then linked tag by each method must be `<tbody>`
          そのとき、linkされる each メソッドで link されるタグは、`<tbody>` でなければならない。
       
          eachSets[]
            eachSet
              eachReceiver
              templateSets[]
                templateSet
                  target
                  template
       
          */

          var privates = this.___r;

          var eachSet = {
            templateSets: [],
            callback: callback,
          };

          if (!this.collected) {
            this.linkSimplex();
          }

          // prepare template element
          privates.ecol.each(function (elem) {

            var firstElementChild = null;
            if (elem.firstElementChild) {
              firstElementChild = elem.firstElementChild.cloneNode(true);
            }

            removeChildAll(elem);
            var templateSet = {
              target: elem,
              template: firstElementChild,
            };
            eachSet.templateSets.push(templateSet);

          });


          privates.eachSets.push(eachSet);

          var eachReceiver;

          // In case of no element to generate
          if (eachSet.templateSets.length === 0) {

            eachReceiver = (function (eachSet) {

              return function (index, xlbi) {
                eachSet.callback.call(xlbi, index, /* element */ null);
              };

            })(eachSet);

          } else {

            // In case of having elements to generate
            eachReceiver = (function (eachSet) {

              return function (index, xlbi) {

                var templateSetIndex, templateSet;

                // create element
                for (templateSetIndex = 0; templateSetIndex < eachSet.templateSets.length; ++templateSetIndex) {
                  templateSet = eachSet.templateSets[templateSetIndex];

                  var childElem = null;
                  if (templateSet.template) {
                    childElem = templateSet.template.cloneNode(true);
                    templateSet.target.appendChild(childElem);
                  }

                  eachSet.callback.call(xlbi, index, childElem);
                }
              };

            })(eachSet);
          }

          this.addEachReceiver(eachReceiver);

          this.clearLinking();

          return this;
        },

        setData: function (data, src) {

          if (!isArray(data)) {
            throw Error("The data must be an Array");
          }

          var privates = this.___r;
          if (privates.data === data) {
            return this;
          }

          src = src || this;

          // copy data into privates.data
          privates.xlbis.length = 0;
          privates.setDataRev += 1;

          var xlbiConsturctor;
          var itemStruct = privates.itemStruct;
          if (isObject(itemStruct)) {
            xlbiConsturctor = Olbi;
          } else if (isArray(itemStruct)) {
            xlbiConsturctor = Albi;
          } else {
            xlbiConsturctor = Plbi;
          }

          for (var dataIndex = 0; dataIndex < data.length; ++dataIndex) {
            var xlbi1 = new xlbiConsturctor(itemStruct, /* name */ null, dataIndex, this);
            xlbi1
              .setSimplexPreferred(preferreds.CHILD_UNIVERSAL_NTH_CHILD)
              .setDuplexPreferred(preferreds.CHILD_UNIVERSAL_NTH_CHILD);
            privates.xlbis.push(xlbi1);
          }

          // clear element
          var eachSetIndex, eachSet, templateSetIndex, templateSet;
          for (eachSetIndex = 0; eachSetIndex < privates.eachSets.length; ++eachSetIndex) {

            eachSet = privates.eachSets[eachSetIndex];

            for (templateSetIndex = 0; templateSetIndex < eachSet.templateSets.length; ++templateSetIndex) {
              templateSet = eachSet.templateSets[templateSetIndex];
              removeChildAll(templateSet.target);
            }
          }

          // call eachReceiver by each item
          for (var index = 0; index < privates.xlbis.length; ++index) {

            var xlbi2 = privates.xlbis[index];
            for (var iEachReceiver = 0; iEachReceiver < privates.eachReceivers.length; ++iEachReceiver) {
              privates.eachReceivers[iEachReceiver](index, xlbi2);
            }
          }

          // call setData by each item
          for (var index2 = 0; index2 < privates.xlbis.length; ++index2) {

            var xlbi3 = privates.xlbis[index2];
            xlbi3.setData(data[index2], src);
          }

          return this;
        },

        getData: function () {

          var privates = this.___r;
          if (privates.getDataRev === privates.setDataRev) {
            return privates.data;
          }

          privates.data.length = 0;
          for (var index = 0; index < privates.xlbis.length; ++index) {

            var xlbi = privates.xlbis[index];
            privates.data.push(xlbi.getData());
          }

          privates.getDataRev = privates.setDataRev;

          return privates.data;
        },

      }
    );

    Albi.prototype.constructor = Albi;


    var PlbiSimplex = function PlbiSimplex(plbi) {

      // privates
      dpReadOnly(this, "___r", {
        plbi: plbi,
        r: plbi.___r,
      },
        /* enumerable */
        false);

    };

    PlbiSimplex.prototype = {

      prepareReceiver: function (elementDataCallback) {

        var r = this.___r;
        var plbi = r.plbi;

        var receiver = (function (self, ecol, elementDataCallback) {
          return function (data, src) {
            ecol.each(function (element) {
              if (src !== element) {
                elementDataCallback.call(self, element, data);
              }
            });
          };
        })(plbi, r.r.ecol.clone(), elementDataCallback);

        plbi.addReceiver(receiver);

        if (r.r.parent) {
          r.r.parent.___r.traceLink = r.r.traceLink;
        }

        plbi.clearLinking();

        return receiver;
      },

      antitogglesClass: function (className) {
        var r = this.___r;
        this.prepareReceiver(function (element, data) {
          if (!data) {
            element.classList.add(className);
          } else {
            element.classList.remove(className);
          }
        });
        return r.r.chain;
      },

      attr: function (attrName, dataCallback) {
        var r = this.___r;
        this.prepareReceiver((function (attrName, dataCallback) {
          return function (element, data) {
            element.setAttribute(attrName, dataCallback(data));
          };
        })(attrName, orPassthrough(dataCallback)));
        return r.r.chain;
      },

      href: function (arg) {

        var callback;

        if (isUndefined(arg)) {
          callback = passthrough;

        } else if (isString(arg)) {
          var template = arg;
          callback = valueReplace(template, new RegExp(":" + this.___r.name + "\\b", "g"));

        } else if (isFunction(arg)) {
          callback = arg;

        } else {
          throw Error("Unsupported type of argument");

        }

        var r = this.___r;
        this.prepareReceiver((function (attrName, callback) {
          return function (element, data) {
            element.href = callback.call(self, data);
          };
        })(attrName, orPassthrough(callback)));
        return r.r.chain;
      },

      text: function () {
        var r = this.___r;
        this.prepareReceiver(function (element, data) {
          element.textContent = data;
        });
        return r.r.chain;
      },

      traceLink: function () {

        this.___r.plbi.traceLink();

        return this;
      },

    };

    PlbiSimplex.prototype.constructor = PlbiSimplex;



    //
    // Utilities
    //

    Olbi.goUpParent = goUpParent;
    Olbi.goUpParentByTagName = goUpParentByTagName;
    Olbi.objectAssign = objectAssign;
    Olbi.objectAssignDeep = objectAssignDeep;
    Olbi.query = function (selector) {
      return (new Ecol()).query(selector);
    };


    //
    // Global configuration
    //

    var defaultConf = {
      traceLink: false,
    };

    Olbi.configure = (function () {

      var holder = {
        conf: objectAssign({}, defaultConf)
      };

      dp(Olbi, "conf", {
        enumerable: true,
        get: function () {
          return holder.conf;
        }
      });

      return function (conf) {

        if (!conf) {
          return holder.conf;
        }

        var prevConf = holder.conf;
        holder.conf = objectAssign({}, holder.conf, conf);

        return prevConf;
      };
    })();

    return Olbi;
  })();

});