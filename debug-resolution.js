const { CoreSearchEngine } = require('./shared/dist/core-api/search-engine');

const engine = new CoreSearchEngine();
console.log('Testing resolveProductsFromQuery:');
console.log('fuz ->', engine.resolveProductsFromQuery('fuz'));  
console.log('fuzz ->', engine.resolveProductsFromQuery('fuzz'));
console.log('fuzzball ->', engine.resolveProductsFromQuery('fuzzball'));
console.log('war ->', engine.resolveProductsFromQuery('war'));
console.log('asc ->', engine.resolveProductsFromQuery('asc'));
console.log('rock ->', engine.resolveProductsFromQuery('rock'));
console.log('roc ->', engine.resolveProductsFromQuery('roc'));
console.log('rocky ->', engine.resolveProductsFromQuery('rocky'));
console.log('rlc ->', engine.resolveProductsFromQuery('rlc'));