/**
 * GENERAL PREPARE
 */

if (JSON === undefined) {
    var JSON = {};
}

// implement JSON.stringify serialization
JSON.stringify = JSON.stringify || function (obj) {
    var t = typeof (obj);
    if (t !== "object" || obj === null) {
        // simple data type
        if (t === "string") {
            obj = '"' + obj + '"';
        }
        return String(obj);
    }
    else {
        // recurse array or object
        var n, v, json = [], arr = (obj && obj.constructor === Array);
        for (n in obj) {
            v = obj[n];
            t = typeof(v);
            if (t === "string") {
                v = '"' + v + '"';
            } else if (t === "object" && v !== null) {
                v = JSON.stringify(v);
            }
            json.push((arr ? "" : '"' + n + '":') + String(v));
        }
        return (arr ? "[" : "{") + String(json) + (arr ? "]" : "}");
    }
};


/**
 * Test Nr. 1
 *
 * Tests including and installation of Lazyload.js
 */
test("included/installed test", function ()
{
    expect(2);

    ok(window.Lazyload, "Lazyload exists [Lazyload]");
    equal(typeof window.Lazyload, 'object', "Lazyload is object [Lazyload]");
});


/**
 * Test Nr. 2
 *
 * Tests if Lazyload.js was successfully initialized
 */
test("initialization test", function ()
{
    expect(4);

    ok(Lazyload.isDomReady, "Lazyload.isDomReady exists");
    equal(Lazyload.onDomReady, false, "Lazyload.onDomReady exists");
    ok(Lazyload.ready, "Lazyload.ready exists");
    equal(Lazyload.ready, true, "Lazyload.js is ready to use");
});


/**
 * Test Nr. 3
 *
 * Tests if Lazyload.js can be configured
 */
test("configuration test", function ()
{
    // we need to define how much tests(assertions...) we expect to be executed
    // checking this means one more step we validate for cheap
    expect(2);

    var lazyload = new Lazyload.Core.Loader();

    // read config and test it
    var config = lazyload.config();
    equal(config.debug.enabled, false, "Config read");

    // enable debug in config and test it
    config = lazyload.config({
        debug: {
            enabled: true
        }
    });

    equal(config.debug.enabled, true, "Config write (set true)");
});


/**
 * Test Nr. 4
 *
 * Tests if Lazyload.js does load a single resource by argument, a second one by parsing dependencies
 * and as third test if callback "success" get triggered properly
 */
test(
    "Loading: Resources: [1:view/static/script/js/foo.js,2:view/static/script/js/bar.js] [parse-dependencies: true]",
    function () {

    var requests = [],
        fakeXMLHttpRequest = sinon.useFakeXMLHttpRequest(),
        resource1 = 'view/static/script/js/foo.js',
        lazyload = new Lazyload.Core.Loader(),
        response1,
        response2,
        result,
        spy;

    expect(4);

    fakeXMLHttpRequest.onCreate = function (request) {
        requests.push(request);
    };

    spy = sinon.spy();

    var mySpy = function (args) {
        spy(args);
    };

    lazyload.config({
        parse: true
    });

    // test loading and assume a success! -> in callback we do all the tests
    lazyload.require(resource1).then(
        mySpy
    );

    // define the response contained within foo.js
    response1 = '\n' +
    '/**\n' +
    ' * @resources view/static/script/js/bar.js\n' +
    ' * @configuration {configuration: "override"}\n' +
    ' * @property {property: "override"}\n' +
    ' */\n' +
    'var Foo = function Foo(refBar) {\n' +
    '    var myBar = refBar;\n' +
    '    this.getInfo = function getInfo() {\n' +
    '        if (myBar == undefined) {\n' +
    '            // rock on with class "Foo"\n' +
    '        } else {\n' +
    '            myBar.getInfo();\n' +
    '        }\n' +
    '    };\n' +
    '};\n';

    // define the response contained within bar.js
    response2 = '\n' +
    'var Bar = function Bar() {\n' +
    '    this.getInfo = function () {\n' +
    '        // Rock on with class "Bar"\n' +
    '    };\n' +
    '};\n';

    // test if exactly 1 file has passed our loading mechanism
    equal(requests.length, 1, "1st file (1/2) has passed the loader");

    // TODO: check if we should use application/javascript
    // send status 200 OK for this still "open" request
    requests[0].respond(200, {"Content-Type": "text/javascript"}, response1);

    // test if exactly 1 file has passed our loading mechanism
    equal(requests.length, 2, "2nd file (2/2) has passed the loader");

    // send status 200 OK for this still "open" request
    requests[1].respond(200, {"Content-Type": "text/javascript"}, response2);

    // check if callback was triggered
    equal(spy.called, true, "Final callback [.then(success)] triggered");

    // final callback succeeded? [testing our promise]
    result = ["view/static/script/js/foo.js", "view/static/script/js/bar.js"];

    // check if the correct argument was passed to success callback
    ok(
        spy.calledWith(result),
        "Argument passed to final callback matches expectation 1:1 (" + JSON.stringify(result) + ")"
    );
});

/**
 * Test Nr. 5
 *
 * Tests if Lazyload.js does load a two resources parallel properly
 */
test("Loading: Resources: [1:view/static/script/js/foo.js,2:view/static/script/js/bar.js] [asynchronous]", function () {

    var requests = [],
        fakeXMLHttpRequest = sinon.useFakeXMLHttpRequest(),
        resource1 = 'view/static/script/js/foo.js',
        resource2 = 'view/static/script/js/bar.js',
        lazyload = new Lazyload.Core.Loader(),
        response1,
        response2,
        result,
        spy;

    fakeXMLHttpRequest.onCreate = function (request) { requests.push(request); };

    spy = sinon.spy();

    // test loading and assume a success! -> in callback we do all the tests
    lazyload.require(resource1 + ',' + resource2).then(
        spy
    );

    lazyload.config({
        parse: false
    });

    // define the response contained within foo.js
    response1 = '\n' +
    '/**\n' +
    ' * @resources view/static/script/js/bar.js\n' +
    ' * @configuration {configuration: "override"}\n' +
    ' * @property {property: "override"}\n' +
    ' */\n' +
    'var Foo = function Foo(refBar) {\n' +
    '    var myBar = refBar;\n' +
    '    this.getInfo = function getInfo() {\n' +
    '        if (myBar == undefined) {\n' +
    '            // rock on with class "Foo"\n' +
    '        } else {\n' +
    '            myBar.getInfo();\n' +
    '        }\n' +
    '    };\n' +
    '};\n';

    // define the response contained within bar.js
    response2 = '\n' +
    'var Bar = function Bar() {\n' +
    '    this.getInfo = function () {\n' +
    '        // Rock on with class "Bar"\n' +
    '    };\n' +
    '};\n';

    // send status 200 OK for this still "open" request
    // TODO: check if we should use application/javascript
    requests[0].respond(200, {"Content-Type": "text/javascript"}, response1);

    // test if exactly 1 file has passed our loading mechanism
    equal(requests.length, 2, "1st file (1/2) has passed the loader");

    requests[1].respond(200, {"Content-Type": "text/javascript"}, response2);

    // test if exactly 1 file has passed our loading mechanism
    equal(requests.length, 2, "2nd file (2/2) has passed the loader");

    // check if callback was triggered
    equal(spy.called, true, "Final callback [.then(success)] triggered");

    // final callback succeeded? [testing our promise]
    result = ["view/static/script/js/foo.js", "view/static/script/js/bar.js"];

    // check if the correct argument was passed to success callback
    ok(
        spy.calledWith(result),
        "Argument passed to final callback matches expectation 1:1 (" + JSON.stringify(result) + ")"
    );
});


/**
 * Test Nr. 6
 *
 * Tests if Lazyload.js does load a two resources after another properly
 */
test(
    "Loading: Resources: [1:view/static/script/js/foo.js,2:view/static/script/js/bar.js] [synchronous]",
    function () {

    var requests = [],
        fakeXMLHttpRequest = sinon.useFakeXMLHttpRequest(),
        resource1 = 'view/static/script/js/foo.js',
        resource2 = 'view/static/script/js/bar.js',
        lazyload = new Lazyload.Core.Loader(),
        response1,
        response2,
        result,
        spy;

    fakeXMLHttpRequest.onCreate = function (request) { requests.push(request); };

    spy = sinon.spy();

    // test loading and assume a success! -> in callback we do all the tests
    lazyload.require(resource1)
            .and(resource2)
            .then(
                spy
            );

    lazyload.config({
        parse: false
    });

    // define the response contained within foo.js
    response1 = '\n' +
    '/**\n' +
    ' * @resources view/static/script/js/bar.js\n' +
    ' * @configuration {configuration: "override"}\n' +
    ' * @property {property: "override"}\n' +
    ' */\n' +
    'var Foo = function Foo(refBar) {\n' +
    '    var myBar = refBar;\n' +
    '    this.getInfo = function getInfo() {\n' +
    '        if (myBar == undefined) {\n' +
    '            // rock on with class "Foo"\n' +
    '        } else {\n' +
    '            myBar.getInfo();\n' +
    '        }\n' +
    '    };\n' +
    '};\n';

    // define the response contained within bar.js
    response2 = '\n' +
    'var Bar = function Bar() {\n' +
    '    this.getInfo = function () {\n' +
    '        // Rock on with class "Bar"\n' +
    '    };\n' +
    '};\n';

    // send status 200 OK for this still "open" request
    // TODO: check if we should use application/javascript
    requests[0].respond(200, {"Content-Type": "text/javascript"}, response1);

    // test if exactly 1 file has passed our loading mechanism
    equal(requests.length, 2, "1st file (1/2) has passed the loader");

    requests[1].respond(200, {"Content-Type": "text/javascript"}, response2);

    // test if exactly 1 file has passed our loading mechanism
    equal(requests.length, 2, "2nd file (2/2) has passed the loader");

    // check if callback was triggered
    equal(spy.called, true, "Final callback [.then(success)] triggered");

    // final callback succeeded? [testing our promise]
    result = ["view/static/script/js/foo.js", "view/static/script/js/bar.js"];

    // check if the correct argument was passed to success callback
    ok(
        spy.calledWith(result),
        "Argument passed to final callback matches expectation 1:1 (" + JSON.stringify(result) + ")"
    );
});


/**
 * Test Nr. 7
 *
 * Tests if Lazyload.js does load the first resource properly while awaiting the second to fail
 */
test(
    "Loading: Resources: [1:view/static/script/js/foo.js,2:view/static/script/js/baz.js] [synchronous fail on 2nd]",
    function () {

    var requests = [],
        fakeXMLHttpRequest = sinon.useFakeXMLHttpRequest(),
        resource1 = 'view/static/script/js/foo.js',
        resource2 = 'view/static/script/js/baz.js',
        lazyload = new Lazyload.Core.Loader(),
        response1,
        response2,
        result,
        spy;

    fakeXMLHttpRequest.onCreate = function (request) { requests.push(request); };

    spy = sinon.spy();

    // test loading and assume a success! -> in callback we do all the tests
    lazyload.require(resource1)
            .and(resource2)
            .then(
                null,
                spy
            );

    lazyload.config({
        parse: false
    });

    // define the response contained within foo.js
    response1 = '\n' +
    '/**\n' +
    ' * @resources view/static/script/js/baz.js\n' +
    ' * @configuration {configuration: "override"}\n' +
    ' * @property {property: "override"}\n' +
    ' */\n' +
    'var Foo = function Foo(refBar) {\n' +
    '    var myBar = refBar;\n' +
    '    this.getInfo = function getInfo() {\n' +
    '        if (myBar == undefined) {\n' +
    '            // rock on with class "Foo"\n' +
    '        } else {\n' +
    '            myBar.getInfo();\n' +
    '        }\n' +
    '    };\n' +
    '};\n';

    // define the response contained within bar.js
    response2 = '404 Document not found!\n';

    // send status 200 OK for this still "open" request
    // TODO: check if we should use application/javascript
    requests[0].respond(200, {"Content-Type": "text/javascript"}, response1);

    // test if exactly 1 file has passed our loading mechanism
    equal(requests.length, 2, "1st file (1/2) has passed the loader");

    requests[1].respond(404, {"Content-Type": "text/html"}, response2);

    // test if exactly 1 file has passed our loading mechanism
    equal(requests.length, 2, "2nd file (2/2) has reached the loader");

    // check if callback was triggered
    equal(spy.called, true, "Final callback [.then(failure)] triggered");

    // final callback succeeded? [testing our promise]
    result = "view/static/script/js/baz.js";

    // check if the correct argument was passed to success callback
    ok(
        spy.calledWith(result),
        "Argument passed to final callback matches expectation 1:1 (" + JSON.stringify(result) + ")"
    );
});