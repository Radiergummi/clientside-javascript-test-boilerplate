'use strict';

/*
 global module,
 require,
 describe,
 it,
 expect
 */

describe('Testing example', () => {
  const example = new Example;
  
  it('Should instanciate HTTP', function() {
    expect(http).to.be.an.instanceof(Example);
  });
});
