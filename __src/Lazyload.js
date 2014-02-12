/**
 * Lazyload.js
 *
 * @description Lazyload.js
 *
 *       The tiny + powerful loading-framework for JavaScript
 *
 *       Lazyload.js is a small but powerful loading framework
 *       for JavaScript. It will help you for example complete
 *       the following tasks:
 *
 *       - load resources (js, css, bin) parallel and serial
 *
 *       - chaining API require().and().and().and().then()...
 *
 *       - build your stack fully comfortable and easy
 *
 *       - managing dependencies for loading resources was never easier
 *
 *       - promise for configuration (fulfilled if all operations done)
 *
 *       Lazyload.js is tested and works on Windows (Vista, XP (32 and
 *       64 Bit) and Linux (e.g. CentOS 5.5) tested with the following
 *       Browser(s):
 *
 *       IE                  Version: (5.5?), 6, 7, 8, 9, 10
 *       Safari              Version: 5.1.7 (7534.57.2)
 *       Google Chrome       Version: 26.0.1384.2 dev-m
 *       Mozilla Firefox     Version: 18.0
 *       Opera               Version: 12.12 (1707)
 *       Safari Mobile       Version: iOS 6.0.1 (iPad2)
 *       Safari Mobile       Version: iOS 6.0.1 (iPhone4)
 *
 * @file Lazyload.js - Contains all modules of Lazyload.js
 * @author    Benjamin Carl <opensource@clickalicious.de>
 * @copyright Copyright 2011 - 2012 clickalicious UG - Benjamin Carl
 * @version   0.0.5
 *
 * @license   MIT License http://en.wikipedia.org/wiki/MIT_License
 *            New BSD license http://www.opensource.org/licenses/BSD-3-Clause
 *
 * @usage
 *
 *    Lazyload.require(
 *        'my/script/jquery-1.8.3.js'
 *    ).and(
 *        'my/script/jquery-ui.js'
 *    ).and(
 *        'my/script/foo.js'
 *    ).then(
 *        function success() {
 *            alert('ready');
 *        },
 *        function failure(failure) {
 *            alert(failure);
 *        }
 *    );
 */
/*global Lazyload:false */
/*global ActiveXObject:false */
/*jslint bitwise: true */
(function (window, document) {
    'use strict';

    /**
     * This namespace is the root for all upcoming namespaces
     *
     * @namespace Lazyload
     */
    window.Lazyload = {

        /**
         * The singleton instance of <tt>Lazyload.js</tt> used by <code>require()</code> and
         * <code>and()</code>
         *
         * @type {Lazyload.Core.Loader}
         * @public
         */
        instance: null,

        /**
         * readystate for external access
         *
         * @type {Boolean}
         * @public
         */
        ready: false,

        /**
         * holds the ready state of the DOM.
         *
         * @type {Boolean}
         * @public
         */
        isDomReady: false,

        /**
         * The on DOM is ready callbacks
         *
         * @type {Array}
         * @public
         */
        onDomReady: [],

        /**
         * This namespace contains all core classes of <tt>Lazyload.js</tt>
         * Currently implemented: <tt>Init, Loader</tt>
         *
         * @property {function} Init   Initializes Lazyload.js (e.g. checks DOM readystate)
         * @property {class}    Loader Loader component of Lazyload.js
         *
         * @todo      Check what happens if DOM is already ready and Lazyload is added ...
         * @namespace Lazyload.Core
         */
        Core:
        {
            /**
             * This method is intend to initialize Lazyload.js. It
             * requires the DOM to be ready for access. This check is
             * only executed once. This is a custom crossbrowser
             * compatible way.
             *
             * @returns void
             * @public
             */
            Init: function ()
            {
                // if dom is already ready do nothing
                if (Lazyload.isDomReady) {
                    return;
                }

                // objects where we can add events to ...
                var d = document, w = window, l = [
                    {'o': d, 'm': [['addEventListener', 'DOMContentLoaded']]}, // matrix of object, event-method
                    {'o': w, 'm': [['addEventListener', 'load']]},
                    {'o': w, 'm': [['attachEvent', 'onload']]}
                ];

                // anonymous autoexec function with the important loop part
                // i've used the anonymous function just to be able to break
                // out of the loop by simply calling 'return'
                (function () {
                    var i,
                        j,
                        f = false,
                        fn = function () {
                            var k,
                                l = Lazyload.onDomReady.length;
                            Lazyload.isDomReady = !f;
                            for (k = 0; k < l; ++k) {
                                Lazyload.onDomReady[k].callback();
                            }
                        };

                    for (i = 0; i < l.length; ++i) {
                        for (j = 0; j < l[i].m.length; ++j) {
                            if (l[i].o[l[i].m[j][0]]) {
                                return l[i].o[l[i].m[j][0]](l[i].m[j][1], fn, f);
                            }
                        }
                    }
                })();

                // set readystate
                Lazyload.ready = true;
            },

            /**
             * @class      Loader
             * @classdesc  The Loader is the core, the heart of Lazyload.js. The core class handles
             * everything from loading resources to parsing dependencies. To complete its tasks it
             * utilize the tools which come with Lazyload.js in form of seperated classes
             * (see @-see tag).
             *
             * @constructs Loader
             * @public
             *
             * @see Simple
             * @see Annotation
             * @see Xhr
             * @see Dom
             */
            Loader: function ()
            {
                /**
                 * The level of nested elements. If we found dependencies 3 levels deep then would
                 * _nestingLevel be 2 at time parsing the deepest dependencies
                 *
                 * @type {number}
                 * @private
                 */
                var _nestingLevel = 0;

                /**
                 * The tree representing all elements in its level of dependency. This is a simple
                 * tree implementation which stores elements only in a vertical hierarchy. Horizontal
                 * Elements are not in any special order. This is a reflection of all dependencies
                 * found
                 *
                 * ||____||
                 *    ||____||
                 *       ||
                 *
                 * @type {Object}
                 * @private
                 */
                var _tree = {};

                /**
                 * The configuration of Lazyload.js
                 *
                 * @type {Object}
                 * @private
                 */
                var _configuration = {
                    dependencyIdentifier: [                              // which identifier(s) should be parsed
                        'import', 'resources', 'configuration', 'properties'
                    ],
                    hash: {
                        algorithm: 'Djb2'
                    },
                    loader:               window.basket,                 // Set basket.js as default loader => caching!
                    extension:            null,                          // Default extension of resource (eg. .js|.css)
                    translate:            '/',                           // Delimiter used for parsing path from class
                    parse:                true,                          // Parse local resources for dependencies?
                    caching:              true,                          // Cache fetched resources?
                    timeout:              0,                             // Timeout for XHR (0 = unlimited/no timeout)
                    pipesMax:             0,                             // Maximum number of parallel pipes allowed
                    debug: {
                        enabled:          false,                         // Debug enabled
                        logger:           function (m) {                 // Logger method
                            // attach your custom logger (e.g. => console.log(m);)
                        }
                    }
                };

                /**
                 * An instance of Simple-Hashing-Class
                 *
                 * @type {Lazyload.Hash.Simple}
                 * @private
                 */
                var _hash = new Lazyload['Hash'][_configuration.hash.algorithm]();

                /**
                 * An instance of Annotation-Parser-Class
                 *
                 * @type {Lazyload.Parse.Annotation}
                 * @private
                 */
                var _annotationParser = new Lazyload.Parse.Annotation();

                /**
                 * The precalculated translations indexed by URI/URL
                 *
                 * @type {Object}
                 * @private
                 */
                var _translations = {};

                /**
                 * The count of currently (time of reading variable)
                 * open pipes.
                 *
                 * @type {number}
                 * @private
                 */
                var _countOpenPipes = 0;

                /**
                 * The cached lazyObjects for reuse within one
                 * (same) session
                 *
                 * @type {Object}
                 * @private
                 */
                var _cache = {};

                /**
                 * The count of resources (including dependencies)
                 * still to load
                 *
                 * @type {number}
                 * @private
                 */
                var _countFilesToLoad = 0;

                /**
                 * A reference to DOM-node "head"
                 *
                 * @type {Object}
                 * @private
                 */
                var _head = document.getElementsByTagName('head')[0];

                /**
                 * A reference to DOM-node "body"
                 *
                 * @type {Object}
                 * @private
                 */
                var _body = document.getElementsByTagName('body')[0];

                /**
                 * Placeholder for _then() callback -> promise for fulfilled
                 * all passed required resources loaded (including parsed references)
                 *
                 * @type {Object}
                 * @private
                 */
                var _then = {success: {api: [], internal: []}, failure: {api: [], internal: []}};

                /**
                 * The queue contains all stack-elements to be loaded
                 *
                 * @type {Array}
                 * @private
                 */
                var _queue = [];

                /**
                 * A list of resources touched by the current
                 * session/instance
                 *
                 * @type {Array}
                 * @private
                 */
                var _touched = [];

                /**
                 * Storage for original error handler (hook)
                 *
                 * @type {Object}
                 * @private
                 */
                var _oe;


                /**
                 * Adds the passed lazyObject to session-cache. The session-cache is
                 * used to prevent <tt>Lazyload.js</tt> from loading resources more
                 * than once
                 *
                 * @param {String} uid        The unique identifier of the lazyObject
                 * @param {Object} lazyObject The lazyObject
                 *
                 * @returns void
                 * @private
                 */
                var _addLazyObjectToCache = function (uid, lazyObject)
                {
                    // we always store items in cache
                    _cache[uid] = lazyObject;
                };

                /**
                 * This method adds a reference (uid) to a lazyObject to the tree.
                 * The tree contains the references to real objects.
                 *
                 * @param {String} uid    The unique identifier used to identify the lazyObject in the tree
                 * @param {String} parent The unique identifier of the parent lazyObject (optional -> if parent exist)
                 *
                 * @returns void
                 * @private
                 *
                 * @todo Cleanup and refactor. This seems not smart enough, more
                 * dirty and quick ;)
                 */
                var _addLazyObjectToTree = function (uid, parent)
                {
                    // assume that a lazyObject has no parent
                    if (parent === null) {
                        // not initialized? init!
                        if (!_tree[_nestingLevel]) {
                            _tree[_nestingLevel] = {};
                            _tree[_nestingLevel][uid] = {};
                        } else {
                            // make current nesting-level an object - we need to set a value so
                            // that x isn't undefined and we use this default value ({})
                            if (_tree[_nestingLevel][uid] === undefined) {
                                _tree[_nestingLevel][uid] = {};
                            }
                        }
                    } else {
                        // reach here: current lazyObject has a parent!
                        if (_tree[_nestingLevel][parent] !== undefined) {
                            _nestingLevel++;
                            _tree[_nestingLevel] = {};
                        }
                        _tree[_nestingLevel][uid] = {};
                    }
                };

                /**
                 * Parses out dependencies from passed source and prepare them in a reusable object.
                 *
                 * @param {String} buffer The JavaScript source code to parse
                 *
                 * @returns {Object} An object containing properties <tt>resources</tt>,
                 *                   <tt>configuration</tt> and <tt>properties</tt>
                 * @private
                 */
                var _parseDependencies = function (buffer)
                {
                    // get dependencies
                    var dependencies  = _annotationParser.parse(buffer, _configuration.dependencyIdentifier),
                        resources     = [],
                        configuration = {},
                        properties    = {},
                        i;

                    // if annotation parser has found dependencies
                    if (dependencies.length) {

                        // iterate over dependencies found
                        for (i = 0; i < dependencies.length; ++i) {

                            switch (dependencies[i][0]) {
                            case 'resources':
                                resources = dependencies[i][1];
                                break;

                            case 'configuration':
                                configuration = eval('(' + dependencies[i][1].toString() + ')');
                                break;

                            case 'properties':
                                properties = eval('(' + dependencies[i][1].toString() + ')');
                                break;
                            }
                        }
                    }

                    // return result as readable object
                    return {
                        resources: resources.toString(),
                        configuration: configuration,
                        properties: properties
                    };
                };

                /**
                 * This method is intend to inject a node (script|css) into DOM.
                 * It takes the lazyObject passed as argument and add either a
                 * "script"- or a "style"-tag to current DOM.
                 *
                 * @param {Object} lazyObject The lazyObjetc to inject into DOM
                 *
                 * @returns void
                 * @private
                 */
                var _injectLazyObjectIntoDom = function (lazyObject)
                {
                    // create element in DOM (script|style)
                    var element = document.createElement(lazyObject.type),
                        source  = '\n' + lazyObject.source + '\n';

                    // set correct content type (text/javascript || text/css)
                    lazyObject.contentType = 'text/' + ((lazyObject.type === 'script') ? 'javascript' : 'css');

                    // set required base properties
                    element.type = lazyObject.contentType;
                    element.id   = lazyObject.domId;

                    // properties by type
                    if (lazyObject.type === 'script') {
                        // process SCRIPT
                        element.defer = true;                             // always! don't worry -> we manage deps!
                        element.text  = source;

                    } else {
                        // process STYLE
                        // set css property X-Browser compatible
                        if (element.styleSheet) {
                            element.styleSheet.cssText = source;
                        } else {
                            element.appendChild(document.createTextNode(source));
                        }
                    }

                    // add node to real clients DOM
                    if (lazyObject.target === 'head') {
                        _head.appendChild(element);

                    } else {
                        _body.appendChild(element);
                    }
                };

                /**
                 * This method is intend to execute a defined callback of ???.
                 *
                 * @param {Object} lazyObject The lazyObjetc to inject into DOM
                 *
                 * @returns void
                 * @private
                 */
                var _callBack = function (fnCallback)
                {
                    fnCallback();
                };

                /**
                 * checks if passed object is empty
                 *
                 * This method is intend to check if the passed object is empty ( === {})
                 * and returns TRUE if empty, otherwise FALSE.
                 *
                 * @param {Object} obj The object to check
                 *
                 * @returns void
                 * @private
                 */

                /**
                 * This method is intend to check if a passed object is empty ({}).
                 *
                 * @param {Object} obj The object to check
                 *
                 * @returns void
                 * @private
                 */
                var _empty = function _empty(obj)
                {
                    for (var property in obj) {
                        return false;
                    }
                    return true;
                };

                /**
                 * This method is intend to inject the current state _tree into
                 * DOM. This method iterates all nesting level beginning at the
                 * deepest and taking care for the parsed dependencies.
                 *
                 * @returns void
                 * @private
                 */
                var _injectCurrentTreeIntoDom = function ()
                {
                    // check if DOM is ready otherwise we have to wait!
                    if (Lazyload.isDomReady) {

                        var currentLevel = _nestingLevel + 1,
                            lazyObject;

                        // iterate from outer to inner starting
                        // at the highest nesting level
                        while (currentLevel--) {
                            for (var uid in _tree[currentLevel]) {
                                // we get item from cache
                                lazyObject = _cache[uid];

                                if (_touched[lazyObject.uri] !== true) {
                                    _injectLazyObjectIntoDom(lazyObject);
                                }

                                // execute callback
                                if (lazyObject.callback) {
                                    _callBack(lazyObject.callback);
                                }

                                // if caching isn't wanted ...
                                if (lazyObject.caching !== true) {
                                    delete _cache[lazyObject.uid];
                                }
                            }
                        }
                    } else {
                        // try again in 10ms and important here: pass promise-callback again!
                        setTimeout(function () { _injectCurrentTreeIntoDom(); }, 10);
                    }
                };

                /**
                 * This method is intend to reset the instance to its initial state.
                 *
                 * @param {Boolean} full TRUE to complete reset state,
                 *                       FALSE (default) to reset just for cycle
                 *
                 * @returns void
                 * @private
                 */
                var _reset = function (full)
                {
                    // recreate default values;
                    _countFilesToLoad = 0;
                    _nestingLevel     = 0;
                    _tree             = {};

                    if (full === true) {
                        // THOSE values can only be resetted after the _success() or  _failure() call
                        _touched = [];
                        _queue   = [];
                        _then    = {success: {api: [], internal: []}, failure: {api: [], internal: []}};
                    }
                };

                /**
                 * This method is intend to check if a passed lazyObject can has dependencies.
                 * This is the case if the parse is enabled in config, the type of the lazyObject
                 * isn't style (css @import is handled by browser) and the resource must no be
                 * parsed already.
                 *
                 * @param {Object} lazyObject The lazyObject to check
                 *
                 * @returns void
                 * @private
                 */
                var _canHasDependencies = function (lazyObject)
                {
                    return (
                        lazyObject.type      === 'script' &&
                        _configuration.parse === true     &&
                        lazyObject.parsed    === false
                    );
                };

                /**
                 * This method is intend to handle dependency processing of a passed lazyObject.
                 * It checks if the lazyObject can has dependencies, if dependencies are configured.
                 * All depedencies are parsed out and pushed on the queue for one of the next
                 * loading cycles.
                 *
                 * @param {Object} lazyObject The lazyObject to handle dependencies for
                 *
                 * @returns void
                 * @private
                 */
                var _handleDependencies = function (lazyObject)
                {
                    var dependencies;

                    if (_canHasDependencies(lazyObject)) {
                        dependencies = _getDependencies(lazyObject);
                    }

                    lazyObject.parsed = true;

                    // dependencies found?
                    if (dependencies) {
                        // add the file(s) to callstack
                        _addToQueue(dependencies.resources, dependencies.properties, dependencies.configuration);

                        // run the stack
                        _processQueue();
                    }
                };

                /**
                 * manages the bypassing of the main error handler (window.onError)
                 *
                 * This method is intend enable or disable (manage) the bypassing of
                 * the main error handler (window.onError)
                 *
                 * @param {Boolean} state TRUE to bypass error-handler, otherwise FALSE
                 *
                 * @returns void
                 * @private
                 */
                var _bypassErrorHandler = function (state)
                {
                    if (state === true) {
                        _oe = window.onerror;
                        window.onerror = function () { return true; };

                    } else {
                        window.onerror = _oe;
                    }
                };

                /**
                 * This method is intend to check if a passed in resource (string) is
                 * a remote resource (begins with 'http(s)' or '//') or if it's a
                 * relative local path.
                 *
                 * @param {String} uri The URI/URL to check
                 *
                 * @returns {Boolean} Returns TRUE if the passed in resource is remote
                 * @private
                 */
                var _isRemoteResource = function (uri) {
                    return (
                        uri.substring(0, 7) === 'http://'  ||
                        uri.substring(0, 8) === 'https://' ||
                        uri.substring(0, 2) === '//'
                    );
                };

                /**
                 * This method is intend to fetch a file through the loader from either a local
                 * or a remote origin. The file is fetched via XHR (local) or through NATIVE (remote)
                 * browser loading. In the first case "XHR" the file can also have further
                 * dependencies which are parsed (depends on config {parse: true|false}). In the
                 * second case the "NATIVE" way it is (currently: i work on an implementation of
                 * http://www.naden.de/blog/cross-domain-ajax-proxy) not possible to load.
                 *
                 * @param {Object} lazyObject The lazyObject to fetch source for
                 *
                 * @returns {Boolean} Returns TRUE if the function was executed till end
                 * @private
                 */
                var _fetchResource = function (lazyObject)
                {
                    // loader configured?
                    if (_configuration.loader !== undefined &&
                        window.localStorage   !== undefined &&
                        !_isRemoteResource(lazyObject.uri)
                    ) {
                        // patch = currently easiest way to transfer it to callback without hassle
                        _configuration.loader.lazyObject = lazyObject;

                        // bypass error handler cause basket.js triggers some confusing output
                        // i must check first (deeper analysis)
                        _bypassErrorHandler(true);

                        // dispatch this
                        _configuration.loader.require({
                            url: lazyObject.uri,
                            key: lazyObject.uid

                        }).then(function () {
                            // disable bypass ...
                            _bypassErrorHandler(false);

                            var lazyObject = _configuration.loader.lazyObject;

                            // get source from loader!
                            lazyObject.source = _configuration.loader.get(lazyObject.uid).data;

                            // do some more stuff like we do in native Lazyload mode ... ?
                            if (lazyObject.source) {
                                // do all the things required after a file loaded
                                _afterFileLoaded(lazyObject, true);
                            } else {
                                // handle failure (callback?)
                                _failure(lazyObject.uri);

                                // and then reset Lazyload.js' state
                                _reset(true);
                            }
                        });

                    } else {

                        // check for unlimited or free pipe
                        if (_configuration.pipesMax === 0 || (_countOpenPipes < _configuration.pipesMax)) {

                            var pipe;

                            // increase the open pipe count!
                            _countOpenPipes++;

                            // check if resource is remote => XHR won't work on those
                            if (_isRemoteResource(lazyObject.uri)) {
                                pipe = new Lazyload.Pipe.Dom();
                            } else {
                                pipe = new Lazyload.Pipe.Xhr();
                            }

                            pipe
                            .create({
                                timeout: _configuration.timeout,
                                url: lazyObject.uri,
                                preventBrowserCaching: !lazyObject.caching,
                                callback: function (result, buffer) {
                                    _genericCallBack(
                                        result,
                                        buffer,
                                        lazyObject
                                   );
                                },
                                type: lazyObject.type,
                                source: document,
                                target: _head
                            })
                            .open();
                        } else {
                            // if pipes-max reached we try again in 100ms
                            setTimeout(function () { _fetchResource(lazyObject); }, 100);
                        }
                    }

                    return true;
                };

                /**
                 * This method is intend as generic callback handler. The callback of
                 * native or Xhr loader are pretty similar and so we can reduce the code
                 * a bit and use this generic approach.
                 *
                 * @param {Boolean} result     TRUE if request was successfully processed, otherwise FALSE
                 * @param {String}  buffer     The source (if access granted) as string
                 * @param {Object}  lazyObject The last processed lazyObject
                 *
                 * @returns void
                 * @private
                 */
                var _genericCallBack = function (result, buffer, lazyObject)
                {
                    // reduce the open pipe count
                    _countOpenPipes--;

                    // check if pipe is SCRIPT tag -> can't have dependencies
                    if (!buffer) {
                        // monkey patch: disable parsing for this type of object external
                        // resources source can't be accessed so we can't parse it's dependencies
                        lazyObject.parsed = true;
                    } else {
                        // here we can do whatever we want. full access to source
                        // got valid result?
                        if (result === true) {
                            // retrieve source
                            lazyObject.source = buffer;

                        } else {
                            // handle failure (callback?)
                            _failure(lazyObject.uri);

                            // and then reset Lazyload.js' state
                            _reset(true);
                            // TODO: throw exception?!
                        }
                    }

                    // do what ever waiting for you
                    _afterFileLoaded(lazyObject, true);
                };

                /**
                 * General callback for "file was loaded" no matter from where (source).
                 * Simple collection of method calls (dispatcher).
                 *
                 * @param {Object}  lazyObject   The lazyObject loaded
                 * @param {Boolean} storeToCache TRUE to store the lazyObject in cache, or FALSE to do not [default]
                 *
                 * @returns void
                 * @private
                 */
                var _afterFileLoaded = function (lazyObject, storeToCache)
                {
                    // reduce count of file currently about to be loaded
                    _countFilesToLoad--;

                    // check if we must cache the object
                    if (storeToCache === true) {
                        // add the object to cache
                        _addLazyObjectToCache(lazyObject.uid, lazyObject);
                    }

                    // handle file dependencies (this only requires a lazyObject with .source set)
                    _handleDependencies(lazyObject);

                    // add it to tree (position) for injection into DOM
                    _addLazyObjectToTree(lazyObject.uid, lazyObject.parent);

                    // check for further processing ...
                    if (_countFilesToLoad === 0) {
                        // inject the whole existing tree into dom
                        _injectCurrentTreeIntoDom();

                        // then reset current state to the state of startup with no stack in progress
                        _reset();

                        // and at last and least run against the stack again
                        _processQueue();
                    }
                };

                /**
                 * translates the request into a processable lazyObject
                 * This method is intend to translate a request (object) to a lazyObject
                 * we need to perform the further tasks.
                 *
                 * @param {String}      fileName   The filename (including path)
                 * @param {object|null} properties The optional properties
                 *
                 * @returns lazyObject A full-qualified and parsable lazyObject
                 * @private
                 */
                var _convertToLazyObject = function (fileName, properties)
                {
                    // the requested class arguments
                    var lazyObject,
                        uid,
                        property;

                    if (properties !== undefined && properties.uid) {
                        uid = properties.uid;
                    } else {
                        uid = _hash.calculate(fileName);
                    }

                    // already translated? => this operation is expensive!
                    if (!_translations[uid]) {

                        lazyObject = _getLazyObjectSkeleton(fileName, uid);

                        lazyObject.lazyClass            = lazyObject.lazyPackage.asArray.pop();
                        lazyObject.lazyPackage.asString = lazyObject.lazyPackage.asArray.join(_configuration.translate);
                        lazyObject.path                 = lazyObject.lazyPackage.asArray.join('/') + '/';
                        lazyObject.file                 = lazyObject.lazyClass +
                                                          ((_configuration.extension) ? _configuration.extension : '');
                        lazyObject.uri                  = lazyObject.path + lazyObject.file;

                        // store translation for further faster access
                        _translations[uid] = lazyObject;

                    } else {
                        // get lazyObject from translation
                        lazyObject = _translations[uid];
                    }

                    // now patch in given override properties
                    for (property in properties) {
                        lazyObject[property] = properties[property];
                    }

                    // return lazyObject
                    return lazyObject;
                };

                /**
                 * Handles the queue by popping of elements to load, prepare those
                 * elements to fit our needs and start the loading process. Currently
                 * in an ugly state and need to get refactored asap.
                 *
                 * @returns void
                 * @private
                 *
                 * @todo Yep friends definitively ugly and worth to get refactored :/
                 */
                var _require = function ()
                {
                    var set = _queue.pop();                // get next element from stack

                    if (set['configuration'] !== undefined) {
                        for (var key in set.configuration) {
                            _configuration[key] = set.configuration[key];
                        }
                    }

                    var lazyObject,
                        resources   = set.resources.split(','),    // get resources from callstack
                        i;

                    for (i = 0; i < resources.length; ++i) {
                        resources[i] = resources[i].trim();
                        lazyObject   = _convertToLazyObject(resources[i], set.properties);

                        if (resources[i].split('.').pop() === 'css') {
                            lazyObject.type = 'style';
                        }

                        // increase count of resources beeing loaded
                        _countFilesToLoad++;

                        // fetch from remote (if caching disabled) OR (if caching enabled AND object not in cache)
                        if ((!lazyObject.caching) ||
                            (
                             lazyObject.caching &&
                             !_cache[lazyObject.uid] &&
                             !_touched[resources[i]]
                            )
                        ) {
                            // set we do this file to true -> cache check isn't enough cause at larger
                            // resources the distance is to short
                            _touched.push(resources[i]);

                            // get our resource from a remote source
                            _fetchResource(lazyObject);

                        } else {
                            // trigger method for file-loaded
                            _afterFileLoaded(lazyObject, false);
                        }
                    }
                };

                /**
                 * Checks queue for state (still items to process?) and starts
                 * the next cycle if queue isn't empty, otherwise the callback(s)
                 * are executed and the state get reset to default.
                 *
                 * @returns void
                 * @private
                 */
                var _processQueue = function ()
                {
                    // check if still items to load in queue
                    if (_queue.length > 0) {
                        // reaching this point -> go on with existing items
                        _require();

                    } else {
                        // get success callbacks
                        var callbacks = _success(),
                            processed = (_touched.toString().split(','));

                        // reset Lazyload.js' state completely
                        _reset(true);

                        // call the success callbacks - all items of this call construct where loaded
                        for (var i = 0; i < callbacks.length; ++i) {
                            callbacks[i](processed);
                        }
                    }
                };

                /**
                 * This method is intend to fulfill the promise in case of
                 * success. If everything was completed correctly and all
                 * resources done this last callback get executed.
                 *
                 * @returns void
                 * @private
                 */
                var _success = function ()
                {
                    var f,
                        type = (!arguments[0]) ? 'api' : arguments[0],
                        result = [];

                    // and then finally call inline callback
                    for (var i = 0; i < _then.success[type].length; ++i) {
                        // extract function callback
                        f = _then.success[type][i];
                        _then.success[type].splice(i, 1);
                        result.push(f);
                    }

                    return result;
                };

                /**
                 * This method is intend to fullfill the promise in case of
                 * failure. If anything went wrong and a resource could not
                 * be loaded properly this callback get executed.
                 *
                 * @param {String} uri The resource URI/URL which failed to fetch
                 *
                 * @returns void
                 * @private
                 */
                var _failure = function (uri)
                {
                    var type = (!arguments[1]) ? 'api' : arguments[1],
                        f;

                    // and then finally call inline callback
                    for (var i = 0; i < _then.failure[type].length; ++i) {
                        // extract function callback
                        f = _then.failure[type][i];

                        // slice out from original array
                        _then.failure[type].splice(i, 1);

                        // call
                        f(uri);
                    }
                };

                /**
                 * This method is intend to retrieve the dependencies from parser
                 * and return the result as object.
                 *
                 * @param {String} uri The resource URI/URL which failed to fetch
                 *
                 * @returns {Object|Boolean} Returns object [see example] or false
                 *                           if no dependencies found
                 * @example
                 * {
                 *     resources: '...',
                 *     configuration: '...',
                 *     properties: '...'
                 * }
                 *
                 * @private
                 */
                var _getDependencies = function (lazyObject)
                {
                    // parse dependencies
                    var dependencies = _parseDependencies(lazyObject.source);

                    // dependencies found?
                    if (dependencies.resources.length > 0) {
                        // inject the parent-uid! important for handling nested set(s)
                        dependencies.properties.parent = lazyObject.uid;

                        return dependencies;
                    }

                    // if no dependencies found we can't add any
                    return false;
                };

                /**
                 * This method acts as getter and setter. If no argument is passed
                 * to this method it simply returns the current active configuration
                 * of Lazyload.js. If you pass an argument {Object} to this method
                 * it acts as setter and returns the new configuration as object.
                 * Values from passed argument (1) will override values in existing
                 * configuration.
                 *
                 * @returns {Object} Returns the new configuration
                 *
                 * @example
                 * {
                 *     x: '...',
                 *     parse: false,
                 *     y: '...'
                 * }
                 *
                 * @public
                 */
                this.config = function ()
                {
                    var cfg = (arguments[0]) ? arguments[0] : undefined;

                    if (cfg !== undefined) {
                        // iterate over config and store as final config
                        for (var property in cfg) {
                            _configuration[property] = cfg[property];
                        }
                    }

                    return _configuration;
                };

                /**
                 * Require takes a string containing a single or comma separated
                 * list of file names as argument. This resources are added to queue
                 * and the queue is processed afterwards.
                 *
                 * @param {String} resources     The ressource(s) to load seperated by a comma within the same string
                 *                               (e.g. "my/script/foo.js" or "my/script/foo.js, //foo.tld/script.js")
                 *                               resources added here (from 2nd -> n) will be loaded parallel (async)
                 * @param {Object} properties    The properties merged with lazyObject-skeleton valid for all resources
                 *                               passed in as argument "resources". Existing values will be overwritten
                 *                               by properties passed in
                 * @param {Object} configuration The configuration merged with existing configuration valid for all
                 *                               resources passed in as argument "resources". Existing values will be
                 *                               overwritten by configuration passed in.
                 *
                 * @example
                 * Lazyload.require('my/script/foo.js')
                 * .then(s, f);
                 *
                 * @returns {Lazyload.Core.Loader} The current instance for chaining
                 * @public
                 */
                this.require = function (resources, properties, configuration)
                {
                    // add the file(s) to callstack
                    _addToQueue(resources, properties, configuration);

                    // run the stack
                    _processQueue();

                    /** @lends Lazyload.Core.Loader */
                    return this;

                };

                /**
                 * Adds a single file or a list of resources to queue. Almost all
                 * tasks of Lazyload.js are async so sometimes it happened
                 * that the timing is so bad and Lazyload.js ran dry. A call to
                 * _processQueue is triggered on each call to this method to
                 * prevent Lazyload.js from running dry. A call to require()
                 * is required first - before! calling and().
                 *
                 * @param {String} resources     The ressource(s) to load seperated by a comma within the same string
                 *                               (e.g. "my/script/foo.js" or "my/script/foo.js, //foo.tld/script.js")
                 *                               resources added here (from 2nd -> n) will be loaded parallel (async)
                 * @param {Object} properties    The properties merged with lazyObject-skeleton valid for all resources
                 *                               passed in as argument "resources". Existing values will be overwritten
                 *                               by properties passed in
                 * @param {Object} configuration The configuration merged with existing configuration valid for all
                 *                               resources passed in as argument "resources". Existing values will be
                 *                               overwritten by configuration passed in.
                 *
                 * @example
                 * Lazyload.require('...')
                 * .and(
                 *     'my/script/foo.js'
                 * ).then(s, f);
                 *
                 * @returns {Lazyload.Core.Loader} The current instance for chaining
                 * @public
                 */
                this.and = function (resources, properties, configuration)
                {
                    // add the file(s) to callstack
                    _addToQueue(resources, properties, configuration);

                    // run the stack?
                    if (_isDry() === true) {
                        _processQueue();
                    }

                    /** @lends Lazyload.Core.Loader */
                    return this;

                };

                /**
                 * This is Lazyload.js' "Future (Promise)" implementation like described here:
                 * http://de.wikipedia.org/wiki/Future_%28Programmierung%29
                 * So this method is intend as Promise to the caller. The caller can pass
                 * two arguments to this function. The first one is the callback for success
                 * and the second argument is the callback in case of a failure.
                 *
                 * @param {Function} success The function/method callback in case of success
                 * @param {Function} failure The function/method callback in case of failure
                 *
                 * @example
                 * Lazyload.require('...')
                 * .and('...')
                 * .then(
                 *     function success () {
                 *         // whatever you want to do in case of successful fulfilled promise
                 *     },
                 *     function failure () {
                 *         // whatever you want to do in case of failure while trying to fulfill promise
                 *     }
                 * );
                 *
                 * @returns {Lazyload.Core.Loader} The current Loader instance for chaining
                 * @see http://de.wikipedia.org/wiki/Future_%28Programmierung%29
                 * @public
                 */
                this.then = function (success, failure)
                {
                    // set success method
                    if (typeof success === 'function') {
                        _then.success['api'].push(success);
                    }

                    if (typeof failure === 'function') {
                        _then.failure['api'].push(failure);
                    }

                    /** @lends Lazyload.Core.Loader */
                    return this;

                };

                /**
                 * This method is intend to check if the loader was run dry. So that no
                 * more resources get loaded.
                 *
                 * @returns {Boolean} TRUE if all conditions match, otherwise FALSE
                 * @private
                 */
                var _isDry = function ()
                {
                    return (
                        _empty(_tree)     === true &&
                        _countOpenPipes   === 0    &&
                        _countFilesToLoad === 0
                    );
                };

                /**
                 * This method is intend to add the passed file(s) to queue and optionally
                 * adds properties + configuration for this queued items.
                 *
                 * @param {String} resources     The file(s) to add to queue
                 * @param {Object} properties    The properties as override for these resources
                 * @param {Object} configuration The configuration to set as new global configuration
                 *
                 * @returns void
                 * @private
                 */
                var _addToQueue = function (resources, properties, configuration)
                {
                    // create a simple queue object
                    var queueObject = {
                        resources: resources,
                        properties: properties,
                        configuration: configuration
                    };

                    // and add it to queue (at beginning! -> FIFO not a bug!)
                    // we put elements at beginning array = [NEW, o, l, d]
                    // and pop then the oldest for processing .pop()
                    _queue.unshift(queueObject);
                };

                /**
                 * Creates, preconfigures and returns a lazyObject default skeleton.
                 *
                 * @param {String} uri The URI of the resource which lazyObject
                 * @param {String} uid The UID of the lazyObject (hash based on uri)
                 *
                 * @returns {lazyObject} A basic lazyObject (skeleton)
                 *
                 * @private
                 */
                var _getLazyObjectSkeleton = function (uri, uid)
                {
                    return {
                        domId: uri,                                      // The Id to identify the object in DOM
                        args: null,                                      // The arguments used if auto-instanc. is used
                        callback: null,                                  // Callback-Method (triggered after inj to DOM)
                        caching:  _configuration.caching,                // Object based caching directive
                        uid: uid,                                        // The uid (unique identifier)
                        parent: null,                                    // Parent item of this item (default = parent)
                        lazyClass: '',                                   // The Class(-name)
                        path: '',                                        // The (relative or full) path to file
                        file: '',                                        // The filename
                        uri: '',                                         // The full uri (combination of path + file)
                        wait: false,                                     // Not implemented yet
                        type: 'script',                                  // Which type is this object of (script|style)
                        target: 'head',                                  // Where to add the element
                        parsed: false,                                   // Was resource parsed already?
                        lazyPackage: {                                   // The Package path (e.g. Foo.Bar.Foobar)
                            asString: false,                             // The Package as String
                            asArray: uri.split(_configuration.translate) // The Package as Array
                        }
                    };
                };

                // parse the config if given
                if (arguments[0] !== undefined) {
                    this.config(arguments[0]);
                }

                /** @lends Lazyload.Loader */
                return this;

            } // end class Loader()
        }, // end namespace Lazyload.Core

        /**
         * This namespace contains all hashing relevant tools of Lazyload.js
         * Currently supported: Xhr, Dom
         *
         * @property {class} Djb2   Calculates the djb2 hash
         * @property {class} Simple Calculates a simple custom hash
         *
         * @namespace Lazyload.Hash
         */
        Hash:
        {
            /**
             * @class      Djb2
             * @classdesc  This class is implements the djb2 algorithm as described here:
             * http://www.cse.yorku.ca/~oz/hash.html
             *
             * @example    Algorithm: hash(i) = hash(i - 1) * 33 ^ str[i];
             *
             * @constructs Djb2
             * @public
             * @deprecated
             */
            Djb2: function ()
            {
                /**
                 * This method is intend to calculate the djb2 hash.
                 * Calculating a djb2 is much faster then using crc(8, 16, 32), md5 or sha1.
                 * The djb2 algorithm (k=33) was first reported by dan bernstein many years
                 * ago in comp.lang.c. another version of this algorithm (now favored by
                 * bernstein) uses xor: hash(i) = hash(i - 1) * 33 ^ str[i]; the magic of
                 * number 33 (why it works better than many other constants, prime or not)
                 * has never been adequately explained.
                 *
                 * @param {String} buffer The buffer (string) to calculate hash for
                 *
                 * @returns {String} The generated hash
                 * @public
                 * @see http://www.cse.yorku.ca/~oz/hash.html
                 */
                this.calculate = function (buffer)
                {
                    var i,
                        h = 5381;

                    for (i = 0; i < buffer.length; ++i) {
                        // h * 33 + c
                        h = ((h << 5) + h) + buffer[i];
                    }

                    return h;
                };

                /** @lends Lazyload.Hash.Djb2 */
                return this;

            }, // end class Djb2()

            /**
             * @class      Simple
             * @classdesc  This class is implements the simple algorithm
             *
             * @example    Algorithm: h += (buffer.charCodeAt(p - 1) * p) | (buffer.charCodeAt(p) * (p + 1));
             *
             * @constructs Simple
             * @public
             */
            Simple: function ()
            {
                /**
                 * Calculates a simple hash for passed input (source unknown).
                 *
                 * @param {String} buffer The buffer (string) to calculate hash for
                 *
                 * @returns {String} The calculated hash
                 * @public
                 */
                this.calculate = function (buffer)
                {
                    var h = 0;

                    for (var p = 1; p < buffer.length; ++p) {
                        h += (buffer.charCodeAt(p - 1) * p) | (buffer.charCodeAt(p) * (p + 1));
                    }

                    return h;
                };

                /** @lends Lazyload.Hash.Simple */
                return this;

            } // end class Simple()
        }, // end namespace Lazyload.Hash

        /**
         * This namespace contains all parser relevant tools of Lazyload.js
         * Currently supported: Annotation
         *
         * @property {class} Annotation Provides the functionality for parsing dependencies out of a JavaScript source
         *
         * @namespace Lazyload.Parse
         */
        Parse:
        {
            /**
             * @class      Annotation
             * @classdesc  The Annotation-class provides the functionality for parsing out the
             *             dependencies of a JavaScript sourcefile. It identifies the
             *             dependencies by searching for the javadoc style annotations.
             *             Lazyload.js currently makes use of the following annotations:
             *             <tt>@resources</tt>, <tt>@configuration</tt>, <tt>@properties</tt> (see example)
             *
             * With <tt>@resources</tt> you define dependencies of the current code-block (a code-block is any part of
             * code with a javadoc-style comment. Within one single physical file can exist n parts of <tt>Lazyload.js
             * </tt> directives) Use <tt>@resources</tt> like this: <tt>@resources path/to/file/foo.js</tt> (single
             * file) or <tt>@resources path/to/file/foo.js, //ajax.googleapis.com/ajax/libs/jquery/1.8.3/jquery</tt>
             * (multiple resources - loaded in order they appear). With <tt>@configuration</tt> you can define a
             * configuration object which is merged with existing configuration when loading resources from
             * <tt>@resources</tt>. The passed "@configuration" will then overwrite values in the existing configuration
             * . With <tt>@properties</tt> you can define a property object which is merged with the fresh created
             * lazyObject skeleton. The passed <tt>@properties</tt> overwrites existing values.
             *
             * @example
             * /**
             *  * @resources view/static/script/js/bar.js
             *  * @configuration {configuration: 'override'}
             *  * @property {property: 'override'}
             *  * /
             *
             * @see        ../__test/view/static/script/js/foo.js
             *
             * @constructs Annotation
             * @public
             */
            Annotation: function ()
            {
                /**
                 * This method is intend to check if a passed value can be found
                 * in a passed object. The method only checks the first level
                 * and does not support recursion. I explicitly not prototyped on
                 * Array and/or Object base objects of JS cause that will make
                 * for/in loops useless and i need them to prevent us from using
                 * large null-arrays with hashes as index like _dom[124894].
                 *
                 * @param {Object} obj   The object to look in
                 * @param {*}      value The value to look for
                 *
                 * @returns {Boolean} TRUE if passed <tt>*</tt> could be found in passed <tt>obj</tt>
                 * @public
                 */
                var _contains = function (obj, value)
                {
                    for (var i = 0; i < obj.length; i++) {
                        if (obj[i] === value) {
                            return true;
                        }
                    }

                    return false;
                };

                /**
                 * Searches in passed <tt>source</tt> for annotations and return all valid annotations
                 * like "@foo" or "@bar" as array.
                 *
                 * @returns {Array} The result containing annotations parsed out from buffer
                 * @public
                 */
                this.parse = function (buffer, reduce)
                {
                    // tmp transformation array
                    var tmp,
                        annotations = [],
                        matches     = buffer.match(/(@)[\w\d]+[\s]+[{}\w\d\/.\:,'"\s]+/g);

                    // if we found dependency patterns
                    if (matches && matches.length) {
                        var i;

                        // pre-process them
                        for (i = 0; i < matches.length; ++i) {
                            var splitByPosition = matches[i].indexOf(' ');

                            if (splitByPosition !== -1) {
                                var key   = matches[i].substr(0, splitByPosition).replace('@', '');
                                var value = matches[i].substr(splitByPosition+1);

                                // check if attribute (key) is a allowed one:
                                if (!reduce || _contains(reduce, key)) {
                                    // is a list (,) ?
                                    if (value.indexOf(',') !== -1) {
                                        value = value.split(',');
                                    } else {
                                        value = [value];
                                    }

                                    tmp = [
                                        key,
                                        value
                                    ];

                                    annotations.push(tmp);
                                }
                            }
                        }
                    }

                    // return found annotations
                    return annotations;
                };

                /** @lends Lazyload.Parse.Annotation */
                return this;

            } // end class Annotation
        }, // end namespace Lazyload.Parse

        /**
         * This namespace contains all connection relevant tools of Lazyload.js
         * Currently supported: Xhr, Dom
         *
         * @property {class} Xhr This class is a helper for handling XML-Http-Request's
         * @property {class} Dom This class is intend to handle native browser script-tag loading
         *
         * @namespace Lazyload.Pipe
         */
        Pipe:
        {
             /**
              * @class      Xhr
              * @classdesc  This class is a helper which makes the handling of <tt>XML-Http-Request</tt>'s
              * a bit easier. The class adds one level of abstraction when providing access to
              * the browsers native <tt>XHR</tt> object (x-browser-compatible). This enables us also to
              * access both the <tt>Dom</tt> and the <tt>Xhr</tt> with the same code (interface) and this
              * saves us a lot of extra code in core.
              *
              * @constructs Xhr
              * @public
              */
            Xhr: function ()
            {
                /**
                 * The instance of XML-HTTP-REQUEST-object (please refer to your
                 * browser documentation for a concrete name of the object. it
                 * depends on the current browser.)
                 *
                 * @type {Object}
                 * @private
                 */
                var _connection;


                /**
                 * Creates and preconfigures a new <tt>XML-HTTP-REQUEST</tt>-object with
                 * the passed in configuration in <code>requestObject</code>. To tell the
                 * XHR that it should start with loading of the resource you have to call
                 * the open()-method after the call to create(). The calls can be chained:
                 * e.g. <code>new Xhr().create({}).open();</code>
                 *
                 * @param {Object} requestObject The configuration for XHR object
                 *
                 * @example
                 * var requestObject =
                 * {
                 *     url: 'my/script/jquery.min.js',
                 *     type: 'script',
                 *     source: document,
                 *     target: head,
                 *     callback: function (result, buffer) {
                 *         // your callback code
                 *     }
                 * }
                 *
                 * @returns {Lazyload.Pipe.Xhr} The instance for chaining
                 * @public
                 *
                 * @todo We need a switch (type: 'script' | 'image' | 'style' | 'flash') to
                 * support different types (imgages, shockwave-flash ...). One Milestone is
                 * the implementation of jpeg, gif, png (prefetching of data through
                 * JavaScript -> images loaded by JS get cached in browser cache so
                 * Lazyload.js can be instrumentalized to prefetch data in background.
                 */
                this.create = function (requestObject)
                {
                    // check requestObject for needed basic parameter
                    if (requestObject.preventBrowserCaching !== true) {
                        requestObject.preventBrowserCaching = false;
                    }

                    if (!requestObject.method) {
                        requestObject.method = 'get';
                    }

                    if (!requestObject.callback) {
                        requestObject.callback = function () {};
                    }

                    // TODO: "+new Date()" how to use with lint/hint
                    if (requestObject.preventBrowserCaching) {
                        requestObject.url += '?_ac=' + new Date().getTime();
                    }

                    // create xhr instance -> TODO: chain next open() call here
                    _connection = _getXhr();

                    // TODO: check if this still needed. maybe we can reference "requestObject.callback"
                    //       directly within the anonymous function.
                    var _callback = requestObject.callback;

                    // check for timeout
                    // [default is 0 which means unlimited time for fetching resources]
                    if (requestObject.timeout > 0) {

                        // set timeout
                        _connection.timer = setTimeout(
                            // anonymous function
                            function () {
                                // cancel the request in XHR object
                                _connection.abort();

                                // call the callback with correct scope
                                _callback(false);
                            },
                            requestObject.timeout
                        );
                    }

                    // what's to do on status change
                    _connection.onreadystatechange = function onreadystatechange() {
                        // if not finished loading
                        if (_connection.readyState !== 4) {
                            return;
                        }

                        // remove timer for timeout
                        clearTimeout(_connection.timer);

                        // call back with reference to this instance
                        _callback((_connection.status === 200) ? true : false, _connection.responseText);
                    };

                    // try to open the request (catch exceptions like invalid url ...)
                    _connection.open(requestObject.method, requestObject.url, true);

                    /** @lends Lazyload.Pipe.Xhr */
                    return this;

                };

                /**
                 * This method is intend to open the previously created (create()) pipe.
                 * I decided to split the open command from the creation process so i
                 * am able to process and configure some parts of Lazyload.js before
                 * loading begins.
                 *
                 * @returns {Lazyload.Pipe.Xhr} instance of this class for chaining
                 * @public
                 */
                this.open = function ()
                {
                    _connection.send(null);

                    /** @lends Lazyload.Pipe.Xhr */
                    return this;

                };

                /**
                 * This method is intend to create an instance of the browser's native
                 * (i call it XML-HTTP-REQUEST-object) object. This is of course done
                 * in a x-browser-compatible way. I decided here to support IE5.5 too
                 * (currently not fully implemented) cause it's not that much more work
                 * and Lazyload.js will cover up to 100% of the (modern) Browsers out
                 * there.
                 *
                 * @returns {Object} instance of browsers native XHR object
                 * @private
                 */
                var _getXhr = function ()
                {
                    try { return new XMLHttpRequest(); } catch (e) {}                     // Moz, Opera, Safari, IE > 6
                    try { return new ActiveXObject('Microsoft.XMLHTTP'); } catch (e) {}   // IE6
                    try { return new ActiveXObject('Msxml2.XMLHTTP'); } catch (e) {}      // IE5
                    return null;
                };

                /** @lends Lazyload.Pipe.Xhr */
                return this;

            },

            /**
             * @class      Dom
             * @classdesc  This class is intend to handle native browser script-tag loading. This way
             *             of loading resources enables me to load resources from external. It supports
             *             loading without protocol (HTML5 like [<tt>//</tt>])and it triggers a clean
             *             and x-browser-compatible onload event.
             *
             * @constructs Dom
             * @public
             */
            Dom: function ()
            {
                /**
                 * The request object used for
                 * configuration
                 *
                 * @type {Object}
                 * @private
                 */
                var _requestObject;

                /**
                 * The collection of errors while
                 * loading a resource
                 *
                 * @type {Array}
                 * @private
                 */
                var _error = [];


                /**
                 * Creates a new script-node in DOM and configures it to be almost ready
                 * to load the passed url (in config object @see @example). To tell the
                 * DOM that it should start with loading of the resource you have to call
                 * the open()-method after the call to create(). The calls can be chained:
                 * e.g. <code>new Dom().create({}).open();</code>
                 *
                 * @param {Object} requestObject The configuration for script-node
                 *
                 * @example
                 * var requestObject =
                 * {
                 *     url: '//ajax.googleapis.com/ajax/libs/jquery/1.8.3/jquery.min.js',
                 *     type: 'script',
                 *     source: document,
                 *     target: head,
                 *     callback: function (result, buffer) {
                 *         // your callback code
                 *     }
                 * }
                 *
                 * @returns {Lazyload.Pipe.Dom} The instance for chaining
                 * @public
                 *
                 * @todo We need a switch (type: 'script' | 'image' | 'style' | 'flash') to
                 * support different types (imgages, shockwave-flash ...). One Milestone is
                 * the implementation of jpeg, gif, png (prefetching of data through
                 * JavaScript -> images loaded by JS get cached in browser cache so
                 * Lazyload.js can be instrumentalized to prefetch data in background.
                 */
                this.create = function (requestObject)
                {
                    // store configuration
                    _requestObject = requestObject;

                    // create a script-element
                    var element = _requestObject.source.createElement('script');
                    element.setAttribute('type', 'text/javascript');

                    if (_requestObject.callback) {

                        element.onreadystatechange = function () {
                            if (this.readyState === 'complete') {
                                _requestObject.callback(true);
                            }
                        };

                        element.onload  = _requestObject.callback;
                        element.onerror = function (e) {
                            _error.push(e);
                        };
                    }

                    if (_requestObject.id) {
                        element.setAttribute('id', _requestObject.id);
                    }

                    element.setAttribute('src', _requestObject.url);

                    _requestObject.element = element;

                    /** @lends Lazyload.Pipe.Dom */
                    return this;

                };

                /**
                 * This method is intend to open the previously created (create()) pipe.
                 * I decided to split the open command from the creation process so i
                 * am able to process and configure some parts of Lazyload.js before
                 * loading begins.
                 *
                 * @returns {Lazyload.Pipe.Dom} instance of this class for chaining
                 * @public
                 */
                this.open = function ()
                {
                    _requestObject.target.appendChild(_requestObject.element);

                    /** @lends Lazyload.Pipe.Dom */
                    return this;

                };

                /** @lends Lazyload.Pipe.Dom */
                return this;

            }
        },

        /**
         * Shortcut to Lazyload.Core.<code>Loader#require</code>
         *
         * @param {String} resources  A single file name or a comma separated list of resources
         * @param {Object} properties Properties to override default properties of lazyObject
         * @param {Object} config     Configuration to override existing configuration
         *
         * @example
         * Lazyload.require('my/script/foo.js')
         * .then(s, f);
         *
         * @returns {Lazyload.Core.Loader} The current instance for chaining
         * @public
         *
         * @see {@link Loader#require}
         */
        require: function (resources, properties, config)
        {
            // create instance if not exist
            if (!this.instance) {
                this.instance = new this.Core.Loader();
            }

            // delegate to instance
            this.instance.require(resources, properties, config);

            /** @lends Lazyload.Core.Loader */
            return this.instance;

        },

        /**
         * Shortcut to Lazyload.Core.Loader().config().
         *
         * @param {Object} config The configuration values to override/set
         *
         * @returns {Lazyload.Core.Loader} The instance of Lazyload.Loader
         * @see Loader#config
         * @public
         */
        config: function ()
        {
            var cfg = (arguments[0]) ? arguments[0] : undefined;

            // delegate to instance
            this.instance.config(cfg);

            /** @lends Lazyload.Core.Loader */
            return this.instance;

        }
    };

    // we need to patch for IE ... :/
    if (typeof String.prototype.trim !== 'function') {
        String.prototype.trim = function () {
            return this.replace(/^\s+|\s+$/g, '');
        };
    }

    /**
     * Initialize preworker (e.g. watch DOM ready-state ...)
     */
    Lazyload.Core.Init();

}(this, document));
