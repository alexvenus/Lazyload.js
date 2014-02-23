/*global module:false*/
module.exports = function (grunt) {

    // Project configuration
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        meta: {
            banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
                    '<%= grunt.template.today("yyyy-mm-dd") %> - ' +
                    '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
                    '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
                    ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */'
        },
        concat: {
            dist: {
                src: ['__src/rsvp.js', '__src/basket.js', '__src/<%= pkg.name %>'],
                dest: 'lib/<%= pkg.namelower %>-<%= pkg.version %>.js'
            }
        },
        min: {
            dist: {
                src: ['<banner:meta.banner>', '<config:concat.dist.dest>'],
                dest: 'lib/<%= pkg.namelower %>-<%= pkg.version %>.min.js'
            }
        },
        uglify: {
            options: {
                banner: '<%= meta.banner %>',
                mangle: {
                    except: ['Lazyload', 'Core', 'Hash', 'Parse', 'Pipe', 'basket', 'rsvp']
                }
            },
            dist: {
                files: {
                    'lib/<%= pkg.namelower %>-<%= pkg.version %>.min.js': ['<%= concat.dist.dest %>']
                }
            },
            target: {
                files: {
                    'lib/<%= pkg.namelower %>-<%= pkg.version %>.min.js': ['lib/<%= pkg.namelower %>-<%= pkg.version %>.js']
                }
            }
        },
        qunit: {
            all: ['__test/*.html'],
            development: ['__test/development-test.html'],
            distribution: ['__test/distribution-test.html']
        },
        lint: {
            files: [
                'Gruntfile.js',
                '__test/view/**/*.js',
                'src/<%= pkg.name %>'
            ]
        },
        watch: {
            files: '<config:lint.files>',
            tasks: 'lint qunit'
        },
        jshint: {
            beforeconcat: ['__src/<%= pkg.name %>'],
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
                Lazyload: false,
                ActiveXObject: false
            }
        },
        jsdoc : {
            dist : {
                src: ['__test/*.js'],
                options: {
                    destination: '__doc'
                }
            }
        }
    });

    // new 0.4.x plugin style
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-nodeunit');
    grunt.loadNpmTasks('grunt-jsdoc');

    // Testing -> Only tests
    grunt.registerTask('test', ['qunit:development']);

    // Documentation -> Only documentation
    grunt.registerTask('doc', ['jsdoc']);

    // Build -> Everything
    grunt.registerTask('build', [
            'jshint:beforeconcat',
            'qunit:development',
            'concat',
            'uglify',
            'qunit:distribution',
            'jsdoc'
        ]
    );

    // TRAVIS -> This is wwhat Travis-Ci should do
    grunt.registerTask('travis', ['test']);

    // DEFAULT -> for all those who don't know what to do.
    grunt.registerTask('default', ['build']);
};
