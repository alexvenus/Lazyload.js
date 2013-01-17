
// test availability
test("Lazyload.js is-installed test", function() {
    ok(window.Lazyload, "window.Lazyload exists");
    equal(typeof window.Lazyload, 'object', "typeof window.Lazyload is object");

});

// test initialization
test("Lazyload.js init-state test", function() {

    expect(5);
    ok(window.Lazyload.isDomReady, "isDomReady accessible");
    equal(window.Lazyload.onDomReady, false, "onDomReady accessible");
    ok(window.Lazyload.dom, "Lazyload.dom accessible");
    ok(window.Lazyload.ready, "ready accessible");
    equal(window.Lazyload.ready, true, "initialization done (true)");

});

//test load 1
asyncTest("Lazyload.js require() test simple loading (resource: view/static/script/js/foo.js)", 1, function(){

    // we need to define how much tests(assertions...) we expect to be executed
    // checking this means one more step we validate for cheap
    expect(4);

    var ll = new window.Lazyload.Tool.Loader();

    equal(typeof ll, 'object', "instanciation done (object)");

    // enable debug and test
    ll.configure({debug: {enabled: true}});
    var config = ll.configure();
    equal(config.debug.enabled, true, "debug mode enabled");

    // disable dependency parsing for this test
    ll.configure({parse: false});
    var config = ll.configure();
    equal(config.parse, false, "parsing of dependencies successful disabled");

    var resource1 = 'view/static/script/js/foo.js';

    // test loading and assume a success! -> in callback we do all the tests
    ll.require(resource1).then(
        function() {
            ok(true, 'successful loaded resource: "' + resource1 + '"');
            start();
        }
    );
});

//test load 2
asyncTest("Lazyload.js require() test simple loading (resource: view/static/script/js/bar.js)", 1, function(){

 // we need to define how much tests(assertions...) we expect to be executed
 // checking this means one more step we validate for cheap
 expect(1);

 var ll = new window.Lazyload.Tool.Loader();
 // enable debug and test
 ll.configure({debug: {enabled: true}});
 // disable dependency parsing for this test
 ll.configure({parse: false});

 var resource1 = 'view/static/script/js/bar.js';

 // test loading and assume a success! -> in callback we do all the tests
 ll.require(resource1).then(
     function() {
         ok(true, 'successful loaded resource: "' + resource1 + '"');
         start();
     }
 );
});

//test load 3
asyncTest("Lazyload.js require() test extended loading (resource: view/static/script/js/foo.js) and (resource: view/static/script/js/bar.js)", 1, function(){

 // we need to define how much tests(assertions...) we expect to be executed
 // checking this means one more step we validate for cheap
 expect(1);

 var ll = new window.Lazyload.Tool.Loader();
 // enable debug and test
 ll.configure({debug: {enabled: true}});
 // disable dependency parsing for this test
 ll.configure({parse: false});

 var resource1 = 'view/static/script/js/foo.js', resource2 = 'view/static/script/js/bar.js';

 // test loading and assume a success! -> in callback we do all the tests
 ll
 .require(resource1)
 .and(resource2)
 .then(
     function() {
         ok(true, 'successful loaded resource: "' + resource1 + '" and "' + resource2 + '"');
         start();
     }
 );
});

//test load 4
asyncTest("Lazyload.js require() test fails if resource invalid (resource: view/static/script/js/ba.js)", 1, function(){

 // we need to define how much tests(assertions...) we expect to be executed
 // checking this means one more step we validate for cheap
 expect(1);

 var ll = new window.Lazyload.Tool.Loader();
 // enable debug and test
 ll.configure({debug: {enabled: true}});
 // disable dependency parsing for this test
 ll.configure({parse: false});

 var resource1 = 'view/static/script/js/ba.js';

 // test loading and assume a success! -> in callback we do all the tests
 ll
 .require(resource1)
 .then(
     function() {
         // won't be true
     },
     function() {
         ok(true, 'successful catched error while trying to load resource: "' + resource1 + '"');
         start();
     }
 );
});

//test load 5
asyncTest("Lazyload.js require() test extended loading (more resources)", 1, function(){

 // we need to define how much tests(assertions...) we expect to be executed
 // checking this means one more step we validate for cheap
 expect(1);

 var ll = new window.Lazyload.Tool.Loader();
 // enable debug and test
 ll.configure({debug: {enabled: true}});
 // disable dependency parsing for this test
 ll.configure({parse: false});

 var resource1 = 'view/static/script/js/foo.js', resource2 = 'view/static/script/js/bar.js', resource3 = 'view/static/script/js/jquery-1.8.3.js';

 // test loading and assume a success! -> in callback we do all the tests
 ll
 .require(resource1)
 .and(resource2)
 .and(resource3)
 .then(
     function() {
         ok(true, 'successful loaded resource: "' + resource1 + '" and "' + resource2 + '" and "' + resource3 + '"');
         start();
     },
     function() {
         // won't be true
     }
 );
});

//test load 6
asyncTest("Lazyload.js require() test extended loading (load 1 resource and afterwards 2 resources parallel)", 1, function(){

 // we need to define how much tests(assertions...) we expect to be executed
 // checking this means one more step we validate for cheap
 expect(1);

 var ll = new window.Lazyload.Tool.Loader();
 // enable debug and test
 ll.configure({debug: {enabled: true}});
 // disable dependency parsing for this test
 ll.configure({parse: false});

 var resource1 = 'view/static/script/js/foo.js', resource2 = 'view/static/script/js/bar.js', resource3 = 'view/static/script/js/jquery-1.8.3.js';

 // test loading and assume a success! -> in callback we do all the tests
 ll
 .require(resource3)
 .and(resource1 + ',' + resource2)
 .then(
     function() {
         ok(true, 'successful loaded resource: "' + resource1 + '" and "' + resource2 + '" and "' + resource3 + '"');
         start();
     },
     function() {
         // won't be true
     }
 );
});

//test load 7
asyncTest("Lazyload.js require() test extended loading (load 1 resource and afterwards 2 resources parallel)", 1, function(){

 // we need to define how much tests(assertions...) we expect to be executed
 // checking this means one more step we validate for cheap
 expect(1);

 var ll = new window.Lazyload.Tool.Loader();
 // enable debug and test
 ll.configure({debug: {enabled: true}});
 ll.configure({parse: false});
 var config = ll.configure();

 var resource1 = 'view/static/script/js/foo.js', resource2 = 'view/static/script/js/bar.js', resource3 = 'view/static/script/js/jquery-1.8.3.js';

 // test loading and assume a success! -> in callback we do all the tests
 ll
 .require(resource3)
 .and(resource1 + ',' + resource2)
 .then(
     function() {
         ok(true, 'successful loaded resource: "' + resource1 + '" and "' + resource2 + '" and "' + resource3 + '"');
         start();
     },
     function() {
         // won't be true
     }
 );
});