// to customize dissonant path:
// change NUMGROUPS
// change NUMDOTS
// change P (transition matrix)

// change rotation method (initGroups function called at the bottom)

var width = 1000;
var height = 1000

var svg = d3.select("#viz")
	.attr("width", width)
	.attr("height", height)
	.style("display", "block")


var scaleX = d3.scaleLinear().domain([0, 1]).range([width*.1, width*.9])

var scaleY = d3.scaleLinear().domain([0, 1]).range([height*.1, height*.9])
    
const curve = d3.line().curve(d3.curveNatural);

var gif = new GIF({
	workers: 4,
	quality: 5
  });

gif.on('finished', function(blob) {
window.open(URL.createObjectURL(blob));
});
  

var currentForces = [];


var NUMGROUPS = 10;
var NUMDOTS = 100;

var groups = []

function initGroups(bias=0){
	groups = []
	for(let i = 0; i < NUMGROUPS; i++){
		let ind = 2*Math.PI/NUMGROUPS
		groups.push({x: 0.5+Math.cos(ind*i+bias)/4, y: 0.5+Math.sin(ind*i+bias)/4, ind: i})
	}
} 
initGroups();
// console.log(groups)

// var NUMGROUPS = 5;

// var P = [
// 	[0.1, 0.3, 0.2, 0.1, 0.3],
// 	[0.4, 0.1, 0.1, 0.1, 0.3],
// 	[0.2, 0.35, 0.15, 0.15, 0.15],
// 	[0.1, 0.05, 0.05, 0.7, 0.1],
// 	[0.5, 0.2, 0.1, 0.1, 0.1]
// ]

// var P = [
// 	[0, 1.0/3.0, 1.0/3.0, 1.0/3.0, 0],
// 	[1.0/3.0, 0, 1.0/3.0, 0, 1.0/3.0],
// 	[0.5, 0.5, 0, 0, 0],
// 	[0.5, 0, 0, 0, 0.5],
// 	[0, 0.5, 0, 0.5, 0]
// ]

// var P = [
// 	[0.8, 0.05, 0.05, 0.05, 0.05],
// 	[0.05, 0.8, 0.05, 0.05, 0.05],
// 	[0.05, 0.05, 0.8, 0.05, 0.05],
// 	[0.05, 0.05, 0.05, 0.8, 0.05],
// 	[0.05, 0.05, 0.05, 0.05, 0.8]
// ]

// var P = [
// 	[0.9, 0.1, 0, 0, 0],
// 	[0, 0.9, 0.1, 0, 0],
// 	[0, 0, 0.9, 0.1, 0],
// 	[0, 0, 0, 0.9, 0.1],
// 	[0, 0, 0, 0, 1],
// ]


var P = Array.from(new Array(NUMGROUPS), ()=> new Array(NUMGROUPS).fill(0))

P.forEach((arr, i)=> {
	// arr[i] = 0.9;
	// arr[(i+1)%NUMGROUPS] = 0.1;
	// arr[(NUMGROUPS+i-1)%NUMGROUPS] = 0.5
	// arr[(i+1)%NUMGROUPS] = 0.5
	arr[(i+2)%NUMGROUPS] = 0.9
	arr[(i+3)%NUMGROUPS] = 0.09
	arr[(i+4)%NUMGROUPS] = 0.01
})



let dots = Array.from(new Array(NUMDOTS), (x, i) => {
    let temp = {index: i, x: scaleX(0.5), y: scaleY(0.5)};
    return temp;
});

var circle;

var paths = Array.from(new Array(NUMDOTS), (x, i) => []);



function ticked() {
	circle
		.attr("cx", d => d.x)
		.attr("cy", d => d.y)

	for ( i = 0; i < dots.length; i++ ) {
		var dot = dots[i];
		dot.cx = dot.x;
		dot.cy = dot.y;
	}
}


function renderGraph(data) {
	circle = svg.selectAll(".viz-circle")
	.data(data)
	.join("circle")
	.attr("class", "viz-circle")
	.style("fill", function(d) { 
		return "black"; 
	})
	.attr("cx", function(d) { return scaleX(d.x)} )
	.attr("cy", function(d) { return scaleY(d.y)} )
	.attr("r", function(d) { return 4} )
}	

function generateForce(data, xcenter, ycenter){
	// console.log(data)
	let force = d3.forceSimulation(data)
	// .force("collide", d3.forceCollide(5).strength(1))
	  .force('forceX', d3.forceX(scaleX(xcenter)))
	  .force('forceY', d3.forceY(scaleY(ycenter)))
	.force("charge", d3.forceManyBody().strength(1))
	.alpha(0.5)
	currentForces.push(force)
	return force;

}

function generateCollidingForce(data){
	let collidingforce = d3.forceSimulation(dots).force("collide", d3.forceCollide(5).strength(1))
		.alpha(0.3)	
	collidingforce.stop()
	collidingforce.on("tick", ticked).restart()
}

renderGraph(dots);



function applyForces(states){
	currentForces.forEach(force => {
		force.stop();
	})
	currentForces = [];
	states.forEach((state, i) => {
		let force = generateForce(state, groups[i%NUMGROUPS].x, groups[i%NUMGROUPS].y)
		force.stop()
		force.on("tick", ticked)
		.restart()
	})
	generateCollidingForce();
}

function sampleP(startindex){
	let probs = P[startindex];
	let rv = Math.random();
	let tot = 0;
	for(let i = 0; i < NUMGROUPS; i++){
		tot += probs[i];
		if(tot > rv){
			return i;
		}
	}
	console.log("somethings going wrong")
}


let collidingforce = d3.forceSimulation(dots).force("collide", d3.forceCollide(5).strength(1))
	.force("charge", d3.forceManyBody().strength(1))
	.alpha(0.6)	
collidingforce.stop()
collidingforce.on("tick", ticked).restart()

// idea: set dots into initial starting distribution
// every second, go through each dot and move it into new distribution
    
let currstates = Array.from(new Array(NUMGROUPS), (x, i) => []);

// initial distribution
currstates[0] = dots
// console.log(currstates)
applyForces(currstates);

function updateStates(){
	let newstates = Array.from(new Array(NUMGROUPS), (x, i) => []);

	currstates.forEach((state,i) => {
		let startindex = i;
		state.forEach(dot => {
			let endindex = sampleP(startindex);
			newstates[endindex].push(dot)
		})
	})
	currstates = newstates;

	console.log("prob density: " + currstates.map(x => x.length*1.0/NUMDOTS))

}

var iteration = 0;
// let color = d3.interpolateViridis
let color = d3.schemeSet1


function drawImageGif(){

	const img = new Image();
	const serialized = new XMLSerializer().serializeToString(this.svg.node());
	const svg = new Blob([serialized], { type: 'image/svg+xml' });
	const url = URL.createObjectURL(svg);


	// Onload, callback to move on to next frame
	img.onload = function () {
		gif.addFrame(img, {
		delay: 1,
			copy: true
	});
	};

	img.src = url;
}


function drawTrails(){
	// filtered = paths.filter(path => Math.random() < 0.05);
	// filtered = [paths[0]]
	filtered = paths.slice(0, 5)
	// filtered = paths
	svg.selectAll(".trail")
	.data(filtered)
	.join("path")
	.attr("class", "trail")
	// .style("stroke", (d,i) => color(iteration/50.0))
	.style("stroke", (d,i) => color[i])
	.style("stroke-width", 3)
	.style("stroke-linecap", "round")
	// .style("stroke-dasharray", (50-iteration)+","+(50-iteration))
	// .style("opacity", 0.2)
	.attr("stroke-opacity", 0.6)
	.attr("filter", "url(#glow)")
	.style("fill", "none")
	.attr("d", datum=>{return curve(datum)})

	iteration += 1;

	drawImageGif();

}

let runtrails;
// dont start paths until its in the first spot
setTimeout( () =>
{
	runtrails = setInterval(() => {
		dots.forEach((dot, i)=> {
			paths[i].push([dot.x, dot.y])
		})
		drawTrails();
	}, 199)}
, 1000);

// rotate over time
var bias = 0;
setInterval(() => {
	initGroups(Math.PI/30*bias)
	bias+=1;
	// console.log(groups)
	// console.log(bias)
}, 2000)

let first = true;

// each step in stochastic process
let run = setInterval(() => {
	if(!first){
		drawTrails();
	}
	first = false;
	updateStates();
	applyForces(currstates);
}, 2000)

// stop iterating and download gif
setTimeout(() => {
	console.log(gif)
	clearInterval(run);
	clearInterval(runtrails)
	gif.render()
}, 90000)