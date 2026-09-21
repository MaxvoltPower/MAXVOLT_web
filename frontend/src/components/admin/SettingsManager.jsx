import { useEffect, useState } from 'react';
import { api } from '@lib/api';
import { useToast } from '@components/ui/Toast';
import Button from '@components/ui/Button';
import Input from '@components/ui/Input';

const KEYS = {
  's-name': 'name',
  's-tagline': 'tagline',
  's-phone': 'phone',
  's-whatsapp': 'whatsapp',
  's-email': 'email',
  's-address': 'address',
  's-chatApiKey': 'chatApiKey',
  's-chatModel': 'chatModel',
};

export default function SettingsManager() {
  const { showToast } = useToast();
  const [values, setValues] = useState({
    name: '',
    tagline: '',
    phone: '',
    whatsapp: '',
    email: '',
    address: '',
    chatApiKey: '',
    chatModel: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState('');
  const [testStatus, setTestStatus] = useState(''); // '', 'loading', 'success', 'error'

  useEffect(() => {
    api
      .getSettings()
      .then((data) => {
        const merged = { ...values };
        for (const id in KEYS) {
          const key = KEYS[id];
          if (data && data[key] !== undefined && data[key] !== null) {
            merged[key] = data[key];
          }
        }
        setValues(merged);
      })
      .catch((err) => console.warn('Failed to load settings:', err.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (key, value) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.saveSettings(values);
      showToast('✓ Settings saved', 'success');
    } catch (err) {
      showToast('✗ ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleTestChat = async () => {
    setTestStatus('loading');
    setTestResult('Testing…');
    try {
      const data = await api.chat({
        message: 'Say hi in one short sentence.',
        history: [],
        apiKeyOverride: values.chatApiKey?.trim() || undefined,
        modelOverride: values.chatModel?.trim() || undefined,
      });
      // data is the unwrapped payload from api.request() → { reply, model }
      const reply =
        data && typeof data === 'object' && typeof data.reply === 'string'
          ? data.reply
          : typeof data === 'string'
          ? data
          : '(empty reply)';
      const usedModel = data?.model ? ` [${data.model}]` : '';
      setTestResult('✓ Bot replied' + usedModel + ': ' + reply);
      setTestStatus('success');
    } catch (err) {
      setTestResult('✗ ' + err.message);
      setTestStatus('error');
    }
  };

  if (loading) {
    return <p>Loading settings...</p>;
  }

  return (
    <>
      <h1 className="text-2xl mb-6">Site Settings</h1>

      <form onSubmit={handleSubmit} className="surface max-w-3xl space-y-2">
        <h3 className="text-lg font-bold mb-4">Business Info</h3>

        <Input
          label="Business Name"
          value={values.name}
          onChange={(e) => handleChange('name', e.target.value)}
        />
        <Input
          label="Tagline"
          value={values.tagline}
          onChange={(e) => handleChange('tagline', e.target.value)}
        />
        <Input
          label="Phone"
          value={values.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
        />
        <Input
          label="WhatsApp (with country code)"
          value={values.whatsapp}
          onChange={(e) => handleChange('whatsapp', e.target.value)}
        />
        <Input
          label="Email"
          type="email"
          value={values.email}
          onChange={(e) => handleChange('email', e.target.value)}
        />
        <Input
          label="Address"
          value={values.address}
          onChange={(e) => handleChange('address', e.target.value)}
        />

        <h3 className="text-lg font-bold mt-8 mb-4">Chatbot Settings</h3>

        <div className="form-group">
          <label className="block mb-2 font-semibold text-sm">Groq API Key</label>
          <input
            type="password"
            value={values.chatApiKey}
            onChange={(e) => handleChange('chatApiKey', e.target.value)}
            placeholder="gsk_..."
          />
          <small className="text-xs text-[var(--text-subtle)]">
            Get from console.groq.com
          </small>
        </div>

        <div className="form-group">
          <label className="block mb-2 font-semibold text-sm">Model Name</label>
          <input
            type="text"
            value={values.chatModel}
            onChange={(e) => handleChange('chatModel', e.target.value)}
            placeholder="llama-3.3-70b-versatile"
          />
          <small className="text-xs text-[var(--text-subtle)]">
            Leave blank to use the default. See{' '}
            <a
              href="https://console.groq.com/docs/models"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent"
            >
              console.groq.com/docs/models
            </a>
            . If the model fails, the server will automatically fall back to a
            known-good model.
          </small>
        </div>

        <div className="form-group">
          <label className="block mb-2 font-semibold text-sm">Test Chatbot</label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleTestChat}
            disabled={testStatus === 'loading'}
          >
            {testStatus === 'loading' ? 'Testing…' : 'Send test message'}
          </Button>
          {testResult && (
            <div
              className="mt-2 text-sm"
              style={{
                color:
                  testStatus === 'success'
                    ? 'var(--success)'
                    : testStatus === 'error'
                    ? 'var(--danger)'
                    : 'var(--text-muted)',
              }}
            >
              {testResult}
            </div>
          )}
        </div>

        <div className="pt-4">
          <Button type="submit" variant="primary" loading={saving}>
            Save Settings
          </Button>
        </div>
      </form>
    </>
  );
}