module.exports = (grunt) ->
	# Package
	# =======
	pkg = require './package.json'

	modules = [
		'src/index.coffee'
		'src/util.coffee'
		'src/messages.coffee'
		'src/rules.coffee'
		'src/ruleset.coffee'
		'src/base.coffee'
		'src/plugins/rivets.coffee'
		'src/setup.coffee'
	]

	# Configuration
	# =============
	grunt.initConfig
		pkg: pkg
		coffee:
			compile:
				options:
					join: true
					expand: true
					bare: false
				files:
					'<%= pkg.distDirectory %>/<%= pkg.name %>-latest.js': modules
		uglify:
			coffee:
				files:
					'<%= pkg.distDirectory %>/<%= pkg.name %>-latest.js': '<%= pkg.distDirectory %>/<%= pkg.name %>-latest.js'
				options:
					mangle: false
					compress: false
					beautify: true
					preserveComments: 'some'
					banner: '''
					/*!
					 * Stonewall
					 * @author Paul Dufour
					 * @company Brit + Co
					 */
					 '''
		umd:
			coffee:
				src: '<%= pkg.distDirectory %>/<%= pkg.name %>-latest.js'
				dest: '<%= pkg.distDirectory %>/<%= pkg.name %>-latest.js'
				deps:
					default: ['_','Backbone','rivets']
					amd: ['underscore', 'backbone', 'rivets'],
					cjs: ['underscore', 'backbone', 'rivets'],
					global: ['_', 'Backbone', 'rivets'],
		watch:
			coffee:
				files: ['src/*.coffee', 'src/**/*.coffee']
				tasks: ['coffee:compile']

	# Dependencies
	# ============
	for name of pkg.devDependencies when name.substring(0, 6) is 'grunt-'
		grunt.loadNpmTasks name

	# Tasks
	# =====
	grunt.registerTask 'copy', ->
		done = this.async()
		fs = require('fs')
		src = "./#{pkg.distDirectory}/#{pkg.name}-latest.js"
		dest = "./#{pkg.distDirectory}/#{pkg.name}-#{pkg.version}.js"
		fs.createReadStream(src).pipe(ws = fs.createWriteStream(dest))

		ws.on "close", ->
			grunt.log.write("File \"#{dest}\" created.")
			done()

		return
	grunt.registerTask 'build', ->
		grunt.task.run 'coffee:compile', 'umd:coffee', 'uglify:coffee', 'copy'
