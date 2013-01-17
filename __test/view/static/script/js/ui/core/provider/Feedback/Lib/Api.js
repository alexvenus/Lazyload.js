/**
 * no further dependencies
 */
function Api()
{
    var _id = 'Api';

    var _d = new Date();
    
    this.getId = function()
    {
        return _id + ' ' + _d.getTime().toString();
    }
}