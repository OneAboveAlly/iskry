import React, { useEffect } from 'react';
import '../styles/PagesList.css';

interface Page {
  id: number;
  slug: string;
  title: string;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PagesListProps {
  pages: Page[];
  selectedSlug: string | null;
  onSelectPage: (slug: string) => void;
}

const PagesList: React.FC<PagesListProps> = ({ pages, selectedSlug, onSelectPage }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  useEffect(() => {
    console.log('PagesList rendered with pages:', pages);
  }, [pages]);

  if (pages.length === 0) {
    return (
      <div className="pages-list-empty">
        <p>Brak stron. Utwórz swoją pierwszą stronę.</p>
      </div>
    );
  }

  return (
    <div className="pages-list">
      {pages.map((page) => (
        <div
          key={page.id}
          className={`page-item ${selectedSlug === page.slug ? 'selected' : ''}`}
          onClick={() => onSelectPage(page.slug)}
        >
          <div className="page-item-header">
            <h3 className="page-item-title">{page.title}</h3>
            <span className="page-item-slug">/{page.slug}</span>
          </div>
          <div className="page-item-dates">
            <span>Utworzono: {formatDate(page.createdAt)}</span>
            <span>Aktualizacja: {formatDate(page.updatedAt)}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PagesList; 