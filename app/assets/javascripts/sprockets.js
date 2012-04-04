/*  Prototype JavaScript framework, version 1.6.1
 *  (c) 2005-2009 Sam Stephenson
 *
 *  Prototype is freely distributable under the terms of an MIT-style license.
 *  For details, see the Prototype web site: http://www.prototypejs.org/
 *
 *--------------------------------------------------------------------------*/

var Prototype = {
  Version: '1.6.1',

  Browser: (function(){
    var ua = navigator.userAgent;
    var isOpera = Object.prototype.toString.call(window.opera) == '[object Opera]';
    return {
      IE:             !!window.attachEvent && !isOpera,
      Opera:          isOpera,
      WebKit:         ua.indexOf('AppleWebKit/') > -1,
      Gecko:          ua.indexOf('Gecko') > -1 && ua.indexOf('KHTML') === -1,
      MobileSafari:   /Apple.*Mobile.*Safari/.test(ua)
    }
  })(),

  BrowserFeatures: {
    XPath: !!document.evaluate,
    SelectorsAPI: !!document.querySelector,
    ElementExtensions: (function() {
      var constructor = window.Element || window.HTMLElement;
      return !!(constructor && constructor.prototype);
    })(),
    SpecificElementExtensions: (function() {
      if (typeof window.HTMLDivElement !== 'undefined')
        return true;

      var div = document.createElement('div'),
          form = document.createElement('form'),
          isSupported = false;

      if (div['__proto__'] && (div['__proto__'] !== form['__proto__'])) {
        isSupported = true;
      }

      div = form = null;

      return isSupported;
    })()
  },

  ScriptFragment: '<script[^>]*>([\\S\\s]*?)<\/script>',
  JSONFilter: /^\/\*-secure-([\s\S]*)\*\/\s*$/,

  emptyFunction: function() { },
  K: function(x) { return x }
};

if (Prototype.Browser.MobileSafari)
  Prototype.BrowserFeatures.SpecificElementExtensions = false;


var Abstract = { };


var Try = {
  these: function() {
    var returnValue;

    for (var i = 0, length = arguments.length; i < length; i++) {
      var lambda = arguments[i];
      try {
        returnValue = lambda();
        break;
      } catch (e) { }
    }

    return returnValue;
  }
};

/* Based on Alex Arnell's inheritance implementation. */

var Class = (function() {

  var IS_DONTENUM_BUGGY = (function(){
    for (var p in { toString: 1 }) {
      if (p === 'toString') return false;
    }
    return true;
  })();

  function subclass() {};
  function create() {
    var parent = null, properties = $A(arguments);
    if (Object.isFunction(properties[0]))
      parent = properties.shift();

    function klass() {
      this.initialize.apply(this, arguments);
    }

    Object.extend(klass, Class.Methods);
    klass.superclass = parent;
    klass.subclasses = [];

    if (parent) {
      subclass.prototype = parent.prototype;
      klass.prototype = new subclass;
      parent.subclasses.push(klass);
    }

    for (var i = 0, length = properties.length; i < length; i++)
      klass.addMethods(properties[i]);

    if (!klass.prototype.initialize)
      klass.prototype.initialize = Prototype.emptyFunction;

    klass.prototype.constructor = klass;
    return klass;
  }

  function addMethods(source) {
    var ancestor   = this.superclass && this.superclass.prototype,
        properties = Object.keys(source);

    if (IS_DONTENUM_BUGGY) {
      if (source.toString != Object.prototype.toString)
        properties.push("toString");
      if (source.valueOf != Object.prototype.valueOf)
        properties.push("valueOf");
    }

    for (var i = 0, length = properties.length; i < length; i++) {
      var property = properties[i], value = source[property];
      if (ancestor && Object.isFunction(value) &&
          value.argumentNames()[0] == "$super") {
        var method = value;
        value = (function(m) {
          return function() { return ancestor[m].apply(this, arguments); };
        })(property).wrap(method);

        value.valueOf = method.valueOf.bind(method);
        value.toString = method.toString.bind(method);
      }
      this.prototype[property] = value;
    }

    return this;
  }

  return {
    create: create,
    Methods: {
      addMethods: addMethods
    }
  };
})();
(function() {

  var _toString = Object.prototype.toString;

  function extend(destination, source) {
    for (var property in source)
      destination[property] = source[property];
    return destination;
  }

  function inspect(object) {
    try {
      if (isUndefined(object)) return 'undefined';
      if (object === null) return 'null';
      return object.inspect ? object.inspect() : String(object);
    } catch (e) {
      if (e instanceof RangeError) return '...';
      throw e;
    }
  }

  function toJSON(object) {
    var type = typeof object;
    switch (type) {
      case 'undefined':
      case 'function':
      case 'unknown': return;
      case 'boolean': return object.toString();
    }

    if (object === null) return 'null';
    if (object.toJSON) return object.toJSON();
    if (isElement(object)) return;

    var results = [];
    for (var property in object) {
      var value = toJSON(object[property]);
      if (!isUndefined(value))
        results.push(property.toJSON() + ': ' + value);
    }

    return '{' + results.join(', ') + '}';
  }

  function toQueryString(object) {
    return $H(object).toQueryString();
  }

  function toHTML(object) {
    return object && object.toHTML ? object.toHTML() : String.interpret(object);
  }

  function keys(object) {
    var results = [];
    for (var property in object)
      results.push(property);
    return results;
  }

  function values(object) {
    var results = [];
    for (var property in object)
      results.push(object[property]);
    return results;
  }

  function clone(object) {
    return extend({ }, object);
  }

  function isElement(object) {
    return !!(object && object.nodeType == 1);
  }

  function isArray(object) {
    return _toString.call(object) == "[object Array]";
  }


  function isHash(object) {
    return object instanceof Hash;
  }

  function isFunction(object) {
    return typeof object === "function";
  }

  function isString(object) {
    return _toString.call(object) == "[object String]";
  }

  function isNumber(object) {
    return _toString.call(object) == "[object Number]";
  }

  function isUndefined(object) {
    return typeof object === "undefined";
  }

  extend(Object, {
    extend:        extend,
    inspect:       inspect,
    toJSON:        toJSON,
    toQueryString: toQueryString,
    toHTML:        toHTML,
    keys:          keys,
    values:        values,
    clone:         clone,
    isElement:     isElement,
    isArray:       isArray,
    isHash:        isHash,
    isFunction:    isFunction,
    isString:      isString,
    isNumber:      isNumber,
    isUndefined:   isUndefined
  });
})();
Object.extend(Function.prototype, (function() {
  var slice = Array.prototype.slice;

  function update(array, args) {
    var arrayLength = array.length, length = args.length;
    while (length--) array[arrayLength + length] = args[length];
    return array;
  }

  function merge(array, args) {
    array = slice.call(array, 0);
    return update(array, args);
  }

  function argumentNames() {
    var names = this.toString().match(/^[\s\(]*function[^(]*\(([^)]*)\)/)[1]
      .replace(/\/\/.*?[\r\n]|\/\*(?:.|[\r\n])*?\*\//g, '')
      .replace(/\s+/g, '').split(',');
    return names.length == 1 && !names[0] ? [] : names;
  }

  function bind(context) {
    if (arguments.length < 2 && Object.isUndefined(arguments[0])) return this;
    var __method = this, args = slice.call(arguments, 1);
    return function() {
      var a = merge(args, arguments);
      return __method.apply(context, a);
    }
  }

  function bindAsEventListener(context) {
    var __method = this, args = slice.call(arguments, 1);
    return function(event) {
      var a = update([event || window.event], args);
      return __method.apply(context, a);
    }
  }

  function curry() {
    if (!arguments.length) return this;
    var __method = this, args = slice.call(arguments, 0);
    return function() {
      var a = merge(args, arguments);
      return __method.apply(this, a);
    }
  }

  function delay(timeout) {
    var __method = this, args = slice.call(arguments, 1);
    timeout = timeout * 1000;
    return window.setTimeout(function() {
      return __method.apply(__method, args);
    }, timeout);
  }

  function defer() {
    var args = update([0.01], arguments);
    return this.delay.apply(this, args);
  }

  function wrap(wrapper) {
    var __method = this;
    return function() {
      var a = update([__method.bind(this)], arguments);
      return wrapper.apply(this, a);
    }
  }

  function methodize() {
    if (this._methodized) return this._methodized;
    var __method = this;
    return this._methodized = function() {
      var a = update([this], arguments);
      return __method.apply(null, a);
    };
  }

  return {
    argumentNames:       argumentNames,
    bind:                bind,
    bindAsEventListener: bindAsEventListener,
    curry:               curry,
    delay:               delay,
    defer:               defer,
    wrap:                wrap,
    methodize:           methodize
  }
})());


Date.prototype.toJSON = function() {
  return '"' + this.getUTCFullYear() + '-' +
    (this.getUTCMonth() + 1).toPaddedString(2) + '-' +
    this.getUTCDate().toPaddedString(2) + 'T' +
    this.getUTCHours().toPaddedString(2) + ':' +
    this.getUTCMinutes().toPaddedString(2) + ':' +
    this.getUTCSeconds().toPaddedString(2) + 'Z"';
};


RegExp.prototype.match = RegExp.prototype.test;

RegExp.escape = function(str) {
  return String(str).replace(/([.*+?^=!:${}()|[\]\/\\])/g, '\\$1');
};
var PeriodicalExecuter = Class.create({
  initialize: function(callback, frequency) {
    this.callback = callback;
    this.frequency = frequency;
    this.currentlyExecuting = false;

    this.registerCallback();
  },

  registerCallback: function() {
    this.timer = setInterval(this.onTimerEvent.bind(this), this.frequency * 1000);
  },

  execute: function() {
    this.callback(this);
  },

  stop: function() {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = null;
  },

  onTimerEvent: function() {
    if (!this.currentlyExecuting) {
      try {
        this.currentlyExecuting = true;
        this.execute();
        this.currentlyExecuting = false;
      } catch(e) {
        this.currentlyExecuting = false;
        throw e;
      }
    }
  }
});
Object.extend(String, {
  interpret: function(value) {
    return value == null ? '' : String(value);
  },
  specialChar: {
    '\b': '\\b',
    '\t': '\\t',
    '\n': '\\n',
    '\f': '\\f',
    '\r': '\\r',
    '\\': '\\\\'
  }
});

Object.extend(String.prototype, (function() {

  function prepareReplacement(replacement) {
    if (Object.isFunction(replacement)) return replacement;
    var template = new Template(replacement);
    return function(match) { return template.evaluate(match) };
  }

  function gsub(pattern, replacement) {
    var result = '', source = this, match;
    replacement = prepareReplacement(replacement);

    if (Object.isString(pattern))
      pattern = RegExp.escape(pattern);

    if (!(pattern.length || pattern.source)) {
      replacement = replacement('');
      return replacement + source.split('').join(replacement) + replacement;
    }

    while (source.length > 0) {
      if (match = source.match(pattern)) {
        result += source.slice(0, match.index);
        result += String.interpret(replacement(match));
        source  = source.slice(match.index + match[0].length);
      } else {
        result += source, source = '';
      }
    }
    return result;
  }

  function sub(pattern, replacement, count) {
    replacement = prepareReplacement(replacement);
    count = Object.isUndefined(count) ? 1 : count;

    return this.gsub(pattern, function(match) {
      if (--count < 0) return match[0];
      return replacement(match);
    });
  }

  function scan(pattern, iterator) {
    this.gsub(pattern, iterator);
    return String(this);
  }

  function truncate(length, truncation) {
    length = length || 30;
    truncation = Object.isUndefined(truncation) ? '...' : truncation;
    return this.length > length ?
      this.slice(0, length - truncation.length) + truncation : String(this);
  }

  function strip() {
    return this.replace(/^\s+/, '').replace(/\s+$/, '');
  }

  function stripTags() {
    return this.replace(/<\w+(\s+("[^"]*"|'[^']*'|[^>])+)?>|<\/\w+>/gi, '');
  }

  function stripScripts() {
    return this.replace(new RegExp(Prototype.ScriptFragment, 'img'), '');
  }

  function extractScripts() {
    var matchAll = new RegExp(Prototype.ScriptFragment, 'img'),
        matchOne = new RegExp(Prototype.ScriptFragment, 'im');
    return (this.match(matchAll) || []).map(function(scriptTag) {
      return (scriptTag.match(matchOne) || ['', ''])[1];
    });
  }

  function evalScripts() {
    return this.extractScripts().map(function(script) { return eval(script) });
  }

  function escapeHTML() {
    return this.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function unescapeHTML() {
    return this.stripTags().replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
  }


  function toQueryParams(separator) {
    var match = this.strip().match(/([^?#]*)(#.*)?$/);
    if (!match) return { };

    return match[1].split(separator || '&').inject({ }, function(hash, pair) {
      if ((pair = pair.split('='))[0]) {
        var key = decodeURIComponent(pair.shift()),
            value = pair.length > 1 ? pair.join('=') : pair[0];

        if (value != undefined) value = decodeURIComponent(value);

        if (key in hash) {
          if (!Object.isArray(hash[key])) hash[key] = [hash[key]];
          hash[key].push(value);
        }
        else hash[key] = value;
      }
      return hash;
    });
  }

  function toArray() {
    return this.split('');
  }

  function succ() {
    return this.slice(0, this.length - 1) +
      String.fromCharCode(this.charCodeAt(this.length - 1) + 1);
  }

  function times(count) {
    return count < 1 ? '' : new Array(count + 1).join(this);
  }

  function camelize() {
    return this.replace(/-+(.)?/g, function(match, chr) {
      return chr ? chr.toUpperCase() : '';
    });
  }

  function capitalize() {
    return this.charAt(0).toUpperCase() + this.substring(1).toLowerCase();
  }

  function underscore() {
    return this.replace(/::/g, '/')
               .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
               .replace(/([a-z\d])([A-Z])/g, '$1_$2')
               .replace(/-/g, '_')
               .toLowerCase();
  }

  function dasherize() {
    return this.replace(/_/g, '-');
  }

  function inspect(useDoubleQuotes) {
    var escapedString = this.replace(/[\x00-\x1f\\]/g, function(character) {
      if (character in String.specialChar) {
        return String.specialChar[character];
      }
      return '\\u00' + character.charCodeAt().toPaddedString(2, 16);
    });
    if (useDoubleQuotes) return '"' + escapedString.replace(/"/g, '\\"') + '"';
    return "'" + escapedString.replace(/'/g, '\\\'') + "'";
  }

  function toJSON() {
    return this.inspect(true);
  }

  function unfilterJSON(filter) {
    return this.replace(filter || Prototype.JSONFilter, '$1');
  }

  function isJSON() {
    var str = this;
    if (str.blank()) return false;
    str = this.replace(/\\./g, '@').replace(/"[^"\\\n\r]*"/g, '');
    return (/^[,:{}\[\]0-9.\-+Eaeflnr-u \n\r\t]*$/).test(str);
  }

  function evalJSON(sanitize) {
    var json = this.unfilterJSON();
    try {
      if (!sanitize || json.isJSON()) return eval('(' + json + ')');
    } catch (e) { }
    throw new SyntaxError('Badly formed JSON string: ' + this.inspect());
  }

  function include(pattern) {
    return this.indexOf(pattern) > -1;
  }

  function startsWith(pattern) {
    return this.lastIndexOf(pattern, 0) === 0;
  }

  function endsWith(pattern) {
    var d = this.length - pattern.length;
    return d >= 0 && this.indexOf(pattern, d) === d;
  }

  function empty() {
    return this == '';
  }

  function blank() {
    return /^\s*$/.test(this);
  }

  function interpolate(object, pattern) {
    return new Template(this, pattern).evaluate(object);
  }

  return {
    gsub:           gsub,
    sub:            sub,
    scan:           scan,
    truncate:       truncate,
    strip:          String.prototype.trim || strip,
    stripTags:      stripTags,
    stripScripts:   stripScripts,
    extractScripts: extractScripts,
    evalScripts:    evalScripts,
    escapeHTML:     escapeHTML,
    unescapeHTML:   unescapeHTML,
    toQueryParams:  toQueryParams,
    parseQuery:     toQueryParams,
    toArray:        toArray,
    succ:           succ,
    times:          times,
    camelize:       camelize,
    capitalize:     capitalize,
    underscore:     underscore,
    dasherize:      dasherize,
    inspect:        inspect,
    toJSON:         toJSON,
    unfilterJSON:   unfilterJSON,
    isJSON:         isJSON,
    evalJSON:       evalJSON,
    include:        include,
    startsWith:     startsWith,
    endsWith:       endsWith,
    empty:          empty,
    blank:          blank,
    interpolate:    interpolate
  };
})());

var Template = Class.create({
  initialize: function(template, pattern) {
    this.template = template.toString();
    this.pattern = pattern || Template.Pattern;
  },

  evaluate: function(object) {
    if (object && Object.isFunction(object.toTemplateReplacements))
      object = object.toTemplateReplacements();

    return this.template.gsub(this.pattern, function(match) {
      if (object == null) return (match[1] + '');

      var before = match[1] || '';
      if (before == '\\') return match[2];

      var ctx = object, expr = match[3],
          pattern = /^([^.[]+|\[((?:.*?[^\\])?)\])(\.|\[|$)/;

      match = pattern.exec(expr);
      if (match == null) return before;

      while (match != null) {
        var comp = match[1].startsWith('[') ? match[2].replace(/\\\\]/g, ']') : match[1];
        ctx = ctx[comp];
        if (null == ctx || '' == match[3]) break;
        expr = expr.substring('[' == match[3] ? match[1].length : match[0].length);
        match = pattern.exec(expr);
      }

      return before + String.interpret(ctx);
    });
  }
});
Template.Pattern = /(^|.|\r|\n)(#\{(.*?)\})/;

var $break = { };

var Enumerable = (function() {
  function each(iterator, context) {
    var index = 0;
    try {
      this._each(function(value) {
        iterator.call(context, value, index++);
      });
    } catch (e) {
      if (e != $break) throw e;
    }
    return this;
  }

  function eachSlice(number, iterator, context) {
    var index = -number, slices = [], array = this.toArray();
    if (number < 1) return array;
    while ((index += number) < array.length)
      slices.push(array.slice(index, index+number));
    return slices.collect(iterator, context);
  }

  function all(iterator, context) {
    iterator = iterator || Prototype.K;
    var result = true;
    this.each(function(value, index) {
      result = result && !!iterator.call(context, value, index);
      if (!result) throw $break;
    });
    return result;
  }

  function any(iterator, context) {
    iterator = iterator || Prototype.K;
    var result = false;
    this.each(function(value, index) {
      if (result = !!iterator.call(context, value, index))
        throw $break;
    });
    return result;
  }

  function collect(iterator, context) {
    iterator = iterator || Prototype.K;
    var results = [];
    this.each(function(value, index) {
      results.push(iterator.call(context, value, index));
    });
    return results;
  }

  function detect(iterator, context) {
    var result;
    this.each(function(value, index) {
      if (iterator.call(context, value, index)) {
        result = value;
        throw $break;
      }
    });
    return result;
  }

  function findAll(iterator, context) {
    var results = [];
    this.each(function(value, index) {
      if (iterator.call(context, value, index))
        results.push(value);
    });
    return results;
  }

  function grep(filter, iterator, context) {
    iterator = iterator || Prototype.K;
    var results = [];

    if (Object.isString(filter))
      filter = new RegExp(RegExp.escape(filter));

    this.each(function(value, index) {
      if (filter.match(value))
        results.push(iterator.call(context, value, index));
    });
    return results;
  }

  function include(object) {
    if (Object.isFunction(this.indexOf))
      if (this.indexOf(object) != -1) return true;

    var found = false;
    this.each(function(value) {
      if (value == object) {
        found = true;
        throw $break;
      }
    });
    return found;
  }

  function inGroupsOf(number, fillWith) {
    fillWith = Object.isUndefined(fillWith) ? null : fillWith;
    return this.eachSlice(number, function(slice) {
      while(slice.length < number) slice.push(fillWith);
      return slice;
    });
  }

  function inject(memo, iterator, context) {
    this.each(function(value, index) {
      memo = iterator.call(context, memo, value, index);
    });
    return memo;
  }

  function invoke(method) {
    var args = $A(arguments).slice(1);
    return this.map(function(value) {
      return value[method].apply(value, args);
    });
  }

  function max(iterator, context) {
    iterator = iterator || Prototype.K;
    var result;
    this.each(function(value, index) {
      value = iterator.call(context, value, index);
      if (result == null || value >= result)
        result = value;
    });
    return result;
  }

  function min(iterator, context) {
    iterator = iterator || Prototype.K;
    var result;
    this.each(function(value, index) {
      value = iterator.call(context, value, index);
      if (result == null || value < result)
        result = value;
    });
    return result;
  }

  function partition(iterator, context) {
    iterator = iterator || Prototype.K;
    var trues = [], falses = [];
    this.each(function(value, index) {
      (iterator.call(context, value, index) ?
        trues : falses).push(value);
    });
    return [trues, falses];
  }

  function pluck(property) {
    var results = [];
    this.each(function(value) {
      results.push(value[property]);
    });
    return results;
  }

  function reject(iterator, context) {
    var results = [];
    this.each(function(value, index) {
      if (!iterator.call(context, value, index))
        results.push(value);
    });
    return results;
  }

  function sortBy(iterator, context) {
    return this.map(function(value, index) {
      return {
        value: value,
        criteria: iterator.call(context, value, index)
      };
    }).sort(function(left, right) {
      var a = left.criteria, b = right.criteria;
      return a < b ? -1 : a > b ? 1 : 0;
    }).pluck('value');
  }

  function toArray() {
    return this.map();
  }

  function zip() {
    var iterator = Prototype.K, args = $A(arguments);
    if (Object.isFunction(args.last()))
      iterator = args.pop();

    var collections = [this].concat(args).map($A);
    return this.map(function(value, index) {
      return iterator(collections.pluck(index));
    });
  }

  function size() {
    return this.toArray().length;
  }

  function inspect() {
    return '#<Enumerable:' + this.toArray().inspect() + '>';
  }









  return {
    each:       each,
    eachSlice:  eachSlice,
    all:        all,
    every:      all,
    any:        any,
    some:       any,
    collect:    collect,
    map:        collect,
    detect:     detect,
    findAll:    findAll,
    select:     findAll,
    filter:     findAll,
    grep:       grep,
    include:    include,
    member:     include,
    inGroupsOf: inGroupsOf,
    inject:     inject,
    invoke:     invoke,
    max:        max,
    min:        min,
    partition:  partition,
    pluck:      pluck,
    reject:     reject,
    sortBy:     sortBy,
    toArray:    toArray,
    entries:    toArray,
    zip:        zip,
    size:       size,
    inspect:    inspect,
    find:       detect
  };
})();
function $A(iterable) {
  if (!iterable) return [];
  if ('toArray' in Object(iterable)) return iterable.toArray();
  var length = iterable.length || 0, results = new Array(length);
  while (length--) results[length] = iterable[length];
  return results;
}

function $w(string) {
  if (!Object.isString(string)) return [];
  string = string.strip();
  return string ? string.split(/\s+/) : [];
}

Array.from = $A;


(function() {
  var arrayProto = Array.prototype,
      slice = arrayProto.slice,
      _each = arrayProto.forEach; // use native browser JS 1.6 implementation if available

  function each(iterator) {
    for (var i = 0, length = this.length; i < length; i++)
      iterator(this[i]);
  }
  if (!_each) _each = each;

  function clear() {
    this.length = 0;
    return this;
  }

  function first() {
    return this[0];
  }

  function last() {
    return this[this.length - 1];
  }

  function compact() {
    return this.select(function(value) {
      return value != null;
    });
  }

  function flatten() {
    return this.inject([], function(array, value) {
      if (Object.isArray(value))
        return array.concat(value.flatten());
      array.push(value);
      return array;
    });
  }

  function without() {
    var values = slice.call(arguments, 0);
    return this.select(function(value) {
      return !values.include(value);
    });
  }

  function reverse(inline) {
    return (inline === false ? this.toArray() : this)._reverse();
  }

  function uniq(sorted) {
    return this.inject([], function(array, value, index) {
      if (0 == index || (sorted ? array.last() != value : !array.include(value)))
        array.push(value);
      return array;
    });
  }

  function intersect(array) {
    return this.uniq().findAll(function(item) {
      return array.detect(function(value) { return item === value });
    });
  }


  function clone() {
    return slice.call(this, 0);
  }

  function size() {
    return this.length;
  }

  function inspect() {
    return '[' + this.map(Object.inspect).join(', ') + ']';
  }

  function toJSON() {
    var results = [];
    this.each(function(object) {
      var value = Object.toJSON(object);
      if (!Object.isUndefined(value)) results.push(value);
    });
    return '[' + results.join(', ') + ']';
  }

  function indexOf(item, i) {
    i || (i = 0);
    var length = this.length;
    if (i < 0) i = length + i;
    for (; i < length; i++)
      if (this[i] === item) return i;
    return -1;
  }

  function lastIndexOf(item, i) {
    i = isNaN(i) ? this.length : (i < 0 ? this.length + i : i) + 1;
    var n = this.slice(0, i).reverse().indexOf(item);
    return (n < 0) ? n : i - n - 1;
  }

  function concat() {
    var array = slice.call(this, 0), item;
    for (var i = 0, length = arguments.length; i < length; i++) {
      item = arguments[i];
      if (Object.isArray(item) && !('callee' in item)) {
        for (var j = 0, arrayLength = item.length; j < arrayLength; j++)
          array.push(item[j]);
      } else {
        array.push(item);
      }
    }
    return array;
  }

  Object.extend(arrayProto, Enumerable);

  if (!arrayProto._reverse)
    arrayProto._reverse = arrayProto.reverse;

  Object.extend(arrayProto, {
    _each:     _each,
    clear:     clear,
    first:     first,
    last:      last,
    compact:   compact,
    flatten:   flatten,
    without:   without,
    reverse:   reverse,
    uniq:      uniq,
    intersect: intersect,
    clone:     clone,
    toArray:   clone,
    size:      size,
    inspect:   inspect,
    toJSON:    toJSON
  });

  var CONCAT_ARGUMENTS_BUGGY = (function() {
    return [].concat(arguments)[0][0] !== 1;
  })(1,2)

  if (CONCAT_ARGUMENTS_BUGGY) arrayProto.concat = concat;

  if (!arrayProto.indexOf) arrayProto.indexOf = indexOf;
  if (!arrayProto.lastIndexOf) arrayProto.lastIndexOf = lastIndexOf;
})();
function $H(object) {
  return new Hash(object);
};

var Hash = Class.create(Enumerable, (function() {
  function initialize(object) {
    this._object = Object.isHash(object) ? object.toObject() : Object.clone(object);
  }


  function _each(iterator) {
    for (var key in this._object) {
      var value = this._object[key], pair = [key, value];
      pair.key = key;
      pair.value = value;
      iterator(pair);
    }
  }

  function set(key, value) {
    return this._object[key] = value;
  }

  function get(key) {
    if (this._object[key] !== Object.prototype[key])
      return this._object[key];
  }

  function unset(key) {
    var value = this._object[key];
    delete this._object[key];
    return value;
  }

  function toObject() {
    return Object.clone(this._object);
  }

  function keys() {
    return this.pluck('key');
  }

  function values() {
    return this.pluck('value');
  }

  function index(value) {
    var match = this.detect(function(pair) {
      return pair.value === value;
    });
    return match && match.key;
  }

  function merge(object) {
    return this.clone().update(object);
  }

  function update(object) {
    return new Hash(object).inject(this, function(result, pair) {
      result.set(pair.key, pair.value);
      return result;
    });
  }

  function toQueryPair(key, value) {
    if (Object.isUndefined(value)) return key;
    return key + '=' + encodeURIComponent(String.interpret(value));
  }

  function toQueryString() {
    return this.inject([], function(results, pair) {
      var key = encodeURIComponent(pair.key), values = pair.value;

      if (values && typeof values == 'object') {
        if (Object.isArray(values))
          return results.concat(values.map(toQueryPair.curry(key)));
      } else results.push(toQueryPair(key, values));
      return results;
    }).join('&');
  }

  function inspect() {
    return '#<Hash:{' + this.map(function(pair) {
      return pair.map(Object.inspect).join(': ');
    }).join(', ') + '}>';
  }

  function toJSON() {
    return Object.toJSON(this.toObject());
  }

  function clone() {
    return new Hash(this);
  }

  return {
    initialize:             initialize,
    _each:                  _each,
    set:                    set,
    get:                    get,
    unset:                  unset,
    toObject:               toObject,
    toTemplateReplacements: toObject,
    keys:                   keys,
    values:                 values,
    index:                  index,
    merge:                  merge,
    update:                 update,
    toQueryString:          toQueryString,
    inspect:                inspect,
    toJSON:                 toJSON,
    clone:                  clone
  };
})());

Hash.from = $H;
Object.extend(Number.prototype, (function() {
  function toColorPart() {
    return this.toPaddedString(2, 16);
  }

  function succ() {
    return this + 1;
  }

  function times(iterator, context) {
    $R(0, this, true).each(iterator, context);
    return this;
  }

  function toPaddedString(length, radix) {
    var string = this.toString(radix || 10);
    return '0'.times(length - string.length) + string;
  }

  function toJSON() {
    return isFinite(this) ? this.toString() : 'null';
  }

  function abs() {
    return Math.abs(this);
  }

  function round() {
    return Math.round(this);
  }

  function ceil() {
    return Math.ceil(this);
  }

  function floor() {
    return Math.floor(this);
  }

  return {
    toColorPart:    toColorPart,
    succ:           succ,
    times:          times,
    toPaddedString: toPaddedString,
    toJSON:         toJSON,
    abs:            abs,
    round:          round,
    ceil:           ceil,
    floor:          floor
  };
})());

function $R(start, end, exclusive) {
  return new ObjectRange(start, end, exclusive);
}

var ObjectRange = Class.create(Enumerable, (function() {
  function initialize(start, end, exclusive) {
    this.start = start;
    this.end = end;
    this.exclusive = exclusive;
  }

  function _each(iterator) {
    var value = this.start;
    while (this.include(value)) {
      iterator(value);
      value = value.succ();
    }
  }

  function include(value) {
    if (value < this.start)
      return false;
    if (this.exclusive)
      return value < this.end;
    return value <= this.end;
  }

  return {
    initialize: initialize,
    _each:      _each,
    include:    include
  };
})());



var Ajax = {
  getTransport: function() {
    return Try.these(
      function() {return new XMLHttpRequest()},
      function() {return new ActiveXObject('Msxml2.XMLHTTP')},
      function() {return new ActiveXObject('Microsoft.XMLHTTP')}
    ) || false;
  },

  activeRequestCount: 0
};

Ajax.Responders = {
  responders: [],

  _each: function(iterator) {
    this.responders._each(iterator);
  },

  register: function(responder) {
    if (!this.include(responder))
      this.responders.push(responder);
  },

  unregister: function(responder) {
    this.responders = this.responders.without(responder);
  },

  dispatch: function(callback, request, transport, json) {
    this.each(function(responder) {
      if (Object.isFunction(responder[callback])) {
        try {
          responder[callback].apply(responder, [request, transport, json]);
        } catch (e) { }
      }
    });
  }
};

Object.extend(Ajax.Responders, Enumerable);

Ajax.Responders.register({
  onCreate:   function() { Ajax.activeRequestCount++ },
  onComplete: function() { Ajax.activeRequestCount-- }
});
Ajax.Base = Class.create({
  initialize: function(options) {
    this.options = {
      method:       'post',
      asynchronous: true,
      contentType:  'application/x-www-form-urlencoded',
      encoding:     'UTF-8',
      parameters:   '',
      evalJSON:     true,
      evalJS:       true
    };
    Object.extend(this.options, options || { });

    this.options.method = this.options.method.toLowerCase();

    if (Object.isString(this.options.parameters))
      this.options.parameters = this.options.parameters.toQueryParams();
    else if (Object.isHash(this.options.parameters))
      this.options.parameters = this.options.parameters.toObject();
  }
});
Ajax.Request = Class.create(Ajax.Base, {
  _complete: false,

  initialize: function($super, url, options) {
    $super(options);
    this.transport = Ajax.getTransport();
    this.request(url);
  },

  request: function(url) {
    this.url = url;
    this.method = this.options.method;
    var params = Object.clone(this.options.parameters);

    if (!['get', 'post'].include(this.method)) {
      params['_method'] = this.method;
      this.method = 'post';
    }

    this.parameters = params;

    if (params = Object.toQueryString(params)) {
      if (this.method == 'get')
        this.url += (this.url.include('?') ? '&' : '?') + params;
      else if (/Konqueror|Safari|KHTML/.test(navigator.userAgent))
        params += '&_=';
    }

    try {
      var response = new Ajax.Response(this);
      if (this.options.onCreate) this.options.onCreate(response);
      Ajax.Responders.dispatch('onCreate', this, response);

      this.transport.open(this.method.toUpperCase(), this.url,
        this.options.asynchronous);

      if (this.options.asynchronous) this.respondToReadyState.bind(this).defer(1);

      this.transport.onreadystatechange = this.onStateChange.bind(this);
      this.setRequestHeaders();

      this.body = this.method == 'post' ? (this.options.postBody || params) : null;
      this.transport.send(this.body);

      /* Force Firefox to handle ready state 4 for synchronous requests */
      if (!this.options.asynchronous && this.transport.overrideMimeType)
        this.onStateChange();

    }
    catch (e) {
      this.dispatchException(e);
    }
  },

  onStateChange: function() {
    var readyState = this.transport.readyState;
    if (readyState > 1 && !((readyState == 4) && this._complete))
      this.respondToReadyState(this.transport.readyState);
  },

  setRequestHeaders: function() {
    var headers = {
      'X-Requested-With': 'XMLHttpRequest',
      'X-Prototype-Version': Prototype.Version,
      'Accept': 'text/javascript, text/html, application/xml, text/xml, */*'
    };

    if (this.method == 'post') {
      headers['Content-type'] = this.options.contentType +
        (this.options.encoding ? '; charset=' + this.options.encoding : '');

      /* Force "Connection: close" for older Mozilla browsers to work
       * around a bug where XMLHttpRequest sends an incorrect
       * Content-length header. See Mozilla Bugzilla #246651.
       */
      if (this.transport.overrideMimeType &&
          (navigator.userAgent.match(/Gecko\/(\d{4})/) || [0,2005])[1] < 2005)
            headers['Connection'] = 'close';
    }

    if (typeof this.options.requestHeaders == 'object') {
      var extras = this.options.requestHeaders;

      if (Object.isFunction(extras.push))
        for (var i = 0, length = extras.length; i < length; i += 2)
          headers[extras[i]] = extras[i+1];
      else
        $H(extras).each(function(pair) { headers[pair.key] = pair.value });
    }

    for (var name in headers)
      this.transport.setRequestHeader(name, headers[name]);
  },

  success: function() {
    var status = this.getStatus();
    return !status || (status >= 200 && status < 300);
  },

  getStatus: function() {
    try {
      return this.transport.status || 0;
    } catch (e) { return 0 }
  },

  respondToReadyState: function(readyState) {
    var state = Ajax.Request.Events[readyState], response = new Ajax.Response(this);

    if (state == 'Complete') {
      try {
        this._complete = true;
        (this.options['on' + response.status]
         || this.options['on' + (this.success() ? 'Success' : 'Failure')]
         || Prototype.emptyFunction)(response, response.headerJSON);
      } catch (e) {
        this.dispatchException(e);
      }

      var contentType = response.getHeader('Content-type');
      if (this.options.evalJS == 'force'
          || (this.options.evalJS && this.isSameOrigin() && contentType
          && contentType.match(/^\s*(text|application)\/(x-)?(java|ecma)script(;.*)?\s*$/i)))
        this.evalResponse();
    }

    try {
      (this.options['on' + state] || Prototype.emptyFunction)(response, response.headerJSON);
      Ajax.Responders.dispatch('on' + state, this, response, response.headerJSON);
    } catch (e) {
      this.dispatchException(e);
    }

    if (state == 'Complete') {
      this.transport.onreadystatechange = Prototype.emptyFunction;
    }
  },

  isSameOrigin: function() {
    var m = this.url.match(/^\s*https?:\/\/[^\/]*/);
    return !m || (m[0] == '#{protocol}//#{domain}#{port}'.interpolate({
      protocol: location.protocol,
      domain: document.domain,
      port: location.port ? ':' + location.port : ''
    }));
  },

  getHeader: function(name) {
    try {
      return this.transport.getResponseHeader(name) || null;
    } catch (e) { return null; }
  },

  evalResponse: function() {
    try {
      return eval((this.transport.responseText || '').unfilterJSON());
    } catch (e) {
      this.dispatchException(e);
    }
  },

  dispatchException: function(exception) {
    (this.options.onException || Prototype.emptyFunction)(this, exception);
    Ajax.Responders.dispatch('onException', this, exception);
  }
});

Ajax.Request.Events =
  ['Uninitialized', 'Loading', 'Loaded', 'Interactive', 'Complete'];








Ajax.Response = Class.create({
  initialize: function(request){
    this.request = request;
    var transport  = this.transport  = request.transport,
        readyState = this.readyState = transport.readyState;

    if ((readyState > 2 && !Prototype.Browser.IE) || readyState == 4) {
      this.status       = this.getStatus();
      this.statusText   = this.getStatusText();
      this.responseText = String.interpret(transport.responseText);
      this.headerJSON   = this._getHeaderJSON();
    }

    if (readyState == 4) {
      var xml = transport.responseXML;
      this.responseXML  = Object.isUndefined(xml) ? null : xml;
      this.responseJSON = this._getResponseJSON();
    }
  },

  status:      0,

  statusText: '',

  getStatus: Ajax.Request.prototype.getStatus,

  getStatusText: function() {
    try {
      return this.transport.statusText || '';
    } catch (e) { return '' }
  },

  getHeader: Ajax.Request.prototype.getHeader,

  getAllHeaders: function() {
    try {
      return this.getAllResponseHeaders();
    } catch (e) { return null }
  },

  getResponseHeader: function(name) {
    return this.transport.getResponseHeader(name);
  },

  getAllResponseHeaders: function() {
    return this.transport.getAllResponseHeaders();
  },

  _getHeaderJSON: function() {
    var json = this.getHeader('X-JSON');
    if (!json) return null;
    json = decodeURIComponent(escape(json));
    try {
      return json.evalJSON(this.request.options.sanitizeJSON ||
        !this.request.isSameOrigin());
    } catch (e) {
      this.request.dispatchException(e);
    }
  },

  _getResponseJSON: function() {
    var options = this.request.options;
    if (!options.evalJSON || (options.evalJSON != 'force' &&
      !(this.getHeader('Content-type') || '').include('application/json')) ||
        this.responseText.blank())
          return null;
    try {
      return this.responseText.evalJSON(options.sanitizeJSON ||
        !this.request.isSameOrigin());
    } catch (e) {
      this.request.dispatchException(e);
    }
  }
});

Ajax.Updater = Class.create(Ajax.Request, {
  initialize: function($super, container, url, options) {
    this.container = {
      success: (container.success || container),
      failure: (container.failure || (container.success ? null : container))
    };

    options = Object.clone(options);
    var onComplete = options.onComplete;
    options.onComplete = (function(response, json) {
      this.updateContent(response.responseText);
      if (Object.isFunction(onComplete)) onComplete(response, json);
    }).bind(this);

    $super(url, options);
  },

  updateContent: function(responseText) {
    var receiver = this.container[this.success() ? 'success' : 'failure'],
        options = this.options;

    if (!options.evalScripts) responseText = responseText.stripScripts();

    if (receiver = $(receiver)) {
      if (options.insertion) {
        if (Object.isString(options.insertion)) {
          var insertion = { }; insertion[options.insertion] = responseText;
          receiver.insert(insertion);
        }
        else options.insertion(receiver, responseText);
      }
      else receiver.update(responseText);
    }
  }
});

Ajax.PeriodicalUpdater = Class.create(Ajax.Base, {
  initialize: function($super, container, url, options) {
    $super(options);
    this.onComplete = this.options.onComplete;

    this.frequency = (this.options.frequency || 2);
    this.decay = (this.options.decay || 1);

    this.updater = { };
    this.container = container;
    this.url = url;

    this.start();
  },

  start: function() {
    this.options.onComplete = this.updateComplete.bind(this);
    this.onTimerEvent();
  },

  stop: function() {
    this.updater.options.onComplete = undefined;
    clearTimeout(this.timer);
    (this.onComplete || Prototype.emptyFunction).apply(this, arguments);
  },

  updateComplete: function(response) {
    if (this.options.decay) {
      this.decay = (response.responseText == this.lastText ?
        this.decay * this.options.decay : 1);

      this.lastText = response.responseText;
    }
    this.timer = this.onTimerEvent.bind(this).delay(this.decay * this.frequency);
  },

  onTimerEvent: function() {
    this.updater = new Ajax.Updater(this.container, this.url, this.options);
  }
});



function $(element) {
  if (arguments.length > 1) {
    for (var i = 0, elements = [], length = arguments.length; i < length; i++)
      elements.push($(arguments[i]));
    return elements;
  }
  if (Object.isString(element))
    element = document.getElementById(element);
  return Element.extend(element);
}

if (Prototype.BrowserFeatures.XPath) {
  document._getElementsByXPath = function(expression, parentElement) {
    var results = [];
    var query = document.evaluate(expression, $(parentElement) || document,
      null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    for (var i = 0, length = query.snapshotLength; i < length; i++)
      results.push(Element.extend(query.snapshotItem(i)));
    return results;
  };
}

/*--------------------------------------------------------------------------*/

if (!window.Node) var Node = { };

if (!Node.ELEMENT_NODE) {
  Object.extend(Node, {
    ELEMENT_NODE: 1,
    ATTRIBUTE_NODE: 2,
    TEXT_NODE: 3,
    CDATA_SECTION_NODE: 4,
    ENTITY_REFERENCE_NODE: 5,
    ENTITY_NODE: 6,
    PROCESSING_INSTRUCTION_NODE: 7,
    COMMENT_NODE: 8,
    DOCUMENT_NODE: 9,
    DOCUMENT_TYPE_NODE: 10,
    DOCUMENT_FRAGMENT_NODE: 11,
    NOTATION_NODE: 12
  });
}


(function(global) {

  var SETATTRIBUTE_IGNORES_NAME = (function(){
    var elForm = document.createElement("form"),
        elInput = document.createElement("input"),
        root = document.documentElement;
    elInput.setAttribute("name", "test");
    elForm.appendChild(elInput);
    root.appendChild(elForm);
    var isBuggy = elForm.elements
      ? (typeof elForm.elements.test == "undefined")
      : null;
    root.removeChild(elForm);
    elForm = elInput = null;
    return isBuggy;
  })();

  var element = global.Element;
  global.Element = function(tagName, attributes) {
    attributes = attributes || { };
    tagName = tagName.toLowerCase();
    var cache = Element.cache;
    if (SETATTRIBUTE_IGNORES_NAME && attributes.name) {
      tagName = '<' + tagName + ' name="' + attributes.name + '">';
      delete attributes.name;
      return Element.writeAttribute(document.createElement(tagName), attributes);
    }
    if (!cache[tagName]) cache[tagName] = Element.extend(document.createElement(tagName));
    return Element.writeAttribute(cache[tagName].cloneNode(false), attributes);
  };
  Object.extend(global.Element, element || { });
  if (element) global.Element.prototype = element.prototype;
})(this);

Element.cache = { };
Element.idCounter = 1;

Element.Methods = {
  visible: function(element) {
    return $(element).style.display != 'none';
  },

  toggle: function(element) {
    element = $(element);
    Element[Element.visible(element) ? 'hide' : 'show'](element);
    return element;
  },


  hide: function(element) {
    element = $(element);
    element.style.display = 'none';
    return element;
  },

  show: function(element) {
    element = $(element);
    element.style.display = '';
    return element;
  },

  remove: function(element) {
    element = $(element);
    element.parentNode.removeChild(element);
    return element;
  },

  update: (function(){

    var SELECT_ELEMENT_INNERHTML_BUGGY = (function(){
      var el = document.createElement("select"),
          isBuggy = true;
      el.innerHTML = "<option value=\"test\">test</option>";
      if (el.options && el.options[0]) {
        isBuggy = el.options[0].nodeName.toUpperCase() !== "OPTION";
      }
      el = null;
      return isBuggy;
    })();

    var TABLE_ELEMENT_INNERHTML_BUGGY = (function(){
      try {
        var el = document.createElement("table");
        if (el && el.tBodies) {
          el.innerHTML = "<tbody><tr><td>test</td></tr></tbody>";
          var isBuggy = typeof el.tBodies[0] == "undefined";
          el = null;
          return isBuggy;
        }
      } catch (e) {
        return true;
      }
    })();

    var SCRIPT_ELEMENT_REJECTS_TEXTNODE_APPENDING = (function () {
      var s = document.createElement("script"),
          isBuggy = false;
      try {
        s.appendChild(document.createTextNode(""));
        isBuggy = !s.firstChild ||
          s.firstChild && s.firstChild.nodeType !== 3;
      } catch (e) {
        isBuggy = true;
      }
      s = null;
      return isBuggy;
    })();

    function update(element, content) {
      element = $(element);

      if (content && content.toElement)
        content = content.toElement();

      if (Object.isElement(content))
        return element.update().insert(content);

      content = Object.toHTML(content);

      var tagName = element.tagName.toUpperCase();

      if (tagName === 'SCRIPT' && SCRIPT_ELEMENT_REJECTS_TEXTNODE_APPENDING) {
        element.text = content;
        return element;
      }

      if (SELECT_ELEMENT_INNERHTML_BUGGY || TABLE_ELEMENT_INNERHTML_BUGGY) {
        if (tagName in Element._insertionTranslations.tags) {
          while (element.firstChild) {
            element.removeChild(element.firstChild);
          }
          Element._getContentFromAnonymousElement(tagName, content.stripScripts())
            .each(function(node) {
              element.appendChild(node)
            });
        }
        else {
          element.innerHTML = content.stripScripts();
        }
      }
      else {
        element.innerHTML = content.stripScripts();
      }

      content.evalScripts.bind(content).defer();
      return element;
    }

    return update;
  })(),

  replace: function(element, content) {
    element = $(element);
    if (content && content.toElement) content = content.toElement();
    else if (!Object.isElement(content)) {
      content = Object.toHTML(content);
      var range = element.ownerDocument.createRange();
      range.selectNode(element);
      content.evalScripts.bind(content).defer();
      content = range.createContextualFragment(content.stripScripts());
    }
    element.parentNode.replaceChild(content, element);
    return element;
  },

  insert: function(element, insertions) {
    element = $(element);

    if (Object.isString(insertions) || Object.isNumber(insertions) ||
        Object.isElement(insertions) || (insertions && (insertions.toElement || insertions.toHTML)))
          insertions = {bottom:insertions};

    var content, insert, tagName, childNodes;

    for (var position in insertions) {
      content  = insertions[position];
      position = position.toLowerCase();
      insert = Element._insertionTranslations[position];

      if (content && content.toElement) content = content.toElement();
      if (Object.isElement(content)) {
        insert(element, content);
        continue;
      }

      content = Object.toHTML(content);

      tagName = ((position == 'before' || position == 'after')
        ? element.parentNode : element).tagName.toUpperCase();

      childNodes = Element._getContentFromAnonymousElement(tagName, content.stripScripts());

      if (position == 'top' || position == 'after') childNodes.reverse();
      childNodes.each(insert.curry(element));

      content.evalScripts.bind(content).defer();
    }

    return element;
  },

  wrap: function(element, wrapper, attributes) {
    element = $(element);
    if (Object.isElement(wrapper))
      $(wrapper).writeAttribute(attributes || { });
    else if (Object.isString(wrapper)) wrapper = new Element(wrapper, attributes);
    else wrapper = new Element('div', wrapper);
    if (element.parentNode)
      element.parentNode.replaceChild(wrapper, element);
    wrapper.appendChild(element);
    return wrapper;
  },

  inspect: function(element) {
    element = $(element);
    var result = '<' + element.tagName.toLowerCase();
    $H({'id': 'id', 'className': 'class'}).each(function(pair) {
      var property = pair.first(),
          attribute = pair.last(),
          value = (element[property] || '').toString();
      if (value) result += ' ' + attribute + '=' + value.inspect(true);
    });
    return result + '>';
  },

  recursivelyCollect: function(element, property, maximumLength) {
    element = $(element);
    maximumLength = maximumLength || -1;
    var elements = [];

    while (element = element[property]) {
      if (element.nodeType == 1)
        elements.push(Element.extend(element));
      if (elements.length == maximumLength)
        break;
    }

    return elements;
  },

  ancestors: function(element) {
    return Element.recursivelyCollect(element, 'parentNode');
  },

  descendants: function(element) {
    return Element.select(element, "*");
  },

  firstDescendant: function(element) {
    element = $(element).firstChild;
    while (element && element.nodeType != 1) element = element.nextSibling;
    return $(element);
  },

  immediateDescendants: function(element) {
    var results = [], child = $(element).firstChild;
    while (child) {
      if (child.nodeType === 1) {
        results.push(Element.extend(child));
      }
      child = child.nextSibling;
    }
    return results;
  },

  previousSiblings: function(element, maximumLength) {
    return Element.recursivelyCollect(element, 'previousSibling');
  },

  nextSiblings: function(element) {
    return Element.recursivelyCollect(element, 'nextSibling');
  },

  siblings: function(element) {
    element = $(element);
    return Element.previousSiblings(element).reverse()
      .concat(Element.nextSiblings(element));
  },

  match: function(element, selector) {
    element = $(element);
    if (Object.isString(selector))
      return Prototype.Selector.match(element, selector);
    return selector.match(element);
  },

  up: function(element, expression, index) {
    element = $(element);
    if (arguments.length == 1) return $(element.parentNode);
    var ancestors = Element.ancestors(element);
    return Object.isNumber(expression) ? ancestors[expression] :
      Prototype.Selector.find(ancestors, expression, index);
  },

  down: function(element, expression, index) {
    element = $(element);
    if (arguments.length == 1) return Element.firstDescendant(element);
    return Object.isNumber(expression) ? Element.descendants(element)[expression] :
      Element.select(element, expression)[index || 0];
  },

  previous: function(element, expression, index) {
    element = $(element);
    if (Object.isNumber(expression)) index = expression, expression = false;
    if (!Object.isNumber(index)) index = 0;

    if (expression) {
      return Prototype.Selector.find(element.previousSiblings(), expression, index);
    } else {
      return element.recursivelyCollect("previousSibling", index + 1)[index];
    }
  },

  next: function(element, expression, index) {
    element = $(element);
    if (Object.isNumber(expression)) index = expression, expression = false;
    if (!Object.isNumber(index)) index = 0;

    if (expression) {
      return Prototype.Selector.find(element.nextSiblings(), expression, index);
    } else {
      var maximumLength = Object.isNumber(index) ? index + 1 : 1;
      return element.recursivelyCollect("nextSibling", index + 1)[index];
    }
  },


  select: function(element) {
    element = $(element);
    var expressions = Array.prototype.slice.call(arguments, 1).join(', ');
    return Prototype.Selector.select(expressions, element);
  },

  adjacent: function(element) {
    element = $(element);
    var expressions = Array.prototype.slice.call(arguments, 1).join(', ');
    return Prototype.Selector.select(expressions, element.parentNode).without(element);
  },

  identify: function(element) {
    element = $(element);
    var id = Element.readAttribute(element, 'id');
    if (id) return id;
    do { id = 'anonymous_element_' + Element.idCounter++ } while ($(id));
    Element.writeAttribute(element, 'id', id);
    return id;
  },

  readAttribute: function(element, name) {
    element = $(element);
    if (Prototype.Browser.IE) {
      var t = Element._attributeTranslations.read;
      if (t.values[name]) return t.values[name](element, name);
      if (t.names[name]) name = t.names[name];
      if (name.include(':')) {
        return (!element.attributes || !element.attributes[name]) ? null :
         element.attributes[name].value;
      }
    }
    return element.getAttribute(name);
  },

  writeAttribute: function(element, name, value) {
    element = $(element);
    var attributes = { }, t = Element._attributeTranslations.write;

    if (typeof name == 'object') attributes = name;
    else attributes[name] = Object.isUndefined(value) ? true : value;

    for (var attr in attributes) {
      name = t.names[attr] || attr;
      value = attributes[attr];
      if (t.values[attr]) name = t.values[attr](element, value);
      if (value === false || value === null)
        element.removeAttribute(name);
      else if (value === true)
        element.setAttribute(name, name);
      else element.setAttribute(name, value);
    }
    return element;
  },

  getHeight: function(element) {
    return Element.getDimensions(element).height;
  },

  getWidth: function(element) {
    return Element.getDimensions(element).width;
  },

  classNames: function(element) {
    return new Element.ClassNames(element);
  },

  hasClassName: function(element, className) {
    if (!(element = $(element))) return;
    var elementClassName = element.className;
    return (elementClassName.length > 0 && (elementClassName == className ||
      new RegExp("(^|\\s)" + className + "(\\s|$)").test(elementClassName)));
  },

  addClassName: function(element, className) {
    if (!(element = $(element))) return;
    if (!Element.hasClassName(element, className))
      element.className += (element.className ? ' ' : '') + className;
    return element;
  },

  removeClassName: function(element, className) {
    if (!(element = $(element))) return;
    element.className = element.className.replace(
      new RegExp("(^|\\s+)" + className + "(\\s+|$)"), ' ').strip();
    return element;
  },

  toggleClassName: function(element, className) {
    if (!(element = $(element))) return;
    return Element[Element.hasClassName(element, className) ?
      'removeClassName' : 'addClassName'](element, className);
  },

  cleanWhitespace: function(element) {
    element = $(element);
    var node = element.firstChild;
    while (node) {
      var nextNode = node.nextSibling;
      if (node.nodeType == 3 && !/\S/.test(node.nodeValue))
        element.removeChild(node);
      node = nextNode;
    }
    return element;
  },

  empty: function(element) {
    return $(element).innerHTML.blank();
  },

  descendantOf: function(element, ancestor) {
    element = $(element), ancestor = $(ancestor);

    if (element.compareDocumentPosition)
      return (element.compareDocumentPosition(ancestor) & 8) === 8;

    if (ancestor.contains)
      return ancestor.contains(element) && ancestor !== element;

    while (element = element.parentNode)
      if (element == ancestor) return true;

    return false;
  },

  scrollTo: function(element) {
    element = $(element);
    var pos = Element.cumulativeOffset(element);
    window.scrollTo(pos[0], pos[1]);
    return element;
  },

  getStyle: function(element, style) {
    element = $(element);
    style = style == 'float' ? 'cssFloat' : style.camelize();
    var value = element.style[style];
    if (!value || value == 'auto') {
      var css = document.defaultView.getComputedStyle(element, null);
      value = css ? css[style] : null;
    }
    if (style == 'opacity') return value ? parseFloat(value) : 1.0;
    return value == 'auto' ? null : value;
  },

  getOpacity: function(element) {
    return $(element).getStyle('opacity');
  },

  setStyle: function(element, styles) {
    element = $(element);
    var elementStyle = element.style, match;
    if (Object.isString(styles)) {
      element.style.cssText += ';' + styles;
      return styles.include('opacity') ?
        element.setOpacity(styles.match(/opacity:\s*(\d?\.?\d*)/)[1]) : element;
    }
    for (var property in styles)
      if (property == 'opacity') element.setOpacity(styles[property]);
      else
        elementStyle[(property == 'float' || property == 'cssFloat') ?
          (Object.isUndefined(elementStyle.styleFloat) ? 'cssFloat' : 'styleFloat') :
            property] = styles[property];

    return element;
  },

  setOpacity: function(element, value) {
    element = $(element);
    element.style.opacity = (value == 1 || value === '') ? '' :
      (value < 0.00001) ? 0 : value;
    return element;
  },

  getDimensions: function(element) {
    element = $(element);
    var display = Element.getStyle(element, 'display');
    if (display != 'none' && display != null) // Safari bug
      return {width: element.offsetWidth, height: element.offsetHeight};

    var els = element.style,
        originalVisibility = els.visibility,
        originalPosition = els.position,
        originalDisplay = els.display;
    els.visibility = 'hidden';
    if (originalPosition != 'fixed') // Switching fixed to absolute causes issues in Safari
      els.position = 'absolute';
    els.display = 'block';
    var originalWidth = element.clientWidth,
        originalHeight = element.clientHeight;
    els.display = originalDisplay;
    els.position = originalPosition;
    els.visibility = originalVisibility;
    return {width: originalWidth, height: originalHeight};
  },

  makePositioned: function(element) {
    element = $(element);
    var pos = Element.getStyle(element, 'position');
    if (pos == 'static' || !pos) {
      element._madePositioned = true;
      element.style.position = 'relative';
      if (Prototype.Browser.Opera) {
        element.style.top = 0;
        element.style.left = 0;
      }
    }
    return element;
  },

  undoPositioned: function(element) {
    element = $(element);
    if (element._madePositioned) {
      element._madePositioned = undefined;
      element.style.position =
        element.style.top =
        element.style.left =
        element.style.bottom =
        element.style.right = '';
    }
    return element;
  },

  makeClipping: function(element) {
    element = $(element);
    if (element._overflow) return element;
    element._overflow = Element.getStyle(element, 'overflow') || 'auto';
    if (element._overflow !== 'hidden')
      element.style.overflow = 'hidden';
    return element;
  },

  undoClipping: function(element) {
    element = $(element);
    if (!element._overflow) return element;
    element.style.overflow = element._overflow == 'auto' ? '' : element._overflow;
    element._overflow = null;
    return element;
  },

  cumulativeOffset: function(element) {
    var valueT = 0, valueL = 0;
    do {
      valueT += element.offsetTop  || 0;
      valueL += element.offsetLeft || 0;
      element = element.offsetParent;
    } while (element);
    return Element._returnOffset(valueL, valueT);
  },

  positionedOffset: function(element) {
    var valueT = 0, valueL = 0;
    do {
      valueT += element.offsetTop  || 0;
      valueL += element.offsetLeft || 0;
      element = element.offsetParent;
      if (element) {
        if (element.tagName.toUpperCase() == 'BODY') break;
        var p = Element.getStyle(element, 'position');
        if (p !== 'static') break;
      }
    } while (element);
    return Element._returnOffset(valueL, valueT);
  },

  absolutize: function(element) {
    element = $(element);
    if (Element.getStyle(element, 'position') == 'absolute') return element;

    var offsets = Element.positionedOffset(element),
        top     = offsets[1],
        left    = offsets[0],
        width   = element.clientWidth,
        height  = element.clientHeight;

    element._originalLeft   = left - parseFloat(element.style.left  || 0);
    element._originalTop    = top  - parseFloat(element.style.top || 0);
    element._originalWidth  = element.style.width;
    element._originalHeight = element.style.height;

    element.style.position = 'absolute';
    element.style.top    = top + 'px';
    element.style.left   = left + 'px';
    element.style.width  = width + 'px';
    element.style.height = height + 'px';
    return element;
  },

  relativize: function(element) {
    element = $(element);
    if (Element.getStyle(element, 'position') == 'relative') return element;

    element.style.position = 'relative';
    var top  = parseFloat(element.style.top  || 0) - (element._originalTop || 0),
        left = parseFloat(element.style.left || 0) - (element._originalLeft || 0);

    element.style.top    = top + 'px';
    element.style.left   = left + 'px';
    element.style.height = element._originalHeight;
    element.style.width  = element._originalWidth;
    return element;
  },

  cumulativeScrollOffset: function(element) {
    var valueT = 0, valueL = 0;
    do {
      valueT += element.scrollTop  || 0;
      valueL += element.scrollLeft || 0;
      element = element.parentNode;
    } while (element);
    return Element._returnOffset(valueL, valueT);
  },

  getOffsetParent: function(element) {
    if (element.offsetParent) return $(element.offsetParent);
    if (element == document.body) return $(element);

    while ((element = element.parentNode) && element != document.body)
      if (Element.getStyle(element, 'position') != 'static')
        return $(element);

    return $(document.body);
  },

  viewportOffset: function(forElement) {
    var valueT = 0,
        valueL = 0,
        element = forElement;

    do {
      valueT += element.offsetTop  || 0;
      valueL += element.offsetLeft || 0;

      if (element.offsetParent == document.body &&
        Element.getStyle(element, 'position') == 'absolute') break;

    } while (element = element.offsetParent);

    element = forElement;
    do {
      if (!Prototype.Browser.Opera || (element.tagName && (element.tagName.toUpperCase() == 'BODY'))) {
        valueT -= element.scrollTop  || 0;
        valueL -= element.scrollLeft || 0;
      }
    } while (element = element.parentNode);

    return Element._returnOffset(valueL, valueT);
  },

  clonePosition: function(element, source) {
    var options = Object.extend({
      setLeft:    true,
      setTop:     true,
      setWidth:   true,
      setHeight:  true,
      offsetTop:  0,
      offsetLeft: 0
    }, arguments[2] || { });

    source = $(source);
    var p = Element.viewportOffset(source), delta = [0, 0], parent = null;

    element = $(element);

    if (Element.getStyle(element, 'position') == 'absolute') {
      parent = Element.getOffsetParent(element);
      delta = Element.viewportOffset(parent);
    }

    if (parent == document.body) {
      delta[0] -= document.body.offsetLeft;
      delta[1] -= document.body.offsetTop;
    }

    if (options.setLeft)   element.style.left  = (p[0] - delta[0] + options.offsetLeft) + 'px';
    if (options.setTop)    element.style.top   = (p[1] - delta[1] + options.offsetTop) + 'px';
    if (options.setWidth)  element.style.width = source.offsetWidth + 'px';
    if (options.setHeight) element.style.height = source.offsetHeight + 'px';
    return element;
  }
};

Object.extend(Element.Methods, {
  getElementsBySelector: Element.Methods.select,

  childElements: Element.Methods.immediateDescendants
});

Element._attributeTranslations = {
  write: {
    names: {
      className: 'class',
      htmlFor:   'for'
    },
    values: { }
  }
};

if (Prototype.Browser.Opera) {
  Element.Methods.getStyle = Element.Methods.getStyle.wrap(
    function(proceed, element, style) {
      switch (style) {
        case 'left': case 'top': case 'right': case 'bottom':
          if (proceed(element, 'position') === 'static') return null;
        case 'height': case 'width':
          if (!Element.visible(element)) return null;

          var dim = parseInt(proceed(element, style), 10);

          if (dim !== element['offset' + style.capitalize()])
            return dim + 'px';

          var properties;
          if (style === 'height') {
            properties = ['border-top-width', 'padding-top',
             'padding-bottom', 'border-bottom-width'];
          }
          else {
            properties = ['border-left-width', 'padding-left',
             'padding-right', 'border-right-width'];
          }
          return properties.inject(dim, function(memo, property) {
            var val = proceed(element, property);
            return val === null ? memo : memo - parseInt(val, 10);
          }) + 'px';
        default: return proceed(element, style);
      }
    }
  );

  Element.Methods.readAttribute = Element.Methods.readAttribute.wrap(
    function(proceed, element, attribute) {
      if (attribute === 'title') return element.title;
      return proceed(element, attribute);
    }
  );
}

else if (Prototype.Browser.IE) {
  Element.Methods.getOffsetParent = Element.Methods.getOffsetParent.wrap(
    function(proceed, element) {
      element = $(element);
      try { element.offsetParent }
      catch(e) { return $(document.body) }
      var position = element.getStyle('position');
      if (position !== 'static') return proceed(element);
      element.setStyle({ position: 'relative' });
      var value = proceed(element);
      element.setStyle({ position: position });
      return value;
    }
  );

  $w('positionedOffset viewportOffset').each(function(method) {
    Element.Methods[method] = Element.Methods[method].wrap(
      function(proceed, element) {
        element = $(element);
        try { element.offsetParent }
        catch(e) { return Element._returnOffset(0,0) }
        var position = element.getStyle('position');
        if (position !== 'static') return proceed(element);
        var offsetParent = element.getOffsetParent();
        if (offsetParent && offsetParent.getStyle('position') === 'fixed')
          offsetParent.setStyle({ zoom: 1 });
        element.setStyle({ position: 'relative' });
        var value = proceed(element);
        element.setStyle({ position: position });
        return value;
      }
    );
  });

  Element.Methods.cumulativeOffset = Element.Methods.cumulativeOffset.wrap(
    function(proceed, element) {
      try { element.offsetParent }
      catch(e) { return Element._returnOffset(0,0) }
      return proceed(element);
    }
  );

  Element.Methods.getStyle = function(element, style) {
    element = $(element);
    style = (style == 'float' || style == 'cssFloat') ? 'styleFloat' : style.camelize();
    var value = element.style[style];
    if (!value && element.currentStyle) value = element.currentStyle[style];

    if (style == 'opacity') {
      if (value = (element.getStyle('filter') || '').match(/alpha\(opacity=(.*)\)/))
        if (value[1]) return parseFloat(value[1]) / 100;
      return 1.0;
    }

    if (value == 'auto') {
      if ((style == 'width' || style == 'height') && (element.getStyle('display') != 'none'))
        return element['offset' + style.capitalize()] + 'px';
      return null;
    }
    return value;
  };

  Element.Methods.setOpacity = function(element, value) {
    function stripAlpha(filter){
      return filter.replace(/alpha\([^\)]*\)/gi,'');
    }
    element = $(element);
    var currentStyle = element.currentStyle;
    if ((currentStyle && !currentStyle.hasLayout) ||
      (!currentStyle && element.style.zoom == 'normal'))
        element.style.zoom = 1;

    var filter = element.getStyle('filter'), style = element.style;
    if (value == 1 || value === '') {
      (filter = stripAlpha(filter)) ?
        style.filter = filter : style.removeAttribute('filter');
      return element;
    } else if (value < 0.00001) value = 0;
    style.filter = stripAlpha(filter) +
      'alpha(opacity=' + (value * 100) + ')';
    return element;
  };

  Element._attributeTranslations = (function(){

    var classProp = 'className',
        forProp = 'for',
        el = document.createElement('div');

    el.setAttribute(classProp, 'x');

    if (el.className !== 'x') {
      el.setAttribute('class', 'x');
      if (el.className === 'x') {
        classProp = 'class';
      }
    }
    el = null;

    el = document.createElement('label');
    el.setAttribute(forProp, 'x');
    if (el.htmlFor !== 'x') {
      el.setAttribute('htmlFor', 'x');
      if (el.htmlFor === 'x') {
        forProp = 'htmlFor';
      }
    }
    el = null;

    return {
      read: {
        names: {
          'class':      classProp,
          'className':  classProp,
          'for':        forProp,
          'htmlFor':    forProp
        },
        values: {
          _getAttr: function(element, attribute) {
            return element.getAttribute(attribute);
          },
          _getAttr2: function(element, attribute) {
            return element.getAttribute(attribute, 2);
          },
          _getAttrNode: function(element, attribute) {
            var node = element.getAttributeNode(attribute);
            return node ? node.value : "";
          },
          _getEv: (function(){

            var el = document.createElement('div'), f;
            el.onclick = Prototype.emptyFunction;
            var value = el.getAttribute('onclick');

            if (String(value).indexOf('{') > -1) {
              f = function(element, attribute) {
                attribute = element.getAttribute(attribute);
                if (!attribute) return null;
                attribute = attribute.toString();
                attribute = attribute.split('{')[1];
                attribute = attribute.split('}')[0];
                return attribute.strip();
              };
            }
            else if (value === '') {
              f = function(element, attribute) {
                attribute = element.getAttribute(attribute);
                if (!attribute) return null;
                return attribute.strip();
              };
            }
            el = null;
            return f;
          })(),
          _flag: function(element, attribute) {
            return $(element).hasAttribute(attribute) ? attribute : null;
          },
          style: function(element) {
            return element.style.cssText.toLowerCase();
          },
          title: function(element) {
            return element.title;
          }
        }
      }
    }
  })();

  Element._attributeTranslations.write = {
    names: Object.extend({
      cellpadding: 'cellPadding',
      cellspacing: 'cellSpacing'
    }, Element._attributeTranslations.read.names),
    values: {
      checked: function(element, value) {
        element.checked = !!value;
      },

      style: function(element, value) {
        element.style.cssText = value ? value : '';
      }
    }
  };

  Element._attributeTranslations.has = {};

  $w('colSpan rowSpan vAlign dateTime accessKey tabIndex ' +
      'encType maxLength readOnly longDesc frameBorder').each(function(attr) {
    Element._attributeTranslations.write.names[attr.toLowerCase()] = attr;
    Element._attributeTranslations.has[attr.toLowerCase()] = attr;
  });

  (function(v) {
    Object.extend(v, {
      href:        v._getAttr2,
      src:         v._getAttr2,
      type:        v._getAttr,
      action:      v._getAttrNode,
      disabled:    v._flag,
      checked:     v._flag,
      readonly:    v._flag,
      multiple:    v._flag,
      onload:      v._getEv,
      onunload:    v._getEv,
      onclick:     v._getEv,
      ondblclick:  v._getEv,
      onmousedown: v._getEv,
      onmouseup:   v._getEv,
      onmouseover: v._getEv,
      onmousemove: v._getEv,
      onmouseout:  v._getEv,
      onfocus:     v._getEv,
      onblur:      v._getEv,
      onkeypress:  v._getEv,
      onkeydown:   v._getEv,
      onkeyup:     v._getEv,
      onsubmit:    v._getEv,
      onreset:     v._getEv,
      onselect:    v._getEv,
      onchange:    v._getEv
    });
  })(Element._attributeTranslations.read.values);

  if (Prototype.BrowserFeatures.ElementExtensions) {
    (function() {
      function _descendants(element) {
        var nodes = element.getElementsByTagName('*'), results = [];
        for (var i = 0, node; node = nodes[i]; i++)
          if (node.tagName !== "!") // Filter out comment nodes.
            results.push(node);
        return results;
      }

      Element.Methods.down = function(element, expression, index) {
        element = $(element);
        if (arguments.length == 1) return element.firstDescendant();
        return Object.isNumber(expression) ? _descendants(element)[expression] :
          Element.select(element, expression)[index || 0];
      }
    })();
  }

}

else if (Prototype.Browser.Gecko && /rv:1\.8\.0/.test(navigator.userAgent)) {
  Element.Methods.setOpacity = function(element, value) {
    element = $(element);
    element.style.opacity = (value == 1) ? 0.999999 :
      (value === '') ? '' : (value < 0.00001) ? 0 : value;
    return element;
  };
}

else if (Prototype.Browser.WebKit) {
  Element.Methods.setOpacity = function(element, value) {
    element = $(element);
    element.style.opacity = (value == 1 || value === '') ? '' :
      (value < 0.00001) ? 0 : value;

    if (value == 1)
      if (element.tagName.toUpperCase() == 'IMG' && element.width) {
        element.width++; element.width--;
      } else try {
        var n = document.createTextNode(' ');
        element.appendChild(n);
        element.removeChild(n);
      } catch (e) { }

    return element;
  };

  Element.Methods.cumulativeOffset = function(element) {
    var valueT = 0, valueL = 0;
    do {
      valueT += element.offsetTop  || 0;
      valueL += element.offsetLeft || 0;
      if (element.offsetParent == document.body)
        if (Element.getStyle(element, 'position') == 'absolute') break;

      element = element.offsetParent;
    } while (element);

    return Element._returnOffset(valueL, valueT);
  };
}

if ('outerHTML' in document.documentElement) {
  Element.Methods.replace = function(element, content) {
    element = $(element);

    if (content && content.toElement) content = content.toElement();
    if (Object.isElement(content)) {
      element.parentNode.replaceChild(content, element);
      return element;
    }

    content = Object.toHTML(content);
    var parent = element.parentNode, tagName = parent.tagName.toUpperCase();

    if (Element._insertionTranslations.tags[tagName]) {
      var nextSibling = element.next(),
          fragments = Element._getContentFromAnonymousElement(tagName, content.stripScripts());
      parent.removeChild(element);
      if (nextSibling)
        fragments.each(function(node) { parent.insertBefore(node, nextSibling) });
      else
        fragments.each(function(node) { parent.appendChild(node) });
    }
    else element.outerHTML = content.stripScripts();

    content.evalScripts.bind(content).defer();
    return element;
  };
}

Element._returnOffset = function(l, t) {
  var result = [l, t];
  result.left = l;
  result.top = t;
  return result;
};

Element._getContentFromAnonymousElement = function(tagName, html) {
  var div = new Element('div'),
      t = Element._insertionTranslations.tags[tagName];
  if (t) {
    div.innerHTML = t[0] + html + t[1];
    for (var i = t[2]; i--; ) {
      div = div.firstChild;
    }
  }
  else {
    div.innerHTML = html;
  }
  return $A(div.childNodes);
};

Element._insertionTranslations = {
  before: function(element, node) {
    element.parentNode.insertBefore(node, element);
  },
  top: function(element, node) {
    element.insertBefore(node, element.firstChild);
  },
  bottom: function(element, node) {
    element.appendChild(node);
  },
  after: function(element, node) {
    element.parentNode.insertBefore(node, element.nextSibling);
  },
  tags: {
    TABLE:  ['<table>',                '</table>',                   1],
    TBODY:  ['<table><tbody>',         '</tbody></table>',           2],
    TR:     ['<table><tbody><tr>',     '</tr></tbody></table>',      3],
    TD:     ['<table><tbody><tr><td>', '</td></tr></tbody></table>', 4],
    SELECT: ['<select>',               '</select>',                  1]
  }
};

(function() {
  var tags = Element._insertionTranslations.tags;
  Object.extend(tags, {
    THEAD: tags.TBODY,
    TFOOT: tags.TBODY,
    TH:    tags.TD
  });
})();

Element.Methods.Simulated = {
  hasAttribute: function(element, attribute) {
    attribute = Element._attributeTranslations.has[attribute] || attribute;
    var node = $(element).getAttributeNode(attribute);
    return !!(node && node.specified);
  }
};

Element.Methods.ByTag = { };

Object.extend(Element, Element.Methods);

(function(div) {

  if (!Prototype.BrowserFeatures.ElementExtensions && div['__proto__']) {
    window.HTMLElement = { };
    window.HTMLElement.prototype = div['__proto__'];
    Prototype.BrowserFeatures.ElementExtensions = true;
  }

  div = null;

})(document.createElement('div'));

Element.extend = (function() {

  function checkDeficiency(tagName) {
    if (typeof window.Element != 'undefined') {
      var proto = window.Element.prototype;
      if (proto) {
        var id = '_' + (Math.random()+'').slice(2),
            el = document.createElement(tagName);
        proto[id] = 'x';
        var isBuggy = (el[id] !== 'x');
        delete proto[id];
        el = null;
        return isBuggy;
      }
    }
    return false;
  }

  function extendElementWith(element, methods) {
    for (var property in methods) {
      var value = methods[property];
      if (Object.isFunction(value) && !(property in element))
        element[property] = value.methodize();
    }
  }

  var HTMLOBJECTELEMENT_PROTOTYPE_BUGGY = checkDeficiency('object');

  if (Prototype.BrowserFeatures.SpecificElementExtensions) {
    if (HTMLOBJECTELEMENT_PROTOTYPE_BUGGY) {
      return function(element) {
        if (element && typeof element._extendedByPrototype == 'undefined') {
          var t = element.tagName;
          if (t && (/^(?:object|applet|embed)$/i.test(t))) {
            extendElementWith(element, Element.Methods);
            extendElementWith(element, Element.Methods.Simulated);
            extendElementWith(element, Element.Methods.ByTag[t.toUpperCase()]);
          }
        }
        return element;
      }
    }
    return Prototype.K;
  }

  var Methods = { }, ByTag = Element.Methods.ByTag;

  var extend = Object.extend(function(element) {
    if (!element || typeof element._extendedByPrototype != 'undefined' ||
        element.nodeType != 1 || element == window) return element;

    var methods = Object.clone(Methods),
        tagName = element.tagName.toUpperCase();

    if (ByTag[tagName]) Object.extend(methods, ByTag[tagName]);

    extendElementWith(element, methods);

    element._extendedByPrototype = Prototype.emptyFunction;
    return element;

  }, {
    refresh: function() {
      if (!Prototype.BrowserFeatures.ElementExtensions) {
        Object.extend(Methods, Element.Methods);
        Object.extend(Methods, Element.Methods.Simulated);
      }
    }
  });

  extend.refresh();
  return extend;
})();

if (document.documentElement.hasAttribute) {
  Element.hasAttribute = function(element, attribute) {
    return element.hasAttribute(attribute);
  };
}
else {
  Element.hasAttribute = Element.Methods.Simulated.hasAttribute;
}

Element.addMethods = function(methods) {
  var F = Prototype.BrowserFeatures, T = Element.Methods.ByTag;

  if (!methods) {
    Object.extend(Form, Form.Methods);
    Object.extend(Form.Element, Form.Element.Methods);
    Object.extend(Element.Methods.ByTag, {
      "FORM":     Object.clone(Form.Methods),
      "INPUT":    Object.clone(Form.Element.Methods),
      "SELECT":   Object.clone(Form.Element.Methods),
      "TEXTAREA": Object.clone(Form.Element.Methods)
    });
  }

  if (arguments.length == 2) {
    var tagName = methods;
    methods = arguments[1];
  }

  if (!tagName) Object.extend(Element.Methods, methods || { });
  else {
    if (Object.isArray(tagName)) tagName.each(extend);
    else extend(tagName);
  }

  function extend(tagName) {
    tagName = tagName.toUpperCase();
    if (!Element.Methods.ByTag[tagName])
      Element.Methods.ByTag[tagName] = { };
    Object.extend(Element.Methods.ByTag[tagName], methods);
  }

  function copy(methods, destination, onlyIfAbsent) {
    onlyIfAbsent = onlyIfAbsent || false;
    for (var property in methods) {
      var value = methods[property];
      if (!Object.isFunction(value)) continue;
      if (!onlyIfAbsent || !(property in destination))
        destination[property] = value.methodize();
    }
  }

  function findDOMClass(tagName) {
    var klass;
    var trans = {
      "OPTGROUP": "OptGroup", "TEXTAREA": "TextArea", "P": "Paragraph",
      "FIELDSET": "FieldSet", "UL": "UList", "OL": "OList", "DL": "DList",
      "DIR": "Directory", "H1": "Heading", "H2": "Heading", "H3": "Heading",
      "H4": "Heading", "H5": "Heading", "H6": "Heading", "Q": "Quote",
      "INS": "Mod", "DEL": "Mod", "A": "Anchor", "IMG": "Image", "CAPTION":
      "TableCaption", "COL": "TableCol", "COLGROUP": "TableCol", "THEAD":
      "TableSection", "TFOOT": "TableSection", "TBODY": "TableSection", "TR":
      "TableRow", "TH": "TableCell", "TD": "TableCell", "FRAMESET":
      "FrameSet", "IFRAME": "IFrame"
    };
    if (trans[tagName]) klass = 'HTML' + trans[tagName] + 'Element';
    if (window[klass]) return window[klass];
    klass = 'HTML' + tagName + 'Element';
    if (window[klass]) return window[klass];
    klass = 'HTML' + tagName.capitalize() + 'Element';
    if (window[klass]) return window[klass];

    var element = document.createElement(tagName),
        proto = element['__proto__'] || element.constructor.prototype;

    element = null;
    return proto;
  }

  var elementPrototype = window.HTMLElement ? HTMLElement.prototype :
   Element.prototype;

  if (F.ElementExtensions) {
    copy(Element.Methods, elementPrototype);
    copy(Element.Methods.Simulated, elementPrototype, true);
  }

  if (F.SpecificElementExtensions) {
    for (var tag in Element.Methods.ByTag) {
      var klass = findDOMClass(tag);
      if (Object.isUndefined(klass)) continue;
      copy(T[tag], klass.prototype);
    }
  }

  Object.extend(Element, Element.Methods);
  delete Element.ByTag;

  if (Element.extend.refresh) Element.extend.refresh();
  Element.cache = { };
};


document.viewport = {

  getDimensions: function() {
    return { width: this.getWidth(), height: this.getHeight() };
  },

  getScrollOffsets: function() {
    return Element._returnOffset(
      window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft,
      window.pageYOffset || document.documentElement.scrollTop  || document.body.scrollTop);
  }
};

(function(viewport) {
  var B = Prototype.Browser, doc = document, element, property = {};

  function getRootElement() {
    if (B.WebKit && !doc.evaluate)
      return document;

    if (B.Opera && window.parseFloat(window.opera.version()) < 9.5)
      return document.body;

    return document.documentElement;
  }

  function define(D) {
    if (!element) element = getRootElement();

    property[D] = 'client' + D;

    viewport['get' + D] = function() { return element[property[D]] };
    return viewport['get' + D]();
  }

  viewport.getWidth  = define.curry('Width');

  viewport.getHeight = define.curry('Height');
})(document.viewport);


Element.Storage = {
  UID: 1
};

Element.addMethods({
  getStorage: function(element) {
    if (!(element = $(element))) return;

    var uid;
    if (element === window) {
      uid = 0;
    } else {
      if (typeof element._prototypeUID === "undefined")
        element._prototypeUID = [Element.Storage.UID++];
      uid = element._prototypeUID[0];
    }

    if (!Element.Storage[uid])
      Element.Storage[uid] = $H();

    return Element.Storage[uid];
  },

  store: function(element, key, value) {
    if (!(element = $(element))) return;

    if (arguments.length === 2) {
      Element.getStorage(element).update(key);
    } else {
      Element.getStorage(element).set(key, value);
    }

    return element;
  },

  retrieve: function(element, key, defaultValue) {
    if (!(element = $(element))) return;
    var hash = Element.getStorage(element), value = hash.get(key);

    if (Object.isUndefined(value)) {
      hash.set(key, defaultValue);
      value = defaultValue;
    }

    return value;
  },

  clone: function(element, deep) {
    if (!(element = $(element))) return;
    var clone = element.cloneNode(deep);
    clone._prototypeUID = void 0;
    if (deep) {
      var descendants = Element.select(clone, '*'),
          i = descendants.length;
      while (i--) {
        descendants[i]._prototypeUID = void 0;
      }
    }
    return Element.extend(clone);
  }
});
Prototype._original_property = window.Sizzle;
/*!
 * Sizzle CSS Selector Engine - v1.0
 *  Copyright 2009, The Dojo Foundation
 *  Released under the MIT, BSD, and GPL Licenses.
 *  More information: http://sizzlejs.com/
 */
(function(){

var chunker = /((?:\((?:\([^()]+\)|[^()]+)+\)|\[(?:\[[^[\]]*\]|['"][^'"]*['"]|[^[\]'"]+)+\]|\\.|[^ >+~,(\[\\]+)+|[>+~])(\s*,\s*)?((?:.|\r|\n)*)/g,
	done = 0,
	toString = Object.prototype.toString,
	hasDuplicate = false,
	baseHasDuplicate = true;

[0, 0].sort(function(){
	baseHasDuplicate = false;
	return 0;
});

var Sizzle = function(selector, context, results, seed) {
	results = results || [];
	var origContext = context = context || document;

	if ( context.nodeType !== 1 && context.nodeType !== 9 ) {
		return [];
	}

	if ( !selector || typeof selector !== "string" ) {
		return results;
	}

	var parts = [], m, set, checkSet, check, mode, extra, prune = true, contextXML = isXML(context),
		soFar = selector;

	while ( (chunker.exec(""), m = chunker.exec(soFar)) !== null ) {
		soFar = m[3];

		parts.push( m[1] );

		if ( m[2] ) {
			extra = m[3];
			break;
		}
	}

	if ( parts.length > 1 && origPOS.exec( selector ) ) {
		if ( parts.length === 2 && Expr.relative[ parts[0] ] ) {
			set = posProcess( parts[0] + parts[1], context );
		} else {
			set = Expr.relative[ parts[0] ] ?
				[ context ] :
				Sizzle( parts.shift(), context );

			while ( parts.length ) {
				selector = parts.shift();

				if ( Expr.relative[ selector ] )
					selector += parts.shift();

				set = posProcess( selector, set );
			}
		}
	} else {
		if ( !seed && parts.length > 1 && context.nodeType === 9 && !contextXML &&
				Expr.match.ID.test(parts[0]) && !Expr.match.ID.test(parts[parts.length - 1]) ) {
			var ret = Sizzle.find( parts.shift(), context, contextXML );
			context = ret.expr ? Sizzle.filter( ret.expr, ret.set )[0] : ret.set[0];
		}

		if ( context ) {
			var ret = seed ?
				{ expr: parts.pop(), set: makeArray(seed) } :
				Sizzle.find( parts.pop(), parts.length === 1 && (parts[0] === "~" || parts[0] === "+") && context.parentNode ? context.parentNode : context, contextXML );
			set = ret.expr ? Sizzle.filter( ret.expr, ret.set ) : ret.set;

			if ( parts.length > 0 ) {
				checkSet = makeArray(set);
			} else {
				prune = false;
			}

			while ( parts.length ) {
				var cur = parts.pop(), pop = cur;

				if ( !Expr.relative[ cur ] ) {
					cur = "";
				} else {
					pop = parts.pop();
				}

				if ( pop == null ) {
					pop = context;
				}

				Expr.relative[ cur ]( checkSet, pop, contextXML );
			}
		} else {
			checkSet = parts = [];
		}
	}

	if ( !checkSet ) {
		checkSet = set;
	}

	if ( !checkSet ) {
		throw "Syntax error, unrecognized expression: " + (cur || selector);
	}

	if ( toString.call(checkSet) === "[object Array]" ) {
		if ( !prune ) {
			results.push.apply( results, checkSet );
		} else if ( context && context.nodeType === 1 ) {
			for ( var i = 0; checkSet[i] != null; i++ ) {
				if ( checkSet[i] && (checkSet[i] === true || checkSet[i].nodeType === 1 && contains(context, checkSet[i])) ) {
					results.push( set[i] );
				}
			}
		} else {
			for ( var i = 0; checkSet[i] != null; i++ ) {
				if ( checkSet[i] && checkSet[i].nodeType === 1 ) {
					results.push( set[i] );
				}
			}
		}
	} else {
		makeArray( checkSet, results );
	}

	if ( extra ) {
		Sizzle( extra, origContext, results, seed );
		Sizzle.uniqueSort( results );
	}

	return results;
};

Sizzle.uniqueSort = function(results){
	if ( sortOrder ) {
		hasDuplicate = baseHasDuplicate;
		results.sort(sortOrder);

		if ( hasDuplicate ) {
			for ( var i = 1; i < results.length; i++ ) {
				if ( results[i] === results[i-1] ) {
					results.splice(i--, 1);
				}
			}
		}
	}

	return results;
};

Sizzle.matches = function(expr, set){
	return Sizzle(expr, null, null, set);
};

Sizzle.find = function(expr, context, isXML){
	var set, match;

	if ( !expr ) {
		return [];
	}

	for ( var i = 0, l = Expr.order.length; i < l; i++ ) {
		var type = Expr.order[i], match;

		if ( (match = Expr.leftMatch[ type ].exec( expr )) ) {
			var left = match[1];
			match.splice(1,1);

			if ( left.substr( left.length - 1 ) !== "\\" ) {
				match[1] = (match[1] || "").replace(/\\/g, "");
				set = Expr.find[ type ]( match, context, isXML );
				if ( set != null ) {
					expr = expr.replace( Expr.match[ type ], "" );
					break;
				}
			}
		}
	}

	if ( !set ) {
		set = context.getElementsByTagName("*");
	}

	return {set: set, expr: expr};
};

Sizzle.filter = function(expr, set, inplace, not){
	var old = expr, result = [], curLoop = set, match, anyFound,
		isXMLFilter = set && set[0] && isXML(set[0]);

	while ( expr && set.length ) {
		for ( var type in Expr.filter ) {
			if ( (match = Expr.match[ type ].exec( expr )) != null ) {
				var filter = Expr.filter[ type ], found, item;
				anyFound = false;

				if ( curLoop == result ) {
					result = [];
				}

				if ( Expr.preFilter[ type ] ) {
					match = Expr.preFilter[ type ]( match, curLoop, inplace, result, not, isXMLFilter );

					if ( !match ) {
						anyFound = found = true;
					} else if ( match === true ) {
						continue;
					}
				}

				if ( match ) {
					for ( var i = 0; (item = curLoop[i]) != null; i++ ) {
						if ( item ) {
							found = filter( item, match, i, curLoop );
							var pass = not ^ !!found;

							if ( inplace && found != null ) {
								if ( pass ) {
									anyFound = true;
								} else {
									curLoop[i] = false;
								}
							} else if ( pass ) {
								result.push( item );
								anyFound = true;
							}
						}
					}
				}

				if ( found !== undefined ) {
					if ( !inplace ) {
						curLoop = result;
					}

					expr = expr.replace( Expr.match[ type ], "" );

					if ( !anyFound ) {
						return [];
					}

					break;
				}
			}
		}

		if ( expr == old ) {
			if ( anyFound == null ) {
				throw "Syntax error, unrecognized expression: " + expr;
			} else {
				break;
			}
		}

		old = expr;
	}

	return curLoop;
};

var Expr = Sizzle.selectors = {
	order: [ "ID", "NAME", "TAG" ],
	match: {
		ID: /#((?:[\w\u00c0-\uFFFF-]|\\.)+)/,
		CLASS: /\.((?:[\w\u00c0-\uFFFF-]|\\.)+)/,
		NAME: /\[name=['"]*((?:[\w\u00c0-\uFFFF-]|\\.)+)['"]*\]/,
		ATTR: /\[\s*((?:[\w\u00c0-\uFFFF-]|\\.)+)\s*(?:(\S?=)\s*(['"]*)(.*?)\3|)\s*\]/,
		TAG: /^((?:[\w\u00c0-\uFFFF\*-]|\\.)+)/,
		CHILD: /:(only|nth|last|first)-child(?:\((even|odd|[\dn+-]*)\))?/,
		POS: /:(nth|eq|gt|lt|first|last|even|odd)(?:\((\d*)\))?(?=[^-]|$)/,
		PSEUDO: /:((?:[\w\u00c0-\uFFFF-]|\\.)+)(?:\((['"]*)((?:\([^\)]+\)|[^\2\(\)]*)+)\2\))?/
	},
	leftMatch: {},
	attrMap: {
		"class": "className",
		"for": "htmlFor"
	},
	attrHandle: {
		href: function(elem){
			return elem.getAttribute("href");
		}
	},
	relative: {
		"+": function(checkSet, part, isXML){
			var isPartStr = typeof part === "string",
				isTag = isPartStr && !/\W/.test(part),
				isPartStrNotTag = isPartStr && !isTag;

			if ( isTag && !isXML ) {
				part = part.toUpperCase();
			}

			for ( var i = 0, l = checkSet.length, elem; i < l; i++ ) {
				if ( (elem = checkSet[i]) ) {
					while ( (elem = elem.previousSibling) && elem.nodeType !== 1 ) {}

					checkSet[i] = isPartStrNotTag || elem && elem.nodeName === part ?
						elem || false :
						elem === part;
				}
			}

			if ( isPartStrNotTag ) {
				Sizzle.filter( part, checkSet, true );
			}
		},
		">": function(checkSet, part, isXML){
			var isPartStr = typeof part === "string";

			if ( isPartStr && !/\W/.test(part) ) {
				part = isXML ? part : part.toUpperCase();

				for ( var i = 0, l = checkSet.length; i < l; i++ ) {
					var elem = checkSet[i];
					if ( elem ) {
						var parent = elem.parentNode;
						checkSet[i] = parent.nodeName === part ? parent : false;
					}
				}
			} else {
				for ( var i = 0, l = checkSet.length; i < l; i++ ) {
					var elem = checkSet[i];
					if ( elem ) {
						checkSet[i] = isPartStr ?
							elem.parentNode :
							elem.parentNode === part;
					}
				}

				if ( isPartStr ) {
					Sizzle.filter( part, checkSet, true );
				}
			}
		},
		"": function(checkSet, part, isXML){
			var doneName = done++, checkFn = dirCheck;

			if ( !/\W/.test(part) ) {
				var nodeCheck = part = isXML ? part : part.toUpperCase();
				checkFn = dirNodeCheck;
			}

			checkFn("parentNode", part, doneName, checkSet, nodeCheck, isXML);
		},
		"~": function(checkSet, part, isXML){
			var doneName = done++, checkFn = dirCheck;

			if ( typeof part === "string" && !/\W/.test(part) ) {
				var nodeCheck = part = isXML ? part : part.toUpperCase();
				checkFn = dirNodeCheck;
			}

			checkFn("previousSibling", part, doneName, checkSet, nodeCheck, isXML);
		}
	},
	find: {
		ID: function(match, context, isXML){
			if ( typeof context.getElementById !== "undefined" && !isXML ) {
				var m = context.getElementById(match[1]);
				return m ? [m] : [];
			}
		},
		NAME: function(match, context, isXML){
			if ( typeof context.getElementsByName !== "undefined" ) {
				var ret = [], results = context.getElementsByName(match[1]);

				for ( var i = 0, l = results.length; i < l; i++ ) {
					if ( results[i].getAttribute("name") === match[1] ) {
						ret.push( results[i] );
					}
				}

				return ret.length === 0 ? null : ret;
			}
		},
		TAG: function(match, context){
			return context.getElementsByTagName(match[1]);
		}
	},
	preFilter: {
		CLASS: function(match, curLoop, inplace, result, not, isXML){
			match = " " + match[1].replace(/\\/g, "") + " ";

			if ( isXML ) {
				return match;
			}

			for ( var i = 0, elem; (elem = curLoop[i]) != null; i++ ) {
				if ( elem ) {
					if ( not ^ (elem.className && (" " + elem.className + " ").indexOf(match) >= 0) ) {
						if ( !inplace )
							result.push( elem );
					} else if ( inplace ) {
						curLoop[i] = false;
					}
				}
			}

			return false;
		},
		ID: function(match){
			return match[1].replace(/\\/g, "");
		},
		TAG: function(match, curLoop){
			for ( var i = 0; curLoop[i] === false; i++ ){}
			return curLoop[i] && isXML(curLoop[i]) ? match[1] : match[1].toUpperCase();
		},
		CHILD: function(match){
			if ( match[1] == "nth" ) {
				var test = /(-?)(\d*)n((?:\+|-)?\d*)/.exec(
					match[2] == "even" && "2n" || match[2] == "odd" && "2n+1" ||
					!/\D/.test( match[2] ) && "0n+" + match[2] || match[2]);

				match[2] = (test[1] + (test[2] || 1)) - 0;
				match[3] = test[3] - 0;
			}

			match[0] = done++;

			return match;
		},
		ATTR: function(match, curLoop, inplace, result, not, isXML){
			var name = match[1].replace(/\\/g, "");

			if ( !isXML && Expr.attrMap[name] ) {
				match[1] = Expr.attrMap[name];
			}

			if ( match[2] === "~=" ) {
				match[4] = " " + match[4] + " ";
			}

			return match;
		},
		PSEUDO: function(match, curLoop, inplace, result, not){
			if ( match[1] === "not" ) {
				if ( ( chunker.exec(match[3]) || "" ).length > 1 || /^\w/.test(match[3]) ) {
					match[3] = Sizzle(match[3], null, null, curLoop);
				} else {
					var ret = Sizzle.filter(match[3], curLoop, inplace, true ^ not);
					if ( !inplace ) {
						result.push.apply( result, ret );
					}
					return false;
				}
			} else if ( Expr.match.POS.test( match[0] ) || Expr.match.CHILD.test( match[0] ) ) {
				return true;
			}

			return match;
		},
		POS: function(match){
			match.unshift( true );
			return match;
		}
	},
	filters: {
		enabled: function(elem){
			return elem.disabled === false && elem.type !== "hidden";
		},
		disabled: function(elem){
			return elem.disabled === true;
		},
		checked: function(elem){
			return elem.checked === true;
		},
		selected: function(elem){
			elem.parentNode.selectedIndex;
			return elem.selected === true;
		},
		parent: function(elem){
			return !!elem.firstChild;
		},
		empty: function(elem){
			return !elem.firstChild;
		},
		has: function(elem, i, match){
			return !!Sizzle( match[3], elem ).length;
		},
		header: function(elem){
			return /h\d/i.test( elem.nodeName );
		},
		text: function(elem){
			return "text" === elem.type;
		},
		radio: function(elem){
			return "radio" === elem.type;
		},
		checkbox: function(elem){
			return "checkbox" === elem.type;
		},
		file: function(elem){
			return "file" === elem.type;
		},
		password: function(elem){
			return "password" === elem.type;
		},
		submit: function(elem){
			return "submit" === elem.type;
		},
		image: function(elem){
			return "image" === elem.type;
		},
		reset: function(elem){
			return "reset" === elem.type;
		},
		button: function(elem){
			return "button" === elem.type || elem.nodeName.toUpperCase() === "BUTTON";
		},
		input: function(elem){
			return /input|select|textarea|button/i.test(elem.nodeName);
		}
	},
	setFilters: {
		first: function(elem, i){
			return i === 0;
		},
		last: function(elem, i, match, array){
			return i === array.length - 1;
		},
		even: function(elem, i){
			return i % 2 === 0;
		},
		odd: function(elem, i){
			return i % 2 === 1;
		},
		lt: function(elem, i, match){
			return i < match[3] - 0;
		},
		gt: function(elem, i, match){
			return i > match[3] - 0;
		},
		nth: function(elem, i, match){
			return match[3] - 0 == i;
		},
		eq: function(elem, i, match){
			return match[3] - 0 == i;
		}
	},
	filter: {
		PSEUDO: function(elem, match, i, array){
			var name = match[1], filter = Expr.filters[ name ];

			if ( filter ) {
				return filter( elem, i, match, array );
			} else if ( name === "contains" ) {
				return (elem.textContent || elem.innerText || "").indexOf(match[3]) >= 0;
			} else if ( name === "not" ) {
				var not = match[3];

				for ( var i = 0, l = not.length; i < l; i++ ) {
					if ( not[i] === elem ) {
						return false;
					}
				}

				return true;
			}
		},
		CHILD: function(elem, match){
			var type = match[1], node = elem;
			switch (type) {
				case 'only':
				case 'first':
					while ( (node = node.previousSibling) )  {
						if ( node.nodeType === 1 ) return false;
					}
					if ( type == 'first') return true;
					node = elem;
				case 'last':
					while ( (node = node.nextSibling) )  {
						if ( node.nodeType === 1 ) return false;
					}
					return true;
				case 'nth':
					var first = match[2], last = match[3];

					if ( first == 1 && last == 0 ) {
						return true;
					}

					var doneName = match[0],
						parent = elem.parentNode;

					if ( parent && (parent.sizcache !== doneName || !elem.nodeIndex) ) {
						var count = 0;
						for ( node = parent.firstChild; node; node = node.nextSibling ) {
							if ( node.nodeType === 1 ) {
								node.nodeIndex = ++count;
							}
						}
						parent.sizcache = doneName;
					}

					var diff = elem.nodeIndex - last;
					if ( first == 0 ) {
						return diff == 0;
					} else {
						return ( diff % first == 0 && diff / first >= 0 );
					}
			}
		},
		ID: function(elem, match){
			return elem.nodeType === 1 && elem.getAttribute("id") === match;
		},
		TAG: function(elem, match){
			return (match === "*" && elem.nodeType === 1) || elem.nodeName === match;
		},
		CLASS: function(elem, match){
			return (" " + (elem.className || elem.getAttribute("class")) + " ")
				.indexOf( match ) > -1;
		},
		ATTR: function(elem, match){
			var name = match[1],
				result = Expr.attrHandle[ name ] ?
					Expr.attrHandle[ name ]( elem ) :
					elem[ name ] != null ?
						elem[ name ] :
						elem.getAttribute( name ),
				value = result + "",
				type = match[2],
				check = match[4];

			return result == null ?
				type === "!=" :
				type === "=" ?
				value === check :
				type === "*=" ?
				value.indexOf(check) >= 0 :
				type === "~=" ?
				(" " + value + " ").indexOf(check) >= 0 :
				!check ?
				value && result !== false :
				type === "!=" ?
				value != check :
				type === "^=" ?
				value.indexOf(check) === 0 :
				type === "$=" ?
				value.substr(value.length - check.length) === check :
				type === "|=" ?
				value === check || value.substr(0, check.length + 1) === check + "-" :
				false;
		},
		POS: function(elem, match, i, array){
			var name = match[2], filter = Expr.setFilters[ name ];

			if ( filter ) {
				return filter( elem, i, match, array );
			}
		}
	}
};

var origPOS = Expr.match.POS;

for ( var type in Expr.match ) {
	Expr.match[ type ] = new RegExp( Expr.match[ type ].source + /(?![^\[]*\])(?![^\(]*\))/.source );
	Expr.leftMatch[ type ] = new RegExp( /(^(?:.|\r|\n)*?)/.source + Expr.match[ type ].source );
}

var makeArray = function(array, results) {
	array = Array.prototype.slice.call( array, 0 );

	if ( results ) {
		results.push.apply( results, array );
		return results;
	}

	return array;
};

try {
	Array.prototype.slice.call( document.documentElement.childNodes, 0 );

} catch(e){
	makeArray = function(array, results) {
		var ret = results || [];

		if ( toString.call(array) === "[object Array]" ) {
			Array.prototype.push.apply( ret, array );
		} else {
			if ( typeof array.length === "number" ) {
				for ( var i = 0, l = array.length; i < l; i++ ) {
					ret.push( array[i] );
				}
			} else {
				for ( var i = 0; array[i]; i++ ) {
					ret.push( array[i] );
				}
			}
		}

		return ret;
	};
}

var sortOrder;

if ( document.documentElement.compareDocumentPosition ) {
	sortOrder = function( a, b ) {
		if ( !a.compareDocumentPosition || !b.compareDocumentPosition ) {
			if ( a == b ) {
				hasDuplicate = true;
			}
			return 0;
		}

		var ret = a.compareDocumentPosition(b) & 4 ? -1 : a === b ? 0 : 1;
		if ( ret === 0 ) {
			hasDuplicate = true;
		}
		return ret;
	};
} else if ( "sourceIndex" in document.documentElement ) {
	sortOrder = function( a, b ) {
		if ( !a.sourceIndex || !b.sourceIndex ) {
			if ( a == b ) {
				hasDuplicate = true;
			}
			return 0;
		}

		var ret = a.sourceIndex - b.sourceIndex;
		if ( ret === 0 ) {
			hasDuplicate = true;
		}
		return ret;
	};
} else if ( document.createRange ) {
	sortOrder = function( a, b ) {
		if ( !a.ownerDocument || !b.ownerDocument ) {
			if ( a == b ) {
				hasDuplicate = true;
			}
			return 0;
		}

		var aRange = a.ownerDocument.createRange(), bRange = b.ownerDocument.createRange();
		aRange.setStart(a, 0);
		aRange.setEnd(a, 0);
		bRange.setStart(b, 0);
		bRange.setEnd(b, 0);
		var ret = aRange.compareBoundaryPoints(Range.START_TO_END, bRange);
		if ( ret === 0 ) {
			hasDuplicate = true;
		}
		return ret;
	};
}

(function(){
	var form = document.createElement("div"),
		id = "script" + (new Date).getTime();
	form.innerHTML = "<a name='" + id + "'/>";

	var root = document.documentElement;
	root.insertBefore( form, root.firstChild );

	if ( !!document.getElementById( id ) ) {
		Expr.find.ID = function(match, context, isXML){
			if ( typeof context.getElementById !== "undefined" && !isXML ) {
				var m = context.getElementById(match[1]);
				return m ? m.id === match[1] || typeof m.getAttributeNode !== "undefined" && m.getAttributeNode("id").nodeValue === match[1] ? [m] : undefined : [];
			}
		};

		Expr.filter.ID = function(elem, match){
			var node = typeof elem.getAttributeNode !== "undefined" && elem.getAttributeNode("id");
			return elem.nodeType === 1 && node && node.nodeValue === match;
		};
	}

	root.removeChild( form );
	root = form = null; // release memory in IE
})();

(function(){

	var div = document.createElement("div");
	div.appendChild( document.createComment("") );

	if ( div.getElementsByTagName("*").length > 0 ) {
		Expr.find.TAG = function(match, context){
			var results = context.getElementsByTagName(match[1]);

			if ( match[1] === "*" ) {
				var tmp = [];

				for ( var i = 0; results[i]; i++ ) {
					if ( results[i].nodeType === 1 ) {
						tmp.push( results[i] );
					}
				}

				results = tmp;
			}

			return results;
		};
	}

	div.innerHTML = "<a href='#'></a>";
	if ( div.firstChild && typeof div.firstChild.getAttribute !== "undefined" &&
			div.firstChild.getAttribute("href") !== "#" ) {
		Expr.attrHandle.href = function(elem){
			return elem.getAttribute("href", 2);
		};
	}

	div = null; // release memory in IE
})();

if ( document.querySelectorAll ) (function(){
	var oldSizzle = Sizzle, div = document.createElement("div");
	div.innerHTML = "<p class='TEST'></p>";

	if ( div.querySelectorAll && div.querySelectorAll(".TEST").length === 0 ) {
		return;
	}

	Sizzle = function(query, context, extra, seed){
		context = context || document;

		if ( !seed && context.nodeType === 9 && !isXML(context) ) {
			try {
				return makeArray( context.querySelectorAll(query), extra );
			} catch(e){}
		}

		return oldSizzle(query, context, extra, seed);
	};

	for ( var prop in oldSizzle ) {
		Sizzle[ prop ] = oldSizzle[ prop ];
	}

	div = null; // release memory in IE
})();

if ( document.getElementsByClassName && document.documentElement.getElementsByClassName ) (function(){
	var div = document.createElement("div");
	div.innerHTML = "<div class='test e'></div><div class='test'></div>";

	if ( div.getElementsByClassName("e").length === 0 )
		return;

	div.lastChild.className = "e";

	if ( div.getElementsByClassName("e").length === 1 )
		return;

	Expr.order.splice(1, 0, "CLASS");
	Expr.find.CLASS = function(match, context, isXML) {
		if ( typeof context.getElementsByClassName !== "undefined" && !isXML ) {
			return context.getElementsByClassName(match[1]);
		}
	};

	div = null; // release memory in IE
})();

function dirNodeCheck( dir, cur, doneName, checkSet, nodeCheck, isXML ) {
	var sibDir = dir == "previousSibling" && !isXML;
	for ( var i = 0, l = checkSet.length; i < l; i++ ) {
		var elem = checkSet[i];
		if ( elem ) {
			if ( sibDir && elem.nodeType === 1 ){
				elem.sizcache = doneName;
				elem.sizset = i;
			}
			elem = elem[dir];
			var match = false;

			while ( elem ) {
				if ( elem.sizcache === doneName ) {
					match = checkSet[elem.sizset];
					break;
				}

				if ( elem.nodeType === 1 && !isXML ){
					elem.sizcache = doneName;
					elem.sizset = i;
				}

				if ( elem.nodeName === cur ) {
					match = elem;
					break;
				}

				elem = elem[dir];
			}

			checkSet[i] = match;
		}
	}
}

function dirCheck( dir, cur, doneName, checkSet, nodeCheck, isXML ) {
	var sibDir = dir == "previousSibling" && !isXML;
	for ( var i = 0, l = checkSet.length; i < l; i++ ) {
		var elem = checkSet[i];
		if ( elem ) {
			if ( sibDir && elem.nodeType === 1 ) {
				elem.sizcache = doneName;
				elem.sizset = i;
			}
			elem = elem[dir];
			var match = false;

			while ( elem ) {
				if ( elem.sizcache === doneName ) {
					match = checkSet[elem.sizset];
					break;
				}

				if ( elem.nodeType === 1 ) {
					if ( !isXML ) {
						elem.sizcache = doneName;
						elem.sizset = i;
					}
					if ( typeof cur !== "string" ) {
						if ( elem === cur ) {
							match = true;
							break;
						}

					} else if ( Sizzle.filter( cur, [elem] ).length > 0 ) {
						match = elem;
						break;
					}
				}

				elem = elem[dir];
			}

			checkSet[i] = match;
		}
	}
}

var contains = document.compareDocumentPosition ?  function(a, b){
	return a.compareDocumentPosition(b) & 16;
} : function(a, b){
	return a !== b && (a.contains ? a.contains(b) : true);
};

var isXML = function(elem){
	return elem.nodeType === 9 && elem.documentElement.nodeName !== "HTML" ||
		!!elem.ownerDocument && elem.ownerDocument.documentElement.nodeName !== "HTML";
};

var posProcess = function(selector, context){
	var tmpSet = [], later = "", match,
		root = context.nodeType ? [context] : context;

	while ( (match = Expr.match.PSEUDO.exec( selector )) ) {
		later += match[0];
		selector = selector.replace( Expr.match.PSEUDO, "" );
	}

	selector = Expr.relative[selector] ? selector + "*" : selector;

	for ( var i = 0, l = root.length; i < l; i++ ) {
		Sizzle( selector, root[i], tmpSet );
	}

	return Sizzle.filter( later, tmpSet );
};


window.Sizzle = Sizzle;

})();

Prototype.Selector = (function(engine) {
  function extend(elements) {
    for (var i = 0, length = elements.length; i < length; i++) {
      Element.extend(elements[i]);
    }
    return elements;
  }

  function select(selector, scope) {
    return extend(engine(selector, scope || document));
  }

  function match(element, selector) {
    return engine.matches(selector, [element]).length == 1;
  }

  return {
    engine:  engine,
    select:  select,
    match:   match
  };
})(Sizzle);

window.Sizzle = Prototype._original_property;
delete Prototype._original_property;

window.$$ = function() {
  var expression = $A(arguments).join(', ');
  return Prototype.Selector.select(expression, document);
};







if (!Prototype.Selector.find) {
  Prototype.Selector.find = function(elements, expression, index) {
    if (Object.isUndefined(index)) index = 0;
    var match = Prototype.Selector.match, length = elements.length, matchIndex = 0, i;

    for (i = 0; i < length; i++) {
      if (match(elements[i], expression) && index == matchIndex++) {
        return Element.extend(elements[i]);
      }
    }
  }
}


var Form = {
  reset: function(form) {
    form = $(form);
    form.reset();
    return form;
  },

  serializeElements: function(elements, options) {
    if (typeof options != 'object') options = { hash: !!options };
    else if (Object.isUndefined(options.hash)) options.hash = true;
    var key, value, submitted = false, submit = options.submit;

    var data = elements.inject({ }, function(result, element) {
      if (!element.disabled && element.name) {
        key = element.name; value = $(element).getValue();
        if (value != null && element.type != 'file' && (element.type != 'submit' || (!submitted &&
            submit !== false && (!submit || key == submit) && (submitted = true)))) {
          if (key in result) {
            if (!Object.isArray(result[key])) result[key] = [result[key]];
            result[key].push(value);
          }
          else result[key] = value;
        }
      }
      return result;
    });

    return options.hash ? data : Object.toQueryString(data);
  }
};

Form.Methods = {
  serialize: function(form, options) {
    return Form.serializeElements(Form.getElements(form), options);
  },

  getElements: function(form) {
    var elements = $(form).getElementsByTagName('*'),
        element,
        arr = [ ],
        serializers = Form.Element.Serializers;
    for (var i = 0; element = elements[i]; i++) {
      arr.push(element);
    }
    return arr.inject([], function(elements, child) {
      if (serializers[child.tagName.toLowerCase()])
        elements.push(Element.extend(child));
      return elements;
    })
  },

  getInputs: function(form, typeName, name) {
    form = $(form);
    var inputs = form.getElementsByTagName('input');

    if (!typeName && !name) return $A(inputs).map(Element.extend);

    for (var i = 0, matchingInputs = [], length = inputs.length; i < length; i++) {
      var input = inputs[i];
      if ((typeName && input.type != typeName) || (name && input.name != name))
        continue;
      matchingInputs.push(Element.extend(input));
    }

    return matchingInputs;
  },

  disable: function(form) {
    form = $(form);
    Form.getElements(form).invoke('disable');
    return form;
  },

  enable: function(form) {
    form = $(form);
    Form.getElements(form).invoke('enable');
    return form;
  },

  findFirstElement: function(form) {
    var elements = $(form).getElements().findAll(function(element) {
      return 'hidden' != element.type && !element.disabled;
    });
    var firstByIndex = elements.findAll(function(element) {
      return element.hasAttribute('tabIndex') && element.tabIndex >= 0;
    }).sortBy(function(element) { return element.tabIndex }).first();

    return firstByIndex ? firstByIndex : elements.find(function(element) {
      return /^(?:input|select|textarea)$/i.test(element.tagName);
    });
  },

  focusFirstElement: function(form) {
    form = $(form);
    form.findFirstElement().activate();
    return form;
  },

  request: function(form, options) {
    form = $(form), options = Object.clone(options || { });

    var params = options.parameters, action = form.readAttribute('action') || '';
    if (action.blank()) action = window.location.href;
    options.parameters = form.serialize(true);

    if (params) {
      if (Object.isString(params)) params = params.toQueryParams();
      Object.extend(options.parameters, params);
    }

    if (form.hasAttribute('method') && !options.method)
      options.method = form.method;

    return new Ajax.Request(action, options);
  }
};

/*--------------------------------------------------------------------------*/


Form.Element = {
  focus: function(element) {
    $(element).focus();
    return element;
  },

  select: function(element) {
    $(element).select();
    return element;
  }
};

Form.Element.Methods = {

  serialize: function(element) {
    element = $(element);
    if (!element.disabled && element.name) {
      var value = element.getValue();
      if (value != undefined) {
        var pair = { };
        pair[element.name] = value;
        return Object.toQueryString(pair);
      }
    }
    return '';
  },

  getValue: function(element) {
    element = $(element);
    var method = element.tagName.toLowerCase();
    return Form.Element.Serializers[method](element);
  },

  setValue: function(element, value) {
    element = $(element);
    var method = element.tagName.toLowerCase();
    Form.Element.Serializers[method](element, value);
    return element;
  },

  clear: function(element) {
    $(element).value = '';
    return element;
  },

  present: function(element) {
    return $(element).value != '';
  },

  activate: function(element) {
    element = $(element);
    try {
      element.focus();
      if (element.select && (element.tagName.toLowerCase() != 'input' ||
          !(/^(?:button|reset|submit)$/i.test(element.type))))
        element.select();
    } catch (e) { }
    return element;
  },

  disable: function(element) {
    element = $(element);
    element.disabled = true;
    return element;
  },

  enable: function(element) {
    element = $(element);
    element.disabled = false;
    return element;
  }
};

/*--------------------------------------------------------------------------*/

var Field = Form.Element;

var $F = Form.Element.Methods.getValue;

/*--------------------------------------------------------------------------*/

Form.Element.Serializers = {
  input: function(element, value) {
    switch (element.type.toLowerCase()) {
      case 'checkbox':
      case 'radio':
        return Form.Element.Serializers.inputSelector(element, value);
      default:
        return Form.Element.Serializers.textarea(element, value);
    }
  },

  inputSelector: function(element, value) {
    if (Object.isUndefined(value)) return element.checked ? element.value : null;
    else element.checked = !!value;
  },

  textarea: function(element, value) {
    if (Object.isUndefined(value)) return element.value;
    else element.value = value;
  },

  select: function(element, value) {
    if (Object.isUndefined(value))
      return this[element.type == 'select-one' ?
        'selectOne' : 'selectMany'](element);
    else {
      var opt, currentValue, single = !Object.isArray(value);
      for (var i = 0, length = element.length; i < length; i++) {
        opt = element.options[i];
        currentValue = this.optionValue(opt);
        if (single) {
          if (currentValue == value) {
            opt.selected = true;
            return;
          }
        }
        else opt.selected = value.include(currentValue);
      }
    }
  },

  selectOne: function(element) {
    var index = element.selectedIndex;
    return index >= 0 ? this.optionValue(element.options[index]) : null;
  },

  selectMany: function(element) {
    var values, length = element.length;
    if (!length) return null;

    for (var i = 0, values = []; i < length; i++) {
      var opt = element.options[i];
      if (opt.selected) values.push(this.optionValue(opt));
    }
    return values;
  },

  optionValue: function(opt) {
    return Element.extend(opt).hasAttribute('value') ? opt.value : opt.text;
  }
};

/*--------------------------------------------------------------------------*/


Abstract.TimedObserver = Class.create(PeriodicalExecuter, {
  initialize: function($super, element, frequency, callback) {
    $super(callback, frequency);
    this.element   = $(element);
    this.lastValue = this.getValue();
  },

  execute: function() {
    var value = this.getValue();
    if (Object.isString(this.lastValue) && Object.isString(value) ?
        this.lastValue != value : String(this.lastValue) != String(value)) {
      this.callback(this.element, value);
      this.lastValue = value;
    }
  }
});

Form.Element.Observer = Class.create(Abstract.TimedObserver, {
  getValue: function() {
    return Form.Element.getValue(this.element);
  }
});

Form.Observer = Class.create(Abstract.TimedObserver, {
  getValue: function() {
    return Form.serialize(this.element);
  }
});

/*--------------------------------------------------------------------------*/

Abstract.EventObserver = Class.create({
  initialize: function(element, callback) {
    this.element  = $(element);
    this.callback = callback;

    this.lastValue = this.getValue();
    if (this.element.tagName.toLowerCase() == 'form')
      this.registerFormCallbacks();
    else
      this.registerCallback(this.element);
  },

  onElementEvent: function() {
    var value = this.getValue();
    if (this.lastValue != value) {
      this.callback(this.element, value);
      this.lastValue = value;
    }
  },

  registerFormCallbacks: function() {
    Form.getElements(this.element).each(this.registerCallback, this);
  },

  registerCallback: function(element) {
    if (element.type) {
      switch (element.type.toLowerCase()) {
        case 'checkbox':
        case 'radio':
          Event.observe(element, 'click', this.onElementEvent.bind(this));
          break;
        default:
          Event.observe(element, 'change', this.onElementEvent.bind(this));
          break;
      }
    }
  }
});

Form.Element.EventObserver = Class.create(Abstract.EventObserver, {
  getValue: function() {
    return Form.Element.getValue(this.element);
  }
});

Form.EventObserver = Class.create(Abstract.EventObserver, {
  getValue: function() {
    return Form.serialize(this.element);
  }
});
(function() {

  var Event = {
    KEY_BACKSPACE: 8,
    KEY_TAB:       9,
    KEY_RETURN:   13,
    KEY_ESC:      27,
    KEY_LEFT:     37,
    KEY_UP:       38,
    KEY_RIGHT:    39,
    KEY_DOWN:     40,
    KEY_DELETE:   46,
    KEY_HOME:     36,
    KEY_END:      35,
    KEY_PAGEUP:   33,
    KEY_PAGEDOWN: 34,
    KEY_INSERT:   45,

    cache: {}
  };

  var docEl = document.documentElement;
  var MOUSEENTER_MOUSELEAVE_EVENTS_SUPPORTED = 'onmouseenter' in docEl
    && 'onmouseleave' in docEl;

  var _isButton;
  if (Prototype.Browser.IE) {
    var buttonMap = { 0: 1, 1: 4, 2: 2 };
    _isButton = function(event, code) {
      return event.button === buttonMap[code];
    };
  } else if (Prototype.Browser.WebKit) {
    _isButton = function(event, code) {
      switch (code) {
        case 0: return event.which == 1 && !event.metaKey;
        case 1: return event.which == 1 && event.metaKey;
        default: return false;
      }
    };
  } else {
    _isButton = function(event, code) {
      return event.which ? (event.which === code + 1) : (event.button === code);
    };
  }

  function isLeftClick(event)   { return _isButton(event, 0) }

  function isMiddleClick(event) { return _isButton(event, 1) }

  function isRightClick(event)  { return _isButton(event, 2) }

  function element(event) {
    event = Event.extend(event);

    var node = event.target, type = event.type,
     currentTarget = event.currentTarget;

    if (currentTarget && currentTarget.tagName) {
      if (type === 'load' || type === 'error' ||
        (type === 'click' && currentTarget.tagName.toLowerCase() === 'input'
          && currentTarget.type === 'radio'))
            node = currentTarget;
    }

    if (node.nodeType == Node.TEXT_NODE)
      node = node.parentNode;

    return Element.extend(node);
  }

  function findElement(event, expression) {
    var element = Event.element(event);
    if (!expression) return element;
    var elements = [element].concat(element.ancestors());
    return Prototype.Selector.find(elements, expression, 0);
  }

  function pointer(event) {
    return { x: pointerX(event), y: pointerY(event) };
  }

  function pointerX(event) {
    var docElement = document.documentElement,
     body = document.body || { scrollLeft: 0 };

    return event.pageX || (event.clientX +
      (docElement.scrollLeft || body.scrollLeft) -
      (docElement.clientLeft || 0));
  }

  function pointerY(event) {
    var docElement = document.documentElement,
     body = document.body || { scrollTop: 0 };

    return  event.pageY || (event.clientY +
       (docElement.scrollTop || body.scrollTop) -
       (docElement.clientTop || 0));
  }


  function stop(event) {
    Event.extend(event);
    event.preventDefault();
    event.stopPropagation();

    event.stopped = true;
  }

  Event.Methods = {
    isLeftClick: isLeftClick,
    isMiddleClick: isMiddleClick,
    isRightClick: isRightClick,

    element: element,
    findElement: findElement,

    pointer: pointer,
    pointerX: pointerX,
    pointerY: pointerY,

    stop: stop
  };


  var methods = Object.keys(Event.Methods).inject({ }, function(m, name) {
    m[name] = Event.Methods[name].methodize();
    return m;
  });

  if (Prototype.Browser.IE) {
    function _relatedTarget(event) {
      var element;
      switch (event.type) {
        case 'mouseover': element = event.fromElement; break;
        case 'mouseout':  element = event.toElement;   break;
        default: return null;
      }
      return Element.extend(element);
    }

    Object.extend(methods, {
      stopPropagation: function() { this.cancelBubble = true },
      preventDefault:  function() { this.returnValue = false },
      inspect: function() { return '[object Event]' }
    });

    Event.extend = function(event, element) {
      if (!event) return false;
      if (event._extendedByPrototype) return event;

      event._extendedByPrototype = Prototype.emptyFunction;
      var pointer = Event.pointer(event);

      Object.extend(event, {
        target: event.srcElement || element,
        relatedTarget: _relatedTarget(event),
        pageX:  pointer.x,
        pageY:  pointer.y
      });

      return Object.extend(event, methods);
    };
  } else {
    Event.prototype = window.Event.prototype || document.createEvent('HTMLEvents').__proto__;
    Object.extend(Event.prototype, methods);
    Event.extend = Prototype.K;
  }

  function _createResponder(element, eventName, handler) {
    var registry = Element.retrieve(element, 'prototype_event_registry');

    if (Object.isUndefined(registry)) {
      CACHE.push(element);
      registry = Element.retrieve(element, 'prototype_event_registry', $H());
    }

    var respondersForEvent = registry.get(eventName);
    if (Object.isUndefined(respondersForEvent)) {
      respondersForEvent = [];
      registry.set(eventName, respondersForEvent);
    }

    if (respondersForEvent.pluck('handler').include(handler)) return false;

    var responder;
    if (eventName.include(":")) {
      responder = function(event) {
        if (Object.isUndefined(event.eventName))
          return false;

        if (event.eventName !== eventName)
          return false;

        Event.extend(event, element);
        handler.call(element, event);
      };
    } else {
      if (!MOUSEENTER_MOUSELEAVE_EVENTS_SUPPORTED &&
       (eventName === "mouseenter" || eventName === "mouseleave")) {
        if (eventName === "mouseenter" || eventName === "mouseleave") {
          responder = function(event) {
            Event.extend(event, element);

            var parent = event.relatedTarget;
            while (parent && parent !== element) {
              try { parent = parent.parentNode; }
              catch(e) { parent = element; }
            }

            if (parent === element) return;

            handler.call(element, event);
          };
        }
      } else {
        responder = function(event) {
          Event.extend(event, element);
          handler.call(element, event);
        };
      }
    }

    responder.handler = handler;
    respondersForEvent.push(responder);
    return responder;
  }

  function _destroyCache() {
    for (var i = 0, length = CACHE.length; i < length; i++) {
      Event.stopObserving(CACHE[i]);
      CACHE[i] = null;
    }
  }

  var CACHE = [];

  if (Prototype.Browser.IE)
    window.attachEvent('onunload', _destroyCache);

  if (Prototype.Browser.WebKit)
    window.addEventListener('unload', Prototype.emptyFunction, false);


  var _getDOMEventName = Prototype.K,
      translations = { mouseenter: "mouseover", mouseleave: "mouseout" };

  if (!MOUSEENTER_MOUSELEAVE_EVENTS_SUPPORTED) {
    _getDOMEventName = function(eventName) {
      return (translations[eventName] || eventName);
    };
  }

  function observe(element, eventName, handler) {
    element = $(element);

    var responder = _createResponder(element, eventName, handler);

    if (!responder) return element;

    if (eventName.include(':')) {
      if (element.addEventListener)
        element.addEventListener("dataavailable", responder, false);
      else {
        element.attachEvent("ondataavailable", responder);
        element.attachEvent("onfilterchange", responder);
      }
    } else {
      var actualEventName = _getDOMEventName(eventName);

      if (element.addEventListener)
        element.addEventListener(actualEventName, responder, false);
      else
        element.attachEvent("on" + actualEventName, responder);
    }

    return element;
  }

  function stopObserving(element, eventName, handler) {
    element = $(element);

    var registry = Element.retrieve(element, 'prototype_event_registry');
    if (!registry) return element;

    if (!eventName) {
      registry.each( function(pair) {
        var eventName = pair.key;
        stopObserving(element, eventName);
      });
      return element;
    }

    var responders = registry.get(eventName);
    if (!responders) return element;

    if (!handler) {
      responders.each(function(r) {
        stopObserving(element, eventName, r.handler);
      });
      return element;
    }

    var responder = responders.find( function(r) { return r.handler === handler; });
    if (!responder) return element;

    if (eventName.include(':')) {
      if (element.removeEventListener)
        element.removeEventListener("dataavailable", responder, false);
      else {
        element.detachEvent("ondataavailable", responder);
        element.detachEvent("onfilterchange",  responder);
      }
    } else {
      var actualEventName = _getDOMEventName(eventName);
      if (element.removeEventListener)
        element.removeEventListener(actualEventName, responder, false);
      else
        element.detachEvent('on' + actualEventName, responder);
    }

    registry.set(eventName, responders.without(responder));

    return element;
  }

  function fire(element, eventName, memo, bubble) {
    element = $(element);

    if (Object.isUndefined(bubble))
      bubble = true;

    if (element == document && document.createEvent && !element.dispatchEvent)
      element = document.documentElement;

    var event;
    if (document.createEvent) {
      event = document.createEvent('HTMLEvents');
      event.initEvent('dataavailable', true, true);
    } else {
      event = document.createEventObject();
      event.eventType = bubble ? 'ondataavailable' : 'onfilterchange';
    }

    event.eventName = eventName;
    event.memo = memo || { };

    if (document.createEvent)
      element.dispatchEvent(event);
    else
      element.fireEvent(event.eventType, event);

    return Event.extend(event);
  }


  Object.extend(Event, Event.Methods);

  Object.extend(Event, {
    fire:          fire,
    observe:       observe,
    stopObserving: stopObserving
  });

  Element.addMethods({
    fire:          fire,

    observe:       observe,

    stopObserving: stopObserving
  });

  Object.extend(document, {
    fire:          fire.methodize(),

    observe:       observe.methodize(),

    stopObserving: stopObserving.methodize(),

    loaded:        false
  });

  if (window.Event) Object.extend(window.Event, Event);
  else window.Event = Event;
})();

(function() {
  /* Support for the DOMContentLoaded event is based on work by Dan Webb,
     Matthias Miller, Dean Edwards, John Resig, and Diego Perini. */

  var timer;

  function fireContentLoadedEvent() {
    if (document.loaded) return;
    if (timer) window.clearTimeout(timer);
    document.loaded = true;
    document.fire('dom:loaded');
  }

  function checkReadyState() {
    if (document.readyState === 'complete') {
      document.stopObserving('readystatechange', checkReadyState);
      fireContentLoadedEvent();
    }
  }

  function pollDoScroll() {
    try { document.documentElement.doScroll('left'); }
    catch(e) {
      timer = pollDoScroll.defer();
      return;
    }
    fireContentLoadedEvent();
  }

  if (document.addEventListener) {
    document.addEventListener('DOMContentLoaded', fireContentLoadedEvent, false);
  } else {
    document.observe('readystatechange', checkReadyState);
    if (window == top)
      timer = pollDoScroll.defer();
  }

  Event.observe(window, 'load', fireContentLoadedEvent);
})();

Element.addMethods();

/*------------------------------- DEPRECATED -------------------------------*/

Hash.toQueryString = Object.toQueryString;

var Toggle = { display: Element.toggle };

Element.Methods.childOf = Element.Methods.descendantOf;

var Insertion = {
  Before: function(element, content) {
    return Element.insert(element, {before:content});
  },

  Top: function(element, content) {
    return Element.insert(element, {top:content});
  },

  Bottom: function(element, content) {
    return Element.insert(element, {bottom:content});
  },

  After: function(element, content) {
    return Element.insert(element, {after:content});
  }
};

var $continue = new Error('"throw $continue" is deprecated, use "return" instead');

var Position = {
  includeScrollOffsets: false,

  prepare: function() {
    this.deltaX =  window.pageXOffset
                || document.documentElement.scrollLeft
                || document.body.scrollLeft
                || 0;
    this.deltaY =  window.pageYOffset
                || document.documentElement.scrollTop
                || document.body.scrollTop
                || 0;
  },

  within: function(element, x, y) {
    if (this.includeScrollOffsets)
      return this.withinIncludingScrolloffsets(element, x, y);
    this.xcomp = x;
    this.ycomp = y;
    this.offset = Element.cumulativeOffset(element);

    return (y >= this.offset[1] &&
            y <  this.offset[1] + element.offsetHeight &&
            x >= this.offset[0] &&
            x <  this.offset[0] + element.offsetWidth);
  },

  withinIncludingScrolloffsets: function(element, x, y) {
    var offsetcache = Element.cumulativeScrollOffset(element);

    this.xcomp = x + offsetcache[0] - this.deltaX;
    this.ycomp = y + offsetcache[1] - this.deltaY;
    this.offset = Element.cumulativeOffset(element);

    return (this.ycomp >= this.offset[1] &&
            this.ycomp <  this.offset[1] + element.offsetHeight &&
            this.xcomp >= this.offset[0] &&
            this.xcomp <  this.offset[0] + element.offsetWidth);
  },

  overlap: function(mode, element) {
    if (!mode) return 0;
    if (mode == 'vertical')
      return ((this.offset[1] + element.offsetHeight) - this.ycomp) /
        element.offsetHeight;
    if (mode == 'horizontal')
      return ((this.offset[0] + element.offsetWidth) - this.xcomp) /
        element.offsetWidth;
  },


  cumulativeOffset: Element.Methods.cumulativeOffset,

  positionedOffset: Element.Methods.positionedOffset,

  absolutize: function(element) {
    Position.prepare();
    return Element.absolutize(element);
  },

  relativize: function(element) {
    Position.prepare();
    return Element.relativize(element);
  },

  realOffset: Element.Methods.cumulativeScrollOffset,

  offsetParent: Element.Methods.getOffsetParent,

  page: Element.Methods.viewportOffset,

  clone: function(source, target, options) {
    options = options || { };
    return Element.clonePosition(target, source, options);
  }
};

/*--------------------------------------------------------------------------*/

if (!document.getElementsByClassName) document.getElementsByClassName = function(instanceMethods){
  function iter(name) {
    return name.blank() ? null : "[contains(concat(' ', @class, ' '), ' " + name + " ')]";
  }

  instanceMethods.getElementsByClassName = Prototype.BrowserFeatures.XPath ?
  function(element, className) {
    className = className.toString().strip();
    var cond = /\s/.test(className) ? $w(className).map(iter).join('') : iter(className);
    return cond ? document._getElementsByXPath('.//*' + cond, element) : [];
  } : function(element, className) {
    className = className.toString().strip();
    var elements = [], classNames = (/\s/.test(className) ? $w(className) : null);
    if (!classNames && !className) return elements;

    var nodes = $(element).getElementsByTagName('*');
    className = ' ' + className + ' ';

    for (var i = 0, child, cn; child = nodes[i]; i++) {
      if (child.className && (cn = ' ' + child.className + ' ') && (cn.include(className) ||
          (classNames && classNames.all(function(name) {
            return !name.toString().blank() && cn.include(' ' + name + ' ');
          }))))
        elements.push(Element.extend(child));
    }
    return elements;
  };

  return function(className, parentElement) {
    return $(parentElement || document.body).getElementsByClassName(className);
  };
}(Element.Methods);

/*--------------------------------------------------------------------------*/

Element.ClassNames = Class.create();
Element.ClassNames.prototype = {
  initialize: function(element) {
    this.element = $(element);
  },

  _each: function(iterator) {
    this.element.className.split(/\s+/).select(function(name) {
      return name.length > 0;
    })._each(iterator);
  },

  set: function(className) {
    this.element.className = className;
  },

  add: function(classNameToAdd) {
    if (this.include(classNameToAdd)) return;
    this.set($A(this).concat(classNameToAdd).join(' '));
  },

  remove: function(classNameToRemove) {
    if (!this.include(classNameToRemove)) return;
    this.set($A(this).without(classNameToRemove).join(' '));
  },

  toString: function() {
    return $A(this).join(' ');
  }
};

Object.extend(Element.ClassNames.prototype, Enumerable);

/*--------------------------------------------------------------------------*/

(function() {
  window.Selector = Class.create({
    initialize: function(expression) {
      this.expression = expression.strip();
    },

    findElements: function(rootElement) {
      return Prototype.Selector.select(this.expression, rootElement);
    },

    match: function(element) {
      return Prototype.Selector.match(element, this.expression);
    },

    toString: function() {
      return this.expression;
    },

    inspect: function() {
      return "#<Selector: " + this.expression + ">";
    }
  });

  Object.extend(Selector, {
    matchElements: Prototype.Selector.filter,

    findElement: function(elements, expression, index) {
      index = index || 0;
      var matchIndex = 0, element;
      for (var i = 0, length = elements.length; i < length; i++) {
        element = elements[i];
        if (Prototype.Selector.match(element, expression) && index === matchIndex++) {
          return Element.extend(element);
        }
      }
    },

    findChildElements: function(element, expressions) {
      var selector = expressions.toArray().join(', ');
      return Prototype.Selector.select(selector, element || document);
    }
  });
})();

String.prototype.parseColor = function() {
  var color = '#';
  if (this.slice(0,4) == 'rgb(') {
    var cols = this.slice(4,this.length-1).split(',');
    var i=0; do { color += parseInt(cols[i]).toColorPart() } while (++i<3);
  } else {
    if (this.slice(0,1) == '#') {
      if (this.length==4) for(var i=1;i<4;i++) color += (this.charAt(i) + this.charAt(i)).toLowerCase();
      if (this.length==7) color = this.toLowerCase();
    }
  }
  return (color.length==7 ? color : (arguments[0] || this));
};

/*--------------------------------------------------------------------------*/

Element.collectTextNodes = function(element) {
  return $A($(element).childNodes).collect( function(node) {
    return (node.nodeType==3 ? node.nodeValue :
      (node.hasChildNodes() ? Element.collectTextNodes(node) : ''));
  }).flatten().join('');
};

Element.collectTextNodesIgnoreClass = function(element, className) {
  return $A($(element).childNodes).collect( function(node) {
    return (node.nodeType==3 ? node.nodeValue :
      ((node.hasChildNodes() && !Element.hasClassName(node,className)) ?
        Element.collectTextNodesIgnoreClass(node, className) : ''));
  }).flatten().join('');
};

Element.setContentZoom = function(element, percent) {
  element = $(element);
  element.setStyle({fontSize: (percent/100) + 'em'});
  if (Prototype.Browser.WebKit) window.scrollBy(0,0);
  return element;
};

Element.getInlineOpacity = function(element){
  return $(element).style.opacity || '';
};

Element.forceRerendering = function(element) {
  try {
    element = $(element);
    var n = document.createTextNode(' ');
    element.appendChild(n);
    element.removeChild(n);
  } catch(e) { }
};

/*--------------------------------------------------------------------------*/

var Effect = {
  _elementDoesNotExistError: {
    name: 'ElementDoesNotExistError',
    message: 'The specified DOM element does not exist, but is required for this effect to operate'
  },
  Transitions: {
    linear: Prototype.K,
    sinoidal: function(pos) {
      return (-Math.cos(pos*Math.PI)/2) + .5;
    },
    reverse: function(pos) {
      return 1-pos;
    },
    flicker: function(pos) {
      var pos = ((-Math.cos(pos*Math.PI)/4) + .75) + Math.random()/4;
      return pos > 1 ? 1 : pos;
    },
    wobble: function(pos) {
      return (-Math.cos(pos*Math.PI*(9*pos))/2) + .5;
    },
    pulse: function(pos, pulses) {
      return (-Math.cos((pos*((pulses||5)-.5)*2)*Math.PI)/2) + .5;
    },
    spring: function(pos) {
      return 1 - (Math.cos(pos * 4.5 * Math.PI) * Math.exp(-pos * 6));
    },
    none: function(pos) {
      return 0;
    },
    full: function(pos) {
      return 1;
    }
  },
  DefaultOptions: {
    duration:   1.0,   // seconds
    fps:        100,   // 100= assume 66fps max.
    sync:       false, // true for combining
    from:       0.0,
    to:         1.0,
    delay:      0.0,
    queue:      'parallel'
  },
  tagifyText: function(element) {
    var tagifyStyle = 'position:relative';
    if (Prototype.Browser.IE) tagifyStyle += ';zoom:1';

    element = $(element);
    $A(element.childNodes).each( function(child) {
      if (child.nodeType==3) {
        child.nodeValue.toArray().each( function(character) {
          element.insertBefore(
            new Element('span', {style: tagifyStyle}).update(
              character == ' ' ? String.fromCharCode(160) : character),
              child);
        });
        Element.remove(child);
      }
    });
  },
  multiple: function(element, effect) {
    var elements;
    if (((typeof element == 'object') ||
        Object.isFunction(element)) &&
       (element.length))
      elements = element;
    else
      elements = $(element).childNodes;

    var options = Object.extend({
      speed: 0.1,
      delay: 0.0
    }, arguments[2] || { });
    var masterDelay = options.delay;

    $A(elements).each( function(element, index) {
      new effect(element, Object.extend(options, { delay: index * options.speed + masterDelay }));
    });
  },
  PAIRS: {
    'slide':  ['SlideDown','SlideUp'],
    'blind':  ['BlindDown','BlindUp'],
    'appear': ['Appear','Fade']
  },
  toggle: function(element, effect) {
    element = $(element);
    effect = (effect || 'appear').toLowerCase();
    var options = Object.extend({
      queue: { position:'end', scope:(element.id || 'global'), limit: 1 }
    }, arguments[2] || { });
    Effect[element.visible() ?
      Effect.PAIRS[effect][1] : Effect.PAIRS[effect][0]](element, options);
  }
};

Effect.DefaultOptions.transition = Effect.Transitions.sinoidal;

/* ------------- core effects ------------- */

Effect.ScopedQueue = Class.create(Enumerable, {
  initialize: function() {
    this.effects  = [];
    this.interval = null;
  },
  _each: function(iterator) {
    this.effects._each(iterator);
  },
  add: function(effect) {
    var timestamp = new Date().getTime();

    var position = Object.isString(effect.options.queue) ?
      effect.options.queue : effect.options.queue.position;

    switch(position) {
      case 'front':
        this.effects.findAll(function(e){ return e.state=='idle' }).each( function(e) {
            e.startOn  += effect.finishOn;
            e.finishOn += effect.finishOn;
          });
        break;
      case 'with-last':
        timestamp = this.effects.pluck('startOn').max() || timestamp;
        break;
      case 'end':
        timestamp = this.effects.pluck('finishOn').max() || timestamp;
        break;
    }

    effect.startOn  += timestamp;
    effect.finishOn += timestamp;

    if (!effect.options.queue.limit || (this.effects.length < effect.options.queue.limit))
      this.effects.push(effect);

    if (!this.interval)
      this.interval = setInterval(this.loop.bind(this), 15);
  },
  remove: function(effect) {
    this.effects = this.effects.reject(function(e) { return e==effect });
    if (this.effects.length == 0) {
      clearInterval(this.interval);
      this.interval = null;
    }
  },
  loop: function() {
    var timePos = new Date().getTime();
    for(var i=0, len=this.effects.length;i<len;i++)
      this.effects[i] && this.effects[i].loop(timePos);
  }
});

Effect.Queues = {
  instances: $H(),
  get: function(queueName) {
    if (!Object.isString(queueName)) return queueName;

    return this.instances.get(queueName) ||
      this.instances.set(queueName, new Effect.ScopedQueue());
  }
};
Effect.Queue = Effect.Queues.get('global');

Effect.Base = Class.create({
  position: null,
  start: function(options) {
    if (options && options.transition === false) options.transition = Effect.Transitions.linear;
    this.options      = Object.extend(Object.extend({ },Effect.DefaultOptions), options || { });
    this.currentFrame = 0;
    this.state        = 'idle';
    this.startOn      = this.options.delay*1000;
    this.finishOn     = this.startOn+(this.options.duration*1000);
    this.fromToDelta  = this.options.to-this.options.from;
    this.totalTime    = this.finishOn-this.startOn;
    this.totalFrames  = this.options.fps*this.options.duration;

    this.render = (function() {
      function dispatch(effect, eventName) {
        if (effect.options[eventName + 'Internal'])
          effect.options[eventName + 'Internal'](effect);
        if (effect.options[eventName])
          effect.options[eventName](effect);
      }

      return function(pos) {
        if (this.state === "idle") {
          this.state = "running";
          dispatch(this, 'beforeSetup');
          if (this.setup) this.setup();
          dispatch(this, 'afterSetup');
        }
        if (this.state === "running") {
          pos = (this.options.transition(pos) * this.fromToDelta) + this.options.from;
          this.position = pos;
          dispatch(this, 'beforeUpdate');
          if (this.update) this.update(pos);
          dispatch(this, 'afterUpdate');
        }
      };
    })();

    this.event('beforeStart');
    if (!this.options.sync)
      Effect.Queues.get(Object.isString(this.options.queue) ?
        'global' : this.options.queue.scope).add(this);
  },
  loop: function(timePos) {
    if (timePos >= this.startOn) {
      if (timePos >= this.finishOn) {
        this.render(1.0);
        this.cancel();
        this.event('beforeFinish');
        if (this.finish) this.finish();
        this.event('afterFinish');
        return;
      }
      var pos   = (timePos - this.startOn) / this.totalTime,
          frame = (pos * this.totalFrames).round();
      if (frame > this.currentFrame) {
        this.render(pos);
        this.currentFrame = frame;
      }
    }
  },
  cancel: function() {
    if (!this.options.sync)
      Effect.Queues.get(Object.isString(this.options.queue) ?
        'global' : this.options.queue.scope).remove(this);
    this.state = 'finished';
  },
  event: function(eventName) {
    if (this.options[eventName + 'Internal']) this.options[eventName + 'Internal'](this);
    if (this.options[eventName]) this.options[eventName](this);
  },
  inspect: function() {
    var data = $H();
    for(property in this)
      if (!Object.isFunction(this[property])) data.set(property, this[property]);
    return '#<Effect:' + data.inspect() + ',options:' + $H(this.options).inspect() + '>';
  }
});

Effect.Parallel = Class.create(Effect.Base, {
  initialize: function(effects) {
    this.effects = effects || [];
    this.start(arguments[1]);
  },
  update: function(position) {
    this.effects.invoke('render', position);
  },
  finish: function(position) {
    this.effects.each( function(effect) {
      effect.render(1.0);
      effect.cancel();
      effect.event('beforeFinish');
      if (effect.finish) effect.finish(position);
      effect.event('afterFinish');
    });
  }
});

Effect.Tween = Class.create(Effect.Base, {
  initialize: function(object, from, to) {
    object = Object.isString(object) ? $(object) : object;
    var args = $A(arguments), method = args.last(),
      options = args.length == 5 ? args[3] : null;
    this.method = Object.isFunction(method) ? method.bind(object) :
      Object.isFunction(object[method]) ? object[method].bind(object) :
      function(value) { object[method] = value };
    this.start(Object.extend({ from: from, to: to }, options || { }));
  },
  update: function(position) {
    this.method(position);
  }
});

Effect.Event = Class.create(Effect.Base, {
  initialize: function() {
    this.start(Object.extend({ duration: 0 }, arguments[0] || { }));
  },
  update: Prototype.emptyFunction
});

Effect.Opacity = Class.create(Effect.Base, {
  initialize: function(element) {
    this.element = $(element);
    if (!this.element) throw(Effect._elementDoesNotExistError);
    if (Prototype.Browser.IE && (!this.element.currentStyle.hasLayout))
      this.element.setStyle({zoom: 1});
    var options = Object.extend({
      from: this.element.getOpacity() || 0.0,
      to:   1.0
    }, arguments[1] || { });
    this.start(options);
  },
  update: function(position) {
    this.element.setOpacity(position);
  }
});

Effect.Move = Class.create(Effect.Base, {
  initialize: function(element) {
    this.element = $(element);
    if (!this.element) throw(Effect._elementDoesNotExistError);
    var options = Object.extend({
      x:    0,
      y:    0,
      mode: 'relative'
    }, arguments[1] || { });
    this.start(options);
  },
  setup: function() {
    this.element.makePositioned();
    this.originalLeft = parseFloat(this.element.getStyle('left') || '0');
    this.originalTop  = parseFloat(this.element.getStyle('top')  || '0');
    if (this.options.mode == 'absolute') {
      this.options.x = this.options.x - this.originalLeft;
      this.options.y = this.options.y - this.originalTop;
    }
  },
  update: function(position) {
    this.element.setStyle({
      left: (this.options.x  * position + this.originalLeft).round() + 'px',
      top:  (this.options.y  * position + this.originalTop).round()  + 'px'
    });
  }
});

Effect.MoveBy = function(element, toTop, toLeft) {
  return new Effect.Move(element,
    Object.extend({ x: toLeft, y: toTop }, arguments[3] || { }));
};

Effect.Scale = Class.create(Effect.Base, {
  initialize: function(element, percent) {
    this.element = $(element);
    if (!this.element) throw(Effect._elementDoesNotExistError);
    var options = Object.extend({
      scaleX: true,
      scaleY: true,
      scaleContent: true,
      scaleFromCenter: false,
      scaleMode: 'box',        // 'box' or 'contents' or { } with provided values
      scaleFrom: 100.0,
      scaleTo:   percent
    }, arguments[2] || { });
    this.start(options);
  },
  setup: function() {
    this.restoreAfterFinish = this.options.restoreAfterFinish || false;
    this.elementPositioning = this.element.getStyle('position');

    this.originalStyle = { };
    ['top','left','width','height','fontSize'].each( function(k) {
      this.originalStyle[k] = this.element.style[k];
    }.bind(this));

    this.originalTop  = this.element.offsetTop;
    this.originalLeft = this.element.offsetLeft;

    var fontSize = this.element.getStyle('font-size') || '100%';
    ['em','px','%','pt'].each( function(fontSizeType) {
      if (fontSize.indexOf(fontSizeType)>0) {
        this.fontSize     = parseFloat(fontSize);
        this.fontSizeType = fontSizeType;
      }
    }.bind(this));

    this.factor = (this.options.scaleTo - this.options.scaleFrom)/100;

    this.dims = null;
    if (this.options.scaleMode=='box')
      this.dims = [this.element.offsetHeight, this.element.offsetWidth];
    if (/^content/.test(this.options.scaleMode))
      this.dims = [this.element.scrollHeight, this.element.scrollWidth];
    if (!this.dims)
      this.dims = [this.options.scaleMode.originalHeight,
                   this.options.scaleMode.originalWidth];
  },
  update: function(position) {
    var currentScale = (this.options.scaleFrom/100.0) + (this.factor * position);
    if (this.options.scaleContent && this.fontSize)
      this.element.setStyle({fontSize: this.fontSize * currentScale + this.fontSizeType });
    this.setDimensions(this.dims[0] * currentScale, this.dims[1] * currentScale);
  },
  finish: function(position) {
    if (this.restoreAfterFinish) this.element.setStyle(this.originalStyle);
  },
  setDimensions: function(height, width) {
    var d = { };
    if (this.options.scaleX) d.width = width.round() + 'px';
    if (this.options.scaleY) d.height = height.round() + 'px';
    if (this.options.scaleFromCenter) {
      var topd  = (height - this.dims[0])/2;
      var leftd = (width  - this.dims[1])/2;
      if (this.elementPositioning == 'absolute') {
        if (this.options.scaleY) d.top = this.originalTop-topd + 'px';
        if (this.options.scaleX) d.left = this.originalLeft-leftd + 'px';
      } else {
        if (this.options.scaleY) d.top = -topd + 'px';
        if (this.options.scaleX) d.left = -leftd + 'px';
      }
    }
    this.element.setStyle(d);
  }
});

Effect.Highlight = Class.create(Effect.Base, {
  initialize: function(element) {
    this.element = $(element);
    if (!this.element) throw(Effect._elementDoesNotExistError);
    var options = Object.extend({ startcolor: '#ffff99' }, arguments[1] || { });
    this.start(options);
  },
  setup: function() {
    if (this.element.getStyle('display')=='none') { this.cancel(); return; }
    this.oldStyle = { };
    if (!this.options.keepBackgroundImage) {
      this.oldStyle.backgroundImage = this.element.getStyle('background-image');
      this.element.setStyle({backgroundImage: 'none'});
    }
    if (!this.options.endcolor)
      this.options.endcolor = this.element.getStyle('background-color').parseColor('#ffffff');
    if (!this.options.restorecolor)
      this.options.restorecolor = this.element.getStyle('background-color');
    this._base  = $R(0,2).map(function(i){ return parseInt(this.options.startcolor.slice(i*2+1,i*2+3),16) }.bind(this));
    this._delta = $R(0,2).map(function(i){ return parseInt(this.options.endcolor.slice(i*2+1,i*2+3),16)-this._base[i] }.bind(this));
  },
  update: function(position) {
    this.element.setStyle({backgroundColor: $R(0,2).inject('#',function(m,v,i){
      return m+((this._base[i]+(this._delta[i]*position)).round().toColorPart()); }.bind(this)) });
  },
  finish: function() {
    this.element.setStyle(Object.extend(this.oldStyle, {
      backgroundColor: this.options.restorecolor
    }));
  }
});

Effect.ScrollTo = function(element) {
  var options = arguments[1] || { },
  scrollOffsets = document.viewport.getScrollOffsets(),
  elementOffsets = $(element).cumulativeOffset();

  if (options.offset) elementOffsets[1] += options.offset;

  return new Effect.Tween(null,
    scrollOffsets.top,
    elementOffsets[1],
    options,
    function(p){ scrollTo(scrollOffsets.left, p.round()); }
  );
};

/* ------------- combination effects ------------- */

Effect.Fade = function(element) {
  element = $(element);
  var oldOpacity = element.getInlineOpacity();
  var options = Object.extend({
    from: element.getOpacity() || 1.0,
    to:   0.0,
    afterFinishInternal: function(effect) {
      if (effect.options.to!=0) return;
      effect.element.hide().setStyle({opacity: oldOpacity});
    }
  }, arguments[1] || { });
  return new Effect.Opacity(element,options);
};

Effect.Appear = function(element) {
  element = $(element);
  var options = Object.extend({
  from: (element.getStyle('display') == 'none' ? 0.0 : element.getOpacity() || 0.0),
  to:   1.0,
  afterFinishInternal: function(effect) {
    effect.element.forceRerendering();
  },
  beforeSetup: function(effect) {
    effect.element.setOpacity(effect.options.from).show();
  }}, arguments[1] || { });
  return new Effect.Opacity(element,options);
};

Effect.Puff = function(element) {
  element = $(element);
  var oldStyle = {
    opacity: element.getInlineOpacity(),
    position: element.getStyle('position'),
    top:  element.style.top,
    left: element.style.left,
    width: element.style.width,
    height: element.style.height
  };
  return new Effect.Parallel(
   [ new Effect.Scale(element, 200,
      { sync: true, scaleFromCenter: true, scaleContent: true, restoreAfterFinish: true }),
     new Effect.Opacity(element, { sync: true, to: 0.0 } ) ],
     Object.extend({ duration: 1.0,
      beforeSetupInternal: function(effect) {
        Position.absolutize(effect.effects[0].element);
      },
      afterFinishInternal: function(effect) {
         effect.effects[0].element.hide().setStyle(oldStyle); }
     }, arguments[1] || { })
   );
};

Effect.BlindUp = function(element) {
  element = $(element);
  element.makeClipping();
  return new Effect.Scale(element, 0,
    Object.extend({ scaleContent: false,
      scaleX: false,
      restoreAfterFinish: true,
      afterFinishInternal: function(effect) {
        effect.element.hide().undoClipping();
      }
    }, arguments[1] || { })
  );
};

Effect.BlindDown = function(element) {
  element = $(element);
  var elementDimensions = element.getDimensions();
  return new Effect.Scale(element, 100, Object.extend({
    scaleContent: false,
    scaleX: false,
    scaleFrom: 0,
    scaleMode: {originalHeight: elementDimensions.height, originalWidth: elementDimensions.width},
    restoreAfterFinish: true,
    afterSetup: function(effect) {
      effect.element.makeClipping().setStyle({height: '0px'}).show();
    },
    afterFinishInternal: function(effect) {
      effect.element.undoClipping();
    }
  }, arguments[1] || { }));
};

Effect.SwitchOff = function(element) {
  element = $(element);
  var oldOpacity = element.getInlineOpacity();
  return new Effect.Appear(element, Object.extend({
    duration: 0.4,
    from: 0,
    transition: Effect.Transitions.flicker,
    afterFinishInternal: function(effect) {
      new Effect.Scale(effect.element, 1, {
        duration: 0.3, scaleFromCenter: true,
        scaleX: false, scaleContent: false, restoreAfterFinish: true,
        beforeSetup: function(effect) {
          effect.element.makePositioned().makeClipping();
        },
        afterFinishInternal: function(effect) {
          effect.element.hide().undoClipping().undoPositioned().setStyle({opacity: oldOpacity});
        }
      });
    }
  }, arguments[1] || { }));
};

Effect.DropOut = function(element) {
  element = $(element);
  var oldStyle = {
    top: element.getStyle('top'),
    left: element.getStyle('left'),
    opacity: element.getInlineOpacity() };
  return new Effect.Parallel(
    [ new Effect.Move(element, {x: 0, y: 100, sync: true }),
      new Effect.Opacity(element, { sync: true, to: 0.0 }) ],
    Object.extend(
      { duration: 0.5,
        beforeSetup: function(effect) {
          effect.effects[0].element.makePositioned();
        },
        afterFinishInternal: function(effect) {
          effect.effects[0].element.hide().undoPositioned().setStyle(oldStyle);
        }
      }, arguments[1] || { }));
};

Effect.Shake = function(element) {
  element = $(element);
  var options = Object.extend({
    distance: 20,
    duration: 0.5
  }, arguments[1] || {});
  var distance = parseFloat(options.distance);
  var split = parseFloat(options.duration) / 10.0;
  var oldStyle = {
    top: element.getStyle('top'),
    left: element.getStyle('left') };
    return new Effect.Move(element,
      { x:  distance, y: 0, duration: split, afterFinishInternal: function(effect) {
    new Effect.Move(effect.element,
      { x: -distance*2, y: 0, duration: split*2,  afterFinishInternal: function(effect) {
    new Effect.Move(effect.element,
      { x:  distance*2, y: 0, duration: split*2,  afterFinishInternal: function(effect) {
    new Effect.Move(effect.element,
      { x: -distance*2, y: 0, duration: split*2,  afterFinishInternal: function(effect) {
    new Effect.Move(effect.element,
      { x:  distance*2, y: 0, duration: split*2,  afterFinishInternal: function(effect) {
    new Effect.Move(effect.element,
      { x: -distance, y: 0, duration: split, afterFinishInternal: function(effect) {
        effect.element.undoPositioned().setStyle(oldStyle);
  }}); }}); }}); }}); }}); }});
};

Effect.SlideDown = function(element) {
  element = $(element).cleanWhitespace();
  var oldInnerBottom = element.down().getStyle('bottom');
  var elementDimensions = element.getDimensions();
  return new Effect.Scale(element, 100, Object.extend({
    scaleContent: false,
    scaleX: false,
    scaleFrom: window.opera ? 0 : 1,
    scaleMode: {originalHeight: elementDimensions.height, originalWidth: elementDimensions.width},
    restoreAfterFinish: true,
    afterSetup: function(effect) {
      effect.element.makePositioned();
      effect.element.down().makePositioned();
      if (window.opera) effect.element.setStyle({top: ''});
      effect.element.makeClipping().setStyle({height: '0px'}).show();
    },
    afterUpdateInternal: function(effect) {
      effect.element.down().setStyle({bottom:
        (effect.dims[0] - effect.element.clientHeight) + 'px' });
    },
    afterFinishInternal: function(effect) {
      effect.element.undoClipping().undoPositioned();
      effect.element.down().undoPositioned().setStyle({bottom: oldInnerBottom}); }
    }, arguments[1] || { })
  );
};

Effect.SlideUp = function(element) {
  element = $(element).cleanWhitespace();
  var oldInnerBottom = element.down().getStyle('bottom');
  var elementDimensions = element.getDimensions();
  return new Effect.Scale(element, window.opera ? 0 : 1,
   Object.extend({ scaleContent: false,
    scaleX: false,
    scaleMode: 'box',
    scaleFrom: 100,
    scaleMode: {originalHeight: elementDimensions.height, originalWidth: elementDimensions.width},
    restoreAfterFinish: true,
    afterSetup: function(effect) {
      effect.element.makePositioned();
      effect.element.down().makePositioned();
      if (window.opera) effect.element.setStyle({top: ''});
      effect.element.makeClipping().show();
    },
    afterUpdateInternal: function(effect) {
      effect.element.down().setStyle({bottom:
        (effect.dims[0] - effect.element.clientHeight) + 'px' });
    },
    afterFinishInternal: function(effect) {
      effect.element.hide().undoClipping().undoPositioned();
      effect.element.down().undoPositioned().setStyle({bottom: oldInnerBottom});
    }
   }, arguments[1] || { })
  );
};

Effect.Squish = function(element) {
  return new Effect.Scale(element, window.opera ? 1 : 0, {
    restoreAfterFinish: true,
    beforeSetup: function(effect) {
      effect.element.makeClipping();
    },
    afterFinishInternal: function(effect) {
      effect.element.hide().undoClipping();
    }
  });
};

Effect.Grow = function(element) {
  element = $(element);
  var options = Object.extend({
    direction: 'center',
    moveTransition: Effect.Transitions.sinoidal,
    scaleTransition: Effect.Transitions.sinoidal,
    opacityTransition: Effect.Transitions.full
  }, arguments[1] || { });
  var oldStyle = {
    top: element.style.top,
    left: element.style.left,
    height: element.style.height,
    width: element.style.width,
    opacity: element.getInlineOpacity() };

  var dims = element.getDimensions();
  var initialMoveX, initialMoveY;
  var moveX, moveY;

  switch (options.direction) {
    case 'top-left':
      initialMoveX = initialMoveY = moveX = moveY = 0;
      break;
    case 'top-right':
      initialMoveX = dims.width;
      initialMoveY = moveY = 0;
      moveX = -dims.width;
      break;
    case 'bottom-left':
      initialMoveX = moveX = 0;
      initialMoveY = dims.height;
      moveY = -dims.height;
      break;
    case 'bottom-right':
      initialMoveX = dims.width;
      initialMoveY = dims.height;
      moveX = -dims.width;
      moveY = -dims.height;
      break;
    case 'center':
      initialMoveX = dims.width / 2;
      initialMoveY = dims.height / 2;
      moveX = -dims.width / 2;
      moveY = -dims.height / 2;
      break;
  }

  return new Effect.Move(element, {
    x: initialMoveX,
    y: initialMoveY,
    duration: 0.01,
    beforeSetup: function(effect) {
      effect.element.hide().makeClipping().makePositioned();
    },
    afterFinishInternal: function(effect) {
      new Effect.Parallel(
        [ new Effect.Opacity(effect.element, { sync: true, to: 1.0, from: 0.0, transition: options.opacityTransition }),
          new Effect.Move(effect.element, { x: moveX, y: moveY, sync: true, transition: options.moveTransition }),
          new Effect.Scale(effect.element, 100, {
            scaleMode: { originalHeight: dims.height, originalWidth: dims.width },
            sync: true, scaleFrom: window.opera ? 1 : 0, transition: options.scaleTransition, restoreAfterFinish: true})
        ], Object.extend({
             beforeSetup: function(effect) {
               effect.effects[0].element.setStyle({height: '0px'}).show();
             },
             afterFinishInternal: function(effect) {
               effect.effects[0].element.undoClipping().undoPositioned().setStyle(oldStyle);
             }
           }, options)
      );
    }
  });
};

Effect.Shrink = function(element) {
  element = $(element);
  var options = Object.extend({
    direction: 'center',
    moveTransition: Effect.Transitions.sinoidal,
    scaleTransition: Effect.Transitions.sinoidal,
    opacityTransition: Effect.Transitions.none
  }, arguments[1] || { });
  var oldStyle = {
    top: element.style.top,
    left: element.style.left,
    height: element.style.height,
    width: element.style.width,
    opacity: element.getInlineOpacity() };

  var dims = element.getDimensions();
  var moveX, moveY;

  switch (options.direction) {
    case 'top-left':
      moveX = moveY = 0;
      break;
    case 'top-right':
      moveX = dims.width;
      moveY = 0;
      break;
    case 'bottom-left':
      moveX = 0;
      moveY = dims.height;
      break;
    case 'bottom-right':
      moveX = dims.width;
      moveY = dims.height;
      break;
    case 'center':
      moveX = dims.width / 2;
      moveY = dims.height / 2;
      break;
  }

  return new Effect.Parallel(
    [ new Effect.Opacity(element, { sync: true, to: 0.0, from: 1.0, transition: options.opacityTransition }),
      new Effect.Scale(element, window.opera ? 1 : 0, { sync: true, transition: options.scaleTransition, restoreAfterFinish: true}),
      new Effect.Move(element, { x: moveX, y: moveY, sync: true, transition: options.moveTransition })
    ], Object.extend({
         beforeStartInternal: function(effect) {
           effect.effects[0].element.makePositioned().makeClipping();
         },
         afterFinishInternal: function(effect) {
           effect.effects[0].element.hide().undoClipping().undoPositioned().setStyle(oldStyle); }
       }, options)
  );
};

Effect.Pulsate = function(element) {
  element = $(element);
  var options    = arguments[1] || { },
    oldOpacity = element.getInlineOpacity(),
    transition = options.transition || Effect.Transitions.linear,
    reverser   = function(pos){
      return 1 - transition((-Math.cos((pos*(options.pulses||5)*2)*Math.PI)/2) + .5);
    };

  return new Effect.Opacity(element,
    Object.extend(Object.extend({  duration: 2.0, from: 0,
      afterFinishInternal: function(effect) { effect.element.setStyle({opacity: oldOpacity}); }
    }, options), {transition: reverser}));
};

Effect.Fold = function(element) {
  element = $(element);
  var oldStyle = {
    top: element.style.top,
    left: element.style.left,
    width: element.style.width,
    height: element.style.height };
  element.makeClipping();
  return new Effect.Scale(element, 5, Object.extend({
    scaleContent: false,
    scaleX: false,
    afterFinishInternal: function(effect) {
    new Effect.Scale(element, 1, {
      scaleContent: false,
      scaleY: false,
      afterFinishInternal: function(effect) {
        effect.element.hide().undoClipping().setStyle(oldStyle);
      } });
  }}, arguments[1] || { }));
};

Effect.Morph = Class.create(Effect.Base, {
  initialize: function(element) {
    this.element = $(element);
    if (!this.element) throw(Effect._elementDoesNotExistError);
    var options = Object.extend({
      style: { }
    }, arguments[1] || { });

    if (!Object.isString(options.style)) this.style = $H(options.style);
    else {
      if (options.style.include(':'))
        this.style = options.style.parseStyle();
      else {
        this.element.addClassName(options.style);
        this.style = $H(this.element.getStyles());
        this.element.removeClassName(options.style);
        var css = this.element.getStyles();
        this.style = this.style.reject(function(style) {
          return style.value == css[style.key];
        });
        options.afterFinishInternal = function(effect) {
          effect.element.addClassName(effect.options.style);
          effect.transforms.each(function(transform) {
            effect.element.style[transform.style] = '';
          });
        };
      }
    }
    this.start(options);
  },

  setup: function(){
    function parseColor(color){
      if (!color || ['rgba(0, 0, 0, 0)','transparent'].include(color)) color = '#ffffff';
      color = color.parseColor();
      return $R(0,2).map(function(i){
        return parseInt( color.slice(i*2+1,i*2+3), 16 );
      });
    }
    this.transforms = this.style.map(function(pair){
      var property = pair[0], value = pair[1], unit = null;

      if (value.parseColor('#zzzzzz') != '#zzzzzz') {
        value = value.parseColor();
        unit  = 'color';
      } else if (property == 'opacity') {
        value = parseFloat(value);
        if (Prototype.Browser.IE && (!this.element.currentStyle.hasLayout))
          this.element.setStyle({zoom: 1});
      } else if (Element.CSS_LENGTH.test(value)) {
          var components = value.match(/^([\+\-]?[0-9\.]+)(.*)$/);
          value = parseFloat(components[1]);
          unit = (components.length == 3) ? components[2] : null;
      }

      var originalValue = this.element.getStyle(property);
      return {
        style: property.camelize(),
        originalValue: unit=='color' ? parseColor(originalValue) : parseFloat(originalValue || 0),
        targetValue: unit=='color' ? parseColor(value) : value,
        unit: unit
      };
    }.bind(this)).reject(function(transform){
      return (
        (transform.originalValue == transform.targetValue) ||
        (
          transform.unit != 'color' &&
          (isNaN(transform.originalValue) || isNaN(transform.targetValue))
        )
      );
    });
  },
  update: function(position) {
    var style = { }, transform, i = this.transforms.length;
    while(i--)
      style[(transform = this.transforms[i]).style] =
        transform.unit=='color' ? '#'+
          (Math.round(transform.originalValue[0]+
            (transform.targetValue[0]-transform.originalValue[0])*position)).toColorPart() +
          (Math.round(transform.originalValue[1]+
            (transform.targetValue[1]-transform.originalValue[1])*position)).toColorPart() +
          (Math.round(transform.originalValue[2]+
            (transform.targetValue[2]-transform.originalValue[2])*position)).toColorPart() :
        (transform.originalValue +
          (transform.targetValue - transform.originalValue) * position).toFixed(3) +
            (transform.unit === null ? '' : transform.unit);
    this.element.setStyle(style, true);
  }
});

Effect.Transform = Class.create({
  initialize: function(tracks){
    this.tracks  = [];
    this.options = arguments[1] || { };
    this.addTracks(tracks);
  },
  addTracks: function(tracks){
    tracks.each(function(track){
      track = $H(track);
      var data = track.values().first();
      this.tracks.push($H({
        ids:     track.keys().first(),
        effect:  Effect.Morph,
        options: { style: data }
      }));
    }.bind(this));
    return this;
  },
  play: function(){
    return new Effect.Parallel(
      this.tracks.map(function(track){
        var ids = track.get('ids'), effect = track.get('effect'), options = track.get('options');
        var elements = [$(ids) || $$(ids)].flatten();
        return elements.map(function(e){ return new effect(e, Object.extend({ sync:true }, options)) });
      }).flatten(),
      this.options
    );
  }
});

Element.CSS_PROPERTIES = $w(
  'backgroundColor backgroundPosition borderBottomColor borderBottomStyle ' +
  'borderBottomWidth borderLeftColor borderLeftStyle borderLeftWidth ' +
  'borderRightColor borderRightStyle borderRightWidth borderSpacing ' +
  'borderTopColor borderTopStyle borderTopWidth bottom clip color ' +
  'fontSize fontWeight height left letterSpacing lineHeight ' +
  'marginBottom marginLeft marginRight marginTop markerOffset maxHeight '+
  'maxWidth minHeight minWidth opacity outlineColor outlineOffset ' +
  'outlineWidth paddingBottom paddingLeft paddingRight paddingTop ' +
  'right textIndent top width wordSpacing zIndex');

Element.CSS_LENGTH = /^(([\+\-]?[0-9\.]+)(em|ex|px|in|cm|mm|pt|pc|\%))|0$/;

String.__parseStyleElement = document.createElement('div');
String.prototype.parseStyle = function(){
  var style, styleRules = $H();
  if (Prototype.Browser.WebKit)
    style = new Element('div',{style:this}).style;
  else {
    String.__parseStyleElement.innerHTML = '<div style="' + this + '"></div>';
    style = String.__parseStyleElement.childNodes[0].style;
  }

  Element.CSS_PROPERTIES.each(function(property){
    if (style[property]) styleRules.set(property, style[property]);
  });

  if (Prototype.Browser.IE && this.include('opacity'))
    styleRules.set('opacity', this.match(/opacity:\s*((?:0|1)?(?:\.\d*)?)/)[1]);

  return styleRules;
};

if (document.defaultView && document.defaultView.getComputedStyle) {
  Element.getStyles = function(element) {
    var css = document.defaultView.getComputedStyle($(element), null);
    return Element.CSS_PROPERTIES.inject({ }, function(styles, property) {
      styles[property] = css[property];
      return styles;
    });
  };
} else {
  Element.getStyles = function(element) {
    element = $(element);
    var css = element.currentStyle, styles;
    styles = Element.CSS_PROPERTIES.inject({ }, function(results, property) {
      results[property] = css[property];
      return results;
    });
    if (!styles.opacity) styles.opacity = element.getOpacity();
    return styles;
  };
}

Effect.Methods = {
  morph: function(element, style) {
    element = $(element);
    new Effect.Morph(element, Object.extend({ style: style }, arguments[2] || { }));
    return element;
  },
  visualEffect: function(element, effect, options) {
    element = $(element);
    var s = effect.dasherize().camelize(), klass = s.charAt(0).toUpperCase() + s.substring(1);
    new Effect[klass](element, options);
    return element;
  },
  highlight: function(element, options) {
    element = $(element);
    new Effect.Highlight(element, options);
    return element;
  }
};

$w('fade appear grow shrink fold blindUp blindDown slideUp slideDown '+
  'pulsate shake puff squish switchOff dropOut').each(
  function(effect) {
    Effect.Methods[effect] = function(element, options){
      element = $(element);
      Effect[effect.charAt(0).toUpperCase() + effect.substring(1)](element, options);
      return element;
    };
  }
);

$w('getInlineOpacity forceRerendering setContentZoom collectTextNodes collectTextNodesIgnoreClass getStyles').each(
  function(f) { Effect.Methods[f] = Element[f]; }
);

Element.addMethods(Effect.Methods);

if(Object.isUndefined(Effect))
  throw("dragdrop.js requires including script.aculo.us' effects.js library");

var Droppables = {
  drops: [],

  remove: function(element) {
    this.drops = this.drops.reject(function(d) { return d.element==$(element) });
  },

  add: function(element) {
    element = $(element);
    var options = Object.extend({
      greedy:     true,
      hoverclass: null,
      tree:       false
    }, arguments[1] || { });

    if(options.containment) {
      options._containers = [];
      var containment = options.containment;
      if(Object.isArray(containment)) {
        containment.each( function(c) { options._containers.push($(c)) });
      } else {
        options._containers.push($(containment));
      }
    }

    if(options.accept) options.accept = [options.accept].flatten();

    Element.makePositioned(element); // fix IE
    options.element = element;

    this.drops.push(options);
  },

  findDeepestChild: function(drops) {
    deepest = drops[0];

    for (i = 1; i < drops.length; ++i)
      if (Element.isParent(drops[i].element, deepest.element))
        deepest = drops[i];

    return deepest;
  },

  isContained: function(element, drop) {
    var containmentNode;
    if(drop.tree) {
      containmentNode = element.treeNode;
    } else {
      containmentNode = element.parentNode;
    }
    return drop._containers.detect(function(c) { return containmentNode == c });
  },

  isAffected: function(point, element, drop) {
    return (
      (drop.element!=element) &&
      ((!drop._containers) ||
        this.isContained(element, drop)) &&
      ((!drop.accept) ||
        (Element.classNames(element).detect(
          function(v) { return drop.accept.include(v) } ) )) &&
      Position.within(drop.element, point[0], point[1]) );
  },

  deactivate: function(drop) {
    if(drop.hoverclass)
      Element.removeClassName(drop.element, drop.hoverclass);
    this.last_active = null;
  },

  activate: function(drop) {
    if(drop.hoverclass)
      Element.addClassName(drop.element, drop.hoverclass);
    this.last_active = drop;
  },

  show: function(point, element) {
    if(!this.drops.length) return;
    var drop, affected = [];

    this.drops.each( function(drop) {
      if(Droppables.isAffected(point, element, drop))
        affected.push(drop);
    });

    if(affected.length>0)
      drop = Droppables.findDeepestChild(affected);

    if(this.last_active && this.last_active != drop) this.deactivate(this.last_active);
    if (drop) {
      Position.within(drop.element, point[0], point[1]);
      if(drop.onHover)
        drop.onHover(element, drop.element, Position.overlap(drop.overlap, drop.element));

      if (drop != this.last_active) Droppables.activate(drop);
    }
  },

  fire: function(event, element) {
    if(!this.last_active) return;
    Position.prepare();

    if (this.isAffected([Event.pointerX(event), Event.pointerY(event)], element, this.last_active))
      if (this.last_active.onDrop) {
        this.last_active.onDrop(element, this.last_active.element, event);
        return true;
      }
  },

  reset: function() {
    if(this.last_active)
      this.deactivate(this.last_active);
  }
};

var Draggables = {
  drags: [],
  observers: [],

  register: function(draggable) {
    if(this.drags.length == 0) {
      this.eventMouseUp   = this.endDrag.bindAsEventListener(this);
      this.eventMouseMove = this.updateDrag.bindAsEventListener(this);
      this.eventKeypress  = this.keyPress.bindAsEventListener(this);

      Event.observe(document, "mouseup", this.eventMouseUp);
      Event.observe(document, "mousemove", this.eventMouseMove);
      Event.observe(document, "keypress", this.eventKeypress);
    }
    this.drags.push(draggable);
  },

  unregister: function(draggable) {
    this.drags = this.drags.reject(function(d) { return d==draggable });
    if(this.drags.length == 0) {
      Event.stopObserving(document, "mouseup", this.eventMouseUp);
      Event.stopObserving(document, "mousemove", this.eventMouseMove);
      Event.stopObserving(document, "keypress", this.eventKeypress);
    }
  },

  activate: function(draggable) {
    if(draggable.options.delay) {
      this._timeout = setTimeout(function() {
        Draggables._timeout = null;
        window.focus();
        Draggables.activeDraggable = draggable;
      }.bind(this), draggable.options.delay);
    } else {
      window.focus(); // allows keypress events if window isn't currently focused, fails for Safari
      this.activeDraggable = draggable;
    }
  },

  deactivate: function() {
    this.activeDraggable = null;
  },

  updateDrag: function(event) {
    if(!this.activeDraggable) return;
    var pointer = [Event.pointerX(event), Event.pointerY(event)];
    if(this._lastPointer && (this._lastPointer.inspect() == pointer.inspect())) return;
    this._lastPointer = pointer;

    this.activeDraggable.updateDrag(event, pointer);
  },

  endDrag: function(event) {
    if(this._timeout) {
      clearTimeout(this._timeout);
      this._timeout = null;
    }
    if(!this.activeDraggable) return;
    this._lastPointer = null;
    this.activeDraggable.endDrag(event);
    this.activeDraggable = null;
  },

  keyPress: function(event) {
    if(this.activeDraggable)
      this.activeDraggable.keyPress(event);
  },

  addObserver: function(observer) {
    this.observers.push(observer);
    this._cacheObserverCallbacks();
  },

  removeObserver: function(element) {  // element instead of observer fixes mem leaks
    this.observers = this.observers.reject( function(o) { return o.element==element });
    this._cacheObserverCallbacks();
  },

  notify: function(eventName, draggable, event) {  // 'onStart', 'onEnd', 'onDrag'
    if(this[eventName+'Count'] > 0)
      this.observers.each( function(o) {
        if(o[eventName]) o[eventName](eventName, draggable, event);
      });
    if(draggable.options[eventName]) draggable.options[eventName](draggable, event);
  },

  _cacheObserverCallbacks: function() {
    ['onStart','onEnd','onDrag'].each( function(eventName) {
      Draggables[eventName+'Count'] = Draggables.observers.select(
        function(o) { return o[eventName]; }
      ).length;
    });
  }
};

/*--------------------------------------------------------------------------*/

var Draggable = Class.create({
  initialize: function(element) {
    var defaults = {
      handle: false,
      reverteffect: function(element, top_offset, left_offset) {
        var dur = Math.sqrt(Math.abs(top_offset^2)+Math.abs(left_offset^2))*0.02;
        new Effect.Move(element, { x: -left_offset, y: -top_offset, duration: dur,
          queue: {scope:'_draggable', position:'end'}
        });
      },
      endeffect: function(element) {
        var toOpacity = Object.isNumber(element._opacity) ? element._opacity : 1.0;
        new Effect.Opacity(element, {duration:0.2, from:0.7, to:toOpacity,
          queue: {scope:'_draggable', position:'end'},
          afterFinish: function(){
            Draggable._dragging[element] = false
          }
        });
      },
      zindex: 1000,
      revert: false,
      quiet: false,
      scroll: false,
      scrollSensitivity: 20,
      scrollSpeed: 15,
      snap: false,  // false, or xy or [x,y] or function(x,y){ return [x,y] }
      delay: 0
    };

    if(!arguments[1] || Object.isUndefined(arguments[1].endeffect))
      Object.extend(defaults, {
        starteffect: function(element) {
          element._opacity = Element.getOpacity(element);
          Draggable._dragging[element] = true;
          new Effect.Opacity(element, {duration:0.2, from:element._opacity, to:0.7});
        }
      });

    var options = Object.extend(defaults, arguments[1] || { });

    this.element = $(element);

    if(options.handle && Object.isString(options.handle))
      this.handle = this.element.down('.'+options.handle, 0);

    if(!this.handle) this.handle = $(options.handle);
    if(!this.handle) this.handle = this.element;

    if(options.scroll && !options.scroll.scrollTo && !options.scroll.outerHTML) {
      options.scroll = $(options.scroll);
      this._isScrollChild = Element.childOf(this.element, options.scroll);
    }

    Element.makePositioned(this.element); // fix IE

    this.options  = options;
    this.dragging = false;

    this.eventMouseDown = this.initDrag.bindAsEventListener(this);
    Event.observe(this.handle, "mousedown", this.eventMouseDown);

    Draggables.register(this);
  },

  destroy: function() {
    Event.stopObserving(this.handle, "mousedown", this.eventMouseDown);
    Draggables.unregister(this);
  },

  currentDelta: function() {
    return([
      parseInt(Element.getStyle(this.element,'left') || '0'),
      parseInt(Element.getStyle(this.element,'top') || '0')]);
  },

  initDrag: function(event) {
    if(!Object.isUndefined(Draggable._dragging[this.element]) &&
      Draggable._dragging[this.element]) return;
    if(Event.isLeftClick(event)) {
      var src = Event.element(event);
      if((tag_name = src.tagName.toUpperCase()) && (
        tag_name=='INPUT' ||
        tag_name=='SELECT' ||
        tag_name=='OPTION' ||
        tag_name=='BUTTON' ||
        tag_name=='TEXTAREA')) return;

      var pointer = [Event.pointerX(event), Event.pointerY(event)];
      var pos     = Position.cumulativeOffset(this.element);
      this.offset = [0,1].map( function(i) { return (pointer[i] - pos[i]) });

      Draggables.activate(this);
      Event.stop(event);
    }
  },

  startDrag: function(event) {
    this.dragging = true;
    if(!this.delta)
      this.delta = this.currentDelta();

    if(this.options.zindex) {
      this.originalZ = parseInt(Element.getStyle(this.element,'z-index') || 0);
      this.element.style.zIndex = this.options.zindex;
    }

    if(this.options.ghosting) {
      this._clone = this.element.cloneNode(true);
      this._originallyAbsolute = (this.element.getStyle('position') == 'absolute');
      if (!this._originallyAbsolute)
        Position.absolutize(this.element);
      this.element.parentNode.insertBefore(this._clone, this.element);
    }

    if(this.options.scroll) {
      if (this.options.scroll == window) {
        var where = this._getWindowScroll(this.options.scroll);
        this.originalScrollLeft = where.left;
        this.originalScrollTop = where.top;
      } else {
        this.originalScrollLeft = this.options.scroll.scrollLeft;
        this.originalScrollTop = this.options.scroll.scrollTop;
      }
    }

    Draggables.notify('onStart', this, event);

    if(this.options.starteffect) this.options.starteffect(this.element);
  },

  updateDrag: function(event, pointer) {
    if(!this.dragging) this.startDrag(event);

    if(!this.options.quiet){
      Position.prepare();
      Droppables.show(pointer, this.element);
    }

    Draggables.notify('onDrag', this, event);

    this.draw(pointer);
    if(this.options.change) this.options.change(this);

    if(this.options.scroll) {
      this.stopScrolling();

      var p;
      if (this.options.scroll == window) {
        with(this._getWindowScroll(this.options.scroll)) { p = [ left, top, left+width, top+height ]; }
      } else {
        p = Position.page(this.options.scroll);
        p[0] += this.options.scroll.scrollLeft + Position.deltaX;
        p[1] += this.options.scroll.scrollTop + Position.deltaY;
        p.push(p[0]+this.options.scroll.offsetWidth);
        p.push(p[1]+this.options.scroll.offsetHeight);
      }
      var speed = [0,0];
      if(pointer[0] < (p[0]+this.options.scrollSensitivity)) speed[0] = pointer[0]-(p[0]+this.options.scrollSensitivity);
      if(pointer[1] < (p[1]+this.options.scrollSensitivity)) speed[1] = pointer[1]-(p[1]+this.options.scrollSensitivity);
      if(pointer[0] > (p[2]-this.options.scrollSensitivity)) speed[0] = pointer[0]-(p[2]-this.options.scrollSensitivity);
      if(pointer[1] > (p[3]-this.options.scrollSensitivity)) speed[1] = pointer[1]-(p[3]-this.options.scrollSensitivity);
      this.startScrolling(speed);
    }

    if(Prototype.Browser.WebKit) window.scrollBy(0,0);

    Event.stop(event);
  },

  finishDrag: function(event, success) {
    this.dragging = false;

    if(this.options.quiet){
      Position.prepare();
      var pointer = [Event.pointerX(event), Event.pointerY(event)];
      Droppables.show(pointer, this.element);
    }

    if(this.options.ghosting) {
      if (!this._originallyAbsolute)
        Position.relativize(this.element);
      delete this._originallyAbsolute;
      Element.remove(this._clone);
      this._clone = null;
    }

    var dropped = false;
    if(success) {
      dropped = Droppables.fire(event, this.element);
      if (!dropped) dropped = false;
    }
    if(dropped && this.options.onDropped) this.options.onDropped(this.element);
    Draggables.notify('onEnd', this, event);

    var revert = this.options.revert;
    if(revert && Object.isFunction(revert)) revert = revert(this.element);

    var d = this.currentDelta();
    if(revert && this.options.reverteffect) {
      if (dropped == 0 || revert != 'failure')
        this.options.reverteffect(this.element,
          d[1]-this.delta[1], d[0]-this.delta[0]);
    } else {
      this.delta = d;
    }

    if(this.options.zindex)
      this.element.style.zIndex = this.originalZ;

    if(this.options.endeffect)
      this.options.endeffect(this.element);

    Draggables.deactivate(this);
    Droppables.reset();
  },

  keyPress: function(event) {
    if(event.keyCode!=Event.KEY_ESC) return;
    this.finishDrag(event, false);
    Event.stop(event);
  },

  endDrag: function(event) {
    if(!this.dragging) return;
    this.stopScrolling();
    this.finishDrag(event, true);
    Event.stop(event);
  },

  draw: function(point) {
    var pos = Position.cumulativeOffset(this.element);
    if(this.options.ghosting) {
      var r   = Position.realOffset(this.element);
      pos[0] += r[0] - Position.deltaX; pos[1] += r[1] - Position.deltaY;
    }

    var d = this.currentDelta();
    pos[0] -= d[0]; pos[1] -= d[1];

    if(this.options.scroll && (this.options.scroll != window && this._isScrollChild)) {
      pos[0] -= this.options.scroll.scrollLeft-this.originalScrollLeft;
      pos[1] -= this.options.scroll.scrollTop-this.originalScrollTop;
    }

    var p = [0,1].map(function(i){
      return (point[i]-pos[i]-this.offset[i])
    }.bind(this));

    if(this.options.snap) {
      if(Object.isFunction(this.options.snap)) {
        p = this.options.snap(p[0],p[1],this);
      } else {
      if(Object.isArray(this.options.snap)) {
        p = p.map( function(v, i) {
          return (v/this.options.snap[i]).round()*this.options.snap[i] }.bind(this));
      } else {
        p = p.map( function(v) {
          return (v/this.options.snap).round()*this.options.snap }.bind(this));
      }
    }}

    var style = this.element.style;
    if((!this.options.constraint) || (this.options.constraint=='horizontal'))
      style.left = p[0] + "px";
    if((!this.options.constraint) || (this.options.constraint=='vertical'))
      style.top  = p[1] + "px";

    if(style.visibility=="hidden") style.visibility = ""; // fix gecko rendering
  },

  stopScrolling: function() {
    if(this.scrollInterval) {
      clearInterval(this.scrollInterval);
      this.scrollInterval = null;
      Draggables._lastScrollPointer = null;
    }
  },

  startScrolling: function(speed) {
    if(!(speed[0] || speed[1])) return;
    this.scrollSpeed = [speed[0]*this.options.scrollSpeed,speed[1]*this.options.scrollSpeed];
    this.lastScrolled = new Date();
    this.scrollInterval = setInterval(this.scroll.bind(this), 10);
  },

  scroll: function() {
    var current = new Date();
    var delta = current - this.lastScrolled;
    this.lastScrolled = current;
    if(this.options.scroll == window) {
      with (this._getWindowScroll(this.options.scroll)) {
        if (this.scrollSpeed[0] || this.scrollSpeed[1]) {
          var d = delta / 1000;
          this.options.scroll.scrollTo( left + d*this.scrollSpeed[0], top + d*this.scrollSpeed[1] );
        }
      }
    } else {
      this.options.scroll.scrollLeft += this.scrollSpeed[0] * delta / 1000;
      this.options.scroll.scrollTop  += this.scrollSpeed[1] * delta / 1000;
    }

    Position.prepare();
    Droppables.show(Draggables._lastPointer, this.element);
    Draggables.notify('onDrag', this);
    if (this._isScrollChild) {
      Draggables._lastScrollPointer = Draggables._lastScrollPointer || $A(Draggables._lastPointer);
      Draggables._lastScrollPointer[0] += this.scrollSpeed[0] * delta / 1000;
      Draggables._lastScrollPointer[1] += this.scrollSpeed[1] * delta / 1000;
      if (Draggables._lastScrollPointer[0] < 0)
        Draggables._lastScrollPointer[0] = 0;
      if (Draggables._lastScrollPointer[1] < 0)
        Draggables._lastScrollPointer[1] = 0;
      this.draw(Draggables._lastScrollPointer);
    }

    if(this.options.change) this.options.change(this);
  },

  _getWindowScroll: function(w) {
    var T, L, W, H;
    with (w.document) {
      if (w.document.documentElement && documentElement.scrollTop) {
        T = documentElement.scrollTop;
        L = documentElement.scrollLeft;
      } else if (w.document.body) {
        T = body.scrollTop;
        L = body.scrollLeft;
      }
      if (w.innerWidth) {
        W = w.innerWidth;
        H = w.innerHeight;
      } else if (w.document.documentElement && documentElement.clientWidth) {
        W = documentElement.clientWidth;
        H = documentElement.clientHeight;
      } else {
        W = body.offsetWidth;
        H = body.offsetHeight;
      }
    }
    return { top: T, left: L, width: W, height: H };
  }
});

Draggable._dragging = { };

/*--------------------------------------------------------------------------*/

var SortableObserver = Class.create({
  initialize: function(element, observer) {
    this.element   = $(element);
    this.observer  = observer;
    this.lastValue = Sortable.serialize(this.element);
  },

  onStart: function() {
    this.lastValue = Sortable.serialize(this.element);
  },

  onEnd: function() {
    Sortable.unmark();
    if(this.lastValue != Sortable.serialize(this.element))
      this.observer(this.element)
  }
});

var Sortable = {
  SERIALIZE_RULE: /^[^_\-](?:[A-Za-z0-9\-\_]*)[_](.*)$/,

  sortables: { },

  _findRootElement: function(element) {
    while (element.tagName.toUpperCase() != "BODY") {
      if(element.id && Sortable.sortables[element.id]) return element;
      element = element.parentNode;
    }
  },

  options: function(element) {
    element = Sortable._findRootElement($(element));
    if(!element) return;
    return Sortable.sortables[element.id];
  },

  destroy: function(element){
    element = $(element);
    var s = Sortable.sortables[element.id];

    if(s) {
      Draggables.removeObserver(s.element);
      s.droppables.each(function(d){ Droppables.remove(d) });
      s.draggables.invoke('destroy');

      delete Sortable.sortables[s.element.id];
    }
  },

  create: function(element) {
    element = $(element);
    var options = Object.extend({
      element:     element,
      tag:         'li',       // assumes li children, override with tag: 'tagname'
      dropOnEmpty: false,
      tree:        false,
      treeTag:     'ul',
      overlap:     'vertical', // one of 'vertical', 'horizontal'
      constraint:  'vertical', // one of 'vertical', 'horizontal', false
      containment: element,    // also takes array of elements (or id's); or false
      handle:      false,      // or a CSS class
      only:        false,
      delay:       0,
      hoverclass:  null,
      ghosting:    false,
      quiet:       false,
      scroll:      false,
      scrollSensitivity: 20,
      scrollSpeed: 15,
      format:      this.SERIALIZE_RULE,

      elements:    false,
      handles:     false,

      onChange:    Prototype.emptyFunction,
      onUpdate:    Prototype.emptyFunction
    }, arguments[1] || { });

    this.destroy(element);

    var options_for_draggable = {
      revert:      true,
      quiet:       options.quiet,
      scroll:      options.scroll,
      scrollSpeed: options.scrollSpeed,
      scrollSensitivity: options.scrollSensitivity,
      delay:       options.delay,
      ghosting:    options.ghosting,
      constraint:  options.constraint,
      handle:      options.handle };

    if(options.starteffect)
      options_for_draggable.starteffect = options.starteffect;

    if(options.reverteffect)
      options_for_draggable.reverteffect = options.reverteffect;
    else
      if(options.ghosting) options_for_draggable.reverteffect = function(element) {
        element.style.top  = 0;
        element.style.left = 0;
      };

    if(options.endeffect)
      options_for_draggable.endeffect = options.endeffect;

    if(options.zindex)
      options_for_draggable.zindex = options.zindex;

    var options_for_droppable = {
      overlap:     options.overlap,
      containment: options.containment,
      tree:        options.tree,
      hoverclass:  options.hoverclass,
      onHover:     Sortable.onHover
    };

    var options_for_tree = {
      onHover:      Sortable.onEmptyHover,
      overlap:      options.overlap,
      containment:  options.containment,
      hoverclass:   options.hoverclass
    };

    Element.cleanWhitespace(element);

    options.draggables = [];
    options.droppables = [];

    if(options.dropOnEmpty || options.tree) {
      Droppables.add(element, options_for_tree);
      options.droppables.push(element);
    }

    (options.elements || this.findElements(element, options) || []).each( function(e,i) {
      var handle = options.handles ? $(options.handles[i]) :
        (options.handle ? $(e).select('.' + options.handle)[0] : e);
      options.draggables.push(
        new Draggable(e, Object.extend(options_for_draggable, { handle: handle })));
      Droppables.add(e, options_for_droppable);
      if(options.tree) e.treeNode = element;
      options.droppables.push(e);
    });

    if(options.tree) {
      (Sortable.findTreeElements(element, options) || []).each( function(e) {
        Droppables.add(e, options_for_tree);
        e.treeNode = element;
        options.droppables.push(e);
      });
    }

    this.sortables[element.id] = options;

    Draggables.addObserver(new SortableObserver(element, options.onUpdate));

  },

  findElements: function(element, options) {
    return Element.findChildren(
      element, options.only, options.tree ? true : false, options.tag);
  },

  findTreeElements: function(element, options) {
    return Element.findChildren(
      element, options.only, options.tree ? true : false, options.treeTag);
  },

  onHover: function(element, dropon, overlap) {
    if(Element.isParent(dropon, element)) return;

    if(overlap > .33 && overlap < .66 && Sortable.options(dropon).tree) {
      return;
    } else if(overlap>0.5) {
      Sortable.mark(dropon, 'before');
      if(dropon.previousSibling != element) {
        var oldParentNode = element.parentNode;
        element.style.visibility = "hidden"; // fix gecko rendering
        dropon.parentNode.insertBefore(element, dropon);
        if(dropon.parentNode!=oldParentNode)
          Sortable.options(oldParentNode).onChange(element);
        Sortable.options(dropon.parentNode).onChange(element);
      }
    } else {
      Sortable.mark(dropon, 'after');
      var nextElement = dropon.nextSibling || null;
      if(nextElement != element) {
        var oldParentNode = element.parentNode;
        element.style.visibility = "hidden"; // fix gecko rendering
        dropon.parentNode.insertBefore(element, nextElement);
        if(dropon.parentNode!=oldParentNode)
          Sortable.options(oldParentNode).onChange(element);
        Sortable.options(dropon.parentNode).onChange(element);
      }
    }
  },

  onEmptyHover: function(element, dropon, overlap) {
    var oldParentNode = element.parentNode;
    var droponOptions = Sortable.options(dropon);

    if(!Element.isParent(dropon, element)) {
      var index;

      var children = Sortable.findElements(dropon, {tag: droponOptions.tag, only: droponOptions.only});
      var child = null;

      if(children) {
        var offset = Element.offsetSize(dropon, droponOptions.overlap) * (1.0 - overlap);

        for (index = 0; index < children.length; index += 1) {
          if (offset - Element.offsetSize (children[index], droponOptions.overlap) >= 0) {
            offset -= Element.offsetSize (children[index], droponOptions.overlap);
          } else if (offset - (Element.offsetSize (children[index], droponOptions.overlap) / 2) >= 0) {
            child = index + 1 < children.length ? children[index + 1] : null;
            break;
          } else {
            child = children[index];
            break;
          }
        }
      }

      dropon.insertBefore(element, child);

      Sortable.options(oldParentNode).onChange(element);
      droponOptions.onChange(element);
    }
  },

  unmark: function() {
    if(Sortable._marker) Sortable._marker.hide();
  },

  mark: function(dropon, position) {
    var sortable = Sortable.options(dropon.parentNode);
    if(sortable && !sortable.ghosting) return;

    if(!Sortable._marker) {
      Sortable._marker =
        ($('dropmarker') || Element.extend(document.createElement('DIV'))).
          hide().addClassName('dropmarker').setStyle({position:'absolute'});
      document.getElementsByTagName("body").item(0).appendChild(Sortable._marker);
    }
    var offsets = Position.cumulativeOffset(dropon);
    Sortable._marker.setStyle({left: offsets[0]+'px', top: offsets[1] + 'px'});

    if(position=='after')
      if(sortable.overlap == 'horizontal')
        Sortable._marker.setStyle({left: (offsets[0]+dropon.clientWidth) + 'px'});
      else
        Sortable._marker.setStyle({top: (offsets[1]+dropon.clientHeight) + 'px'});

    Sortable._marker.show();
  },

  _tree: function(element, options, parent) {
    var children = Sortable.findElements(element, options) || [];

    for (var i = 0; i < children.length; ++i) {
      var match = children[i].id.match(options.format);

      if (!match) continue;

      var child = {
        id: encodeURIComponent(match ? match[1] : null),
        element: element,
        parent: parent,
        children: [],
        position: parent.children.length,
        container: $(children[i]).down(options.treeTag)
      };

      /* Get the element containing the children and recurse over it */
      if (child.container)
        this._tree(child.container, options, child);

      parent.children.push (child);
    }

    return parent;
  },

  tree: function(element) {
    element = $(element);
    var sortableOptions = this.options(element);
    var options = Object.extend({
      tag: sortableOptions.tag,
      treeTag: sortableOptions.treeTag,
      only: sortableOptions.only,
      name: element.id,
      format: sortableOptions.format
    }, arguments[1] || { });

    var root = {
      id: null,
      parent: null,
      children: [],
      container: element,
      position: 0
    };

    return Sortable._tree(element, options, root);
  },

  /* Construct a [i] index for a particular node */
  _constructIndex: function(node) {
    var index = '';
    do {
      if (node.id) index = '[' + node.position + ']' + index;
    } while ((node = node.parent) != null);
    return index;
  },

  sequence: function(element) {
    element = $(element);
    var options = Object.extend(this.options(element), arguments[1] || { });

    return $(this.findElements(element, options) || []).map( function(item) {
      return item.id.match(options.format) ? item.id.match(options.format)[1] : '';
    });
  },

  setSequence: function(element, new_sequence) {
    element = $(element);
    var options = Object.extend(this.options(element), arguments[2] || { });

    var nodeMap = { };
    this.findElements(element, options).each( function(n) {
        if (n.id.match(options.format))
            nodeMap[n.id.match(options.format)[1]] = [n, n.parentNode];
        n.parentNode.removeChild(n);
    });

    new_sequence.each(function(ident) {
      var n = nodeMap[ident];
      if (n) {
        n[1].appendChild(n[0]);
        delete nodeMap[ident];
      }
    });
  },

  serialize: function(element) {
    element = $(element);
    var options = Object.extend(Sortable.options(element), arguments[1] || { });
    var name = encodeURIComponent(
      (arguments[1] && arguments[1].name) ? arguments[1].name : element.id);

    if (options.tree) {
      return Sortable.tree(element, arguments[1]).children.map( function (item) {
        return [name + Sortable._constructIndex(item) + "[id]=" +
                encodeURIComponent(item.id)].concat(item.children.map(arguments.callee));
      }).flatten().join('&');
    } else {
      return Sortable.sequence(element, arguments[1]).map( function(item) {
        return name + "[]=" + encodeURIComponent(item);
      }).join('&');
    }
  }
};

Element.isParent = function(child, element) {
  if (!child.parentNode || child == element) return false;
  if (child.parentNode == element) return true;
  return Element.isParent(child.parentNode, element);
};

Element.findChildren = function(element, only, recursive, tagName) {
  if(!element.hasChildNodes()) return null;
  tagName = tagName.toUpperCase();
  if(only) only = [only].flatten();
  var elements = [];
  $A(element.childNodes).each( function(e) {
    if(e.tagName && e.tagName.toUpperCase()==tagName &&
      (!only || (Element.classNames(e).detect(function(v) { return only.include(v) }))))
        elements.push(e);
    if(recursive) {
      var grandchildren = Element.findChildren(e, only, recursive, tagName);
      if(grandchildren) elements.push(grandchildren);
    }
  });

  return (elements.length>0 ? elements.flatten() : []);
};

Element.offsetSize = function (element, type) {
  return element['offset' + ((type=='vertical' || type=='height') ? 'Height' : 'Width')];
};

document.observe("dom:loaded", function() {
  if (!$(document.body).hasClassName("identity_validation")) return;

  var valid = {}, username, password, confirmation, request;
  var form = $(document.body).down("form.identity_form");
  var originalUsername = $F("username");

  function get(id) {
    if ($(id)) return $F(id);
  }

  function validateElement(element) {
    element.up(".validated_field").
      removeClassName("invalid").
      addClassName("valid");
    valid[element.id] = true;
  }

  function invalidateElement(element, message) {
    var field = element.up(".validated_field");
    field.removeClassName("valid").
      addClassName("invalid");
    field.down("p.error").update(message);
    valid[element.id] = false;
  }

  function resetElement(element) {
    var field = element.up(".validated_field");
    field.removeClassName("valid").
      removeClassName("invalid");
    field.down("p.error").update("");
    valid[element.id] = false;
  }

  function getErrorForFirstName() {
    if (!$('first_name').getValue().length) {
      return form.readAttribute('data-first-name-required');
    }
  }

  function getErrorForUsername() {
    username = $("username").getValue().strip().gsub(/\s+/, " ");
    if (username.length < 3) {
      return form.readAttribute('data-username-too-short');
    }
  }

  function checkUsernameAvailability() {
    new Ajax.Request("/id/identities/availability", {
      parameters: { username: username, first_name: get("first_name"), last_name: get("last_name") },
      method:     "get",
      evalJSON:   true,
      onComplete: function(transport) {
        var result = transport.responseJSON;
        if (originalUsername.length && result.username == originalUsername) return;
        if (result && result.username == username && username && !result.available) {
          var message = form.readAttribute('data-username-unavailable');
          if ($("username_suggestions")) message += "<br />" + form.readAttribute('data-try-another-username');
          invalidateElement($("username"), message);
          suggestUsernames(result.suggestions);
        }
      }
    });
  }

  function suggestUsernames(suggestions) {
    if (!$("username_suggestions")) return;
    if (suggestions && suggestions.length) {
      $("username_suggestions").show().down("ul").update(
        suggestions.map(function(suggestedUsername) {
          var escapedUsername = suggestedUsername.escapeHTML();
          return "<li><a href=# data='" + escapedUsername +
            "'>" + escapedUsername + "</a></li>";
        }).join("")
      );
    } else {
      hideUsernameSuggestions();
    }
  }

  function hideUsernameSuggestions() {
    if (!$("username_suggestions")) return;
    $("username_suggestions").hide();
  }

  function getErrorForPassword() {
    password = $("password").getValue();
    if (password.length < 6) {
      return form.readAttribute('data-password-too-short');
    } else if (password == "password") {
      return form.readAttribute('data-password-not-password');
    } else if (username && username.length && password == username) {
      return form.readAttribute('data-password-same-as-username');
    }
  }

  function getErrorForPasswordConfirmation() {
    confirmation = $("password_confirmation").getValue();
    if (confirmation.length && confirmation != password)  {
      return form.readAttribute('data-password-mismatch');
    } else if (confirmation.length < 6) {
      return form.readAttribute('data-password-too-short');
    }
  }

  function performInteractiveValidationFor(element, validator, existingValue) {
    var value = element.getValue();
    if (element.getValue() == existingValue) return;

    if (!value.length || validator()) {
      resetElement(element);
    } else {
      validateElement(element);
    }
  }

  function performValidationFor(element, validator, complainAboutBlankValues) {
    var message = (validator || Prototype.K)(), value = element.getValue();

    if (!value.length) {
      if (complainAboutBlankValues) {
        invalidateElement(element, message);
      } else {
        resetElement(element);
      }
      return false;
    } else if (message) {
      invalidateElement(element, message);
      return false;
    } else {
      validateElement(element);
      return true;
    }
  }

  function dummifyElement(element) {
    if (element.hasClassName("dummy")) {
      element.setValue("                      ").writeAttribute("data-dummy", "true");
    }
  }

  function undummifyElement(element) {
    if (element.readAttribute("data-dummy")) {
      element.setValue("").writeAttribute("data-dummy", null);
    }
  }

  function dummify() {
    if (!$F("password") && !$F("password_confirmation")) {
      dummifyElement($("password"));
      dummifyElement($("password_confirmation"));
    }
  }

  function undummify() {
    undummifyElement($("password"));
    undummifyElement($("password_confirmation"));
  }

  $("first_name").observe("keyup", function(event) {
    resetElement(this);
  });

  $("first_name").observe("blur", function(event) {
    performValidationFor(this, getErrorForFirstName);
  });

  $("username").observe("keyup", function(event) {
    hideUsernameSuggestions();
    resetElement(this);
  });

  $("username").observe("blur", function(event) {
    hideUsernameSuggestions();
    if (performValidationFor(this, getErrorForUsername)) {
      checkUsernameAvailability();
    }
  });

  $("password").observe("focus", function(event) {
    undummify();
  });

  $("password").observe("keyup", function(event) {
    performInteractiveValidationFor(this, getErrorForPassword, password);
  });

  $("password").observe("blur", function(event) {
    performValidationFor(this, getErrorForPassword);
    dummify();
  });

  $("password_confirmation").observe("focus", function(event) {
    undummify();
  });

  $("password_confirmation").observe("keyup", function(event) {
    if (event.keyCode != Event.KEY_RETURN) {
      performInteractiveValidationFor(this, getErrorForPasswordConfirmation);
    }
  });

  $("password_confirmation").observe("blur", function(event) {
    performValidationFor(this, getErrorForPasswordConfirmation);
    dummify();
  });

  form.observe("click", function(event) {
    var element = event.findElement(".username_suggestions a[data]");
    if (element) {
      username = element.readAttribute("data");
      $("username").setValue(username);
      validateElement($("username"));
      hideUsernameSuggestions();
      checkUsernameAvailability();
      $("password").focus();
      event.stop();
    }
  });

  form.observe("submit", function(event) {
    performValidationFor($("first_name"), getErrorForFirstName, true);
    performValidationFor($("username"), getErrorForUsername, true);

    if ($("password").hasClassName("dummy")) {
      undummify();
      valid.password = valid.password_confirmation = true;
    } else {
      performValidationFor($("password"), getErrorForPassword, true);
      performValidationFor($("password_confirmation"), getErrorForPasswordConfirmation, true);
    }

    if (!valid.first_name || !valid.username || !valid.password || !valid.password_confirmation) {
      event.stop();
    }
  });

  dummify();

  if ($("username").hasClassName("autofocus")) {
    (function() { $("username").focus() }).defer();
  }
});
Element.addMethods({
  trace: function(element, expression) {
    element = $(element);
    if (element.match(expression)) return element;
    return element.up(expression);
  }
});
Element.addMethods({
  upwards: function(element, iterator) {
    while (element = $(element)) {
      if (element.URL !== undefined) return;
      if (iterator(element)) return element;
      element = element.parentNode;
    }
  }
});

var HoverObserver = Class.create({
  initialize: function(element, options) {
    this.element = $(element);
    this.options = Object.extend(Object.clone(HoverObserver.Options), options || {});
    this.start();
  },

  start: function() {
    if (!this.observers) {
      var events = $w(this.options.clickToHover ? "click" : "mouseover mouseout");
      this.observers = events.map(function(name) {
        var handler = this["on" + name.capitalize()].bind(this);
        this.element.observe(name, handler);
        return { name: name, handler: handler };
      }.bind(this));
    }
  },

  stop: function() {
    if (this.observers) {
      this.observers.each(function(info) {
        this.element.stopObserving(info.name, info.handler);
      }.bind(this));
      delete this.observers;
    }
  },

  onClick: function(event) {
    var element   = this.activeHoverElement = event.findElement();
    var container = this.getContainerForElement(element);

    if (container) {
      if (this.activeContainer && container == this.activeContainer)
        return this.deactivateContainer();
      this.activateContainer(container);
    }
  },

  onMouseover: function(event) {
    var element   = this.activeHoverElement = event.findElement();
    var container = this.getContainerForElement(element);

    if (container) {
      if (this.activeContainer) {
        this.activateContainer(container);
      } else {
        this.startDelayedActivation(container);
      }
    } else {
      this.startDelayedDeactivation();
    }
  },

  onMouseout: function(event) {
    delete this.activeHoverElement;
    this.startDelayedDeactivation();
  },

  activateContainer: function(container) {
    var memo = { toElement: container };
    this.stopDelayedDeactivation();

    if (this.activeContainer) {
      if (this.activeContainer == container) return;
      memo.fromElement = this.activeContainer;
      this.deactivateContainer(memo);
    }

    this.activeContainer = container;
    this.activeContainer.fire(this.options.activationEvent, memo);
    this.activeContainer.addClassName(this.options.activeClassName);
  },

  deactivateContainer: function(memo) {
    if (this.activeContainer) {
      try {
        this.activeContainer.removeClassName(this.options.activeClassName);
        this.activeContainer.fire(this.options.deactivationEvent, memo);
      } catch (e) {
      }

      delete this.activeContainer;
    }
  },

  startDelayedActivation: function(container) {
    if (this.options.activationDelay) {
      (function() {
        if (container == this.getContainerForElement(this.activeHoverElement))
          this.activateContainer(container);

      }).bind(this).delay(this.options.activationDelay);
    } else {
      this.activateContainer(container);
    }
  },

  startDelayedDeactivation: function() {
    if (this.options.deactivationDelay) {
      this.deactivationTimeout = this.deactivationTimeout || function() {
        var container = this.getContainerForElement(this.activeHoverElement);
        if (!container || container != this.activeContainer)
          this.deactivateContainer();

      }.bind(this).delay(this.options.deactivationDelay);
    } else {
      this.deactivateContainer();
    }
  },

  stopDelayedDeactivation: function() {
    if (this.deactivationTimeout) {
      window.clearTimeout(this.deactivationTimeout);
      delete this.deactivationTimeout;
    }
  },

  getContainerForElement: function(element) {
    if (!element) return;
    if (element.hasAttribute && !element.hasAttribute(this.options.containerAttribute)) {
      var target    = this.getTargetForElement(element);
      var container = this.getContainerForTarget(target);
      this.cacheContainerFromElementToTarget(container, element, target);
    }

    return $(element.readAttribute(this.options.containerAttribute));
  },

  getTargetForElement: function(element) {
    if (!element) return;
    return element.trace("." + this.options.targetClassName);
  },

  getContainerForTarget: function(element) {
    if (!element) return;
    var containerClassName = this.options.containerClassName,
        containerAttribute = this.options.containerAttribute,
        expression = "[" + containerAttribute + "], ." + containerClassName;

    var container = (element.hasClassName(containerClassName)) ? element : element.trace(expression);

    if (container && container.hasAttribute(containerAttribute)) {
      return $(container.readAttribute(containerAttribute));
    } else {
      return container;
    }
  },

  cacheContainerFromElementToTarget: function(container, element, target) {
    if (container && target) {
      element.upwards(function(e) {
        e.writeAttribute(this.options.containerAttribute, container.identify());
        if (e == target) return true;
      }.bind(this));
    }
  }
});

Object.extend(HoverObserver, {
  Options: {
    activationDelay:    0,
    deactivationDelay:  0.5,
    targetClassName:    "hover_target",
    containerClassName: "hover_container",
    containerAttribute: "hover_container",
    activeClassName:    "hover",
    activationEvent:    "hover:activated",
    deactivationEvent:  "hover:deactivated",
    clickToHover:       false
  }
});

var Cookie = {
  get: function(name) {
    var cookie = document.cookie.match(new RegExp('(^|;)\\s*' + escape(name) + '=([^;\\s]*)'));
    return (cookie ? unescape(cookie[2]) : null);
  },

  set: function(name, value, daysToExpire) {
    var attrs = '; path=/';
    if (daysToExpire != undefined) {
      var d = new Date();
      d.setTime(d.getTime() + (86400000 * parseFloat(daysToExpire)));
      attrs += '; expires=' + d.toGMTString();
    }
    return (document.cookie = encodeURIComponent(name) + '=' + encodeURIComponent(value || '') + attrs);
  },

  remove: function(name) {
    var cookie = Cookie.get(name) || true;
    Cookie.set(name, '', -1);
    return cookie;
  }
};

var Launchbar = {
  initialize: function() {
    $(document.body).addClassName("with_launchbar");
    new HoverObserver("launchbar", {
      activationDelay: 0.5,
      regionClassName: "hover_container"
    });
  },

  selectCurrent: function(application, name) {
    var app_id  = 'launchbar_app_' + application;
    var link_id = 'launchbar_link_' + application + '_' + name;

    if ($(app_id)) $(app_id).addClassName('on');

    if ($(link_id)) {
      $(link_id).addClassName('current_account');
      if ($(app_id)) $(app_id).innerHTML += ": " + $(link_id).innerHTML;
      $(link_id).innerHTML = "&bull; " + $(link_id).innerHTML;
    }
  },

  rememberLocation: function() {
    var daysToExpire = 0.125; // 3 hours
    Cookie.set("return_to", window.location.href, daysToExpire);
  }
};

document.observe("dom:loaded", function() {
  if ($("launchbar")) {
    Launchbar.initialize();
    Launchbar.rememberLocation();
  }
});
(function() {
  var focusInHandler = function(e) { e.findElement().fire("focus:in") };
  var focusOutHandler = function(e) { e.findElement().fire("focus:out") };

  if (document.addEventListener && !Prototype.Browser.IE) {
    document.addEventListener("focus", focusInHandler, true);
    document.addEventListener("blur", focusOutHandler, true);
  } else {
    document.observe("focusin", focusInHandler);
    document.observe("focusout", focusOutHandler);
  }
})();

var Placeholder = {
  supported: function() {
    var i = document.createElement('input');
    return 'placeholder' in i;
  },

  reset: function(input) {
    input.value = input.readAttribute('placeholder');
    input.addClassName('placeholder');
  },

  setup: function(input) {
    Placeholder.reset(input);
  },

  teardown: function(input) {
    Placeholder.focus(input);
  },

  clear: function(input) {
    input.value = '';
    input.removeClassName('placeholder');
  },

  focus: function(input) {
    if (input.hasClassName('placeholder') &&
        input.value == input.readAttribute('placeholder'))
      Placeholder.clear(input);
  },

  blur: function(input) {
    if (input.value.blank())
      Placeholder.reset(input)
  }
};

document.observe('dom:loaded', function() {
  if (!Placeholder.supported()) {
    $$('input[placeholder]').each(Placeholder.reset);

    $(document.body).observe('focus:in', function(event) {
      var input = event.findElement('input[placeholder]');
      if (input) Placeholder.focus(input);
    });

    $(document.body).observe('focus:out', function(event) {
      var input = event.findElement('input[placeholder]');
      if (input) Placeholder.blur(input);
    });

    $(document.body).observe('submit', function(event) {
      event.element().select('input[placeholder]').each(Placeholder.teardown);
    });
  }
});

Placeholder.Overlay = {
  wrap: function(input) {
    if (!input)
      return $$('input.overlayable').each(Placeholder.Overlay.wrap);

    input = $(input);

    if (input.overlay) return;
    input.overlay = true;

    var wrapper = new Element('span', { 'class': 'overlay_wrapper' });
    input.parentNode.replaceChild(wrapper, input);
    wrapper.appendChild(input);

    input.label = new Element('label', { 'for': input.id, 'class': 'overlabel' });
    input.label.update(input.title);
    input.insert({ before: input.label });

    Placeholder.Overlay.reset(input);
  },

  reset: function(input) {
    if (input.value.blank())
      input.label.show();
    else
      input.label.hide();
  },

  focus: function(input) {
    if (input.value.blank())
      input.label.addClassName('focus');
  },

  blur: function(input) {
    if (input.value.blank()) {
      input.label.removeClassName('focus');
      input.label.show();
    }
  }
};

document.observe('dom:loaded', function() {
  document.observe('focus:in', function(event) {
    var input = event.findElement('.overlayable');
    if (input) Placeholder.Overlay.focus(input);
  });

  document.observe('focus:out', function(event) {
    var input = event.findElement('.overlayable');
    if (input) Placeholder.Overlay.blur(input);
  });

  document.observe('keypress', function(event) {
    if (event.keyCode == Event.KEY_TAB) return;
    var input = event.findElement('.overlayable');
    if (input) input.label.hide();
  });

  document.observe('paste', function(event) {
    var input = event.findElement('.overlayable');
    if (input) input.label.hide();
  });

  Placeholder.Overlay.wrap();

  $$('input.overlayable[autocomplete=on]').each(function(input) {
    Placeholder.Overlay.reset(input);

    new Form.Element.Observer(input, 0.2, function() {
      Placeholder.Overlay.reset(input);
    });
  });
});

var AvatarUploader = Class.create({
  initialize: function(input, path, options) {
    this.input = input;
    this.path = path;
    this.beforeUpload = options['beforeUpload'];
    this.observe();
  },

  observe: function() {
    var self = this;
    this.input.observe('change', function() {
      self.upload();
    });
  },

  reset: function() {
    var container = this.input.up();
    container.innerHTML = container.innerHTML;
    this.input = container.down('input[type=file]');
    this.observe();
  },

  upload: function() {
    if (this.beforeUpload) this.beforeUpload();
    this.input.up('form').submit();
    this.reset();
  }
});

var AvatarPreviewer = {
  init: function(element, path) {
    this.element = element;

    new AvatarUploader(element.down('input[type=file]'), path, {
      beforeUpload: this.uploadStart.bind(this)
    });

    element.down('[data-behavior~=remove_avatar]').observe('click',
      this.removeAvatar.bind(this)
    );
  },

  uploadStart: function() {
    this.element.className = 'busy';
  },

  uploadComplete: function(url, key) {
    $('avatar_key').value = key;
    this.element.down('div.photo').insert(new Element('img', { src: url }));
    this.element.className = 'complete';
  },

  removeAvatar: function(event) {
    event.stop();
    $('avatar_key').value = '';
    this.element.down('div.photo').clear();
    this.element.className = '';
  }
};

document.observe('dom:loaded', function() {
  var element = $$('[data-behavior~=avatar_previewer]')[0];
  if (element) AvatarPreviewer.init(element, '/id/avatar_previews');
});

document.observe('dom:loaded', function() {
  var zoneMap = {
    "10": "Hawaii",
     "9": "Alaska",
     "8": "Pacific Time (US & Canada)",
     "7": "Mountain Time (US & Canada)",
     "6": "Central Time (US & Canada)",
     "5": "Eastern Time (US & Canada)",
     "4": "Atlantic Time (Canada)",
     "3": "Greenland",
     "2": "Mid-Atlantic",
     "1": "Azores",
     "0": "UTC",
    "-1": "Amsterdam",
    "-2": "Athens",
    "-3": "Moscow",
    "-4": "Muscat",
    "-5": "Ekaterinburg",
    "-6": "Almaty",
    "-7": "Bangkok",
    "-8": "Beijing",
    "-9": "Tokyo",
   "-10": "Brisbane",
   "-11": "Magadan",
   "-12": "Auckland",
   "-13": "Nuku'alofa"
  };

  function getTimezone() {
    var today  = new Date();
    var winter = new Date(today.getFullYear(), 0, 1);
    var summer = new Date(today.getFullYear(), 6, 1);
    var offset = Math.max(winter.getTimezoneOffset(), summer.getTimezoneOffset()) / 60;

    return zoneMap[offset];
  }

  if ($(document.body).hasClassName('rsvp')) {
    var element = $$('[data-behavior~=time_zone_detection]')[0];
    if (!element) return;

    var timezone = getTimezone();
    if (timezone) {
      element.hide();
      element.select('option').each(function(option) {
        option.selected = (option.readAttribute('value') == timezone);
      });
    }
  }
});


var MenuObserver = Class.create({
  initialize: function(region, options) {
    this.region  = $(region);
    this.options = options;
    this.registerObservers();
    this.start();
  },

  registerObservers: function() {
    var startEvent, endEvent;

    if (Prototype.BrowserFeatures.Multitouch) {
      startEvent = "touchstart", endEvent = "touchend";
    } else {
      startEvent = "mousedown", endEvent = "mouseup";
    }

    $(document.body).observe("mousedown", this.onDocumentMouseDown.bind(this));
    this.region.observe(startEvent, this.onRegionMouseDown.bind(this));
    this.region.observe(endEvent, this.onRegionMouseUp.bind(this));
    this.region.observe("click", this.onRegionClick.bind(this));
    this.region.observe("mouseover", this.onRegionMouseOver.bind(this));
    this.region.observe("mouseout", this.onRegionMouseOut.bind(this));
    this.region.observe("keydown", this.onRegionKeyDown.bind(this));
    this.region.observe("menu:deactivate", this.deactivate.bind(this));
  },

  start: function() {
    this.started = true;
  },

  stop: function() {
    this.started = false;
  },

  onDocumentMouseDown: function(event) {
    if (!this.started || !this.activeContainer) return;

    var element = event.findElement();
    if (!this.elementBelongsToActiveContainer(element)) {
      this.dismiss();
    }
  },

  onRegionMouseDown: function(event) {
    if (!this.started) return;

    var element = event.findElement();
    if (!this.elementBelongsToActiveContainer(element)) {
      if (!this.dismiss()) return;
    }

    var target = this.findTargetForElement(element);
    if (target) {
      var container = this.findContainerForElement(target);
      if (container == this.activeContainer) {
        this.dismiss();
      } else {
        this.activate(container);
      }
      event.stop();
    }
  },

  onRegionMouseUp: function(event) {
    if (!this.started || !this.activeContainer || this.isIgnorable(event)) return;

    var element = event.findElement();
    if (this.elementBelongsToActiveContainer(element)) {
      var action = this.findActionForElement(element);
      if (action) {
        this.select(action);
        this.deactivate();
        event.stop();
      }
    }
  },

  onRegionClick: function(event) {
    if (!this.started || this.isIgnorable(event)) return;

    var element = event.findElement();
    var provision = this.findProvisionForElement(element);

    if (provision && provision.match("a[href='#']")) {
      event.stop();
    }
  },

  onRegionMouseOver: function(event) {
    var element = event.findElement("[data-menuaction]");
    if (element) element.addClassName("hover");
  },

  onRegionMouseOut: function(event) {
    var element = event.findElement("[data-menuaction]");
    if (element) element.removeClassName("hover");
  },

  onRegionKeyDown: function(event) {
    if (!this.started) return;

    if (event.keyCode == Event.KEY_ESC) {
      this.dismiss();
      event.stop();
    }
  },

  activate: function(container) {
    if (container) {
      var event = container.fire("menu:prepared", {
        container: this.activeContainer
      });

      if (!event.stopped) {
        this.finishDeactivation();
        this.activeContainer = container;
        this.activeContainer.addClassName("active_menu");
        this.activeContent = this.findContentForContainer(container);
        this.activeContent.show();
        this.activeContainer.fire("menu:activated");
      }
    }
  },

  deactivate: function() {
    if (this.activeContainer) {
      var container = this.activeContainer;
      var content = this.activeContent;
      this.activeContainer = this.activeContent = false;

      this.deactivation = {
        container: container,
        content: content
      };

      try {
        this.deactivation.effect = new Effect.Fade(content, {
          duration: 0.2,
          afterFinish: this.finishDeactivation.bind(this)
        });
      } catch (x) {
        this.finishDeactivation();
      }
    }
  },

  finishDeactivation: function() {
    if (this.deactivation) {
      try {
	      this.deactivation.container.removeClassName("active_menu");
	      this.deactivation.container.fire("menu:deactivated");
	      if (this.deactivation.effect) this.deactivation.effect.cancel();
	      this.deactivation.content.setStyle({opacity: ''}).hide();
      } catch (x) {
      } finally {
	      this.deactivation = false;
      }
    }
  },

  dismiss: function() {
    if (!this.activeContainerIsModal()) {
      this.deactivate();
      return true;
    }
  },

  select: function(action) {
    if (this.activeContainer) {
      var actionName  = action.readAttribute("data-menuaction");
      var actionValue = action.readAttribute("data-menuvalue");

      action.fire("menu:selected", {
        container: this.activeContainer,
        action:    actionName,
        value:     actionValue
      });
    }
  },

  isIgnorable: function(event) {
    return event.button > 1 || event.ctrlKey || event.metaKey;
  },

  elementBelongsToActiveContainer: function(element) {
    if (this.activeContainer) {
      return this.findContainerForElement(element) == this.activeContainer;
    }
  },

  elementsBelongToSameContainer: function(first, second) {
    var firstContainer  = this.findContainerForElement(first);
    var secondContainer = this.findContainerForElement(second);
    return firstContainer == secondContainer;
  },

  findTargetForElement: function(element) {
    var target = element.trace(".menu_target");
    if (this.elementsBelongToSameContainer(element, target)) return target;
  },

  findActionForElement: function(element) {
    var action = element.trace("[data-menuaction]");
    if (this.elementsBelongToSameContainer(element, action)) return action;
  },

  findProvisionForElement: function(element) {
    var provision = element.trace(".menu_target, .menu_content, [data-menuaction]");
    if (this.elementsBelongToSameContainer(element, provision)) return provision;
  },

  findContainerForElement: function(element) {
    if (!element) return;

    var parent = element.trace(".menu_content, .menu_container");
    if (!parent) return;

    if (parent == this.activeContent) {
      return this.activeContainer;
    } else if (parent.hasClassName("menu_content")) {
      return parent.trace(".menu_container");
    } else {
      return parent;
    }
  },

  findContentForContainer: function(container) {
    var id = container.readAttribute("data-menucontent");
    if (id) {
      return $(id);
    } else {
      return container.down(".menu_content");
    }
  },

  activeContainerIsModal: function() {
    return this.activeContainer && this.activeContainer.hasClassName("modal");
  }
});
document.observe("keypress", function(event) {
  var textarea = event.findElement("textarea.submits_on_return");
  if (textarea && event.keyCode == Event.KEY_RETURN && !event.shiftKey) {
    var form = textarea.up("form");
    form.onsubmit ? form.onsubmit() : form.submit();
    event.stop();
  }
});

document.observe("dom:loaded", function() {
  var button;

  $(document.body).observe("mousedown", function(event) {
    var element = event.findElement("button.image_button");
    if (element) {
      button = element;
      button.addClassName("pressed");
      event.stop();
    }
  });

  $(document.body).observe("mouseup", function(event) {
    if (button) {
      var element = event.findElement("button.image_button");
      if (!element) {
        event.stop();
      }
      button.removeClassName("pressed");
      button = null;
    }
  });

  $(document.body).observe("mouseover", function(event) {
    if (button) {
      var element = event.findElement("button.image_button");
      if (element) {
        button.addClassName("pressed");
      } else {
        button.removeClassName("pressed");
      }
    }
  });
});
var SelectAllCheckbox = Class.create({
  initialize: function(aggregator, container, options) {
    options = options || {}
    this.aggregator = $(aggregator);
    this.container  = container ? $(container) : this.aggregator.up("form");
    this.minimum = options.minimum || 0;
    this.updateAggregator(true);

    this.container.observe("click", function(event) {
      var element = event.findElement("input[type=checkbox]");
      if (element) this.onCheckboxClicked(event, element);
    }.bind(this));
  },

  onCheckboxClicked: function(event, element) {
    if (element == this.aggregator) {
      this.setAllCheckboxes(element.checked);
    } else {
      this.updateAggregator();
    }
  },

  getCheckboxes: function() {
    return this.checkboxes = this.checkboxes ||
      this.container.select("input[type=checkbox]").without(this.aggregator);
  },

  updateAggregator: function(initialUpdate) {
    var length = this.getCheckboxes().length;
    if (length >= this.minimum) {
      var value = this.getAggregateValue();
      if ((initialUpdate) || (!value)) {
        this.aggregator.checked = value;
      }
    }
  },

  getAggregateValue: function() {
    return this.getCheckboxes().all(function(element) { return element.checked });
  },

  setAllCheckboxes: function(value) {
    this.getCheckboxes().each(function(element) { element.checked = value });
  }
});
Element.addMethods({
  autofocus: function(element, options) {
    var field;
    element = $(element);
    options = options || {};

    if (options.firstBlankElement) {
      field = element.select(".autofocus").find(function(candidate) {
        return candidate.getValue().blank();
      });
    }

    if (!field) {
      field = element.down(".autofocus");
    }

    if (field) {
      (function() { try { field.focus() } catch (e) { } }).defer();
    }

    return element;
  }
});
Element.addMethods({
  getMargins: function(element) {
    element = $(element);
    return {
      top:    parseInt(element.getStyle("margin-top")),
      right:  parseInt(element.getStyle("margin-right")),
      bottom: parseInt(element.getStyle("margin-bottom")),
      left:   parseInt(element.getStyle("margin-left"))
    };
  },

  getBounds: function(element) {
    element = $(element);
    var offset = element.cumulativeOffset()
    var top = parseInt(offset.top), left = parseInt(offset.left);
    var dimensions = element.getDimensions();

    return {
      top:    top,
      right:  left + dimensions.width,
      bottom: top + dimensions.height,
      left:   left,
      width:  dimensions.width,
      height: dimensions.height
    };
  },

  getOffsetRelativeToElement: function(element, otherElement, position) {
    element = $(element), otherElement = $(otherElement);
    var bounds = element.getBounds(), otherBounds = otherElement.getBounds();

    position = (position || "top left").strip().split(" ");
    var x = position[1], y = position[0];
    var left = otherBounds.left, top = otherBounds.top;

    switch (x) {
      case "right":  left += otherBounds.width - bounds.width; break;
      case "center": left += parseInt((otherBounds.width / 2) - (bounds.width / 2));
    }

    switch (y) {
      case "bottom": top += otherBounds.height - bounds.height; break;
      case "center": top += parseInt((otherBounds.height / 2) - (bounds.height / 2));
    }

    return {
      top: top, left: left
    }
  },

  positionInViewportAt: function(element, offset) {
    element = $(element);
    var margin = element.getMargins();
    var dimensions = element.getDimensions();

    var bottom = offset.top + dimensions.height + margin.bottom;
    var right = offset.left + dimensions.width + margin.right;

    var viewportOffset = document.viewport.getScrollOffsets();
    var viewportDimensions = document.viewport.getDimensions();
    var viewportBottom = viewportOffset.top + viewportDimensions.height;
    var viewportRight = viewportOffset.left + viewportDimensions.width;

    if (bottom > viewportBottom)
      offset.top = viewportBottom - dimensions.height - margin.top - margin.bottom;
    if (right > viewportRight)
      offset.left = viewportRight - dimensions.width - margin.left - margin.right;

    document.body.appendChild(element);
    element.setStyle({ position: "absolute", top: offset.top + "px", left: offset.left + "px" });
    return element;
  }
});
Element.addMethods({
  slideIntoView: function(element, options) {
    element = $(element), options = options || {};

    var effect;
    var top = element.cumulativeOffset()[1], height = element.getHeight(), bottom = top + height;
    var viewTop = document.viewport.getScrollOffsets().top, viewHeight = document.viewport.getHeight(),
        viewBottom = viewTop + viewHeight;

    if (top <= viewTop) {
      effect = new Effect.ScrollTo(element, Object.extend({ duration: 0.15 }, options));
    } else if (bottom > viewBottom) {
      effect = new Effect.ScrollTo(element, Object.extend({ duration: 0.15, offset: height - viewHeight }, options));
    }

    if (options.sync) return effect;
    return element;
  }
});
Effect.Height = Class.create();
Object.extend(Effect.Height.prototype, Effect.Base.prototype);
Object.extend(Effect.Height.prototype, {
  initialize: function(element, options) {
    this.element = $(element);
    options = Object.extend({
      from: this.element.getHeight(),
      to: 0
    }, options || {});
    this.start(options);
  },

  setup: function() {
    this.setHeight(this.options.from);
  },

  update: function(position) {
    this.setHeight(position);
  },

  finish: function() {
    this.setHeight(this.options.to);
  },

  setHeight: function(height) {
    this.element.style.height = parseInt(height) + "px";
  }
});

Effect.Blend = Class.create();
Object.extend(Effect.Blend.prototype, Effect.Base.prototype);
Object.extend(Effect.Blend.prototype, {
  initialize: function(element, options) {
    this.element = $(element);
    options = Object.extend({
      invert: false,
      from: 0.0,
      to: 1.0
    }, options || {});
    this.start(options);
  },

  setup: function() {
    this.setOpacityByPosition(this.options.from);
  },

  update: function(position) {
    this.setOpacityByPosition(position);
  },

  finish: function() {
    this.setOpacityByPosition(this.options.to);
  },

  setOpacityByPosition: function(position) {
    var opacity = this.options.invert ? 1.0 - position : position;
    this.element.setOpacity(opacity);
  }
});

var Transitions = {
  animationEnabled: true
};

Element.addMethods({
  transition: function(element, change, options) {
    if (typeof change == "object" && typeof options == "function")
      change = [change, options], options = change.shift(), change = change.shift();

    element = $(element);
    options = options || {};
    options.animate = options.animate !== false && Transitions.animationEnabled;
    options.fade = options.fade !== false;

    function finish() {
      (options.after || Prototype.K)();
    }

    function highlightAndFinish(destinationElement) {
      if (options.highlight) {
        var highlightElement = options.highlight === true ? destinationElement : ($(options.highlight) || destinationElement);
        new Effect.Highlight(highlightElement, { duration: 2, afterFinish: finish });
      } else {
        finish.defer();
      }
    }

    function cloneWithoutIDs(element) {
      element = $(element);
      var clone = element.cloneNode(true);
      clone.id = "";
      clone.getElementsBySelector("*[id]").each(function(e) { e.id = "" });
      return clone;
    }

    if (options.animate) {
      var transitionElement = new Element("div").setStyle({ position: "relative", overflow: "hidden" });
      element.insert({ before: transitionElement });

      var sourceElement = cloneWithoutIDs(element);
      var sourceElementWrapper = sourceElement.wrap("div");
      var destinationElementWrapper = element.wrap("div");
      transitionElement.appendChild(sourceElementWrapper);
      transitionElement.appendChild(destinationElementWrapper);
    }

    change(element);

    if (options.animate) {
      var sourceHeight = sourceElementWrapper.getHeight(), destinationHeight = destinationElementWrapper.getHeight();
      var sourceWidth  = sourceElementWrapper.getWidth(),  destinationWidth  = destinationElementWrapper.getWidth();

      var outerWrapper = new Element("div");
      transitionElement.insert({ before: outerWrapper });
      outerWrapper.setStyle({ overflow: "hidden", height: sourceHeight + "px"});
      outerWrapper.appendChild(transitionElement);

      var maxHeight = destinationHeight > sourceHeight ? destinationHeight : sourceHeight;
      transitionElement.setStyle({ height: maxHeight + "px" });
      sourceElementWrapper.setStyle({ position: "absolute", height: maxHeight + "px", width: sourceWidth + "px", top: 0, left: 0 });
      destinationElementWrapper.setStyle({ position: "absolute", height: maxHeight + "px", width: sourceWidth + "px", top: 0, left: 0, opacity: 0, zIndex: 2000 });

      var effects = [
        new Effect.Height(transitionElement, { sync: true, from: sourceHeight, to: destinationHeight }),
        new Effect.Blend(destinationElementWrapper, { sync: true })
      ];

      if (options.fade) {
        effects.push(new Effect.Blend(sourceElementWrapper, { invert: true, sync: true }));
        destinationElementWrapper.setStyle({ zIndex: 0 });
        sourceElementWrapper.setStyle({ zIndex: 2000 });
      }

      new Effect.Parallel(effects, {
        duration: options.duration || 0.3,

        afterUpdate: function() {
          if (outerWrapper) {
            outerWrapper.insert({ before: transitionElement });
            outerWrapper.remove();
            outerWrapper = false;
          }
        },

        afterFinish: function() {
          var destinationElement = destinationElementWrapper.down();
          if (destinationElement)
            transitionElement.insert({ before: destinationElement });
          transitionElement.remove();

          highlightAndFinish(destinationElement);
        }
      });

    } else {
      highlightAndFinish(element);
    }

    return {
      after: function(after) {
        options.after = (options.after || Prototype.K).wrap(function(proceed) {
          proceed();
          after();
        });
        return this;
      }
    };
  }
});


if (Prototype.Browser.WebKit) {
  document.observe("dom:loaded", function() {
    document.documentElement.setStyle({
      backgroundColor: document.body.getStyle("backgroundColor")
    });
  });
}
(function() {
  var propertiesToCopy = $A(['fontSize', 'fontStyle', 'fontWeight', 'fontFamily', 'lineHeight']);

  function valueDimensions(element, dimension) {
    element = $(element);

    var dimensions;
    var div = new Element('div');

    dimensions = $(element).getDimensions();

    if (dimension == 'height') {
      div.setStyle({ width: dimensions.width + 'px' });
    } else if (dimension == 'width') {
      div.setStyle({ height: dimensions.height + 'px' });
    }

    var styles = {}
    propertiesToCopy.each(function(property) {
      styles[property] = $(element).getStyle(property);
    })
    div.setStyle(styles)

    div.setStyle({ position: 'absolute', display: 'none' });
    div.update(element.getValue());

    $(document.body).insert(div);
    dimensions = div.getDimensions();
    div.remove();

    return dimensions[dimension];
  }

  var methods = {
    valueDimensions: valueDimensions
  };

  Element.addMethods("INPUT", methods);
  Element.addMethods("TEXTAREA", methods);
})();

var Color = {
  TOLERANCE: 0.0000000001
};

Color.HSV = Class.create({
  initialize: function(h, s, v) {
    this.h = h > 1 ? 1 : h < 0 ? 0 : h;
    this.s = s > 1 ? 1 : s < 0 ? 0 : s;
    this.v = v > 1 ? 1 : v < 0 ? 0 : v;
  },

  toRGB: function() {
    var h = this.h, s = this.s, v = this.v;
    if (h + Color.TOLERANCE >= 1) h = 0;
    h *= 6;

    var i = parseInt(h);
    var f = h - i;
    var p = v * (1 - s);
    var q = v * (1 - s * f);
    var t = v * (1 - s * (1 - f));

    var r, g, b;

    switch (i) {
      case 0: r = v, g = t, b = p; break;
      case 1: r = q, g = v, b = p; break;
      case 2: r = p, g = v, b = t; break;
      case 3: r = p, g = q, b = v; break;
      case 4: r = t, g = p, b = v; break;
      case 5: r = v, g = p, b = q; break;
    }

    return new Color.RGB(Math.round(r * 255), Math.round(g * 255), Math.round(b * 255));
  },

  toHSV: function() {
    return this;
  },

  toHTML: function() {
    return this.toRGB().toHTML();
  }
});

Color.RGB = Class.create({
  initialize: function(r, g, b) {
    this.r = parseInt(r > 255 ? 255 : r < 0 ? 0 : r);
    this.g = parseInt(g > 255 ? 255 : g < 0 ? 0 : g);
    this.b = parseInt(b > 255 ? 255 : b < 0 ? 0 : b);
  },

  toHSV: function() {
    var r = this.r, g = this.g, b = this.b;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var d = max - min, h, s = max > 0 ? d / max : 0, v = max;

    if (s - Color.TOLERANCE <= 0) {
      h = 0;
    } else {
      if (max == r) {
        h = (g - b) / d;
      } else if (max == g) {
        h = 2 + (b - r) / d;
      } else {
        h = 4 + (r - g) / d;
      }
    }

    if (h < 0) h += 6;
    h /= 6, v /= 255;

    return new Color.HSV(h, s, v);
  },

  toRGB: function() {
    return this;
  },

  toHTML: function() {
    var html = "#" + this.r.toColorPart() + this.g.toColorPart() + this.b.toColorPart();
    return html;
  }
});

Color.RGB.fromHTML = function(html) {
  var color = (html.toString().match(/#?([0-9A-Fa-f]{3}(?:[0-9A-Fa-f]{3})?)/) || [])[1];

  if (color) {
    if (color.length == 3) {
      color = color.split("");
      var r = color[0] + color[0], g = color[1] + color[1], b = color[2] + color[2];
    } else {
      var r = color.slice(0, 2), g = color.slice(2, 4), b = color.slice(4, 6);
    }

    return new Color.RGB(parseInt(r, 16), parseInt(g, 16), parseInt(b, 16));
  }
};

var ColorPicker = Class.create({
  initialize: function(element, color) {
    this.element   = $(element);
    this.satPicker = this.element.down("div.saturation_and_brightness_picker");
    this.satCursor = this.satPicker.down("div.cursor");
    this.huePicker = this.element.down("div.hue_picker");
    this.hueCursor = this.huePicker.down("div.cursor");
    this.document  = document;
    this.observers = $H();

    this.setColor(Color.RGB.fromHTML(color || "#f00"));
    this.start();
  },

  start: function() {
    if (this.observers.keys().length) return;
    this.observe("satPicker", "mousedown", "didStartSatPickerDrag");
    this.observe("huePicker", "mousedown", "didStartHuePickerDrag");
  },

  stop: function() {
    this.observers.keys().each(function(o) {
      this.stopObserving(o);
    }, this);
  },

  observe: function(elementName, eventName, methodName) {
    var key = $A(arguments).join(":");
    var observer = this[methodName].bind(this), element = this[elementName];
    element.observe(eventName, observer);
    this.observers.set(key, { element: element, event: eventName, observer: observer });
  },

  stopObserving: function() {
    var o = this.observers.get($A(arguments).join(":"));
    if (o) o.element.stopObserving(o.event, o.observer);
  },

  setColor: function(color) {
    var hsv = color.toHSV();
    if (hsv.s > 0) this.setHue(parseInt(hsv.h * 255), true);
    this.setSaturationAndValue(parseInt(hsv.s * 255), parseInt(hsv.v * 255), true);
    this.color = color;
    this.fireChangedEvent();
  },

  setColor: function(color, animate) {
    var hsv = color.toHSV();
    var h = this.h, s = parseInt(hsv.s * 255), v = parseInt(hsv.v * 255);
    if (!h || hsv.s > 0) h = parseInt(hsv.h * 255);

    var finish = (function() {
      this.color = color;
      this.fireChangedEvent();
    }).bind(this);

    if (animate) {
      this.effect = new Effect.Parallel([
        new Effect.Tween(this.element, this.h, h, function(position) {
          this.setHue(position, true);
        }.bind(this)),
        new Effect.Tween(this.element, this.s, s, function(position) {
          this.setSaturationAndValue(position, this.v, true);
        }.bind(this)),
        new Effect.Tween(this.element, this.v, v, function(position) {
          this.setSaturationAndValue(this.s, position, true);
        }.bind(this))
      ], {
        duration: 0.35,
        afterFinish: finish
      });
    } else {
      this.setHue(h, true);
      this.setSaturationAndValue(s, v, true);
      finish();
    }
  },

  updateColor: function() {
    this.color = new Color.HSV(this.h / 255, this.s / 255, this.v / 255);
    this.fireChangedEvent();
  },

  setHue: function(h, aggregate) {
    this.h = h < 0 ? 0 : h > 255 ? 255 : h;
    this.moveHueCursorTo(255 - this.h);
    this.updateSatPickerBackground();
    if (!aggregate) this.updateColor();
  },

  setSaturationAndValue: function(s, v, aggregate) {
    this.s = s < 0 ? 0 : s > 255 ? 255 : s;
    this.v = v < 0 ? 0 : v > 255 ? 255 : v;
    this.moveSatCursorTo(this.s, 255 - this.v);
    if (!aggregate) this.updateColor();
  },

  getColor: function() {
    return this.color;
  },

  didStartSatPickerDrag: function(event) {
    this.observe("document", "mousemove", "didDragSatPicker");
    this.observe("document", "mouseup", "didEndSatPickerDrag");
    this.didDragSatPicker(event);
  },

  didDragSatPicker: function(event) {
    var offsets = this.getOffsetsFrom("satPicker", event);
    this.setSaturationAndValue(offsets.left, 255 - offsets.top);
    event.stop();
  },

  didEndSatPickerDrag: function(event) {
    this.stopObserving("document", "mousemove", "didDragSatPicker");
    this.stopObserving("document", "mouseup", "didEndSatPickerDrag");
    event.stop();
  },

  didStartHuePickerDrag: function(event) {
    this.observe("document", "mousemove", "didDragHuePicker");
    this.observe("document", "mouseup", "didEndHuePickerDrag");
    this.didDragHuePicker(event);
  },

  didDragHuePicker: function(event) {
    var offsets = this.getOffsetsFrom("huePicker", event);
    this.setHue(255 - offsets.top);
    event.stop();
  },

  didEndHuePickerDrag: function(event) {
    this.stopObserving("document", "mousemove", "didDragHuePicker");
    this.stopObserving("document", "mouseup", "didEndHuePickerDrag");
    event.stop();
  },

  getOffsetsFrom: function(elementName, event) {
    var element = this[elementName];
    var offset  = element.cumulativeOffset();
    return { left: event.pointerX() - offset.left, top: event.pointerY() - offset.top };
  },

  moveSatCursorTo: function(x, y) {
    this.satCursor.setStyle({ left: x + "px", top: y + "px" });
  },

  moveHueCursorTo: function(y) {
    this.hueCursor.setStyle({ top: y + "px" });
  },

  updateSatPickerBackground: function() {
    var color = new Color.HSV(this.h / 255, 1, 1).toRGB();
    this.satPicker.setStyle({ backgroundColor: color.toHTML() });
  },

  fireChangedEvent: function() {
    this.element.fire("color:changed", { color: this.color });
  }
});

var Sortables = Sortable;

document.observe("dom:loaded", function() {
  preloadImages(
    "/images/dots-white.gif",
    "/images/progress_bar.gif",
    "/images/nubbin.gif",
    "/images/drag_handle.gif",
    "/images/drag_handle-white.png",
    "/images/drag_shadow.png",
    "/images/add_flag.gif",
    "/images/trash.gif",
    "/images/tags/bookmark_icon.png",
    "/images/tags/bookmark_icon-current.png"
  );
});
(function() {
  function run(script) {
    try {
      return eval("with (window) { " + script + "}");
    } catch (e) {
      (function() { throw e }).defer();
    }
  }

  function processAsyncScripts(scripts) {
    if (!scripts.length) {
      window.async = run;
    } else {
      (function() {
        run(scripts[0]);
        processAsyncScripts(scripts.slice(1));
      }).defer();
    }
  }

  document.observe("dom:loaded", function() {
    if (window.async && async.f)
      processAsyncScripts.defer(async.f);
  });
})();

document.observe("dom:loaded", function() {
  if (window.localStorage && !navigator.userAgent.match("MSIE 7") && !navigator.userAgent.match("MSIE 8")) {
    $$("[data-behavior~=autosave]").each(function(input) {
      new Autosave(input);
    })
  }
});

Autosave = function(input) {
  generateStorageKey = function(input) {
    return ["autosave:", $$("meta[name~=current-user]")[0].content, input.name, input.up("form").action, escape(window.location.pathname)].join('')
  }

  restore = function() {
    var saved;
    if (saved = window.localStorage.getItem(self.storageKey)) {
      if (!self.input.value) {
        return self.input.value = saved;
      }
    }
  }

  watchForChanges = function() {
    self.input.observe('change', function() {self.save()})
    self.input.observe('paste', function() {self.save()})
    self.input.observe('keyup', function() {self.save()})
  }

  save = function() {
    window.localStorage.setItem(self.storageKey, self.input.value);
  }

  clear = function() {
    window.localStorage.removeItem(self.storageKey);
  }

  clearWhenSubmit = function() {
    self.input.up("form").down("input:submit").observe('click', function() {
      self.clear();
    })
  }

  var self = this;
  self.input = input;
  self.storageKey = generateStorageKey(input);
  self.save = save;
  self.clear = clear;
  restore();
  watchForChanges();
  clearWhenSubmit();
}
/* ------------------------------------------------------------------------
 * notes.js
 * Copyright (c) 2004-2008 37signals, LLC. All rights reserved.
 * ------------------------------------------------------------------------ */

var AutosizingTextArea = {
  autosize: function(textarea, threshold) {
    textarea = $(textarea), threshold = threshold || 360;
    if (textarea.value.length > threshold && !textarea.hasClassName("large")) {
      textarea.addClassName("large").slideIntoView();
    } else if (textarea.value.length < threshold * 8 / 9) {
      textarea.removeClassName("large");
    }
  }
};
document.observe("dom:loaded", function() {
  Draggables.addObserver({
    onStart: function(name, draggable, event) {
      draggable.element.addClassName("dragging");
    },

    onEnd: function(name, draggable, event) {
      draggable.element.removeClassName("dragging");
    }
  });
});
/* ------------------------------------------------------------------------
 * nubbins.js
 * Copyright (c) 2004-2007 37signals, LLC. All rights reserved.
 * ------------------------------------------------------------------------ */

document.observe("dom:loaded", function() {
  if (!$("Main")) return;
  window.Nubbins = new HoverObserver("Main");

  function nubbinHoverEffect(event) {
    var nubbin = event.target.down("div.nubbin");
    if (!nubbin) return;

    var over = event.eventName == "hover:activated", memo = event.memo;
    var moving = memo.fromElement && memo.toElement;

    if (event.target.match(".busy") || event.target.up(".busy")) return;

    if (nubbin.effect) {
      nubbin.effect.cancel();
      nubbin.effect = null;
    }

    if (Prototype.Browser.IE || over || moving) {
      nubbin.setOpacity(over ? 1.0 : 0.0);
      nubbin[over ? "show" : "hide"]();

    } else {
      nubbin.effect = new Effect.Opacity(nubbin, {
        duration: 0.3, from: 1.0, to: 0.0,
        afterFinish: function() {
          nubbin.hide();
          nubbin.effect = null;
        }
      });
    }
  }

  document.observe("hover:activated", function(event) {
    nubbinHoverEffect(event);
  });

  document.observe("hover:deactivated", function(event) {
    nubbinHoverEffect(event);
  });
});
/* ------------------------------------------------------------------------
 * preload_images.js
 * Copyright (c) 2004-2009 37signals, LLC. All rights reserved.
 * ------------------------------------------------------------------------ */

function preloadImages() {
 var all = $$('link[href*="/all.css"]'), protocol = '', domain = '';

 if (all.length > 0) {
   url = all.first().readAttribute('href').match(/^(.*?:)(\/\/.*?)\//);
   if (url) protocol = url[1], domain = url[2];
 }

 $A(arguments).each(function(path) {
   var src = protocol + domain + path;
   new Image().src = src;
 });
}
var Remoting = {
  request: function(element) {
    element = $(element);
    var url = element.readAttribute("action");
    if (url) new Ajax.Request(url);
    return element;
  }
};

document.observe("dom:loaded", function() {
  $(document.body).observe("click", function(event) {
    var element = event.findElement(".remote_action");
    if (element) Remoting.request(element);
  });
});
var Bookmarks = {
  makeSortable: function(options) {
    Sortables.create("bookmarks", {
      handle:   "drag_handle",
      only:     "bookmark",
      tag:      "a",
      onUpdate: Bookmarks.reorder.curry(options.url)
    });

    $("bookmarks").observe("click", function(event) {
      if (event.findElement(".drag_handle"))
        event.stop();
    });
  },

  serialize: function() {
    return $("bookmarks").select("a.bookmark").map(function(element) {
      return "bookmarks[]=" + element.readAttribute("bookmark_id");
    }).join("&");
  },

  reorder: function(url) {
    new Ajax.Request(url, { method: "put", parameters: Bookmarks.serialize() });
  }
};
/* ------------------------------------------------------------------------
 * calendar.js
 * Copyright (c) 2004-2007 37signals, LLC. All rights reserved.
 * ------------------------------------------------------------------------ */

Element.addMethods({
  clear: function(element) {
    element = $(element);
    while (element.firstChild)
      element.removeChild(element.firstChild);
    return element;
  }
});

/* ------------------------------------------------------------------------- */

var Day = Class.create();
Day.prototype = {
  initialize: function(element) {
    if (this.element = $(element))
      this.selectionElement = $(this.element.getElementsByTagName('div')[0]);
  },

  makeDroppable: function(url) {
    Droppables.add(this.element, {
      hoverclass: "hover",
      onDrop: function(element) {
        new Ajax.Request(url, { parameters: { id: element.id } });
      }
    });
  }
};

var Calendar = {
  updateSelectedCalendar: function(id, remindees) {
    $$('.cal_name select').each(function(select) {
      if($F(select) == id) {
        var up = select.up('form');
        if (remindees) {
          Element.replace(up.down('.remindees'), remindees);
          up.down('.reminder_options').show();
          var for_whom = $F(up.down('select[name=for_whom]'));
          if (for_whom == "users") up.down('.remindees').show();
        } else {
          up.down('.reminder_options').hide();
        }
      }
    });
  },

  adjustEventRepeatControls: function(form) {
    var repeat, value;
    if (repeat = form.down('.event_repeat_type').value) {
      form.down('.event_repeat_for').show();
      value = form.down('.event_repeat_count').value;
      form.down('.event_repeat_for_units').update(Calendar.unitForRepeatValue(repeat) +
        (value == 1 ? '' : 's'));
      form.slideIntoView();
    } else {
      form.down('.event_repeat_for').hide();
    }
  },

  unitForRepeatValue: function(value) {
    return {
      'daily':    'day',
      'weekly':   'week',
      'biweekly': 'week',
      'monthly':  'month',
      'yearly':   'year'
    }[value];
  },

  focus: function(element) {
    window.setTimeout(function() {
      $(element).focus();
      if (Grid.IE) $(element).select();
    }, 50);
  },

  setSwatchColor: function(color, element) {
    element = $(element || 'calendar_color_swatch');
    element.style.backgroundColor = '#' + color;
    $('calendar_name').focus();
  },

  setCalendarColor: function(calendarClass, color) {
    $$('#grid li.' + calendarClass + ' span.color').each(function(element) {
      var style = element.style;
      style[style.backgroundColor ? 'backgroundColor' : 'color'] = color;
    });
  },

  updateEventRemindees: function(element) {
    var remindees = $('remindees')
    if (remindees) {
      remindees.setStyle({ opacity: 0.5 });
    }
    new Ajax.Request('/calendars/' + $F(element), { method: 'get' });
  },

  resizeTextarea: function(element) {
    element = $(element);

    var height     = element.valueDimensions('height');
    var min_height = element.readAttribute('data-min-height')

    if (min_height) height = Math.max(min_height, height);

    element.setStyle({ height: height + 'px' });
  },

  moveMenuToPosition: function(element, pointer, position) {
    var pointerOffset = 45; // pointer is 45px below top of popup

    position = position || 'left';
    element.setStyle({left: '0px', top: '0px'});

    var bounds = element.getBounds();
    var left   = pointer.x - bounds[position];
    var top    = pointer.y - bounds.top - pointerOffset;

    if (position == 'left') {
      left += 10;
    } else if (position == 'right') {
      left -= 10;
    }

    element.setStyle({left: left + 'px', top: top + "px"});
  }
};

var Grid = {
  IE: navigator.appVersion.match(/\bMSIE\b/),
  cellPadding: 44,
  cellPaddingIE: 38,

  cellForElement: function(element) {
    element = $(element);
    var cellRef = element.getAttribute('cell') ? element : element.up("*[cell]");
    if (cellRef) return $(cellRef.getAttribute('cell'));
    return element.trace('div#grid div.td');
  },

  browsable: function(element) {
    if (this.dragElement) {
      return false;
    } else if (this.browsingTo) {
      return false;
    }
    return true;
  },

  browseTo: function(element) {
    this.browsingTo = new Day(element);
    this.browsingTo.element.addClassName('busy');
  },

  setSelectedDay: function(element) {
    return this.selectedDay = new Day(element);
  },

  select: function(element) {
    if (this.browsingTo) {
      this.browsingTo.element.removeClassName('busy');
      this.browsingTo = false;
    }

    if (this.selectedDay.element)
      this.selectedDay.selectionElement.removeClassName('selected');

    this.setSelectedDay(element);
    this.selectedDay.selectionElement.addClassName('selected');
  },

  revert: function() {
    return !Grid.dropElement;
  },

  snap: function(x, y) {
    if (Droppables.last_active && Grid.dragElement) {
      var sourceLeft = Position.cumulativeOffset(Grid.dragElement.parentNode)[0];
      var hoverLeft  = Position.cumulativeOffset(Droppables.last_active.element)[0];
      return [hoverLeft - sourceLeft, y];

    } else {
      return [x, y];
    }
  },

  destroy: function() {
    Droppables.drops = [];
    Draggables.drags = [];
    Draggables.observers = [];
    Draggables.unregister();
  },

  reset: function() {
    this.dragElement = this.dropElement = this.browsingTo = false;
  },

  resize: function() {
    var weeks = $('grid').childNodes, lastWeek, week;

    for (var i = 0; i < weeks.length; i++) {
      week = weeks[i];
      if (week.tagName != 'DIV' || week.className.match(/^header/)) continue;
      if (lastWeek) Grid.resizeWeek(lastWeek, week);
      lastWeek = week;
    }
  },

  resizeWeek: function(week, nextWeek) {
    var cells = week.childNodes, cell;
    var divs  = [], div;

    if (week.hasTopBorder == undefined)
      week.hasTopBorder = week.className.match(/top_border/);

    for (var i = 0; i < cells.length; i++) {
      cell = $(cells[i]);
      if (cell.tagName != 'DIV' || !cell.hasClassName('td')) continue;
      div = $(cell.childNodes[Grid.IE ? 0 : 1].childNodes[0]);
      div.setStyle({height: ''});
      divs.push(div);
    }

    var height = nextWeek.offsetTop - week.offsetTop - Grid['cellPadding' + (Grid.IE ? 'IE' : '')], divHeight;

    for (var i = 0; i < divs.length; i++) {
      div = divs[i], divHeight = height;
      if (week.hasTopBorder && !div.className.match(/first_week/)) divHeight--;
      div.style.height = divHeight + 'px';
    }
  },

  startDrag: function(target, event) {
    event = Event.extend(event);
    event.stop();

    if ($(target).up('.menu_container.active_menu')) return false;

    var element = event.findElement(".draggable");
    if (element) {
      var draggable = element.retrieve("draggable");
      if (draggable) draggable.initDrag(event)
    }

    return false;
  },

  requestMenuContents: function(container) {
    var cell = Grid.cellForElement(container);

    cell.addClassName('busy');
    var success = function() { cell.removeClassName('busy'); }

    var event_id = container.readAttribute("data-event-id");
    var parameters = {
          date: cell.readAttribute("data-date"),
          offset: cell.readAttribute("data-offset")
        };

    if (event_id) {
      new Ajax.Request('/calendar_events/' + event_id + '/edit', {
        method: 'get',
        parameters: parameters,
        onSuccess: success
      });
    } else {
      new Ajax.Request('/calendar_events/new', {
        method: 'get',
        parameters: parameters,
        onSuccess: success
      });
    }
  }
};

Grid.DragObserver = Class.create();
Grid.DragObserver.prototype = {
  initialize: function(element) {
    this.element  = $(element);
    this.cellName = this.element.getAttribute('cell');
  },

  onStart: function(eventName, draggable) {
    if (draggable.element == this.element) {
      if (this.cell = $(this.cellName)) {
        this.cell.addClassName('dragged_from');
        this.element.addClassName('dragging');
        Grid.dragElement = this.element;
      }
    }
  },

  onEnd: function(eventName, draggable, event) {
    if (draggable.element == this.element) {
      this.element.removeClassName('dragging');
      if (Droppables.last_active) {
        Grid.dropElement = Droppables.last_active.element;
        this.element.addClassName('dropped');
        Grid.browseTo(Grid.dropElement);
      }
    }
  }
};

Event.observe(window, "load", function() {
  if ($(document.body).hasClassName("calendar")) {
    Grid.resize();
    Event.observe(window, "resize", Grid.resize);

    if (Prototype.Browser.IE) {
      Draggable = Class.create();
      Draggable._dragging = {};
      Draggable.prototype.initialize =
          Draggable.prototype.initDrag =
          Draggables.addObserver =
          Droppables.add =
          Grid.destroy =
          Prototype.emptyFunction;
    }

    var menu = new MenuObserver("calendar_content");

    $("calendar_content").observe("menu:prepared", function(event) {
      var container = event.findElement();

      if (container.match(".dragged_from, .dropped") || container.down(".dragged_from, .dropped")) {
        event.stop();
        return false;
      }

      if (container.hasClassName("new_event_menu_container") &&
            container.down(".edit_event_menu_container.active_menu")) {
        event.stop();
        return false;
      }

      var content;
      if (container.hasClassName("new_event_menu_container"))
        content = container.down(".new_event_menu_content");
      else if (container.hasClassName("edit_event_menu_container"))
        content = container.down(".edit_event_menu_content");

      if (content && content.innerHTML.blank()) {
        Grid.requestMenuContents(container);
        event.stop();
      }
    });


    document.observe("menu:activated", function(event) {
      var element = event.findElement().down("*[data-menu-position-container]");
      if (!element) return;

      var selector = element.readAttribute("data-menu-position-container");
      if (!selector) return

      element.addClassName("has_active_menu");
      element.ancestors().each(function(ancestor) {
        ancestor.addClassName("has_active_menu");
        if (ancestor.match(selector)) throw $break;
      });
    });

    document.observe("menu:deactivated", function(event) {
      var element = event.findElement().down("*[data-menu-position-container]");
      if (!element) return;

      var selector = element.readAttribute("data-menu-position-container");
      if (!selector) return

      element.removeClassName("has_active_menu");
      element.ancestors().each(function(ancestor) {
        ancestor.removeClassName("has_active_menu");
        if (ancestor.match(selector)) throw $break;
      });
    });


    $("calendar_content").observe("menu:activated", function(event) {
      var container = event.findElement();
      var popup;

      if (container.hasClassName("new_event_menu_container")) {
        popup = container.down(".new_event_menu_content > div.add_edit_pop");
      } else if (container.hasClassName("edit_event_menu_container")) {
        popup = container.down(".edit_event_menu_content > div.add_edit_pop");
      }

      if (popup) {
        popup.down("form").reset();

        Calendar.adjustEventRepeatControls(popup.down("form"));
        popup.select(".resize_to_fit_contents").each(function(e) { Calendar.resizeTextarea(e); });


        var positionMenuAtPointer = container.hasClassName("week_menu_container") || container.hasClassName("new_event_menu_container");

        if (positionMenuAtPointer && Grid.pointer) {
          Calendar.moveMenuToPosition(popup, Grid.pointer, 'left');
        }


        popup.removeClassName("edge");

        var viewportRight = document.viewport.getScrollOffsets().left + document.viewport.getWidth();
        var bounds = popup.getBounds()

        if (bounds.right > viewportRight) {
          popup.addClassName("edge");

          if (positionMenuAtPointer && Grid.pointer) {
            Calendar.moveMenuToPosition(popup, Grid.pointer, 'right');
          }
        }


        Grid.pointer = null;

        popup.slideIntoView();
        popup.autofocus();
      }
    });

    $("calendar_content").observe("menu:activate", function(event) {
      menu.onRegionMouseDown(event);
    });

    $(document.body).observe("repeat:change", function(event) {
      var element = event.findElement("select.event_repeat_type, select.event_repeat_count")
      if (element) Calendar.adjustEventRepeatControls(element.up('form'))
    });
  }
});


/* iOS specific script to work around a crash that occurs when you add a new
event in the last row of a calendar in landscape mode */

document.observe('dom:loaded', function(){
  if (Prototype.Browser.MobileSafari && window.orientation && document.body.hasClassName('calendar')){

    function updateOrientationClass() {
      if (window.orientation.abs() === 90) {
        $(document.body).removeClassName('portrait').addClassName('landscape');
      } else {
        $(document.body).removeClassName('landscape').addClassName('portrait');
      }
    }

    Event.observe(window, 'orientationchange', updateOrientationClass);
    updateOrientationClass();
  }
});
var CalendarDate = Class.create({
  initialize: function(year, month, day) {
    this.date  = new Date(Date.UTC(year, month - 1));
    this.date.setUTCDate(day);

    this.year  = this.date.getUTCFullYear();
    this.month = this.date.getUTCMonth() + 1;
    this.day   = this.date.getUTCDate();
    this.value = this.date.getTime();
  },

  beginningOfMonth: function() {
    return new CalendarDate(this.year, this.month, 1);
  },

  beginningOfWeek: function() {
    return this.previous(this.date.getUTCDay());
  },

  next: function(value) {
    if (value === 0) return this;
    return new CalendarDate(this.year, this.month, this.day + (value || 1));
  },

  previous: function(value) {
    if (value === 0) return this;
    return this.next(-(value || 1));
  },

  succ: function() {
    return this.next();
  },

  equals: function(calendarDate) {
    return this.value == calendarDate.value;
  },

  isWeekend: function() {
    var day = this.date.getUTCDay();
    return day == 0 || day == 6;
  },

  getMonthName: function() {
    return CalendarDate.MONTHS[this.month - 1];
  },

  toString: function() {
    return this.stringValue = this.stringValue ||
      [this.year, this.month, this.day].invoke("toPaddedString", 2).join("-");
  }
});

Object.extend(CalendarDate, {
  MONTHS:   $w("January February March April May June July August September October November December"),
  WEEKDAYS: $w("Sunday Monday Tuesday Wednesday Thursday Friday Saturday"),

  parse: function(date) {
    if (!(date || "").toString().strip()) {
      return CalendarDate.parse(new Date());

    } else if (date.constructor == Date) {
      return new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate());

    } else if (Object.isArray(date)) {
      var year = date[0], month = date[1], day = date[2];
      return new CalendarDate(year, month, day);

    } else {
      return CalendarDate.parse(date.toString().split("-"));
    }
  }
});
var CalendarDateSelect = Class.create({
  initialize: function(field, options) {
    this.field   = $(field);
    this.options = options || {};

    this.setDate(CalendarDate.parse($F(field)));
    this.setCursor(this.date);

    this.createElement();
    this.field.insert({ after: this });
  },

  createElement: function() {
    this.element = new Element("div", { className: "calendar_date_select" });

    this.header = new Element("div", { className: "header" });
    this.pager = new CalendarDateSelect.Pager(this.cursor);
    this.header.insert(this.pager);
    this.element.insert(this.header);

    this.body = new Element("div", { className: "body" });
    this.updateBody();
    this.element.insert(this.body);

    this.footer = new Element("div", { className: "footer" });
    this.title = new Element("span").update((this.options.title || "Due:") + " ");
    this.description = new Element("span");
    this.updateDescription();
    this.footer.insert(this.title);
    this.footer.insert(this.description);
    this.element.insert(this.footer);

    this.element.observe("calendar:cursorChanged", this.onCursorChanged.bind(this));
    this.element.observe("calendar:dateSelected", this.onDateSelected.bind(this));
  },

  onCursorChanged: function(event) {
    this.setCursor(event.memo.cursor);
  },

  onDateSelected: function(event) {
    this.setDate(event.memo.date);
  },

  setCursor: function(date) {
    this.cursor = date.beginningOfMonth();
    this.updateBody();
  },

  setDate: function(date) {
    this.date = date;
    this.field.setValue(this.date);
    this.updateDescription();
  },

  updateBody: function() {
    if (this.body) {
      this.grid = new CalendarDateSelect.Grid(this.date, this.cursor);
      this.body.clear();
      this.body.insert(this.grid);
    }
  },

  updateDescription: function() {
    if (this.description) {
      this.description.update("#{month} #{day}, #{year}".interpolate({
        month: this.date.getMonthName(), day: this.date.day, year: this.date.year
      }));
    }
  },

  toElement: function() {
    return this.element;
  }
});


CalendarDateSelect.Pager = Class.create({
  initialize: function(cursor) {
    this.cursor = cursor;
    this.createElement();
  },

  createElement: function() {
    this.element = new Element("div", { className: "pager" });

    this.left = new Element("a", { href: "#", className: "nav left", method: "previous" });
    this.left.update("<<".escapeHTML());
    this.left.observe("click", this.onButtonClicked.bind(this));
    this.element.insert(this.left);

    this.right = new Element("a", { href: "#", className: "nav right", method: "next" });
    this.right.update(">>".escapeHTML());
    this.right.observe("click", this.onButtonClicked.bind(this));
    this.element.insert(this.right);

    this.select = new Element("select", { className: "months" });
    this.updateSelect();
    this.select.observe("change", this.onSelectChanged.bind(this));
    this.element.insert(this.select);
  },

  onButtonClicked: function(event) {
    var element = event.findElement("a[method]");
    if (element) {
      this[element.readAttribute("method")]();
      event.stop();
    }
  },

  onSelectChanged: function(event) {
    this.setCursor(CalendarDate.parse($F(this.select)));
  },

  previous: function() {
    this.setCursor(this.cursor.beginningOfMonth().previous());
  },

  next: function() {
    this.setCursor(new CalendarDate(this.cursor.year, this.cursor.month + 1, 1));
  },

  setCursor: function(cursor) {
    cursor = cursor.beginningOfMonth();
    var event = this.element.fire("calendar:cursorChanged", { cursor: cursor });

    if (!event.stopped) {
      var oldCursor = this.cursor;
      this.cursor = cursor;
      this.updateSelect(oldCursor);
    }
  },

  updateSelect: function(oldCursor) {
    if (!oldCursor || this.cursor.year != oldCursor.year) {
      this.months = this.getDatesForSurroundingMonths();
      this.select.options.length = 0;
      this.getDatesForSurroundingMonths().each(function(date, index) {
        var title = [date.getMonthName().slice(0, 3), date.year].join(" ");
        this.select.options[index] = new Option(title, date.toString());
        if (this.cursor.equals(date)) this.select.selectedIndex = index;
      }, this);

    } else {
      this.select.selectedIndex = this.months.pluck("value").indexOf(this.cursor.value);
    }
  },

  getDatesForSurroundingMonths: function() {
    return $R(this.cursor.year - 1, this.cursor.year + 2).map(function(year) {
      return $R(1, 12).map(function(month) {
        return new CalendarDate(year, month, 1);
      });
    }).flatten();
  },

  toElement: function() {
    return this.element;
  }
});


CalendarDateSelect.Grid = Class.create({
  initialize: function(date, cursor) {
    this.date    = CalendarDate.parse(date);
    this.cursor  = CalendarDate.parse(cursor).beginningOfMonth();
    this.today   = CalendarDate.parse();

    this.createElement();
  },

  createElement: function() {
    var table = new Element("table");
    var tbody = new Element("tbody");
    var html  = [];

    html.push('<tr class="weekdays">');
    CalendarDate.WEEKDAYS.each(function(weekday) {
      html.push("<th>", weekday[0], "</th>");
    });
    html.push("</tr>");

    this.getWeeks().each(function(week) {
      html.push('<tr class="days">');
      week.each(function(date) {
        html.push('<td class="', this.getClassNamesForDate(date).join(" "));
        html.push('" date="', date, '"><a href="#">', date.day, "</a></td>");
      }, this);
      html.push("</tr>");
    }, this);

    tbody.insert(html.join(""));
    table.insert(tbody);
    table.observe("click", this.onDateClicked.bind(this));

    return this.element = table;
  },

  getStartDate: function() {
    return this.cursor.beginningOfWeek();
  },

  getEndDate: function() {
    return this.getStartDate().next(41);
  },

  getDates: function() {
    return $R(this.getStartDate(), this.getEndDate());
  },

  getWeeks: function() {
    return this.getDates().inGroupsOf(7);
  },

  getClassNamesForDate: function(date) {
    var classNames = [];

    if (date.equals(this.today)) classNames.push("today");
    if (date.equals(this.date))  classNames.push("selected");
    if (date.isWeekend())        classNames.push("weekend");
    if (!date.beginningOfMonth().equals(this.cursor))
      classNames.push("other");

    return classNames;
  },

  onDateClicked: function(event) {
    var element = event.findElement("td[date]");
    if (element) {
      this.selectDate(element);
      event.stop();
    }
  },

  selectDate: function(element) {
    var date  = CalendarDate.parse(element.readAttribute("date"));
    var event = element.fire("calendar:dateSelected", { date: date });

    if (!event.stopped) {
      var selection = this.element.down("td.selected");
      if (selection) selection.removeClassName("selected");

      this.selectedElement = element;
      this.date = date;

      element.addClassName("selected");
    }
  },

  toElement: function() {
    return this.element;
  }
});
var ColorScheme = {
  initialize: function(colors) {
    this.updatePreviewWithColors = this.createPreviewFunction();
    this.setSwatchColors(colors);
    this.rememberOriginalColors();
  },

  getSwatch: function(swatch) {
    return this.getSwatchInput(swatch).up("div.color_swatch");
  },

  getSwatchInput: function(swatch) {
    return $(swatch + "_input");
  },

  setSwatchColor: function(swatch, color) {
    this.getSwatchInput(swatch).setValue(color);
    this.getSwatch(swatch).setStyle({ backgroundColor: "#" + color });
    this.updatePreview();
  },

  getSwatchColor: function(swatch) {
    return "#" + this.getSwatchInput(swatch).getValue();
  },

  editSwatchColor: function(swatch) {
    ColorScheme.SwatchEditor.edit(swatch);
  },

  updatePreview: function() {
    this.updatePreviewWithColors(this.serialize({ hash: true }));
  },

  setSwatchColors: function(colors) {
    ColorScheme.SwatchEditor.close();
    $H(colors).each(function(pair) {
      this.setSwatchColor.apply(this, pair);
    }, this);
  },

  setCustomScheme: function() {
    $("custom_scheme_selector").checked = "checked";
  },

  serialize: function(options) {
    return Form.serialize("scheme_colors", options);
  },

  rememberOriginalColors: function() {
    this.originalColors = this.serialize();
  },

  colorsHaveChanged: function() {
    return this.originalColors && (this.originalColors != this.serialize());
  },

  onSave: function() {
    this.rememberOriginalColors();
  },

  onCancel: function() {
    this.rememberOriginalColors();
  },

  onUnload: function() {
    if (this.colorsHaveChanged()) {
      return "The changes to your color settings will NOT be saved.";
    } else {
      return;
    }
  },

  createPreviewFunction: function() {
    var elements = $("color_scheme_preview").select("*[preview]"), body = "";
    elements.each(function(element, index) {
      element.readAttribute("preview").split(",").each(function(style) {
        var matches = style.match(/(.*?)\((.*?)\)/), property = matches[1], color = matches[2];
        body += "elements[" + index + "].style." + property + " = '#' + colors['color_scheme[" + color + "]'];"
      })
    });

    return new Function("elements, colors", body).curry(elements);
  },

  SwatchEditor: {
    edit: function(swatch) {
      this.close(true);
      this.swatch = swatch;
      this.originalColor = this.getSwatchColor();
      this.getSwatchContainer().addClassName("selected");
      this.show(ColorScheme.getSwatchColor(swatch));
    },

    close: function(fromEdit) {
      if (this.swatch) {
        this.getSwatchContainer().removeClassName("selected");
        this.swatch = null;
        if (!fromEdit) this.hide();
      }
    },

    revert: function() {
      this.setColor(this.originalColor);
      this.show(this.originalColor);
    },

    show: function(color) {
      this.createEditor();
      this.picker.setColor(Color.RGB.fromHTML(color)/*, this.visible() */);
      this.editor.removeClassName("changed");
      this.editor.addClassName("editing");
    },

    hide: function() {
      this.editor.removeClassName("editing");
    },

    visible: function() {
      return this.editor.hasClassName("editing");
    },

    getSwatchContainer: function() {
      return ColorScheme.getSwatch(this.swatch).up(".color");
    },

    getSwatchColor: function() {
      return ColorScheme.getSwatchColor(this.swatch).slice(1);
    },

    getColor: function() {
      return this.picker.getColor().toHTML().slice(1);
    },

    setColor: function(color) {
      ColorScheme.setSwatchColor(this.swatch, color);
      ColorScheme.setCustomScheme();
    },

    createEditor: function() {
      if (!this.editor) {
        this.editor = $("swatch_editor");

        var element = this.editor.down(".color_picker");
        this.picker = new ColorPicker(element);
        element.observe("color:changed", this.onColorChanged.bind(this));

        this.input = this.editor.down("input.color");
        this.input.observe("change", this.onInputChanged.bind(this));
      }
    },

    onColorChanged: function(event) {
      var color = this.getColor();
      this.setColor(color);
      this.input.setValue("#" + color);
      this.editor.addClassName("changed");
    },

    onInputChanged: function(event) {
      var color = Color.RGB.fromHTML(this.input.getValue());
      if (color) {
        this.picker.setColor(color);
      } else {
        this.input.setValue("#" + this.getColor());
      }
    }
  }
};

document.observe("dom:loaded", function() {
  if ($(document.body).hasClassName("color_scheme")) {
    preloadImages(
      "/images/color_picker/arrow.png",
      "/images/color_picker/circle.png",
      "/images/color_picker/hue.png",
      "/images/color_picker/saturation_and_brightness.png"
    );
    window.onbeforeunload = ColorScheme.onUnload.bind(ColorScheme);
  }
});
var DateHelper = {
  time_ago_in_words: function(from) {
    return this.distance_of_time_in_words(new Date(), from);
  },

  distance_of_time_in_words: function(to, from) {
    var distance_in_seconds = ((to - from) / 1000);
    var distance_in_minutes = (distance_in_seconds / 60).floor();

    if (distance_in_minutes == 0)      { return 'less than a minute'; }
    if (distance_in_minutes == 1)      { return 'a minute'; }
    if (distance_in_minutes < 45)      { return distance_in_minutes + ' minutes'; }
    if (distance_in_minutes < 90)      { return 'about 1 hour'; }
    if (distance_in_minutes < 1440)    { return 'about ' + (distance_in_minutes / 60).floor() + ' hours'; }
    if (distance_in_minutes < 2880)    { return '1 day'; }
    if (distance_in_minutes < 43200)   { return (distance_in_minutes / 1440).floor() + ' days'; }
    if (distance_in_minutes < 86400)   { return 'about 1 month'; }
    if (distance_in_minutes < 525960)  { return (distance_in_minutes / 43200).floor() + ' months'; }
    if (distance_in_minutes < 1051199) { return 'about 1 year'; }

    return 'over ' + (distance_in_minutes / 525960).floor() + ' years';
  }
};
/* ------------------------------------------------------------------------
 * drag_effects.js
 * Copyright (c) 2004-2007 37signals, LLC. All rights reserved.
 * ------------------------------------------------------------------------ */

Effect.StartDrag = function(element) {
  element = $(element);

  InsertionPoint.stop();
  Nubbins.stop();

  var zIndex = parseInt(element.getStyle("zIndex")) + 1000;
  var widget = element.down("div.widget_content");
  var outer = new Element("div", { className: "shadow_outer", zIndex: zIndex }),
      top = new Element("div", { className: "shadow_top", zIndex: zIndex }),
      bottom = new Element("div", { className: "shadow_bottom", zIndex: zIndex }),
      content = new Element("div", { className: "shadow_content", zIndex: zIndex });

  content.appendChild(widget);
  outer.appendChild(content);
  outer.appendChild(bottom);
  outer.appendChild(top);
  element.appendChild(outer);

  element.addClassName("dragging");
  $(document.body).addClassName("dragging");

  if (!Prototype.Browser.IE) {
    top.hide();
    bottom.hide();

    new Effect.Parallel([
      new Effect.Appear(top, { sync: true }),
      new Effect.Appear(bottom, { sync: true }),
      new Effect.Fade(element, { sync: true, to: 0.7 })
    ], {
      duration: 0.2
    });
  }
};

Effect.EndDrag = function(element) {
  element = $(element);
  var top = element.down("div.shadow_top"), bottom = element.down("div.shadow_bottom"),
    content = element.down("div.widget_content"), outer = element.down("div.shadow_outer");

  function finish() {
    element.appendChild(content);
    element.removeClassName("dragging");
    element.setStyle({ zIndex: 0 });
    content.setStyle({ zIndex: 0 });
    document.body.removeClassName("dragging");
    outer.remove();

    Nubbins.start();
    InsertionPoint.start();
  }

  if (Prototype.Browser.IE) {
    finish();
  } else {
    new Effect.Parallel([
      new Effect.Appear(element, { from: 0.7, sync: true }),
      new Effect.Fade(top,    { sync: true }),
      new Effect.Fade(bottom, { sync: true })
    ], {
      duration: 0.35,
      afterFinish: finish
    });
  }
};
/* ------------------------------------------------------------------------
 * dragdrop_selector_containment_support.js
 * Copyright (c) 2004-2007 37signals, LLC. All rights reserved.
 * ------------------------------------------------------------------------ */

/* Add support for specifying a Selector for containment */

Object.extend(Droppables, {
  add: Droppables.add.wrap(function(proceed, element) {
    var options = arguments[2] || {}, containment = options.containment;

    if (containment && containment.expression && containment.match) {
      Droppables._containers_by_expression = Droppables._containers_by_expression || {};
      options._container_selector = containment;
      options._containers = 'selector';
      options.containment = null;
    }

    return proceed(element, options);
  }),

  isContained: Droppables.isContained.wrap(function(proceed, element, drop) {
    if (drop._container_selector && drop._containers == 'selector') {
      var selector = drop._container_selector, containers = Droppables._containers_by_expression;
      if (!containers[selector.expression])
        containers[selector.expression] = selector.findElements();
      drop._containers = containers[selector.expression];
    }

    return proceed(element, drop);
  }),

  reset: Droppables.reset.wrap(function(proceed) {
    Droppables._containers_by_expression = {};

    this.drops.each(function(drop) {
      if (drop._container_selector)
        drop._containers = 'selector';
    });

    return proceed();
  })
});
/* ------------------------------------------------------------------------
 * flash.js
 * Copyright (c) 2004-2007 37signals, LLC. All rights reserved.
 * ------------------------------------------------------------------------ */

var Flash = {
  show: function(type, text) {
    $('flash').className = type;
    $('flash').innerHTML = text;

    if (type == 'progress') {
      $('flash').innerHTML += "&hellip;";
    }

    if (!Element.visible('flash')) {
      new Effect.Appear('flash');
    }

    if (type == 'notice' || type == 'alert') {
      setTimeout((function() {
        new Effect.Fade('flash');
      }).bind(this), type == 'notice' ? 2000 : 5000);
    }
  }
};

/* ------------------------------------------------------------------------
 * highlighter.js
 * Copyright (c) 2008 37signals, LLC. All rights reserved.
 * ------------------------------------------------------------------------ */

var Highlighter = {
  hideMatches: function() {
    $$('span.match').invoke('removeClassName', 'match');
    $('highlighter').hide();
  }
};
var InvoiceOptions = {
  toggle: function() {
    $('invoice_options').down('.show').toggle();
    $('invoice_options').down('.edit').toggle();
  },

  submit: function(event) {
    var form = event.element();
    event.stop();

    if (!$F('invoice_receiver').match(/^\s*[^@\s]+@[^@;,\.\s]+\.[^@;,\s]+\s*$/)) {
      alert("Your email address doesn't appear to be valid. Example: billing@example.com");
      return false;
    }

    new Ajax.Request(form.action, {
      asynchronous: true,
      parameters: form.serialize(),
      onCreate: InvoiceOptions.prepare,
      onComplete: InvoiceOptions.complete
    });
  },

  prepare: function() {
    $('invoice_options').down('.submit').addClassName('busy');
  },

  complete: function(response) {
    InvoiceOptions.toggle();
    $('invoice_options').down('.receiver').update($F('invoice_receiver'));
    $('invoice_options').down('.notes').update($F('invoice_notes'));
    $('invoice_options').down('.submit').removeClassName('busy');
    $('invoice_options').highlight();
  }
};

document.observe('dom:loaded', function() {
  if ($('invoice_options')) $('invoice_options').down('form').observe('submit', InvoiceOptions.submit);
});
/* ------------------------------------------------------------------------
 * json_cookie.js
 * Copyright (c) 2004-2007 37signals, LLC. All rights reserved.
 * ------------------------------------------------------------------------ */

var Cookie = {
  get: function(name) {
    var cookie = document.cookie.match(new RegExp('(^|;)\\s*' + escape(name) + '=([^;\\s]*)'));
    return (cookie ? unescape(cookie[2]) : null);
  },

  set: function(name, value, daysToExpire) {
    var attrs = '; path=/';
    if (daysToExpire != undefined) {
      var d = new Date();
      d.setTime(d.getTime() + (86400000 * parseFloat(daysToExpire)));
      attrs += '; expires=' + escape(d.toGMTString());
    }
    return (document.cookie = escape(name) + '=' + escape(value || '') + attrs);
  },

  remove: function(name) {
    var cookie = Cookie.get(name) || true;
    Cookie.set(name, '', -1);
    return cookie;
  }
};

var JsonCookie = {
  get: function(name) {
    return Cookie.get(name).evalJSON();
  },

  set: function(name, value, daysToExpire) {
    return Cookie.set(name, Object.toJSON(value), daysToExpire);
  },

  remove: function(name) {
    return Cookie.remove(name);
  }
};
var Locations = {
  observe_subdomain_field: function() {
    new Form.Element.Observer('subdomain', 1, Locations.on_subdomain_change)
  },

  on_subdomain_change: function(element, value) {
    new Ajax.Request('/id/subdomains/availability', {
      method: 'get',
      onSuccess: Locations.check,
      parameters: { product: 'backpack', subdomain: value }
    })
  },

  check: function(response) {
    var result = response.responseJSON;
    if(result.available || result.subdomain.blank()) {
      $('subdomain_notice').hide();
    } else {
      $('subdomain_notice').innerHTML = '"' + result.subdomain + '" is not available. Please choose another URL.';
      $('subdomain_notice').show();
    }
  }
};

document.observe("dom:loaded", function() {
  if(!$('subdomain')) return;
  Locations.observe_subdomain_field();
});
/* ------------------------------------------------------------------------
 * messages.js
 * Copyright (c) 2004-2008 37signals, LLC. All rights reserved.
 * ------------------------------------------------------------------------ */

document.observe("dom:loaded", function() {
  if ($(document.body).hasClassName("message") && location.hash) {
    var element = $(location.hash.match(/^#(.*)/)[1]);
    if (element) element.highlight({ duration: 2 });
  }
});
/* ------------------------------------------------------------------------
 * gallery.js
 * Copyright (c) 2004-2007 37signals, LLC. All rights reserved.
 * ------------------------------------------------------------------------ */

var Gallery = {
  dividers: [],

  realign: function(gallery) {
    gallery = $(gallery);
    var count = 0, dragging = gallery.hasClassName("dragging"), element = gallery.down();

    if (Prototype.Browser.IE) {
      Gallery.dividers.invoke("remove");
      Gallery.dividers = [];
    }

    while (element) {
      if (element.hasClassName("gallery_widget")) {
        if (count++ % 3 == 0) {
          if (Prototype.Browser.IE) {
            if (!dragging) {
              var divider = new Element("div").setStyle({ clear: "both", width: "525px", height: "1px" });
              element.insert({ before: divider });
              Gallery.dividers.push(divider);
            }
          } else {
            element.setStyle({ clear: "left" });
          }
        } else {
          element.setStyle({ clear: "" });
        }
      }
      element = element.next();
    }
  }
};

Draggables.addObserver({
  onStart: function(eventName, draggable, event) {
    var element = draggable.element;

    if (element.hasClassName("gallery_widget")) {
      this.container = draggable.element.up("div.widget_parent");
      this.container.addClassName("dragging");
    }
  },

  onDrag: function(eventName, draggable, event) {
    if (this.container) {
      Gallery.realign(this.container);
    }
  },

  onEnd: function(eventName, draggable, event) {
    if (this.container) {
      this.container.removeClassName("dragging");
      Gallery.realign.defer(this.container);
      this.container = false;
    }
  }
});
var Gutter = {
  WIDTH:  25,
  HEIGHT: 10
};

document.observe("dom:loaded", function() {
  if (!$(document.body).hasClassName("page")) return;

  var activeElement, activePosition;

  function enterGutter(element, position) {
    if (activeElement == element && activePosition == position)
      return false;

    leaveGutter();
    activeElement = element, activePosition = position;
    activeElement.fire("gutter:entered", { position: activePosition });
  }

  function leaveGutter() {
    if (activeElement)
      activeElement.fire("gutter:exited", { position: activePosition });

    activeElement = activePosition = null;
  }

  document.observe("mousemove", function(event) {
    var element = event.element(), pointer = event.pointer(), offset = element.cumulativeOffset();

    if (pointer.x - offset.left > Gutter.WIDTH) {
      leaveGutter();

    } else if (element.hasClassName("page_widget")) {
      var height = element.getHeight(), top = element.cumulativeOffset().top, bottom = top + height;
      var threshold = [height / 2, Gutter.HEIGHT].min();

      if (element.hasClassName("footer_widget")) {
        enterGutter(element, "top");

      } else if (bottom - pointer.y <= threshold) {
        enterGutter(element, "bottom");

      } else if (pointer.y - top <= threshold) {
        enterGutter(element, "top");

      } else {
        leaveGutter();
      }
    }
  });
});
var InsertionPoint = {
  active: true,

  show: function() {
    this.element.show();
    document.body.addClassName("nubbinless");
  },

  hide: function() {
    this.element.hide();
    document.body.removeClassName("nubbinless");
  },

  move: function(position, widget) {
    if (position == "top") {
      widget.insert({ before: this.element });
    } else {
      widget.insert({ after: this.element });
    }
  },

  set: function() {
    this.element.fire("insertionpoint:set");
  },

  stop: function() {
    this.active = false;
  },

  start: function() {
    this.hide();
    this.active = true;
  }
};

document.observe("dom:loaded", function() {
  InsertionPoint.element = $("insertion_point");
  if (!InsertionPoint.element) return;

  InsertionPoint.element.observe("mousemove", function(event) {
    event.stop();
  });

  InsertionPoint.element.observe("mousedown", function(event) {
    InsertionPoint.set();
    event.stop();
  });

  document.observe("gutter:entered", function(event) {
    if (!InsertionPoint.active) return;

    InsertionPoint.move(event.memo.position, event.element());
    InsertionPoint.show();
  });

  document.observe("gutter:exited", function(event) {
    if (!InsertionPoint.active) return;

    InsertionPoint.hide();
  });
});
var Item = {
  check: function(completed_at) {
    $$('div.controls').first().removeClassName('busy');
    $('item_content').addClassName('completed');
    $('completed_on').innerHTML = completed_at;
  },

  uncheck: function() {
    $$('div.controls').first().removeClassName('busy');
    $('item_content').removeClassName('completed');
    $('completed_on').innerHTML = "";
  }
};
var Notifications = {
  showNotifyForm: function(container) {
    $('notification_section').transition(function() {
      $('notify_of_page').show();
      $('button_to_notify_of_page').hide();
    }).after(function() {
      $('notify_of_page').slideIntoView({ duration: 0.3 });
    })
  },

  hideNotifyForm: function() {
    $('notification_section').transition(function() {
      $('notify_of_page').hide();
      $('button_to_notify_of_page').show();
    })
  },

  validateCheckboxSelection: function(checkboxes) {
    checkboxes = $(checkboxes);
    var form = checkboxes.up("form")
    var submit = form.getInputs("submit").first();
    form.observe("click", function(event) {
      var checked = checkboxes.select("input[type=checkbox]").any(function(box) { return box.checked });
      checkboxes.visible() && !checked ? submit.disable() : submit.enable();
    });
  }
};
var Sharing = {
  revealUserCheckboxes: function(container, checkboxes) {
    checkboxes = $(checkboxes);
    $(container).observe("click", function(event) {
      var radio = event.findElement("input[name=share_with][type=radio]");
      if (radio) {
        if ($F(radio) == "users" && !checkboxes.visible()) {
          checkboxes.transition(function() {
            checkboxes.show();
          });
        } else if ($F(radio) != "users" && checkboxes.visible()) {
          checkboxes.transition(function() {
            checkboxes.hide();
          });
        }
      }
    });
  },

  allCanOnlyView: function() {
    $$("#user_checkboxes input[type=radio][value=read]").each(function(radio) {
      radio.checked = true;
    })
  },

  allCanMakeChanges: function() {
    $$("#user_checkboxes input[type=radio][value=write]").each(function(radio) {
      radio.checked = true;
    })
  }
};
var Slate = {
  show: function(widget, callback) {
    var widget = $(widget);
    this.reposition();
    return Slate.transition(widget, callback.wrap(function($super) {
      $super();
      widget.show();
    }));
  },

  hide: function(widget, callback) {
    var widget = $(widget);
    return Slate.transition(widget, callback.wrap(function($super) {
      $super();
      widget.hide();
    }));
  },

  showFromWidgetBarLink: function(widget, link, callback) {
    if (this.showing) return { after: Prototype.K };
    this.showing = true;
    return this.show(widget, callback).after(function() { this.showing = false }.bind(this));
  },

  reposition: function() {
    (TravelingWidgetBar.active ? TravelingWidgetBar.element : $("slate_wrapper").down()).appendChild($("slate"));

    var widget = $("slate").up().previous(".widget"), belonging = "";
    if (widget) belonging = widget.readAttribute("belonging");
    $("slate").select("input[name*=after_belonging_id]").invoke("setValue", belonging);
  },

  findContainerFor: function(widget) {
    return widget.up(".slate_container");
  },

  transition: function(widget, callback) {
    var container = Slate.findContainerFor(widget), animate = true;
    if (!container) animate = false, container = document.body;
    return container.transition(callback, { animate: animate });
  }
};
var TravelingWidgetBar = {
  active: false,

  initialize: function() {
    this.element = $("traveling_widget_bar");
    this.contentElement = $("traveling_widget_bar_content");

    if (this.element)
      this.element.appendChild(this.contentElement);
  },

  moveAfter: function(element) {
    element.insert({ after: this.element });
  },

  show: function(afterElement) {
    Nubbins.stop();
    InsertionPoint.stop();
    InsertionPoint.element.fade({ duration: 0.3 });

    this.dimPageHeader();
    this.contentElement.show();
    this.active = true;
  },

  hide: function() {
    this.brightenPageHeader();
    this.contentElement.hide();
    this.active = false;

    InsertionPoint.start();
    Nubbins.start();
  },

  cancel: function() {
    this.element.transition(this.hide.bind(this));
  },

  dimPageHeader: function() {
    this.findPageHeader().morph({ backgroundColor: "#ffffff" }, { duration: 0.3 });
  },

  brightenPageHeader: function() {
    this.findPageHeader().morph({ backgroundColor: "#edf3fe" }, { duration: 0.3 });
  },

  findPageHeader: function() {
    return $("widget_bar").up(".page_header");
  }
};

document.observe("dom:loaded", function() {
  TravelingWidgetBar.initialize();
  if (!TravelingWidgetBar.element) return;

  document.observe("insertionpoint:set", function() {
    TravelingWidgetBar.moveAfter(InsertionPoint.element);
    TravelingWidgetBar.element.transition(function() {
      TravelingWidgetBar.show(InsertionPoint.element);
    }).after(function() {
      TravelingWidgetBar.element.slideIntoView();
    });
  });
});
/* ------------------------------------------------------------------------
 * widget.js
 * Copyright (c) 2004-2007 37signals, LLC. All rights reserved.
 * ------------------------------------------------------------------------ */

Widget = {
  serialize: function(widget) {
    widget = $(widget || 'widgets');
    var elements = widget.immediateDescendants().select(function(e) { return e.match("div.widget") });
    return elements.invoke('readAttribute', 'belonging').map(function(belonging) {
      return belonging ? ('belongings[]=' + encodeURIComponent(belonging)) : '';
    }).join('&');
  },

  requestReordering: function(url, container, destination) {
    if (destination && destination.tagName == "A") return;

    container = $(container);
    var widget = Draggables.activeDraggable.element;
    var widgetParent = widget.up('div.widget_parent');
    if (widgetParent != container) return;

    new Ajax.Request(url, {
      parameters: $H({
        container: (container.up('div.widget') || container.up('div.page.content')).id,
        belonging: widget.readAttribute('belonging')
      }).toQueryString() + '&' + Widget.serialize(container)
    });
  },

  requestAdoption: function(url, widget, pageLink) {
    pageLink.addClassName("busy");

    if (pageLink.id == "link_to_new_page") {
      var event = pageLink.readAttribute("onmouseup");
      pageLink.writeAttribute("onmouseup", null);
      (function() { pageLink.writeAttribute("onmouseup", event) }).defer();
    }

    new Ajax.Request(url, {
      parameters: { belonging: widget.readAttribute("belonging") }
    });
  },

  onItemEditKeyPress: function(event) {
    element = Event.element(event);
    if (event.keyCode == 13) {
      element.up('form').onsubmit();
      Event.stop(event);
    }
  },

  ifWidgetHasNoChildren: function(widget, callback) {
    if (!$(widget).down("div.widget:not(.dummy)", 1)) callback();
  }
};

/*--------------------------------------------------------------------------*/

document.observe("dom:loaded", function() {
  if (!$("widgets")) return;

  Draggables.addObserver({
    threshold: 175,

    onStart: function(name, draggable, event) {
      var element = draggable.element;
      if (element.hasClassName("page_widget")) {
        this.widget = element;
        this.offset = Event.pointerX(event);
      }
    },

    onDrag: function(name, draggable, event) {
      if (this.widget) {
        if (!event) return;
        var offset = Event.pointerX(event), difference = offset - this.offset;
        if (difference > this.threshold) {
          this.showTip(event);
        } else if (difference < this.threshold) {
          this.hideTip();
        }
      }
    },

    showTip: function(event) {
      if (!this.tip) {
        this.tip = new Element("div", { style: "display: none", className: "drag_tip" });
        this.tip.update("Drop this on a page in the sidebar to move this item to another page");
        $(document.body).insert({ top: this.tip });
        this.tip.appear({ duration: 0.3 });
      }

      this.moveTip(event);
    },

    hideTip: function() {
      if (this.tip) {
        this.tip.remove();
        this.tip = null;
      }
    },

    moveTip: function(event) {
      var style = { left: Event.pointerX(event) + "px", top: Event.pointerY(event) + "px" };
      this.tip.setStyle(style);
    },

    onEnd: function() {
      if (this.tip) this.hideTip();
      $("widgets").appendChild($("footer_widget"));
      this.widget = this.offset = null;
    }
  });
});
/* ------------------------------------------------------------------------
 * pending_attachments.js
 * Copyright (c) 2004-2008 37signals, LLC. All rights reserved.
 * ------------------------------------------------------------------------ */

var PendingAttachments = {
  add: function(file_selector, id) {
    var offscreen = $(id).down("p.offscreen"), template = $(id).down("p.template");
    var templateHTML = template.innerHTML;

    if (template.down('input').name.match(/^\w+\[\d\]\[\w+\]$/)) {
      var last_key = (offscreen.lastChild) ? Number(offscreen.lastChild.name.match(/(\d+)/).last()) : 0;
      file_selector.name = file_selector.name.sub(/\d/, last_key + 1);
    }

    this.updatePendingAttachments(id);
    offscreen.appendChild(file_selector);
    template.innerHTML = templateHTML;
  },

  remove: function(path, id) {
    this.removeFileSelector(path, id);
    this.updatePendingAttachments(id);
  },

  hasPendingAttachments: function(id) {
    if ($(id).down('.pending_attachments')) {
      var pending_attachments = $(id).down('.pending_attachments').down();
      return pending_attachments && pending_attachments.down();
    } else {
      return false;
    }
  },

  hasExistingAttachments: function(id) {
    if ($(id).getElementsBySelector('.attachments li')) {
      var existing_attachments = $(id).getElementsBySelector('.attachments li');
      return existing_attachments.detect(function(item) { return item.visible(); });
    } else {
      return false;
    }
  },

  findFileSelector: function(path, id) {
    return $(id).select('input.file_selectors').select(function(file_selector) { return file_selector.value == decodeURIComponent(path); }).first();
  },

  removeFileSelector: function(path, id) {
    this.findFileSelector(path, id).remove();
  },

  updatePendingAttachments: function(id) {
    new Ajax.Request('/pending_attachments', { parameters: this.pendingFilesAsParameters(id) + "&id=" + id });
  },

  pendingFilesAsParameters: function(id) {
    return $(id).getElementsBySelector('input.file_selectors').select(function(file_selector) {
      return file_selector.value != "";
    }).collect(function(file_selector) {
      return "files[]=" + encodeURIComponent(file_selector.value);
    }).join("&");
  }
};
/* ------------------------------------------------------------------------
 * return_to.js
 * Copyright (c) 2004-2007 37signals, LLC. All rights reserved.
 * ------------------------------------------------------------------------ */

var ReturnTo = {
  remember: function(source) {
    var destination = window.location.pathname + window.location.search;
    source = source.gsub(/#.*$/, ""); /* strip out anchors */
    if (source != destination) {
      var hash = $H();
      hash.set(source, destination);
      JsonCookie.set("return_to_paths", hash);
    }
  }
};
/* ------------------------------------------------------------------------
 * ie_support.js
 * Copyright (c) 2004-2008 37signals, LLC. All rights reserved.
 * ------------------------------------------------------------------------ */

document.observe("dom:loaded", function() {
  if (Prototype.Browser.IE) {
    var body = $(document.body);

    if (body.hasClassName("reminders")) {
      Transitions.animationEnabled = false;

    } else if (body.hasClassName("page")) {
      var sticky = $("page_changed_sticky");
      if (sticky) {
        $("Main").insert({ after: sticky });
      }

    }
  }
});
/* ------------------------------------------------------------------------
 * iphone_support.js
 * Copyright (c) 2004-2007 37signals, LLC. All rights reserved.
 * ------------------------------------------------------------------------ */

document.observe("dom:loaded", function() {
  if (Prototype.Browser.MobileSafari) {
    $(document.body).addClassName("iphone");
    Transitions.animationEnabled = false;
    HoverObserver.Options.clickToHover = true;
  }
});
/* ------------------------------------------------------------------------
 * writeboard.js
 * Copyright (c) 2004-2007 37signals, LLC. All rights reserved.
 * ------------------------------------------------------------------------ */

var Writeboard = {
  afterComplete: function(request, origin) {
    this.login(request.getResponseHeader("login_url"), request.getResponseHeader("password"));
  },

  login: function(login_url, password) {
    $('writeboard_login_form').action    = login_url;
    $('writeboard_login_password').value = password;
    $('writeboard_login_form').submit();
  },

  importer: {
    complete: function(request) {
      Element.hide('import_writeboard_indicator')
    },

    success: function(request) {
      $('import_url', 'import_password').each(Field.clear);
      $('blank_slate').hide();
      $('newWriteboardBlock', 'importWriteboardBlock').each(Element.toggle);
    },

    on409: function(request) {
      Flash.show('alert',
        'You can not create more Writeboards before you upgrade.')
    },

    on404: function(request) {
      Flash.show('alert',
        'Import failed. Did you enter the right password?')
    }
  }
};
