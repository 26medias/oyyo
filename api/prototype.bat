@echo off
nodemon ./main.js -port 5000 -online false -timeout 120000 -threads 1 -debug_mode true -db pagevampproto -mongo_remote false -monitor true
pause