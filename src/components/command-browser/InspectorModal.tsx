'use client';

import { useEffect } from 'react';
import { useTranslation } from '@/components/I18nProvider';
import type { Command } from '@/types';
import { NativeCode } from './NativeCode';

interface InspectorModalProps {
  command: Command | undefined;
  isOpen: boolean;
  onClose: () => void;
}

export function InspectorModal({ command, isOpen, onClose }: InspectorModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    function handleKeydown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [isOpen, onClose]);

  const { t } = useTranslation();

  if (!isOpen || !command) return null;

  const nativeSignature = `${command.returnType ?? 'void'} ${command.name}(${command.params
    ?.map((param) => `${param.type ?? 'void'} ${param.name}`)
    .join(', ') ?? ''})`;

  return (
    <>
      <button
        aria-label="Close command inspector"
        className="native-inspector-backdrop"
        onClick={onClose}
        type="button"
      />

      <aside
        aria-label={`${command.name} details`}
        aria-modal="true"
        className="native-inspector native-inspector--modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="native-inspector__header">
          <span>{t('browser.inspector')}</span>
          <button aria-label={t('common.close')} className="native-inspector__close" onClick={onClose} type="button">
            ×
          </button>
        </div>

        <div className="native-inspector__body">
          <h2>{command.name}</h2>
          <NativeCode code={nativeSignature} />

          <div className="native-inspector__grid">
            <div>
              <label>{t('browser.namespace')}</label>
              <strong>{command.namespace ?? 'GLOBAL'}</strong>
            </div>
            <div>
              <label>{t('browser.returns')}</label>
              <strong>{command.returnType ?? 'void'}</strong>
            </div>
            <div>
              <label>{t('browser.hash')}</label>
              <strong
                aria-label="Copy native hash"
                className="native-inspector__hash"
                onClick={(event) => {
                  if (!command.hash) return;
                  navigator.clipboard?.writeText(String(command.hash));
                  const target = event.currentTarget as HTMLElement;
                  const previous = target.textContent;
                  target.textContent = 'Copied';
                  window.setTimeout(() => {
                    target.textContent = previous ?? 'N/A';
                  }, 900);
                }}
                onKeyDown={(event) => {
                  if ((event.key === 'Enter' || event.key === ' ') && command.hash) {
                    event.preventDefault();
                    navigator.clipboard?.writeText(String(command.hash));
                  }
                }}
                role="button"
                tabIndex={0}
              >
                {command.hash ?? 'N/A'}
              </strong>
            </div>
            <div>
              <label>{t('browser.build')}</label>
              <strong>{command.build ?? 'All'}</strong>
            </div>
          </div>

          <div className="native-inspector__section">
            <label>{t('browser.parameters')}</label>
            {command.params?.length ? (
              command.params.map((param) => (
                <div className="native-inspector__param" key={param.name}>
                  <NativeCode code={`${param.type ?? 'void'} ${param.name}`} />
                  <span>{param.type}</span>
                </div>
              ))
            ) : (
              <p>{t('browser.noParams')}</p>
            )}
          </div>

          {command.comment && (
            <div className="native-inspector__section">
              <label>{t('browser.documentation')}</label>
              <p>{command.comment}</p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}