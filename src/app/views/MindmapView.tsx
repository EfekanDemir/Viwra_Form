import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Network, ArrowLeft } from 'lucide-react';
import { ReactFlow, MiniMap, Controls, Background, useNodesState, useEdgesState, addEdge, BackgroundVariant, Panel, Handle, Position, useReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { User } from '@supabase/supabase-js';

interface MindmapViewProps { user: User | null; }

function EditableNode({ id, data, isConnectable }: any) {
  const { setNodes } = useReactFlow();
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(data.label);

  const onBlur = () => {
    setIsEditing(false);
    setNodes(nds => nds.map(n => { if (n.id === id) n.data = { ...n.data, label: text }; return n; }));
  };

  return (
    <div onDoubleClick={() => setIsEditing(true)} style={data.style || { borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: 'white', padding: '10px' }}>
      <Handle type="target" position={Position.Top} isConnectable={isConnectable} className="!w-2 !h-2 !bg-white/40 border-none" />
      {isEditing ? (
        <input autoFocus value={text} onChange={e => setText(e.target.value)} onBlur={onBlur} onKeyDown={e => e.key === 'Enter' && onBlur()} className="bg-transparent border-b border-white/40 outline-none text-white text-center w-full min-w-[80px]" />
      ) : (
        <div className="text-sm tracking-wide cursor-text min-w-[80px] text-center">{data.label}</div>
      )}
      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} className="!w-2 !h-2 !bg-white/40 border-none" />
    </div>
  );
}

const nodeTypes = { editableNode: EditableNode };
const initialNodes = [{ id: '1', position: { x: 0, y: 0 }, data: { label: 'Merkez Düşünce' }, type: 'editableNode' }];

export function MindmapView({ user }: MindmapViewProps) {
  const navigate = useNavigate();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [nodeName, setNodeName] = useState('Yeni Düşünce');
  const [selectedNode, setSelectedNode] = useState<any>(null);

  const onConnect = React.useCallback((params: any) => setEdges(eds => addEdge(params, eds)), [setEdges]);

  const handleAddNode = () => {
    setNodes(nds => nds.concat({
      id: Math.random().toString(),
      position: { x: (Math.random() - 0.5) * 400, y: (Math.random() - 0.5) * 400 },
      type: 'editableNode',
      data: { label: nodeName },
    }));
  };

  const handleUpdateNode = () => {
    if (!selectedNode) return;
    setNodes(nds => nds.map(n => { if (n.id === selectedNode.id) n.data = { ...n.data, label: nodeName }; return n; }));
    setSelectedNode(null);
  };

  const onSelectionChange = React.useCallback(({ nodes }: any) => {
    if (nodes.length > 0) { setSelectedNode(nodes[0]); setNodeName(nodes[0].data.label); }
    else { setSelectedNode(null); setNodeName('Yeni Düşünce'); }
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-full p-6 pb-32 relative z-10">
      <button onClick={() => navigate('/home')} className="absolute top-6 left-6 p-4 rounded-full bg-white/5 hover:bg-white/10 transition-colors z-20">
        <ArrowLeft className="w-5 h-5" />
      </button>
      <div className="flex-1 flex flex-col pt-16">
        <div className="text-center space-y-4 mb-4">
          <h1 className="text-2xl font-medium tracking-wider">Zihin Haritası</h1>
          <p className="text-sm font-light tracking-wide opacity-60">Düşüncelerini görselleştir ve düğümleri birbirine bağla.</p>
        </div>
        <div className="flex-1 min-h-[400px] border border-white/10 rounded-[32px] overflow-hidden relative">
          <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} onSelectionChange={onSelectionChange} fitView colorMode="dark">
            <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
            <Controls className="!bg-black/50 !border-white/10 !fill-white" />
            <MiniMap className="!bg-black/50 overflow-hidden rounded-xl border border-white/10" maskColor="rgba(0,0,0,0.4)" nodeColor="rgba(255,255,255,0.2)" />
            <Panel position="top-right" className="bg-black/40 p-4 rounded-2xl border border-white/10 backdrop-blur-xl m-4 flex flex-col gap-3 shadow-lg w-48">
              <input type="text" value={nodeName} onChange={e => setNodeName(e.target.value)} placeholder="Düşünce..." className="bg-white/10 text-white rounded-xl p-3 text-sm focus:outline-none border border-white/10" />
              {selectedNode ? (
                <button onClick={handleUpdateNode} className="bg-white/20 hover:bg-white/30 transition-colors rounded-xl p-3 text-sm font-medium">Düğümü Güncelle</button>
              ) : (
                <button onClick={handleAddNode} className="bg-white/20 hover:bg-white/30 transition-colors rounded-xl p-3 text-sm font-medium">Düğüm Ekle</button>
              )}
            </Panel>
          </ReactFlow>
        </div>
      </div>
    </motion.div>
  );
}
