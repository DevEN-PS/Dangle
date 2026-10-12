// GridUntangle: Pure Rubbery Network Engine (matching network_interactive.py)

class MinimalGameEngine {
    constructor() {
        this.container = document.getElementById('networkContainer');
        this.network = null;
        this.nodesDataSet = null;
        this.edgesDataSet = null;
        this.graph = null;

        this.currentLevelIndex = 0;
        this.startTime = null;
        this.timerInterval = null;
        this.animFrameId = null;
        this.isVictory = false;

        // High-performance caching & state
        this.currentIntersectingEdgeIds = new Set();
        this.pendingIntersectionCheck = false;
        this.activeDragId = null;
        this.moves = 0;
        this.intersections = [];
        this.sparks = [];

        this.initDOM();
        this.bindEvents();
        this.loadLevel(0);
        this.checkFirstVisitHelp();
    }

    initDOM() {
        this.dom = {
            timer: document.getElementById('timerText'),
            levelText: document.getElementById('levelText'),
            btnHelp: document.getElementById('btnHelp'),
            btnHint: document.getElementById('btnSparkHint'),
            btnReset: document.getElementById('btnReset'),
            helpModal: document.getElementById('helpModal'),
            btnCloseHelp: document.getElementById('btnCloseHelp'),
            victoryModal: document.getElementById('victoryModal'),
            victoryLevel: document.getElementById('victoryLevel'),
            victoryTime: document.getElementById('victoryTime'),
            btnNextLevel: document.getElementById('btnNextLevel')
        };
    }

    bindEvents() {
        window.addEventListener('resize', () => {
            if (this.network) {
                this.network.fit({ animation: false });
            }
        });

        this.dom.btnHelp.addEventListener('click', () => {
            this.openHelpModal();
        });

        this.dom.btnCloseHelp.addEventListener('click', () => {
            this.closeHelpModal();
        });

        this.dom.btnHint.addEventListener('click', () => {
            this.applyHint();
        });

        this.dom.btnReset.addEventListener('click', () => {
            this.loadLevel(this.currentLevelIndex);
        });

        this.dom.btnNextLevel.addEventListener('click', () => {
            this.dom.victoryModal.classList.add('hidden');
            this.loadLevel(this.currentLevelIndex + 1);
        });
    }

    checkFirstVisitHelp() {
        try {
            const seen = localStorage.getItem('dangle_help_seen');
            if (!seen) {
                this.openHelpModal();
            }
        } catch (e) {
            this.openHelpModal();
        }
    }

    openHelpModal() {
        if (this.dom.helpModal) {
            this.dom.helpModal.classList.remove('hidden');
        }
    }

    closeHelpModal() {
        if (this.dom.helpModal) {
            this.dom.helpModal.classList.add('hidden');
        }
        try {
            localStorage.setItem('dangle_help_seen', 'true');
        } catch (e) {}
    }

    loadLevel(index) {
        this.currentLevelIndex = index;
        const config = typeof getLevelConfig === 'function' ? getLevelConfig(index + 1) : { level: index + 1, nodes: 6, ties: 1 };

        if (this.animFrameId) {
            cancelAnimationFrame(this.animFrameId);
            this.animFrameId = null;
        }

        this.graph = new PuzzleGraph(config);
        this.isVictory = false;
        this.moves = 0;
        this.activeDragId = null;
        this.currentIntersectingEdgeIds.clear();
        this.intersections = [];
        this.sparks = [];
        this.dom.victoryModal.classList.add('hidden');

        // Show only current level: "LEVEL 1"
        this.dom.levelText.textContent = `LEVEL ${config.level}`;

        this.initNetwork();
        this.startAmbientBreathing();

        // Start minimal timer
        this.startTime = Date.now();
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => this.updateTimer(), 1000);
        this.updateTimer();
    }

    initNetwork() {
        if (this.network) {
            this.network.destroy();
            this.network = null;
        }

        const count = this.graph.nodes.length;
        const isLarge = count > 50;

        // Nodes with pure rubber physics enabled
        const visNodes = this.graph.nodes.map(n => ({
            id: n.id,
            x: n.x,
            y: n.y,
            physics: true,
            color: {
                background: n.color,
                border: '#ffffff',
                highlight: { background: '#ffffff', border: n.color }
            },
            size: n.size,
            shape: 'dot',
            borderWidth: n.size > 8 ? 2 : 1
        }));

        // Dynamic rubber edges that stretch, bend, and pull neighbors like real rubber cords
        const visEdges = this.graph.edges.map(e => ({
            id: e.id,
            from: e.from,
            to: e.to,
            physics: true,
            color: {
                color: '#C0C0C0',
                highlight: '#00FFFF'
            },
            width: isLarge ? 1.8 : 2.5,
            smooth: {
                enabled: true,
                type: 'dynamic'
            }
        }));

        this.nodesDataSet = new vis.DataSet(visNodes);
        this.edgesDataSet = new vis.DataSet(visEdges);

        // Exact Vis.js Barnes-Hut rubber physics settings matching network_interactive.py
        const gravConst = isLarge ? -1600 : -2500;
        const centralGrav = isLarge ? 0.07 : 0.04;
        const springLen = isLarge ? 85 : 125;
        const springConst = isLarge ? 0.015 : 0.010;
        const damp = isLarge ? 0.50 : 0.40;

        const options = {
            autoResize: true,
            layout: {
                improvedLayout: false
            },
            physics: {
                enabled: true,
                solver: 'barnesHut',
                barnesHut: {
                    gravitationalConstant: gravConst,
                    centralGravity: centralGrav,
                    springLength: springLen,
                    springConstant: springConst,
                    damping: damp,
                    avoidOverlap: 0.1
                },
                stabilization: {
                    enabled: false // Preserves organic loose hair tangled layout!
                },
                maxVelocity: 30
            },
            interaction: {
                hover: false,
                dragNodes: true,
                dragView: true,
                zoomView: true,
                multiselect: false
            },
            nodes: {
                font: { size: 0 }
            },
            edges: {
                smooth: {
                    enabled: true,
                    type: 'dynamic'
                }
            }
        };

        this.network = new vis.Network(
            this.container,
            { nodes: this.nodesDataSet, edges: this.edgesDataSet },
            options
        );

        // Drag handlers: when pulling one node, Vis.js spring physics pulls connected neighbors!
        this.network.on('dragStart', (params) => {
            if (params.nodes && params.nodes.length > 0) {
                this.activeDragId = params.nodes[0];
            }
            window.soundFX.playGrab();
        });

        this.network.on('dragging', () => {
            this.scheduleIntersectionUpdate();
        });

        this.network.on('dragEnd', () => {
            this.activeDragId = null;
            this.moves++;
            window.soundFX.playDrop();
            this.performIntersectionUpdate();
            this.checkVictory();
        });

        // Custom canvas rendering for red short-circuit collision sparks
        this.network.on('afterDrawing', (ctx) => {
            this.renderShortCircuitSparks(ctx);
        });

        // Ensure canvas fits screen viewport cleanly
        setTimeout(() => {
            if (this.network) {
                this.network.fit({ animation: false });
                this.performIntersectionUpdate();
            }
        }, 120);

        setTimeout(() => {
            if (this.network) {
                this.network.fit({ animation: false });
            }
        }, 450);
    }

    // Adaptive throttled update: silky smooth 60fps even with 200 nodes
    scheduleIntersectionUpdate() {
        if (this.pendingIntersectionCheck) return;
        this.pendingIntersectionCheck = true;

        const isLarge = this.graph.nodes.length > 50;
        const delay = isLarge ? 75 : 25;

        setTimeout(() => {
            this.pendingIntersectionCheck = false;
            this.performIntersectionUpdate();
        }, delay);
    }

    // High performance differential edge update
    performIntersectionUpdate() {
        if (!this.network || !this.graph || this.isVictory) return;

        const positions = this.network.getPositions();
        const result = this.graph.findIntersections(positions);
        const newIntersectingIds = result.intersectingEdgeIds;

        // Differential updates: only touch edges that actually changed state!
        const updates = [];

        // Check newly crossed edges (red short-circuit wire)
        for (const edgeId of newIntersectingIds) {
            if (!this.currentIntersectingEdgeIds.has(edgeId)) {
                updates.push({
                    id: edgeId,
                    color: { color: '#ff2a6d', highlight: '#ff2a6d' },
                    width: 3.2
                });
            }
        }

        // Check newly resolved clean edges
        for (const edgeId of this.currentIntersectingEdgeIds) {
            if (!newIntersectingIds.has(edgeId)) {
                updates.push({
                    id: edgeId,
                    color: { color: '#C0C0C0', highlight: '#00FFFF' },
                    width: 2.0
                });
            }
        }

        if (updates.length > 0) {
            this.edgesDataSet.update(updates);
            if (newIntersectingIds.size < this.currentIntersectingEdgeIds.size) {
                window.soundFX.playUntangle();
            }
        }

        this.currentIntersectingEdgeIds = newIntersectingIds;
        this.intersections = result.intersections;
        if (this.network) {
            this.network.redraw();
        }
    }

    renderShortCircuitSparks(ctx) {
        if (!this.intersections || this.intersections.length === 0 || this.isVictory) return;

        const count = this.intersections.length;
        const maxDraw = Math.min(count, 120); // High-perf cap for large networks
        const useGlow = count < 40;

        ctx.save();
        if (useGlow) {
            ctx.shadowColor = '#ff2a6d';
            ctx.shadowBlur = 8;
        }

        for (let i = 0; i < maxDraw; i++) {
            const pt = this.intersections[i].point;

            // Outer red collision dot
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 4.2, 0, Math.PI * 2);
            ctx.fillStyle = '#ff2a6d';
            ctx.fill();

            // Inner hot-white core
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 1.6, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
        }

        // Spawn occasional little electric sparks jumping from active intersections
        if (this.sparks && this.sparks.length < 16 && count > 0 && Math.random() < 0.4) {
            const randomInter = this.intersections[Math.floor(Math.random() * count)];
            this.sparks.push({
                x: randomInter.point.x,
                y: randomInter.point.y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                life: 1.0,
                decay: 0.08 + Math.random() * 0.08,
                color: Math.random() > 0.4 ? '#ff2a6d' : '#ffea00'
            });
        }

        // Render animated spark particles
        if (this.sparks && this.sparks.length > 0) {
            for (let i = this.sparks.length - 1; i >= 0; i--) {
                const s = this.sparks[i];
                s.x += s.vx;
                s.y += s.vy;
                s.life -= s.decay;

                if (s.life <= 0) {
                    this.sparks.splice(i, 1);
                    continue;
                }

                ctx.beginPath();
                ctx.arc(s.x, s.y, Math.max(1, 2.2 * s.life), 0, Math.PI * 2);
                ctx.fillStyle = s.color;
                ctx.fill();
            }
        }

        ctx.restore();
    }

    // Gentle organic breathing: nudges velocity (NEVER overwrites positions)
    // Nodes remain 100% free to be pulled elastically by springs!
    startAmbientBreathing() {
        if (this.animFrameId) cancelAnimationFrame(this.animFrameId);

        let lastTime = 0;
        const animate = (timestamp) => {
            if (this.isVictory || !this.network) return;

            const isLarge = this.graph.nodes.length > 50;
            const interval = isLarge ? 45 : 22;

            if (timestamp - lastTime > interval) {
                lastTime = timestamp;
                const bodyNodes = this.network.body ? this.network.body.nodes : null;

                if (bodyNodes) {
                    const t = timestamp * 0.0016;
                    for (const id in bodyNodes) {
                        if (id === this.activeDragId) continue;
                        const bn = bodyNodes[id];
                        if (!bn) continue;

                        const nid = Number(id) || 0;
                        const phase = nid * 0.85 + (bn.x + bn.y) * 0.003;

                        // Subtle velocity nudge: keeps mesh breathing gently without locking positions!
                        bn.vx += Math.sin(t + phase) * 0.035;
                        bn.vy += Math.cos(t * 1.1 + phase) * 0.035;
                    }
                }
            }

            this.animFrameId = requestAnimationFrame(animate);
        };

        this.animFrameId = requestAnimationFrame(animate);
    }

    applyHint() {
        if (this.isVictory || !this.network) return;

        const positions = this.network.getPositions();
        const result = this.graph.findIntersections(positions);
        if (result.count === 0) return;

        // Find most tangled node
        const crossingCounts = new Map();
        for (const inter of result.intersections) {
            crossingCounts.set(inter.edge1.from, (crossingCounts.get(inter.edge1.from) || 0) + 1);
            crossingCounts.set(inter.edge1.to, (crossingCounts.get(inter.edge1.to) || 0) + 1);
            crossingCounts.set(inter.edge2.from, (crossingCounts.get(inter.edge2.from) || 0) + 1);
            crossingCounts.set(inter.edge2.to, (crossingCounts.get(inter.edge2.to) || 0) + 1);
        }

        let maxCount = -1;
        let bestNodeId = -1;
        crossingCounts.forEach((c, id) => {
            if (c > maxCount) {
                maxCount = c;
                bestNodeId = id;
            }
        });

        const targetNode = this.graph.nodes.find(n => n.id === bestNodeId);
        if (!targetNode) return;

        const currentPos = positions[bestNodeId] || { x: targetNode.x, y: targetNode.y };
        const destX = currentPos.x + (targetNode.solvedX - currentPos.x) * 0.55;
        const destY = currentPos.y + (targetNode.solvedY - currentPos.y) * 0.55;

        this.network.moveNode(bestNodeId, destX, destY);

        window.soundFX.playUntangle();
        this.moves++;
        this.performIntersectionUpdate();
        this.checkVictory();
    }

    checkVictory() {
        if (this.isVictory || !this.network || this.moves === 0) return;

        const positions = this.network.getPositions();
        const result = this.graph.findIntersections(positions);

        if (result.count === 0) {
            this.isVictory = true;
            if (this.timerInterval) clearInterval(this.timerInterval);
            if (this.animFrameId) cancelAnimationFrame(this.animFrameId);

            // Turn all wires luminous emerald green
            const winUpdates = this.graph.edges.map(e => ({
                id: e.id,
                color: { color: '#00ff88', highlight: '#00ff88' },
                width: 3.5
            }));
            this.edgesDataSet.update(winUpdates);

            window.soundFX.playVictory();

            setTimeout(() => {
                const timeStr = this.getFormattedTime();
                this.dom.victoryLevel.textContent = `Level ${this.graph.config.level}`;
                this.dom.victoryTime.textContent = timeStr;
                this.dom.victoryModal.classList.remove('hidden');
            }, 600);
        }
    }

    updateTimer() {
        if (!this.startTime) return;
        this.dom.timer.textContent = this.getFormattedTime();
    }

    getFormattedTime() {
        const elapsedSec = Math.floor((Date.now() - this.startTime) / 1000);
        const m = Math.floor(elapsedSec / 60).toString().padStart(2, '0');
        const s = (elapsedSec % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.gameEngine = new MinimalGameEngine();
});
