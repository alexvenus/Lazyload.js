/**
 * @dependency Provider.Feedback.Lib.ExampleA
 */
function AnbieterA()
{
    var _id = 'AnbieterA';

    var _d = new Date();
    
    this.getId = function()
    {
        return _id + ' ' + _d.getTime().toString();
    };
}
