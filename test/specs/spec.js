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
  
  it('Should instanciate Example', function() {
    expect(example).to.be.an.instanceof(Example);
  });
});
