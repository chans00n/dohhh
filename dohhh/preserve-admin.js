#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Function to copy directory recursively
function copyDir(src, dest) {
  // Create destination directory if it doesn't exist
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  // Read source directory
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log('Preserving admin build...');

const sourcePath = path.join(process.cwd(), '.medusa/server/public/admin');
const backupPath = path.join(process.cwd(), 'admin-backup');

if (fs.existsSync(sourcePath)) {
  console.log('✅ Admin build found at:', sourcePath);
  
  // Create backup
  copyDir(sourcePath, backupPath);
  console.log('✅ Admin build backed up to:', backupPath);
  
  // Also copy to public directory if it exists
  const publicPath = path.join(process.cwd(), 'public/admin');
  if (!fs.existsSync(path.dirname(publicPath))) {
    fs.mkdirSync(path.dirname(publicPath), { recursive: true });
  }
  copyDir(sourcePath, publicPath);
  console.log('✅ Admin build copied to public directory');
} else {
  console.log('❌ Admin build not found at:', sourcePath);
  
  // Check if backup exists
  if (fs.existsSync(backupPath)) {
    console.log('✅ Using admin backup from:', backupPath);
    
    // Restore from backup
    const targetPath = path.join(process.cwd(), '.medusa/server/public/admin');
    if (!fs.existsSync(path.dirname(targetPath))) {
      fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    }
    copyDir(backupPath, targetPath);
    console.log('✅ Admin build restored from backup');
  }
}

console.log('Admin preservation complete');