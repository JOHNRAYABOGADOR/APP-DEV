const STORAGE_KEY = 'institute-computing-lab-bookings';
const bookingForm = document.querySelector('#booking-form');
const bookingList = document.querySelector('#booking-list');
const reservationCount = document.querySelector('#reservation-count');
const formMessage = document.querySelector('#form-message');
const dateInput = document.querySelector('#date');

const today = new Date();
const localToday = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
  .toISOString()
  .slice(0, 10);
dateInput.min = localToday;

function loadBookings() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) throw new Error('Saved reservations are not a list.');
    return parsed;
  } catch (error) {
    showMessage('Saved reservations could not be read. Clear this browser’s site data to start fresh.', 'error');
    console.error('Unable to load saved lab reservations:', error);
    return [];
  }
}

let bookings = loadBookings();

function saveBookings() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
    return true;
  } catch (error) {
    showMessage('Your reservation could not be saved in this browser. Check available browser storage and try again.', 'error');
    console.error('Unable to save lab reservations:', error);
    return false;
  }
}

function showMessage(message, type) {
  formMessage.textContent = message;
  formMessage.className = `form-message is-visible is-${type}`;
}

function clearMessage() {
  formMessage.textContent = '';
  formMessage.className = 'form-message';
}

function formatDate(date) {
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function formatTime(time) {
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function renderBookings() {
  const sortedBookings = [...bookings].sort((a, b) =>
    `${a.date}T${a.startTime}`.localeCompare(`${b.date}T${b.startTime}`)
  );

  reservationCount.textContent = `${bookings.length} ${bookings.length === 1 ? 'booking' : 'bookings'}`;
  bookingList.replaceChildren();

  if (sortedBookings.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.innerHTML = '<div><span class="empty-icon" aria-hidden="true">▦</span><strong>No reservations yet</strong><p>Your confirmed lab bookings will appear here.</p></div>';
    bookingList.append(emptyState);
    return;
  }

  sortedBookings.forEach((booking) => {
    const card = document.createElement('article');
    card.className = 'booking-item';

    const accent = document.createElement('span');
    accent.className = 'booking-accent';
    accent.setAttribute('aria-hidden', 'true');

    const info = document.createElement('div');
    info.className = 'booking-info';

    const topline = document.createElement('div');
    topline.className = 'booking-topline';
    const lab = document.createElement('span');
    lab.className = 'booking-lab';
    lab.textContent = booking.lab;
    const date = document.createElement('span');
    date.className = 'booking-date';
    date.textContent = formatDate(booking.date);
    topline.append(lab, date);

    const className = document.createElement('p');
    className.className = 'booking-class';
    className.textContent = booking.className;
    const meta = document.createElement('p');
    meta.className = 'booking-meta';
    meta.textContent = `${formatTime(booking.startTime)} – ${formatTime(booking.endTime)} · ${booking.teacher}`;
    info.append(topline, className, meta);

    const cancel = document.createElement('button');
    cancel.className = 'cancel-button';
    cancel.type = 'button';
    cancel.textContent = 'Cancel';
    cancel.setAttribute('aria-label', `Cancel ${booking.lab} booking for ${booking.className}`);
    cancel.addEventListener('click', () => cancelBooking(booking.id));

    card.append(accent, info, cancel);
    bookingList.append(card);
  });
}

function cancelBooking(id) {
  const previousBookings = bookings;
  bookings = bookings.filter((booking) => booking.id !== id);
  if (!saveBookings()) {
    bookings = previousBookings;
    return;
  }
  renderBookings();
}

bookingForm.addEventListener('submit', (event) => {
  event.preventDefault();
  clearMessage();

  const formData = new FormData(bookingForm);
  const booking = {
    id: crypto.randomUUID(),
    teacher: formData.get('teacher').trim(),
    className: formData.get('className').trim(),
    lab: formData.get('lab'),
    date: formData.get('date'),
    startTime: formData.get('startTime'),
    endTime: formData.get('endTime')
  };

  if (!booking.teacher || !booking.className) {
    showMessage('Enter a teacher name and class or subject.', 'error');
    return;
  }

  if (booking.startTime >= booking.endTime) {
    showMessage('The end time must be later than the start time.', 'error');
    return;
  }

  if (booking.date < localToday) {
    showMessage('Choose today or a future date for your reservation.', 'error');
    return;
  }

  const conflict = bookings.find((existing) =>
    existing.lab === booking.lab &&
    existing.date === booking.date &&
    booking.startTime < existing.endTime &&
    booking.endTime > existing.startTime
  );

  if (conflict) {
    showMessage(
      `${booking.lab} is already reserved from ${formatTime(conflict.startTime)} to ${formatTime(conflict.endTime)} on ${formatDate(conflict.date)}. Choose another time or lab.`,
      'error'
    );
    return;
  }

  bookings.push(booking);
  if (!saveBookings()) {
    bookings = bookings.filter((savedBooking) => savedBooking.id !== booking.id);
    return;
  }

  renderBookings();
  bookingForm.reset();
  showMessage('Reservation confirmed. Your lab has been added to the schedule.', 'success');
});

renderBookings();
