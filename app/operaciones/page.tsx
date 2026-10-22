'use client';

import { FormEvent, useEffect, useState } from 'react';
import { ArrowUpRight, ChefHat, ClipboardList, LogOut, ShieldCheck, Truck, Wallet, UtensilsCrossed } from 'lucide-react';

type User = { id: string; name: string; username: string; role: string; agency?: string };
type Dashboard = { orders?: any[]; finance?: any; agencies?: any[] };

async function api(body: Record<string, unknown>) {
  const response = await fetch('/api/noahs', {
    method: 'POST',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'No se pudo completar la operación.');
  return data;
}

const roles: Record<string, string> = {
  master: 'Maestro',
  manager: 'Encargado',
  cashier: 'Caja',
  kitchen: 'Cocina',
  driver: 'Motorista',
};

const sections = [
  { id: 'orders', title: 'Restaurante y premios', description: 'Pedidos, caja y configuración del restaurante.', icon: UtensilsCrossed, roles: ['master', 'manager', 'cashier'] },
  { id: 'kitchen', title: 'Pantalla de cocina', description: 'Consultá y actualizá los pedidos que están en preparación.', icon: ChefHat, roles: ['master', 'manager', 'cashier', 'kitchen'] },
  { id: 'driver', title: 'Pantalla de motoristas', description: 'Revisá las entregas y los pedidos asignados.', icon: Truck, roles: ['master', 'manager', 'cashier', 'driver'] },
  { id: 'settlements', title: 'Liquidación de motoristas', description: 'Controlá cobros, efectivo entregado y saldos pendientes.', icon: Wallet, roles: ['master', 'manager', 'cashier'] },
];

export default function OperacionesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [bootstrap, setBootstrap] = useState(false);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('orders');
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.all([api({ action: 'catalog' }), api({ action: 'me' })])
      .then(([catalog, session]) => {
        if (!alive) return;
        setBootstrap(!!catalog.bootstrap);
        if (session.user) setUser(session.user);
      })
      .catch((e) => { if (alive) setError(e.message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    const load = () => api({ action: 'dashboard', agency: user.role === 'master' ? '' : user.agency || '' })
      .then((data) => { if (alive) setDashboard(data); })
      .catch((e) => { if (alive) setError(e.message); });
    load();
    const timer = window.setInterval(load, 15000);
    return () => { alive = false; window.clearInterval(timer); };
  }, [user]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = await api({
        action: bootstrap ? 'bootstrap' : 'login',
        username: username.trim(),
        pin,
        ...(bootstrap ? { name: name.trim() } : {}),
      });
      setUser(result.user);
      setBootstrap(false);
      setPin('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo iniciar sesión.');
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    setBusy(true);
    try {
      await api({ action: 'logout' });
      setUser(null);
      setDashboard(null);
      setUsername('');
      setName('');
      setPin('');
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cerrar la sesión.');
    } finally {
      setBusy(false);
    }
  }

  const available = sections.filter((section) => user && section.roles.includes(user.role));
  const activeTab = available.find((section) => section.id === tab) || available[0];

  return (
    <main className="ops-page">
      <div className="ops-topbar">
        <a className="ops-brand" href="/" aria-label="Noah's inicio">
          <span className="ops-brand-mark">N</span>
          <span><strong>Noah’s</strong><small>PEDIDOS DEL EQUIPO</small></span>
        </a>
        <a className="ops-menu-link" href="/">Menú <ArrowUpRight size={15} /></a>
      </div>

      <div className="ops-shell">
        <div className="ops-eyebrow"><span /> CADA PASO, CONFIRMADO POR EL EQUIPO</div>
        <header className="ops-heading">
          <div>
            <p className="ops-kicker">NOAH’S · CENTRO DE CONTROL</p>
            <h1>Central de operaciones<span>.</span></h1>
            <p className="ops-lead">Restaurante, cocina y reparto en un solo lugar.</p>
          </div>
          <div className="ops-emblem"><ClipboardList size={32} strokeWidth={1.5} /></div>
        </header>

        {loading ? (
          <section className="ops-login-card"><p>Preparando el acceso seguro…</p></section>
        ) : !user ? (
          <section className="ops-login-card">
            <div className="ops-card-icon"><ShieldCheck size={22} /></div>
            <h2>{bootstrap ? 'Crear el primer Maestro' : 'Ingresá con tu usuario'}</h2>
            <p className="ops-muted">{bootstrap ? 'Configurá la cuenta principal que administrará los accesos del equipo.' : 'Tu usuario determina tu rol. Maestro puede acceder a caja, cocina y motoristas.'}</p>
            <form onSubmit={submit} className="ops-form">
              {bootstrap && <label>Nombre completo<input autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Tu nombre" /></label>}
              <label>Usuario<input autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} required placeholder="Ingresá tu usuario" /></label>
              <label>PIN de 8 dígitos<input inputMode="numeric" autoComplete="current-password" type="password" pattern="[0-9]{8}" minLength={8} maxLength={8} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 8))} required placeholder="••••••••" /></label>
              <button className="ops-submit" disabled={busy}>{busy ? 'Ingresando…' : bootstrap ? 'Crear Maestro y entrar' : 'Ingresar'} <ArrowUpRight size={17} /></button>
            </form>
            {error && <p className="ops-error" role="alert">{error}</p>}
            <p className="ops-footnote"><ShieldCheck size={14} /> La sesión dura hasta 8 horas. Al terminar tu turno, cerrá sesión.</p>
            <p className="ops-footnote">Maestro administra usuarios y restablece el PIN.</p>
          </section>
        ) : (
          <section className="ops-dashboard">
            <div className="ops-welcome">
              <div><span className="ops-status-dot" /> SESIÓN ACTIVA</div>
              <h2>Hola, {user.name || user.username}.</h2>
              <p>{roles[user.role] || user.role}{user.agency ? ' · Agencia asignada' : ' · Acceso general'}</p>
              <button onClick={logout} disabled={busy} className="ops-logout"><LogOut size={15} /> Cerrar sesión</button>
            </div>
            <div className="ops-section-head"><div><p className="ops-kicker">TU ESPACIO DE TRABAJO</p><h2>Elegí una pantalla</h2></div><span className="ops-live"><span /> Actualización automática</span></div>
            <div className="ops-grid">
              {available.map((section) => {
                const Icon = section.icon;
                return <button key={section.id} className={'ops-section-card' + (activeTab?.id === section.id ? ' selected' : '')} onClick={() => setTab(section.id)}>
                  <span className="ops-section-icon"><Icon size={23} /></span>
                  <span className="ops-section-title">{section.title}</span>
                  <span className="ops-section-desc">{section.description}</span>
                  <span className="ops-card-arrow"><ArrowUpRight size={17} /></span>
                </button>;
              })}
            </div>
            <div className="ops-detail">
              <div className="ops-detail-heading"><div><p className="ops-kicker">PANEL SELECCIONADO</p><h3>{activeTab?.title || 'Operaciones'}</h3></div><span className="ops-live"><span /> En línea</span></div>
              {error && <p className="ops-error" role="alert">{error}</p>}
              {activeTab?.id === 'orders' && <div className="ops-metrics">
                <div><span>Pedidos cargados</span><strong>{dashboard?.orders?.length ?? '—'}</strong></div>
                <div><span>Pedidos por revisar</span><strong>{dashboard?.orders?.filter((o: any) => ['received', 'confirmed'].includes(o.status)).length ?? '—'}</strong></div>
                <div><span>Rol activo</span><strong>{roles[user.role] || user.role}</strong></div>
              </div>}
              {activeTab?.id === 'kitchen' && <p className="ops-muted">Sesión de cocina habilitada. Los pedidos y cambios de estado se administran con el panel de operaciones del sistema.</p>}
              {activeTab?.id === 'driver' && <p className="ops-muted">Acceso de motoristas habilitado para la cuenta asignada. Las entregas se actualizan desde el panel operativo.</p>}
              {activeTab?.id === 'settlements' && <p className="ops-muted">Panel de liquidación disponible para roles autorizados. Los movimientos dependen de los registros del sistema.</p>}
              <a className="ops-return-link" href="/">Volver al menú de Noah’s <ArrowUpRight size={15} /></a>
            </div>
          </section>
        )}
      </div>
      <style jsx global>{`
        .ops-page{min-height:100vh;background:#f5f2eb;color:#191d1b;font-family:Arial,Helvetica,sans-serif;padding:0 24px 60px}
        .ops-topbar{height:82px;max-width:1120px;margin:auto;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #dedbd2}
        .ops-brand{display:flex;align-items:center;gap:11px;text-decoration:none;color:inherit}.ops-brand-mark{display:grid;place-items:center;width:42px;height:42px;border-radius:13px;background:#ed4d2e;color:#fff;font-size:25px;font-weight:900;font-style:italic}.ops-brand strong{display:block;font-size:19px;letter-spacing:-.7px}.ops-brand small{display:block;font-size:9px;letter-spacing:1.8px;color:#777d76;margin-top:3px}
        .ops-menu-link{display:flex;align-items:center;gap:7px;color:#303831;text-decoration:none;font-weight:700;font-size:14px}
        .ops-shell{max-width:1040px;margin:46px auto 0}.ops-eyebrow{display:flex;align-items:center;gap:9px;font-size:10px;font-weight:800;letter-spacing:1.5px;color:#69716a}.ops-eyebrow span{width:7px;height:7px;background:#ed4d2e;border-radius:50%}
        .ops-heading{display:flex;align-items:center;justify-content:space-between;margin:20px 0 30px}.ops-kicker{font-size:10px;font-weight:800;letter-spacing:1.5px;color:#ed4d2e;margin:0 0 10px}.ops-heading h1{font-size:clamp(34px,5vw,54px);line-height:1.04;letter-spacing:-2px;margin:0;font-weight:850}.ops-heading h1 span{color:#ed4d2e}.ops-lead{font-size:17px;color:#69716a;margin:13px 0 0}.ops-emblem{width:78px;height:78px;display:grid;place-items:center;background:#e9e4d8;border-radius:24px;color:#ed4d2e}
        .ops-login-card{max-width:560px;margin:0 auto;background:#fff;border:1px solid #e7e3da;border-radius:22px;padding:30px;box-shadow:0 14px 40px #272b2110}.ops-card-icon{display:grid;place-items:center;width:44px;height:44px;border-radius:13px;background:#fff0eb;color:#ed4d2e}.ops-login-card h2{font-size:24px;letter-spacing:-.7px;margin:18px 0 8px}.ops-muted{font-size:14px;color:#747a73;line-height:1.6}.ops-form{display:grid;gap:17px;margin-top:24px}.ops-form label{display:grid;gap:8px;font-size:12px;font-weight:800;color:#343b35}.ops-form input{width:100%;box-sizing:border-box;padding:14px 15px;border:1px solid #dedfd9;border-radius:11px;background:#fcfcfa;color:#191d1b;font:inherit;font-size:15px;outline:none}.ops-form input:focus{border-color:#ed4d2e;box-shadow:0 0 0 3px #ed4d2e1a}.ops-submit{display:flex;justify-content:center;align-items:center;gap:10px;border:0;border-radius:11px;padding:15px;background:#ed4d2e;color:white;font-weight:800;font-size:14px;cursor:pointer;margin-top:4px}.ops-submit:disabled,.ops-logout:disabled{opacity:.6;cursor:wait}.ops-error{padding:12px 14px;border-radius:10px;background:#fff0ed;color:#b02e1a;font-size:13px}.ops-footnote{display:flex;align-items:center;gap:7px;color:#83877f;font-size:11px;line-height:1.5;margin:17px 0 0}.ops-dashboard{display:grid;gap:24px}.ops-welcome{position:relative;background:#1f2924;color:white;border-radius:20px;padding:25px 28px}.ops-welcome>div:first-child{font-size:10px;letter-spacing:1.3px;color:#c4e4c8;display:flex;align-items:center;gap:8px}.ops-status-dot,.ops-live span{width:7px;height:7px;border-radius:50%;background:#55bb78;display:inline-block}.ops-welcome h2{font-size:28px;letter-spacing:-.8px;margin:14px 0 4px}.ops-welcome p{font-size:13px;color:#d2d8d1;margin:0}.ops-logout{position:absolute;right:22px;top:22px;display:flex;align-items:center;gap:7px;background:#ffffff14;color:white;border:1px solid #ffffff26;padding:10px 12px;border-radius:9px;cursor:pointer;font-size:12px}.ops-section-head,.ops-detail-heading{display:flex;justify-content:space-between;align-items:end;gap:14px}.ops-section-head h2,.ops-detail-heading h3{font-size:23px;letter-spacing:-.7px;margin:0}.ops-live{display:flex;align-items:center;gap:7px;font-size:11px;color:#68746a;white-space:nowrap}.ops-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.ops-section-card{position:relative;display:flex;flex-direction:column;align-items:flex-start;gap:10px;text-align:left;padding:22px;border:1px solid #e1ddd4;border-radius:16px;background:white;color:#202620;cursor:pointer;min-height:175px;transition:border-color .15s,transform .15s}.ops-section-card:hover{border-color:#ed4d2e;transform:translateY(-2px)}.ops-section-card.selected{border-color:#ed4d2e;box-shadow:0 0 0 1px #ed4d2e inset}.ops-section-icon{display:grid;place-items:center;width:43px;height:43px;border-radius:12px;background:#f7eee7;color:#ed4d2e}.ops-section-title{font-size:16px;font-weight:800}.ops-section-desc{font-size:12px;color:#7b8079;line-height:1.5;max-width:300px;padding-right:12px}.ops-card-arrow{position:absolute;right:18px;top:20px;color:#8b9189}.ops-detail{background:white;border:1px solid #e3dfd6;border-radius:18px;padding:24px}.ops-detail-heading{align-items:center}.ops-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:20px}.ops-metrics>div{background:#f7f5f0;border-radius:12px;padding:16px}.ops-metrics span{display:block;color:#747b73;font-size:12px;margin-bottom:10px}.ops-metrics strong{font-size:24px;letter-spacing:-.5px}.ops-return-link{display:inline-flex;align-items:center;gap:7px;color:#df482b;font-size:13px;font-weight:800;text-decoration:none;margin-top:23px}.ops-login-card>.ops-muted{margin-bottom:0}
        @media(max-width:650px){.ops-page{padding:0 16px 36px}.ops-topbar{height:70px}.ops-shell{margin-top:32px}.ops-heading{margin:17px 0 24px}.ops-emblem{width:55px;height:55px;border-radius:17px}.ops-emblem svg{width:25px}.ops-login-card{padding:23px 20px}.ops-grid{grid-template-columns:1fr}.ops-section-card{min-height:140px}.ops-welcome{padding:23px 20px 75px}.ops-logout{top:auto;left:20px;right:auto;bottom:18px}.ops-section-head{align-items:flex-start;flex-direction:column}.ops-metrics{grid-template-columns:1fr}.ops-detail{padding:19px}}
      `}</style>
    </main>
  );
}
