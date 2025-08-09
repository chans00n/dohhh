#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('=== Checking Medusa Build Output ===\n');

// Check various possible locations for the admin build
const possiblePaths = [
  '.medusa/server/public/admin',
  '.medusa/server/public/admin/index.html',
  '.medusa/admin',
  'build/admin',
  'dist/admin'
];

console.log('Current working directory:', process.cwd());
console.log('\nChecking for admin build in possible locations:\n');

possiblePaths.forEach(p => {
  const fullPath = path.join(process.cwd(), p);
  try {
    const exists = fs.existsSync(fullPath);
    const stats = exists ? fs.statSync(fullPath) : null;
    
    if (exists) {
      console.log(`✅ ${p}`);
      if (stats.isDirectory()) {
        const files = fs.readdirSync(fullPath);
        console.log(`   Contains ${files.length} items`);
        if (files.includes('index.html')) {
          console.log('   ✅ index.html found!');
        }
      }
    } else {
      console.log(`❌ ${p} - not found`);
    }
  } catch (error) {
    console.log(`❌ ${p} - error: ${error.message}`);
  }
});

// Check .medusa directory structure
console.log('\n=== .medusa Directory Structure ===\n');
const medusaPath = path.join(process.cwd(), '.medusa');
if (fs.existsSync(medusaPath)) {
  function printTree(dir, prefix = '') {
    const items = fs.readdirSync(dir);
    items.forEach((item, index) => {
      const itemPath = path.join(dir, item);
      const isLast = index === items.length - 1;
      const stats = fs.statSync(itemPath);
      
      console.log(prefix + (isLast ? '└── ' : '├── ') + item + (stats.isDirectory() ? '/' : ''));
      
      if (stats.isDirectory() && item !== 'node_modules' && prefix.length < 12) {
        printTree(itemPath, prefix + (isLast ? '    ' : '│   '));
      }
    });
  }
  
  printTree(medusaPath);
} else {
  console.log('.medusa directory does not exist');
}

console.log('\n================================\n');