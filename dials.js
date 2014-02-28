// Start Wrapper
var $RN = (function(){
	var self, options, drag = 0, hits = [], context = [], collection = {}, values = {}; // Initiate some wrapper wide globals

	var defaults = {
		dials  : 1, // how many dials do we want
		stroke : 40, // Width of a stroke
		step   : 10, // step to be applied
		placeholder : undefined, // canvas el,
		board : 'board', // Id that holds stats
		arcBG  : '#000', // arc background
		dialBG : ['#fff'],  // dial background,
		gradient : false, // You may use gradient - tough just for fun predefined
		gradientBG : {
			start : '#E18526',
			end   : '#ED9425'
		},
		sizes  : {
			w : 500, // canvas width
			h : 500 // canvas height
		},
		range : {
			max : 100 // max value
		},
		coords : {
			start : 0 // start at 0
		},
		radius : 250, // default radius
	};

	// Extends default options with options
	// passed into the constructor function by the user
	function _extendDefaults(obj1, obj2) {
		for(var attr in obj2) {
			obj1[attr] = obj2[attr];
		}

		return obj1;
	}

	// Super simple return value set in the hidden field
	function _returnAge(e) {
		el = _whoAmI(e);

		var age = document.getElementById(el.getAttribute('data-field')).value;

		alert('Age is set to ' + age);
	}

	// Return context to work with
	function _getContext(num) {
		return context[num];
	}

	// Return radians from degrees
	function _getRadians(degrees) {
		return (Math.PI/180) * degrees;
	}

	// Return degrees from radians
	function _getDegrees(radians) {
		var degrees = radians * 180/Math.PI + 90; // Adding 90 degrees to compensate start point at the top instead far right			
 
		if(degrees < 0) {
			degrees = 360 + degrees;
		} else {
			degrees = degrees;
		}

		degrees = (degrees > 359) ? 0 : degrees;

		return parseInt(degrees);
	}

	// Super simple hit test
	function _hitTest(e, radius, dial) {
		var cx = options.sizes.w/2 - e.pageX;
		var cy = options.sizes.h/2 - e.pageY;
		var radius = radius + options.stroke/2;

		test = (Math.pow(cx, 2) + Math.pow(cy, 2)) < Math.pow(radius, 2);

		// Collect hits
		hits[dial] = test;

		return test;
	};

	// Return hit, dial number so we know what we working with
	function _dialHit() {		
		for(var i = 0, len = hits.length; i < len; i++) {
			if(hits[i] == true) {
				return i;
			}
		}
	}

	// Listener 
	// Update dials when dragging
	function updateDial(e) {
		el 			= _whoAmI(e);		
		var rads    = Math.atan2(e.pageY - options.sizes.h/2, e.pageX - options.sizes.w/2);
		var context = _getContext(el.getAttribute('data-context')); // Get correct context to work with		
		var degrees = _getDegrees(rads)

		options.coords.start = degrees; // Override current setting

		// Set hit test for n dials
		for(var i = 0; i < options.dials; i ++) {
			_hitTest(e, collection[i].radius, i);
		}		

		// Number of dial hit
		var dial = _dialHit();		
		if(typeof dial != 'undefined') {
			 collection[dial].angle = degrees; // Update to current value

			_dialer(dial);
			_setAge(_normalize(dial, degrees), dial);
		}
	}

	// Set age
	function _setAge(age, dial) {
		var snaps  = _returnSnaps();
		var bucket = Math.round(age/options.step);
		var field  = document.getElementById('dial_' + dial + '_value');		
		age 	   = snaps[bucket];

		// Update hidden values
		field.setAttribute('value', age);

		var el = document.getElementById('d_' + dial);
			el.innerHTML = age;
			el.appendChild(canvas.buttons[dial]);

		_updateTotalAge(age, dial); // Show totals in center
	}

	// Just for fun lets show total age in the middle of radius
	// Draw it with canvas just to show full canvas demo
	function _updateTotalAge(age, dial) {
		var size   = options.radius * 0.4; // Text size	
		var stats  = options.board.childNodes;
		var totals = 0;

		for(var i = 0, len = stats.length; i < len; i ++) {			
			stats[i].setAttribute('style', 'color:' + collection[i].BG);
			totals += parseInt(stats[i].innerHTML);
		}

		title = document.getElementsByTagName('title');		
		title[0].innerHTML = 'Total ' + totals;

		context = _returnContext(canvas);
		context.fillStyle = "#2f2f2f";
		context.font 	  = "bold " + size + "px 'Chango'"; // Google font to make it look a bit nicer
		textW = context.measureText(totals).width;
		context.fillText(totals, options.sizes.w/2 - textW/2, options.sizes.h/2 + options.sizes.h * 0.02);
	}

	// Return context to work with
	function _returnContext(canvas) {
		return canvas.canvas.getContext('2d');
	}

	// Clear current stage and redraw with new dials
	// Could omit function but due to mind clarity for me its here
	function _dialer(dial) {
		collection[dial].context.clearRect(0, 0, options.sizes.w, options.sizes.h); // Clear stage

		_setStage(collection[dial].context, true);
	}

	// Return snaps based on steps
	function _returnSnaps() {
		var size, chunks = [options.range.max];
		
		size  = options.range.max / options.step;		

		for(var i = 1; i <= size; i++) {
			chunks.push( Math.round( (options.range.max - options.step * i) ) );
		}

		return chunks.reverse(); // Reverse order so we start at 0
	}

	// Return normalized angle against 360 degrees
	function _normalize(dial, angle) {
		var age;

		if(parseInt(options.range.max) > 359) {
			age 	= angle * (parseInt(options.range.max) / 360);
		} else {
			age 	= angle / (360 / parseInt(options.range.max));
		}

		return Math.ceil(age);
	}

	// Compensate browsers
	function _whoAmI(el) {
		var iam;

		if(typeof el.toElement == 'undefined') {
			iam = el.currentTarget;
		} else {
			iam = el.toElement;
		}

		return iam;
	}

	// If we have multiple dials and only base color
	// or a color is not set for n - dial; let's create a random color
	function _setColor(dial) {		
		var BG;

		if(typeof options.dialBG[dial] == 'undefined') {
			// Change shade
			base = options.dialBG[0]; // Take base color

			// Could run through loop but to keep it more harmonic
			// we change just a bit		
			BG 	 = _replaceAtIndex(base, 3);
			BG 	 = _replaceAtIndex(BG, 4);
			BG   = _replaceAtIndex(BG, 5);
			BG   = _replaceAtIndex(BG, 1);
		} else {
			BG   = options.dialBG[dial];
		}

		return BG;		
	}

	// Simple replace function
	function _replaceAtIndex(haystack, index) {
		return haystack.substr(0, index) + Math.ceil(Math.random()*9) + haystack.substr(index + 1);
	}


	// Very loose placeholder setup
	// In production this would be more robust
	function _setPlaceholder(el) {
		if(el.indexOf('#') >= 0) {
			el = el.replace('#', ''); // Remove selector
			b  = document.getElementsByTagName('body');
			b  = b[0];

			canvas = _createCanvas(); // Get canvas

			options.placeholder = document.getElementById(el);
			options.placeholder.appendChild(canvas.canvas);
			options.placeholder.appendChild(canvas.board);

			options.board = document.getElementById(options.board);

			// Append elements
			for(var i = 0, len = canvas.fields.length; i < len; i++) {
				options.placeholder.appendChild(canvas.fields[i]);
				options.board.appendChild(canvas.stats[i]);


				// Append func to button
				canvas.buttons[i].addEventListener("click", _returnAge, false);
			}			

			context[0] = _returnContext(canvas);

			// Add event listener
			//canvas.canvas.addEventListener('click', updateDial, false);
			canvas.canvas.addEventListener('click', updateDial, false);
				
			// 
			canvas.canvas.addEventListener('mousedown', function(e){				
				drag = 1;
				e.preventDefault();
				b.style.cursor = 'move';
			}, false);

			canvas.canvas.addEventListener('mousemove', function(e){
				if(drag === 1) {
					updateDial(e);
				}
			}, false);

			canvas.canvas.addEventListener('mouseup', function(){
				drag = 0;
				b.style.cursor = 'auto';
			}, false);

			// MOBILE EVENTS
			canvas.canvas.addEventListener('touchstart', function(e){				
				drag = 1;
				e.preventDefault();
			}, false);

			canvas.canvas.addEventListener('touchmove', function(e){			
				if(drag === 1) {
					updateDial(e);
				}
			}, false);

			canvas.canvas.addEventListener('touchend', function(){
				drag = 0;
			}, false);

			// Lets do some drawing
			_setStage(context[0]);
		} else {
			/*
				COULD USE WITH CLASSES AS WELL
				WOULD USE GETELEMENTSBYCLASS AND RUN IN A LOOP
				TO APPEND UNIQUE CANVAS TO EACH CLASS ELEMENT SO THEY
				COULD OPERATE AS A UNIQUE ENTITY
			*/
		}
	}

	// Let'd do a bit of redrawing
	function _setStage(context, skip) {
		var degrees;		

		_setColor(1);
		context.clearRect(0, 0, options.sizes.w, options.sizes.h);

		if(typeof skip == 'undefined') skip = false;		

		for(var i = 0; i < options.dials; i++) {
			if(skip != true) {				
				if(collection[0] != 'undefined') {
					if(collection[0] == undefined) {								
						collection[i] = { dial : 'dial_' + i, radius : options.radius, angle : options.coords.start, context : context, BG : _setColor(i) }; // Add current radius
					} else {				
						collection[i] = { dial : 'dial_' + i, radius : collection[i - 1].radius + collection[0].radius/2, angle : options.coords.start, context : context, BG : _setColor(i) };
					}
				}
			}

			// Arc
			context.beginPath();
			context.strokeStyle = options.arcBG;
			context.lineWidth = options.stroke;
			context.arc(options.sizes.w/2, options.sizes.h/2, collection[i].radius, 0, Math.PI*2, false);
			context.shadowOffsetX = 0;
			context.shadowOffsetY = 0;
			context.shadowBlur = 5;
			context.shadowColor = '#656565';
			context.stroke();

			// Dial
			context.beginPath();

			// Handle gradient
			if(options.gradient === true) {
				gradient = context.createLinearGradient(0, 0, options.sizes.w, options.sizes.h);	      
				gradient.addColorStop(0, '#E18526');
				gradient.addColorStop(1, '#ED9425');
				context.strokeStyle = gradient; // Add gradient	
			} else {
				context.strokeStyle = collection[i].BG;
			}

			startAngle = (collection[i].angle) ? collection[i].angle : options.coords.start;
			degrees    = _getRadians(startAngle);

			context.lineWidth = options.stroke;
			context.arc(options.sizes.w/2, options.sizes.h/2, collection[i].radius, 0 - 90 * Math.PI / 180, degrees - 90 * Math.PI / 180, false);
			context.stroke();
		}
	}

	// Prepare canvas element and wrap it inside passed element
	// Then assing context
	function _createCanvas(num) {
		var fields = [],  buttons = [], stats = [];

		num = ( ! num ) ? 0 : num;

		// Create elements
		canvas 		  = document.createElement('canvas');		
		canvas.width  = options.sizes.w;
		canvas.height = options.sizes.h;

		canvas.setAttribute('id', 'canvas_' + num);
		canvas.setAttribute('data-value', 0);
		canvas.setAttribute('data-context', num);

		board = document.createElement('div');
		board.setAttribute('id', 'board');
		board.setAttribute('style', 'width: ' + options.sizes.w / 2 + 'px; height: ' + options.sizes.h + 'px; overflow: hidden; display: block;');

		for(var i = 0; i < options.dials; i++) {
			field  = document.createElement('input');			
			field.setAttribute('type', 'hidden');
			field.setAttribute('id', 'dial_' + i + '_value');
			field.setAttribute('value', 0);

			button = document.createElement('input');
			button.setAttribute('type', 'button');
			button.setAttribute('class', 'get_age');
			button.setAttribute('value', '?');
			button.setAttribute('data-field', 'dial_' + i + '_value');

			stat  = document.createElement('div');			
			stat.setAttribute('id', 'd_' + i);			
			stat.innerHTML = 0; // Init to 0		

			fields.push(field);
			buttons.push(button);
			stats.push(stat);
		}		

		return {canvas : canvas, fields : fields, buttons : buttons, board : board, stats : stats};
	}

	return {
		self : this, // Holds this obj reference,		
		init : function(el, attrs) { // Take element and options that will extend defaults
			options = _extendDefaults(defaults, attrs);

			_setPlaceholder(el); // Define canvases and context

			// Hide URL bar on ios
			addEventListener("load", function() { setTimeout(hideURLbar, 0); }, false);
				function hideURLbar(){
					window.scrollTo(0,1);
				}
		}
	}
}());