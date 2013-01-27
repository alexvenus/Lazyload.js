var browserGlobal = (typeof window !== 'undefined') ? window : {};

var MutationObserver = browserGlobal.MutationObserver || browserGlobal.WebKitMutationObserver;
var RSVP, async;

if (typeof process !== 'undefined' &&
  {}.toString.call(process) === '[object process]') {
  async = function(callback, binding) {
    process.nextTick(function() {
      callback.call(binding);
    });
  };
} else if (MutationObserver) {
  var queue = [];

  var observer = new MutationObserver(function() {
    var toProcess = queue.slice();
    queue = [];

    toProcess.forEach(function(tuple) {
      var callback = tuple[0], binding = tuple[1];
      callback.call(binding);
    });
  });

  var element = document.createElement('div');
  observer.observe(element, { attributes: true });

  async = function(callback, binding) {
    queue.push([callback, binding]);
    element.setAttribute('drainQueue', 'drainQueue');
  };
} else {
  async = function(callback, binding) {
    setTimeout(function() {
      callback.call(binding);
    }, 1);
  };
}

var Event = function(type, options) {
  this.type = type;

  for (var option in options) {
    if (!options.hasOwnProperty(option)) { continue; }

    this[option] = options[option];
  }
};

var indexOf = function(callbacks, callback) {
  for (var i=0, l=callbacks.length; i<l; i++) {
    if (callbacks[i][0] === callback) { return i; }
  }

  return -1;
};

var callbacksFor = function(object) {
  var callbacks = object._promiseCallbacks;

  if (!callbacks) {
    callbacks = object._promiseCallbacks = {};
  }

  return callbacks;
};

var EventTarget = {
  mixin: function(object) {
    object.on = this.on;
    object.off = this.off;
    object.trigger = this.trigger;
    return object;
  },

  on: function(eventNames, callback, binding) {
    var allCallbacks = callbacksFor(this), callbacks, eventName;
    eventNames = eventNames.split(/\s+/);
    binding = binding || this;

    while (eventName = eventNames.shift()) {
      callbacks = allCallbacks[eventName];

      if (!callbacks) {
        callbacks = allCallbacks[eventName] = [];
      }

      if (indexOf(callbacks, callback) === -1) {
        callbacks.push([callback, binding]);
      }
    }
  },

  off: function(eventNames, callback) {
    var allCallbacks = callbacksFor(this), callbacks, eventName, index;
    eventNames = eventNames.split(/\s+/);

    while (eventName = eventNames.shift()) {
      if (!callback) {
        allCallbacks[eventName] = [];
        continue;
      }

      callbacks = allCallbacks[eventName];

      index = indexOf(callbacks, callback);

      if (index !== -1) { callbacks.splice(index, 1); }
    }
  },

  trigger: function(eventName, options) {
    var allCallbacks = callbacksFor(this),
        callbacks, callbackTuple, callback, binding, event;

    if (callbacks = allCallbacks[eventName]) {
      for (var i=0, l=callbacks.length; i<l; i++) {
        callbackTuple = callbacks[i];
        callback = callbackTuple[0];
        binding = callbackTuple[1];

        if (typeof options !== 'object') {
          options = { detail: options };
        }

        event = new Event(eventName, options);
        callback.call(binding, event);
      }
    }
  }
};

var Promise = function() {
  this.on('promise:resolved', function(event) {
    this.trigger('success', { detail: event.detail });
  }, this);

  this.on('promise:failed', function(event) {
    this.trigger('error', { detail: event.detail });
  }, this);
};

var noop = function() {};

var invokeCallback = function(type, promise, callback, event) {
  var value, error;

  if (callback) {
    try {
      value = callback(event.detail);
    } catch(e) {
      error = e;
    }
  } else {
    value = event.detail;
  }

  if (value instanceof Promise) {
    value.then(function(value) {
      promise.resolve(value);
    }, function(error) {
      promise.reject(error);
    });
  } else if (callback && value) {
    promise.resolve(value);
  } else if (error) {
    promise.reject(error);
  } else {
    promise[type](value);
  }
};

Promise.prototype = {
  then: function(done, fail) {
    var thenPromise = new Promise();

    if (this.isResolved) {
      RSVP.async(function() {
        invokeCallback('resolve', thenPromise, done, { detail: this.resolvedValue });
      }, this);
    }

    if (this.isRejected) {
      RSVP.async(function() {
        invokeCallback('reject', thenPromise, fail, { detail: this.rejectedValue });
      }, this);
    }

    this.on('promise:resolved', function(event) {
      invokeCallback('resolve', thenPromise, done, event);
    });

    this.on('promise:failed', function(event) {
      invokeCallback('reject', thenPromise, fail, event);
    });

    return thenPromise;
  },

  resolve: function(value) {
    resolve(this, value);

    this.resolve = noop;
    this.reject = noop;
  },

  reject: function(value) {
    reject(this, value);

    this.resolve = noop;
    this.reject = noop;
  }
};

function resolve(promise, value) {
  RSVP.async(function() {
    promise.trigger('promise:resolved', { detail: value });
    promise.isResolved = true;
    promise.resolvedValue = value;
  });
}

function reject(promise, value) {
  RSVP.async(function() {
    promise.trigger('promise:failed', { detail: value });
    promise.isRejected = true;
    promise.rejectedValue = value;
  });
}

EventTarget.mixin(Promise.prototype);

RSVP = { async: async, Promise: Promise, Event: Event, EventTarget: EventTarget };

/*!
* basket.js
* v0.3.0 - 2012-12-18
* http://addyosmani.github.com/basket.js
* (c) Addy Osmani; MIT License
* Created by: Addy Osmani, Sindre Sorhus, Andrée Hansson
* Contributors: Ironsjp, Mathias Bynens, Rick Waldron, Felipe Morais
*/
(function( window, document ) {
    'use strict';

    // Monkey-patching an "all" method onto RSVP
    // Returns a promise that will be fulfilled when the array of promises passed in are all
    // fulfilled
    RSVP.all = function( promises ) {
        var i, results = [];
        var allPromise = new RSVP.Promise();
        var remaining = promises.length;

        var resolver = function( index ) {
            return function( value ) {
                resolve( index, value );
            };
        };
        var resolve = function( index, value ) {
            results[ index ] = value;
            if ( --remaining === 0 ) {
                allPromise.resolve( results );
            }
        };
        var reject = function( error ) {
            allPromise.reject( error );
        };

        for ( i = 0; i < remaining; i++ ) {
            promises[ i ].then( resolver( i ), reject );
        }

        return allPromise;
    };

    var head = document.head || document.getElementsByTagName('head')[0];
    var storagePrefix = 'basket-';
    var defaultExpiration = 5000;

    var addLocalStorage = function( key, storeObj ) {
        try {
            localStorage.setItem( storagePrefix + key, JSON.stringify( storeObj ) );
            return true;
        } catch( e ) {
            if ( e.name.toUpperCase().indexOf('QUOTA') >= 0 ) {
                var item;
                var tempScripts = [];

                for ( item in localStorage ) {
                    if ( item.indexOf( storagePrefix ) === 0 ) {
                        tempScripts.push( JSON.parse( localStorage[ item ] ) );
                    }
                }

                if ( tempScripts.length ) {
                    tempScripts.sort(function( a, b ) {
                        return a.stamp - b.stamp;
                    });

                    basket.remove( tempScripts[ 0 ].key );

                    return addLocalStorage( key, storeObj );

                } else {
                    // no files to remove. Larger than available quota
                    return;
                }

            } else {
                // some other error
                return;
            }
        }

    };

    var getUrl = function( url ) {
        var xhr = new XMLHttpRequest();
        var promise = new RSVP.Promise();
        xhr.open( 'GET', url );

        xhr.onreadystatechange = function() {
            if ( xhr.readyState === 4 ) {
                if( xhr.status === 200 ) {
                    promise.resolve( xhr.responseText );
                } else {
                    promise.reject( new Error( xhr.statusText ) );
                }
            }
        };

        xhr.send();

        return promise;
    };

    var saveUrl = function( obj ) {
        return getUrl( obj.url ).then( function( text ) {
            var storeObj = wrapStoreData( obj, text );

            addLocalStorage( obj.key , storeObj );

            return text;
        });
    };

    var injectScript = function( text ) {
        var script = document.createElement('script');
        script.defer = true;
        // Have to use .text, since we support IE8,
        // which won't allow appending to a script
        script.text = text;
        head.appendChild( script );
    };

    var wrapStoreData = function( obj, data ) {
        var now = +new Date();
        obj.data = data;
        obj.stamp = now;
        obj.expire = now + ( ( obj.expire || defaultExpiration ) * 60 * 60 * 1000 );

        return obj;
    };

    var handleStackObject = function( obj ) {
        var source, promise;

        if ( !obj.url ) {
            return;
        }

        obj.key =  ( obj.key || obj.url );
        source = basket.get( obj.key );

        obj.execute = obj.execute !== false;

        if ( !source || source.expire - +new Date() < 0  || obj.unique !== source.unique ) {
            if ( obj.unique ) {
                // set parameter to prevent browser cache
                obj.url += ( ( obj.url.indexOf('?') > 0 ) ? '&' : '?' ) + 'basket-unique=' + obj.unique;
            }
            promise = saveUrl( obj );
        } else {
            promise = new RSVP.Promise();
            promise.resolve( source.data );
        }

        if( obj.execute ) {
            return promise.then( injectScript );
        } else {
            return promise;
        }
    };

    window.basket = {
        require: function() {
            var i, l, promises = [];

            for ( i = 0, l = arguments.length; i < l; i++ ) {
                promises.push( handleStackObject( arguments[ i ] ) );
            }

            return RSVP.all( promises );
        },

        remove: function( key ) {
            localStorage.removeItem( storagePrefix + key );
            return this;
        },

        get: function( key ) {
            var item = localStorage.getItem( storagePrefix + key );
            try	{
                return JSON.parse( item || 'false' );
            } catch( e ) {
                return false;
            }
        },

        clear: function( expired ) {
            if (window.localStorage !== undefined) {
                var item, key;
                var now = +new Date();

                for ( item in localStorage ) {
                    key = item.split( storagePrefix )[ 1 ];
                    if ( key && ( !expired || this.get( key ).expire <= now ) ) {
                        this.remove( key );
                    }
                }
            }
            
            return this;
        }
    };

    // delete expired keys
    basket.clear( true );

})( this, document );
