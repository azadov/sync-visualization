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