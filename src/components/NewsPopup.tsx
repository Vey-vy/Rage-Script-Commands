'use client';

import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import type { NewsAnnouncement } from '@/lib/news';
import { useTranslation } from './I18nProvider';

const STORAGE_KEY = 'scriptcommands.dismissed-news';

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

export function NewsPopup({ news }: { news: NewsAnnouncement | null }) {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (!news) return;

    try {
      setIsOpen(window.localStorage.getItem(STORAGE_KEY) !== news.key);
    } catch (error) {
      console.error('[NEWS] Could not read dismissed-news state from local storage.', error);
      setIsOpen(true);
    }
  }, [news]);

  const close = useCallback(() => {
    if (!news) return;

    setIsOpen(false);

    try {
      window.localStorage.setItem(STORAGE_KEY, news.key);
    } catch (error) {
      console.error('[NEWS] Could not save dismissed-news state to local storage.', error);
    }
  }, [news]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [close, isOpen]);

  if (!news || !isOpen) return null;

  const markdown = news.markdown?.trim();

  return (
    <div
      className="news-popup__overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="news-popup-title"
      onClick={close}
    >
      <article className="news-popup" onClick={(event) => event.stopPropagation()}>
        <header className="news-popup__header">
          <div>
            <p className="news-popup__eyebrow">
              {news.category || t('news.eyebrow')}
            </p>
            <h2 id="news-popup-title" className="news-popup__title">{news.title}</h2>
          </div>
          <button
            type="button"
            className="news-popup__close"
            aria-label={t('news.close')}
            onClick={close}
          >
            ×
          </button>
        </header>

        {news.image && isHttpUrl(news.image) && (
          <Image
            className="news-popup__image"
            src={news.image}
            alt=""
            width={960}
            height={540}
            unoptimized
          />
        )}

        <div className="news-popup__content">
          {markdown ? (
            <div className="news-popup__markdown">
              <ReactMarkdown>{markdown}</ReactMarkdown>
            </div>
          ) : (
            <>
              {news.description && <p>{news.description}</p>}
              {!!news.changes?.length && (
                <ul>
                  {news.changes.map((change, index) => <li key={`${index}-${change}`}>{change}</li>)}
                </ul>
              )}
            </>
          )}
        </div>

        <footer className="news-popup__footer">
          {news.link && isHttpUrl(news.link) && (
            <a href={news.link} target="_blank" rel="noreferrer">
              {t('news.readMore')}
            </a>
          )}
          <button type="button" onClick={close}>
            {t('news.dismiss')}
          </button>
        </footer>
      </article>
    </div>
  );
}
