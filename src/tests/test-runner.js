
// Frontend test runner configuration
const { execSync } = require('child_process');

const runTests = () => {
  try {
    console.log('🚀 Running Frontend Tests...\n');
    
    // Run all frontend tests from the tests directory
    execSync('npm test -- --testPathPattern=src/tests --watchAll=false --verbose', {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    console.log('\n✅ All frontend tests completed!');
  } catch (error) {
    console.error('\n❌ Some tests failed:', error.message);
    process.exit(1);
  }
};

// Individual test runners for specific categories
const runComponentTests = () => {
  console.log('🧩 Running Component Tests...\n');
  execSync('npm test -- --testPathPattern=src/tests/components --watchAll=false', { stdio: 'inherit' });
};

const runPageTests = () => {
  console.log('📄 Running Page Tests...\n');
  execSync('npm test -- --testPathPattern=src/tests/pages --watchAll=false', { stdio: 'inherit' });
};

const runUITests = () => {
  console.log('🎨 Running UI Component Tests...\n');
  execSync('npm test -- --testPathPattern=src/tests/components/ui --watchAll=false', { stdio: 'inherit' });
};

if (require.main === module) {
  runTests();
}

module.exports = { 
  runTests, 
  runComponentTests, 
  runPageTests, 
  runUITests 
};
