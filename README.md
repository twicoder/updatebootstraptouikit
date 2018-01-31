# ocsp

This project is generated with [yo angular generator](https://github.com/yeoman/generator-angular)
version 0.15.1.

## Build & development

Run `gulp` for building and `gulp serve` for preview.

Mysql dump file is dump.sql in root directory.

Run `npm install` and `bower install` for install packages for development.

Run `sequelize-auto -h 127.0.0.1 -d ocsp -u root -x 123 -p 3306 ---dialect mysql -o "./server/models/"` to generate sequelize models for orm msyql database.

It supported maven build, run maven install to download node and bower packages. Change server/config.js point out your local environment.

## Storm support
In order to support storm engine, you need add following option in web/server/config.js file
storm_engine_supported: true,