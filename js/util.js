function appendArrays(_array1, _array2) {
    'use strict';

    var i = 0;
    for (i = 0; i < _array2.length; i = i + 1) {
        _array1.push(_array2[i]);
    }
}


/**
 * return random integer between min and max
 * @param min
 * @param max
 * @returns {*}
 */
function getRandom(min, max) {
    'use strict';

    if(min > max) {
        return -1;
    }

    if(min == max) {
        return min;
    }

    var r;

    do {
        r = Math.random();
    }
    while(r == 1.0);

    return min + parseInt(r * (max-min+1));
}