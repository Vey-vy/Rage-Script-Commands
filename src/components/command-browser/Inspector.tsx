'use client';

import { useEffect } from 'react';
import type { Command } from '@/types';
import { Badge } from '@/components/ui';

interface InspectorProps {
  command: Command | null;
  isOpen: boolean;
  onClose: () => void;
}

function invokeSignature(command: Command): string {
  const hash = command.hash ?? 'HASH';
  const returnType = command.returnType ?? 'void';
  const args = command.params?.map((p) => p.name).join(', ') ?? '';
  return `Invoke<${hash}, ${returnType}>(${args})`;
}

export function Inspector({ command, isOpen, onClose }: InspectorProps) {
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
    }
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !command) return null;

  return (
    <aside className="w-96 flex-shrink-0 bg-white border-l border-gray-200 flex flex-col animate-slide-in" role="complementary" aria-label="Command details">
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">INSPECTOR</span>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          aria-label="Close inspector"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div>
          <h2 id="inspector-title" className="text-xl font-mono font-semibold text-gray-900 break-all mb-2">
            {command.name}
          </h2>

          <div className="bg-gray-50 rounded-lg p-3 overflow-x-auto">
            <code className="text-sm font-mono text-gray-700">{command.syntax}</code>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">GROUP</p>
            <p className="font-mono text-sm text-gray-900">{command.namespace ?? 'GLOBAL'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">RETURNS</p>
            <p className="font-mono text-sm text-gray-900">{command.returnType ?? 'void'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">HASH</p>
            <p className="font-mono text-sm text-gray-900">{command.hash ?? 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">BUILD</p>
            <p className="font-mono text-sm text-gray-900">{command.build ?? 'ALL'}</p>
          </div>
        </div>

        {command.params?.length && (
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">PARAMETERS</p>
            <div className="space-y-2">
              {command.params.map((param) => (
                <div key={param.name} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                  <code className="font-mono text-sm text-blue-600">{param.name}</code>
                  <span className="text-sm text-gray-600 font-mono">{param.type}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {command.comment && (
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">DOCUMENTATION</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{command.comment}</p>
          </div>
        )}
      </div>
    </aside>
  );
}