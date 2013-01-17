/**
 * @dependency Provider.Feedback.Lib.ExampleB
 */
function AnbieterB()
{
    var _id = 'AnbieterB';

    var _d = new Date();
    
    this.getId = function()
    {
        return _id + ' ' + _d.getTime().toString();
    }
}