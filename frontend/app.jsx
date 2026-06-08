const API_BASE = window.ENV_API_BASE || 'http://localhost:5000';

const STATUS_ORDER = ['pending', 'processing', 'transcribed', 'responded'];

function App() {
  const [route, setRoute] = React.useState(window.location.hash || '#/');

  React.useEffect(() => {
    const onHashChange = () => setRoute(window.location.hash || '#/');
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  return (
    <div className="container">
      <h1>Urban Voice</h1>
      <div className="card">
        <span className="nav-link" onClick={() => (window.location.hash = '#/')}>Landing</span>
        <span className="nav-link" onClick={() => (window.location.hash = '#/submit')}>Voice Submission</span>
        <span className="nav-link" onClick={() => (window.location.hash = '#/dashboard')}>Dashboard</span>
      </div>

      {route === '#/submit' && <SubmissionPage />}
      {route === '#/dashboard' && <UserDashboard />}
      {(route === '#/' || route === '') && <LandingPage />}
    </div>
  );
}

function LandingPage() {
  const submissionUrl = `${window.location.origin}${window.location.pathname}#/submit`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(submissionUrl)}`;

  return (
    <div className="card">
      <h2>Welcome</h2>
      <p>Scan this QR code to open the voice submission page.</p>
      <img alt="QR code to voice submission" src={qrUrl} width="220" height="220" />
      <p><strong>Direct link:</strong> <a href={submissionUrl}>{submissionUrl}</a></p>
    </div>
  );
}

function AuthForm({ onToken }) {
  const [mode, setMode] = React.useState('login');
  const [form, setForm] = React.useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    nativeLanguage: 'en'
  });
  const [message, setMessage] = React.useState('');

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async (e) => {
    e.preventDefault();
    setMessage('Loading...');

    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const payload = mode === 'login'
      ? { email: form.email, password: form.password }
      : form;

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error || 'Authentication failed');
        return;
      }

      localStorage.setItem('urban_voice_token', data.token);
      onToken(data.token);
      setMessage('Success! You are logged in.');
    } catch (error) {
      setMessage('Request failed. Check backend URL and try again.');
    }
  };

  return (
    <div className="card">
      <h3>{mode === 'login' ? 'Login' : 'Register'}</h3>
      <form onSubmit={submit}>
        <label>Email</label>
        <input value={form.email} onChange={(e) => update('email', e.target.value)} required />

        <label>Password</label>
        <input type="password" value={form.password} onChange={(e) => update('password', e.target.value)} required />

        {mode === 'register' && (
          <>
            <label>Full Name</label>
            <input value={form.fullName} onChange={(e) => update('fullName', e.target.value)} required />

            <label>Phone</label>
            <input value={form.phone} onChange={(e) => update('phone', e.target.value)} required />

            <label>Native Language</label>
            <select value={form.nativeLanguage} onChange={(e) => update('nativeLanguage', e.target.value)}>
              <option value="en">English</option>
              <option value="de">German</option>
            </select>
          </>
        )}

        <button type="submit">{mode === 'login' ? 'Login' : 'Create account'}</button>
        <button type="button" className="secondary" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
          Switch to {mode === 'login' ? 'Register' : 'Login'}
        </button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}

function SubmissionPage() {
  const [token, setToken] = React.useState(localStorage.getItem('urban_voice_token') || '');
  const [language, setLanguage] = React.useState('en');
  const [recorderState, setRecorderState] = React.useState('idle');
  const [audioBlob, setAudioBlob] = React.useState(null);
  const [audioUrl, setAudioUrl] = React.useState('');
  const [message, setMessage] = React.useState('');
  const mediaRecorderRef = React.useRef(null);
  const chunksRef = React.useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => chunksRef.current.push(event.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
      };

      mediaRecorder.start();
      setRecorderState('recording');
      setMessage('Recording started...');
    } catch (error) {
      setMessage('Microphone access failed. Please allow microphone permission.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecorderState('stopped');
      setMessage('Recording stopped. You can now upload.');
    }
  };

  const uploadVoice = async () => {
    if (!token) {
      setMessage('Please login first.');
      return;
    }

    if (!audioBlob) {
      setMessage('Please record audio first.');
      return;
    }

    const formData = new FormData();
    formData.append('voice', audioBlob, 'voice-recording.webm');
    formData.append('language', language);

    try {
      const response = await fetch(`${API_BASE}/api/submissions/upload`, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token },
        body: formData
      });

      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error || 'Upload failed.');
        return;
      }

      setMessage(`Submission uploaded! ID: ${data.submission.id}`);
      setAudioBlob(null);
      setAudioUrl('');
      setRecorderState('idle');
    } catch (error) {
      setMessage('Upload failed. Check backend and CORS settings.');
    }
  };

  return (
    <>
      {!token && <AuthForm onToken={setToken} />}

      <div className="card">
        <h2>Voice Submission</h2>
        <label>Language</label>
        <select value={language} onChange={(e) => setLanguage(e.target.value)}>
          <option value="en">English</option>
          <option value="de">German</option>
        </select>

        <button onClick={startRecording} disabled={recorderState === 'recording'}>Start Recording</button>
        <button className="secondary" onClick={stopRecording} disabled={recorderState !== 'recording'}>Stop Recording</button>
        <button onClick={uploadVoice}>Upload Voice</button>

        {audioUrl && (
          <div>
            <p>Preview your recording:</p>
            <audio controls src={audioUrl}></audio>
          </div>
        )}

        {message && <p>{message}</p>}
      </div>
    </>
  );
}

function SubmissionProgress({ status }) {
  const activeIndex = Math.max(STATUS_ORDER.indexOf(status), 0);
  return (
    <div className="status-bar">
      {STATUS_ORDER.map((step, index) => (
        <div key={step} className={`status-step ${index <= activeIndex ? 'active' : ''}`} title={step}></div>
      ))}
    </div>
  );
}

function UserDashboard() {
  const [token, setToken] = React.useState(localStorage.getItem('urban_voice_token') || '');
  const [submissions, setSubmissions] = React.useState([]);
  const [message, setMessage] = React.useState('');

  const loadSubmissions = async () => {
    if (!token) {
      setMessage('Please login first to see your dashboard.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/submissions`, {
        headers: { Authorization: 'Bearer ' + token }
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error || 'Could not load dashboard.');
        return;
      }
      setSubmissions(data.submissions || []);
      setMessage('Dashboard updated.');
    } catch (error) {
      setMessage('Could not fetch dashboard data.');
    }
  };

  React.useEffect(() => {
    if (token) {
      loadSubmissions();
    }
  }, [token]);

  return (
    <>
      {!token && <AuthForm onToken={setToken} />}
      <div className="card">
        <h2>User Dashboard</h2>
        <button onClick={loadSubmissions}>Refresh</button>
        {message && <p>{message}</p>}
      </div>

      {submissions.map((submission) => (
        <div className="card" key={submission.id}>
          <h3>Submission #{submission.id}</h3>
          <p><strong>Status:</strong> {submission.status}</p>
          <SubmissionProgress status={submission.status} />
          <p><strong>Language:</strong> {submission.language}</p>
          <p><strong>Category:</strong> {submission.issue_category || 'Not categorized yet'}</p>
          <p><strong>Transcription:</strong> {submission.transcription || 'Not available yet'}</p>
          <p><strong>Translation:</strong> {submission.transcription_translated || 'Not available yet'}</p>
          <p><strong>Authority response:</strong> {submission.response_text || 'No response yet'}</p>
        </div>
      ))}
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
