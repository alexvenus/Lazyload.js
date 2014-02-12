/**
 * @resources __test/view/static/script/js/bar.js
 * @configuration {"parse": true}
 * @properties {"caching": true}
 */
var Foo = function Foo(refBar) {

    var myBar = refBar;

    this.getInfo = function getInfo() {
        if (myBar === undefined) {
            //alert('Rock on with class "Foo"');
        } else {
            myBar.getInfo();
        }
    };
};
