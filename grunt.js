/*global module:false*/
module.exports = function (grunt) {

    // Project configuration
    grunt.initConfig({
        pkg: '<json:Lazyload.js.json>',
        meta: {
            banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
                    '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
                    '<%= pkg.homepage ? "* " + pkg.homepage + "\n" : "" %>' +
                    '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
                    ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */'
        },
        concat: {
            dist: {
                src: ['__src/<%= pkg.name %>.js'],
                dest: 'lib/<%= pkg.namelower %>-<%= pkg.version %>.js'
            }
        },
        min: {
            dist: {
                src: ['<banner:meta.banner>', '<config:concat.dist.dest>'],
                dest: 'lib/<%= pkg.namelower %>-<%= pkg.version %>.min.js'
            }
        },
        qunit: {
            files: ['__test/index.html']
        },
        lint: {
            files: ['grunt.js', '__test/view/**/*.js', '__src/Lazyload.js']
        },
        watch: {
            files: '<config:lint.files>',
            tasks: 'lint qunit'
        },
        jshint: {
            options: {
                camelcase: true,
                scripturl: true,
                bitwise: true,
                curly: true,
                eqeqeq: true,
                immed: true,
                latedef: true,
                newcap: true,
                noarg: true,
                sub: true,
                undef: true,
                boss: true,
                eqnull: true,
                browser: true,
                plusplus: false,
                nomen: false,
                evil: true,
                indent: 4,
                maxlen: 120
            },
            globals: {
                browser: true,
                Lazyload: true,
                window: true,
                document: true,
                ActiveXObject: true
            }
        }
    });

    // Default task. -> uglify?
    grunt.registerTask('default', 'lint qunit concat min');
};
