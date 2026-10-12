// Minimalist Network Puzzle Engine: Organic Loose Hair Topology & Fast Intersection Engine

const LEVELS = [
    { level: 1, nodes: 6, ties: 1 },
    { level: 2, nodes: 10, ties: 2 },
    { level: 3, nodes: 16, ties: 3 },
    { level: 4, nodes: 26, ties: 5 },
    { level: 5, nodes: 42, ties: 8 },
    { level: 6, nodes: 65, ties: 12 },
    { level: 7, nodes: 95, ties: 18 },
    { level: 8, nodes: 130, ties: 24 },
    { level: 9, nodes: 165, ties: 30 },
    { level: 10, nodes: 200, ties: 38 }
];

function getLevelConfig(lvl) {
    if (lvl <= 10) {
        return LEVELS[lvl - 1];
    }
    // Procedural unlimited levels beyond 10
    const cycle = (lvl - 10) % 8;
    const baseNodes = [85, 120, 160, 200, 100, 140, 180, 220][cycle];
    const jitter = ((lvl * 37) % 21) - 10;
    const nodeCount = Math.max(50, Math.min(220, baseNodes + jitter));
    const ties = Math.max(8, Math.floor(nodeCount * 0.18));
    return { level: lvl, nodes: nodeCount, ties: ties };
}

const NODE_COLORS = [
    "#00e5ff", // Cyan
    "#00ff88", // Neon Emerald
    "#ffd700", // Yellow / Gold
    "#ff9100", // Warm Orange
    "#ff2a8d", // Magenta
    "#a855f7"  // Violet
];

function getNodeRadius(totalNodes) {
    if (totalNodes > 120) return 5;
    if (totalNodes > 60) return 7;
    if (totalNodes > 25) return 9;
    if (totalNodes > 12) return 12;
    return 14;
}

class PuzzleGraph {
    constructor(levelConfig) {
        this.config = levelConfig;
        this.nodes = [];
        this.edges = [];
        this.intersections = [];
        this.generateTopology();
        this.scramble();
    }

    // Creates an organic, flowing, multi-strand loose hair / vine bush structure
    // Mathematically guaranteed 0 crossings in solved state!
    generateTopology() {
        const count = this.config.nodes;
        const targetTies = this.config.ties;
        this.nodes = [];
        this.edges = [];

        // Number of flowing hair locks (2 to 5 strands)
        const numStrands = count <= 8 ? 2 : count <= 25 ? 3 : count <= 70 ? 4 : 5;
        
        // Dimensions of organic flowing hair cascade
        const heightSpan = Math.max(260, Math.min(480, 180 + Math.sqrt(count) * 20));
        const widthSpan = Math.max(200, Math.min(420, 140 + Math.sqrt(count) * 18));
        const strandSpacing = widthSpan / Math.max(1, numStrands - 1);

        // Distribute nodes evenly across strands
        const strandNodeLists = Array.from({ length: numStrands }, () => []);
        const nodesPerStrand = Math.floor(count / numStrands);
        const remainder = count % numStrands;

        let nodeIndex = 0;
        let edgeIndex = 0;

        for (let s = 0; s < numStrands; s++) {
            const countForStrand = nodesPerStrand + (s < remainder ? 1 : 0);
            const baseColX = -widthSpan / 2 + s * strandSpacing;
            const colColor = NODE_COLORS[s % NODE_COLORS.length];

            // Wave trajectory parameters for this strand of hair
            const waveFreq = 1.8 + (s % 2) * 0.5;
            const waveAmp = 20 + (s % 3) * 8;
            const phaseShift = s * 0.9;

            for (let i = 0; i < countForStrand && nodeIndex < count; i++) {
                const t = (i + 0.5) / countForStrand; // 0 to 1 along strand length
                const py = -heightSpan / 2 + t * heightSpan;
                // Sinuous wave ripple like loose hair tendrils
                const waveX = Math.sin(t * Math.PI * waveFreq + phaseShift) * waveAmp;
                const px = baseColX + waveX;

                const node = {
                    id: nodeIndex,
                    x: Math.round(px),
                    y: Math.round(py),
                    solvedX: Math.round(px),
                    solvedY: Math.round(py),
                    color: colColor,
                    size: getNodeRadius(count),
                    strandIdx: s,
                    rowIdx: i
                };

                this.nodes.push(node);
                strandNodeLists[s].push(node);

                // Spine edge connecting consecutive nodes along the hair strand
                if (i > 0) {
                    this.edges.push({
                        id: `e_${edgeIndex++}`,
                        from: strandNodeLists[s][i - 1].id,
                        to: node.id
                    });
                }

                nodeIndex++;
            }
        }

        // Add planar cross-ties (braiding) between adjacent strands (s and s + 1)
        // Cross-ties connect nodes at matching heights between adjacent strands
        // Non-overlapping ladder rungs guarantee 0 crossings in solved state
        let addedTies = 0;
        for (let s = 0; s < numStrands - 1 && addedTies < targetTies; s++) {
            const listA = strandNodeLists[s];
            const listB = strandNodeLists[s + 1];
            const maxPairs = Math.min(listA.length, listB.length);
            
            const step = Math.max(1, Math.floor(maxPairs / (Math.ceil(targetTies / (numStrands - 1)) + 1)));
            for (let idx = 1; idx < maxPairs && addedTies < targetTies; idx += step) {
                this.edges.push({
                    id: `e_${edgeIndex++}`,
                    from: listA[idx].id,
                    to: listB[idx].id
                });
                addedTies++;
            }
        }

        // Planar diagonal ties for additional difficulty without crossing
        for (let s = 0; s < numStrands - 1 && addedTies < targetTies; s++) {
            const listA = strandNodeLists[s];
            const listB = strandNodeLists[s + 1];
            const maxPairs = Math.min(listA.length, listB.length);
            for (let idx = 0; idx < maxPairs - 1 && addedTies < targetTies; idx++) {
                const u = listA[idx].id;
                const v = listB[idx + 1].id;
                const exists = this.edges.some(e => (e.from === u && e.to === v) || (e.from === v && e.to === u));
                if (!exists) {
                    this.edges.push({
                        id: `e_${edgeIndex++}`,
                        from: u,
                        to: v
                    });
                    addedTies++;
                }
            }
        }
    }

    scramble() {
        const count = this.nodes.length;
        const totalHeight = Math.max(240, Math.min(420, 180 + Math.sqrt(count) * 16));
        const totalWidth = Math.max(200, Math.min(360, 140 + Math.sqrt(count) * 14));

        const minCrossings = Math.max(2, Math.floor(count * 0.45));
        let bestCrossings = 0;
        let attempts = 0;

        while (bestCrossings < minCrossings && attempts < 25) {
            // Shuffle node order
            const shuffled = [...this.nodes];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }

            // Distribute tangled nodes along crossing sinuous strands
            const numLocks = count <= 12 ? 2 : count <= 35 ? 3 : 4;
            const testPositions = {};

            for (let i = 0; i < count; i++) {
                const node = shuffled[i];
                const lockIdx = i % numLocks;
                const progress = (Math.floor(i / numLocks) + 0.5) / Math.ceil(count / numLocks); // 0 to 1

                // Strands weave back and forth across center (generating rich crossings)
                const dirX = lockIdx % 2 === 0 ? 1 : -1;
                const baseY = (progress - 0.5) * totalHeight;
                const baseX = dirX * Math.sin(progress * Math.PI * 1.6) * (totalWidth * 0.42);
                
                // Organic wave ripples like loose curly hair / thready bush
                const waveX = Math.sin(progress * Math.PI * 3.5 + lockIdx * 1.5) * 20;
                const waveY = Math.cos(progress * Math.PI * 2.8 + lockIdx * 1.2) * 16;
                const jitter = (Math.random() - 0.5) * 20;

                const px = Math.round(baseX + waveX + jitter);
                const py = Math.round(baseY + waveY + jitter);

                node.x = px;
                node.y = py;
                testPositions[node.id] = { x: px, y: py };
            }

            const res = this.findIntersections(testPositions);
            bestCrossings = res.count;
            attempts++;
        }
    }

    // Ultra-fast intersection check with bounding-box pruning and spark capping
    findIntersections(positions) {
        this.intersections = [];
        const intersectingEdgeIds = new Set();
        const numEdges = this.edges.length;
        let count = 0;

        for (let i = 0; i < numEdges; i++) {
            const e1 = this.edges[i];
            const p1 = positions[e1.from];
            const p2 = positions[e1.to];
            if (!p1 || !p2) continue;

            const minX1 = p1.x < p2.x ? p1.x : p2.x;
            const maxX1 = p1.x > p2.x ? p1.x : p2.x;
            const minY1 = p1.y < p2.y ? p1.y : p2.y;
            const maxY1 = p1.y > p2.y ? p1.y : p2.y;

            for (let j = i + 1; j < numEdges; j++) {
                const e2 = this.edges[j];
                // Shared endpoint: cannot cross
                if (e1.from === e2.from || e1.from === e2.to || e1.to === e2.from || e1.to === e2.to) {
                    continue;
                }

                const p3 = positions[e2.from];
                const p4 = positions[e2.to];
                if (!p3 || !p4) continue;

                // Fast AABB check
                const minX2 = p3.x < p4.x ? p3.x : p4.x;
                if (maxX1 < minX2) continue;
                const maxX2 = p3.x > p4.x ? p3.x : p4.x;
                if (minX1 > maxX2) continue;

                const minY2 = p3.y < p4.y ? p3.y : p4.y;
                if (maxY1 < minY2) continue;
                const maxY2 = p3.y > p4.y ? p3.y : p4.y;
                if (minY1 > maxY2) continue;

                // Vector cross product orientation test
                const d1x = p2.x - p1.x;
                const d1y = p2.y - p1.y;
                const d2x = p4.x - p3.x;
                const d2y = p4.y - p3.y;
                const cross = d1x * d2y - d1y * d2x;
                if (cross === 0) continue;

                const dx = p3.x - p1.x;
                const dy = p3.y - p1.y;
                const t = (dx * d2y - dy * d2x) / cross;
                if (t <= 0.001 || t >= 0.999) continue;

                const u = (dx * d1y - dy * d1x) / cross;
                if (u <= 0.001 || u >= 0.999) continue;

                count++;
                intersectingEdgeIds.add(e1.id);
                intersectingEdgeIds.add(e2.id);

                // Cap spark point heap objects for silky 60fps rendering
                if (this.intersections.length < 90) {
                    this.intersections.push({
                        point: { x: p1.x + t * d1x, y: p1.y + t * d1y },
                        edge1: e1,
                        edge2: e2
                    });
                }
            }
        }

        return {
            count: count,
            intersectingEdgeIds: intersectingEdgeIds,
            intersections: this.intersections
        };
    }
}

if (typeof window !== 'undefined') {
    window.PuzzleGraph = PuzzleGraph;
    window.LEVELS = LEVELS;
    window.getLevelConfig = getLevelConfig;
}
if (typeof module !== 'undefined') {
    module.exports = { PuzzleGraph, LEVELS, getLevelConfig };
}
