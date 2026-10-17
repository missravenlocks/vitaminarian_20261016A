import React, { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { TreeNode } from '../types/nutrition';
import { cleanNumber } from '../utils/nutritionCalc';

interface FoodBreakdownTreeProps {
  rootNode: TreeNode;
}

export const FoodBreakdownTree: React.FC<FoodBreakdownTreeProps> = ({ rootNode }) => {
  // Set of expanded node IDs. Initially empty (collapsed by default).
  const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(new Set());

  const toggleNode = (nodeId: string) => {
    setExpandedNodeIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const isRootExpanded = expandedNodeIds.has(rootNode.id);

  // Render a node and its children recursively if expanded
  const renderNode = (node: TreeNode, depth: number) => {
    const isExpanded = expandedNodeIds.has(node.id);
    const hasChildren = node.isExpandable && node.children && node.children.length > 0;

    return (
      <div key={node.id} className="w-full">
        <div
          className={`group flex items-center justify-between py-2 px-3 rounded-lg transition-colors ${
            node.isExpandable
              ? 'cursor-pointer hover:bg-slate-100/80 text-slate-900'
              : 'text-slate-700'
          }`}
          style={{ paddingLeft: `${Math.max(12, depth * 24 + 12)}px` }}
          onClick={() => {
            if (node.isExpandable) {
              toggleNode(node.id);
            }
          }}
        >
          {/* Left: Caret and Node Label */}
          <div className="flex items-center gap-2 min-w-0 pr-4">
            {node.isExpandable ? (
              <span className="text-slate-500 group-hover:text-slate-800 transition-colors shrink-0">
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </span>
            ) : (
              <span className="w-4 h-4 shrink-0" />
            )}

            <span
              className={`text-sm ${
                depth === 0
                  ? 'font-bold text-slate-900 text-base'
                  : node.isExpandable
                  ? 'font-semibold text-slate-800'
                  : 'font-normal text-slate-600'
              }`}
            >
              {depth === 0 ? `> ${node.label}` : node.isExpandable ? `> ${node.label}` : node.label}
            </span>
          </div>

          {/* Right: Calories column (shown if root node is expanded) */}
          {isRootExpanded && (
            <div className="shrink-0 text-right font-mono tabular-nums text-xs font-semibold text-slate-600 bg-slate-100/60 px-2 py-0.5 rounded border border-slate-200/60">
              {cleanNumber(Math.round(node.calories * 10) / 10)} kcal
            </div>
          )}
        </div>

        {/* Child nodes */}
        {hasChildren && isExpanded && (
          <div className="border-l border-slate-200/60 ml-4 pl-1">
            {node.children!.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
      <div className="border-b border-slate-100 pb-2 mb-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Food Breakdown Tree
        </h3>
        {isRootExpanded && (
          <span className="text-[11px] font-mono text-slate-400">Calories</span>
        )}
      </div>

      <div className="w-full">{renderNode(rootNode, 0)}</div>
    </div>
  );
};
