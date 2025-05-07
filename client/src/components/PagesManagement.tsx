import React, { useState, useEffect } from 'react';

interface Page {
  id: number;
  slug: string;
  title: string;
  content: string;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

interface NewPage {
  slug: string;
  title: string;
  content: string;
  image: File | null;
}

const PagesManagement: React.FC = () => {
  const [pages, setPages] = useState<Page[]>([]);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [newPage, setNewPage] = useState<NewPage>({
    slug: '',
    title: '',
    content: '',
    image: null
  });

  const handleEdit = (page: Page) => {
    if (page.slug === 'aktualnosci') {
      alert('Strona Aktualności jest statyczna i nie może być edytowana.');
      return;
    }
    setEditingPage(page);
    setNewPage({
      slug: page.slug,
      title: page.title,
      content: page.content,
      image: null
    });
  };

  const handleDelete = async (page: Page) => {
    if (page.slug === 'aktualnosci') {
      alert('Strona Aktualności jest statyczna i nie może być usunięta.');
      return;
    }
    if (window.confirm('Czy na pewno chcesz usunąć tę stronę?')) {
      try {
        const response = await fetch(`http://localhost:3001/api/pages/${page.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          setPages(pages.filter((p: Page) => p.id !== page.id));
        } else {
          const data = await response.json();
          alert(data.message || 'Wystąpił błąd podczas usuwania strony');
        }
      } catch (error) {
        console.error('Error deleting page:', error);
        alert('Wystąpił błąd podczas usuwania strony');
      }
    }
  };

  return (
    <div className="pages-management">
      <h2>Zarządzanie stronami</h2>
      
      <div className="pages-list">
        {pages.map((page: Page) => (
          <div key={page.id} className="page-item">
            <div className="page-info">
              <h3>{page.title}</h3>
              <p>Slug: {page.slug}</p>
              <p>Ostatnia aktualizacja: {new Date(page.updatedAt).toLocaleString()}</p>
            </div>
            <div className="page-actions">
              {page.slug !== 'aktualnosci' && (
                <>
                  <button onClick={() => handleEdit(page)}>Edytuj</button>
                  <button onClick={() => handleDelete(page)}>Usuń</button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PagesManagement; 