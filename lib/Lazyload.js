/**
 * Lazyload.js
 * A lightweight + powerful loading-framework for JavaScript
 *
 * Lazyload.js is a lightweight and powerful loading framework for
 * JavaScript. Lazyload.js will help you for example completing the
 * following tasks:
 *
 *  - load resources (js, css, bin) parallel and serial
 *
 *  - chaining API require().and().and().and().then()...
 *
 *  - build your stack fully comfortable and easy
 *
 *  - managing dependencies for loading resources was never easier
 *
 *  - promise for configuration (fulfilled if all operations done)
 *
 *
 * Lazyload.js is tested and works on Windows (Vista, XP (32 and 64
 * Bit) and Linux (e.g. CentOS 5.5) tested with the following Browser(s):
 *
 *      IE                  Version: (5.5?), 6, 7, 8, 9, 10
 *      Safari              Version: 5.1.7 (7534.57.2)
 *      Google Chrome       Version: 26.0.1384.2 dev-m
 *      Mozilla Firefox     Version: 18.0
 *      Opera               Version: 12.12 (1707)
 *
 * @author    Benjamin Carl <opensource@clickalicious.de>
 * @copyright Copyright 2011 - 2012 clickalicious UG (i.G.) - Benjamin Carl
 * @version   0.0.3
 * @missing   - more tests and more code-coverage!
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
 *
 */
(function (window, document) {
    'use strict';

    /**
     * @description The Lazyload container object
     */
    window.Lazyload = {

        /**
         * currently not used
         *
         * @type {object}
         * @public
         * @deprecated
         */
        selector: null,

        /**
         * backup of dom-elements as array
         *
         * @type {array}
         * @public
         */
        dom: [],

        /**
         * the instance of Lazyload (singleton)
         *
         * @type {object}
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
         * @type {array}
         * @public
         */
        onDomReady: [],


        /**
         * Scope: public API
         *
         * This method is intend to check the ready-state of the DOM in a crossbrowser compatible way.
         * It's a custom implementation optimized by size and not execution (currently not measured).
         * Watch the ready-state of the DOM prevents us from trying to add code to DOM while it isn't ready.
         *
         * @returns void
         * @public
         */
        Init: function Init() {

            // leave if already retrieved | prevent double call
            if (Lazyload.isDomReady) {
                return;
            }

            // objects where we can add events to ...
            var d = document, w = window, l = [
                {'o': d, 'm': [['addEventListener', 'DOMContentLoaded']]},  // matrix of object, event-method and event
                {'o': w, 'm': [['addEventListener', 'load']]},
                {'o': w, 'm': [['attachEvent', 'onload']]}
            ];

            // anonymous function with the important loop part
            // i've used the anonymous function just to be able to break out of the loop by simply calling 'return'
            (function() {
                var i,
                    j,
                    f = false,
                    fn = function() {
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
            this.ready = true;
        },

        Selector: {},

        /**
         * Lazyload is the Framework (namespace) and "Tool" hold all the tools
         * available through Lazyload.Tool
         */
        Tool: {

            /**
             * Lazy-Loading Class
             */
            Loader: function Loader(config) {

                /**
                 * holds the logger-method
                 *
                 * @type {Function}
                 * @private
                 */
                var _;

                /**
                 * holds the level of nested elements of loaded tree of elements
                 */
                var _nestingLevel = 0;

                /**
                 * holds the loaded elements in a dependency-tree
                 */
                var _tree = {};


                var _stack = [];
                if (!window.console) {
                    window.console = {
                        log : function(str) {

                            var _body = document.getElementsByTagName('body')[0];

                            if (_body) {

                                var dbg = document.getElementById('debug');

                                if (!dbg) {
                                    var dbg = document.createElement('div');
                                    dbg.id = 'debug';
                                    _body.appendChild(dbg);

                                    for (var i = 0; i < _stack.length; ++i) {
                                        console.log(_stack[i]);
                                    }
                                }

                                var result = '';
                                if (typeof str === 'object' || typeof str === 'array') {

                                    for (key in str) {
                                        result += key + ': ' + str[key] + '<br />';
                                    }
                                } else {
                                    result = str;
                                }

                                dbg.innerHTML = dbg.innerHTML + '<br />' + result;

                            } else {
                                _stack[_stack.length] = str;
                            }
                        }
                    };
                };

                /**
                 * holds the configuration
                 *
                 * @type {object}
                 * @private
                 */
                var _config = {
                    'dependencyIdentifier': [                  // which identifier(s) should be parsed
                        'import', 'files', 'configuration', 'property'
                    ],
                    'extension':            null,              // Default extension of resource (eg. .js|.css)
                    'translate':            '/',               // Delimiter used for parsing path from class
                    'parse':                true,              // Parse fetched resources for further dependencies?
                    'caching':              true,              // Cache fetched resources?
                    'timeout':              0,                 // Timeout for XHR (0 = unlimited/no timeout)
                    'pipesMax':             0,                 // Maximum number of parallel pipes allowed
                    'debug': {                                 //
                        'enabled':          false,             // Debug enabled
                        'logger':           function(m){       // Logger method
                            console.log(m);
                        }
                    }
                };

                /**
                 * holds an instance of Simple-Hashing-Class
                 *
                 * @type {object}
                 * @private
                 */
                var _hash = new Lazyload.Tool.Hash.Simple();

                /**
                 * holds an instance of Annotation-Parser-Class
                 *
                 * @type {object}
                 * @field
                 * @private
                 */
                var _annotationParser;

                /**
                 * holds the translations
                 *
                 * @type {array}
                 * @field
                 * @private
                 */
                var _translations = {};

                /**
                 * holds the count of open pipes
                 *
                 * @type {number}
                 * @field
                 * @private
                 */
                var _countOpenPipes = 0;

                /**
                 * holds cached elements
                 *
                 * @type {array}
                 * @field
                 * @private
                 */
                var _cache = {};

                /**
                 * holds one or more event-objects
                 *
                 * @type {array}
                 * @private
                 */
                var _events = [];

                /**
                 * holds the count of files (dependencies) to load
                 *
                 * @type {number}
                 * @private
                 */
                var _countFilesToLoad = 0;

                /**
                 * reference to tag -> head (DOM)
                 *
                 * @type {object}
                 * @private
                 */
                var _head = document.getElementsByTagName('head')[0];

                /**
                 * reference to tag -> body (DOM)
                 *
                 * @type {object}
                 * @private
                 */
                var _body = document.getElementsByTagName('body')[0];

                /**
                 * Placeholder for _then() callback -> promise for fulfilled
                 * all passed required files loaded (including parsed references)
                 *
                 * @type {Function}
                 * @private
                 */
                var _then = {success: {api: [], internal: []}, failure: {api: [], internal: []}};

                /**
                 * the queue containing all stacks to be loaded
                 *
                 * @type {array}
                 * @private
                 */
                var _queue = [];

                /**
                 * a list of items currently in progress
                 *
                 * @type {array}
                 * @private
                 */
                var _touched = [];

                /**
                 * storage for original error handler
                 * hook
                 *
                 * @type {object}
                 * @private
                 */
                var _oe;


                /**
                 * adds a lazyObject to cache
                 *
                 * This method adds a lazyObject to cache if caching-flag of the lazyObject was
                 * set to true.
                 *
                 * @param {object} lazyObject The lazyObject to add to cache
                 *
                 * @returns void
                 * @private
                 */
                var _addLazyObjectToCache = function _addLazyObjectToCache(lazyObject)
                {
                    // we always store items in cache
                    // but if caching is disabled we remove them after adding everything to DOM
                    _cache[lazyObject.uid] = lazyObject;
                };

                /**
                 * adds a lazyObject-hash nested tree
                 *
                 * This method adds a lazyObject-hash (reference) to the tree of nested elements.
                 * This tree is used later for loading the resources in its correct order.
                 *
                 * @returns void
                 * @private
                 */
                var _addLazyObjectToTree = function _addLazyObjectToTree(lazyObject)
                {
                    // if object does not have a parent then this object is our root-node
                    if (!lazyObject.parent) {

                        if (!_tree[_nestingLevel]) {
                            // init empty node
                            _tree[_nestingLevel] = {};
                        }

                        // make current nesting-level an array
                        if (_tree[_nestingLevel][lazyObject.uid] == undefined) {
                            _tree[_nestingLevel][lazyObject.uid] = {};
                        }

                    } else {

                        // current lazyObject has a parent
                        if (_tree[_nestingLevel][lazyObject.parent] != undefined) {
                            _nestingLevel++;

                            // init empty node
                            _tree[_nestingLevel] = {};
                        }

                        _tree[_nestingLevel][lazyObject.uid] = {};
                    }
                };

                /**
                 * Parses the dependencies from given source
                 *
                 * This method is intend to parse out and return the dependencies from a given source.
                 *
                 * @param {string} source The source to parse for dependencies
                 *
                 * @returns {object} An object containing
                 *                   {
                 *                    files: files,
                 *                    configuration: configuration,
                 *                    properties:properties
                 *                   }
                 * @private
                 */
                var _parseDependencies = function _parseDependencies(source)
                {
                    // init done?
                    if (!_annotationParser) {
                        _annotationParser = new Lazyload.Tool.Parser.Annotation();
                    }

                    // get dependencies
                    var dependency    = _annotationParser.parse(source, _config.dependencyIdentifier),
                        files         = [],
                        configuration = {},
                        properties    = {},
                        i;

                    if (dependency.length) {

                        for (i = 0; i < dependency.length; ++i) {
                            switch (dependency[i][0]) {
                            case 'files':
                                files = dependency[i][1];
                                break;

                            case 'configuration':
                                configuration = eval(dependency[i][1]);
                                break;

                            case 'properties':
                                properties = eval(dependency[i][1]);
                                break;
                            }
                        }
                    }

                    // return result as readable object
                    return {
                        files: files.toString(),
                        configuration: configuration,
                        properties: properties
                    };
                };

                /**
                 * Injects a DOM node for script-/stylesheet-objects
                 *
                 * This method injects a DOM node for script-/stylesheet-objects.
                 *
                 * @param {object} config The config for creating a (valid) DOM node
                 *
                 * @returns void
                 * @private
                 */
                var _injectLazyObjectIntoDom = function _injectLazyObjectIntoDom(lazyObject)
                {
                    // create element (script|style)
                    var domElement = document.createElement(lazyObject.type),
                        source     = '\n' + lazyObject.source + '\n';

                    // set correct content type (text/javascript || text/css)
                    lazyObject.contentType = 'text/' + ((lazyObject.type == 'script') ? 'javascript' : 'css');

                    // set required base properties
                    domElement.type  = lazyObject.contentType;
                    domElement.id    = lazyObject.domId;

                    // properties by type
                    if (lazyObject.type == 'script') {
                        // process SCRIPT
                        domElement.defer = true;                             // always! don't worry -> we manage deps!
                        domElement.text  = source;

                    } else {
                        // process STYLE
                        // set css property X-Browser compatible
                        if (domElement.styleSheet) {
                            domElement.styleSheet.cssText = source;
                        } else {
                            domElement.appendChild(document.createTextNode(source));
                        }
                    }

                    // add node to real clients DOM
                    if (lazyObject.target == 'head') {
                        _head.appendChild(domElement);

                    } else {
                        _body.appendChild(domElement);
                    }
                };

                /**
                 * executes the callback
                 *
                 * This method is intend to execute the previously defined callback.
                 *
                 * @param {object} lazyObject The lazyObject to call back
                 *
                 * @returns void
                 * @private
                 */
                var _callBack = function _callBack(lazyObject)
                {
                    if (lazyObject.callback != undefined) {
                        lazyObject.callback(
                            // the line below was a functional autoinstanciation and passing it to callback ...
                            //(_config.autoinstanciate) ? new window[lazyObject.lazyClass](lazyObject.args) : null
                        );
                    }
                };

                /**
                 * checks if passed object is empty
                 *
                 * This method is intend to check if the passed object is empty ( == {})
                 * and returns TRUE if empty, otherwise FALSE.
                 *
                 * @param {object} obj The object to check
                 *
                 * @returns void
                 * @private
                 */
                var _empty = function _empty(obj)
                {
                    for (var property in obj){
                        return false;
                    }
                    return true;
                };

                /**
                 * Adds elements from current _tree collection to DOM
                 *
                 * This method is intend to add all elements from _tree collection
                 * to current DOM.
                 *
                 * @returns void
                 * @private
                 */
                var _injectTreeIntoDom = function _injectTreeIntoDom()
                {
                    // check if DOM is ready otherwise we have to wait!
                    if (Lazyload.isDomReady) {

                        // iterate from outer to inner -> starting at the highest nesting level
                        var i = _nestingLevel + 1;

                        while (i--) {
                            var lazyObject,
                                uid;

                            for (uid in _tree[i]) {
                                // the tree only contains a key-reference to the lazyObject which
                                // we get from array _cache -> TODO: replace this Array by Object too
                                lazyObject = _cache[uid];

                                //if (_touched[lazyObject.uri] !== true) {
                                    //_injectLazyObjectIntoDom(lazyObject);
                                //}
                                _injectLazyObjectIntoDom(lazyObject);

                                // execute callback
                                _callBack(lazyObject);

                                // if caching isn't wanted ...
                                if (!lazyObject.caching) {
                                    //_cache[lazyObject.uid] = null;
                                    delete _cache[lazyObject.uid];
                                }
                            }
                        }

                    } else {
                        // try again in 10ms and important here: pass promise-callback again!
                        setTimeout(function() { _injectTreeIntoDom(); }, 10);
                    }
                };

                /**
                 * Resets the instance to its initial state
                 *
                 * This method is intend to reset the class to its initial state.
                 *
                 * @returns void
                 * @private
                 */
                var _reset = function _reset(full)
                {
                    // recreate default values;
                    _countFilesToLoad = 0;
                    _nestingLevel     = 0;
                    _tree             = {};
                    //_touched          = [];

                    if (full === true) {
                        // THOSE values can only be resetted after the _success() or  _failure() call
                        _queue = [];
                        _then = {success: {api: [], internal: []}, failure: {api: [], internal: []}};
                    }
                };

                /**
                 * dispatches a lazyObject
                 *
                 * This method is intend as dispatcher for a loaded lazyObject. It adds the lazyObject-reference
                 * to the nested-tree, adds the lazyObject to cache (if caching enabled), retrieves and loads it
                 * dependencies and afterwards (if everything's loaded) injects the tree into the DOM.
                 *
                 * @param {object} lazyObject The lazyObject to dispatch
                 *
                 * @returns void
                 * @private
                 */
                var _dispatchLazyObject = function _dispatchLazyObject(lazyObject)
                {
                    var dependencies = false;

                    // reduce count of file currently loaded
                    _countFilesToLoad--;

                    // add it to tree (position) for injection into DOM
                    _addLazyObjectToTree(lazyObject);

                    // parse dependencies and load resources (but only if configured: parse: true)
                    // TODO: exclude css - seems magically handled (@import) by browsers ...?
                    if (_config.parse === true && lazyObject.parsed === false && lazyObject.type != 'style') {
                        dependencies = _loadDependencies(lazyObject);
                        lazyObject.parsed = true;

                    }

                    // dependencies found?
                    if (dependencies !== false) {
                        // add the file(s) to callstack
                        _addToQueue(dependencies.files, dependencies.properties, dependencies.configuration);

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
                var _bypassErrorHandler = function _bypassErrorHandler(state)
                {
                    if (state === true) {
                        _oe = window.onerror;
                        window.onerror = function(){ return true; };

                    } else {
                        window.onerror = _oe;
                    }
                };

                /**
                 * fetches a file via XHR from Server
                 *
                 * This method is intend to load a file via XMLHttpRequest (Pipe.Xhr).
                 * It also controls the opened pipes and limit the maximum open pipes defined by
                 * config.pipesMax.
                 *
                 * @param {object} lazyObject The lazyObject to fetch source for
                 *
                 * @returns void
                 * @private
                 */
                var _fetchResourceFromRemote = function _fetchResourceFromRemote(lazyObject)
                {
                    // loader configured?
                    if (_config.loader !== undefined && window.localStorage !== undefined) {

                        // patch = currently easiest way to transfer it to callback without hassle
                        _config.loader.lazyObject = lazyObject;

                        // if debug enabled we remove from loader randomly
                        //_config.loader.remove(lazyObject.uid);

                        // bypass error handler cause basket.js triggers some confusing output
                        // i must check first (deeper analysis)
                        _bypassErrorHandler(true);

                        // dispatch this
                        _config.loader.require({
                            url: lazyObject.uri,
                            key: lazyObject.uid

                        }).then(function then() {
                            // disable bypass ...
                            _bypassErrorHandler(false);

                            var lazyObject = _config.loader.lazyObject;

                            // get source from loader!
                            lazyObject.source = _config.loader.get(lazyObject.uid).data;

                            // do some more stuff like we do in native Lazyload mode ... ?
                            if (lazyObject.source) {

                                _addLazyObjectToCache(lazyObject);

                                // call dispatcher to inject the final lazyObject into DOM
                                _dispatchLazyObject(lazyObject);

                                _onFileLoaded(lazyObject);

                            } else {
                                // handle failure (callback?)
                                _failure(lazyObject);

                                // log internal
                                _('Error loading resource: "' + lazyObject.uri + '"');

                                // and then reset Lazyload.js' state
                                _reset(true);
                            }
                        });

                    } else {
                        // check for unlimited or free pipe
                        if (_config.pipesMax == 0 || _countOpenPipes < _config.pipesMax) {

                            // get a new pipe (XHR) object
                            var pipe = new Lazyload.Tool.Pipe.Xhr();

                            // increase the open pipe count!
                            _countOpenPipes++;

                            pipe.create({
                                'timeout': _config.timeout,
                                'url': lazyObject.uri,
                                'preventBrowserCaching': !lazyObject.caching,
                                'callback': function callback(pipe, successful) {
                                    // received the result
                                    // reduce the open pipe count
                                    _countOpenPipes--;

                                    // got valid result?
                                    if (successful === true) {
                                        // retrieve source
                                        lazyObject.source = pipe.responseText;

                                        // cache the object
                                        _addLazyObjectToCache(lazyObject);

                                        // call dispatcher to inject the final lazyObject into DOM
                                        _dispatchLazyObject(lazyObject);

                                        // do what ever waiting for you
                                        _onFileLoaded(lazyObject);

                                    } else {
                                        // handle failure (callback?)
                                        _failure(lazyObject);

                                        // log internal
                                        _('Error loading resource: "' + lazyObject.uri + '"');

                                        // and then reset Lazyload.js' state
                                        _reset(true);
                                    }
                                }
                            });

                            // open
                            pipe.open();

                        } else {
                            // if pipes-max reached we try again in 10ms
                            setTimeout(function() { _fetchResourceFromRemote(lazyObject); }, 10);
                        }
                    }
                };

                /**
                 * general callback for "file was loaded"
                 *
                 * This method is intend to act as general callback for "file was loaded".
                 * No matter from where (source)
                 *
                 * @param {object} lazyObject The lazyObject loaded
                 *
                 * @returns void
                 * @private
                 */
                var _onFileLoaded = function _onFileLoaded(lazyObject)
                {
                    /**
                     * TODO:
                     * der vermutlicht als standardfall geltende fall:
                     *
                     * immer wenn ein objekt fertig geladen wurde (source arrived), dann
                     * wird dieses objekt dispatched und zwar zum einen zum baum hinzugefügt
                     * und zum anderen auf weitere dependencies geprüft.
                     *
                     * Und dann wird hier geprüft, ob noch files zu laden sind.
                     *
                     * - Ein Bug der besteht, ist der, dass _countFilesToLoad() auf unter
                     *   null sinken kann?!
                     *
                     * Der ganze Block hat hier nichts zu suchen! Ggf. kann man den verschieben
                     * in die Methode die diese hier aufruft ...
                     */
                    // if a file was loaded (no matter from which source [remote|cache]) we need to
                    // check for further processing ...
                    if (_countFilesToLoad === 0) {

                        // inject the whole existing tree into dom
                        _injectTreeIntoDom();

                        // then reset current state to the state of startup with no stack in progress
                        _reset();

                        // and at last and least run against the stack again
                        _processQueue();
                    }
                };

                /**
                 * translates the request into a processable lazyObject
                 *
                 * This method is intend to translate a request (object) to a lazyObject
                 * we need to perform the further tasks.
                 *
                 * @returns lazyObject A full-qualified and parsable lazyObject
                 * @private
                 */
                var _convertToLazyObject = function _convertToLazyObject(fileName, properties)
                {
                    // the requested class arguments
                    var lazyObject,
                        uid,
                        property;

                    if (properties != undefined && properties.uid) {
                        uid = properties.uid;
                    } else {
                        uid = _hash.calculate(fileName);
                    }

                    // already translated? => this operation is expensive!
                    if (!_translations[uid]) {

                        lazyObject = _getLazyObjectSkeleton(fileName, uid);

                        lazyObject.lazyClass            = lazyObject.lazyPackage.asArray.pop();
                        lazyObject.lazyPackage.asString = lazyObject.lazyPackage.asArray.join(_config.translate);
                        lazyObject.path                 = lazyObject.lazyPackage.asArray.join('/')+'/';
                        lazyObject.file                 = lazyObject.lazyClass + ((_config.extension) ? _config.extension : '');
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
                 * Scope: internal use
                 *
                 * _require handles the queue by popping of elements to load, prepare those
                 * elements to fit our needs and start the loading process.
                 *
                 * @returns void
                 * @private
                 */
                var _require = function _require()
                {
                    var set         = _queue.pop();                // get next element from stack
                    var lazyObject,
                        files       = set.files.split(','),        // get files from callstack
                        i;

                    for (i = 0; i < files.length; ++i) {
                        files[i]   = files[i].trim();
                        lazyObject = _convertToLazyObject(files[i], set.properties);

                        if (files[i].split('.').pop() === 'css') {
                            lazyObject.type = 'style';
                        }

                        // increase count of files beeing loaded - !sepecial case:
                        // if we got a hit in cache we don't really load the file
                        // through _fetchResourceFromRemote() cause it was already
                        // retrieved from remote. but in _dispatchLazyObject() the
                        // count _countFilesToLoad() is reduced by one so we must
                        // increase it for both cases: cache + remote loading!
                        _countFilesToLoad++;


                        // fetch from remote (if caching disabled) OR (if caching enabled AND object not in cache)
                        if ((!lazyObject.caching) || (lazyObject.caching && !_cache[lazyObject.uid] && !_touched[files[i]])) {
                            // set we do this file to true -> cache check isn't enough cause at larger
                            // files the distance is to short
                            _touched[files[i]] = true;

                            // get our resource from a remote source
                            _fetchResourceFromRemote(lazyObject);

                        } else {
                            // currently processed file was loaded AND cached before, so jump over the step
                            // of loading it from resource and dispatch correctly
                            _dispatchLazyObject(lazyObject);


                            _onFileLoaded(lazyObject);
                        }
                    }
                };

                /**
                 * Processes the callstack
                 *
                 * This method takes all defined callbacks (success) of a promise.
                 *
                 * @returns void
                 * @private
                 */
                var _processQueue = function _processQueue()
                {
                    // check if everything fulfilled ...
                    //if (_queue.length !== 0) {
                    if (_queue.length > 0) {
                        // this call means we have still items in the queue to load - and so we go on
                        _require();

                    } else {
                        // fetch all success callbacks currently set
                        var callbacks = _success();

                        // reset Lazyload.js' state completely
                        _reset(true);

                        // call the success callbacks - all items of this call construct where loaded
                        for (var i = 0; i < callbacks.length; ++i) {
                            callbacks[i]();
                        }
                    }
                };

                /**
                 * Promise success callback dispatcher
                 *
                 * This method runs all defined callbacks (success) of a promise.
                 *
                 * @param {string} type The type of promise to dispatch (API or internal)
                 *
                 * @returns void
                 * @private
                 */
                var _success = function _success(type)
                {
                    var f,
                        type = (!type) ? 'api' : type,
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
                 * Promise failure callback dispatcher
                 *
                 * This method runs all defined callbacks (failure) of a promise.
                 *
                 * @param {lazyObject} lazyObject The lazyObject passed to callback as argument
                 * @param {string}     type       The type of promise to dispatch (API or internal)
                 *
                 * @returns void
                 * @private
                 */
                var _failure = function _failure(lazyObject)
                {
                    var f,
                        type = (!type) ? 'api' : type;

                    // and then finally call inline callback
                    for (var i = 0; i < _then.failure[type].length; ++i) {
                        // extract function callback
                        f = _then.failure[type][i];
                        _then.failure[type].splice(i, 1);
                        f(lazyObject);
                    }
                }

                /**
                 * Loads dependencies for given lazyObject
                 *
                 * This method loads the dependencies found in source of the current lazyObject.
                 *
                 * @param {lazyObject} lazyObject The lazyObject to load dependencies for
                 *
                 * @returns void
                 * @private
                 */
                var _loadDependencies = function _loadDependencies(lazyObject)
                {
                    // parse dependencies
                    var i = 0,
                        dependencies = _parseDependencies(lazyObject.source);

                    // dependencies found?
                    if (dependencies.files.length > 0) {

                        // inject the parent-uid! important for handling nested set(s)
                        dependencies.properties.parent = lazyObject.uid;

                        // oh yeah
                        return dependencies;
                    }

                    // if no dependencies found we can't add any
                    return false;
                };

                /**
                 * Scope: public API
                 *
                 * Configure takes an object as argument. This config overrides/set values in
                 * the global config.
                 *
                 * @returns {Lazyload.Tool.Loader} The current instance of Lazyload.Tool.Loader
                 * @public
                 */
                this.initialize = function initialize()
                {
                    // on the fly debug and logger creation
                    _ = (_config.debug.enabled) ?
                        function(m) {
                            _config['debug'].logger(m);
                            return m;
                        } :
                        function(m) {
                            return m;
                        };

                    // direct chaining support
                    return this;
                };

                /**
                 * Scope: public API
                 *
                 * Config takes an object as argument. This config overrides/set values in
                 * the global config.
                 *
                 * @param {object} config The config to override/set as new global config
                 *
                 * @returns {object} The new config
                 * @public
                 */
                this.configure = function configure(config)
                {
                    if (config != undefined) {
                        var property;

                        // iterate over config and store as final config
                        for (property in config) {
                            _config[property] = config[property];
                        }
                    }

                    return _config;
                };

                /**
                 * Scope: public API
                 *
                 * Require takes a string containing a single or comma separated
                 * list of file names as argument. This files are added to queue
                 * and the queue is processed afterwards.
                 *
                 * @param {string} files         The file or files to load
                 * @param {object} properties    The properties as override for these files
                 * @param {object} configuration The configuration to set as new global configuration
                 *
                 * @returns {Lazyload.Tool.Loader} The current instance for chaining
                 * @public
                 */
                this.require = function require(files, properties, configuration)
                {
                    // add the file(s) to callstack
                    _addToQueue(files, properties, configuration);

                    // run the stack
                    _processQueue();

                    // chaining
                    return this;
                };

                /**
                 * Scope: public API
                 *
                 * This method is intend to add a single file or a list of files to
                 * queue. This
                 *
                 * @param {string} files         The ressource(s) to load
                 * @param {object} properties    The properties for this queued ressource(s)
                 * @param {object} configuration The configuration for this queued ressource(s)
                 *
                 * @returns {Lazyload.Tool.Loader} The current instance for chaining
                 * @public
                 */
                this.and = function and(files, properties, configuration)
                {
                    // add the file(s) to callstack
                    _addToQueue(files, properties, configuration);

                    // run the stack?
                    if (_runDry() === true) {
                        _processQueue();
                    }

                    // do not run the "end's" -> automatic
                    return this;
                }








                var _runDry = function _runDry()
                {
                    return(
                           _empty(_tree)     === true
                        && _countOpenPipes   === 0
                        && _countFilesToLoad === 0
                    );
                }








                /**
                 * Scope: public API
                 *
                 * This method is intend as Promise to the caller. The caller can pass
                 * two arguments to this function. The first one is the callback for success
                 * and the second argument is the callback in case of a failure
                 * (not successful).
                 *
                 * @param {Function} success The function callback in case of success
                 * @param {Function} failure The function callback in case of failure
                 *
                 * @returns {object} lazyObject The current instance for chaining
                 * @public
                 */
                this.then = function then(success, failure)
                {
                    // set success method
                    if (typeof success == 'function') {
                        _then.success['api'].push(success);
                    }

                    if (typeof failure == 'function') {
                        _then.failure['api'].push(failure);
                    }

                    // direct chaining support
                    return this;
                }

                /**
                 * Scope: internal use
                 *
                 * This method is intend to add the passed file(s) to queue and optionally
                 * adds properties + configuration for this queued items.
                 *
                 * @param {string} files         The file(s) to add to queue
                 * @param {object} properties    The properties as override for these files
                 * @param {object} configuration The configuration to set as new global configuration
                 *
                 * @returns void
                 * @private
                 */
                var _addToQueue = function _addToQueue(files, properties, configuration)
                {
                    // create a simple queue object
                    var queueObject = {
                        files: files,
                        properties: properties,
                        configuration: configuration
                    }

                    // and add it to queue
                    _queue.unshift(queueObject);
                }

                /**
                 * Scope: internal use
                 *
                 * This method is intend to create and return an empty lazyObject container object. It pre-fills the
                 * already configured values/parameters.
                 *
                 * @param {object} r The configuration for the lazyObject
                 *
                 * @returns lazyObject The prepared (but still not final) lazyObject
                 * @private
                 */
                var _getLazyObjectSkeleton = function _getLazyObjectSkeleton(defaults, uid)
                {
                    return {
                        domId: defaults,                               // The Id to identify the object in DOM
                        args: null,                                    // The arguments used if auto-instanc. is used
                        callback: void(0),                             // Callback-Method (triggered after inj to DOM)
                        caching:  _config.caching,                     // Object based caching directive
                        uid: uid,                                      // The uid (unique identifier)
                        parent: null,                                  // Parent item of this item (default = parent)
                        lazyClass: '',                                 // The Class(-name)
                        path: '',                                      // The (relative or full) path to file
                        file: '',                                      // The filename
                        uri: '',                                       // The full uri (combination of path + file)
                        wait: false,                                   // Not implemented yet
                        type: 'script',                                // Which type is this object of (script | style)
                        target: 'head',                                // Where to add the element
                        parsed: false,                                 // Was resource parsed already?
                        lazyPackage: {                                 // The Package path (e.g. Foo.Bar.Foobar)
                            asString: false,                           // The Package as String
                            asArray: defaults.split(_config.translate) // The Package as Array
                        }
                    };
                };

                /**
                 * executes methods for an given event.
                 *
                 * This method is intend to execute all defined methods for a given event.
                 *
                 * @param {string} e The event-name to fire/trigger
                 *
                 * @private
                 * @author  Benjamin Carl <phpfluesterer@googlemail.com>
                 * @since   Method available since Release 1.0.0
                 * @version 1.0
                 */
                var _fireEvent = function _fireEvent(e)
                {
                    var i,
                        fA = _getEventMethods(e, (arguments[1]) ? arguments[1] : void(0));

                    for (i = 0; i < fA.length; ++i) {
                        // execute methods one by one
                        fA[i]();
                    }
                };

                /**
                 * returns an array of methods/functions for an given event.
                 *
                 * this method is used to return all methods/functions for an given event as
                 * an array. Each array-item represents a single method/function.
                 *
                 * @param string e The event to retrieve the list for
                 *
                 * @returns {array} The list of method/functions for the given event
                 * @private
                 */
                var _getEventMethods = function _getEventMethods(e)
                {
                    var i,
                        b  = (arguments[1]) ? arguments[1] : void(0),
                        tA = [];

                    for (i = 0; i < _events.length; ++i) {
                        // look for matching event
                        if (_events[i].e == e) {
                            //event found - but is it bind to a specific id?
                            if ((!b) || (b && b == _events[i].b)) {
                                // push event-method in temp array
                                tA.push(_events[i].f);
                            }
                        }
                    }
                    return tA;
                };

                // prototype(s) for native java-/ecma-script elements
                Array.prototype.indexOf = function indexOf(a, b, c, r) {
                    for (b = this, c = b.length, r = -1; ~c; r = b[--c] === a ? c : r);
                    return r;
                };

                var fnIndexOf = function fnIndexOf(a) {
                    return this.indexOf(a) != -1;
                };
                (typeof Array.prototype.contains === "undefined") ? Array.prototype.contains = fnIndexOf : null;
                (typeof String.prototype.contains === "undefined") ? String.prototype.contains = fnIndexOf : null;

                var fnTrim = function () {
                    return this.replace(/\s+$/, "").replace(/^\s+/, "");
                };
                (typeof String.prototype.trim === "undefined") ? String.prototype.trim = fnTrim : null;

                // parse the config if given
                if (arguments.length) {
                    this.configure(arguments[0]);
                }

                this.initialize();
            },

            Hash: {
                Djb2: function Djb2() {

                    /**
                     * calculates a djb2 hash.
                     *
                     * This method is intend to calculate a (really basic) djb2 hash.
                     * Calculating a djb2 is much faster then using crc(8, 16, 32), md5 or sha1.
                     * This is exactly what i was looking for.
                     * @see http://www.cse.yorku.ca/~oz/hash.html
                     *
                     * @param {string} The string to create a hash for.
                     *
                     * @returns {string} The generated hash
                     * @public
                     */
                    this.calculate = function calculate(s)
                    {
                        var i,
                            h = 5381;

                        for (i = 0; i < s.length; ++i) {
                            /* h * 33 + c */
                            h = ((h << 5) + h) + s[i];
                        }

                        return h;
                    };
                },

                Simple: function Simple() {

                    /**
                     * calculates a simple hash.
                     *
                     * This method is intend to calculate a simple hash.
                     *
                     * @param {string} The string to create a hash for.
                     *
                     * @returns {string} The generated hash
                     * @public
                     */
                    this.calculate = function calculate(s)
                    {
                        var p = 1,
                            h = 0;

                        // iterate over string
                        for (p; p < s.length; ++p) {
                            h += (s.charCodeAt(p-1) * p) | (s.charCodeAt(p) * (p+1));
                        }

                        return h;
                    };
                }
            },

            Intercept: function Intercept() {

                /**
                 * The tags to hook actions on
                 *
                 * @type {array}
                 * @public
                 */
                this.selector = [];

                /**
                 * The target element in DOM used as root
                 *
                 * @type {object}
                 * @public
                 */
                this.target;

                /**
                 * Storage for captured events full-qualified DOM events
                 * get stored in this array till the required()
                 * resources are loaded.
                 *
                 * @type {array}
                 * @public
                 */
                var _captured = [];


                /**
                 * Hook: The proxy installer. Hook takes a collection of selector as argument and installs
                 * the mouseover activated proxy. This is done to intercept the action between the user
                 * and a single DOM element. So we can reduce the load and the amount of data transfered
                 * when we move to this technique.
                 */
                this.hook = function hook(selector, trigger)
                {
                    // default trigger is a mouseover event
                    if (trigger === undefined) {
                        trigger = '';//'mouseover';
                    }

                    this.selector = selector;
                    this.target = (arguments[2]) ? arguments[2] : document;

                    this.callback = function callback() {

                        var i, uid, require,
                            elements = _getElementsBySelector(this.selector, this.target),
                            hash = new Lazyload.Tool.Hash.Simple();

                        for (i = 0; i < elements.length; ++i) {

                            require = elements[i].getAttribute('require');

                            // if require condition found
                            if (require) {

                                //uid = hash.calculate(require);
                                Lazyload.dom[elements[i].id] = _getProperties(elements[i].id);

                                var _restore = function(element, _properties) {

                                    for (var property in _properties) {
                                        // remove hook events on...
                                        if (property.substr(0,2) == 'on') {
                                            element[property] = _properties[property];
                                        }
                                    }
                                }

                                elements[i]['on'+trigger] = function magic(e) {
                                    // remove HREF to deactivate link
                                    this.href = 'javascript:void(0);';

                                    var _properties = Lazyload.dom[this.id];
                                    var _require    = this.getAttribute('require');
                                    var _element    = this;

                                    this.proxy = function(e) {
                                        Lazyload.require(
                                            _require

                                        ).then(
                                            function(){
                                                _restore(_element, _properties);
                                            }
                                        );
                                    }

                                    // intercept all on-Events of element
                                    for (var property in this) {
                                        // hook events on...
                                        if (property.substr(0,2) == 'on') {
                                            this[property] = this.proxy;
                                        }
                                    }

                                    return false;
                                };
                            }
                        }
                    }

                    // store "us" as on DOM ready callback
                    Lazyload.onDomReady.push(this);
                };

                this.proxy = function proxy(e)
                {
                    var id = e.target.id;
                    if (!_captured[id]) {
                        _captured[id] = [];
                    };

                    _captured[id].push(e);
                }

                var _getProperties = function _getProperties(elementId)
                {
                    var element = document.getElementById(elementId), properties = {};

                    // restore original actions -> all dependencies fulfilled
                    for (var property in element) {
                        properties[property] = element[property];
                    }

                    return properties;
                }

                var _getElementsBySelector = function _getElementsBySelector(selector, targetDomNode)
                {
                    if (!targetDomNode) {
                        var targetDomNode = document;
                    }

                    if (!Lazyload.selector) {
                        Lazyload.selector = new Lazyload.Selector.Qwery();
                    }

                    return Lazyload.selector(selector, targetDomNode);
                };
            },

            /**
             * Parser Object
             *
             * This object contains different parser for text-processing:
             *
             *  - Annotation - A simple (javadoc) annotation parser
             */
            Parser: {

                /**
                 * Annotation Parser Class
                 *
                 * This class is intend parse out javadoc style annotation (e.g. @foo or @bar).
                 * The parser needs just the source of a file and optional a whitelist of annotations to recognize.
                 *
                 * @public
                 */
                Annotation: function Annotation() {

                    /**
                     * converts an array to an object
                     *
                     * This method is intend to take an array and convert it to an object.
                     *
                     * @returns {object} The resulting object
                     * @public
                     */
                    this.parse = function parse(source)
                    {
                        // tmp transformation array
                        var tmp,
                            annotations = [],
                            matches     = source.match(/(@)[\w\d]+[\s]+[\w\d\/.:,]+/g);

                        // if we found dependency patterns
                        if (matches && matches.length) {
                            //
                            var i;

                            // pre-process them
                            for (i = 0; i < matches.length; ++i) {
                                tmp = matches[i].split(' ');
                                tmp[0] = tmp[0].replace('@', '');

                                if (!arguments[1] || arguments[1].contains(tmp[0])) {

                                    // is a list (,) ?
                                    if (tmp[1].contains(',')) {
                                        tmp[1] = tmp[1].split(',');

                                    } else {
                                        tmp[1] = [tmp[1]];

                                    }

                                    annotations.push(tmp);
                                }
                            }
                        }

                        // return found annotations
                        return annotations;
                    };
                }
            },

            /**
             * Pipe Object
             *
             * This object contains some tools to handling pipes (connections) to load external resources.
             * Currently supported types of pipes:
             *
             *  - Xhr - A XMLHttpRequest - Pipe
             */
            Pipe: {

                 /**
                  * Xhr Class
                  *
                  * This class is intend to handle XMLHttpRequest's to enable us the loading of the source of
                  * external resources
                  *
                  * @public
                  */
                Xhr: function Xhr() {

                    /**
                     * holds an instance of the XMLHttpRequest-Class
                     *
                     * @type {object}
                     * @private
                     */
                    var _connection;

                    var _scope = this;


                    /**
                     * creates an instance of the XMLHttpRequest-Class
                     *
                     * This method is intend to create an instance of the XMLHttpRequest-Class in a x-browser-compatible
                     * way ...
                     *
                     * @param {object} config The configuration for the request (containing at least the "url"-"method",
                     *                        "callback" and "preventBrowserCaching" are optional
                     *
                     * @returns {object} An instance of the XMLHttpRequest-Class if supported, otherwise null
                     * @public
                     */
                    this.create = function create(requestObject)
                    {
                        // check requestObject for needed basic parameter
                        if (requestObject.preventBrowserCaching !== true) {
                            requestObject.preventBrowserCaching = false;
                        }

                        if (!requestObject.method) {
                            requestObject.method = 'get';
                        }

                        if (!requestObject.callback) {
                            requestObject.callback = function(){};
                        }

                        if (requestObject.preventBrowserCaching) {
                            requestObject.url += '?_ac=' +new Date();
                        }

                        // create xhr instance -> TODO: chain next open() call here
                        _connection = _getXhr();

                        // try to open the request (catch exceptions like invalid url ...)
                        _connection.open(requestObject.method, requestObject.url, true);

                        // TODO: check if this still needed. maybe we can reference "requestObject.callback"
                        //       directly within the anonymous function.
                        var _callback = requestObject.callback;

                        // check for timeout
                        // [default is 0 which means unlimited time for fetching resources]
                        if (requestObject.timeout > 0) {

                            // set timeout
                            _connection.timer = setTimeout(
                                // anonymous function
                                function() {
                                    // cancel the request in XHR object
                                    _connection.abort();

                                    // call the callback with correct scope
                                    _callback(_connection, false);
                                },
                                requestObject.timeout
                            );
                        }

                        // what's to do on status change
                        _connection.onreadystatechange = function onreadystatechange() {
                            // if not finished loading
                            if (_connection.readyState != 4) {
                                return;
                            }

                            // remove timer for timeout
                            clearTimeout(_connection.timer);

                            // call back with reference to this instance
                            _callback(_connection, (_connection.status == 200) ? true : false);
                        };
                    };

                    /**
                     * opens a previously created pipe
                     *
                     * This method is intend to open a previously created pipe.
                     *
                     * @returns {object} An instance of the XMLHttpRequest-Class if supported, otherwise null
                     * @public
                     */
                    this.open = function open()
                    {
                        _connection.send(null);

                        // chaining
                        return this;
                    };

                    /**
                     * creates an instance of the XMLHttpRequest-Class
                     *
                     * This method is intend to create an instance of the XMLHttpRequest-Class in a x-browser-compatible
                     * way ...
                     *
                     * @returns {object} An instance of the XMLHttpRequest-Class if supported, otherwises null
                     * @private
                     */
                    var _getXhr = function _getXhr()
                    {
                        try { return new XMLHttpRequest(); } catch(e){}                   // Moz, Opera, Safari, IE > 7
                        try { return new ActiveXObject('Microsoft.XMLHTTP'); } catch(e){} // IE6
                        try { return new ActiveXObject('Msxml2.XMLHTTP'); } catch(e){}    // IE5

                        return null;
                    };
                }
            }
        },

        /**
         * Shortcut to <tt>Lazyload.Tool.Loader().require()</tt>
         *
         * This method is a shortcut <tt></tt> to <tt>Lazyload.Tool.Loader().require()</tt>.
         *
         * @param {string} files      A single file name or a comma separated list of files
         * @param {object} properties Properties to override default properties of lazyObject
         * @param {object} config     Configuration to override existing configuration
         *
         * @returns {Lazyload.Tool.Loader} Instance of Lazyload.Tool.Loader
         * @public
         * @see Lazyload#Tool#Loader#require
         */
        require: function require(files, properties, config) {
            // create instance if not exist
            if (!this.instance) {
                this.instance = new this.Tool.Loader();
            }

            // delegate to instance
            this.instance.require(files, properties, config);

            // chaining
            return this.instance;
        },

        /**
         * shortcut Lazyload.configure() to Lazyload.Tool.Loader().configure()
         *
         * This method is a shortcut to Lazyload.Tool.Loader().configure().
         *
         * @param {object} config The configuration values to override/set
         *
         * @returns {Lazyload.Tool.Loader} Instance of Lazyload.Tool.Loader
         * @public
         */
        configure: function configure(config) {
            // delegate to instance
            this.instance.configure(config);

            // chaining
            return this.instance;
        }
    };

    /**
     * init preworker (e.g. watch DOM ready-state)
     */
    Lazyload.Init();

}(this, document));
