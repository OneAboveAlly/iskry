@echo off
echo Starting page creation process... > pages-log.txt
npx tsc src/add-default-pages.ts --esModuleInterop --skipLibCheck --target ES2019 --module commonjs --outDir ./dist >> pages-log.txt 2>&1
node dist/add-default-pages.js >> pages-log.txt 2>&1
echo Completed. See pages-log.txt for details.
pause 