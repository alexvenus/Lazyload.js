/**
 * Lazyload.js
 *
 * A tiny and kept simple "annotation-based-dependency-loader"-framework.
 * Lazyload adds lazy-loading (similar to PHP's __autoload-functionality) support for classes (packages) to 
 * JavaScript's native functionality.
 *  
 * Warning!
 * Lazyload is currently just a proof-of-concept construct. It's not well tested yet but seems to work fine on Windows
 * (Vista, XP (32 and 64 Bit) and Linux (CentOS 5.5) tested with the following Browser(s):
 *  
 * 		IE					Version: 5.5, 6, 7, 8, 9
 * 		Safari				Version: 5.0.4
 * 		Google Chrome		Version: 12.0.742.122
 *  	Mozilla Firefox 	Version: 3, 4, 5
 * 
 * @author    Benjamin Carl <phpfluesterer@googlemail.com>
 * @copyright Copyright 2011 - 2012 - clickalicious UG (i.G.) Benjamin Carl All Rights reserved
 * 
 * @version   0.0.1 (alpha|prototype)
 * 
 * @missing   -Singleton-Support
 *            -Limitation of pipes (currently it uses max pipes available by browser and so it possibly blocks other 
 *             services while loading resources
 *            -Parallel loading support (HTML5 Worker API http://www.peterkroener.de/xmlhttprequest-und-die-worker-api/)
 *            -support of more then one parameter/argument (currently only - one/or object holding more - supported)
 * 
 * @license   MIT License http://en.wikipedia.org/wiki/MIT_License
 * 			  New BSD license http://www.opensource.org/licenses/BSD-3-Clause
 */

(function() {
    window.Lazyload = {
        /**
         * holds the ready state of the DOM. 
         * 
         * @type {Boolean}
         * @public
         */
        isDOMReady: false,
        
        /**
         * checks the ready-state of the DOM (x-browser-way)
         * 
         * This method is intend to check the ready-state of the DOM in a crossbrowser compatible way.
         * It's a custom implementation optimized by size and not execution (currently not measured).
         * Watch the ready-state of the DOM prevents us from trying to add code to DOM while it isn't ready.
         *
         * @returns void
         * @public
         */
        Init: function(){
    		// leave if already retrieved | prevent double call
        	if (Lazyload.isDOMReady) return;
    
        	// objects where we cann add events to
        	var d = document, w = window;
    
        	// matrix of object, event-fetching-method and event
        	var l = [
        	    {'o': d, 'm': [['addEventListener', 'DOMContentLoaded']]},
        	    {'o': w, 'm': [['addEventListener', 'load']]},
        	    {'o': w, 'm': [['attachEvent', 'onload']]}
            ];
    
        	// anonymous function with the important loop part
        	// i've used the anonymous function just to be able to break out of the loop by simply calling 'return'
        	(function() {
        		var i = 0, j = 0, f = false;
        		for (i; i < l.length; ++i) {
        			for (j; j < l[i].m.length; ++j) {
        				if (l[i].o[l[i].m[j][0]]) {
        					return l[i].o[l[i].m[j][0]](l[i].m[j][1], function(){
    								Lazyload.isDOMReady = !f;
    							}, f);
        				}
        			}
        		}
        	})();     
        },
    
        /**
         * Lazyload is the Framework (namespace) and and "Tool" hold all the tools 
         * available through Lazyload.Tool
         */
        Tool: {
            /**
             * Lazy-Loading Class
             */
            Loader: function() {
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
                var _tree = [];
    
                /**
                 * holds the configuration
                 * 
                 * @type {Object}
                 * @private
                 */ 
                var _config = {
                    'autoinstanciate': true,      // create an instance when ready and return it to callback?
                    'dependencyIdentifier': [     // which identifier(s) should be parsed
                        'classpath', 'dependency'
                    ],
                    'classpath': '',              // the path (relative to HTML-Document where this file is included in)
                    'provider': 'native',         // provider (e.g. Ext or jQuery) used for accessing elements in DOM
                    'caching': true,              // cache fetched files?
                    'scope': false,               // scope we operate in (default is 'window')
                    'timeout': 0,                 // the timeout for the XHR (0 = unlimited/no timeout)
                    'pipesMax': 0,                // maximum parallel opened pipes for fetching files
                    'debug': {                    // debug object ...
                        'enabled': false,            // debug enabled?
                        'logger': void(0)            // logger method to dispatch logger-calls to
                    }
                };
    
                /**
                 * holds an instance of Simple-Hashing-Class
                 * 
                 * @type {Object}
                 * @private
                 */          
                var _hash = new Lazyload.Tool.Hash.Simple();
    
                /**
                 * holds an instance of Annotation-Parser-Class
                 * 
                 * @type {Object}
                 * @private
                 */            
                var _annotationParser = new Lazyload.Tool.Parser.Annotation();
                
                /**
                 * holds the translations 
                 * 
                 * @type {Array}
                 * @private
                 */            
                var _translations = [];            
                
                /**
                 * holds the count of open pipes
                 * 
                 * @type {Integer}
                 * @private
                 */
                var _pipes = 0;
                
                /**
                 * holds cached elements
                 * 
                 * @type {Array}
                 * @private
                 */            
                var _cache = {};
                
                /**
                 * holds the queued items
                 * 
                 * @type {Array}
                 * @private
                 */            
                var _queue = [];
                
                /**
                 * holds one or more event-objects
                 * 
                 * @type {Array}
                 * @private
                 */
                var _events = [];            
                
                /**
                 * holds the count of files (dependencies) to load
                 * 
                 * @type {Integer}
                 * @private
                 */
                var _countFilesToLoad = 0;
                
                /**
                 * reference to tag -> head (DOM)
                 *
                 * @type {Object}
                 * @private
                 */
                var _head = document.getElementsByTagName('head')[0];
            
                /**
                 * reference to tag -> body (DOM)
                 * 
                 * @type {Object}
                 * @private
                 */
                var _body = document.getElementsByTagName('body')[0];
                
                /**
                 * parses a configuration and map its elements
                 * 
                 * This method is intend to parse a given configuration and map the config parameter and values to
                 * the _config[] array.
                 * 
                 * @param {Object} config The configuration for this instance
                 *
                 * @returns void
                 * @public
                 */
                this.configure = function(config) {            
                    // iterate over config and store as final config
                    for (var i in config) {
                        _config[i] = config[i];
                    }
    
                    // on the fly debug and logger creation
                    _ = (_config.debug.enabled) ? function(m){_config['debug'].logger(m);} : function(m){void(0);};
    
                    // check which provider to use for accessing DOM
                    switch (config.provider.toString()) {
                    case 'jquery':
                    case '$':
                        _config.provider = function(el){return $('#'+el).get();};
                        break;
                    case 'native':
                    default:
                        _config.provider = function(el){return document.getElementById(el);};
                        break;
                    }
                };
                
                /**
                 * external interface to loading process
                 * 
                 * This method is intend to be used as class-method for loading external references (instance.load() 
                 * instead of (require()). For those who like the class-method access more.
                 *
                 * @returns void
                 * @public
                 */
                this.load = function() {
                	if (arguments.length == 2 && arguments[1] == 'Lazyload.Shortcut') {
    					_load(arguments[0]);	
                	} else {
    					_load(arguments);	
                	}
                };
                
                /**
                 * internal 
                 * 
                 * This method is intend to be used as class-method for loading external references (instance.load()
                 * instead of (require()). For those who like the class-method access more.
                 *
                 * @returns void
                 * @public
                 */
                var _load = function() {
                    // increase the files-to-load count by one
                    _countFilesToLoad++;
                    
                    // autoload required file(s) after retrieve translation of arguments
                    _autoload(_translate(arguments[0]));
                };
                
                /**
                 * returns a prepared lazy-object
                 * 
                 * This method is intend to create and return an empty lazy-object container object. It pre-fills the
                 * already configured values/parameters.
                 * 
                 * @param {Object} r The configuration for the lazy-object
                 *
                 * @returns {Object} The prepared (but still not final) lazy-object
                 * @private
                 */
                var _createLazyObject = function(r) {
                    return {
                        'classpath': (r[3]) ? r[3] : _config.classpath, // The classpath used as base path
                        'domId': r[0],                                  // The Id to identify the object in DOM
                        'arguments': (r[1]) ? r[1] : false,             // The arguments used if auto-instanc. is used
                        'callback': (r[2]) ? r[2] : void(0),            // Callback-Method (triggered after inj to DOM)
                        'caching':  _config.caching,                    // Object based caching directive
                        'hash': _hash.calculate(r[0]),                  // The hash (unique identifier)
                        'lazyClass': '',                                // The Class(-name)
                        'path': '',                                     // The (relative or full) path to file
                        'file': '',                                     // The filename
                        'url': '',                                      // The full url (combination of path + file)
                        'wait': false,                                  // Not implemented yet
                        'type': 'script',                               // Which type is this object of (script | style)
                        'target': 'head',                               // Where to add the element
                        'hashParent': (r[4]) ? r[4] : false,            // Parent item of this item (default = parent)
                        'lazyPackage': {                                // The Package path (e.g. Foo.Bar.Foobar)
                            'asString': false,                          // The Package as String
                            'asArray': r[0].split('.')                  // The Package as Array
                        }              
                    };
                };
    
                /**
                 * translates the request into a processable lazy-object
                 * 
                 * This method is intend to translate a request (object) to a lazy-object
                 * we need to perform the further tasks.
                 *
                 * @returns {Object}  A full-qualified an parsable lazy-object
                 * @private
                 */             
                var _translate = function() {
                	// the requested class arguments
                    var r = arguments[0];
                    
                    // already translated? => this operation is expensive!   
                    if (!_translations[r[0]]) {
                        // create a fresh and empty lazy-object by template
                        lazyObject = _createLazyObject(r);
                        
                        // get classname
                        lazyObject.lazyClass = lazyObject.lazyPackage.asArray.pop();
                        
                        // get package without class as string (.)
                        lazyObject.lazyPackage.asString = lazyObject.lazyPackage.asArray.join('.');
    
                        // construct and set path
                        lazyObject.path = lazyObject.classpath + lazyObject.lazyPackage.asArray.join('/')+'/';
                        
                        // construct and set filename
                        lazyObject.file = lazyObject.lazyClass + '.js';
                        
                        // set full url to file
                        lazyObject.url = lazyObject.path + lazyObject.file;
    
                        // store translation for further faster access
                        _translations[lazyObject.domId] = lazyObject;
                    }
    
                    // return translation
                    return _translations[r[0]];
                };
    
                /**
                 * autoloader implementation
                 * 
                 * This method is intend to decide if we need to load and full process a requested class/package.
                 * If the class/package was already loaded then it just call the defined callback (optional). If
                 * the class/package wasn't loaded before the it starts loading the class and the dependency-tree
                 * and finally it calls the callback (optional). If caching-mode is enabled then the class/package
                 * is only loaded once and get returned on each request. If caching-mode is disabled then the class/
                 * package get fresh loaded from server on each request.
                 *
                 * @param {Object} lazyObject The lazy-object to process (autoload)
                 *
                 * @returns void
                 * @private
                 */
                var _autoload = function(lazyObject) {
                    // case - caching disabled OR [ caching enabled AND object not loaded (not ready) ]
                    if (!_config.caching || !lazyObject.caching || (_config.caching && !_cache[lazyObject.hash])) {
                        // add the lazy-object to loading queue
                    	_fetchFileFromServer(lazyObject);
                    } else {
                        // case - caching enabled AND object already loaded (ready)
                        _callBack(lazyObject);
                    }
                };
    
                /**
                 * executes the callback
                 * 
                 * This method is intend to execute the previously defined callback.
                 *
                 * @param {Object} lazyObject The lazy-object to call back
                 * 
                 * @returns void
                 * @private
                 */
                var _callBack = function(lazyObject) {     	
                	if (lazyObject.callback != undefined) {
                		lazyObject.callback(
                		    (_config.autoinstanciate) ? new window[lazyObject.lazyClass](lazyObject.arguments) : null		
                		);
                	}
                };
    
                /**
                 * fetches a file via XHR from Server
                 * 
                 * This method is intend to load a file via XMLHttpRequest (Pipe.Xhr).
                 * It also controls the opened pipes and limit the maximum open pipes defined by 
                 * config.pipesMax.
                 *
                 * @param {Object} lazyObject The lazy-object to fetch source for
                 *
                 * @returns void
                 * @private
                 */
                var _fetchFileFromServer = function(lazyObject) {
                	// check for unlimited or free pipe
                    if (_config.pipesMax == 0 || _pipes < _config.pipesMax) {
                    	// get a new pipe (XHR) object
                    	var pipe = new Lazyload.Tool.Pipe.Xhr();
    	
    	                // increase the open pipe count!
    	                _pipes++;
    	                
    	                // create request
    	                pipe.create({
    	                    'timeout': _config.timeout,
    	                    'url': lazyObject.url,
    	                    'preventBrowserCaching': !lazyObject.caching,
    	                    'callback': function(o, s) {
    	                        // reduce the open pipe count!
    	                        _pipes--;
    	                        
    	                    	// continue only if fetching was successful (s = true)  
    	                    	if (s === true) {                        
    		                        // retrieve source
    		                        lazyObject.source = o.responseText;
    		                        
    		                        // call dispatcher to inject the final lazy-object into DOM
    		                        _dispatchLazyObject(lazyObject);	                    		
    	                    	} else {
    	                    		_('error: fetching file "'+lazyObject.url+'" failed!');
    	                    	}
    	                    }
    	                });
    	                
    	                // open the pipe!
    	                pipe.open();
                    } else {
                    	// if pipes-max reached we try again in 10ms
                    	setTimeout(function(){ _fetchFileFromServer(lazyObject); }, 10);
                    }
                };
                
                /**
                 * dispatches a lazy-object
                 *
                 * This method is intend as dispatcher for a loaded lazy-object. It adds the lazy-object-reference
                 * to the nested-tree, adds the lazy-object to cache (if caching enabled), retrieves and loads it 
                 * dependencies and afterwards (if everything's loaded) injects the tree into the DOM.
                 * 
                 * @param {Object} lazyObject The lazy-object to dispatch
                 *
                 * @returns void
                 * @private
                 */
                var _dispatchLazyObject = function(lazyObject) {
                    // if we reach the dispatch we can reduce the open handles by one
                    _countFilesToLoad--;
    
    				// add object to cache
                	_addToCache(lazyObject);
                	
                    // add a reference of current object to the nested tree structure
                    _addToTree(lazyObject.hash, lazyObject.hashParent);
    
                    // parse dependencies and load resources
    				_loadDependencies(lazyObject.classpath, lazyObject.source, lazyObject.hash);
    
                    // if all files loaded add everything we got to DOM
                    if (_countFilesToLoad == 0) {
    					_addTreeToDom();
                    }
                };
    
                /**
                 * adds a lazy-object to cache
                 *
                 * This method adds a lazy-object to cache if caching-flag of the lazy-object was
                 * set to true.
                 *
                 * @param {Object} lazyObject The lazy-object to add to cache
                 *
                 * @returns void
                 * @private
                 */
                var _addToCache = function(lazyObject) {
                	// we always store items in cache 
                	// but if caching is disabled we remove them after adding everything to DOM
                	_cache[lazyObject.hash] = lazyObject;
                };            
                
                /**
                 * adds a lazy-object-hash nested tree
                 *
                 * This method adds a lazy-object-hash (reference) to the tree of nested elements.
                 * This tree is used later for loading the resources in its correct order.
                 *
                 * @param {String} hashOfObject The unique identifier (hash) of the lazy-object
                 * @param {String} hashOfParent The unique identifier (hash) of the parent
                 *
                 * @returns void
                 * @private
                 */
                var _addToTree = function(hashOfObject, hashOfParent) {
                    // if object does not have a parent then this object e is our root-node
                    if (!hashOfParent) {
                    	// make current nesting-level an array
                    	_tree[_nestingLevel] = [hashOfObject];
                    } else {
                    	// current object has a parent
                    	if (_tree[_nestingLevel].contains(hashOfParent)) {
                    		_nestingLevel++;
                    		_tree[_nestingLevel] = [];
                    	}
                    	_tree[_nestingLevel].push(hashOfObject);
                    }
                };     
    
                /**
                 * loads dependencies for the current lazy-object
                 *
                 * This method loads the dependencies found in source of the current lazy-object.
                 *
                 * @param {String} hash The unique identifier (hash) of the lazy-object
                 * @param {}
                 *
                 * @returns void
                 * @private
                 */
                var _loadDependencies = function(classpath, source, hash) {
                	// parse dependencies
                    var i = 0, dependencies = _parseDependencies(classpath, source);
    
                    // iterate over found denpendencies and load them if found
                    for (i; i < dependencies.classes.length; ++i) {
                        // and load them the same way as the initial request
                        _load([dependencies.classes[i], false, void(0), dependencies.classpath, hash]);
                	}
                };
                
    
                var _addTreeToDom = function() {
                    // check if DOM is ready otherwise we have to wait!
                    if (Lazyload.isDOMReady) {
                    	var l = _tree.length - 1, lazyObject;
                    	
    	            	for (l; l >= 0; --l){
    	            		for (var j=0; j < _tree[l].length; ++j) {
    	            			lazyObject = _cache[_tree[l][j]];
    	            			
    	            			// and create the DOM-node
    		                    _injectDomNode(lazyObject);
    		                    
    		                    // callback
    		                    _callBack(lazyObject);		                    
    	            		}
    	            		
    	            		/*
    	            		for (hash in _tree[l]) {
    	            			// get lazyObject
    	            			lazyObject = _cache[_tree[l][hash]];
    		            		
    	            			// and create the DOM-node
    		                    _injectDomNode(lazyObject);
    		                    
    		                    // callback
    		                    //_callBack(lazyObject);
    		                    
    		                    // TODO: unset possible?
    		                    
    		                    //if (!lazyObject.caching) {
    		                    	//_cache[_tree[l][hash]] = null;
    		                    //}
    	            		}
    	            		*/
    	            	}
                    } else {
                    	// try again in 10ms
                    	setTimeout(function(){ _addTreeToDom(); }, 10);
                    }
                };
    
                /**
                 * creates a DOM-valid script-object.
                 *
                 * This method creates a DOM-valid script-object and returns it.
                 *
                 * @param {Object} config The config for creating a DOM-valid script-node
                 *
                 * @returns {Boolean} True if file is allready in queue, otherwise false
                 * @private
                 */
                var _injectDomNode = function(lazyObject) {
                    // create element (script|style)
                    var el = document.createElement((lazyObject.type == 'script') ? 'script' : 'style');
                    
                    // set type
                    el.type = 'text/' + ((lazyObject.type == 'script') ? 'javascript' : 'css');
    
                    // create a unique ID
                    el.id = lazyObject.domId;
                    
                    // defer cause it does not effect other parts
                    el.defer = true;
    
                    // set source
                    el.text = '\n'+lazyObject.source+'\n';
    
                    // add node to DOM
                    (lazyObject.target == 'head') ? _head.appendChild(el) : _body.appendChild(el);
                };
    
                /**
                 * parse out the dependencies from source
                 *
                 * This method is intend to parse out and return the dependencies from a given source.
                 *
                 * @param {String} classpath The classpath used as default
                 * @param {String} source    The source to parse for dependencies
                 * 
                 * @returns {Object} An object containing a classpath (as classpath) and all dependencies (as classes)
                 * @private
                 */
                var _parseDependencies = function(classpath, source) {
                	// get dependencies
                    var dependency = _annotationParser.parse(source, _config.dependencyIdentifier);
                    
                    var i = 0, dependencies = [];
    
                    if (dependency.length) {              
                        for (i; i < dependency.length; ++i) {
                            switch (dependency[i][0]) {
                                case 'classpath':
                                    if (dependency[i][1][0].substr(0, 1) == '/') {
                                        classpath = location.protocol + "//" + location.hostname + dependency[i][1][0];
                                    } else {
                                        classpath += dependency[i][1][0];
                                    }
                                    break;
                                case 'dependency':
                                    dependencies = dependency[i][1];
                                    break;
                            }
                        }
                    }
    
                    // return result as readable object
                    return {
    					'classpath': classpath,
    					'classes': dependencies
    				};                
                };
    
                /**
                 * executes methods for an given event.
                 *
                 * This method is intend to execute all defined methods for a given event.
                 *
                 * @param {String} e The event-name to fire/trigger
                 *
                 * @private
                 * @author  Benjamin Carl <phpfluesterer@googlemail.com>
                 * @since   Method available since Release 1.0.0
                 * @version 1.0
                 */
                var _fireEvent = function(e) {
                    var i = 0, fA = _getEventMethods(e, (arguments[1]) ? arguments[1] : void(0));
                    for (i; i < fA.length; ++i) {
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
                 * @returns {Array} The list of method/functions for the given event
                 * @private
                 */
                var _getEventMethods = function(e) {
                    var i = 0, tA = [], b = (arguments[1]) ? arguments[1] : void(0);
                    for (i; i < _events.length; ++i) {
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
                
                
                // parse the config if given
                if (arguments.length) {
                    this.configure(arguments[0]);
                }
    
                // prototype(s) for native java-/ecma-script elements
                Array.prototype.indexOf=function(a,b,c,r){for(b=this,c=b.length,r=-1;~c;r=b[--c]===a?c:r);return r;};
                var fnIndexOf = function(a){return this.indexOf(a)!=-1;};
                Array.prototype.contains=fnIndexOf;
                String.prototype.contains=fnIndexOf;
            },
    
            Hash: {
            	Djb2: function() {
    
                    /**
                     * calculates a djb2 hash.
                     *
                     * This method is intend to calculate a (really basic) djb2 hash. 
                     * Calculating a djb2 is much faster then using crc(8, 16, 32), md5 or sha1.
                     * This is exactly what i was looking for.
                     * @see http://www.cse.yorku.ca/~oz/hash.html
                     * 
                     * @param {String} The string to create a hash for.
                     *
                     * @returns {String} The generated hash
                     * @public
                     */           	
                	this.calculate = function(s)
                	{
                	    var i = 0, h = 5381;
                	    
                	    for (i; i < s.length; ++i) {
                	    	/* h * 33 + c */
                	        h = ((h << 5) + h) + s[i];
                	    }
    
                	    return h;
                	};
                },
                
            	Simple: function() {
    
                    /**
                     * calculates a simple hash.
                     *
                     * This method is intend to calculate a simple hash.
                     * 
                     * @param {String} The string to create a hash for.
                     *
                     * @returns {String} The generated hash
                     * @public
                     */           	
                	this.calculate = function(s)
                	{
                	    var p = 1, h = 0;
    
                	    // iterate over string
                	    for (p; p < s.length; ++p) {
                	    	h += (s.charCodeAt(p-1) * p) | (s.charCodeAt(p) * (p+1));
                	    }
    
                	    return h;
                	};
                }            
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
                Annotation: function() {
    
                    /**
                     * converts an array to an object
                     *
                     * This method is intend to take an array and convert it to an object.
                     *
                     * @returns {Object} The resulting object
                     * @public
                     */
                    this.parse = function(source) {
                        // tmp transformation array
                        var tmp, annotations = [], matches = source.match(/(@)[\w\d]+[\s]+[\w\d\/.,]+/g);
                        
                        // if we found dependency patterns
                        if (matches && matches.length) {
                        	//
                        	var i = 0;
                        	
                            // pre-process them
                            for (i; i < matches.length; ++i) {
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
                Xhr: function() {
                    
                    /**
                     * holds an instance of the XMLHttpRequest-Class
                     *
                     * @type {Object}
                     * @private
                     */
                    var _request;
    
                    /**
                     * creates an instance of the XMLHttpRequest-Class
                     *
                     * This method is intend to create an instance of the XMLHttpRequest-Class in a x-browser-compatible 
                     * way ...
                     *
                     * @param {Object} config The configuration for the request (containing at least the "url"-"method",
                     *                        "callback" and "preventBrowserCaching" are optional
                     *
                     * @returns {Object} An instance of the XMLHttpRequest-Class if supported, otherwise null
                     * @public
                     */
                    this.create = function(request) {
                        // check request for needed basic parameter
                        (request.preventBrowserCaching !== true) ? (request.preventBrowserCaching = false) : '';
                        (!request.method) ? (request.method = 'get') : '';
                        (!request.callback) ? (request.callback = void(0)) : '';
                        
                        // create xhr
                        _request = _getXhr();
    
                        // add fresh anti-caching timestamp?
                        request.url += (request.preventBrowserCaching) ? ('?_ac=' + new Date().getTime()) : '';
    
                        // open the request
                        _request.open(request.method, request.url, true);
                        
                        // store internal
                        _request.callback = request.callback;
    
                        // check for timeout
                        if (request.timeout > 0) {
    						// store current timestamp
                        	_request.timestamp = new Date().getTime();
    
    						// set timeout
                        	_request.timer = setTimeout(function(){ 
                        		_request.abort();
                        		_request.callback(this, false);
    						}, request.timeout);
                        }
                        
                        // what's to do on status change 
                        _request.onreadystatechange = function() {                    	
                            // if not finished loading
                        	if (_request.readyState != 4) {
                                return;
                            }
    
                        	// remove timer for timeout
                        	clearTimeout(_request.timer);
    
                            // call back with reference to this instance
                            _request.callback(this, true);
                        };
                    };
    
                    /**
                     * opens a previously created pipe
                     *
                     * This method is intend to open a previously created pipe.
                     *
                     * @returns {Object} An instance of the XMLHttpRequest-Class if supported, otherwise null
                     * @public
                     */
                    this.open = function() {
                        return _request.send(null);
                    };
                    
                    /**
                     * creates an instance of the XMLHttpRequest-Class
                     *
                     * This method is intend to create an instance of the XMLHttpRequest-Class in a x-browser-compatible 
                     * way ...
                     *
                     * @returns {Object} An instance of the XMLHttpRequest-Class if supported, otherwises null
                     * @private
                     */      
                    var _getXhr = function() {
                        try { return new XMLHttpRequest(); } catch(e) {}
                        try { return new ActiveXObject("Msxml2.XMLHTTP"); } catch (e) {}
                        return null;
                    };            
                }
            }
        }
    };
    /**
     * init preworker (e.g. watch DOM ready-state)
     */
    Lazyload.Init();
}());


/**
 * shortcut/wrapper to main functionality
 * 
 * This class is a shortcut to the class Lazyload.Tool.Loader. It provides a simple
 * API to Lazyload.Tool.Loader.
 * 
 * @example Loading a class: 
 * 			 require('Foo.Bar.Myclass');
 * 			
 * 			Configuring Lazyload and load a class afterwards:
 * 			 require().configure({
 * 			     'caching': false 
 * 			 });
 * 
 * 		     // request this file with caching = disabled
 * 			 require('Foo.Bar.Myclass');
 *
 * @returns {Object|Void} An unconfigured Lazyload.Tool.Loader instance OR void if used for loading a class
 * @public
 */
var require = function() {
	// holds the instance
	this.instance;

	// create instance if not exists already
	if (!require.instance) {
		require.instance = new Lazyload.Tool.Loader();
	}
    
    // check if empty configure call or loading request
    if (arguments.length) {
        require.instance.load(arguments, 'Lazyload.Shortcut');
    } else {
        // return unconfigured instance (which could be configured by calling config())
        return require.instance;
    }
};
