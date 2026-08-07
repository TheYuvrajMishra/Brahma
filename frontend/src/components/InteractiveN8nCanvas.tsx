import React, { useState, useRef } from 'react';

interface NodeData {
    id: string;
    type: string;
    title: string;
    sub: string;
    x: number;
    y: number;
    tag: string;
}

interface Connection {
    from: string;
    to: string;
    style?: 'solid' | 'dashed';
}

const INITIAL_NODES: NodeData[] = [
    // Step 1: Single Starting Trigger (Far Left)
    { id: 'adapter', type: 'TRIGGER', title: 'Platform Adapter', sub: 'Web Sockets / Discord / Email', x: 20, y: 150, tag: 'STEP 1' },
    
    // Step 2: Context Processing & Memory Lookup (Middle Left)
    { id: 'observer', type: 'AI OBSERVER', title: 'Observer Engine', sub: 'Extract Tone & 20-Turn Moment', x: 270, y: 60, tag: 'STEP 2A' },
    { id: 'zehn', type: 'MEMORY VAULT', title: 'Zehn Memory Index', sub: 'SEC-01..07 Indexed Lookup', x: 270, y: 240, tag: 'STEP 2B' },
    
    // Step 3: Intent Classification (Middle Right)
    { id: 'router', type: 'SWITCH ROUTER', title: 'Intent Router', sub: 'Fast Lane vs Planner DAG', x: 530, y: 150, tag: 'STEP 3' },
    
    // Step 4: Execution & Response (Far Right Outputs)
    { id: 'composer', type: 'COMPOSER', title: 'Composer Synthesis', sub: 'Atman Soul + Memory Response', x: 790, y: 60, tag: 'FAST LANE' },
    { id: 'planner', type: 'SKILL ENGINE', title: 'SCRP Planner & Executor', sub: 'Parallel Skill DAG Execution', x: 790, y: 240, tag: 'PLANNER LANE' }
];

const CONNECTIONS: Connection[] = [
    // Trigger -> Observer (Main Input Stream)
    { from: 'adapter', to: 'observer', style: 'solid' },
    // Observer -> Zehn Memory (Triggers section lookup)
    { from: 'observer', to: 'zehn', style: 'dashed' },
    // Zehn Memory -> Intent Router (Injects retrieved context into Router)
    { from: 'zehn', to: 'router', style: 'dashed' },
    // Observer -> Intent Router (Sends analyzed context to Router)
    { from: 'observer', to: 'router', style: 'solid' },
    // Intent Router -> Fast Composer / Complex Planner
    { from: 'router', to: 'composer', style: 'solid' },
    { from: 'router', to: 'planner', style: 'solid' },
];

export const InteractiveN8nCanvas: React.FC = () => {
    const [nodes, setNodes] = useState<NodeData[]>(INITIAL_NODES);
    const [draggingNode, setDraggingNode] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMouseDown = (e: React.MouseEvent, id: string) => {
        setDraggingNode(id);
        const node = nodes.find(n => n.id === id);
        if (node) {
            setDragOffset({
                x: e.clientX - node.x,
                y: e.clientY - node.y
            });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!draggingNode || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const newX = Math.max(10, Math.min(rect.width - 220, e.clientX - dragOffset.x));
        const newY = Math.max(10, Math.min(rect.height - 130, e.clientY - dragOffset.y));

        setNodes(prev => prev.map(n => n.id === draggingNode ? { ...n, x: newX, y: newY } : n));
    };

    const handleMouseUp = () => {
        setDraggingNode(null);
    };

    const getNodePort = (id: string, portType: 'in' | 'out') => {
        const node = nodes.find(n => n.id === id);
        if (!node) return { x: 0, y: 0 };

        // Card width: 208px (w-52). Node card padding/border: handle is at left: -6px or right: -6px.
        // Vertical center of node card is around y + 42px (including padding and header).
        return {
            x: portType === 'in' ? node.x - 6 + 6 : node.x + 208 + 6 - 6, // Center of dot handle
            y: node.y + 45
        };
    };

    return (
        <div 
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="flex-1 flex flex-col items-center justify-start w-full max-w-5xl mx-auto py-2 relative select-none min-h-[420px]"
        >
            {/* Subtle Minimalist Pipeline Activation Header */}
            <div className="w-full text-center py-2 z-10">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/15 bg-white/[0.02] backdrop-blur-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    <span className="font-mono text-xs text-zinc-300 tracking-wide font-medium">
                        Enter a message below to activate the cognitive workflow pipeline
                    </span>
                </div>
            </div>
            {/* Draggable n8n Nodes & Dynamic Bezier Connection Wires */}
            <div className="w-full h-full relative z-10 min-h-[380px] mt-4">
                {/* SVG Interactive Dynamic Bezier Wires */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none fill-none z-0">
                    {CONNECTIONS.map((conn, i) => {
                        const start = getNodePort(conn.from, 'out');
                        const end = getNodePort(conn.to, 'in');
                        const deltaX = Math.max(30, Math.abs(end.x - start.x) * 0.5);
                        const pathD = `M ${start.x} ${start.y} C ${start.x + deltaX} ${start.y}, ${end.x - deltaX} ${end.y}, ${end.x} ${end.y}`;

                        return (
                            <g key={i}>
                                <path 
                                    d={pathD} 
                                    className="stroke-white/40" 
                                    strokeWidth="1.5" 
                                    strokeDasharray={conn.style === 'dashed' ? '4 4' : 'none'} 
                                />
                                {/* Pulsing Flow Dot */}
                                <circle 
                                    r="3" 
                                    cx={(start.x + end.x)/2} 
                                    cy={(start.y + end.y)/2} 
                                    className="fill-white animate-pulse" 
                                />
                            </g>
                        );
                    })}
                </svg>

                {nodes.map(node => (
                    <div
                        key={node.id}
                        onMouseDown={(e) => handleMouseDown(e, node.id)}
                        style={{ left: `${node.x}px`, top: `${node.y}px` }}
                        className={`absolute w-52 p-3.5 rounded-lg border bg-[#080808] shadow-2xl cursor-grab active:cursor-grabbing transition-shadow duration-200 ${
                            draggingNode === node.id 
                                ? 'border-white shadow-[0_0_20px_rgba(255,255,255,0.3)] z-30' 
                                : 'border-white/20 hover:border-white/50 z-20'
                        }`}
                    >
                        {/* Input Port Handle */}
                        <div className="absolute left-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-black border-2 border-white hover:scale-125 transition-transform" />
                        
                        <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
                            <div className="flex items-center gap-1.5 font-mono text-[9px] text-white">
                                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                                <span className="font-semibold uppercase tracking-wider">{node.type}</span>
                            </div>
                            <span className="text-[8px] font-mono text-zinc-500">{node.tag}</span>
                        </div>
                        
                        <h5 className="text-xs font-mono font-semibold text-white tracking-wide">{node.title}</h5>
                        <p className="text-[9px] font-mono text-zinc-400 mt-1 leading-snug">{node.sub}</p>

                        {/* Output Port Handle */}
                        <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-black hover:scale-125 transition-transform" />
                    </div>
                ))}
            </div>
        </div>
    );
};
