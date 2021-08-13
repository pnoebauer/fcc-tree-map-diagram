function wrap(text, width) {
	text.each(function () {
		var text = d3.select(this),
			words = text.text().split(/\s+/).reverse(),
			word,
			line = [],
			lineNumber = 0,
			lineHeight = 1.1, // ems
			x = text.attr('x'),
			y = text.attr('y'),
			dy = 0, //parseFloat(text.attr("dy")),
			tspan = text
				.text(null)
				.append('tspan')
				.attr('x', x)
				.attr('y', y)
				.attr('dy', dy + 'em');
		while ((word = words.pop())) {
			line.push(word);
			tspan.text(line.join(' '));
			if (tspan.node().getComputedTextLength() > width) {
				line.pop();
				tspan.text(line.join(' '));
				line = [word];
				tspan = text
					.append('tspan')
					.attr('x', x)
					.attr('y', y)
					.attr('dy', ++lineNumber * lineHeight + dy + 'em')
					.text(word);
			}
		}
	});
}

const w = 900;
const h = 440;

const padding = 20;

const svg = d3
	.select('.svg-container')
	.style('padding-bottom', `${((h - padding / 2) / w) * 100}%`)
	.append('svg')
	.attr('preserveAspectRatio', 'xMinYMid meet')
	.attr('viewBox', `0 0 ${w} ${h}`)
	.classed('svg-content', true)
	.style('background-color', '#fff');

const tooltip = d3
	.select('.svg-container')
	.append('div')
	.attr('id', 'tooltip')
	.style('opacity', 0);

const treemap = d3
	.treemap()
	.size([w - padding, h - padding * 6])
	.padding(2);

async function loadAndPlotData() {
	const res = await fetch(
		'https://cdn.freecodecamp.org/testable-projects-fcc/data/tree_map/video-game-sales-data.json'
	);

	const data = await res.json();

	const root = d3
		.hierarchy(data)
		.sum(d => d.value)
		.sort((a, b) => b.height - a.height || b.value - a.value);
	// console.log(root);

	// d3.treemap computes the position of each element of the hierarchy and transforms data
	// children(=Platforms): Xbox(type Array): children(=Game)
	treemap(root);
	// console.log(root);

	// root.leaves() - transforms data into array of each final child
	// contains: data(name, category, platform), parents(nodes of all parents), depth, start-end coordinates of x and y
	// console.log(root.leaves());

	const color = d3.scaleOrdinal().range(
		d3.schemeCategory10.map(function (c) {
			c = d3.rgb(c);
			c.opacity = 0.6;
			return c;
		})
	);

	svg
		.selectAll('rect')
		.data(root.leaves())
		.enter()
		.append('rect')
		.attr('x', d => d.x0)
		.attr('y', d => d.y0)
		.attr('width', d => d.x1 - d.x0)
		.attr('height', d => d.y1 - d.y0)
		.style('fill', d => color(d.data.category))
		.attr('class', 'tile')
		.attr('data-name', d => d.data.name)
		.attr('data-category', d => d.data.category)
		.attr('data-value', d => d.value)
		.on('mouseover', function (d, i) {
			// d3.select(this).style('r', 8);
			// console.log(d, i);
			tooltip.transition().duration(200).style('opacity', 0.9);
			tooltip
				.html(
					`Name: ${i.data.name}<br/>Category: ${i.data.category}<br/>Value: ${i.data.value}`
				)
				.style('text-align', 'center')
				.attr('data-value', i.data.value)
				// .style('left', d.pageX + 'px')
				.style('left', d.offsetX + 'px')
				.style('top', d.offsetY + 'px');
		})
		.on('mouseout', function (d, i) {
			// d3.select(this).style('fill', 'black');
			tooltip.transition().duration(500).style('opacity', 0);
		});

	svg
		.selectAll('text')
		.data(root.leaves())
		.enter()
		.append('text')
		.attr('x', d => d.x0 + 2)
		.attr('y', d => d.y0 + 10)
		.attr('font-size', 6)
		.text(d => d.data.name)
		.call(wrap, 35);

	// console.log(root.data.children);

	svg.append('g').attr('id', 'legend');

	const size = 13;
	const spacing = 3;
	const symbolsPerRow = 4;

	d3.select('#legend')
		.selectAll('rect')
		.data(root.data.children)
		.enter()
		.append('rect')
		.attr('x', (d, i) => padding * 2 + Math.floor(i / symbolsPerRow) * padding * 8)
		.attr('y', (d, i) => h - 5 * padding + (size + spacing) * (i % symbolsPerRow))
		.attr('width', size)
		.attr('height', size)
		.attr('class', 'legend-item')
		.style('fill', (d, i) => color(d.name));

	d3.select('#legend')
		.selectAll('text')
		.data(root.data.children)
		.enter()
		.append('text')
		.attr('x', (d, i) => padding * 2 + Math.floor(i / symbolsPerRow) * padding * 8 + 15)
		.attr(
			'y',
			(d, i) => h - 5 * padding + (size + spacing) * (i % symbolsPerRow) + (size - 2)
		)
		.style('font-size', size)
		.style('text-anchor', 'start')
		.text(d => d.name);
}

loadAndPlotData();
