import React from 'react';
import { PresetConfig } from '../types';
import { PRESETS } from '../constants';
import { Trash2, Printer, LayoutGrid, Scissors, Move, MousePointerClick, Undo2, Redo2 } from 'lucide-react';

interface SidebarProps {
  currentPreset: PresetConfig;
  onPresetChange: (preset: PresetConfig) => void;
  photoCount: number;
  onClear: () => void;
  onPrint: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  currentPreset,
  onPresetChange,
  photoCount,
  onClear,
  onPrint,
  undo,
  redo,
  canUndo,
  canRedo
}) => {
  return (
    <div className="w-80 bg-white border-r border-gray-200 h-screen flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-20">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex justify-between items-start mb-4">
            <div>
                <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2 tracking-tight">
                <Scissors className="w-5 h-5 text-indigo-500" />
                手账拼贴工具
                </h1>
                <p className="text-xs text-gray-400 mt-1 pl-7">Techo Collager</p>
            </div>
        </div>
        
        {/* Undo/Redo Controls */}
        <div className="flex gap-2">
            <button 
                onClick={undo}
                disabled={!canUndo}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-gray-50 text-gray-600 rounded-lg text-sm border border-gray-200 transition-colors"
                title="撤销 (Undo)"
            >
                <Undo2 size={16} />
                撤销
            </button>
            <button 
                onClick={redo}
                disabled={!canRedo}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-gray-50 text-gray-600 rounded-lg text-sm border border-gray-200 transition-colors"
                title="重做 (Redo)"
            >
                <Redo2 size={16} />
                重做
            </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        
        {/* Stats */}
        <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-indigo-900">已添加照片</span>
            <span className="text-lg font-bold text-indigo-600">
              {photoCount} <span className="text-indigo-300 text-sm">/ {currentPreset.totalCells}</span>
            </span>
          </div>
          <div className="w-full bg-indigo-100 rounded-full h-1.5 mt-2">
            <div 
              className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(photoCount / currentPreset.totalCells) * 100}%` }}
            />
          </div>
        </div>

        {/* Preset Selector */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <LayoutGrid size={16} />
            布局样式
          </label>
          <div className="grid grid-cols-1 gap-2">
            {Object.values(PRESETS).map((preset) => (
              <button
                key={preset.id}
                onClick={() => onPresetChange(preset)}
                className={`
                  text-left px-4 py-3 rounded-lg text-sm border transition-all duration-200
                  flex flex-col gap-0.5
                  ${currentPreset.id === preset.id 
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-500' 
                    : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
              >
                <span className="font-medium">{preset.name}</span>
                <span className="text-xs opacity-70">
                   {preset.cellWidthMm}x{preset.cellHeightMm}mm • {preset.rows}行{preset.cols}列
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">操作指南</h3>
            <ul className="space-y-3 text-sm text-gray-500 bg-gray-50 p-4 rounded-lg border border-gray-100">
                <li className="flex items-start gap-2.5">
                    <MousePointerClick size={14} className="mt-0.5 text-gray-400" />
                    <span>点击格子选择 (再次点击已选格子可粘贴替换)</span>
                </li>
                <li className="flex items-start gap-2.5">
                    <kbd className="font-mono text-xs bg-white border px-1 rounded text-gray-600 shadow-sm">Ctrl+V</kbd>
                    <span>粘贴剪贴板图片</span>
                </li>
                <li className="flex items-start gap-2.5">
                    <Move size={14} className="mt-0.5 text-gray-400" />
                    <span>拖拽移动图片位置</span>
                </li>
            </ul>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-6 bg-white border-t border-gray-100 space-y-3">
        <button
          onClick={onPrint}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-medium shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
        >
          <Printer size={18} />
          导出为 PDF / 打印
        </button>
        
        <button
          onClick={onClear}
          className="w-full bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-red-600 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm"
        >
          <Trash2 size={16} />
          清空全部
        </button>
      </div>
    </div>
  );
};

export default Sidebar;