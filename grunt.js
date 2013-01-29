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
            build: {
                src: ['__src/<%= pkg.name %>.js'],
                dest: 'lib/<%= pkg.namelower %>-<%= pkg.version %>.js'
            }
        },
        min: {
            build: {
                src: ['<banner:meta.banner>', '<config:concat.build.dest>'],
                dest: 'lib/<%= pkg.namelower %>-<%= pkg.version %>.min.js'
            }
        },  
        uglify : {
            mangle: {
                except: ['Lazyload', 'Core', 'Hash', 'Parse', 'Pipe']
            }
        },
        qunit: {
            files: ['__test/index.html']
        },
        lint: {
            files: [
                'grunt.js',
                '__test/view/**/*.js',
                '__src/*.js'
            ]
        },
        watch: {
            files: '<config:lint.files>',
            tasks: 'lint'
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
                Lazyload: true,
                ActiveXObject: true
            }
        }
    });

    // Task for travis
    grunt.registerTask('travis', 'qunit');

    // Build
    grunt.loadNpmTasks('grunt-contrib');
    grunt.registerTask('build', 'lint concat min');
    grunt.registerTask('default', 'build');
};
