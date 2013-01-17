/**
 * @files __test/view/static/script/js/bar.js
 * @configuration {configuration: 'override'}
 * @property {property: 'override'}
 */


var Foo = function Foo(refBar) {

    var myBar = refBar;

    this.getInfo = function getInfo() {
        if (myBar == undefined) {
            //alert('Rock on with class "Foo"');
        } else {
            myBar.getInfo();
        }
    };
};


//var myFoo = new Foo( new Bar() );
//myFoo.getInfo();
