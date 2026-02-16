import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl gradient-border bg-gradient-to-br from-cyan-500/20 to-purple-500/20 mb-4">
            <Home size={36} className="text-cyan-400" />
          </div>
          <h1 className="text-4xl font-bold neon-blue">H.O.M.E.</h1>
          <p className="text-slate-400 mt-2">Housing Opportunity & Matching Evaluation</p>
        </div>

        <div className="glass-strong rounded-2xl p-8">
          <h2 className="text-xl font-semibold text-slate-200 mb-6">Sign In</h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg input-glass"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg input-glass"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 btn-neon rounded-lg font-medium disabled:opacity-50 transition-all duration-300"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-sm text-slate-500 mb-3">Demo accounts:</p>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-400"><strong className="text-slate-300">sarah</strong> / password123</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full glass neon-blue">Assessor</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400"><strong className="text-slate-300">david</strong> / password123</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full glass neon-green">Manager</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400"><strong className="text-slate-300">priya</strong> / password123</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full glass neon-purple">Senior Manager</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
