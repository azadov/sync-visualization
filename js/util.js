function appendArrays(_array1, _array2) {
    'use strict';

    var i = 0;
    for (i = 0; i < _array2.length; i = i + 1) {
        _array1.push(_array2[i]);
    }
}

function modulus(_value) {
    'use strict';

    if (_value >= 0) {
        return _value;
    } else {
        return 0 - _value;
    }
}

function getMin(_x1, _x2) {
    'use strict';

    if (_x2 <= _x1) {
        return _x2;
    } else {
        return _x1;
    }
}

function getMax(_x1, _x2) {
    'use strict';

    if (_x2 >= _x1) {
        return _x2;
    } else {
        return _x1;
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