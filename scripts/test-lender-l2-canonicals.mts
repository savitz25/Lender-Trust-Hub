import assert from 'node:assert/strict';
import { metadata as aboutMetadata } from '../app/about/page';
import { metadata as compareMetadata } from '../app/compare/layout';

assert.equal(aboutMetadata.alternates?.canonical, 'https://www.lendertrusthub.com/about');
assert.equal(compareMetadata.alternates?.canonical, 'https://www.lendertrusthub.com/compare');
assert.notEqual(aboutMetadata.alternates?.canonical, 'https://www.lendertrusthub.com');
assert.notEqual(compareMetadata.alternates?.canonical, 'https://www.lendertrusthub.com');

console.log('L2 canonical metadata checks passed');
