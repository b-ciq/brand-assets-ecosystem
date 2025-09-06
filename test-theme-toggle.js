// Test script to toggle theme and verify JPEG background changes
(() => {
  console.log('Testing theme toggle for JPEG backgrounds...');
  
  // Function to get current theme
  const getCurrentTheme = () => {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  };
  
  // Function to toggle theme
  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
  };
  
  // Function to check asset card backgrounds
  const checkAssetBackgrounds = () => {
    const assetCards = document.querySelectorAll('[class*="relative h-full overflow-hidden"]');
    const backgrounds = [];
    
    assetCards.forEach((card, index) => {
      const bgColor = window.getComputedStyle(card).backgroundColor;
      backgrounds.push(`Card ${index}: ${bgColor}`);
    });
    
    return backgrounds;
  };
  
  // Test sequence
  console.log('Current theme:', getCurrentTheme());
  console.log('Current backgrounds:', checkAssetBackgrounds());
  
  console.log('Toggling theme...');
  toggleTheme();
  
  // Allow React to re-render
  setTimeout(() => {
    console.log('New theme:', getCurrentTheme());
    console.log('New backgrounds:', checkAssetBackgrounds());
    
    // Toggle back
    console.log('Toggling back...');
    toggleTheme();
    
    setTimeout(() => {
      console.log('Final theme:', getCurrentTheme());
      console.log('Final backgrounds:', checkAssetBackgrounds());
    }, 100);
  }, 100);
})();