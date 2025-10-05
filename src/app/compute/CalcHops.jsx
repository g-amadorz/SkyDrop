// Expo and Millennium Line adjacency list
const skytrainGraph = {
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

// BFS function to find shortest path (number of stations)
export function bfsShortestPath(graph, start, end) {
	const queue = [[start, 0]];
	const visited = new Set([start]);
	while (queue.length > 0) {
		const [station, depth] = queue.shift();
		if (station === end) return depth;
		for (const neighbor of (graph[station] || [])) {
			if (!visited.has(neighbor)) {
				visited.add(neighbor);
				queue.push([neighbor, depth + 1]);
			}
		}
	}
	return -1; // No path found
}

// Example usage:
// const numStations = bfsShortestPath(skytrainGraph, "Waterfront", "Lougheed Town Centre");
// console.log(numStations); // Outputs the number of stations between the two
