/**
 * no further dependencies
 */
function ExampleA()
{
    var _id = 'ExampleA';

    var _d = new Date();
    
    this.getId = function()
    {
        return _id + ' ' + _d.getTime().toString();
    }
}