// Expo and Millennium Line adjacency list
export const stationCoords = {
	"Waterfront": [49.2856, -123.1119],
	"Burrard": [49.2853, -123.1207],
	"Granville": [49.2832, -123.1163],
	"Stadium-Chinatown": [49.2801, -123.1107],
	"Main Street-Science World": [49.2731, -123.1007],
	"Commercial-Broadway": [49.2628, -123.0694],
	"Nanaimo": [49.2483, -123.0559],
	"29th Avenue": [49.2442, -123.0456],
	"Joyce-Collingwood": [49.2383, -123.0316],
	"Patterson": [49.2332, -123.0126],
	"Metrotown": [49.2258, -123.0039],
	"Royal Oak": [49.2201, -122.9883],
	"Edmonds": [49.2123, -122.9598],
	"22nd Street": [49.2001, -122.9486],
	"New Westminster": [49.2016, -122.9127],
	"Columbia": [49.2048, -122.9068],
	"Scott Road": [49.2042, -122.8742],
	"Gateway": [49.1991, -122.8509],
	"Surrey Central": [49.1897, -122.8470],
	"King George": [49.1828, -122.8446],
	// Millennium Line
	"VCC-Clark": [49.2658, -123.0787],
	"Renfrew": [49.2581, -123.0456],
	"Rupert": [49.2606, -123.0326],
	"Gilmore": [49.2651, -123.0137],
	"Brentwood Town Centre": [49.2664, -123.0012],
	"Holdom": [49.2648, -122.9822],
	"Sperling - Burnaby Lake": [49.2646, -122.9637],
	"Lake City Way": [49.2547, -122.9392],
	"Production Way - University": [49.2530, -122.9187],
	"Lougheed Town Centre": [49.2483, -122.8962],
	"Braid": [49.2202, -122.8895],
	"Sapperton": [49.2240, -122.8896],
	"Burquitlam": [49.2610, -122.8894],
	"Moody Centre": [49.2781, -122.8466],
	"Inlet Centre": [49.2771, -122.8276],
	"Coquitlam Central": [49.2731, -122.8006],
	"Lincoln": [49.2800, -122.7937],
	"Lafarge Lake-Douglas": [49.2856, -122.7911],
};

export const skytrainGraph = {
	"Waterfront": ["Burrard", "Granville"],
	"Burrard": ["Waterfront", "Granville"],
	"Granville": ["Burrard", "Waterfront", "Stadium-Chinatown"],
	"Stadium-Chinatown": ["Granville", "Main Street-Science World"],
	"Main Street-Science World": ["Stadium-Chinatown", "Commercial-Broadway"],
	"Commercial-Broadway": ["Main Street-Science World", "Renfrew", "Nanaimo", "VCC-Clark"],
	"Nanaimo": ["Commercial-Broadway", "29th Avenue"],
	"29th Avenue": ["Nanaimo", "Joyce-Collingwood"],
	"Joyce-Collingwood": ["29th Avenue", "Patterson"],
	"Patterson": ["Joyce-Collingwood", "Metrotown"],
	"Metrotown": ["Patterson", "Royal Oak"],
	"Royal Oak": ["Metrotown", "Edmonds"],
	"Edmonds": ["Royal Oak", "22nd Street"],
	"22nd Street": ["Edmonds", "New Westminster"],
	"New Westminster": ["22nd Street", "Columbia"],
	"Columbia": ["New Westminster", "Sapperton", "Scott Road"],
	"Scott Road": ["Columbia", "Gateway"],
	"Gateway": ["Scott Road", "Surrey Central"],
	"Surrey Central": ["Gateway", "King George"],
	"King George": ["Surrey Central"],
	// Millennium Line
	"VCC-Clark": ["Commercial-Broadway"],
	"Renfrew": ["Commercial-Broadway", "Rupert"],
	"Rupert": ["Renfrew", "Gilmore"],
	"Gilmore": ["Rupert", "Brentwood Town Centre"],
	"Brentwood Town Centre": ["Gilmore", "Holdom"],
	"Holdom": ["Brentwood Town Centre", "Sperling - Burnaby Lake"],
	"Sperling - Burnaby Lake": ["Holdom", "Lake City Way"],
	"Lake City Way": ["Sperling - Burnaby Lake", "Production Way - University"],
	"Production Way - University": ["Lake City Way", "Lougheed Town Centre"],
	"Lougheed Town Centre": ["Production Way - University", "Braid", "Burquitlam"],
	"Braid": ["Lougheed Town Centre", "Sapperton"],
	"Sapperton": ["Braid", "Columbia"],
	"Burquitlam": ["Lougheed Town Centre", "Moody Centre"],
	"Moody Centre": ["Burquitlam", "Inlet Centre"],
	"Inlet Centre": ["Moody Centre", "Coquitlam Central"],
	"Coquitlam Central": ["Inlet Centre", "Lincoln"],
	"Lincoln": ["Coquitlam Central", "Lafarge Lake-Douglas"],
	"Lafarge Lake-Douglas": ["Lincoln"]
};

// BFS function to find shortest path (returns { hops, path })
export function bfsShortestPath(graph, start, end) {
	if (start === end) return { hops: 0, path: [start] };
	const queue = [[start, [start]]];
	const visited = new Set([start]);
	while (queue.length > 0) {
		const [station, path] = queue.shift();
		for (const neighbor of (graph[station] || [])) {
			if (!visited.has(neighbor)) {
				if (neighbor === end) {
					return { hops: path.length, path: [...path, neighbor] };
				}
				visited.add(neighbor);
				queue.push([neighbor, [...path, neighbor]]);
			}
		}
	}
	return { hops: -1, path: [] }; // No path found
}

// Example usage:
// const numStations = bfsShortestPath(skytrainGraph, "Waterfront", "Lougheed Town Centre");
// console.log(numStations); // Outputs the number of stations between the two
