/**
 * @classpath /Lab/Javascript/Lazyload.js/view/static/script/Js/Ui/Core/
 * @dependency Provider.Feedback.AnbieterA,Provider.Feedback.AnbieterB,Provider.Feedback.AnbieterC,Provider.Feedback.AnbieterD
 */
function Feedback()
{
    var _id = 'Feedback';

    var _a = new AnbieterA();

    var _d = new Date();

    var _config = (arguments.length) ? arguments[0] : null;

    this.getId = function()
    {
        var show = (_config && (_config.show === true || _config.show === false)) ? _config.show : 'n.a.';
        return _id + ' ' + _d.getTime().toString() + ' config show is: ' + show;
    };

    this.getAnbieter = function()
    {
        return _a;
    };
}