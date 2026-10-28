'use client';

function xmlEscape(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function makeXlsx(rows: string[][]): Uint8Array {
  const encoder = new TextEncoder();
  const columnName = (index: number) => {
    let name = '';
    for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) name = String.fromCharCode(65 + ((n - 1) % 26)) + name;
    return name;
  };
  const worksheet = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>' +
    rows.map((row, r) => '<row r="' + (r + 1) + '">' + row.map((value, c) => {
      const ref = columnName(c) + (r + 1);
      return '<c r="' + ref + '" t="inlineStr"><is><t xml:space="preserve">' + xmlEscape(String(value ?? '')) + '</t></is></c>';
    }).join('') + '</row>').join('') + '</sheetData></worksheet>';
  const files = [
    { name: '[Content_Types].xml', text: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>' },
    { name: '_rels/.rels', text: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>' },
    { name: 'xl/workbook.xml', text: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Usuarios" sheetId="1" r:id="rId1"/></sheets></workbook>' },
    { name: 'xl/_rels/workbook.xml.rels', text: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>' },
    { name: 'xl/worksheets/sheet1.xml', text: worksheet }
  ].map(file => ({ name: file.name, nameBytes: encoder.encode(file.name), data: encoder.encode(file.text) }));

  const crcTable = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let value = n;
    for (let bit = 0; bit < 8; bit++) value = (value & 1) ? (0xedb88320 ^ (value >>> 1)) : (value >>> 1);
    crcTable[n] = value >>> 0;
  }
  const crc32 = (bytes: Uint8Array) => {
    let crc = 0xffffffff;
    for (const byte of bytes) crc = (crc >>> 8) ^ crcTable[(crc ^ byte) & 0xff];
    return (crc ^ 0xffffffff) >>> 0;
  };
  const localRecords: Uint8Array[] = [];
  const centralRecords: Uint8Array[] = [];
  let localOffset = 0;
  const write16 = (view: DataView, offset: number, value: number) => view.setUint16(offset, value, true);
  const write32 = (view: DataView, offset: number, value: number) => view.setUint32(offset, value >>> 0, true);
  for (const file of files) {
    const checksum = crc32(file.data);
    const local = new Uint8Array(30 + file.nameBytes.length);
    const lv = new DataView(local.buffer);
    write32(lv, 0, 0x04034b50); write16(lv, 4, 20); write16(lv, 6, 0); write16(lv, 8, 0);
    write16(lv, 10, 0); write16(lv, 12, 0x0021); write32(lv, 14, checksum);
    write32(lv, 18, file.data.length); write32(lv, 22, file.data.length);
    write16(lv, 26, file.nameBytes.length); write16(lv, 28, 0); local.set(file.nameBytes, 30);
    localRecords.push(local, file.data);

    const central = new Uint8Array(46 + file.nameBytes.length);
    const cv = new DataView(central.buffer);
    write32(cv, 0, 0x02014b50); write16(cv, 4, 20); write16(cv, 6, 20); write16(cv, 8, 0); write16(cv, 10, 0);
    write16(cv, 12, 0); write16(cv, 14, 0x0021); write32(cv, 16, checksum);
    write32(cv, 20, file.data.length); write32(cv, 24, file.data.length);
    write16(cv, 28, file.nameBytes.length); write16(cv, 30, 0); write16(cv, 32, 0);
    write16(cv, 34, 0); write16(cv, 36, 0); write32(cv, 38, 0); write32(cv, 42, localOffset);
    central.set(file.nameBytes, 46); centralRecords.push(central);
    localOffset += local.length + file.data.length;
  }
  const centralDirectory = new Uint8Array(centralRecords.reduce((sum, part) => sum + part.length, 0));
  let centralAt = 0;
  for (const part of centralRecords) { centralDirectory.set(part, centralAt); centralAt += part.length; }
  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  write32(ev, 0, 0x06054b50); write16(ev, 4, 0); write16(ev, 6, 0);
  write16(ev, 8, files.length); write16(ev, 10, files.length);
  write32(ev, 12, centralDirectory.length); write32(ev, 16, localOffset); write16(ev, 20, 0);
  const outputParts = [...localRecords, centralDirectory, end];
  const output = new Uint8Array(outputParts.reduce((sum, part) => sum + part.length, 0));
  let outputOffset = 0;
  for (const part of outputParts) { output.set(part, outputOffset); outputOffset += part.length; }
  return output;
}


import { FormEvent, useEffect, useState } from 'react';
import { ArrowUpRight, ChefHat, ClipboardList, LogOut, ShieldCheck, Truck, Wallet, UtensilsCrossed, Users } from 'lucide-react';

type User = { id: string; name: string; username: string; role: string; agency?: string };
type Dashboard = { orders?: any[]; finance?: any; agencies?: any[]; staff?: any[] };

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
  { id: 'users', title: 'Administrar usuarios', description: 'Creá cuentas, asigná roles y configurá PIN de acceso.', icon: Users, roles: ['master', 'manager'] },
];

export default function OperacionesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [bootstrap, setBootstrap] = useState(false);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [bootstrapSecret, setBootstrapSecret] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('orders');
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [agencies, setAgencies] = useState<any[]>([]);
  const [newUser, setNewUser] = useState({ name: '', username: '', role: 'cashier', agency: 'peronia', pin: '' });
  const [userNotice, setUserNotice] = useState('');
  const [generatedPin, setGeneratedPin] = useState<{name:string;username:string;pin:string}|null>(null);
  const [pendingWhatsAppOrder, setPendingWhatsAppOrder] = useState<any | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.allSettled([api({ action: 'catalog' }), api({ action: 'me' })])
      .then(([catalogResult, sessionResult]) => {
        if (!alive) return;
        if (catalogResult.status === 'fulfilled') {
          setBootstrap(!!catalogResult.value.bootstrap);
          setAgencies(catalogResult.value.agencies || []);
        } else {
          setError(catalogResult.reason instanceof Error ? catalogResult.reason.message : 'No se pudo cargar la configuración.');
        }
        // A 401 from "me" is expected when nobody has signed in yet. It must
        // not prevent the public catalog from deciding whether bootstrap is needed.
        if (sessionResult.status === 'fulfilled' && sessionResult.value.user) {
          setUser(sessionResult.value.user);
        }
      })
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
        ...(bootstrap ? { name: name.trim(), bootstrapSecret } : {}),
      });
      setUser(result.user);
      setBootstrap(false);
      setPin('');
      setBootstrapSecret('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo iniciar sesión.');
    } finally {
      setBusy(false);
    }
  }

  async function createStaff(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setUserNotice('');
    try {
      await api({ action: 'saveUser', name: newUser.name.trim(), username: newUser.username.trim(), role: newUser.role, agency: newUser.role === 'master' ? '' : newUser.agency, pin: newUser.pin });
      setUserNotice('Usuario creado correctamente. Entregá el usuario y PIN de forma segura.');
      setNewUser({ name: '', username: '', role: 'cashier', agency: user?.agency || agencies[0]?.id || 'peronia', pin: '' });
      const data = await api({ action: 'dashboard', agency: user?.role === 'master' ? '' : user?.agency || '' });
      setDashboard(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo crear el usuario.');
    } finally {
      setBusy(false);
    }
  }

  function exportStaffExcel() {
    const rows = (dashboard?.staff || []).filter((s: any) => user?.role === 'master' || s.agency === user?.agency);
    const header = ['Nombre', 'Usuario', 'Rol', 'Agencia', 'Estado'];
    const data: string[][] = [header, ...rows.map((s: any) => [
      String(s.name ?? ''),
      String(s.username ?? ''),
      String(roles[s.role] || s.role || ''),
      String(agencies.find((a: any) => a.id === s.agency)?.name || (s.role === 'master' ? 'Acceso general' : s.agency || '')),
      s.active && !s.deleted ? 'Activo' : 'Inactivo',
    ])];
    const xlsx = makeXlsx(data);
    const blob = new Blob([xlsx.buffer as ArrayBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'noahs-usuarios.xlsx';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setUserNotice('Archivo .xlsx exportado. Por seguridad, no contiene PIN, hashes ni contraseñas.');
  }

  async function resetStaffPin(staff: any) {
    if (!window.confirm('¿Generar un PIN nuevo para ' + staff.name + '? El PIN anterior dejará de funcionar inmediatamente.')) return;
    setBusy(true); setError(''); setUserNotice(''); setGeneratedPin(null);
    try {
      const result = await api({ action: 'resetUserPin', id: staff.id });
      setGeneratedPin({name: result.name, username: result.username, pin: result.pin});
      setUserNotice('PIN nuevo generado. Copialo y entregalo directamente al usuario; no se volverá a mostrar.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo restablecer el PIN.');
    } finally { setBusy(false); }
  }

  async function deleteStaff(staff: any) {
    if (!window.confirm(`¿Eliminar el acceso de ${staff.name}? El historial de pedidos y cobros se conservará.`)) return;
    setBusy(true); setError(''); setUserNotice('');
    try {
      await api({ action: 'deleteUser', id: staff.id });
      setUserNotice(`Acceso de ${staff.name} desactivado. El historial se conserva.`);
      const data = await api({ action: 'dashboard', agency: user?.role === 'master' ? '' : user?.agency || '' });
      setDashboard(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo eliminar el acceso.');
    } finally { setBusy(false); }
  }

  async function updateOrder(order: any, status: string, driver?: string) {
    setBusy(true); setError('');
    try {
      await api({ action: 'transition', id: order.id, revision: order.revision, status, ...(driver ? { driver } : {}) });
      // Open the confirmation prompt immediately; refreshing the dashboard is secondary.
      if (status === 'confirmed') setPendingWhatsAppOrder({ ...order, status: 'confirmed' });
      try {
        const data = await api({ action: 'dashboard', agency: user?.role === 'master' ? '' : user?.agency || '' });
        setDashboard(data);
      } catch (refreshError) {
        setError(refreshError instanceof Error
          ? 'Pedido confirmado, pero no se pudo actualizar la lista: ' + refreshError.message
          : 'Pedido confirmado. Actualizá la pantalla para ver los cambios.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo actualizar el pedido.');
    } finally { setBusy(false); }
  }

  function confirmByWhatsApp(order: any) {
    if (!order.phone) {
      setError('Este pedido no tiene teléfono del cliente. Revisá el número registrado.');
      return;
    }
    const phone = String(order.phone).replace(/\D/g, '').replace(/^0/, '');
    const whatsappPhone = phone.startsWith('502') ? phone : '502' + phone;
    const itemLines = (order.items || []).map((item: any) => '• ' + item.quantity + ' × ' + item.name + (item.choices?.length ? ' (' + item.choices.join(', ') + ')' : '')).join('\n');
    const agencyName = agencies.find((a: any) => a.id === order.agency)?.short || 'Noah’s';
    const message = '¡Hola ' + order.customer + '! Te confirmamos que recibimos tu pedido ' + order.code + ' en Noah’s, ' + agencyName + '.\n\n' + itemLines + '\n\nTotal: Q' + (order.total / 100).toFixed(2) + '\nEntrega: ' + (order.mode === 'pickup' ? 'Retiro en agencia' : 'A domicilio') + (order.address ? '\nDirección: ' + order.address : '') + '\n\nSeguí tu pedido aquí: https://noahs.noahspedidos.workers.dev/?seguimiento=' + encodeURIComponent(order.code) + '\n\n¡Gracias por pedir en Noah’s!';
    window.open('https://wa.me/' + whatsappPhone + '?text=' + encodeURIComponent(message), '_blank', 'noopener,noreferrer');
    if (order.status === 'received') void updateOrder(order, 'confirmed');
  }

  async function claimOrder(order: any) {\n    setBusy(true); setError('');\n    try {\n      await api({ action: 'claimOrder', id: order.id });\n      const data = await api({ action: 'dashboard', agency: user?.role === 'master' ? '' : user?.agency || '' });\n      setDashboard(data);\n      setUserNotice(`Tomaste el pedido ${order.code}. Ya aparece como asignado a tu usuario.`);\n    } catch (e) {\n      setError(e instanceof Error ? e.message : 'No se pudo tomar el pedido.');\n    } finally { setBusy(false); }\n  }\n\n  async function collectOrder(order: any, method: 'cash' | 'card') {
    setBusy(true); setError('');
    try {
      await api({ action: 'collect', id: order.id, revision: order.revision, method });
      const data = await api({ action: 'dashboard', agency: user?.role === 'master' ? '' : user?.agency || '' });
      setDashboard(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo registrar el cobro.');
    } finally { setBusy(false); }
  }

  const statusNames: Record<string, string> = {
    received: 'Pendiente de confirmación', confirmed: 'Confirmado', preparing: 'En preparación',
    ready: 'Preparado', assigned: 'Asignado a motorista', onway: 'En ruta',
    delivered: 'Entregado', cancelled: 'Cancelado'
  };
  const operationalOrders = (dashboard?.orders || []).filter((o: any) => o.status !== 'delivered' && o.status !== 'cancelled');
  const orderActions = (o: any) => {
    const actions: any[] = [];
    const canManage = ['master', 'manager'].includes(user?.role || '');
    if (o.status === 'received' && ['master','manager','cashier'].includes(user?.role || '')) actions.push(['confirmed', 'Confirmar pedido']);
    if (o.status === 'confirmed' && ['master','manager','kitchen'].includes(user?.role || '')) actions.push(['preparing', 'Iniciar preparación']);
    if (o.status === 'preparing' && ['master','manager','kitchen'].includes(user?.role || '')) actions.push(['ready', 'Marcar preparado']);
    if (o.status === 'ready' && o.mode === 'pickup' && ['master','manager','cashier'].includes(user?.role || '')) actions.push(['delivered', 'Entregado en mostrador']);
    if (o.status === 'assigned' && ['master','manager'].includes(user?.role || '')) actions.push(['ready', 'Quitar asignación']);
    if (o.status === 'assigned' && (canManage || user?.id === o.driver)) actions.push(['onway', 'Marcar en ruta']);
    if (o.status === 'onway' && o.paid_method && (canManage || user?.id === o.driver)) actions.push(['delivered', 'Marcar entregado']);
    return actions;
  };
  const driverOptions = (dashboard?.staff || []).filter((s: any) => s.role === 'driver' && s.active && !s.deleted);

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
              {bootstrap && <><label>Clave de configuración inicial<input type="password" autoComplete="off" value={bootstrapSecret} onChange={(e) => setBootstrapSecret(e.target.value)} required placeholder="La clave guardada en Cloudflare" /></label><label>Nombre completo<input autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Tu nombre" /></label></>}
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
              <p>{roles[user.role] || user.role}{user.agency ? ' · ' + (agencies.find((a: any) => a.id === user.agency)?.name || user.agency) : ' · Acceso general'}</p>
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
              {['orders','kitchen','driver'].includes(activeTab?.id || '') && <div className={'ops-order-list ' + (activeTab?.id === 'kitchen' ? 'ops-kitchen-board' : '')}>
                <div className="ops-board-toolbar"><div><p className="ops-muted">{activeTab?.id === 'kitchen' ? 'Tablero de preparación · Priorizá los pedidos más antiguos y marcá cada avance.' : activeTab?.id === 'driver' ? 'Pedidos listos para reparto y entregas en curso.' : 'Pedidos pendientes de confirmación.'}</p></div><span className="ops-board-count">{(dashboard?.orders || []).filter((o: any) => activeTab?.id === 'orders' ? ['received','confirmed'].includes(o.status) : activeTab?.id === 'kitchen' ? ['confirmed','preparing'].includes(o.status) : ['ready','assigned','onway'].includes(o.status)).length} pedidos activos</span></div>
                {activeTab?.id === 'kitchen' ? <div className="ops-kitchen-columns">
                  {([{id:'confirmed',title:'POR PREPARAR',hint:'Confirmados'},{id:'preparing',title:'EN PREPARACIÓN',hint:'En cocina'}] as any[]).map((lane: any) => {
                    const laneOrders = (dashboard?.orders || []).filter((o: any) => o.status === lane.id);
                    return <section className="ops-kitchen-lane" key={lane.id}>
                      <header className="ops-lane-header"><span className={'ops-lane-dot lane-' + lane.id}></span><div><strong>{lane.title}</strong><small>{lane.hint}</small></div><b>{laneOrders.length}</b></header>
                      {laneOrders.map((o: any) => <article className="ops-order-card ops-kitchen-ticket" key={o.id}>
                        <div className="ops-ticket-head"><div><span className="ops-ticket-label">PEDIDO</span><strong className="ops-ticket-code">{o.code}</strong></div><span className={'ops-order-status status-' + o.status}>{statusNames[o.status] || o.status}</span></div>
                        <div className="ops-ticket-meta"><strong>{o.customer}</strong><span>{o.mode === 'pickup' ? '↗ Retiro en agencia' : '● Domicilio'}</span></div>
                        <div className="ops-ticket-items">{(o.items || []).map((i: any, idx: number) => <div className="ops-ticket-item" key={idx}><strong className="ops-item-qty">{i.quantity}×</strong><div><strong>{i.name}</strong>{i.choices?.length ? <small>{i.choices.join(' · ')}</small> : null}</div></div>)}</div>
                        {o.note && <div className="ops-ticket-note"><strong>NOTA</strong> {o.note}</div>}
                        <div className="ops-ticket-foot"><span>Total <strong>Q{(o.total / 100).toFixed(2)}</strong></span><span>{o.code?.slice(-4) || ''}</span></div>
                        <button className="ops-kitchen-action" disabled={busy} onClick={() => updateOrder(o, lane.id === 'confirmed' ? 'preparing' : 'ready')}>{busy ? 'Guardando…' : lane.id === 'confirmed' ? '▶ Iniciar preparación' : '✓ Pedido preparado'}</button>
                      </article>)}
                      {!laneOrders.length && <div className="ops-lane-empty">No hay pedidos en esta etapa</div>}
                    </section>;
                  })}
                </div> : <div className="ops-order-grid">
                  {(dashboard?.orders || []).filter((o: any) => activeTab?.id === 'orders' ? ['received','confirmed'].includes(o.status) : ['ready','assigned','onway'].includes(o.status)).map((o: any) => <article className="ops-order-card" key={o.id}>
                    <div className="ops-order-top"><strong>Pedido {o.code}</strong><span className={'ops-order-status status-' + o.status}>{statusNames[o.status] || o.status}</span></div><p><strong>{o.customer}</strong> · {o.mode === 'pickup' ? 'Retiro en agencia' : 'Entrega a domicilio'}</p>
                    {o.mode !== 'pickup' && o.address && <p>{o.address}</p>}
                    <p>{(o.items || []).map((i: any) => i.quantity + ' × ' + i.name + (i.choices?.length ? ' (' + i.choices.join(', ') + ')' : '')).join(' · ')}</p>
                    <p className="ops-order-total">Total Q{(o.total / 100).toFixed(2)} · {o.driver_name ? 'Motorista: ' + o.driver_name : 'Sin motorista asignado'}</p>
                    {['received','confirmed'].includes(o.status) && ['master','manager','cashier'].includes(user.role) && <div className="ops-order-actions"><button className="primary" disabled={busy} onClick={() => o.status === 'received' ? updateOrder(o, 'confirmed') : setPendingWhatsAppOrder(o)}>{o.status === 'received' ? '✓ Confirmar pedido' : 'Enviar WhatsApp al cliente'}</button></div>}
                    {o.status === 'ready' && o.mode !== 'pickup' && ['master','manager'].includes(user.role) && <label>Asignar motorista<select defaultValue="" disabled={busy} onChange={(e) => { if (e.target.value) updateOrder(o, 'assigned', e.target.value); }}><option value="">Seleccionar motorista…</option>{driverOptions.filter((d: any) => d.agency === o.agency).map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></label>}
                    {activeTab?.id === 'driver' && user.role === 'driver' && o.status === 'ready' && o.mode !== 'pickup' && !o.driver && <div className="ops-order-actions"><button className="primary" disabled={busy} onClick={() => claimOrder(o)}>Tomar pedido</button></div>}\n                    {activeTab?.id === 'driver' && o.status === 'onway' && (user.role === 'driver' || user.id === o.driver) && !o.paid_method && <div className="ops-order-actions"><button disabled={busy} onClick={() => collectOrder(o, 'cash')}>Registrar cobro en efectivo</button><button disabled={busy} onClick={() => collectOrder(o, 'card')}>Registrar cobro con tarjeta</button></div>}
                    {o.status === 'onway' && o.paid_method && <p className="ops-muted">Cobro registrado: {o.paid_method === 'cash' ? 'Efectivo' : 'Tarjeta'}</p>}
                    <div className="ops-order-actions">{orderActions(o).map(([status, label]: any) => <button key={status} disabled={busy} onClick={() => updateOrder(o, status)}>{label}</button>)}</div>
                  </article>)}
                  {!(dashboard?.orders || []).some((o: any) => activeTab?.id === 'orders' ? ['received','confirmed'].includes(o.status) : ['ready','assigned','onway'].includes(o.status)) && <p className="ops-muted">No hay pedidos pendientes en esta pantalla.</p>}
                </div>}
              </div>}
              {activeTab?.id === 'settlements' && <p className="ops-muted">Panel de liquidación disponible para roles autorizados. Los movimientos dependen de los registros del sistema.</p>}
              {activeTab?.id === 'users' && <div className="ops-user-admin">
                <p className="ops-muted">Creá accesos para el equipo. Cada cuenta usa un usuario y un PIN numérico de 8 dígitos.</p>
                <form className="ops-form ops-user-form" onSubmit={createStaff}>
                  <label>Nombre completo<input value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} required maxLength={80} placeholder="Nombre del colaborador" /></label>
                  <label>Nombre de usuario<input value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value.replace(/[^a-zA-Z0-9_]/g, '').slice(0,40) })} required minLength={3} maxLength={40} pattern="[A-Za-z0-9_]{3,40}" placeholder="Ej. caja_peronia" /></label>
                  <label>Rol<select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}><option value="manager">Encargado</option><option value="cashier">Caja</option><option value="kitchen">Cocina</option><option value="driver">Motorista</option>{user.role === 'master' && <option value="master">Maestro general</option>}</select></label>
                  {newUser.role !== 'master' && <label>Agencia<select value={newUser.agency} onChange={(e) => setNewUser({ ...newUser, agency: e.target.value })} required>{agencies.filter((a) => user.role === 'master' || a.id === user.agency).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label>}
                  <label>PIN de 8 dígitos<input inputMode="numeric" type="password" autoComplete="new-password" value={newUser.pin} onChange={(e) => setNewUser({ ...newUser, pin: e.target.value.replace(/\D/g, '').slice(0,8) })} required pattern="[0-9]{8}" minLength={8} maxLength={8} placeholder="••••••••" /></label>
                  <button className="ops-submit" disabled={busy}>{busy ? 'Creando usuario…' : 'Crear usuario'} <ArrowUpRight size={17} /></button>
                </form>
                {userNotice && <p className="ops-success" role="status">{userNotice}</p>}{generatedPin && <div className="ops-generated-pin" role="status"><strong>PIN nuevo para {generatedPin.name} (@{generatedPin.username})</strong><code>{generatedPin.pin}</code><button type="button" onClick={() => { void navigator.clipboard.writeText(generatedPin.pin); }}>Copiar PIN</button><button type="button" onClick={() => setGeneratedPin(null)}>Ocultar PIN</button><small>Se muestra una sola vez. Guardalo en un lugar seguro.</small></div>}
                {error && <p className="ops-error" role="alert">{error}</p>}
                <div className="ops-user-list-toolbar"><h4 className="ops-user-list-title">Usuarios registrados</h4><button type="button" className="ops-export-users" disabled={busy || !(dashboard?.staff?.length)} onClick={exportStaffExcel}>Exportar a Excel</button></div>
                <div className="ops-user-list">{(dashboard?.staff || []).map((staff: any) => <div className="ops-user-row" key={staff.id}><div><strong>{staff.name}</strong><span>@{staff.username} · {roles[staff.role] || staff.role} · {agencies.find((a: any) => a.id === staff.agency)?.name || (staff.role === 'master' ? 'Acceso general' : staff.agency || 'Sin agencia')}</span></div><div className="ops-user-row-actions"><span className={staff.active && !staff.deleted ? 'ops-user-active' : 'ops-user-inactive'}>{staff.active && !staff.deleted ? 'Activo' : 'Inactivo'}</span>{staff.id !== user.id && staff.role !== 'master' && staff.active && !staff.deleted && <button type="button" className="ops-delete-user" disabled={busy} onClick={() => deleteStaff(staff)}>Eliminar</button>}{staff.id !== user.id && staff.active && !staff.deleted && (user.role === 'master' || staff.role !== 'master') && <button type="button" className="ops-reset-pin" disabled={busy} onClick={() => resetStaffPin(staff)}>Restablecer PIN</button>}</div></div>)}{!dashboard?.staff?.length && <p className="ops-muted">Todavía no hay usuarios para mostrar.</p>}</div>
              </div>}
              {pendingWhatsAppOrder && <div className="ops-modal-backdrop" role="presentation"><section className="ops-whatsapp-modal" role="dialog" aria-modal="true" aria-labelledby="whatsapp-modal-title"><button type="button" className="ops-modal-close" aria-label="Cerrar" onClick={() => setPendingWhatsAppOrder(null)}>×</button><div className="ops-modal-whatsapp-icon">✆</div><h3 id="whatsapp-modal-title">Pedido confirmado</h3><p>¿Deseás enviar el mensaje de confirmación por WhatsApp al cliente <strong>{pendingWhatsAppOrder.customer}</strong> para el pedido <strong>{pendingWhatsAppOrder.code}</strong>?</p><div className="ops-modal-actions"><button type="button" onClick={() => setPendingWhatsAppOrder(null)}>Ahora no</button><button type="button" className="primary" onClick={() => { const order = pendingWhatsAppOrder; setPendingWhatsAppOrder(null); confirmByWhatsApp(order); }}>Abrir WhatsApp y enviar mensaje</button></div></section></div>}
              <a className="ops-return-link" href="/">Volver al menú de Noah’s <ArrowUpRight size={15} /></a>
            </div>
          </section>
        )}
      </div>
      <style jsx global>{`
        .ops-modal-backdrop{position:fixed!important;inset:0!important;z-index:99999!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:20px!important;background:rgba(10,16,12,.78)!important;backdrop-filter:blur(7px)!important}
        .ops-whatsapp-modal{position:relative!important;width:min(100%,520px)!important;max-height:calc(100vh - 40px)!important;overflow:auto!important;box-sizing:border-box!important;background:#fff!important;color:#17211a!important;border:2px solid #ed4d2e!important;border-radius:22px!important;padding:34px!important;box-shadow:0 28px 100px rgba(0,0,0,.45)!important;animation:opsModalPop .22s ease-out}
        .ops-whatsapp-modal h3{margin:14px 0 10px!important;font-size:28px!important;line-height:1.15!important;letter-spacing:-.6px!important;color:#18231c!important}
        .ops-whatsapp-modal p{margin:0!important;font-size:15px!important;line-height:1.65!important;color:#4b554d!important}
        .ops-whatsapp-modal p strong{color:#18231c!important}
        .ops-modal-close{position:absolute!important;top:12px!important;right:14px!important;width:38px!important;height:38px!important;border:0!important;border-radius:50%!important;background:#f1f2ee!important;color:#26332a!important;font-size:27px!important;cursor:pointer!important}
        .ops-modal-whatsapp-icon{display:grid!important;place-items:center!important;width:58px!important;height:58px!important;border-radius:18px!important;background:#e1f8e8!important;color:#14813a!important;font-size:34px!important}
        .ops-modal-actions{display:flex!important;flex-wrap:wrap!important;gap:12px!important;margin-top:26px!important}
        .ops-modal-actions button{flex:1 1 160px!important;min-height:48px!important;padding:12px 16px!important;border:1px solid #d5d9d3!important;border-radius:11px!important;background:#f7f8f5!important;color:#273229!important;font-size:14px!important;font-weight:800!important;cursor:pointer!important}
        .ops-modal-actions button.primary{border-color:#15803d!important;background:#16803d!important;color:#fff!important;box-shadow:0 5px 14px rgba(21,128,61,.24)!important}
        .ops-modal-actions button:hover{filter:brightness(.97)!important;transform:translateY(-1px)}
        @keyframes opsModalPop{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}
        @media(max-width:520px){.ops-whatsapp-modal{padding:27px 22px!important}.ops-whatsapp-modal h3{font-size:24px!important}.ops-modal-actions{flex-direction:column!important}.ops-modal-actions button{width:100%!important}}

        .ops-user-row-actions{display:flex;align-items:center;gap:10px}.ops-user-list-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-top:28px}.ops-user-list-toolbar .ops-user-list-title{margin:0}.ops-export-users,.ops-reset-pin{border:1px solid #176b3a;border-radius:7px;padding:8px 11px;background:#effaf1;color:#176b3a;font-weight:700;cursor:pointer;font-size:12px}.ops-export-users:disabled,.ops-reset-pin:disabled{opacity:.5;cursor:wait}.ops-reset-pin{border-color:#d8b45b;background:#fff9e8;color:#775611}.ops-generated-pin{display:grid;gap:10px;padding:16px;margin-top:14px;border:1px solid #b8dfc0;background:#f0fbf2;border-radius:12px}.ops-generated-pin code{font-size:26px;letter-spacing:5px;font-weight:900}.ops-generated-pin button{justify-self:start;padding:8px 11px;border:1px solid #c6d7c8;border-radius:7px;background:white;cursor:pointer}.ops-generated-pin small{color:#4e6953}.ops-delete-user{border:1px solid #b42318;border-radius:7px;padding:7px 10px;background:#fff;color:#b42318;font-weight:700;cursor:pointer}.ops-delete-user:disabled{opacity:.5;cursor:wait}.ops-order-list{display:grid;gap:12px;margin-top:18px}.ops-order-card{background:#fff;border:1px solid #e2ded4;border-radius:14px;padding:16px;display:grid;gap:8px}.ops-order-card p{margin:0;font-size:14px;line-height:1.45}.ops-order-top{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}.ops-order-status{font-size:12px;padding:6px 9px;border-radius:20px;background:#f3ead7}.ops-order-total{font-weight:700}.ops-order-card label{display:grid;gap:6px;font-size:13px}.ops-order-card select{padding:10px;border:1px solid #d5d0c4;border-radius:8px;background:white}.ops-order-actions{display:flex;gap:8px;flex-wrap:wrap}.ops-order-actions button{border:0;border-radius:8px;padding:10px 12px;background:#a63c1e;color:white;font-weight:700;cursor:pointer}.ops-order-actions button:disabled{opacity:.5;cursor:wait}.ops-board-toolbar{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap}.ops-board-toolbar .ops-muted{margin:0}.ops-board-count{font-size:12px;font-weight:800;color:#555e56;background:#f0f1ed;border-radius:99px;padding:9px 13px;white-space:nowrap}.ops-kitchen-columns{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;align-items:start}.ops-kitchen-lane{background:#f3f4f2;border:1px solid #e0e3df;border-radius:14px;padding:12px;min-width:0}.ops-lane-header{display:flex;align-items:center;gap:10px;padding:8px 5px 14px;border-bottom:1px solid #dfe2dd;margin-bottom:12px}.ops-lane-header>div{display:grid;gap:3px;flex:1}.ops-lane-header strong{font-size:12px;letter-spacing:.6px}.ops-lane-header small{font-size:11px;color:#717970}.ops-lane-header b{display:grid;place-items:center;background:#fff;border-radius:8px;min-width:28px;height:28px;font-size:13px}.ops-lane-dot{width:10px;height:10px;border-radius:50%;background:#d69b35}.ops-lane-dot.lane-preparing{background:#3c83cc}.ops-kitchen-ticket{padding:0;overflow:hidden;gap:0;border-radius:12px;border:1px solid #d9ddd8;box-shadow:0 2px 5px #1720180a;margin-bottom:12px}.ops-ticket-head{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:14px 14px 12px;border-bottom:1px dashed #d6dad5}.ops-ticket-head>div{display:grid;gap:3px}.ops-ticket-label{font-size:9px;letter-spacing:1.4px;color:#6e776f;font-weight:800}.ops-ticket-code{font-size:22px;letter-spacing:-.5px}.ops-ticket-meta{display:grid;gap:5px;padding:12px 14px 9px}.ops-ticket-meta strong{font-size:14px}.ops-ticket-meta span{font-size:11px;color:#69736b}.ops-ticket-items{padding:0 14px 12px}.ops-ticket-item{display:flex;align-items:flex-start;gap:10px;padding:10px 0;border-bottom:1px solid #eff0ed}.ops-ticket-item:last-child{border-bottom:0}.ops-item-qty{font-size:16px;min-width:25px;color:#252d27}.ops-ticket-item>div{display:grid;gap:4px;min-width:0}.ops-ticket-item>div strong{font-size:14px;line-height:1.35}.ops-ticket-item small{font-size:11px;color:#6f786f;line-height:1.4}.ops-ticket-note{margin:0 14px 12px;background:#fff4d9;border:1px solid #f0dfb4;border-radius:8px;padding:9px;font-size:12px}.ops-ticket-note strong{font-size:9px;letter-spacing:1px;display:block;margin-bottom:4px}.ops-ticket-foot{display:flex;justify-content:space-between;align-items:center;background:#f7f8f6;border-top:1px solid #eceeeb;padding:11px 14px;font-size:11px;color:#69736b}.ops-ticket-foot strong{color:#202720;font-size:14px}.ops-kitchen-action{margin:12px;border:0;border-radius:9px;padding:14px;background:#ed4d2e;color:#fff;font-size:13px;font-weight:850;cursor:pointer}.ops-kitchen-action:disabled{opacity:.55;cursor:wait}.ops-lane-empty{border:1px dashed #cdd2cc;border-radius:10px;padding:22px 12px;text-align:center;color:#858d85;font-size:12px;background:#fafbf9}.ops-order-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.ops-order-grid>.ops-order-card{align-content:start}@media(max-width:760px){.ops-kitchen-columns,.ops-order-grid{grid-template-columns:1fr}.ops-kitchen-lane{padding:9px}}.ops-page{min-height:100vh;background:#f5f2eb;color:#191d1b;font-family:Arial,Helvetica,sans-serif;padding:0 24px 60px}
        .ops-topbar{height:82px;max-width:1120px;margin:auto;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #dedbd2}
        .ops-brand{display:flex;align-items:center;gap:11px;text-decoration:none;color:inherit}.ops-brand-mark{display:grid;place-items:center;width:42px;height:42px;border-radius:13px;background:#ed4d2e;color:#fff;font-size:25px;font-weight:900;font-style:italic}.ops-brand strong{display:block;font-size:19px;letter-spacing:-.7px}.ops-brand small{display:block;font-size:9px;letter-spacing:1.8px;color:#777d76;margin-top:3px}
        .ops-menu-link{display:flex;align-items:center;gap:7px;color:#303831;text-decoration:none;font-weight:700;font-size:14px}
        .ops-shell{max-width:1040px;margin:46px auto 0}.ops-eyebrow{display:flex;align-items:center;gap:9px;font-size:10px;font-weight:800;letter-spacing:1.5px;color:#69716a}.ops-eyebrow span{width:7px;height:7px;background:#ed4d2e;border-radius:50%}
        .ops-heading{display:flex;align-items:center;justify-content:space-between;margin:20px 0 30px}.ops-kicker{font-size:10px;font-weight:800;letter-spacing:1.5px;color:#ed4d2e;margin:0 0 10px}.ops-heading h1{font-size:clamp(34px,5vw,54px);line-height:1.04;letter-spacing:-2px;margin:0;font-weight:850}.ops-heading h1 span{color:#ed4d2e}.ops-lead{font-size:17px;color:#69716a;margin:13px 0 0}.ops-emblem{width:78px;height:78px;display:grid;place-items:center;background:#e9e4d8;border-radius:24px;color:#ed4d2e}
        .ops-login-card{max-width:560px;margin:0 auto;background:#fff;border:1px solid #e7e3da;border-radius:22px;padding:30px;box-shadow:0 14px 40px #272b2110}.ops-card-icon{display:grid;place-items:center;width:44px;height:44px;border-radius:13px;background:#fff0eb;color:#ed4d2e}.ops-login-card h2{font-size:24px;letter-spacing:-.7px;margin:18px 0 8px}.ops-muted{font-size:14px;color:#747a73;line-height:1.6}.ops-form{display:grid;gap:17px;margin-top:24px}.ops-form label{display:grid;gap:8px;font-size:12px;font-weight:800;color:#343b35}.ops-form input{width:100%;box-sizing:border-box;padding:14px 15px;border:1px solid #dedfd9;border-radius:11px;background:#fcfcfa;color:#191d1b;font:inherit;font-size:15px;outline:none}.ops-form input:focus{border-color:#ed4d2e;box-shadow:0 0 0 3px #ed4d2e1a}.ops-submit{display:flex;justify-content:center;align-items:center;gap:10px;border:0;border-radius:11px;padding:15px;background:#ed4d2e;color:white;font-weight:800;font-size:14px;cursor:pointer;margin-top:4px}.ops-submit:disabled,.ops-logout:disabled{opacity:.6;cursor:wait}.ops-error{padding:12px 14px;border-radius:10px;background:#fff0ed;color:#b02e1a;font-size:13px}.ops-footnote{display:flex;align-items:center;gap:7px;color:#83877f;font-size:11px;line-height:1.5;margin:17px 0 0}.ops-dashboard{display:grid;gap:24px}.ops-welcome{position:relative;background:#1f2924;color:white;border-radius:20px;padding:25px 28px}.ops-welcome>div:first-child{font-size:10px;letter-spacing:1.3px;color:#c4e4c8;display:flex;align-items:center;gap:8px}.ops-status-dot,.ops-live span{width:7px;height:7px;border-radius:50%;background:#55bb78;display:inline-block}.ops-welcome h2{font-size:28px;letter-spacing:-.8px;margin:14px 0 4px}.ops-welcome p{font-size:13px;color:#d2d8d1;margin:0}.ops-logout{position:absolute;right:22px;top:22px;display:flex;align-items:center;gap:7px;background:#ffffff14;color:white;border:1px solid #ffffff26;padding:10px 12px;border-radius:9px;cursor:pointer;font-size:12px}.ops-section-head,.ops-detail-heading{display:flex;justify-content:space-between;align-items:end;gap:14px}.ops-section-head h2,.ops-detail-heading h3{font-size:23px;letter-spacing:-.7px;margin:0}.ops-live{display:flex;align-items:center;gap:7px;font-size:11px;color:#68746a;white-space:nowrap}.ops-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.ops-section-card{position:relative;display:flex;flex-direction:column;align-items:flex-start;gap:10px;text-align:left;padding:22px;border:1px solid #e1ddd4;border-radius:16px;background:white;color:#202620;cursor:pointer;min-height:175px;transition:border-color .15s,transform .15s}.ops-section-card:hover{border-color:#ed4d2e;transform:translateY(-2px)}.ops-section-card.selected{border-color:#ed4d2e;box-shadow:0 0 0 1px #ed4d2e inset}.ops-section-icon{display:grid;place-items:center;width:43px;height:43px;border-radius:12px;background:#f7eee7;color:#ed4d2e}.ops-section-title{font-size:16px;font-weight:800}.ops-section-desc{font-size:12px;color:#7b8079;line-height:1.5;max-width:300px;padding-right:12px}.ops-card-arrow{position:absolute;right:18px;top:20px;color:#8b9189}.ops-detail{background:white;border:1px solid #e3dfd6;border-radius:18px;padding:24px}.ops-detail-heading{align-items:center}.ops-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:20px}.ops-metrics>div{background:#f7f5f0;border-radius:12px;padding:16px}.ops-metrics span{display:block;color:#747b73;font-size:12px;margin-bottom:10px}.ops-metrics strong{font-size:24px;letter-spacing:-.5px}.ops-return-link{display:inline-flex;align-items:center;gap:7px;color:#df482b;font-size:13px;font-weight:800;text-decoration:none;margin-top:23px}.ops-login-card>.ops-muted{margin-bottom:0}
.ops-user-admin{margin-top:18px}.ops-user-form{max-width:600px;grid-template-columns:repeat(2,minmax(0,1fr));align-items:end}.ops-user-form label{min-width:0}.ops-user-form input,.ops-user-form select{width:100%;box-sizing:border-box;padding:13px 14px;border:1px solid #dedfd9;border-radius:11px;background:#fcfcfa;color:#191d1b;font:inherit;font-size:14px}.ops-user-form .ops-submit{grid-column:1/-1}.ops-success{padding:12px 14px;border-radius:10px;background:#eaf7ed;color:#246b38;font-size:13px;line-height:1.5}.ops-user-list-title{font-size:16px;margin:28px 0 12px}.ops-user-list{display:grid;gap:8px}.ops-user-row{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:13px 15px;border:1px solid #e8e5dd;border-radius:11px}.ops-user-row strong,.ops-user-row span{display:block}.ops-user-row strong{font-size:13px}.ops-user-row div span{font-size:12px;color:#7b8079;margin-top:4px}.ops-user-active,.ops-user-inactive{font-size:11px;font-weight:700}.ops-user-active{color:#27834a}.ops-user-inactive{color:#a64c3e}
        @media(max-width:650px){.ops-page{padding:0 16px 36px}.ops-topbar{height:70px}.ops-shell{margin-top:32px}.ops-heading{margin:17px 0 24px}.ops-emblem{width:55px;height:55px;border-radius:17px}.ops-emblem svg{width:25px}.ops-login-card{padding:23px 20px}.ops-grid{grid-template-columns:1fr}.ops-section-card{min-height:140px}.ops-welcome{padding:23px 20px 75px}.ops-logout{top:auto;left:20px;right:auto;bottom:18px}.ops-section-head{align-items:flex-start;flex-direction:column}.ops-metrics{grid-template-columns:1fr}.ops-user-form{grid-template-columns:1fr}.ops-user-form .ops-submit{grid-column:auto}.ops-detail{padding:19px}}
      `}</style>
    </main>
  );
}
