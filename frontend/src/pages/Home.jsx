import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useAuth } from '../context/AuthContext.jsx';
import CalendarPicker from '../components/CalendarPicker.jsx';
import { fetchTimers, createTimer, updateTimer, deleteTimer } from '../services/api.js';

dayjs.extend(relativeTime);

const defaultForm = { title: '', description: '', targetDate: dayjs().format('YYYY-MM-DDTHH:mm') };

const Home = () => {
  const { user, logout } = useAuth();
  const [timers, setTimers] = useState([]);
  const [form, setForm] = useState(defaultForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [activeTab, setActiveTab] = useState('my');
  const [sortBy, setSortBy] = useState('soonest');
  const [viewMode, setViewMode] = useState('grid');
  const [showDashboard, setShowDashboard] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const loadTimers = async () => {
      setIsFetching(true);
      setError('');
      try {
        const { data } = await fetchTimers({ signal: controller.signal, params: { status: 'all' } });
        setTimers(data);
      } catch (err) {
        if (err.name !== 'CanceledError') {
          setError(err.response?.data?.message || 'Unable to load timers');
        }
      } finally {
        setIsFetching(false);
      }
    };

    loadTimers();

    return () => controller.abort();
  }, []);

  const countdowns = useMemo(() => {
    return timers.reduce((acc, timer) => {
      acc[timer._id] = formatCountdown(timer.targetDate);
      return acc;
    }, {});
  }, [timers, tick]);

  const filteredTimers = useMemo(() => {
    const now = dayjs();
    let list = timers;

    if (activeTab === 'my') {
      list = list.filter((timer) => timer.status !== 'deleted');
    } else if (activeTab === 'upcoming') {
      list = list.filter((timer) => timer.status !== 'deleted' && dayjs(timer.targetDate).isAfter(now));
    } else if (activeTab === 'deleted') {
      list = list.filter((timer) => timer.status === 'deleted');
    }

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      list = list.filter(
        (timer) =>
          timer.title.toLowerCase().includes(lower) ||
          (timer.description || '').toLowerCase().includes(lower)
      );
    }

    const sorted = [...list];
    sorted.sort((a, b) => {
      if (sortBy === 'soonest') {
        return dayjs(a.targetDate).valueOf() - dayjs(b.targetDate).valueOf();
      }
      if (sortBy === 'latest') {
        return dayjs(b.targetDate).valueOf() - dayjs(a.targetDate).valueOf();
      }
      return a.title.localeCompare(b.title);
    });

    return sorted;
  }, [timers, activeTab, searchTerm, sortBy]);

  const stats = useMemo(() => {
    const total = timers.length;
    const active = timers.filter((timer) => timer.status !== 'deleted').length;
    const deleted = timers.filter((timer) => timer.status === 'deleted').length;
    const upcoming = timers.filter(
      (timer) => timer.status !== 'deleted' && dayjs(timer.targetDate).isAfter(dayjs())
    ).length;
    return { total, active, deleted, upcoming };
  }, [timers]);

  const previewTimers = useMemo(() => {
    return timers
      .filter((timer) => timer.status !== 'deleted' && dayjs(timer.targetDate).isAfter(dayjs()))
      .sort((a, b) => dayjs(a.targetDate).valueOf() - dayjs(b.targetDate).valueOf())
      .slice(0, 3);
  }, [timers]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const openCreateModal = () => {
    setForm({ ...defaultForm, targetDate: dayjs().format('YYYY-MM-DDTHH:mm') });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (timer) => {
    setForm({
      title: timer.title,
      description: timer.description || '',
      targetDate: timer.targetDate ? dayjs(timer.targetDate).format('YYYY-MM-DDTHH:mm') : ''
    });
    setEditingId(timer._id);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setForm(defaultForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.targetDate) return;

    setLoading(true);
    setError('');

    try {
      const payload = { ...form };
      const { data } = editingId
        ? await updateTimer(editingId, payload)
        : await createTimer(payload);
      setTimers(data);
      setForm(defaultForm);
      setEditingId(null);
      setIsModalOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save timer');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (timerId) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await deleteTimer(timerId);
      setTimers(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete timer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <nav className="app-nav">
        <button className="brand" type="button" onClick={() => setShowDashboard(false)}>
          <span>Countdowns</span>
        </button>
        <div className="nav-actions">
          <button
            className={`nav-link ${showDashboard ? 'active' : ''}`}
            type="button"
            onClick={() => setShowDashboard(true)}
          >
            My Timers
          </button>
          <button className="outline-btn" type="button" onClick={logout}>
            Logout
          </button>
        </div>
      </nav>

      {!showDashboard && (
        <>
          <header className="hero landing-hero">
            <p className="hero-title">My Timers</p>
            <h1>
              Never miss a milestone, <br />
              {user?.name ? `${user.name}.` : 'ever again.'}
            </h1>
            <p className="subtitle">
              Build countdowns for birthdays, launches, and every unforgettable moment.
            </p>
            <div className="hero-actions">
              <button className="primary-btn" type="button" onClick={openCreateModal}>
                Start a Timer
              </button>
              <button className="ghost-btn" type="button" onClick={() => setShowDashboard(true)}>
                View My Timers
              </button>
            </div>
          </header>

          <section className="panel landing-panel stats-grid">
            <article className="stat-card">
              <p className="stat-label">Active Timers</p>
              <h2>{stats.active}</h2>
              <p className="stat-sub">Currently tracking</p>
            </article>
            <article className="stat-card">
              <p className="stat-label">Upcoming Events</p>
              <h2>{stats.upcoming}</h2>
              <p className="stat-sub">Within your calendar</p>
            </article>
            <article className="stat-card">
              <p className="stat-label">Archived</p>
              <h2>{stats.deleted}</h2>
              <p className="stat-sub">Soft deleted timers</p>
            </article>
          </section>

          <section className="panel landing-panel">
            <div className="landing-panel__header">
              <div>
                <h3>Upcoming at a glance</h3>
                <p>Preview the next three countdowns in your neon queue.</p>
              </div>
              <button className="secondary-btn" type="button" onClick={() => setShowDashboard(true)}>
                Manage timers
              </button>
            </div>
            {previewTimers.length === 0 ? (
              <p className="empty-state">No upcoming timers yet. Create one to light up this panel.</p>
            ) : (
              <ul className="preview-list">
                {previewTimers.map((timer) => (
                  <li key={timer._id}>
                    <div>
                      <p className="preview-title">{timer.title}</p>
                      <p className="preview-date">{dayjs(timer.targetDate).format('MMM D, YYYY • h:mm A')}</p>
                    </div>
                    <span className="badge">{countdowns[timer._id]}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      {showDashboard && (
        <>
          <section className="panel search-panel">
            <input
              className="search-input"
              placeholder="Search timers by title or description"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="filters">
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="soonest">Sort: Soonest</option>
                <option value="latest">Sort: Latest</option>
                <option value="alpha">Sort: A-Z</option>
              </select>
              <span className="hint">{isFetching ? 'Syncing...' : `${stats.total} total timers`}</span>
            </div>
          </section>

          <section className="panel tabs-panel">
            {[
              { id: 'my', label: `My Timers (${stats.active})` },
              { id: 'upcoming', label: `Upcoming (${stats.upcoming})` },
              { id: 'deleted', label: `Deleted (${stats.deleted})` }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </section>

          {error && <p className="error">{error}</p>}

          <section className="panel timers-panel">
            <div className="panel-header">
              <div>
                <h2>Live Countdowns</h2>
                <p>Switch between grid and table views to manage everything your way.</p>
              </div>
              <div className="header-actions">
                <div className="view-toggle">
                  <button
                    type="button"
                    className={viewMode === 'grid' ? 'active' : ''}
                    onClick={() => setViewMode('grid')}
                  >
                    Grid
                  </button>
                  <button
                    type="button"
                    className={viewMode === 'table' ? 'active' : ''}
                    onClick={() => setViewMode('table')}
                  >
                    Table
                  </button>
                </div>
                <button className="secondary-btn" type="button" onClick={openCreateModal}>
                  New Timer
                </button>
              </div>
            </div>

            {filteredTimers.length === 0 && (
              <p className="empty-state">Nothing to see here. Try another filter or create a timer.</p>
            )}

            {viewMode === 'grid' ? (
              <div className="timers-grid">
                {filteredTimers.map((timer) => (
                  <article key={timer._id} className="timer-card">
                    <div className="timer-card__meta">
                      <p className="timer-date">{dayjs(timer.targetDate).format('MMM D, YYYY • h:mm A')}</p>
                      <span className="badge">{countdowns[timer._id]}</span>
                    </div>
                    <h3>{timer.title}</h3>
                    {timer.description && <p className="timer-description">{timer.description}</p>}
                    {timer.status !== 'deleted' ? (
                      <div className="timer-actions">
                        <button type="button" className="ghost-btn" onClick={() => openEditModal(timer)}>
                          Edit
                        </button>
                        <button type="button" className="danger-btn" onClick={() => handleDelete(timer._id)}>
                          Delete
                        </button>
                      </div>
                    ) : (
                      <p className="deleted-label">Deleted on {dayjs(timer.deletedAt).format('MMM D, YYYY')}</p>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="timers-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Description</th>
                      <th>Countdown</th>
                      <th>Target</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTimers.map((timer) => (
                      <tr key={timer._id}>
                        <td>{timer.title}</td>
                        <td>{timer.description || '—'}</td>
                        <td>{countdowns[timer._id]}</td>
                        <td>{dayjs(timer.targetDate).format('MMM D, YYYY h:mm A')}</td>
                        <td className={`status ${timer.status}`}>{timer.status}</td>
                        <td>
                          {timer.status !== 'deleted' ? (
                            <div className="table-actions">
                              <button type="button" onClick={() => openEditModal(timer)}>
                                Edit
                              </button>
                              <button type="button" onClick={() => handleDelete(timer._id)}>
                                Delete
                              </button>
                            </div>
                          ) : (
                            <span>{dayjs(timer.deletedAt).format('MMM D')}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <button className="floating-btn" type="button" onClick={openCreateModal}>
            +
          </button>
        </>
      )}

      {isModalOpen && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? 'Update Timer' : 'Create Timer'}</h2>
              <button className="close-btn" type="button" onClick={closeModal}>
                ×
              </button>
            </div>
            <form className="modal-form" onSubmit={handleSubmit}>
              <label>
                Title
                <input name="title" value={form.title} onChange={handleChange} placeholder="Birthday bash" required />
              </label>
              <label>
                Description
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Party with the crew"
                />
              </label>
              <label>
                Target date & time
                <CalendarPicker
                  value={form.targetDate}
                  onChange={(nextValue) => setForm((prev) => ({ ...prev, targetDate: nextValue }))}
                />
              </label>
              <button className="primary-btn" type="submit" disabled={loading}>
                {loading ? 'Saving...' : editingId ? 'Save changes' : 'Create timer'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const formatCountdown = (targetDate) => {
  const now = dayjs();
  const target = dayjs(targetDate);

  if (!target.isValid()) return 'Invalid date';

  const diff = target.diff(now);
  if (diff <= 0) {
    return 'Event elapsed';
  }

  const days = target.diff(now, 'day');
  const hours = target.diff(now.add(days, 'day'), 'hour');
  const minutes = target.diff(now.add(days, 'day').add(hours, 'hour'), 'minute');
  const seconds = target.diff(
    now.add(days, 'day').add(hours, 'hour').add(minutes, 'minute'),
    'second'
  );

  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
};

export default Home;
