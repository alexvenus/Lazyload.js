/**
 * @dependency Provider.Feedback.Lib.Api
 */
function ExampleB()
{
    var _id = 'ExampleB';

    var _d = new Date();
    
    this.getId = function()
    {
        return _id + ' ' + _d.getTime().toString();
    }
}