# Lazyload.js #

[http://www.phpfluesterer.de/category/projekte/open-source-software-projekte/lazyload.js/](http://www.phpfluesterer.de/category/projekte/open-source-software-projekte/lazyload.js/)

Lazyload.js is a tiny and kept simple "annotation-based-dependency-loader"-framework written in and for JavaScript.
It's full compatible with jQuery and can make use of it to process DOM-elements. If jQuery isn't available it uses
native JavaScript functionality. It enables your JavaScript based Application to load further dependencies 
through simple annotations (@).
Example:

    /**
     * @dependency Provider.Feedback.AnbieterA,Provider.Feedback.AnbieterB
     */
    function Feedback()
    {
        var _id = 'Feedback';
        
    }    

In the example above you can see how dependencies of class "Feedback" must be defined to load them automatically when
loading the class with Lazyload.js. In the example Lazyload.js tries to load "/Provider/Feedback/AnbieterA.js" and
"/Provider/Feedback/AnbieterB.js" before it loads and instanciate "Feedback".

You can also override a previously configured (config on instanciation) classplath for a single (or in each) file.
Example:

    /**
     * @classpath /Lab/Javascript/Lazyload.js/view/static/script/Js/Ui/Core/
     * @dependency Provider.Feedback.AnbieterA,Provider.Feedback.AnbieterB
     */
    function Feedback()
    {
        var _id = 'Feedback';
        
    }    


The dependencies can be nested as deep as your application requires. You do not have to keep an eye of the correct 
order or something like that. Just load the require class through Lazyload.js and all the work is done magically by
Lazyload.js.

You can also load as many dependencies as your class require. Simply separate the dependencies by a "," as you can 
see in the example above.



## Configuration ##

You can either make use of "require()" - a small builtIn wrapper to Lazyload.js - framework.

Example:

    <script language="javascript" type="text/javascript" id="Lazyload.Init">

	// configure Lazyload.js require()-method
	require().configure({
        'classpath': 'view/static/script/',  // base path to classes
        'provider': 'native',                // can be either "native" for pure JS or "jquery" if jQuery is supported
        'caching': true,                     // cache TRUE = just inlcude once - FALSE = reload on every request
        'scope': window,                     // the global scope used for generic instanciation
		'timeout': 1000,                     // the timeout for loading external resources in ms
        'debug': {                           // controls the output
            'enabled': true,                    // - enabled OR disabled  
            'logger': console.log               // - output method/function (logger)
        }
	});
    
	// Load class "Feedback" from Namespace "Js/Ui/Core" => File "Js/Ui/Core/Feedback.js"
    // and return an instance with paramters show:true and autoload:false
	// pass this instance to callback-function
    require(
        'Js.Ui.Core.Feedback', 
    	{'show': true, 'autoload': false}, 
    	function(feedback){ alert(feedback.getAnbieter().getId()) }
    );

    </script>
    
@see: Example1.html    
    
Or you make use of the framework in the traditional OOP way:
Example:

    <script language="javascript" type="text/javascript" id="Lazyload.Demonstration">
    
    // trigger for demonstrating href click -> instanciate loader -> async processing of dependencies and finally call
    // the defined callback method
    function triggerLazyload() 
    {
        // get instance of Lazyload toolbox
        var loader = new Lazyload.Tool.Loader({
            'classpath': 'view/static/script/', // base path to classes
            'provider': 'native',               // can be either "native" for pure JS or "jquery" if jQuery is supported
            'caching': true,                    // cache TRUE = just inlcude once - FALSE = reload on every request
            'scope': window,                    // the global scope used for generic instanciation
            'timeout': 1000,                    // the timeout for loading external resources in ms
            'debug': {                          // controls the output
                'enabled': true,                   // - enabled OR disabled  
                'logger': console.log              // - output method/function (logger)
            }
        });
    
        // and load the same way like with "require()"
        loader.load(
            'Js.Ui.Core.Feedback', 
            {'show': true,'autoload': false}, 
            function(feedback){ alert(feedback.getAnbieter().getId()) }
        );    
    }

    </script>
    
@see: Example2.html
