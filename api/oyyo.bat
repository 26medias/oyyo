@echo off
nodemon ./main.js -port 5000 -online false -timeout 120000 -threads 1 -debug_mode true -db oyyo -mongo_remote false -monitor true -appid 697389570334100 -appsecret 9fc06da2bc669673d767b80a03f19abf
pause