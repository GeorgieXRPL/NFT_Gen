/**
 * Quick Project Data Check
 * This script provides a quick way to check what's in the project data
 */
(function() {
  console.log("🔍 Quick Project Data Check ready!");
  
  // Quick function to check current project
  window.quickCheck = function() {
    console.log("🔍 QUICK PROJECT CHECK:");
    console.log("======================");
    
    if (!window.currentProject) {
      console.log("❌ No current project");
      return;
    }
    
    console.log(`Project: ${window.currentProject.name}`);
    console.log(`Layers: ${window.currentProject.traits ? window.currentProject.traits.length : 0}`);
    
    if (!window.currentProject.traits) {
      console.log("❌ No traits array");
      return;
    }
    
    let totalTraits = 0;
    let withImageData = 0;
    let withoutImageData = 0;
    
    for (const layer of window.currentProject.traits) {
      if (layer.traits) {
        for (const trait of layer.traits) {
          totalTraits++;
          if (trait.imageData) {
            withImageData++;
            console.log(`✅ ${layer.name} - ${trait.name}: HAS imageData (${trait.imageData.length} chars)`);
          } else {
            withoutImageData++;
            console.log(`❌ ${layer.name} - ${trait.name}: MISSING imageData`);
            
            // Check other properties
            if (trait.image) console.log(`   📷 Has image: ${trait.image.length} chars`);
            if (trait.imageSrc) console.log(`   🖼️ Has imageSrc: ${trait.imageSrc.length} chars`);
            if (trait.src) console.log(`   🔗 Has src: ${trait.src.length} chars`);
            if (trait.filePath) console.log(`   📂 Has filePath: ${trait.filePath}`);
            if (trait.fileName) console.log(`   📄 Has fileName: ${trait.fileName}`);
          }
        }
      }
    }
    
    console.log(`\n📊 SUMMARY:`);
    console.log(`Total traits: ${totalTraits}`);
    console.log(`✅ With imageData: ${withImageData}`);
    console.log(`❌ Without imageData: ${withoutImageData}`);
    console.log(`Coverage: ${totalTraits > 0 ? ((withImageData / totalTraits) * 100).toFixed(1) : 0}%`);
  };
  
  // Function to check what's in localStorage
  window.checkBackups = function() {
    console.log("🔍 CHECKING LOCALSTORAGE BACKUPS:");
    console.log("==================================");
    
    let backupCount = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('trait_backup_')) {
        backupCount++;
        const data = localStorage.getItem(key);
        if (data) {
          try {
            const backup = JSON.parse(data);
            console.log(`📦 ${backup.name || 'Unknown'}: ${data.length} chars`);
          } catch (e) {
            console.log(`📦 Invalid JSON: ${data.length} chars`);
          }
        }
      }
    }
    
    console.log(`\nTotal backups: ${backupCount}`);
  };
  
  console.log("Available functions:");
  console.log("  - window.quickCheck() - Check current project data");
  console.log("  - window.checkBackups() - Check localStorage backups");
})();
