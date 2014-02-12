/**
 * Test Nr. 1
 *
 * Tests including and installation of Lazyload.js
 */
test("included/installed test", function ()
{
    ok(window.Lazyload, "Lazyload exists [Lazyload]");
});

/**
 * Test Nr. 2
 *
 * Tests loading an external resource via Lazyload.js
 */
/*
asyncTest("asynchronous test: Load an external resource test", 2, function ()
{
    // external resources url
    var url = '//ajax.googleapis.com/ajax/libs/jquery/1.8.3/jquery.min.js';

    // load an external resource
    Lazyload.require(
            url
        ).then(
        // callback success
        function success() {
            ok(true, 'jQuery was successfully loaded from: ' + url);
            ok(true, 'Promise: resolved successfully!');
            start();
        },
        // callback failure
        function failure(failure) {
            ok(false, 'Something went wrong while loading: ' + url);
        }
    );
});
*/

/**
 * Test Nr. 3
 *
 * Tests loading an local resource via Lazyload.js
 */
/*
asyncTest("asynchronous test: Load a local resource test", 2, function ()
{
    // external resources url
    var url = 'view/static/script/js/foo.js';

    // load an external resource
    Lazyload.config({
            parse: false
        }).require(
            url
        ).then(
        // callback success
        function success() {
            ok(true, 'Foo was successfully loaded from: ' + url);
            ok(true, 'Promise: resolved successfully!');
            start();
        },
        // callback failure
        function failure(failure) {
            ok(false, 'Something went wrong while loading: ' + url);
        }
    );
});
*/
