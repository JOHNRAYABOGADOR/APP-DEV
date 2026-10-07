const STORAGE_KEY = 'institute-computing-lab-bookings';
const STATUSES = ['Pending', 'Approved', 'Rejected', 'Cancelled'];
const ACTIVE_STATUSES = ['Pending', 'Approved'];
const STATUS_TRANSITIONS = {
  Pending: ['Approved', 'Rejected', 'Cancelled'],
  Approved: ['Cancelled'],
  Rejected: [],
  Cancelled: []
};
const labCapacities = {
  'Comlab 1': 40,
  'Comlab 2': 30,
  AES: 25
};

const bookingForm = document.querySelector('#booking-form');
const bookingList = document.querySelector('#booking-list');
const reservationCount = document.querySelector('#reservation-count');
const formMessage = document.querySelector('#form-message');
const dateInput = document.querySelector('#date');
const labSelect = document.querySelector('#lab');
const studentCountInput = document.querySelector('#student-count');
const capacityNote = document.querySelector('#capacity-note');
const filterTeacher = document.querySelector('#filter-teacher');
const filterLab = document.querySelector('#filter-lab');
const filterDate = document.querySelector('#filter-date');
const filterStatus = document.querySelector('#filter-status');
const scheduleLab = document.querySelector('#schedule-lab');
const scheduleDate = document.querySelector('#schedule-date');
const scheduleList = document.querySelector('#schedule-list');

const today = new Date();
const localToday = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
  .toISOString()
  .slice(0, 10);
dateInput.min = localToday;
scheduleDate.value = localToday;

function createReservationId(date) {
  const datePart = (date || localToday).replaceAll('-', '');
  const randomPart = crypto.randomUUID().split('-')[0].toUpperCase();
  return `IC-${datePart}-${randomPart}`;
}

function loadBookings() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) throw new Error('Saved reservations are not a list.');

    return parsed.map((booking) => {
      const oldStatus = booking.status === 'Confirmed' ? 'Approved' : booking.status;
      return {
        ...booking,
        reservationId: booking.reservationId || booking.id || createReservationId(booking.date),
        purpose: booking.purpose || booking.className || 'Purpose not recorded',
        studentCount: booking.studentCount ?? null,
        status: STATUSES.includes(oldStatus) ? oldStatus : 'Pending',
        rejectionReason: booking.rejectionReason || ''
      };
    });
  } catch (error) {
    showMessage('Saved reservations could not be read. Clear this browser’s site data to start fresh.', 'error');
    console.error('Unable to load saved lab reservations:', error);
    return [];
  }
}

let bookings = loadBookings();
let rejectionFormFor = null;

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

function updateCapacityNote() {
  const capacity = labCapacities[labSelect.value];
  capacityNote.textContent = capacity
    ? `Maximum capacity: ${capacity} students.`
    : 'Select a lab to see its seat capacity.';
}

function updateDashboard() {
  document.querySelector('#count-total').textContent = bookings.length;
  STATUSES.forEach((status) => {
    const count = bookings.filter((booking) => booking.status === status).length;
    document.querySelector(`#count-${status.toLowerCase()}`).textContent = count;
  });
}

function getFilteredBookings() {
  const teacherQuery = filterTeacher.value.trim().toLocaleLowerCase();
  return bookings
    .filter((booking) =>
      booking.teacher.toLocaleLowerCase().includes(teacherQuery) &&
      (!filterLab.value || booking.lab === filterLab.value) &&
      (!filterDate.value || booking.date === filterDate.value) &&
      (!filterStatus.value || booking.status === filterStatus.value)
    )
    .sort((a, b) => `${a.date}T${a.startTime}`.localeCompare(`${b.date}T${b.startTime}`));
}

function appendDetail(details, label, value) {
  const row = document.createElement('div');
  row.className = 'booking-detail';
  const term = document.createElement('dt');
  term.textContent = label;
  const description = document.createElement('dd');
  description.textContent = value;
  row.append(term, description);
  details.append(row);
}

function createBookingCard(booking) {
  const card = document.createElement('article');
  card.className = `booking-item booking-${booking.status.toLowerCase()}`;

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

  const details = document.createElement('dl');
  details.className = 'booking-details';
  appendDetail(details, 'Reservation ID', booking.reservationId);
  appendDetail(details, 'Teacher', booking.teacher);
  appendDetail(details, 'Time', `${formatTime(booking.startTime)} – ${formatTime(booking.endTime)}`);
  appendDetail(details, 'Purpose', booking.purpose);
  appendDetail(details, 'Students', booking.studentCount ?? 'Not recorded');
  if (booking.rejectionReason) appendDetail(details, 'Rejection reason', booking.rejectionReason);
  info.append(topline, details);

  const actions = document.createElement('div');
  actions.className = 'booking-actions';
  const status = document.createElement('span');
  status.className = `status-badge status-${booking.status.toLowerCase()}`;
  status.textContent = booking.status;
  actions.append(status);

  if (booking.status === 'Pending') {
    const approve = document.createElement('button');
    approve.className = 'action-button approve-button';
    approve.type = 'button';
    approve.textContent = 'Approve';
    approve.addEventListener('click', () => transitionBooking(booking.reservationId, 'Approved'));

    const reject = document.createElement('button');
    reject.className = 'action-button reject-button';
    reject.type = 'button';
    reject.textContent = 'Reject';
    reject.addEventListener('click', () => {
      rejectionFormFor = rejectionFormFor === booking.reservationId ? null : booking.reservationId;
      renderBookings();
    });
    actions.append(approve, reject);
  }

  if (booking.status === 'Pending' || booking.status === 'Approved') {
    const cancel = document.createElement('button');
    cancel.className = 'cancel-button';
    cancel.type = 'button';
    cancel.textContent = 'Cancel';
    cancel.setAttribute('aria-label', `Cancel reservation ${booking.reservationId}`);
    cancel.addEventListener('click', () => transitionBooking(booking.reservationId, 'Cancelled'));
    actions.append(cancel);
  }

  card.append(accent, info, actions);

  if (rejectionFormFor === booking.reservationId && booking.status === 'Pending') {
    const rejectionForm = document.createElement('form');
    rejectionForm.className = 'rejection-form';
    const label = document.createElement('label');
    label.textContent = 'Reason for rejection';
    const reason = document.createElement('textarea');
    reason.name = 'reason';
    reason.rows = 2;
    reason.maxLength = 250;
    reason.required = true;
    reason.placeholder = 'Explain why this reservation is rejected';
    label.append(reason);
    const submit = document.createElement('button');
    submit.className = 'action-button reject-button';
    submit.type = 'submit';
    submit.textContent = 'Confirm rejection';
    const cancel = document.createElement('button');
    cancel.className = 'cancel-button';
    cancel.type = 'button';
    cancel.textContent = 'Keep pending';
    cancel.addEventListener('click', () => {
      rejectionFormFor = null;
      renderBookings();
    });
    rejectionForm.append(label, submit, cancel);
    rejectionForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const rejectionReason = reason.value.trim();
      if (!rejectionReason) {
        reason.focus();
        return;
      }
      transitionBooking(booking.reservationId, 'Rejected', rejectionReason);
    });
    card.append(rejectionForm);
  }

  return card;
}

function renderBookings() {
  const filteredBookings = getFilteredBookings();
  reservationCount.textContent = `${filteredBookings.length} ${filteredBookings.length === 1 ? 'reservation' : 'reservations'}`;
  bookingList.replaceChildren();

  if (filteredBookings.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state compact-empty-state';
    const message = document.createElement('p');
    message.textContent = bookings.length ? 'No reservations match these filters.' : 'No reservations yet.';
    emptyState.append(message);
    bookingList.append(emptyState);
    return;
  }

  filteredBookings.forEach((booking) => bookingList.append(createBookingCard(booking)));
}

function renderSchedule() {
  scheduleList.replaceChildren();
  const scheduledBookings = bookings
    .filter((booking) =>
      booking.lab === scheduleLab.value &&
      booking.date === scheduleDate.value &&
      ACTIVE_STATUSES.includes(booking.status)
    )
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  if (scheduledBookings.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state compact-empty-state';
    const message = document.createElement('p');
    message.textContent = 'No pending or approved reservations for this lab and date.';
    emptyState.append(message);
    scheduleList.append(emptyState);
    return;
  }

  scheduledBookings.forEach((booking) => {
    const item = document.createElement('article');
    item.className = 'schedule-item';
    const time = document.createElement('strong');
    time.className = 'schedule-time';
    time.textContent = `${formatTime(booking.startTime)} – ${formatTime(booking.endTime)}`;
    const details = document.createElement('div');
    details.className = 'schedule-item-details';
    const purpose = document.createElement('strong');
    purpose.textContent = booking.purpose;
    const teacher = document.createElement('span');
    teacher.textContent = `${booking.teacher} · ${booking.studentCount ?? '—'} students · ${booking.reservationId}`;
    details.append(purpose, teacher);
    const status = document.createElement('span');
    status.className = `status-badge status-${booking.status.toLowerCase()}`;
    status.textContent = booking.status;
    item.append(time, details, status);
    scheduleList.append(item);
  });
}

function renderAll() {
  updateDashboard();
  renderBookings();
  renderSchedule();
}

function transitionBooking(reservationId, newStatus, rejectionReason = '') {
  const booking = bookings.find((item) => item.reservationId === reservationId);
  if (!booking || !STATUS_TRANSITIONS[booking.status]?.includes(newStatus)) return;
  if (newStatus === 'Rejected' && !rejectionReason.trim()) return;

  const previousBookings = bookings.map((item) => ({ ...item }));
  booking.status = newStatus;
  if (newStatus === 'Rejected') booking.rejectionReason = rejectionReason.trim();
  rejectionFormFor = null;

  if (!saveBookings()) {
    bookings = previousBookings;
    return;
  }
  renderAll();
}

bookingForm.addEventListener('submit', (event) => {
  event.preventDefault();
  clearMessage();

  const formData = new FormData(bookingForm);
  const booking = {
    reservationId: createReservationId(formData.get('date')),
    teacher: formData.get('teacher').trim(),
    lab: formData.get('lab'),
    date: formData.get('date'),
    startTime: formData.get('startTime'),
    endTime: formData.get('endTime'),
    purpose: formData.get('purpose').trim(),
    studentCount: Number(formData.get('studentCount')),
    status: 'Pending',
    rejectionReason: ''
  };

  if (!booking.teacher || !booking.purpose) {
    showMessage('Enter a teacher name and reservation purpose.', 'error');
    return;
  }

  const capacity = labCapacities[booking.lab];
  if (!Number.isInteger(booking.studentCount) || booking.studentCount < 1 || booking.studentCount > capacity) {
    showMessage(`Enter a student count from 1 to ${capacity} for ${booking.lab}.`, 'error');
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
    ACTIVE_STATUSES.includes(existing.status) &&
    booking.startTime < existing.endTime &&
    booking.endTime > existing.startTime
  );

  if (conflict) {
    showMessage(
      `${booking.lab} is unavailable: reservation ${conflict.reservationId} for ${conflict.teacher} is ${conflict.status.toLowerCase()} from ${formatTime(conflict.startTime)} to ${formatTime(conflict.endTime)}.`,
      'error'
    );
    return;
  }

  bookings.push(booking);
  if (!saveBookings()) {
    bookings = bookings.filter((savedBooking) => savedBooking.reservationId !== booking.reservationId);
    return;
  }

  renderAll();
  bookingForm.reset();
  updateCapacityNote();
  showMessage(`Reservation ${booking.reservationId} submitted and is pending coordinator approval.`, 'success');
});

document.querySelector('#filter-form').addEventListener('submit', (event) => event.preventDefault());
[filterTeacher, filterLab, filterDate, filterStatus].forEach((control) => {
  control.addEventListener('input', renderBookings);
  control.addEventListener('change', renderBookings);
});

labSelect.addEventListener('change', updateCapacityNote);
scheduleLab.addEventListener('change', renderSchedule);
scheduleDate.addEventListener('change', renderSchedule);
updateCapacityNote();
renderAll();
