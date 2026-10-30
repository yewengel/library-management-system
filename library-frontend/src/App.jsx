import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './App.css';

const API_URL = 'https://library-management-system-3cwz.onrender.com';

const SECTION_PATHS = {
  dashboard: '/dashboard',
  books: '/books',
  authors: '/authors',
  borrowed: '/borrowed',
  available: '/available',
};

const getSectionFromPath = (pathname) => {
  const section = pathname.replace(/^\/+|\/+$/g, '') || 'dashboard';
  return Object.hasOwn(SECTION_PATHS, section) ? section : null;
};

function App() {
  const location = useLocation();
  const navigate = useNavigate();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const activeSection =
    getSectionFromPath(location.pathname) || 'dashboard';
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [books, setBooks] = useState([]);
  const [authors, setAuthors] = useState([]);

  const [title, setTitle] = useState('');
  const [year, setYear] = useState('');
  const [genre, setGenre] = useState('');
  const [author, setAuthor] = useState('');
  const [available, setAvailable] = useState(true);

  const [editingId, setEditingId] = useState(null);
  const [isBookFormOpen, setIsBookFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [notification, setNotification] = useState('');

  const [authorName, setAuthorName] = useState('');
  const [editingAuthorId, setEditingAuthorId] = useState(null);
  const [isAuthorFormOpen, setIsAuthorFormOpen] = useState(false);
  const [authorSearchTerm, setAuthorSearchTerm] = useState('');
  const [selectedAuthor, setSelectedAuthor] = useState(null);

  const handleLogin = async (event) => {
    event.preventDefault();

    if (!username.trim() || !password.trim()) {
      setLoginError('Please enter username and password');
      return;
    }

    setIsLoggingIn(true);
    setLoginError('');

    try {
      const response = await fetch(
        `${API_URL}/api/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setLoginError(
          data.error || 'Invalid username or password'
        );
        return;
      }

      setIsLoggedIn(true);
      setLoginError('');
      setUsername('');
      setPassword('');
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('Could not connect to the backend');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername('');
    setPassword('');
    setLoginError('');
  };

  const showNotification = (message) => {
    setNotification(message);

    setTimeout(() => {
      setNotification('');
    }, 3000);
  };

  const fetchBooks = () => {
    fetch(`${API_URL}/api/books`)
      .then((response) => response.json())
      .then((data) => {
        setBooks(data);
      })
      .catch((error) => {
        console.error('Error fetching books:', error);
      });
  };

  const fetchAuthors = () => {
    fetch(`${API_URL}/api/authors`)
      .then((response) => response.json())
      .then((data) => {
        setAuthors(data);
      })
      .catch((error) => {
        console.error('Error fetching authors:', error);
      });
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchBooks();
      fetchAuthors();
    }
  }, [isLoggedIn]);

  useEffect(() => {
    const section = getSectionFromPath(location.pathname);

    if (!section) {
      navigate(SECTION_PATHS.dashboard, {
        replace: true,
      });
      return;
    }

    if (location.pathname !== SECTION_PATHS[section]) {
      navigate(SECTION_PATHS[section], {
        replace: true,
      });
    }
  }, [location.pathname, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const newBook = {
      title,
      author,
      year: Number(year),
      genre,
      available,
    };

    try {
      const response = await fetch(
        `${API_URL}/api/books?role=librarian`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newBook),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Failed to add book');
        return;
      }

      showNotification('Book added successfully!');

      clearBookForm();
      fetchBooks();
    } catch (error) {
      console.error('Error adding book:', error);
      alert('Could not connect to the backend');
    }
  };

  const handleUpdate = async (event) => {
    event.preventDefault();

    const updatedBook = {
      title,
      author,
      year: Number(year),
      genre,
      available,
    };

    try {
      const response = await fetch(
        `${API_URL}/api/books/${editingId}?role=librarian`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedBook),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Failed to update book');
        return;
      }

      showNotification('Book updated successfully!');

      clearBookForm();
      fetchBooks();
    } catch (error) {
      console.error('Error updating book:', error);
      alert('Could not connect to the backend');
    }
  };

  const startEditing = (book) => {
    setIsBookFormOpen(true);
    setEditingId(book._id);
    setTitle(book.title);
    setYear(book.year);
    setGenre(book.genre);
    setAuthor(book.author?._id || '');
    setAvailable(book.available);

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this book?'
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/books/${id}?role=librarian`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const data = await response.json();

        alert(data.error || 'Failed to delete book');
        return;
      }

      showNotification('Book deleted successfully!');

      fetchBooks();
    } catch (error) {
      console.error('Error deleting book:', error);
      alert('Could not connect to the backend');
    }
  };

  const handleBorrow = async (id) => {
    try {
      const response = await fetch(
        `${API_URL}/api/books/${id}/borrow?role=librarian`,
        {
          method: 'PUT',
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Failed to borrow book');
        return;
      }

      showNotification('Book borrowed successfully!');

      fetchBooks();
    } catch (error) {
      console.error('Error borrowing book:', error);
      alert('Could not connect to the backend');
    }
  };

  const handleReturn = async (id) => {
    try {
      const response = await fetch(
        `${API_URL}/api/books/${id}/return?role=librarian`,
        {
          method: 'PUT',
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Failed to return book');
        return;
      }

      showNotification('Book returned successfully!');

      fetchBooks();
    } catch (error) {
      console.error('Error returning book:', error);
      alert('Could not connect to the backend');
    }
  };

  const filteredBooks = books.filter((book) => {
    const search = searchTerm.toLowerCase();

    const matchesSection =
      activeSection === 'borrowed'
        ? !book.available
        : activeSection === 'available'
          ? book.available
          : true;

    return (
      matchesSection &&
      (
        book.title?.toLowerCase().includes(search) ||
        book.author?.name
          ?.toLowerCase()
          .includes(search) ||
        book.year?.toString().includes(search) ||
        book.genre?.toLowerCase().includes(search) ||
        (book.available
          ? 'available'
          : 'borrowed'
        ).includes(search)
      )
    );
  });

  const clearBookForm = () => {
    setTitle('');
    setYear('');
    setGenre('');
    setAuthor('');
    setAvailable(true);
    setEditingId(null);
    setIsBookFormOpen(false);
  };

  const handleAuthorSubmit = async (event) => {
    event.preventDefault();

    if (!authorName.trim()) {
      alert('Please enter an author name');
      return;
    }

    try {
      const url = editingAuthorId
        ? `${API_URL}/api/authors/${editingAuthorId}?role=librarian`
        : `${API_URL}/api/authors?role=librarian`;

      const method = editingAuthorId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: authorName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Failed to save author');
        return;
      }

      showNotification(
        editingAuthorId
          ? 'Author updated successfully!'
          : 'Author added successfully!'
      );

      clearAuthorForm();
      fetchAuthors();
    } catch (error) {
      console.error('Error saving author:', error);
      alert('Could not connect to the backend');
    }
  };

  const startEditingAuthor = (author) => {
    setIsAuthorFormOpen(true);
    setEditingAuthorId(author._id);
    setAuthorName(author.name);

    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: 'smooth',
    });
  };

  const handleDeleteAuthor = async (id) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this author?'
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/authors/${id}?role=librarian`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const data = await response.json();

        alert(data.error || 'Failed to delete author');
        return;
      }

      showNotification('Author deleted successfully!');

      fetchAuthors();
      fetchBooks();
    } catch (error) {
      console.error('Error deleting author:', error);
      alert('Could not connect to the backend');
    }
  };

  const clearAuthorForm = () => {
    setAuthorName('');
    setEditingAuthorId(null);
    setIsAuthorFormOpen(false);
  };

  const getBookCount = (authorId) => {
    return books.filter(
      (book) => book.author?._id === authorId
    ).length;
  };

  const availableBooks = books.filter(
    (book) => book.available
  );

  const borrowedBooks = books.filter(
    (book) => !book.available
  );

  const filteredAuthors = authors.filter((item) =>
    item.name
      ?.toLowerCase()
      .includes(authorSearchTerm.toLowerCase())
  );

  const selectedAuthorBooks = selectedAuthor
    ? books.filter(
        (book) =>
          book.author?._id === selectedAuthor._id
      )
    : [];

  const sectionDetails = {
    dashboard: [
      'Dashboard',
      'Overview of your library',
    ],
    books: [
      'Books',
      'Manage your library collection',
    ],
    authors: [
      'Authors',
      'Manage authors and their books',
    ],
    borrowed: [
      'Borrowed Books',
      'Books currently checked out',
    ],
    available: [
      'Available Books',
      'Books ready to borrow',
    ],
  };

  const navigateTo = (section) => {
    const path = SECTION_PATHS[section];

    if (!path) {
      return;
    }

    setIsSidebarOpen(false);

    if (section !== 'books') {
      clearBookForm();
    }

    if (section !== 'authors') {
      clearAuthorForm();
    }

    if (location.pathname !== path) {
      navigate(path);
    }
  };

  const handleBackNavigation = () => {
    if (
      activeSection === 'authors' &&
      selectedAuthor
    ) {
      setSelectedAuthor(null);
      return;
    }

    if (
      activeSection === 'books' &&
      isBookFormOpen
    ) {
      clearBookForm();
      return;
    }

    if (
      activeSection === 'authors' &&
      isAuthorFormOpen
    ) {
      clearAuthorForm();
      return;
    }

    navigateTo('dashboard');
  };

  if (!isLoggedIn) {
    return (
      <div className="login-page">
        <div className="login-card">
          <h1>Library Management System</h1>

          <h2>Librarian Login</h2>

          <form onSubmit={handleLogin}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(event) => {
                setUsername(event.target.value);
                setLoginError('');
              }}
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setLoginError('');
              }}
            />

            {loginError && (
              <p className="login-error">
                {loginError}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
            >
              {isLoggingIn
                ? 'Logging in...'
                : 'Login'}
            </button>
          </form>

          <p className="login-hint">
            Enter your librarian account credentials.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      {isSidebarOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={`sidebar ${
          isSidebarOpen ? 'sidebar-open' : ''
        }`}
      >
        <div className="brand-lockup">
          <div className="brand-mark">L</div>

          <span>
            Library
            <br />
            Management
          </span>
        </div>

        <p className="nav-caption">WORKSPACE</p>

        <nav
          className="side-nav"
          aria-label="Main navigation"
        >
          {[
            ['dashboard', 'Dashboard', 'D'],
            ['books', 'Books', 'B'],
            ['authors', 'Authors', 'A'],
            ['borrowed', 'Borrowed Books', 'R'],
            ['available', 'Available Books', 'V'],
          ].map(
            ([section, label, mark]) => (
              <button
                type="button"
                key={section}
                className={`nav-item ${
                  activeSection === section
                    ? 'nav-item-active'
                    : ''
                }`}
                onClick={() =>
                  navigateTo(section)
                }
              >
                <span className="nav-mark">
                  {mark}
                </span>

                <span>{label}</span>
              </button>
            )
          )}
        </nav>

        <div className="sidebar-bottom">
          <button
            type="button"
            className="nav-item logout-nav"
            onClick={handleLogout}
          >
            <span className="nav-mark">↪</span>
            <span>Logout</span>
          </button>

          <div className="sidebar-footnote">
            LIBRARY ADMIN
          </div>
        </div>
      </aside>

      <main className="main-area">
        {notification && (
          <div className="success-notification">
            {notification}
          </div>
        )}

        <header className="top-header">
          <button
            type="button"
            className="menu-button"
            aria-label="Toggle navigation"
            aria-expanded={isSidebarOpen}
            onClick={() =>
              setIsSidebarOpen(!isSidebarOpen)
            }
          >
            <span />
            <span />
            <span />
          </button>

          {activeSection !== 'dashboard' &&
            !selectedAuthor && (
              <button
                type="button"
                className="back-button"
                aria-label={
                  isBookFormOpen ||
                  isAuthorFormOpen
                    ? `Back to ${activeSection}`
                    : 'Back to dashboard'
                }
                title={
                  isBookFormOpen ||
                  isAuthorFormOpen
                    ? `Back to ${activeSection}`
                    : 'Back to dashboard'
                }
                onClick={handleBackNavigation}
              >
                ←
              </button>
            )}

          <div className="page-heading">
            <h1>
              {sectionDetails[activeSection][0]}
            </h1>

            <p>
              {sectionDetails[activeSection][1]}
            </p>
          </div>

          <div className="user-area">
            <div className="user-avatar">L</div>

            <div className="user-copy">
              <strong>Librarian</strong>
              <span>Administrator</span>
            </div>

            <button
              type="button"
              className="header-logout"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </header>

        <div className="page-content">
          {activeSection === 'dashboard' && (
            <>
              <div className="dashboard">
                <div className="stat-card">
                  <p className="stat-label">
                    Total Books
                  </p>

                  <p className="stat-value">
                    {books.length}
                  </p>

                  <p className="stat-detail">
                    Across your collection
                  </p>
                </div>

                <div className="stat-card">
                  <p className="stat-label">
                    Available Books
                  </p>

                  <p className="stat-value">
                    {availableBooks.length}
                  </p>

                  <p className="stat-detail">
                    Ready to borrow
                  </p>
                </div>

                <div className="stat-card">
                  <p className="stat-label">
                    Borrowed Books
                  </p>

                  <p className="stat-value">
                    {borrowedBooks.length}
                  </p>

                  <p className="stat-detail">
                    Currently checked out
                  </p>
                </div>

                <div className="stat-card">
                  <p className="stat-label">
                    Total Authors
                  </p>

                  <p className="stat-value">
                    {authors.length}
                  </p>

                  <p className="stat-detail">
                    In the catalog
                  </p>
                </div>
              </div>

              <section className="dashboard-block">
                <div className="section-heading">
                  <div>
                    <h2>Quick Actions</h2>
                    <p>Common library tasks</p>
                  </div>
                </div>

                <div className="quick-actions">
                  <button
                    type="button"
                    className="quick-action"
                    onClick={() => {
                      clearBookForm();
                      setIsBookFormOpen(true);
                      navigateTo('books');
                    }}
                  >
                    <span className="action-mark">
                      +
                    </span>

                    <span>Add Book</span>
                  </button>

                  <button
                    type="button"
                    className="quick-action"
                    onClick={() => {
                      clearAuthorForm();
                      setIsAuthorFormOpen(true);
                      navigateTo('authors');
                    }}
                  >
                    <span className="action-mark">
                      +
                    </span>

                    <span>Add Author</span>
                  </button>

                  <button
                    type="button"
                    className="quick-action"
                    onClick={() =>
                      navigateTo('books')
                    }
                  >
                    <span className="action-mark">
                      B
                    </span>

                    <span>View Books</span>
                  </button>

                  <button
                    type="button"
                    className="quick-action"
                    onClick={() =>
                      navigateTo('borrowed')
                    }
                  >
                    <span className="action-mark">
                      R
                    </span>

                    <span>
                      View Borrowed Books
                    </span>
                  </button>
                </div>
              </section>

              <div className="dashboard-lower">
                <section className="dashboard-block recent-block">
                  <div className="section-heading">
                    <div>
                      <h2>Recent Books</h2>
                      <p>
                        Available titles from your
                        collection
                      </p>
                    </div>

                    <button
                      type="button"
                      className="link-button"
                      onClick={() =>
                        navigateTo('books')
                      }
                    >
                      View all
                    </button>
                  </div>

                  {availableBooks
                    .slice(-5)
                    .reverse().length ? (
                    <div className="recent-list">
                      {availableBooks
                        .slice(-5)
                        .reverse()
                        .map((book) => (
                          <div
                            className="recent-row"
                            key={book._id}
                          >
                            <div
                              className="book-initial"
                              aria-hidden="true"
                            >
                              {book.title
                                ?.slice(0, 1)
                                ?.toUpperCase() ||
                                'B'}
                            </div>

                            <div className="recent-book-info">
                              <strong>
                                {book.title}
                              </strong>

                              <span>
                                {book.author?.name ||
                                  'Unknown author'}
                              </span>
                            </div>

                            <span className="status-badge status-available">
                              Available
                            </span>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="empty-inline">
                      No available books in the
                      catalog.
                    </p>
                  )}
                </section>

                <section className="dashboard-block overview-block">
                  <div className="section-heading">
                    <div>
                      <h2>Library Overview</h2>
                      <p>Collection status</p>
                    </div>
                  </div>

                  <div className="overview-total">
                    <span>Total books</span>
                    <strong>{books.length}</strong>
                  </div>

                  <div className="overview-row">
                    <span>
                      <i className="overview-dot available-dot" />
                      Available
                    </span>

                    <strong>
                      {availableBooks.length}
                    </strong>
                  </div>

                  <div className="overview-row">
                    <span>
                      <i className="overview-dot borrowed-dot" />
                      Borrowed
                    </span>

                    <strong>
                      {borrowedBooks.length}
                    </strong>
                  </div>

                  <div
                    className="overview-bar"
                    role="img"
                    aria-label={`${availableBooks.length} available and ${borrowedBooks.length} borrowed books`}
                  >
                    <span
                      style={{
                        width: `${
                          books.length
                            ? (availableBooks.length /
                                books.length) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </section>
              </div>
            </>
          )}

          {activeSection === 'books' && (
            <div className="toolbar-row">
              <div className="search-box">
                <input
                  type="search"
                  placeholder="Search title, author, year, genre, or status"
                  value={searchTerm}
                  onChange={(event) =>
                    setSearchTerm(
                      event.target.value
                    )
                  }
                />
              </div>

              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  clearBookForm();
                  setIsBookFormOpen(true);
                }}
              >
                Add New Book
              </button>
            </div>
          )}

          {activeSection === 'books' &&
            isBookFormOpen && (
              <div className="form-panel">
                <h2>
                  {editingId
                    ? 'Edit Book'
                    : 'Add New Book'}
                </h2>

                <form
                  className="book-form"
                  onSubmit={
                    editingId
                      ? handleUpdate
                      : handleSubmit
                  }
                >
                  <input
                    required
                    type="text"
                    placeholder="Book title"
                    value={title}
                    onChange={(event) =>
                      setTitle(event.target.value)
                    }
                  />

                  <input
                    required
                    type="number"
                    placeholder="Year"
                    value={year}
                    onChange={(event) =>
                      setYear(event.target.value)
                    }
                  />

                  <input
                    required
                    type="text"
                    placeholder="Genre"
                    value={genre}
                    onChange={(event) =>
                      setGenre(event.target.value)
                    }
                  />

                  <select
                    required
                    value={author}
                    onChange={(event) =>
                      setAuthor(event.target.value)
                    }
                  >
                    <option value="">
                      Select Author
                    </option>

                    {authors.map((author) => (
                      <option
                        key={author._id}
                        value={author._id}
                      >
                        {author.name}
                      </option>
                    ))}
                  </select>

                  <label>
                    <input
                      type="checkbox"
                      checked={available}
                      onChange={(event) =>
                        setAvailable(
                          event.target.checked
                        )
                      }
                    />

                    Available
                  </label>

                  <button
                    className="primary-button"
                    type="submit"
                  >
                    {editingId
                      ? 'Update Book'
                      : 'Add Book'}
                  </button>

                  {editingId && (
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={clearBookForm}
                    >
                      Cancel
                    </button>
                  )}
                </form>
              </div>
            )}

          {activeSection !== 'dashboard' &&
            activeSection !== 'authors' && (
              <section className="content-panel">
                <div className="section-heading">
                  <div>
                    <h2>
                      {sectionDetails[
                        activeSection
                      ][0]}
                    </h2>

                    <p>
                      {sectionDetails[
                        activeSection
                      ][1]}
                    </p>
                  </div>
                </div>

                <div className="table-container">
                  <table className="books-table">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Author</th>
                        <th>Year</th>
                        <th>Genre</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredBooks.map((book) => (
                        <tr key={book._id}>
                          <td>{book.title}</td>

                          <td>
                            {book.author?.name ||
                              'Unknown'}
                          </td>

                          <td>{book.year}</td>

                          <td>{book.genre}</td>

                          <td>
                            <span
                              className={`status-badge ${
                                book.available
                                  ? 'status-available'
                                  : 'status-borrowed'
                              }`}
                            >
                              {book.available
                                ? 'Available'
                                : 'Borrowed'}
                            </span>
                          </td>

                          <td>
                            <div className="table-actions">
                              {book.available ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleBorrow(
                                      book._id
                                    )
                                  }
                                >
                                  Borrow
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleReturn(
                                      book._id
                                    )
                                  }
                                >
                                  Return
                                </button>
                              )}

                              {activeSection ===
                                'books' && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      startEditing(
                                        book
                                      )
                                    }
                                  >
                                    Edit
                                  </button>

                                  <button
                                    type="button"
                                    className="delete-button"
                                    onClick={() =>
                                      handleDelete(
                                        book._id
                                      )
                                    }
                                  >
                                    Delete
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {filteredBooks.length === 0 && (
                    <p className="no-books">
                      {activeSection ===
                      'borrowed'
                        ? 'No borrowed books.'
                        : activeSection ===
                          'available'
                          ? 'No available books.'
                          : 'No books found.'}
                    </p>
                  )}
                </div>
              </section>
            )}

          {activeSection === 'authors' && (
            <section className="content-panel">
              {selectedAuthor ? (
                <div className="author-detail-view">
                  <button
                    type="button"
                    className="author-back-button"
                    onClick={() =>
                      setSelectedAuthor(null)
                    }
                  >
                    ← Back to Authors
                  </button>

                  <div className="author-detail-heading">
                    <div
                      className="author-detail-mark"
                      aria-hidden="true"
                    >
                      {selectedAuthor.name
                        ?.slice(0, 1)
                        ?.toUpperCase() || 'A'}
                    </div>

                    <div>
                      <h2>
                        {selectedAuthor.name}
                      </h2>

                      <p>
                        {selectedAuthorBooks.length}{' '}
                        {selectedAuthorBooks.length ===
                        1
                          ? 'book'
                          : 'books'}
                      </p>
                    </div>
                  </div>

                  {selectedAuthorBooks.length >
                  0 ? (
                    <div className="table-container">
                      <table className="books-table author-books-table">
                        <thead>
                          <tr>
                            <th>Title</th>
                            <th>Year</th>
                            <th>Genre</th>
                            <th>Status</th>
                          </tr>
                        </thead>

                        <tbody>
                          {selectedAuthorBooks.map(
                            (book) => (
                              <tr
                                key={book._id}
                              >
                                <td className="book-title-cell">
                                  {book.title}
                                </td>

                                <td>
                                  {book.year}
                                </td>

                                <td>
                                  {book.genre}
                                </td>

                                <td>
                                  <span
                                    className={`status-badge ${
                                      book.available
                                        ? 'status-available'
                                        : 'status-borrowed'
                                    }`}
                                  >
                                    {book.available
                                      ? 'Available'
                                      : 'Borrowed'}
                                  </span>
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="no-books">
                      No books found for this
                      author.
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <div className="toolbar-row">
                    <div className="search-box">
                      <input
                        type="search"
                        placeholder="Search authors"
                        value={authorSearchTerm}
                        onChange={(event) =>
                          setAuthorSearchTerm(
                            event.target.value
                          )
                        }
                      />
                    </div>

                    <button
                      type="button"
                      className="primary-button"
                      onClick={() => {
                        clearAuthorForm();
                        setIsAuthorFormOpen(true);
                      }}
                    >
                      Add Author
                    </button>
                  </div>

                  {isAuthorFormOpen && (
                    <div className="form-panel">
                      <h2>
                        {editingAuthorId
                          ? 'Edit Author'
                          : 'Add Author'}
                      </h2>

                      <form
                        className="author-form"
                        onSubmit={
                          handleAuthorSubmit
                        }
                      >
                        <input
                          required
                          type="text"
                          placeholder="Author name"
                          value={authorName}
                          onChange={(event) =>
                            setAuthorName(
                              event.target.value
                            )
                          }
                        />

                        <button
                          className="primary-button"
                          type="submit"
                        >
                          {editingAuthorId
                            ? 'Update Author'
                            : 'Add Author'}
                        </button>

                        {editingAuthorId && (
                          <button
                            type="button"
                            className="secondary-button"
                            onClick={
                              clearAuthorForm
                            }
                          >
                            Cancel
                          </button>
                        )}
                      </form>
                    </div>
                  )}

                  <div className="table-container">
                    <table className="books-table">
                      <thead>
                        <tr>
                          <th>Author</th>
                          <th>
                            Number of Books
                          </th>
                          <th>Actions</th>
                        </tr>
                      </thead>

                      <tbody>
                        {filteredAuthors.map(
                          (author) => (
                            <tr
                              key={author._id}
                            >
                              <td>
                                <button
                                  type="button"
                                  className="author-link"
                                  onClick={() =>
                                    setSelectedAuthor(
                                      author
                                    )
                                  }
                                >
                                  {author.name}
                                </button>
                              </td>

                              <td>
                                {getBookCount(
                                  author._id
                                )}
                              </td>

                              <td>
                                <div className="table-actions">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      startEditingAuthor(
                                        author
                                      )
                                    }
                                  >
                                    Edit
                                  </button>

                                  <button
                                    type="button"
                                    className="delete-button"
                                    onClick={() =>
                                      handleDeleteAuthor(
                                        author._id
                                      )
                                    }
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>

                    {authors.length === 0 && (
                      <p className="no-books">
                        No authors found.
                      </p>
                    )}
                  </div>
                </>
              )}
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;