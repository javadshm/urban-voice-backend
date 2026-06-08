const API_BASE = 'http://localhost:5000';

const refreshBtn = document.getElementById('refreshBtn');
const statusText = document.getElementById('statusText');
const submissionList = document.getElementById('submissionList');
const detailsCard = document.getElementById('detailsCard');
const submissionDetails = document.getElementById('submissionDetails');
const sendResponseBtn = document.getElementById('sendResponseBtn');
const markHandledBtn = document.getElementById('markHandledBtn');
const authorityNameInput = document.getElementById('authorityName');
const responseTextInput = document.getElementById('responseText');

let selectedSubmissionId = null;

async function loadPendingSubmissions() {
  statusText.textContent = 'Loading...';
  submissionList.innerHTML = '';

  try {
    const response = await fetch(`${API_BASE}/api/authority/pending`);
    const data = await response.json();

    if (!response.ok) {
      statusText.textContent = data.error || 'Failed to fetch submissions';
      return;
    }

    const submissions = data.submissions || [];
    if (submissions.length === 0) {
      statusText.textContent = 'No pending submissions right now.';
      return;
    }

    statusText.textContent = `${submissions.length} pending submissions loaded.`;

    submissions.forEach((submission) => {
      const li = document.createElement('li');
      const link = document.createElement('span');
      link.className = 'link-like';
      link.textContent = `#${submission.id} - ${submission.issue_category || 'uncategorized'} (${submission.status})`;
      link.onclick = () => loadSubmissionDetails(submission.id);
      li.appendChild(link);
      submissionList.appendChild(li);
    });
  } catch (error) {
    statusText.textContent = 'Connection failed. Is backend running?';
  }
}

async function loadSubmissionDetails(submissionId) {
  selectedSubmissionId = submissionId;
  detailsCard.hidden = false;
  submissionDetails.textContent = 'Loading details...';

  try {
    const response = await fetch(`${API_BASE}/api/authority/${submissionId}`);
    const data = await response.json();

    if (!response.ok) {
      submissionDetails.textContent = data.error || 'Could not load details';
      return;
    }

    submissionDetails.textContent = JSON.stringify(data.submission, null, 2);
  } catch (error) {
    submissionDetails.textContent = 'Connection failed while loading details';
  }
}

async function sendResponse(markHandledOnly = false) {
  if (!selectedSubmissionId) {
    statusText.textContent = 'Select a submission first.';
    return;
  }

  const authorityName = authorityNameInput.value.trim();
  const responseText = responseTextInput.value.trim();

  if (!authorityName) {
    statusText.textContent = 'Authority name is required.';
    return;
  }

  if (!markHandledOnly && !responseText) {
    statusText.textContent = 'Response text is required.';
    return;
  }

  const endpoint = markHandledOnly
    ? `${API_BASE}/api/authority/${selectedSubmissionId}/mark-handled`
    : `${API_BASE}/api/authority/${selectedSubmissionId}/respond`;

  const body = markHandledOnly
    ? { authorityName }
    : { authorityName, responseText };

  statusText.textContent = 'Sending update...';

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    if (!response.ok) {
      statusText.textContent = data.error || 'Failed to update submission';
      return;
    }

    statusText.textContent = markHandledOnly
      ? 'Submission marked as handled.'
      : 'Response sent successfully.';

    responseTextInput.value = '';
    await loadPendingSubmissions();
    await loadSubmissionDetails(selectedSubmissionId);
  } catch (error) {
    statusText.textContent = 'Request failed. Is backend running?';
  }
}

refreshBtn.onclick = loadPendingSubmissions;
sendResponseBtn.onclick = () => sendResponse(false);
markHandledBtn.onclick = () => sendResponse(true);

loadPendingSubmissions();
